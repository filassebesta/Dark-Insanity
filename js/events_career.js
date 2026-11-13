// Chapter cards: one chronicle, one life of a house from the plough to the crown.
// promote() in state.js raises them (state.pendingEvent) right after a peasant
// earns a coat of arms or a noble takes the throne. They take no season (free)
// and open the next stage of the game in the story itself — there is no scenario
// menu any more.

export const CAREER_EVENTS = [
  {
    id: 'kapitola_erb',
    scenario: 'slechtic', forced: true, free: true,
    image: 'assets/endings/ending_ennobled.jpg',
    title: 'Erb a tvrz',
    text: 'Listina s královskou pečetí visí v síni tvrze nad mořem. {ruler.name} z rodu {dynastyName} už neoře cizí pole — teď {R:sám|sama} drží vsi, které odvádějí dávky. Sousedé z Lipnice zůstali doma; na tvrzi slouží noví lidé, kteří si teprve zvykají na {R:pána|paní}, {R:jenž|jež} ještě nedávno {R:chodil|chodila} v kabátci. Nad tebou stojí {king.title} {king.name} a {K:jeho|její} přízeň dává i bere. Kolem tebe tři staré rody — páni z Bílé Brány, Rudí z Hřebene a Sokolové — a ti se na skokana dívají svrchu. Kdo chce víc než jednu tvrz, potřebuje přízeň dvora, spojence mezi rody a sílu, kterou nikdo nepřehlédne.',
    choices: [
      {
        label: 'Pověsit erb nad bránu a vypít to s posádkou',
        hintType: 'resource', hintKey: 'prestige',
        effects: { prestige: 3 }, courtEffects: { marshal: { loyalty: 5 } },
        chronicle: 'Nad bránou tvrze visí nový erb a posádka pila do rána na zdraví {R:svého pána|své paní}.',
      },
      {
        label: 'Projít vsi a poznat lidi, kteří tu žijí',
        hintType: 'trait', hintKey: 'eloquence',
        provinceEffects: { own: { loyalty: 6, unrest: -4 } },
        chronicle: '{ruler.name} {R:prošel|prošla} všechny vsi panství. Sedláci poprvé viděli {R:pána|paní}, {R:který|která} ví, jak se drží pluh.',
      },
      {
        label: 'Poslat ke dvoru dar a poděkování za milost',
        hintType: 'resource', hintKey: 'favor',
        effects: { gold: -4, favor: 5 },
        chronicle: 'Do Vlčího Údělu odjel vůz s darem a dopisem plným díků. Koruna si nového {R:šlechtice|šlechtičnu} zapamatoval.',
      },
    ],
  },
  {
    id: 'kapitola_koruna',
    scenario: 'panovnik', forced: true, free: true,
    image: 'assets/endings/ending_crowned.jpg',
    title: 'Koruna',
    text: 'Zvony Vlčího Údělu zvoní celý den. {ruler.name} z rodu {dynastyName} usedá na trůn, na který se ještě nedávno {R:díval|dívala} zdola. Kraje, které patřily soupeřícím rodům, teď odvádějí daně koruně — ale páni z Bílé Brány, Rudí i Sokolové nezapomněli, že {R:nový král|nová královna} byl{R:|a} ještě včera jedním z nich. Za hranicemi si změny všímají i cizí panovníci: {realm.east} z Východních marek, {realm.north} ze Severních pustin a {realm.south} z Jižní říše. Jedni posílají dary, druzí zvědy.',
    choices: [
      {
        label: 'Vystrojit korunovační hostinu pro celou šlechtu',
        hintType: 'resource', hintKey: 'legitimacy',
        effects: { gold: -8, legitimacy: 6, prestige: 3 },
        chronicle: 'Korunovační hostina trvala tři dny. Šlechta jedla, pila a pozorně sledovala, kdo sedí nejblíž trůnu.',
      },
      {
        label: 'Vyhlásit milost pro ty, kdo stáli proti tobě',
        hintType: 'trait', hintKey: 'patience',
        effects: { stability: 6, legitimacy: 3 },
        chronicle: '{ruler.name} {R:odpustil|odpustila} všem, kdo stáli na druhé straně. Někteří to nazvali moudrostí, jiní slabostí.',
      },
      {
        label: 'Ukázat sílu: přehlídka vojska v hlavním městě',
        hintType: 'trait', hintKey: 'strength',
        effects: { prestige: 5, stability: 2, gold: -3 },
        chronicle: 'Vojsko prošlo hlavním městem v plné zbroji. Vyslanci cizích dvorů počítali kopí a psali domů.',
      },
    ],
  },

  // ---------- the great lord's revolt (war.js rebellionTarget) ----------
  {
    id: 'w_povstani_vitezstvi',
    scenario: 'slechtic', forced: true, music: 'battle',
    image: 'assets/events/n_prevrat.jpg',
    title: 'Brány Vlčího Údělu',
    text: 'Královské vojsko je rozprášeno a brány hlavního města se otevřely. {king.Title} {king.name} stojí v trůnní síni bez stráží; dvořané, kteří {K:ho|ji} ráno ještě zdravili, teď hledí na tebe. Koruna leží na podušce a čeká. Zbývá rozhodnout, co se stane s tím, kdo ji nosil.',
    choices: [
      {
        label: 'Poslat sesazeného panovníka do kláštera',
        hintType: 'trait', hintKey: 'patience',
        effects: { faith: 4 }, houseEffects: { '*': { attitude: 4 } },
        endGame: 'crowned',
        chronicle: 'Sesazen{K:ý král|á královna} {king.name} {K:odešel|odešla} v kutně do kláštera na útesu. Na trůn usedá rod {dynastyName}.',
      },
      {
        label: 'Nechat sesazeného panovníka popravit, aby se nikdy nevrátil',
        hintType: 'trait', hintKey: 'strength',
        effects: { prestige: 4, faith: -4 }, houseEffects: { '*': { attitude: -10 } },
        endGame: 'crowned',
        hiddenEffects: { setFlag: 'kral_popraven' },
        chronicle: '{king.Title} {king.name} zemřel{K:|a} pod sekerou na nádvoří vlastního hradu. Šlechta mlčí a pamatuje si to. Na trůn usedá rod {dynastyName}.',
      },
      {
        label: 'Propustit sesazeného panovníka do ciziny se ctí',
        hintType: 'trait', hintKey: 'eloquence',
        effects: { prestige: 2 }, houseEffects: { '*': { attitude: 6 } },
        endGame: 'crowned',
        echo: { event: 'ozvena_vyhnany_kral', after: [12, 24] },
        chronicle: '{king.Title} {king.name} odjel{K:|a} se svou družinou za hranice. Velkorysost nového vládce chválí celá země — prozatím.',
      },
    ],
  },
  {
    id: 'w_povstani_porazka',
    scenario: 'slechtic', forced: true, music: 'battle',
    image: 'assets/events/soud_se_spiklenci.jpg',
    title: 'Povstání je zlomeno',
    text: 'Královské vojsko rozprášilo tvé muže a teď táhne k tvrzi. {king.Title} {king.name} vypsal{K:|a} na hlavu {R:vzbouřence|vzbouřenkyně} odměnu a spojenci, kteří včera přísahali věrnost, dnes posílají ke dvoru omluvné dopisy.',
    choices: [
      {
        label: 'Prosit krále o milost',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.35, traitKey: 'eloquence', traitScale: 0.05, resourceKey: 'legitimacy', resourceScale: 0.002,
        onSuccess: { effects: { favor: 12, gold: -15, prestige: -10, legitimacy: -10 }, hiddenEffects: { clearFlag: 'rebellion' }, provinceEffects: { own: { garrison: -20 } }, chronicle: 'Milost byla udělena — za cenu pokladny, nároku na trůn a ponížení před celým dvorem. Rod {dynastyName} přežil.' },
        onFailure: { endGame: 'executed', chronicle: 'Prosby byly vyslechnuty — a pak dostal slovo kat.' },
      },
      {
        label: 'Bránit tvrz do posledního muže',
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.25, traitKey: 'strength', traitScale: 0.05, resourceKey: 'army', resourceScale: 0.004,
        onSuccess: { effects: { favor: 15, prestige: 6, army: -8 }, hiddenEffects: { clearFlag: 'rebellion' }, provinceEffects: { own: { wealth: -10, garrison: -15 } }, chronicle: 'Tvrz odolala celé léto. Koruna nakonec nabídla smír — s rodem, který se nedá zlomit, se raději vyjednává.' },
        onFailure: { endGame: 'executed', chronicle: 'Hradby padly třetí týden obléhání.' },
      },
      {
        label: 'Uprchnout s rodinou za hranice',
        hintType: 'trait', hintKey: 'patience',
        endGame: 'exile',
        chronicle: '{ruler.name} {R:uprchl|uprchla} v noci lodí z Pobřežní marky. Panství připadlo koruně.',
      },
    ],
  },

  {
    id: 'ozvena_vyhnany_kral',
    scenario: 'panovnik', forced: true, echo: true,
    requires: (s) => !!(s.formerKing && s.formerKing.alive),
    image: 'assets/events/pretendent.jpg',
    title: '{F:Král|Královna} za hranicemi',
    text: 'Sesazen{F:ý král|á královna} {formerKing.name}, {F:kterého|kterou} jsi kdysi nechal{R:|a} odejít se ctí, se ozval{F:|a} z ciziny. Píše, že se vrací — a s {F:ním|ní} cizí žoldnéři a pár starých pánů, kteří nikdy nepřestali počítat dny do {F:jeho|jejího} návratu.',
    choices: [
      {
        label: 'Vyslat vojsko k hranici dřív, než ji překročí',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.45, traitKey: 'strength', traitScale: 0.04, resourceKey: 'army', resourceScale: 0.004,
        onSuccess: { effects: { prestige: 8, legitimacy: 6, army: -4 }, music: 'battle', chronicle: 'Žoldnéři sesazeného panovníka se rozutekli u prvního brodu. {formerKing.name} už se nevrátí.' },
        onFailure: { effects: { army: -10, legitimacy: -8, stability: -6 }, provinceEffects: { 'pobrezni-mark': { unrest: 15, loyalty: -10 } }, music: 'battle', chronicle: 'Žoldnéři prorazili hranici a pobřeží jim otevřelo brány. Válka o trůn se vrátila.' },
      },
      {
        label: 'Zaplatit {F:jeho|jejím} žoldnéřům, aby se obrátili',
        requires: (s) => s.resources.gold >= 25,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -25, legitimacy: 3 },
        chronicle: 'Žoldnéři vzali zlato od toho, kdo platil víc. Sesazen{F:ý král zůstal|á královna zůstala} v cizině s{F:ám|ama}.',
      },
      {
        label: 'Nabídnout {F:mu|jí} panství a smír',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.4, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { legitimacy: 10, stability: 4, gold: -8 }, chronicle: '{formerKing.name} přijal{F:|a} panství a před shromážděnou šlechtou se zřekl{F:|a} koruny. Žádný meč nebyl tasen.' },
        onFailure: { effects: { legitimacy: -6, prestige: -4 }, chronicle: 'Sesazen{F:ý král|á královna} se nabídce vysmál{F:|a}. Slabost cítí každý, kdo ji nabízí.' },
      },
    ],
  },

  {
    id: 'n_cizi_posel',
    scenario: 'slechtic', cooldown: 24, minTurn: 4,
    requires: (s) => s.ruler.statusTier >= 4 && s.king && s.king.alive && !s.flags.cizi_podpora && !s.flags.rebellion && s.realms && !s.realms.east.owner,
    image: 'assets/events/cizi_vyslanec.jpg',
    title: 'Posel z Východních marek',
    text: 'Za soumraku přijel na tvrz jezdec bez erbu na plášti. Nese pečetní prsten, který znáš z obchodních listin: posílá ho {realm.east} z Východních marek. Vzkazuje, že {king.title} {king.name} je slab{K:ý|á} a že ví, kdo by byl lepší. Když povstaneš, pošle přes hvozd své muže. Co za to bude chtít, posel neřekl — jen že se to dozvíš, až budeš sedět na trůně.',
    choices: [
      {
        label: 'Přijmout nabídku a poslat zpátky prsten',
        hintType: 'trait', hintKey: 'intelligence',
        effects: { favor: -4 }, hiddenEffects: { setFlag: 'cizi_podpora' }, realm: { east: { attitude: 12 } },
        chronicle: 'Posel odjel s odpovědí. Za hvozdem se brousí meče, které možná jednou poslouží rodu {dynastyName}.',
      },
      {
        label: 'Odmítnout — cizí meče se platí krví vlastní země',
        hintType: 'trait', hintKey: 'patience',
        effects: { prestige: 2 },
        chronicle: '{ruler.name} poslal{R:|a} posla zpět s prázdnou. Co se odehraje v této zemi, rozhodnou její lidé.',
      },
      {
        label: 'Vydat posla koruně',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 12, legitimacy: -3 }, realm: { east: { attitude: -15 } },
        chronicle: 'Posel z Marek skončil v královském žaláři a {king.title} {king.name} poslal{K:|a} {R:věrnému pánovi|věrné paní} poděkování. Za hvozdem si to zapamatují.',
      },
    ],
  },

  {
    id: 'ozvena_dluh_markam',
    scenario: 'panovnik', forced: true, echo: true,
    image: 'assets/events/cizi_vyslanec.jpg',
    title: 'Účet z Marek',
    text: 'Posel z Východních marek přijel znovu, tentokrát s praporem a v doprovodu dvaceti jezdců. Vzkazuje, že {realm.east} nezapomíná, kdo poslal muže přes hvozd, když se rod {dynastyName} natahoval po koruně. Za pomoc chce Sokolí Hvozd — celý kraj i s Mýtnicí.',
    choices: [
      {
        label: 'Dostát slovu a postoupit Sokolí Hvozd',
        hintType: 'trait', hintKey: 'patience',
        effects: { prestige: -6, legitimacy: -4 }, provinceEffects: { 'sokoli-hvozd': { lost: true } }, realm: { east: { attitude: 25 } },
        chronicle: 'Sokolí Hvozd připadl Východním markám. Slovo bylo dodrženo — a celá země ví, za kolik.',
      },
      {
        label: 'Vyplatit dluh zlatem',
        requires: (s) => s.resources.gold >= 30,
        hintType: 'resource', hintKey: 'gold',
        isRoll: true, baseChance: 0.5, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { gold: -30 }, realm: { east: { attitude: 5 } }, traitGain: 'eloquence', chronicle: 'Marky vzaly zlato místo země. Dluh je splacen a hranice zůstala, kde byla.' },
        onFailure: { effects: { gold: -30, prestige: -3 }, realm: { east: { attitude: -10 } }, provinceEffects: { 'sokoli-hvozd': { unrest: 15 } }, chronicle: 'Zlato si v Markách vzali, ale spokojení nejsou. Na hranici se znovu objevují ozbrojenci z Marek.' },
      },
      {
        label: 'Odmítnout — {R:král|královna} nikomu nic nedluží',
        hintType: 'trait', hintKey: 'strength',
        effects: { prestige: 4 }, realm: { east: { attitude: -30, power: 5 } },
        provinceEffects: { 'sokoli-hvozd': { unrest: 20, garrison: -15 } },
        chronicle: 'Posel odjel s urážkou. Za hvozdem se od té chvíle mluví o zradě a o tom, jak ji splatit.',
      },
    ],
  },

  // ---------- chapter cards for the titles inside a stage (engine.js TIER_CHAPTERS, realms.js) ----------
  {
    id: 'kapitola_svoboda',
    scenario: 'sedlak', forced: true, free: true,
    image: 'assets/events/doziny.jpg',
    title: 'Svobodní',
    text: 'V truhle leží listina s panskou pečetí a v ní stojí, že rod {dynastyName} už nikomu nepatří. Roboty je konec; dávky se platí v penězích a kdo chce, může jít, kam ho nohy nesou. Ve vsi se na tebe dívají jinak — jedni s obdivem, druzí se závistí. A {lord.title} {lord.name} si dobře pamatuje, že {R:jsi mu utekl|jsi mu utekla} z ruky.',
    choices: [
      {
        label: 'Uspořádat hostinu pro celou ves',
        hintType: 'resource', hintKey: 'prestige',
        effects: { gold: -4, prestige: 5 },
        chronicle: 'Na gruntu se slavilo do rána. Kdo přišel, ten si to pamatuje — a kdo nepřišel, taky.',
      },
      {
        label: 'Hned zítra zase na pole — svoboda se musí uživit',
        hintType: 'trait', hintKey: 'patience',
        effects: { food: 4, stability: 3 },
        chronicle: 'Žádné slavnosti. Svobodný sedlák orá stejně jako nevolník, jen pro sebe.',
      },
      {
        label: 'Najmout první čeledíny za mzdu',
        requires: (s) => s.resources.gold >= 8,
        hintType: 'resource', hintKey: 'army',
        effects: { gold: -8, army: 6 },
        chronicle: 'Na grunt přišli první lidé, kteří tu pracují za groše, ne z povinnosti.',
      },
    ],
  },
  {
    id: 'kapitola_velmoz',
    scenario: 'slechtic', forced: true, free: true,
    image: 'assets/events/n_povyseni.jpg',
    title: 'Mezi velmoži',
    text: 'Rod {dynastyName} sedí na sněmu mezi nejmocnějšími pány země. Ti, kdo se dřív smáli skokanovi, teď posílají dary a nabízejí sňatky. Výš už vede jen jedna cesta — a všichni u dvora vědí, kam se díváš. {king.Title} {king.name} taky.',
    choices: [
      {
        label: 'Ujistit krále o své věrnosti',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 8, legitimacy: -2 },
        chronicle: '{ruler.name} {R:poklekl|poklekla} před trůnem a přísahal{R:|a} věrnost. Dvůr si oddechl. Zatím.',
      },
      {
        label: 'Pozvat hlavy ostatních rodů na hostinu',
        hintType: 'trait', hintKey: 'eloquence',
        effects: { gold: -10 }, houseEffects: { '*': { attitude: 6 } },
        chronicle: 'U stolu rodu {dynastyName} se sešly všechny velké rody. Mluvilo se o lovu, o počasí — a o králově zdraví.',
      },
      {
        label: 'Začít tiše shromažďovat muže a zbraně',
        hintType: 'resource', hintKey: 'army',
        effects: { gold: -8, army: 6, favor: -4 },
        chronicle: 'Do zbrojnice tvrze přibyla kopí a do kasáren muži. Kdo se ptá proč, dostane odpověď o lapcích na cestách.',
      },
    ],
  },
  {
    id: 'kapitola_cisar',
    scenario: 'panovnik', forced: true, free: true,
    image: 'assets/events/kapitola_koruna.jpg',
    title: 'Tři koruny',
    text: 'Na sametu před oltářem leží tři koruny a biskup je zvedá jednu po druhé. {ruler.name} z rodu {dynastyName} vládne Vlčímu Údělu i dobytým zemím za horami a za hvozdem. Rod, který kdysi platil dávky, teď přijímá hold od králů. Takovou říši je ale těžší udržet než získat.',
    choices: [
      {
        label: 'Dát dobytým zemím jejich vlastní práva',
        hintType: 'trait', hintKey: 'patience',
        effects: { gold: -10, stability: 4 }, realm: { east: { attitude: 12 }, north: { attitude: 12 } },
        chronicle: 'Dobyté země si ponechaly své zákony a zvyky. Daně platí koruně, srdce zůstala jejich.',
      },
      {
        label: 'Vládnout všem jednou rukou',
        hintType: 'trait', hintKey: 'strength',
        effects: { prestige: 8, gold: 6 }, realm: { east: { attitude: -8 }, north: { attitude: -8 } },
        chronicle: 'Jeden zákon, jedna daň, jeden pán. Úředníci z Vlčího Údělu odjeli do nových zemí a nikdo je tam nevítal.',
      },
    ],
  },
  {
    id: 'kapitola_cizi_koruna',
    scenario: 'panovnik', forced: true, free: true,
    image: 'assets/events/kapitola_koruna.jpg',
    title: 'Koruna {conquest.gen}',
    text: '{conquest.old} {conquest.yield}. Rod {dynastyName} teď vládne dvěma zemím. Ve Vlčím Údělu se slaví, ale {conquest.loc} se na {R:nového pána|novou paní} dívají lidé, kteří včera ještě bojovali proti {R:němu|ní}. Jak se k nim zachovat, rozhodne, jestli bude nová koruna pevná, nebo zda se při první slabosti rozpadne.',
    choices: [
      {
        label: 'Potvrdit jim jejich zákony a zvyky',
        hintType: 'trait', hintKey: 'patience',
        effects: { gold: -6, legitimacy: 4 }, realm: { conquest: { attitude: 10 } },
        chronicle: 'Dobytá země si ponechala své zákony. Platí daně nové koruně, ale žije po svém.',
      },
      {
        label: 'Dosadit do hradů vlastní hejtmany',
        hintType: 'trait', hintKey: 'strength',
        effects: { prestige: 6, gold: 4 }, realm: { conquest: { attitude: -6 } },
        chronicle: 'Do hradů v dobyté zemi nastoupili hejtmani z Vlčího Údělu. Poslušnost přišla rychle, láska nepřišla vůbec.',
      },
      {
        label: 'Rozdat vojákům podíl z kořisti',
        hintType: 'resource', hintKey: 'army',
        effects: { gold: -8, army: 6, stability: 3 },
        chronicle: 'Kořist z dobyté země se rozdělila mezi ty, kdo ji dobyli. V kasárnách se pilo na zdraví nového pána.',
      },
    ],
  },
  {
    id: 'zlaty_vek',
    scenario: 'panovnik', forced: true,
    image: 'assets/endings/ending_golden_age.jpg',
    title: 'Zlatý věk',
    text: 'Tři roky míru, plných sýpek a věrných krajů. Kronikáři už píší o zlatém věku rodu {dynastyName} a v krčmách se zpívá o {R:moudrém králi|moudré královně} z rodu, na který si ještě nedávno nikdo nevzpomněl. Je to vrchol, na kterém se dá s ctí skončit. Za hranicemi ale leží další koruny — a sláva, která nic nechce, se rychle stává vzpomínkou.',
    choices: [
      {
        label: 'Uzavřít kroniku na vrcholu slávy',
        hintType: 'trait', hintKey: 'patience',
        hiddenEffects: { setFlag: 'zlaty_vek' },
        endGame: 'golden_age',
        chronicle: 'Kronika rodu {dynastyName} končí zlatým věkem.',
      },
      {
        label: 'Říše čeká — vládnout dál',
        requires: (s) => !!s.realms && Object.values(s.realms).filter((r) => r.owner === 'player').length < 2,
        hintType: 'trait', hintKey: 'strength',
        hiddenEffects: { setFlag: 'zlaty_vek' },
        effects: { prestige: 5 },
        ambition: 'cisarstvi',
        chronicle: '{ruler.name} se nespokojil{R:|a} se zlatým věkem. Pohled koruny se obrátil za hranice.',
      },
      {
        label: 'Vládnout dál a střežit, co bylo dobyto',
        hintType: 'trait', hintKey: 'intelligence',
        hiddenEffects: { setFlag: 'zlaty_vek' },
        effects: { stability: 3 },
        chronicle: 'Kronika pokračuje. Zlatý věk se nevyhlašuje, ten se musí udržet.',
      },
    ],
  },
];
