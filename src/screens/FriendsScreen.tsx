import { useCallback, useEffect, useState } from 'react'
import { ComparisonBars } from '../components/Charts'
import { addFriend, createAccount, listFriends, removeFriend, restoreAccount, syncOutbox, type FriendSummary } from '../lib/api'
import { loadProfile, loadSessions, type Profile } from '../lib/storage'
import { pct, totals } from '../lib/stats'

export default function FriendsScreen() {
  const [profile, setProfile] = useState<Profile>(loadProfile)
  const [friends, setFriends] = useState<FriendSummary[]>([])
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [restoreKey, setRestoreKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showKey, setShowKey] = useState(false)

  const refresh = useCallback(async () => {
    if (!loadProfile().token) return
    try {
      setFriends(await listFriends())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunne ikke hente venner')
    }
  }, [])

  useEffect(() => {
    void (async () => {
      await syncOutbox().catch(() => undefined)
      await refresh()
    })()
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

  const mine = totals(loadSessions())

  if (!profile.token) {
    return (
      <>
        <div className="page-head">
          <p className="eyebrow">Venner</p>
          <h1>Sammenlign deg med andre</h1>
          <p>
            Rundene dine lagres lokalt uansett. For å sammenligne med venner trengs en konto i skyen – bare et
            visningsnavn, ingen e-post og ingen passord.
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
          <button
            type="button"
            className="btn btn--primary"
            disabled={busy || name.trim().length === 0}
            onClick={() =>
              run(async () => {
                const account = await createAccount(name.trim())
                setProfile(loadProfile())
                setShowKey(true)
                await syncOutbox()
                void account
              })
            }
          >
            Opprett konto
          </button>

          <details>
            <summary className="muted" style={{ cursor: 'pointer', fontSize: 'var(--step--1)' }}>
              Jeg har allerede en konto på en annen enhet
            </summary>
            <div className="stack stack--tight" style={{ marginTop: 'var(--sp-3)' }}>
              <input
                className="input"
                value={restoreKey}
                onChange={(e) => setRestoreKey(e.target.value)}
                placeholder="Gjenopprettingsnøkkel"
              />
              <button
                type="button"
                className="btn"
                disabled={busy || restoreKey.trim().length < 16}
                onClick={() =>
                  run(async () => {
                    await restoreAccount(restoreKey.trim())
                    setProfile(loadProfile())
                    await syncOutbox()
                    await refresh()
                  })
                }
              >
                Koble til
              </button>
            </div>
          </details>

          {error && <p className="pill pill--bad">{error}</p>}
        </div>
      </>
    )
  }

  return (
    <>
      <div className="page-head">
        <p className="eyebrow">Venner</p>
        <h1>Hei, {profile.displayName}</h1>
        <p>Del vennekoden din, så ser dere hverandres uketall.</p>
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
          <button type="button" className="btn btn--tiny btn--ghost" onClick={() => setShowKey((v) => !v)}>
            {showKey ? 'Skjul' : 'Vis'} gjenopprettingsnøkkel
          </button>
        </div>
        {showKey && (
          <p className="funfact__source" style={{ wordBreak: 'break-all' }}>
            Ta vare på denne – den er eneste vei tilbake til kontoen fra en annen enhet:
            <br />
            <code>{profile.token}</code>
          </p>
        )}

        <div className="row">
          <input
            className="input"
            style={{ maxWidth: 240 }}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Vennekode"
            maxLength={8}
          />
          <button
            type="button"
            className="btn btn--primary"
            disabled={busy || code.trim().length < 4}
            onClick={() =>
              run(async () => {
                await addFriend(code)
                setCode('')
                await refresh()
              })
            }
          >
            Legg til venn
          </button>
        </div>
        {error && <p className="pill pill--bad">{error}</p>}
      </div>

      <section className="section">
        <div className="section__head">
          <h2>Sammenligning</h2>
          <span className="faint" style={{ fontSize: 'var(--step--1)' }}>
            Din treffprosent totalt: <strong className="tabular">{pct(mine.correct, mine.total)}%</strong>
          </span>
        </div>

        {friends.length === 0 ? (
          <p className="empty">Ingen venner lagt til ennå.</p>
        ) : (
          <div className="stack">
            {friends.map((f) => {
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
                      onClick={() => run(async () => {
                        await removeFriend(f.id)
                        await refresh()
                      })}
                    >
                      Fjern
                    </button>
                  </div>

                  <ComparisonBars weeks={f.weeks} meLabel="Deg" friendLabel={f.name} />

                  <div className="stat-grid">
                    <div className="stat-tile">
                      <div className="stat-tile__value tabular">
                        {f.myAccumulated ? pct(f.myAccumulated.correct, f.myAccumulated.total) : 0}%
                      </div>
                      <div className="stat-tile__label">Deg, akkumulert</div>
                    </div>
                    <div className="stat-tile">
                      <div className="stat-tile__value tabular">
                        {pct(f.accumulated.correct, f.accumulated.total)}%
                      </div>
                      <div className="stat-tile__label">{f.name}, akkumulert</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}

/** «Denne uken var du 80 % av Arthur» – uttrykt som forholdstall. */
function relative(me: number | null | undefined, them: number | null | undefined, label: string): string {
  if (me == null || them == null || them === 0) return `${label}: ikke nok data`
  return `${label}: du var ${Math.round((me / them) * 100)} % av dem`
}
