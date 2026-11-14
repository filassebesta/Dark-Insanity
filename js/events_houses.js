// The great houses among themselves and toward the player: feuds, weddings, revolts, the special trades of the five newer houses
// (Jelenové z Doubravy, páni z Kamenného Kříže, Říční páni z Přívozu, Jezdci z Pustého Pole, páni z Právova)
// and — for the king — the vassals' demands, the revolt of an over-mighty house and fiefs.
//
// Houses live in state.houses (houses.js); their relations to one another in house.rel. Events about two houses
// use the context { house, house2 } (pickPair in houses.js): tokens {house.*} and {house2.*}, gender forms {H:…|…} and {J:…|…},
// effects houseEffects { target, target2 } and houseRel (how the pair stands after the choice).
// Branch effects specific to houses (engine.js): houseEffects { fief: true, rebel: true|false }.
// The stories that read "tvůj" king (`{king.*}`) belong to the noble only — a king has no king above him.

import { pickPair, houseLanded } from './houses.js';

const NOBLE = 'slechtic';
const KING = 'panovnik';
const BOTH = [NOBLE, KING];
const img = (id) => `assets/events/${id}.jpg`;

const present = (s, id) => (s.houses || []).some((h) => h.id === id);
const one = (id) => (s) => (present(s, id) ? id : null);
const randomHouse = (s) => (s.houses && s.houses.length ? s.houses[Math.floor(Math.random() * s.houses.length)].id : null);
const landedHouse = (s) => {
  const pool = (s.houses || []).filter((h) => houseLanded(s, h));
  return pool.length ? pool[Math.floor(Math.random() * pool.length)].id : null;
};
const aloneWith = (id, min = 20) => (s) => { const h = (s.houses || []).find((x) => x.id === id); return !!h && h.power > min && houseLanded(s, h); };
const kingAtHand = (s) => !!(s.king && s.king.alive) && !s.flags.rebellion;
const gold = (n) => (s) => s.resources.gold >= n;
const friendsOf = (s) => (s.houses || []).filter((h) => h.ally || h.married).length;

