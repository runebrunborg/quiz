import type { Difficulty, QuizSession, Region } from '../../shared/types'

const SESSIONS_KEY = 'tq.sessions.v1'
const PROFILE_KEY = 'tq.profile.v1'
const PREFS_KEY = 'tq.prefs.v1'
const OUTBOX_KEY = 'tq.outbox.v1'

export interface Profile {
  /** Serverens bruker-id. Null når man spiller helt lokalt. */
  userId: string | null
  /** Hemmelig nøkkel som autentiserer mot API-et. */
  token: string | null
  displayName: string
  /** Kode venner bruker for å legge deg til. */
  friendCode: string | null
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
    /* full disk eller privat modus – appen fungerer uansett, bare uten historikk */
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
  return read<Profile>(PROFILE_KEY, { userId: null, token: null, displayName: '', friendCode: null })
}

export function saveProfile(profile: Profile): void {
  write(PROFILE_KEY, profile)
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
