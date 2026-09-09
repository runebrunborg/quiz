# Uavhengig kontroll av spørsmålsbanken

Denne fila er kontrakten for **kontrollrunden**. `content/SPEC.md` sier hvordan
et spørsmål skrives; her står hvordan et spørsmål som allerede er skrevet, blir
kontrollert av en annen enn den som skrev det.

## Hvorfor

Validatoren fanger struktur: ordtelling, manglende språk, svar som lekker,
ugyldige emne-tags. Den fanger ikke **et oppdiktet faktum**. Et årstall som er
ett år feil, en person som aldri satt i den stillingen, en bro som står i feil
kommune — alt det består validatoren, `tsc` og testene, og går rett i
produksjon.

Hver skriver kildebelegger sitt eget arbeid. Det er ikke det samme som at noen
har kontrollert det: skriveren husker hva hun mente å lese. Kontrollrunden er
den andre halvdelen — en som ikke skrev spørsmålet, henter kilden på nytt og ser
etter om den faktisk sier det spørsmålet påstår.

## Vekslingen

Den faste oppgaven kjører `npm run content:verify` som første steg og gjør det
den sier:

```
MODUS: VERIFISER   → køen er på ti eller mer. Kontroller ti, ikke skriv noe.
MODUS: SKRIV       → køen er under ti. Skriv ti nye spørsmål.
```

Ti nye spørsmål lager ti nye plasser i køen, så neste kjøring går automatisk til
kontroll. **Banken kan aldri løpe fra kontrollen.** Det er hele poenget med
mekanismen, og den skal ikke overstyres fordi et hull i banken frister.

## Rekkefølgen i køen

Køa er sortert etter risiko, ikke alfabet. `verify-queue.mjs` deler i fem:

1. **nedstemt** — spillere har gitt tommel ned. De vet ofte noe vi ikke vet.
2. **dagsaktuelt** — nyhetskilder forsvinner fortest, og fakta som var ferske
   endrer seg.
3. **kilde utenfor rekkevidde** — kilden er hverken SNL eller Wikipedia. Den er
   vanskeligst å kontrollere, og derfor den som lettest skjuler noe.
4. **utdatert kontroll** — kontrollert for mer enn tolv måneder siden.
   Leksikonartikler skrives om.
5. **ikke kontrollert** — resten.

Innenfor hver klasse ligger spørsmålene samlet per tema, så du kan gjenbruke
oppslag og se svarkollisjoner i samme slengen.

## Hva en kontroll er

For hvert spørsmål i puljen:

1. **Hent kilden på nytt, i denne økta.** `WebFetch` mot `snl.no` (også søket,
   `https://snl.no/api/v1/search?query=...`) eller `en.wikipedia.org`. Finner du
   ikke slugen, søk. Et sammendrag i en søketreffliste er ikke artikkelen — du
   skal ha åpnet den.
2. **Les etter hvert faktum i spørsmålet.** Årstall, navn, rekkefølge, sted,
   tall. Både i `prompt`, i `answer` og i `funFact` — fun facten vises for
   spilleren og er like mye en påstand som resten.
3. **Kontroller at svaret fortsatt er entydig.** Finnes det et annet svar som er
   like riktig på spørsmålet slik det er formulert, er spørsmålet feil selv om
   hvert enkelt faktum stemmer.
4. **For «på denne dag»: kontroller datoen mot kilden.** Det er den eneste
   påstanden varianten legger til, og den er lett å ta feil av — fødselsdato og
   dåpsdato, åpning og innvielse.

Dette er **ikke** en kontroll:

- å lese et sammendrag fra en søketreffliste og kjenne igjen navnet
- å gjette en slug og notere den uten å ha fått svar på den
- å slå fast at «det høres riktig ut» eller at «skriveren oppga jo en kilde»
- å bytte kilden i `source` til noe som ser mer redaksjonelt ut, uten å ha
  åpnet det. En henvisning ingen har lest er verre enn en Wikipedia-lenke som
  faktisk ble lest.

**Kontroller aldri ditt eget arbeid.** Skrev du spørsmålet i en tidligere
kjøring, står det fortsatt i køen for noen andre. Er hele puljen din egen, si
fra i rapporten i stedet for å godkjenne den.

## De tre utfallene

### Godkjent

Kilden dekker påstanden. Sett alle tre feltene:

```jsonc
"verifiedAt": "2026-09-09",
"verifiedBy": "kontrollrunde",
"verifiedUrl": "https://snl.no/Bj%C3%B6rn_Borg"
```

`verifiedUrl` er **URL-en du faktisk hentet**, ikke en du regner med finnes.
Validatoren avviser forsider (`https://snl.no/`), `http`, og verter som ikke lar
seg hente herfra — `no.wikipedia.org`, `sv.wikipedia.org`, `tv2.no`, Wikidata.
En URL dit betyr at ingen kan ha lest den.

`source` røres ikke. Den er skriverens henvisning og har verdi som det.

### Rettet

Kilden dekker det meste, men en detalj er feil eller upresis. Rett detaljen —
eller fjern den, som SPEC sier: et spørsmål med færre detaljer er bedre enn ett
med en detalj som ikke stemmer. Deretter settes de tre feltene som over.

Endrer du `prompt` eller `answer`, sjekk at ordtellingen (25–55) holder på begge
språk og at svaret ikke plutselig lekker. Kjør validatoren.

### Flagget

Kilden sier ikke det spørsmålet påstår, og ingen hentbar kilde gjør det heller.
Da flagges spørsmålet:

```jsonc
"flagged": {
  "at": "2026-09-09",
  "by": "kontrollrunde",
  "reason": "SNL oppgir 1904, spørsmålet sier 1902; ingen kilde støtter 1902"
}
```

**Et flagget spørsmål trekkes ikke.** Det filtreres ut av alle puljer på samme
måte som et utløpt dagsaktuelt, så det slutter å nå spillere med én gang. Det
blir liggende i fila, og validatoren skriver det ut i hvert bygg til noen retter
eller stryker det. Id-en blir stående, så statistikken ikke får hull.

Et spørsmål kan ikke være både flagget og kontrollert. Retter du det senere,
fjernes `flagged` og de tre kontrollfeltene settes.

Flagg heller enn å gjette. Terskelen er lav med vilje: køa er lang, og et
spørsmål som står ute av trekningen i en uke koster ingenting mot ett som står
feil i produksjon.

## Lenker som råtner

```
npm run content:verify -- --links
```

skriver ut alle URL-er som er registrert som lest. Hentes en av dem ikke lenger,
skal spørsmålene som peker dit i køen igjen. Kontrollen har uansett tolv
måneders holdbarhet (`VERIFY_STALE_MONTHS`) — etter det legger køa dem inn av
seg selv.

Hverken skallet på Mac-en eller Cowork-skyen har utgående nett til `snl.no`, så
ingen automatikk kan sjekke lenkene. Det er `WebFetch` i kontrolløkta som er
sjekken, og derfor validatoren bare kontrollerer *formen* på URL-en.

## Rapporten

Avslutt kjøringen med: hvor mange som ble godkjent, hvor mange rettet og hva som
var galt, hvor mange flagget og hvorfor, og hvor lang køa er nå. Nevn eksplisitt
om en kilde ikke lot seg hente i det hele tatt — det er en observasjon om
nettmiljøet, ikke om spørsmålet, og hører hjemme i `content/AKTUELT-BRIEF.md`.

## Commit

Commit bare de filene du faktisk endret. `post-commit`-hooken pusher automatisk
når committen utelukkende rører `content/questions/*.json` — en kontrollrunde
gjør nettopp det, så en godkjenning går live av seg selv.
