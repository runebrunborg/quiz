# Slik skrives domsetningene

Domsetningen er den ene linja som står under poengsummen på resultatskjermen.
Den skal si noe morsomt om hvordan det gikk, og den skal si det *fra temaets
verden*. Fasitmalen er `content/verdicts/tog.json`.

## Struktur

Én JSON-fil per tema: `content/verdicts/<kategori-id>.json`.

```jsonc
{
  "category": "tog",
  "lines": {
    "0":  [ { "nb": "…", "sv": "…" }, { "nb": "…", "sv": "…" } ],
    "1":  [ … ],
    // … alle poengsummer fra 0 til 10, nøyaktig to varianter hver
    "10": [ … ]
  }
}
```

Alle elleve nøklene `"0"`–`"10"` må finnes, hver med **nøyaktig to** varianter.
Appen trekker den ene av de to, låst til rundens id, så samme runde gir samme
dom hver gang den vises. Validatoren (`npm run content:validate`) stopper bygget
hvis en nøkkel mangler, en variant er tom, de to variantene i samme rute er like,
eller den samme setningen er brukt på to poengsummer i samme tema.

## Absolutte krav

1. **Temaet skal være i setningen.** Ikke som ordet «tog», men som et bilde fra
   togets verden: en stasjon, en tunnel, en konduktør, en tabell som ikke holder.
   Dette er hele poenget – en dom som kunne stått i et hvilket som helst tema er
   feil, uansett hvor morsom den er.
2. **Ingen tall.** Poengsummen står allerede med store bokstaver rett over.
   «Med den scoren» er greit, «fire av ti» er ikke.
3. **Snill hån.** Vi ler av situasjonen, aldri av personen. Ingenting om
   intelligens, utseende, vekt, helse eller religion. Ingen politikk, ingen
   navngitte nålevende personer som gjøres til poeng.
4. **Ingen sensitive emner.** Ulykker, dødsfall, sykdom og nasjonale traumer er
   ikke morsomme. Samme regel som for spørsmålene.
5. **Begge språk.** Svensk er en ekte oversettelse, ikke norsk med svenske ord.
   Er poenget geografisk, skal det flyttes: «andreklasse til Eidsvoll Verk» blir
   ikke morsom på svensk før stasjonen ligger i Sverige.

## Form

* 8–25 ord. Én setning, eller to korte. Den leses på et halvt sekund.
* De to variantene i samme rute skal ha **hver sin vits** – ikke samme poeng med
  andre ord.
* Varier åpningene. Ikke elleve linjer som begynner med «Med den scoren».
* Bruk «…» som anførselstegn, ikke "…". Ingen emoji.

## Stigningen

Skalaen er selvvurdert, ti spørsmål. Tonen skal flytte seg jevnt hele veien:

| Sum | Tone |
|---|---|
| 0 | Total blank. Kjærlig sjokk – ingen får til dette ved et uhell |
| 1 | Ett tilfeldig treff, og begge vet det var flaks |
| 2 | Svakt, men det er liv der inne |
| 3 | Under pari. Man ser konturene av kunnskap |
| 4 | Under forventning. Nesten halvveis, og «nesten» er hele vitsen |
| 5 | Midt på treet. Verken skam eller ære |
| 6 | Litt over streken. Godkjent, ikke mer |
| 7 | Bra. Her sitter det noe ekte |
| 8 | Sterkt. Nå begynner det å bli imponerende |
| 9 | Nesten alt. Det ene som glapp, svir |
| 10 | Alt. Full jubel, gjerne med et hint om at nå må nivået opp |

## Eksempel

Runes egen, for `tog` på 4:

> «Med den scoren kvalifiserer du så vidt til en billett på andreklasse på toget
> til Eidsvoll Verk. God tur.»

Det er nivået: konkret, lokalt, litt tørt, og med et bilde man ser for seg.

## Nye kategorier

Et tema uten `content/verdicts/<id>.json` **stopper bygget**. Lager du en ny
kategori, skriver du domsetningene i samme slengen som spørsmålene.
