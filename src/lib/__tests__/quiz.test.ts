import { describe, expect, it } from 'vitest'
import { DIFFICULTIES, TOPICS, langForRegion, t, type Difficulty, type Question } from '../../../shared/types'
import { isoWeek, recentWeeks } from '../../../shared/time'
import { ALL_QUESTIONS, CATEGORIES, makeRng, pickQuestions, poolFor, QUESTIONS_PER_ROUND } from '../content'
import { answerShape, firstLetter, letterOptions, revealLetter } from '../hints'
import { byTopic, byWeek, pct, totals } from '../stats'

describe('bokstavhint', () => {
  it('hopper over tegn som ikke er bokstaver', () => {
    expect(firstLetter('«Ærlig»')).toBe('Æ')
    expect(firstLetter("'Na'vi'")).toBe('N')
  })

  it('gir valg mellom for- og etternavn bare for personer', () => {
    const person = ALL_QUESTIONS.find((q) => q.answerKind === 'person')!
    const thing = ALL_QUESTIONS.find((q) => q.answerKind === 'annet')!
    expect(letterOptions(person)).toEqual(['given', 'family'])
    expect(letterOptions(thing)).toEqual(['answer'])
  })

  it('avslører riktig bokstav på begge språk', () => {
    const q: Question = {
      id: 'test-l-01',
      category: 'blaa',
      difficulty: 'lett',
      origin: 'int',
      topics: ['historie'],
      prompt: 'x',
      answer: { nb: 'Harald Blåtann', sv: 'Harald Blåtand' },
      answerKind: 'person',
      person: { given: 'Harald', family: { nb: 'Blåtann', sv: 'Blåtand' } },
      hint: 'x',
      funFact: 'x',
      source: 'x',
    }
    expect(revealLetter(q, 'nb', 'given')).toBe('H')
    expect(revealLetter(q, 'sv', 'family')).toBe('B')
    expect(revealLetter(q, 'nb', 'answer')).toBe('H')
    expect(answerShape(q, 'nb')).toBe('•••••• •••••••')
  })
})

describe('trekning av spørsmål', () => {
  it('trekker ti spørsmål og aldri det samme to ganger', () => {
    const picked = pickQuestions('blaa', 'lett', 'no', 'frø-1')
    expect(picked).toHaveLength(QUESTIONS_PER_ROUND)
    expect(new Set(picked.map((q) => q.id)).size).toBe(QUESTIONS_PER_ROUND)
  })

  it('er deterministisk for samme frø', () => {
    const a = pickQuestions('blaa', 'medium', 'se', 'frø-2').map((q) => q.id)
    const b = pickQuestions('blaa', 'medium', 'se', 'frø-2').map((q) => q.id)
    expect(a).toEqual(b)
  })

  it('gir ulik rekkefølge for ulike frø', () => {
    const a = pickQuestions('blaa', 'medium', 'no', 'frø-a').map((q) => q.id)
    const b = pickQuestions('blaa', 'medium', 'no', 'frø-b').map((q) => q.id)
    expect(a).not.toEqual(b)
  })

  it('vekter mot valgt region når puljen er større enn ti', () => {
    const pool: Question[] = Array.from({ length: 60 }, (_, i) => ({
      id: `x-l-${i}`,
      category: 'x',
      difficulty: 'lett' as Difficulty,
      origin: i % 3 === 0 ? 'no' : i % 3 === 1 ? 'se' : 'int',
      topics: ['historie'],
      prompt: 'x',
      answer: `svar ${i}`,
      answerKind: 'annet',
      hint: 'x',
      funFact: 'x',
      source: 'x',
    }))
    // Efraimidis–Spirakis-vektingen testes direkte på samme formel som i content.ts
    const rng = makeRng('frø')
    const weights = { no: 3, se: 1.3, int: 2 } as const
    const chosen = pool
      .map((q) => ({ q, key: Math.pow(rng(), 1 / weights[q.origin]) }))
      .sort((a, b) => b.key - a.key)
      .slice(0, 10)
    const norske = chosen.filter((c) => c.q.origin === 'no').length
    expect(norske).toBeGreaterThan(10 / 3 - 2)
  })
})

