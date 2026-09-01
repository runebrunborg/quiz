/**
 * LinnQuiz – Cloudflare Worker.
 *
 * Serverer frontend-bygget og et JSON-API på /api for kontoer, synkronisering
 * av resultater, statistikk, venner og toppliste.
 *
 * Om passord: nettleseren kjører selve nøkkelutledningen (PBKDF2, 600 000
 * runder) og sender resultatet hit. Serveren salter det med sitt eget
 * tilfeldige salt og lagrer en SHA-256 av summen. Arbeidsdelingen skyldes
 * CPU-taket per forespørsel på Cloudflare; se src/lib/crypto.ts.
 */
import { Hono } from 'hono'
import type { MiddlewareHandler } from 'hono'
import { isoDay, isoWeek, recentWeeks } from '../shared/time'

export interface Env {
  DB: D1Database
  ASSETS: Fetcher
  APP_NAME: string
}

type Vars = { userId: string; tokenHash: string }

const app = new Hono<{ Bindings: Env; Variables: Vars }>()
const api = new Hono<{ Bindings: Env; Variables: Vars }>()

/* ------------------------------------------------------------------ hjelpere */

function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes)
  crypto.getRandomValues(buf)
  return [...buf].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function sha256(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Sammenligning uten tidslekkasje. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** Vennekode: 8 tegn uten lett forvekslede bokstaver. Beholdt som alternativ til nickname. */
function friendCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const buf = new Uint8Array(8)
  crypto.getRandomValues(buf)
  return [...buf].map((b) => alphabet[b % alphabet.length]).join('')
}

/** Samme normalisering som i src/lib/crypto.ts – må holdes i takt. */
function nicknameKey(nickname: string): string {
  return nickname.normalize('NFKC').toLowerCase().replace(/[\s\-_.]/g, '')
}

const NICKNAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} _.-]{1,23}$/u

function validateNickname(raw: unknown): { ok: true; nickname: string; key: string } | { ok: false; error: string } {
  const nickname = typeof raw === 'string' ? raw.trim() : ''
  if (nickname.length < 2) return { ok: false, error: 'Nicknamet må ha minst to tegn' }
  if (nickname.length > 24) return { ok: false, error: 'Nicknamet kan ha høyst 24 tegn' }
  if (!NICKNAME_PATTERN.test(nickname)) return { ok: false, error: 'Nicknamet kan bare inneholde bokstaver, tall, mellomrom, punktum, bindestrek og understrek' }
  const key = nicknameKey(nickname)
  if (key.length < 2) return { ok: false, error: 'Nicknamet må ha minst to bokstaver eller tall' }
  return { ok: true, nickname, key }
}

/** Nøkkelen fra nettleserens PBKDF2 – 64 heksadesimale tegn. */
function validatePasswordKey(raw: unknown): string | null {
  return typeof raw === 'string' && /^[0-9a-f]{64}$/.test(raw) ? raw : null
}

const MIN_YEAR = 1900
const MAX_AGE_ISH = 13

function validateBirthYear(raw: unknown): { ok: true; value: number | null } | { ok: false; error: string } {
  if (raw === null || raw === undefined || raw === '') return { ok: true, value: null }
  const year = typeof raw === 'number' ? raw : Number.parseInt(String(raw), 10)
  if (!Number.isInteger(year)) return { ok: false, error: 'Fødselsår må være et årstall' }
  const newest = new Date().getUTCFullYear() - MAX_AGE_ISH
  if (year < MIN_YEAR || year > newest) {
    return { ok: false, error: `Fødselsår må være mellom ${MIN_YEAR} og ${newest}. Aldersgrensen for LinnQuiz er ${MAX_AGE_ISH} år.` }
  }
  return { ok: true, value: year }
}

function validateCountry(raw: unknown): { ok: true; value: string | null } | { ok: false; error: string } {
  if (raw === null || raw === undefined || raw === '') return { ok: true, value: null }
  const code = String(raw).trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(code)) return { ok: false, error: 'Land må være en tobokstavs landkode' }
  return { ok: true, value: code }
}

interface UserRow {
  id: string
  nickname: string
  friend_code: string
  birth_year: number | null
  country: string | null
}

