// Roads out of serfdom (Sedlák, tier 1 -> 2 Svobodník), besides the two old ones in
// events_peasant.js (the buyout s_vykup and bravery in the front line s_bitva).
// Every road is a different story tied to different stats, flags and choices:
//
//   Rok a den   sv_rok_1 -> sv_rok_2        flight to Brod; the lord's men come before the year and a day are up
//   Locace      sv_locace_1 -> sv_locace_2  clearing a border forest; the first winter decides
//   Záchrana    sv_zachrana_<vlci|pozar|povoden>   the lord in danger; a roll on strength, wit or patience
//   Listina     sv_listina_1 -> sv_listina_2       an old charter of freedom found in a beam
//   Tchán       sv_tchan_<mlyn|krcma|rychtar|brod>  a free in-law family buys the serf out (needs a spouse of that kind)
//   Klášter     sv_klaster_dar (land for freedom) and sv_pisar_1 -> sv_pisar_2 (a year in the scriptorium)
//
// Every step needs tier 1, so once one road ends in freedom (setTier 2) the others fall silent.
// Chains work like events_foreign.js: a flag from the earlier step + a minimum delay (after).
// A failure always costs something real (favor, farm, a wound) but never ends the chronicle.

const S = 'sedlak';
const img = (id) => `assets/events/${id}.jpg`;

const flag = (s, f) => !!(s.flags && s.flags[f]);
/** At least n seasons since the step `id` was played (false if it never was). */
const after = (s, id, n) => {
  const t = (s.eventHistory || {})[id];
  return t !== undefined && s.turn - t >= n;
};
const serf = (s) => s.ruler.statusTier === 1;
/** Someone who can read: raised by the priest, or simply quick in the head. */
const lettered = (s) => flag(s, 'p_fara') || s.ruler.traits.intelligence >= 6;
/** A road that takes the farmer away from the farm is under way: no second one starts beside it. */
const busy = (s) => flag(s, 'sv_rok') || flag(s, 'sv_locace') || flag(s, 'sv_pisar');
const ALL_FLAGS = ['sv_rok', 'sv_rok_mistr', 'sv_locace', 'sv_listina', 'sv_listina_fara', 'sv_pisar', 'sv_pisar_rok'];
/** Hidden effects of a road that ended in freedom (marks which road, clears the unfinished ones). */
const freed = (road) => ({ setFlag: `volnost_${road}`, clearFlag: ALL_FLAGS });
/** Hidden effects of a road that ended without freedom. */
const over = (...flags) => ({ clearFlag: flags });

// ============================================================================
// 1. ROK A DEN — flight to the town
// ============================================================================

