#!/usr/bin/env node
/**
 * Validerer spørsmålsbanken før bygg.
 *
 * Sjekker struktur, ider, emne-tags, språkfelter og duplikater. Kjøres av
 * `npm run build`, så et ødelagt spørsmål stopper bygget i stedet for å dukke
 * opp som en tom boks i appen.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const questionsDir = join(root, 'content', 'questions')

const typesSrc = readFileSync(join(root, 'shared', 'types.ts'), 'utf8')
const TOPICS = new Set(
  [...typesSrc.matchAll(/export const TOPICS = \[([\s\S]*?)\] as const/g)]
    .flatMap((m) => [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1])),
)
const CATEGORIES = new Set(
  [...readFileSync(join(root, 'content', 'categories.ts'), 'utf8').matchAll(/^\s*id: '([^']+)',$/gm)].map((m) => m[1]),
)

const DIFFICULTIES = new Set(['lett', 'medium', 'vanskelig'])
const REGIONS = new Set(['no', 'se', 'int'])
const DIFF_INITIAL = { lett: 'l', medium: 'm', vanskelig: 'v' }

/**
 * Ankerordet for hvert tema, med oversettelser og nære varianter. Svaret på et
 * spørsmål skal aldri VÆRE ankerordet – da er koblingen null og spørsmålet
 * besvarer seg selv. Sammensetninger og egennavn som inneholder ordet er greit
 * («Saltstraumen», «Blåhval», «Golden Gate-broen») – det er det bare ordet
 * alene, på et hvilket som helst språk, som er forbudt.
 */
const ANCHORS = {
  blaa: ['blå', 'blått', 'blue', 'blau', 'bleu'],
  rod: ['rød', 'rødt', 'röd', 'rött', 'red', 'rot', 'rouge'],
  gull: ['gull', 'gullet', 'guld', 'guldet', 'gold', 'aurum'],
  vikinger: ['viking', 'vikingen', 'vikinger', 'vikingene', 'vikingar', 'vikingarna', 'vikings'],
  japan: ['japan', 'nippon', 'nihon'],
  manen: ['måne', 'månen', 'moon', 'the moon', 'luna', 'mond', 'lune'],
  kaffe: ['kaffe', 'kaffen', 'coffee', 'café', 'kaffi'],
  kongelige: ['kongelig', 'kongelige', 'kunglig', 'kungliga', 'royal', 'royals'],
  fjell: ['fjell', 'fjellet', 'fjäll', 'fjället', 'mountain', 'berg', 'berget', 'montagne'],
  havet: ['hav', 'havet', 'sea', 'the sea', 'ocean', 'mer', 'meer'],
  ild: ['ild', 'ilden', 'eld', 'elden', 'fire', 'feuer', 'feu'],
  rovdyr: ['rovdyr', 'rovdyret', 'rovdjur', 'rovdjuret', 'predator'],
  drikke: ['drikke', 'drikk', 'dryck', 'drink'],
  tog: ['tog', 'toget', 'tåg', 'tåget', 'train', 'zug'],
  nobel: ['nobel', 'nobelpris', 'nobelprisen', 'nobelpriset'],
  sjokolade: ['sjokolade', 'sjokoladen', 'choklad', 'chokladen', 'chocolate', 'chocolat', 'schokolade'],
  vinter: ['vinter', 'vinteren', 'vintern', 'winter', 'hiver'],
  fugler: ['fugl', 'fuglen', 'fugler', 'fuglene', 'fågel', 'fågeln', 'fåglar', 'bird', 'birds', 'vogel', 'oiseau'],
  broer: ['bro', 'broen', 'bru', 'brua', 'bron', 'broar', 'broer', 'bridge', 'brücke', 'pont'],
  tid: ['tid', 'tiden', 'time', 'zeit', 'temps', 'tempus'],
  storm: ['storm', 'stormen', 'oväder', 'ovädret', 'uvær', 'uværet', 'tempest'],
  salt: ['salt', 'saltet', 'saltets', 'sal', 'sel', 'salz'],
  hjerte: ['hjerte', 'hjertet', 'hjärta', 'hjärtat', 'heart', 'the heart', 'herz', 'coeur', 'cœur', 'cor'],
}

