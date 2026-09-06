import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Difficulty, Region } from '../../shared/types'
import { langForRegion } from '../../shared/types'
import { CategoryCard } from '../components/CategoryCard'
import { Segmented } from '../components/Segmented'
import {
  ALL_QUESTIONS,
  CATEGORIES,
  categoriesInDisplayOrder,
  CATEGORY_BY_ID,
  makeRng,
  ordinaryFor,
  POOL_TARGET,
  poolFor,
  QUESTIONS_PER_ROUND,
} from '../lib/content'
import { loadPlayed, statusOf, unseenOf, type CategoryStatus, playedKey } from '../lib/played'
import { loadPrefs, savePrefs } from '../lib/storage'
import { DIFFICULTY_LABELS, REGION_HELP, REGION_LABELS } from '../lib/ui'
import { t } from '../../shared/types'

export default function StartScreen() {
  const navigate = useNavigate()
  const saved = useMemo(loadPrefs, [])
  const [difficulty, setDifficulty] = useState<Difficulty>(saved.difficulty)
  const [region, setRegion] = useState<Region>(saved.region)
  const [category, setCategory] = useState<string | null>(saved.category)

  // Ny rekkefølge hver gang skjermen åpnes, så det ikke alltid er Blå som møter
  // deg først. Frøet ligger fast mens du står på siden, så rekkefølgen holder
  // seg når du bytter nivå – bortsett fra at temaer med et spørsmål for dagens
  // dato alltid ligger først.
  //
  // Bare temaer som faktisk har spørsmål vises her. Et tema kan være registrert
  // i content/categories.ts før puljen er skrevet – da hører det hjemme på
  // bankskjermen som et hull, ikke på startskjermen som et kort du ikke kan
  // spille. Måltallet under teller fortsatt alle temaer, også de tomme.
  const seed = useMemo(() => `${Date.now()}-${Math.random()}`, [])
  const ordered = useMemo(
    () => categoriesInDisplayOrder(makeRng(seed), difficulty),
    [seed, difficulty],
  )
  // Spilte temaer legger seg i arkivet, og hentes ut av det igjen av seg selv
  // når puljen har vokst siden sist. Indeksen leses én gang per besøk på
  // skjermen – runden man nettopp spilte er ferdig lagret når man kommer hit.
  const played = useMemo(loadPlayed, [])
  const rows = useMemo(
    () =>
      ordered.map(({ category: c, datedToday }) => {
        const pool = ordinaryFor(c.id, difficulty)
        const entry = played[playedKey(c.id, difficulty)]
        const status: CategoryStatus = statusOf(entry, pool.length)
        return {
          category: c,
          datedToday,
          available: pool.length,
          status,
          entry,
          unseen: unseenOf(entry, pool.map((q) => q.id)),
        }
      }),
    [ordered, difficulty, played],
  )
  const active = rows.filter((r) => r.status !== 'spilt')
  const archived = rows.filter((r) => r.status === 'spilt')
  const datedCount = active.filter((o) => o.datedToday).length
  const archiveOpen = archived.some((r) => r.category.id === category)

  const lang = langForRegion(region)
  const selected = category ? CATEGORY_BY_ID.get(category) : undefined
  const available = category ? poolFor(category, difficulty).length : 0
  const canStart = Boolean(category) && available > 0

  const bankTotal = ALL_QUESTIONS.length
  const bankTarget = CATEGORIES.length * 3 * POOL_TARGET

  function start() {
    if (!category) return
    savePrefs({ category, difficulty, region })
    navigate(`/spill/${category}/${difficulty}/${region}`)
  }

  return (
    <>
      <div className="page-head">
        <p className="eyebrow">LinnQuiz</p>
        <h1>Ti spørsmål. Ett tema.</h1>
        <p>
          Velg et tema, et nivå og et utgangspunkt. Alle ti spørsmålene vises samtidig – ta hint når du står fast,
          og vend fasit når du er klar.
        </p>
        <p className="setup__note" style={{ marginTop: 'var(--sp-4)' }}>
          Banken har <strong className="tabular">{bankTotal}</strong> av {bankTarget} spørsmål ({CATEGORIES.length}{' '}
          temaer × 3 nivåer × {POOL_TARGET}).{' '}
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
          {datedCount > 0 && (
            <p className="setup__note">
              {datedCount === 1 ? 'Ett tema' : `${datedCount} temaer`} har et spørsmål som treffer dagens dato, og
              ligger derfor først.
            </p>
          )}
          {active.length > 0 ? (
            <div className="cat-grid">
              {active.map((r) => (
                <CategoryCard
                  key={r.category.id}
                  category={r.category}
                  lang={lang}
                  selected={category === r.category.id}
                  available={r.available}
                  datedToday={r.datedToday}
                  hasNew={r.status === 'oppdatert'}
                  note={r.status === 'oppdatert' ? `${r.unseen} du ikke har sett` : undefined}
                  onSelect={() => setCategory(r.category.id)}
                />
              ))}
            </div>
          ) : (
            <p className="setup__note">
              Du har spilt alle temaene på dette nivået. De ligger i arkivet under – og kommer tilbake hit av seg
              selv når de får nye spørsmål.
            </p>
          )}

          {archived.length > 0 && (
            <details className="archive" open={archiveOpen}>
              <summary className="archive__summary">
                Arkiv · {archived.length} {archived.length === 1 ? 'tema' : 'temaer'} du har spilt
              </summary>
              <p className="setup__note">
                Spilt på {DIFFICULTY_LABELS[difficulty].toLowerCase()}. Ingenting er slettet – velg et tema her for
                å ta det igjen.
              </p>
              <div className="cat-grid">
                {archived.map((r) => (
                  <CategoryCard
                    key={r.category.id}
                    category={r.category}
                    lang={lang}
                    selected={category === r.category.id}
                    available={r.available}
                    datedToday={r.datedToday}
                    note={playedNote(r.entry?.at, r.unseen)}
                    onSelect={() => setCategory(r.category.id)}
                  />
                ))}
              </div>
            </details>
          )}
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

/** «Spilt 3. september · 4 spørsmål du ikke har sett» */
function playedNote(at: number | undefined, unseen: number): string | undefined {
  if (at === undefined) return undefined
  const dato = new Date(at).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long' })
  return unseen > 0 ? `Spilt ${dato} · ${unseen} usett` : `Spilt ${dato}`
}
