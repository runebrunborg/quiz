/**
 * Theme Quiz – Cloudflare Worker.
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
    return { ok: false, error: `Fødselsår må være mellom ${MIN_YEAR} og ${newest}. Aldersgrensen for Theme Quiz er ${MAX_AGE_ISH} år.` }
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

/** Færre besvarte spørsmål enn dette, og man er ikke med – ellers vinner den som har svart på tre. */
const LEADERBOARD_MINIMUM = 30

api.get('/leaderboard', async (c) => {
  const userId = c.get('userId')
  const period = c.req.query('period') === 'week' ? 'week' : 'all'
  const week = isoWeek(Date.now())

  const base = `
    SELECT u.id, u.nickname, u.country,
           SUM(s.correct) AS correct,
           SUM(s.total)   AS total
      FROM sessions s
      JOIN users u ON u.id = s.user_id
     WHERE s.total > 0 ${period === 'week' ? 'AND s.iso_week = ?' : ''}
     GROUP BY u.id
    HAVING total >= ?
     ORDER BY (CAST(SUM(s.correct) AS REAL) / SUM(s.total)) DESC, total DESC
  `

  const minimum = period === 'week' ? 10 : LEADERBOARD_MINIMUM
  const stmt =
    period === 'week'
      ? c.env.DB.prepare(`${base} LIMIT 100`).bind(week, minimum)
      : c.env.DB.prepare(`${base} LIMIT 100`).bind(minimum)

  const rows = await stmt.all<{ id: string; nickname: string; country: string | null; correct: number; total: number }>()
  const list = (rows.results ?? []).map((r, i) => ({
    rank: i + 1,
    nickname: r.nickname,
    country: r.country,
    correct: r.correct,
    total: r.total,
    accuracy: Math.round((r.correct / r.total) * 100),
    isMe: r.id === userId,
  }))

  const mine = list.find((r) => r.isMe) ?? null
  return c.json({ period, minimum, entries: list, me: mine })
})

api.get('/health', (c) => c.json({ ok: true, app: c.env.APP_NAME }))

app.route('/api', api)
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw))

export default app