const ROK = [
  {
    id: 'sv_rok_1',
    scenario: S, cooldown: 20, minTurn: 12, seasons: [0, 1],
    // a serf who has fallen out with his lord thinks of it more often
    weight: (s) => (s.resources.favor < 40 ? 1 : 0.45),
    requires: (s) => serf(s) && !busy(s) && s.resources.gold >= 6,
    image: img('trh_v_brode'),
    title: 'Rok a den',
    text: 'U studny v Lipnici vypráví vozka od Brodu starou pověst a nikdo ho nepřerušuje. Prý platí, že kdo uteče z panské země do města a rok a den tam žije, aniž by si pro něj pán přišel, toho už pán zpět nedostane: městské právo poddané nevydává. Vozka mrká a dodává, že by to chtělo vydržet, a hlavně se nenechat chytit v prvních týdnech. Pověst má jeden háček: za rok a den se leccos stane a panští jezdci mají dlouhé ruce.',
    choices: [
      {
        label: 'Odejít za tmy do Brodu a ztratit se mezi podruhy',
        requires: (s) => s.resources.gold >= 6,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -6, stability: -8, army: -2 },
        hiddenEffects: { setFlag: 'sv_rok' },
        chronicle: 'Za tmy {ruler.name} {R:odešel|odešla} s uzlíkem na zádech a pár groši v kapse. Grunt zůstal v rukou rodiny a čeledi. V Brodě se podruh bez jména ztratí snadno, jen se musí vyhnout těm, kdo ho znají.',
      },
      {
        label: 'Zkusit štěstí u cechmistra v Brodě',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.4, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { gold: -3, stability: -6, army: -1 }, hiddenEffects: { setFlag: ['sv_rok', 'sv_rok_mistr'] }, traitGain: 'eloquence', chronicle: 'Brodský cechmistr si tě prohlédl, zeptal se, jestli umíš pracovat, a víc se neptal. Dostal{R:|a} jsi postel ve stodole za dílnou a práci, na které se pozná, kdo to myslí vážně. Dílna ti bude krýt záda.' },
        onFailure: { effects: { gold: -4, prestige: -2 }, chronicle: 'U městské brány tě zastavili. Cechmistr nechtěl nikoho bez listu od pána a stráž se na tebe dívala příliš dlouho. Vrátil{R:|a} jsi se domů dřív, než si někdo všiml, že jsi byl{R:|a} pryč.' },
      },
      {
        label: 'Nechat to na pověsti',
        hintType: 'trait', hintKey: 'patience',
        effects: {},
        chronicle: 'Pověst zůstala pověstí. {ruler.name} {R:zůstal|zůstala} u pluhu a vozka dostal džbán piva za vyprávění.',
      },
    ],
  },
  {
    id: 'sv_rok_2',
    scenario: S, cooldown: 6, weight: 8,
    requires: (s) => serf(s) && flag(s, 'sv_rok') && after(s, 'sv_rok_1', 4),
    image: img('uprchlici'),
    title: 'Panští jezdci v Brodě',
    text: 'Rok a den má uplynout za pár dní. {lord.Title} {lord.name} to ví stejně dobře jako ty, a proto se rychtář s dvěma jezdci a s listem pod {L:pánovou|paninou} pečetí objevil ve městě právě teď. Chodí od dílny k dílně a ptá se po {R:uprchlém poddaném|uprchlé poddané} z Lipnice. Hostitel stojí vedle tebe s čepicí v ruce a mlčí.',
    choices: [
      {
        label: 'Schovat se v dílně a vydržet těch pár dní',
        hintType: 'trait', hintKey: 'patience',
        isRoll: true, baseChance: 0.45, traitKey: 'patience', traitScale: 0.04,
        chanceBonus: (s) => (flag(s, 'sv_rok_mistr') ? 0.12 : 0) + (flag(s, 'zenon_pritel') || flag(s, 'p_krcma') ? 0.05 : 0),
        bonusLabel: 'Máš ve městě přátele',
        onSuccess: { setTier: 2, effects: { prestige: 6, favor: -8 }, hiddenEffects: freed('rok'), traitGain: 'patience', chronicle: 'Tři dny jsi {R:proseděl|proseděla} v prázdném sudu v zadní komoře a poslouchal{R:|a} kroky v uličce. Pak uplynul rok a den. Rychtář odjel s prázdnou a městský písař zapsal, že svobodný člověk smí bydlet, kde chce. Domů ses {R:vrátil|vrátila} jako {R:svobodný hospodář|svobodná hospodyně}. Rod {dynastyName} je svobodný a {lord.title} {lord.name} to nikdy neodpustí.' },
        onFailure: { effects: { favor: -14, stability: -6, gold: -6, prestige: -4 }, hiddenEffects: over('sv_rok', 'sv_rok_mistr'), injury: 'pohmozdeni', chronicle: 'Pacholci tě našli za sudy. Dveře kolem zůstaly zavřené a nikdo se nezastal. Domů ses {R:vrátil|vrátila} svázan{R:ý|á} přes sedlo a na dvoře už čekal dráb s holí.' },
      },
      {
        label: 'Předstoupit před městskou radu a dovolat se práva',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.4, traitKey: 'eloquence', traitScale: 0.05,
        chanceBonus: (s) => (s.resources.prestige - 30) / 250 + (flag(s, 'sv_rok_mistr') ? 0.1 : 0), bonusLabel: 'Pověst a cech za zády',
        onSuccess: { setTier: 2, effects: { prestige: 10, favor: -8 }, hiddenEffects: freed('rok'), traitGain: 'eloquence', chronicle: 'Před radními jsi {R:stál|stála} s kloboukem v ruce a mluvil{R:|a} o právu, které je starší než jakýkoli pán. Purkmistr kývl, že rok a den se počítá od chvíle, kdy jsi {R:vešel|vešla} do města, písař zapsal a rychtář musel jezdce odvolat. Rod {dynastyName} je svobodný.' },
        onFailure: { effects: { favor: -14, stability: -6, gold: -6, prestige: -4 }, hiddenEffects: over('sv_rok', 'sv_rok_mistr'), injury: 'pohmozdeni', chronicle: 'Rada se zalekla panského listu a vydala tě. Purkmistr sklopil oči a pacholci tě odvedli. Domů ses {R:vrátil|vrátila} svázan{R:ý|á} přes sedlo a na dvoře už čekal dráb s holí.' },
      },
      {
        label: 'Vrátit se dobrovolně a prosit o milost',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: -5, stability: -3 },
        hiddenEffects: over('sv_rok', 'sv_rok_mistr'),
        chronicle: 'Vrátil{R:|a} jsi se {R:sám|sama}, dřív než se rychtář stačil rozhodnout. {lord.Title} {lord.name} ti nechal{L:|a} vyměřit pár ran holí za dráby i za sousedy a tím to skončilo. Brod ti ale zůstane v hlavě.',
      },
    ],
  },
];

// ============================================================================
// 2. LOCACE — a border forest to clear and settle
// ============================================================================

