# Insanity Kingdom — předávací dokument (handoff)

Shrnutí všeho, co vzniklo v dlouhé pracovní konverzaci nad touto hrou: co hra umí,
jak je postavená, jak se s ní pracuje, co je hotové a co zbývá. Je určený pro
kohokoli, kdo na projekt naváže (člověka i další AI session).

**Větev:** `claude/kind-lamport-19swo3` (dřív `claude/insanity-kingdom-html-game-dccy50`) · **Jazyk hry i komunikace:** čeština

---

## 1. Co je to za hru

Textová rozhodovací středověká strategie v prohlížeči ve stylu *The Life and
Suffering of Sir Brante*. Každé období (jaro, léto, podzim, zima) přijde
událost s textem, obrázkem a 2–4 volbami; volby mění zdroje, provincie, dvůr
a vztahy. Vládce stárne, umírá a vládu přebírá dědic. Hra se ukládá do
`localStorage`.

**Jedna kronika od pluhu ke koruně (žádný výběr scénáře).** Každá nová hra
začíná jako sedlák a v téže uložené hře postupuje výš. `state.scenario` dál
existuje, ale znamená **životní stupeň** rodu, ne volbu hráče:

| Stupeň (`scenario`) | Titul (`statusTier`) | Jak se postoupí dál |
|---|---|---|
| `sedlak` | 1 Sedlák → 2 Svobodník | výkup (`s_vykup`) nebo statečnost v bitvě (`s_bitva`); pak tvrz s erbem (`s_zemansky_statek`) nebo rytířský pás (`s_pasovani`) |
| `slechtic` | 3 Drobný šlechtic → 4 Významný šlechtic | královská milost (`n_povyseni`), koupě titulu; pak trůn: nárok po smrti krále, spiknutí a převrat, nebo **povstání proti koruně** (válečné tažení) |
| `panovnik` | 5 Král → 6 Císař | zlatý věk (konec hry), nebo dobytí dvou cizích korun (císař, hra pokračuje) |

