# Temascenene — hvordan de skal se ut

Hvert tema har én SVG-scene i `src/themes/scenes.tsx`. Scenen er bakgrunnen på
temakortet på startskjermen og på helten øverst i spillet. Ingen bildefiler,
ingen eksterne ressurser — alt er vektorgrafikk tegnet for hånd i palettens
farger.

**Les denne fila før du tegner en ny scene, og render resultatet før du
committer.** `fot` og `linn` måtte tegnes om etter første render: fotavtrykket
leste som en ballong og linneaklokkene som kirsebær. En scene som bare er
skrevet, ikke sett, er ikke ferdig.

---

## 1. Rammen

```tsx
<Frame id="s-<tema>" sky={['<lys topp>', '<mørk bunn>']}>…</Frame>
```

- `viewBox="0 0 400 260"`, `preserveAspectRatio="xMidYMid slice"`. Alle scener
  deler dette, så de kan strekkes i hvilket som helst format.
- `<Frame>` legger himmelgradienten selv. Du tegner bare det som står i den.
- `id` må være unik og prefikses `s-`. Den brukes i `<defs>`, og to like id-er
  gir grafikk som lekker mellom kort.

## 2. Det synlige feltet

`slice` betyr at scenen **beskjæres**, ikke skaleres ned. På et temakort
(≈300×172) forsvinner topp og bunn: bare `y` mellom omtrent **15 og 245** vises,
og på spillskjermen er båndet enda smalere.

Derfor:

| Sone | `y` | Regel |
|---|---|---|
| Beskåret | 0–30 og 230–260 | Bare bakgrunn, bånd og flater. Aldri noe motivet trenger |
| **Motivfeltet** | **40–200** | Her skal temaet leses. Hovedmotivet skal ligge helt innenfor |
| Tittelsonen | 185–245, `x` 0–190 | Kortets tittel står her. Ingen fin detalj, ingen høy kontrast |

Bredden beskjæres ikke, men et element som starter i `x = 0` og slutter i
`x = 330` etterlater et synlig tomrom til høyre. Alt som skal gå fra kant til
kant må dekke **−10 til 410**.

Den vanligste feilen er at motivet står for lavt. `vikinger` hadde et helt
langskip der bare seilet var over beskjæringen, og kortet leste som et flagg på
en stang.

## 3. Kontrast

Kortet legger et mørkt slør (`.cat-card__veil`) over scenen, kraftigst nederst.
En silhuett i nesten samme valør som himmelen forsvinner helt.

- **Hovedmotivet skal ha minst ett trinn valørforskjell mot himmelen bak.**
  Er himmelen mørk, skal motivet være lysere — ikke mørkere.
- Bakgrunnssilhuetter (fjell, byer, skog) *skal* være mørke, men da må noe
  lysere ligge foran: vinduer, snø, en måne, en lyskilde.
- Test i praksis: skru sløret på og se om du kjenner igjen temaet på en armlengdes
  avstand. `tog` og `natt` gjorde det ikke før de ble lysnet.

## 4. Paletten

Fargene kommer fra appens egen palett. Hold deg til dem — en scene i fremmede
farger river seg løs fra resten.

| Rolle | Farge |
|---|---|
| Aksent, alltid til stede | `#FF2D8E` hotpink, `#FF5FA8`, `#FF6FB5` |
| Lys rosa / hvitt | `#FFC2DF`, `#FFE3F1`, `#F7F3FA` |
| Gull og varme | `#F5C242`, `#FFC94D`, `#FFD54A`, `#FF7A3D` |
| Kaldt | `#3AD6E0` cyan, `#8FA8FF`, `#7FB2FF` |
| Fiolett | `#8E44D8`, `#6D4ECF` |

Regler:

- **Hotpink skal være med i hver scene**, om så bare i en måne eller en glød.
  Det er det som binder de 33 sammen.
- Himmelgradienten går fra en mettet farge øverst til nesten svart nederst.
  Bunnfargen skal ligge nær `#0A0E28`-familien, ellers blir kortet lyst under
  tittelen.
- Maks tre-fire fargefamilier per scene. Fire flater i samme valør leser som rot.

## 5. Komposisjonen

Oppskriften de beste scenene deler:

1. **Ett hovedmotiv**, sentrert eller lett forskjøvet, i motivfeltet. Ett — ikke
   en samling gjenstander. `nobel`, `borg`, `tid`, `brun` og `ball` fungerer
   fordi de er ett tegn.
2. **En himmelkropp** øverst til høyre — måne, sol, planet — som runding mot
   motivets form. Vanligvis `cx` 290–330, `cy` 44–70, `r` 22–40, ofte hotpink
   med `opacity` 0.4–0.7.
3. **Et bunnbånd** som lukker scenen: horisont, bakke, bølger, gulv. Det gir
   tittelen noe rolig å stå på.
4. **Noen få små elementer** som fyller tomrommet — stjerner, gnister, blader.
   Aldri i tittelsonen.

Vær konkret. Temaet skal kjennes igjen uten teksten: en borg, ikke «noe
middelaldersk». Er du i tvil om motivet leses, er svaret å gjøre det større,
ikke å legge til et element til.

## 6. Bevegelsen

Hver scene har **nøyaktig én** bevegelse. Ikke to. Poenget er at kortene skal
puste, ikke blinke — logoens fargesyklus måtte ned fra 16 til 48 sekunder før
den sluttet å lese som en animasjon, og samme terskel gjelder her.

Bevegelsen ligger i `src/styles/scenes.css` som fire klasser. Scenen setter
klassen på en `<g>` og eventuelt varighet og pivot i `style`; selve timingen og
kurvene bor ett sted.

| Klasse | Hva | Varighet | Passer |
|---|---|---|---|
| `sc-svai` | Glir noen få piksler sidelengs, fram og tilbake | 16–28 s | Bølger, hengende ting, seil, røyk |
| `sc-pust` | Opasitet og en anelse skala som ånder | 8–14 s | Lyskilder, glød, flammer, hjerte |
| `sc-spinn` | Svært langsom rotasjon | 90–200 s | Stråler, hjul, ringer, stjernehimmel |
| `sc-glo` | Bare opasitet | 20–40 s | Stjerner, gnister, fjerne detaljer |

Kravene:

- **Bare `transform` og `opacity`.** Aldri `cx`, `cy`, `r`, `d` eller `width` —
  de tvinger fram ny layout for hver frame, og 33 kort ligger på skjermen
  samtidig.
- **Bevegelsen må ikke avdekke kanten.** `sc-svai` flytter et element noen få
  piksler; et element som starter i `x = 0` må derfor forlenges forbi kanten
  først. Prøv aldri å dra et element helt over skjermen.
- **Klassen hører hjemme på en wrapper-`<g>`**, aldri på et element som
  allerede har `opacity`. CSS slår presentasjonsattributtet, så en `opacity="0.5"`
  du animerer direkte blir overkjørt. Legger du den utenpå, ganges de i stedet,
  og scenens egen valør holder seg.
- **Sett pivoten selv** når du roterer noe som ikke ligger midt i ruta:
  `style={{ transformOrigin: '200px 128px' }}`. Standarden er midten av
  `viewBox`, altså `200px 130px`.
- **Ulik varighet fra nabotemaene.** Bruk primtallsnære tall (13 s, 19 s, 23 s)
  så to kort ved siden av hverandre ikke går i takt.
- `prefers-reduced-motion` slår alt av. Det ligger allerede i `scenes.css` —
  du trenger ikke gjøre noe, men ikke skriv animasjon utenom klassene, for da
  gjelder ikke bryteren.

## 7. Sjekklista før commit

- [ ] Hovedmotivet ligger innenfor `y` 40–200
- [ ] Ingen fin detalj i tittelsonen (`x` 0–190, `y` 185–245)
- [ ] Alt som skal nå kant til kant dekker `x` −10 til 410
- [ ] Motivet er lysere enn himmelen bak, eller har noe lyst foran seg
- [ ] Hotpink er med
- [ ] Unik `id` med `s-`-prefiks
- [ ] Nøyaktig én bevegelsesklasse, med varighet ulik nabotemaene
- [ ] Rendret og sett på — kjenner du igjen temaet uten teksten?

`npm run scenes:sheet` skriver `sheet.html` — alle 33 scenene som temakort, med
tittel og slør, slik de faktisk ser ut. Åpne den i nettleseren: der går
animasjonene også, så du ser både komposisjonen og bevegelsen. Det er den
raskeste måten å gjøre det siste punktet på.
