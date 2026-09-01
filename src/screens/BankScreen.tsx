import { useMemo } from 'react'
import { DIFFICULTIES, type Difficulty, t } from '../../shared/types'
import {
  ALL_QUESTIONS,
  CATEGORIES,
  CATEGORY_BY_ID,
  coverage,
  POOL_TARGET,
  QUESTIONS_PER_ROUND,
  TOPICAL_PER_ROUND,
} from '../lib/content'
import { DIFFICULTY_LABELS } from '../lib/ui'

/**
 * Statusskjerm for innholdsbanken: hvor mange spørsmål som finnes per tema og
 * nivå, og hvor mange som gjenstår før alt er fylt opp.
 */
export default function BankScreen() {
  const rows = useMemo(() => coverage(), [])
  const target = CATEGORIES.length * DIFFICULTIES.length * POOL_TARGET
  const have = ALL_QUESTIONS.filter((q) => !q.topical).length
  const topicalHave = rows.reduce((sum, r) => sum + r.topicalTotal, 0)
  const topicalTarget = CATEGORIES.length * DIFFICULTIES.length * TOPICAL_PER_ROUND

  return (
    <>
      <div className="page-head">
        <p className="eyebrow">Banken</p>
        <h1>
          {have} <span style={{ WebkitTextFillColor: 'var(--text-muted)' }}>av {target}</span>
        </h1>
        <p>
          {CATEGORIES.length} temaer × {DIFFICULTIES.length} nivåer × {POOL_TARGET} spørsmål. Hver runde trekker{' '}
          {QUESTIONS_PER_ROUND} fra puljen etter kvote: velger du norsk blir fem norskforankrede, to svenske og tre
          internasjonale. En norsk og en svensk runde av samme tema deler derfor bare rundt halvparten av
          spørsmålene. Grønn prikk = nivået er fullt. Be Claude fylle på et tema, så dukker det opp her.
        </p>
        <p className="setup__note">
          I tillegg kommer de dagsaktuelle: <strong className="tabular">{topicalHave}</strong> av {topicalTarget} (
          {TOPICAL_PER_ROUND} per tema og nivå). De erstatter to av de ti i runden så lenge de er ferske, og
          forsvinner av seg selv når utløpsdatoen er passert – med mindre de er merket som gode også etterpå.
        </p>
      </div>

      <div className="card card--pad">
        <table className="coverage-table">
          <thead>
            <tr>
              <th>Tema</th>
              {DIFFICULTIES.map((d) => (
                <th key={d} style={{ textAlign: 'right' }}>
                  {DIFFICULTY_LABELS[d]}
                </th>
              ))}
              <th style={{ textAlign: 'right' }}>Sum</th>
              <th style={{ textAlign: 'right' }}>Aktuelt</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const cat = CATEGORY_BY_ID.get(row.category)
              return (
                <tr key={row.category}>
                  <td>{cat ? t(cat.name, 'nb') : row.category}</td>
                  {DIFFICULTIES.map((d: Difficulty) => {
                    const n = row.perDifficulty[d]
                    const cls = n >= POOL_TARGET ? 'full' : n >= QUESTIONS_PER_ROUND ? 'part' : 'empty'
                    return (
                      <td key={d} className="num">
                        <span className={`dot dot--${cls}`} />
                        {n}
                      </td>
                    )
                  })}
                  <td className="num">
                    <strong>{row.total}</strong>
                  </td>
                  <td className="num">
                    <span
                      className={`dot dot--${
                        row.topicalTotal >= TOPICAL_PER_ROUND * DIFFICULTIES.length
                          ? 'full'
                          : row.topicalTotal > 0
                            ? 'part'
                            : 'empty'
                      }`}
                    />
                    {row.topicalTotal}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
