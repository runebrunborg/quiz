import type { Difficulty, QuizSession, Region } from '../../shared/types'

const SESSIONS_KEY = 'tq.sessions.v1'
const PROFILE_KEY = 'tq.profile.v2'
const PREFS_KEY = 'tq.prefs.v1'
const OUTBOX_KEY = 'tq.outbox.v1'

export interface Profile {
  /** Serverens bruker-id. Null når man spiller uten konto. */
  userId: string | null
  /** Innloggingsnøkkel for denne enheten. */
  token: string | null
  nickname: string
  /** Alternativ til nickname når man legger til venner. */
  friendCode: string | null
  birthYear: number | null
  country: string | null
}

export const EMPTY_PROFILE: Profile = {
  userId: null,
  token: null,
  nickname: '',
  friendCode: null,
  birthYear: null,
  country: null,
}

export interface Prefs {
  category: string | null
  difficulty: Difficulty
  region: Region
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* privat modus eller full disk – appen fungerer, bare uten historikk */
  }
}

export function loadSessions(): QuizSession[] {
  return read<QuizSession[]>(SESSIONS_KEY, [])
}

export function saveSession(session: QuizSession): void {
  const all = loadSessions().filter((s) => s.id !== session.id)
  all.push(session)
  all.sort((a, b) => a.startedAt - b.startedAt)
  write(SESSIONS_KEY, all.slice(-500))
}

export function loadProfile(): Profile {
  return { ...EMPTY_PROFILE, ...read<Partial<Profile>>(PROFILE_KEY, {}) }
}

export function saveProfile(profile: Profile): void {
  write(PROFILE_KEY, profile)
}

export function clearProfile(): void {
  write(PROFILE_KEY, EMPTY_PROFILE)
}

export function loadPrefs(): Prefs {
  return read<Prefs>(PREFS_KEY, { category: null, difficulty: 'medium', region: 'no' })
}

export function savePrefs(prefs: Prefs): void {
  write(PREFS_KEY, prefs)
}

/** Økter som ennå ikke er sendt til serveren (offline, eller ikke innlogget ennå). */
export function loadOutbox(): string[] {
  return read<string[]>(OUTBOX_KEY, [])
}

export function queueForSync(sessionId: string): void {
  const ids = new Set(loadOutbox())
  ids.add(sessionId)
  write(OUTBOX_KEY, [...ids])
}

export function clearFromOutbox(sessionIds: string[]): void {
  const done = new Set(sessionIds)
  write(
    OUTBOX_KEY,
    loadOutbox().filter((id) => !done.has(id)),
  )
}

/** Alt som er spilt lokalt legges i kø, slik at en fersk konto får med seg historikken. */
export function queueAllFinishedSessions(): void {
  const ids = new Set(loadOutbox())
  for (const s of loadSessions()) if (s.finishedAt !== null) ids.add(s.id)
  write(OUTBOX_KEY, [...ids])
}
