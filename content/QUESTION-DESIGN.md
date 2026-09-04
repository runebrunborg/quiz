# Spørsmålsdoktrine — hvordan en 10-er settes sammen

`SPEC.md` er kontrakten: felter, form, absolutte krav. **Den gjelder alltid, og
overstyrer denne fila ved uenighet.** Dette dokumentet er den redaksjonelle metoden bak
et sett på ti spørsmål: hvordan et tema velges, hvordan de ti henger sammen, og hvordan
vanskelighetsgraden kalibreres. Les `SPEC.md` først, deretter denne, og bruk
`content/questions/blaa.json` som formmal.

Målestokken er Aftenpostens quiz — særlig kategoriene *Spill, Foss, Drømmer, Stillhet* og
*Blomster i kulturen*.

---

## 1. Ankerordet, ikke fagfeltet

En 10-er er ikke «ti spørsmål om musikk». Den er **ti spørsmål som alle henger på ett
ord**, hentet fra ti forskjellige verdener. Ankerordet er limet; spredningen er poenget.
Fotballfansen tar tre, litteraturviteren tar tre, og alle får noen.

Gode ankerord er korte og hverdagslige: *Storm, Salt, Hjerte, Foss, Bro, Gull, Stillhet*.
Tommelfingerregelen er at ordet både skal finnes som ting, som etternavn og i minst én
kjent tittel. Sjekk også at det har nok **norsk og svensk** materiale — det er der de
fleste ankerord ryker.

## 2. De sju koblingstypene

| # | Kobling | Eksempel |
|---|---|---|
| K1 | **Bokstavelig** — svaret *er* en instans av ankerordet | «Hvilken foss ligger i Måbødalen?» |
| K2 | **Definisjon** — ankerordet forklares, svaret er ordet eller tingen | «Brettspillet med et navn som betyr enerett» |
| K3 | **Egennavn** — ordet er etternavn, stedsnavn eller arenanavn | Per-Kristian Foss, Fosshaugane, Saltdal |
| K4 | **Tittel** — ordet står i en sang-, film-, bok- eller programtittel | «Stormfulle høyder», «Heart of Glass» |
| K5 | **Oversettelse** — ordet på et annet språk, eller originaltittelen | «Stille Nacht», Ørkenstorm, stormtropper |
| K6 | **Produkt / merkevare** — ordet i et varenavn eller en logo | Dreamcast, Stormberg, Malaco |
| K7 | **Idiom / fagbegrep** — ordet inngår i et uttrykk eller fagord | «storm i et vannglass», spillteori, SALT |
| K8 | **Assosiasjon** — ankerordet står bare i premisset, svaret ligger et helt annet sted | «Salt var en gang så verdifullt at det ble brukt som betaling. Hvilket metall er dyrest i dag?» |

K3 og K4 gir «aha». K1 og K2 gjør at folk får noen riktige.

**Kvoter per 10-er:** minst 3 bokstavelige (K1/K2), minst 2 av K3/K4, minst 2 assosiasjoner
(K8), maks 3 av samme type, og minst 5 av de åtte typene representert.

### Den absolutte regelen: svaret er aldri ankerordet

Et svar som *er* temaordet har null kobling — spørsmålet besvarer seg selv i det øyeblikket
spilleren leser kategorien. «Hvilket krydder tas en klype av?» under temaet *Salt* er ikke et
spørsmål, det er en overskrift.

Regelen gjelder ordet i alle språkdrakter og bøyninger. Å oversette det er ikke å komme langt
nok unna: under *Sjokolade* er verken «Chocolate», «Chocolat» eller «choklad» et gyldig svar,
og under *Broer* er «Bridge» det heller ikke — heller ikke som navn på et kortspill eller en
TV-serie. Det samme gjelder ankerordet med bare et generisk tillegg foran: «Hvit sjokolade»
som svar på «hva slags sjokolade er dette?» er den samme tautologien i forkledning.

**Sammensetninger og egennavn er derimot helt greit** — de navngir noe bestemt og bærer et
faktum: Saltstraumen, Blåhval, Golden Gate-broen, Stormberg, løytnantshjerte, Vinter-OL.
Grensen går mellom *ordet selv* og *noe som heter noe med ordet*.

