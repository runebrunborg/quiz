import { beforeEach, describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
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
  nickname: string
  friendCode: string
  birthYear: number | null
  country: string | null
}

/**
 * Nøkkelen serveren mottar er resultatet av PBKDF2 i nettleseren – 64 hex-tegn.
 * Testene trenger ikke den ekte utledningen, bare noe deterministisk i riktig
 * format, så passordet hashes én gang her.
 */
function passwordKey(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

async function newAccount(nickname: string, password = 'et-godt-passord'): Promise<Account> {
  const res = await post<Account>('/api/account/register', { nickname, passwordKey: passwordKey(password) })
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
    expect(res.body.nickname).toBe('Rune')
    expect(res.body.friendCode).toBe(me.friendCode)
  })
})

describe('konto', () => {
  it('lager konto med nickname, nøkkel og vennekode', async () => {
    const me = await newAccount('Rune')
    expect(me.nickname).toBe('Rune')
    expect(me.token).toMatch(/^[0-9a-f]{64}$/)
    expect(me.friendCode).toMatch(/^[A-Z2-9]{8}$/)
  })

  it('krever at nicknamet er ledig, uansett skrivemåte', async () => {
    await newAccount('Rune')
    const again = await post('/api/account/register', { nickname: 'r u n e', passwordKey: passwordKey('noe-annet') })
    expect(again.status).toBe(409)
  })

  it('avviser for korte nicknames og passord i feil format', async () => {
    expect((await post('/api/account/register', { nickname: 'R', passwordKey: passwordKey('x') })).status).toBe(400)
    expect((await post('/api/account/register', { nickname: 'Rune', passwordKey: 'ikke-hex' })).status).toBe(400)
  })

  it('sier om et nickname er ledig', async () => {
    await newAccount('Rune')
    expect((await get<{ available: boolean }>('/api/account/available?nickname=Rune')).body.available).toBe(false)
    expect((await get<{ available: boolean }>('/api/account/available?nickname=Kari')).body.available).toBe(true)
  })

  it('logger inn fra en ny enhet med samme passord', async () => {
    const first = await newAccount('Rune', 'hemmelig-passord')
    const second = await post<Account>('/api/account/login', {
      nickname: 'rune',
      passwordKey: passwordKey('hemmelig-passord'),
    })
    expect(second.status).toBe(200)
    expect(second.body.token).not.toBe(first.token)
    expect((await get('/api/account/me', second.body.token)).status).toBe(200)
  })

  it('avviser feil passord', async () => {
    await newAccount('Rune', 'hemmelig-passord')
    const res = await post('/api/account/login', { nickname: 'Rune', passwordKey: passwordKey('feil-passord') })
    expect(res.status).toBe(401)
  })

  it('tar imot fødselsår og land, og lar dem fjernes igjen', async () => {
    const res = await post<Account>('/api/account/register', {
      nickname: 'Rune',
      passwordKey: passwordKey('et-godt-passord'),
      birthYear: 1980,
      country: 'NO',
    })
    expect(res.body.birthYear).toBe(1980)
    expect(res.body.country).toBe('NO')

    const cleared = await app.request(
      '/api/account/me',
      {
        method: 'PATCH',
        body: JSON.stringify({ birthYear: null, country: null }),
        headers: { authorization: `Bearer ${res.body.token}` },
      },
      env,
    )
    expect(cleared.status).toBe(200)
    expect((await get<Account>('/api/account/me', res.body.token)).body.birthYear).toBeNull()
  })

  it('håndhever aldersgrensen på 13 år', async () => {
    const tooYoung = new Date().getUTCFullYear() - 5
    const res = await post('/api/account/register', {
      nickname: 'Rune',
      passwordKey: passwordKey('et-godt-passord'),
      birthYear: tooYoung,
    })
    expect(res.status).toBe(400)
  })

  it('logger ut andre enheter når passordet byttes', async () => {
    const first = await newAccount('Rune', 'gammelt-passord')
    const second = await post<Account>('/api/account/login', {
      nickname: 'Rune',
      passwordKey: passwordKey('gammelt-passord'),
    })

    const changed = await post(
      '/api/account/password',
      { currentPasswordKey: passwordKey('gammelt-passord'), newPasswordKey: passwordKey('nytt-passord') },
      second.body.token,
    )
    expect(changed.status).toBe(200)
    expect((await get('/api/account/me', second.body.token)).status).toBe(200)
    expect((await get('/api/account/me', first.token)).status).toBe(401)
  })

  it('logger ut bare denne enheten', async () => {
    const first = await newAccount('Rune')
    const second = await post<Account>('/api/account/login', {
      nickname: 'Rune',
      passwordKey: passwordKey('et-godt-passord'),
    })
    expect((await post('/api/account/logout', {}, first.token)).status).toBe(200)
    expect((await get('/api/account/me', first.token)).status).toBe(401)
    expect((await get('/api/account/me', second.body.token)).status).toBe(200)
  })

  it('sletter kontoen og alt som henger på den, og frigjør nicknamet', async () => {
    const me = await newAccount('Rune')
    await play(me.token, 's1', 8, 10)

    const del = await app.request(
      '/api/account/me',
      { method: 'DELETE', headers: { authorization: `Bearer ${me.token}` } },
      env,
    )
    expect(del.status).toBe(200)
    expect((await get('/api/account/me', me.token)).status).toBe(401)
    expect((await get<{ available: boolean }>('/api/account/available?nickname=Rune')).body.available).toBe(true)
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

  it('kan legges til på nickname, ikke bare kode', async () => {
    const a = await newAccount('Rune')
    await newAccount('Kari')
    const added = await post<{ friend: { name: string } }>('/api/friends', { nickname: 'kari' }, a.token)
    expect(added.status).toBe(200)
    expect(added.body.friend.name).toBe('Kari')
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

describe('tilbakemeldinger', () => {
  interface Summary {
    sort: string
    totals: { votes: number; questions: number; up: number; down: number }
    rows: {
      questionId: string
      category: string
      difficulty: string
      up: number
      down: number
      score: number
      reasons: { reason: string; count: number }[]
      comments: { text: string; vote: string }[]
    }[]
  }

  const vote = (questionId: string, v: 'opp' | 'ned', extra: Record<string, unknown> = {}) => ({
    items: [{ questionId, vote: v, category: 'blaa', difficulty: 'lett', lang: 'nb', ...extra }],
  })

  async function del(path: string, token?: string) {
    const res = await app.request(
      path,
      { method: 'DELETE', headers: token ? { authorization: `Bearer ${token}` } : {} },
      env,
    )
    return { status: res.status, body: (await res.json()) as Record<string, unknown> }
  }

  it('teller opp og ned per spørsmål', async () => {
    const a = await newAccount('Rune')
    const b = await newAccount('Linn')

    await post('/api/feedback', vote('blaa-l-01', 'opp'), a.token)
    await post('/api/feedback', vote('blaa-l-01', 'opp'), b.token)
    await post('/api/feedback', vote('blaa-l-02', 'ned', { reason: 'uklart' }), a.token)

    const res = await get<Summary>('/api/feedback/summary', a.token)
    expect(res.status).toBe(200)
    expect(res.body.totals).toMatchObject({ votes: 3, questions: 2, up: 2, down: 1 })
    // «verst» er standardsortering, så det kritiserte spørsmålet ligger først.
    expect(res.body.rows[0]).toMatchObject({ questionId: 'blaa-l-02', up: 0, down: 1, score: -1 })
    expect(res.body.rows[0].reasons).toEqual([{ reason: 'uklart', count: 1 }])
    expect(res.body.rows[1]).toMatchObject({ questionId: 'blaa-l-01', up: 2, score: 2 })
  })

  it('erstatter egen stemme i stedet for å telle den to ganger', async () => {
    const a = await newAccount('Rune')
    await post('/api/feedback', vote('blaa-l-01', 'opp'), a.token)
    await post('/api/feedback', vote('blaa-l-01', 'ned', { reason: 'feil' }), a.token)

    const res = await get<Summary>('/api/feedback/summary', a.token)
    expect(res.body.totals.votes).toBe(1)
    expect(res.body.rows[0]).toMatchObject({ up: 0, down: 1, score: -1 })
  })

  it('lar deg trekke stemmen tilbake', async () => {
    const a = await newAccount('Rune')
    await post('/api/feedback', vote('blaa-l-01', 'opp'), a.token)
    expect((await del('/api/feedback/blaa-l-01', a.token)).status).toBe(200)

    const res = await get<Summary>('/api/feedback/summary', a.token)
    expect(res.body.totals.votes).toBe(0)
    expect(res.body.rows).toHaveLength(0)
  })

  it('lagrer grunn bare på tommel ned, og kutter for lange kommentarer', async () => {
    const a = await newAccount('Rune')
    await post('/api/feedback', vote('blaa-l-01', 'opp', { reason: 'feil', comment: 'x'.repeat(600) }), a.token)

    const res = await get<Summary>('/api/feedback/summary', a.token)
    expect(res.body.rows[0].reasons).toEqual([])
    expect(res.body.rows[0].comments[0].text).toHaveLength(400)
  })

  it('forkaster ugyldige rader uten å velte hele forespørselen', async () => {
    const a = await newAccount('Rune')
    const res = await post<{ saved: number }>(
      '/api/feedback',
      {
        items: [
          { questionId: 'blaa-l-01', vote: 'opp' },
          { questionId: 'ikke gyldig id!', vote: 'opp' },
          { questionId: 'blaa-l-02', vote: 'kanskje' },
          { questionId: 'blaa-l-03', vote: 'ned', reason: 'noe-annet' },
        ],
      },
      a.token,
    )
    expect(res.body.saved).toBe(2)

    const summary = await get<Summary>('/api/feedback/summary', a.token)
    expect(summary.body.rows.map((r) => r.questionId).sort()).toEqual(['blaa-l-01', 'blaa-l-03'])
    // Ukjent grunn forkastes, men stemmen står.
    expect(summary.body.rows.find((r) => r.questionId === 'blaa-l-03')?.reasons).toEqual([])
  })

  it('filtrerer på tema og nivå', async () => {
    const a = await newAccount('Rune')
    await post('/api/feedback', vote('blaa-l-01', 'ned'), a.token)
    await post('/api/feedback', { items: [{ questionId: 'roed-v-01', vote: 'ned', category: 'roed', difficulty: 'vanskelig' }] }, a.token)

    const blaa = await get<Summary>('/api/feedback/summary?category=blaa', a.token)
    expect(blaa.body.rows.map((r) => r.questionId)).toEqual(['blaa-l-01'])

    const hard = await get<Summary>('/api/feedback/summary?difficulty=vanskelig', a.token)
    expect(hard.body.rows.map((r) => r.questionId)).toEqual(['roed-v-01'])
  })

  it('gir tilbake egne stemmer, ikke andres', async () => {
    const a = await newAccount('Rune')
    const b = await newAccount('Linn')
    await post('/api/feedback', vote('blaa-l-01', 'ned', { reason: 'hint', comment: 'hintet røper alt' }), a.token)
    await post('/api/feedback', vote('blaa-l-02', 'opp'), b.token)

    const mine = await get<{ items: { questionId: string; vote: string; reason: string | null }[] }>(
      '/api/feedback/mine',
      a.token,
    )
    expect(mine.body.items).toEqual([
      { questionId: 'blaa-l-01', vote: 'ned', reason: 'hint', comment: 'hintet røper alt', updatedAt: expect.any(Number) },
    ])
  })

  it('rydder bort tilbakemeldingene når kontoen slettes', async () => {
    const a = await newAccount('Rune')
    const b = await newAccount('Linn')
    await post('/api/feedback', vote('blaa-l-01', 'opp'), a.token)
    await post('/api/feedback', vote('blaa-l-01', 'ned'), b.token)

    await del('/api/account/me', b.token)

    const res = await get<Summary>('/api/feedback/summary', a.token)
    expect(res.body.totals.votes).toBe(1)
    expect(res.body.rows[0]).toMatchObject({ up: 1, down: 0 })
  })

  it('krever innlogging', async () => {
    expect((await get('/api/feedback/summary')).status).toBe(401)
    expect((await post('/api/feedback', vote('blaa-l-01', 'opp'))).status).toBe(401)
  })
})
