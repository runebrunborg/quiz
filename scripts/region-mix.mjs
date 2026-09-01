#!/usr/bin/env node
/**
 * Måler hva regionvalget faktisk gjør: hvor mange spørsmål en norsk og en svensk
 * runde deler, og herkomstfordelingen du ender opp med. Speiler kvotene i
 * src/lib/content.ts – endrer du dem der, endre dem her.
 */
import { readdirSync, readFileSync } from 'node:fs'
const dir = 'content/questions'
const all = readdirSync(dir).filter(f => f.endsWith('.json')).flatMap(f => JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')))

const TODAY = new Date().toISOString().slice(0, 10)
const TOPICAL_PER_ROUND = 2
const DATED_PER_ROUND = 1
const retired = q => q.topical && TODAY > q.topical.until && !q.topical.evergreen
const fresh = q => q.topical && TODAY <= q.topical.until
const datedToday = q => (q.onThisDay ?? []).some(v => v.day === TODAY.slice(5))

const QUOTAS = { no: { no: 5, se: 2, int: 3 }, se: { no: 2, se: 5, int: 3 }, int: { no: 2, se: 2, int: 6 } }
const FALLBACK = { no: ['int', 'se'], se: ['int', 'no'], int: ['no', 'se'] }
function makeRng(seed) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) }
  return () => { h += 0x6d2b79f5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
function shuffle(items, rng) { const o = items.slice(); for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [o[i], o[j]] = [o[j], o[i]] } return o }
// Speiler composeRound() i src/lib/content.ts: reserverte plasser til dagens dato
// og til de dagsaktuelle, resten etter kvote.
function pick(raw, region, seed, count = 10) {
  const pool = raw.filter(q => !retired(q))
  const rng = makeRng(`${seed}|${region}`)
  if (pool.length <= count) return shuffle(pool, rng)
  const dated = shuffle(pool.filter(datedToday), rng).slice(0, DATED_PER_ROUND)
  const datedIds = new Set(dated.map(q => q.id))
  const topical = shuffle(pool.filter(q => fresh(q) && !datedIds.has(q.id)), rng).slice(0, TOPICAL_PER_ROUND)
  const reserved = [...dated, ...topical]
  const reservedIds = new Set(reserved.map(q => q.id))
  const rest = pool.filter(q => !reservedIds.has(q.id) && !fresh(q))
  const remaining = Math.max(0, count - reserved.length)
  const g = { no: shuffle(rest.filter(q => q.origin === 'no'), rng), se: shuffle(rest.filter(q => q.origin === 'se'), rng), int: shuffle(rest.filter(q => q.origin === 'int'), rng) }
  const quota = { ...QUOTAS[region] }
  for (const q of reserved) quota[q.origin] = Math.max(0, quota[q.origin] - 1)
  const chosen = []; const wanted = [region, ...FALLBACK[region]]
  for (const o of wanted) chosen.push(...g[o].splice(0, Math.min(quota[o], remaining - chosen.length)))
  for (const o of wanted) { if (chosen.length >= remaining) break; chosen.push(...g[o].splice(0, remaining - chosen.length)) }
  return [...shuffle([...chosen, ...dated], rng), ...topical]
}

const cats = [...new Set(all.map(q => q.category))]
const levels = ['lett', 'medium', 'vanskelig']
let ov = 0, n = 0, short = 0, skipped = 0
const share = { no: { no: 0, se: 0, int: 0 }, se: { no: 0, se: 0, int: 0 }, int: { no: 0, se: 0, int: 0 } }
for (const cat of cats) for (const lvl of levels) {
  const pool = all.filter(q => q.category === cat && q.difficulty === lvl)
  // Temaer som ennå ikke har en full pulje måles ikke – de er hull, ikke feil.
  if (pool.filter(q => !q.topical && !retired(q)).length < 10) { skipped++; continue }
  for (let t = 0; t < 20; t++) {
    const seed = `${cat}-${lvl}-${t}`; const sets = {}
    for (const r of ['no', 'se', 'int']) {
      const p = pick(pool, r, seed)
      if (p.length !== 10) short++
      if (new Set(p.map(q => q.id)).size !== 10) short++
      sets[r] = new Set(p.map(q => q.id))
      for (const q of p) share[r][q.origin]++
    }
    ov += [...sets.no].filter(id => sets.se.has(id)).length; n++
  }
}
console.log(`Nivåer uten full pulje, hoppet over: ${skipped}`)
console.log(`Runder som ikke ga ti unike spørsmål: ${short}`)
console.log(`Overlapp mellom norsk og svensk runde: ${(ov / n).toFixed(1)} av 10`)
for (const r of ['no', 'se', 'int']) {
  const t = share[r]; const s = t.no + t.se + t.int
  console.log(`  «${r}»: ${(100*t.no/s).toFixed(0)} % norske · ${(100*t.se/s).toFixed(0)} % svenske · ${(100*t.int/s).toFixed(0)} % internasjonale`)
}