/**
 * Formene er skrevet ut med vilje, ikke generert. Genererte bøyninger tar
 * egennavn som tilfeldigvis ligner – «Salten» er et distrikt i Nordland, ikke
 * bestemt form av krydderet.
 */
function isAnchorWord(answer, category) {
  const base = (category ?? '').replace(/-\d+$/, '')
  const anchors = ANCHORS[base]
  if (!anchors) return false
  const a = answer
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^\p{L}\p{N} ]/gu, '')
    .trim()
  return anchors.includes(a)
}

const errors = []
const warnings = []
const seenIds = new Map()
const seenAnswers = new Map()
/** Dagsaktuelle per tema+nivå, for å fange at noen skriver flere enn de to som får plass. */
const topicalPerKey = new Map()
/** «På denne dag»-datoer per tema, for å fange kollisjoner på samme dato. */
const datedPerCategory = new Map()
let count = 0

const TODAY = new Date().toISOString().slice(0, 10)
const ISO_DAY = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
const ISO_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/
const MONTH_DAY = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/

/** Finnes datoen i kalenderen? `02-30` består regexen, men ikke virkeligheten. */
function isRealMonthDay(md) {
  const [m, d] = md.split('-').map(Number)
  // 2024 er skuddår, så 02-29 godtas – den treffer bare i skuddår, som er meningen.
  const days = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return d >= 1 && d <= days[m - 1]
}

/** Hvor mange måneder tilbake i tid en dato ligger. */
function monthsAgo(iso) {
  const then = new Date(`${iso.length === 7 ? `${iso}-01` : iso}T00:00:00Z`)
  const now = new Date(`${TODAY}T00:00:00Z`)
  return (now.getUTCFullYear() - then.getUTCFullYear()) * 12 + (now.getUTCMonth() - then.getUTCMonth())
}

function isL10n(value) {
  if (typeof value === 'string') return value.trim().length > 0
  return (
    value &&
    typeof value === 'object' &&
    typeof value.nb === 'string' &&
    typeof value.sv === 'string' &&
    value.nb.trim().length > 0 &&
    value.sv.trim().length > 0
  )
}

function text(value, lang) {
  return typeof value === 'string' ? value : value[lang]
}

let files = []
try {
  files = readdirSync(questionsDir).filter((f) => f.endsWith('.json')).sort()
} catch {
  console.log('ℹ  content/questions finnes ikke ennå – ingenting å validere.')
  process.exit(0)
}

