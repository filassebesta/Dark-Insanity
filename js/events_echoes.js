// Crises and echoes.
//
// CRISIS_EVENTS fire on their own when a resource runs out (see CRISES in engine.js):
// the realm has to answer an empty treasury, a hungry crowd or a lost army.
//
// ECHO_EVENTS are decisions coming back years later. A branch carrying
//   echo: { event: '<echo id>', after: [minTurns, maxTurns] }
// schedules the echo; the engine raises it once its time comes, with the same
// province / house / court member in context as the original decision.
// ECHO_HOOKS attach echoes to choices of existing events, so every story that
// comes back is listed here in one place.

const S = 'slechtic';
const img = (id) => `assets/events/${id}.jpg`;
const gold = (n) => (s) => s.resources.gold >= n;
const contextProvinceHeld = (s) => {
  const p = s.provinces.find((x) => x.id === s.eventContext?.province);
  return !!p && !p.lost && (!p.owner || p.owner === 'player');
};
const contextHouse = (s) => (s.houses || []).find((h) => h.id === s.eventContext?.house);

// ===================== CRISES =====================

export const CRISIS_EVENTS = [
  {
    id: 'krize_pokladna',
    forced: true, crisis: true, scenario: 'any',
    image: img('zlodej_v_pokladne'),
    title: 'Prázdná pokladna',
    text: 'Truhly v pokladnici zejí prázdnotou. {chancellor.Title} {chancellor.name} rozkládá ruce: na žold není, na dluhy není, na zítřek není. Vojáci si už šeptají a věřitelé buší na bránu.',
    choices: [
      {
        label: 'Zabavit stříbro z kostelů',
        hintType: 'resource', hintKey: 'faith',
        effects: { gold: 18, faith: -14, prestige: -2 },
        chronicle: 'Kalichy a svícny putovaly do mincovny. Kněží z kazatelen hřmí o svatokrádeži.',
      },
      {
        label: 'Zvýšit dávky poddaným',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 15 },
        provinceEffects: { own: { unrest: 12, loyalty: -6 } },
        chronicle: 'Výběrčí obcházejí vesnice podruhé v jednom roce. Lid platí a proklíná.',
      },
      {
        label: 'Propustit část vojska',
        hintType: 'resource', hintKey: 'army',
        effects: { army: -10, gold: 9 },
        chronicle: 'Polovina žoldnéřů odešla s prázdnýma rukama. Kam asi teď půjdou?',
      },
      {
        label: 'Prosit krále o odklad dávek',
        requires: (s) => s.scenario === S,
        hintType: 'resource', hintKey: 'favor',
        effects: { gold: 10, favor: -8 },
        chronicle: 'Král odklad povolil. Na dvoře se ale ví, že rod {dynastyName} nemá ani na vlastní stráž.',
      },
    ],
  },

  {
    id: 'krize_hlad',
    forced: true, crisis: true, scenario: 'any',
    image: img('hladomor'),
    title: 'Hladové bouře',
    text: 'Sýpky jsou vymetené do posledního zrnka. V ulicích se lidé bijí o chleba a dav s prázdnými mísami a holemi se valí k bráně hradu.',
    choices: [
      {
        label: 'Koupit obilí za každou cenu',
        requires: gold(16),
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -16, food: 16 },
        chronicle: 'Kupci zdvojnásobili cenu, ale vozy s obilím dorazily. Dav se rozešel.',
      },
      {
        label: 'Zabavit zásoby kupcům a klášterům',
        hintType: 'resource', hintKey: 'food',
        effects: { food: 14, faith: -5, prestige: -3 },
        provinceEffects: { own: { wealth: -6 } },
        chronicle: 'Vojáci vyrazili dveře skladů i klášterních sýpek. Hlad ustoupil, kupci a opati si to zapamatují.',
      },
      {
        label: 'Rozehnat dav vojskem',
        hintType: 'trait', hintKey: 'strength',
        effects: { food: 3, army: -3, stability: -5 },
        provinceEffects: { own: { unrest: 14, loyalty: -10 } },
        chronicle: 'Dav byl rozehnán. Na dlažbě zůstala krev a v srdcích lidí zášť.',
      },
      {
        label: 'Vyjít k lidu a sdílet s ním vlastní stůl',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.4, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { food: 6, stability: 4, prestige: 4 }, provinceEffects: { own: { loyalty: 8, unrest: -8 } }, traitGain: 'eloquence', chronicle: '{ruler.name} {R:vyšel|vyšla} mezi hladové a lámal{R:|a} s nimi vlastní chléb. Lidé to nezapomenou.' },
        onFailure: { effects: { food: 2, prestige: -4 }, provinceEffects: { own: { unrest: 6 } }, chronicle: 'Gesto přišlo pozdě. Dav se smál a házel kamením.' },
      },
    ],
  },

  {
    id: 'krize_vojsko',
    forced: true, crisis: true, scenario: 'any',
    image: img('dezerteri'),
    title: 'Bezbranní',
    text: 'Korouhve visí na prázdných kopích. Zbylo jen pár starých strážných a zvědové hlásí, že za hranicí si toho už všimli.',
    choices: [
      {
        label: 'Najmout žoldnéře',
        requires: gold(15),
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -15, army: 14 },
        chronicle: 'Žoldnéři dorazili s vlastními prapory a vlastní cenou. Hradby jsou zase obsazené.',
      },
      {
        label: 'Povolat sedláky ke zbrani',
        hintType: 'resource', hintKey: 'army',
        effects: { army: 10, food: -6 },
        provinceEffects: { own: { unrest: 8, wealth: -5 } },
        chronicle: 'Sedláci vyměnili pluhy za kopí. Pole zůstala ležet ladem.',
      },
      {
        label: 'Spolehnout se na hradby a štěstí',
        hintType: 'trait', hintKey: 'patience',
        isRoll: true, baseChance: 0.45, traitKey: 'patience', traitScale: 0.04,
        onSuccess: { effects: { army: 3 }, chronicle: 'Nikdo nezaútočil. Možná jen proto, že nikdo nevěřil, že je hrad opravdu bez obrany.' },
        onFailure: { effects: { prestige: -6, stability: -5 }, provinceEffects: { own: { wealth: -10, garrison: -8, unrest: 8 } }, music: 'battle', chronicle: 'Nájezdníci vyplenili kraj až pod hradby. Nikdo jim nestál v cestě.' },
      },
    ],
  },

  {
    id: 'krize_vira',
    forced: true, crisis: true, scenario: 'any',
    image: img('kacirska_sekta'),
    title: 'Prázdné kostely',
    text: 'Kostely zejí prázdnotou a na návsích káže potulný kazatel, že rod {dynastyName} je Bohem zavržený. Lidé mu naslouchají a kněží se bojí vyjít ze sakristie.',
    choices: [
      {
        label: 'Postavit nový chrám',
        requires: gold(15),
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -15, faith: 16, prestige: 2 },
        chronicle: 'Na návrší vyrostl nový chrám. Zvony přehlušily kazatele.',
      },
      {
        label: 'Poslat proti němu učené kněze',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.45, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { faith: 14, legitimacy: 2 }, traitGain: 'eloquence', chronicle: 'Učení kněží kazatele před celou návsí přeli. Lidé se vrátili do kostelů.' },
        onFailure: { effects: { faith: 4, gold: -4, prestige: -3 }, chronicle: 'Kazatel kněze vysmál. Teď ho poslouchá ještě víc lidí.' },
      },
      {
        label: 'Kazatele zatknout',
        hintType: 'trait', hintKey: 'strength',
        effects: { faith: 5, stability: -4 },
        provinceEffects: { own: { unrest: 8 } },
        chronicle: 'Kazatel skončil v žaláři. Z mučedníka se kážou lépe kázání.',
      },
    ],
  },

  {
    id: 'krize_posmech',
    forced: true, crisis: true, scenario: 'any',
    image: img('dvorni_blazen'),
    title: 'Terč posměchu',
    text: 'Po krčmách i šlechtických síních se zpívá posměšná píseň o rodu {dynastyName}. Kdo se dřív bál, teď se směje, a kdo se směje, ten neposlechne.',
    choices: [
      {
        label: 'Uspořádat velkolepé slavnosti',
        requires: gold(15),
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -15, prestige: 14 },
        chronicle: 'Tři dny hodování, turnajů a ohňostrojů. Posměšnou píseň přehlušily fanfáry.',
      },
      {
        label: 'Vyzvat autora písně na souboj',
        combat: 'souper', // fought out in rounds (combat.js)
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.45, traitKey: 'strength', traitScale: 0.05,
        onSuccess: { effects: { prestige: 16 }, traitGain: 'strength', chronicle: 'Autor písně ležel v prachu a prosil o milost. Nová píseň je o něm.' },
        onFailure: { effects: { prestige: 3, stability: -3 }, injury: { pool: ['rana', 'jizva', 'zlomenina', 'oko'] }, chronicle: '{ruler.name} {R:odešel|odešla} ze souboje zraněn{R:|a}. Píseň má teď novou sloku.' },
      },
      {
        label: 'Nechat je zpívat',
        hintType: 'trait', hintKey: 'patience',
        effects: { prestige: 3, legitimacy: -3 },
        chronicle: 'Píseň časem omrzela i krčmáře. Něco z ní ale v lidech zůstalo.',
      },
    ],
  },

  {
    id: 'krize_uchvatitel',
    forced: true, crisis: true,
    image: img('pretendent'),
    title: 'Trůn se otřásá',
    text: 'Na sněmu zazněla otázka, kterou se dřív nikdo neodvážil vyslovit nahlas: má {ruler.name} vůbec právo nosit korunu? Páni si to šeptají a čekají, kdo se ozve první.',
    choices: [
      {
        label: 'Nechat se znovu korunovat v katedrále',
        requires: gold(15),
        hintType: 'resource', hintKey: 'legitimacy',
        effects: { gold: -15, legitimacy: 14, faith: 3 },
        chronicle: 'Biskup znovu položil korunu na hlavu {R:krále|královny}. Před oltářem se pochybuje hůř.',
      },
      {
        label: 'Svolat sněm a žádat přísahu věrnosti',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.45, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { legitimacy: 15, stability: 3 }, traitGain: 'eloquence', chronicle: 'Páni jeden po druhém poklekli a přísahali. Pochybovači mlčí.' },
        onFailure: { effects: { legitimacy: 4, stability: -5, prestige: -3 }, chronicle: 'Polovina pánů na sněm nepřijela. To je odpověď sama o sobě.' },
      },
      {
        label: 'Umlčet pochybovače',
        hintType: 'trait', hintKey: 'strength',
        effects: { legitimacy: 8, prestige: -4 },
        provinceEffects: { '*': { unrest: 6 } },
        chronicle: 'Tři páni skončili v žaláři. Nahlas už se nepochybuje.',
      },
    ],
  },

  {
    id: 'krize_nemilost',
    forced: true, crisis: true, scenario: S,
    image: img('n_obvineni_u_dvora'),
    title: 'Poslední varování',
    text: 'Královský herold přivezl list s pečetí, která se neodmítá. {king.name} píše krátce: ještě jedno provinění a panství rodu {dynastyName} připadne koruně. U dvora se prý už dělí o tvé louky.',
    choices: [
      {
        label: 'Odjet ke dvoru a pokořit se',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 12, prestige: -8, gold: -4 },
        chronicle: '{ruler.name} {R:klečel|klečela} před trůnem celé dopoledne. Král nakonec pokynul rukou.',
      },
      {
        label: 'Poslat králi bohatý dar',
        requires: gold(18),
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -18, favor: 15 },
        chronicle: 'Do královské pokladny odjel vůz plný stříbra. Hněv krále se rozplynul.',
      },
      {
        label: 'Požádat spojence o přímluvu',
        requires: (s) => s.houses.some((h) => h.ally),
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 13 },
        houseEffects: { allies: { attitude: -10 } },
        chronicle: 'Spojenci se za rod přimluvili. Takovou službu si ale budou pamatovat.',
      },
      {
        label: 'Odpovědět hrdě',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.35, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { favor: 12, prestige: 6 }, traitGain: 'eloquence', chronicle: 'Odpověď byla tak hrdá a přitom tak věrná, že ji král nechal přečíst nahlas celému dvoru.' },
        onFailure: { effects: { favor: -4, prestige: -2 }, chronicle: 'Král list zmuchlal a hodil do ohně. Herold už je na cestě s dalším.' },
      },
    ],
  },
];