const LOCACE = [
  {
    id: 'sv_locace_1',
    scenario: S, cooldown: 16, minTurn: 12, weight: 0.8, seasons: [0, 1],
    requires: (s) => serf(s) && !busy(s) && s.resources.army >= 12 && s.resources.food >= 20,
    image: img('hranicni_kamen'),
    title: 'Hvozd za Lipnicí',
    text: '{lord.Title} {lord.name} nechal{L:|a} na dvoře vyhlásit novinu. Hvozd za Lipnicí, kde panství naráží na cizí hranici, se musí vykácet a osídlit, jinak si ho zabere soused. Kdo tam půjde s rodinou, postaví ves a vydrží první zimu, dostane půdu, deset let bez dávek a svobodu, jaká se dává zakladatelům. {lord.Title} potřebuje lidi, které nezlomí ani hlad, ani mráz.',
    choices: [
      {
        label: 'Přihlásit se a vzít s sebou čeleď',
        requires: (s) => s.resources.army >= 25 && s.resources.food >= 30,
        hintType: 'resource', hintKey: 'army',
        effects: { army: -5, food: -10, stability: -8 },
        hiddenEffects: { setFlag: 'sv_locace' },
        chronicle: 'Vůz naložený sekerami, pytli a dětmi se potácel k hvozdu. {ruler.name} {R:šel|šla} první, se sekerou na rameni. Za týden stál první srub a za dva týdny se v hvozdu poprvé rozlehlo kvokání slepic.',
      },
      {
        label: 'Poslat do hvozdu čeleď a zůstat na gruntu',
        hintType: 'resource', hintKey: 'army',
        effects: { army: -6, food: -4, favor: 5 },
        chronicle: 'Čeleď odešla klučit hvozd. {lord.Title} {lord.name} ocenil{L:|a}, že dáváš lidi, ale svobodu za to nikdo neslíbil.',
      },
      {
        label: 'Nechat to na jiných',
        hintType: 'trait', hintKey: 'patience',
        effects: {},
        chronicle: 'Do hvozdu se přihlásili jiní. Lipnice bude mít sousedy.',
      },
    ],
  },
  {
    id: 'sv_locace_2',
    scenario: S, cooldown: 12, weight: 8,
    requires: (s) => serf(s) && flag(s, 'sv_locace') && after(s, 'sv_locace_1', 3),
    image: img('kruta_zima'),
    title: 'První zima v hvozdu',
    text: 'V hvozdu stojí pět srubů, mezi pařezy se zelenají dvě políčka a ráno už leží na střechách sníh. Jenže zásoby, které jste přivezli, se tenčí rychleji, než kdo čekal, hvozd je tvrdší, než slibovali, a čeleď začíná reptat, že se za svobodu nedá jíst. Pánův správce sedí v teple a čeká, jestli ves přežije zimu. Jestli ano, bude listina. Jestli ne, hvozd si své lidi vezme zpátky.',
    choices: [
      {
        label: 'Dát všechno obilí do společné jámy',
        requires: (s) => s.resources.food >= 20,
        hintType: 'resource', hintKey: 'food',
        setTier: 2,
        effects: { food: -18, stability: 8, prestige: 4 },
        hiddenEffects: freed('locace'),
        chronicle: 'Zimu přežili všichni, kdo ji měli přežít, ale jedli ovesnou kaši a lýko. Na jaře {lord.title} {lord.name} podepsal{L:|a} zakládací listinu a rod {dynastyName} je svobodný. Navíc má dvě nová pole u hvozdu.',
      },
      {
        label: 'Pracovat i v mrazu a vyklučit, co jde',
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.3, traitKey: 'strength', traitScale: 0.05,
        chanceBonus: (s) => (s.resources.army - 25) / 200 + (s.resources.food - 30) / 300, bonusLabel: 'Počet rukou a zásoby',
        onSuccess: { setTier: 2, effects: { food: -6, stability: 10, prestige: 6, army: -2 }, hiddenEffects: freed('locace'), traitGain: 'strength', chronicle: 'Sekery zvonily i v mrazu, až se to od hvozdu rozléhalo. Do jara přibyla dvě pole a ves přežila. {lord.Title} {lord.name} podepsal{L:|a} zakládací listinu a rod {dynastyName} je svobodný.' },
        onFailure: { effects: { food: -12, army: -6, stability: -6, favor: -6 }, hiddenEffects: over('sv_locace'), chronicle: 'Zima byla tvrdší než lidé. Dva čeledíni se už neprobudili a ostatní se vrátili na grunt s prázdnýma rukama. Správce pokrčil rameny: hvozd bude čekat na odvážnější.' },
      },
      {
        label: 'Vrátit se domů, dokud děti žijí',
        hintType: 'resource', hintKey: 'stability',
        effects: { stability: -3, favor: -6, prestige: -3 },
        hiddenEffects: over('sv_locace'),
        chronicle: 'Sbalil{R:|a} jsi, co se dalo, a vyrazil{R:|a} zpátky k Lipnici. Hvozd zůstal pustý a {lord.title} {lord.name} si zapsal{L:|a} do paměti rodinu, která to vzdala.',
      },
    ],
  },
];

// ============================================================================
// 3. ZÁCHRANA — the lord in danger (rare, three scenes)
// ============================================================================

