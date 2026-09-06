import { describe, expect, it } from 'vitest'
import { mergeRound, playedKey, statusOf, unseenOf, type PlayedIndex } from '../played'

const rund = (over: Partial<Parameters<typeof mergeRound>[1]> = {}) => ({
  category: 'blaa',
  difficulty: 'medium' as const,
  at: 1_000,
  questionIds: ['blaa-m-01', 'blaa-m-02'],
  poolSize: 20,
  ...over,
})

describe('arkivet', () => {
  it('legger en fullført runde inn under tema og nivå', () => {
    const index = mergeRound({}, rund())
    const entry = index[playedKey('blaa', 'medium')]
    expect(entry.times).toBe(1)
    expect(entry.seen).toEqual(['blaa-m-01', 'blaa-m-02'])
    expect(entry.poolSize).toBe(20)
  })

  it('slår sammen sette spørsmål over flere runder uten duplikater', () => {
    let index: PlayedIndex = mergeRound({}, rund())
    index = mergeRound(index, rund({ at: 2_000, questionIds: ['blaa-m-02', 'blaa-m-03'] }))
    const entry = index[playedKey('blaa', 'medium')]
    expect(entry.times).toBe(2)
    expect(entry.at).toBe(2_000)
    expect(entry.seen.sort()).toEqual(['blaa-m-01', 'blaa-m-02', 'blaa-m-03'])
  })

  it('holder nivåene fra hverandre', () => {
    let index: PlayedIndex = mergeRound({}, rund())
    index = mergeRound(index, rund({ difficulty: 'lett' }))
    expect(Object.keys(index).sort()).toEqual(['blaa|lett', 'blaa|medium'])
  })

  it('kaller et uspilt tema nytt', () => {
    expect(statusOf(undefined, 20)).toBe('ny')
  })

  it('arkiverer et spilt tema så lenge puljen står stille', () => {
    const entry = mergeRound({}, rund())[playedKey('blaa', 'medium')]
    expect(statusOf(entry, 20)).toBe('spilt')
    expect(statusOf(entry, 19)).toBe('spilt')
  })

  it('henter temaet ut av arkivet når puljen har vokst', () => {
    const entry = mergeRound({}, rund())[playedKey('blaa', 'medium')]
    expect(statusOf(entry, 21)).toBe('oppdatert')
  })

  it('teller spørsmål spilleren ikke har sett', () => {
    const entry = mergeRound({}, rund())[playedKey('blaa', 'medium')]
    expect(unseenOf(entry, ['blaa-m-01', 'blaa-m-02', 'blaa-m-03'])).toBe(1)
    expect(unseenOf(undefined, ['blaa-m-01', 'blaa-m-02'])).toBe(2)
  })
})
