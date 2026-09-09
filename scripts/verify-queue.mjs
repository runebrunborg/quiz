#!/usr/bin/env node
/**
 * Kontrollkøen: hvor mye av banken som er uavhengig kontrollert, og hva som
 * står for tur.
 *
 * Skriveren kildebelegger sitt eget arbeid. Denne køa er den andre halvdelen:
 * en annen henter kilden på nytt og ser at den faktisk dekker påstanden.
 * Kontrakten står i `content/VERIFY.md`.
 *
 *   node scripts/verify-queue.mjs            status + neste pulje
 *   node scripts/verify-queue.mjs --json     samme, maskinlesbart
 *   node scripts/verify-queue.mjs --batch 20 større pulje
 *   node scripts/verify-queue.mjs --links    URL-ene som bør hentes på nytt
 *
 * Skriptet henter ingenting selv – hverken skallet på Mac-en eller
 * Cowork-skyen har utgående nett til snl.no. Det er `WebFetch` i kontrolløkta
 * som leser artiklene; her ligger bare listene.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const questionsDir = join(root, 'content', 'questions')
const typesSrc = readFileSync(join(root, 'shared', 'types.ts'), 'utf8')
const STALE_MONTHS = Number(typesSrc.match(/export const VERIFY_STALE_MONTHS = (\d+)/)?.[1] ?? 12)

const args = process.argv.slice(2)
const asJson = args.includes('--json')
const linksOnly = args.includes('--links')
const BATCH = Number(args[args.indexOf('--batch') + 1]) || 10
const TODAY = new Date().toISOString().slice(0, 10)

function monthsAgo(iso) {
  const then = new Date(`${iso}T00:00:00Z`)
  const now = new Date(`${TODAY}T00:00:00Z`)
  return (now.getUTCFullYear() - then.getUTCFullYear()) * 12 + (now.getUTCMonth() - then.getUTCMonth())
}

const nb = (v) => (typeof v === 'string' ? v : (v?.nb ?? ''))

/* ------------------------------------------------------------------ banken */

const questions = []
for (const file of readdirSync(questionsDir).filter((f) => f.endsWith('.json')).sort()) {
  for (const q of JSON.parse(readFileSync(join(questionsDir, file), 'utf8'))) questions.push({ ...q, file })
}

const isVerified = (q) => Boolean(q.verifiedAt && q.verifiedBy && q.verifiedUrl)
const isStale = (q) => isVerified(q) && monthsAgo(q.verifiedAt) > STALE_MONTHS
const isFlagged = (q) => Boolean(q.flagged)
/** Dagsaktuelt som fortsatt trekkes. */
const isFreshTopical = (q) => Boolean(q.topical) && TODAY <= q.topical.until

/**
 * Kilder som lar seg hente herfra. En kilde utenfor lista er ikke feil, men den
 * er vanskeligere å kontrollere – og det er nettopp de vanskelige som har størst
 * sjanse for å skjule et faktum ingen har sett etter.
 */
const CHECKABLE = /store norske|store medisinske|\bsnl\b|wikipedia/i

/* ------------------------------------------- tommel ned, om eksporten finnes */

const downVoted = new Map()
try {
  const dir = join(root, 'content', 'feedback')
  const newest = readdirSync(dir).filter((f) => /^feedback-.*\.json$/.test(f)).sort().pop()
  if (newest) {
    for (const e of JSON.parse(readFileSync(join(dir, newest), 'utf8')).questions ?? []) {
      if ((e.down ?? 0) > 0) downVoted.set(e.questionId, e.down)
    }
  }
} catch {
  /* eksporten er valgfri og ligger i .gitignore */
}

/* ------------------------------------------------------------------- køen */

/** Lav rang = kontrolleres først. Rekkefølgen er risiko, ikke alfabet. */
const TIERS = [
  { rank: 0, key: 'nedstemt', why: 'spillere har gitt tommel ned', hit: (q) => downVoted.has(q.id) },
  { rank: 1, key: 'dagsaktuelt', why: 'fersk nyhet, kilden er en avis og forsvinner fort', hit: isFreshTopical },
  { rank: 2, key: 'kilde-utenfor-rekkevidde', why: 'kilden er ikke SNL eller Wikipedia og lar seg vanskelig hente', hit: (q) => !CHECKABLE.test(q.source ?? '') },
  { rank: 3, key: 'utdatert-kontroll', why: `kontrollen er eldre enn ${STALE_MONTHS} måneder`, hit: isStale },
  { rank: 4, key: 'ikke-kontrollert', why: 'ingen andre enn skriveren har sett på det', hit: () => true },
]

