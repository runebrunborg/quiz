/**
 * Ende-til-ende-test av API-et mot en kjørende worker.
 *
 *   npm run cf:dev            (i ett vindu)
 *   npm run test:api          (i et annet)
 *
 * Kjører hele kontoløpet: registrering, unikt nickname, innlogging, feil
 * passord, profil, aldersgrense, venner, toppliste, passordbytte og sletting.
 * Bruker en egen database når den kjøres lokalt, så den kan gjentas fritt.
 */
const BASE = process.env.API_BASE ?? 'http://127.0.0.1:8787/api'

async function derive(nickname, password) {
  const key = nickname.normalize('NFKC').toLowerCase().replace(/[\s\-_.]/g, '')
  const enc = new TextEncoder()
  const material = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(`theme-quiz|${key}`), iterations: 600000, hash: 'SHA-256' },
    material, 256)
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function call(path, opts = {}, token) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...(opts.headers || {}) },
  })
  const body = await res.text()
  let parsed; try { parsed = JSON.parse(body) } catch { parsed = body }
  return { status: res.status, body: parsed }
}

function check(name, cond, extra = '') {
  console.log(`${cond ? 'OK  ' : 'FEIL'} ${name}${extra ? ' :: ' + extra : ''}`)
  if (!cond) process.exitCode = 1
}

const sessions = (n, correct) => ({
  sessions: [{
    id: crypto.randomUUID(), category: 'blaa', difficulty: 'lett', region: 'no',
    startedAt: Date.now() - 60000, finishedAt: Date.now(),
    answers: Array.from({ length: n }, (_, i) => ({
      questionId: `blaa-l-${String((i % 10) + 1).padStart(2, '0')}`,
      correct: i < correct, hintsUsed: 0, topics: ['historie', 'natur'],
    })),
  }],
})

// 1. Registrering
const keyA = await derive('Rune', 'hemmelig-passord')
let r = await call('/account/register', { method: 'POST', body: JSON.stringify({ nickname: 'Rune', passwordKey: keyA, birthYear: 1980, country: 'NO' }) })
check('registrering', r.status === 200 && r.body.token, JSON.stringify(r.body).slice(0, 120))
const tokenA = r.body.token

// 2. Samme nickname i annen skrivemåte skal avvises
r = await call('/account/register', { method: 'POST', body: JSON.stringify({ nickname: 'r u n e', passwordKey: keyA }) })
check('nickname er unikt på tvers av skrivemåte', r.status === 409, `${r.status} ${JSON.stringify(r.body)}`)

// 3. Ledig-sjekk
r = await call('/account/available?nickname=Rune')
check('available sier opptatt', r.body.available === false)
r = await call('/account/available?nickname=Arthur')
check('available sier ledig', r.body.available === true)

// 4. Feil passord
r = await call('/account/login', { method: 'POST', body: JSON.stringify({ nickname: 'Rune', passwordKey: await derive('Rune', 'feil-passord-her') }) })
check('feil passord avvises', r.status === 401)

// 5. Riktig passord fra "ny enhet"
r = await call('/account/login', { method: 'POST', body: JSON.stringify({ nickname: 'rune', passwordKey: keyA }) })
check('innlogging med annen bokstavstørrelse', r.status === 200 && r.body.token && r.body.token !== tokenA)
const tokenA2 = r.body.token

// 6. Uten token
r = await call('/account/me')
check('krever innlogging', r.status === 401)

// 7. Profil
r = await call('/account/me', {}, tokenA)
check('profil leses', r.body.nickname === 'Rune' && r.body.birthYear === 1980 && r.body.country === 'NO', JSON.stringify(r.body))

// 8. Alder under 13 avvises
r = await call('/account/me', { method: 'PATCH', body: JSON.stringify({ birthYear: new Date().getFullYear() - 5 }) }, tokenA)
check('for ung alder avvises', r.status === 400, JSON.stringify(r.body))

