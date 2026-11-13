// Sedlák scenario — a serf family on a farm in Lipnice climbs from the plough
// to freedom (tier 2) and on to nobility (tier 3, ending 'ennobled', after which
// the save continues as the Šlechtic scenario). Resources are relabelled in
// data.js: gold = groše, food = zásoby, army = čeleď, stability = grunt,
// prestige = pověst, favor = přízeň pána. {lord.*} and {village} come from engine.js.

const S = 'sedlak';
const img = (id) => `assets/events/${id}.jpg`;
const tier = (s) => s.ruler.statusTier;

export const PEASANT_EVENTS = [
  // ===================== THE LORD AND HIS PEOPLE =====================

  {
    id: 's_robota',
    scenario: S, cooldown: 8, seasons: [1, 2],
    requires: (s) => tier(s) === 1,
    image: img('n_robota'),
    title: 'Robota',
    text: 'Panský dráb obchází ves s holí v ruce. Na panském poli se žne a {lord.title} {lord.name} chce tři dny roboty navíc. Tvé vlastní obilí přitom stojí na poli a čeká.',
    choices: [
      {
        label: 'Jít a odvést poctivou práci',
        hintType: 'resource', hintKey: 'favor',
        effects: { food: -4, favor: 6 },
        chronicle: 'Tři dny na panském poli od tmy do tmy. Dráb si tě poznamenal jako spolehlivého.',
      },
      {
        label: 'Poslat místo sebe čeleď',
        hintType: 'resource', hintKey: 'army',
        effects: { army: -2, food: -2, favor: 2 },
        chronicle: 'Na panské pole šla čeleď. Dráb se mračil, ale počet sedí.',
      },
      {
        label: 'Vymluvit se na nemoc',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.45, traitKey: 'eloquence', traitScale: 0.04,
        onSuccess: { effects: { food: 3 }, traitGain: 'eloquence', chronicle: 'Dráb uvěřil a ty jsi {R:sklidil|sklidila} vlastní pole včas.' },
        onFailure: { effects: { favor: -10, prestige: -2 }, chronicle: 'Dráb tě viděl na poli zdravého jako řepa. {L:Pán|Paní} se to dozví.' },
      },
    ],
  },

  {
    id: 's_drab',
    scenario: S, cooldown: 10, minTurn: 3,
    image: img('n_kraluv_vybirci'),
    title: 'Dráb si přišel',
    text: 'Panský dráb stojí na zápraží a tvrdí, že dávky jsou letos vyšší. Na listině nic takového není, ale on číst umí a ty ne. Aspoň si to myslí.',
    choices: [
      {
        label: 'Zaplatit, ať je pokoj',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -5 },
        chronicle: 'Dráb odešel s plným měšcem a úsměvem. Vrátí se.',
      },
      {
        label: 'Trvat na tom, co stojí v listině',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.45, traitKey: 'intelligence', traitScale: 0.05,
        onSuccess: { effects: { prestige: 5 }, traitGain: 'intelligence', chronicle: 'Listinu jsi {R:přečetl|přečetla} nahlas před celou vsí. Dráb zrudl a odešel s prázdnou.' },
        onFailure: { effects: { gold: -8, favor: -6 }, chronicle: 'Dráb si stěžoval u {L:pána|paní}, že jsi vzpurn{R:ý|á}. Zaplatil{R:|a} jsi víc, než chtěl.' },
      },
      {
        label: 'Vyhodit ho ze dvora',
        combat: 'drab', // fought out in rounds (combat.js)
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.35, traitKey: 'strength', traitScale: 0.05,
        onSuccess: { effects: { prestige: 8, favor: -4 }, traitGain: 'strength', chronicle: 'Dráb letěl přes plot rovnou do louže. Ves se smála ještě týden.' },
        onFailure: { effects: { favor: -15, stability: -4 }, chronicle: 'Dráb se vrátil se dvěma pacholky. Za ránu panskému úředníkovi se platí krví i groši.' },
      },
    ],
  },

  {
    id: 's_pan_navsteva',
    scenario: S, cooldown: 10, minTurn: 4,
    image: img('n_kralova_navsteva'),
    title: '{lord.Title} projíždí vsí',
    text: '{lord.Title} {lord.name} projíždí s družinou vsí Lipnice a zastavil{L:|a} se právě u tvého gruntu. Koně jsou žízniví, družina hladová a {L:pánův pohled|pohled paní} zkoumá tvou stodolu.',
    choices: [
      {
        label: 'Pohostit družinu tím nejlepším',
        hintType: 'resource', hintKey: 'favor',
        effects: { food: -6, gold: -2, favor: 9 },
        chronicle: '{lord.Title} {lord.name} odjížděl{L:|a} sytý a spokojený. Zapamatuje si, kde se dobře jí.',
      },
      {
        label: 'Schovat dobrou úrodu a ukázat bídu',
        hintType: 'trait', hintKey: 'patience',
        isRoll: true, baseChance: 0.5, traitKey: 'patience', traitScale: 0.04,
        onSuccess: { effects: { favor: 2 }, traitGain: 'patience', chronicle: '{L:Pán viděl|Paní viděla} jen prázdné sýpky a {L:odpustil|odpustila} ti část dávek. Pytle ve stodole pod senem mlčí.' },
        onFailure: { effects: { favor: -10, food: -4 }, chronicle: '{L:Pánův pes|Pes paní} vyhrabal pytle pod senem. Lež se trestá dvakrát.' },
      },
      {
        label: 'Postěžovat si na drába',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.45, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { favor: 4, gold: 4, prestige: 4 }, traitGain: 'eloquence', chronicle: '{L:Pán si stížnost vyslechl|Paní si stížnost vyslechla} a drábovi {L:vyměřil|vyměřila} ránu holí. Ves ti děkuje.' },
        onFailure: { effects: { favor: -6 }, chronicle: '{L:Pán se zamračil|Paní se zamračila}: sedlák, který si stěžuje, je sedlák, který nepracuje.' },
      },
    ],
  },

  {
    id: 's_pansky_hon',
    scenario: S, cooldown: 9, seasons: [1, 2],
    image: img('lapkove_ve_hvozdu'),
    title: 'Panský hon',
    text: 'Panský hon se řítí přes tvé pole. Psi, koně a panští hosté dupou v obilí, které mělo živit tvou rodinu přes zimu.',
    choices: [
      {
        label: 'Protestovat u vrchnosti',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.4, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { gold: 6, favor: -2 }, traitGain: 'eloquence', chronicle: '{L:Pán ti pro klid hodil|Paní ti pro klid hodila} pár grošů. Hosté se smáli, ale {L:zaplatil|zaplatila}.' },
        onFailure: { effects: { favor: -8, food: -6 }, chronicle: '{L:Pán tě nechal|Paní tě nechala} odehnat od koně. Obilí je pošlapané a ty k tomu i ponížen{R:ý|á}.' },
      },
      {
        label: 'Mlčet a sbírat, co zbylo',
        hintType: 'trait', hintKey: 'patience',
        effects: { food: -6 },
        chronicle: 'Polovina pole je ztracená. Druhou polovinu jste sklidili do posledního klasu.',
      },
      {
        label: 'Nabídnout se jako honec za groš',
        hintType: 'resource', hintKey: 'favor',
        effects: { food: -4, gold: 3, favor: 4 },
        chronicle: 'Celý den jsi {R:hnal|hnala} zvěř pod kuše panského honu. Pole je pošlapané, ale {lord.title} {lord.name} si tě {L:všiml|všimla}.',
      },
    ],
  },

  {
    id: 's_pytlactvi',
    scenario: S, cooldown: 10,
    requires: (s) => s.resources.food < 35,
    image: img('n_pytlaci'),
    title: 'Jelen v panském lese',
    text: 'Zásoby docházejí a v panském lese se pase jelen. Stačí jedna noc, jedna smyčka a nikdo se to nedozví. Za pytláctví se ale věší.',
    choices: [
      {
        label: 'Jít v noci do lesa',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.5, traitKey: 'intelligence', traitScale: 0.04,
        onSuccess: { effects: { food: 12 }, traitGain: 'intelligence', chronicle: 'Jelen visí v komoře pod plachtou. Děti se poprvé za měsíc najedly dosyta.' },
        onFailure: { effects: { favor: -16, prestige: -4, gold: -5 }, chronicle: 'Hajný tě chytil se smyčkou v ruce. Pokuta a výprask byly milosrdné. Příště už nebudou.' },
      },
      {
        label: 'Požádat vrchnost o obilí na dluh',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: -3, food: 6 },
        chronicle: '{L:Pán půjčil|Paní půjčila} pytel obilí. Vrátit se bude muset dvojnásobek.',
      },
      {
        label: 'Utáhnout opasky',
        hintType: 'trait', hintKey: 'patience',
        effects: { stability: -3 },
        traitGain: 'patience',
        chronicle: 'Rodina jí jednou denně. Čeleď reptá, ale ruce má čisté.',
      },
    ],
  },

  {
    id: 's_povstani',
    scenario: S, cooldown: 30, minTurn: 12,
    image: img('vzpoura_v_provincii'),
    title: 'Sedláci se bouří',
    text: 'V okolních vsích se sedláci bouří proti robotě. Vůdce povstání čeká v krčmě a {spymaster.title} {spymaster.name} ho kryje. Hledá muže, kteří se nebojí. Kdo se přidá, může vsím vybojovat konec roboty. Nebo provaz.',
    choices: [
      {
        label: 'Přidat se k povstání',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.35, resourceKey: 'army', resourceScale: 0.4,
        chanceBonus: (s) => (s.resources.prestige - 40) / 200,
        onSuccess: { effects: { prestige: 14, favor: -10, stability: 4 }, music: 'battle', chronicle: 'Povstalci donutili {L:pána|paní} ustoupit: robota se zkrátila a jméno rodu {dynastyName} se zpívá po vsích.' },
        onFailure: { effects: { favor: -25, army: -8, prestige: 4 }, music: 'battle', chronicle: 'Povstání bylo rozprášeno. Vůdce visí na lípě u cesty a ty sotva {R:unikl|unikla}.' },
      },
      {
        label: 'Zůstat stranou',
        hintType: 'trait', hintKey: 'patience',
        effects: { prestige: -4 },
        chronicle: 'Do povstání ses nezapojil{R:|a}. Sousedé tě míjejí bez pozdravu.',
      },
      {
        label: 'Udat vůdce vrchnosti',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 15, prestige: -12, gold: 5 },
        courtEffects: { spymaster: { loyalty: -15 } },
        echo: { event: 'ozvena_s_udavac', after: [6, 12] },
        chronicle: '{L:Pán ti za jméno vůdce zaplatil|Paní ti za jméno vůdce zaplatila}. Ves se to dozvěděla dřív, než jsi {R:došel|došla} domů.',
      },
    ],
  },

  {
    id: 's_rychtar_volba',
    scenario: S, cooldown: 30, minTurn: 8,
    requires: (s) => s.resources.prestige >= 35 && !s.flags.s_rychtar,
    target: () => 'chancellor', // the sitting reeve steps down, whoever wins
    image: img('soud_o_mez'),
    title: 'Nový rychtář',
    text: 'Rychtář{T:|ka} {target.name} skládá úřad: {L:pán|paní} chce víc, ves dává míň a {T:on|ona} už nechce stát mezi nimi. Ves volí nového rychtáře a několik hlasů padlo i na tebe. Rychtář má od {L:pána|paní} groš a od vsi starosti.',
    choices: [
      {
        label: 'Ucházet se o úřad',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.3, traitKey: 'eloquence', traitScale: 0.04,
        chanceBonus: (s) => (s.resources.prestige - 35) / 120,
        // the player holds the seal now; the chancellor's seat becomes the alderman (court.js)
        onSuccess: { effects: { prestige: 10, favor: 6 }, hiddenEffects: { setFlag: 's_rychtar' }, replaceCourt: { loyalty: 60, minAge: 35, maxAge: 55 }, traitGain: 'eloquence', chronicle: '{ruler.name} {R:byl zvolen rychtářem|byla zvolena rychtářkou}. Pečetidlo vsi teď leží na tvém stole a {target.name} {T:usedl|usedla} vedle tebe v obecní radě jako {T:konšel|konšelka}.' },
        onFailure: { effects: { prestige: -3 }, replaceCourt: { loyalty: 50, minAge: 35, maxAge: 55 }, chronicle: 'Rychtář{T:em|kou} se stal{T:|a} {T:soused|sousedka} {target.name}. Prý jsi na rychtáře ještě moc mlad{R:ý|á}.' },
      },
      {
        label: 'Podpořit souseda',
        hintType: 'resource', hintKey: 'prestige',
        effects: { prestige: 3 },
        replaceCourt: { loyalty: 68, minAge: 35, maxAge: 55 },
        chronicle: 'Rychtář{T:em|kou} se stal{T:|a} {T:soused|sousedka} {target.name}. Bude si pamatovat, kdo za {T:ním|ní} stál.',
      },
    ],
  },

  // ===================== THE FARM =====================

  {
    id: 's_trh',
    scenario: S, cooldown: 8,
    image: img('trh_v_brode'),
    title: 'Trh v Brodné',
    text: 'V Brodné je velký trh. Kupci z jihu, kováři, dobytkáři i šejdíři. S trochou štěstí se tu dá vydělat. S trochou smůly přijít o všechno.',
    choices: [
      {
        label: 'Prodat tele',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 7, food: -3 },
        chronicle: 'Tele odešlo za dobrou cenu. Ve chlévě je smutno, v měšci veseleji.',
      },
      {
        label: 'Koupit nový pluh',
        requires: (s) => s.resources.gold >= 8,
        hintType: 'resource', hintKey: 'stability',
        effects: { gold: -8, stability: 8 },
        chronicle: 'Nový pluh se železnou radlicí. Pole se letos zorá hlouběji.',
      },
      {
        label: 'Smlouvat o lepší kus dobytka',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.45, traitKey: 'intelligence', traitScale: 0.05,
        onSuccess: { effects: { gold: 3, stability: 4 }, traitGain: 'intelligence', chronicle: 'Kupec nakonec povolil. Vrátil{R:|a} ses s jalovicí a ještě s groši navíc.' },
        onFailure: { effects: { gold: -5 }, chronicle: 'Kráva, kterou jsi {R:koupil|koupila}, je stará a neplodná. Šejdíř už je za horami.' },
      },
    ],
  },

  {
    id: 's_krupobiti',
    scenario: S, cooldown: 9, seasons: [0, 1],
    image: img('n_spatna_uroda'),
    title: 'Krupobití',
    text: 'Z černého mraku se sypaly kroupy velké jako holubí vejce. Obilí leží rozmlácené v blátě a do žní daleko.',
    choices: [
      {
        label: 'Rychle zasít znovu',
        hintType: 'resource', hintKey: 'army',
        effects: { army: -2, food: -3, stability: -2 },
        chronicle: 'Celá rodina i čeleď seli do noci. Úroda bude pozdní, ale bude.',
      },
      {
        label: 'Prosit vrchnost o odpuštění dávek',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.4, traitKey: 'eloquence', traitScale: 0.04,
        chanceBonus: (s) => (s.resources.favor - 50) / 150,
        onSuccess: { effects: { food: 4 }, chronicle: '{L:Pán letos odpustil|Paní letos odpustila} polovinu dávek. Přežije se.' },
        onFailure: { effects: { food: -8, favor: -3 }, chronicle: '{L:Pán odpověděl|Paní odpověděla}, že kroupy padaly na všechny. Dávky zůstanou.' },
      },
      {
        label: 'Uspořádat procesí za dobrou úrodu',
        hintType: 'resource', hintKey: 'faith',
        effects: { food: -6, faith: 6, prestige: 2 },
        chronicle: 'Ves šla s korouhvemi kolem polí. Kroupy už nepřišly. Možná náhoda.',
      },
    ],
  },

  {
    id: 's_spatna_uroda',
    scenario: S, cooldown: 9, seasons: [2],
    image: img('n_spatna_uroda'),
    title: 'Slabé žně',
    text: 'Letošní žně jsou slabé. Sýpka se plní pomalu a zima bude dlouhá. Čeleď se ptá, jestli přes zimu dostane najíst.',
    choices: [
      {
        label: 'Propustit část čeledi',
        hintType: 'resource', hintKey: 'army',
        effects: { army: -5, food: 5 },
        chronicle: 'Dva čeledíni odešli hledat službu jinde. Zbylo méně úst i méně rukou.',
      },
      {
        label: 'Prodat krávu',
        hintType: 'resource', hintKey: 'stability',
        effects: { stability: -6, food: 4, gold: 4 },
        chronicle: 'Kráva odešla na trh. Bez ní bude jaro těžší.',
      },
      {
        label: 'Vydržet a šetřit',
        hintType: 'trait', hintKey: 'patience',
        effects: { food: -3 },
        traitGain: 'patience',
        chronicle: 'Ve stavení se šetří každá kůrka. Zima to prověří.',
      },
    ],
  },

  {
    id: 's_pozar_stodoly',
    scenario: S, cooldown: 11, minTurn: 3,
    image: img('pozar_mesta'),
    title: 'Hoří stodola',
    text: 'V noci chytila stodola. Jestli od lucerny, od blesku, nebo od souseda Hrubého, se kterým se léta přeš o mez, nikdo neví.',
    choices: [
      {
        label: 'Postavit ji znovu se sousedy',
        hintType: 'resource', hintKey: 'prestige',
        effects: { gold: -4, stability: -3, prestige: 3 }, farm: { grain: -99 }, // the sacks inside burnt with it
        chronicle: 'Půl vsi přišlo s trámy a sekerami. Stodola stojí a sousedství drží.',
      },
      {
        label: 'Postavit ji sám bez cizí pomoci',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -10 }, farm: { grain: -99 },
        chronicle: 'Nová stodola stála peníze, ale nikomu nic nedlužíš.',
      },
      {
        label: 'Obvinit souseda Hrubého',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.4, traitKey: 'intelligence', traitScale: 0.04,
        onSuccess: { effects: { gold: 6, stability: -3, prestige: 4 }, farm: { grain: -99 }, chronicle: 'U Hrubého se našla tvoje lucerna. Zaplatí škodu do posledního groše.' },
        onFailure: { effects: { stability: -6, prestige: -6 }, farm: { grain: -99 }, courtEffects: { chancellor: { loyalty: -6 } }, chronicle: 'Důkazy nebyly. Hrubý se směje a ves si šeptá o tvé zlé krvi.' },
      },
    ],
  },

  {
    id: 's_vlci',
    scenario: S, cooldown: 9, seasons: [3, 0],
    image: img('vlci'),
    title: 'Vlci u ovčína',
    text: 'Za mrazivých nocí chodí vlci až k ovčínu. Dvě ovce už chybí a psi se bojí vyjít ven.',
    choices: [
      {
        label: 'Počkat na ně s kopím',
        combat: 'vlk', // fought out in rounds (combat.js)
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.45, traitKey: 'strength', traitScale: 0.05,
        onSuccess: { effects: { prestige: 6 }, traitGain: 'strength', chronicle: 'Vlčí kůže visí na vratech. Ves ví, kdo ji tam pověsil.' },
        onFailure: { effects: { stability: -4, army: -2 }, injury: 'rana', chronicle: 'Vlk byl rychlejší. Kousnutí se hojí dlouho a pole čeká.' },
      },
      {
        label: 'Nastražit oka a jámy',
        hintType: 'trait', hintKey: 'intelligence',
        effects: { gold: -2, stability: 1 },
        chronicle: 'Do jámy spadl jeden vlk. Ostatní pochopili.',
      },
      {
        label: 'Zavřít stádo a čekat na jaro',
        hintType: 'trait', hintKey: 'patience',
        effects: { food: -4, stability: -2 },
        chronicle: 'Ovce stojí celou zimu ve chlévě. Seno dochází rychleji, než se čekalo.',
      },
    ],
  },

  {
    id: 's_mor',
    scenario: S, cooldown: 20, minTurn: 10,
    image: img('mor_v_pristavu'),
    title: 'Mor v kraji',
    text: 'Z Brodné přišla zpráva, kterou nikdo nechtěl slyšet: mor. Ve vedlejší vsi už zvoní umíráček každý den.',
    choices: [
      {
        label: 'Zavřít grunt a nikoho nepouštět',
        hintType: 'trait', hintKey: 'patience',
        effects: { food: -5, prestige: -2 },
        chronicle: 'Vrata zůstala zavřená celé týdny. Mor šel kolem.',
      },
      {
        label: 'Utéct s rodinou do lesa',
        hintType: 'resource', hintKey: 'stability',
        effects: { stability: -8, army: -2 },
        chronicle: 'Rodina přečkala mor v lesní chýši. Grunt mezitím zarůstá.',
      },
      {
        label: 'Pomáhat nemocným ve vsi',
        hintType: 'resource', hintKey: 'faith',
        isRoll: true, baseChance: 0.55, traitKey: 'strength', traitScale: 0.03,
        onSuccess: { effects: { faith: 8, prestige: 10 }, chronicle: 'Nosil{R:|a} jsi vodu a chleba do nakažených chalup. Bůh tě ušetřil a ves na to nezapomene.' },
        onFailure: { effects: { army: -8, faith: 4, prestige: 6 }, noInjury: true, chronicle: 'Mor si vzal dva čeledíny. Ves ti ale za pomoc líbá ruce.' },
      },
    ],
  },

  {
    id: 's_mlynar',
    scenario: S, cooldown: 9,
    image: img('n_mlyn'),
    title: 'Mlynář šidí',
    text: 'Z pytle obilí se vrátilo míň mouky, než by mělo. Mlynář krčí rameny: mlýn prý ztrácí. Jenže jen tvoje obilí.',
    choices: [
      {
        label: 'Postavit se mu na mlýnici',
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.5, traitKey: 'strength', traitScale: 0.04,
        onSuccess: { effects: { food: 4, prestige: 3 }, chronicle: 'Mlynář pochopil, že s tebou se šidit nevyplácí. Doplnil mouku i s omluvou.' },
        onFailure: { effects: { prestige: -3, favor: -3 }, noInjury: true, chronicle: 'Mlynář je {L:pánův|panin} člověk. Stížnost skončila na panském dvoře a tobě to nepomohlo.' },
      },
      {
        label: 'Vozit obilí do jiného mlýna',
        hintType: 'resource', hintKey: 'army',
        effects: { army: -1, gold: -2 },
        chronicle: 'Cesta do vzdáleného mlýna stojí den a groš. Ale mouka sedí.',
      },
      {
        label: 'Mlčet',
        hintType: 'trait', hintKey: 'patience',
        effects: { food: -4 },
        chronicle: 'Mlynář šidí dál. Ty to víš a on ví, že to víš.',
      },
    ],
  },

  {
    id: 's_kramar',
    scenario: S, cooldown: 10,
    image: img('kupci_z_jihu'),
    title: 'Cizí osivo',
    text: 'Potulný kramář nabízí osivo z jihu. Prý roste dvakrát rychleji a snese sucho i mráz. Prý.',
    choices: [
      {
        label: 'Koupit a zkusit to',
        requires: (s) => s.resources.gold >= 5,
        hintType: 'resource', hintKey: 'gold',
        isRoll: true, baseChance: 0.45, traitKey: 'intelligence', traitScale: 0.03,
        onSuccess: { effects: { gold: -5, food: 6, stability: 6 }, chronicle: 'Cizí obilí vzešlo husté a zlaté. Sousedé chodí na mez koukat.' },
        onFailure: { effects: { gold: -5, food: -2 }, chronicle: 'Z cizího osiva vzešel plevel. Kramář je dávno pryč.' },
      },
      {
        label: 'Poslat ho dál',
        hintType: 'trait', hintKey: 'patience',
        effects: {},
        chronicle: 'Kramář odešel do další vsi. Co nevíš, to tě nepálí.',
      },
    ],
  },

  {
    id: 's_poklad',
    scenario: S, oneTime: true, minTurn: 6,
    image: img('stribrna_zila'),
    title: 'Hrnec v brázdě',
    text: 'Pluh zavadil o něco tvrdého. V brázdě leží rozbitý hliněný hrnec a v něm stříbrné mince s tváří krále, kterého nikdo nepamatuje. Všechno, co je v zemi, patří vrchnosti.',
    choices: [
      {
        label: 'Nechat si ho a mlčet',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 15 },
        echo: { event: 'ozvena_s_poklad', after: [4, 10] },
        chronicle: 'Mince jsou zakopané pod prahem. Kdo by se díval.',
      },
      {
        label: 'Odevzdat ho vrchnosti',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 12, gold: 3 },
        chronicle: '{L:Pán poklad přijal a hodil|Paní poklad přijala a hodila} ti z něj tři mince. Poctivost se prý vyplácí.',
      },
      {
        label: 'Darovat ho kostelu',
        hintType: 'resource', hintKey: 'faith',
        effects: { faith: 10, prestige: 5, favor: -2 },
        chronicle: 'Farář posvětil nový kalich. {L:Pán|Paní} se mračí, ale proti kostelu neřekne nic.',
      },
    ],
  },

  {
    id: 's_lichvar',
    scenario: S, cooldown: 30,
    requires: (s) => !s.flags.s_dluh,
    image: img('lichvar'),
    title: 'Peníze na dluh',
    text: 'Lichvář z Brodné nabízí půjčku. Dvacet grošů hned, splatit za dva roky. O úroku se mluví potichu.',
    choices: [
      {
        label: 'Půjčku vzít',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 20 },
        hiddenEffects: { setFlag: 's_dluh' },
        chronicle: 'Dvacet grošů v měšci a jméno v lichvářově knize.',
      },
      {
        label: 'Odmítnout',
        hintType: 'trait', hintKey: 'patience',
        effects: {},
        chronicle: 'Kdo si nepůjčí, nemusí splácet.',
      },
    ],
  },

  {
    id: 's_lichvar_splatka',
    scenario: S, weight: 3, cooldown: 12, minTurn: 8,
    requires: (s) => s.flags.s_dluh && (s.eventHistory || {}).s_lichvar !== undefined && s.turn - s.eventHistory.s_lichvar >= 8,
    image: img('lichvar_splatka'),
    title: 'Lichvář je zpátky',
    text: 'Lichvář stojí na zápraží s knihou pod paží. Dvacet grošů se za dva roky proměnilo ve třicet.',
    choices: [
      {
        label: 'Splatit všechno',
        requires: (s) => s.resources.gold >= 30,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -30 },
        hiddenEffects: { clearFlag: 's_dluh' },
        chronicle: 'Dluh je splacen. Lichvář škrtl tvé jméno a šel hledat dalšího.',
      },
      {
        label: 'Vyjednat odklad',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.45, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { gold: -12 }, hiddenEffects: { clearFlag: 's_dluh' }, traitGain: 'eloquence', chronicle: 'Lichvář se spokojil s menší částkou. Prý z lítosti. Spíš z vypočítavosti.' },
        onFailure: { effects: { gold: -10, stability: -10 }, hiddenEffects: { clearFlag: 's_dluh' }, chronicle: 'Lichvář si za dluh odvedl krávu i pluh.' },
      },
      {
        label: 'Dát mu do zástavy pole',
        hintType: 'resource', hintKey: 'stability',
        effects: { stability: -14 },
        hiddenEffects: { clearFlag: 's_dluh' },
        chronicle: 'Nejlepší pole teď patří lichvářovi. Grunt se zmenšil o kus srdce.',
      },
    ],
  },

  // ===================== FAMILY AND VILLAGE =====================

  {
    id: 's_nemoc_ditete',
    scenario: S, cooldown: 11,
    requires: (s) => s.heir.alive && s.heir.age < 12,
    image: img('nemoc_vladce'),
    title: 'Horečka',
    text: '{heir.name} leží v horečce a nepoznává ani vlastní mámu. Do rána se rozhodne. Pomoc je drahá, a ta nejlevnější je kořenářka za lesem.',
    choices: [
      {
        label: 'Poslat pro kořenářku',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.6, traitKey: 'intelligence', traitScale: 0.03,
        onSuccess: { effects: { gold: -2 }, courtEffects: { heir: { loyalty: 6 } }, chronicle: 'Kořenářka uvařila odvar a do rána horečka spadla.' },
        onFailure: { effects: { gold: -2, stability: -5 }, chronicle: 'Odvar nepomohl. Horečka trvala týdny a pole mezitím zarostlo.' },
      },
      {
        label: 'Pozvat faráře k modlitbám',
        hintType: 'resource', hintKey: 'faith',
        isRoll: true, baseChance: 0.45, traitKey: 'patience', traitScale: 0.03,
        onSuccess: { effects: { faith: 6 }, chronicle: 'Farář se modlil celou noc. Ráno si {heir.name} řekl{D:|a} o mléko.' },
        onFailure: { effects: { faith: 2, stability: -5 }, chronicle: 'Modlitby pomáhaly jen pomalu. Rodina bděla u lůžka celé týdny.' },
      },
      {
        label: 'Přivést ranhojiče z Brodné',
        requires: (s) => s.resources.gold >= 10,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -10 },
        courtEffects: { heir: { loyalty: 8 } },
        chronicle: 'Ranhojič z Brodné stál víc než tele. Ale {heir.name} je zdrav{D:ý|á}.',
      },
    ],
  },

  {
    id: 's_vychova',
    scenario: S, cooldown: 11,
    requires: (s) => s.heir.alive && s.heir.age >= 8 && s.heir.age < 16,
    image: img('vychova_dedice'),
    title: 'Čemu se bude učit',
    text: '{heir.name} dorůstá. {marshal.Title} {marshal.name} nabízí učení v kovárně, farář místo v klášterní škole a doma je práce pro dva.',
    choices: [
      {
        label: 'Do učení v kovárně',
        hintType: 'trait', hintKey: 'strength',
        effects: { gold: -4 },
        courtEffects: { marshal: { loyalty: 6 } },
        heirTraits: { strength: 2 },
        chronicle: '{heir.name} bije kladivem do železa od rána do večera. Ruce má jako dospělý.',
      },
      {
        label: 'Do klášterní školy',
        hintType: 'trait', hintKey: 'intelligence',
        effects: { gold: -6, faith: 3 },
        heirTraits: { intelligence: 2 },
        chronicle: '{heir.name} se učí číst a psát. V rodu {dynastyName} je to poprvé.',
      },
      {
        label: 'Nechat doma na gruntu',
        hintType: 'trait', hintKey: 'patience',
        effects: { army: 2 },
        heirTraits: { patience: 1, strength: 1 },
        chronicle: '{heir.name} zůstává doma a pracuje s ostatními. Grunt jednou převezme {D:ten|ta}, kdo ho zná.',
      },
    ],
  },

  {
    id: 's_svatba',
    scenario: S, cooldown: 9,
    image: img('doziny'),
    title: 'Svatba ve vsi',
    text: 'Sousedova dcera se vdává a celá ves je pozvaná. Kdo vystrojí hostinu nebo přinese bohatý dar, o tom se bude mluvit do příštích žní.',
    choices: [
      {
        label: 'Nabídnout dvůr a stoly na hostinu',
        hintType: 'resource', hintKey: 'prestige',
        effects: { food: -6, prestige: 8 },
        chronicle: 'Na tvém dvoře se tančilo do rána. Ves o té svatbě mluví dodnes.',
      },
      {
        label: 'Přinést pěkný dar',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -3, prestige: 3 },
        chronicle: 'Dar byl pěkný a nevěsta se usmívala.',
      },
      {
        label: 'Zůstat doma u práce',
        hintType: 'trait', hintKey: 'patience',
        effects: { stability: 2, prestige: -2 },
        chronicle: 'Zatímco ves tančila, ty jsi {R:opravoval|opravovala} plot. Někdo to musí dělat.',
      },
    ],
  },

  {
    id: 's_spor_o_mez',
    scenario: S, cooldown: 9,
    image: img('soud_o_mez'),
    title: 'Mez se posunula',
    text: 'Soused Hrubý přeoral mez o dobré tři brázdy. Tvrdí, že tam vždycky byla. Kámen, který ji značil, se nějak ztratil.',
    choices: [
      {
        label: 'Jít za rychtářem',
        requires: (s) => !s.flags.s_rychtar,
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.45, traitKey: 'eloquence', traitScale: 0.04,
        chanceBonus: (s) => (s.chancellor.loyalty - 50) / 200,
        onSuccess: { effects: { stability: 3, prestige: 3 }, courtEffects: { chancellor: { loyalty: 3 } }, traitGain: 'eloquence', chronicle: 'Rychtář přeměřil mez podle starých zápisů. Hrubý musí vrátit, co ukradl.' },
        onFailure: { effects: { stability: -4 }, chronicle: 'Rychtář dal za pravdu Hrubému. Prý se spolu znají od dětství.' },
      },
      {
        label: 'Přeměřit mez podle obecní knihy',
        requires: (s) => s.flags.s_rychtar,
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.45, traitKey: 'intelligence', traitScale: 0.04,
        chanceBonus: (s) => (s.chancellor.loyalty - 50) / 200,
        onSuccess: { effects: { stability: 3, prestige: 3 }, courtEffects: { chancellor: { loyalty: 3 } }, traitGain: 'intelligence', chronicle: 'S konšely a se starými zápisy v ruce jsi {R:přeměřil|přeměřila} mez před celou vsí. Hrubý musí vrátit, co ukradl.' },
        onFailure: { effects: { stability: -4, prestige: -2 }, chronicle: 'Hrubý křičí po celé vsi, že rychtář soudí ve vlastní při. Mez zůstala, kde je, a lidé si šeptají.' },
      },
      {
        label: 'Vyřídit si to s Hrubým po svém',
        combat: 'hruby', // fought out in rounds (combat.js)
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.5, traitKey: 'strength', traitScale: 0.04,
        onSuccess: { effects: { prestige: 5, stability: 3 }, traitGain: 'strength', chronicle: 'Hrubý odešel s monoklem a mez je zpátky tam, kde má být.' },
        onFailure: { effects: { prestige: -5, favor: -4 }, chronicle: 'Rvačka skončila před {L:pánem|paní}. Pokutu platí oba.' },
      },
      {
        label: 'Ustoupit, pro pár brázd se nehádat',
        hintType: 'trait', hintKey: 'patience',
        effects: { stability: -3, prestige: -2 },
        chronicle: 'Hrubý má o tři brázdy víc. A chuť na další.',
      },
    ],
  },

  {
    id: 's_carodejnictvi',
    scenario: S, cooldown: 30, minTurn: 8,
    requires: (s) => s.spouse.alive,
    image: img('carodejnice'),
    title: 'Pomluva',
    text: 'Sousedce pošla kráva a ves si šeptá, že {spouse.name} {M:byl|byla} večer u jejího chléva. Farář se ptá, kdo v rodě {dynastyName} umí zaříkávat.',
    choices: [
      {
        label: 'Postavit se pomluvě před celou vsí',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.5, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { prestige: 5 }, courtEffects: { spouse: { loyalty: 10 } }, traitGain: 'eloquence', chronicle: 'Před celou návsí jsi pomluvu rozcupoval{R:|a} na kusy. Sousedka se nakonec omluvila.' },
        onFailure: { effects: { prestige: -6, faith: -3 }, courtEffects: { spouse: { loyalty: 4 } }, chronicle: 'Ves ti nevěřila. Šeptá se dál a hlasitěji.' },
      },
      {
        label: 'Zaplatit faráři za mši a svěcenou vodu',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -5, faith: 4 },
        chronicle: 'Farář vykropil chlév i stavení. Pomluva utichla, peníze taky.',
      },
      {
        label: 'Nechat to na faráři',
        hintType: 'resource', hintKey: 'faith',
        effects: { faith: 3, prestige: -3 },
        courtEffects: { spouse: { loyalty: -20 } },
        chronicle: 'Farář vyslýchal celé odpoledne. {spouse.name} ti to neodpustí.',
      },
    ],
  },

  {
    id: 's_krcma',
    scenario: S, cooldown: 10,
    image: img('rvaci_v_krcme'),
    title: 'Večer v krčmě',
    text: 'V krčmě se pije, hraje v kostky a mluví. {spymaster.Title} {spymaster.name} ti nalévá a mrkne: kdo si dnes připlatí, ten zítra něco ví.',
    choices: [
      {
        label: 'Zaplatit pár piv a poslouchat',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.5, traitKey: 'intelligence', traitScale: 0.04,
        onSuccess: { effects: { gold: 5, prestige: 1 }, courtEffects: { spymaster: { loyalty: 4 } }, traitGain: 'intelligence', chronicle: 'Formani prozradili, kde se levně prodává dobytek. Výhodný obchod.' },
        onFailure: { effects: { gold: -3, prestige: -2 }, chronicle: 'Pivo teklo, ale moudrost ne. Ráno jen bolí hlava.' },
      },
      {
        label: 'Zahrát si v kostky',
        hintType: 'resource', hintKey: 'gold',
        isRoll: true, baseChance: 0.45,
        onSuccess: { effects: { gold: 6 }, chronicle: 'Kostky padaly na tvou stranu. Formani odcházeli s prázdnými měšci.' },
        onFailure: { effects: { gold: -6 }, chronicle: 'Kostky tě nemají rády. Pivo taky ne.' },
      },
      {
        label: 'Jít domů včas',
        hintType: 'trait', hintKey: 'patience',
        effects: { stability: 1 },
        chronicle: 'Ráno jsi na poli první. Ostatní ještě spí.',
      },
    ],
  },

  {
    id: 's_zvon',
    scenario: S, cooldown: 20,
    image: img('katedrala'),
    title: 'Nový zvon',
    text: 'Starý zvon na kostelíku praskl. Farář obchází ves a vybírá na nový. Kdo přispěje nejvíc, toho jméno bude vyryto na okraji zvonu.',
    choices: [
      {
        label: 'Přispět štědře',
        requires: (s) => s.resources.gold >= 8,
        hintType: 'resource', hintKey: 'prestige',
        effects: { gold: -8, faith: 6, prestige: 6 },
        chronicle: 'Na novém zvonu stojí jméno rodu {dynastyName}. Zvoní pro celou ves.',
      },
      {
        label: 'Odpracovat to při stavbě',
        hintType: 'resource', hintKey: 'faith',
        effects: { army: -1, food: -2, faith: 4 },
        chronicle: 'Vozil{R:|a} jsi dřevo na lešení celý týden. Farář ti žehná.',
      },
      {
        label: 'Nedat nic',
        hintType: 'resource', hintKey: 'gold',
        effects: { faith: -3, prestige: -2 },
        chronicle: 'Farář si tvé jméno zapsal do jiného seznamu.',
      },
    ],
  },

  {
    id: 's_desatek',
    scenario: S, cooldown: 9, seasons: [2, 3],
    image: img('biskupuv_desatek'),
    title: 'Desátek',
    text: 'Farář přišel pro desátek. Každý desátý snop patří kostelu, tak to bylo vždycky. Letos je ale snopů málo a farář tlustý.',
    choices: [
      {
        label: 'Zaplatit celý desátek',
        hintType: 'resource', hintKey: 'faith',
        effects: { food: -5, faith: 6 },
        chronicle: 'Desátý snop odjel na farářově voze. Bůh to vidí.',
      },
      {
        label: 'Vyjednat polovinu',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.5, traitKey: 'eloquence', traitScale: 0.04,
        onSuccess: { effects: { food: -2, faith: 2 }, traitGain: 'eloquence', chronicle: 'Farář se spokojil s polovinou. Prý jen letos.' },
        onFailure: { effects: { food: -5, faith: -3 }, chronicle: 'Farář vzal všechno a z kazatelny pak mluvil o lakotě.' },
      },
      {
        label: 'Odmítnout',
        hintType: 'trait', hintKey: 'strength',
        effects: { faith: -8, prestige: 2, favor: -3 },
        chronicle: 'Farář odešel s prázdnou a s kletbou na rtech. Ves tě obdivuje a bojí se o tebe.',
      },
    ],
  },

  // ===================== WAR AND THE WAY UP =====================

  {
    id: 's_odvod',
    scenario: S, cooldown: 24, minTurn: 6,
    requires: (s) => !s.flags.s_v_poli,
    image: img('n_povolavaci_list'),
    title: 'Odvod',
    text: '{king.Title} {king.name} táhne do války a {lord.title} {lord.name} musí dodat muže. Z každého gruntu jednoho. Kdo půjde, může se vrátit s kořistí, se slávou, nebo vůbec.',
    choices: [
      {
        label: 'Jít osobně',
        hintType: 'trait', hintKey: 'strength',
        effects: { stability: -4, favor: 5 },
        hiddenEffects: { setFlag: 's_v_poli' },
        chronicle: '{ruler.name} {R:odešel|odešla} s kopím na rameni. Grunt teď vede rodina.',
      },
      {
        label: 'Poslat čeledína',
        hintType: 'resource', hintKey: 'army',
        effects: { army: -6, favor: 2 },
        chronicle: 'Čeledín odešel s kopím a s požehnáním. Jestli se vrátí, ví jen Bůh.',
      },
      {
        label: 'Vykoupit se',
        requires: (s) => s.resources.gold >= 10,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -10 },
        chronicle: 'Deset grošů za jednoho muže. Válka se obejde bez tebe.',
      },
    ],
  },

  {
    id: 's_bitva',
    scenario: S, weight: 6, cooldown: 2, music: 'battle',
    requires: (s) => s.flags.s_v_poli,
    image: img('n_kralovska_bitva'),
    title: 'Bitva',
    text: 'Pod korouhví krále stojíš v první řadě sedláků s kopím v ruce. Naproti se řadí jezdci v železe. Rytíři za vašimi zády čekají, kdo uteče první.',
    choices: [
      {
        label: 'Vrhnout se do první řady',
        requires: (s) => s.ruler.statusTier === 1,
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.15, traitKey: 'strength', traitScale: 0.05,
        onSuccess: { setTier: 2, effects: { prestige: 15, favor: 8 }, hiddenEffects: { clearFlag: 's_v_poli' }, traitGain: 'strength', music: 'battle', chronicle: '{ruler.name} {R:zachránil|zachránila} v bitvě korouhev. Za statečnost {R:byl propuštěn|byla propuštěna} z poddanství. Rod {dynastyName} je svobodný!' },
        onFailure: { effects: { stability: -10, army: -3, prestige: 2 }, hiddenEffects: { clearFlag: 's_v_poli' }, injury: 'kulhani', music: 'battle', chronicle: 'Kopí zlomené, noha probodnutá. Domů ses {R:vrátil|vrátila} o holi.' },
      },
      {
        label: 'Vrhnout se do první řady',
        requires: (s) => s.ruler.statusTier >= 2,
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.02, traitKey: 'strength', traitScale: 0.035,
        onSuccess: { effects: { prestige: 15, favor: 6 }, hiddenEffects: { clearFlag: 's_v_poli', setFlag: 's_hrdina' }, traitGain: 'strength', music: 'battle', chronicle: '{ruler.name} {R:prorazil|prorazila} řady nepřítele. Královský maršál se ptal na jméno svobodného sedláka, který bojuje jako rytíř.' },
        onFailure: { effects: { stability: -8, prestige: 2 }, hiddenEffects: { clearFlag: 's_v_poli' }, injury: 'kulhani', music: 'battle', chronicle: 'Kopí zlomené, noha probodnutá. Domů ses {R:vrátil|vrátila} o holi.' },
      },
      {
        label: 'Držet se vzadu a přežít',
        hintType: 'trait', hintKey: 'patience',
        effects: { prestige: -2 },
        hiddenEffects: { clearFlag: 's_v_poli' },
        chronicle: 'Bitva skončila a ty jsi {R:živý|živá}. To je víc, než můžou říct mnozí.',
      },
      {
        label: 'Plenit nepřátelský tábor',
        hintType: 'resource', hintKey: 'gold',
        isRoll: true, baseChance: 0.5, traitKey: 'intelligence', traitScale: 0.03,
        onSuccess: { effects: { gold: 14, faith: -3 }, hiddenEffects: { clearFlag: 's_v_poli' }, chronicle: 'Zatímco jiní umírali, ty jsi {R:plnil|plnila} vak stříbrem.' },
        onFailure: { effects: { favor: -10, prestige: -6 }, hiddenEffects: { clearFlag: 's_v_poli' }, chronicle: 'Rytíři tě chytili při plenění. Výprask a ostuda.' },
      },
    ],
  },

  {
    id: 's_vykup',
    scenario: S, weight: 3, cooldown: 8,
    requires: (s) => s.ruler.statusTier === 1 && s.resources.gold >= 50 && s.resources.favor >= 35,
    image: img('n_koupe_titulu'),
    title: 'Výkup z poddanství',
    text: 'V truhle pod postelí leží víc grošů, než kdy rod {dynastyName} měl. Za ně se dá koupit to nejcennější: svoboda. {lord.Title} {lord.name} je ochoten{L:|a} jednat.',
    choices: [
      {
        label: 'Zaplatit plnou cenu',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -50 },
        setTier: 2,
        chronicle: '{L:Pán přitiskl|Paní přitiskla} pečeť na listinu. Rod {dynastyName} je svobodný. Grunt zůstává, robota končí.',
      },
      {
        label: 'Smlouvat o cenu',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.3, traitKey: 'eloquence', traitScale: 0.05,
        chanceBonus: (s) => (s.resources.favor - 50) / 150,
        onSuccess: { effects: { gold: -38 }, setTier: 2, traitGain: 'eloquence', chronicle: '{lord.Title} nakonec slevil{L:|a}. Rod {dynastyName} je svobodný a v truhle ještě něco zbylo.' },
        onFailure: { effects: { favor: -8 }, chronicle: '{lord.Title} se urazil{L:|a}: svobodu si sedlák nesmlouvá. Přijď znovu, až se naučíš pokoře.' },
      },
      {
        label: 'Ještě počkat',
        hintType: 'trait', hintKey: 'patience',
        effects: {},
        chronicle: 'Groše zůstaly v truhle. Svoboda počká.',
      },
    ],
  },

  {
    id: 's_pole',
    scenario: S, cooldown: 10,
    requires: (s) => s.ruler.statusTier >= 2 && s.resources.gold >= 18,
    image: img('bohata_uroda'),
    title: 'Pole na prodej',
    text: 'Sousední grunt zůstal bez hospodáře a pole jdou na prodej. Svobodný člověk smí kupovat půdu. Poddaný o tom může jen snít.',
    choices: [
      {
        label: 'Koupit pole',
        hintType: 'resource', hintKey: 'stability',
        effects: { gold: -18, stability: 10, prestige: 4 },
        chronicle: 'Grunt rodu {dynastyName} se rozrostl o dvě pole a louku u potoka.',
      },
      {
        label: 'Nechat to být',
        hintType: 'trait', hintKey: 'patience',
        effects: {},
        chronicle: 'Pole koupil někdo jiný. Možná příště.',
      },
    ],
  },

  {
    id: 's_zemansky_statek',
    scenario: S, weight: 3, cooldown: 28,
    requires: (s) => s.ruler.statusTier === 2 && s.resources.gold >= 90 && s.resources.prestige >= 55,
    image: img('n_koupe_titulu'),
    title: 'Zemanský statek',
    text: 'Starý zeman z Pobřežní marky zemřel bez dědiců a jeho tvrz je na prodej i s právem erbu. Kdo ji koupí a dostane královo potvrzení, bude šlechtic. Peníze máš. Královská kancelář ale sedlákům nerada věří.',
    choices: [
      {
        label: 'Koupit tvrz a žádat o erb',
        hintType: 'resource', hintKey: 'gold',
        isRoll: true, baseChance: 0.05, traitKey: 'eloquence', traitScale: 0.025,
        chanceBonus: (s) => (s.resources.prestige - 55) / 150 + (s.resources.favor - 50) / 200,
        onSuccess: { effects: { gold: -90 }, setTier: 3, endGame: 'ennobled', chronicle: 'Král přitiskl pečeť na listinu. Rod {dynastyName} má erb a tvrz u moře.' },
        onFailure: { effects: { gold: -35, prestige: -8 }, chronicle: 'Královská kancelář žádost zamítla: sedlák zůstane sedlákem, i když má zlato. Písaři si ale nechali poplatek.' },
      },
      {
        label: 'Ještě ne',
        hintType: 'trait', hintKey: 'patience',
        effects: {},
        chronicle: 'Tvrz koupil kupec z Brodné. Příležitost se může vrátit.',
      },
    ],
  },

  {
    id: 's_pasovani',
    scenario: S, weight: 5, oneTime: true,
    requires: (s) => s.ruler.statusTier === 2 && s.flags.s_hrdina && s.resources.prestige >= 65,
    image: img('n_povyseni'),
    title: 'Rytířský pás',
    text: 'Královský maršál si pamatuje svobodného sedláka z bitvy. Na králův pokyn tě zve ke dvoru: kdo bojuje jako rytíř, může jím být. Za pás se ale platí věrnou službou koruně.',
    choices: [
      {
        label: 'Pokleknout a přijmout pás',
        hintType: 'resource', hintKey: 'prestige',
        setTier: 3, endGame: 'ennobled',
        effects: { prestige: 10 },
        chronicle: 'Meč se dotkl tvého ramene. {ruler.name} {R:povstal jako rytíř|povstala jako šlechtična}. Rod {dynastyName} dostal v léno tvrz v Pobřežní marce.',
      },
      {
        label: 'Odmítnout, grunt je víc než meč',
        hintType: 'trait', hintKey: 'patience',
        effects: { prestige: 4, stability: 4 },
        hiddenEffects: { clearFlag: 's_hrdina' },
        chronicle: 'Maršál nechápavě kroutil hlavou. Ty ses {R:vrátil|vrátila} k pluhu.',
      },
    ],
  },
];

