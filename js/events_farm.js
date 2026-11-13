// The year's one big decision, told as a story: a peasant's extra work on the
// farm after the harvest (s_prace_na_gruntu, every autumn) and a lord's or a
// king's decree for the most troubled land (vynos_roku, every spring). They are
// made here and only here; the map shows the lands but decides nothing. Both
// take no season (free). Branch extra: decree: '<key>' (engine.js issueDecree).

import { canAffordDecree } from './engine.js';

const can = (key) => (s) => canAffordDecree(s, key);

export const FARM_EVENTS = [
  {
    id: 's_prace_na_gruntu',
    scenario: 'sedlak', forced: true, free: true,
    image: 'assets/events/bohata_uroda.jpg',
    title: 'Po žních',
    text: 'Obilí je ve stodole a dny se krátí. Do jara zbývá dost času na jednu velkou práci navíc. {ruler.name} stojí na mezi a přemýšlí, kam dát ruce a groše letos — protože grunt, do kterého se nic nevloží, pomalu chátrá.',
    choices: [
      {
        label: 'Vyklučit kus lesa na nové pole',
        requires: can('clear'), hintType: 'resource', hintKey: 'stability',
        decree: 'clear',
        chronicle: 'Celý podzim se na gruntu kácelo a pálily se pařezy. Na jaře se bude orat o kus dál.',
      },
      {
        label: 'Najmout čeledíny na příští rok',
        requires: can('hire'), hintType: 'resource', hintKey: 'army',
        decree: 'hire',
        chronicle: 'Na grunt přišli noví čeledíni. Za mzdu a misku polévky — a ruce mají silné.',
      },
      {
        label: 'Přikoupit krávu',
        requires: can('cattle'), hintType: 'resource', hintKey: 'gold',
        decree: 'cattle',
        chronicle: 'Do chléva přibyla kráva. Mléko pro děti a tah pro pluh.',
      },
      {
        label: 'Odvézt přebytky na trh do Brodné',
        requires: (s) => can('market')(s) && s.resources.food >= 25, // only real surplus goes to market before winter
        hintType: 'resource', hintKey: 'food',
        decree: 'market',
        chronicle: 'Vůz plný obilí a sýrů se vrátil z Brodné prázdný — a měšec plný.',
      },
      {
        label: 'Pomoci sousedům se střechou a zásobami',
        requires: can('neighbours'), hintType: 'resource', hintKey: 'prestige',
        decree: 'neighbours',
        chronicle: 'Půl vsi pomáhalo u sousedů. Na takové věci se v Lipnici nezapomíná.',
      },
      {
        label: 'Zanést na panský dvůr dar navíc',
        requires: can('lord'), hintType: 'resource', hintKey: 'favor',
        decree: 'lord',
        chronicle: 'Na panský dvůr putoval dar, který nikdo nežádal. Takové dary se pamatují.',
      },
      {
        label: 'Odpočinout si, dokud je čas',
        hintType: 'trait', hintKey: 'patience',
        decreeSkip: true, // rest is this year's choice: the question is not asked again in winter
        chronicle: 'Letos se na gruntu nic navíc nedělalo. Ruce si odpočinuly — grunt ne.',
      },
    ],
  },

  {
    id: 's_chalupa',
    scenario: 'sedlak', forced: true,
    image: 'assets/events/uprchlici.jpg',
    title: 'Chalupa na kraji vsi',
    text: 'Grunt zpustl. Pole zarostla plevelem, dobytek je pryč a {lord.title} {lord.name} dal{L:|a} statek jinému hospodáři. Rodu {dynastyName} ale zůstala chalupa na kraji vsi, kus políčka za humny a pár lidí, kteří neodešli. Začíná se znovu, skoro od nuly. Podruhé už milost nepřijde.',
    choices: [
      {
        label: 'Kousnout se a začít od prvního záhonu',
        hintType: 'trait', hintKey: 'patience',
        effects: { stability: 4 }, traitGain: 'patience',
        chronicle: 'Rodina přestěhovala, co zbylo, do chalupy na kraji vsi. První záhon byl zrytý ještě ten den.',
      },
      {
        label: 'Prosit sousedy o pomoc',
        hintType: 'trait', hintKey: 'eloquence',
        effects: { food: 8, prestige: -3 },
        chronicle: 'Sousedé přinesli, co mohli. Pomoc se v Lipnici nezapomíná — ani dluh za ni.',
      },
      {
        label: 'Jít sloužit na panský dvůr, dokud se nepostavíme na nohy',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 10, food: 4, army: -2 },
        chronicle: '{ruler.name} {R:šel|šla} sloužit na panský dvůr. Pán si to poznamenal; ruce na vlastním políčku chybí.',
      },
    ],
  },

  // ---------- a lord's or a king's decree for the year (engine.js raises it every spring) ----------
  {
    id: 'vynos_roku',
    scenarios: ['slechtic', 'panovnik'], forced: true, free: true,
    // the land that needs it most: the most restless and least loyal of the player's own
    target: (s) => {
      const own = s.provinces.filter((p) => !p.lost && (!p.owner || p.owner === 'player'));
      return own.length ? own.slice().sort((a, b) => (b.unrest - b.loyalty) - (a.unrest - a.loyalty))[0].id : null;
    },
    image: 'assets/events/biskupuv_desatek.jpg',
    title: 'Výnos roku',
    text: '{decree.lead} {decree.focus} Písař má připravený pergamen a pečeť čeká: jedno velké rozhodnutí pro tuto zem za rok — víc úředníci ani pokladna neunesou.',
    choices: [
      { label: 'Posílit tamní posádku', requires: can('garrison'), hintType: 'resource', hintKey: 'army', decree: 'garrison', chronicle: 'Do kraje {province.name} odjeli verbíři a zbrojíři. Na hradbách přibylo stráží.' },
      { label: 'Na rok odpustit kraji část dávek', requires: can('relief'), hintType: 'resource', hintKey: 'gold', decree: 'relief', chronicle: 'Kraj {province.name} letos platí méně. V krčmách se připíjí na milostivou vrchnost.' },
      { label: 'Zvelebit kraj cestami a mlýny', requires: can('develop'), hintType: 'trait', hintKey: 'intelligence', decree: 'develop', chronicle: 'V kraji {province.name} se staví mlýny, mosty a tržiště. Užitek přijde až s léty.' },
      { label: 'Postavit kraji kapli', requires: can('shrine'), hintType: 'resource', hintKey: 'faith', decree: 'shrine', chronicle: 'V kraji {province.name} vysvětili novou kapli. Lidé chodí na mši a odcházejí klidnější.' },
      { label: 'Vybrat v kraji mimořádnou daň', requires: (s) => s.resources.stability > 15, hintType: 'resource', hintKey: 'gold', decree: 'levy', chronicle: 'Výběrčí prošli krajem {province.name} od chalupy k chalupě. Pokladna se plní, nálada klesá.' },
      { label: 'Odvést z kraje muže do vojska', hintType: 'resource', hintKey: 'army', decree: 'muster', chronicle: 'Z kraje {province.name} odešli mladí muži pod korouhev. Pole teď obdělávají ženy a starci.' },
      { label: 'Letos nic neměnit', hintType: 'trait', hintKey: 'patience', decreeSkip: true, chronicle: 'Pergamen zůstal čistý. Kraj {province.name} letos žije, jak žil.' },
    ],
  },

  // ---------- the last warning before a realm or an estate falls apart (engine.js CRISES) ----------
  {
    id: 'krize_rozvrat',
    scenarios: ['slechtic', 'panovnik'], forced: true, crisis: true,
    image: 'assets/events/vzpoura_v_provincii.jpg',
    title: 'Země se rozpadá',
    text: 'Výběrčí se vracejí s prázdnými rukama, rychtáři neposlouchají a po cestách táhnou hladoví lidé. Rádci mluví jedním hlasem: ještě jedna zlá zima a {domain.nom} se rozpadne. Teď je čas jednat — ne až zítra.',
    choices: [
      {
        label: 'Nakoupit obilí v cizině a rozdat ho lidem',
        requires: (s) => s.resources.gold >= 15,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -15, food: 20, stability: 8 },
        chronicle: 'Vozy s cizím obilím projely kraji. Kde se rozdávalo, tam se přestalo bouřit.',
      },
      {
        label: 'Poslat část vojska domů k pluhům',
        requires: (s) => s.resources.army >= 20,
        hintType: 'resource', hintKey: 'army',
        effects: { army: -15, food: 6, stability: 6 },
        chronicle: 'Polovina mužů odložila zbraně a vrátila se na pole. Méně krků u kotle, víc rukou u pluhu.',
      },
      {
        label: 'Vyhlásit stanné právo',
        hintType: 'trait', hintKey: 'strength',
        effects: { stability: 10, prestige: -4 }, provinceEffects: { '*': { loyalty: -6 } },
        chronicle: 'Na tržištích visí šibenice a po setmění se nevychází. Klid je to tichý a zlý.',
      },
      {
        label: 'Prosit církev o pomoc a o kázání pokory',
        requires: (s) => s.resources.faith >= 15,
        hintType: 'resource', hintKey: 'faith',
        effects: { faith: -10, stability: 6 },
        chronicle: 'Z kazatelen se mluví o trpělivosti a farní sýpky se otevřely. Lid se uklidnil — na čas.',
      },
    ],
  },
];
