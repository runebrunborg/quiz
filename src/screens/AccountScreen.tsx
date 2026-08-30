import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createAccount,
  deleteAccount,
  logOut,
  renameAccount,
  restoreAccount,
  syncOutbox,
} from '../lib/api'
import { loadProfile, loadSessions, type Profile } from '../lib/storage'
import { pct, totals } from '../lib/stats'

/**
 * Konto og profil. Uten konto spiller man helt lokalt – denne skjermen er det
 * eneste stedet man kobler seg til skyen, bytter navn, logger ut eller sletter.
 */
export default function AccountScreen() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile>(loadProfile)
  const [name, setName] = useState('')
  const [newName, setNewName] = useState('')
  const [restoreKey, setRestoreKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [showKey, setShowKey] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

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

  const mine = totals(loadSessions())

  /* ------------------------------------------------------------ utlogget */

  if (!profile.token) {
    return (
      <>
        <div className="page-head">
          <p className="eyebrow">Konto</p>
          <h1>Ta med deg tallene dine</h1>
          <p>
            Rundene lagres på denne enheten uansett. En konto gjør at de følger deg til andre enheter, og at du kan
            sammenligne deg med venner og se topplista. Ingen e-post, ingen passord – bare et visningsnavn du velger selv.
          </p>
        </div>

        <div className="card card--pad stack">
          <label className="stack stack--tight">
            <span className="setup__label">Visningsnavn</span>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Rune"
              maxLength={40}
            />
          </label>
          <p className="faint" style={{ fontSize: 'var(--step--1)' }}>
            Navnet er det eneste andre ser. Velg noe du er komfortabel med at venner – og topplista – viser.
          </p>
          <button
            type="button"
            className="btn btn--primary"
            disabled={busy || name.trim().length === 0}
            onClick={() =>
              run(async () => {
                await createAccount(name.trim())
                setProfile(loadProfile())
                setShowKey(true)
                setNotice('Kontoen er opprettet. Ta vare på gjenopprettingsnøkkelen under.')
                await syncOutbox()
              })
            }
          >
            Opprett konto
          </button>

          <details>
            <summary className="muted" style={{ cursor: 'pointer', fontSize: 'var(--step--1)' }}>
              Jeg har allerede en konto
            </summary>
            <div className="stack stack--tight" style={{ marginTop: 'var(--sp-3)' }}>
              <p className="faint" style={{ fontSize: 'var(--step--1)' }}>
                Lim inn gjenopprettingsnøkkelen fra enheten du brukte før.
              </p>
              <input
                className="input"
                value={restoreKey}
                onChange={(e) => setRestoreKey(e.target.value)}
                placeholder="Gjenopprettingsnøkkel"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                className="btn"
                disabled={busy || restoreKey.trim().length < 16}
                onClick={() =>
                  run(async () => {
                    await restoreAccount(restoreKey.trim())
                    setProfile(loadProfile())
                    setRestoreKey('')
                    await syncOutbox()
                  })
                }
              >
                Logg inn
              </button>
            </div>
          </details>

          {error && <p className="pill pill--bad">{error}</p>}
        </div>
      </>
    )
  }

  /* ------------------------------------------------------------ innlogget */

  return (
    <>
      <div className="page-head">
        <p className="eyebrow">Profil</p>
        <h1>{profile.displayName}</h1>
        <p>Kontoen din, vennekoden og nøkkelen som tar deg hit fra en annen enhet.</p>
      </div>

      {notice && <p className="pill">{notice}</p>}

      <section className="section">
        <div className="section__head">
          <h2>Deg</h2>
        </div>
        <div className="stat-grid">
          <div className="stat-tile">
            <div className="stat-tile__value tabular">{pct(mine.correct, mine.total)}%</div>
            <div className="stat-tile__label">Treffprosent totalt</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile__value tabular">{mine.total}</div>
            <div className="stat-tile__label">Spørsmål besvart</div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2>Vennekode</h2>
        </div>
        <div className="card card--pad stack">
          <div className="row">
            <span className="code-box">{profile.friendCode}</span>
            <button
              type="button"
              className="btn btn--tiny"
              onClick={() => void navigator.clipboard?.writeText(profile.friendCode ?? '')}
            >
              Kopier kode
            </button>
            <button type="button" className="btn btn--tiny btn--ghost" onClick={() => navigate('/venner')}>
              Til venner
            </button>
          </div>
          <p className="faint" style={{ fontSize: 'var(--step--1)' }}>
            Del koden med noen du vil sammenligne deg med. Vennskap er gjensidig – dere ser hverandres uketall.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2>Visningsnavn</h2>
        </div>
        <div className="card card--pad stack">
          <div className="row">
            <input
              className="input"
              style={{ maxWidth: 260 }}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={profile.displayName}
              maxLength={40}
            />
            <button
              type="button"
              className="btn"
              disabled={busy || newName.trim().length === 0 || newName.trim() === profile.displayName}
              onClick={() =>
                run(async () => {
                  await renameAccount(newName.trim())
                  setProfile(loadProfile())
                  setNewName('')
                  setNotice('Navnet er endret.')
                })
              }
            >
              Endre navn
            </button>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2>Gjenopprettingsnøkkel</h2>
        </div>
        <div className="card card--pad stack">
          <p className="faint" style={{ fontSize: 'var(--step--1)' }}>
            Dette er hele innloggingen din. Mister du den, finnes det ingen vei tilbake til kontoen – vi har verken
            e-postadressen din eller noen annen måte å kjenne deg igjen på. Lagre den i passordboka.
          </p>
          <div className="row">
            <button type="button" className="btn btn--tiny" onClick={() => setShowKey((v) => !v)}>
              {showKey ? 'Skjul' : 'Vis'} nøkkel
            </button>
            <button
              type="button"
              className="btn btn--tiny btn--ghost"
              onClick={() => {
                void navigator.clipboard?.writeText(profile.token ?? '')
                setNotice('Nøkkelen er kopiert.')
              }}
            >
              Kopier nøkkel
            </button>
          </div>
          {showKey && (
            <p className="funfact__source" style={{ wordBreak: 'break-all' }}>
              <code>{profile.token}</code>
            </p>
          )}
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2>Logg ut</h2>
        </div>
        <div className="card card--pad stack">
          <p className="faint" style={{ fontSize: 'var(--step--1)' }}>
            Kobler fra på denne enheten. Kontoen og tallene blir stående, og nøkkelen tar deg inn igjen.
          </p>
          <div className="row">
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => {
                logOut()
                setProfile(loadProfile())
                setNotice(null)
              }}
            >
              Logg ut
            </button>
          </div>

          {!confirmDelete ? (
            <button
              type="button"
              className="btn btn--tiny btn--ghost"
              style={{ alignSelf: 'flex-start' }}
              onClick={() => setConfirmDelete(true)}
            >
              Slett kontoen
            </button>
          ) : (
            <div className="stack stack--tight">
              <p className="pill pill--bad">
                Sletting fjerner kontoen, alle økter, all statistikk og alle vennskap på serveren. Det kan ikke angres.
              </p>
              <div className="row">
                <button
                  type="button"
                  className="btn btn--primary"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await deleteAccount()
                      setProfile(loadProfile())
                      setConfirmDelete(false)
                      setNotice('Kontoen er slettet.')
                    })
                  }
                >
                  Ja, slett alt
                </button>
                <button type="button" className="btn btn--ghost" onClick={() => setConfirmDelete(false)}>
                  Avbryt
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {error && <p className="pill pill--bad">{error}</p>}
    </>
  )
}
