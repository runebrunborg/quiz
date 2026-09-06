import type { Category, Lang } from '../../shared/types'
import { t } from '../../shared/types'
import { ThemeScene } from '../themes/scenes'

interface Props {
  category: Category
  lang: Lang
  selected: boolean
  /** Antall ordinære spørsmål på det valgte nivået. 0 betyr at kortet ikke kan velges. */
  available: number
  /** Temaet har et spørsmål med «på denne dag»-variant for dagens dato. */
  datedToday?: boolean
  /** Puljen har vokst siden spilleren sist spilte temaet på dette nivået. */
  hasNew?: boolean
  /** Vises i arkivet: når temaet sist ble spilt. */
  note?: string
  onSelect: () => void
}

export function CategoryCard({
  category,
  lang,
  selected,
  available,
  datedToday,
  hasNew,
  note,
  onSelect,
}: Props) {
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
      {(datedToday || hasNew) && (
        <span className="cat-card__flags">
          {datedToday && <span className="pill pill--pink">I dag</span>}
          {hasNew && <span className="pill pill--pink">Nytt stoff</span>}
        </span>
      )}
      <span className="cat-card__name">{t(category.name, lang)}</span>
      {note && <span className="cat-card__note">{note}</span>}
    </button>
  )
}