function publicProfile(row: UserRow, token?: string) {
  return {
    userId: row.id,
    nickname: row.nickname,
    friendCode: row.friend_code,
    birthYear: row.birth_year,
    country: row.country,
    ...(token ? { token } : {}),
  }
}

async function issueToken(db: D1Database, userId: string): Promise<string> {
  const token = randomHex(32)
  const now = Date.now()
  await db
    .prepare('INSERT INTO auth_tokens (token_hash, user_id, created_at, last_seen_at) VALUES (?, ?, ?, ?)')
    .bind(await sha256(token), userId, now, now)
    .run()
  return token
}

/* -------------------------------------------------------------- middleware */

const auth: MiddlewareHandler<{ Bindings: Env; Variables: Vars }> = async (c, next) => {
  const header = c.req.header('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token) return c.json({ error: 'Ikke innlogget' }, 401)

  const tokenHash = await sha256(token)
  const row = await c.env.DB.prepare('SELECT user_id FROM auth_tokens WHERE token_hash = ?')
    .bind(tokenHash)
    .first<{ user_id: string }>()

  if (!row) return c.json({ error: 'Innloggingen er utløpt' }, 401)
  c.set('userId', row.user_id)
  c.set('tokenHash', tokenHash)
  await next()
}

api.use('/account/me', auth)
api.use('/account/logout', auth)
api.use('/account/password', auth)
api.use('/sessions', auth)
api.use('/me/*', auth)
api.use('/friends', auth)
api.use('/friends/*', auth)
api.use('/leaderboard', auth)
api.use('/feedback', auth)
api.use('/feedback/*', auth)

/* -------------------------------------------------------------------- konto */

api.get('/account/available', async (c) => {
  const check = validateNickname(c.req.query('nickname'))
  if (!check.ok) return c.json({ available: false, error: check.error })
  const taken = await c.env.DB.prepare('SELECT 1 FROM users WHERE nickname_key = ?').bind(check.key).first()
  return c.json({ available: !taken })
})

api.post('/account/register', async (c) => {
  const body = await c.req.json<Record<string, unknown>>().catch(() => ({}) as Record<string, unknown>)

  const name = validateNickname(body.nickname)
  if (!name.ok) return c.json({ error: name.error }, 400)

  const passwordKey = validatePasswordKey(body.passwordKey)
  if (!passwordKey) return c.json({ error: 'Passordet mangler eller er ugyldig' }, 400)

  const year = validateBirthYear(body.birthYear)
  if (!year.ok) return c.json({ error: year.error }, 400)

  const country = validateCountry(body.country)
  if (!country.ok) return c.json({ error: country.error }, 400)

  const taken = await c.env.DB.prepare('SELECT 1 FROM users WHERE nickname_key = ?').bind(name.key).first()
  if (taken) return c.json({ error: 'Nicknamet er opptatt' }, 409)

  const id = crypto.randomUUID()
  const salt = randomHex(16)
  const hash = await sha256(`${salt}:${passwordKey}`)

  await c.env.DB.prepare(
    `INSERT INTO users (id, display_name, nickname, nickname_key, friend_code, token_hash,
                        password_hash, password_salt, birth_year, country, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      name.nickname,
      name.nickname,
      name.key,
      friendCode(),
      randomHex(32), // ubrukt kolonne fra første skjemaversjon, må være unik
      hash,
      salt,
      year.value,
      country.value,
      Date.now(),
    )
    .run()

  const token = await issueToken(c.env.DB, id)
  const row = await c.env.DB.prepare(
    'SELECT id, nickname, friend_code, birth_year, country FROM users WHERE id = ?',
  )
    .bind(id)
    .first<UserRow>()

  return c.json(publicProfile(row!, token))
})

api.post('/account/login', async (c) => {
  const body = await c.req.json<Record<string, unknown>>().catch(() => ({}) as Record<string, unknown>)
  const name = validateNickname(body.nickname)
  const passwordKey = validatePasswordKey(body.passwordKey)
  if (!name.ok || !passwordKey) return c.json({ error: 'Feil nickname eller passord' }, 401)

  const row = await c.env.DB.prepare(
    'SELECT id, nickname, friend_code, birth_year, country, password_hash, password_salt FROM users WHERE nickname_key = ?',
  )
    .bind(name.key)
    .first<UserRow & { password_hash: string | null; password_salt: string | null }>()

  if (!row || !row.password_hash || !row.password_salt) {
    return c.json({ error: 'Feil nickname eller passord' }, 401)
  }

  const attempt = await sha256(`${row.password_salt}:${passwordKey}`)
  if (!timingSafeEqual(attempt, row.password_hash)) {
    return c.json({ error: 'Feil nickname eller passord' }, 401)
  }

  const token = await issueToken(c.env.DB, row.id)
  return c.json(publicProfile(row, token))
})

api.get('/account/me', async (c) => {
  const row = await c.env.DB.prepare(
    'SELECT id, nickname, friend_code, birth_year, country FROM users WHERE id = ?',
  )
    .bind(c.get('userId'))
    .first<UserRow>()
  if (!row) return c.json({ error: 'Fant ikke kontoen' }, 404)
  await c.env.DB.prepare('UPDATE auth_tokens SET last_seen_at = ? WHERE token_hash = ?')
    .bind(Date.now(), c.get('tokenHash'))
    .run()
  return c.json(publicProfile(row))
})

api.patch('/account/me', async (c) => {
  const body = await c.req.json<Record<string, unknown>>().catch(() => ({}) as Record<string, unknown>)
  const year = validateBirthYear(body.birthYear)
  if (!year.ok) return c.json({ error: year.error }, 400)
  const country = validateCountry(body.country)
  if (!country.ok) return c.json({ error: country.error }, 400)

  await c.env.DB.prepare('UPDATE users SET birth_year = ?, country = ? WHERE id = ?')
    .bind(year.value, country.value, c.get('userId'))
    .run()

  const row = await c.env.DB.prepare(
    'SELECT id, nickname, friend_code, birth_year, country FROM users WHERE id = ?',
  )
    .bind(c.get('userId'))
    .first<UserRow>()
  return c.json(publicProfile(row!))
})

api.post('/account/password', async (c) => {
  const body = await c.req.json<Record<string, unknown>>().catch(() => ({}) as Record<string, unknown>)
  const current = validatePasswordKey(body.currentPasswordKey)
  const next = validatePasswordKey(body.newPasswordKey)
  if (!current || !next) return c.json({ error: 'Passordet mangler eller er ugyldig' }, 400)

  const row = await c.env.DB.prepare('SELECT password_hash, password_salt FROM users WHERE id = ?')
    .bind(c.get('userId'))
    .first<{ password_hash: string | null; password_salt: string | null }>()
  if (!row?.password_hash || !row.password_salt) return c.json({ error: 'Kontoen har ikke passord' }, 400)
  if (!timingSafeEqual(await sha256(`${row.password_salt}:${current}`), row.password_hash)) {
    return c.json({ error: 'Feil nåværende passord' }, 401)
  }

  const salt = randomHex(16)
  await c.env.DB.prepare('UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?')
    .bind(await sha256(`${salt}:${next}`), salt, c.get('userId'))
    .run()

  // Logg ut alle andre enheter når passordet byttes.
  await c.env.DB.prepare('DELETE FROM auth_tokens WHERE user_id = ? AND token_hash != ?')
    .bind(c.get('userId'), c.get('tokenHash'))
    .run()

  return c.json({ ok: true })
})

api.post('/account/logout', async (c) => {
  await c.env.DB.prepare('DELETE FROM auth_tokens WHERE token_hash = ?').bind(c.get('tokenHash')).run()
  return c.json({ ok: true })
})

api.delete('/account/me', auth, async (c) => {
  const userId = c.get('userId')
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM answer_topics WHERE user_id = ?').bind(userId),
    c.env.DB.prepare('DELETE FROM answers WHERE user_id = ?').bind(userId),
    c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId),
    c.env.DB.prepare('DELETE FROM question_feedback WHERE user_id = ?').bind(userId),
    c.env.DB.prepare('DELETE FROM friends WHERE user_id = ? OR friend_id = ?').bind(userId, userId),
    c.env.DB.prepare('DELETE FROM auth_tokens WHERE user_id = ?').bind(userId),
    c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId),
  ])
  return c.json({ ok: true })
})

/* ------------------------------------------------------------------- økter */

interface AnswerPayload {
  questionId: string
  correct: boolean
  hintsUsed: number
  topics: string[]
}

interface SessionPayload {
  id: string
  category: string
  difficulty: string
  region: string
  startedAt: number
  finishedAt: number | null
  answers: AnswerPayload[]
}

api.post('/sessions', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json<{ sessions?: SessionPayload[] }>().catch(() => ({}) as { sessions?: SessionPayload[] })
  const sessions = (body.sessions ?? []).filter((s) => s && s.id && s.finishedAt)

  if (sessions.length === 0) return c.json({ saved: 0 })
  if (sessions.length > 100) return c.json({ error: 'For mange økter i én forespørsel' }, 400)

  let saved = 0
  for (const s of sessions) {
    const finishedAt = s.finishedAt as number
    const week = isoWeek(finishedAt)
    const day = isoDay(finishedAt)
    const correct = s.answers.filter((a) => a.correct).length

    // Idempotent: samme økt kan sendes flere ganger uten å telles dobbelt.
    await c.env.DB.prepare(
      'DELETE FROM answer_topics WHERE answer_id IN (SELECT id FROM answers WHERE session_id = ? AND user_id = ?)',
    )
      .bind(s.id, userId)
      .run()
    await c.env.DB.prepare('DELETE FROM answers WHERE session_id = ? AND user_id = ?').bind(s.id, userId).run()
    await c.env.DB.prepare('DELETE FROM sessions WHERE id = ? AND user_id = ?').bind(s.id, userId).run()

    await c.env.DB.prepare(
      `INSERT INTO sessions (id, user_id, category, difficulty, region, started_at, finished_at, iso_day, iso_week, correct, total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(s.id, userId, s.category, s.difficulty, s.region, s.startedAt, finishedAt, day, week, correct, s.answers.length)
      .run()

    for (const a of s.answers) {
      const res = await c.env.DB.prepare(
        'INSERT INTO answers (session_id, user_id, question_id, correct, hints_used, iso_week) VALUES (?, ?, ?, ?, ?, ?)',
      )
        .bind(s.id, userId, a.questionId, a.correct ? 1 : 0, a.hintsUsed ?? 0, week)
        .run()

      const answerId = res.meta.last_row_id
      for (const topic of (a.topics ?? []).slice(0, 6)) {
        await c.env.DB.prepare(
          'INSERT INTO answer_topics (answer_id, user_id, topic, correct, iso_week) VALUES (?, ?, ?, ?, ?)',
        )
          .bind(answerId, userId, topic, a.correct ? 1 : 0, week)
          .run()
      }
    }
    saved++
  }

  return c.json({ saved })
})

/* -------------------------------------------------------------- statistikk */

api.get('/me/stats', async (c) => {
  const userId = c.get('userId')

  const weeks = await c.env.DB.prepare(
    'SELECT iso_week AS week, SUM(correct) AS correct, SUM(total) AS total FROM sessions WHERE user_id = ? GROUP BY iso_week ORDER BY iso_week',
  )
    .bind(userId)
    .all<{ week: string; correct: number; total: number }>()

  const topics = await c.env.DB.prepare(
    'SELECT topic, SUM(correct) AS correct, COUNT(*) AS total FROM answer_topics WHERE user_id = ? GROUP BY topic ORDER BY total DESC',
  )
    .bind(userId)
    .all<{ topic: string; correct: number; total: number }>()

  return c.json({ weeks: weeks.results ?? [], topics: topics.results ?? [] })
})

/* ------------------------------------------------------------------ venner */

const WEEKS_BACK = 12

async function weeklyFor(db: D1Database, userId: string): Promise<Map<string, { correct: number; total: number }>> {
  const rows = await db
    .prepare(
      'SELECT iso_week AS week, SUM(correct) AS correct, SUM(total) AS total FROM sessions WHERE user_id = ? GROUP BY iso_week',
    )
    .bind(userId)
    .all<{ week: string; correct: number; total: number }>()
  return new Map((rows.results ?? []).map((r) => [r.week, { correct: r.correct, total: r.total }]))
}

function ratio(v: { correct: number; total: number } | undefined): number | null {
  if (!v || v.total === 0) return null
  return Math.round((v.correct / v.total) * 100)
}

function accumulate(map: Map<string, { correct: number; total: number }>) {
  return [...map.values()].reduce((sum, v) => ({ correct: sum.correct + v.correct, total: sum.total + v.total }), {
    correct: 0,
    total: 0,
  })
}

async function friendSummary(db: D1Database, meId: string, friend: { id: string; nickname: string }) {
  const [mine, theirs] = await Promise.all([weeklyFor(db, meId), weeklyFor(db, friend.id)])
  const weekKeys = recentWeeks(Date.now(), WEEKS_BACK)
  const thisWeek = weekKeys[weekKeys.length - 1]
  const lastWeek = weekKeys[weekKeys.length - 2]

  return {
    id: friend.id,
    name: friend.nickname,
    thisWeek: theirs.get(thisWeek) ?? { correct: 0, total: 0 },
    lastWeek: theirs.get(lastWeek) ?? { correct: 0, total: 0 },
    accumulated: accumulate(theirs),
    myAccumulated: accumulate(mine),
    weeks: weekKeys.map((week) => ({ week, me: ratio(mine.get(week)), friend: ratio(theirs.get(week)) })),
  }
}

api.get('/friends', async (c) => {
  const userId = c.get('userId')
  const rows = await c.env.DB.prepare(
    'SELECT u.id, u.nickname FROM friends f JOIN users u ON u.id = f.friend_id WHERE f.user_id = ? ORDER BY u.nickname',
  )
    .bind(userId)
    .all<{ id: string; nickname: string }>()

  const friends = []
  for (const row of rows.results ?? []) {
    friends.push(await friendSummary(c.env.DB, userId, row))
  }
  return c.json({ friends })
})

api.post('/friends', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json<{ nickname?: string; code?: string }>().catch(() => ({}) as { nickname?: string; code?: string })

  let friend: { id: string; nickname: string } | null = null

  if (body.nickname) {
    const name = validateNickname(body.nickname)
    if (!name.ok) return c.json({ error: name.error }, 400)
    friend = await c.env.DB.prepare('SELECT id, nickname FROM users WHERE nickname_key = ?')
      .bind(name.key)
      .first<{ id: string; nickname: string }>()
  } else if (body.code) {
    friend = await c.env.DB.prepare('SELECT id, nickname FROM users WHERE friend_code = ?')
      .bind(body.code.trim().toUpperCase())
      .first<{ id: string; nickname: string }>()
  } else {
    return c.json({ error: 'Oppgi et nickname' }, 400)
  }

  if (!friend) return c.json({ error: 'Fant ingen med det navnet' }, 404)
  if (friend.id === userId) return c.json({ error: 'Det er deg selv' }, 400)

  const now = Date.now()
  await c.env.DB.batch([
    c.env.DB.prepare('INSERT OR IGNORE INTO friends (user_id, friend_id, created_at) VALUES (?, ?, ?)').bind(userId, friend.id, now),
    c.env.DB.prepare('INSERT OR IGNORE INTO friends (user_id, friend_id, created_at) VALUES (?, ?, ?)').bind(friend.id, userId, now),
  ])

  return c.json({ friend: await friendSummary(c.env.DB, userId, friend) })
})

api.delete('/friends/:id', async (c) => {
  const userId = c.get('userId')
  const friendId = c.req.param('id')
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM friends WHERE user_id = ? AND friend_id = ?').bind(userId, friendId),
    c.env.DB.prepare('DELETE FROM friends WHERE user_id = ? AND friend_id = ?').bind(friendId, userId),
  ])
  return c.json({ ok: true })
})