for (const file of files) {
  const path = join(questionsDir, file)
  let data
  try {
    data = JSON.parse(readFileSync(path, 'utf8'))
  } catch (e) {
    errors.push(`${file}: ugyldig JSON – ${e.message}`)
    continue
  }
  if (!Array.isArray(data)) {
    errors.push(`${file}: filen må inneholde en liste med spørsmål`)
    continue
  }

  for (const [i, q] of data.entries()) {
    const where = `${file}[${i}]${q?.id ? ` (${q.id})` : ''}`
    count++

    if (typeof q?.id !== 'string' || !q.id) errors.push(`${where}: mangler id`)
    else if (seenIds.has(q.id)) errors.push(`${where}: id-en finnes allerede i ${seenIds.get(q.id)}`)
    else seenIds.set(q.id, file)

    if (!CATEGORIES.has(q?.category)) errors.push(`${where}: ukjent kategori "${q?.category}"`)
    if (!DIFFICULTIES.has(q?.difficulty)) errors.push(`${where}: ugyldig vanskelighetsgrad "${q?.difficulty}"`)
    if (!REGIONS.has(q?.origin)) errors.push(`${where}: ugyldig origin "${q?.origin}"`)

    if (
      typeof q?.id === 'string' &&
      CATEGORIES.has(q?.category) &&
      DIFFICULTIES.has(q?.difficulty) &&
      !q.id.startsWith(`${q.category}-${DIFF_INITIAL[q.difficulty]}-`)
    ) {
      errors.push(`${where}: id-en bør begynne med "${q.category}-${DIFF_INITIAL[q.difficulty]}-"`)
    }

    if (!Array.isArray(q?.topics) || q.topics.length === 0) errors.push(`${where}: mangler emne-tags`)
    else {
      for (const topic of q.topics) if (!TOPICS.has(topic)) errors.push(`${where}: ukjent emne-tag "${topic}"`)
      if (q.topics.length > 3) warnings.push(`${where}: ${q.topics.length} emne-tags – tre er nok`)
    }

    for (const field of ['prompt', 'answer', 'hint', 'funFact']) {
      if (!isL10n(q?.[field])) errors.push(`${where}: feltet "${field}" mangler eller er tomt på ett av språkene`)
    }

    if (q?.answerKind !== 'person' && q?.answerKind !== 'annet') {
      errors.push(`${where}: answerKind må være "person" eller "annet"`)
    }
    if (q?.answerKind === 'person') {
      if (!q.person || !isL10n(q.person.given) || !isL10n(q.person.family)) {
        errors.push(`${where}: personsvar må ha person.given og person.family (for bokstavhintet)`)
      }
    } else if (q?.person) {
      warnings.push(`${where}: person er satt, men answerKind er "annet"`)
    }

    if (typeof q?.source !== 'string' || q.source.trim().length < 4) {
      errors.push(`${where}: mangler kilde`)
    }

    if (isL10n(q?.prompt)) {
      for (const lang of ['nb', 'sv']) {
        const words = text(q.prompt, lang).split(/\s+/).length
        if (words < 12) warnings.push(`${where}: ${lang}-spørsmålet er kort (${words} ord) – innledningen bør gi kontekst`)
        if (words > 70) warnings.push(`${where}: ${lang}-spørsmålet er langt (${words} ord)`)
      }
    }

    if (isL10n(q?.answer) && typeof q?.category === 'string') {
      const key = `${q.category}|${text(q.answer, 'nb').toLowerCase()}`
      if (seenAnswers.has(key)) {
        errors.push(`${where}: samme svar som ${seenAnswers.get(key)} i samme tema`)
      } else {
        seenAnswers.set(key, q.id)
      }
      // Svaret skal ikke stå i klartekst i spørsmålet – på noen av språkene.
      if (isL10n(q?.prompt)) {
        for (const lang of ['nb', 'sv']) {
          const answer = text(q.answer, lang).toLowerCase()
          if (answer.length > 3 && text(q.prompt, lang).toLowerCase().includes(answer)) {
            errors.push(`${where}: svaret står i ${lang}-spørsmålsteksten`)
          }
        }
      }

      // Svaret skal ikke være selve ankerordet – heller ikke oversatt.
      for (const lang of ['nb', 'sv']) {
        if (isAnchorWord(text(q.answer, lang), q.category)) {
          errors.push(`${where}: svaret er selve ankerordet for temaet ("${text(q.answer, lang)}")`)
          break
        }
      }
    }

    /* ------------------------------------------------ dagsaktuelle spørsmål */

    if (q?.topical !== undefined) {
      const tp = q.topical
      if (typeof tp !== 'object' || tp === null || Array.isArray(tp)) {
        errors.push(`${where}: "topical" må være et objekt med event, until og evergreen`)
      } else {
        if (typeof tp.event !== 'string' || !(ISO_DAY.test(tp.event) || ISO_MONTH.test(tp.event))) {
          errors.push(`${where}: topical.event må være YYYY-MM-DD eller YYYY-MM`)
        } else {
          if (tp.event > TODAY) errors.push(`${where}: topical.event ligger fram i tid (${tp.event})`)
          const age = monthsAgo(tp.event)
          if (age > 14) {
            warnings.push(`${where}: hendelsen er ${age} måneder gammel – dagsaktuelt bør bety siste året`)
          }
        }
        if (typeof tp.until !== 'string' || !ISO_DAY.test(tp.until)) {
          errors.push(`${where}: topical.until må være en dato på formen YYYY-MM-DD`)
        } else if (typeof tp.event === 'string' && tp.until < tp.event.slice(0, 10)) {
          errors.push(`${where}: topical.until (${tp.until}) er før hendelsen (${tp.event})`)
        }
        if (typeof tp.evergreen !== 'boolean') {
          errors.push(`${where}: topical.evergreen må være true eller false – ta stilling til om spørsmålet tåler å bli gammelt`)
        }
        if (typeof tp.until === 'string' && tp.until < TODAY) {
          if (tp.evergreen) {
            warnings.push(`${where}: utløpt (${tp.until}), men merket evergreen – spilles videre som et vanlig spørsmål`)
          } else {
            warnings.push(`${where}: utløpt (${tp.until}) og ikke evergreen – trekkes ikke lenger, bør erstattes`)
          }
        }
        // Et dagsaktuelt spørsmål er ikke kildebelagt av et leksikon. Kilden skal
        // peke på en redaksjonell publisering, og gjerne på datoen.
        if (typeof q.source === 'string' && !/\d{4}/.test(q.source)) {
          warnings.push(`${where}: dagsaktuell kilde uten årstall – skriv «NRK, 14.03.2026» eller tilsvarende`)
        }
        if (typeof tp.until === 'string' && tp.until >= TODAY && DIFFICULTIES.has(q?.difficulty)) {
          const key = `${q.category}|${q.difficulty}`
          const n = (topicalPerKey.get(key) ?? 0) + 1
          topicalPerKey.set(key, n)
          if (n === 3) warnings.push(`${key}: flere enn to ferske dagsaktuelle – bare to får plass i en runde`)
        }
      }
    }

    /* ------------------------------------------------ «på denne dag»-variant */

    if (q?.onThisDay !== undefined) {
      if (!Array.isArray(q.onThisDay) || q.onThisDay.length === 0) {
        errors.push(`${where}: "onThisDay" må være en ikke-tom liste`)
      } else {
        const daysHere = new Set()
        for (const [j, v] of q.onThisDay.entries()) {
          const w = `${where}.onThisDay[${j}]`
          if (typeof v?.day !== 'string' || !MONTH_DAY.test(v.day) || !isRealMonthDay(v.day)) {
            errors.push(`${w}: "day" må være en ekte dato på formen MM-DD`)
          } else {
            if (daysHere.has(v.day)) errors.push(`${w}: samme dato to ganger i samme spørsmål`)
            daysHere.add(v.day)
            const key = `${q.category}|${v.day}`
            const prev = datedPerCategory.get(key)
            if (prev && prev !== q.id) {
              warnings.push(`${w}: ${prev} har allerede ${v.day} i samme tema – bare ett trekkes den dagen`)
            } else if (!prev) {
              datedPerCategory.set(key, q.id)
            }
          }
          if (!Number.isInteger(v?.year) || v.year < 1 || v.year > Number(TODAY.slice(0, 4))) {
            errors.push(`${w}: "year" må være et årstall som har vært`)
          }
          if (!isL10n(v?.prompt)) {
            errors.push(`${w}: "prompt" mangler eller er tom på ett av språkene`)
            continue
          }
          for (const lang of ['nb', 'sv']) {
            const words = text(v.prompt, lang).split(/\s+/).length
            if (words < 12) warnings.push(`${w}: ${lang}-varianten er kort (${words} ord)`)
            if (words > 70) warnings.push(`${w}: ${lang}-varianten er lang (${words} ord)`)
            // Datovarianten er hele spørsmålsteksten, og svaret kan lekke i den
            // like godt som i den vanlige – særlig når man skriver «på denne dagen».
            if (isL10n(q?.answer)) {
              const answer = text(q.answer, lang).toLowerCase()
              if (answer.length > 3 && text(v.prompt, lang).toLowerCase().includes(answer)) {
                errors.push(`${w}: svaret står i ${lang}-varianten`)
              }
            }
          }
        }
      }
    }
  }
}

