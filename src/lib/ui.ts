import type { Difficulty, Lang, Region } from '../../shared/types'

/** Tekster som vises under selve spillet – følger quizspråket. */
export const UI = {
  nb: {
    question: 'Spørsmål',
    hint: 'Hint',
    showHint: 'Gi meg et hint',
    firstLetter: 'Første bokstav',
    firstLetterGiven: 'Første bokstav i fornavn',
    firstLetterFamily: 'Første bokstav i etternavn',
    answer: 'Fasit',
    showAnswers: 'Vis alle svarene',
    funFact: 'Fun fact',
    source: 'Kilde',
    right: 'Rett',
    wrong: 'Galt',
    scoreLabel: 'Hvordan gikk det?',
    finish: 'Lagre resultatet',
    ofTen: 'av 10',
    playAgain: 'Ny runde',
    toStats: 'Se statistikk',
    hintsUsed: 'hint brukt',
  },
  sv: {
    question: 'Fråga',
    hint: 'Ledtråd',
    showHint: 'Ge mig en ledtråd',
    firstLetter: 'Första bokstaven',
    firstLetterGiven: 'Första bokstaven i förnamnet',
    firstLetterFamily: 'Första bokstaven i efternamnet',
    answer: 'Facit',
    showAnswers: 'Visa alla svar',
    funFact: 'Kuriosa',
    source: 'Källa',
    right: 'Rätt',
    wrong: 'Fel',
    scoreLabel: 'Hur gick det?',
    finish: 'Spara resultatet',
    ofTen: 'av 10',
    playAgain: 'Ny runda',
    toStats: 'Se statistik',
    hintsUsed: 'ledtrådar använda',
  },
} satisfies Record<Lang, Record<string, string>>

export function ui(lang: Lang) {
  return UI[lang]
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  lett: 'Lett',
  medium: 'Medium',
  vanskelig: 'Vanskelig',
}

export const REGION_LABELS: Record<Region, string> = {
  no: 'Norsk',
  se: 'Svensk',
  int: 'Internasjonalt',
}

export const REGION_HELP: Record<Region, string> = {
  no: 'Quizen går på norsk, med tyngdepunkt i norske referanser – men svenske og internasjonale spørsmål er med.',
  se: 'Quizen går på svenska, med tyngdpunkt i svenska referenser – men norska och internationella frågor är med.',
  int: 'Quizen går på norsk, med tyngdepunkt i internasjonale referanser.',
}

export const ORIGIN_LABELS: Record<Region, string> = {
  no: 'Norge',
  se: 'Sverige',
  int: 'Internasjonalt',
}
