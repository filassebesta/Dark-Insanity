# Insanity Kingdom — předávací dokument (handoff)

Shrnutí všeho, co vzniklo v dlouhé pracovní konverzaci nad touto hrou: co hra umí,
jak je postavená, jak se s ní pracuje, co je hotové a co zbývá. Je určený pro
kohokoli, kdo na projekt naváže (člověka i další AI session).

**Větev:** `claude/insanity-kingdom-html-game-dccy50` · **Jazyk hry i komunikace:** čeština

---

## 1. Co je to za hru

Textová rozhodovací středověká strategie v prohlížeči ve stylu *The Life and
Suffering of Sir Brante*. Každé období (jaro, léto, podzim, zima) přijde
událost s textem, obrázkem a 2–4 volbami; volby mění zdroje, provincie, dvůr
a vztahy. Vládce stárne, umírá a vládu přebírá dědic. Hra se ukládá do
`localStorage`.

**Tři scénáře (tři obtížnosti), které na sebe navazují:**

| Scénář | Start | Cíl | Po vítězství |
|---|---|---|---|
| **Sedlák** (těžké) | poddaný na gruntu ve vsi Lipnice | svoboda (svobodník) → erb (drobný šlechtic) | tlačítko „Pokračovat jako šlechtic“ |
| **Šlechtic** (střední) | drobný šlechtic s tvrzí v Pobřežní marce | trůn (nárok, povstání, převrat) | tlačítko „Vládnout jako panovník“ |
| **Panovník** (snadné) | král hotového království | zlatý věk (12 období prosperity) | konec |

Jedna uložená hra tak může projít celou cestou od pluhu až ke koruně.

---

## 2. Jak spustit a testovat

Žádný build, čisté HTML + CSS + ES moduly.

```bash
cd Dark-Insanity
python3 -m http.server 8123      # pak otevřít http://localhost:8123/
```

**Simulace (vyvážení, hledání chyb):** spouští tisíce náhodných her přímo nad
enginem, bez prohlížeče. Výstup: délka her, rozdělení konců, chyby.

```bash
node tools/sim/sim.mjs                     # Panovník, 400 her
node tools/sim/sim_noble.mjs 400 1         # Šlechtic; 2. argument = ambice (0–1), jak často bot volí cestu k trůnu
node tools/sim/sim_peasant.mjs 400 0.5     # Sedlák; 2. argument = ambice
node tools/sim/sim_trade.mjs sedlak 200    # libovolný scénář s botem, který obchoduje (3. arg "notrade" = bez obchodu)
```

**Kontroly kvality (před každým commitem):**

```bash
node tools/check/validate.mjs            # statická kontrola obsahu: neznámé zdroje v efektech, tokeny, rodové tvary, odkazy na id, obrázky (exit 1 = chyba)
node tools/check/validate.mjs --art      # + seznam událostí bez vlastního obrázku
node tools/check/smoke.mjs 40 <scratch>  # hraje 3 scénáře ve skutečném Chromiu přes UI, hlídá chyby stránky a zbylé tokeny v textu
```

**Vývojový tým:** na projektu pracuje pět agentů (`.claude/agents/`: creative-director,
lore-designer, game-coder, graphic-designer, bug-checker) přes pipeline `/tym`.
Proces: `docs/tym/README.md`, backlog: `docs/tym/BACKLOG.md`, kánon světa: `docs/lore/KANON.md`.

**Prohlížečové testy:** Playwright (Chromium). Moduly lze importovat přímo ve
stránce, např. `page.evaluate(async () => (await import('/js/state.js')).createNewGame(...))`,
uložit stav přes `saveGame` a kliknout na „Pokračovat“. Obrazovka `screen-game`
musí být aktivní, jinak je mapa skrytá. Screenshoty ukládat mimo repozitář.

---

## 3. Architektura (soubory)

