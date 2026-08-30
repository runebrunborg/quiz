import { useMemo } from 'react'
import { DIFFICULTIES, type Difficulty, t } from '../../shared/types'
import { ALL_QUESTIONS, CATEGORIES, CATEGORY_BY_ID, coverage, QUESTIONS_PER_ROUND } from '../lib/content'
import { DIFFICULTY_LABELS } from '../lib/ui'

/**
 * Statusskjerm for innholdsbanken: hvor mange spørsmål som finnes per tema og
 * nivå, og hvor mange som gjenstår før alt er fylt opp.
 */
export default function BankScreen() {
  const rows = useMemo(coverage, [])
  const target = CATEGORIES.length * DIFFICULTIES.length * QUESTIONS_PER_ROUND
  const have = ALL_QUESTIONS.length

  return (
    <>
      <div className="page-head">
        <p className="eyebrow">Banken</p>
        <h1>
          {have} <span style={{ WebkitTextFillColor: 'var(--text-muted)' }}>av {target}</span>
        </h1>
        <p>
          {CATEGORIES.length} temaer × {DIFFICULTIES.length} nivåer × {QUESTIONS_PER_ROUND} spørsmål. Grønn prikk =
          nivået er komplett. Be Claude fylle på et tema, så dukker det opp her.
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
                    const cls = n >= QUESTIONS_PER_ROUND ? 'full' : n > 0 ? 'part' : 'empty'
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
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
