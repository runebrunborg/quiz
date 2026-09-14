/* eslint-disable react/no-unknown-property */
/**
 * Små strekikoner til merkene på temakortene. Samme oppskrift som scenene:
 * ren SVG i `currentColor`, ingen bildefiler og ingen ikonbibliotek.
 *
 * Alle tegnes i et 20×20-felt og skaleres av CSS-en rundt.
 */
import type { ReactElement } from 'react'

const BOX = {
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const

/** Kalender med dagen ringet inn – «på denne dag». */
export function IconCalendar(): ReactElement {
  return (
    <svg {...BOX}>
      <rect x="2.6" y="4.2" width="14.8" height="13.2" rx="2.6" />
      <path d="M2.6 8.2h14.8M6.6 2.6v3.2M13.4 2.6v3.2" />
      <circle cx="10" cy="12.7" r="1.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Gnist – nytt stoff siden sist. */
export function IconSparkle(): ReactElement {
  return (
    <svg {...BOX}>
      <path d="M7.8 2.4l1.5 4.1 4.1 1.5-4.1 1.5-1.5 4.1-1.5-4.1L2.2 8l4.1-1.5z" />
      <path d="M14.6 12.2l.75 2.05 2.05.75-2.05.75-.75 2.05-.75-2.05-2.05-.75 2.05-.75z" />
    </svg>
  )
}

/** Sending – dagsaktuelle spørsmål, ferske nå. */
export function IconLive(): ReactElement {
  return (
    <svg {...BOX}>
      <circle cx="10" cy="10" r="2.1" fill="currentColor" stroke="none" />
      <path d="M6.3 6.3a5.2 5.2 0 0 0 0 7.4M13.7 6.3a5.2 5.2 0 0 1 0 7.4" />
      <path d="M3.6 3.6a9 9 0 0 0 0 12.8M16.4 3.6a9 9 0 0 1 0 12.8" />
    </svg>
  )
}