| Soubor | Obsah |
|---|---|
| `index.html` | všechny obrazovky (menu s původní rytinou, nová hra, výběr scénáře, hra, mapa, postava, detail osoby, konec) |
| `css/style.css` | celý vzhled (Sir Brante styl, světlý pergamen pro texty, tmavé panely) |
| `js/main.js` | řízení toku hry, kliknutí, klávesy (1–4 volby, Enter, Esc, **M** mapa, **P** postava, **O** obchod), hudba |
| `js/engine.js` | jádro: interpolace textů, aplikace efektů voleb, ekonomika, drift provincií, stárnutí, nástupnictví, krize, ozvěny, přídomky, výnosy, konce |
| `js/state.js` | tvorba nových her pro 3 scénáře, přechody (`ennoblePeasant`, `crownNoble`), ukládání |
| `js/data.js` | zdroje (s názvy podle scénáře), vlastnosti, tituly, rody, provincie, jména |
| `js/court.js` | role a tituly dvora podle scénáře, životopisy, povahy rádců |
| `js/council.js` | rada: rádci doporučují volbu |
| `js/trade.js` | obchod: zboží, trhy, karavany, zakázky (bez DOM) |
| `js/map.js` | interaktivní malovaná mapa (SVG nad obrázkem), vrstvy, výnosy, obchodní vrstva |
| `js/ui.js` | vykreslení karty události, výsledků, panelů, konce |
| `js/character.js` | list postavy, Síň předků, detail člena dvora |
| `js/audio.js` | hlavní téma a bitevní hudba s prolínáním, hlasitost |
| `js/events.js` | sestavuje `EVENTS` ze všech souborů níže; základní události Panovníka + klidné období |
| `js/events_more.js` | dalších 55 událostí Panovníka |
| `js/events_noble.js` | 32 událostí Šlechtice |
| `js/events_peasant.js` | 32 událostí Sedláka + krize, ozvěny a klidné období sedláka |
| `js/events_echoes.js` | krize (vyčerpané zdroje) a ozvěny rozhodnutí + tabulka `ECHO_HOOKS` |
| `js/events_court.js` | události podle povah rádců + výchova dědice u šlechtice |
| `js/events_trade.js` | přepadení karavany, piráti, cizí kupec, clo, hlad na severu, vlastní loď |
| `docs/gemini-prompts.md` | objednávkový list obrázků (prompty, stav, dávkový prompt) |
| `docs/udalosti.md` | čitelný přehled všech událostí a voleb |
| `tools/sim/` | simulace (viz výše) |
| `tools/check/` | validátor obsahu a prohlížečový smoke test (viz výše) |
| `tools/images/process_batch.py` | zpracování dávky obrázků (detekce a oprava tmavého pruhu, ořez a změna velikosti) |

**Celkem:** ~10 500 řádků JS, 186 událostí (95 Panovník, 39 Šlechtic, 37 Sedlák,
15 pro více scénářů).

### Formát události (zkráceně)

```js
{
  id: 's_drab', scenario: 'sedlak',          // nebo scenarios: ['panovnik', 'slechtic', 'sedlak']
  cooldown: 10, minTurn: 3, seasons: [1, 2], weight: 1, oneTime: false,
  requires: (s) => ..., target: (s) => provinceId | houseId | role,   // cíl → {province.name}, {house.*}, {target.*}
  forced: true,      // nikdy se nelosuje, jen přes state.pendingEvent / ozvěny
  image: 'assets/events/xyz.jpg',                                     // záložní obrázek
  title, text,
  choices: [{
    label, hintType: 'resource'|'trait', hintKey,
    requires,                                  // volba se skryje, když neplatí
    effects: { gold: -5 },                     // zdroje
    // NEBO hod kostkou:
    isRoll: true, baseChance, traitKey, traitScale, resourceKey, resourceScale, chanceBonus: (s) => ...,
    onSuccess: { ...větev }, onFailure: { ...větev },
    chronicle: 'text do kroniky',
  }],
}
```

**Efekty větve** (zpracovává `applyBranch` v `engine.js`): `effects`,
`provinceEffects`, `courtEffects`, `replaceCourt`, `houseEffects`, `noble`
(spiknutí, tajemství), `setTier`, `newKing`, `endGame`, `hiddenEffects`
(příznaky), `traitGain`, `heirTraits`, `echo` (naplánuje ozvěnu), `music: 'battle'`,
obchodní `trade`, `tradeOffer`, `tradeMod`, `tradeStock`.

**Textové tokeny:** `{ruler.name}`, `{heir.name}`, `{chancellor.Title}`,
`{province.name}`, `{target.*}`, `{house.*}`, `{king.*}`, `{lord.*}`, `{village}`,
`{cargo.*}` a rodové tvary `{R:muž|žena}` (vládce), `{H:…}` (hlava rodu),
`{T:…}` (cíl), `{D:…}` (dědic), `{L:…}` (pán), `{M:…}` (manžel/ka).

---

## 4. Co se v konverzaci udělalo (chronologicky)