`node scripts/validate-content.mjs` håndhever dette. Lista over forbudte former står i
`ANCHORS` øverst i validatoren, og må utvides når et nytt tema legges til.

### Den andre absolutte regelen: svaret skal ikke kunne settes sammen av teksten

Beslektet, men egen feil: svaret står ikke i teksten, men *kan bygges av den*. Innledningen
nevner et egennavn, spørsmålet oppgir tingens art, og spilleren limer dem sammen uten å vite
noe som helst.

> «Da denne banen mellom Lillestrøm og **Kongsvinger** åpnet i 1862 … Hvilken **bane**?»
> → Kongsvingerbanen

Egennavnet i teksten pluss det generiske ordet i spørsmålet *er* svaret. Ingen kunnskap ble
prøvd. Samme feil: «forbi Uddevalla … Hvilken bro?», «over Sognefjellet … Hva heter veien?»,
«utenfor Kristiansand … Hva heter parken?», «en fryktet kvinneskikkelse, Lussi … Hva heter
natten?».

**Fiksen er nesten alltid å omskrive innledningen, ikke å kaste spørsmålet.** Erstatt
egennavnet med en beskrivelse som gir like god kontekst uten å røpe leddet:

| Før | Etter |
|---|---|
| mellom Lillestrøm og Kongsvinger | østover fra Lillestrøm |
| som del av en ny E6-trasé forbi Uddevalla | … forbi en by i Bohuslän |
| fører til øya Djurgården | fører til øya der Skansen og Vasamuseet ligger |
| Denne veien over Sognefjellet | Denne veien mellom Lom og Luster |

Legg merke til at erstatningen ofte gjør spørsmålet *bedre*: «øya der Skansen og Vasamuseet
ligger» er et hint som krever gjenkjennelse, mens «Djurgården» bare var et gratis ledd.

Det motsatte er helt greit: at teksten sier «bane» og svaret slutter på «-banen». Spørsmålet
*må* fortelle hva slags ting det spør etter. Grensen går ved det særegne leddet.

`node scripts/validate-content.mjs` fanger det tydeligste tilfellet — egennavn fra teksten
pluss et generisk haleledd fra `GENERIC_TAILS`. Lista er kort med vilje, så den ikke slår ut
på legitime sammensetninger; den fanger mønsteret, ikke hver eneste variant. Øynene dine er
fortsatt siste instans.

### Assosiasjonsavstand

Det beste spørsmålet i en 10-er er ofte det som forlater ankerordet helt. Ankerordet setter
scenen i innledningen, og så peker spørsmålet et annet sted:

> «Salt var en gang så verdifullt at romerske soldater fikk deler av lønnen i det. Hvilket
> metall koster i dag mest per gram, og brukes mest i katalysatorer i biler?» → rodium

Ankerordet er tydelig til stede — spilleren ser hvorfor spørsmålet hører hjemme i *Salt* — men
svaret ligger i et helt annet fagfelt. Det er dette som gjør at en 10-er dekker ti verdener i
stedet for ti varianter av samme oppslagsord.

Tre måter å finne avstanden på:

- **Egenskapen, ikke tingen.** Salt konserverer → hva erstattet salting? Kjøleskapet.
- **Sammenligningen.** Salt var dyrt → hva er dyrt nå? Rodium, safran, vanilje.
- **Konsekvensen.** Kakao er giftig for hunder → hvilket stoff? Teobromin.

Bruk K8 minst to ganger per 10-er. En 10-er uten dem blir et oppslagsverk om ett ord.

## 3. Bredde

Emne-taggene er `TOPICS` i `shared/types.ts`, 1–3 per spørsmål (se `SPEC.md`). Ut over
SPEC-kravet om minst åtte ulike tags per tema gjelder denne regelen per 10-er:

> Minst **seks ulike hovedtags** innenfor de ti spørsmålene, og ingen tag på mer enn
> **to** av dem.

