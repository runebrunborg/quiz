# Datokalenderen — prosedyre for «på denne dag» og for nye kategorier

`SPEC.md` er kontrakten for hvordan en `onThisDay`-variant skal se ut. Denne fila er
*framgangsmåten*: hvordan man finner datoene, hvordan man vet om banken kan bære dem, og
hvordan dagene banken **ikke** kan bære blir til kategoriforslag.

Kjøres i to former:

- **Hver skriverunde** – minst én variant på en tom dato. Se del B5 i rutineprompten.
- **En oppsamlingsrunde** – et helt vindu på tretti dager om gangen, slik 14. september –
  13. oktober ble gjort 13. september 2026.

---

## Mekanikken som styrer alt

En `onThisDay`-variant **bytter bare ut spørsmålsteksten**. Svar, hint og fun fact står
uendret.

Derfor kan en variant bare legges på et spørsmål som **allerede finnes**, og hvis **svar**
hendelsen henger på. Du skriver ikke et nytt spørsmål om Agatha Christie den 15. september;
du finner et spørsmål i banken hvis svar er Christie-nært — det var `Hercule Poirot` i
`tog-l-03` — og skriver om innledningen.

To følger av dette:

1. **Matchingen mot banken kommer før skrivingen.** Ellers researcher du datoer du ikke kan
   bruke.
2. **En dato der banken ikke har noe svar, er et hull i banken** — ikke i kalenderen. Det er
   nettopp det som gjør hulldagene verdifulle: de er den skarpeste lista over hva banken
   mangler, og derfor kildene til nye kategorier.

---

## Steg 1 — Finn de tomme datoene

```
cd "$HOME/mnt/quiz" && python3 -c "
import json,glob,collections
from datetime import date,timedelta
have=collections.defaultdict(list)
for p in glob.glob('content/questions/*.json'):
    for q in json.load(open(p,encoding='utf-8')):
        for v in q.get('onThisDay') or []: have[v['day']].append(q['category'].split('-')[0])
s=date.today()
d=[(s+timedelta(days=i)).strftime('%m-%d') for i in range(30)]
print('DEKKET:'); [print('  ',k,sorted(set(have[k]))) for k in d if k in have]
print('TOMME (%d):' % len([k for k in d if k not in have]), ', '.join(k for k in d if k not in have))
"
```

En dato som alt er dekket av ett tema kan gjerne få en variant til i et *annet* tema —
regelen er én variant per dato per tema, ikke per bank. Men prioriter de helt tomme: det er
de som avgjør om «I dag»-merket i det hele tatt dukker opp på startskjermen.

## Steg 2 — Research per dato

To hendelser per dato er måltallet. Krav til en kandidat:

1. **Datoen er presis og ukontroversiell.** Spriker to kilder på dagen, forkastes den.
2. **Kandidaten navngir det som ville vært svaret** — «Agatha Christie», ikke «en forfatter».
3. **Kjenthetsgulvet fra `QUESTION-DESIGN.md` gjelder.** Smale fagpersoner og verk som aldri
   er utgitt i Norden er ubrukelige.
4. **Tonen fra `SPEC.md` gjelder, og strengere.** Krig, katastrofer med mange omkomne og
   enkeltmenneskers død som tragedie brukes ikke. Et dødsfall kan brukes når det markerer et
   skifte — et tronskifte, en etterfølger, en posthum pris — og da rettes innledningen mot
   skiftet eller verket, aldri mot dødsfallet.
5. **Minst to nordiske kandidater per dato** hvis de finnes.

Kilder, i rekkefølge:

- `britannica.com/on-this-day/<Maaned>-<dag>` — den mest produktive adressen. Den bærer
  eksakt dato der emneartikkelen bare har årstall.
- `en.wikipedia.org/wiki/<Month>_<day>` — god inngang, men en inngang. Verifiser videre.
- Deretter opp eskaleringsstigen i `SPEC.md`: SNL-familien, `lex.dk`, `skbl.se`,
  Britannicas emneartikkel, `nobelprize.org`, institusjonen selv.

Dette steget parallelliseres godt: fem underagenter med fem–seks datoer hver dekket tretti
dager på under ti minutter 13. september.

## Steg 3 — Match mot svarene i banken, **før** du skriver

Normaliser svarene — små bokstaver, uten diakritiske tegn, uten tegnsetting — og slå opp
hver kandidat. Gjør **to** søk:

- **Eksakt match** på hele svaret.
- **Delstreng.** Det er dette som finner de gode koblingene: Poirot fra Christie,
  «Nattevakten» fra Rembrandt, München fra oktoberfesten, Normandie fra Vilhelm Erobreren,
  Stavanger fra sluppen «Restauration».

Skriptet under skriver ut treff, hvilket spørsmål de sitter i, og om temaet alt har den
datoen:

