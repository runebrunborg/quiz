#!/usr/bin/env node
/**
 * Henter tommel opp/ned ut av D1 og skriver en rapport man kan rette
 * spørsmål etter.
 *
 *   npm run content:feedback              (lokal database)
 *   npm run content:feedback -- --remote  (produksjon)
 *   npm run content:feedback -- --min 2   (bare spørsmål med minst to stemmer)
 *
 * Skriver `content/feedback/feedback-<dato>.json` og `.md`. Spørsmålsteksten
 * hentes fra `content/questions/*.json` ved kjøring, ikke fra basen, så
 * rapporten alltid viser gjeldende ordlyd.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const remote = args.includes('--remote')
const minVotes = Number.parseInt(args[args.indexOf('--min') + 1] ?? '1', 10) || 1

const REASON_LABELS = {
  feil: 'Feil eller upresist',
  uklart: 'Uklart formulert',
  lekker: 'Svaret røpes',
  nivaa: 'Feil vanskelighetsgrad',
  hint: 'Dårlig hint',
  kjedelig: 'Kjedelig',
  annet: 'Annet',
}

/* ------------------------------------------------------------- banken */

const questions = new Map()
let files = []
try {
  files = readdirSync(join(root, 'content', 'questions')).filter((f) => f.endsWith('.json'))
} catch {
  /* tom bank */
}
for (const file of files) {
  for (const q of JSON.parse(readFileSync(join(root, 'content', 'questions', file), 'utf8'))) {
    questions.set(q.id, { ...q, file: `content/questions/${file}` })
  }
}

const nb = (value) => (typeof value === 'string' ? value : (value?.nb ?? ''))

/* ---------------------------------------------------------------- D1 */

const SQL = `
  SELECT question_id, vote, reason, comment, category, difficulty, lang, updated_at
    FROM question_feedback
   ORDER BY question_id, updated_at DESC
`.replace(/\s+/g, ' ').trim()

let rows = []
try {
  const out = execFileSync(
    'npx',
    ['wrangler', 'd1', 'execute', 'theme-quiz', remote ? '--remote' : '--local', '--json', '--command', SQL],
    { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] },
  )
  // Wrangler skriver av og til en banner-linje før JSON-en.
  const start = out.indexOf('[')
  const parsed = JSON.parse(start >= 0 ? out.slice(start) : out)
  rows = parsed.flatMap((r) => r.results ?? [])
} catch (e) {
  console.error(`\nFikk ikke lest fra D1${remote ? ' (--remote)' : ''}. Er wrangler innlogget og migrasjonene kjørt?`)
  console.error(e.message)
  process.exit(1)
}

/* ------------------------------------------------------- sammenstilling */

const byQuestion = new Map()
for (const r of rows) {
  const entry = byQuestion.get(r.question_id) ?? {
    questionId: r.question_id,
    category: r.category || '',
    difficulty: r.difficulty || '',
    up: 0,
    down: 0,
    reasons: {},
    comments: [],
    lastAt: 0,
  }
  if (r.vote === 1) entry.up++
  else entry.down++
  if (r.reason) entry.reasons[r.reason] = (entry.reasons[r.reason] ?? 0) + 1
  if (r.comment) entry.comments.push({ text: r.comment, vote: r.vote === 1 ? 'opp' : 'ned', at: r.updated_at })
  entry.lastAt = Math.max(entry.lastAt, r.updated_at)
  byQuestion.set(r.question_id, entry)
}

const report = [...byQuestion.values()]
  .map((e) => {
    const q = questions.get(e.questionId)
    return {
      ...e,
      score: e.up - e.down,
      votes: e.up + e.down,
      inBank: Boolean(q),
      prompt: q ? nb(q.prompt) : null,
      answer: q ? nb(q.answer) : null,
      hint: q ? nb(q.hint) : null,
      source: q?.source ?? null,
      file: q?.file ?? null,
    }
  })
  .filter((e) => e.votes >= minVotes)
  .sort((a, b) => a.score - b.score || b.down - a.down || a.questionId.localeCompare(b.questionId))

const totals = {
  votes: rows.length,
  up: rows.filter((r) => r.vote === 1).length,
  down: rows.filter((r) => r.vote === -1).length,
  questions: byQuestion.size,
  generatedAt: new Date().toISOString(),
  source: remote ? 'remote' : 'local',
}

/* ------------------------------------------------------------- utskrift */

if (rows.length === 0) {
  console.log(`Ingen tilbakemeldinger i basen${remote ? ' (--remote)' : ' (--local)'} ennå. Skriver ingen rapport.`)
  process.exit(0)
}

const day = new Date().toISOString().slice(0, 10)
const dir = join(root, 'content', 'feedback')
mkdirSync(dir, { recursive: true })

const jsonPath = join(dir, `feedback-${day}.json`)
writeFileSync(jsonPath, `${JSON.stringify({ totals, questions: report }, null, 2)}\n`)

const lines = [
  `# Tilbakemeldinger på spørsmål — ${day}`,
  '',
  `${totals.votes} stemmer på ${totals.questions} spørsmål (${totals.up} 👍 / ${totals.down} 👎). Kilde: ${totals.source}.`,
  minVotes > 1 ? `Bare spørsmål med minst ${minVotes} stemmer er tatt med.` : '',
  '',
  'Sortert med de mest kritiserte først. Rett spørsmålet i JSON-fila, behold id-en –',
  'statistikken og stemmene henger på den.',
  '',
]

const needsWork = report.filter((e) => e.score < 0)
const liked = report.filter((e) => e.score > 0)

function block(e) {
  const out = [
    `### ${e.questionId}  ·  👍 ${e.up} / 👎 ${e.down}`,
    '',
    e.inBank ? `**${e.prompt}**` : '_Spørsmålet finnes ikke i banken lenger._',
  ]
  if (e.inBank) {
    out.push('', `Fasit: ${e.answer}`, `Hint: ${e.hint}`, `Kilde: ${e.source}`, `Fil: ${e.file}`)
  }
  const reasons = Object.entries(e.reasons).sort((a, b) => b[1] - a[1])
  if (reasons.length) {
    out.push('', `Grunner: ${reasons.map(([r, n]) => `${REASON_LABELS[r] ?? r}${n > 1 ? ` ×${n}` : ''}`).join(', ')}`)
  }
  for (const c of e.comments) out.push('', `> ${c.vote === 'ned' ? '👎' : '👍'} ${c.text.replace(/\n+/g, ' ')}`)
  out.push('')
  return out
}

if (needsWork.length) {
  lines.push('## Trenger arbeid', '')
  for (const e of needsWork) lines.push(...block(e))
}
if (liked.length) {
  lines.push('## Best likt', '')
  for (const e of liked) lines.push(`- **${e.questionId}** 👍 ${e.up} / 👎 ${e.down} — ${e.prompt ?? '(borte fra banken)'}`)
  lines.push('')
}

const mdPath = join(dir, `feedback-${day}.md`)
writeFileSync(mdPath, `${lines.join('\n')}\n`)

console.log(`${totals.votes} stemmer på ${totals.questions} spørsmål (${totals.up} 👍 / ${totals.down} 👎).`)
console.log(`${needsWork.length} spørsmål har negativ score.`)
console.log(`Skrev ${jsonPath.replace(root + '/', '')} og ${mdPath.replace(root + '/', '')}`)