// 9. Tømme feltene
r = await call('/account/me', { method: 'PATCH', body: JSON.stringify({ birthYear: null, country: null }) }, tokenA)
check('kan fjerne opplysninger', r.status === 200 && r.body.birthYear === null)
await call('/account/me', { method: 'PATCH', body: JSON.stringify({ birthYear: 1980, country: 'NO' }) }, tokenA)

// 10. Andre bruker
const keyB = await derive('Arthur', 'et-annet-passord')
r = await call('/account/register', { method: 'POST', body: JSON.stringify({ nickname: 'Arthur', passwordKey: keyB, country: 'SE' }) })
check('bruker to registreres', r.status === 200)
const tokenB = r.body.token

// 11. Resultater
r = await call('/sessions', { method: 'POST', body: JSON.stringify(sessions(40, 34)) }, tokenA)
check('lagrer økt for Rune', r.body.saved === 1, JSON.stringify(r.body))
r = await call('/sessions', { method: 'POST', body: JSON.stringify(sessions(40, 22)) }, tokenB)
check('lagrer økt for Arthur', r.body.saved === 1)

// 12. Venner via nickname
r = await call('/friends', { method: 'POST', body: JSON.stringify({ nickname: 'arthur' }) }, tokenA)
check('legger til venn på nickname', r.status === 200 && r.body.friend.name === 'Arthur', JSON.stringify(r.body).slice(0, 160))
r = await call('/friends', {}, tokenB)
check('vennskapet er gjensidig', r.body.friends.length === 1 && r.body.friends[0].name === 'Rune')

// 13. Seg selv
r = await call('/friends', { method: 'POST', body: JSON.stringify({ nickname: 'Rune' }) }, tokenA)
check('kan ikke legge til seg selv', r.status === 400)

// 14. Toppliste
r = await call('/leaderboard?period=all', {}, tokenA)
check('toppliste rangerer riktig', r.body.entries.length === 2 && r.body.entries[0].nickname === 'Rune' && r.body.entries[0].accuracy === 85, JSON.stringify(r.body.entries))
check('toppliste markerer deg', r.body.me && r.body.me.isMe === true)
check('toppliste viser ikke fødselsår', !JSON.stringify(r.body).includes('1980'))

// 15. Statistikk
r = await call('/me/stats', {}, tokenA)
check('emne-statistikk grupperes', r.body.topics.some((t) => t.topic === 'historie' && t.total === 40), JSON.stringify(r.body.topics))

// 16. Passordbytt logger ut andre enheter
r = await call('/account/password', { method: 'POST', body: JSON.stringify({ currentPasswordKey: keyA, newPasswordKey: await derive('Rune', 'nytt-passord-123') }) }, tokenA)
check('bytter passord', r.status === 200, JSON.stringify(r.body))
r = await call('/account/me', {}, tokenA2)
check('andre enhet er logget ut', r.status === 401)
r = await call('/account/me', {}, tokenA)
check('egen enhet er fortsatt innlogget', r.status === 200)
r = await call('/account/login', { method: 'POST', body: JSON.stringify({ nickname: 'Rune', passwordKey: await derive('Rune', 'nytt-passord-123') }) })
check('nytt passord virker', r.status === 200)

// 17. Sletting
r = await call('/account/me', { method: 'DELETE' }, tokenB)
check('sletter konto', r.status === 200)
r = await call('/leaderboard?period=all', {}, tokenA)
check('slettet konto er borte fra topplisten', r.body.entries.length === 1, JSON.stringify(r.body.entries))
r = await call('/friends', {}, tokenA)
check('vennskapet er ryddet bort', r.body.friends.length === 0)
r = await call('/account/available?nickname=Arthur')
check('nicknamet er ledig igjen', r.body.available === true)

console.log(process.exitCode ? '\nNOEN TESTER FEILET' : '\nAlle API-tester passerte')
