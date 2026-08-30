# Theme Quiz

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
* **Utgangspunkt** – norsk, svensk eller internasjonalt. Dette er en *vekting*,
  ikke et filter: velger du norsk får du flest norske referanser, men fortsatt
  svenske og internasjonale spørsmål. Norsk og internasjonalt spilles på norsk,
  svensk spilles på svenska.
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

### Kontoer og venner

Ingen e-post, ingen passord. Du oppretter en konto med et visningsnavn og får
to ting:

* en **vennekode** på åtte tegn som du deler med venner,
* en **gjenopprettingsnøkkel** som er den eneste veien inn på kontoen fra en ny
  enhet. Serveren lagrer bare SHA-256 av den.

Vennskap er gjensidige: legger du til noen, ser dere begge hverandres uketall.

## Spørsmålsbanken

600 spørsmål: 20 temaer × 3 nivåer × 10 spørsmål. Én JSON-fil per tema under
`content/questions/`.

```bash
npm run content:status      # hva finnes, hva mangler
npm run content:validate    # struktur, id-er, tags, duplikater, begge språk
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
```

## Videre

Frontend og API er skilt av `/api`, så en Expo/React Native-app senere kan snakke
med nøyaktig samme worker.
