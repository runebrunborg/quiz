/* eslint-disable react/no-unknown-property */
/**
 * Ett lite motiv per tema – et enkelt strektegn hentet fra samme verden som
 * temaets scene i `scenes.tsx`. Motivet gjentas som mønster bak resultatpanelet,
 * slik at skjermen fortsatt lukter av temaet man nettopp har spilt.
 *
 * Alle motiver tegnes i et 40×40-felt, i `currentColor`, uten fyll der det går.
 * Farge og gjennomsiktighet settes av CSS-en rundt.
 */
import type { ReactElement } from 'react'

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

const MOTIFS: Record<string, ReactElement> = {
  /* bølge */
  blaa: (
    <g {...S}>
      <path d="M4 16c4-5 8-5 12 0s8 5 12 0 8-5 8-5" />
      <path d="M4 26c4-5 8-5 12 0s8 5 12 0 8-5 8-5" />
    </g>
  ),
  /* rødt kort */
  rod: (
    <g {...S}>
      <rect x="12" y="6" width="17" height="26" rx="3" transform="rotate(9 20 20)" />
      <path d="M18 15h6M18 21h6" />
    </g>
  ),
  /* medalje med stjerne */
  gull: (
    <g {...S}>
      <circle cx="20" cy="23" r="11" />
      <path d="M20 17l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4-3.9-3.8 5.4-.8z" />
      <path d="M14 8l3 5M26 8l-3 5" />
    </g>
  ),
  /* langskip */
  vikinger: (
    <g {...S}>
      <path d="M6 22c3 8 25 8 28 0" />
      <path d="M6 22c-2-4 0-7 3-6M34 22c2-4 0-7-3-6" />
      <path d="M20 22V8M20 10h9l-9 6" />
    </g>
  ),
  /* torii */
  japan: (
    <g {...S}>
      <path d="M6 12h28M8 17h24M12 17v16M28 17v16" />
      <path d="M6 12c3-3 25-3 28 0" />
    </g>
  ),
  /* månesigd */
  manen: (
    <g {...S}>
      <path d="M26 8a13 13 0 1 0 5 20A15 15 0 0 1 26 8z" />
    </g>
  ),
  /* kaffekopp */
  kaffe: (
    <g {...S}>
      <path d="M9 18h18v8a7 7 0 0 1-7 7h-4a7 7 0 0 1-7-7z" />
      <path d="M27 20h3a4 4 0 0 1 0 8h-3" />
      <path d="M16 8c-2 2 0 4-2 6M22 8c-2 2 0 4-2 6" />
    </g>
  ),
  /* krone */
  kongelige: (
    <g {...S}>
      <path d="M8 28l-2-14 7 6 7-10 7 10 7-6-2 14z" />
      <path d="M9 32h22" />
    </g>
  ),
  /* to tinder */
  fjell: (
    <g {...S}>
      <path d="M4 30l10-16 6 9 5-7 11 14z" />
      <path d="M11 21l3 2 3-2" />
    </g>
  ),
  /* anker */
  havet: (
    <g {...S}>
      <circle cx="20" cy="9" r="3" />
      <path d="M20 12v20M13 18h14" />
      <path d="M8 24c0 7 6 10 12 10s12-3 12-10" />
    </g>
  ),
  /* flamme */
  ild: (
    <g {...S}>
      <path d="M20 5c6 7 10 10 10 17a10 10 0 0 1-20 0c0-4 2-6 4-9 1 3 3 4 4 3 2-2-1-6 2-11z" />
    </g>
  ),
  /* labbeavtrykk */
  rovdyr: (
    <g {...S}>
      <path d="M20 20c5 0 9 4 9 8s-4 4-9 4-9 0-9-4 4-8 9-8z" />
      <ellipse cx="10" cy="15" rx="3" ry="4" />
      <ellipse cx="17" cy="10" rx="3" ry="4" />
      <ellipse cx="24" cy="10" rx="3" ry="4" />
      <ellipse cx="31" cy="15" rx="3" ry="4" />
    </g>
  ),
  /* vinglass */
  drikke: (
    <g {...S}>
      <path d="M12 6h16l-2 10a6 6 0 0 1-12 0z" />
      <path d="M20 22v9M14 33h12" />
    </g>
  ),
  /* togvogn */
  tog: (
    <g {...S}>
      <rect x="7" y="8" width="26" height="18" rx="4" />
      <path d="M12 14h7M22 14h6M7 21h26" />
      <circle cx="14" cy="31" r="3" />
      <circle cx="27" cy="31" r="3" />
    </g>
  ),
  /* nobelmedalje med bånd */
  nobel: (
    <g {...S}>
      <path d="M14 4l3 11M26 4l-3 11" />
      <circle cx="20" cy="25" r="10" />
      <circle cx="20" cy="25" r="4" />
    </g>
  ),
  /* sjokoladeplate */
  sjokolade: (
    <g {...S}>
      <rect x="8" y="8" width="24" height="24" rx="3" />
      <path d="M20 8v24M8 16h24M8 24h24" />
    </g>
  ),
  /* snøkrystall */
  vinter: (
    <g {...S}>
      <path d="M20 4v32M6 12l28 16M34 12L6 28" />
      <path d="M20 11l-4-4M20 11l4-4M20 29l-4 4M20 29l4 4" />
    </g>
  ),
  /* fugl */
  fugler: (
    <g {...S}>
      <path d="M4 24c6 0 8-3 10-7 3 5 8 6 11 3 1 5-2 9-7 10s-11-2-14-6z" />
      <path d="M25 17l6-4-2 6" />
      <circle cx="22" cy="18" r="1" fill="currentColor" />
    </g>
  ),
  /* hengebro */
  broer: (
    <g {...S}>
      <path d="M2 28h36M9 28V8M31 28V8" />
      <path d="M9 9C15 20 25 20 31 9" />
      <path d="M14 28v-9M20 28v-11M26 28v-9" />
    </g>
  ),
  /* klokke */
  tid: (
    <g {...S}>
      <circle cx="20" cy="21" r="13" />
      <path d="M20 13v8l6 4M17 4h6" />
    </g>
  ),
  /* sky med lyn */
  storm: (
    <g {...S}>
      <path d="M11 22a6 6 0 0 1 1-12 8 8 0 0 1 15-1 6 6 0 0 1 1 13z" />
      <path d="M21 24l-5 7h6l-4 7" />
    </g>
  ),
  /* saltbøsse */
  salt: (
    <g {...S}>
      <path d="M13 14h14l2 18H11z" />
      <path d="M15 14a5 5 0 0 1 10 0" />
      <path d="M17 9v-2M20 8V6M23 9v-2" />
    </g>
  ),
  /* hjerte */
  hjerte: (
    <g {...S}>
      <path d="M20 33S6 25 6 16a7 7 0 0 1 14-3 7 7 0 0 1 14 3c0 9-14 17-14 17z" />
    </g>
  ),
  /* linneaklokker */
  linn: (
    <g {...S}>
      <path d="M20 34V16M20 16c-4 0-6-3-6-3M20 16c4 0 6-3 6-3" />
      <path d="M11 9a3.5 4 0 1 1 7 0 3.5 4 0 0 1-7 0zM22 9a3.5 4 0 1 1 7 0 3.5 4 0 0 1-7 0z" />
      <path d="M15 28c-4 0-6-2-6-2M25 24c4 0 6-2 6-2" />
    </g>
  ),
  /* ostestykke med høvel */
  brun: (
    <g {...S}>
      <path d="M6 28l22-14 6 6-22 14z" />
      <path d="M6 28l6 6 22-14" />
      <path d="M17 20l3 2M23 17l3 2" />
    </g>
  ),
  /* borgtårn */
  borg: (
    <g {...S}>
      <path d="M10 34V12h4V8h4v4h4V8h4v4h4v22z" />
      <path d="M17 34v-8h6v8" />
      <path d="M16 18h8" />
    </g>
  ),
  /* fotavtrykk */
  fot: (
    <g {...S}>
      <path d="M15 34c-4 0-6-3-6-7 0-6 3-8 3-14a5 5 0 0 1 10 0c0 6-3 8-3 14 0 4-1 7-4 7z" />
      <ellipse cx="26" cy="12" rx="2.4" ry="3" />
      <ellipse cx="30" cy="18" rx="2.2" ry="2.6" />
      <ellipse cx="31" cy="25" rx="2" ry="2.4" />
    </g>
  ),
  /* ballong */
  ball: (
    <g {...S}>
      <path d="M20 4c6 0 10 5 10 11s-6 11-10 11-10-5-10-11S14 4 20 4z" />
      <path d="M18 26h4l-2 3z" />
      <path d="M20 29c3 3-3 4 0 7" />
    </g>
  ),
  /* stein */
  stein: (
    <g {...S}>
      <path d="M8 26l5-13 12-5 9 8-2 13-15 3z" />
      <path d="M13 13l7 8 5-3M20 21l-4 11" />
    </g>
  ),
  /* ring */
  ring: (
    <g {...S}>
      <circle cx="20" cy="24" r="10" />
      <path d="M15 12h10l-5 5z" />
      <path d="M15 12l5-5 5 5" />
    </g>
  ),
  /* sol */
  sol: (
    <g {...S}>
      <circle cx="20" cy="20" r="8" />
      <path d="M20 3v5M20 32v5M3 20h5M32 20h5M8 8l3.5 3.5M28.5 28.5L32 32M32 8l-3.5 3.5M11.5 28.5L8 32" />
    </g>
  ),
  /* stjerner */
  natt: (
    <g {...S}>
      <path d="M12 6l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
      <path d="M28 18l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" />
      <path d="M17 28l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" />
    </g>
  ),
  /* hus */
  hus: (
    <g {...S}>
      <path d="M6 20L20 8l14 12" />
      <path d="M10 18v16h20V18" />
      <path d="M17 34v-9h6v9" />
    </g>
  ),
}

export const MOTIF_IDS = Object.keys(MOTIFS)

/**
 * Motivet som gjentatt mønster. `id` må være unik på siden, siden SVG-mønstre
 * refereres med `url(#…)`.
 */
export function ThemeMotifField({ scene, id }: { scene: string; id: string }): ReactElement {
  const glyph = MOTIFS[scene] ?? MOTIFS.blaa
  const patternId = `motif-${id}`
  return (
    <svg className="motif-field" aria-hidden="true" role="presentation">
      <defs>
        <pattern id={patternId} width="112" height="112" patternUnits="userSpaceOnUse" patternTransform="rotate(-11)">
          <g transform="translate(6 8) scale(0.85)">{glyph}</g>
          <g transform="translate(62 62) scale(0.6)" opacity="0.7">
            {glyph}
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  )
}
