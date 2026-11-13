// Family events (family.js): a child is born, a matchmaker comes to a ruler who
// stays single too long, and a ruler without an heir can take in a relative's
// child. A married couple decides together whether they want (another) child.
// Branch extras: marrySuitor: <index in state.suitors>, adopt: true, conceive: true.

import { canConceive } from './family.js';

const ALL = ['sedlak', 'slechtic', 'panovnik'];
const img = (id) => `assets/events/${id}.jpg`;
const single = (s) => !s.spouse || s.spouse.alive === false;
const noHeir = (s) => (!s.heir || s.heir.alive === false) && !(s.children || []).some((c) => c.alive !== false);
const kidsAlive = (s) => (s.heir && s.heir.alive !== false ? 1 : 0) + (s.children || []).filter((c) => c.alive !== false).length;
// no child of the ruler's own yet (a brother or sister may hold the heir's place)
const noOwnHeir = (s) => !s.heir || s.heir.alive === false || !!s.heir.presumptive;
const suitor = (i) => (s) => !!(s.suitors && s.suitors[i]);

export const FAMILY_EVENTS = [
  {
    id: 'narozeni',
    scenarios: ALL, forced: true, free: true,
    image: img('krest_ditete'),
    title: 'Narodil{C:|a} se {child.word}',
    text: 'Porod trval celou noc a ráno se ozval křik, který nikdo v domě nezapomene. Narodil{C:|a} se {child.word} a dostal{C:|a} jméno {child.name}. Rod {dynastyName} má o jednoho člověka víc — a budoucnost, na kterou se dá myslet.',
    choices: [
      {
        label: 'Uspořádat křtiny, na které se bude vzpomínat',
        requires: (s) => s.resources.gold >= 5,
        hintType: 'resource', hintKey: 'prestige',
        effects: { gold: -5, prestige: 4 },
        chronicle: 'Na křtinách se jedlo, pilo a zpívalo do rána. Dítě dostalo jméno {child.name}.',
      },
      {
        label: 'Tichý křest v kruhu rodiny',
        hintType: 'resource', hintKey: 'faith',
        effects: { faith: 3 },
        chronicle: '{child.name} byl{C:|a} pokřtěn{C:|a} v tichosti, jen za přítomnosti rodiny a kněze.',
      },
      {
        label: 'Poděkovat té, která rodila, darem',
        requires: (s) => s.ruler.gender === 'male' && s.spouse && s.spouse.alive !== false && s.resources.gold >= 3,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -3 }, courtEffects: { spouse: { loyalty: 10 } },
        chronicle: '{spouse.name} dostala dar a slova, která se neříkají každý den.',
      },
    ],
  },
  {
    id: 'narozeni_levobocka',
    scenarios: ALL, forced: true, free: true,
    image: img('krest_ditete'),
    title: 'Dítě, o kterém se nemluví',
    text: 'Zpráva přišla potichu, po služce, která se dívala do země: narodil{B:|a} se {bastard.word} jménem {bastard.name}. Matkou je {bastard.parent} — a otcem ty. Kněz se ptá, co zapsat do matriky, a ve vsi už se šeptá.',
    choices: [
      {
        label: 'Uznat dítě za své před celým krajem',
        hintType: 'resource', hintKey: 'prestige',
        acknowledge: true, effects: { prestige: -2 }, courtEffects: { spouse: { loyalty: -10 } },
        chronicle: '{ruler.name} {R:uznal|uznala} nemanželské dítě za své. {bastard.name} ponese jméno rodu {dynastyName}. Kdo se smál, ztichl — kdo ne, ten si to zapamatoval.',
      },
      {
        label: 'Postarat se o ně potají',
        requires: (s) => s.resources.gold >= 4,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -4 },
        chronicle: 'Na vychování dítěte jménem {bastard.name} chodí každé čtvrtletí měšec. Do matriky se zapsalo „otec neznámý“.',
      },
      {
        label: 'Dát dítě na vychování do kláštera',
        hintType: 'resource', hintKey: 'faith',
        bastardAway: true, effects: { faith: 2 },
        chronicle: 'Dítě odvezli do kláštera. Vyroste mezi mnichy a o svém otci se možná nikdy nedozví.',
      },
    ],
  },
  {
    id: 'touha_po_diteti',
    scenarios: ALL, cooldown: 10, minTurn: 2, weight: (s) => (noOwnHeir(s) ? 10 : 2),
    requires: (s) => canConceive(s) && !s.flags.no_more_children && (kidsAlive(s) === 0 || s.turn - (s.lastBirthTurn || 0) >= 6),
    image: img('rada_manzela'),
    title: 'Večer u ohně',
    text: 'Den skončil, v domě už všichni spí a oheň pomalu dohořívá. {spouse.name} ti položil{M:|a} ruku na rameno a dlouho mlčel{M:|a}. „Myslíš někdy na to, co po nás zůstane?“ {M:zeptal se|zeptala se} nakonec tiše. „Chtěl{M:|a} bych, aby v tomhle domě bylo víc dětského smíchu.“',
    choices: [
      {
        label: 'Ano. Chci s tebou dítě',
        hintType: 'trait', hintKey: 'patience',
        conceive: true, courtEffects: { spouse: { loyalty: 4 } },
        chronicle: 'Té noci si {ruler.name} a {spouse.name} slíbili, že rod {dynastyName} poroste.',
      },
      {
        label: 'Ještě ne. Teď na to není čas',
        hintType: 'trait', hintKey: 'intelligence',
        effects: {},
        chronicle: '{ruler.name} {R:odpověděl|odpověděla}, že na děti přijde čas, až bude klidněji.',
      },
      {
        label: 'Dětí máme dost',
        requires: (s) => kidsAlive(s) >= 1,
        hintType: 'trait', hintKey: 'intelligence',
        effects: {}, hiddenEffects: { setFlag: 'no_more_children' },
        chronicle: '{ruler.name} a {spouse.name} se shodli, že rod {dynastyName} má dětí dost.',
      },
    ],
  },
  {
    id: 'f_dohazovac',
    scenarios: ALL, cooldown: 10, minTurn: 12, weight: (s) => (noOwnHeir(s) ? 10 : 2),
    requires: (s) => single(s) && s.ruler.age >= (noOwnHeir(s) ? 22 : 26) && s.ruler.age <= 55 && (s.suitors || []).length > 0,
    image: img('rada_manzela'),
    title: 'Je čas',
    text: 'Jednoho večera přišel na návštěvu někdo, kdo to s rodem myslí dobře — stará teta, kněz nebo přítel z mládí. „Roky běží,“ říká, „a rod bez dědice je jako strom bez kořenů. Vím o někom, kdo by neřekl ne.“ Na stole leží jména a na nich budoucnost rodu {dynastyName}.',
    choices: [
      { label: 'Sňatek: {suitor.0.name}, {suitor.0.kind}', requires: suitor(0), hintType: 'resource', hintKey: 'prestige', marrySuitor: 0, chronicle: 'Svatba byla domluvená, ale veselá. Láska přijde — nebo nepřijde.' },
      { label: 'Sňatek: {suitor.1.name}, {suitor.1.kind}', requires: suitor(1), hintType: 'resource', hintKey: 'prestige', marrySuitor: 1, chronicle: 'Svatba byla domluvená, ale veselá. Láska přijde — nebo nepřijde.' },
      { label: 'Sňatek: {suitor.2.name}, {suitor.2.kind}', requires: suitor(2), hintType: 'resource', hintKey: 'prestige', marrySuitor: 2, chronicle: 'Svatba byla domluvená, ale veselá. Láska přijde — nebo nepřijde.' },
      {
        label: 'Odmítnout — srdce si vybere samo',
        hintType: 'trait', hintKey: 'patience',
        effects: { prestige: -1 },
        chronicle: '{ruler.name} dohazovače odmítl{R:|a}. Na svatbu z rozumu ještě není čas.',
      },
    ],
  },
  {
    id: 'f_schovanec',
    scenarios: ALL, cooldown: 12, minTurn: 20, weight: 3,
    requires: (s) => noHeir(s) && !s.pregnancy && s.ruler.age >= 38,
    image: img('vychova_dedice'),
    title: 'Schovanec',
    text: 'Vzdálená příbuzná přivedla dítě, které jí zbylo po zemřelém bratrovi. Malé se třese zimou a smutkem a v rodě {dynastyName} zatím nikdo nevyrůstá. „Vezmi si ho,“ říká. „Ať má rod komu zůstat.“',
    choices: [
      {
        label: 'Přijmout dítě jako vlastní a dědice',
        hintType: 'trait', hintKey: 'patience',
        adopt: true, effects: { prestige: 2 },
        chronicle: 'Do rodu {dynastyName} přibylo dítě. Jednou po {R:něm|ní} převezme všechno.',
      },
      {
        label: 'Ještě počkat na vlastní krev',
        hintType: 'trait', hintKey: 'strength',
        effects: {},
        chronicle: 'Dítě odešlo s příbuznou. {ruler.name} ještě doufá ve vlastního dědice.',
      },
    ],
  },

  {
    id: 'nastupnictvi',
    scenarios: ALL, forced: true, free: true,
    image: img('smrt_radce'),
    title: '{P:Odešel|Odešla} {predecessor.name}',
    text: '{predecessor.name} {P:zemřel|zemřela} a rod {dynastyName} se sešel u hrobu. Kněz domluvil, hlína dopadla na rakev a všichni se teď dívají na tebe: {ruler.name} přebírá {domain}. Lidé si šeptají, jestli {R:bude takový|bude taková} jako {predecessor.rel}, nebo {R:jiný|jiná} — a co se teď změní.{succession.note}',
    choices: [
      {
        label: 'Vystrojit pohřeb, na který se bude vzpomínat',
        requires: (s) => s.resources.gold >= 6,
        hintType: 'resource', hintKey: 'prestige',
        effects: { gold: -6, prestige: 4, faith: 2 },
        chronicle: 'Pohřeb se konal se vší úctou. Celý kraj viděl, že rod {dynastyName} ctí své mrtvé.',
      },
      {
        label: 'Slíbit, že se nic nezmění',
        hintType: 'trait', hintKey: 'patience',
        effects: { stability: 4 },
        chronicle: '{ruler.name} slíbil{R:|a} u hrobu, že rod půjde dál po cestě, kterou vyšlapali předkové.',
      },
      {
        label: 'Dát najevo, že teď vládne někdo nový',
        hintType: 'trait', hintKey: 'strength',
        effects: { prestige: 3, stability: -2 }, courtEffects: { chancellor: { loyalty: -4 } },
        chronicle: 'Hned po pohřbu {R:svolal|svolala} {ruler.name} všechny, kdo rodu slouží, a dal{R:|a} jasně najevo, kdo teď rozhoduje.',
      },
    ],
  },
];