// ===================== CRISES AND ECHOES =====================

export const PEASANT_CRISES = [
  {
    id: 'krize_s_hlad',
    scenario: S, forced: true, crisis: true,
    image: img('hladomor'),
    title: 'Prázdná komora',
    text: 'V komoře nezbyl ani pytel mouky. Děti pláčou hlady a čeleď se dívá ke dveřím.',
    choices: [
      {
        label: 'Porazit krávu',
        hintType: 'resource', hintKey: 'stability',
        effects: { stability: -6, food: 12 },
        chronicle: 'Kráva šla pod nůž. Rodina přežije zimu, ale jaro bude bez mléka.',
      },
      {
        label: 'Prosit vrchnost o obilí',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: -6, food: 10 },
        chronicle: '{L:Pán dal obilí. A zapsal si, kolik mu dlužíš.|Paní dala obilí. A zapsala si, kolik jí dlužíš.}',
      },
      {
        label: 'Koupit obilí na trhu v Brodné',
        requires: (s) => s.resources.gold >= 6,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -6, food: 12 },
        chronicle: 'Poslední groše odešly za obilí z Brodné. Komora se naplnila — truhla vyprázdnila.',
      },
      {
        label: 'Propustit čeleď',
        hintType: 'resource', hintKey: 'army',
        effects: { army: -4, food: 6 }, // the hands that go now are missing in the spring
        chronicle: 'Čeleď odešla s uzlíky. Míň úst, míň rukou.',
      },
    ],
  },
  {
    id: 'krize_s_bida',
    scenario: S, forced: true, crisis: true,
    image: img('lichvar'),
    title: 'Ani groš',
    text: 'Měšec je prázdný a do panské pokladny se platí v grošech, ne v pláči.',
    choices: [
      {
        label: 'Prodat dobytek',
        hintType: 'resource', hintKey: 'stability',
        effects: { stability: -6, gold: 8 },
        chronicle: 'Dobytkář odvedl dvě ovce a jalovici. Měšec cinká, chlév je prázdný.',
      },
      {
        label: 'Najmout se na panský dvůr za mzdu',
        hintType: 'resource', hintKey: 'favor',
        effects: { gold: 5, favor: 3, food: -3 },
        chronicle: 'Týden práce na panském dvoře za pár grošů. Vlastní pole čeká.',
      },
      {
        label: 'Půjčit si od rychtáře',
        requires: (s) => !s.flags.s_rychtar,
        hintType: 'trait', hintKey: 'eloquence',
        effects: { gold: 8 },
        courtEffects: { chancellor: { loyalty: -6 } },
        chronicle: 'Rychtář půjčil. Bude to připomínat při každé příležitosti.',
      },
      {
        label: 'Sáhnout do obecní truhly',
        requires: (s) => s.flags.s_rychtar,
        hintType: 'trait', hintKey: 'eloquence',
        effects: { gold: 8 },
        courtEffects: { chancellor: { loyalty: -6 } },
        chronicle: 'Klíč od obecní truhly má rychtář. Groše se musí do posvícení vrátit a konšelé si to zapsali.',
      },
    ],
  },
  {
    id: 'krize_s_nemilost',
    scenario: S, forced: true, crisis: true,
    image: img('n_kraluv_vybirci'),
    title: 'Hrozba vyhnání',
    text: 'Dráb přinesl vzkaz: {lord.title} {lord.name} má rodu {dynastyName} dost. Ještě jedna stížnost a grunt dostane jiný hospodář.',
    choices: [
      {
        label: 'Jít na panský dvůr a prosit',
        hintType: 'resource', hintKey: 'prestige',
        effects: { favor: 12, prestige: -6 },
        chronicle: 'Klečel{R:|a} jsi na panském dvoře v blátě, dokud {L:pán nekývl|paní nekývla}.',
      },
      {
        label: 'Přinést dar na panský dvůr',
        requires: (s) => s.resources.gold >= 8,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -8, favor: 14 },
        chronicle: 'Dar zahřál {L:pánovo|panino} srdce. Na čas.',
      },
      {
        label: 'Odvést robotu navíc',
        hintType: 'resource', hintKey: 'army',
        effects: { food: -6, army: -2, favor: 10 },
        chronicle: 'Celý měsíc práce na panském. Vlastní pole zarůstá, ale grunt zůstal.',
      },
    ],
  },
  {
    // the same crisis for a free man (engine.js CRISES): his farm cannot be taken, only argued away in court
    id: 'krize_s_nemilost_svobodnik',
    scenario: S, forced: true, crisis: true,
    image: img('n_kraluv_vybirci'),
    title: '{L:Pánova|Panina} nemilost',
    text: 'Svobodu ti {lord.title} {lord.name} vzít nemůže, ale cesty má. Mlynář ti nesemele, na panský trh tě nepustí a u zemského soudu v Brodné už leží žaloba o starý dluh z doby poddanství. Ještě jedna stížnost a soud grunt přiřkne jinému hospodáři.',
    choices: [
      {
        label: 'Jít na panský dvůr a smířit se',
        hintType: 'resource', hintKey: 'prestige',
        effects: { favor: 12, prestige: -6 },
        chronicle: 'Svobodn{R:ý|á}, a přece jsi {R:stál|stála} na panském dvoře s čepicí v ruce, dokud {L:pán nekývl|paní nekývla}.',
      },
      {
        label: 'Přinést dar na panský dvůr',
        requires: (s) => s.resources.gold >= 8,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -8, favor: 14 },
        chronicle: 'Dar zahřál {L:pánovo|panino} srdce a žaloba se v Brodné ztratila mezi listinami. Na čas.',
      },
      {
        label: 'Odpracovat to na panském',
        hintType: 'resource', hintKey: 'army',
        effects: { food: -6, army: -2, favor: 10 },
        chronicle: 'Celý měsíc práce na panském, tentokrát z vlastní vůle a bez mzdy. Vlastní pole zarůstá, ale žaloba utichla.',
      },
    ],
  },
];

