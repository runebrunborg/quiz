import { useId, useMemo, useState } from 'react'

/* ============================================================================
   Små, håndtegnede SVG-diagrammer. Ingen chart-bibliotek – dette holder
   bundlen liten og lar diagrammene arve appens tokens direkte.
   Fargene er validert mot den mørke flaten (lyshetsbånd, kontrast og
   fargeblindhets-separasjon), se --chart-1 / --chart-2 i tokens.css.
   ========================================================================= */

export interface Series {
  label: string
  color: string
  /** null = ingen data den perioden (linjen brytes, ingen falsk nullverdi). */
  points: (number | null)[]
}

interface TrendChartProps {
  labels: string[]
  series: Series[]
  /** Enhet som vises i tooltip og på y-aksen. */
  unit?: string
  height?: number
  /** Y-aksen går alltid 0–100 for treffprosent. */
  max?: number
  caption?: string
}

const PAD = { top: 16, right: 46, bottom: 26, left: 34 }

export function TrendChart({ labels, series, unit = '%', height = 190, max = 100, caption }: TrendChartProps) {
  const uid = useId().replace(/:/g, '')
  const [hover, setHover] = useState<number | null>(null)
  const width = 640
  const innerW = width - PAD.left - PAD.right
  const innerH = height - PAD.top - PAD.bottom

  const x = (i: number) => PAD.left + (labels.length <= 1 ? innerW / 2 : (i / (labels.length - 1)) * innerW)
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH

  const ticks = [0, 25, 50, 75, 100].filter((t) => t <= max)

  if (labels.length === 0) {
    return <p className="empty">Ingen data ennå.</p>
  }

  return (
    <figure style={{ margin: 0 }}>
      <div className="chart">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={caption ?? 'Utvikling over tid'}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            {series.map((s, si) => (
              <linearGradient key={si} id={`${uid}-fill-${si}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.34" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {ticks.map((t) => (
            <g key={t}>
              <line className="chart-grid-line" x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} />
              <text className="chart-axis" x={PAD.left - 8} y={y(t) + 4} textAnchor="end">
                {t}
              </text>
            </g>
          ))}

          {series.map((s, si) => {
            const segments = toSegments(s.points)
            const area =
              segments.length === 1 && segments[0].length > 1
                ? `M${segments[0].map(([i, v]) => `${x(i)} ${y(v)}`).join('L')}L${x(
                    segments[0][segments[0].length - 1][0],
                  )} ${y(0)}L${x(segments[0][0][0])} ${y(0)}Z`
                : null
            return (
              <g key={si}>
                {area && series.length === 1 && <path d={area} fill={`url(#${uid}-fill-${si})`} />}
                {segments.map((seg, i) => (
                  <path
                    key={i}
                    d={`M${seg.map(([idx, v]) => `${x(idx)} ${y(v)}`).join('L')}`}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
                {s.points.map((v, i) =>
                  v === null ? null : (
                    <circle
                      key={i}
                      cx={x(i)}
                      cy={y(v)}
                      r={hover === i ? 5.5 : 3.5}
                      fill={s.color}
                      stroke="var(--navy-950)"
                      strokeWidth="2"
                    />
                  ),
                )}
                {lastValue(s.points) !== null && (
                  <text
                    className="chart-axis"
                    x={width - PAD.right + 8}
                    y={y(lastValue(s.points)!) + 4}
                    fill={s.color}
                    style={{ fontWeight: 700 }}
                  >
                    {lastValue(s.points)}
                    {unit}
                  </text>
                )}
              </g>
            )
          })}

          {labels.map((label, i) => (
            <text
              key={i}
              className="chart-axis"
              x={x(i)}
              y={height - 8}
              textAnchor="middle"
              opacity={labels.length > 8 && i % 2 === 1 ? 0 : 1}
            >
              {label}
            </text>
          ))}

          {hover !== null && (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD.top}
              y2={PAD.top + innerH}
              stroke="var(--pink-300)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          )}

          {/* Usynlige, brede treffsoner – enklere å treffe enn selve punktene. */}
          {labels.map((_, i) => (
            <rect
              key={i}
              x={x(i) - innerW / Math.max(labels.length, 1) / 2}
              y={PAD.top}
              width={innerW / Math.max(labels.length, 1)}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          ))}
        </svg>
      </div>

      {hover !== null && (
        <p className="faint tabular" style={{ fontSize: 'var(--step--1)', marginTop: 6 }}>
          {labels[hover]}:{' '}
          {series
            .map((s) => `${s.label} ${s.points[hover] === null ? '–' : `${s.points[hover]}${unit}`}`)
            .join(' · ')}
        </p>
      )}

      {series.length > 1 && (
        <div className="legend">
          {series.map((s) => (
            <span className="legend__key" key={s.label}>
              <span className="legend__swatch" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}
      {caption && <figcaption className="faint" style={{ fontSize: 'var(--step--1)', marginTop: 6 }}>{caption}</figcaption>}
    </figure>
  )
}

function toSegments(points: (number | null)[]): [number, number][][] {
  const segments: [number, number][][] = []
  let current: [number, number][] = []
  points.forEach((v, i) => {
    if (v === null) {
      if (current.length) segments.push(current)
      current = []
    } else {
      current.push([i, v])
    }
  })
  if (current.length) segments.push(current)
  return segments.filter((s) => s.length > 0)
}

function lastValue(points: (number | null)[]): number | null {
  for (let i = points.length - 1; i >= 0; i--) if (points[i] !== null) return points[i]
  return null
}

/* --------------------------------------------------------------- stolper */

export function BarRow({
  name,
  correct,
  total,
  color = 'var(--chart-1)',
}: {
  name: string
  correct: number
  total: number
  color?: string
}) {
  const value = total === 0 ? 0 : Math.round((correct / total) * 100)
  return (
    <div className="topic-row">
      <span className="topic-row__name">{name}</span>
      <span className="meter" role="img" aria-label={`${value} prosent`}>
        <span className="meter__fill" style={{ width: `${value}%`, background: color }} />
      </span>
      <span className="topic-row__value tabular">
        {value}% <span className="faint">({correct}/{total})</span>
      </span>
    </div>
  )
}

/* ------------------------------------------------- ukesammenligning i tall */

export function ComparisonBars({
  weeks,
  meLabel,
  friendLabel,
}: {
  weeks: { week: string; me: number | null; friend: number | null }[]
  meLabel: string
  friendLabel: string
}) {
  const shown = useMemo(() => weeks.slice(-8), [weeks])
  return (
    <TrendChart
      labels={shown.map((w) => w.week.replace(/^\d+-W/, 'u'))}
      series={[
        { label: meLabel, color: 'var(--chart-1)', points: shown.map((w) => w.me) },
        { label: friendLabel, color: 'var(--chart-2)', points: shown.map((w) => w.friend) },
      ]}
      caption="Treffprosent per uke"
    />
  )
}
