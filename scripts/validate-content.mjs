#!/usr/bin/env node
/**
 * Validerer spørsmålsbanken før bygg.
 *
 * Sjekker struktur, ider, emne-tags, språkfelter og duplikater. Kjøres av
 * `npm run build`, så et ødelagt spørsmål stopper bygget i stedet for å dukke
 * opp som en tom boks i appen.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const questionsDir = join(root, 'content', 'questions')

const typesSrc = readFileSync(join(root, 'shared', 'types.ts'), 'utf8')
const TOPICS = new Set(
  [...typesSrc.matchAll(/export const TOPICS = \[([\s\S]*?)\] as const/g)]
    .flatMap((m) => [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1])),
)
const CATEGORIES = new Set(
  [...readFileSync(join(root, 'content', 'categories.ts'), 'utf8').matchAll(/^\s*id: '([^']+)',$/gm)].map((m) => m[1]),
)

const DIFFICULTIES = new Set(['lett', 'medium', 'vanskelig'])
const REGIONS = new Set(['no', 'se', 'int'])
const DIFF_INITIAL = { lett: 'l', medium: 'm', vanskelig: 'v' }

const errors = []
const warnings = []
const seenIds = new Map()
const seenAnswers = new Map()
let count = 0

function isL10n(value) {
  if (typeof value === 'string') return value.trim().length > 0
  return (
    value &&
    typeof value === 'object' &&
    typeof value.nb === 'string' &&
    typeof value.sv === 'string' &&
    value.nb.trim().length > 0 &&
    value.sv.trim().length > 0
  )
}

function text(value, lang) {
  return typeof value === 'string' ? value : value[lang]
}

let files = []
try {
  files = readdirSync(questionsDir).filter((f) => f.endsWith('.json')).sort()
} catch {
  console.log('ℹ  content/questions finnes ikke ennå – ingenting å validere.')
  process.exit(0)
}

for (const file of files) {
  const path = join(questionsDir, file)
  let data
  try {
    data = JSON.parse(readFileSync(path, 'utf8'))
  } catch (e) {
    errors.push(`${file}: ugyldig JSON – ${e.message}`)
    continue
  }
  if (!Array.isArray(data)) {
    errors.push(`${file}: filen må inneholde en liste med spørsmål`)
    continue
  }

  for (const [i, q] of data.entries()) {
    const where = `${file}[${i}]${q?.id ? ` (${q.id})` : ''}`
    count++

    if (typeof q?.id !== 'string' || !q.id) errors.push(`${where}: mangler id`)
    else if (seenIds.has(q.id)) errors.push(`${where}: id-en finnes allerede i ${seenIds.get(q.id)}`)
    else seenIds.set(q.id, file)

    if (!CATEGORIES.has(q?.category)) errors.push(`${where}: ukjent kategori "${q?.category}"`)
    if (!DIFFICULTIES.has(q?.difficulty)) errors.push(`${where}: ugyldig vanskelighetsgrad "${q?.difficulty}"`)
    if (!REGIONS.has(q?.origin)) errors.push(`${where}: ugyldig origin "${q?.origin}"`)

    if (
      typeof q?.id === 'string' &&
      CATEGORIES.has(q?.category) &&
      DIFFICULTIES.has(q?.difficulty) &&
      !q.id.startsWith(`${q.category}-${DIFF_INITIAL[q.difficulty]}-`)
    ) {
      errors.push(`${where}: id-en bør begynne med "${q.category}-${DIFF_INITIAL[q.difficulty]}-"`)
    }

    if (!Array.isArray(q?.topics) || q.topics.length === 0) errors.push(`${where}: mangler emne-tags`)
    else {
      for (const topic of q.topics) if (!TOPICS.has(topic)) errors.push(`${where}: ukjent emne-tag "${topic}"`)
      if (q.topics.length > 3) warnings.push(`${where}: ${q.topics.length} emne-tags – tre er nok`)
    }

    for (const field of ['prompt', 'answer', 'hint', 'funFact']) {
      if (!isL10n(q?.[field])) errors.push(`${where}: feltet "${field}" mangler eller er tomt på ett av språkene`)
    }

    if (q?.answerKind !== 'person' && q?.answerKind !== 'annet') {
      errors.push(`${where}: answerKind må være "person" eller "annet"`)
    }
    if (q?.answerKind === 'person') {
      if (!q.person || !isL10n(q.person.given) || !isL10n(q.person.family)) {
        errors.push(`${where}: personsvar må ha person.given og person.family (for bokstavhintet)`)
      }
    } else if (q?.person) {
      warnings.push(`${where}: person er satt, men answerKind er "annet"`)
    }

    if (typeof q?.source !== 'string' || q.source.trim().length < 4) {
      errors.push(`${where}: mangler kilde`)
    }

    if (isL10n(q?.prompt)) {
      for (const lang of ['nb', 'sv']) {
        const words = text(q.prompt, lang).split(/\s+/).length
        if (words < 12) warnings.push(`${where}: ${lang}-spørsmålet er kort (${words} ord) – innledningen bør gi kontekst`)
        if (words > 70) warnings.push(`${where}: ${lang}-spørsmålet er langt (${words} ord)`)
      }
    }

    if (isL10n(q?.answer) && typeof q?.category === 'string') {
      const key = `${q.category}|${text(q.answer, 'nb').toLowerCase()}`
      if (seenAnswers.has(key)) {
        errors.push(`${where}: samme svar som ${seenAnswers.get(key)} i samme tema`)
      } else {
        seenAnswers.set(key, q.id)
      }
      // Svaret skal ikke stå i klartekst i spørsmålet.
      if (isL10n(q?.prompt)) {
        const answerNb = text(q.answer, 'nb').toLowerCase()
        if (answerNb.length > 3 && text(q.prompt, 'nb').toLowerCase().includes(answerNb)) {
          errors.push(`${where}: svaret står i spørsmålsteksten`)
        }
      }
    }
  }
}

for (const w of warnings) console.warn(`⚠  ${w}`)
for (const e of errors) console.error(`✖  ${e}`)

console.log(`\n${count} spørsmål i ${files.length} filer · ${errors.length} feil · ${warnings.length} advarsler`)
process.exit(errors.length > 0 ? 1 : 0)
