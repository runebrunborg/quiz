import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Difficulty, Region } from '../../shared/types'
import { langForRegion } from '../../shared/types'
import { CategoryCard } from '../components/CategoryCard'
import { Segmented } from '../components/Segmented'
import { ALL_QUESTIONS, CATEGORIES, CATEGORY_BY_ID, poolFor, QUESTIONS_PER_ROUND } from '../lib/content'
import { loadPrefs, savePrefs } from '../lib/storage'
import { DIFFICULTY_LABELS, REGION_HELP, REGION_LABELS } from '../lib/ui'
import { t } from '../../shared/types'

export default function StartScreen() {
  const navigate = useNavigate()
  const saved = useMemo(loadPrefs, [])
  const [difficulty, setDifficulty] = useState<Difficulty>(saved.difficulty)
  const [region, setRegion] = useState<Region>(saved.region)
  const [category, setCategory] = useState<string | null>(saved.category)

  const lang = langForRegion(region)
  const selected = category ? CATEGORY_BY_ID.get(category) : undefined
  const available = category ? poolFor(category, difficulty).length : 0
  const canStart = Boolean(category) && available > 0

  const bankTotal = ALL_QUESTIONS.length
  const bankTarget = CATEGORIES.length * 3 * QUESTIONS_PER_ROUND

  function start() {
    if (!category) return
    savePrefs({ category, difficulty, region })
    navigate(`/spill/${category}/${difficulty}/${region}`)
  }

  return (
    <>
      <div className="page-head">
        <p className="eyebrow">Theme Quiz</p>
        <h1>Ti spørsmål. Ett tema.</h1>
        <p>
          Velg et tema, et nivå og et utgangspunkt. Alle ti spørsmålene vises samtidig – ta hint når du står fast,
          og vend fasit når du er klar.
        </p>
        <p className="setup__note" style={{ marginTop: 'var(--sp-4)' }}>
          Banken har <strong className="tabular">{bankTotal}</strong> av {bankTarget} spørsmål ({CATEGORIES.length}{' '}
          temaer × 3 nivåer × {QUESTIONS_PER_ROUND}).{' '}
          <a href="/banken">Se hva som mangler</a>
        </p>
      </div>

      <div className="setup">
        <div className="setup__row">
          <span className="setup__label">Vanskelighetsgrad</span>
          <Segmented
            ariaLabel="Vanskelighetsgrad"
            value={difficulty}
            onChange={setDifficulty}
            options={(['lett', 'medium', 'vanskelig'] as Difficulty[]).map((d) => ({
              value: d,
              label: DIFFICULTY_LABELS[d],
            }))}
          />
        </div>

        <div className="setup__row">
          <span className="setup__label">Utgangspunkt</span>
          <Segmented
            ariaLabel="Utgangspunkt"
            value={region}
            onChange={setRegion}
            options={(['no', 'se', 'int'] as Region[]).map((r) => ({ value: r, label: REGION_LABELS[r] }))}
          />
          <p className="setup__note">{REGION_HELP[region]}</p>
        </div>

        <div className="setup__row">
          <span className="setup__label">Tema</span>
          <div className="cat-grid">
            {CATEGORIES.map((c) => (
              <CategoryCard
                key={c.id}
                category={c}
                lang={lang}
                selected={category === c.id}
                available={poolFor(c.id, difficulty).length}
                needed={QUESTIONS_PER_ROUND}
                onSelect={() => setCategory(c.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="launchbar">
        <div className="launchbar__text">
          {selected ? (
            <>
              <strong>{t(selected.name, lang)}</strong> · {DIFFICULTY_LABELS[difficulty]} · {REGION_LABELS[region]}
              <br />
              <span className="faint">
                {available === 0
                  ? 'Ingen spørsmål på dette nivået ennå – velg et annet nivå eller tema.'
                  : `${Math.min(available, QUESTIONS_PER_ROUND)} spørsmål klare${
                      available > QUESTIONS_PER_ROUND ? ` (trekkes fra ${available})` : ''
                    }`}
              </span>
            </>
          ) : (
            <span className="faint">Velg et tema for å starte.</span>
          )}
        </div>
        <button type="button" className="btn btn--primary btn--lg" disabled={!canStart} onClick={start}>
          Start runden
        </button>
      </div>
    </>
  )
}