Povýšení (`endGame: 'ennobled' | 'crowned'` ve větvi) už **není konec kroniky**:
`promote()` ve `state.js` převede hru na další stupeň a vloží kartu kapitoly
(`kapitola_erb`, `kapitola_koruna` v `events_career.js`). Konce `ennobled`/`crowned`
na obrazovce konce zůstaly jen pro staré uložené hry (tlačítko je převede).

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
node tools/sim/sim_career.mjs 400 0.7 150  # celá kronika od sedláka; 2. arg = ambice, 3. = max. let
node tools/sim/sim.mjs                     # Panovník, 400 her
node tools/sim/sim_noble.mjs 400 1         # Šlechtic; 2. argument = ambice (0–1), jak často bot volí cestu k trůnu
node tools/sim/sim_peasant.mjs 400 0.5     # Sedlák; 2. argument = ambice
node tools/sim/sim_trade.mjs sedlak 200    # libovolný scénář s botem, který obchoduje (3. arg "notrade" = bez obchodu)
```

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
| `js/map.js` | interaktivní malovaná mapa (SVG nad obrázkem), vrstvy, výnosy, obchodní vrstva, vstup do měst |
| `js/build.js` | stavění: sídla, úrovně, parcely, budovy, stavební hutě, výnosy staveb (bez DOM) |
| `js/town.js` | plán sídla (SVG s parcelami a ikonami budov) a boční panel stavění; na gruntu i výběh se zvířaty a panel Hospodářství |
| `js/farm.js` | hospodářství gruntu: obilí, krávy, koně, prasata, místo a výnosy podle staveb, nákup a prodej (bez DOM) |
| `js/ui.js` | vykreslení karty události, výsledků, panelů, konce |
| `js/character.js` | list postavy, Síň předků, detail člena dvora |
| `js/audio.js` | hlavní téma a bitevní hudba s prolínáním, hlasitost |
| `js/events.js` | sestavuje `EVENTS` ze všech souborů níže; základní události Panovníka + klidné období |
| `js/events_more.js` | dalších 55 událostí Panovníka |
| `js/events_noble.js` | 32 událostí Šlechtice |
| `js/events_peasant.js` | 32 událostí Sedláka + krize, ozvěny a klidné období sedláka |
| `js/events_career.js` | karty kapitol (erb, koruna), konec povstání (vítězství / porážka), posel z Marek, ozvěny „vyhnaný král“ a „účet z Marek“ |
| `js/realms.js` | sousední království (Východní marky, Severní pustiny, Jižní říše): vládci stárnou a umírají, síla, vztah, dobytí koruny, příjem z cizích korun (bez DOM) |
| `js/events_foreign.js` | příběhové linky z cizích zemí (kupec Zénon, nájezd ze severu, Racčí ostrov, náčelník Bjarn, jižní poselstvo a půjčka, boj o cizí trůn) |
| `js/world.js` | mapa světa (SVG na pergamenu, volitelně pod ní malba `assets/map/world_map.jpg`) a její boční panel |
| `js/events_echoes.js` | krize (vyčerpané zdroje) a ozvěny rozhodnutí + tabulka `ECHO_HOOKS` |
| `js/events_court.js` | události podle povah rádců + výchova dědice u šlechtice |
| `js/events_trade.js` | přepadení karavany, piráti, cizí kupec, clo, hlad na severu, vlastní loď |
| `js/talk.js` | rozhovory s dvorem: témata podle role a povahy, hod k%, věrnost, drby (bez DOM) |
| `js/talk_ui.js` | sekce Rozhovor v detailu člena dvora |
| `js/gear.js` | výzbroj: zbraně, zbroj, štít, kůň, obchod (bez DOM) |
| `js/combat.js` | souboj po kolech: nepřátelé, akce, hody k6+, zranění z boje (bez DOM) |
| `js/dice_ui.js` | „stůl“: hod k% u riskantních voleb a souboj po kolech v příběhovém panelu |
| `js/events_bandits.js` | zbojníci: na cestě, noční přepadení, zbojnický hejtman |
| `js/war.js` | válečná tažení: cíle, vojsko v poli, zásoby, morálka, postup, konec tažení, tributy (bez DOM) |
| `js/events_war.js` | 8 událostí v poli (bitva, obléhání, úplavice, dezertéři, mír, hlad, hrdina, zvěd) + triumf a porážka |
| `js/ambitions.js` | ambice: cíle vládce s termínem, postup, odměna, nesplnění (bez DOM) |
| `js/events_ambition.js` | událost „Čeho chceš dosáhnout“ (nabídka tří ambicí, `free: true`) |
| `js/achievements.js` | Síň slávy: 28 úspěchů napříč všemi hrami (localStorage) |
| `js/fame.js` | lišta ambice nad příběhem, obrazovka Síň slávy, úspěchy na konci kroniky, oznámení |
| `js/injuries.js` | zranění vládce: druhy, postihy, hojení, zánět, náhrady, přídomky podle zranění (bez DOM) |
| `js/events_injury.js` | ranhojič, řemeslník s náhradou (dřevěná noha, železná ruka, páska), posměch u dvora |
| `js/events_build.js` | 16 událostí kolem staveb (požár, nákaza, cech, žold, nájezd, městská práva, poutníci… a 4 pro grunt) |
| `docs/gemini-prompts.md` | objednávkový list obrázků (prompty, stav, dávkový prompt) |
| `docs/udalosti.md` | čitelný přehled všech událostí a voleb |
| `tools/sim/` | simulace (viz výše); `free.mjs` vyřeší událost „navíc“ (nabídku ambice) stejně jako hra |
| `tools/images/process_batch.py` | zpracování dávky obrázků (detekce a oprava tmavého pruhu, ořez a změna velikosti) |

**Celkem:** ~10 500 řádků JS, 205 událostí (95 Panovník, 39 Šlechtic, 41 Sedlák,
30 pro více scénářů — z toho 12 o stavbách a 3 o zraněních).

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
`{province.name}`, `{target.*}`, `{house.*}`, `{king.*}`, `{lord.*}`, `{village}`, `{target.Role}` (role velkým písmenem na začátku věty),
`{cargo.*}` a rodové tvary `{R:muž|žena}` (vládce), `{H:…}` (hlava rodu),
`{T:…}` (cíl), `{D:…}` (dědic), `{L:…}` (pán), `{M:…}` (manžel/ka).
Cizí vládci: `{realm.east}` („král Ctibor“), `{realm.east.Ruler}` (totéž na začátku věty), `{realm.east.name}`,
`{realm.east.title}`/`{realm.east.Title}`, `{realm.east.claimant}` (nápadník trůnu) a rodové tvary `{E:…}` (Marky), `{N:…}` (Pustiny), `{S:…}` (Říše).

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
- **Lišta povinných zakázek** (`contract_bar.js`, `#contract-bar` v horní liště, kreslí se v `refreshAllPanels`): každá povinná zakázka pána/koruny (`obligation: true`) je karta s dárcem, nákladem, ukazatelem skladu (zelený, když zboží stačí), počtem období do termínu a datem („do podzimu roku 4“) a tenkým časovým proužkem; barva podle naléhavosti (`contractStatus().urgency`: klid, od 2 období jantarová, od 1 období červená a pulzuje). Klik na kartu otevře mapu v obchodní vrstvě na trhu zadavatele, **Splnit** (`fulfillContract`) pošle přesný náklad (doprovod jen když ho hráč naposledy zvolil nebo je cesta nebezpečná), „koupit“ otevře Brod. Bez povinných zakázek je lišta skrytá (třída `has-contract-bar` na `body` posouvá toasty). Poslední období před termínem přijde zpráva i toast (`takeTradeAlerts`), propadlá zakázka vypíše, co se ztratilo (přízeň −3 a odměna).
- **Obchod v mapě:** trendy cen (↑ ↓ → a % proti základní ceně, `trendOf`), nejlepší trh pro každé zboží ve skladu a tlačítko „Prodat za nejlepší cenu“ (v Brodu prodá hned, jinde předvyplní karavanu), „Prodat vše“ (v Brodu, zboží slíbené povinným zakázkám zůstane), sloupec Zisk (nákup v Brodu a prodej tady), odhad zisku karavany i s rizikem (`planEstimate`), zapamatovaná poslední volba (`t.last`), řádek co trh chce, zakázky řazené povinné nahoře a pak podle termínu. Sklad má strop 20 vozů; budovy **Skladiště** (+6, města) a **Kolna na vozy** (+4, grunt) ho zvedají (`maxStock`, nejvýš +18). Víno se v Brodu vykupuje jen za 1, aby nákup v Jižní říši a hned prodej nebyl nekonečný zisk; východní železo a jižní kožešiny platí o 1 víc.

### Stavění ve městech a vsích
- Klik na město/ves na mapě otevře **plán sídla** s parcelami; klik na volnou parcelu nabídne stavby, klik na stavbu ukáže detail (strhnout, zastavit stavbu).
- 9 sídel (`SETTLEMENTS` v `build.js`): Vlčí Úděl, Brod, Přístav Mark, Klášter na útesu, Železná Huť, Sokolov a nové vsi Lipnice, Dubovice, Zářečí. Sedlák místo Lipnice staví na **vlastním gruntu** (`towns.grunt`).
- Úrovně Osada → Ves → Městys → Město → Královské město (klášter a grunt mají vlastní názvy), každá otevírá víc parcel; povýšení stojí zlato, čas a hotové stavby (Město potřebuje hradby, Královské město katedrálu, Statek svobodný stav).
- 16 budov království (3 jen pro přístav, důl a myslivce) a 11 staveb gruntu. Účinky: `income` (každé období), `yearly` (na jaře), `drift` (klid a věrnost kraje, strop 8/6), `stock` (zboží do skladu), `onBuild`/`onProv` (jednou).
- Jen jedna stavba v sídle naráz a omezený počet **stavebních hutí** v celé zemi (Panovník 2, Šlechtic a Sedlák 1).
- Stavět jde jen ve vlastních krajích (šlechtic jen na svém panství, po korunovaci všude). Cizí sídla jde prohlížet.
- Stavby, které stojí od začátku (`base: true`), nic navíc nedávají — jsou započtené v původní ekonomice, aby se nezměnilo vyvážení.
- Ukládá se do `state.towns`; staré uložené hry si sídla vytvoří samy.
- **Události o stavbách** (`events_build.js`): cílí na konkrétní sídlo (`target` vrací `'town:<id>'`, v textu `{town.loc}` = „v Brodu“, `{town.Loc}`, `{town.name}`). Větev může mít `town: { destroy: 'random' | '<klíč>', start: '<klíč>', hurry: n, levelUp: true, at: '<id>' }`. Stavby tak mají i rizika: požár nebo nájezd může stavbu zničit, hradby nájezd odrazí, špitál zastaví nákazu, mistr stavitel přidá stavební huť (`flags.mistr_stavitel`).
- Stará událost „Katedrála“ teď při plném financování opravdu začne stavět katedrálu ve Vlčím Údělu; po dostavbě přijde „Svěcení katedrály“.
- Obrázky budov a sídel jsou volitelné (prompty v `docs/gemini-prompts.md`, sekce 16); po dodání je zapnout v `BUILDING_ART` / `TOWN_ART` v `js/town.js`.

