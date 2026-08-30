import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Segmented } from '../components/Segmented'
import {
  fetchLeaderboard,
  syncOutbox,
  type LeaderboardEntry,
  type LeaderboardPeriod,
  type LeaderboardScope,
} from '../lib/api'
import { loadProfile } from '../lib/storage'

/**
 * Rangering på antall riktige svar, ikke på treffprosent alene – ellers vinner
 * den som spiller minst. Treffprosenten står ved siden av, så du ser begge deler.
 */
export default function LeaderboardScreen() {
  const [scope, setScope] = useState<LeaderboardScope>('friends')
  const [period, setPeriod] = useState<LeaderboardPeriod>('week')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [minAnswers, setMinAnswers] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasAccount = Boolean(loadProfile().token)

  const load = useCallback(async () => {
    if (!hasAccount) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetchLeaderboard(scope, period)
      setEntries(res.entries)
      setMinAnswers(res.minAnswers)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunne ikke hente topplista')
    } finally {
      setLoading(false)
    }
  }, [scope, period, hasAccount])

  useEffect(() => {
    void (async () => {
      await syncOutbox().catch(() => undefined)
      await load()
    })()
  }, [load])

  if (!hasAccount) {
    return (
      <>
        <div className="page-head">
          <p className="eyebrow">Toppliste</p>
          <h1>Se hvor du ligger an</h1>
          <p>Topplista krever en konto, så serveren vet hvilke tall som er dine.</p>
        </div>
        <div className="card card--pad stack">
          <Link className="btn btn--primary" to="/konto">
            Opprett konto
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="page-head">
        <p className="eyebrow">Toppliste</p>
        <h1>Rangering</h1>
        <p>Sortert på antall riktige svar. Treffprosenten står ved siden av.</p>
      </div>

      <div className="row" style={{ marginBottom: 'var(--sp-4)' }}>
        <Segmented
          ariaLabel="Hvem"
          value={scope}
          onChange={setScope}
          options={[
            { value: 'friends', label: 'Venner' },
            { value: 'all', label: 'Alle' },
          ]}
        />
        <Segmented
          ariaLabel="Periode"
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'week', label: 'Denne uken' },
            { value: 'all', label: 'Totalt' },
          ]}
        />
      </div>

      {error && <p className="pill pill--bad">{error}</p>}

      {loading && entries.length === 0 ? (
        <p className="empty">Henter …</p>
      ) : entries.length === 0 ? (
        <p className="empty">
          {scope === 'friends'
            ? 'Ingen tall ennå. Legg til venner med vennekoden, eller spill en runde.'
            : `Ingen har spilt nok til å komme med ennå. Det kreves ${minAnswers} besvarte spørsmål.`}
        </p>
      ) : (
        <div className="stack">
          {entries.map((e) => (
            <div
              className="friend-row"
              key={e.id}
              style={e.me ? { borderColor: 'var(--border-pink)' } : undefined}
            >
              <span className="avatar tabular">{e.rank}</span>
              <div style={{ flex: 1 }}>
                <strong>
                  {e.name}
                  {e.me && <span className="faint"> · deg</span>}
                </strong>
                <div className="faint" style={{ fontSize: 'var(--step--1)' }}>
                  {e.total === 0 ? 'ingen svar i perioden' : `${e.correct} av ${e.total} riktige`}
                </div>
              </div>
              <span className="tabular" style={{ fontWeight: 600 }}>
                {e.pct === null ? '–' : `${e.pct}%`}
              </span>
            </div>
          ))}
        </div>
      )}

      {scope === 'all' && entries.length > 0 && (
        <p className="faint" style={{ fontSize: 'var(--step--1)', marginTop: 'var(--sp-4)' }}>
          Alle med minst {minAnswers} besvarte spørsmål i perioden er med, opptil femti navn. Visningsnavnet er det
          eneste som vises – du kan endre det under Profil.
        </p>
      )}
    </>
  )
}
