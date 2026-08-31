import type { Category, Difficulty, Question, Region } from '../../shared/types'
import { CATEGORIES, CATEGORY_BY_ID } from '../../content/categories'

/**
 * Spørsmålsbanken lastes fra `content/questions/*.json` ved bygg.
 * Én fil per kategori. Filene valideres av `scripts/validate-content.mjs`
 * før bygg, så her stoler vi på formen.
 */
const modules = import.meta.glob<{ default: Question[] }>('../../content/questions/*.json', {
  eager: true,
})

export const ALL_QUESTIONS: Question[] = Object.values(modules).flatMap((m) => m.default)

const byKey = new Map<string, Question[]>()
for (const q of ALL_QUESTIONS) {
  const key = `${q.category}|${q.difficulty}`
  const list = byKey.get(key)
  if (list) list.push(q)
  else byKey.set(key, [q])
}

export const QUESTION_BY_ID = new Map(ALL_QUESTIONS.map((q) => [q.id, q]))

export function poolFor(category: string, difficulty: Difficulty): Question[] {
  return byKey.get(`${category}|${difficulty}`) ?? []
}

export interface Coverage {
  category: string
  perDifficulty: Record<Difficulty, number>
  total: number
}

export const QUESTIONS_PER_ROUND = 10

/**
 * Måltall for hvor stor puljen bør være per tema og nivå. Er puljen større enn
 * én runde, får regionvektingen noe å velge mellom – og da gir norsk, svensk og
 * internasjonalt utgangspunkt faktisk ulike quizer.
 */
export const POOL_TARGET = 20

export function coverage(): Coverage[] {
  return CATEGORIES.map((c) => {
    const perDifficulty = {
      lett: poolFor(c.id, 'lett').length,
      medium: poolFor(c.id, 'medium').length,
      vanskelig: poolFor(c.id, 'vanskelig').length,
    }
    return {
      category: c.id,
      perDifficulty,
      total: perDifficulty.lett + perDifficulty.medium + perDifficulty.vanskelig,
    }
  })
}

export function categoriesWithContent(): Category[] {
  return CATEGORIES.filter((c) => poolFor(c.id, 'lett').length + poolFor(c.id, 'medium').length + poolFor(c.id, 'vanskelig').length > 0)
}

export { CATEGORIES, CATEGORY_BY_ID }

/**
 * Sammensetningen av en runde, gitt valgt utgangspunkt.
 *
 * Dette er kvoter, ikke et filter: velger du norsk får du flest norske
 * referanser, men fortsatt svenske og internasjonale spørsmål – slik det står
 * beskrevet i appen. Rene vekter viste seg for svake i praksis; med en pulje på
 * tjue og ti spørsmål i en runde endte norsk og svensk opp med å dele åtte av
 * ti. Eksplisitte kvoter gir den forskjellen mellom utgangspunktene som er hele
 * poenget med regionvalget.
 *
 * Mangler en gruppe spørsmål, fylles plassene fra de andre gruppene, så en
 * halvfylt pulje aldri gir en kortere runde.
 */
const QUOTAS: Record<Region, Record<Region, number>> = {
  no: { no: 5, se: 2, int: 3 },
  se: { no: 2, se: 5, int: 3 },
  int: { no: 2, se: 2, int: 6 },
}

/** Rekkefølgen plassene fylles i når en gruppe er for liten. */
const FALLBACK_ORDER: Record<Region, Region[]> = {
  no: ['int', 'se'],
  se: ['int', 'no'],
  int: ['no', 'se'],
}

/** Deterministisk pseudo-tilfeldig tallgenerator, så en økt kan gjenskapes fra sin id. */
export function makeRng(seed: string): () => number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h += 0x6d2b79f5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function pickQuestions(
  category: string,
  difficulty: Difficulty,
  region: Region,
  seed: string,
  count = QUESTIONS_PER_ROUND,
): Question[] {
  const pool = poolFor(category, difficulty)
  // Utgangspunktet er en del av frøet. Uten det stokkes gruppene likt for alle
  // tre valgene, og den norske runden blir bare den svenske med to spørsmål
  // byttet ut. Med det i frøet trekkes hver region uavhengig.
  const rng = makeRng(`${seed}|${region}`)
  if (pool.length <= count) return shuffle(pool, rng)

  // Stokk hver herkomstgruppe for seg, og plukk fra toppen etter kvote.
  const groups: Record<Region, Question[]> = {
    no: shuffle(pool.filter((q) => q.origin === 'no'), rng),
    se: shuffle(pool.filter((q) => q.origin === 'se'), rng),
    int: shuffle(pool.filter((q) => q.origin === 'int'), rng),
  }

  const quota = QUOTAS[region]
  const chosen: Question[] = []
  const wanted = ([region, ...FALLBACK_ORDER[region]] as Region[])

  for (const origin of wanted) {
    chosen.push(...groups[origin].splice(0, Math.min(quota[origin], count - chosen.length)))
  }

  // Fyll opp om en gruppe var for liten. Egen herkomst først, så de andre.
  for (const origin of wanted) {
    if (chosen.length >= count) break
    chosen.push(...groups[origin].splice(0, count - chosen.length))
  }

  return shuffle(chosen, rng)
}

export function shuffle<T>(items: T[], rng: () => number): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