### Zranění vládce
- `state.ruler.injuries = [{ key, since, healsAt?, treated?, aided? }]`; definice v `INJURIES` (`js/injuries.js`).
- Dočasná: pohmožděniny (1–2 období), zlomená ruka (3–5), hluboká rána (4–6, 4 % za období, že se zanítí a vládce zemře, dokud není ošetřená).
- Trvalá: chromá noha, zohyzděná tvář, ztracené oko, ztracená ruka, ztracená noha. Náhrada (páska, železná ruka, dřevěná noha) postih zmírní.
- Postihy: nižší **efektivní vlastnosti** (`effectiveTraits` — hody, roční vliv vlastností, přídomky; základ zůstává a dědic ho dědí), horší šance v boji (`army`), u sedláka méně zásob (`work`), kratší život (`deathRisk`), jednorázová ztráta prestiže.
- Vznik: větev události `injury: '<klíč>' | 'random' | { pool, chance }` (rvačka, atentát, turnaj, hon, souboj, první linie, vlk, roj) a obecně 30 % po každém neúspěšném hodu na sílu (`noInjury: true` to vypne, např. u „síly“ ve smyslu tvrdosti při jednání).
- Větve `heal`, `treat`, `worsen`, `aid` léčí, ošetřují, zhoršují a dávají náhradu.
- Zranění se ukazují na plaketě (červeně snížené vlastnosti, „bez nohy“), v listu postavy (sekce Zranění) a v Síni předků; trvalé zranění může dát přídomek (Jednooký, Chromá…).

### Kostky a souboje
- **Každá riskantní volba se hází k% (1–100)** jako v Dračím doupěti: `rollParts` (`engine.js`) rozloží šanci na **cílové číslo** (obtížnost pro průměrného vládce) a **modifikátory k hodu**: vlastnost od průměru 5 (Síla 7 při `traitScale` 0,05 = +10), zdroj od 50, zranění, schopný rádce (+6), okolnosti (`chanceBonus`, popisek `bonusLabel`). Hod + modifikátory ≥ cíl = úspěch, 96–100 vždy úspěch, 1–5 vždy neúspěch. Pravděpodobnost je přesně stejná jako dřív (`computeSuccessChance` = `rollParts().chance`), vyvážení se nemění.
- Hráč klikne na volbu → panel s cílem, modifikátory a tlačítkem **Hodit kostkou** (Enter) → animace dvou k10 → verdikt → Pokračovat. `resolveChoice(state, event, i, { success })` přijme výsledek ze stolu; bez něj hází engine sám (simulace).
- **Souboj** (`combat: '<nepřítel>'` u volby s `isRoll`): po kolech, hody **k6+** (šestka se hází znovu a přičítá). Útok = k6+ + ÚČ proti k6+ + OČ, zásah bere rozdíl + zbraň. Vládce: životy 8 + Síla, ÚČ = Síla/2, OČ = (Síla + Trpělivost)/4 (+1 zbroj u pána), zbraň +2 (sedlák +1). Akce: Útok, Silný úder (ÚČ −1, rána +3), Kryt (OČ +3, příští útok +1), Zastrašit (výřečnost proti odvaze), Lest (inteligence: nepříteli OČ −2, útok +2), Útěk (trpělivost). Klávesy 1–6, Enter.
- Nepřátelé (`ENEMIES`): rváči, zbojníci, zbojnický hejtman, najatý vrah, vlčí smečka, vlk, turnajový rytíř, šlechtic s mečem, dráb s pacholky, soused Hrubý. Těžký zásah (5+) může zranit, prohraný boj zraní vždy (u rváčů jen modřiny). Zranění z boje nahrazují `injury` větve.
- Souboje jsou u: rvačka v krčmě, atentát, turnaj, vlčí hon, souboj s autorem písně, Sedlák: dráb, vlk, Hrubý, a v nových událostech se zbojníky. Průměrný vládce (vše 5) vyhraje se zbojníky ~75 %, s hejtmanem ~45–50 %, sedlák se zbojníky ~55 %; silná postava (Síla 8) vyhrává výrazně častěji.
- Simulace souboje nehrají, berou šanci z `baseChance` a `traitKey` volby (proto je volba se soubojem i dál `isRoll`).

### Rozhovory s dvorem
- V detailu člena dvora (Dvůr → klik na osobu) je sekce **Rozhovor**: s každým jednou za období (`c.talkTurn`).
- Témata (`TOPICS` v `talk.js`): zeptat se, jak se má (výřečnost), požádat o radu (inteligence, 1× ročně, rádce přinese zdroj podle oboru), pochválit (věrnost +5, ctižádostiví ostatní žárlí), dar (5 zlata / 2 groše, chamtivý ocení víc), výtka (síla, riskantní). Podle povahy: modlitba (zbožný), učit se (schopný → +1 vlastnost vládci, 1× ročně), slib moci (ctižádostivý, jen jednou), boje (odvážný), rizika (opatrný), svěřit se (oddaný). Rodina: učit dědice (zvedne nejslabší vlastnost, 1× ročně), večer s manželem/kou. Špehmistr/krčmář: drby (kdo je nejméně věrný, který rod škodí).
- Riskantní témata jdou přes stejný hod k% jako volby (`topicRollChoice` → `rollParts`); věrnost pod 40 dá −10, nad 70 +5. Výsledek se zapíše do historie osoby.

