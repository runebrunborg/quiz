# LinnQuiz

Temabasert quiz på norsk og svensk. Ti spørsmål om ett tema, alle vist samtidig,
med hint, første bokstav i svaret, fasit med fun fact – og statistikk over tid,
per skjult emne-tag og mot vennene dine.

Bygget for Cloudflare (Workers + D1), men kjører like godt lokalt.

## Kom i gang

```bash
npm install
npm run dev          # frontend på http://localhost:5173
```

Uten backend fungerer alt bortsett fra vennesammenligning – rundene lagres
lokalt i nettleseren.

### Med backend lokalt

```bash
npx wrangler d1 create theme-quiz      # lim database_id inn i wrangler.jsonc
npm run db:migrate:local
npm run build
npm run cf:dev                          # worker + statiske filer på :8787
```

`npm run dev` proxyer `/api` videre til `http://127.0.0.1:8787`, så du kan kjøre
Vite og Wrangler side om side.

### Deploy til Cloudflare

```bash
npx wrangler login
npx wrangler d1 create theme-quiz       # hvis du ikke har gjort det
npm run db:migrate:remote
npm run cf:deploy
```

Workeren serverer både API-et og frontend-bygget fra samme domene, så det er én
`wrangler deploy` og ingenting mer.

## Slik virker quizen

* **Tema** – 20 temaer, hvert med et eget SVG-bakgrunnsmotiv tegnet i palettens
  farger. Ingen bildefiler, alt er vektorgrafikk.
* **Vanskelighetsgrad** – `lett`, `medium`, `vanskelig`. Hvert tema har ti
  spørsmål på hvert nivå.
* **Utgangspunkt** – norsk, svensk eller internasjonalt. Dette er *kvoter*, ikke
  et filter: velger du norsk blir fem av ti spørsmål norskforankrede, to
  svenske og tre internasjonale. Norsk og internasjonalt spilles på norsk,
  svensk spilles på svenska. En norsk og en svensk runde av samme tema og nivå
  deler i snitt fire og en halv av ti spørsmål – mål det med
  `npm run content:regions`.
* **Hint** – ett tekstlig hint per spørsmål, og ett bokstavhint. Er svaret en
  person, kan du velge om du vil ha første bokstav i fornavn eller etternavn;
  ellers får du første bokstav i svaret. Bokstavhintet viser også ordlengden.
* **Fasit** – alle svar vises samlet når du er klar, hver med en fun fact som kan
  ekspanderes, og en kildehenvisning.
* **Vurdering** – du markerer selv rett eller galt per spørsmål. Det er dette som
  bygger statistikken.

## Statistikk

Hvert svar lagres med spørsmålets skjulte emne-tags (`geografi`, `popkultur`,
`vikingtid` …). Det gir:

* utvikling i treffprosent per uke,
* treffprosent per emne, så du ser hva du er sterk og svak på,
* treffprosent per tema,
* sammenligning mot venner per uke og akkumulert.

Rundene lagres alltid lokalt først og synkroniseres til serveren når du er
innlogget. Er du offline, ligger de i kø og sendes neste gang.

### Kontoer, venner og toppliste

Innlogging er nickname og passord. Nicknamet er unikt på tvers av skrivemåte
(«Rune» og «r u n e» er samme navn), og det er slik venner finner deg.

Selve nøkkelutledningen fra passordet skjer i nettleseren – PBKDF2 med 600 000
runder – og serveren lagrer en saltet SHA-256 av resultatet. Arbeidsdelingen er
bevisst: Cloudflares gratisplan gir hver forespørsel svært lite CPU-tid, og en
forsvarlig PBKDF2 på serveren ville sprengt taket. En angriper som får tak i
databasen må fortsatt kjøre hele PBKDF2-jobben per passordgjetning.

Hver innlogget enhet får sin egen nøkkel i `auth_tokens`, så du kan være logget
inn flere steder. Bytter du passord, logges alle andre enheter ut.

Fødselsår og land er valgfrie og kan fjernes når som helst. De brukes bare til
aldersgruppe- og landsstatistikk, og vises aldri på topplisten. Aldersgrensen er
13 år, håndhevet ved at fødselsår nyere enn det avvises.

Topplisten er åpen for innloggede spillere og viser nickname og treffprosent.
Det står tydelig ved registrering. `DELETE /api/account/me` sletter kontoen og
alt som hører til den.

Rundene lagres alltid lokalt først og synkroniseres når du er innlogget. Er du
offline, ligger de i kø og sendes neste gang. Oppretter du profil etter å ha
spilt en stund, følger historikken på enheten med.

## Spørsmålsbanken

1380 spørsmål: 23 temaer × 3 nivåer × 20 spørsmål. Hver runde trekker ti fra puljen. Én JSON-fil per tema under
`content/questions/`.

```bash
npm run content:status      # hva finnes, hva mangler
npm run content:validate    # struktur, id-er, tags, duplikater, begge språk
npm run content:regions     # hva regionvalget faktisk gjør med sammensetningen
```

`content/SPEC.md` er kontrakten for hvordan et spørsmål skrives, og
`content/questions/blaa.json` er fasitmalen. Skal du be Claude fylle på et tema,
er de to filene alt som trengs som kontekst. Skjermbildet «Banken» i appen viser
dekningen live.

Alle spørsmål har en kildehenvisning i `source`-feltet. Finner du en feil, rett
den i JSON-filen – id-en skal aldri endres, den er nøkkelen statistikken henger
på.

## Prosjektstruktur

```
content/          spørsmålsbanken + kategoridefinisjoner + SPEC.md
shared/           typer og datohjelpere delt mellom frontend og worker
src/              React-frontend
  themes/         de 20 SVG-scenene
  styles/         designtokens og komponentstiler
  lib/            innholdslasting, hint, lagring, statistikk, API-klient
  screens/        Spill, Statistikk, Venner, Banken
worker/           Cloudflare Worker (Hono) – API på /api
migrations/       D1-skjema
scripts/          innholdsvalidering og statusrapport
```

## Design

Hotpink signalfarge på mørkeblått lerret, hvit tekst, mye gradient. Fontene er
Outfit (overskrifter) og Inter (brødtekst). Hele paletten ligger som CSS-tokens
i `src/styles/tokens.css` – ingen farger er hardkodet andre steder.

Diagramfargene (`--chart-1`, `--chart-2`) er kontrollert mot den mørke flaten for
lyshet, kontrast og separasjon ved fargeblindhet.

## Tester

```bash
npm test        # hint-logikk, trekning, statistikk og innholdsinvarianter
npm run build   # validerer innholdet, typesjekker og bygger

npm run cf:dev  # i ett vindu
npm run test:api # i et annet: hele kontolopet mot en kjorende worker
```

`npm run test:api` gar gjennom registrering, unikt nickname, innlogging, feil
passord, aldersgrense, venner, toppliste, passordbytte og sletting.

## Videre

Frontend og API er skilt av `/api`, så en Expo/React Native-app senere kan snakke
med nøyaktig samme worker.
