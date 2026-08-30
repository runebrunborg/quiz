import type { Lang, Question } from '../../shared/types'
import { t } from '../../shared/types'

export type LetterChoice = 'given' | 'family' | 'answer'

/**
 * Første *bokstav* i en streng – hopper over anførselstegn og liknende, og
 * håndterer at «Å» og «Ø» er én bokstav.
 */
export function firstLetter(value: string): string {
  const match = value.match(/\p{L}/u)
  return match ? match[0].toLocaleUpperCase('nb-NO') : value.charAt(0).toLocaleUpperCase('nb-NO')
}

export function letterOptions(q: Question): LetterChoice[] {
  return q.answerKind === 'person' && q.person ? ['given', 'family'] : ['answer']
}

export function revealLetter(q: Question, lang: Lang, choice: LetterChoice): string {
  if (choice === 'given' && q.person) return firstLetter(t(q.person.given, lang))
  if (choice === 'family' && q.person) return firstLetter(t(q.person.family, lang))
  return firstLetter(t(q.answer, lang))
}

/** Antall ord i svaret – vises sammen med bokstavhintet som ekstra drahjelp. */
export function answerShape(q: Question, lang: Lang): string {
  const answer = t(q.answer, lang)
  const words = answer.split(/\s+/).filter(Boolean)
  return words.map((w) => '•'.repeat(Math.max(1, w.replace(/[^\p{L}\p{N}]/gu, '').length))).join(' ')
}
