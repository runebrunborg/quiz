import type { Category, Difficulty, Question, Region } from '../../shared/types'
import { hasOnThisDay, isRetired, isTopicalActive, today } from '../../shared/questions'
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

/** Alt som ligger i banken for tema og nivå, uansett dato. */
export function rawPoolFor(category: string, difficulty: Difficulty): Question[] {
  return byKey.get(`${category}|${difficulty}`) ?? []
}

/**
 * Puljen slik den ser ut i dag. Dagsaktuelle spørsmål som har gått ut på dato
 * uten å være `evergreen`, filtreres bort – de blir liggende i innholdsfila,
 * men trekkes ikke.
 */
export function poolFor(category: string, difficulty: Difficulty, day: string = today()): Question[] {
  return rawPoolFor(category, difficulty).filter((q) => !isRetired(q, day))
}

/** Puljen uten de dagsaktuelle – det er disse som måles mot `POOL_TARGET`. */
export function ordinaryFor(category: string, difficulty: Difficulty, day: string = today()): Question[] {
  return poolFor(category, difficulty, day).filter((q) => !q.topical)
}

/** De dagsaktuelle spørsmålene som fortsatt er ferske. */
export function topicalFor(category: string, difficulty: Difficulty, day: string = today()): Question[] {
  return rawPoolFor(category, difficulty).filter((q) => isTopicalActive(q, day))
}

/** Spørsmål i temaet som har en «på denne dag»-variant for dagens dato. */
export function datedFor(category: string, difficulty: Difficulty, day: string = today()): Question[] {
  return poolFor(category, difficulty, day).filter((q) => hasOnThisDay(q, day))
}

/** Har temaet noe som treffer dagens dato, på et av nivåene? */
export function hasDateHitToday(category: string, day: string = today()): boolean {
  return DIFFICULTY_LIST.some((d) => datedFor(category, d, day).length > 0)
}

const DIFFICULTY_LIST: Difficulty[] = ['lett', 'medium', 'vanskelig']

export interface Coverage {
  category: string
  /** Ordinære spørsmål per nivå – det er disse som måles mot `POOL_TARGET`. */
  perDifficulty: Record<Difficulty, number>
  total: number
  /** Dagsaktuelle spørsmål som fortsatt er ferske, per nivå. Kommer i tillegg til måltallet. */
  topicalPerDifficulty: Record<Difficulty, number>
  topicalTotal: number
}

export const QUESTIONS_PER_ROUND = 10

/**
 * Måltall for hvor stor puljen bør være per tema og nivå. Er puljen større enn
 * én runde, får regionvektingen noe å velge mellom – og da gir norsk, svensk og
 * internasjonalt utgangspunkt faktisk ulike quizer.
 */
export const POOL_TARGET = 20

export function coverage(day: string = today()): Coverage[] {
  return CATEGORIES.map((c) => {
    const ordinary = (d: Difficulty) => poolFor(c.id, d, day).filter((q) => !q.topical).length
    const perDifficulty = {
      lett: ordinary('lett'),
      medium: ordinary('medium'),
      vanskelig: ordinary('vanskelig'),
    }
    const topicalPerDifficulty = {
      lett: topicalFor(c.id, 'lett', day).length,
      medium: topicalFor(c.id, 'medium', day).length,
      vanskelig: topicalFor(c.id, 'vanskelig', day).length,
    }
    return {
      category: c.id,
      perDifficulty,
      total: perDifficulty.lett + perDifficulty.medium + perDifficulty.vanskelig,
      topicalPerDifficulty,
      topicalTotal:
        topicalPerDifficulty.lett + topicalPerDifficulty.medium + topicalPerDifficulty.vanskelig,
    }
  })
}

/**
 * Temaer som er spillbare. Et tema med bare dagsaktuelle spørsmål er ikke
 * spillbart – to spørsmål er ingen runde – så det er de ordinære som teller.
 */
export function categoriesWithContent(day: string = today()): Category[] {
  return CATEGORIES.filter((c) =>
    DIFFICULTY_LIST.some((d) => ordinaryFor(c.id, d, day).length > 0),
  )
}

/**
 * Temaene i den rekkefølgen startskjermen skal vise dem: de som har et spørsmål
 * med «på denne dag»-variant for dagens dato først, resten i tilfeldig
 * rekkefølge etterpå. Løftet holdes av `pickQuestions`, som alltid tar med et
 * datospørsmål når det finnes et.
 */