// ===================== ECHOES: THE KING =====================

export const ECHO_EVENTS = [
  {
    id: 'ozvena_omilostneny',
    forced: true, echo: true,
    image: img('soud_se_spiklenci'),
    title: 'Splacená přísaha',
    text: 'U brány čeká muž, kterého koruna kdysi omilostnila na soudu se spiklenci. Prošedivěl, ale přísahu nezapomněl: přináší jména lidí, kteří chystají vraždu. Za svou věrnost žádá jediné, místo u dvora.',
    choices: [
      {
        label: 'Odměnit ho místem u dvora',
        hintType: 'resource', hintKey: 'stability',
        effects: { stability: 5, legitimacy: 4, prestige: 3 },
        courtEffects: { spymaster: { loyalty: -6 } },
        chronicle: 'Jména se ukázala pravdivá a vrazi skončili v poutech. Bývalý spiklenec sedí u dvora. {spymaster.Title} {spymaster.name} ho nespouští z očí.',
      },
      {
        label: 'Jména prověřit a pak se rozhodnout',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.55, traitKey: 'intelligence', traitScale: 0.04,
        onSuccess: { effects: { stability: 7, legitimacy: 3 }, courtEffects: { spymaster: { loyalty: 4 } }, traitGain: 'intelligence', chronicle: 'Každé jméno bylo prověřeno a každé sedělo. Spiknutí bylo rozbito dřív, než se nadechlo.' },
        onFailure: { effects: { stability: -3 }, chronicle: 'Než se jména prověřila, spiklenci zmizeli. Někdo je varoval.' },
      },
      {
        label: 'Kdo zradil jednou, zradí znovu',
        hintType: 'trait', hintKey: 'strength',
        effects: { stability: -6, gold: -5 },
        chronicle: 'Muž odešel bez slova. O týden později shořely královské stáje. Varování se naplnilo.',
      },
    ],
  },

  {
    id: 'ozvena_syn_ucitele',
    forced: true, echo: true,
    image: img('prosba_ucitele'),
    title: 'Hrdina od brodu',
    text: 'Z hranice přišla zpráva o hrdinském činu. Syn starého učitele, kterého koruna kdysi místo žaláře poslala do posádky, ubránil s hrstkou mužů brod před nájezdníky. Vojáci ho nosí na ramenou a žádají pro něj rytířský pás.',
    choices: [
      {
        label: 'Pasovat ho na rytíře',
        hintType: 'resource', hintKey: 'prestige',
        effects: { prestige: 6, army: 4 },
        courtEffects: { marshal: { loyalty: 5 } },
        chronicle: 'Syn učitele poklekl jako voják a povstal jako rytíř. Posádky o tom zpívají.',
      },
      {
        label: 'Jmenovat ho velitelem posádky',
        hintType: 'resource', hintKey: 'army',
        effects: { army: 6 },
        provinceEffects: { 'sokoli-hvozd': { garrison: 10 } },
        chronicle: 'Nový velitel posádky ve hvozdu zná každou stezku i každého vojáka jménem.',
      },
      {
        label: 'Odměnit ho jen zlatem',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -6, prestige: -2 },
        courtEffects: { marshal: { loyalty: -4 } },
        chronicle: 'Vzal zlato a odešel. Vojáci si zapamatovali, jak koruna odměňuje hrdiny.',
      },
    ],
  },

  {
    id: 'ozvena_deti_hladu',
    forced: true, echo: true,
    image: img('hladomor'),
    title: 'Děti hladu',
    text: 'Ve hvozdech řádí banda, které lidé říkají Děti hladu. Jsou to sirotci z hladomoru, kdy koruna nechala lid na vůli Boží. Vyrostli, zatvrdli a teď berou to, co jim tehdy nikdo nedal.',
    choices: [
      {
        label: 'Vyslat vojsko a bandu vyhladit',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.5, resourceKey: 'army', resourceScale: 0.5,
        onSuccess: { effects: { army: -3, stability: 4 }, music: 'battle', chronicle: 'Banda byla rozprášena. V lesích je zase klid, ale ne mír.' },
        onFailure: { effects: { army: -8, prestige: -4 }, provinceEffects: { '*': { unrest: 5 } }, music: 'battle', chronicle: 'Děti hladu znají les lépe než vojáci. Oddíl se vrátil zdecimovaný.' },
      },
      {
        label: 'Nabídnout jim milost a půdu',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -10, stability: 5, faith: 4 },
        provinceEffects: { '*': { unrest: -4 } },
        chronicle: 'Většina z nich složila zbraně a vzala pluh. Co jim kdysi chybělo, dostali teď.',
      },
      {
        label: 'Vypsat odměnu za jejich hlavy',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -6, prestige: -2 },
        provinceEffects: { '*': { unrest: 4 } },
        chronicle: 'Hlavy se nosily na hrad celé měsíce. Ne vždy ty pravé.',
      },
    ],
  },

  {
    id: 'ozvena_markrabi',
    forced: true, echo: true,
    image: img('zajaty_syn_markrabiho'),
    title: 'Dluh cti',
    text: 'Z Marek přijel posel s nečekanou zprávou. Mladý zajatec, kterého koruna kdysi propustila bez výkupného, se stal markrabím. Píše, že dluh cti nezapomněl, a nabízí mír na deset let.',
    choices: [
      {
        label: 'Přijmout mír',
        hintType: 'resource', hintKey: 'stability',
        effects: { stability: 6, army: 3, prestige: 3 },
        chronicle: 'Mír s Marcemi byl zpečetěn. Hraniční posádky poprvé po letech spí celou noc.',
      },
      {
        label: 'Žádat raději spojenectví a vojáky',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.5, traitKey: 'eloquence', traitScale: 0.04,
        onSuccess: { effects: { army: 10, prestige: 5 }, traitGain: 'eloquence', chronicle: 'Markrabě souhlasil. Pod korouhví koruny teď pochodují i markraběcí jezdci.' },
        onFailure: { effects: { stability: 2, prestige: -3 }, chronicle: 'Markrabě se urazil, ale slovo dodržel. Mír platí, přátelství ne.' },
      },
      {
        label: 'Odmítnout, Marky jsou nepřítel',
        hintType: 'trait', hintKey: 'strength',
        effects: { prestige: 2, stability: -4 },
        chronicle: 'Posel odjel s prázdnýma rukama. Na hranici se znovu brousí meče.',
      },
    ],
  },

  {
    id: 'ozvena_masakr',
    forced: true, echo: true,
    requires: contextProvinceHeld,
    image: img('vzpoura_v_provincii'),
    title: 'Píseň o krvavém dni',
    text: 'V kraji {province.name} se zpívá píseň o dni, kdy koruna potlačila vzpouru mečem. Děti padlých dospěly a jejich hněv nezestárl. Na zdech kostelů se objevují nápisy proti koruně.',
    choices: [
      {
        label: 'Postavit kapli za padlé a vyhlásit smír',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -10, faith: 4 },
        provinceEffects: { target: { unrest: -12, loyalty: 10 } },
        chronicle: 'Nad hroby padlých vyrostla kaple. Píseň dostala novou, smírnou sloku.',
      },
      {
        label: 'Nápisy smýt a pisatele potrestat',
        hintType: 'trait', hintKey: 'strength',
        effects: { stability: -2 },
        provinceEffects: { target: { unrest: 10, loyalty: -6 } },
        chronicle: 'Nápisy zmizely ze zdí. Ze srdcí ne.',
      },
      {
        label: 'Poslat do kraje výmluvného vyslance',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.5, traitKey: 'eloquence', traitScale: 0.04,
        onSuccess: { provinceEffects: { target: { unrest: -8, loyalty: 6 } }, traitGain: 'eloquence', chronicle: 'Vyslanec naslouchal déle, než mluvil. Kraj se pomalu uklidňuje.' },
        onFailure: { provinceEffects: { target: { unrest: 4 } }, chronicle: 'Vyslance vyhnali z návsi. Slova nestačí tam, kde tekla krev.' },
      },
    ],
  },

  {
    id: 'ozvena_klaster_dedic',
    forced: true, echo: true,
    requires: (s) => s.heir.alive && s.heir.age >= 12,
    image: img('vychova_dedice'),
    title: 'Návrat z kláštera',
    text: '{heir.name} se vrací z kláštera na útesu. Mluví latinsky, zná zákony i hvězdy. Opat v dopise připomíná, že taková výchova si zaslouží vděčnost, konkrétně pozemky u Brodnice.',
    choices: [
      {
        label: 'Darovat klášteru pozemky',
        hintType: 'resource', hintKey: 'faith',
        effects: { faith: 10, legitimacy: 4 },
        provinceEffects: { brodna: { wealth: -6 } },
        chronicle: 'Klášter dostal louky u Brodnice. Opat slouží mše za rod {dynastyName}.',
      },
      {
        label: 'Poděkovat, ale nic nedat',
        hintType: 'resource', hintKey: 'faith',
        effects: { faith: -6 },
        courtEffects: { heir: { loyalty: -6 } },
        chronicle: 'Opat odjel uražen. {heir.name} se za otcovský dům stydí před svými učiteli.',
      },
      {
        label: 'Jmenovat dědice do královské rady',
        hintType: 'resource', hintKey: 'stability',
        effects: { stability: 4, legitimacy: 3 },
        courtEffects: { heir: { loyalty: 8 }, chancellor: { loyalty: -5 } },
        chronicle: '{heir.name} má teď místo v radě. {chancellor.Title} {chancellor.name} nelibě nese, že do účtů mluví žák.',
      },
    ],
  },

  {
    id: 'ozvena_pirati',
    forced: true, echo: true,
    image: img('pirati'),
    title: 'Obvyklá platba',
    text: 'Piráti jsou zpátky. Tentokrát nečekají na vyjednávání, přišli si pro „obvyklou platbu“. Kdo zaplatí jednou, platí navždy, smějí se v přístavních krčmách.',
    choices: [
      {
        label: 'Zaplatit znovu',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -14, prestige: -5 },
        echo: { event: 'ozvena_pirati', after: [8, 14] },
        chronicle: 'Piráti odpluli s plnými truhlami. Vrátí se. Vždycky se vracejí.',
      },
      {
        label: 'Vyplout proti nim',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.45, resourceKey: 'army', resourceScale: 0.5,
        onSuccess: { effects: { prestige: 8, army: -3 }, traitGain: 'strength', music: 'battle', chronicle: 'Pirátské lodě hoří u útesů. Pobřeží si konečně oddechlo.' },
        onFailure: { effects: { army: -8, gold: -6 }, provinceEffects: { 'pobrezni-mark': { wealth: -8 } }, music: 'battle', chronicle: 'Piráti byli rychlejší. Vypálili přístav a odpluli dřív, než se loďstvo otočilo.' },
      },
      {
        label: 'Opevnit přístav',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -10 },
        provinceEffects: { 'pobrezni-mark': { garrison: 12, wealth: -3 } },
        chronicle: 'Do přístavu se táhne řetěz a na molu stojí nové věže. Piráti hledají snazší kořist.',
      },
    ],
  },

  {
    id: 'ozvena_bylinkarka',
    forced: true, echo: true,
    image: img('carodejnice'),
    title: 'Dluh se splácí',
    text: 'Na dvoře propukla horečka a ranhojiči si nevědí rady. Pak se u brány objevila žena, kterou koruna kdysi odmítla vydat církevnímu soudu. Nese byliny a říká, že dluh se splácí.',
    choices: [
      {
        label: 'Pustit ji k nemocným',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.6, traitKey: 'intelligence', traitScale: 0.03,
        onSuccess: { effects: { stability: 4, prestige: 3, faith: -3 }, courtEffects: { heir: { loyalty: 5 } }, chronicle: 'Horečka ustoupila za tři dny. Kněží mluví o čarodějnictví, ranhojiči o zázraku.' },
        onFailure: { effects: { stability: -4, faith: -4 }, chronicle: 'Byliny nepomohly. Kněží teď mají, co chtěli: důkaz.' },
      },
      {
        label: 'Svěřit nemocné kněžím',
        hintType: 'resource', hintKey: 'faith',
        effects: { faith: 5, stability: -3 },
        chronicle: 'Kněží se modlili dnem i nocí. Horečka si vzala, co chtěla, a pak odešla.',
      },
      {
        label: 'Vzít ji do služby jako dvorní ranhojičku',
        hintType: 'resource', hintKey: 'stability',
        effects: { stability: 5, faith: -6 },
        courtEffects: { spouse: { loyalty: 4 } },
        chronicle: 'Žena, kterou chtěli upálit, má teď komnatu na hradě. Biskup to nese těžce.',
      },
    ],
  },

  {
    id: 'ozvena_uprchlici',
    forced: true, echo: true,
    image: img('uprchlici'),
    title: 'Vydejte nám je',
    text: 'Vesnice uprchlíků z Marek vzkvétá. Pole jsou zoraná, řemeslníci pracují a daně se platí. Teď ale přijel vyslanec z Marek a žádá jejich vydání, prý jsou to markraběcí nevolníci.',
    choices: [
      {
        label: 'Odmítnout, jsou to teď naši lidé',
        hintType: 'resource', hintKey: 'prestige',
        effects: { prestige: 5, stability: 2 },
        chronicle: 'Vyslanec odjel s odmítnutím. Uprchlíci zapálili svíce za rod {dynastyName}.',
      },
      {
        label: 'Vydat je',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 6, prestige: -6, faith: -4 },
        provinceEffects: { '*': { wealth: -3 } },
        chronicle: 'Uprchlíci odcházeli v řetězech. Vesnice zůstala prázdná a pole zarostou.',
      },
      {
        label: 'Vyplatit markrabímu odstupné',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -12, stability: 4, prestige: 2 },
        chronicle: 'Markrabě dostal zlato a uprchlíci domov. Spokojeni jsou všichni, kromě pokladníka.',
      },
    ],
  },

  {
    id: 'ozvena_ucenci',
    forced: true, echo: true,
    image: img('skola_ucencu'),
    title: 'První učenci',
    text: 'Z královské školy vyšli první učenci. Jeden předkládá návrh na nové mlýny na Brodnici, druhý chce zmapovat rudné žíly v horách a třetí tvrdí, že umí léčit dobytčí mor.',
    choices: [
      {
        label: 'Podpořit mlýny',
        hintType: 'resource', hintKey: 'food',
        effects: { gold: -8, food: 10 },
        provinceEffects: { brodna: { wealth: 6 } },
        chronicle: 'Na Brodnici klapou nová mlýnská kola. Mouky je víc než kdy dřív.',
      },
      {
        label: 'Podpořit mapování hor',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -6 },
        provinceEffects: { 'zelezny-hreben': { wealth: 8 } },
        chronicle: 'Učenec našel v horách žílu, o které nevěděli ani staří horníci.',
      },
      {
        label: 'Vzít do služeb koruny všechny tři',
        hintType: 'trait', hintKey: 'intelligence',
        effects: { gold: -14, prestige: 6, food: 4 },
        traitGain: 'intelligence',
        chronicle: 'Učenci zasedli u dvora. Pokladník naříká, ale království se učí rychleji.',
      },
    ],
  },

  {
    id: 'ozvena_zlomeny_slib',
    forced: true, echo: true,
    image: img('stary_rytir_umira'),
    title: 'Zlomený slib',
    text: 'Syn starého rytíře se dozvěděl, že slib daný jeho otci na smrtelné posteli byl lež. Vyzval nového lenního pána na souboj a celý kraj stojí na jeho straně.',
    choices: [
      {
        label: 'Vrátit synovi léno',
        hintType: 'resource', hintKey: 'legitimacy',
        effects: { prestige: -3, legitimacy: 4, stability: 3 },
        chronicle: 'Léno se vrátilo k rodu, kterému patřilo. Pozdě, ale přece.',
      },
      {
        label: 'Povolit souboj, ať rozhodne Bůh',
        hintType: 'resource', hintKey: 'faith',
        isRoll: true, baseChance: 0.5,
        onSuccess: { effects: { prestige: 3 }, chronicle: 'Nový pán souboj vyhrál. Bůh rozhodl, i když kraj tomu nevěří.' },
        onFailure: { effects: { stability: -4, legitimacy: -3 }, chronicle: 'Syn rytíře souboj vyhrál a celý kraj ví, čí slib byl lež.' },
      },
      {
        label: 'Syna uvěznit pro vzpouru',
        hintType: 'trait', hintKey: 'strength',
        effects: { legitimacy: -5, stability: -3, prestige: -2 },
        provinceEffects: { '*': { unrest: 4 } },
        chronicle: 'Syn rytíře skončil v žaláři. Jeho otec by se v hrobě obracel.',
      },
    ],
  },

  {
    id: 'ozvena_most',
    forced: true, echo: true,
    image: img('most_pres_brodnici'),
    title: 'Most se zřítil',
    text: 'Dřevěný most přes Brodnici, postavený co nejlevněji, se zřítil pod kupeckou karavanou. Utopilo se pět vozků a s nimi zboží za stovky zlatých. Kupci žádají náhradu.',
    choices: [
      {
        label: 'Zaplatit náhradu a postavit most z kamene',
        requires: gold(20),
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -20, prestige: 3 },
        provinceEffects: { brodna: { wealth: 6 } },
        chronicle: 'Kupci dostali náhradu a Brodnice kamenný most. Ten už vydrží.',
      },
      {
        label: 'Opravit dřevěný most',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -6 },
        echo: { event: 'ozvena_most', after: [10, 16] },
        chronicle: 'Most stojí znovu, ze stejného dřeva a za stejnou cenu. Kupci přecházejí rychle.',
      },
      {
        label: 'Odmítnout, řeka je vůle Boží',
        hintType: 'trait', hintKey: 'patience',
        effects: { prestige: -4 },
        provinceEffects: { brodna: { wealth: -8, loyalty: -6 } },
        chronicle: 'Kupci odjeli jinou cestou. Brodná přišla o trh i o důvěru.',
      },
    ],
  },

  // ===================== ECHOES: THE NOBLE =====================

  {
    id: 'ozvena_n_pytlaci',
    scenario: S, forced: true, echo: true,
    image: img('n_pytlaci'),
    title: 'Stará laskavost',
    text: 'Bývalí pytláci, které rod {dynastyName} kdysi propustil i s jelenem, přiběhli za svítání. V lesích na hranici panství táboří ozbrojenci, kteří nevypadají jako lovci. Pytláci znají každou stezku a nabízejí, že k nim družinu dovedou.',
    choices: [
      {
        label: 'Vést družinu jejich stezkami',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.55, resourceKey: 'army', resourceScale: 0.5,
        onSuccess: { effects: { prestige: 6, army: -2 }, provinceEffects: { own: { unrest: -4, loyalty: 5 } }, music: 'battle', chronicle: 'Družina přepadla tábor za úsvitu. Cizí ozbrojenci utekli a nechali tu i korouhev.' },
        onFailure: { effects: { army: -6 }, music: 'battle', chronicle: 'Ozbrojenci byli připraveni. Družina se vrátila s raněnými.' },
      },
      {
        label: 'Přijmout je do služby jako myslivce',
        hintType: 'resource', hintKey: 'army',
        effects: { gold: -4, army: 4 },
        provinceEffects: { own: { loyalty: 6 } },
        chronicle: 'Z pytláků jsou myslivci rodu. Les teď hlídají ti, kdo ho znají nejlépe.',
      },
      {
        label: 'Varovat sousední rody',
        hintType: 'resource', hintKey: 'prestige',
        effects: { prestige: 2 },
        houseEffects: { '*': { attitude: 4 } },
        chronicle: 'Posel objel všechna sídla. Sousedé ocenili, že rod {dynastyName} myslel i na ně.',
      },
    ],
  },

  {
    id: 'ozvena_n_vdecny_rod',
    scenario: S, forced: true, echo: true,
    requires: (s) => !!contextHouse(s),
    image: img('n_pujcka_rodu'),
    title: 'Vděčnost sousedů',
    text: '{house.HeadTitle} {house.head} z rodu {house.gen} nezapomněl{H:|a} na půjčku bez úroku, kterou rod kdysi v nouzi dostal. U královského dvora teď jeho lidé mluví o rodu {dynastyName} jen v dobrém a na tvrz dorazil dar.',
    choices: [
      {
        label: 'Přijmout dar',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 15 },
        houseEffects: { target: { attitude: 4 } },
        chronicle: 'Dar dorazil na voze taženém čtyřmi koňmi. Dobrý skutek se vrátil i s úrokem.',
      },
      {
        label: 'Požádat je raději o přímluvu u krále',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 10 },
        houseEffects: { target: { attitude: 2 } },
        chronicle: 'Sousedé se u krále přimluvili. Slovo spřáteleného rodu váží víc než zlato.',
      },
      {
        label: 'Navrhnout spojenectví',
        requires: (s) => !contextHouse(s)?.ally,
        hintType: 'resource', hintKey: 'prestige',
        houseEffects: { target: { ally: true, attitude: 6 } },
        chronicle: 'Z dlužníků se stali spojenci. Pečeť obou rodů visí na jedné listině.',
      },
    ],
  },

  {
    id: 'ozvena_n_pisatel',
    scenario: S, forced: true, echo: true,
    image: img('n_nalezeny_dopis'),
    title: 'Bedýnka bez erbu',
    text: 'Do tvrze dorazila bedýnka bez erbu. Leží v ní list od pisatele dopisu, který rod {dynastyName} kdysi tiše vrátil, místo aby ho zneužil. Stojí v něm jen: „Dluh splácím tím nejcennějším, co mám.“ Pod tím jsou jména, data a částky.',
    choices: [
      {
        label: 'Ponechat si tajemství',
        hintType: 'resource', hintKey: 'legitimacy',
        noble: { secrets: 1 },
        chronicle: 'Listina zmizela v truhle s ostatními. Jednou se bude hodit.',
      },
      {
        label: 'Předat listinu králi jako důkaz věrnosti',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 12 },
        chronicle: 'Král si listinu přečetl dvakrát. Pak poslal pro kata a pro pečetidlo.',
      },
      {
        label: 'Spálit ji, dluh je splacen',
        hintType: 'resource', hintKey: 'prestige',
        effects: { prestige: 3 },
        houseEffects: { '*': { attitude: 3 } },
        chronicle: 'Listina shořela v krbu. Pisatel se to dozví a s ním i další.',
      },
    ],
  },

  {
    id: 'ozvena_n_pomsta',
    scenario: S, forced: true, echo: true,
    image: img('n_spiklenci_zvou'),
    title: 'Krev za krev',
    text: 'Spiklenci, které rod {dynastyName} kdysi udal králi, skončili na popravišti. Jejich příbuzní ale ne. {spymaster.Title} {spymaster.name} přináší zprávu: najatý vrah už je na cestě.',
    choices: [
      {
        label: 'Nastražit na něj past',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.5, traitKey: 'intelligence', traitScale: 0.04,
        onSuccess: { effects: { prestige: 4, favor: 4 }, noble: { secrets: 1 }, courtEffects: { spymaster: { loyalty: 5 } }, traitGain: 'intelligence', chronicle: 'Vrah vlezl do pasti a na mučidlech prozradil, kdo ho platí.' },
        onFailure: { effects: { stability: -6, prestige: -3 }, chronicle: 'Past sklapla naprázdno. Vrah zasáhl jinde a {ruler.name} jen o vlas unikl{R:|a} smrti.' },
      },
      {
        label: 'Zdvojit stráže a nevycházet',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -8, prestige: -3 },
        chronicle: 'Celou zimu se v tvrzi nevycházelo. Vrah odtáhl, ale v kraji se mluví o strachu.',
      },
      {
        label: 'Požádat krále o ochranu',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: -3, stability: 2 },
        chronicle: 'Král poslal své stráže. Ochrana od koruny ale něco stojí, třeba hrdost.',
      },
    ],
  },

  {
    id: 'ozvena_n_rychtar',
    scenario: S, forced: true, echo: true,
    image: img('n_robota'),
    title: 'Cepy pod hradbami',
    text: 'Rychtář, který kdysi prosil o úlevu od roboty, už neprosí. Svolal sedláky ze všech vesnic panství a s cepy a vidlemi stojí pod hradbami tvrze. Chtějí zpět staré právo, nebo hlavu výběrčího.',
    choices: [
      {
        label: 'Ulevit jim od roboty',
        hintType: 'resource', hintKey: 'food',
        effects: { food: -6, gold: -4 },
        provinceEffects: { own: { unrest: -14, loyalty: 10 } },
        chronicle: 'Robota byla zkrácena na polovinu. Sedláci se rozešli domů a zpívali.',
      },
      {
        label: 'Rozehnat je družinou',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.55, resourceKey: 'army', resourceScale: 0.5,
        onSuccess: { effects: { prestige: 2 }, provinceEffects: { own: { unrest: -4, loyalty: -8 } }, music: 'battle', chronicle: 'Družina vyjela z brány a dav se rozprchl. Klid je, láska ne.' },
        onFailure: { effects: { army: -6, stability: -6 }, provinceEffects: { own: { unrest: 10 } }, music: 'battle', chronicle: 'Sedláci se nerozprchli. Bitva pod hradbami skončila zapálenou stodolou a mrtvými na obou stranách.' },
      },
      {
        label: 'Vydat jim výběrčího',
        hintType: 'resource', hintKey: 'prestige',
        effects: { prestige: -4 },
        provinceEffects: { own: { unrest: -8, loyalty: 4 } },
        courtEffects: { chancellor: { loyalty: -8 } },
        chronicle: 'Výběrčí byl vydán davu. {chancellor.Title} {chancellor.name} se od té doby ohlíží přes rameno.',
      },
    ],
  },
];

