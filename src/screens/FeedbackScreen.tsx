import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DIFFICULTIES, type Difficulty, FEEDBACK_REASON_LABELS, isFeedbackReason, t } from '../../shared/types'
import { Segmented } from '../components/Segmented'
import { fetchFeedbackSummary, pullMyFeedback, syncFeedback, type FeedbackSort, type FeedbackSummary } from '../lib/api'
import { CATEGORY_BY_ID, QUESTION_BY_ID, categoriesWithContent } from '../lib/content'
import { loadProfile } from '../lib/storage'
import { DIFFICULTY_LABELS } from '../lib/ui'

/**
 * Oversikt over hvilke spørsmål som får tommel opp og ned. Et redaksjonsverktøy:
 * her ser man hva som bør skrives om, ikke hvem som har ment hva. Kommentarene
 * vises derfor uten avsender.
 *
 * Spørsmålsteksten hentes fra banken i nettleseren, ikke fra serveren, så
 * lista alltid viser gjeldende ordlyd – også for spørsmål som er redigert etter
 * at stemmen falt.
 */
export default function FeedbackScreen() {
  const [sort, setSort] = useState<FeedbackSort>('verst')
  const [category, setCategory] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [data, setData] = useState<FeedbackSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasAccount = Boolean(loadProfile().token)
  const categories = useMemo(categoriesWithContent, [])

  const load = useCallback(async () => {
    if (!hasAccount) return
    setLoading(true)
    setError(null)
    try {
      setData(await fetchFeedbackSummary(sort, { category, difficulty }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunne ikke hente tilbakemeldingene')
    } finally {
      setLoading(false)
    }
  }, [sort, category, difficulty, hasAccount])

  useEffect(() => {
    void (async () => {
      // Egne stemmer først, så tallene under inkluderer det man nettopp mente.
      await syncFeedback().catch(() => undefined)
      await pullMyFeedback().catch(() => undefined)
      await load()
    })()
  }, [load])

  if (!hasAccount) {
    return (
      <>
        <div className="page-head">
          <p className="eyebrow">Tilbakemeldinger</p>
          <h1>Hvilke spørsmål holder mål?</h1>
          <p>
            Tommel opp og ned samles per spørsmål. Oversikten krever en konto, men stemmene du gir uten konto blir
            liggende på enheten og følger med når du logger inn.
          </p>
        </div>
        <div className="card card--pad stack">
          <Link className="btn btn--primary" to="/konto">
            Opprett konto
          </Link>
        </div>
      </>
    )
  }

  const totals = data?.totals
  const pctUp = totals && totals.votes > 0 ? Math.round((totals.up / totals.votes) * 100) : null

  return (
    <>
      <div className="page-head">
        <p className="eyebrow">Tilbakemeldinger</p>
        <h1>
          {totals?.questions ?? 0}{' '}
          <span style={{ WebkitTextFillColor: 'var(--text-muted)' }}>
            {totals?.questions === 1 ? 'vurdert spørsmål' : 'vurderte spørsmål'}
          </span>
        </h1>
        <p>
          Sortert på score, altså tommel opp minus tommel ned. Start i «Trenger arbeid» – det er der spørsmålene som
          bør skrives om ligger. Kjør <code>npm run content:feedback</code> for å hente hele lista ut som en rapport.
        </p>
      </div>

      {totals && totals.votes > 0 && (
        <div className="stat-grid" style={{ marginBottom: 'var(--sp-5)' }}>
          <div className="stat-tile">
            <div className="stat-tile__value tabular">{totals.votes}</div>
            <div className="stat-tile__label">stemmer totalt</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile__value tabular">{pctUp}%</div>
            <div className="stat-tile__label">tommel opp</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile__value tabular">{totals.down}</div>
            <div className="stat-tile__label">tommel ned</div>
          </div>
        </div>
      )}

      <div className="row" style={{ marginBottom: 'var(--sp-4)' }}>
        <Segmented
          ariaLabel="Sortering"
          value={sort}
          onChange={setSort}
          options={[
            { value: 'verst', label: 'Trenger arbeid' },
            { value: 'best', label: 'Best likt' },
            { value: 'flest', label: 'Flest stemmer' },
            { value: 'nyest', label: 'Nyeste' },
          ]}
        />
      </div>

      <div className="row" style={{ marginBottom: 'var(--sp-5)' }}>
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Tema">
          <option value="">Alle temaer</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {t(c.name, 'nb')}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          aria-label="Nivå"
        >
          <option value="">Alle nivåer</option>
          {DIFFICULTIES.map((d: Difficulty) => (
            <option key={d} value={d}>
              {DIFFICULTY_LABELS[d]}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="pill pill--bad">{error}</p>}

      {loading && !data ? (
        <p className="empty">Henter …</p>
      ) : !data || data.rows.length === 0 ? (
        <p className="empty">
          Ingen har stemt på noe ennå. Tommelknappene ligger nederst på hvert spørsmålskort under en runde.
        </p>
      ) : (
        <div className="stack">
          {data.rows.map((row) => {
            const q = QUESTION_BY_ID.get(row.questionId)
            const cat = CATEGORY_BY_ID.get(row.category || q?.category || '')
            const level = (q?.difficulty ?? row.difficulty) as Difficulty | ''
            const tone = row.score > 0 ? 'good' : row.score < 0 ? 'bad' : 'even'

            return (
              <div key={row.questionId} className={`fb-row${tone === 'even' ? '' : ` fb-row--${tone}`}`}>
                <div className="fb-row__head">
                  <p className="fb-row__prompt">
                    {q ? t(q.prompt, 'nb') : <span className="faint">Spørsmålet finnes ikke i banken lenger</span>}
                  </p>
                  <span className="fb-tally tabular">
                    <span className="fb-tally__up">👍 {row.up}</span>
                    <span className="fb-tally__down">👎 {row.down}</span>
                  </span>
                </div>

                <div className="fb-row__meta">
                  {cat && <span className="pill">{t(cat.name, 'nb')}</span>}
                  {level && <span className="pill">{DIFFICULTY_LABELS[level]}</span>}
                  <span className="pill faint">{row.questionId}</span>
                  {row.reasons.filter((r) => isFeedbackReason(r.reason)).map((r) => (
                    <span key={r.reason} className="pill pill--bad">
                      {FEEDBACK_REASON_LABELS[r.reason].nb}
                      {r.count > 1 && ` ×${r.count}`}
                    </span>
                  ))}
                </div>

                {q && (
                  <p className="faint" style={{ fontSize: 'var(--step--1)', margin: 0 }}>
                    Fasit: {t(q.answer, 'nb')}
                  </p>
                )}

                {row.comments.map((comment, i) => (
                  <p key={i} className="fb-comment">
                    {comment.vote === 'ned' ? '👎' : '👍'} {comment.text}
                  </p>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