Sjekk mot Aftenpostens «Spill»: sju av ti spørsmål lå i samme domene. Det er yttergrensen
deres. «Foss» er forbildet – politikk, fornøyelsespark, geografi, sport, litteratur,
natur, film og geografi utenfor Norden på ti spørsmål.

**Regionmiksen følger `SPEC.md`**: 4–6 `int`, 2–3 `no`, 2–3 `se` per nivå i grunnsettet,
og 4 `no`, 4 `se`, 2 `int` i påfyllsfilene. Denne fila legger ingenting til der.

**Tidsspenn:** minst ett spørsmål fra før 1950, minst ett fra de siste ti årene, og ikke
mer enn fire fra samme tiår.

**Plassering:** spørsmål 1 er det letteste — alle skal få det. Spørsmål 10 er det
vanskeligste, og helst det med best «aha».

## 4. Vanskelighetsgrad

### Grunnregelen

**Vanskeligheten skal ligge i å finne svaret, ikke i å vite det.**

Spilleren skal tenke «det burde jeg visst» når fasiten kommer — aldri «det har jeg aldri
hørt om». Nivåene skiller seg i hvor langt unna svaret ligger, ikke i hvor smalt det er.

### Kjenthetsgulvet — gjelder alle tre nivåer

Hvert svar må oppfylle minst ett av disse:

- står i vanlig skolepensum
- er en person eller et verk de fleste over 30 kjenner navnet på
- er en merkevare man finner i en nordisk dagligvarebutikk eller kiosk
- har vært på hitlistene, kinotoppen eller riksdekkende TV
- forekommer i et vanlig uttrykk, en kjent sang, film eller bok

Passer ingen av dem, er svaret for smalt. Da bytter du spørsmål — ikke nivå.

### Skalaen

Gi hvert spørsmål en verdi 1–4 under arbeidet (verdien lagres ikke i JSON, den er et
redaksjonelt hjelpemiddel):

1 = nesten alle · 2 = de fleste · 3 = omtrent halvparten · 4 = den som følger godt med

En femmer — ekspertspørsmålet — er ikke et nivå, det er en feil. Skriv det om eller kast det.

| Nivå | Målsnitt (± 0,3) | Maks per spørsmål | Forventet treff |
|---|---|---|---|
| lett | 1,8 | 3 | 70–80 % |
| medium | 2,5 | 4, maks ett stk | 55–65 % |
| vanskelig | 3,1 | 4, maks tre stk | 40–50 % |

Også «vanskelig» skal ha to enkle spørsmål. En 10-er der alt er like tungt er kjedelig
uansett hvor flink spilleren er.

### Fire grep som gjør et spørsmål lettere uten å gjøre det kjedeligere

1. **Gi et holdepunkt i innledningen.** «Den walisiske sangeren med hes stemme …» i stedet
   for «Hvilken sanger …». Innledningen på 25–55 ord som `SPEC.md` krever, er selve
   verktøyet for dette — bruk den til å gi kontekst, ikke bare pynt.
2. **Spør etter det kjenteste eksemplet, ikke det nest kjenteste.**
3. **Bruk gjenkjenning framfor gjenkalling.** Et sitat, en tittel eller en replikk gir
   spilleren noe å henge svaret på.
4. **Flytt vanskeligheten til koblingen.** Et lett faktum med skjult ordkobling er
   morsommere enn et vanskelig faktum med åpenbar kobling.

### Hva som ikke er lov

- Svar som er et tall — antall, rangering, høyde, lengde, prosent. Årstall er unntaket,
  og bare i årstallspørsmålet.
- Personer som bare er kjent innenfor ett fagfelt.
- Verk som aldri er utgitt, vist eller spilt i Norden.
- Spørsmål som krever at man husker to ledd samtidig.
- Mer enn ett fremmedspråklig svar per 10-er.

### Nivåforskjellen i praksis — samme ankerord, tre nivåer

| Nivå | Svaret | Verdi |
|---|---|---|
| lett | Dødehavet | 1 |
| medium | Salten | 2 |
| vanskelig | Saltdal | 3 |

Samme kunnskapsområde, samme koblingstype — bare lenger ut i kjentheten for hvert nivå.

