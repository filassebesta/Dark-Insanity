// The struggle for the throne: a great lord does not wait thirty years for a
// king to die of old age. Six years after the house reaches the great lords
// (or once the king nears sixty) the engine starts this storyline
// (engine.js throneArc): the king falls ill, a regency council forms, the
// succession is disputed — and within a few years the crown is decided in
// n_smrt_krale, whatever the king's age. Each beat lets the player build one
// road to the crown: the claim (legitimacy, regency), the conspiracy (plot)
// or the sword (army, allies), so every route stays open.

const S = 'slechtic';
const img = (id) => `assets/events/${id}.jpg`;

export const THRONE_STEPS = ['tr_kral_padl', 'tr_regentska_rada', 'tr_spor_o_nastupnictvi'];

export const THRONE_EVENTS = [
  {
    id: 'tr_kral_padl',
    scenario: S, forced: true,
    image: img('n_nemoc_krale'),
    title: '{K:Král|Královna} na smrtelné posteli',
    text: 'Na honu v Sokolím hvozdu se splašil kůň a {king.title} {king.name} spadl{K:|a} na kameny. Žije, ale ruka {K:mu|jí} neposlouchá a slova se {K:mu|jí} pletou. Ranhojiči krčí rameny, kněží se modlí a ve Vlčím Údělu se začíná šeptat jediná otázka: kdo bude vládnout, dokud {K:král|královna} nevstane — a kdo potom?',
    choices: [
      {
        label: 'Spěchat ke dvoru a stát u lože',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 10, legitimacy: 4 },
        chronicle: '{ruler.name} {R:přijel|přijela} ke dvoru mezi prvními. Kdo stojí u lože, toho si pamatuje i koruna.',
      },
      {
        label: 'Rozeslat posly k ostatním rodům',
        hintType: 'trait', hintKey: 'eloquence',
        effects: { gold: -6 }, houseEffects: { '*': { attitude: 6 } },
        chronicle: 'Z tvrze vyjeli tři jezdci se třemi dopisy. Žádný z nich nemluvil o králi, všechny mluvily o budoucnosti.',
      },
      {
        label: 'Tiše posílit posádku a sýpky',
        hintType: 'resource', hintKey: 'army',
        effects: { gold: -8, army: 6, food: 6 },
        chronicle: 'Na tvrz se svážely zásoby a v kasárnách přibylo mužů. Kdo se ptal proč, dostal odpověď o neklidných časech.',
      },
    ],
  },
  {
    id: 'tr_regentska_rada',
    scenario: S, forced: true,
    image: img('spor_radcu'),
    title: 'Regentská rada',
    text: '{king.Title} {king.name} nevládne a sněm volí regentskou radu, která bude rozhodovat za {K:něj|ni}. Rody se přou o místa, kancléř chce vládnout sám a královna matka nedůvěřuje nikomu. Místo v radě je blíž trůnu než kterákoli tvrz — kdo v ní sedí, bude u toho, až se bude rozhodovat o koruně.',
    choices: [
      {
        label: 'Ucházet se o místo regenta',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.35, traitKey: 'eloquence', traitScale: 0.05, resourceKey: 'legitimacy', resourceScale: 0.004,
        chanceBonus: (s) => (s.houses || []).filter((h) => h.ally || h.married).length * 0.08 + (s.resources.favor - 50) / 300,
        bonusLabel: 'Spojenci a přízeň',
        onSuccess: { effects: { legitimacy: 15, prestige: 6 }, hiddenEffects: { setFlag: 'regent' }, traitGain: 'eloquence', chronicle: 'Sněm zvolil {ruler.name} do regentské rady. Rod {dynastyName} teď vládne zemi — zatím jménem někoho jiného.' },
        onFailure: { effects: { prestige: -4, favor: -4 }, houseEffects: { '*': { attitude: -3 } }, chronicle: 'Sněm dal přednost starým rodům. Skokan prý může počkat.' },
      },
      {
        label: 'Podpořit spojence a nechat se za to zaplatit slibem',
        hintType: 'trait', hintKey: 'patience',
        effects: { legitimacy: 5 }, houseEffects: { allies: { attitude: 10 } },
        chronicle: 'Rod {dynastyName} podpořil spojence. Dluh se zapsal — a dluhy se v takových časech splácejí rychle.',
      },
      {
        label: 'Koupit si hlasy, které rozhodnou',
        requires: (s) => s.resources.gold >= 20,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -20, legitimacy: 8 }, noble: { plot: 1 },
        chronicle: 'Některé hlasy v radě teď patří rodu {dynastyName}. Nikdo to neřekne nahlas, ale všichni to vědí.',
      },
    ],
  },
  {
    id: 'tr_spor_o_nastupnictvi',
    scenario: S, forced: true, music: 'battle',
    image: img('pretendent'),
    title: 'Spor o nástupnictví',
    text: '{king.Title} {king.name} slábne každým dnem a země se dělí na strany. Jedni stojí za {K:královým|královniným} dědicem, druzí volají po silné ruce, která zemi podrží. U dveří tvé síně se střídají poslové: spiklenci, kteří chtějí jednat hned, rody, které čekají, na čí stranu se postavíš, a kněží, kteří chtějí vědět, komu budou žehnat.',
    choices: [
      {
        label: 'Veřejně ohlásit nárok na trůn',
        hintType: 'resource', hintKey: 'legitimacy',
        effects: { legitimacy: 12, favor: -10, prestige: 4 }, houseEffects: { allies: { attitude: 5 } },
        chronicle: '{ruler.name} {R:ohlásil|ohlásila} před shromážděnou šlechtou nárok rodu {dynastyName} na trůn. Od té chvíle už není cesty zpět.',
      },
      {
        label: 'Spojit se se spiklenci ve městě',
        hintType: 'trait', hintKey: 'intelligence',
        effects: { gold: -10 }, noble: { plot: 2 },
        chronicle: 'Ve sklepě krčmy U Zlatého jelena se sešli lidé, kteří si nevěří, ale potřebují jeden druhého.',
      },
      {
        label: 'Svolat vazaly a čekat se zbraní u nohy',
        hintType: 'resource', hintKey: 'army',
        effects: { army: 8, gold: -6, stability: -2 },
        chronicle: 'Pod korouhví rodu {dynastyName} se shromáždili všichni, kdo mu něco dluží. Kdo bude chtít korunu, bude muset počítat s nimi.',
      },
      {
        label: 'Postavit se za dědice a chtít za to odměnu',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 15, gold: 10, legitimacy: -5 },
        chronicle: 'Rod {dynastyName} se postavil za zákonného dědice. Věrnost se platí — a tahle byla zaplacena dobře.',
      },
    ],
  },
];
