import { beforeEach, describe, expect, it } from 'vitest'
import app from '../index'
import { makeEnv } from './d1'

let env: ReturnType<typeof makeEnv>

beforeEach(() => {
  env = makeEnv()
})

const DAY = 24 * 60 * 60 * 1000

async function post<T>(path: string, body: unknown, token?: string): Promise<{ status: number; body: T }> {
  const res = await app.request(
    path,
    {
      method: 'POST',
      body: JSON.stringify(body),
      headers: token ? { authorization: `Bearer ${token}` } : {},
    },
    env,
  )
  return { status: res.status, body: (await res.json()) as T }
}

async function get<T>(path: string, token?: string): Promise<{ status: number; body: T }> {
  const res = await app.request(path, { headers: token ? { authorization: `Bearer ${token}` } : {} }, env)
  return { status: res.status, body: (await res.json()) as T }
}

interface Account {
  userId: string
  token: string
  displayName: string
  friendCode: string
}

async function newAccount(displayName: string): Promise<Account> {
  const res = await post<Account>('/api/account', { displayName })
  expect(res.status).toBe(200)
  return res.body
}

/** Spiller én runde: `total` spørsmål, `correct` riktige, avsluttet på `at`. */
async function play(token: string, id: string, correct: number, total: number, at = Date.now()) {
  const answers = Array.from({ length: total }, (_, i) => ({
    questionId: `${id}-q${i}`,
    correct: i < correct,
    hintsUsed: 0,
    topics: ['historie'],
  }))
  const res = await post<{ saved: number }>(
    '/api/sessions',
    { sessions: [{ id, category: 'storm', difficulty: 'lett', region: 'no', startedAt: at - 1000, finishedAt: at, answers }] },
    token,
  )
  expect(res.body.saved).toBe(1)
}

describe('autentisering', () => {
  it('avviser kall uten nøkkel', async () => {
    const res = await get<{ error: string }>('/api/account/me')
    expect(res.status).toBe(401)
  })

  it('avviser ukjent nøkkel', async () => {
    const res = await get<{ error: string }>('/api/account/me', 'ikke-en-ekte-nøkkel')
    expect(res.status).toBe(401)
  })

  it('slipper gjennom med riktig nøkkel', async () => {
    const me = await newAccount('Rune')
    const res = await get<Account>('/api/account/me', me.token)
    expect(res.status).toBe(200)
    expect(res.body.displayName).toBe('Rune')
    expect(res.body.friendCode).toBe(me.friendCode)
  })
})

describe('konto', () => {
  it('lager konto med nøkkel og vennekode', async () => {
    const me = await newAccount('Rune')
    expect(me.token).toHaveLength(64)
    expect(me.friendCode).toMatch(/^[A-Z2-9]{8}$/)
    expect(me.friendCode).not.toMatch(/[IO01]/)
  })

  it('faller tilbake på et standardnavn når navnet er tomt', async () => {
    const res = await post<Account>('/api/account', { displayName: '   ' })
    expect(res.body.displayName).toBe('Spiller')
  })

  it('bytter visningsnavn', async () => {
    const me = await newAccount('Rune')
    const patched = await app.request(
      '/api/account',
      { method: 'PATCH', body: JSON.stringify({ displayName: 'Rune B' }), headers: { authorization: `Bearer ${me.token}` } },
      env,
    )
    expect(patched.status).toBe(200)
    const after = await get<Account>('/api/account/me', me.token)
    expect(after.body.displayName).toBe('Rune B')
  })

  it('nekter å sette et tomt visningsnavn', async () => {
    const me = await newAccount('Rune')
    const res = await app.request(
      '/api/account',
      { method: 'PATCH', body: JSON.stringify({ displayName: '  ' }), headers: { authorization: `Bearer ${me.token}` } },
      env,
    )
    expect(res.status).toBe(400)
  })

  it('sletter kontoen og alt som henger på den', async () => {
    const me = await newAccount('Rune')
    await play(me.token, 's1', 8, 10)

    const del = await app.request(
      '/api/account',
      { method: 'DELETE', headers: { authorization: `Bearer ${me.token}` } },
      env,
    )
    expect(del.status).toBe(200)

    // Nøkkelen skal ikke lenger virke, og statistikken skal være borte.
    expect((await get('/api/account/me', me.token)).status).toBe(401)
    const rows = await env.DB.prepare('SELECT COUNT(*) AS n FROM sessions').first<{ n: number }>()
    expect(rows?.n).toBe(0)
  })
})

