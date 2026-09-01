import { describe, expect, it } from 'vitest'
import { t } from '../../../shared/types'
import { CATEGORIES } from '../content'
import { MAX_SCORE, VERDICT_CATEGORIES, verdictFor } from '../verdicts'
import { CELEBRATIONS, bandForScore, pickCelebration } from '../../themes/celebrations'

const SCORES = Array.from({ length: MAX_SCORE + 1 }, (_, i) => i)

describe('domsetninger', () => {
  it('finnes for hvert tema og hver poengsum, på begge språk', () => {
    const mangler: string[] = []
    for (const category of CATEGORIES) {
      for (const score of SCORES) {
        const line = verdictFor(category.id, score, 'frø')
        if (!line) mangler.push(`${category.id}/${score}`)
        else if (!t(line, 'nb').trim() || !t(line, 'sv').trim()) mangler.push(`${category.id}/${score} tom`)
      }
    }
    expect(mangler).toEqual([])
  })

  it('dekker nøyaktig temaene som finnes', () => {
    expect(VERDICT_CATEGORIES).toEqual(CATEGORIES.map((c) => c.id).sort())
  })

  it('gir samme dom for samme runde, og bruker begge variantene over tid', () => {
    const første = verdictFor('tog', 4, 'runde-1')
    expect(verdictFor('tog', 4, 'runde-1')).toBe(første)

    const sette = new Set<string>()
    for (let i = 0; i < 60; i++) sette.add(t(verdictFor('tog', 4, `runde-${i}`)!, 'nb'))
    expect(sette.size).toBe(2)
  })

  it('klemmer poengsummer utenfor skalaen i stedet for å ryke', () => {
    expect(verdictFor('tog', -3, 'x')).toBe(verdictFor('tog', 0, 'x'))
    expect(verdictFor('tog', 99, 'x')).toBe(verdictFor('tog', MAX_SCORE, 'x'))
  })

  it('gir null for et tema som ikke finnes', () => {
    expect(verdictFor('finnes-ikke', 5, 'x')).toBeNull()
  })

  it('har to ulike varianter per rute, og gjenbruker ingen linje i temaet', () => {
    for (const category of CATEGORIES) {
      const alle = new Set<string>()
      for (const score of SCORES) {
        const her = new Set<string>()
        for (let i = 0; i < 40; i++) her.add(t(verdictFor(category.id, score, `frø-${i}`)!, 'nb'))
        expect(her.size, `${category.id}/${score}`).toBe(2)
        for (const linje of her) alle.add(linje)
      }
      expect(alle.size, category.id).toBe(2 * SCORES.length)
    }
  })
})

describe('animasjoner', () => {
  it('har unike navn og minst to alternativer i hvert bånd', () => {
    expect(new Set(CELEBRATIONS.map((c) => c.id)).size).toBe(CELEBRATIONS.length)
    for (const band of ['topp', 'midt', 'bunn'] as const) {
      expect(CELEBRATIONS.filter((c) => c.band === band).length).toBeGreaterThanOrEqual(2)
    }
  })

  it('velger bånd etter hvor stor andel som satt', () => {
    expect(bandForScore(10, 10)).toBe('topp')
    expect(bandForScore(8, 10)).toBe('topp')
    expect(bandForScore(7, 10)).toBe('midt')
    expect(bandForScore(4, 10)).toBe('midt')
    expect(bandForScore(3, 10)).toBe('bunn')
    expect(bandForScore(0, 10)).toBe('bunn')
    expect(bandForScore(0, 0)).toBe('bunn')
  })

  it('trekker fra riktig bånd, likt for samme runde og ulikt over tid', () => {
    expect(pickCelebration(9, 10, 'runde-1').id).toBe(pickCelebration(9, 10, 'runde-1').id)
    for (const score of SCORES) {
      const band = bandForScore(score, 10)
      const valgte = new Set<string>()
      for (let i = 0; i < 40; i++) {
        const spec = pickCelebration(score, 10, `runde-${i}`)
        expect(spec.band).toBe(band)
        valgte.add(spec.id)
      }
      expect(valgte.size).toBeGreaterThan(1)
    }
  })
})
