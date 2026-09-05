import type { Category, Lang } from '../../shared/types'
import { t } from '../../shared/types'
import { ThemeScene } from '../themes/scenes'

interface Props {
  category: Category
  lang: Lang
  selected: boolean
  available: number
  needed: number
  /** Temaet har et spørsmål med «på denne dag»-variant for dagens dato. */
  datedToday?: boolean
  onSelect: () => void
}

export function CategoryCard({ category, lang, selected, available, needed, datedToday, onSelect }: Props) {
  const ready = available >= needed
  const fill = Math.min(100, Math.round((available / needed) * 100))
  return (
    <button
      type="button"
      className="cat-card"
      aria-pressed={selected}
      onClick={onSelect}
      disabled={available === 0}
      style={{ opacity: available === 0 ? 0.45 : 1 }}
    >
      <span className="cat-card__scene">
        <ThemeScene scene={category.scene} />
      </span>
      <span className="cat-card__veil" />
      {datedToday && (
        <span className="cat-card__today pill pill--pink">{lang === 'sv' ? 'I dag' : 'I dag'}</span>
      )}
      <span className="cat-card__name">{t(category.name, lang)}</span>
      <span className="cat-card__meter">
        <span className="meter">
          <span className="meter__fill" style={{ width: `${fill}%` }} />
        </span>
        <span className="tabular">
          {available}/{needed}
        </span>
      </span>
      {!ready && available > 0 && (
        <span className="visually-hidden">Ikke nok spørsmål på dette nivået ennå</span>
      )}
    </button>
  )
}