/* ============================================================ domsetninger

   Én fil per tema i `content/verdicts/`, med to varianter for hver mulige
   poengsum. Et tema uten fil stopper bygget – det er slik nye kategorier
   tvinges til å få domsetninger samtidig med spørsmålene.
   Kontrakten står i `content/VERDICTS-SPEC.md`.                          */

const verdictsDir = join(root, 'content', 'verdicts')
const MAX_SCORE = 10
const VARIANTS = 2

let verdictLines = 0
const verdictFiles = readdirSync(verdictsDir).filter((f) => f.endsWith('.json'))

for (const cat of CATEGORIES) {
  if (!verdictFiles.includes(`${cat}.json`)) {
    errors.push(`content/verdicts/${cat}.json mangler – hvert tema må ha domsetninger, se content/VERDICTS-SPEC.md`)
  }
}

for (const file of verdictFiles) {
  const where0 = `verdicts/${file}`
  const id = file.replace(/\.json$/, '')
  if (!CATEGORIES.has(id)) {
    errors.push(`${where0}: ingen kategori heter «${id}»`)
    continue
  }

  let doc
  try {
    doc = JSON.parse(readFileSync(join(verdictsDir, file), 'utf8'))
  } catch (err) {
    errors.push(`${where0}: ugyldig JSON – ${err.message}`)
    continue
  }

  if (doc?.category !== id) errors.push(`${where0}: "category" må være «${id}»`)
  if (typeof doc?.lines !== 'object' || doc.lines === null) {
    errors.push(`${where0}: "lines" mangler`)
    continue
  }

  const expected = Array.from({ length: MAX_SCORE + 1 }, (_, i) => String(i))
  for (const key of Object.keys(doc.lines)) {
    if (!expected.includes(key)) errors.push(`${where0}: ukjent poengsum «${key}»`)
  }

  const seen = new Map()
  for (const key of expected) {
    const where = `${where0}[${key}]`
    const variants = doc.lines[key]
    if (!Array.isArray(variants) || variants.length !== VARIANTS) {
      errors.push(`${where}: må ha nøyaktig ${VARIANTS} varianter`)
      continue
    }
    for (const [i, v] of variants.entries()) {
      const w = `${where}.${i}`
      if (!isL10n(v)) {
        errors.push(`${w}: mangler tekst på norsk eller svensk`)
        continue
      }
      verdictLines += 1
      for (const lang of ['nb', 'sv']) {
        const line = text(v, lang)
        const words = line.split(/\s+/).length
        if (words < 6) warnings.push(`${w}: ${lang}-linja er kort (${words} ord)`)
        if (words > 30) warnings.push(`${w}: ${lang}-linja er lang (${words} ord)`)
        if (/\d/.test(line)) warnings.push(`${w}: ${lang}-linja inneholder et tall – poengsummen står allerede over`)
        if (line.includes('"')) warnings.push(`${w}: ${lang}-linja bruker rette anførselstegn, bruk «…»`)
        const prev = seen.get(line)
        if (prev !== undefined) {
          errors.push(`${w}: samme ${lang}-linje som ${where0}[${prev}]`)
        } else {
          seen.set(line, key)
        }
      }
    }
  }
}

for (const w of warnings) console.warn(`⚠  ${w}`)
for (const e of errors) console.error(`✖  ${e}`)

console.log(
  `\n${count} spørsmål i ${files.length} filer · ${verdictLines} domsetninger i ${verdictFiles.length} filer · ${errors.length} feil · ${warnings.length} advarsler`,
)
process.exit(errors.length > 0 ? 1 : 0)