/* --------------------------------------------------------------- toppliste */

/**
 * Rangering på **antall riktige svar**, ikke på treffprosent alene – ellers
 * vinner den som spiller minst. Treffprosenten følger med, så begge deler er
 * synlige.
 *
 * `scope=friends` tar med deg selv og vennene dine, også de som ikke har spilt
 * i perioden; da står de med null svar og tom treffprosent. `scope=all` er den
 * åpne lista, og der kreves et minste antall besvarte spørsmål for å komme med.
 */
type Period = 'week' | 'all'
type Scope = 'friends' | 'all'

/**
 * Minstekrav for den åpne lista: én fullført runde. Vennelista har ingen
 * terskel – der skal alle du har koblet deg til være med, også de som ikke har
 * spilt i perioden.
 */
const MIN_ANSWERS: Record<Period, number> = { week: 10, all: 10 }

interface BoardRow {
  id: string
  name: string
  correct: number
  total: number
}

api.get('/leaderboard', async (c) => {
  const userId = c.get('userId')
  const scope: Scope = c.req.query('scope') === 'all' ? 'all' : 'friends'
  const period: Period = c.req.query('period') === 'all' ? 'all' : 'week'
  const week = isoWeek(Date.now())
  const minAnswers = scope === 'all' ? MIN_ANSWERS[period] : 0

  let rows: { results?: BoardRow[] }

  if (scope === 'friends') {
    // LEFT JOIN, slik at venner uten spilte runder også kommer med.
    const joinFilter = period === 'week' ? 'AND s.iso_week = ?2' : ''
    const sql = `
      SELECT u.id,
             u.nickname AS name,
             COALESCE(SUM(s.correct), 0) AS correct,
             COALESCE(SUM(s.total), 0)   AS total
        FROM users u
        LEFT JOIN sessions s ON s.user_id = u.id ${joinFilter}
       WHERE u.id = ?1
          OR u.id IN (SELECT friend_id FROM friends WHERE user_id = ?1)
       GROUP BY u.id
       ORDER BY correct DESC, total ASC, name ASC
    `
    rows = await (period === 'week'
      ? c.env.DB.prepare(sql).bind(userId, week)
      : c.env.DB.prepare(sql).bind(userId)
    ).all<BoardRow>()
  } else {
    // HAVING må gjenta SUM(s.total). Med `HAVING total >= ?` treffer SQLite
    // kolonnen sessions.total i stedet for aliaset, og den som har flere korte
    // runder faller urettmessig ut av lista.
    const whereFilter = period === 'week' ? 'WHERE s.iso_week = ?1' : ''
    const sql = `
      SELECT u.id,
             u.nickname AS name,
             SUM(s.correct) AS correct,
             SUM(s.total)   AS total
        FROM users u
        JOIN sessions s ON s.user_id = u.id
        ${whereFilter}
       GROUP BY u.id
      HAVING SUM(s.total) >= ${period === 'week' ? '?2' : '?1'}
       ORDER BY SUM(s.correct) DESC, SUM(s.total) ASC, name ASC
       LIMIT 50
    `
    rows = await (period === 'week'
      ? c.env.DB.prepare(sql).bind(week, minAnswers)
      : c.env.DB.prepare(sql).bind(minAnswers)
    ).all<BoardRow>()
  }

  const entries = (rows.results ?? []).map((r, i) => ({
    id: r.id,
    rank: i + 1,
    name: r.name,
    correct: r.correct,
    total: r.total,
    pct: r.total === 0 ? null : Math.round((r.correct / r.total) * 100),
    me: r.id === userId,
  }))

  return c.json({ scope, period, minAnswers, entries })
})

