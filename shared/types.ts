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

/** Dato på formen `YYYY-MM-DD`. */
export type IsoDate = string

/** Måned og dag på formen `MM-DD`, uten år. */
export type MonthDay = string

/**
 * Merkelapp på et dagsaktuelt spørsmål – ett som bygger på noe som har skjedd
 * det siste året. Slike spørsmål trekkes inn i runden foran de vanlige, og
 * `until` sier når de slutter å være ferske.
 */
export interface Topical {
  /** Når hendelsen skjedde. `YYYY-MM-DD`, eller `YYYY-MM` når dagen ikke er poenget. */
  event: string
  /** Siste dagen spørsmålet regnes som dagsaktuelt. */
  until: IsoDate
  /**
   * Om spørsmålet fortsatt er verdt å stille etter `until`. `true` betyr at det
   * glir inn i den vanlige puljen når det ikke lenger er ferskt («hvem tok over
   * som konge»); `false` betyr at det går ut på dato og slutter å bli trukket
   * («hvem leder tabellen nå»). Spørsmålet blir liggende i fila uansett.
   */
  evergreen: boolean
}

/**
 * «På denne dag»-variant: hele spørsmålsteksten skrevet om for én bestemt dato
 * i året. Treffer vi datoen, vises denne teksten i stedet for `prompt` – svar,
 * hint og fun fact er de samme. Et spørsmål kan ha flere (født og død, åpnet og
 * revet).
 */
export interface OnThisDay {
  /** Datoen varianten gjelder, `MM-DD`. 29. februar treffer bare i skuddår. */
  day: MonthDay
  /** Året hendelsen skjedde. Står gjerne i teksten, men brukes ikke av koden. */
  year: number
  /** Erstatter `prompt` denne dagen. Samme krav som `prompt`: 25–55 ord, spørsmålet til slutt. */
  prompt: L10n
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
  /** Satt bare på dagsaktuelle spørsmål. Se `Topical`. */
  topical?: Topical
  /** Datovarianter av spørsmålsteksten. Se `OnThisDay`. */
  onThisDay?: OnThisDay[]
}

export interface Category {
  id: string
  /** Kort tittel, f.eks. «Blå». */
  name: L10n
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

/* --------------------------------------------------- tilbakemeldinger */

/**
 * Tommel opp/ned på et enkeltspørsmål. Uavhengig av om svaret ble rett –
 * dette handler om kvaliteten på spørsmålet, ikke om spilleren.
 */
export type FeedbackVote = 'opp' | 'ned'

/**
 * Grunner til tommel ned. Lukket liste, som emne-taggene, så statistikken
 * holder seg sammenlignbar. Rekkefølgen er den knappene vises i.
 */
export const FEEDBACK_REASONS = ['feil', 'uklart', 'lekker', 'nivaa', 'hint', 'kjedelig', 'annet'] as const
export type FeedbackReason = (typeof FEEDBACK_REASONS)[number]

export const FEEDBACK_REASON_LABELS: Record<FeedbackReason, { nb: string; sv: string }> = {
  feil: { nb: 'Feil eller upresist', sv: 'Fel eller oprecist' },
  uklart: { nb: 'Uklart formulert', sv: 'Otydligt formulerat' },
  lekker: { nb: 'Svaret røpes', sv: 'Svaret avslöjas' },
  nivaa: { nb: 'Feil vanskelighetsgrad', sv: 'Fel svårighetsgrad' },
  hint: { nb: 'Dårlig hint', sv: 'Dålig ledtråd' },
  kjedelig: { nb: 'Kjedelig', sv: 'Tråkig' },
  annet: { nb: 'Annet', sv: 'Annat' },
}

export function isFeedbackReason(value: unknown): value is FeedbackReason {
  return typeof value === 'string' && (FEEDBACK_REASONS as readonly string[]).includes(value)
}

/** Kommentarfeltet er ment for én setning, ikke en anmeldelse. */
export const FEEDBACK_COMMENT_MAX = 400

/** Én brukers stemme på ett spørsmål. */
export interface QuestionFeedback {
  questionId: string
  vote: FeedbackVote
  /** Bare ved tommel ned. */
  reason: FeedbackReason | null
  comment: string | null
  updatedAt: number
}

/** Sammenstillingen som driver oversikten. Én rad per spørsmål med stemmer. */
export interface FeedbackSummaryRow {
  questionId: string
  category: string
  difficulty: string
  up: number
  down: number
  /** up − down. Sorteringsnøkkelen i oversikten. */
  score: number
  reasons: { reason: FeedbackReason; count: number }[]
  /** Anonymiserte kommentarer, nyeste først. */
  comments: { text: string; vote: FeedbackVote; at: number }[]
  lastAt: number
}
