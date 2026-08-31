/**
 * Theme Quiz-merket: Q-en — ringen og halen som krysser den.
 * Ved innlasting tegner ringen seg selv fra toppen, så slår halen ut. Deretter
 * vandrer begge gjennom de fire temafargene, halen fire sekunder forskjøvet, så
 * de aldri viser samme farge samtidig.
 * Fargene og animasjonen ligger i base.css og slås av under prefers-reduced-motion.
 */
type LogoProps = {
  /** Kantlengde på selve merket i piksler — viewBox er beskåret til tegnet,
   *  så det er ingen usynlig luft rundt. Avstanden styres av `gap` i `.brand`. */
  size?: number
  /** Tegn ordmerket «ThemeQuiz» ved siden av merket. */
  withWordmark?: boolean
  /** Slå av opptegning og fargesyklus (f.eks. i en tett liste). */
  still?: boolean
}

export default function Logo({ size = 24, withWordmark = false, still = false }: LogoProps) {
  const mark = (
    <svg
      className={still ? 'tq-mark tq-mark--still' : 'tq-mark'}
      width={size}
      height={size}
      viewBox="7.5 5.5 46 46"
      aria-hidden="true"
      focusable="false"
    >
      {/* Rotert -90° slik at opptegningen starter på toppen av ringen. */}
      <circle
        className="tq-ring"
        cx="29"
        cy="27"
        r="17"
        fill="none"
        strokeWidth="9"
        transform="rotate(-90 29 27)"
      />
      <path
        className="tq-tail"
        d="M34 32 L49 47"
        fill="none"
        strokeWidth="9"
        strokeLinecap="round"
      />
    </svg>
  )

  if (!withWordmark) return mark

  return (
    <>
      {mark}
      <span className="tq-word">
        <span className="tq-word__a">Theme</span>
        <span className="tq-word__b">Quiz</span>
      </span>
    </>
  )
}