### Základ a vzhled
- Hra přestavěná do stylu Sir Brante (malířské scény, pergamen, ikony, krok výsledku, klávesové ovládání). **Hlavní menu zůstává původní rytina.**
- **Interaktivní mapa**: malovaná mapa s klikacími provinciemi, místy a cestami, přibližování a posun, vrstvy (věrnost, nepokoje, posádky, cesty).
- **Postava** (avatar, vlastnosti a jejich vliv na vládu, postavení, rodina, předkové) a **detail člena dvora** (životopis, věrnost, rozhodnutí, která ho ovlivnila).
- **Hudba**: hlavní téma hraje celou hru, bitevní hudba při bojích a válkách; ovladač hlasitosti a ztlumení. V menu nejsou vidět červené zvýrazněné oblasti.
- **Skryté důsledky**: hráč nevidí, co volba přinese ani jakou vlastnost zvýší; vidí jen šanci u hodů.

### Obsah a obrázky
- Další dávky událostí (celkem 82 u Panovníka), opravy (nekonečná klidná období, opakující se „Dědic dospěl“, rodové tvary titulů).
- Prompty pro obrázky v `docs/gemini-prompts.md`, **dávkové** a samostatné (pro AI bez přístupu k repozitáři).
- Zapracování desítek zipů s obrázky, včetně těch se špatnými názvy (třídění podle obsahu) a oprav „vloženého tmavého pruhu“.

### Scénář Šlechtic
- Přízeň krále, tři soupeřící rody (Bílá Brána, Rudí, Sokolové), válečná povinnost, intriky a spiknutí, smrt krále a boj o trůn, převrat, panel Rody, vlastnictví provincií na mapě, konce korunovace, poprava, vyhnanství.

### Revize mechanik (první kolo)
- **Krize:** když dojde zlato, jídlo, vojsko, víra, prestiž, legitimita nebo přízeň, přijde vynucená krizová událost (štítek „Krize“).
- **Ozvěny rozhodnutí:** 17 (+2 u sedláka) dřívějších voleb se po letech vrátí jako vlastní událost se štítkem „Ozvěna“ a rokem původní volby. Přidávají se jedním řádkem v `ECHO_HOOKS`.
- **Přídomky a Síň předků:** podle průběhu vlády dostane vládce přídomek (Udatný, Moudrá, Krutý, Tichý…), předci se zobrazují se třemi nejvýznamnějšími rozhodnutími.

### Revize mechanik (druhé kolo)
- **Dědic zdědí výchovu:** dědic má vlastní vlastnosti, výchova je mění a s nimi převezme vládu.
- **Rada:** u události doporučí volbu až dva rádci podle oboru, vlastního zájmu a povahy; nevěrní mohou radit špatně.
- **Výnosy:** jednou za rok na mapě výnos pro vlastní provincii (sedlák: práce na gruntu).
- **Povahy rádců:** oddaný, ctižádostivý, chamtivý, schopný, opatrný, odvážný, zbožný; roční efekty, bonusy k šancím, 4 události.
- **Scénář Sedlák** (viz tabulka v kap. 1): ekonomika gruntu s robotou a dávkami pánovi, rychtář/kovář/krčmář místo dvora, záložka Rodina, 32 událostí, 3 krize, 2 ozvěny, konce Erb a tvrz, Vyhnání z gruntu, Zpustlý grunt.

### Obchod
- Provincie vyrábějí zboží do skladu (obilí, železo, kožešiny, sůl a ryby, sukno; víno jen dovozem).
- Trh v Brodu (prodej hned), karavany a lodě do Východních marek, Jižní říše a Severních pustin, dodávky na královský dvůr (šlechtic) a panský dvůr (sedlák).
- Ceny se mění, cesty trvají 1–3 období a hrozí přepadení (události s výkupným/bojem/odepsáním), doprovod snižuje riziko.
- Zakázky s termínem; královské a panské jsou závazné (nesplnění stojí přízeň).
- Obchodní vrstva mapy (cesty, trhy, pohybující se karavany), záložka **Obchod**, klávesa **O**, zprávy z cest u události.

### Obrázky pro Sedláka
- Zapracováno 31 obrázků: 8 portrétů sedláka, 10 portrétů rodiny a vsi, 3 konce, 10 scén.

---

## 5. Obrázky — jak to funguje a co chybí

**Hra si obrázky hledá sama** podle názvu souboru, když chybí, použije zálohu:

