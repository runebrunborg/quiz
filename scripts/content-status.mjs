#!/usr/bin/env node
/** Viser hvor mange spørsmål som finnes per tema og nivå, og hva som gjenstår. */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const catSrc = readFileSync(join(root, 'content', 'categories.ts'), 'utf8')
const categories = [...catSrc.matchAll(/^\s*id: '([^']+)',$/gm)].map((m) => m[1])

const counts = new Map()
/** Spørsmål med «på denne dag»-varianter, og antall varianter, per tema. */
const dated = new Map()
const datedVariants = new Map()
let files = []
try {
  files = readdirSync(join(root, 'content', 'questions')).filter((f) => f.endsWith('.json'))
} catch {
  /* tom bank */
}
for (const file of files) {
  for (const q of JSON.parse(readFileSync(join(root, 'content', 'questions', file), 'utf8'))) {
    const key = `${q.category}|${q.difficulty}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
    if (q.onThisDay?.length) {
      dated.set(q.category, (dated.get(q.category) ?? 0) + 1)
      datedVariants.set(q.category, (datedVariants.get(q.category) ?? 0) + q.onThisDay.length)
    }
  }
}

const levels = ['lett', 'medium', 'vanskelig']
const TARGET = 20
let total = 0
let datedTotal = 0
let datedVariantTotal = 0
console.log(
  'tema'.padEnd(14) + levels.map((l) => l.padStart(11)).join('') + '      sum' + '   denne dag',
)
for (const cat of categories) {
  const row = levels.map((l) => counts.get(`${cat}|${l}`) ?? 0)
  total += row.reduce((a, b) => a + b, 0)
  const d = dated.get(cat) ?? 0
  const dv = datedVariants.get(cat) ?? 0
  datedTotal += d
  datedVariantTotal += dv
  console.log(
    cat.padEnd(14) +
      row.map((n) => `${n === TARGET ? '✔' : n > 0 ? '·' : ' '} ${String(n).padStart(2)}/${TARGET}`.padStart(11)).join('') +
      String(row.reduce((a, b) => a + b, 0)).padStart(9) +
      `${d > 0 ? '·' : ' '} ${String(d).padStart(2)}`.padStart(12) +
      (dv > d ? ` (${dv} varianter)` : ''),
  )
}
const datedCategories = categories.filter((c) => (dated.get(c) ?? 0) > 0).length
console.log(`\nTotalt ${total} av ${categories.length * levels.length * TARGET} spørsmål.`)
console.log(
  `«På denne dag»: ${datedTotal} spørsmål med til sammen ${datedVariantTotal} datovarianter, i ${datedCategories} av ${categories.length} temaer.`,
)
