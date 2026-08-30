#!/usr/bin/env node
/** Viser hvor mange spørsmål som finnes per tema og nivå, og hva som gjenstår. */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const catSrc = readFileSync(join(root, 'content', 'categories.ts'), 'utf8')
const categories = [...catSrc.matchAll(/^\s*id: '([^']+)',$/gm)].map((m) => m[1])

const counts = new Map()
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
  }
}

const levels = ['lett', 'medium', 'vanskelig']
const TARGET = 20
let total = 0
console.log('tema'.padEnd(14) + levels.map((l) => l.padStart(11)).join('') + '      sum')
for (const cat of categories) {
  const row = levels.map((l) => counts.get(`${cat}|${l}`) ?? 0)
  total += row.reduce((a, b) => a + b, 0)
  console.log(
    cat.padEnd(14) +
      row.map((n) => `${n === TARGET ? '✔' : n > 0 ? '·' : ' '} ${String(n).padStart(2)}/${TARGET}`.padStart(11)).join('') +
      String(row.reduce((a, b) => a + b, 0)).padStart(9),
  )
}
console.log(`\nTotalt ${total} av ${categories.length * levels.length * TARGET} spørsmål.`)
