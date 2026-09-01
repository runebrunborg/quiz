# Slik skrives et spørsmål til LinnQuiz

Denne filen er kontrakten for innholdsbanken. `content/questions/blaa.json` er
fasitmalen – les den før du skriver noe nytt.

## Struktur

Én JSON-fil per tema: `content/questions/<kategori-id>.json`, en liste med
nøyaktig 30 objekter – 10 `lett`, 10 `medium`, 10 `vanskelig`.

```jsonc
{
  "id": "blaa-l-01",          // <kategori>-<l|m|v>-<løpenummer>. Endres ALDRI etterpå.
  "category": "blaa",
  "difficulty": "lett",        // lett | medium | vanskelig
  "origin": "int",             // no | se | int – hvor spørsmålet «hører hjemme»
  "topics": ["teknologi", "vikingtid"],   // 1–3 skjulte emne-tags fra TOPICS i shared/types.ts
  "prompt":  { "nb": "…", "sv": "…" },    // 25–55 ord. Fun fact-innledning FØRST, spørsmålet TIL SLUTT
  "answer":  { "nb": "…", "sv": "…" },    // eller bare "…" hvis identisk på begge språk
  "answerKind": "person",                 // person | annet
  "person":  { "given": "Harald", "family": { "nb": "Blåtann", "sv": "Blåtand" } },
  "hint":    { "nb": "…", "sv": "…" },    // peker mot svaret uten å røpe det
  "funFact": { "nb": "…", "sv": "…" },    // 1–3 setninger som vises når svaret ekspanderes
  "source": "Navn på troverdig kilde",    // fri tekst, gjerne institusjon + verk

  // Valgfritt. Bare på dagsaktuelle spørsmål – se eget kapittel nederst.
  "topical": { "event": "2026-02-22", "until": "2027-02-28", "evergreen": true },

  // Valgfritt. «På denne dag»-varianter – se eget kapittel nederst.
  "onThisDay": [
    { "day": "02-22", "year": 2026, "prompt": { "nb": "…", "sv": "…" } }
  ]
}
```

Strenger som er identiske på norsk og svensk kan skrives som en enkel streng i
stedet for `{ "nb": …, "sv": … }`.

## Absolutte krav

1. **Ingen oppdiktede fakta.** Hvert eneste faktum – årstall, navn, tall,
   rekkefølge – skal være kontrollert mot en troverdig kilde. Er du i tvil om et
   detaljfaktum: fjern detaljen, ikke gjett. Et spørsmål med færre detaljer er
   uendelig mye bedre enn ett med én oppdiktet detalj.
2. **Svaret skal være entydig.** Ingen spørsmål der to svar er like riktige.
3. **Svaret skal ikke stå i spørsmålsteksten** – heller ikke i innledningen.
4. **Ingen sensitive detaljer** om navngitte personer (helse, seksualitet,
   rusbruk, selvmord, overgrep). Historiske og faglige forhold er greit.
5. **Ferske fakta unngås.** Skriv om ting som ligger fast, ikke om hvem som er
   verdensmester akkurat nå eller hva noe koster.

## Form

* Innledningen er 10–25 ord med noe interessant, og *deretter* kommer selve
  spørsmålet. Eksempel: «Han samlet Danmark under én krone på 900-tallet …
  Hvilken vikingkonge?» – ikke «Hvem var Harald Blåtann?».
* Alt skal finnes både på norsk bokmål og på svensk. Den svenske versjonen er en
  ekte oversettelse, ikke norsk med svenske ord. Sjekk at egennavn får riktig
  form (`Harald Blåtann` / `Harald Blåtand`, `Italia` / `Italien`).
* Bruk «…» som anførselstegn, ikke "…".
* Vanskelighetsgradene kalibreres omtrent slik som Aftenpostens dagsquiz:
  * **lett** – de fleste voksne får den, eventuelt med hint.
  * **medium** – krever at man er litt over gjennomsnittet interessert.
  * **vanskelig** – for den som kan feltet, men fortsatt et rimelig spørsmål å
    stille; ikke ren pugging av tall.

