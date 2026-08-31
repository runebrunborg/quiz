/**
 * Delte typer mellom frontend, worker og innholdsbanken.
 * Ingen kjøretidsavhengigheter – kan importeres overalt.
 */

/** Vanskelighetsgrad. Hver kategori har egne spørsmål per nivå. */
export type Difficulty = 'lett' | 'medium' | 'vanskelig'
export const DIFFICULTIES: Difficulty[] = ['lett', 'medium', 'vanskelig']

/**
 * Utgangspunkt for quizen. Styrer *vektingen* av spørsmål, ikke et hardt filter:
 * velger du `no` får du flest norske referanser, men også svenske og
 * internasjonale spørsmål.
 */
export type Region = 'no' | 'se' | 'int'
export const REGIONS: Region[] = ['no', 'se', 'int']

/** Quizspråk. `no` og `int` spilles på norsk (bokmål), `se` på svensk. */
export type Lang = 'nb' | 'sv'

/** Språket quizen vises på for et gitt regionvalg. */
export function langForRegion(region: Region): Lang {
  return region === 'se' ? 'sv' : 'nb'
}

/**
 * Tekst som enten er lik på norsk og svensk (vanlig for navn og årstall),
 * eller ulik. Holder innholdsfilene korte.
 */
export type L10n = string | { nb: string; sv: string }

export function t(value: L10n, lang: Lang): string {
  return typeof value === 'string' ? value : value[lang]
}

/**
 * Skjulte emne-tags. Brukeren ser dem ikke under spillet – de driver
 * statistikken ("du klarer 40 % av geografi, 60 % av popkultur").
 * Listen er lukket slik at statistikken holder seg sammenlignbar over tid.
 */
export const TOPICS = [
  'geografi',
  'historie',
  'vikingtid',
  'mytologi',
  'politikk',
  'kongehus',
  'militaerhistorie',
  'religion',
  'litteratur',
  'film',
  'tv',
  'musikk',
  'kunst',
  'arkitektur',
  'design',
  'sport',
  'fotball',
  'vitenskap',
  'natur',
  'dyr',
  'medisin',
  'romfart',
  'teknologi',
  'mat-og-drikke',
  'sprak',
  'okonomi',
  'transport',
  'popkultur',
  'spill',
] as const
export type Topic = (typeof TOPICS)[number]

export const TOPIC_LABELS: Record<Topic, { nb: string; sv: string }> = {
  geografi: { nb: 'Geografi', sv: 'Geografi' },
  historie: { nb: 'Historie', sv: 'Historia' },
  vikingtid: { nb: 'Vikingtid', sv: 'Vikingatid' },
  mytologi: { nb: 'Mytologi', sv: 'Mytologi' },
  politikk: { nb: 'Politikk', sv: 'Politik' },
  kongehus: { nb: 'Kongehus', sv: 'Kungahus' },
  militaerhistorie: { nb: 'Militærhistorie', sv: 'Militärhistoria' },
  religion: { nb: 'Religion', sv: 'Religion' },
  litteratur: { nb: 'Litteratur', sv: 'Litteratur' },
  film: { nb: 'Film', sv: 'Film' },
  tv: { nb: 'TV', sv: 'TV' },
  musikk: { nb: 'Musikk', sv: 'Musik' },
  kunst: { nb: 'Kunst', sv: 'Konst' },
  arkitektur: { nb: 'Arkitektur', sv: 'Arkitektur' },
  design: { nb: 'Design', sv: 'Design' },
  sport: { nb: 'Sport', sv: 'Sport' },
  fotball: { nb: 'Fotball', sv: 'Fotboll' },
  vitenskap: { nb: 'Vitenskap', sv: 'Vetenskap' },
  natur: { nb: 'Natur', sv: 'Natur' },
  dyr: { nb: 'Dyr', sv: 'Djur' },
  medisin: { nb: 'Medisin', sv: 'Medicin' },
  romfart: { nb: 'Romfart', sv: 'Rymdfart' },
  teknologi: { nb: 'Teknologi', sv: 'Teknik' },
  'mat-og-drikke': { nb: 'Mat og drikke', sv: 'Mat och dryck' },
  sprak: { nb: 'Språk', sv: 'Språk' },
  okonomi: { nb: 'Økonomi', sv: 'Ekonomi' },
  transport: { nb: 'Transport', sv: 'Transport' },
  popkultur: { nb: 'Popkultur', sv: 'Populärkultur' },
  spill: { nb: 'Spill', sv: 'Spel' },
}

