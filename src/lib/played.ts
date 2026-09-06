/**
 * Hva spilleren har spilt fra før.
 *
 * Et tema du har fullført på et nivå forsvinner fra temalista og legger seg i
 * arkivet. Det er ikke borte – du kan hente det fram igjen når som helst – men
 * det står ikke i veien for de temaene du ikke har prøvd ennå.
 *
 * Et arkivert tema kommer tilbake til hovedlista av seg selv når puljen har
 * vokst siden sist du spilte det. Derfor lagres puljestørrelsen sammen med
 * runden: den er nullpunktet nye spørsmål måles mot. Det er den ordinære
 * puljen som teller, ikke `poolFor`, siden de dagsaktuelle spørsmålene kommer
 * og går med datoen og ellers ville gitt falske «nytt stoff»-varsler.
 *
 * Alt ligger lokalt, på enheten. Serveren kjenner rundene dine (tabellen
 * `sessions`), men har ingen rute som gir dem tilbake, så et arkiv som følger
 * kontoen mellom enheter er et senere steg.
 */
import { DIFFICULTIES, type Difficulty, type QuizSession } from '../../shared/types'
import { ordinaryFor } from './content'
import { loadSessions } from './storage'

const KEY = 'tq.played.v1'

export interface PlayedEntry {
  category: string
  difficulty: Difficulty
  /** Da runden sist ble fullført. */
  at: number
  /** Antall fullførte runder på dette temaet og nivået. */
  times: number
  /** Størrelsen på den ordinære puljen den gangen. Vokser den, er det nytt stoff. */
  poolSize: number
  /** Spørsmål spilleren har sett, på tvers av rundene. */
  seen: string[]
}

export type PlayedIndex = Record<string, PlayedEntry>

/** «ny» = aldri spilt, «oppdatert» = spilt, men puljen har vokst, «spilt» = arkivert. */
export type CategoryStatus = 'ny' | 'oppdatert' | 'spilt'

export function playedKey(category: string, difficulty: Difficulty): string {
  return `${category}|${difficulty}`
}

/* ------------------------------------------------------------- ren logikk */

/** Slår en fullført runde inn i indeksen. Rent, så det kan testes uten nettleser. */
export function mergeRound(
  index: PlayedIndex,
  round: { category: string; difficulty: Difficulty; at: number; questionIds: string[]; poolSize: number },
): PlayedIndex {
  const key = playedKey(round.category, round.difficulty)
  const prev = index[key]
  const seen = new Set(prev?.seen ?? [])
  for (const id of round.questionIds) seen.add(id)
  return {
    ...index,
    [key]: {
      category: round.category,
      difficulty: round.difficulty,
      at: Math.max(prev?.at ?? 0, round.at),
      times: (prev?.times ?? 0) + 1,
      poolSize: round.poolSize,
      seen: [...seen],
    },
  }
}

/**
 * Statusen et tema har på et nivå. `poolNow` er dagens ordinære pulje.
 * Har puljen vokst siden sist, er temaet «oppdatert» og hentes ut av arkivet –
 * det er den nye versjonen av kategorien spilleren skal få øye på.
 */
export function statusOf(entry: PlayedEntry | undefined, poolNow: number): CategoryStatus {
  if (!entry) return 'ny'
  return poolNow > entry.poolSize ? 'oppdatert' : 'spilt'
}

/** Spørsmål i dagens pulje som spilleren aldri har sett. */
export function unseenOf(entry: PlayedEntry | undefined, poolIds: string[]): number {
  if (!entry) return poolIds.length
  const seen = new Set(entry.seen)
  return poolIds.filter((id) => !seen.has(id)).length
}

/* ------------------------------------------------------- lagring på enheten */

function read(): PlayedIndex | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as PlayedIndex) : null
  } catch {
    return null
  }
}

function write(index: PlayedIndex): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(index))
  } catch {
    /* privat modus eller full disk – appen fungerer, bare uten arkiv */
  }
}

/**
 * Første gang: bygg indeksen av rundene som allerede ligger på enheten, og sett
 * puljestørrelsen til dagens. Ellers ville alt spilleren har spilt fra før
 * dukket opp som «oppdatert» i samme øyeblikk som arkivet ble tatt i bruk.
 */
function backfill(): PlayedIndex {
  let index: PlayedIndex = {}
  for (const s of loadSessions()) {
    if (s.finishedAt === null) continue
    if (!DIFFICULTIES.includes(s.difficulty)) continue
    index = mergeRound(index, {
      category: s.category,
      difficulty: s.difficulty,
      at: s.finishedAt,
      questionIds: s.questions.map((q) => q.questionId),
      poolSize: ordinaryFor(s.category, s.difficulty).length,
    })
  }
  for (const entry of Object.values(index)) {
    entry.poolSize = ordinaryFor(entry.category, entry.difficulty).length
  }
  write(index)
  return index
}

export function loadPlayed(): PlayedIndex {
  return read() ?? backfill()
}

/** Kalles når en runde er fullført. */
export function markPlayed(session: QuizSession): void {
  if (session.finishedAt === null) return
  const next = mergeRound(loadPlayed(), {
    category: session.category,
    difficulty: session.difficulty,
    at: session.finishedAt,
    questionIds: session.questions.map((q) => q.questionId),
    poolSize: ordinaryFor(session.category, session.difficulty).length,
  })
  write(next)
}

/** Tar et tema ut av arkivet uten å slette historikken – brukes av «Spill igjen». */
export function forget(category: string, difficulty: Difficulty): void {
  const index = loadPlayed()
  delete index[playedKey(category, difficulty)]
  write(index)
}