### Výzbroj a družina
- `state.gear` (`gear.js`): pán začíná s mečem a kroužkovou košilí, sedlák s cepem. V listu postavy (P) sekce **Výzbroj** s obchodem: dlouhý meč (ÚČ +1), válečná sekera (zbraň +3), mistrovský meč, plátová zbroj (+4 životy, útěk −2), štít (OČ +1), jezdecký kůň, válečný oř (+4 k hodům na sílu a vojsko, ukazuje se v rozpisu hodu). Sedlák u kováře: sekera, kabátec, štít, kůň.
- Kompletní výzbroj pána (~60 zlata) zvedne šanci proti hejtmanovi z ~43 % na ~83 %, tedy zhruba jako +3 Síla.
- **Družina:** v boji proti tlupě (ne v souboji muže proti muži: turnaj, souboj, hejtman, vrah, Hrubý) jde s vládcem maršál (u Sedláka kovář), pokud má věrnost aspoň 50. Útočí každé kolo (ÚČ 2, schopný 3). Nevěrný se drží stranou. Proti zbojníkům zvedne šanci ~73 → ~86 %.

### Válečná tažení
- Záložka **Válka** (klávesa **V**, vrstva mapy „Válka“) u Panovníka a Šlechtice; Sedlák války nevede.
- Cíle (`warTargets`): Východní marky (síla 1,3, tribut 3 zlata/období na 6 let), Severní pustiny (0,9, zima, kožešiny a malý tribut), Jižní říše (1,6, nájezd po moři, kořist), **znovudobytí ztraceného kraje** (bez něj nepřijde zlatý věk) a u Šlechtice **soukromá válka** proti rodu, který není spojenec ani příbuzný (kořist, rod oslabí, král se mračí).
- Hráč volí velikost (15/25/40 mužů z vojska, doma musí zůstat aspoň 8) a velitele: vládce osobně (morálka +, šance +8 %, riziko zranění, doma chybí: stabilita −1 každé 2. období), nebo maršál.
- `state.war`: pochod 1–2 období, pak v poli každé období +6 % postupu a jedna válečná událost (`state.pendingEvent`), větve `war: { progress, morale, power, won, wound, end }`. Vojsko jí `ceil(muži/8)` jídla za období; dlouhá válka a zima berou morálku.
- Konec: 100 % postupu = vítězství (událost `w_triumf`), morálka 0 nebo ≤ 2 muži = porážka (`w_porazka`), mír z události, nebo odvolání (prestiž −3). Mezi taženími 8 období odpočinku.
- Šance (`warBonus`): poměr mužů k síle nepřítele, morálka, velitel. Rozumný hráč s celou hotovostí vyhraje nebo uzavře mír téměř vždy, s malým oddílem je to hazard.
- Simulace botů tažení nezačínají, takže vyvážení bez války je beze změny. Bot, který válčí pořád a volí náhodně, ale Panovníka vyčerpá (kolapsy ~60 %).

### Ambice a Síň slávy
- **Ambice** (`ambitions.js`): zhruba jednou za 1–2 roky (pokud žádná neběží) přijde událost `ambice` se třemi cíli podle scénáře (19 ambicí: stavby, povýšení sídla, pokladna, bitvy, víra, prestiž, klid v krajích, obchod, výchova dědice, legitimita, královská přízeň, spojenectví, a 8 selských). Druh `gain` (přírůstek od začátku), `reach` (dosáhnout), `below` (nejvýš). Splnění: odměna (větev události) + bod vlastnosti; nesplnění v termínu: prestiž −2 (sedlák −1). Nový vládce začíná bez ambice.
- Událost s `free: true` nezabírá období: po ní hned přijde běžná událost téhož období (`nextEventSameSeason` v `main.js`). Jinak by nabídka ubírala události a měnila vyvážení.
- **Statistiky** `state.stats` (`bumpStat` v `data.js`): `built`, `upgrades`, `battlesWon`, `delivered`, `tradeGold`, `injuries`, `scars`, `crises`, `ambitionsDone`; `state.origin` = scénář, kterým kronika začala.
- **Síň slávy** (`achievements.js`): úspěchy se kontrolují po každé volbě a období, ukládají se do `localStorage` (`insanityKingdom.achievements`) a platí pro všechny hry. Obrazovka `screen-hall` (z Možností a z konce kroniky), 3 skryté „temné“ úspěchy.
- Rady pro začátečníky byly na přání uživatele odstraněny — nepřidávat je znovu.

### Obrázky pro Sedláka
- Zapracováno 31 obrázků: 8 portrétů sedláka, 10 portrétů rodiny a vsi, 3 konce, 10 scén.

---

