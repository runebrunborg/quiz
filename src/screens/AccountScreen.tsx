import { useEffect, useState } from 'react'
import { Segmented } from '../components/Segmented'
import {
  changePassword,
  deleteAccount,
  login,
  logout,
  nicknameAvailable,
  refreshProfile,
  register,
  syncOutbox,
  updateProfile,
} from '../lib/api'
import { passwordStrength } from '../lib/crypto'
import { pct, totals } from '../lib/stats'
import { loadProfile, loadSessions, type Profile } from '../lib/storage'
import { COUNTRIES, COUNTRY_NAME } from '../lib/ui'

const MIN_PASSWORD = 8

/**
 * Konto og profil. Uten konto spiller man helt lokalt – dette er det eneste
 * stedet man kobler seg til skyen, endrer opplysninger, bytter passord, logger
 * ut eller sletter alt.
 */
export default function AccountScreen() {
  const [profile, setProfile] = useState<Profile>(loadProfile)

  useEffect(() => {
    if (!loadProfile().token) return
    void (async () => {
      const fresh = await refreshProfile()
      setProfile(fresh ?? loadProfile())
      await syncOutbox().catch(() => undefined)
    })()
  }, [])

  return profile.token ? (
    <ProfilePanel profile={profile} onProfile={setProfile} />
  ) : (
    <AuthPanel onDone={setProfile} />
  )
}

/* ------------------------------------------------ registrering og innlogging */

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
  const localRounds = loadSessions().filter((s) => s.finishedAt !== null).length
  const thisYear = new Date().getFullYear()

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
      onDone(
        mode === 'ny'
          ? await register({
              nickname: nickname.trim(),
              password,
              birthYear: birthYear ? Number.parseInt(birthYear, 10) : null,
              country: country || null,
            })
          : await login(nickname.trim(), password),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Noe gikk galt')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <p className="eyebrow">Profil</p>
        <h1>{mode === 'ny' ? 'Lag en profil' : 'Logg inn'}</h1>
        <p>
          Rundene dine lagres på denne enheten uansett. En profil lar deg spille fra flere enheter, sammenligne deg
          med venner og komme med på topplista.
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
              Navnet er unikt, det er slik venner finner deg – og det vises på topplista.
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
                <select
                  className="input"
                  style={{ maxWidth: 220 }}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  aria-label="Land"
                >
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
                endre eller fjerne dem når som helst. Aldersgrensen for LinnQuiz er 13 år.
              </p>
            </div>

            <p className="setup__note">
              Merk at nicknamet ditt og treffprosenten din blir synlig på topplista for andre innloggede spillere.
              Fødselsår og land vises aldri der.
            </p>
          </>
        )}

        {error && <p className="pill pill--bad">{error}</p>}

        <button
          type="button"
          className="btn btn--primary btn--lg"
          disabled={busy || !canSubmit}
          onClick={() => void submit()}
        >
          {busy ? 'Et øyeblikk …' : mode === 'ny' ? 'Opprett profil' : 'Logg inn'}
        </button>

        {mode === 'ny' && localRounds > 0 && (
          <p className="setup__note">
            De {localRounds} rundene du allerede har spilt på denne enheten følger med når du oppretter profilen.
          </p>
        )}
      </div>
    </>
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

  const mine = totals(loadSessions())

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
    <>
      <div className="page-head">
        <p className="eyebrow">Profil</p>
        <h1>{profile.nickname}</h1>
        <p>
          {mine.rounds} runder spilt på denne enheten, {pct(mine.correct, mine.total)} % riktige.
        </p>
      </div>

      <div className="stack">
        <div className="card card--pad stack">
          <span className="setup__label">Fødselsår og land</span>
          <div className="row">
            <input
              className="input"
              style={{ maxWidth: 140 }}
              inputMode="numeric"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="Fødselsår"
            />
            <select
              className="input"
              style={{ maxWidth: 220 }}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              aria-label="Land"
            >
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
          <p className="setup__note">
            Vises aldri på topplista. Tøm feltene og lagre for å fjerne opplysningene helt.
            {profile.country ? ` Nå: ${COUNTRY_NAME.get(profile.country) ?? profile.country}.` : ''}
          </p>
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

        <div className="card card--pad">
          <div className="row">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => void logout().then(() => onProfile(loadProfile()))}
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
                  onClick={() => void deleteAccount().then(() => onProfile(loadProfile()))}
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
    </>
  )
}