## Regionmiks

Regionvalget i appen er en *vekting*, ikke et filter: velger man norsk, får man
også svenske og internasjonale spørsmål. Innenfor hvert nivå (10 spørsmål) sikt
mot omtrent:

* 4–6 med `origin: "int"`
* 2–3 med `origin: "no"`
* 2–3 med `origin: "se"`

Det norske og det svenske innslaget skal være ekte lokalt forankret – ikke et
internasjonalt spørsmål med et norsk ord i. En norsk-forankret quiz kan gjerne
spørre om Sverige, og omvendt.

## Bredde i emne-tags

Emne-taggene driver statistikken («du klarer 40 % av geografi, 60 % av
popkultur»). Innenfor ett tema skal de 30 spørsmålene til sammen dekke minst 8
ulike tags, og ikke mer enn 6 spørsmål bør dele samme hovedtag. Bruk kun tags
som finnes i `TOPICS` i `shared/types.ts`.

## Kontroll før levering

Kjør fra prosjektroten:

```
node scripts/validate-content.mjs
```

Den skal si `0 feil`. Advarsler bør også ryddes bort.

---

## Påfyll: fra ti til tjue spørsmål per nivå

Banken startet med nøyaktig ti spørsmål per tema og nivå – akkurat nok til én
runde, slik at regionvalget bare byttet språk. Måltallet er nå **20 per nivå**,
slik at appen trekker ti av tjue og vektingen faktisk gir ulike quizer for
norsk, svensk og internasjonalt utgangspunkt.

Påfyllet legges i en egen fil per tema: `content/questions/<kategori>-2.json`.
Originalfilen røres ikke. Id-ene fortsetter der originalen slapp:
`blaa-l-11` … `blaa-l-20`, `blaa-m-11` … `blaa-m-20`, `blaa-v-11` … `blaa-v-20`.

**Regionmiksen i påfyllet er en annen enn i grunnsettet.** Grunnsettet er
internasjonalt tungt, så påfyllet skal veie opp: sikt mot **4 `no`, 4 `se` og 2
`int` per nivå**. Da ender hver pulje på omtrent 6–7 norske, 6–7 svenske og 7–8
internasjonale spørsmål, og de tre utgangspunktene får hver sin tydelige
karakter.

Alt annet er som før: samme struktur, samme krav til kilder, og svarene må ikke
kollidere med dem som allerede finnes i temaets originalfil – les den først.

---

## Kilder som faktisk lar seg hente

Nettmiljøet der spørsmålene skrives er begrenset. Erfaring så langt:

* **Virker:** `snl.no` — både oppslag (`https://snl.no/<emne>`) og søk
  (`https://snl.no/api/v1/search?query=...`). Store norske leksikon har god
  dekning også av svenske emner, og er den mest pålitelige kilden her.
* **Virker:** `en.wikipedia.org`, samt institusjoners, museers og bedrifters
  egne sider.
* **Virker ikke:** `no.wikipedia.org` og `sv.wikipedia.org` er «cache-only» og
  kan ikke hentes. `WebSearch` gir HTTP 403. Wikidata, runeberg.org og
  Riksarkivet er sperret av utgående brannmur.

**Konsekvens for den svenske kvoten.** Flere skrivere har bommet på de fire
svenske spørsmålene per nivå fordi de valgte emner som bare finnes på svensk
Wikipedia. Løsningen er ikke å droppe kvoten, men å velge svenske emner som er
kjente nok til å stå i Store norske leksikon eller på engelsk Wikipedia: ABBA,
IKEA, Vasaloppet, Systembolaget, Nobel, Astrid Lindgren, Ingmar Bergman, Volvo,
Saab, Zlatan, Greta Garbo, Carl von Linné, Alfred Nobel, Stockholms slott,
Gustav Vasa, Dalahästen, Midsommar, Lucia, Pippi, Emil i Lönneberga, Björn Borg,
Sveriges kungahus, Skansen, Vasaskipet. Sjekk kilden *før* du bestemmer deg for
spørsmålet, ikke etter.