/* --------------------------------------------------- tilbakemeldinger */

/**
 * Tommel opp/ned på enkeltspørsmål. Én rad per (bruker, spørsmål) – stemmer du
 * på nytt, erstattes den forrige. Selve spørsmålsteksten ligger i `content/` og
 * kommer aldri hit; oversikten slår opp teksten i nettleseren, slik at
 * rapporten alltid viser gjeldende ordlyd selv om spørsmålet er redigert.
 */

const QUESTION_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/
const FEEDBACK_REASONS = ['feil', 'uklart', 'lekker', 'nivaa', 'hint', 'kjedelig', 'annet']
const COMMENT_MAX = 400
/** Tak per forespørsel, så en lang utboks ikke sprenger én runde. */
const FEEDBACK_BATCH_MAX = 100

interface FeedbackPayload {
  questionId?: unknown
  vote?: unknown
  reason?: unknown
  comment?: unknown
  category?: unknown
  difficulty?: unknown
  lang?: unknown
  updatedAt?: unknown
}

interface CleanFeedback {
  questionId: string
  vote: 1 | -1
  reason: string | null
  comment: string | null
  category: string
  difficulty: string
  lang: string
  updatedAt: number
}

function shortText(raw: unknown, max: number): string {
  return typeof raw === 'string' ? raw.trim().slice(0, max) : ''
}