### Jedna kariéra, povstání a další království (session `claude/kind-lamport-19swo3`)
- **Výběr scénáře zrušen.** Nová hra: jméno, muž/žena, jméno rodu → rovnou sedlák v Lipnici. `createNewGame(…, scenario)` přijímá stupeň jen kvůli simulacím a testům.
- **Povýšení uvnitř hry:** `promote(state, 'ennobled' | 'crowned')` (`state.js`). Volá ho `resolveChoice` až po zápisu kroniky volby (`state.pendingPromotion`), takže kronika jde ve správném pořadí. Při erbu: noví rádci místo sousedů z Lipnice, grunt se prodá, lichvář si vybere dluh, panské zakázky a karavany zmizí (zboží zpět do skladu), rodina si nechá selské životopisy (`c.bio`). Při koruně: starý král odchází (`state.formerKing`), staří služebníci nad 60 let odcházejí na odpočinek, dospělý dědic už „nedovrší 16 let“. Při obou: ambice skončí, karta kapitoly jde jako první a ostatní vynucené události čekají ve frontě `state.eventQueue` (`queueEvent` v `engine.js`).
- **Povstání proti koruně** (`war.js` `rebellionTarget`): cíl tažení `crown` pro významného šlechtice (tier 4), dokud žije král. Síla královského vojska 1,7 × 25 mužů, slabší o spojence (−0,22 za rod, a jejich družiny po 6 mužích jdou s tebou), nárok ≥ 40, spiknutí ≥ 2 a cizí pomoc (`flags.cizi_podpora` z události `n_cizi_posel`). Během vzpoury `flags.rebellion`: přízeň 0 bez vyhnanství, královské události (`ROYAL_EVENTS`) a zakázky dvora se nelosují. Výhra → `w_povstani_vitezstvi` (osud krále: klášter / poprava / vyhnanství s ozvěnou `ozvena_vyhnany_kral`) → koruna. Porážka nebo odvolání → `w_povstani_porazka` (milost, obrana tvrze, útěk). Mír z `w_mir` → přízeň 20. Test: bez spojenců ~38 % koruna, se 2 spojenci ~61 %.
- **Mocný šlechtic:** vyhraná soukromá válka proti rodu s mocí ≤ 30 mu vezme sídlo (kraj přejde na hráče, `stats.seized`).
- **Další království** (`realms.js`): `state.realms.{east,north,south}` s vládcem, silou a vztahem. Vládci stárnou a umírají (zprávy z ciziny), síla se obnovuje. Králova výhra proti zemi jí vezme 25 síly (tribut jako dřív); když tím klesne na 25 a méně, **koruna padne** a hráč ji nosí taky (+3 / +1 zlata za období). Dvě cizí koruny = **císař** (tier 6). Nespokojená dobytá země se může vzbouřit a odtrhnout. Jižní říši dobýt nejde. Větev události může měnit vztah: `realm: { east: { attitude, power } }`. Tokeny `{realm.east}` („král Ctibor“), `{realm.east.name}`.
- **Mapa světa:** tlačítko „Svět“ v hlavičce mapy (`world.js`); pod hranicemi je malba `assets/map/world_map.jpg` (2000 × 1342, hranice obtažené podle ní, funkce `P` přepočítává na 1264 × 848), bez ní se kreslí SVG. Klik na zemi → panel s vládcem, silou, vztahem a tlačítkem „Připravit tažení“. Vlčí Úděl vrací na mapu království.
- **Tokeny rodu panovníka:** `{king.title}`/`{king.Title}` (král/královna), `{K:…|…}` (podle krále), `{F:…|…}` a `{formerKing.name}` (sesazený), `{house.gen}` (2. pád rodu: „z rodu pánů z Bílé Brány“). Názvy událostí se teď taky interpolují.
- **Opravy návazností** (audit): sňatek dědice jen jeden napříč stupni (`flags.heir_married`), noví králové mívají dědice, smrt vzdáleného krále nemění přízeň pána, rádci mimo královský dvůr v 66+ letech umírají a jsou nahrazeni, nová domácnost po nástupnictví odpovídá věku vládce, nevolník nedostává události o zahraničním obchodu.
- **Začátek za sedláka:** grunt bez roční „práce na gruntu“ (výnos z mapy) chátrá; kdo ji neobjevil, krachoval (rozumný hráč 23 %). Když hráč do podzimu nic nenaplánuje, přijde po žních volná událost `s_prace_na_gruntu` (`events_farm.js`) se stejnými možnostmi; větev `decree: '<klíč>'` zadá práci stejně jako mapa (`issueDecree`). Kdo mapu používá, ji neuvidí. Simulace mají „rozumného hráče“ `tools/sim/smart.mjs` (váží účinky voleb podle toho, čeho je málo; parametr = podíl náhodných voleb). Pozor: čistě náhodný bot s touto událostí vychází hůř, protože v ní volí naslepo místo rozumné práce z mapy — to je vlastnost bota, ne hry.
- **Druhé kolo (podle design review agenta):**
  - *Boj o trůn* (`events_throne.js`, `engine.js processThroneArc`): 6 let po dosažení významného šlechtice (nebo když je králi 60) král padne na honu → regentská rada (místo regenta = nárok +15) → spor o nástupnictví → do 4–7 období rozhodnutí o trůnu v `n_smrt_krale`. Nový král spouští odpočet znovu (`state.throneReset`). Během války se linka nehýbe.
  - *Zlatý věk* už kroniku sám neukončí: událost `zlaty_vek` nabídne konec ve slávě, ambici „Říše“ (`cisarstvi`) nebo vládu dál (znovu nejdřív za 10 let).
  - *Karty kapitol* i pro svobodu (`kapitola_svoboda`), velmože (`kapitola_velmoz`) a císaře (`kapitola_cisar`); `TIER_CHAPTERS` v `engine.js`, `state.milestones.tierN`.
  - *Grunt:* práce „Najmout čeledíny“ (`hire`), klučení stojí 1 čeledína, čeledník od úrovně 2, hlad −3 grunt za období místo −5, první zpustnutí = chalupa na kraji vsi (`s_chalupa`, `flags.chalupa`), hladová krize nabízí nákup obilí, ambice „Ruce k práci“ = +8 čeledi.
  - *Převrat:* první nezdar `n_prevrat` = útěk tajnou chodbou (`flags.prevrat_selhal`), až druhý = poprava.
  - *Prolog* (`events_prologue.js`): tři volné karty před první sezónou (původ: fara / pytlák / kovář / krčma → `traits: {…}` posune víc vlastností a později přijde jedna vlastní událost; první zima; hold pánovi). *Povaha pána* `LORD_NATURES` (chamtivý / spravedlivý / krutý) mění podzimní dávky a jak rychle pán zapomíná; token `{lord.nature}`, `{lord.natureText}`.
  - *Nové události* (`events_stages.js`): 8 + 2 ozvěny pro svobodníka (`f_*`), 8 + 4 ozvěny pro významného šlechtice (`v_*`).
  - *Popisky voleb* se interpolují (rodové tvary fungují i v nich).
  - *Rozumný hráč* v simulacích: `tools/sim/smart.mjs`, `SMART=0.4 node tools/sim/sim_career.mjs`.
