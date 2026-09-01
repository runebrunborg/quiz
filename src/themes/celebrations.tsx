/* eslint-disable react/no-unknown-property */
/**
 * Feiringer – og det motsatte. Et lite bibliotek av animasjoner som legger seg
 * over resultatskjermen i noen sekunder og forsvinner av seg selv.
 *
 * Bibliotektanken er hele poenget: poengsummen bestemmer *stemningen*
 * (topp, midt, bunn), og så trekkes én tilfeldig animasjon i den stemningen.
 * Da blir det ikke samme fyrverkeri hver gang man gjør det bra.
 *
 * Alt er CSS og SVG. Ingen bilder, ingen bibliotek, ingen canvas. Ligger man
 * på «reduser bevegelse», vises ingenting.
 */
import { useEffect, useMemo, useState, type CSSProperties, type ReactElement } from 'react'
import { makeRng } from '../lib/content'

export type Band = 'topp' | 'midt' | 'bunn'

export interface CelebrationSpec {
  id: string
  band: Band
  /** Hvor lenge overlegget står før det tas bort. */
  ms: number
  render: (rng: () => number) => ReactElement
}

/** Litt kortere vei til en tilfeldig verdi i et intervall. */
function between(rng: () => number, lo: number, hi: number): number {
  return lo + rng() * (hi - lo)
}

const SPARK_COLORS = ['#ff2d8e', '#ffc94d', '#3ad6e0', '#ff5fa8', '#8e44d8', '#ffffff']

/* ------------------------------------------------------------------- topp */

const fyrverkeri: CelebrationSpec = {
  id: 'fyrverkeri',
  band: 'topp',
  ms: 3600,
  render: (rng) => (
    <>
      {Array.from({ length: 7 }, (_, b) => {
        const left = between(rng, 10, 90)
        const top = between(rng, 10, 62)
        const delay = b * between(rng, 200, 340)
        const color = SPARK_COLORS[Math.floor(rng() * SPARK_COLORS.length)]
        return (
          <span key={b} className="fw" style={{ left: `${left}%`, top: `${top}%` }}>
            <span className="fw__flash" style={{ animationDelay: `${delay.toFixed(0)}ms` }} />
            {Array.from({ length: 22 }, (_, i) => (
              <span
                key={i}
                className="fw__spark"
                style={
                  {
                    '--a': `${(360 / 22) * i + between(rng, -5, 5)}deg`,
                    '--d': `${between(rng, 110, 200).toFixed(0)}px`,
                    background: i % 4 === 0 ? '#ffffff' : color,
                    animationDelay: `${delay.toFixed(0)}ms`,
                  } as CSSProperties
                }
              />
            ))}
          </span>
        )
      })}
    </>
  ),
}

const konfetti: CelebrationSpec = {
  id: 'konfetti',
  band: 'topp',
  ms: 4200,
  render: (rng) => (
    <>
      {Array.from({ length: 60 }, (_, i) => (
        <span
          key={i}
          className="cf"
          style={
            {
              left: `${between(rng, -2, 102).toFixed(1)}%`,
              background: SPARK_COLORS[Math.floor(rng() * SPARK_COLORS.length)],
              width: `${between(rng, 6, 12).toFixed(0)}px`,
              height: `${between(rng, 9, 18).toFixed(0)}px`,
              borderRadius: rng() < 0.3 ? '50%' : '2px',
              animationDuration: `${between(rng, 2200, 3600).toFixed(0)}ms`,
              animationDelay: `${between(rng, 0, 900).toFixed(0)}ms`,
              '--spin': `${between(rng, 360, 1080).toFixed(0)}deg`,
              '--drift': `${between(rng, -90, 90).toFixed(0)}px`,
            } as CSSProperties
          }
        />
      ))}
    </>
  ),
}

const stjerneregn: CelebrationSpec = {
  id: 'stjerneregn',
  band: 'topp',
  ms: 3800,
  render: (rng) => (
    <>
      {Array.from({ length: 14 }, (_, i) => (
        <span
          key={i}
          className="shoot"
          style={{
            left: `${between(rng, -10, 80).toFixed(0)}%`,
            top: `${between(rng, -5, 60).toFixed(0)}%`,
            animationDelay: `${between(rng, 0, 2200).toFixed(0)}ms`,
            animationDuration: `${between(rng, 800, 1400).toFixed(0)}ms`,
          }}
        />
      ))}
      {Array.from({ length: 26 }, (_, i) => (
        <span
          key={`t${i}`}
          className="twinkle"
          style={{
            left: `${between(rng, 2, 98).toFixed(0)}%`,
            top: `${between(rng, 2, 80).toFixed(0)}%`,
            animationDelay: `${between(rng, 0, 2400).toFixed(0)}ms`,
          }}
        />
      ))}
    </>
  ),
}