/** Returnerer null for alt som ikke er en gyldig stemme – ugyldige rader hoppes over. */
function cleanFeedback(raw: FeedbackPayload): CleanFeedback | null {
  const questionId = shortText(raw.questionId, 64)
  if (!QUESTION_ID_PATTERN.test(questionId)) return null

  const vote = raw.vote === 'opp' ? 1 : raw.vote === 'ned' ? -1 : null
  if (vote === null) return null

  // Grunn hører bare til tommel ned; en grunn på tommel opp forkastes stille.
  const reasonRaw = shortText(raw.reason, 32)
  const reason = vote === -1 && FEEDBACK_REASONS.includes(reasonRaw) ? reasonRaw : null

  const comment = shortText(raw.comment, COMMENT_MAX) || null

  const at = typeof raw.updatedAt === 'number' && Number.isFinite(raw.updatedAt) ? raw.updatedAt : Date.now()
  // Klokka på enheten kan gå feil; en stemme fra framtida ville låst toppen av
  // «sist endret»-lista for alltid.
  const updatedAt = Math.min(Math.max(at, 0), Date.now())

  return {
    questionId,
    vote,
    reason,
    comment,
    category: shortText(raw.category, 40),
    difficulty: shortText(raw.difficulty, 20),
    lang: raw.lang === 'sv' ? 'sv' : 'nb',
    updatedAt,
  }
}

