import type { Difficulty, Lang, Region } from '../../shared/types'

/** Tekster som vises under selve spillet – følger quizspråket. */
export const UI = {
  nb: {
    question: 'Spørsmål',
    questionsPlural: 'spørsmål',
    startingPoint: 'som utgangspunkt',
    hint: 'Hint',
    showHint: 'Gi meg et hint',
    firstLetter: 'Første bokstav',
    firstLetterGiven: 'Første bokstav i fornavn',
    firstLetterFamily: 'Første bokstav i etternavn',
    letterCount: 'Vis antall bokstaver',
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
    feedbackLabel: 'Spørsmålet?',
    thumbUp: 'Bra spørsmål',
    thumbDown: 'Dårlig spørsmål',
    feedbackWhy: 'Hva er galt?',
    feedbackComment: 'Kommentar, hvis du vil',
    feedbackCommentPlaceholder: 'Én setning holder',
    feedbackSend: 'Send',
    feedbackThanks: 'Takk – notert.',
    feedbackUndo: 'Angre',
    feedbackOffline: 'Lagret her. Sendes når du er innlogget.',
  },
  sv: {
    question: 'Fråga',
    questionsPlural: 'frågor',
    startingPoint: 'som utgångspunkt',
    hint: 'Ledtråd',
    showHint: 'Ge mig en ledtråd',
    firstLetter: 'Första bokstaven',
    firstLetterGiven: 'Första bokstaven i förnamnet',
    firstLetterFamily: 'Första bokstaven i efternamnet',
    letterCount: 'Visa antal bokstäver',
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
    feedbackLabel: 'Frågan?',
    thumbUp: 'Bra fråga',
    thumbDown: 'Dålig fråga',
    feedbackWhy: 'Vad är fel?',
    feedbackComment: 'Kommentar, om du vill',
    feedbackCommentPlaceholder: 'En mening räcker',
    feedbackSend: 'Skicka',
    feedbackThanks: 'Tack – noterat.',
    feedbackUndo: 'Ångra',
    feedbackOffline: 'Sparat här. Skickas när du är inloggad.',
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
  no: 'Quizen går på norsk. Omtrent halvparten av spørsmålene har norsk forankring, resten er svenske og internasjonale.',
  se: 'Quizen går på svenska. Ungefär hälften av frågorna har svensk förankring, resten är norska och internationella.',
  int: 'Quizen går på norsk, med tyngdepunkt i internasjonale referanser og et par nordiske innslag.',
}

export const ORIGIN_LABELS: Record<Lang, Record<Region, string>> = {
  nb: { no: 'Norge', se: 'Sverige', int: 'Internasjonalt' },
  sv: { no: 'Norge', se: 'Sverige', int: 'Internationellt' },
}

/**
 * Landliste for profilen. Norden først siden det er der brukerne er, deretter
 * resten alfabetisk. Koder er ISO 3166-1 alfa-2.
 */
export const COUNTRIES: { code: string; name: string }[] = [
  { code: 'NO', name: 'Norge' },
  { code: 'SE', name: 'Sverige' },
  { code: 'DK', name: 'Danmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'IS', name: 'Island' },
  { code: 'AU', name: 'Australia' },
  { code: 'BE', name: 'Belgia' },
  { code: 'BR', name: 'Brasil' },
  { code: 'CA', name: 'Canada' },
  { code: 'EE', name: 'Estland' },
  { code: 'FR', name: 'Frankrike' },
  { code: 'GR', name: 'Hellas' },
  { code: 'IN', name: 'India' },
  { code: 'IE', name: 'Irland' },
  { code: 'IT', name: 'Italia' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'Kina' },
  { code: 'HR', name: 'Kroatia' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LT', name: 'Litauen' },
  { code: 'NL', name: 'Nederland' },
  { code: 'PL', name: 'Polen' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' },
  { code: 'CH', name: 'Sveits' },
  { code: 'ES', name: 'Spania' },
  { code: 'GB', name: 'Storbritannia' },
  { code: 'CZ', name: 'Tsjekkia' },
  { code: 'DE', name: 'Tyskland' },
  { code: 'UA', name: 'Ukraina' },
  { code: 'HU', name: 'Ungarn' },
  { code: 'US', name: 'USA' },
  { code: 'AT', name: 'Østerrike' },
  { code: 'ZZ', name: 'Annet' },
]

export const COUNTRY_NAME = new Map(COUNTRIES.map((c) => [c.code, c.name]))

/** Land som gir et naturlig standardvalg av utgangspunkt for quizen. */
export function regionForCountry(code: string | null): Region {
  if (code === 'NO') return 'no'
  if (code === 'SE') return 'se'
  return 'int'
}