/* -------------------------------------------------------------------- midt */

const ballonger: CelebrationSpec = {
  id: 'ballonger',
  band: 'midt',
  ms: 4600,
  render: (rng) => (
    <>
      {Array.from({ length: 11 }, (_, i) => {
        const color = SPARK_COLORS[Math.floor(rng() * SPARK_COLORS.length)]
        const w = between(rng, 26, 46)
        return (
          <span
            key={i}
            className="balloon"
            style={
              {
                left: `${between(rng, 2, 94).toFixed(0)}%`,
                width: `${w.toFixed(0)}px`,
                animationDuration: `${between(rng, 3200, 4400).toFixed(0)}ms`,
                animationDelay: `${between(rng, 0, 1400).toFixed(0)}ms`,
                '--sway': `${between(rng, -40, 40).toFixed(0)}px`,
              } as CSSProperties
            }
          >
            <svg viewBox="0 0 40 62" aria-hidden="true">
              <ellipse cx="20" cy="21" rx="17" ry="21" fill={color} opacity="0.85" />
              <ellipse cx="14" cy="14" rx="5" ry="7" fill="#ffffff" opacity="0.35" />
              <path d="M17 41h6l-3 5z" fill={color} />
              <path d="M20 46c5 5-6 6 0 12" stroke={color} strokeWidth="1.5" fill="none" opacity="0.7" />
            </svg>
          </span>
        )
      })}
    </>
  ),
}

const papirfly: CelebrationSpec = {
  id: 'papirfly',
  band: 'midt',
  ms: 4200,
  render: (rng) => (
    <>
      <span className="plane" style={{ top: `${between(rng, 18, 42).toFixed(0)}%` }}>
        <svg viewBox="0 0 64 40" aria-hidden="true">
          <path d="M2 18L62 2 44 38l-13-11z" fill="#ffe3f1" opacity="0.9" />
          <path d="M2 18l29 9 13-25z" fill="#ff8ac2" opacity="0.9" />
        </svg>
      </span>
      {Array.from({ length: 14 }, (_, i) => (
        <span
          key={i}
          className="puff"
          style={{
            top: `${between(rng, 16, 46).toFixed(0)}%`,
            left: `${between(rng, 0, 96).toFixed(0)}%`,
            animationDelay: `${between(rng, 200, 2600).toFixed(0)}ms`,
          }}
        />
      ))}
    </>
  ),
}

const bobler: CelebrationSpec = {
  id: 'bobler',
  band: 'midt',
  ms: 4600,
  render: (rng) => (
    <>
      {Array.from({ length: 34 }, (_, i) => {
        const size = between(rng, 10, 42)
        return (
          <span
            key={i}
            className="bubble"
            style={
              {
                left: `${between(rng, 0, 98).toFixed(0)}%`,
                width: `${size.toFixed(0)}px`,
                height: `${size.toFixed(0)}px`,
                animationDuration: `${between(rng, 3000, 4400).toFixed(0)}ms`,
                animationDelay: `${between(rng, 0, 1600).toFixed(0)}ms`,
                '--sway': `${between(rng, -50, 50).toFixed(0)}px`,
              } as CSSProperties
            }
          />
        )
      })}
    </>
  ),
}

/* -------------------------------------------------------------------- bunn */

const fugleklatt: CelebrationSpec = {
  id: 'fugleklatt',
  band: 'bunn',
  ms: 4600,
  render: () => (
    <>
      <span className="bird">
        <svg viewBox="0 0 60 40" aria-hidden="true">
          <path className="bird__wing" d="M14 18c6-10 14-10 20 0" stroke="#ffe3f1" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M10 20c6 6 20 8 30 2 4-2 6-6 6-6l-6-1-4-4-2 4c-8 2-18 2-24 5z" fill="#ffc2df" />
          <circle cx="41" cy="15" r="1.4" fill="#2a0a26" />
        </svg>
      </span>
      <span className="drop" />
      <span className="splat">
        <svg viewBox="0 0 120 70" aria-hidden="true">
          <path
            d="M12 40c-6-14 10-26 22-20 4-12 22-14 28-4 12-4 22 6 18 16-2 6-10 10-18 9 2 8-8 14-16 10-6 8-18 6-22-2-6 2-12-3-12-9z"
            fill="#f7f3fa"
            opacity="0.92"
          />
          <circle cx="98" cy="54" r="5" fill="#f7f3fa" opacity="0.8" />
          <circle cx="20" cy="58" r="3.5" fill="#f7f3fa" opacity="0.8" />
        </svg>
      </span>
    </>
  ),
}