function voteWord(vote: number): 'opp' | 'ned' {
  return vote === 1 ? 'opp' : 'ned'
}

api.post('/feedback', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json<{ items?: FeedbackPayload[] }>().catch(() => ({}) as { items?: FeedbackPayload[] })
  const raw = body.items ?? []
  if (raw.length > FEEDBACK_BATCH_MAX) return c.json({ error: 'For mange tilbakemeldinger i én forespørsel' }, 400)

  const items = raw.map(cleanFeedback).filter((v): v is CleanFeedback => v !== null)
  if (items.length === 0) return c.json({ saved: 0 })

  const now = Date.now()
  for (const f of items) {
    await c.env.DB.prepare(
      `INSERT INTO question_feedback
         (user_id, question_id, vote, reason, comment, category, difficulty, lang, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (user_id, question_id) DO UPDATE SET
         vote = excluded.vote,
         reason = excluded.reason,
         comment = excluded.comment,
         category = excluded.category,
         difficulty = excluded.difficulty,
         lang = excluded.lang,
         updated_at = excluded.updated_at`,
    )
      .bind(userId, f.questionId, f.vote, f.reason, f.comment, f.category, f.difficulty, f.lang, now, f.updatedAt)
      .run()
  }

  return c.json({ saved: items.length })
})

