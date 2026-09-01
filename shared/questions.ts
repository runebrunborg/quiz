/**
 * Regler som avgjør hva et spørsmål ser ut som *i dag*: om det fortsatt skal
 * trekkes, og om spørsmålsteksten skal byttes ut med en datovariant.
 *
 * Rene funksjoner uten kjøretidsavhengigheter – frontend, worker, validator og
 * tester bruker de samme.
 */
import type { Lang, OnThisDay, Question } from './types'
import { t } from './types'
import { isoDay, monthDay } from './time'

/** Dagens dato som `YYYY-MM-DD`. Sendes eksplisitt videre, så tester kan late som. */
export function today(now: number = Date.now()): string {
  return isoDay(now)
}

/** Er spørsmålet dagsaktuelt akkurat nå? */
export function isTopicalActive(q: Question, day: string): boolean {
  return Boolean(q.topical) && day <= q.topical!.until
}

/**
 * Spørsmål som har gått ut på dato og ikke tåler å overleve sin egen nyhet.
 * Filtreres bort fra alle puljer, men blir liggende i innholdsfila – blir det
 * aktuelt igjen, er det nok å flytte `until`.
 */
export function isRetired(q: Question, day: string): boolean {
  return Boolean(q.topical) && day > q.topical!.until && !q.topical!.evergreen
}

/** Datovarianten som gjelder i dag, om noen. */
export function onThisDayFor(q: Question, day: string): OnThisDay | undefined {
  if (!q.onThisDay?.length) return undefined
  const md = day.slice(5)
  return q.onThisDay.find((v) => v.day === md)
}

/** Har spørsmålet en variant for denne datoen? */
export function hasOnThisDay(q: Question, day: string): boolean {
  return onThisDayFor(q, day) !== undefined
}

/**
 * Spørsmålsteksten slik den skal vises. Treffer dagens dato en `onThisDay`,
 * vises den varianten i stedet – svar, hint og fun fact er uendret.
 */
export function promptFor(q: Question, lang: Lang, day: string = today()): string {
  const variant = onThisDayFor(q, day)
  return t(variant ? variant.prompt : q.prompt, lang)
}

export { monthDay }
