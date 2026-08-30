/**
 * Theme Quiz-merket: fire blad som vifter seg ut fra ett punkt, ett per temafarge.
 * Bladene henter farge fra designtokens, så merket følger paletten automatisk.
 * Animasjonen ligger i base.css og slås av under prefers-reduced-motion.
 */
type LogoProps = {
  /** Kantlengde på merket i piksler. */
  size?: number
  /** Tegn ordmerket «ThemeQuiz» ved siden av merket. */
  withWordmark?: boolean
  /** Slå av vifte- og pustebevegelsen (f.eks. i en tett liste). */
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
      <g className="tq-blade tq-blade--1">
        <rect x="26.5" y="14" width="11" height="34" rx="5.5" />
      </g>
      <g className="tq-blade tq-blade--2">
        <rect x="26.5" y="14" width="11" height="34" rx="5.5" />
      </g>
      <g className="tq-blade tq-blade--3">
        <rect x="26.5" y="14" width="11" height="34" rx="5.5" />
      </g>
      <g className="tq-blade tq-blade--4">
        <rect x="26.5" y="14" width="11" height="34" rx="5.5" />
      </g>
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