## 5. Årstallspørsmålet

En liste med 8–9 hendelser fra samme år; svaret er årstallet. Formen bruker den vanlige
strukturen i `SPEC.md`: hendelsene utgjør innledningen, og «Hvilket år?» står til slutt.
Svaret er fire siffer, `answerKind` er `annet`, og emne-taggen er `historie`.

### Når skal 10-eren ha et?

Trekk det. Når arbeidet med en ny 10-er begynner, kjør en tilfeldig verdi i [0, 1):

> `Math.random() < 0.33` → 10-eren skal ha et årstallspørsmål.

Trekningen gjøres **én gang, før spørsmålene skrives** — ikke etterpå, og ikke på nytt
hvis utfallet ikke passet. Noter verdien i arbeidsnotatet, så den ikke trekkes om ved
redigering. Fordelingen blir ujevn med vilje: en runde på ni 10-ere kan fint gi fem.
Det er poenget — spilleren skal ikke kunne regne seg fram til når det kommer.

### Oppskrift

- **8–9 hendelser**, én per domene, i denne rekkefølgen: vitenskap eller romfart ·
  internasjonal politikk · samfunn · teknologi- eller produktlansering · stor nyhet ·
  norsk eller svensk hendelse · kulturutgivelse · en fødsel · et dødsfall.
- **Minst tre allment kjente hendelser.** Dette er hovedgrepet som gjør spørsmålet lettere.
- **To låsehendelser** som alene daterer året for den som kjenner dem.
- **Ingen hendelse med ±1 års usikkerhet.** Lanseringer, valg, premierer, dødsfall — ikke
  trender. «Gmail lanseres», ikke «Facebook blir populært».
- **Fødselen daterer bakover.** «Kylian Mbappé fødes» får folk til å regne.
- **Årsvindu:** 1985–2020 på lett og medium, 1960–2020 på vanskelig.
- **Ett kort ledd per hendelse**, presens, ingen forklaringer.
- **Pass på at årstallet ikke lekker** inn i teksten — «supernovaen SN 1987A» røper svaret,
  og validatoren fanger det.
- **Hint 1 er tiåret**; hint 2 kan være en ekstra pekepinn. Bokstavhint gir ingen mening.
- Hendelsene skal helst ha **minst én kobling til temaets ankerord**, men et rent
  årstallspørsmål er bedre enn en påklistret kobling.

## 6. Sjekkliste før en 10-er leveres

- [ ] Alle ti henger på ankerordet, og koblingen er synlig i ettertid
- [ ] Minst 5 koblingstyper, maks 3 av samme, minst 2 assosiasjoner (K8)
- [ ] Ingen svar er ankerordet selv – heller ikke oversatt eller bøyd
- [ ] Ingen svar kan settes sammen av et egennavn i innledningen pluss ordet spørsmålet oppgir
- [ ] Minst 6 hovedtags, maks 2 per tag
- [ ] Regionmiksen følger `SPEC.md`
- [ ] Ett spørsmål fra før 1950, ett fra de siste ti årene, maks 4 fra samme tiår
- [ ] Hvert svar består kjenthetsgulvet
- [ ] Målsnittet for nivået er truffet innenfor ± 0,3
- [ ] Spørsmål 1 er lettest, spørsmål 10 har best «aha»
- [ ] Ingen tallsvar utenom årstallspørsmålet
- [ ] Trekningen for årstallspørsmål er gjort før skriving, og utfallet er fulgt
- [ ] Svarene er unike innenfor temaet, og står ikke i spørsmålsteksten
- [ ] Den svenske versjonen er ekte svensk, ikke norsk med svenske ord
- [ ] `node scripts/validate-content.mjs` gir 0 feil og 0 advarsler

## 7. Anti-mønstre

- **Leksikon-10-eren.** Ti bokstavelige spørsmål om samme fenomen. Kjedelig fra spørsmål 4.
- **Navneleken.** Ti etternavn. Ingen kommer inn i den.
- **Skjult ekspertise.** Tre spørsmål som krever samme spesialkunnskap — da er 10-eren
  egentlig fem spørsmål lang for alle andre.