---

## Hvordan regionvalget virker i praksis

Sammensetningen av en runde er **kvoter**, ikke vekter, og ligger i `QUOTAS` i
`src/lib/content.ts`:

| Valgt utgangspunkt | norske | svenske | internasjonale |
|---|---|---|---|
| Norsk | 5 | 2 | 3 |
| Svensk | 2 | 5 | 3 |
| Internasjonalt | 2 | 2 | 6 |

Rene vekter ble prøvd først og var for svake: med tjue spørsmål i puljen og ti i
en runde delte den norske og den svenske runden åtte av ti spørsmål. Med kvoter
og et regionavhengig trekningsfrø deler de rundt fire og en halv, og
herkomstfordelingen treffer tabellen over.

Kjør `npm run content:regions` for å måle det etter at du har fylt på banken.
Derfor betyr regionmiksen i påfyllet noe: mangler et tema svenske spørsmål, blir
plassene fylt fra de andre gruppene, og svensk utgangspunkt mister sin karakter.

## Tone i årstallspørsmål

Hendelseslisten i et årstallspørsmål skal kunne leses høyt i et lystig lag.
Naturkatastrofer og kriger kan stå der som nøktern historie når året krever det,
men nasjonale traumer skal ikke brukes som lette poeng – 22. juli hører ikke
hjemme mellom en iPad-lansering og et Adele-album. Velg en annen hendelse fra
samme år.

---

## Dagsaktuelle spørsmål

To plasser i hver runde er satt av til noe som har skjedd det siste året. De
**erstatter** to av de ti – runden er fortsatt ti spørsmål.

### Hvor de bor

Egen fil per tema: `content/questions/<kategori>-aktuelt.json`. Grunnfila og
påfyllsfila røres ikke. Id-ene får `a` foran løpenummeret, så de aldri kolliderer
med et framtidig påfyll: `blaa-l-a1`, `blaa-l-a2`, `blaa-m-a1` … Prefikset
`<kategori>-<l|m|v>-` gjelder som ellers.

Måltallet er **to per tema og nivå**, men dette er det ene stedet i banken der
det er lov å levere færre. Ankerordet skal fortsatt bære spørsmålet, hendelsen
skal ligge innenfor det siste året, og svaret skal fortsatt være noe folk
kjenner. For noen ankerord finnes det ikke to slike hendelser. Da skriver du én,
eller ingen. **Et oppdiktet eller søkt dagsaktuelt spørsmål er verre enn et
tomt felt** – det tomme feltet vises som et hull på bankskjermen og kan fylles
neste måned.

### `topical`-feltet

```jsonc
"topical": {
  "event": "2026-02-22",   // når hendelsen skjedde. YYYY-MM-DD, eller YYYY-MM
  "until": "2027-02-28",   // siste dag spørsmålet regnes som dagsaktuelt
  "evergreen": true        // om spørsmålet er godt også etter «until»
}
```

**`until`** settes med hensikt, ikke i vane. Tommelfingerregler:

* **Taket er tolv måneder etter hendelsen.** «Dagsaktuelt» betyr det siste året,
  og en reservert plass som står i fire år er ikke en dagsaktuell plass – den er
  et vanlig spørsmål som stenger døren for noe ferskere. Et OL-gull fra februar
  slipper altså den reserverte plassen påfølgende februar; er det et godt
  spørsmål, står det `evergreen: true` og lever videre i den vanlige puljen.
* Et resultat som avgjøres på nytt hvert år: fram til neste utdeling, som da
  alltid er innenfor taket.
* Noe som kan snu hvilken dag som helst («hvem leder ligaen»): ikke skriv
  spørsmålet i det hele fall. Slike spørsmål hører ikke hjemme i en bank som
  ikke oppdateres daglig.

**`evergreen`** er den viktige avgjørelsen: *er dette et godt spørsmål også når
det ikke lenger er ferskt?*