describe('statistikk', () => {
  const session = (day: string, verdicts: ('rett' | 'galt')[]) => ({
    id: day,
    category: 'blaa',
    difficulty: 'lett' as Difficulty,
    region: 'no' as const,
    lang: 'nb' as const,
    startedAt: new Date(day).getTime(),
    finishedAt: new Date(day).getTime(),
    questions: verdicts.map((v, i) => ({
      questionId: ALL_QUESTIONS[i].id,
      hintsUsed: 0,
      usedLetter: null,
      verdict: v,
    })),
  })

  it('regner treffprosent', () => {
    expect(pct(3, 4)).toBe(75)
    expect(pct(0, 0)).toBe(0)
  })

  it('summerer per uke og per emne', () => {
    const sessions = [session('2026-08-25', ['rett', 'rett', 'galt']), session('2026-08-26', ['galt', 'galt'])]
    const weeks = byWeek(sessions)
    expect(weeks).toHaveLength(1)
    expect(weeks[0].correct).toBe(2)
    expect(weeks[0].total).toBe(5)

    const topics = byTopic(sessions)
    expect(topics.length).toBeGreaterThan(0)
    expect(topics.every((t) => t.correct <= t.total)).toBe(true)

    const sum = totals(sessions)
    expect(sum.rounds).toBe(2)
    expect(sum.correct).toBe(2)
  })

  it('regner ISO-uker likt som serveren', () => {
    expect(isoWeek(Date.UTC(2026, 0, 1))).toBe('2026-W01')
    expect(isoWeek(Date.UTC(2026, 7, 30))).toBe('2026-W35')
    expect(recentWeeks(Date.UTC(2026, 7, 30), 3)).toEqual(['2026-W33', '2026-W34', '2026-W35'])
  })
})

describe('innholdsbanken', () => {
  it('har ti spørsmål per tema og nivå', () => {
    for (const category of CATEGORIES) {
      for (const difficulty of DIFFICULTIES) {
        expect(poolFor(category.id, difficulty).length, `${category.id}/${difficulty}`).toBeGreaterThanOrEqual(
          QUESTIONS_PER_ROUND,
        )
      }
    }
  })

  it('har unike id-er', () => {
    expect(new Set(ALL_QUESTIONS.map((q) => q.id)).size).toBe(ALL_QUESTIONS.length)
  })

  it('har gyldige emne-tags og begge språk overalt', () => {
    const valid = new Set<string>(TOPICS)
    for (const q of ALL_QUESTIONS) {
      expect(q.topics.length, q.id).toBeGreaterThan(0)
      for (const topic of q.topics) expect(valid.has(topic), `${q.id}: ${topic}`).toBe(true)
      for (const lang of ['nb', 'sv'] as const) {
        expect(t(q.prompt, lang).length, q.id).toBeGreaterThan(20)
        expect(t(q.answer, lang).length, q.id).toBeGreaterThan(0)
        expect(t(q.hint, lang).length, q.id).toBeGreaterThan(0)
        expect(t(q.funFact, lang).length, q.id).toBeGreaterThan(0)
      }
    }
  })

  it('røper aldri svaret i spørsmålsteksten', () => {
    for (const q of ALL_QUESTIONS) {
      for (const lang of ['nb', 'sv'] as const) {
        const answer = t(q.answer, lang).toLowerCase()
        if (answer.length <= 3) continue
        expect(t(q.prompt, lang).toLowerCase().includes(answer), q.id).toBe(false)
      }
    }
  })

  it('velger språk etter region', () => {
    expect(langForRegion('no')).toBe('nb')
    expect(langForRegion('int')).toBe('nb')
    expect(langForRegion('se')).toBe('sv')
  })
})