const ZACHRANA = [
  {
    id: 'sv_zachrana_vlci',
    scenario: S, cooldown: 40, minTurn: 16, seasons: [3], weight: 0.45,
    requires: (s) => serf(s) && s.resources.favor >= 35,
    image: img('vlci'),
    title: 'Vlci na panské cestě',
    text: 'Za mrazivého soumraku se od lesa nese vytí a po zasněžené cestě se k Lipnici žene panský povoz. Kočí spadl z kozlíku, koně se plaší a ze stínů mezi stromy se vynořují šedé postavy. V povozu sedí {lord.title} {lord.name} a svírá v náručí dítě. Pacholci jsou daleko pozadu a ty jsi nejblíž.',
    choices: [
      {
        label: 'Postavit se vlkům s vidlemi',
        combat: 'vlci',
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.25, traitKey: 'strength', traitScale: 0.05,
        onSuccess: { setTier: 2, effects: { prestige: 12, favor: 10 }, hiddenEffects: freed('zachrana'), traitGain: 'strength', chronicle: 'Vidle, pochodeň a hrdlo plné křiku. Vlci couvli a zmizeli v lese. {lord.Title} {lord.name} té noci neřekl{L:|a} ani slovo, jen držel{L:|a} dítě. Za týden přišla listina s pečetí: za záchranu dítěte je rod {dynastyName} svobodný.' },
        onFailure: { effects: { favor: 4, stability: -4 }, injury: 'rana', chronicle: 'Vlci byli rychlejší. Pacholci dorazili, když bylo po všem, a dítě zachránili oni. Tobě zůstala rána, která se zle hojí, a od {L:pána|paní} jen pokývnutí.' },
      },
      {
        label: 'Rozdělat oheň uprostřed cesty a zapálit pochodně',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.3, traitKey: 'intelligence', traitScale: 0.05,
        onSuccess: { setTier: 2, effects: { prestige: 10, favor: 10 }, hiddenEffects: freed('zachrana'), traitGain: 'intelligence', chronicle: 'Suché smrky chytly jako troud a vlci se zastavili na okraji světla. Povoz s dítětem dojel do vsi, než oheň dohořel. Za týden přišla listina s pečetí: za záchranu dítěte je rod {dynastyName} svobodný.' },
        onFailure: { effects: { prestige: -3, stability: -3 }, chronicle: 'Vítr oheň zhasil dřív, než se rozhořel. Pacholci dorazili včas jen proto, že vlci se nakonec raději spokojili s mrtvým koněm.' },
      },
      {
        label: 'Křičet o pomoc a hnát pacholky',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.5, traitKey: 'eloquence', traitScale: 0.04,
        onSuccess: { effects: { favor: 8, gold: 6, prestige: 4 }, traitGain: 'eloquence', chronicle: 'Pacholci přiběhli na první zavolání a vlky zahnali. {lord.Title} {lord.name} ti hodil{L:|a} měšec s pár groši. Ke svobodě to ale nestačilo.' },
        onFailure: { effects: { favor: -3 }, chronicle: 'Pacholci se neozvali, dokud nebylo po všem. {lord.Title} {lord.name} sjel{L:|a} očima po tobě a po vidlích, které jsi držel{R:|a} za zády.' },
      },
    ],
  },
  {
    id: 'sv_zachrana_pozar',
    scenario: S, cooldown: 40, minTurn: 16, seasons: [1, 2], weight: 0.3,
    requires: (s) => serf(s) && s.resources.favor >= 35,
    image: img('pozar_mesta'),
    title: 'Požár na panském dvoře',
    text: 'Za horké noci vzplane panská stodola a oheň přeskočí na obytné stavení. Na dvoře je křik, dráb běhá s vědrem bez rozmyslu a z patra, odkud valí kouř, volá {lord.title} {lord.name} o pomoc. Zavřen{L:ý|á} je tam s dítětem a schody už hoří.',
    choices: [
      {
        label: 'Proběhnout kouřem po schodech',
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.25, traitKey: 'strength', traitScale: 0.05,
        onSuccess: { setTier: 2, effects: { prestige: 12, favor: 10 }, hiddenEffects: freed('zachrana'), traitGain: 'strength', chronicle: 'Kašlal{R:|a} jsi, tvář v hadrech namočených ve džberu, a nesl{R:|a} dítě na ramenou jako pytel obilí. Když se za vámi propadly schody, {lord.title} {lord.name} už stál{L:|a} na dvoře. Za týden přišla listina s pečetí: za záchranu dítěte je rod {dynastyName} svobodný.' },
        onFailure: { effects: { stability: -3 }, injury: 'rana', chronicle: 'Schody se pod tebou propadly. Dítě vynesli pacholci oknem a tebe vytáhli z trosek s popálenou rukou a bez dechu.' },
      },
      {
        label: 'Přistavit žebřík a vylézt oknem',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.3, traitKey: 'intelligence', traitScale: 0.05,
        onSuccess: { setTier: 2, effects: { prestige: 10, favor: 10 }, hiddenEffects: freed('zachrana'), traitGain: 'intelligence', chronicle: 'Žebřík z panské stodoly sahal přesně k oknu. Dítě sjelo dolů v tvé náruči a {lord.title} {lord.name} za ním. Za týden přišla listina s pečetí: za záchranu dítěte je rod {dynastyName} svobodný.' },
        onFailure: { effects: { prestige: -2 }, injury: 'zlomenina', chronicle: 'Žebřík byl o dva loket krátký. Spadl{R:|a} jsi z něj do dvora a dítě vynesli pacholci jinudy.' },
      },
      {
        label: 'Postavit řetěz s vědry, ať oheň nepřeskočí na ves',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.5, traitKey: 'eloquence', traitScale: 0.04,
        onSuccess: { effects: { favor: 8, prestige: 6, gold: 4 }, traitGain: 'eloquence', chronicle: 'Půl vsi stálo v řadě od studny, a oheň zůstal na panském dvoře. Dítě vynesli včas jiní. {lord.Title} {lord.name} ti poděkoval{L:|a} před celou vsí a přidal{L:|a} pár grošů.' },
        onFailure: { effects: { favor: -2 }, chronicle: 'Vědra se předávala pomalu a nikdo neposlouchal. Oheň uhasili až k ránu a Lipnice se dlouho dohadovala, kdo za co mohl.' },
      },
    ],
  },
  {
    id: 'sv_zachrana_povoden',
    scenario: S, cooldown: 40, minTurn: 16, seasons: [0], weight: 0.45,
    requires: (s) => serf(s) && s.resources.favor >= 35,
    image: img('povoden'),
    title: 'Povodeň na brodě',
    text: 'Jarní tání rozvodnilo potok a brod u Lipnice se změnil v řeku. Uprostřed proudu uvízl panský vůz, voda sahá ke kolům, kůň se vzpíná a každou chvíli to všechno strhne. {lord.Title} {lord.name} sedí uvnitř a křičí na pacholky, kteří stojí na břehu a jen se dívají.',
    choices: [
      {
        label: 'Skočit do proudu s provazem',
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.25, traitKey: 'strength', traitScale: 0.05,
        onSuccess: { setTier: 2, effects: { prestige: 12, favor: 10 }, hiddenEffects: freed('zachrana'), traitGain: 'strength', chronicle: 'Provaz se přehodil přes vůz a vázl za olší. Voda tě třikrát vzala, ale vůz stál a {lord.title} {lord.name} {L:došel|došla} po provaze na břeh. Za týden přišla listina s pečetí: za záchranu {L:pána|paní} je rod {dynastyName} svobodný.' },
        onFailure: { effects: { food: -3, stability: -3 }, injury: 'pohmozdeni', chronicle: 'Proud tě odnesl o sto kroků dál a vyplavil na kamenité mělčině. Vůz vytáhli pacholci s volským potahem a ty ses domů {R:vrátil|vrátila} promrzl{R:ý|á} a potlučen{R:ý|á}.' },
      },
      {
        label: 'Najít mělčinu a vyvést vůz po ní',
        hintType: 'trait', hintKey: 'patience',
        isRoll: true, baseChance: 0.3, traitKey: 'patience', traitScale: 0.05,
        onSuccess: { setTier: 2, effects: { prestige: 10, favor: 10 }, hiddenEffects: freed('zachrana'), traitGain: 'patience', chronicle: 'Brod znáš od dětství: kde se voda zvedá, tam je štěrk. Vedl{R:|a} jsi koně za uzdu pomalu a bez křiku, krok za krokem, a vůz vyjel na břeh. Za týden přišla listina s pečetí: za záchranu {L:pána|paní} je rod {dynastyName} svobodný.' },
        onFailure: { effects: { prestige: -3, stability: -3 }, chronicle: 'Zvolil{R:|a} jsi špatné místo a kůň zapadl až po břicho. Vůz vytáhli pacholci a {lord.title} {lord.name} se na tebe díval{L:|a} s dutým úsměvem.' },
      },
      {
        label: 'Zavolat sousedy a vytáhnout vůz volským potahem',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.5, traitKey: 'eloquence', traitScale: 0.04,
        onSuccess: { effects: { favor: 8, gold: 4, prestige: 4 }, traitGain: 'eloquence', chronicle: 'Sousedé přiběhli s voly a řetězy a vůz byl venku dřív, než se voda zvedla. {lord.Title} {lord.name} ti poděkoval{L:|a} a pár grošů přidal{L:|a}.' },
        onFailure: { effects: { favor: -2 }, chronicle: 'Sousedé se rozmýšleli příliš dlouho. Vůz nakonec vytáhli pacholci a ty ses domů {R:vrátil|vrátila} s ostudou.' },
      },
    ],
  },
];

