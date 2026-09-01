import type { L10n } from '../../shared/types'
import { makeRng } from './content'

/**
 * Domsetningene – den ene linja under poengsummen på resultatskjermen.
 * Én fil per tema i `content/verdicts/`, med to varianter for hver mulige
 * poengsum. Formatet er beskrevet i `content/VERDICTS-SPEC.md`, og
 * `scripts/validate-content.mjs` stopper bygget hvis et tema mangler.
 */
interface VerdictFile {
  category: string
  lines: Record<string, L10n[]>
}

const modules = import.meta.glob<{ default: VerdictFile }>('../../content/verdicts/*.json', {
  eager: true,
})

export const MAX_SCORE = 10

const byCategory = new Map<string, L10n[][]>()
for (const mod of Object.values(modules)) {
  const file = mod.default
  const perScore: L10n[][] = []
  for (let score = 0; score <= MAX_SCORE; score++) {
    perScore[score] = file.lines?.[String(score)] ?? []
  }
  byCategory.set(file.category, perScore)
}

/** Temaer som har domsetninger. Brukes av testene. */
export const VERDICT_CATEGORIES = [...byCategory.keys()].sort()

/**
 * Dommen over runden. `seed` er rundens id, så den ene av de to variantene
 * ligger fast så lenge resultatet står på skjermen – men neste runde med
 * samme poengsum kan få den andre.
 */
export function verdictFor(category: string, correct: number, seed: string): L10n | null {
  const perScore = byCategory.get(category)
  if (!perScore) return null
  const score = Math.max(0, Math.min(MAX_SCORE, Math.round(correct)))
  const options = perScore[score]
  if (!options || options.length === 0) return null
  const rng = makeRng(`${seed}|verdict|${score}`)
  return options[Math.floor(rng() * options.length)] ?? options[0]
}
