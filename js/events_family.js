// Family events (family.js): a child is born, a matchmaker comes to a ruler who
// stays single too long, and a ruler without an heir can take in a relative's
// child. Branch extras: marrySuitor: <index in state.suitors>, adopt: true.

const ALL = ['sedlak', 'slechtic', 'panovnik'];
const img = (id) => `assets/events/${id}.jpg`;
const single = (s) => !s.spouse || s.spouse.alive === false;
const noHeir = (s) => (!s.heir || s.heir.alive === false) && !(s.children || []).some((c) => c.alive !== false);
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
        chronicle: 'Na křtinách {child.name} se jedlo, pilo a zpívalo do rána.',
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
    id: 'f_dohazovac',
    scenarios: ALL, cooldown: 16, minTurn: 20, weight: 2,
    requires: (s) => single(s) && s.ruler.age >= 26 && s.ruler.age <= 55 && (s.suitors || []).length > 0,
    image: img('rada_manzela'),
    title: 'Je čas',
    text: 'Za {ruler.name} přišel někdo, kdo to s rodem myslí dobře — stará teta, kněz nebo přítel z mládí. „Roky běží,“ říká, „a rod bez dědice je jako strom bez kořenů. Vím o někom, kdo by neřekl ne.“ Na stole leží jména a na nich budoucnost rodu {dynastyName}.',
    choices: [
      { label: 'Vzít si {suitor.0.name} ({suitor.0.kind})', requires: suitor(0), hintType: 'resource', hintKey: 'prestige', marrySuitor: 0, chronicle: 'Svatba byla domluvená, ale nikdo na ní neplakal smutkem.' },
      { label: 'Vzít si {suitor.1.name} ({suitor.1.kind})', requires: suitor(1), hintType: 'resource', hintKey: 'prestige', marrySuitor: 1, chronicle: 'Svatba byla domluvená, ale nikdo na ní neplakal smutkem.' },
      { label: 'Vzít si {suitor.2.name} ({suitor.2.kind})', requires: suitor(2), hintType: 'resource', hintKey: 'prestige', marrySuitor: 2, chronicle: 'Svatba byla domluvená, ale nikdo na ní neplakal smutkem.' },
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
];