// ============================================================================
// 4. LISTINA — an old charter of freedom
// ============================================================================

const LISTINA = [
  {
    id: 'sv_listina_1',
    scenario: S, oneTime: true, minTurn: 10, weight: 0.5,
    requires: (s) => serf(s),
    image: img('ztracena_listina'),
    title: 'Listina v trámu',
    text: 'Při opravě střechy vypadl z trámu svitek zabalený v mastné kůži. Pergamen zežloutl, písmena jsou drobná a latinská a na konci visí pryskyřičná pečeť, ze které zbyla jen půlka. Rozeznáš jediné slovo, a to je jméno tvého praděda. Čí je to listina a co se v ní píše, ve vsi neví nikdo. Možná nic. Možná všechno.',
    choices: [
      {
        label: 'Přečíst ji vlastníma očima',
        requires: lettered,
        hintType: 'trait', hintKey: 'intelligence',
        effects: {}, traitGain: 'intelligence',
        hiddenEffects: { setFlag: 'sv_listina' },
        chronicle: 'Latina byla špatná a písmo ještě horší, ale smysl se dal složit. Před sto lety potvrdil král jistému hospodáři a jeho dědicům, že drží půdu jako svobodnou. Tvůj praděda byl svobodný člověk, a pak na to někdo zapomněl. Nebo chtěl zapomenout.',
      },
      {
        label: 'Odnést ji faráři a požádat o přečtení',
        requires: (s) => s.resources.gold >= 2,
        hintType: 'resource', hintKey: 'faith',
        effects: { gold: -2, faith: 3 },
        hiddenEffects: { setFlag: ['sv_listina', 'sv_listina_fara'] },
        chronicle: 'Farář ji dlouho četl při svíčce a nakonec sundal brýle. Listina prý dosvědčuje, že tvůj předek držel půdu svobodně a nikdo mu ji nesměl vzít, a farář je ochoten to před lidmi potvrdit. Svitek máš schovaný pod prádlem.',
      },
      {
        label: 'Prodat ji kupci jako pergamen',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 5 },
        chronicle: 'Kramář zaplatil pět grošů a svitek zmizel v jeho vaku. Pergamen se hodí na pouzdra a na obaly, a to, co na něm stálo, už nikdo nepřečte.',
      },
      {
        label: 'Spálit ji, než se někdo začne ptát',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 2 },
        chronicle: 'Co se neví, nemůže ublížit. Svitek shořel v kamnech dřív, než ho stačil spatřit kdokoli jiný. Ve vsi se o něm nikdo nedozví.',
      },
    ],
  },
  {
    id: 'sv_listina_2',
    scenario: S, cooldown: 8, weight: 6,
    requires: (s) => serf(s) && flag(s, 'sv_listina') && !busy(s) && after(s, 'sv_listina_1', 2),
    image: img('opat_v_rade'),
    title: 'Před rychtářem',
    text: 'Svitek pod prádlem ti nedá spát. Jestli je pravý, rod {dynastyName} nikdy nebyl panským majetkem a stačí to dokázat. Jestli je podvrh, bude to stát víc než pověst. Rychtář sedí o soudním dni u dlouhého stolu, {lord.title} {lord.name} je právě na panství a ve vsi se ví, že jeden pergamen z truhly dokáže víc než deset let roboty.',
    choices: [
      {
        label: 'Předložit listinu před rychtářem a lavicí',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.3, traitKey: 'intelligence', traitScale: 0.05,
        chanceBonus: (s) => (flag(s, 'sv_listina_fara') ? 0.12 : 0) + (s.resources.prestige - 30) / 250, bonusLabel: 'Svědek a pověst',
        onSuccess: { setTier: 2, effects: { prestige: 8, favor: -4 }, hiddenEffects: freed('listina'), traitGain: 'intelligence', chronicle: 'Rychtář listinu přečetl dvakrát a lavice mlčela. Pak kývl: pergamen je pravý, pečeť královská a rod {dynastyName} nebyl nikdy panský majetek. {lord.Title} {lord.name} to přijal{L:|a} s kamennou tváří a na odvolání už nebylo dost důvodů.' },
        onFailure: { effects: { prestige: -6, favor: -10, gold: -4 }, hiddenEffects: over('sv_listina', 'sv_listina_fara'), chronicle: 'Rychtář listinu prohlásil za padělek a pergamen zabavil. {lord.Title} {lord.name} se dozvěděl{L:|a}, kdo se pokusil nahradit panskou listinu vlastní, a pokutu vyměřil{L:|a} tak, aby si to rod {dynastyName} pamatoval.' },
      },
      {
        label: 'Jít s ní za {L:pánem|paní} a vyjednat si svobodu potichu',
        requires: (s) => s.resources.gold >= 12,
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.3, traitKey: 'eloquence', traitScale: 0.05,
        chanceBonus: (s) => (s.resources.favor - 50) / 150,
        onSuccess: { setTier: 2, effects: { gold: -12, favor: 4 }, hiddenEffects: freed('listina'), traitGain: 'eloquence', chronicle: '{lord.Title} {lord.name} držel{L:|a} listinu dlouho v ruce a pak {L:poslal|poslala} pro písaře. Za dvanáct grošů „písařských poplatků“ byla vystavena svobodná listina a starý svitek zmizel v panské truhle. Rod {dynastyName} je svobodný, tiše a bez soudu.' },
        onFailure: { effects: { favor: -8, prestige: -2 }, hiddenEffects: over('sv_listina', 'sv_listina_fara'), chronicle: '{lord.Title} {lord.name} si svitek nechal{L:|a} „k posouzení“ a už ho nevrátil{L:|a}. Poděkoval{R:|a} jsi a {R:odešel|odešla}, protože víc se dělat nedalo.' },
      },
      {
        label: 'Schovat ji zpátky a počkat na lepší chvíli',
        hintType: 'trait', hintKey: 'patience',
        effects: {},
        chronicle: 'Svitek se vrátil pod prádlo. Pravda počká, ale časem se stává jen starým papírem.',
      },
    ],
  },
];

