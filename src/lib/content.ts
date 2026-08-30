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
 * Vekting av spørsmål mot valgt utgangspunkt. Regionvalget er ikke et filter:
 * velger du norsk får du flest norske spørsmål, men fortsatt svenske og
 * internasjonale innslag. Så lenge en pulje er nøyaktig 10 spørsmål stor blir
 * alle brukt – vektingen slår inn først når banken fylles på.
 */
const WEIGHTS: Record<Region, Record<Region, number>> = {
  no: { no: 3.0, se: 1.3, int: 2.0 },
  se: { no: 1.3, se: 3.0, int: 2.0 },
  int: { no: 1.2, se: 1.2, int: 3.0 },
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
  if (pool.length <= count) return shuffle(pool, makeRng(seed))

  const rng = makeRng(seed)
  // Vektet utvalg uten tilbakelegging (Efraimidis–Spirakis).
  const scored = pool.map((q) => {
    const w = WEIGHTS[region][q.origin]
    return { q, key: Math.pow(rng(), 1 / w) }
  })
  scored.sort((a, b) => b.key - a.key)
  return shuffle(
    scored.slice(0, count).map((s) => s.q),
    rng,
  )
}

export function shuffle<T>(items: T[], rng: () => number): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
