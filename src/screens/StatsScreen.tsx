import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { TOPIC_LABELS, type Topic } from '../../shared/types'
import { BarRow, TrendChart } from '../components/Charts'
import { CATEGORY_BY_ID } from '../lib/content'
import { loadSessions } from '../lib/storage'
import { byCategory, byTopic, byWeek, pct, totals } from '../lib/stats'
import { t } from '../../shared/types'

export default function StatsScreen() {
  const sessions = useMemo(loadSessions, [])
  const weeks = useMemo(() => byWeek(sessions), [sessions])
  const topics = useMemo(() => byTopic(sessions), [sessions])
  const categories = useMemo(() => byCategory(sessions), [sessions])
  const sum = useMemo(() => totals(sessions), [sessions])

  if (sum.rounds === 0) {
    return (
      <>
        <div className="page-head">
          <p className="eyebrow">Statistikk</p>
          <h1>Ingen runder ennå</h1>
          <p>Spill en runde, så begynner kurvene å tegne seg her.</p>
        </div>
        <Link className="btn btn--primary btn--lg" to="/">
          Start en runde
        </Link>
      </>
    )
  }

  const strongest = topics.filter((tp) => tp.total >= 3).slice().sort((a, b) => pct(b.correct, b.total) - pct(a.correct, a.total))

  return (
    <>
      <div className="page-head">
        <p className="eyebrow">Statistikk</p>
        <h1>Slik ligger du an</h1>
      </div>

      <div className="stat-grid">
        <div className="stat-tile">
          <div className="stat-tile__value tabular">{pct(sum.correct, sum.total)}%</div>
          <div className="stat-tile__label">Treffprosent totalt</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile__value tabular">{sum.rounds}</div>
          <div className="stat-tile__label">Runder spilt</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile__value tabular">
            {sum.correct}
            <span className="faint" style={{ fontSize: '0.5em' }}>
              /{sum.total}
            </span>
          </div>
          <div className="stat-tile__label">Riktige svar</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile__value tabular">{sum.streak}</div>
          <div className="stat-tile__label">Dager på rad</div>
        </div>
      </div>

      <section className="section">
        <div className="section__head">
          <h2>Utvikling per uke</h2>
        </div>
        <div className="card card--pad">
          <TrendChart
            labels={weeks.map((w) => w.week.replace(/^\d+-W/, 'u'))}
            series={[
              {
                label: 'Treffprosent',
                color: 'var(--chart-1)',
                points: weeks.map((w) => pct(w.correct, w.total)),
              },
            ]}
            caption="Andel riktige svar per ISO-uke"
          />
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2>Sterke og svake emner</h2>
          <span className="faint" style={{ fontSize: 'var(--step--1)' }}>
            Basert på skjulte emne-tags
          </span>
        </div>
        <div className="card card--pad">
          {strongest.length === 0 ? (
            <p className="muted">Spill litt mer – emnene dukker opp når du har minst tre svar innen et emne.</p>
          ) : (
            strongest.map((tp) => (
              <BarRow
                key={tp.topic}
                name={TOPIC_LABELS[tp.topic as Topic].nb}
                correct={tp.correct}
                total={tp.total}
              />
            ))
          )}
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2>Per tema</h2>
        </div>
        <div className="card card--pad">
          {categories.map((c) => (
            <BarRow
              key={c.category}
              name={t(CATEGORY_BY_ID.get(c.category)?.name ?? c.category, 'nb')}
              correct={c.correct}
              total={c.total}
            />
          ))}
        </div>
      </section>
    </>
  )
}
