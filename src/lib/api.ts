import type { FeedbackSummaryRow, QuizSession } from '../../shared/types'
import { QUESTION_BY_ID } from './content'
import { derivePasswordKey } from './crypto'
import {
  clearFromFeedbackOutbox,
  clearFromOutbox,
  clearProfile,
  dropLocalFeedback,
  loadFeedback,
  loadFeedbackOutbox,
  loadOutbox,
  loadProfile,
  loadSessions,
  mergeServerFeedback,
  queueAllFeedback,
  queueAllFinishedSessions,
  saveProfile,
  type LocalFeedback,
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
  // En fersk konto skal arve det man allerede har spilt og ment på denne enheten.
  queueAllFinishedSessions()
  queueAllFeedback()
  await syncOutbox()
  await syncFeedback()
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
  queueAllFeedback()
  await syncOutbox()
  await syncFeedback()
  await pullMyFeedback()
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

export type LeaderboardPeriod = 'week' | 'all'
export type LeaderboardScope = 'friends' | 'all'

export interface LeaderboardEntry {
  id: string
  rank: number
  name: string
  correct: number
  total: number
  /** null når man ikke har svart på noe i perioden. */
  pct: number | null
  me: boolean
}

export interface Leaderboard {
  scope: LeaderboardScope
  period: LeaderboardPeriod
  /** Minste antall besvarte spørsmål for å komme med. Null på vennelista. */
  minAnswers: number
  entries: LeaderboardEntry[]
}

export async function fetchLeaderboard(scope: LeaderboardScope, period: LeaderboardPeriod): Promise<Leaderboard> {
  return call(`/leaderboard?scope=${scope}&period=${period}`)
}

/* --------------------------------------------------- tilbakemeldinger */

/**
 * Sender køen med tommel opp/ned. Stemmer som er trukket tilbake ligger i køen
 * med `vote: null` og sendes som sletting. Stille no-op uten konto – da blir
 * stemmene liggende lokalt til man logger inn.
 */
export async function syncFeedback(): Promise<number> {
  const profile = loadProfile()
  if (!profile.token) return 0

  const pending = loadFeedbackOutbox()
  if (pending.length === 0) return 0

  const all = loadFeedback()
  const withdrawn = pending.filter((id) => !all[id] || all[id].vote === null)
  const votes = pending.map((id) => all[id]).filter((f): f is LocalFeedback => Boolean(f) && f.vote !== null)

  for (const id of withdrawn) {
    await call(`/feedback/${encodeURIComponent(id)}`, { method: 'DELETE' })
    clearFromFeedbackOutbox([id])
    dropLocalFeedback([id])
  }

  for (let i = 0; i < votes.length; i += 50) {
    const batch = votes.slice(i, i + 50)
    await call('/feedback', {
      method: 'POST',
      body: JSON.stringify({
        items: batch.map((f) => ({
          questionId: f.questionId,
          vote: f.vote,
          reason: f.reason,
          comment: f.comment,
          category: f.category,
          difficulty: f.difficulty,
          lang: f.lang,
          updatedAt: f.updatedAt,
        })),
      }),
    })
    clearFromFeedbackOutbox(batch.map((f) => f.questionId))
  }

  return withdrawn.length + votes.length
}

/** Henter egne stemmer, slik at en ny enhet viser det man allerede har ment. */
export async function pullMyFeedback(): Promise<void> {
  if (!loadProfile().token) return
  const res = await call<{ items: LocalFeedback[] }>('/feedback/mine')
  mergeServerFeedback(res.items)
}

export type FeedbackSort = 'verst' | 'best' | 'flest' | 'nyest'

export interface FeedbackSummary {
  sort: FeedbackSort
  totals: { votes: number; questions: number; up: number; down: number }
  rows: FeedbackSummaryRow[]
}

export async function fetchFeedbackSummary(
  sort: FeedbackSort,
  filters: { category?: string; difficulty?: string } = {},
): Promise<FeedbackSummary> {
  const params = new URLSearchParams({ sort })
  if (filters.category) params.set('category', filters.category)
  if (filters.difficulty) params.set('difficulty', filters.difficulty)
  return call(`/feedback/summary?${params.toString()}`)
}