const EVENT_LIST = [
  // ===================== THE HOUSES AMONG THEMSELVES =====================

  {
    id: 'h_spor_o_hranici',
    scenario: NOBLE, cooldown: 24, minTurn: 8,
    target: (s) => pickPair(s, (a, b, r) => r <= -25 && houseLanded(s, a) && houseLanded(s, b)),
    image: img('n_spor_o_hranici'),
    title: 'Spor o hraniční potok',
    text: 'Rod {house.gen} a rod {house2.gen} se přou o hraniční potok a o louky na jeho březích. Včera se tam střetly dvě družiny, dnes už padly první rány a oba rody posílají posly k tobě. {house.HeadTitle} {house.head} žádá, abys potvrdil jeho právo. {house2.HeadTitle} {house2.head} žádá úplně totéž.',
    choices: [
      {
        label: 'Svolat oba rody k jednomu stolu',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.45, traitKey: 'eloquence', traitScale: 0.04,
        onSuccess: { effects: { prestige: 5 }, houseEffects: { target: { attitude: 7 }, target2: { attitude: 7 } }, houseRel: 28, traitGain: 'eloquence', chronicle: 'U jednoho stolu v síni rodu {dynastyName} se oba rody dohodly. Potok teď patří napůl těm i oněm a nikdo nikomu nedluží krev.' },
        onFailure: { effects: { prestige: -3 }, houseEffects: { target: { attitude: -5 }, target2: { attitude: -5 } }, houseRel: -10, chronicle: 'Smír se rozpadl při prvním přípitku. Oba rody odjely s pocitem, že rod {dynastyName} měl mlčet.' },
      },
      {
        label: 'Podpořit rod {house.gen}',
        hintType: 'resource', hintKey: 'prestige',
        effects: { prestige: 1 },
        houseEffects: { target: { attitude: 12, power: 2 }, target2: { attitude: -12 } },
        houseRel: -15,
        chronicle: 'Rod {dynastyName} potvrdil právo rodu {house.gen} k potoku. Rod {house2.gen} si to zapamatuje.',
      },
      {
        label: 'Podpořit rod {house2.gen}',
        hintType: 'resource', hintKey: 'prestige',
        effects: { prestige: 1 },
        houseEffects: { target2: { attitude: 12, power: 2 }, target: { attitude: -12 } },
        houseRel: -15,
        chronicle: 'Rod {dynastyName} se postavil za rod {house2.gen}. Rod {house.gen} se odvrátil a bude chtít odplatu.',
      },
      {
        label: 'Dolít oleje do ohně a dívat se z povzdálí',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.5, traitKey: 'intelligence', traitScale: 0.04,
        onSuccess: { noble: { secrets: 1 }, houseEffects: { target: { power: -5 }, target2: { power: -5 } }, houseRel: -25, traitGain: 'intelligence', chronicle: 'Pár dobře zvolených slov ve správných uších a z potoka je krvavá hranice. Oba rody slábnou. Nikdo netuší, kdo to rozdmýchal, a rod {dynastyName} se dozvěděl o obou víc, než by se mu hodilo mlčet.' },
        onFailure: { effects: { prestige: -3 }, houseEffects: { target: { attitude: -8 }, target2: { attitude: -8 } }, chronicle: 'Dopis zachytil písař rodu {house.gen}. Obě strany teď vědí, kdo dolíval olej do ohně.' },
      },
    ],
  },

  {
    id: 'h_svatba_rodu',
    scenarios: BOTH, cooldown: 28, minTurn: 8,
    target: (s) => pickPair(s, (a, b, r) => r >= 45),
    image: img('n_snatkova_nabidka'),
    title: 'Svatba dvou rodů',
    text: 'Rod {house.gen} a rod {house2.gen} se po letech smluv a výhrůžek chystají k sňatku. Nevěsta už má věno, ženich koně, hostina je objednaná na tři dny a pozvání dorazilo i k tobě. Všichni vědí, že tahle svatba není jen o lásce: z obou rodů bude jedna strana a kdo u ní nebude stát, bude proti ní.',
    choices: [
      {
        label: 'Přijet s dary a požehnat svatbě',
        requires: gold(8),
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -8, prestige: 3 },
        houseEffects: { target: { attitude: 8, power: 3 }, target2: { attitude: 8, power: 3 } },
        houseRel: 12,
        chronicle: 'Rod {dynastyName} dorazil se stříbrnými poháry a dobrým slovem. Obě rodiny to ocenily. Pouto mezi nimi je teď tak pevné, že se ho nikdo nezeptá, co o něm soudí.',
      },
      {
        label: 'Poslat jen posla s pozdravem',
        hintType: 'resource', hintKey: 'prestige',
        effects: { prestige: -1 },
        houseEffects: { target: { attitude: 1 }, target2: { attitude: 1 }, },
        houseRel: 15,
        chronicle: 'Svatba proběhla bez rodu {dynastyName}. U stolu se o jeho prázdném místě mluvilo víc, než by se mu líbilo.',
      },
      {
        label: 'Využít svatby k vlastním jednáním',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.4, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { prestige: 4 }, houseEffects: { target: { ally: true, attitude: 10 }, target2: { attitude: 5 } }, houseRel: 12, traitGain: 'eloquence', chronicle: 'Mezi tanci, sklenicemi a přípitky se rodu {dynastyName} podařilo přesvědčit hlavu rodu {house.gen}. Z hostiny odjíždí spojenectví a o něco těžší kapsa.' },
        onFailure: { effects: { prestige: -3 }, houseEffects: { target: { attitude: -6 }, target2: { attitude: -6 } }, houseRel: 8, chronicle: 'Jednání o spojenectví na cizí svatbě se nehodilo. Hosté viděli, jak hlava rodu {house.gen} otočila hlavu, a pochopili.' },
      },
    ],
  },

  {
    id: 'h_rodova_valka',
    scenarios: BOTH, cooldown: 24, minTurn: 10,
    target: (s) => pickPair(s, (a, b, r) => r <= -50),
    image: img('hranicni_kamen'),
    title: 'Krev na hranici rodů',
    text: 'Mezi rodem {house.gen} a rodem {house2.gen} došlo ke krveprolití. Kdo přežil, tvrdí, že druhá strana začala. Vypálená stodola, zabitý pacholek, ukradený dobytek, a teď už i dva mrtví rytíři. {house.HeadTitle} {house.head} i {house2.headTitle} {house2.head} žádají o pomoc. Píší zdvořile a každý o jiném viníkovi, jak se to na urozené sluší.',
    choices: [
      {
        label: 'Poslat muže na pomoc rodu {house.gen}',
        requires: (s) => s.resources.army >= 12,
        hintType: 'resource', hintKey: 'army',
        effects: { army: -6, prestige: 2 },
        houseEffects: { target: { attitude: 14, power: 4 }, target2: { attitude: -10, power: -10 } },
        houseRel: -15,
        chronicle: 'Družina rodu {dynastyName} dorazila na hranici včas. Rod {house2.gen} ustoupil. Rod {house.gen} děkuje a rod {house2.gen} neodpouští.',
      },
      {
        label: 'Vyhlásit příměří a postavit na hranici stráže',
        requires: gold(8),
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -8, prestige: 3 },
        houseEffects: { target: { attitude: 4 }, target2: { attitude: 4 } },
        houseRel: 25,
        chronicle: 'Strážní věže rodu {dynastyName} oddělily obě družiny. Nikdo nebyl spokojen, a právě proto se příměří drží.',
      },
      {
        label: 'Nechat je vykrvácet',
        hintType: 'trait', hintKey: 'patience',
        houseEffects: { target: { power: -8 }, target2: { power: -8 } },
        houseRel: -8,
        chronicle: 'Rod {dynastyName} se nemíchal do cizí krve. Oba rody zeslábly a hranice se uklidnila, ne ale smírem.',
      },
    ],
  },

  {
    id: 'h_rod_proti_koruna',
    scenario: NOBLE, cooldown: 28, minTurn: 14,
    requires: kingAtHand,
    target: (s) => {
      const pool = (s.houses || []).filter((h) => h.power >= 55 && h.attitude < 70 && !h.married);
      return pool.length ? pool[Math.floor(Math.random() * pool.length)].id : null;
    },
    image: img('vzpoura_v_provincii'),
    title: 'Rod se vzbouřil proti králi',
    text: 'Rod {house.gen} odmítl poslat berni i muže a zavřel brány svého sídla {house.seat}. {king.Title} {king.name} svolává šlechtu a pozvedá korouhev. {house.HeadTitle} {house.head} posílá posla i k tobě: „Postav se při nás, nebo budeš příště na řadě sám.“ Za zdmi se hlídky střídají každou hodinu, v krčmách se vsází, kdo to vyhraje, a dvůr se dívá na tebe.',
    choices: [
      {
        label: 'Přidat se ke vzbouřencům',
        hintType: 'resource', hintKey: 'legitimacy',
        effects: { favor: -22, legitimacy: 4, prestige: -2 },
        noble: { plot: 1 },
        houseEffects: { target: { attitude: 20, ally: true, power: 4 } },
        chronicle: 'Rod {dynastyName} se přidal k rodu {house.gen}. U dvora se o něm teď mluví jako o zrádci, v sídle rodu {house.gen} jako o nejvěrnějším příteli.',
      },
      {
        label: 'Postavit se na stranu koruny',
        requires: (s) => s.resources.army >= 10,
        hintType: 'resource', hintKey: 'army',
        effects: { army: -6, favor: 16, prestige: 4 },
        houseEffects: { target: { attitude: -18, power: -10 } },
        chronicle: 'Rod {dynastyName} se postavil po boku {K:krále|královny} a pomohl zlomit odboj. Rod {house.gen} přišel o hrad i o iluze. {king.Title} si to zapsal{K:|a}.',
      },
      {
        label: 'Zprostředkovat smír mezi králem a rodem',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.4, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { favor: 8, prestige: 6 }, houseEffects: { target: { attitude: 8 } }, traitGain: 'eloquence', chronicle: 'Rod {dynastyName} jezdil mezi tábory tři dny, než padlo slovo „smír“. {king.Title} i rod {house.gen} mu ho nezapomenou.' },
        onFailure: { effects: { favor: -6, prestige: -3 }, houseEffects: { target: { attitude: -4 } }, chronicle: 'Obě strany poslaly vyslance zpátky s tvrdými slovy. Rod {dynastyName} zůstal sám mezi nimi.' },
      },
      {
        label: 'Zůstat stranou a prodávat obilí oběma táborům',
        requires: (s) => s.resources.food >= 12,
        hintType: 'resource', hintKey: 'gold',
        effects: { food: -10, gold: 14, favor: -4 },
        houseEffects: { target: { attitude: -3 } },
        chronicle: 'Vozy rodu {dynastyName} jezdily k oběma táborům. Pokladna se zaplnila, čest ne.',
      },
    ],
  },

  {
    id: 'h_nova_hlava',
    scenarios: BOTH, cooldown: 24, minTurn: 12,
    target: (s) => {
      const pool = (s.houses || []).filter((h) => h.head.age >= 56);
      return pool.length ? pool[Math.floor(Math.random() * pool.length)].id : null;
    },
    image: img('stary_rytir_umira'),
    title: 'Stará hlava rodu',
    text: '{house.HeadTitle} {house.head} z rodu {house.gen} je starý a nemocný. Lékaři kroutí hlavami a v sídle {house.seat} se šeptá, kdo ho nahradí: starší syn, který je rozvážný a šetrný, nebo mladší, který se rád hádá a ještě radši bojuje. Oba už rozeslali posly k sousedům. Kdo tuhle chvíli dobře využije, získá rodu přítele nebo nepřítele na celé generace.',
    choices: [
      {
        label: 'Poslat poselstvo s dary a účastí',
        requires: gold(6),
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -6, prestige: 2 },
        houseEffects: { target: { attitude: 10 } },
        chronicle: 'Poselstvo rodu {dynastyName} dorazilo včas a s úctou. Hlava rodu {house.gen} na něj nezapomene. A ti, kdo ji nahradí, také ne.',
      },
      {
        label: 'Tajně podpořit rozvážného staršího syna',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.5, traitKey: 'intelligence', traitScale: 0.04,
        onSuccess: { noble: { secrets: 1 }, houseEffects: { target: { attitude: 15 } }, traitGain: 'intelligence', chronicle: 'Rozvážný syn vyhrál. Ví komu za to děkovat a nepovídá to nahlas. Mladší bratr odjel na pohraničí a mlčí.' },
        onFailure: { houseEffects: { target: { attitude: -15 } }, effects: { prestige: -2 }, chronicle: 'Mladší syn vyhrál a zjistil, kdo mu stál v cestě. Rod {house.gen} má novou hlavu a rod {dynastyName} nového nepřítele.' },
      },
      {
        label: 'Nevměšovat se',
        hintType: 'trait', hintKey: 'patience',
        chronicle: 'Rod {dynastyName} nechal rod {house.gen} dohádat se o dědictví sám. Čas ukáže, co z toho bude.',
      },
    ],
  },

  // ===================== THE SPECIAL TRADES OF THE NEWER HOUSES =====================

  {
    id: 'h_les_hajenky',
    scenarios: BOTH, cooldown: 30, minTurn: 6,
    target: one('jelenove'), requires: aloneWith('jelenove'),
    image: img('zastava_lesa'),
    title: 'Hájenky v hvozdu',
    text: '{house.HeadTitle} {house.head} z rodu {house.gen} posílá posla z Doubravy: v hvozdu je dřevo, které zbaví sýpky hniloby a postaví stodoly pro půl kraje, a rod je ochoten ho prodat. Chce za to dvě věci: právo honu na tvých pozemcích a slib, že tvoji lidé nebudou v jejich lese klást oka na zvěř. Lesníci rodu se na tvé poddané dívají s nedůvěrou, a to oboustranně.',
    choices: [
      {
        label: 'Přistoupit na dohodu o dřevě a honu',
        requires: gold(6),
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -6, food: 5 },
        provinceEffects: { own: { wealth: 4 } },
        houseEffects: { target: { attitude: 10 } },
        chronicle: 'Z hvozdu přijely vozy s prkny a trámy a z tvých polí se na oplátku stal hon rodu {house.gen}. Obě strany mlčí, ale s úsměvem.',
      },
      {
        label: 'Pozvat rod na velký hon',
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.5, traitKey: 'strength', traitScale: 0.04,
        onSuccess: { effects: { prestige: 5, food: 8 }, houseEffects: { target: { attitude: 14 } }, traitGain: 'strength', chronicle: 'Medvěd, kterého nikdo nechtěl, padl rukou rodu {dynastyName}. Večer se u ohně zpívalo a dřevo bylo zadarmo.' },
        onFailure: { effects: { prestige: -2, army: -2 }, houseEffects: { target: { attitude: -4 } }, chronicle: 'Při honu zahynul honec a rod {house.gen} se smál víc, než by se hodilo. Dřevo se bude kupovat za plnou cenu.' },
      },
      {
        label: 'Odmítnout. Les patří tomu, kdo ho kácí',
        hintType: 'resource', hintKey: 'prestige',
        effects: { prestige: 1 },
        houseEffects: { target: { attitude: -8 } },
        chronicle: 'Rod {dynastyName} pokynul poslovi, aby odjel. Příští jaro se dřevo draží a nikdo neví proč.',
      },
    ],
  },

  {
    id: 'h_kriz_desatek',
    scenarios: BOTH, cooldown: 30, minTurn: 6,
    target: one('kriz'), requires: aloneWith('kriz'),
    image: img('biskupuv_desatek'),
    title: 'Opat z Kamenného Kříže',
    text: 'Opat kláštera na panství rodu {house.gen} přijel osobně. Kostel prý hnije, odpustky se prodávají špatně a víra v kraji chladne. Žádá, abys podepsal listinu o nových desátcích: každý desátý snop klášteru a každý desátý pytel chudým. {house.HeadTitle} {house.head} z rodu {house.gen} stojí vedle opata a mlčí tak, jak se mlčí, když se čeká na správnou odpověď.',
    choices: [
      {
        label: 'Podepsat a požádat o požehnání',
        hintType: 'resource', hintKey: 'faith',
        effects: { faith: 8, gold: -4 },
        provinceEffects: { own: { unrest: 3 } },
        houseEffects: { target: { attitude: 12 } },
        chronicle: 'Rod {dynastyName} podepsal listinu o desátcích a opat vykropil svěcenou vodou tvrz i sýpku. Lid brumlá, ale chodí do kostela.',
      },
      {
        label: 'Smlouvat o menším desátku',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.45, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { faith: 4, gold: -2 }, houseEffects: { target: { attitude: 6 } }, traitGain: 'eloquence', chronicle: 'Po třech hodinách přesvědčování se opat spokojil s polovinou. Rod {dynastyName} to považuje za výhru, klášter za zbožnost.' },
        onFailure: { effects: { faith: -3, prestige: -2 }, houseEffects: { target: { attitude: -6 } }, chronicle: 'Opat vyslechl rod {dynastyName} se zavřenýma očima a odešel bez podpisu. U zpovědnice se o něm teď šeptá.' },
      },
      {
        label: 'Odmítnout. Poddaní už platí dost',
        hintType: 'resource', hintKey: 'faith',
        effects: { faith: -6 },
        provinceEffects: { own: { loyalty: 4 } },
        houseEffects: { target: { attitude: -10 } },
        chronicle: 'Rod {dynastyName} odmítl nový desátek. Poddaní si oddechli, opat prý zakazuje zvonění. Víra v kraji chladne, nevole ne.',
      },
    ],
  },

  {
    id: 'h_ricane_myto',
    scenarios: BOTH, cooldown: 30, minTurn: 6,
    target: one('ricane'), requires: aloneWith('ricane'),
    image: img('f_myto_na_moste'),
    title: 'Mýto na řece',
    text: 'Říční páni z Přívozu zvýšili mýto na přívozech i pod věží. Každý vůz, který přejede Brodnici, platí o třetinu víc, kupci nadávají a na trhu v Brodu se prodává hůř. {house.HeadTitle} {house.head} z rodu {house.gen} tvrdí, že řeku je třeba hlídat, že stráže se musí platit a že mýto nikdy nebylo tak nízké jako teď. U věže vždy najdeš dva lidi: jednoho, který se hádá, a druhého, který platí.',
    choices: [
      {
        label: 'Vyjednat dělené mýto',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.45, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { gold: 6, prestige: 2 }, houseEffects: { target: { attitude: 6 } }, tradeMod: { dest: 'brod', mult: 1.15, turns: 8 }, traitGain: 'eloquence', chronicle: 'Část mýta teď plyne i tvému rodu a vozy jedou bez zdržování. Rod {house.gen} šeptá, že tak laciný obchod ještě nezažil.' },
        onFailure: { effects: { prestige: -2 }, houseEffects: { target: { attitude: -5 } }, tradeMod: { dest: 'brod', mult: 0.85, turns: 8 }, chronicle: 'Rod {house.gen} jednal zdvořile a nedal nic. Mýto zůstává a trh v Brodu dýchá hůř.' },
      },
      {
        label: 'Zaplatit si výjimku pro vlastní vozy',
        requires: gold(10),
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -10 },
        houseEffects: { target: { attitude: 8 } },
        chronicle: 'Vozy rodu {dynastyName} teď projíždějí přívozem zdarma. Ostatní platí a mají proč závidět.',
      },
      {
        label: 'Postavit vlastní brod níž po proudu',
        requires: gold(14),
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -14, prestige: 2 },
        provinceEffects: { own: { wealth: 5 } },
        houseEffects: { target: { attitude: -12, power: -3 } },
        tradeMod: { dest: 'brod', mult: 1.1, turns: 10 },
        chronicle: 'Nový brod stojí a lidé jím jezdí. Rod {house.gen} to bere jako vyhlášení války na vodě, zatím jen na papíře.',
      },
    ],
  },

  {
    id: 'h_pustopolci_kone',
    scenarios: BOTH, cooldown: 30, minTurn: 6,
    target: one('pustopolci'), requires: aloneWith('pustopolci'),
    image: img('vojenska_prehlidka'),
    title: 'Koně z Pustého Pole',
    text: 'Jezdci z Pustého Pole přihnali k tvým ohradám stádo hřebců, jaké se v zemi dávno neviděly: šedých, vraných i plavých, jako by je stepní vítr nakreslil. {house.HeadTitle} {house.head} z rodu {house.gen} nabízí prodej. Chce ale víc než zlato: pár mladých chlapců z tvé družiny, aby se u nich naučili jezdit po jejich způsobu. Prý je to otázka vzájemné důvěry. Prý.',
    choices: [
      {
        label: 'Koupit stádo za hotové',
        requires: gold(15),
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -15, army: 8 },
        houseEffects: { target: { attitude: 8 } },
        chronicle: 'Stádo se zabydlelo na pastvinách rodu {dynastyName}. Jezdci z Pustého Pole odjeli se zlatem a s poznámkou, že příště nabídnou lepší koně.',
      },
      {
        label: 'Poslat jim chlapce na výcvik',
        hintType: 'resource', hintKey: 'army',
        effects: { army: 5, prestige: 2 },
        houseEffects: { target: { attitude: 12, power: 3 } },
        chronicle: 'Chlapci se po roce vrátili opálení, kulaví a obdivovaní. Jezdí jako zjevení, mluví o stepi a v družině jim říkají „východňáci“.',
      },
      {
        label: 'Odmítnout. Cizí koně patří na cizí pole',
        hintType: 'resource', hintKey: 'prestige',
        houseEffects: { target: { attitude: -8 } },
        chronicle: 'Rod {dynastyName} stádo odmítl. Jezdci z Pustého Pole odešli i s koňmi a bez jediného zlého slova, a to je nejhorší.',
      },
    ],
  },

  {
    id: 'h_soudci_listina',
    scenarios: BOTH, cooldown: 30, minTurn: 6,
    target: one('soudci'), requires: aloneWith('soudci'),
    image: img('ztracena_listina'),
    title: 'Listina starého práva',
    text: 'Písaři z Právova našli ve zdech soudního dvora listinu, která tvrdí, že při sporech má platit právo starší než kterýkoli dnešní titul. {house.HeadTitle} {house.head} z rodu {house.gen} nabízí, že soud zapíše tvůj rod do listiny jako ten, kdo právo drží zákonně. „Samozřejmě,“ dodává, „právo není zadarmo. Ani listina.“',
    choices: [
      {
        label: 'Zaplatit písařům za rozsudek',
        requires: gold(12),
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -12, legitimacy: 8 },
        houseEffects: { target: { attitude: 6 } },
        chronicle: 'Písaři psali tři noci. Z listiny teď nade vší pochybnost vyplývá, že rod {dynastyName} vládne zákonně. Peníze se zapsaly pod položkou „poplatky“.',
      },
      {
        label: 'Nechat listinu ověřit u soudu',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.5, traitKey: 'intelligence', traitScale: 0.04,
        onSuccess: { effects: { legitimacy: 6, prestige: 3 }, houseEffects: { target: { attitude: 4 } }, traitGain: 'intelligence', chronicle: 'Soud listinu uznal a ověřil. Není na ní jediná skvrna a rod {dynastyName} má na čem stát.' },
        onFailure: { effects: { legitimacy: -4, prestige: -2 }, houseEffects: { target: { attitude: -4 } }, chronicle: 'Soud nalezl v listině dvě vymyšlené pečeti a tři podezřelé skvrny inkoustu. Rod {house.gen} se zdvořile omluvil a odešel.' },
      },
      {
        label: 'Listinu zabavit a soud zakázat',
        hintType: 'resource', hintKey: 'legitimacy',
        effects: { legitimacy: -3, prestige: -2 },
        noble: { secrets: 1 },
        houseEffects: { target: { attitude: -14 } },
        chronicle: 'Rod {dynastyName} listinu zabavil a zamkl. Rod {house.gen} se nezlobí, jen zapisuje.',
      },
    ],
  },

  {
    id: 'h_turnaj_rodu',
    scenarios: BOTH, cooldown: 30, minTurn: 6,
    target: landedHouse,
    image: img('turnaj'),
    title: 'Turnaj rodů',
    text: 'Rod {house.gen} pořádá na svém sídle {house.seat} velký turnaj. Přijedou rytíři z půl země a {house.headTitle} {house.head} vzkazuje, že místo v čestné lóži je pro tebe připravené. Kdo se turnaje zúčastní, ukáže se. Kdo nepřijede, ukáže se také.',
    choices: [
      {
        label: 'Přijet a sám se utkat v klání',
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.4, traitKey: 'strength', traitScale: 0.04,
        onSuccess: { effects: { prestige: 8 }, houseEffects: { target: { attitude: 10 } }, traitGain: 'strength', chronicle: '{ruler.name} {R:vyhrál|vyhrála} klání a celé hlediště povstalo. Rod {house.gen} se usmívá. Aspoň na veřejnosti.' },
        onFailure: { effects: { prestige: -3 }, injury: { pool: ['pohmozdeni', 'rana', 'zlomenina'], chance: 0.5 }, houseEffects: { target: { attitude: 3 } }, chronicle: 'Kopí se zlomilo a {ruler.name} {R:ležel|ležela} v písku. Hlediště tleskalo vítězi a rod {house.gen} si pochvaloval, že hostům se nikdy nic zlého nestane. Skoro nikdy.' },
      },
      {
        label: 'Sedět v lóži a vsadit na favorita',
        requires: gold(5),
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -5, prestige: 1 },
        houseEffects: { target: { attitude: 8 } },
        chronicle: 'Rod {dynastyName} v lóži smlouval, popíjel a sázel. Favorit ztroskotal, ale hostitelé si pamatují štědrost víc než prohry.',
      },
      {
        label: 'Omluvit se a poslat dar',
        hintType: 'resource', hintKey: 'prestige',
        effects: { prestige: -1 },
        houseEffects: { target: { attitude: -3 } },
        chronicle: 'Rod {dynastyName} turnaj vynechal. Prázdná lóže mluvila hlasitěji než zpráva.',
      },
    ],
  },

  // ===================== THE KING AND HIS VASSALS =====================

  {
    id: 'h_v_mocny_rod',
    scenario: KING, cooldown: 18, minTurn: 6,
    target: (s) => {
      const pool = (s.houses || []).filter((h) => h.power >= 68);
      return pool.length ? pool.sort((a, b) => b.power - a.power)[0].id : null;
    },
    image: img('slechta_odmita_dan'),
    title: 'Rod, který příliš zesílil',
    text: 'Zprávy se ke dvoru sbíhají šeptem: rod {house.gen} drží víc zbrojných než koruna dokáže zaplatit. {house.HeadTitle} {house.head} se na sněmu usmívá a nikdy neřekne nic, co by šlo vyložit jako hrozbu. {chancellor.Title} {chancellor.name} ten klid nesnáší: „Kdo nic nežádá,“ praví, „ten buď nic nechce, nebo chce všechno.“',
    choices: [
      {
        label: 'Zkrotit rod právem: zabavit část lén',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.4, traitKey: 'intelligence', traitScale: 0.04,
        onSuccess: { effects: { prestige: 4, legitimacy: 3 }, houseEffects: { target: { power: -14, attitude: -12 } }, traitGain: 'intelligence', chronicle: 'Sněm schválil, že část lén připadne zpět koruně. Rod {house.gen} se pokořil a teď počítá, co mu zbylo.' },
        onFailure: { effects: { prestige: -4, legitimacy: -3 }, houseEffects: { target: { attitude: -20, rebel: true } }, chronicle: 'Rod {house.gen} se právu vyhnul a odešel ze sněmu bez poklony. Do měsíce prý zavřel brány.' },
      },
      {
        label: 'Udělit rodu nové léno a přízeň',
        requires: gold(10),
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -10, stability: 2 },
        houseEffects: { target: { attitude: 18, power: 6, fief: true } },
        chronicle: 'Koruna obdarovala rod {house.gen} dalším lénem. Z věrného vazala je teď ještě větší věrný vazal. Doufejme.',
      },
      {
        label: 'Svolat sněm a rozdělit jeho půdu mezi jiné',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.4, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { prestige: 3 }, houseEffects: { target: { power: -8, attitude: -6 }, '*': { attitude: 2 } }, traitGain: 'eloquence', chronicle: 'Půda se rozdělila mezi menší rody a velký rod se mračil. Menším se to líbilo a velkého se bojí jen o něco méně.' },
        onFailure: { effects: { prestige: -2 }, houseEffects: { '*': { attitude: -4 } }, chronicle: 'Sněm se rozpadl na hádku o půdu. Všichni odjeli nespokojeni a každý si myslel, že by byl býval dostal víc.' },
      },
      {
        label: 'Nechat být. Zatím',
        hintType: 'trait', hintKey: 'patience',
        chronicle: 'Koruna nechala velký rod velkým. Zatím ho nic nedráždí, ale stín jeho korouhví padá do sněmovny.',
      },
    ],
  },

  {
    id: 'h_v_vzpoura_rodu',
    scenario: KING, forced: true, music: 'battle',
    target: (s) => { const h = (s.houses || []).find((x) => x.rebelPending); return h ? h.id : null; },
    dropIf: (s) => !(s.houses || []).some((x) => x.rebelPending),
    image: img('vzpoura_v_provincii'),
    title: 'Rod vypověděl poslušnost',
    text: 'Sídlo {house.seat} zavřelo brány a z věže se dívá cizí korouhev. Rod {house.gen} vypověděl poslušnost. {house.HeadTitle} {house.head} posílá herolda s listinou stížností: koruna prý nectí staré právo, zapomíná na věrné, prý je čas vyměnit toho, kdo sedí na trůně. V krajích se zvedá prach. Lidé nevědí, komu přísahat, a {marshal.title} {marshal.name} žádá rozkaz.',
    choices: [
      {
        label: 'Vytáhnout proti rodu',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.35, traitKey: 'strength', traitScale: 0.03, resourceKey: 'army', resourceScale: 0.4,
        onSuccess: { effects: { army: -8, prestige: 8, legitimacy: 4 }, houseEffects: { target: { power: -20, attitude: -10, rebel: false } }, traitGain: 'strength', music: 'battle', chronicle: 'Vojsko koruny obklíčilo sídlo {house.seat} a po týdnu padla brána. Rod {house.gen} se klaní, a protože už nemá čím, klaní se hluboko.' },
        onFailure: { effects: { army: -16, prestige: -6, legitimacy: -5 }, provinceEffects: { seat: { unrest: 22, loyalty: -18 } }, houseEffects: { target: { power: 4, attitude: -10, rebel: false } }, music: 'battle', chronicle: 'Útok na sídlo {house.seat} ztroskotal a vojsko ustoupilo. Rod {house.gen} se prohlašuje za vítěze a kraj se bouří.' },
      },
      {
        label: 'Jednat s rodem a splnit část požadavků',
        requires: gold(12),
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -12, legitimacy: -3, prestige: -3 },
        houseEffects: { target: { attitude: 25, power: 4, rebel: false } },
        chronicle: 'Koruna ustoupila: do listin se zapsala nová privilegia rodu {house.gen}. Brány se otevřely, ale nikdo si nemyslí, že naposledy.',
      },
      {
        label: 'Svolat věrné rody',
        requires: (s) => friendsOf(s) >= 1,
        hintType: 'resource', hintKey: 'prestige',
        effects: { gold: -4, prestige: 3 },
        houseEffects: { target: { power: -10, attitude: -8, rebel: false }, allies: { attitude: -4 } },
        chronicle: 'Věrné rody přijely s korouhvemi a vzbouřenci se rozešli dřív, než padla první rána. Za to si věrní vyžádali příště zvláštní zacházení.',
      },
    ],
  },

  {
    id: 'h_v_zadost_o_leno',
    scenario: KING, cooldown: 14, minTurn: 6,
    target: (s) => {
      const pool = (s.houses || []).filter((h) => h.attitude >= 45 && !h.fief);
      return pool.length ? pool[Math.floor(Math.random() * pool.length)].id : null;
    },
    image: img('v_rytiri_u_brany'),
    title: 'Žádost o léno',
    text: '{house.HeadTitle} {house.head} z rodu {house.gen} klečí před trůnem s listinou v ruce. Rod koruně sloužil věrně a jeho synové padli pod královskou korouhví. Žádá o pusté léno u hranice, které leží ladem od posledního moru. „Není to dar,“ říká, „je to odměna. A pojistka, aby koruna věděla, kde stojím.“',
    choices: [
      {
        label: 'Léno udělit a přijmout slib věrnosti',
        hintType: 'resource', hintKey: 'legitimacy',
        effects: { legitimacy: 2 },
        houseEffects: { target: { attitude: 16, power: 7, fief: true } },
        chronicle: 'Rod {house.gen} dostal léno u hranice. Slib věrnosti zazněl nahlas a rod už příště nebude muset žádat dvakrát.',
      },
      {
        label: 'Léno prodat za zlato',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 14, prestige: -1 },
        houseEffects: { target: { attitude: 6, power: 4, fief: true } },
        chronicle: 'Léno u hranice je prodané. Koruna má o zlato víc a rod {house.gen} o půdu víc. Obě strany jsou spokojené, což je podezřelé.',
      },
      {
        label: 'Odmítnout. Půda patří koruně',
        hintType: 'resource', hintKey: 'prestige',
        effects: { prestige: 2 },
        houseEffects: { target: { attitude: -10 } },
        chronicle: 'Koruna léno odmítla. {house.HeadTitle} {house.head} se uklonil{H:|a} a odešel{H:|a} beze slova. Pusté léno zůstává pusté a rod si to pamatuje.',
      },
    ],
  },

  {
    id: 'h_v_snatek_koruny',
    scenario: KING, cooldown: 24, minTurn: 8,
    requires: (s) => !!s.heir && s.heir.alive !== false && !s.heir.none && s.heir.age >= 14 && !s.flags.heir_married && !s.flags.royal_match,
    target: (s) => {
      const pool = (s.houses || []).filter((h) => !h.married && h.attitude >= 35);
      return pool.length ? pool.sort((a, b) => b.power - a.power)[0].id : null;
    },
    image: img('v_snatkovy_trh'),
    title: 'Rod nabízí sňatek s korunou',
    text: 'Rod {house.gen} nabízí sňatek: {D:dědic|dědička} {heir.name} a nejmladší potomek rodu. Věno by bylo štědré, pouto mezi korunou a rodem pevné a nikdo by se pak nedivil, že {house.headTitle} {house.head} sedí na sněmu po pravici. Dvůr se dělí: jedni to vítají, druzí vědí, co taková svatba znamená, a kdo bude po ní silnější.',
    choices: [
      {
        label: 'Přijmout a oslavit svatbu',
        hintType: 'resource', hintKey: 'legitimacy',
        effects: { legitimacy: 5, gold: 10 },
        houseEffects: { target: { married: true, ally: true, attitude: 20, power: 3 }, '*': { attitude: -2 } },
        chronicle: 'Sňatek mezi korunou a rodem {house.gen} byl domluven. Věno přijelo na třinácti vozech a ostatní rody se zamyšleně dívaly na své dcery.',
      },
      {
        label: 'Poděkovat a odmítnout',
        hintType: 'resource', hintKey: 'prestige',
        effects: { prestige: 1 },
        houseEffects: { target: { attitude: -6 } },
        chronicle: 'Koruna nabídku zdvořile odmítla. Rod {house.gen} se uklonil, ale vyprovodit se nechal až ke koním.',
      },
    ],
  },

  {
    id: 'h_v_hotovost_opozdena',
    scenario: KING, cooldown: 12, minTurn: 8,
    target: (s) => {
      const pool = (s.houses || []).filter((h) => h.attitude < 50);
      return pool.length ? pool.sort((a, b) => a.attitude - b.attitude)[0].id : null;
    },
    image: img('vazal_odmita_vojaky'),
    title: 'Hotovost se opozdila',
    text: 'Koruna svolala hotovost a rod {house.gen} poslal sotva polovinu mužů. Druhou polovinu omluvil: sklizeň, mor mezi dobytkem, rozbité cesty. {house.HeadTitle} {house.head} píše se vznešenou zdvořilostí a bez jediné pravdy. {marshal.Title} {marshal.name} ukazuje na mapu a říká: „Tohle je ten rod, který by měl být první.“',
    choices: [
      {
        label: 'Uložit rodu pokutu',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 10, prestige: 1 },
        houseEffects: { target: { attitude: -12 } },
        chronicle: 'Rod {house.gen} zaplatil pokutu a bez jediného pozdravu odjel. Koruna má stříbro a o přítele méně.',
      },
      {
        label: 'Přimhouřit oko',
        hintType: 'resource', hintKey: 'prestige',
        effects: { prestige: -2 },
        houseEffects: { target: { attitude: 5 } },
        chronicle: 'Koruna přimhouřila oko. Rod {house.gen} ví, že to bylo poprvé, a ví taky, že ne naposledy.',
      },
      {
        label: 'Poslat komisaře, ať muže spočítá',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.5, traitKey: 'intelligence', traitScale: 0.04,
        onSuccess: { effects: { army: 6, prestige: 2 }, houseEffects: { target: { attitude: -4 } }, traitGain: 'intelligence', chronicle: 'Komisař spočítal zbrojné a našel dvacet mužů, kteří „zabloudili“. Rod {house.gen} je doplnil a mračil se.' },
        onFailure: { effects: { prestige: -2 }, houseEffects: { target: { attitude: -10 } }, chronicle: 'Komisař se vrátil s prázdnýma rukama a s pomluvami, že byl hrubě přijat. Rod {house.gen} se cítí uražen.' },
      },
    ],
  },

  {
    id: 'h_v_rody_pred_korunou',
    scenario: KING, cooldown: 20, minTurn: 6,
    target: (s) => pickPair(s, (a, b, r) => r <= -25),
    image: img('soud_o_mez'),
    title: 'Rody před trůnem',
    text: 'Rod {house.gen} a rod {house2.gen} předstoupily před trůn se svým sporem. Jde o dluh, o louku, o dávný zápis na hraniční kámen, o urážku na hostině, a jak to bývá, o všechno najednou. {house.HeadTitle} {house.head} mluví hlasitě, {house2.headTitle} {house2.head} ještě hlasitěji. Dvůr čeká a každý ví, že rozsudek nikdo nezapomene.',
    choices: [
      {
        label: 'Rozhodnout ve prospěch rodu {house.gen}',
        hintType: 'resource', hintKey: 'legitimacy',
        effects: { legitimacy: 2 },
        houseEffects: { target: { attitude: 12 }, target2: { attitude: -12 } },
        houseRel: -12,
        chronicle: 'Koruna dala za pravdu rodu {house.gen}. Rod {house2.gen} se uklonil, pohár nedopil a odjel.',
      },
      {
        label: 'Rozhodnout ve prospěch rodu {house2.gen}',
        hintType: 'resource', hintKey: 'legitimacy',
        effects: { legitimacy: 2 },
        houseEffects: { target2: { attitude: 12 }, target: { attitude: -12 } },
        houseRel: -12,
        chronicle: 'Koruna dala za pravdu rodu {house2.gen}. Rod {house.gen} to přijal s tak chladným úsměvem, že se nikdo neodvážil přiťuknout.',
      },
      {
        label: 'Nařídit smír pod hrozbou pokuty',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.5, traitKey: 'eloquence', traitScale: 0.04,
        onSuccess: { effects: { prestige: 4, legitimacy: 2 }, houseEffects: { target: { attitude: 3 }, target2: { attitude: 3 } }, houseRel: 24, traitGain: 'eloquence', chronicle: 'Pod pohledem koruny si oba rody podaly ruce. Dvůr vydechl a písaři smazali dvě stránky obžaloby.' },
        onFailure: { effects: { prestige: -2 }, houseEffects: { target: { attitude: -6 }, target2: { attitude: -6 } }, houseRel: -4, chronicle: 'Smír přísahaly obě strany a oba už věděly, že ho nedodrží. Koruna se tvářila, že neví.' },
      },
      {
        label: 'Nechat rozhodnout božím soudem',
        hintType: 'trait', hintKey: 'patience',
        effects: { faith: 4, prestige: -1 },
        houseEffects: { target: { power: -4 }, target2: { power: -4 } },
        houseRel: -6,
        chronicle: 'Šampioni obou rodů se utkali před hradbami. Jeden padl a rozsudek se nikomu nezamlouval. Božímu soudu se ale nikdo nevzepře, aspoň ne nahlas.',
      },
    ],
  },
];

// a little rarer than the older stories: house events are about a fifth of what a noble sees, so they should not crowd out the rest
export const HOUSE_EVENTS = EVENT_LIST.map((e) => ({ weight: 0.7, ...e }));
