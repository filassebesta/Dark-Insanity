// Events driven by the personalities of advisers (quirks, see court.js) and the
// upbringing of the heir in the noble scenario. Quirk events run in every scenario.

const ALL = ['panovnik', 'slechtic', 'sedlak'];
const img = (id) => `assets/events/${id}.jpg`;
const ADVISERS = ['chancellor', 'marshal', 'spymaster'];
const withQuirk = (quirk, extra = () => true) => (s) =>
  ADVISERS.find((r) => s[r] && s[r].alive !== false && s[r].quirk === quirk && extra(s[r])) || null;

export const COURT_EVENTS = [
  {
    id: 'q_chamtivost',
    image: img('zlodej_v_pokladne'),
    scenarios: ALL,
    cooldown: 16, minTurn: 6,
    target: withQuirk('chamtivy'),
    title: 'Ruka v truhle',
    text: 'Z truhly s penězi rodu {dynastyName} mizí víc, než by se dalo svést na myši. Stopy vedou k jedinému člověku: {target.role} {target.name}. Prý si to jen {T:půjčil|půjčila}.',
    choices: [
      {
        label: 'Odpustit a dát najevo, že víš',
        hintType: 'trait', hintKey: 'patience',
        effects: { gold: -3 },
        courtEffects: { target: { loyalty: 8 } },
        chronicle: '{target.name} {T:dostal|dostala} milost. Od té doby se v truhle počítá každý groš dvakrát.',
      },
      {
        label: 'Zabavit ukradené i s úroky',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 10 },
        courtEffects: { target: { loyalty: -18 } },
        chronicle: 'Ukradené se vrátilo i s úroky. {target.name} to nese se zaťatými zuby.',
      },
      {
        label: 'Zbavit úřadu',
        requires: (s) => s.scenario !== 'sedlak', // a serf cannot dismiss the village smith or innkeeper
        hintType: 'trait', hintKey: 'strength',
        effects: { prestige: 2 },
        replaceCourt: { loyalty: 60 },
        chronicle: 'Zloděj byl vyhnán. Místo dostal někdo, kdo si ruce nechává v rukávech.',
      },
      {
        label: 'Vyhlásit to na návsi',
        requires: (s) => s.scenario === 'sedlak',
        hintType: 'trait', hintKey: 'strength',
        effects: { prestige: 3 },
        courtEffects: { target: { loyalty: -22 } },
        chronicle: 'Celá ves se dozvěděla, kam mizely groše rodu {dynastyName}. {target.name} je {T:vrátil|vrátila} se sklopenou hlavou a do smrti ti to neodpustí.',
      },
    ],
  },

  {
    id: 'q_ctizadost',
    image: img('nespokojeny_radce'),
    scenarios: ['panovnik', 'slechtic'], // the village version follows (q_ctizadost_ves)
    cooldown: 16, minTurn: 6,
    target: withQuirk('ctizadostivy', (c) => c.loyalty < 65),
    title: 'Zaslouží si víc',
    text: '{target.Role} {target.name} žádá odměnu za léta služby: půdu, čest a místo, kde {T:ho|ji} uvidí každý. A nenápadně dává najevo, že jinde by si {T:ho|ji} vážili víc.',
    choices: [
      {
        label: 'Vyhovět a štědře odměnit',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -8 },
        courtEffects: { target: { loyalty: 18 } },
        chronicle: '{target.name} {T:dostal|dostala}, co {T:chtěl|chtěla}. Na chvíli.',
      },
      {
        label: 'Odmítnout',
        hintType: 'trait', hintKey: 'strength',
        effects: { prestige: 1 },
        courtEffects: { target: { loyalty: -12 } },
        chronicle: 'Žádost byla odmítnuta. {target.name} se uklonil{T:|a} hlouběji, než bylo třeba.',
      },
      {
        label: 'Slíbit odměnu později',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.5, traitKey: 'eloquence', traitScale: 0.04,
        onSuccess: { courtEffects: { target: { loyalty: 6 } }, traitGain: 'eloquence', chronicle: 'Slib zazněl tak přesvědčivě, že mu {target.name} {T:uvěřil|uvěřila}.' },
        onFailure: { courtEffects: { target: { loyalty: -15 } }, chronicle: '{target.name} prázdné sliby prokoukl{T:|a}. A nezapomene je.' },
      },
    ],
  },

  {
    // a neighbour wants more than a serf can give: no land, no office, but money and a word with the lord
    id: 'q_ctizadost_ves',
    image: img('nespokojeny_radce'),
    scenario: 'sedlak',
    cooldown: 16, minTurn: 6,
    target: withQuirk('ctizadostivy', (c) => c.loyalty < 65),
    title: 'Zaslouží si víc',
    text: '{target.Role} {target.name} ti připomíná, kolikrát {T:podržel|podržela} rod {dynastyName} nad vodou. Teď chce něco zpátky: podíl z grošů, přímluvu u {L:pána|paní} a místo v čele stolu na posvícení. A nahlas přemýšlí, jestli by si {T:ho|ji} jinde ve vsi nevážili víc.',
    choices: [
      {
        label: 'Vyhovět a štědře se odvděčit',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -8 },
        courtEffects: { target: { loyalty: 18 } },
        chronicle: '{target.name} {T:dostal|dostala}, co {T:chtěl|chtěla}. Na chvíli.',
      },
      {
        label: 'Odmítnout',
        hintType: 'trait', hintKey: 'strength',
        effects: { prestige: 1 },
        courtEffects: { target: { loyalty: -12 } },
        chronicle: 'Žádost byla odmítnuta. {target.name} odešel{T:|a} bez pozdravu a ves si toho všimla.',
      },
      {
        label: 'Slíbit odměnu po žních',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.5, traitKey: 'eloquence', traitScale: 0.04,
        onSuccess: { courtEffects: { target: { loyalty: 6 } }, traitGain: 'eloquence', chronicle: 'Slib zazněl tak přesvědčivě, že mu {target.name} {T:uvěřil|uvěřila}.' },
        onFailure: { courtEffects: { target: { loyalty: -15 } }, chronicle: '{target.name} prázdné sliby prokoukl{T:|a}. A nezapomene je.' },
      },
    ],
  },

  {
    id: 'q_odvaha',
    image: img('lapkove_ve_hvozdu'),
    scenarios: ALL,
    cooldown: 16, minTurn: 4,
    target: withQuirk('odvazny'),
    title: 'Odvážný plán',
    text: '{target.Role} {target.name} navrhuje udeřit na lapky ve hvozdu dřív, než udeří oni. Plán je odvážný až drzý a {target.name} se už nemůže dočkat.',
    choices: [
      {
        label: 'Svolit',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.5, resourceKey: 'army', resourceScale: 0.4,
        onSuccess: { effects: { prestige: 6, stability: 3 }, courtEffects: { target: { loyalty: 6 } }, music: 'battle', chronicle: 'Lapkové byli zaskočeni ve spánku. {target.name} se {T:vrátil|vrátila} s jejich korouhví.' },
        onFailure: { effects: { army: -6, prestige: -3 }, courtEffects: { target: { loyalty: -3 } }, music: 'battle', chronicle: 'Lapkové čekali. Odvaha tentokrát nestačila.' },
      },
      {
        label: 'Zakázat to',
        hintType: 'trait', hintKey: 'patience',
        effects: { stability: 1 },
        courtEffects: { target: { loyalty: -6 } },
        chronicle: 'Plán zůstal jen plánem. {target.name} se tváří, jako by {T:mu|jí} někdo vzal meč.',
      },
    ],
  },

  {
    id: 'q_oddanost',
    image: img('zprava_spehmistra'),
    scenarios: ALL,
    cooldown: 24, minTurn: 8,
    target: withQuirk('oddany', (c) => c.loyalty >= 75),
    title: 'Věrné srdce',
    text: '{target.Role} {target.name} {T:přišel|přišla} v noci s lucernou. {T:Zaslechl|Zaslechla} rozhovor, který {T:neměl|neměla} slyšet: někdo z vlastních lidí donáší cizím. Jméno prozradí, ale prosí o milost pro jeho rodinu.',
    choices: [
      {
        label: 'Udělit milost rodině',
        hintType: 'resource', hintKey: 'stability',
        effects: { stability: 5, faith: 2 },
        courtEffects: { target: { loyalty: 5 } },
        chronicle: 'Donašeč byl potrestán, jeho rodina ušetřena. {target.name} {T:měl|měla} pravdu, jako vždy.',
      },
      {
        label: 'Potrestat celou rodinu',
        requires: (s) => s.scenario !== 'sedlak',
        hintType: 'trait', hintKey: 'strength',
        effects: { stability: 3, prestige: 1 },
        courtEffects: { target: { loyalty: -8 } },
        chronicle: 'Donašeč i jeho rodina odešli v poutech. {target.name} od té doby mluví méně.',
      },
      {
        label: 'Vyhnat donašeče i s rodinou z gruntu',
        requires: (s) => s.scenario === 'sedlak', // a farmer has no chains, only a gate
        hintType: 'trait', hintKey: 'strength',
        effects: { stability: 3, prestige: 1 },
        courtEffects: { target: { loyalty: -8 } },
        chronicle: 'Donašeč i jeho rodina odešli z gruntu jen s uzlíky. {target.name} od té doby mluví méně.',
      },
    ],
  },

  {
    id: 'n_vychova_dedice',
    image: img('vychova_dedice'),
    scenario: 'slechtic',
    cooldown: 16,
    requires: (s) => s.heir.alive && s.heir.age >= 6 && s.heir.age < 16,
    title: 'Kde se bude dědic učit',
    text: '{heir.name} dorůstá a rod {dynastyName} musí rozhodnout, kde se bude {D:dědic|dědička} učit. Může jít jako panoš ke královskému dvoru, učit se u purkrabího správě panství, nebo vyrůst v družině mezi meči.',
    choices: [
      {
        label: 'Poslat dědice ke královskému dvoru',
        hintType: 'resource', hintKey: 'favor',
        effects: { gold: -6, favor: 6 },
        heirTraits: { eloquence: 2 },
        chronicle: '{heir.name} odjel{D:|a} ke dvoru. Naučí se úklonám, řeči a tomu, kdo komu co dluží.',
      },
      {
        label: 'Učit se správě panství',
        hintType: 'trait', hintKey: 'intelligence',
        courtEffects: { chancellor: { loyalty: 6 } },
        heirTraits: { intelligence: 1, patience: 1 },
        chronicle: '{heir.name} sedí s purkrabím nad účty a mapami. Ví, kolik nese každá louka.',
      },
      {
        label: 'Vycvičit dědice v družině',
        hintType: 'trait', hintKey: 'strength',
        effects: { army: 2 },
        courtEffects: { marshal: { loyalty: 6 } },
        heirTraits: { strength: 2 },
        chronicle: '{heir.name} tráví dny na cvičišti. Družina {D:ho|ji} má ráda a {D:on|ona} ji.',
      },
    ],
  },
];
