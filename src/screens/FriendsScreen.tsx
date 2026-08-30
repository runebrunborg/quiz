import { useCallback, useEffect, useMemo, useState } from 'react'
import { ComparisonBars } from '../components/Charts'
import { Segmented } from '../components/Segmented'
import {
  addFriend,
  changePassword,
  deleteAccount,
  leaderboard,
  listFriends,
  login,
  logout,
  nicknameAvailable,
  refreshProfile,
  register,
  removeFriend,
  syncOutbox,
  updateProfile,
  type FriendSummary,
  type LeaderboardEntry,
} from '../lib/api'
import { passwordStrength } from '../lib/crypto'
import { pct, totals } from '../lib/stats'
import { loadProfile, loadSessions, type Profile } from '../lib/storage'
import { COUNTRIES, COUNTRY_NAME } from '../lib/ui'

const MIN_PASSWORD = 8

export default function FriendsScreen() {
  const [profile, setProfile] = useState<Profile>(loadProfile)
  const loggedIn = Boolean(profile.token)

  useEffect(() => {
    if (!loadProfile().token) return
    void (async () => {
      const fresh = await refreshProfile()
      if (fresh) setProfile(fresh)
      else setProfile(loadProfile())
      await syncOutbox().catch(() => undefined)
    })()
  }, [])

  if (!loggedIn) return <AuthPanel onDone={setProfile} />
  return <SocialPanel profile={profile} onProfile={setProfile} />
}

/* ------------------------------------------------------------ registrering */

function AuthPanel({ onDone }: { onDone: (p: Profile) => void }) {
  const [mode, setMode] = useState<'ny' | 'inn'>('ny')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [country, setCountry] = useState('')
  const [available, setAvailable] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const strength = passwordStrength(password)
  const localSessions = useMemo(() => loadSessions().filter((s) => s.finishedAt !== null).length, [])

  // Sjekker om nicknamet er ledig mens man skriver.
  useEffect(() => {
    if (mode !== 'ny' || nickname.trim().length < 2) {
      setAvailable(null)
      return
    }
    let cancelled = false
    const timer = setTimeout(() => {
      void nicknameAvailable(nickname)
        .then((r) => !cancelled && setAvailable(r.available))
        .catch(() => !cancelled && setAvailable(null))
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [nickname, mode])

  const canSubmit =
    mode === 'inn'
      ? nickname.trim().length >= 2 && password.length >= MIN_PASSWORD
      : nickname.trim().length >= 2 &&
        available === true &&
        password.length >= MIN_PASSWORD &&
        password === repeat

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      const profile =
        mode === 'ny'
          ? await register({
              nickname: nickname.trim(),
              password,
              birthYear: birthYear ? Number.parseInt(birthYear, 10) : null,
              country: country || null,
            })
          : await login(nickname.trim(), password)
      onDone(profile)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Noe gikk galt')
    } finally {
      setBusy(false)
    }
  }

  const thisYear = new Date().getFullYear()

  return (
    <>
      <div className="page-head">
        <p className="eyebrow">Konto</p>
        <h1>{mode === 'ny' ? 'Lag en profil' : 'Logg inn'}</h1>
        <p>
          Rundene dine lagres på denne enheten uansett. En profil lar deg spille fra flere enheter, sammenligne deg
          med venner og komme med på topplisten.
        </p>
      </div>

      <div className="card card--pad stack">
        <Segmented
          ariaLabel="Ny profil eller innlogging"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'ny', label: 'Ny profil' },
            { value: 'inn', label: 'Logg inn' },
          ]}
        />

        <label className="stack stack--tight">
          <span className="setup__label">Nickname</span>
          <input
            className="input"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="rune"
            maxLength={24}
            autoComplete="username"
          />
          {mode === 'ny' && available === false && <span className="pill pill--bad">Opptatt – prøv et annet</span>}
          {mode === 'ny' && available === true && <span className="pill pill--ok">Ledig</span>}
          {mode === 'ny' && (
            <span className="setup__note">
              Navnet er unikt, det er slik venner finner deg – og det vises på topplisten.
            </span>
          )}
        </label>

        <label className="stack stack--tight">
          <span className="setup__label">Passord</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={`Minst ${MIN_PASSWORD} tegn`}
            autoComplete={mode === 'ny' ? 'new-password' : 'current-password'}
          />
          {mode === 'ny' && password.length > 0 && (
            <span className={`pill ${strength.score >= 2 ? 'pill--ok' : ''}`}>{strength.label}</span>
          )}
        </label>

        {mode === 'ny' && (
          <>
            <label className="stack stack--tight">
              <span className="setup__label">Gjenta passord</span>
              <input
                className="input"
                type="password"
                value={repeat}
                onChange={(e) => setRepeat(e.target.value)}
                autoComplete="new-password"
              />
              {repeat.length > 0 && password !== repeat && <span className="pill pill--bad">Ikke like</span>}
            </label>

            <div className="setup__row">
              <span className="setup__label">Fødselsår og land (valgfritt)</span>
              <div className="row">
                <input
                  className="input"
                  style={{ maxWidth: 140 }}
                  inputMode="numeric"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder={String(thisYear - 30)}
                />
                <select className="input" style={{ maxWidth: 220 }} value={country} onChange={(e) => setCountry(e.target.value)}>
                  <option value="">Velg land</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <p className="setup__note">
                Brukes bare til å sammenligne aldersgrupper og land i statistikken. Du kan la begge stå tomme, og
                endre eller fjerne dem når som helst. Aldersgrensen for Theme Quiz er 13 år.
              </p>
            </div>

            <p className="setup__note">
              Merk at nicknamet ditt og treffprosenten din blir synlig på topplisten for andre innloggede spillere.
              Fødselsår og land vises aldri der.
            </p>
          </>
        )}

        {error && <p className="pill pill--bad">{error}</p>}

        <button type="button" className="btn btn--primary btn--lg" disabled={busy || !canSubmit} onClick={() => void submit()}>
          {busy ? 'Et øyeblikk …' : mode === 'ny' ? 'Opprett profil' : 'Logg inn'}
        </button>

        {localSessions > 0 && (
          <p className="setup__note">
            De {localSessions} rundene du allerede har spilt på denne enheten følger med når du oppretter profilen.
          </p>
        )}
      </div>
    </>
  )
}