* `true` – hendelsen står i historien. «Hvem tok over tronen da Harald V døde?»
  er like godt om tre år. Spørsmålet glir inn i den vanlige puljen når `until`
  er passert, og trekkes videre uten reservert plass.
* `false` – nyheten *var* poenget. «Hvor mange … så langt i år?» blir bare rart
  senere. Spørsmålet slutter å bli trukket den dagen `until` passeres, men blir
  liggende i fila: skulle det bli aktuelt igjen, er det nok å flytte `until`.

Validatoren advarer om utløpte spørsmål, så de er lette å finne igjen.

### Ekstra krav

1. **Kilden skal være redaksjonell og datert.** `snl.no` er sjelden oppdatert
   nok her. Skriv «NRK, 14.03.2026» eller «SVT Nyheter, 2026-02-22» – med
   årstall, ellers advarer validatoren.
2. **Ingen fersk statistikk som svar.** Ingen tabellposisjoner, aksjekurser,
   dødstall eller «hvor mange» – tall som endrer seg mens spørsmålet står.
3. **Tone.** Samme regel som for årstallspørsmålene, og strengere: krig,
   katastrofer og dødsfall er nyheter, men skal ikke stå som lette poeng. Er den
   eneste dagsaktuelle koblingen et menneskes død eller en katastrofe med mange
   omkomne, velg noe annet – med ett unntak: et dødsfall som utløser et
   historisk skifte (et tronskifte, en pave) kan spørres om, og da med
   spørsmålet rettet mot skiftet, ikke mot dødsfallet.
4. **Regionmiks gjelder ikke her.** To spørsmål er for lite å kvotere. Skriv
   dem der hendelsen hører hjemme, og sett `origin` ærlig.

---

## «På denne dag»

Et spørsmål kan ha en variant av spørsmålsteksten som bare vises på én bestemt
dato i året. Treffer dagens dato, byttes **hele** spørsmålsteksten ut. Svar, hint
og fun fact er de samme – det er bare innpakningen som endres.

```jsonc
"onThisDay": [
  {
    "day": "01-27",          // MM-DD. 02-29 treffer bare i skuddår
    "year": 1756,            // året hendelsen skjedde
    "prompt": {              // erstatter "prompt" denne dagen
      "nb": "På denne dagen i 1756 ble det født en gutt i Salzburg som …",
      "sv": "…"
    }
  }
]
```

Lista tåler flere datoer på samme spørsmål – født og død, åpnet og revet.

### Krav

* Samme form som `prompt`: 25–55 ord, innledning først, spørsmålet til slutt, og
  ekte svensk oversettelse.
* **Svaret må ikke lekke.** Fella er større her enn ellers: «På denne dagen i
  1756 ble Mozart født» røper alt. Skriv datoen inn som *kontekst*, ikke som
  fasit. Validatoren sjekker begge språk.
* Datoen skal være kontrollert mot kilde. En dato som er omstridt eller oppgitt
  ulikt i ulike kilder, brukes ikke.
* Ett spørsmål per dato per tema. Er det to, trekkes bare det ene, og
  validatoren advarer.

### Hva appen gjør med det

Temaer som har et spørsmål med treff på dagens dato, **legges først** i
temalisten på startskjermen og merkes «I dag». Runden garanterer da at
spørsmålet faktisk kommer med – ellers ville løftet på startskjermen være tomt.
Datospørsmålet stokkes inn blant de vanlige; de dagsaktuelle står til slutt.

## Domsetninger

Hvert tema har også en fil med **domsetninger** – linja som står under
poengsummen på resultatskjermen, med et bilde hentet fra temaets egen verden.
Formatet og tonen står i `content/VERDICTS-SPEC.md`, fasitmalen er
`content/verdicts/tog.json`.

Dette er ikke valgfritt: `npm run content:validate` feiler hvis en kategori i
`content/categories.ts` mangler `content/verdicts/<id>.json`, eller hvis fila
ikke har to varianter for hver poengsum fra 0 til 10. **Lager du en ny
kategori, skriver du domsetningene i samme slengen som spørsmålene** – ellers
stopper bygget.