export const PEASANT_ECHOES = [
  {
    id: 'ozvena_s_poklad',
    scenario: S, forced: true, echo: true,
    image: img('stribrna_zila'),
    title: 'Kdo viděl hrnec',
    text: 'Krčmářův syn tenkrát pásl husy u tvého pole a viděl, co jsi {R:vyoral|vyorala}. Teď chce podíl. Jinak to řekne drábovi.',
    choices: [
      {
        label: 'Zaplatit mu za mlčení',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -8 },
        chronicle: 'Kluk dostal svůj podíl. Mlčí. Zatím.',
      },
      {
        label: 'Zapírat',
        hintType: 'trait', hintKey: 'patience',
        isRoll: true, baseChance: 0.5, traitKey: 'patience', traitScale: 0.04,
        onSuccess: { effects: { prestige: 1 }, chronicle: 'Dráb prohledal stavení a nic nenašel. Mince pod prahem mlčí.' },
        onFailure: { effects: { gold: -15, favor: -14 }, chronicle: 'Dráb vypáčil práh. Poklad je pryč a s ním i {L:pánova|panina} důvěra.' },
      },
      {
        label: 'Přiznat se vrchnosti',
        hintType: 'resource', hintKey: 'favor',
        effects: { gold: -10, favor: -4, prestige: 2 },
        chronicle: '{L:Pán si vzal poklad a nechal|Paní si vzala poklad a nechala} tě odejít jen s pokutou. Prý za upřímnost.',
      },
    ],
  },
  {
    id: 'ozvena_s_udavac',
    scenario: S, forced: true, echo: true,
    image: img('vzpoura_v_provincii'),
    title: 'Jidáš z Lipnice',
    text: 'Ves nezapomněla, kdo udal vůdce povstání. Na vratech je namalovaný provaz, v kostele si nikdo nesedne vedle tebe a dnes ráno ležel na prahu mrtvý pes.',
    choices: [
      {
        label: 'Uspořádat hostinu pro celou ves',
        hintType: 'resource', hintKey: 'food',
        effects: { food: -8, prestige: 6 },
        chronicle: 'Ves se najedla a napila. Odpustit neodpustila, ale aspoň mlčí.',
      },
      {
        label: 'Požádat vrchnost o ochranu',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 3, prestige: -6 },
        chronicle: 'U vrat teď stojí panský pacholek. Ves to bere jako důkaz.',
      },
      {
        label: 'Snést to',
        hintType: 'trait', hintKey: 'patience',
        effects: { stability: -4, prestige: -3 },
        traitGain: 'patience',
        chronicle: 'Rok mlčení. Ves si časem najde jiný terč.',
      },
    ],
  },
];

