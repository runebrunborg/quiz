import type { QuizSession } from '../../shared/types'
import { QUESTION_BY_ID } from './content'
import { derivePasswordKey } from './crypto'
import {
  clearFromOutbox,
  clearProfile,
  loadOutbox,
  loadProfile,
  loadSessions,
  queueAllFinishedSessions,
  saveProfile,
  type Profile,
} from './storage'

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
  if (profile.token) headers.set('authorization', `Bearer ${profile.token}`)

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
  nickname: string
  friendCode: string
  birthYear: number | null
  country: string | null
  token?: string
}

function store(account: AccountResponse, fallbackToken?: string | null): Profile {
  const profile: Profile = {
    userId: account.userId,
    token: account.token ?? fallbackToken ?? null,
    nickname: account.nickname,
    friendCode: account.friendCode,
    birthYear: account.birthYear,
    country: account.country,
  }
  saveProfile(profile)
  return profile
}

export async function nicknameAvailable(nickname: string): Promise<{ available: boolean; error?: string }> {
  return call(`/account/available?nickname=${encodeURIComponent(nickname)}`)
}

export async function register(input: {
  nickname: string
  password: string
  birthYear: number | null
  country: string | null
}): Promise<Profile> {
  const passwordKey = await derivePasswordKey(input.nickname, input.password)
  const account = await call<AccountResponse>('/account/register', {
    method: 'POST',
    body: JSON.stringify({
      nickname: input.nickname,
      passwordKey,
      birthYear: input.birthYear,
      country: input.country,
    }),
  })
  const profile = store(account)
  // En fersk konto skal arve det man allerede har spilt på denne enheten.
  queueAllFinishedSessions()
  await syncOutbox()
  return profile
}

export async function login(nickname: string, password: string): Promise<Profile> {
  const passwordKey = await derivePasswordKey(nickname, password)
  const account = await call<AccountResponse>('/account/login', {
    method: 'POST',
    body: JSON.stringify({ nickname, passwordKey }),
  })
  const profile = store(account)
  queueAllFinishedSessions()
  await syncOutbox()
  return profile
}

export async function refreshProfile(): Promise<Profile | null> {
  const current = loadProfile()
  if (!current.token) return null
  try {
    const account = await call<AccountResponse>('/account/me')
    return store(account, current.token)
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) clearProfile()
    return null
  }
}

export async function updateProfile(input: { birthYear: number | null; country: string | null }): Promise<Profile> {
  const current = loadProfile()
  const account = await call<AccountResponse>('/account/me', {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  return store(account, current.token)
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const { nickname } = loadProfile()
  await call('/account/password', {
    method: 'POST',
    body: JSON.stringify({
      currentPasswordKey: await derivePasswordKey(nickname, currentPassword),
      newPasswordKey: await derivePasswordKey(nickname, newPassword),
    }),
  })
}

export async function logout(): Promise<void> {
  try {
    await call('/account/logout', { method: 'POST' })
  } finally {
    clearProfile()
  }
}

export async function deleteAccount(): Promise<void> {
  try {
    await call('/account/me', { method: 'DELETE' })
  } finally {
    clearProfile()
  }
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
  // Send i porsjoner, så en lang historikk ikke sprenger én forespørsel.
  for (let i = 0; i < sessions.length; i += 25) {
    const batch = sessions.slice(i, i + 25)
    await call('/sessions', { method: 'POST', body: JSON.stringify({ sessions: batch.map(toPayload) }) })
    clearFromOutbox(batch.map((s) => s.id))
  }
  return sessions.length
}

export interface FriendSummary {
  id: string
  name: string
  thisWeek: { correct: number; total: number }
  lastWeek: { correct: number; total: number }
  accumulated: { correct: number; total: number }
  myAccumulated: { correct: number; total: number }
  weeks: { week: string; me: number | null; friend: number | null }[]
}

export async function listFriends(): Promise<FriendSummary[]> {
  const res = await call<{ friends: FriendSummary[] }>('/friends')
  return res.friends
}

export async function addFriend(nickname: string): Promise<FriendSummary> {
  const res = await call<{ friend: FriendSummary }>('/friends', {
    method: 'POST',
    body: JSON.stringify({ nickname: nickname.trim() }),
  })
  return res.friend
}

export async function removeFriend(id: string): Promise<void> {
  await call(`/friends/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export interface LeaderboardEntry {
  rank: number
  nickname: string
  country: string | null
  correct: number
  total: number
  accuracy: number
  isMe: boolean
}

export async function leaderboard(period: 'all' | 'week'): Promise<{
  period: string
  minimum: number
  entries: LeaderboardEntry[]
  me: LeaderboardEntry | null
}> {
  return call(`/leaderboard?period=${period}`)
}
