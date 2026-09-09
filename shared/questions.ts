/**
 * Regler som avgjør hva et spørsmål ser ut som *i dag*: om det fortsatt skal
 * trekkes, og om spørsmålsteksten skal byttes ut med en datovariant.
 *
 * Rene funksjoner uten kjøretidsavhengigheter – frontend, worker, validator og
 * tester bruker de samme.
 */
import type { Lang, OnThisDay, Question } from './types'
import { t, VERIFY_STALE_MONTHS } from './types'
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

/**
 * Har spørsmålet vært gjennom uavhengig kontroll? Alle tre feltene må stå –
 * en dato uten URL er ingen kontroll, bare en påstand om at noen så på det.
 */
export function isVerified(q: Question): boolean {
  return Boolean(q.verifiedAt && q.verifiedBy && q.verifiedUrl)
}

/**
 * Flagget av en kontroll som ikke gikk gjennom. Flagget overstyrer alt annet:
 * et spørsmål ingen kan stå inne for skal ikke stilles, uansett hvor godt det
 * ellers passer i runden.
 */
export function isFlagged(q: Question): boolean {
  return Boolean(q.flagged)
}

/**
 * Alt som ikke skal trekkes i dag – utløpte dagsaktuelle og flaggede. Dette er
 * filteret puljene bruker; `isRetired` alene ser bare på datoen.
 */
export function isWithdrawn(q: Question, day: string): boolean {
  return isRetired(q, day) || isFlagged(q)
}

/**
 * Er kontrollen gammel nok til at spørsmålet bør ses på igjen? Lenker råtner og
 * leksikonartikler skrives om, så en kontroll er ferskvare den også.
 */
export function isVerificationStale(q: Question, day: string, months: number = VERIFY_STALE_MONTHS): boolean {
  if (!isVerified(q)) return false
  const [y, m, d] = q.verifiedAt!.split('-').map(Number)
  const then = Date.UTC(y, m - 1 + months, d)
  return Date.parse(`${day}T00:00:00Z`) > then
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
