/**
 * Theme Quiz-merket: Q-en — ringen og halen som krysser den.
 * Ved innlasting tegner ringen seg selv fra toppen, så slår halen ut. Deretter
 * vandrer begge gjennom de fire temafargene, halen fire sekunder forskjøvet, så
 * de aldri viser samme farge samtidig.
 * Fargene og animasjonen ligger i base.css og slås av under prefers-reduced-motion.
 */
type LogoProps = {
  /** Kantlengde på merket i piksler. */
  size?: number
  /** Tegn ordmerket «ThemeQuiz» ved siden av merket. */
  withWordmark?: boolean
  /** Slå av opptegning og fargesyklus (f.eks. i en tett liste). */
  still?: boolean
}

export default function Logo({ size = 30, withWordmark = false, still = false }: LogoProps) {
  const mark = (
    <svg
      className={still ? 'tq-mark tq-mark--still' : 'tq-mark'}
      width={size}
      height={size}
      viewBox="0 0 64 64"
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