/** Svaret er enten en person (da kan hintet gi første bokstav i for- eller etternavn) eller noe annet. */
export type AnswerKind = 'person' | 'annet'

export interface PersonName {
  /** Fornavn, eller det navnet som kommer først ("Harald" i "Harald Blåtann"). */
  given: L10n
  /** Etternavn / tilnavn ("Blåtann"). */
  family: L10n
}

export interface Question {
  /** Stabil id: `<kategori>-<nivå-initial>-<nn>`, f.eks. `blaa-l-01`. Endres aldri – statistikken henger på den. */
  id: string
  category: string
  difficulty: Difficulty
  /** Hvor spørsmålet «hører hjemme». Brukes til vekting mot regionvalget. */
  origin: Region
  /** Skjulte emne-tags for statistikk. 1–3 stykker. */
  topics: Topic[]
  /** Selve spørsmålet, med 10–25 ords fun fact-innledning før spørsmålsdelen. */
  prompt: L10n
  /** Fasitsvaret slik det vises. */
  answer: L10n
  answerKind: AnswerKind
  /** Bare for `answerKind: 'person'` – gjør at hintet kan gi første bokstav i for- eller etternavn. */
  person?: PersonName
  /** Et ledende hint som ikke røper svaret. */
  hint: L10n
  /** Vises når man ekspanderer svaret. */
  funFact: L10n
  /** Kilde for faktasjekk. Fri tekst eller URL. */
  source: string
}

export interface Category {
  id: string
  /** Kort tittel, f.eks. «Blå». */
  name: L10n
  /** Én linje som selger temaet. */
  tagline: L10n
  /** Navn på SVG-scenen i `src/themes/`. */
  scene: string
  /** Fargestopp for kategorikortets gradient. */
  gradient: [string, string]
}

/* ---------------------------------------------------------------- spilløkt */

export interface AskedQuestion {
  questionId: string
  /** Totalt antall hint brukt på spørsmålet – summen av feltene under. */
  hintsUsed: number
  /** Tekst-hintet er vist. */
  usedTextHint: boolean
  /** «Vis antall bokstaver» er brukt. */
  usedShape: boolean
  /** Bokstavhint som er avslørt. Hvert navn/ord kan avsløres for seg. */
  usedLetters: ('given' | 'family' | 'answer')[]
  /** Selvvurdering etter at fasit er vist. */
  verdict: 'rett' | 'galt' | null
}

export interface QuizSession {
  id: string
  category: string
  difficulty: Difficulty
  region: Region
  lang: Lang
  startedAt: number
  finishedAt: number | null
  questions: AskedQuestion[]
}

export interface SessionSummary {
  id: string
  category: string
  difficulty: Difficulty
  region: Region
  finishedAt: number
  correct: number
  total: number
  hintsUsed: number
}

/* -------------------------------------------------------------- statistikk */

export interface TopicStat {
  topic: Topic
  correct: number
  total: number
}

export interface DayStat {
  /** ISO-dato, `YYYY-MM-DD`. */
  day: string
  correct: number
  total: number
}

export interface WeekStat {
  /** ISO-uke, `2026-W35`. */
  week: string
  correct: number
  total: number
}

export interface FriendComparison {
  friendId: string
  friendName: string
  weeks: { week: string; me: WeekStat; friend: WeekStat }[]
  accumulated: { me: WeekStat; friend: WeekStat }
}
