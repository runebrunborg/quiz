/**
 * Theme Quiz – Cloudflare Worker.
 *
 * Serverer det statiske frontend-bygget og et lite JSON-API på /api for
 * synkronisering av resultater, statistikk og vennesammenligning.
 *
 * Autentisering er bevisst enkel: hver konto får en tilfeldig 32-byte nøkkel
 * («gjenopprettingsnøkkel») som sendes som Bearer-token. Serveren lagrer bare
 * SHA-256 av nøkkelen. Ingen e-post, ingen passord, ingen personopplysninger
 * utover et visningsnavn brukeren velger selv.
 */
import { Hono } from 'hono'
import type { MiddlewareHandler } from 'hono'
import { isoDay, isoWeek, recentWeeks } from '../shared/time'

export interface Env {
  DB: D1Database
  ASSETS: Fetcher
  APP_NAME: string
}

type Vars = { userId: string; displayName: string; friendCode: string }

const app = new Hono<{ Bindings: Env; Variables: Vars }>()

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

/** Vennekode: 8 tegn uten lett forvekslede bokstaver (ingen I, O, 0, 1). */
function friendCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const buf = new Uint8Array(8)
  crypto.getRandomValues(buf)
  return [...buf].map((b) => alphabet[b % alphabet.length]).join('')
}

const api = new Hono<{ Bindings: Env; Variables: Vars }>()

/** Krever gyldig Bearer-token og legger brukeren på context. */
const auth: MiddlewareHandler<{ Bindings: Env; Variables: Vars }> = async (c, next) => {
  const header = c.req.header('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token) return c.json({ error: 'Mangler nøkkel' }, 401)

  const row = await c.env.DB.prepare('SELECT id, display_name, friend_code FROM users WHERE token_hash = ?')
    .bind(await sha256(token))
    .first<{ id: string; display_name: string; friend_code: string }>()

  if (!row) return c.json({ error: 'Ukjent nøkkel' }, 401)
  c.set('userId', row.id)
  c.set('displayName', row.display_name)
  c.set('friendCode', row.friend_code)
  await next()
}

api.use('/account/me', auth)
api.use('/sessions', auth)
api.use('/me/*', auth)
api.use('/friends', auth)
api.use('/friends/*', auth)

/* -------------------------------------------------------------------- konto */

api.post('/account', async (c) => {
  const body = await c.req.json<{ displayName?: string }>().catch(() => ({}) as { displayName?: string })
  const displayName = (body.displayName ?? '').trim().slice(0, 40) || 'Spiller'

  const id = crypto.randomUUID()
  const token = randomHex(32)
  const code = friendCode()

  await c.env.DB.prepare(
    'INSERT INTO users (id, display_name, friend_code, token_hash, created_at) VALUES (?, ?, ?, ?, ?)',
  )
    .bind(id, displayName, code, await sha256(token), Date.now())
    .run()

  return c.json({ userId: id, token, displayName, friendCode: code })
})

api.get('/account/me', (c) =>
  c.json({
    userId: c.get('userId'),
    token: '',
    displayName: c.get('displayName'),
    friendCode: c.get('friendCode'),
  }),
)

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
    await c.env.DB.prepare('DELETE FROM answer_topics WHERE answer_id IN (SELECT id FROM answers WHERE session_id = ? AND user_id = ?)')
      .bind(s.id, userId)
      .run()
    await c.env.DB.prepare('DELETE FROM answers WHERE session_id = ? AND user_id = ?').bind(s.id, userId).run()
    await c.env.DB.prepare('DELETE FROM sessions WHERE id = ? AND user_id = ?').bind(s.id, userId).run()

    await c.env.DB.prepare(
      `INSERT INTO sessions (id, user_id, category, difficulty, region, started_at, finished_at, iso_day, iso_week, correct, total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        s.id,
        userId,
        s.category,
        s.difficulty,
        s.region,
        s.startedAt,
        finishedAt,
        day,
        week,
        correct,
        s.answers.length,
      )
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

/* ----------------------------------------------------------------- venner */

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

async function friendSummary(db: D1Database, meId: string, friend: { id: string; display_name: string }) {
  const [mine, theirs] = await Promise.all([weeklyFor(db, meId), weeklyFor(db, friend.id)])
  const weekKeys = recentWeeks(Date.now(), WEEKS_BACK)
  const thisWeek = weekKeys[weekKeys.length - 1]
  const lastWeek = weekKeys[weekKeys.length - 2]

  const acc = (map: Map<string, { correct: number; total: number }>) =>
    [...map.values()].reduce((sum, v) => ({ correct: sum.correct + v.correct, total: sum.total + v.total }), {
      correct: 0,
      total: 0,
    })

  return {
    id: friend.id,
    name: friend.display_name,
    thisWeek: theirs.get(thisWeek) ?? { correct: 0, total: 0 },
    lastWeek: theirs.get(lastWeek) ?? { correct: 0, total: 0 },
    accumulated: acc(theirs),
    myAccumulated: acc(mine),
    weeks: weekKeys.map((week) => ({
      week,
      me: ratio(mine.get(week)),
      friend: ratio(theirs.get(week)),
    })),
  }
}

api.get('/friends', async (c) => {
  const userId = c.get('userId')
  const rows = await c.env.DB.prepare(
    'SELECT u.id, u.display_name FROM friends f JOIN users u ON u.id = f.friend_id WHERE f.user_id = ? ORDER BY u.display_name',
  )
    .bind(userId)
    .all<{ id: string; display_name: string }>()

  const friends = []
  for (const row of rows.results ?? []) {
    friends.push(await friendSummary(c.env.DB, userId, row))
  }
  return c.json({ friends })
})

api.post('/friends', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json<{ code?: string }>().catch(() => ({}) as { code?: string })
  const code = (body.code ?? '').trim().toUpperCase()
  if (!code) return c.json({ error: 'Mangler vennekode' }, 400)

  const friend = await c.env.DB.prepare('SELECT id, display_name FROM users WHERE friend_code = ?')
    .bind(code)
    .first<{ id: string; display_name: string }>()

  if (!friend) return c.json({ error: 'Fant ingen med den koden' }, 404)
  if (friend.id === userId) return c.json({ error: 'Det er din egen kode' }, 400)

  const now = Date.now()
  // Vennskap er gjensidig – begge får se hverandres uketall.
  await c.env.DB.batch([
    c.env.DB.prepare('INSERT OR IGNORE INTO friends (user_id, friend_id, created_at) VALUES (?, ?, ?)').bind(
      userId,
      friend.id,
      now,
    ),
    c.env.DB.prepare('INSERT OR IGNORE INTO friends (user_id, friend_id, created_at) VALUES (?, ?, ?)').bind(
      friend.id,
      userId,
      now,
    ),
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

api.get('/health', (c) => c.json({ ok: true, app: c.env.APP_NAME }))

app.route('/api', api)

// Alt annet er frontend-bygget.
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw))

export default app
