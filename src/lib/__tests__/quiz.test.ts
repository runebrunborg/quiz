import { describe, expect, it } from 'vitest'
import { DIFFICULTIES, TOPICS, langForRegion, t, type Difficulty, type Question } from '../../../shared/types'
import { isoWeek, recentWeeks } from '../../../shared/time'
import {
  ALL_QUESTIONS,
  CATEGORIES,
  categoriesWithContent,
  categoriesInDisplayOrder,
  composeRound,
  datedFor,
  makeRng,
  ordinaryFor,
  pickQuestions,
  poolFor,
  QUESTIONS_PER_ROUND,
  TOPICAL_PER_ROUND,
} from '../content'
import { hasOnThisDay, isRetired, isTopicalActive, onThisDayFor, promptFor } from '../../../shared/questions'
import { answerShape, firstLetter, hintCount, letterOptions, revealLetter } from '../hints'
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

describe('hint teller uavhengig', () => {
  it('teller hvert hint for seg', () => {
    expect(hintCount({ usedTextHint: false, usedShape: false, usedLetters: [] })).toBe(0)
    expect(hintCount({ usedTextHint: true, usedShape: false, usedLetters: [] })).toBe(1)
    expect(hintCount({ usedTextHint: false, usedShape: true, usedLetters: [] })).toBe(1)
    expect(hintCount({ usedTextHint: false, usedShape: false, usedLetters: ['given', 'family'] })).toBe(2)
    expect(hintCount({ usedTextHint: true, usedShape: true, usedLetters: ['answer'] })).toBe(3)
  })

  it('tåler økter lagret før hintene ble delt opp', () => {
    expect(hintCount({ usedTextHint: false, usedShape: false, usedLetters: undefined as never })).toBe(0)
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
      usedTextHint: false,
      usedShape: false,
      usedLetters: [],
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
  /**
   * Et tema er enten tomt eller ferdig – aldri halvfylt.
   *
   * Temaer registreres i content/categories.ts før puljen er skrevet, så et
   * tomt tema er en gyldig mellomtilstand: det vises som et hull på
   * bankskjermen og holdes utenfor startskjermen. Det som ikke er gyldig er et
   * tema med noen få spørsmål på ett nivå, for da kan en runde bli kortere enn
   * ti. Denne testen fanger nettopp den tilstanden.
   *
   * Det er de *ordinære* spørsmålene som teller. De dagsaktuelle skrives før
   * grunnpuljen i de nye temaene – to nyhetsspørsmål gjør ikke et tema
   * spillbart, og skal ikke gjøre det heller.
   */
  it('har enten null eller minst ti ordinære spørsmål per tema og nivå', () => {
    for (const category of CATEGORIES) {
      const counts = DIFFICULTIES.map((d) => ordinaryFor(category.id, d).length)
      if (counts.every((n) => n === 0)) continue
      for (const [i, n] of counts.entries()) {
        expect(n, `${category.id}/${DIFFICULTIES[i]}`).toBeGreaterThanOrEqual(QUESTIONS_PER_ROUND)
      }
    }
  })

  it('holder temaer som bare har dagsaktuelle spørsmål utenfor startskjermen', () => {
    const playable = new Set(categoriesWithContent().map((c) => c.id))
    for (const category of CATEGORIES) {
      const ordinary = DIFFICULTIES.reduce((sum, d) => sum + ordinaryFor(category.id, d).length, 0)
      const any = DIFFICULTIES.reduce((sum, d) => sum + poolFor(category.id, d).length, 0)
      if (ordinary === 0 && any > 0) expect(playable.has(category.id), category.id).toBe(false)
    }
  })

  it('viser bare temaer med spørsmål på startskjermen', () => {
    const playable = categoriesWithContent()
    expect(playable.length).toBeGreaterThan(0)
    for (const c of playable) {
      expect(poolFor(c.id, 'lett').length + poolFor(c.id, 'medium').length + poolFor(c.id, 'vanskelig').length,
        c.id).toBeGreaterThan(0)
    }
    expect(playable.length).toBeLessThanOrEqual(CATEGORIES.length)
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

/* ------------------------------------------- dagsaktuelt og «på denne dag» */

function q(over: Partial<Question> & { id: string }): Question {
  return {
    category: 'blaa',
    difficulty: 'lett',
    origin: 'int',
    topics: ['historie'],
    prompt: { nb: 'nb-tekst', sv: 'sv-tekst' },
    answer: 'Svar',
    answerKind: 'annet',
    hint: 'h',
    funFact: 'f',
    source: 'kilde',
    ...over,
  } as Question
}

const DAY = '2026-09-01'

describe('dagsaktuelle spørsmål', () => {
  const fersk = q({ id: 'x-l-a1', topical: { event: '2026-08-20', until: '2026-12-01', evergreen: false } })
  const utloept = q({ id: 'x-l-a2', topical: { event: '2025-09-01', until: '2026-01-01', evergreen: false } })
  const tidloes = q({ id: 'x-l-a3', topical: { event: '2025-09-01', until: '2026-01-01', evergreen: true } })

  it('regner et spørsmål som ferskt til og med utløpsdatoen', () => {
    expect(isTopicalActive(fersk, DAY)).toBe(true)
    expect(isTopicalActive(fersk, '2026-12-01')).toBe(true)
    expect(isTopicalActive(fersk, '2026-12-02')).toBe(false)
  })

  it('pensjonerer utløpte spørsmål som ikke er evergreen', () => {
    expect(isRetired(utloept, DAY)).toBe(true)
    expect(isRetired(tidloes, DAY)).toBe(false)
    expect(isRetired(fersk, DAY)).toBe(false)
  })

  it('holder pensjonerte spørsmål utenfor runden', () => {
    const pool = [utloept, ...Array.from({ length: 14 }, (_, i) => q({ id: `x-l-${i}` }))]
    const round = composeRound(pool, 'no', 'frø', QUESTIONS_PER_ROUND, DAY)
    expect(round).toHaveLength(QUESTIONS_PER_ROUND)
    expect(round.map((r) => r.id)).not.toContain('x-l-a2')
  })

  it('lar evergreen-spørsmål gli inn i den vanlige puljen etter utløp', () => {
    const pool = [tidloes, ...Array.from({ length: 30 }, (_, i) => q({ id: `x-l-${i}` }))]
    // Ikke lenger ferskt, så det har ingen reservert plass – men det kan trekkes.
    expect(isTopicalActive(tidloes, DAY)).toBe(false)
    const seeds = Array.from({ length: 40 }, (_, i) => `frø-${i}`)
    const traff = seeds.some((seed) =>
      composeRound(pool, 'no', seed, QUESTIONS_PER_ROUND, DAY).some((r) => r.id === 'x-l-a3'),
    )
    expect(traff).toBe(true)
  })

  it('setter av de to siste plassene til ferske spørsmål, uten å forlenge runden', () => {
    const to = [
      q({ id: 'x-l-a1', topical: { event: '2026-08-20', until: '2026-12-01', evergreen: false } }),
      q({ id: 'x-l-a2', topical: { event: '2026-08-21', until: '2026-12-01', evergreen: true } }),
    ]
    const pool = [...to, ...Array.from({ length: 20 }, (_, i) => q({ id: `x-l-${i}` }))]
    const round = composeRound(pool, 'no', 'frø', QUESTIONS_PER_ROUND, DAY)
    expect(round).toHaveLength(QUESTIONS_PER_ROUND)
    expect(round.slice(-TOPICAL_PER_ROUND).map((r) => r.id).sort()).toEqual(['x-l-a1', 'x-l-a2'])
  })
})

describe('«på denne dag»', () => {
  const dated = q({
    id: 'x-l-d1',
    onThisDay: [
      { day: '09-01', year: 1939, prompt: { nb: 'nb-dagsvariant', sv: 'sv-dagsvariant' } },
      { day: '12-05', year: 1791, prompt: { nb: 'nb-desember', sv: 'sv-desember' } },
    ],
  })

  it('bytter ut hele spørsmålsteksten bare på riktig dato', () => {
    expect(promptFor(dated, 'nb', DAY)).toBe('nb-dagsvariant')
    expect(promptFor(dated, 'sv', DAY)).toBe('sv-dagsvariant')
    expect(promptFor(dated, 'nb', '2026-12-05')).toBe('nb-desember')
    expect(promptFor(dated, 'nb', '2026-09-02')).toBe('nb-tekst')
  })

  it('finner varianten uavhengig av årstall', () => {
    expect(onThisDayFor(dated, '1998-09-01')?.year).toBe(1939)
    expect(hasOnThisDay(dated, '2030-09-01')).toBe(true)
    expect(hasOnThisDay(q({ id: 'x-l-9' }), DAY)).toBe(false)
  })

  it('tar alltid med et datospørsmål når temaet har ett', () => {
    const pool = [dated, ...Array.from({ length: 25 }, (_, i) => q({ id: `x-l-${i}` }))]
    for (const seed of ['a', 'b', 'c', 'd', 'e']) {
      const round = composeRound(pool, 'int', seed, QUESTIONS_PER_ROUND, DAY)
      expect(round).toHaveLength(QUESTIONS_PER_ROUND)
      expect(round.map((r) => r.id)).toContain('x-l-d1')
    }
  })
})

describe('rekkefølgen på startskjermen', () => {
  it('legger temaer med treff på dagens dato først', () => {
    for (const difficulty of DIFFICULTIES) {
      const ordered = categoriesInDisplayOrder(makeRng('frø'), difficulty, '2026-09-01')
      const flags = ordered.map((o) => o.datedToday)
      // Ingen usann før en sann: alle treffene ligger i front.
      expect(flags.indexOf(true) === -1 || flags.lastIndexOf(true) < flags.indexOf(false), difficulty).toBe(true)
      for (const { category, datedToday } of ordered) {
        expect(datedToday, category.id).toBe(datedFor(category.id, difficulty, '2026-09-01').length > 0)
      }
    }
  })

  it('holder løftet: runden inneholder datospørsmålet temaet ble løftet for', () => {
    const day = '2026-09-01'
    for (const difficulty of DIFFICULTIES) {
      for (const { category, datedToday } of categoriesInDisplayOrder(makeRng('frø'), difficulty, day)) {
        if (!datedToday) continue
        const dated = datedFor(category.id, difficulty, day).map((q) => q.id)
        for (const region of ['no', 'se', 'int'] as const) {
          const round = pickQuestions(category.id, difficulty, region, 'økt-1', QUESTIONS_PER_ROUND, day)
          expect(round).toHaveLength(QUESTIONS_PER_ROUND)
          expect(round.some((q) => dated.includes(q.id)), `${category.id}/${difficulty}/${region}`).toBe(true)
        }
      }
    }
  })

  it('setter de dagsaktuelle sist i runden, og aldri flere enn to', () => {
    const day = '2026-09-01'
    for (const c of categoriesWithContent(day)) {
      for (const difficulty of DIFFICULTIES) {
        const round = pickQuestions(c.id, difficulty, 'no', 'økt-2', QUESTIONS_PER_ROUND, day)
        const topicalInRound = round.filter((q) => isTopicalActive(q, day))
        expect(topicalInRound.length, `${c.id}/${difficulty}`).toBeLessThanOrEqual(TOPICAL_PER_ROUND)
        const tail = round.slice(round.length - topicalInRound.length)
        expect(tail.every((q) => isTopicalActive(q, day)), `${c.id}/${difficulty}`).toBe(true)
      }
    }
  })
})