const regnsky: CelebrationSpec = {
  id: 'regnsky',
  band: 'bunn',
  ms: 4600,
  render: (rng) => (
    <>
      <span className="raincloud">
        <svg viewBox="0 0 160 90" aria-hidden="true">
          <path
            d="M38 74a24 24 0 0 1 3-47 30 30 0 0 1 57-6 23 23 0 0 1 4 53z"
            fill="#26357c"
            stroke="#3a4aa0"
            strokeWidth="3"
          />
        </svg>
      </span>
      {Array.from({ length: 30 }, (_, i) => (
        <span
          key={i}
          className="rain"
          style={{
            left: `${between(rng, 34, 66).toFixed(1)}%`,
            animationDelay: `${between(rng, 600, 3200).toFixed(0)}ms`,
            animationDuration: `${between(rng, 700, 1100).toFixed(0)}ms`,
          }}
        />
      ))}
    </>
  ),
}

const drage: CelebrationSpec = {
  id: 'drage',
  band: 'bunn',
  ms: 4400,
  render: (rng) => (
    <>
      <span className="dragon">
        <svg viewBox="0 0 120 100" aria-hidden="true">
          <path d="M4 96c10-30 22-52 46-58 18-4 30 4 34 14 4 10-2 20-12 22-14 3-22-4-24-10" fill="#2fd89b" opacity="0.9" />
          <path d="M52 40l10-16 6 14 10-12 2 16" fill="#1f9c72" />
          <circle cx="76" cy="52" r="3" fill="#05081e" />
          <path d="M86 62c8 0 12 2 14 4" stroke="#1f9c72" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
      </span>
      {Array.from({ length: 26 }, (_, i) => (
        <span
          key={i}
          className="ember"
          style={
            {
              background: i % 3 === 0 ? '#ffc94d' : '#ff5a1f',
              animationDelay: `${(900 + i * between(rng, 40, 90)).toFixed(0)}ms`,
              '--rise': `${between(rng, -120, 20).toFixed(0)}px`,
              '--reach': `${between(rng, 40, 78).toFixed(0)}vw`,
              width: `${between(rng, 8, 20).toFixed(0)}px`,
            } as CSSProperties
          }
        />
      ))}
      <span className="firecone" />
    </>
  ),
}

export const CELEBRATIONS: CelebrationSpec[] = [
  fyrverkeri,
  konfetti,
  stjerneregn,
  ballonger,
  papirfly,
  bobler,
  fugleklatt,
  regnsky,
  drage,
]

/** Stemningen poengsummen legger opp til. */
export function bandForScore(correct: number, total: number): Band {
  const share = total > 0 ? correct / total : 0
  if (share >= 0.8) return 'topp'
  if (share >= 0.4) return 'midt'
  return 'bunn'
}

/**
 * Trekker én animasjon. Frøet er rundens id, så samme runde gir samme
 * animasjon hver gang skjermen tegnes – men neste runde gir en annen.
 */
export function pickCelebration(correct: number, total: number, seed: string): CelebrationSpec {
  const band = bandForScore(correct, total)
  const pool = CELEBRATIONS.filter((c) => c.band === band)
  const rng = makeRng(`${seed}|celebration`)
  return pool[Math.floor(rng() * pool.length)] ?? pool[0]
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false
}

/**
 * Overlegget. Ligger over hele skjermen, tar ikke imot klikk, og fjerner seg
 * selv når animasjonen er ferdig. `replay` er en teller – øk den for å spille
 * den samme animasjonen om igjen.
 */
export function CelebrationLayer({
  correct,
  total,
  seed,
  replay = 0,
}: {
  correct: number
  total: number
  seed: string
  replay?: number
}): ReactElement | null {
  const spec = useMemo(() => pickCelebration(correct, total, `${seed}|${replay}`), [correct, total, seed, replay])
  const [done, setDone] = useState(false)

  useEffect(() => {
    setDone(false)
    const timer = setTimeout(() => setDone(true), spec.ms)
    return () => clearTimeout(timer)
  }, [spec, replay])

  if (done || prefersReducedMotion()) return null

  return (
    <div className="celebration" data-anim={spec.id} aria-hidden="true">
      {spec.render(makeRng(`${seed}|${replay}|${spec.id}`))}
    </div>
  )
}