export function categoriesInDisplayOrder(
  rng: () => number,
  difficulty: Difficulty,
  day: string = today(),
): { category: Category; datedToday: boolean }[] {
  const playable = categoriesWithContent(day)
  const dated: Category[] = []
  const rest: Category[] = []
  for (const c of playable) {
    if (datedFor(c.id, difficulty, day).length > 0) dated.push(c)
    else rest.push(c)
  }
  return [
    ...shuffle(dated, rng).map((category) => ({ category, datedToday: true })),
    ...shuffle(rest, rng).map((category) => ({ category, datedToday: false })),
  ]
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

/**
 * Hvor mange av de ti plassene som er reservert. Runden er fortsatt ti
 * spørsmål – de reserverte *erstatter* ordinære spørsmål, de kommer ikke i
 * tillegg.
 */
export const TOPICAL_PER_ROUND = 2
export const DATED_PER_ROUND = 1

export function pickQuestions(
  category: string,
  difficulty: Difficulty,
  region: Region,
  seed: string,
  count = QUESTIONS_PER_ROUND,
  day: string = today(),
): Question[] {
  return composeRound(poolFor(category, difficulty, day), region, seed, count, day)
}

/**
 * Selve sammensetningen, skilt ut fra banken så den kan testes med en
 * håndlaget pulje.
 */
export function composeRound(
  raw: Question[],
  region: Region,
  seed: string,
  count = QUESTIONS_PER_ROUND,
  day: string = today(),
): Question[] {
  const pool = raw.filter((q) => !isRetired(q, day))
  // Utgangspunktet er en del av frøet. Uten det stokkes gruppene likt for alle
  // tre valgene, og den norske runden blir bare den svenske med to spørsmål
  // byttet ut. Med det i frøet trekkes hver region uavhengig.
  const rng = makeRng(`${seed}|${region}`)
  if (pool.length <= count) return shuffle(pool, rng)

  // 1. Dagens dato går foran alt. Startskjermen løfter temaer som har et
  //    spørsmål med «på denne dag»-variant i dag helt til toppen, og da må
  //    runden faktisk inneholde det spørsmålet.
  const dated = shuffle(pool.filter((q) => hasOnThisDay(q, day)), rng).slice(0, DATED_PER_ROUND)
  const datedIds = new Set(dated.map((q) => q.id))

  // 2. De dagsaktuelle tar de siste plassene i runden.
  const topical = shuffle(
    pool.filter((q) => isTopicalActive(q, day) && !datedIds.has(q.id)),
    rng,
  ).slice(0, Math.min(TOPICAL_PER_ROUND, count - dated.length))

  const reserved = [...dated, ...topical]
  const reservedIds = new Set(reserved.map((q) => q.id))

  // Resten trekkes etter kvote fra de ordinære spørsmålene. Dagsaktuelle som
  // ikke kom med, holdes utenfor – de skal ikke konkurrere som vanlige
  // spørsmål så lenge de er ferske.
  const rest = pool.filter((q) => !reservedIds.has(q.id) && !isTopicalActive(q, day))
  const remaining = Math.max(0, count - reserved.length)

  // Stokk hver herkomstgruppe for seg, og plukk fra toppen etter kvote.
  const groups: Record<Region, Question[]> = {
    no: shuffle(rest.filter((q) => q.origin === 'no'), rng),
    se: shuffle(rest.filter((q) => q.origin === 'se'), rng),
    int: shuffle(rest.filter((q) => q.origin === 'int'), rng),
  }

  // De reserverte plassene spiser av kvoten sin egen herkomst, slik at
  // regionmiksen i runden holder seg selv om to plasser er forhåndsbestemt.
  const quota: Record<Region, number> = { ...QUOTAS[region] }
  for (const q of reserved) quota[q.origin] = Math.max(0, quota[q.origin] - 1)

  const chosen: Question[] = []
  const wanted = ([region, ...FALLBACK_ORDER[region]] as Region[])

  for (const origin of wanted) {
    chosen.push(...groups[origin].splice(0, Math.min(quota[origin], remaining - chosen.length)))
  }

  // Fyll opp om en gruppe var for liten. Egen herkomst først, så de andre.
  for (const origin of wanted) {
    if (chosen.length >= remaining) break
    chosen.push(...groups[origin].splice(0, remaining - chosen.length))
  }

  // Datospørsmålet stokkes inn blant de vanlige – det *er* et vanlig spørsmål,
  // bare formulert for dagen. De dagsaktuelle står til slutt, som en egen bolk.
  return [...shuffle([...chosen, ...dated], rng), ...topical]
}

export function shuffle<T>(items: T[], rng: () => number): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
