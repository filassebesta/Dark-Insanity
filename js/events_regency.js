// A child on the throne (regency.js): who governs in the child's name, what an ambitious regent
// does with the years, and the scene at sixteen that ends the regency. They take no season (free),
// except regent_moc, an ordinary event.
//   regentstvi   the succession scene is followed by the choice of a regent (forced, queued by handleSuccession)
//   regent_moc   an ambitious regent (an uncle or aunt, the chancellor) reaches for more power
//   plnoletost   at sixteen the regent must hand over (forced, queued by engine.js processRegencyScenes)
// Branch extra: regency: { appoint, ambition, loyalty, grab, dismiss, end }.

const ALL = ['sedlak', 'slechtic', 'panovnik'];
const img = (id) => `assets/events/${id}.jpg`;

const on = (s) => !!(s.regency && !s.regency.ended);
const asked = (s) => on(s) && !s.regency.regent;
const ambitious = (s) => on(s) && (s.regency.ambition >= 60 || s.regency.grab);
const council = (s) => on(s) && s.regency.regent === 'council';
const loyal = (s) => (on(s) && s.regency.loyalty >= 60 ? 0.1 : 0);

export const REGENCY_EVENTS = [
  {
    id: 'regentstvi',
    scenarios: ALL, forced: true, free: true,
    dropIf: (s) => !asked(s),
    image: img('tr_regentska_rada'),
    title: 'Kdo bude vládnout za dítě?',
    text: 'Pohřeb skončil a všichni hledí na nového vládce, který ještě neumí ani pořádně sedět na vysoké židli. {R:Je mu|Je jí} {ruler.ageLabel}. Dokud nedospěje do šestnácti let, musí někdo {R:jeho|jejím} jménem {regency.duties} — a to není práce pro dítě. {regency.court} Komu svěříš otěže, ten je nebude pouštět z ruky snadno.',
    choices: [
      {
        label: 'Za dítě bude vládnout {regency.spouseRel} {regency.spouseName}',
        requires: (s) => !!(s.regency && s.regency.cand && s.regency.cand.spouse),
        hintType: 'resource', hintKey: 'legitimacy',
        effects: { legitimacy: 4, stability: 2 }, houseEffects: { '*': { attitude: -3 } },
        regency: { appoint: 'spouse' },
        chronicle: '{regent.Who} se ujímá regentství. Kdo vládne za dítě, má v něm svou vlastní krev — a to je nejlepší záruka věrnosti, jakou lze mít.',
      },
      {
        label: 'Za dítě bude vládnout {regency.kinRel} {regency.kinName}',
        requires: (s) => !!(s.regency && s.regency.cand && s.regency.cand.sibling),
        hintType: 'resource', hintKey: 'stability',
        effects: { stability: 3, prestige: 2, legitimacy: -4 }, houseEffects: { '*': { attitude: 3 } },
        regency: { appoint: 'sibling' },
        chronicle: '{regent.Who} se ujímá regentství. Mnozí si šeptají, že kdo drží otěže za dítě, dobře ví, kdo by na {R:jeho|jejím} místě seděl lépe.',
      },
      {
        label: 'Za dítě bude vládnout {chancellor.title} {chancellor.name}',
        hintType: 'resource', hintKey: 'stability',
        effects: { stability: 5, gold: 4, legitimacy: -3 }, courtEffects: { chancellor: { loyalty: 12 } },
        regency: { appoint: 'chancellor' },
        chronicle: '{regent.Who} se ujímá regentství. Úřad, který dosud jen radil, teď rozhoduje — a kdo rozhoduje, ten si zvyká.',
      },
      {
        label: 'Za dítě bude vládnout {regency.council}',
        hintType: 'trait', hintKey: 'eloquence',
        effects: { stability: -3, legitimacy: -1, faith: 1 }, houseEffects: { '*': { attitude: 8 } },
        regency: { appoint: 'council' },
        chronicle: '{regent.Who} se ujímá regentství. Členové rady zasedli k jednomu stolu a každý z nich si doma počítá, co by z toho mohl mít.',
      },
    ],
  },

  {
    id: 'regent_moc',
    scenarios: ALL, oneTime: true, cooldown: 20, weight: 8,
    requires: (s) => on(s) && (s.regency.regent === 'sibling' || s.regency.regent === 'chancellor') && s.regency.ambition >= 55 && !s.regency.grab && s.ruler.age < 16,
    image: img('n_zradce_v_radach'),
    title: 'Regent sahá po moci',
    text: '{spymaster.Title} {spymaster.name} {Y:přinesl|přinesla} zprávu, kterou by dvůr nejraději neslyšel: {regent.Who}, {G:který|která} vládne za dítě, dosazuje na všechna důležitá místa vlastní lidi, pečetí listiny bez ptaní a mluví o věcech, které prý „nesnesou čekání na dospělost“. Zatím se drží práva — jenže kdo drží otěže dost dlouho, přestává je mít za půjčené.',
    choices: [
      {
        label: 'Připomenout {G:regentovi|regentce}, čí je vláda',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.45, traitKey: 'eloquence', traitScale: 0.05,
        chanceBonus: loyal, bonusLabel: 'Věrný regent',
        onSuccess: { effects: { stability: 2, prestige: 1 }, regency: { ambition: -20 }, chronicle: '{regent.Who} sklopil{G:|a} oči a slíbil{G:|a}, že bude vládnout jen jménem dítěte. Zatím to platí.' },
        onFailure: { effects: { stability: -4, legitimacy: -4 }, regency: { grab: true, ambition: 10 }, chronicle: '{regent.Who} připomínku odbyl{G:|a} s úsměvem. Od té chvíle se mluví o tom, kdo je tu vlastně pánem.' },
      },
      {
        label: 'Dát {G:regentovi|regentce} víc moci, ať je klid',
        hintType: 'resource', hintKey: 'stability',
        effects: { stability: 3, gold: 3, legitimacy: -3 }, regency: { ambition: 15, loyalty: 8 },
        chronicle: '{regent.Who} dostal{G:|a} další pečeť a další úřady. Všichni dýchají klidněji — a mlčí o tom, jak dlouho klid vydrží.',
      },
      {
        label: 'Ustavit nad regentem dozor velmožů',
        requires: (s) => s.scenario !== 'sedlak',
        hintType: 'trait', hintKey: 'intelligence',
        effects: { stability: -2, legitimacy: 2 }, houseEffects: { '*': { attitude: 5 } }, regency: { ambition: -10 },
        chronicle: 'Velmoži si rozdělili úkol hledět regentovi na prsty. Pečetí listin ubylo, sporů přibylo.',
      },
      {
        label: 'Svolat starší vsi, ať regentovi hledí na prsty',
        requires: (s) => s.scenario === 'sedlak',
        hintType: 'trait', hintKey: 'eloquence',
        effects: { stability: -1, prestige: 1 }, regency: { ambition: -10 },
        chronicle: 'Ves si zvolila dva starší, kteří dohlížejí na každý groš. Regent to nese těžko, ale nic nenamítá.',
      },
      {
        label: 'Odvolat {G:regenta|regentku} a vládnout skrze radu',
        hintType: 'trait', hintKey: 'strength',
        effects: { stability: -4, legitimacy: -3 }, houseEffects: { '*': { attitude: 4 } }, regency: { dismiss: true },
        chronicle: '{regent.Who} byl{G:|a} odvolán{G:|a}. Otěže přebírá rada — a ta se hádá, ale nikdo si je nepřisvojí.',
      },
    ],
  },

  {
    id: 'plnoletost',
    scenarios: ALL, forced: true, free: true,
    dropIf: (s) => !(on(s) && s.regency.regent),
    image: img('dedic_dospel'),
    title: 'Plnoletost',
    text: '{ruler.name} dnes dovršil{R:|a} šestnáct let. Podle zákona i zvyku tím končí regentství — {regent.who} má složit moc do rukou {R:mladého vládce|mladé vládkyně}. {regent.mood}',
    choices: [
      {
        label: 'Převzít vládu a veřejně poděkovat za věrnou službu',
        requires: (s) => !ambitious(s),
        hintType: 'resource', hintKey: 'prestige',
        effects: { prestige: 3, stability: 2, legitimacy: 3 }, regency: { end: 'thanks' },
        chronicle: '{ruler.name} {R:převzal|převzala} vládu do vlastních rukou. {regent.Who} se moci vzdal{G:|a} bez odporu a poklekl{G:|a} první. Všichni vydechli.',
      },
      {
        label: 'Převzít vládu a veřejně poděkovat za věrnou službu',
        requires: (s) => ambitious(s),
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.5, traitKey: 'eloquence', traitScale: 0.05,
        chanceBonus: loyal, bonusLabel: 'Věrný regent',
        onSuccess: { effects: { prestige: 3, stability: 2, legitimacy: 3 }, regency: { end: 'thanks' }, chronicle: '{ruler.name} {R:převzal|převzala} vládu a {regent.who} se po krátkém váhání podvolil{G:|a}. Slovo {R:mladého vládce|mladé vládkyně} stačilo.' },
        onFailure: { effects: { stability: -5, legitimacy: -5, prestige: -2 }, hiddenEffects: { setFlag: 'regent_odpor' }, regency: { end: 'clung' }, chronicle: '{regent.Who} se vzdát moci odmítl{G:|a}. Předání trvalo měsíce a stálo hodně sporů, než si {ruler.name} moc skutečně {R:vzal|vzala}.' },
      },
      {
        label: 'Převzít vládu; {regent.name} zůstane po boku jako rádce',
        requires: (s) => !ambitious(s),
        hintType: 'trait', hintKey: 'patience',
        effects: { stability: 3, legitimacy: -1 }, hiddenEffects: { setFlag: 'regent_poradce' }, regency: { end: 'adviser' },
        chronicle: '{ruler.name} {R:převzal|převzala} vládu, ale {regent.name} zůstává po boku jako rádce. Zkušenost se hodí a nikdo se nehádá.',
      },
      {
        label: 'Převzít vládu; {regent.name} zůstane po boku jako rádce',
        requires: (s) => ambitious(s),
        hintType: 'trait', hintKey: 'patience',
        effects: { stability: 1, legitimacy: -4, prestige: -1 }, hiddenEffects: { setFlag: 'regent_poradce' }, regency: { end: 'adviser' },
        chronicle: '{ruler.name} {R:převzal|převzala} vládu, ale {regent.name} zůstává po boku jako rádce. Staré návyky se nevypaří přes noc a všichni to vědí.',
      },
      {
        label: 'Regentství skončí; {regent.name} odejde na odpočinek s dary',
        requires: (s) => !council(s) && s.resources.gold >= 6,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -6, prestige: 1, stability: 2 }, regency: { end: 'retired' },
        chronicle: '{ruler.name} {R:převzal|převzala} vládu. {regent.Who} odjíždí na odpočinek s dary a s poděkováním všech.',
      },
      {
        label: 'Regentská rada se rozpustí a její členové dostanou dary',
        requires: (s) => council(s) && s.resources.gold >= 6,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -6, prestige: 1, stability: 2 }, regency: { end: 'retired' },
        chronicle: '{ruler.name} {R:převzal|převzala} vládu. Regentská rada se rozpustila a její členové odešli s dary a s poděkováním.',
      },
      {
        label: 'Zbavit moci a poslat pryč: {regent.name} už vládnout nebude',
        requires: (s) => ambitious(s) && !council(s),
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.4, traitKey: 'strength', traitScale: 0.05, resourceKey: 'army', resourceScale: 0.002, noInjury: true,
        onSuccess: { effects: { prestige: 4, legitimacy: 2, stability: 2 }, regency: { end: 'forced' }, chronicle: '{ruler.name} {R:zbavil|zbavila} {G:regenta|regentku} moci jedním rozhodným krokem a {G:poslal|poslala} {G:ho|ji} pryč. Všichni si zapamatovali, že {R:nový vládce|nová vládkyně} není dítě.' },
        onFailure: { effects: { stability: -7, legitimacy: -6, army: -4, prestige: -2 }, hiddenEffects: { setFlag: 'regent_odpor' }, regency: { end: 'forced' }, chronicle: 'Pokus o zbavení moci skončil ostudou. {regent.Who} má stále své lidi na hradech a {ruler.name} dostal{R:|a} první tvrdou lekci vlády.' },
      },
      {
        label: 'Rozpustit radu a poslat její členy domů',
        requires: (s) => ambitious(s) && council(s),
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.45, traitKey: 'strength', traitScale: 0.05, resourceKey: 'army', resourceScale: 0.002, noInjury: true,
        onSuccess: { effects: { prestige: 4, legitimacy: 2, stability: 2 }, regency: { end: 'forced' }, chronicle: '{ruler.name} {R:rozpustil|rozpustila} regentskou radu a poslal{R:|a} její členy domů. Všichni si zapamatovali, že {R:nový vládce|nová vládkyně} není dítě.' },
        onFailure: { effects: { stability: -7, legitimacy: -6, army: -4, prestige: -2 }, hiddenEffects: { setFlag: 'regent_odpor' }, regency: { end: 'forced' }, chronicle: 'Rada se rozpustit nechtěla a velmoži se vrátili domů s hrozbami. {ruler.name} dostal{R:|a} první tvrdou lekci vlády.' },
      },
    ],
  },
];