api.delete('/feedback/:questionId', async (c) => {
  await c.env.DB.prepare('DELETE FROM question_feedback WHERE user_id = ? AND question_id = ?')
    .bind(c.get('userId'), c.req.param('questionId'))
    .run()
  return c.json({ ok: true })
})

/** Egne stemmer, så en ny enhet får med seg det man allerede har ment. */
api.get('/feedback/mine', async (c) => {
  const rows = await c.env.DB.prepare(
    'SELECT question_id, vote, reason, comment, updated_at FROM question_feedback WHERE user_id = ?',
  )
    .bind(c.get('userId'))
    .all<{ question_id: string; vote: number; reason: string | null; comment: string | null; updated_at: number }>()

  return c.json({
    items: (rows.results ?? []).map((r) => ({
      questionId: r.question_id,
      vote: voteWord(r.vote),
      reason: r.reason,
      comment: r.comment,
      updatedAt: r.updated_at,
    })),
  })
})

type FeedbackSort = 'verst' | 'best' | 'flest' | 'nyest'

const FEEDBACK_ORDER: Record<FeedbackSort, string> = {
  // Verst først: lavest score, og ved likhet den med flest tommel ned.
  verst: 'score ASC, down DESC, last_at DESC',
  best: 'score DESC, up DESC, last_at DESC',
  flest: 'votes DESC, score ASC, last_at DESC',
  nyest: 'last_at DESC',
}

const FEEDBACK_LIMIT = 200

/**
 * Sammenstilling for oversikten. Åpen for alle innloggede, men kommentarer og
 * grunner leveres uten avsender – dette er et redaksjonsverktøy for
 * spørsmålene, ikke en oversikt over hvem som mener hva.
 */