- **Láska, svatba a děti** (`family.js`, `events_family.js`, témata v `talk.js`): nová kronika začíná svobodně a bez dědice (manžel/ka a dědic jsou zástupné objekty s `none: true, alive: false`; v Dvoře se nezobrazují). V listu postavy → Rodina jsou tři nápadnice / nápadníci (`state.suitors`, podle stupně: mlynářova dcera, dcera rytíře, cizí princezna…; dcera rodu = spojenectví, princezna = vztah s říší, věno do zdrojů). Klik → *Námluvy*: dát se do řeči, dárek, tanec (1× ročně), svést (od náklonnosti 35), požádat o ruku (od 55; úspěch = `marry`). S manželem/kou téma *Toužit spolu po dítěti* (šance podle věku matky, do 42 let, max. 5 dětí) → `state.pregnancy` → za 3 období událost `narozeni`. Dítě je dědic, pokud žádný není, jinak `state.children`; když dědic zemře, nastoupí nejstarší z dětí (`nextHeir`). Kdo nemluví: příroda občas dá dítě sama, od 26 let přijde dohazovač (`f_dohazovac`), od 38 let bez dědice schovanec (`f_schovanec`). Bot bez rozhovorů: svatba ~28 let, dědic ~33 let, vymření rodu ~3 %. Role v rozhovorech: `personOf(state, 'suitor:1' | 'child:0' | 'spouse')`. Tokeny `{child.name}`, `{child.word}`, `{C:…|…}`, `{suitor.0.name}`, `{suitor.0.kind}`.
- **Mapa bez rozhodování** (přání uživatele: interakce na mapě nesmí duplikovat rozhodování v příběhu). Mapa slouží jen k přehledu a správě: čtyři režimy `MODES` v `map.js` (Kraje / Ves a kraj, Obchod, Válka, Svět) místo sedmi přepínačů vrstev; kraje jako karty (barevný proužek kraje, stav, věrnost a nepokoje), detail kraje se sídly (úroveň, Stavět / Prohlédnout). **Výnosy a práce na gruntu z mapy zmizely** — roční rozhodnutí je jen v příběhu: sedlák každý podzim `s_prace_na_gruntu`, šlechtic a král každé jaro (nebo léto) `vynos_roku` pro nejneklidnější vlastní kraj (`events_farm.js`, větev `decree`, kontext kraje přes `setTargetContext` i u vynucených událostí). Cesta k Orlí Stráži se vybírá jen v kartě události, mapa ji ukazuje. Bot `smart.mjs` počítá i dopad výnosu na kraj.
- **Herní test celé kampaně** (testeři ve skutečném prohlížeči; seznam a stav v `docs/testovani.md`). Opraveno: nástupnictví má vlastní kartu `nastupnictvi` (events_family.js), sourozenci zůstávají a nejstarší je dědicem, dokud vládce nemá dítě; manžel/ka nového vládce je vždy opačného pohlaví a s jedinečným jménem (`generateSuccessorHousehold`). Krize `krize_rozvrat` při stabilitě < 15, zpráva o hladu. Desítky textů v rodě podle pohlaví krále/vládce (`{K:…}`, `{king.Title}`, `{R:…}`), rod se zadává v 2. pádě („z rodu Dvořáků“). Během regentství a povstání král sám nejedná (`kingHelpless`, `KING_ACTS`); dobyté Marky nevyhlašují válku (`MARCHES_ABROAD`); protivník ve válce nesílí; válečné události se neopakují a po 100 % válka hned končí. Výnos roku: „Letos nic neměnit“ = `decreeSkip`, výsledek ukazuje zlato. Konce a úspěchy za cizí korunu a císaře. Zbývá S13–S16 a test sedláka.
- **Rodina podle hráče** (přání: začít bez manželky a dítěte, vztah z rozhovorů, dítě jen z vlastní volby, víc dětí různého pohlaví): žádné samovolné těhotenství; dítě jen z rozhovoru s manželem/kou (*Toužit spolu po dítěti*) nebo z volby ve scéně `touha_po_diteti` („Večer u ohně“: ano / ještě ne / dětí máme dost → `flags.no_more_children`, platí jen dokud žije vlastní dítě). Váha události může být funkce (`weight: (s) => …`): rodu bez vlastního dědice se scéna i dohazovač nabízejí častěji. Nový vládce po nástupu je svobodný, pokud ho hráč jako dědice neoženil (`flags.heir_married`) — pak má i děti z let manželství. Sourozenci zůstávají (`state.siblings`, v Rodině „Bratr/Sestra“); nejstarší drží místo dědice (`heir.presumptive`), dokud se nenarodí vlastní dítě. Vymírání rodu u bota, který nemluví: ~5 %.
- **Další opravy z testu:** rady zohledňují nedostatek (hladové vojsko nezbrojí, `need()` v `council.js`), Síň předků nevypisuje rutinní scény (`ROUTINE_SCENES`), vládce v poli nepořádá hostiny ani soudy (`AT_COURT`), jedna rána = nejvýš jedno trvalé zranění, karta dobytí cizí koruny `kapitola_cizi_koruna` (tokeny `{conquest.*}`, větev `realm: { conquest: … }`).
- **Ženy, milenky, levobočci, vedlejší větev** (přání uživatele): nová hra je vždy za muže (formulář bez volby pohlaví; dcery mohou dědit později). Sedlák začíná s 1–3 mladšími sourozenci (`state.siblings`). V listu postavy galerie žen s portréty (`.cs-suitors`): svobodný má na výběr 5, ženatý 3 „ženy v okolí“; každá má náklonnost i věrnost (`loyalty`). Rozhovory (`talk.js`): od náklonnosti 35 svést, od 50 nabídnout poměr (`nam_milenka` → `lover: true`), s milenkou strávit noc / chtít dítě (`mil_dite` → `state.loverPregnancy`) / ukončit poměr; žádost o ruku jen svobodný, od náklonnosti 75 jistá. Dítě milenky = levoboček (`state.bastards`, událost `narozeni_levobocka`: uznat / tajně / do kláštera; větve `acknowledge`, `bastardAway`, token `{B:…}`, `{bastard.*}`). Zanedbaná milenka chladne a může poměr prozradit (manžel/ka −20 věrnosti). Pořadí dědiců: dědic → mladší děti → sourozenci (`presumptive`) → uznaný levoboček. Když nastoupí sourozenec nebo levoboček, rod pokračuje jako **vedlejší větev** (`state.cadetBranch`, legitimita −10, prestiž −5, plaketa „vedlejší větev“, věta v `nastupnictvi` přes `{succession.note}`, `{predecessor.rel}`); bez nikoho rod vymírá. Jména: 40 mužských a 36 ženských, bývalé nápadnice se nevracejí (`pastSuitorNames`).
- **Příběhy z cizích zemí** (`events_foreign.js`): řetězy 3–5 navázaných událostí. Další krok čeká na příznak z předchozí volby a na odstup od předchozího kroku (`eventHistory`, 2–12 období), je `oneTime` a má vyšší váhu (5 u sedláka a šlechtice, 10 u krále), aby se nit neztratila; začátky mají váhu 0,5–1 a objeví se zhruba jednou za stupeň. Dřívější volby mění, které volby se nabídnou později.
  - *Sedlák:* `zenon_1` Kupec v blátě → (`zenon_pritel`/`zenon_znamy`) `zenon_2` Zapečetěná truhla → (`zenon_truhla`, `zenon_vi`/`zenon_pecet`) `zenon_3` Drábova prohlídka → `zenon_dluh`; krádež (`zenon_okraden`) vede na `zenon_2b` Ztracený balík. `sever_1` Zvěsti z hor (`sever_zvest` + `sever_skrys`/`sever_hradba`/`sever_pan`) → `sever_2` Cizinec ve sněhu (`sever_host`/`sever_vydan`) → `sever_3` Nájezdníci ze severu (skrýš, připravená ves a ošetřený Severan otevírají volby; `sever_znameni`).
  - *Šlechtic:* `racci_1` Racčí ostrov (spor s markrabětem Dětřichem z Marek, `racci`) → `racci_2` Pašeráci v zátoce (`racci_podil`/`racci_zabaveno`/`racci_udal`) → `racci_3` Schůzka na ostrově (dělba, zasnoubení dědice = `heir_married`, vydírání, souboj; `racci_mir`) → `racci_4a` Výběrčí v přístavu (vzal podíl) nebo `racci_4b` Dar z Marek (`marky_pritel`). `bjarn_1` Host z hor (spojenec / obchod / zrada; se `sever_znameni` pobratimství) → `bjarn_2` Válka v horách (`bjarn_vitez`/`bjarn_padl`) → `bjarn_3a` Pán průsmyků (`bjarn_pritel`), `bjarn_3b` Lidé od Bílé řeky, nebo `bjarn_3c` Dar ze severu.
  - *Král:* `jih_1` Purpurové plachty (smlouva s Jižní říší; se `zenon_dluh` místo ní `jih_1z` Starý známý z jihu) → `jih_2` Bankéři z Purpurového města (`jih_pujcka`) → za 3 roky `jih_3a` Den splatnosti → při neplacení (`jih_dluznik`) `jih_4` Galéry před přístavem; se smlouvou a bez půjčky `jih_3b` Pozvání do Purpurového města (dědic na jižní dvůr). **Boj o cizí trůn** `trun_<east|north|south>_*`: když v cizí zemi nastoupí nový vládce (`realms.js` zapisuje `realm.changed`), do 8 období přijde nápadník (`realm.claimant`, jméno losuje `onPick`) → podpora zlatem / vojskem / přes starého přítele (`marky_pritel`, `bjarn_pritel`, `zenon_dluh`) / uznání / „host“ → `_2` válka o trůn (hod; vítěz se stane vládcem té země v `markSeen`) → `_3a` vděčný vládce, `_3b` pomsta, `_3c` host ve věži (propuštění vrací příběh ke kroku 2). Naráz jen jeden takový příběh (další nejdřív 24 období po začátku předchozího). Válku příběhy nezačínají, mění jen vztah a sílu země (`realm`); o zemi, kterou hráč drží nebo s ní válčí, se nevyprávějí.
  - Simulace (`SMART=0.4`, 300 kronik): Zénon začne v ~75 % her (truhla ~25 %, prohlídka ~20 %), nájezd ze severu ~60 % (dokončen ~50 %), Racčí ostrov ~85 % (4. krok ~80 %), Bjarn ~75 % (konec ~65 %), jižní poselstvo ~70 % (splatnost ~60 %, blokáda ~40 %), boj o trůn pro každou zemi ~45 % (válka o trůn ~12 %). Mezi kroky obvykle 6–13 období.