- scény: `assets/events/<id>_<male|female>.jpg` → `<id>.jpg` → `event.image` → `scene_default.jpg`
- portrét vládce: `assets/portraits/ruler_<peasant|freeman|minor_noble|noble|king>_<g>[_old].jpg` (stará verze od 55 let)
- dvůr: `assets/portraits/<role>_<g>.jpg`, u sedláka `s_<role>_<g>.jpg`
- konce: `assets/endings/ending_<typ>.jpg`; karty scénářů `assets/ui/scenario_<klíč>.jpg`

**Cílové formáty:** portréty 1024 × 1280 (4:5), scény 1024 × 1024, konce 1365 × 768.
Originály se ukládají do `assets/_source/gemini/<dávka>/`.

**Typická vada generátoru:** do spodní části (≈ 67–75 % výšky) vloží tmavý
pás, někdy dokonce jiný výřez obrazu. `tools/images/process_batch.py` ho najde
a srovná jas a barvu. Falešné poplachy (okraj stolu, prkno) je nutné
zkontrolovat okem. Ve hře spodní třetinu scény stejně kryje tmavý přechod.

```bash
# detekce, pak umístění (FIX = soubory, kde se má pruh opravit); potřebuje Pillow + numpy
python3 tools/images/process_batch.py dir1,dir2 <scratch> <repo> detect
FIX=s_drab.jpg python3 tools/images/process_batch.py dir1,dir2 <scratch> <repo> place
```

**Co chybí (vše volitelné, hra si zatím půjčuje podobné scény):** viz stav v
`docs/gemini-prompts.md`:
- 28 scén sedláka (sekce 14.4, „dávky“ 5–7)
- 5 scén rádců a výchovy (14.5) a 6 scén obchodu (15)
- 24 scén krizí a ozvěn (13)
- případně znovu `s_krupobiti` a `s_trh` (vložený spodní pruh jen zmírněný)

---

## 6. Vyvážení (výsledky simulací)

| Scénář | Bot | Výsledek |
|---|---|---|
| Panovník | náhodné volby | medián ~33 let; zlatý věk ~38 %, kolaps ~38 %, zbytek přežije 100 let |
| Šlechtic | cílí na trůn (ambice 1), neobchoduje | trůn ~45–49 %, poprava ~38 %, vyhnanství ~7 % |
| Sedlák | ambice 0,5 | šlechtický stav ~45–50 %, svoboda kolem 10. roku, medián ~25 let; zbytek hlavně zpustlý grunt |
| všechny | s obchodováním | mírné zlepšení, obchod hru nerozbíjí |

Hlavní páky: šance u `n_smrt_krale` (Šlechtic), ceny `s_vykup` a `s_zemansky_statek`
a šance rytířské bitvy (Sedlák), ekonomika v `processPeasantEconomy` a `processTurnEconomy`.

---

## 7. Pracovní pravidla a přání uživatele

- **Komunikace česky**, krátce a srozumitelně; po práci říct, co se změnilo a co je potřeba od uživatele.
- **Obrázky zapracovat hned**, jakmile přijdou (zip i jednotlivé soubory); názvy nemusí sedět, třídit podle obsahu.
- **Prompty dávkově** a samostatné (uživatel je posílá do AI bez přístupu k repozitáři).
- **Hlavní menu = původní rytina**, nic na něm neměnit; žádné červené zvýraznění klikacích míst.
- **Důsledky voleb skryté** (žádné náhledy efektů ani růstu vlastností u voleb).
- Hudba: hlavní téma běží celou hru, bitevní jen při bojích.
- Git: vyvíjet a pushovat jen na větev `claude/insanity-kingdom-html-game-dccy50`; **PR nevytvářet**, pokud o to uživatel výslovně nepožádá; commity končí atribučními řádky podle pokynů prostředí.
- Testovací screenshoty nikdy neukládat do repozitáře (jednou se to stalo a bylo odstraněno).

---

## 8. Nápady na další práci

- Doplnit zbývající volitelné scény (kap. 5).
- Víc ozvěn a událostí pro Sedláka (zatím 2 ozvěny), víc obchodních událostí.
- Jedinečná jména i u nové generace dvora (při nástupnictví se mohou opakovat).
- Rada zatím nezná budoucí důsledky kromě dluhů (příznaky jako `loan_taken`); šlo by ji naučit víc.
- Případně ukládání do více slotů s přehledem scénáře a přídomku vládce.