api.get('/feedback/summary', async (c) => {
  const sortParam = c.req.query('sort')
  const sort: FeedbackSort = sortParam === 'best' || sortParam === 'flest' || sortParam === 'nyest' ? sortParam : 'verst'
  const category = shortText(c.req.query('category'), 40)
  const difficulty = shortText(c.req.query('difficulty'), 20)

  const filters: string[] = []
  const args: (string | number)[] = []
  if (category) {
    filters.push('category = ?')
    args.push(category)
  }
  if (difficulty) {
    filters.push('difficulty = ?')
    args.push(difficulty)
  }
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : ''

  // D1 liker ikke `.bind()` uten argumenter, så filterløse spørringer sendes rå.
  const aggSql = `SELECT question_id,
            MAX(category)   AS category,
            MAX(difficulty) AS difficulty,
            SUM(CASE WHEN vote =  1 THEN 1 ELSE 0 END) AS up,
            SUM(CASE WHEN vote = -1 THEN 1 ELSE 0 END) AS down,
            SUM(vote)       AS score,
            COUNT(*)        AS votes,
            MAX(updated_at) AS last_at
       FROM question_feedback
       ${where}
      GROUP BY question_id
      ORDER BY ${FEEDBACK_ORDER[sort]}
      LIMIT ${FEEDBACK_LIMIT}`

  const aggStmt = c.env.DB.prepare(aggSql)
  const agg = await (args.length ? aggStmt.bind(...args) : aggStmt)
    .all<{
      question_id: string
      category: string
      difficulty: string
      up: number
      down: number
      score: number
      votes: number
      last_at: number
    }>()

  const rows = agg.results ?? []
  const ids = rows.map((r) => r.question_id)

  const reasonsByQuestion = new Map<string, { reason: string; count: number }[]>()
  const commentsByQuestion = new Map<string, { text: string; vote: 'opp' | 'ned'; at: number }[]>()

  if (ids.length > 0) {
    const holes = ids.map(() => '?').join(', ')

    const reasons = await c.env.DB.prepare(
      `SELECT question_id, reason, COUNT(*) AS n
         FROM question_feedback
        WHERE reason IS NOT NULL AND question_id IN (${holes})
        GROUP BY question_id, reason
        ORDER BY n DESC`,
    )
      .bind(...ids)
      .all<{ question_id: string; reason: string; n: number }>()

    for (const r of reasons.results ?? []) {
      const list = reasonsByQuestion.get(r.question_id) ?? []
      list.push({ reason: r.reason, count: r.n })
      reasonsByQuestion.set(r.question_id, list)
    }

    const comments = await c.env.DB.prepare(
      `SELECT question_id, comment, vote, updated_at
         FROM question_feedback
        WHERE comment IS NOT NULL AND comment != '' AND question_id IN (${holes})
        ORDER BY updated_at DESC`,
    )
      .bind(...ids)
      .all<{ question_id: string; comment: string; vote: number; updated_at: number }>()

    for (const r of comments.results ?? []) {
      const list = commentsByQuestion.get(r.question_id) ?? []
      // Fem nyeste per spørsmål holder til å se mønsteret; resten hentes med
      // `npm run content:feedback`.
      if (list.length < 5) list.push({ text: r.comment, vote: voteWord(r.vote), at: r.updated_at })
      commentsByQuestion.set(r.question_id, list)
    }
  }

  const totals = await c.env.DB.prepare(
    `SELECT COUNT(*) AS votes,
            COUNT(DISTINCT question_id) AS questions,
            SUM(CASE WHEN vote =  1 THEN 1 ELSE 0 END) AS up,
            SUM(CASE WHEN vote = -1 THEN 1 ELSE 0 END) AS down
       FROM question_feedback`,
  ).first<{ votes: number; questions: number; up: number; down: number }>()

  return c.json({
    sort,
    totals: {
      votes: totals?.votes ?? 0,
      questions: totals?.questions ?? 0,
      up: totals?.up ?? 0,
      down: totals?.down ?? 0,
    },
    rows: rows.map((r) => ({
      questionId: r.question_id,
      category: r.category,
      difficulty: r.difficulty,
      up: r.up,
      down: r.down,
      score: r.score,
      reasons: reasonsByQuestion.get(r.question_id) ?? [],
      comments: commentsByQuestion.get(r.question_id) ?? [],
      lastAt: r.last_at,
    })),
  })
})

api.get('/health', (c) => c.json({ ok: true, app: c.env.APP_NAME }))

app.route('/api', api)
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw))

export default app