function tierFor(q) {
  return TIERS.find((t) => t.hit(q))
}

const pending = questions.filter((q) => !isFlagged(q) && (!isVerified(q) || isStale(q)))
const queue = pending
  .map((q) => ({ q, tier: tierFor(q) }))
  .sort(
    (a, b) =>
      a.tier.rank - b.tier.rank ||
      // Innenfor samme risikoklasse: hold pulja i samme tema, så kontrolløren
      // kan gjenbruke oppslag og se svarkollisjoner i samme slengen.
      a.q.category.localeCompare(b.q.category) ||
      a.q.id.localeCompare(b.q.id),
  )

const batch = queue.slice(0, BATCH)

/* ---------------------------------------------------------------- utskrift */

const verified = questions.filter(isVerified).length
const flagged = questions.filter(isFlagged)
const stale = questions.filter(isStale).length
/**
 * Modus. Puljen er full → kontroller. Ellers er banken tatt igjen, og runden
 * kan brukes til å skrive nytt. Dette er hele vekselmekanismen: skriveren kan
 * aldri løpe fra kontrollen, for hver tiende nye spørsmål lager sin egen kø.
 */
const mode = pending.length >= BATCH ? 'verifiser' : 'skriv'

if (linksOnly) {
  const urls = [...new Set(questions.filter(isVerified).map((q) => q.verifiedUrl))].sort()
  if (asJson) console.log(JSON.stringify({ urls }, null, 2))
  else {
    console.log(`${urls.length} unike URL-er er registrert som lest under kontroll.`)
    console.log('Hent dem med WebFetch – 404 eller flyttet artikkel betyr at spørsmålene som peker hit skal i køen igjen.\n')
    for (const u of urls) console.log(u)
  }
  process.exit(0)
}

if (asJson) {
  console.log(
    JSON.stringify(
      {
        mode,
        total: questions.length,
        verified,
        stale,
        flagged: flagged.length,
        pending: pending.length,
        batch: batch.map(({ q, tier }) => ({
          id: q.id,
          file: q.file,
          category: q.category,
          difficulty: q.difficulty,
          tier: tier.key,
          source: q.source,
          answer: nb(q.answer),
        })),
      },
      null,
      2,
    ),
  )
  process.exit(0)
}

const pct = questions.length ? Math.round((verified / questions.length) * 100) : 0
console.log(`Kontrollstatus  ${TODAY}`)
console.log(`  ${verified} av ${questions.length} spørsmål er uavhengig kontrollert (${pct} %)`)
console.log(`  ${pending.length} står i kø${stale > 0 ? ` (av dem ${stale} med utdatert kontroll)` : ''}`)
console.log(`  ${flagged.length} er flagget og tatt ut av trekningen`)
console.log(`\nMODUS: ${mode.toUpperCase()}`)
console.log(
  mode === 'verifiser'
    ? `  Køen er på ${pending.length}. Kontroller de ti under før det skrives noe nytt.`
    : `  Køen er under ${BATCH}. Skriv ti nye spørsmål denne runden.`,
)

if (flagged.length > 0) {
  console.log('\nFlagget – trekkes ikke, venter på retting eller stryking:')
  for (const q of flagged) console.log(`  ${q.id.padEnd(14)} ${q.flagged.reason}`)
}

if (mode === 'verifiser') {
  console.log(`\nNeste pulje (${batch.length}):`)
  let lastTier = null
  for (const { q, tier } of batch) {
    if (tier.key !== lastTier) {
      console.log(`\n  ── ${tier.key} — ${tier.why}`)
      lastTier = tier.key
    }
    console.log(`  ${q.id.padEnd(14)} ${q.file.padEnd(22)} ${nb(q.answer).slice(0, 28).padEnd(30)} ${q.source}`)
  }
  console.log(`\nFramgangsmåten står i content/VERIFY.md.`)
}