- **Dědické právo** (přání uživatele: syn předchází dceři, pokud hráč nerozhodne jinak): výchozí zvyk `state.heirPolicy` (jinak „male“): narodí-li se syn, když je dědičkou dcera, stane se dědicem syn a dcera přejde mezi děti (`state.lastSwap`, volná událost `dedicke_pravo`: nechat syna / ponechat dceru → `keepDaughter`, nastaví politiku „eldest“). Po smrti dědice nastupuje nejdřív nejstarší syn (`nextHeir` řadí muže první, pokud je politika „male“). Hráč může kdykoli určit jiné dítě dědicem v listu postavy u dítěte (tlačítko `make-heir`, `makeHeir` v `family.js`); volba dcery před synem přepne politiku na „eldest“, volba syna před dcerou na „male“.
- **Rozvod a dospělé portréty:** v rozhovoru s manželem/kou téma *Navrhnout rozvod* (`rozvod`, dvě kliknutí; nejde při těhotenství). `divorce()` v `family.js`: partner odejde (`state.spouse` = prázdné místo `divorced: true`, záznam v `state.exSpouses`), děti zůstávají; víra, prestiž (u šlechtice a krále i legitimita) klesají, rod nebo říše partnera ochladne o 30, dědicova věrnost −6. Později jde znovu hledat partnera (galerie žen). Portréty: od 17 let (`ADULT_AGE` v `character.js`) mají děti, sourozenci a levobočci `adult_<s|n>_<male|female>_<0|1>.jpg` (dávka R8), do dodání je zastoupí dospělý portrét (`spouse_male`/`s_spouse_male`, dcery `ruler_*_female`).
- Zbývající drobnosti z auditu: `docs/analyza-logiky.md`. Obrázky kariéry (`docs/obrazky-kariera.md`) jsou všechny dodané: scény kapitol a povstání, císař a císařovna (`ruler_emperor_*`, bez nich nosí portrét krále), cizí panovníci (`realm_<země>_<pohlaví>.jpg`) a mapa světa.