// Which existing decisions come back, and when (in seasons).
export const ECHO_HOOKS = [
  { event: 'soud_se_spiklenci', choice: 'Udělit milost výměnou za přísahu', branch: 'onSuccess', echo: 'ozvena_omilostneny', after: [10, 20] },
  { event: 'prosba_ucitele', choice: 'Ať syn slouží v posádce na hranici', echo: 'ozvena_syn_ucitele', after: [8, 16] },
  { event: 'hladomor', choice: 'Nechat to na vůli Boží', echo: 'ozvena_deti_hladu', after: [12, 20] },
  { event: 'zajaty_syn_markrabiho', choice: 'Propustit ho bez výkupného', echo: 'ozvena_markrabi', after: [10, 18] },
  { event: 'vzpoura_v_provincii', choice: 'Potlačit vzpouru vojskem', branch: 'onSuccess', echo: 'ozvena_masakr', after: [10, 18] },
  { event: 'vychova_dedice', choice: 'Poslat ho do kláštera na útesu', echo: 'ozvena_klaster_dedic', after: [8, 14] },
  { event: 'pirati', choice: 'Zaplatit pirátům, ať táhnou jinam', echo: 'ozvena_pirati', after: [6, 12] },
  { event: 'carodejnice', choice: 'Propustit ji', echo: 'ozvena_bylinkarka', after: [6, 14] },
  { event: 'uprchlici', choice: 'Přijmout je', echo: 'ozvena_uprchlici', after: [8, 16] },
  { event: 'skola_ucencu', choice: 'Školu založit a financovat', echo: 'ozvena_ucenci', after: [10, 18] },
  { event: 'stary_rytir_umira', choice: 'Slíbit, ale léno dát jinému', echo: 'ozvena_zlomeny_slib', after: [8, 14] },
  { event: 'most_pres_brodnici', choice: 'Postavit levnější dřevěný most', echo: 'ozvena_most', after: [8, 14] },
  { event: 'n_pytlaci', choice: 'Propustit je a dát jim jelena', echo: 'ozvena_n_pytlaci', after: [6, 12] },
  { event: 'n_pujcka_rodu', choice: 'Půjčit bez úroku', echo: 'ozvena_n_vdecny_rod', after: [6, 12] },
  { event: 'n_nalezeny_dopis', choice: 'Vrátit dopis tiše pisateli', echo: 'ozvena_n_pisatel', after: [6, 12] },
  { event: 'n_spiklenci_zvou', choice: 'Udat spiklence králi', echo: 'ozvena_n_pomsta', after: [8, 14] },
  { event: 'n_robota', choice: 'Trvat na robotě', echo: 'ozvena_n_rychtar', after: [8, 14] },
];

/** Puts each hook's echo onto the matching choice; throws on a typo so nothing silently breaks. */
export function attachEchoHooks(events) {
  for (const hook of ECHO_HOOKS) {
    const event = events.find((e) => e.id === hook.event);
    const choice = event && event.choices && event.choices.find((c) => c.label === hook.choice);
    const branch = choice && (hook.branch ? choice[hook.branch] : choice);
    if (!branch || !events.some((e) => e.id === hook.echo)) {
      throw new Error(`Echo hook does not match: ${hook.event} / ${hook.choice}`);
    }
    branch.echo = { event: hook.echo, after: hook.after };
  }
  return events;
}