```
cd "$HOME/mnt/quiz" && python3 -c "
import json,glob,unicodedata,collections,sys
def norm(s):
    s=unicodedata.normalize('NFD',s.lower()); s=''.join(c for c in s if unicodedata.category(c)!='Mn')
    return ''.join(c for c in s if c.isalnum() or c==' ').strip()
rows=[]; days=collections.defaultdict(set)
for p in sorted(glob.glob('content/questions/*.json')):
    for q in json.load(open(p,encoding='utf-8')):
        a=q['answer']; a=a if isinstance(a,str) else a['nb']
        rows.append((norm(a),a,q['id'],q['category'],q['difficulty']))
        for v in q.get('onThisDay') or []: days[q['category'].split('-')[0]].add(v['day'])
for line in sys.stdin.read().strip().split(chr(10)):
    day,t=line.split('|'); nt=norm(t)
    hits=[r for r in rows if nt in r[0]]
    if not hits: print(f'{day} ~{t:26} | INGEN'); continue
    for _,a,qid,cat,diff in hits[:4]:
        base=cat.split('-')[0]
        print(f'{day} ~{t:26} | {a:28} {qid:16} {diff:10} | {\"OPPTATT\" if day in days[base] else \"LEDIG\"}')
" <<'EOF'
10-06|Heyerdahl
10-12|Munchen
EOF
```

## Steg 4 — Kontroller hint og fun fact på treffet

Dette er steget som tar flest kandidater, og det er lett å glemme fordi validatoren ikke
ser det. Hent spørsmålet og les `hint` og `funFact` som om innledningen alt var byttet.

Fire ekte forkastelser fra 13. september:

- **`hjerte-v-05` (The Beatles).** Fun facten sier at «albumet» var det første med hele
  sangteksten på coveret — det gjelder Sgt. Pepper. En innledning om «Abbey Road» ville gjort
  fun facten usann.
- **`vikinger-l-05` (Stavanger).** Fun facten handler om Viking fotballklubbs stadion og tålte
  ikke en innledning om utvandringen til Amerika.
- **`ild-m-04` (Berlin).** Spørsmålet handler om fakkelstafetten i 1936; hint og fun fact
  tålte ikke en innledning om at Humboldt ble født i byen.
- **`sjokolade-m-17` (Finland).** Hintet handler om løsvektgodteri og tålte ikke freden i
  Fredrikshamn.

Passer de ikke: **velg et annet spørsmål.** Hintet skrives ikke om — det er delt med den
vanlige spørsmålsteksten.

## Steg 5 — Skriv varianten

```jsonc
"onThisDay": [{ "day": "10-06", "year": 1914, "prompt": { "nb": "På denne dagen i 1914 …", "sv": "…" } }]
```

Samme form som ellers: 25–55 ord på begge språk, innledning først og spørsmålet til slutt,
ekte svensk, «…» som anførselstegn. **Svaret lekker lettere her enn ellers** — «På denne
dagen i 1756 ble Mozart født» røper alt. Datoen er kontekst, ikke fasit.

Sorter lista på `day` når du legger til, så filene holder seg lesbare.

## Steg 6 — Hulldagene blir kategoriforslag

For hver dato der steg 3 ga `INGEN`: se på de to hendelsene og finn ankerordet de peker mot.
Et godt forslag er kort og hverdagslig, og har treff i minst tre ulike verdener — jf. kapittel
1 i `QUESTION-DESIGN.md`.

Eksempler fra 13. september, der hendelsene står i parentes:

| Hendelsene | Forslag |
|---|---|
| Magellan seilte 1519 · Cannes åpnet 1946 | **Palme** — Gullpalmen, Olof Palme, palmesøndag, palmeolje |
| Jim Henson født 1936 · «Nevermind» 1991 | **Dukke** — Muppets, «Et dukkehjem», matrjosjka, dukke opp |
| Stockton–Darlington 1825 · «Silent Spring» 1962 | **Vår** — «Den tause våren», vårløsning, Praha-våren |
| «Dr. No» og «Love Me Do», begge 1962 | **Eple** — Apple, Newtons eple, Big Apple, Adamseple |
| Thatcher født 1925 · fredsprisen til Yunus 2006 | **Jern** — jernlady, jernteppe, støpejern |

Forslagene noteres i prosjektdokumentet `claude/datokalender-og-kategorikoe.md`. De går
**bak** kategoriene Rune alt har bestilt.

## Steg 7 — Port, commit, push

Som ellers: `npm run content:validate`, `npx tsc -b`, `npx vitest run`, så commit av bare de
filene du rørte, og push med det samme. Se del C i rutineprompten, inkludert
reserveoppskriften for når filbroen ikke får slettet `.git`-låsene.

---

## Datokonflikter som alt er avklart

Ikke bruk disse — kildene spriker, og det er undersøkt:

| Emne | Konflikten |
|---|---|
| Halfdan Kjerulfs fødselsdag | SNL 17. september, engelsk Wikipedia 15. september |
| Karlstadkonvensjonen | SNL: forhandlingene 13.–23. september, undertegnet i Stockholm 26. oktober |
| Flemings penicillin | SNL sier oppdagelsen skjedde i 1927, ikke 1928 |
| Lars Onsagers dødsdato | SNL 11. oktober, engelsk Wikipedia 5. oktober |
| Mayflowers avreise | 6. september gammel stil, 16. september ny stil |
| Norske stortingsvalg | Går over to dager; dagen er ikke entydig |

Og én ren feil å være klar over: **Sonja Henie døde 12. oktober 1969.** Engelsk Wikipedia
oppgir feil år.