### Hospodářství gruntu (`js/farm.js`)
- Grunt má konkrétní zásoby `state.farm = { grain, cows, horses, pigs }` (vznikne sám při prvním použití; staré hry dostanou krávu za postavený chlév a koně za koupeného jezdeckého koně). Stavby gruntu dávají **místo** a **výnosy** podle tabulky `FARM_WORKS`: stodola pojme 12 pytlů obilí (bez ní 4 na půdě, co se nevejde, zplesniví), nový **mlýn** (`mlynek`, 12 grošů, od úrovně Grunt) dá 1 pytel každé období, **chlév** 3 krávy (první krávu přivede při dostavbě; místo dřívějších abstraktních +3 zásob za rok), nová **stáj** (`staj`, 8 grošů) 3 koně, nový **chlívek** (`chlivek`, 4 groše) 4 prasata (přivede prasnici).
- Výnosy (`processFarm`, volá ho `advanceTurn` po stavbách): kráva zásoby +1 každé období kromě zimy a na jaře 50 % na tele, je-li místo; kůň obilí +2 na jaře (orba) a +1 na podzim (svážení); prasnice na jaře 1–2 selata (75 %), v zimě zabijačka od dvou prasat (zásoby +4). Když zásoby klesnou pod 15, domácnost sama semele obilí (pytel = zásoby +2).
- Na gruntu v panelu **Hospodářství** jde koupit a prodat zvířata jen do volného místa (kráva 5/3 groše, kůň 10/6, prase 3/2) a prodat pytel obilí za 1 groš nebo ho semlít do zásob. Je to správa, ne příběhová volba — u voleb v událostech se nic neukazuje.
- Jezdecký kůň sedláka je jeden z koní gruntu: u kováře ho koupí jen se stájí a volným místem, prodej posledního koně vezme i jezdeckého. Při povýšení do šlechtického stavu se zásoby prodají se gruntem (jezdecký kůň jde s vládcem), při zpustnutí gruntu (chalupa) zmizí.
- Příběh: větev `farm: { cows: -1, grain: -99 }` mění zásoby (nemoc v chlévě, požár stodoly), práce „Přikoupit krávu“ přidá krávu, je-li v chlévě místo.
- Simulace: `FARM=1` zapne v `sim_peasant.mjs` a `sim_career.mjs` jednoduché pravidlo `farmRule` (`smart.mjs`): stavět chlév, stáj, mlýn a chlívek, plnit výběhy a prodávat přebytečné obilí. Bez `FARM=1` boti grunt nestaví a vyvážení je jako dřív.

## 5. Obrázky — jak to funguje a co chybí

**Hra si obrázky hledá sama** podle názvu souboru, když chybí, použije zálohu:

- scény: `assets/events/<id>_<male|female>.jpg` → `<id>.jpg` → `event.image` → `scene_default.jpg`
- portrét vládce: `assets/portraits/ruler_<peasant|freeman|minor_noble|noble|king>_<g>[_old].jpg` (stará verze od 55 let)
- dvůr: `assets/portraits/<role>_<g>.jpg`, u sedláka `s_<role>_<g>.jpg`
- konce: `assets/endings/ending_<typ>.jpg`; karty scénářů `assets/ui/scenario_<klíč>.jpg`

**Cílové formáty:** portréty 1024 × 1280 (4:5), scény 1024 × 1024, konce 1365 × 768.
Originály se ukládají do `assets/_source/gemini/<dávka>/`.

**Typická vada generátoru:** do spodní části (≈ 59–75 % výšky) vloží tmavý
pás, někdy dokonce jiný výřez obrazu. Pás buď vede až dolů, nebo zase skončí
(dávka kariéry: 59–84 %); `detect` vypíše i řádek konce a `place` s `FIX=` opraví
jen pás (zesvětlení plynule mezi horní a dolní hranou). `tools/images/process_batch.py` ho najde
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
| Sedlák, rozumný hráč (`smart.mjs`) | práce na gruntu jen z příběhu (podzimní událost `s_prace_na_gruntu`), 35 % chybných voleb | zkrachovalý grunt ~2 % (bez podzimní události 23 %), erb medián rok ~21 |
| Sedlák, napůl chybující hráč | 60 % chybných voleb | zkrachovalý grunt ~23 % (bez podzimní události ~50 %) |
| Celá kronika, rozumný hráč | `SMART=0.4 sim_career.mjs 300 0.7` (po druhém kole) | svobodník 100 % (r. 7), erb 100 % (r. 20), velmož (r. 22), koruna ~91 % (r. 42), poprava ~2 % |
| Sedlák podle povahy pána | `natures.mjs` (scratch), 60 % / 100 % náhodných voleb | spravedlivý 1 % / 30 %, krutý 2 % / 52 %, chamtivý 7 % / 65 % zpustlých gruntů |
| Celá kronika | `sim_career.mjs`, ambice 0,7 (náhodné volby) | svobodník ~90 % (rok ~10), erb ~50 % (rok ~25), významný šlechtic ~48 %, koruna ~30–34 % (rok ~65); nejčastější konec je zpustlý grunt (~45 %) |
| Šlechtic | cílí na trůn (ambice 1), neobchoduje | trůn ~42–55 %, poprava ~35 % (noví králové teď mívají dospělé dědice, nárok je těžší; povstání bot nepoužívá) |
| Sedlák | ambice 0,5 | šlechtický stav ~45–50 %, svoboda kolem 10. roku, medián ~25 let; zbytek hlavně zpustlý grunt |
| všechny | s obchodováním | mírné zlepšení, obchod hru nerozbíjí |
| Panovník | staví všechno, co jde (bot ve scratchpadu) | zlatý věk ~49 %, kolaps ~25 % (bez stavění ~39 % / ~40 %) |
| Šlechtic | staví všechno, co jde (náhodné volby) | trůn ~25 % → ~42 %, poprav ubude |
| Sedlák | staví všechno, co jde (ambice 0) | šlechtický stav ~9 % → ~31 %, zpustlý grunt 84 % → 60 % |

Hlavní páky: šance u `n_smrt_krale` (Šlechtic), ceny `s_vykup` a `s_zemansky_statek`
a šance rytířské bitvy (Sedlák), ekonomika v `processPeasantEconomy` a `processTurnEconomy`.

---

## 7. Pracovní pravidla a přání uživatele

- **Komunikace česky**, krátce a srozumitelně; po práci říct, co se změnilo a co je potřeba od uživatele.
- **Obrázky zapracovat hned**, jakmile přijdou (zip i jednotlivé soubory); názvy nemusí sedět, třídit podle obsahu.
- **Prompty dávkově** a samostatné (uživatel je posílá do AI bez přístupu k repozitáři).
- **Hlavní menu = původní rytina**, nic na něm neměnit; žádné červené zvýraznění klikacích míst.
- **Důsledky voleb skryté** (žádné náhledy efektů ani růstu vlastností u voleb).
- **Žádné tutoriálové rady** ani vyskakovací nápovědy — uživatel je nechce.
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
- Válka: ztráta kraje může přijít i jako protiútok po porážce; spojenci, kteří pošlou posily; obrázky válečných scén (sekce 19 promptů).
- Ambice: víc cílů a ambice pro dědice a rádce; úspěchy za konkrétní rozhodnutí v událostech.
- Stavění: rada, která doporučuje stavby, další události o stavbách (hlavně pro Sedláka), ozvěny navázané na stavby a obrázky budov (sekce 16 promptů).
