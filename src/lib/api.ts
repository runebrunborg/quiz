import type { QuizSession } from '../../shared/types'
import { QUESTION_BY_ID } from './content'
import { clearFromOutbox, clearProfile, loadOutbox, loadProfile, loadSessions, saveProfile } from './storage'

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const profile = loadProfile()
  const headers = new Headers(init.headers)
  headers.set('content-type', 'application/json')
  // En eksplisitt nøkkel i kallet vinner – ellers ville innlogging med en annen
  // nøkkel bli overstyrt av den som allerede ligger lagret.
  if (profile.token && !headers.has('authorization')) headers.set('authorization', `Bearer ${profile.token}`)

  const res = await fetch(`/api${path}`, { ...init, headers })
  if (!res.ok) {
    let message = `Serveren svarte ${res.status}`
    try {
      const body = (await res.json()) as { error?: string }
      if (body.error) message = body.error
    } catch {
      /* behold standardmeldingen */
    }
    throw new ApiError(message, res.status)
  }
  return (await res.json()) as T
}

export interface AccountResponse {
  userId: string
  token: string
  displayName: string
  friendCode: string
}

export async function createAccount(displayName: string): Promise<AccountResponse> {
  const account = await call<AccountResponse>('/account', {
    method: 'POST',
    body: JSON.stringify({ displayName }),
  })
  saveProfile({
    userId: account.userId,
    token: account.token,
    displayName: account.displayName,
    friendCode: account.friendCode,
  })
  return account
}

/** Logg inn på en eksisterende konto på en ny enhet med gjenopprettingsnøkkelen. */
export async function restoreAccount(token: string): Promise<AccountResponse> {
  const account = await call<AccountResponse>('/account/me', {
    headers: { authorization: `Bearer ${token}` },
  })
  saveProfile({
    userId: account.userId,
    token,
    displayName: account.displayName,
    friendCode: account.friendCode,
  })
  return account
}

/** Bytter visningsnavn. Navnet er det eneste vennene dine ser. */
export async function renameAccount(displayName: string): Promise<AccountResponse> {
  const account = await call<AccountResponse>('/account', {
    method: 'PATCH',
    body: JSON.stringify({ displayName }),
  })
  const current = loadProfile()
  saveProfile({ ...current, displayName: account.displayName })
  return account
}

/** Sletter kontoen i skyen og kobler fra lokalt. Rundene på enheten blir liggende. */
export async function deleteAccount(): Promise<void> {
  await call('/account', { method: 'DELETE' })
  clearProfile()
}

/** Kobler fra uten å røre noe på serveren – nøkkelen er fortsatt gyldig. */
export function logOut(): void {
  clearProfile()
}

export interface LeaderboardEntry {
  rank: number
  id: string
  name: string
  correct: number
  total: number
  pct: number | null
  me: boolean
}

export type LeaderboardScope = 'friends' | 'all'
export type LeaderboardPeriod = 'week' | 'all'

export async function fetchLeaderboard(
  scope: LeaderboardScope,
  period: LeaderboardPeriod,
): Promise<{ entries: LeaderboardEntry[]; minAnswers: number }> {
  return call<{ entries: LeaderboardEntry[]; minAnswers: number }>(
    `/leaderboard?scope=${scope}&period=${period}`,
  )
}

/** Formen serveren lagrer per svar – inkluderer emne-tags så statistikken kan grupperes i SQL. */
function toPayload(session: QuizSession) {
  return {
    id: session.id,
    category: session.category,
    difficulty: session.difficulty,
    region: session.region,
    startedAt: session.startedAt,
    finishedAt: session.finishedAt,
    answers: session.questions
      .filter((q) => q.verdict !== null)
      .map((q) => ({
        questionId: q.questionId,
        correct: q.verdict === 'rett',
        hintsUsed: q.hintsUsed,
        topics: QUESTION_BY_ID.get(q.questionId)?.topics ?? [],
      })),
  }
}

/** Sender alle økter i utboksen. Stille no-op når man ikke er innlogget. */
export async function syncOutbox(): Promise<number> {
  const profile = loadProfile()
  if (!profile.token) return 0
  const pending = new Set(loadOutbox())
  if (pending.size === 0) return 0

  const sessions = loadSessions().filter((s) => pending.has(s.id) && s.finishedAt !== null)
  if (sessions.length === 0) {
    clearFromOutbox([...pending])
    return 0
  }
  await call('/sessions', { method: 'POST', body: JSON.stringify({ sessions: sessions.map(toPayload) }) })
  clearFromOutbox(sessions.map((s) => s.id))
  return sessions.length
}

export interface FriendSummary {
  id: string
  name: string
  thisWeek: { correct: number; total: number }
  lastWeek: { correct: number; total: number }
  accumulated: { correct: number; total: number }
  /** Dine egne akkumulerte tall, så sammenligningen kan vises side ved side. */
  myAccumulated: { correct: number; total: number }
  weeks: { week: string; me: number | null; friend: number | null }[]
}

export async function listFriends(): Promise<FriendSummary[]> {
  const res = await call<{ friends: FriendSummary[] }>('/friends')
  return res.friends
}

export async function addFriend(code: string): Promise<FriendSummary> {
  const res = await call<{ friend: FriendSummary }>('/friends', {
    method: 'POST',
    body: JSON.stringify({ code: code.trim().toUpperCase() }),
  })
  return res.friend
}

export async function removeFriend(id: string): Promise<void> {
  await call(`/friends/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