describe('venner', () => {
  it('er gjensidig', async () => {
    const a = await newAccount('Rune')
    const b = await newAccount('Kari')

    const added = await post<{ friend: { name: string } }>('/api/friends', { code: b.friendCode }, a.token)
    expect(added.status).toBe(200)
    expect(added.body.friend.name).toBe('Kari')

    const fromB = await get<{ friends: { name: string }[] }>('/api/friends', b.token)
    expect(fromB.body.friends.map((f) => f.name)).toEqual(['Rune'])
  })

  it('avviser din egen kode og ukjente koder', async () => {
    const a = await newAccount('Rune')
    expect((await post('/api/friends', { code: a.friendCode }, a.token)).status).toBe(400)
    expect((await post('/api/friends', { code: 'ZZZZZZZZ' }, a.token)).status).toBe(404)
  })
})

interface Board {
  entries: { rank: number; name: string; correct: number; total: number; pct: number | null; me: boolean }[]
  minAnswers: number
}

describe('toppliste', () => {
  it('rangerer på antall riktige, ikke på treffprosent alene', async () => {
    const a = await newAccount('Rune')
    const b = await newAccount('Kari')
    await post('/api/friends', { code: b.friendCode }, a.token)

    await play(a.token, 'a1', 15, 20) // 75 %, 15 riktige
    await play(b.token, 'b1', 9, 10) // 90 %, 9 riktige

    const board = await get<Board>('/api/leaderboard?scope=friends&period=week', a.token)
    expect(board.body.entries.map((e) => e.name)).toEqual(['Rune', 'Kari'])
    expect(board.body.entries[0].pct).toBe(75)
  })

  it('markerer deg selv, også når du ligger nederst', async () => {
    const a = await newAccount('Rune')
    const b = await newAccount('Kari')
    await post('/api/friends', { code: b.friendCode }, a.token)
    await play(b.token, 'b1', 9, 10)

    const board = await get<Board>('/api/leaderboard?scope=friends&period=week', a.token)
    const me = board.body.entries.find((e) => e.me)
    expect(me?.name).toBe('Rune')
    expect(me?.total).toBe(0)
    expect(me?.pct).toBeNull()
  })

  it('tar med venner uten spilte runder', async () => {
    const a = await newAccount('Rune')
    const b = await newAccount('Kari')
    await post('/api/friends', { code: b.friendCode }, a.token)

    const board = await get<Board>('/api/leaderboard?scope=friends&period=week', a.token)
    expect(board.body.entries).toHaveLength(2)
  })

  // Regresjon: `HAVING total >= ?` traff kolonnen sessions.total i stedet for
  // aliaset SUM(s.total), så flere korte runder falt ut av den globale lista.
  it('summerer flere korte runder opp mot minstevolumet', async () => {
    const a = await newAccount('Rune')
    await play(a.token, 'a1', 1, 1)
    await play(a.token, 'a2', 9, 10)

    const board = await get<Board>('/api/leaderboard?scope=all&period=week', a.token)
    expect(board.body.entries.map((e) => e.name)).toEqual(['Rune'])
    expect(board.body.entries[0].correct).toBe(10)
    expect(board.body.entries[0].total).toBe(11)
  })

  it('holder spillere under minstevolumet utenfor den globale lista', async () => {
    const a = await newAccount('Rune')
    await play(a.token, 'a1', 3, 3)

    const board = await get<Board>('/api/leaderboard?scope=all&period=week', a.token)
    expect(board.body.minAnswers).toBe(10)
    expect(board.body.entries).toHaveLength(0)
  })

  it('skiller mellom denne uken og totalt', async () => {
    const a = await newAccount('Rune')
    await play(a.token, 'gammel', 12, 12, Date.now() - 21 * DAY)

    const week = await get<Board>('/api/leaderboard?scope=all&period=week', a.token)
    expect(week.body.entries).toHaveLength(0)

    const all = await get<Board>('/api/leaderboard?scope=all&period=all', a.token)
    expect(all.body.entries.map((e) => e.name)).toEqual(['Rune'])
  })

  it('krever innlogging', async () => {
    expect((await get('/api/leaderboard?scope=all&period=week')).status).toBe(401)
  })
})

describe('økter', () => {
  it('teller ikke samme økt to ganger', async () => {
    const me = await newAccount('Rune')
    await play(me.token, 's1', 8, 10)
    await play(me.token, 's1', 8, 10)

    const board = await get<Board>('/api/leaderboard?scope=friends&period=all', me.token)
    expect(board.body.entries[0].total).toBe(10)
  })
})
