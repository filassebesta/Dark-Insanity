// Family events in every scenario: funerals, a widowed ruler marrying again,
// the regency for a child ruler, christenings, the heir's courtship and the
// offices left empty when an old adviser dies. The life cycle itself (births,
// deaths, ageing) lives in family.js; these are the moments the player decides.

const ALL = ['panovnik', 'slechtic', 'sedlak'];
const LORDS = ['panovnik', 'slechtic'];
const isPeasant = (s) => s.scenario === 'sedlak';
const dead = (s) => (s.eventContext && s.eventContext.dead) || {};
const childDied = (s) => ['child', 'heir', 'grandchild'].includes(dead(s).relation);
const recentBirth = (s) => s.newborn && s.turn - s.newborn.turn < 4;
const canMarry = (s) => s.ruler.age >= 17 && s.ruler.age < 56 && !(s.spouse && s.spouse.alive !== false)
  && !s.flags.no_remarry && !s.regent
  && (s.flags.widowedTurn === undefined || s.turn - s.flags.widowedTurn >= 4);

export const FAMILY_EVENTS = [
  // ===================== DEATH IN THE FAMILY =====================
  {
    id: 'rodina_smrt',
    scenarios: ALL, forced: true,
    image: 'assets/events/smrt_radce.jpg',
    title: 'Smutek v rodě',
    text: 'Zemřel{X:|a} {dead.name}, {dead.your} {dead.rel}. {X:Bylo mu|Bylo jí} {dead.ageText}. {dead.cause} Dům ztichl a všichni čekají, co uděláš.',
    choices: [
      // ---- a king's or a noble's household ----
      {
        label: 'Vystrojit pohřeb, na který země nezapomene',
        requires: (s) => !isPeasant(s),
        hintType: 'resource', hintKey: 'prestige',
        effects: { gold: -12, prestige: 5, faith: 2 },
        chronicle: 'Za rakví {dead.name} šli šlechtici i žebráci. Zvony zněly do setmění a rod {dynastyName} ukázal, že své mrtvé nezapomíná.',
      },
      {
        label: 'Pohřbít v tichosti v rodové hrobce',
        requires: (s) => !isPeasant(s),
        hintType: 'resource', hintKey: 'faith',
        effects: { faith: 4, stability: 1 },
        chronicle: 'Jen kněz, rodina a svíce. {dead.name} odpočívá vedle předků.',
      },
      {
        label: 'Zjistit, jestli ta smrt byla opravdu náhoda',
        requires: (s) => !isPeasant(s) && dead(s).age >= 12 && dead(s).age < 55,
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.45, traitKey: 'intelligence', traitScale: 0.04,
        onSuccess: { effects: { stability: 3, prestige: 3 }, courtEffects: { spymaster: { loyalty: 6 } }, traitGain: 'intelligence', chronicle: 'Pátrání nic nenašlo, jen nešťastnou náhodu. Dvůr si oddechl a ty můžeš truchlit s čistou hlavou.' },
        onFailure: { effects: { stability: -5 }, courtEffects: { spymaster: { loyalty: -4 }, chancellor: { loyalty: -4 } }, chronicle: 'Podezření se rozlezlo po dvoře jako plíseň. Nikdo nic nedokázal, ale každý teď hlídá každého.' },
      },
      // ---- a peasant family ----
      {
        label: 'Pohřeb s karem pro celou ves',
        requires: isPeasant,
        hintType: 'resource', hintKey: 'prestige',
        effects: { food: -6, gold: -2, prestige: 5 },
        chronicle: 'Na karu se pilo i plakalo do noci. Ves ukázala, že rod {dynastyName} k ní patří, a {dead.name} odešl{X:|a} se ctí.',
      },
      {
        label: 'Jen farář, rodina a hrob pod lípou',
        requires: isPeasant,
        hintType: 'resource', hintKey: 'faith',
        effects: { faith: 4, gold: -1 },
        chronicle: 'Farář pomodlil, hrobník zasypal. Pod lípou u kostela přibyl dřevěný kříž.',
      },
      {
        label: 'Ráno zase na pole, práce nepočká',
        requires: isPeasant,
        hintType: 'trait', hintKey: 'patience',
        effects: { stability: 3, prestige: -2 },
        courtEffects: { spouse: { loyalty: -5 } },
        traitGain: 'patience',
        chronicle: 'Ještě ten den jsi {R:stál|stála} za pluhem. Ves to nechápe, ale grunt neví nic o smutku.',
      },
      // ---- everyone: a child's death weighs on the other parent ----
      {
        label: 'Zůstat doma s rodinou a nechat svět chvíli čekat',
        requires: (s) => childDied(s) && s.spouse && s.spouse.alive !== false,
        hintType: 'trait', hintKey: 'patience',
        effects: { stability: -2 },
        courtEffects: { spouse: { loyalty: 10 } },
        chronicle: 'Celé týdny jsi {R:byl|byla} jen {R:otcem|matkou}. {spouse.name} ti to nikdy nezapomene.',
      },
    ],
  },

  // ===================== A CHILD ON THE THRONE =====================
  {
    id: 'rodina_porucnictvi',
    scenarios: ALL, forced: true,
    requires: (s) => s.ruler.age < 16,
    image: 'assets/events/vychova_dedice.jpg',
    title: 'Poručnictví',
    text: '{ruler.name} je teprve {R:chlapec|dívka}, kter{R:ý|á} sotva dosáhne na stůl. Až do šestnácti let za {R:něj|ni} musí někdo rozhodovat, a každý v domě má jasno, kdo by to měl být.',
    choices: [
      {
        label: 'Poručnictví svěřit {P:otci|matce} {parent.name}',
        requires: (s) => !!s.parent,
        hintType: 'resource', hintKey: 'stability',
        effects: { stability: 4 },
        regent: 'parent',
        chronicle: 'Za {ruler.name} vládne {parent.word} {parent.name}. Vlastní krev je nejjistější ochrana.',
      },
      {
        label: 'Správu povede {chancellor.title} {chancellor.name}',
        requires: (s) => s.chancellor && s.chancellor.alive !== false,
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.5,
        chanceBonus: (s) => (s.chancellor.loyalty - 50) / 120,
        onSuccess: { regent: 'chancellor', effects: { gold: 6, stability: 3 }, courtEffects: { chancellor: { loyalty: 8 } }, chronicle: '{chancellor.Title} {chancellor.name} vede správu poctivě a {ruler.name} se od {C:něj|ní} učí počítat.' },
        onFailure: { regent: 'chancellor', effects: { gold: -10, stability: -3 }, courtEffects: { chancellor: { loyalty: -6 } }, chronicle: '{chancellor.Title} {chancellor.name} vede správu, jako by byla {C:jeho|její}. Z truhly mizí víc, než by mělo.' },
      },
      {
        label: '{ruler.name} povede rod {R:sám|sama}, jen s radou starších',
        hintType: 'trait', hintKey: 'eloquence',
        effects: { prestige: 4, stability: -6 },
        regent: 'self',
        traitGain: 'patience',
        chronicle: 'Dítě v čele rodu. Někteří se smějí, jiní se bojí. {ruler.name} se učí rychleji než kdokoli před {R:ním|ní}.',
      },
    ],
  },

  // ===================== THE RULER MARRIES (AGAIN) =====================
  {
    id: 'rodina_snatek',
    scenario: 'panovnik', weight: 3, cooldown: 8,
    requires: canMarry,
    image: 'assets/events/cizi_princezna.jpg',
    title: 'Trůn bez {R:královny|krále}',
    text: 'Trůn bez {R:královny|krále} je jen polovina trůnu. {chancellor.Title} {chancellor.name} přinesl{C:|a} seznam jmen: cizí {R:princezny|princové}, {R:dcery|synové} domácích pánů a jedno jméno, o kterém celý dvůr ví, ale nikdo ho nevysloví.',
    choices: [
      {
        label: 'Sňatek s {R:princeznou|princem} z ciziny',
        hintType: 'resource', hintKey: 'prestige',
        effects: { gold: 15, prestige: 6, legitimacy: 4 },
        marry: { loyalty: 50, origin: 'cizina' },
        chronicle: 'Svatba trvala tři dny a věno přijelo na dvanácti vozech. {spouse.name} mluví s cizím přízvukem a dvůr {M:ho|ji} sleduje.',
      },
      {
        label: '{R:Dcera|Syn} mocného domácího pána',
        hintType: 'resource', hintKey: 'stability',
        effects: { stability: 4, legitimacy: 3 },
        provinceEffects: { '*': { loyalty: 3 } },
        marry: { loyalty: 62, origin: 'soused' },
        chronicle: '{spouse.name} pochází z rodu, který drží půl severu. Šlechta je spokojená, alespoň ta polovina.',
      },
      {
        label: 'Sňatek z lásky, ať si dvůr říká, co chce',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.45, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { prestige: 2, stability: 2 }, marry: { loyalty: 88, origin: 'laska' }, chronicle: 'Dvůr se nejdřív pohoršoval, pak si zvykl. {spouse.name} je po tvém boku, protože chce, ne protože musí.' },
        onFailure: { effects: { legitimacy: -6, prestige: -5 }, marry: { loyalty: 88, origin: 'laska' }, chronicle: 'Šlechta mluví o mezaliančním sňatku a v krčmách se zpívají sprosté písně. {spouse.name} to snáší statečně.' },
      },
      {
        label: 'Zůstat {R:sám|sama}, dědice už rod má',
        requires: (s) => s.heir && s.heir.alive !== false,
        hintType: 'trait', hintKey: 'patience',
        effects: { legitimacy: -2 },
        noRemarry: true,
        chronicle: '{ruler.name} odmítl{R:|a} všechna jména. Dvůr už o sňatku nemluví, aspoň ne nahlas.',
      },
    ],
  },
  {
    id: 'n_snatek',
    scenario: 'slechtic', weight: 3, cooldown: 8,
    requires: canMarry,
    target: (s) => {
      const h = s.houses.filter((x) => !x.married).sort((a, b) => b.attitude - a.attitude)[0]
        || s.houses.slice().sort((a, b) => b.attitude - a.attitude)[0];
      return h ? h.id : null;
    },
    image: 'assets/events/n_snatkova_nabidka.jpg',
    title: 'Rod bez {R:paní|pána}',
    text: 'Tvrz bez {R:paní|pána} je jen kamenný dům. {chancellor.Title} {chancellor.name} počítá věna a {spymaster.title} {spymaster.name} zjišťuje, kdo s kým spí. Ze všech nabídek se nejvíc mluví o rodu {house.name}.',
    choices: [
      {
        label: 'Sňatek s rodem {house.short}',
        hintType: 'resource', hintKey: 'legitimacy',
        effects: { legitimacy: 4, gold: 8 },
        houseEffects: { target: { married: true, ally: true, attitude: 15 } },
        marry: { loyalty: 58, origin: 'rod' },
        chronicle: '{spouse.name} z rodu {house.name} přijel{M:|a} s družinou a věnem. Dva rody teď sdílejí jeden stůl.',
      },
      {
        label: '{R:Bohatá kupecká dcera|Bohatý kupecký syn} z Přístavu Mark',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 25, prestige: -4 },
        houseEffects: { '*': { attitude: -3 } },
        marry: { loyalty: 66, origin: 'kupci' },
        chronicle: 'Staré rody ohrnují nos nad krví z přístavu. Pokladna rodu {dynastyName} ale ohrnovat nemusí.',
      },
      {
        label: 'Sňatek z lásky',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.45, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { prestige: 2, stability: 3 }, marry: { loyalty: 88, origin: 'laska' }, chronicle: 'Sousedé se ušklíbli, ale družina slavila do rána. {spouse.name} je ti oporou.' },
        onFailure: { effects: { prestige: -6, favor: -4 }, marry: { loyalty: 88, origin: 'laska' }, chronicle: 'U královského dvora se o tvém sňatku mluví s úsměškem. {spouse.name} ten úsměšek vidí taky.' },
      },
      {
        label: 'Zůstat {R:sám|sama}',
        requires: (s) => s.heir && s.heir.alive !== false,
        hintType: 'trait', hintKey: 'patience',
        effects: { prestige: -1 },
        noRemarry: true,
        chronicle: 'Rod má dědice a {ruler.name} nehodlá dělit stůl s cizím člověkem.',
      },
    ],
  },
  {
    id: 's_snatek',
    scenario: 'sedlak', weight: 3, cooldown: 8,
    requires: canMarry,
    image: 'assets/events/doziny.jpg',
    title: 'Grunt bez {R:hospodyně|hospodáře}',
    text: 'Grunt bez {R:hospodyně|hospodáře} je jako vůz bez kola. Děti chodí neučesané, chlév je vzhůru nohama a {spymaster.title} {spymaster.name} už u výčepu jmenuje tři {R:nevěsty|ženichy}. Teta z Brodné přidala čtvrt{R:ou|ého}.',
    choices: [
      {
        label: '{R:Selka|Sedlák} ze sousedního gruntu, s věnem',
        hintType: 'resource', hintKey: 'stability',
        effects: { gold: 5, stability: 6, prestige: 2 },
        marry: { loyalty: 60, origin: 'grunt' },
        chronicle: '{spouse.name} přivedl{M:|a} krávu, truhlu a kus louky u potoka. Grunt se zase hýbe.',
      },
      {
        label: '{R:Mlynářova dcera|Mlynářův syn}',
        hintType: 'resource', hintKey: 'food',
        effects: { food: 8, gold: 2 },
        courtEffects: { chancellor: { loyalty: 3 } },
        marry: { loyalty: 58, origin: 'mlyn' },
        chronicle: 'Od svatby se mouka z mlýna vrací plnou mírou. {spouse.name} na to dohlédne.',
      },
      {
        label: '{R:Děvečka, která|Čeledín, který} ti léta pomáhá',
        hintType: 'trait', hintKey: 'eloquence',
        effects: { army: 2, prestige: -3 },
        marry: { loyalty: 88, minAge: 18, origin: 'celed' },
        chronicle: 'Ves si šeptá, že {R:hospodář si vzal děvečku|hospodyně si vzala čeledína}. {spouse.name} na to nedbá a ty taky ne.',
      },
      {
        label: '{R:Vdova|Vdovec} z vedlejší vsi, s vlastními dětmi',
        requires: (s) => s.ruler.age >= 30,
        hintType: 'resource', hintKey: 'army',
        effects: { army: 4, food: -3 },
        marry: { loyalty: 70, minAge: 28, origin: 'vdova' },
        chronicle: 'Ke stolu přibyl{M:|a} {spouse.name} a s {M:ním|ní} tři hladové krky a šest pracovitých rukou.',
      },
      {
        label: 'Zůstat {R:sám|sama}',
        requires: (s) => s.heir && s.heir.alive !== false,
        hintType: 'trait', hintKey: 'patience',
        effects: { stability: -2 },
        noRemarry: true,
        chronicle: '{ruler.name} se už nežení. Grunt jednou převezme {heir.name} a do té doby to nějak půjde.',
      },
    ],
  },

  // ===================== CHILDREN =====================
  {
    id: 's_krtiny',
    scenario: 'sedlak', weight: 4, cooldown: 4,
    requires: recentBirth,
    image: 'assets/events/krest_ditete.jpg',
    title: 'Křtiny',
    text: 'V seknici pláče {newborn.word} {newborn.name}, zdrav{N:ý|á} a hlasit{N:ý|á}. Farář čeká v kostele a ves čeká na zápraží. Křtiny jsou první věc, kterou o novém člověku celá Lipnice uslyší.',
    choices: [
      {
        label: 'Křtiny s muzikou pro celou ves',
        hintType: 'resource', hintKey: 'prestige',
        effects: { food: -5, gold: -2, prestige: 5 },
        chronicle: 'Muzikanti hráli do rána. {newborn.name} to celé prospal{N:|a}.',
      },
      {
        label: 'Požádat o kmotrovství {L:pána|paní} {lord.name}',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.3, traitKey: 'eloquence', traitScale: 0.04,
        chanceBonus: (s) => (s.resources.favor - 50) / 120,
        onSuccess: { effects: { favor: 7, prestige: 6 }, chronicle: '{lord.Title} {lord.name} svolil{L:|a}. U křtu stál{L:|a} panský kmotr a ves na to zírala s otevřenou pusou.' },
        onFailure: { effects: { favor: -3, prestige: -3 }, chronicle: 'Dráb vyřídil, že pán nemá čas na sedlácké děti. Ves se smála ještě na posvícení.' },
      },
      {
        label: 'Kmotrem ať je {marshal.name} z kovárny',
        hintType: 'resource', hintKey: 'army',
        effects: { prestige: 1 },
        courtEffects: { marshal: { loyalty: 10 } },
        chronicle: '{marshal.name} nesl{A:|a} dítě ke křtu opatrně jako rozžhavenou podkovu.',
      },
      {
        label: 'Skromně, jen kmotři a farář',
        hintType: 'resource', hintKey: 'faith',
        effects: { faith: 3 },
        chronicle: 'Kapka svěcené vody, jméno zapsané do matriky. Víc není potřeba.',
      },
    ],
  },
  {
    id: 's_namluvy',
    scenario: 'sedlak', weight: 2, cooldown: 8,
    requires: (s) => s.heir && s.heir.alive !== false && s.heir.age >= 17 && !s.heir.spouse,
    image: 'assets/events/doziny.jpg',
    title: 'Námluvy',
    text: '{heir.name} je v letech, kdy se na posvícení netančí jen pro radost. Ves už šeptá o {D:Rozárce z mlýna|Jakubovi od kováře}. Dohazovačka z Brodné přinesla jiné jméno: bohatý grunt, jen {D:nevěsta|ženich} je o deset let starší.',
    choices: [
      {
        label: 'Domluvit bohatý sňatek přes dohazovačku',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 8, stability: 4 },
        courtEffects: { heir: { loyalty: -10 } },
        heirMarry: 'veno',
        chronicle: '{heir.name} se {D:žení|vdává} za grunt, ne za člověka. Věno je dobré a úsměv u oltáře kyselý.',
      },
      {
        label: 'Nechat {D:ho|ji}, ať si vezme, koho má {D:rád|ráda}',
        hintType: 'trait', hintKey: 'patience',
        effects: { prestige: 1 },
        courtEffects: { heir: { loyalty: 10 } },
        heirMarry: 'laska',
        chronicle: 'Svatba byla chudá a veselá. {heir.name} a {heir.spouseName} tančili, dokud muzikanti nepadli.',
      },
      {
        label: 'Hledat {D:nevěstu|ženicha} ze svobodného rodu',
        requires: (s) => s.ruler.statusTier >= 2,
        hintType: 'resource', hintKey: 'prestige',
        effects: { gold: -4, prestige: 6 },
        courtEffects: { heir: { loyalty: -2 } },
        heirMarry: 'svobodni',
        chronicle: 'Do rodu {dynastyName} se přiženil{D:a|} {heir.spouseName} ze svobodného statku. Kdo dřív smekal, teď si podává ruku.',
      },
      {
        label: 'Ještě počkat, na gruntu {D:ho|ji} potřebujeme',
        hintType: 'resource', hintKey: 'army',
        effects: { army: 1 },
        courtEffects: { heir: { loyalty: -4 } },
        chronicle: '{heir.name} zůstává doma. Bez řečí, ale u večeře mlčí víc než dřív.',
      },
    ],
  },

  // ===================== EMPTY OFFICES =====================
  {
    id: 'n_smrt_sluzebnika',
    scenario: 'slechtic', forced: true, vacancy: true,
    image: 'assets/events/smrt_radce.jpg',
    title: 'Uprázdněný úřad',
    text: '{target.Old} {target.role} {target.name} {target.died} ve věku {target.age} let. Sloužil{T:|a} rodu {dynastyName} věrně, nebo aspoň dlouho. Teď je místo prázdné a o slovo se hlásí tři lidé.',
    choices: [
      {
        label: 'Povýšit někoho z vlastní družiny',
        hintType: 'resource', hintKey: 'stability',
        effects: { prestige: -1, stability: 2 },
        replaceCourt: { loyalty: 76, minAge: 26, maxAge: 38 },
        chronicle: 'Na prázdné místo usedl člověk z vlastní družiny. Neumí se klanět, ale ví, komu slouží.',
      },
      {
        label: 'Najmout zkušeného člověka z cizích služeb',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -8 },
        replaceCourt: { loyalty: 54, minAge: 40, maxAge: 55 },
        chronicle: 'Nový služebník přišel od cizího pána. Zná řemeslo, a možná i tajemství svého bývalého chlebodárce.',
      },
      {
        label: 'Přijmout člověka, kterého doporučil král',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 6 },
        replaceCourt: { loyalty: 42, minAge: 30, maxAge: 50 },
        chronicle: 'Králův člověk se na tvrzi rychle zabydlel. Píše prý dopisy. Hodně dopisů.',
      },
    ],
  },
  {
    id: 's_smrt_souseda',
    scenario: 'sedlak', forced: true, vacancy: true,
    image: 'assets/events/smrt_radce.jpg',
    title: 'Pohřeb ve vsi',
    text: '{target.Old} {target.role} {target.name} {target.died} ve věku {target.age} let. Celá Lipnice šla za rakví a teď se u studny řeší jediné: kdo po {T:něm|ní} převezme, co tu nechal{T:|a}.',
    choices: [
      {
        label: 'Podpořit, ať to převezme {T:jeho|její} dítě',
        hintType: 'resource', hintKey: 'prestige',
        effects: { prestige: 2 },
        replaceCourt: { loyalty: 70, minAge: 22, maxAge: 32 },
        chronicle: 'Řemeslo zůstalo v rodině. Mladý nástupce si pamatuje, kdo za ním stál u hrobu.',
      },
      {
        label: 'Přimluvit se u pána za vlastního člověka',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.4, traitKey: 'eloquence', traitScale: 0.04,
        chanceBonus: (s) => (s.resources.favor - 50) / 120,
        onSuccess: { effects: { favor: -2, prestige: 3 }, replaceCourt: { loyalty: 84, minAge: 25, maxAge: 40 }, traitGain: 'eloquence', chronicle: 'Pán na tvou přímluvu dal. Nový soused ví, komu vděčí za chléb.' },
        onFailure: { effects: { favor: -4, prestige: -3 }, replaceCourt: { loyalty: 38, minAge: 30, maxAge: 50 }, chronicle: 'Pán poslal svého člověka a dal najevo, že se ho sedláci nemají co ptát. Ten nový to ví taky.' },
      },
      {
        label: 'Nechat to na pánovi a na vsi',
        hintType: 'trait', hintKey: 'patience',
        effects: {},
        replaceCourt: { loyalty: 55, minAge: 30, maxAge: 50 },
        chronicle: 'Ves si vybrala, pán přikývl. Nový soused je zatím neznámá.',
      },
    ],
  },
];
