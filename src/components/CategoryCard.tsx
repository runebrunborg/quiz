import type { Category, Lang } from '../../shared/types'
import { t } from '../../shared/types'
import { ThemeScene } from '../themes/scenes'
import { IconCalendar, IconLive, IconSparkle } from './icons'

/**
 * Merkene i hjørnet av kortet. Ikon i stedet for tekst – tre korte ord tok
 * halve kortet, og de samme tre merkene går igjen på hvert eneste kort.
 * Betydningen står i tegnforklaringen over temaene, og i `title`/`aria-label`
 * her, så den er tilgjengelig både for peker og for skjermleser.
 */
const FLAGS = {
  dag: { label: 'Har et spørsmål som treffer dagens dato', icon: IconCalendar },
  fersk: { label: 'Har ferske nyhetsspørsmål i dag', icon: IconLive },
  ny: { label: 'Har nye spørsmål siden du spilte sist', icon: IconSparkle },
} as const

export type FlagKind = keyof typeof FLAGS

export function CategoryFlag({ kind }: { kind: FlagKind }) {
  const { label, icon: Icon } = FLAGS[kind]
  return (
    <span className={`flag flag--${kind}`} role="img" aria-label={label} title={label}>
      <Icon />
    </span>
  )
}

interface Props {
  category: Category
  lang: Lang
  selected: boolean
  /** Antall ordinære spørsmål på det valgte nivået. 0 betyr at kortet ikke kan velges. */
  available: number
  /** Temaet har et spørsmål med «på denne dag»-variant for dagens dato. */
  datedToday?: boolean
  /** Temaet har ferske dagsaktuelle spørsmål på det valgte nivået. */
  topicalToday?: boolean
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
  topicalToday,
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
      {(datedToday || topicalToday || hasNew) && (
        <span className="cat-card__flags">
          {datedToday && <CategoryFlag kind="dag" />}
          {topicalToday && <CategoryFlag kind="fersk" />}
          {hasNew && <CategoryFlag kind="ny" />}
        </span>
      )}
      <span className="cat-card__name">{t(category.name, lang)}</span>
      {note && <span className="cat-card__note">{note}</span>}
    </button>
  )
}