// ============================================================================
// 5. TCHÁN — a free family takes the serf in (needs a spouse of a free trade)
// ============================================================================

// The spouse's kindLabel (family.js KINDS.sedlak) decides which in-law steps in:
// the miller's, the innkeeper's, the reeve's, or a townsman's from Brod.
const KINDS = [
  {
    key: 'mlyn', who: 'tchán', kind: /^mlynář[oů]v/, image: 'n_mlyn', title: 'Tchán mlynář',
    text: 'Po nedělní mši tě tchán zadržel před kostelem. Mlynář od potoka mele pro půl kraje a nehodlá se dívat, jak se jeho {M:syn|dcera} dře na gruntu {R:poddaného|poddané}. {lord.Title} {lord.name} mu dluží za opravu žlabu a mlynář je ochoten dluh prominout, jestli {L:pán|paní} propustí tvůj rod z poddanství. Na oplátku chce pytle obilí do mlýna a kus pole u potoka pro druhé kolo.',
    costA: { food: -14, stability: -10, prestige: -3 }, costB: { food: -7, stability: -5 }, needA: (s) => s.resources.food >= 14, needB: (s) => s.resources.food >= 7,
    done: 'Mlynářovo obilí a kus pole u potoka vyvážily panský dluh. {lord.Title} {lord.name} přitiskl{L:|a} pečeť a rod {dynastyName} je svobodný. Hospodařit budeš o něco hůř, ale tchán se už nebude stydět před hosty.',
  },
  {
    key: 'krcma', who: 'tchán', kind: /krčmář/, image: 'p_krcma_drab', title: 'Tchán krčmář',
    text: 'Tchán, krčmář u cesty, ví o všem, co se šeptá na panství, a také o tom, že {lord.title} {lord.name} u něj nadělal{L:|a} dluhy za hostiny. Nabízí obchod: dluh zmizí, jestli {L:pán|paní} propustí tvůj rod z poddanství. Na tobě zbývá jediné: přidat pár grošů, aby krčmář nezůstal ve ztrátě.',
    costA: { gold: -14, prestige: -2 }, costB: { gold: -7 }, needA: (s) => s.resources.gold >= 14, needB: (s) => s.resources.gold >= 7,
    done: 'Krčmář škrtl dluh na hliněné tabulce a {lord.title} {lord.name} přitiskl{L:|a} pečeť na listinu bez řečí. Rod {dynastyName} je svobodný a v krčmě se to oslavilo na účet tchána.',
  },
  {
    key: 'rychtar', who: 'rychtář', kind: /^rychtář[oů]v/, image: 's_rychtar_volba', title: 'Strýc rychtář',
    text: 'Rychtář, strýc {M:tvého manžela|tvé manželky}, tě po soudním dni vzal stranou. Zná panský dvůr zevnitř, ví, komu co říct a komu co zamlčet, aby se {lord.title} {lord.name} nezlobil{L:|a} a rod přesto přešel mezi svobodné. Za to chce písařské poplatky a slib, že mu u {L:pána|paní} nebudeš dělat ostudu.',
    costA: { gold: -10, favor: -6, prestige: -1 }, costB: { gold: -5, favor: -3 }, needA: (s) => s.resources.gold >= 10, needB: (s) => s.resources.gold >= 5,
    done: 'Rychtář psal tři večery a čtvrtý den {lord.title} {lord.name} listinu {L:podepsal|podepsala}. Rod {dynastyName} je svobodný a ve vsi vědí, komu za to poděkovat.',
  },
  {
    key: 'brod', who: 'mistr', kind: /z Brodu$/, image: 'kupecka_gilda', title: 'Rodina z Brodu',
    text: 'Rodina {M:tvého manžela|tvé manželky} z Brodu patří k městským řemeslníkům a cech poddané nepřijímá. Mistr, hlava rodiny, ale nabízí cestu: vyplatí tě u {L:pána|paní} a vezme tě do dílny jako tovaryše. Dluh si odpracuješ a půl týdne budeš trávit v Brodě místo na poli.',
    costA: { gold: -10, stability: -8, prestige: -3 }, costB: { gold: -5, stability: -4 }, needA: (s) => s.resources.gold >= 10, needB: (s) => s.resources.gold >= 5,
    done: 'Mistr zaplatil {L:pánovi|paní} a ty ses {R:stal|stala} tovaryšem v jeho dílně. Rod {dynastyName} je svobodný, ale grunt v týdnech, kdy jsi v Brodě, chátrá.',
  },
];