- **Selvbesvarende spørsmål.** Tittelen står i innledningen og er samtidig svaret.
- **Ankerordet som svar.** Se den absolutte regelen i punkt 2. Oversettelse teller ikke som avstand.
- **Limspørsmålet.** Egennavnet står i innledningen, tingens art i spørsmålet, og svaret er summen.
- **Oppslagsverket.** Ti spørsmål der ankerordet er selve saken, og ingen av dem tar deg ut av det.
- **Ferskvare.** «Hvem leder …» — se punkt 5 i `SPEC.md`.
- **Gjettbart årstall.** Én kjempekjent hendelse gir svaret, de åtte andre er pynt.
- **Doble ankre.** Spørsmål som egentlig hører hjemme i et annet tema.

---

## Vedlegg — dekonstruksjon av Aftenpostens «Spill»

| # | Kobling | Domene |
|---|---|---|
| 1 | K2 definisjon | spill |
| 2 | K3 etternavn | fotball |
| 3 | K1 bokstavelig | spill |
| 4 | K1 bokstavelig | spill |
| 5 | K4 tittel | tv |
| 6 | K1 bokstavelig | spill |
| 7 | K2 definisjon | spill |
| 8 | K7 fagbegrep | spill |
| 9 | K5 oversettelse | spill |
| 10 | K7 fagbegrep | vitenskap |

Styrken er koblingsmiksen: seks av sju typer i bruk, og en avslutning som ligger langt fra
brettspillene den åpner med. Svakheten er domenefordelingen — sju av ti i samme domene.
Det er nettopp den svakheten regelen i punkt 3 finnes for å hindre.

## Dagsaktuelle spørsmål

To av de ti plassene er satt av til noe fra det siste året. Doktrinen gjelder
uendret: **ankerordet, ikke nyhetsbildet**. Et dagsaktuelt spørsmål i temaet
*Månen* skal handle om månen og være ferskt — ikke være en generell nyhetssak med
ordet «måne» limt på.

Koblingstypene og breddekravene regnes på de åtte ordinære spørsmålene. De to
dagsaktuelle er utenfor regnskapet, av samme grunn som årstallspørsmålet er det:
de har sin egen jobb.

Vanskeligheten ligger et annet sted her. Kjenthetsgulvet kan ikke være «står i
skolepensum» for noe som skjedde i mars. Erstatningen er: **hendelsen skal ha
vært på forsiden**, ikke bare i en fagseksjon. En som leser nyhetene ukentlig
skal kjenne den igjen. Er svaret noe bare den som følger feltet tett vet, hører
det på `vanskelig` — eller ingen steder.

Utløpsdato og `evergreen` står i SPEC. Det redaksjonelle spørsmålet bak
`evergreen` er verdt å stille høyt: *hadde jeg stilt dette spørsmålet om tre år?*
Svaret er ja for tronskifter, mesterskap og oppdagelser, og nei for alt som er
interessant bare fordi det er nytt.

## «På denne dag»

Varianten er en gave til den som spiller på riktig dag, ikke en ny sjanger. Den
skal gjøre nøyaktig én ting: flytte innledningen fra «en gang i historien» til
«i dag, for N år siden». Spørsmålsdelen kan omformuleres for å henge sammen med
den nye innledningen, men **aha-en skal være den samme**.

Egnede datoer er de som er presise og uomstridte: fødsler og dødsfall, åpninger,
førstegangsframføringer, landinger, utbrudd. Uegnet er alt som «skjedde i løpet
av» en dag eller en uke.

Fella er at datoen røper svaret. «På denne dagen i 1969 landet Apollo 11» er
ikke et spørsmål lenger. Skriv i stedet rundt datoen: hva som skjedde, uten å
navngi det som skal gjettes.

Ikke sett datovarianter på for mange spørsmål i samme tema. Ett treff per dato er
alt appen bruker, og et tema der halvparten av spørsmålene har datovariant vil
ligge først på startskjermen nesten hver dag — og da betyr «I dag»-merket
ingenting.
