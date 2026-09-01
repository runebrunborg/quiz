# Brief: dagsaktuelle spørsmål og «på denne dag»

Arbeidsnotat for den som fyller `content/questions/<kategori>-aktuelt.json`.
Kontrakten står i `SPEC.md` (kapitlene «Dagsaktuelle spørsmål» og «På denne
dag»), metoden i `QUESTION-DESIGN.md`. Dette notatet er bare kildesituasjonen og
hendelsesbildet, oppdatert **1. september 2026**.

## Kilder som svarer herfra

Testet 1. september 2026. Nettmiljøet er strammere enn en vanlig nettleser.

| Kilde | Status | Til hva |
|---|---|---|
| `snl.no` | virker | oppslag og bakgrunn, oppdateres raskt ved store hendelser |
| `en.wikipedia.org` | virker på artikler | hendelser med egen artikkel. **NB: kan ligge uker etter** |
| `vg.no` | virker (forside + seksjonsforsider) | norske nyheter, siste døgn |
| `e24.no` | virker | norsk økonomi og næringsliv |
| `forskning.no` | virker | norsk forskningsformidling |
| `svt.se` | virker | svenske nyheter |
| `aljazeera.com` | virker | internasjonale nyheter |
| `nrk.no`, `aftenposten.no`, `tv2.no`, `dn.se`, `svd.se`, `reuters.com`, `bbc.com`, `theguardian.com`, `apnews.com`, `aftonbladet.se` | **403** | – |
| `no.wikipedia.org`, `sv.wikipedia.org`, `wikidata`, `runeberg.org` | cache-only / sperret | – |
| `WebSearch` | **403** | – |

To feller er verdt å kjenne:

* **Wikipedia er ikke fersk her.** Artikkelen om Harald 5 sto fortsatt i presens
  fire dager etter at han døde. For alt fra de siste ukene: sjekk mot `vg.no`,
  `svt.se`, `e24.no` eller `snl.no`, ikke mot Wikipedia alene.
* **`tv2.no` svarer med gammelt innhold** – forsiden kom tilbake med saker fra
  2016. Ikke bruk den.

## Verifiserte hendelser å bygge på

Hentet og kontrollert 1. september 2026. Detaljer *skal likevel* sjekkes på nytt
mot kilden før de havner i et spørsmål – lista er leads, ikke fasit.

**Kongehuset.** Harald 5 døde i Oslo 28. august 2026. Sønnen overtok tronen som
kong Haakon 8. Ingrid Alexandra er ny kronprinsesse. Båren ble ført til
Slottskapellet 31. august. *(snl.no/Harald_5; vg.no 31.08.2026)*

**Vinter-OL i Milano og Cortina d'Ampezzo, 6.–22. februar 2026.** Norge toppet
medaljestatistikken for fjerde vinter-OL på rad med 18 gull og 41 medaljer –
rekord for ett enkelt vinter-OL. Maskotene Tina og Milo er røyskatter.
Skialpinisme var ny olympisk gren. To OL-ilder ble tent samtidig, i Milano og i
Cortina, for første gang. Brasil tok sin første vintermedalje og sitt første
vintergull. Første leker under IOC-president Kirsty Coventry. *(en.wikipedia.org)*

**Artemis II, oppskutt 1. april 2026.** Ni døgns bemannet ferd rundt månen med
Reid Wiseman, Victor Glover, Christina Koch og Jeremy Hansen. Ny avstandsrekord
for mennesker: 406 771 km fra jorden. Første kvinne, første ikke-hvite og første
ikke-amerikaner rundt månen. Første bemannede ferd utenfor lav jordbane siden
Apollo 17 i 1972. *(en.wikipedia.org)*

**Total solformørkelse 12. august 2026** over Arktis, Grønland, Island, Atlanteren
og Nord-Spania. Første totale solformørkelse på Island siden 1954 og den eneste
på Island i dette århundret; Spanias første siden 1905. *(en.wikipedia.org)*

**«Sentimental Value» vant Oscar for beste internasjonale film 15. mars 2026** –
Norges første Oscar i den klassen. *(en.wikipedia.org, 2026 in Norway)*

**Nobels fredspris 2025** gikk til María Corina Machado fra Venezuela, kunngjort
10. oktober 2025. **Nobelprisen i litteratur 2025** gikk til ungareren László
Krasznahorkai. *(en.wikipedia.org)*

**Fotball-VM 2026, 11. juni – 19. juli**, i Canada, Mexico og USA, med 48 lag for
første gang og finale på MetLife Stadium. **Vinneren er ikke bekreftet i noen
kilde som lar seg hente herfra – ikke skriv et spørsmål om hvem som vant uten å
ha sett det bekreftet.**

**Eurovision 2026 i Wien, 12.–16. mai.** Wikipedia oppgir at Bulgaria vant med
«Bangaranga» av Dara. **Ikke bekreftet i en annen kilde** – kontroller før bruk.

Andre spor fra året som ikke er kontrollert i detalj: Bulgaria innførte euro 1.
januar 2026, Shein børsnoterte seg i Hongkong, De forente arabiske emirater
forlot OPEC, EM i håndball for menn ble spilt i Danmark, Norge og Sverige i
januar, og flomkatastrofen i Himalaya i slutten av august 2026.

## Hva som IKKE skal brukes

Året har flere store nyhetssaker som faller på tone- og personvernkravene i
SPEC. Kriminalsaker mot navngitte personer, sykdom og dødsfall som ikke utløser
et historisk skifte, krig og katastrofer med mange omkomne: hold dem utenfor.
Kongens død er tatt med fordi den utløste et tronskifte, og spørsmålet rettes mot
skiftet – ikke mot dødsfallet.

## Arbeidsgang

1. Finn hendelser fra siste år som ankerordet ditt faktisk bærer. Klarer du bare
   én, lever én. Klarer du ingen, lever ingen og si fra.
2. Kontroller hvert faktum mot en kilde som lar seg hente, og skriv kilden med
   dato i `source`.
3. Legg på `topical` med `event`, `until` og en bevisst `evergreen`.
4. `node scripts/validate-content.mjs` skal si `0 feil`.