const spouseKind = (s) => (s.spouse && s.spouse.alive !== false && !s.spouse.none && s.spouse.kindLabel) || '';

const TCHAN = KINDS.map((k) => ({
  id: `sv_tchan_${k.key}`,
  scenario: S, cooldown: 14, minTurn: 12, weight: 0.8,
  requires: (s) => serf(s) && k.kind.test(spouseKind(s)),
  image: img(k.image),
  title: k.title,
  text: k.text,
  choices: [
    {
      label: 'Přijmout nabídku bez smlouvání',
      requires: k.needA,
      hintType: 'resource', hintKey: 'prestige',
      effects: k.costA, setTier: 2, hiddenEffects: freed('tchan'),
      chronicle: k.done,
    },
    {
      label: 'Vyjednat lepší podmínky',
      requires: k.needB,
      hintType: 'trait', hintKey: 'eloquence',
      isRoll: true, baseChance: 0.4, traitKey: 'eloquence', traitScale: 0.05,
      chanceBonus: (s) => (s.resources.favor - 50) / 200,
      onSuccess: { effects: k.costB, setTier: 2, hiddenEffects: freed('tchan'), traitGain: 'eloquence', chronicle: `${k.done} Dohodl{R:|a} jsi se o něco levněji, než chtěl ${k.who}, a ten se na tebe dívá s respektem.` },
      onFailure: { effects: { prestige: -3 }, chronicle: `${k.who[0].toUpperCase()}${k.who.slice(1)} se zamračil: rodina se nesmlouvá. Nabídka platí dál, jen chvíli potrvá, než zapomene na tvou nestoudnost.` },
    },
    {
      label: 'Poděkovat a zůstat sám sebou',
      hintType: 'trait', hintKey: 'patience',
      effects: { prestige: 2 },
      chronicle: `Poděkoval{R:|a} jsi a odmítl{R:|a}. ${k.who[0].toUpperCase()}${k.who.slice(1)} pokrčil rameny: hrdost nic nestojí, jen se hůř jí.`,
    },
  ],
}));

// ============================================================================
// 6. KLÁŠTER — land for freedom, or a year in the scriptorium
// ============================================================================

