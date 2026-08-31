import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ComparisonBars } from '../components/Charts'
import { addFriend, listFriends, removeFriend, syncOutbox, type FriendSummary } from '../lib/api'
import { pct, totals } from '../lib/stats'
import { loadProfile, loadSessions } from '../lib/storage'

/**
 * Venner og ukesammenligning. Kontoen håndteres på Profil-skjermen, topplista
 * på sin egen – her handler alt om dem du selv har koblet deg til.
 */
export default function FriendsScreen() {
  const [friends, setFriends] = useState<FriendSummary[]>([])
  const [nickname, setNickname] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasAccount = Boolean(loadProfile().token)
  const mine = useMemo(() => totals(loadSessions()), [])

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

  if (!hasAccount) {
    return (
      <>
        <div className="page-head">
          <p className="eyebrow">Venner</p>
          <h1>Mål deg mot vennene dine</h1>
          <p>Sammenligning krever en profil, så serveren vet hvilke tall som er dine.</p>
        </div>
        <div className="card card--pad">
          <Link className="btn btn--primary" to="/konto">
            Lag en profil
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="page-head">
        <p className="eyebrow">Venner</p>
        <h1>Uke mot uke</h1>
      </div>

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
            const weeks = f.weeks
            const meThis = weeks[weeks.length - 1]?.me
            const meLast = weeks[weeks.length - 2]?.me
            const themThis = weeks[weeks.length - 1]?.friend
            const themLast = weeks[weeks.length - 2]?.friend
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
                    disabled={busy}
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

                <ComparisonBars weeks={weeks} meLabel="Deg" friendLabel={f.name} />

                <div className="stat-grid">
                  <div className="stat-tile">
                    <div className="stat-tile__value tabular">
                      {pct(f.myAccumulated.correct, f.myAccumulated.total)} %
                    </div>
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
    </>
  )
}

/** «Denne uken var du 80 % av Arthur» – uttrykt som forholdstall. */
function relative(me: number | null | undefined, them: number | null | undefined, label: string): string {
  if (me == null || them == null || them === 0) return `${label}: ikke nok data`
  return `${label}: du var ${Math.round((me / them) * 100)} % av dem`
}
