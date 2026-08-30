# Slik skrives et spørsmål til Theme Quiz

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
  "source": "Navn på troverdig kilde"     // fri tekst, gjerne institusjon + verk
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