const KLASTER = [
  {
    id: 'sv_klaster_dar',
    scenario: S, cooldown: 20, minTurn: 16, weight: 0.3,
    requires: (s) => serf(s) && s.resources.faith >= 50 && s.resources.stability >= 45,
    image: img('biskupuv_desatek'),
    title: 'Dar pro klášter',
    text: 'Do Lipnice přijel na mezku bratr almužník z kláštera na útesu, po obědě si ohmatal stodolu a pak se zeptal na to, co sedláky trápí nejvíc: na duši. Opat prý ví o rodech, které by rády skončily jako svobodné. Klášter má u {L:pána|paní} dost slova na to, aby listinu vyprosil, jen aby bylo za co se přimlouvat: louka a pole u potoka by klášteru dobře posloužily. Bratr to řekl pokorně a nahlas jen jednou.',
    choices: [
      {
        label: 'Darovat klášteru louku a pole u potoka',
        requires: (s) => s.resources.stability >= 40,
        hintType: 'resource', hintKey: 'faith',
        setTier: 2, effects: { stability: -14, faith: 6, prestige: 2 }, hiddenEffects: freed('klaster'),
        chronicle: 'Louka a pole u potoka přešly na klášter a bratr almužník zapsal dar do knihy. Opat se za rod {dynastyName} u {L:pána|paní} přimluvil a {lord.title} {lord.name} přitiskl{L:|a} pečeť na listinu. Grunt je menší, ale rod je svobodný.',
      },
      {
        label: 'Smlouvat o menší dar',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.35, traitKey: 'eloquence', traitScale: 0.05,
        chanceBonus: (s) => (s.resources.faith - 50) / 200, bonusLabel: 'Zbožnost rodu',
        onSuccess: { setTier: 2, effects: { stability: -7, faith: 3 }, hiddenEffects: freed('klaster'), traitGain: 'eloquence', chronicle: 'Bratr almužník se dohodl na menší louce a opat s úsměvem přikývl. Pečeť na listině je panská, přímluva klášterní. Rod {dynastyName} je svobodný a grunt zůstal skoro celý.' },
        onFailure: { effects: { faith: -3, prestige: -2 }, chronicle: 'Bratr almužník se zamračil. Dar, který se smlouvá, přestává být darem, a opat takové obchody nemá rád.' },
      },
      {
        label: 'Odmítnout, půda je půda',
        hintType: 'resource', hintKey: 'stability',
        effects: {},
        chronicle: 'Bratr almužník odjel na mezku zpátky, tiše a bez rozhořčení. Půda zůstala.',
      },
    ],
  },
  {
    id: 'sv_pisar_1',
    scenario: S, cooldown: 24, minTurn: 12, weight: 0.6,
    requires: (s) => serf(s) && !busy(s) && lettered(s),
    image: img('skola_ucencu'),
    title: 'Klášter hledá písaře',
    text: 'V klášteře na útesu zemřel starý bratr písař a skriptorium zůstalo bez ruky, která by opisovala urbáře, účty a listiny. Opat prý hledá někoho z okolí, kdo umí číst a psát, a nechce se příliš ptát, čí je. Strava, střecha a po roce vděk kláštera: komu se podaří osvědčit, tomu klášter zařídí svobodu u {L:pána|paní}. Je to ale rok, kdy bude na gruntu chybět tvá ruka.',
    choices: [
      {
        label: 'Jít do kláštera na celý rok',
        hintType: 'trait', hintKey: 'intelligence',
        effects: { stability: -8, army: -2, faith: 6, food: -3 },
        hiddenEffects: { setFlag: ['sv_pisar', 'sv_pisar_rok'] }, traitGain: 'intelligence',
        chronicle: 'Brk, inkoust a pergamen místo kosy. {ruler.name} {R:odešel|odešla} do kláštera na útesu a grunt zůstal v rukou rodiny a čeledi.',
      },
      {
        label: 'Jít jen přes zimu, ať grunt nestrádá',
        hintType: 'resource', hintKey: 'stability',
        effects: { stability: -3, faith: 2 },
        hiddenEffects: { setFlag: 'sv_pisar' },
        chronicle: 'Přes zimu {ruler.name} {R:opisoval|opisovala} v klášterním skriptoriu a na jaře se {R:vrátil|vrátila} k pluhu. Opat si nic neslíbil, ale nic nezapomněl.',
      },
      {
        label: 'Odmítnout, pergamen nenasytí',
        hintType: 'trait', hintKey: 'patience',
        effects: {},
        chronicle: 'Písařem se stal chlapec z vedlejší vsi. Kosa zůstala v ruce.',
      },
    ],
  },
  {
    id: 'sv_pisar_2',
    scenario: S, cooldown: 12, weight: 8,
    requires: (s) => serf(s) && flag(s, 'sv_pisar') && after(s, 'sv_pisar_1', 3),
    image: img('ztracena_listina'),
    title: 'Opatova odměna',
    text: 'Pergamen, inkoust a ticho a z kláštera se ti stal skoro domov. Opat tě zavolal po nešporách do své cely. Klášterní urbář je hotov a opat s ním spokojen, ale zbývá jedna listina, na které závisí spor kláštera o les za potokem. Je poškozená a chybí v ní tři řádky. Můžeš ji opsat věrně, jak je, a zbytek nechat soudu. Nebo ji doplnit tak, jak by si to klášter přál.',
    choices: [
      {
        label: 'Opsat věrně a mezery označit',
        hintType: 'trait', hintKey: 'patience',
        isRoll: true, baseChance: 0.5, traitKey: 'patience', traitScale: 0.04,
        chanceBonus: (s) => (flag(s, 'sv_pisar_rok') ? 0.1 : 0), bonusLabel: 'Celý rok praxe',
        onSuccess: { setTier: 2, effects: { faith: 4, prestige: 4 }, hiddenEffects: freed('pisar'), traitGain: 'patience', chronicle: 'Opat dlouho četl, pak kývl a vyprosil u {L:pána|paní} svobodu pro písaře, který neumí lhát. {lord.Title} {lord.name} přitiskl{L:|a} pečeť. Rod {dynastyName} je svobodný.' },
        onFailure: { effects: { prestige: -2, faith: -2 }, hiddenEffects: over('sv_pisar', 'sv_pisar_rok'), chronicle: 'Brk sklouzl a tinta zalila hotovou stranu. Opat tě poslal domů beze zloby, ale také beze slibu.' },
      },
      {
        label: 'Doplnit chybějící řádky podle přání kláštera',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.35, traitKey: 'intelligence', traitScale: 0.06,
        onSuccess: { setTier: 2, effects: { faith: -8, prestige: 2 }, hiddenEffects: freed('pisar'), traitGain: 'intelligence', chronicle: 'Pero se pohybovalo tak, jak mělo, a nikdo nepoznal, které řádky jsou tvoje. Klášter vyhrál spor o les a opat vyprosil u {L:pána|paní} svobodu pro rod {dynastyName}. Svědomí ale zůstalo psát dál.' },
        onFailure: { effects: { faith: -10, prestige: -8, favor: -6 }, hiddenEffects: over('sv_pisar', 'sv_pisar_rok'), chronicle: 'Soudní písař poznal novější inkoust. Klášter se od tebe rázem distancoval a z kláštera jsi {R:odešel|odešla} s prázdnýma rukama a s pověstí padělatele.' },
      },
      {
        label: 'Vrátit se na grunt a odměnu opatovi nechat',
        hintType: 'resource', hintKey: 'faith',
        effects: { faith: 4, stability: 3 },
        hiddenEffects: over('sv_pisar', 'sv_pisar_rok'),
        chronicle: 'Opat ti požehnal a dal ti na cestu chleba a knihu žalmů. {R:Odešel|Odešla} jsi bez svobody, ale s čistýma rukama.',
      },
    ],
  },
];

export const FREEDOM_EVENTS = [...ROK, ...LOCACE, ...ZACHRANA, ...LISTINA, ...TCHAN, ...KLASTER];