export const PEASANT_QUIET_EVENT = {
  id: 's_klidne_obdobi',
  scenario: S,
  image: img('n_klidne_obdobi'),
  title: 'Všední dny',
  text: 'Nic zvláštního se neděje. Dráb nechodí, nebe je klidné a práce na gruntu je pořád dost. Čemu se letos bude {ruler.name} věnovat?',
  choices: [
    {
      label: 'Pracovat na poli od tmy do tmy',
      hintType: 'trait', hintKey: 'strength',
      effects: { food: 3, stability: 2 },
      traitGain: 'strength',
      chronicle: 'Pole jsou zoraná, meze opravené a ruce rozedřené.',
    },
    {
      label: 'Opravit stavení a ohrady',
      hintType: 'resource', hintKey: 'stability',
      effects: { stability: 4, gold: -1 },
      chronicle: 'Nová střecha na chlévě, nové plaňky v plotě.',
    },
    {
      label: 'Chodit mezi sousedy',
      hintType: 'trait', hintKey: 'eloquence',
      effects: { prestige: 3, gold: -1 },
      traitGain: 'eloquence',
      chronicle: 'Večery v krčmě a na návsi. Ves tě má ráda.',
    },
    {
      label: 'Naučit se počítat od rychtáře',
      requires: (s) => !s.flags.s_rychtar,
      hintType: 'trait', hintKey: 'intelligence',
      effects: { gold: -1 },
      traitGain: 'intelligence',
      chronicle: 'Rychtář ukázal, jak se počítá na prstech i na vrubech. Už tě nikdo neošidí.',
    },
    {
      label: 'Probrat se obecní knihou',
      requires: (s) => s.flags.s_rychtar,
      hintType: 'trait', hintKey: 'intelligence',
      effects: { gold: -1 },
      traitGain: 'intelligence',
      chronicle: 'Zimní večery nad obecní knihou. Kdo komu co dluží, teď víš přesně ty.',
    },
  ],
};