/* --------------------------------------------------------- innlogget visning */

function SocialPanel({ profile, onProfile }: { profile: Profile; onProfile: (p: Profile) => void }) {
  const [tab, setTab] = useState<'venner' | 'toppliste' | 'profil'>('venner')

  return (
    <>
      <div className="page-head">
        <p className="eyebrow">Innlogget som {profile.nickname}</p>
        <h1>Venner og toppliste</h1>
      </div>

      <Segmented
        ariaLabel="Visning"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'venner', label: 'Venner' },
          { value: 'toppliste', label: 'Toppliste' },
          { value: 'profil', label: 'Profil' },
        ]}
      />

      <div style={{ marginTop: 'var(--sp-5)' }}>
        {tab === 'venner' && <FriendsPanel />}
        {tab === 'toppliste' && <LeaderboardPanel />}
        {tab === 'profil' && <ProfilePanel profile={profile} onProfile={onProfile} />}
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ venner */

function FriendsPanel() {
  const [friends, setFriends] = useState<FriendSummary[]>([])
  const [nickname, setNickname] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mine = useMemo(() => totals(loadSessions()), [])

  const refresh = useCallback(async () => {
    try {
      setFriends(await listFriends())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunne ikke hente venner')
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function run(fn: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Noe gikk galt')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stack">
      <div className="card card--pad stack">
        <span className="setup__label">Legg til en venn</span>
        <div className="row">
          <input
            className="input"
            style={{ maxWidth: 260 }}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Nicknamet deres"
            maxLength={24}
          />
          <button
            type="button"
            className="btn btn--primary"
            disabled={busy || nickname.trim().length < 2}
            onClick={() =>
              run(async () => {
                await addFriend(nickname)
                setNickname('')
                await refresh()
              })
            }
          >
            Legg til
          </button>
        </div>
        <p className="setup__note">
          Dere blir venner begge veier med én gang, og ser hverandres uketall. Din treffprosent totalt:{' '}
          <strong className="tabular">{pct(mine.correct, mine.total)} %</strong>
        </p>
        {error && <p className="pill pill--bad">{error}</p>}
      </div>

      {friends.length === 0 ? (
        <p className="empty">Ingen venner lagt til ennå.</p>
      ) : (
        friends.map((f) => {
          const meThis = f.weeks[f.weeks.length - 1]?.me
          const meLast = f.weeks[f.weeks.length - 2]?.me
          const themThis = f.weeks[f.weeks.length - 1]?.friend
          const themLast = f.weeks[f.weeks.length - 2]?.friend
          return (
            <div className="card card--pad stack" key={f.id}>
              <div className="friend-row" style={{ border: 0, background: 'none', padding: 0 }}>
                <span className="avatar">{f.name.slice(0, 1).toUpperCase()}</span>
                <div style={{ flex: 1 }}>
                  <strong>{f.name}</strong>
                  <div className="faint" style={{ fontSize: 'var(--step--1)' }}>
                    {relative(meThis, themThis, 'Denne uken')} · {relative(meLast, themLast, 'Forrige uke')}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn--tiny btn--ghost"
                  onClick={() =>
                    run(async () => {
                      await removeFriend(f.id)
                      await refresh()
                    })
                  }
                >
                  Fjern
                </button>
              </div>

              <ComparisonBars weeks={f.weeks} meLabel="Deg" friendLabel={f.name} />

              <div className="stat-grid">
                <div className="stat-tile">
                  <div className="stat-tile__value tabular">{pct(f.myAccumulated.correct, f.myAccumulated.total)} %</div>
                  <div className="stat-tile__label">Deg, akkumulert</div>
                </div>
                <div className="stat-tile">
                  <div className="stat-tile__value tabular">{pct(f.accumulated.correct, f.accumulated.total)} %</div>
                  <div className="stat-tile__label">{f.name}, akkumulert</div>
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

/** «Denne uken var du 80 % av Arthur» – uttrykt som forholdstall. */
function relative(me: number | null | undefined, them: number | null | undefined, label: string): string {
  if (me == null || them == null || them === 0) return `${label}: ikke nok data`
  return `${label}: du var ${Math.round((me / them) * 100)} % av dem`
}

/* --------------------------------------------------------------- toppliste */

function LeaderboardPanel() {
  const [period, setPeriod] = useState<'all' | 'week'>('all')
  const [data, setData] = useState<{ entries: LeaderboardEntry[]; me: LeaderboardEntry | null; minimum: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setData(null)
    void leaderboard(period)
      .then((r) => !cancelled && setData(r))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'Kunne ikke hente topplisten'))
    return () => {
      cancelled = true
    }
  }, [period])

  return (
    <div className="stack">
      <Segmented
        ariaLabel="Periode"
        value={period}
        onChange={setPeriod}
        options={[
          { value: 'all', label: 'Gjennom tidene' },
          { value: 'week', label: 'Denne uken' },
        ]}
      />

      {error && <p className="pill pill--bad">{error}</p>}

      <div className="card card--pad">
        {!data ? (
          <p className="muted">Henter …</p>
        ) : data.entries.length === 0 ? (
          <p className="muted">
            Ingen har svart på nok spørsmål ennå. Det trengs {data.minimum} besvarte spørsmål for å komme med.
          </p>
        ) : (
          <table className="coverage-table">
            <thead>
              <tr>
                <th style={{ width: 48 }}>#</th>
                <th>Spiller</th>
                <th style={{ textAlign: 'right' }}>Treff</th>
                <th style={{ textAlign: 'right' }}>Svar</th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map((e) => (
                <tr key={`${e.rank}-${e.nickname}`} style={e.isMe ? { background: 'rgba(255,45,142,0.12)' } : undefined}>
                  <td className="tabular">{e.rank}</td>
                  <td>
                    <strong>{e.nickname}</strong>
                    {e.isMe && <span className="pill pill--pink" style={{ marginLeft: 8 }}>deg</span>}
                  </td>
                  <td className="num">{e.accuracy} %</td>
                  <td className="num faint">{e.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data && !data.me && data.entries.length > 0 && (
        <p className="setup__note">
          Du er ikke på listen ennå – det trengs {data.minimum} besvarte spørsmål i perioden.
        </p>
      )}
      <p className="setup__note">
        Listen viser nickname og treffprosent for alle innloggede spillere. Fødselsår og land vises ikke.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ profil */

function ProfilePanel({ profile, onProfile }: { profile: Profile; onProfile: (p: Profile) => void }) {
  const [birthYear, setBirthYear] = useState(profile.birthYear ? String(profile.birthYear) : '')
  const [country, setCountry] = useState(profile.country ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [note, setNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function run(fn: () => Promise<string>) {
    setBusy(true)
    setError(null)
    setNote(null)
    try {
      setNote(await fn())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Noe gikk galt')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stack">
      <div className="card card--pad stack">
        <div className="row">
          <span className="avatar">{profile.nickname.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{profile.nickname}</strong>
            <div className="faint" style={{ fontSize: 'var(--step--1)' }}>
              {profile.country ? COUNTRY_NAME.get(profile.country) ?? profile.country : 'Land ikke oppgitt'}
              {profile.birthYear ? ` · født ${profile.birthYear}` : ''}
            </div>
          </div>
        </div>

        <div className="row">
          <input
            className="input"
            style={{ maxWidth: 140 }}
            inputMode="numeric"
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="Fødselsår"
          />
          <select className="input" style={{ maxWidth: 220 }} value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">Ikke oppgitt</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={() =>
              run(async () => {
                onProfile(
                  await updateProfile({
                    birthYear: birthYear ? Number.parseInt(birthYear, 10) : null,
                    country: country || null,
                  }),
                )
                return 'Profilen er lagret.'
              })
            }
          >
            Lagre
          </button>
        </div>
        <p className="setup__note">Tøm feltene og lagre for å fjerne opplysningene helt.</p>
      </div>

      <div className="card card--pad stack">
        <span className="setup__label">Bytt passord</span>
        <div className="row">
          <input
            className="input"
            style={{ maxWidth: 220 }}
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Nåværende"
            autoComplete="current-password"
          />
          <input
            className="input"
            style={{ maxWidth: 220 }}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nytt passord"
            autoComplete="new-password"
          />
          <button
            type="button"
            className="btn"
            disabled={busy || currentPassword.length < MIN_PASSWORD || newPassword.length < MIN_PASSWORD}
            onClick={() =>
              run(async () => {
                await changePassword(currentPassword, newPassword)
                setCurrentPassword('')
                setNewPassword('')
                return 'Passordet er byttet. Andre enheter er logget ut.'
              })
            }
          >
            Bytt
          </button>
        </div>
      </div>

      {note && <p className="pill pill--ok">{note}</p>}
      {error && <p className="pill pill--bad">{error}</p>}

      <div className="card card--pad stack">
        <div className="row">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() =>
              void logout().then(() => {
                onProfile(loadProfile())
              })
            }
          >
            Logg ut
          </button>
          {!confirmDelete ? (
            <button type="button" className="btn btn--ghost" onClick={() => setConfirmDelete(true)}>
              Slett profilen
            </button>
          ) : (
            <>
              <span className="faint" style={{ fontSize: 'var(--step--1)' }}>
                Sletter kontoen og all statistikk på serveren. Rundene på denne enheten blir liggende.
              </span>
              <button
                type="button"
                className="btn btn--tiny btn--verdict-bad"
                aria-pressed
                onClick={() =>
                  void deleteAccount().then(() => {
                    onProfile(loadProfile())
                  })
                }
              >
                Ja, slett
              </button>
              <button type="button" className="btn btn--tiny" onClick={() => setConfirmDelete(false)}>
                Avbryt
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
