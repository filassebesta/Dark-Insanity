// Conversations with the household (rozhovory): once a season the ruler can
// sit down with each member of the court and pick a topic. Some topics are a
// sure thing, others are a roll of k% like any risky choice (engine.js
// rollParts); a cold relationship makes them harder. Talks change loyalty,
// sometimes a trait, a resource or bring news. No DOM here — talk_ui.js draws it.

import { clamp, bumpStat, TRAIT_DEFS, clampRes } from './data.js';
import { roleLabel, COURT_ROLES } from './court.js';
import { personOf, marry, canConceive, conceiveChance, startPregnancy, isMarried, takeLover, loverCanConceive, loverConceiveChance, startLoverPregnancy } from './family.js';

// 'suitor:2' → 'suitor', 'spouse' → 'spouse'
const kindOf = (role) => String(role).split(':')[0];
const GIFT = { sedlak: 2, slechtic: 6, panovnik: 12 };

const ADVISERS = ['chancellor', 'marshal', 'spymaster'];
const ALL = ['spouse', 'heir', ...ADVISERS];
const g = (c, m, f) => (c.gender === 'female' ? f : m);
const R = (s, m, f) => (s.ruler.gender === 'female' ? f : m); // the ruler's own word forms

// what each adviser's advice brings (once a year)
const ADVICE = {
  chancellor: { effects: { gold: 3 }, line: 'Prošli jste spolu účty a našli, kde pokladna zbytečně teče.' },
  marshal: { effects: { army: 2 }, line: 'Probrali jste výcvik a výzbroj. Muži to poznají.' },
  spymaster: { effects: { stability: 1 }, line: 'Teď máš přehled o tom, co se šeptá po kraji.' },
  spouse: { effects: { stability: 2 }, line: 'Mezi čtyřma očima padlo, co by před radou nikdy nezaznělo.' },
};
const ADVICE_PEASANT = {
  chancellor: { effects: { gold: 2 }, line: 'Probrali jste, komu prodat a od koho nekupovat.' },
  marshal: { effects: { stability: 2 }, line: 'Kovář zadarmo spravil pluh a radlici.' },
  spymaster: { effects: { prestige: 1 }, line: 'Krčmář ti řekl, co si o tobě ves myslí — a komu se vyplatí koupit pivo.' },
  spouse: { effects: { stability: 2 }, line: 'Doma jste spolu probrali hospodaření až do noci.' },
};

// trait a capable adviser can teach
const TEACHES = { chancellor: 'intelligence', marshal: 'strength', spymaster: 'intelligence', spouse: 'eloquence' };

/**
 * Topics. roles: who it fits · quirk: only for that personality · yearly: once a year per person
 * roll: { trait, base, scale } (k%) · cost: resources paid first · win / lose: { loyalty, effects, ... }
 */
export const TOPICS = {
  zdravi: {
    label: 'Zeptat se, jak se má', roles: ALL,
    roll: { trait: 'eloquence', base: 0.55, scale: 0.04 },
    win: { loyalty: 4 }, lose: { loyalty: 1 },
    text: [(c) => `${c.name} se rozhovořil${g(c, '', 'a')} o věcech, o kterých se nahlas nemluví. Rozcházíte se s lehčím srdcem.`,
      (c) => `${c.name} odpovídal${g(c, '', 'a')} zdvořile a krátce. Snad jindy.`],
  },
  rada: {
    label: 'Požádat o radu', roles: ['spouse', ...ADVISERS], yearly: true,
    roll: { trait: 'intelligence', base: 0.5, scale: 0.04 },
    win: { loyalty: 3, advice: true }, lose: { loyalty: 1 },
    text: [(c, s, role) => `${(s.scenario === 'sedlak' ? ADVICE_PEASANT : ADVICE)[role].line} ${c.name} je rád${g(c, '', 'a')}, že se ${g(c, 'ho', 'jí')} ptáš.`,
      (c) => `Rada byla dlouhá a spletitá. ${c.name} ${g(c, 'odešel', 'odešla')} s pocitem, že tě odpověď nezajímala.`],
  },
  pochvala: {
    label: 'Pochválit před ostatními', roles: ['spouse', ...ADVISERS],
    win: { loyalty: 5, envy: 1 },
    text: [(c) => `Před celým dvorem zazněla tvá pochvala a ${c.name} ${g(c, 'zčervenal', 'zčervenala')} až po uši. Ostatní si to zapamatovali.`],
  },
  dar: {
    label: 'Dát dar', roles: ALL, cost: (s) => ({ gold: s.scenario === 'sedlak' ? 2 : 5 }),
    win: { loyalty: 8 },
    text: [(c) => `${c.name} dar s úsměvem přijal${g(c, '', 'a')}. ${c.quirk === 'chamtivy' ? 'Oči se ' + g(c, 'mu', 'jí') + ' rozzářily víc, než by se slušelo.' : 'Malá věc, která potěší.'}`],
  },
  vytka: {
    label: 'Vytknout chyby', roles: ['heir', ...ADVISERS],
    roll: { trait: 'strength', base: 0.4, scale: 0.05 },
    win: { loyalty: 2, effects: { stability: 1 } }, lose: { loyalty: -6 },
    text: [(c) => `${c.name} výtku přijal${g(c, '', 'a')} se sklopenou hlavou. Od té doby se snaží víc.`,
      (c) => `${c.name} se urazil${g(c, '', 'a')}. Dveře za sebou ${g(c, 'zavřel', 'zavřela')} hlasitěji, než bylo nutné.`],
  },
  // ---------- by personality ----------
  modlitba: {
    label: 'Pomodlit se spolu', roles: ['spouse', ...ADVISERS], quirk: 'zbozny',
    win: { loyalty: 5, effects: { faith: 2 } },
    text: [(c) => `Klečeli jste spolu v kapli do setmění. ${c.name} odcházel${g(c, '', 'a')} s lehkým srdcem.`],
  },
  ucit_se: {
    label: 'Učit se od něj', roles: ['spouse', ...ADVISERS], quirk: 'schopny', yearly: true,
    roll: { trait: 'patience', base: 0.4, scale: 0.04 },
    win: { loyalty: 2, teach: true }, lose: { loyalty: 1 },
    text: [(c, s, role) => `${c.name} ti ukázal${g(c, '', 'a')}, jak to dělá doopravdy. Ten den ses ${R(s, 'naučil', 'naučila')} víc než za rok u stolu. (+1 ${TRAIT_DEFS.find((t) => t.key === TEACHES[role]).label})`,
      (c) => `${c.name} vysvětloval${g(c, '', 'a')} trpělivě, ale nedošlo ti to. Možná příště.`],
  },
  slib: {
    label: 'Slíbit větší moc', roles: ADVISERS, quirk: 'ctizadostivy',
    available: (c) => !c.promised,
    win: { loyalty: 10, promise: true },
    text: [(c) => `${c.name} slib přijal${g(c, '', 'a')} s blýskajícíma očima. Ctižádostiví ale na sliby nezapomínají.`],
  },
  boje: {
    label: 'Vyprávět si o bojích', roles: ADVISERS, quirk: 'odvazny',
    win: { loyalty: 4, effects: { prestige: 1 } },
    text: [(c) => `Do noci jste si vyprávěli o šarvátkách a dobrodružstvích. ${c.name} se smál${g(c, '', 'a')} tak, že ${g(c, 'ho', 'ji')} bylo slyšet až na nádvoří.`],
  },
  rizika: {
    label: 'Probrat, co může selhat', roles: ADVISERS, quirk: 'opatrny',
    win: { loyalty: 4, effects: { stability: 1 } },
    text: [(c) => `${c.name} vytáhl${g(c, '', 'a')} seznam všeho, co se může pokazit. Byl dlouhý, ale po rozhovoru je ${g(c, 'mu', 'jí')} klidněji.`],
  },
  sverit: {
    label: 'Svěřit se se starostmi', roles: ['spouse', ...ADVISERS], quirk: 'oddany',
    win: { loyalty: 3, effects: { stability: 2 } },
    text: [(c) => `${c.name} poslouchal${g(c, '', 'a')} a nic neříkal${g(c, '', 'a')}. Někdy je to ta nejlepší rada.`],
  },
  // ---------- family and the gossip ----------
  vychova: {
    label: 'Učit dědice', roles: ['heir'], yearly: true,
    available: (c) => c.age >= 6 && c.age < 18,
    roll: { trait: 'patience', base: 0.5, scale: 0.04 },
    win: { loyalty: 3, heirTrait: true }, lose: { loyalty: 1 },
    text: [(c) => `Celé odpoledne jste spolu strávili nad knihami a s dřevěnými meči. ${c.name} se zlepšil${g(c, '', 'a')}.`,
      (c) => `${c.name} se nesoustředil${g(c, '', 'a')} a myšlenky ${g(c, 'mu', 'jí')} utíkaly k oknu. Děti jsou děti.`],
  },
  vecer: {
    label: 'Strávit spolu večer', roles: ['spouse'],
    win: { loyalty: 5, effects: { stability: 1 } },
    text: [(c) => `Večer jen pro vás dva, bez rádců a prosebníků. ${c.name} se po dlouhé době usmíval${g(c, '', 'a')}.`],
  },
  // ---------- love and children (family.js) ----------
  dite: {
    label: 'Toužit spolu po dítěti', roles: ['spouse'],
    available: (c, s) => canConceive(s),
    roll: { trait: 'patience', base: (s) => conceiveChance(s), scale: 0 },
    win: { loyalty: 4, child: true }, lose: { loyalty: 2 },
    text: [(c) => `Noc patřila jen vám dvěma. Za pár týdnů ${g(c, 'jsi poznala, že čekáš dítě, a ' + c.name + ' tě nadšeně zvedl do náruče', c.name + ' ti s úsměvem oznámila, že čeká dítě')}.`,
      (c) => `Noc patřila jen vám dvěma. Dítě zatím nepřišlo — ale ${c.name} se usmívá a říká, že máte čas.`],
  },
  nam_rec: {
    label: 'Dát se do řeči', roles: ['suitor'],
    roll: { trait: 'eloquence', base: 0.55, scale: 0.04 },
    win: { affection: 8, heart: 2 }, lose: { affection: 2 },
    text: [(c) => `Slovo dalo slovo a ${c.name} se ${g(c, 'rozesmál', 'rozesmála')}. Když jste se loučili, ${g(c, 'ohlédl', 'ohlédla')} se.`,
      (c) => `Rozhovor drhnul. ${c.name} odpovídal${g(c, '', 'a')} zdvořile, ale myšlenkami byl${g(c, '', 'a')} jinde.`],
  },
  nam_dar: {
    label: 'Přinést dárek', roles: ['suitor'], cost: (s) => ({ gold: GIFT[s.scenario] || 2 }),
    win: { affection: 10, heart: 4 },
    text: [(c, s) => { const gift = { sedlak: ['Pentle z jarmarku', 'a'], slechtic: ['Stříbrná spona', 'a'] }[s.scenario] || ['Prsten se smaragdem', '']; return `${gift[0]} ${g(c, 'ho', 'ji')} potěšil${gift[1]} víc, než ${g(c, 'chtěl', 'chtěla')} dát najevo.`; }],
  },
  nam_tanec: {
    label: 'Pozvat na tanec', roles: ['suitor'], yearly: true,
    roll: { trait: 'strength', base: 0.5, scale: 0.04 },
    win: { affection: 15, heart: 2, effects: { prestige: 1 } }, lose: { affection: -3 },
    text: [(c) => `Tančili jste spolu, dokud muzikanti nepadli únavou. Celé okolí si toho všimlo — a ${c.name} taky.`,
      (c, st) => `Při tanci jsi ${g(c, 'mu', 'jí')} ${R(st, 'šlápl', 'šlápla')} na nohu dvakrát. ${c.name} se smál${g(c, '', 'a')}, ale spíš tobě než s tebou.`],
  },
  nam_svest: {
    label: 'Svést', roles: ['suitor'],
    available: (c) => c.affection >= 35 && !c.lover,
    roll: { trait: 'eloquence', base: 0.35, scale: 0.05 },
    win: { affection: 25, heart: 5 }, lose: { affection: -15, effects: { prestige: -2 } },
    text: [(c) => `Když jste konečně osaměli, ${c.name} přestal${g(c, '', 'a')} odolávat. Od té noci se na tebe dívá jinak.`,
      (c) => `${c.name} ${g(c, 'tě odstrčil', 'tě odstrčila')} a ${g(c, 'odešel', 'odešla')}. A do večera to věděli všichni, kdo to vědět neměli.`],
  },
  nam_ruka: {
    label: 'Požádat o ruku', roles: ['suitor'],
    available: (c, s) => c.affection >= 55 && !isMarried(s),
    // the warmer the heart, the surer the answer: from affection 75 on it is yes
    roll: { trait: 'eloquence', base: 0.4, scale: 0.04, bonus: (c) => (c.affection >= 75 ? 1 : (c.affection - 55) / 50) },
    win: { marry: true }, lose: { affection: -5 },
    text: [(c, s) => `${c.name} řekl${g(c, '', 'a')} ano. ${R(s, 'Ženich', 'Nevěsta')} i ${g(c, 'ženich', 'nevěsta')} se těší na svatbu.`,
      (c) => `${c.name} sklopil${g(c, '', 'a')} oči: „Ještě ne. Dej mi čas.“`],
  },
  nam_milenka: {
    label: (c) => (c.gender === 'female' ? 'Nabídnout jí, aby byla tvou milenkou' : 'Nabídnout mu, aby byl tvým milencem'), roles: ['suitor'],
    available: (c) => c.affection >= 50 && !c.lover,
    roll: { trait: 'eloquence', base: 0.4, scale: 0.05, bonus: (c) => (c.affection - 50) / 80 + (c.loyalty - 50) / 150 },
    win: { lover: true, affection: 5 }, lose: { affection: -12, heart: -5 },
    text: [(c) => `${c.name} dlouho mlčel${g(c, '', 'a')}. Pak ${g(c, 'tě vzal', 'tě vzala')} za ruku: „Ať si říkají, co chtějí.“`,
      (c, st) => `${c.name} zbledl${g(c, '', 'a')}: „Za koho mě máš?“ A ${g(c, 'odešel', 'odešla')} dřív, než jsi ${R(st, 'stačil', 'stačila')} cokoli vysvětlit.`],
  },
  mil_noc: {
    label: 'Strávit spolu noc', roles: ['suitor'],
    available: (c) => !!c.lover,
    win: { affection: 6, heart: 4 },
    text: [(c) => `Noc byla krátká a ráno přišlo moc brzy. ${c.name} se ve dveřích ještě jednou ohlédl${g(c, '', 'a')}.`],
  },
  mil_dite: {
    label: 'Chtít spolu dítě', roles: ['suitor'],
    available: (c, s) => !!c.lover && loverCanConceive(s, s.suitors.indexOf(c)),
    roll: { trait: 'patience', base: (s, c) => loverConceiveChance(s, s.suitors.indexOf(c)), scale: 0 },
    win: { bastard: true, affection: 5, heart: 6 }, lose: { affection: 2 },
    text: [(c, s) => (s.ruler.gender === 'female' ? `Za pár týdnů jsi poznala, že čekáš dítě. Otcem je ${c.name} — a to se v kronice nenapíše.` : `Za pár týdnů ti ${c.name} pošeptala, že čeká dítě. Tvoje dítě — a ne manželské.`),
      (c) => `Dítě zatím nepřišlo. ${c.name} se usmívá a říká, že na to je času dost.`],
  },
  mil_konec: {
    label: 'Ukončit poměr', roles: ['suitor'],
    available: (c) => !!c.lover,
    win: { endLover: true, affection: -25, heart: -20 },
    text: [(c) => `${c.name} to přijal${g(c, '', 'a')} bez slova. Jen se ve dveřích neohlédl${g(c, '', 'a')}.`],
  },
  drby: {
    label: 'Vyptat se na drby', roles: ['spymaster'],
    roll: { trait: 'eloquence', base: 0.5, scale: 0.04 },
    win: { loyalty: 1, gossip: true }, lose: { loyalty: 0 },
    text: [(c) => `${c.name} se naklonil${g(c, '', 'a')} blíž a ztišil${g(c, '', 'a')} hlas.`,
      (c) => `${c.name} se tvářil${g(c, '', 'a')}, že nic neví. Možná opravdu neví — nebo neřekne.`],
  },
};

/** A topic's label; some depend on the person ("tvou milenkou" / "tvým milencem"). */
export function topicLabel(t, c) {
  return typeof t.label === 'function' ? t.label(c) : t.label;
}

/** Why the ruler cannot talk to this person now (null = can). */
export function talkBlock(state, role) {
  const c = personOf(state, role);
  if (!c || c.alive === false) return 'Mrtví už nemluví.';
  if (kindOf(role) === 'child') return c.age < 4 ? 'Je to ještě malé dítě.' : 'S dětmi si promluvíš, až budou dědici.';
  if (kindOf(role) === 'sibling') return 'Se sourozenci si promluvíš, až budou dědici.';
  if (kindOf(role) === 'bastard') return 'Je to ještě dítě.';
  if (role === 'heir' && c.age < 4) return 'Dědic je ještě malé dítě.';
  if (c.talkTurn === state.turn) return `Tohle období jste spolu už mluvili. Příště v dalším období.`;
  if (state.gameOver) return 'Kronika skončila.';
  return null;
}

/** Topics open with this person now: [{ key, def, block }] (block = why not, if any). */
export function topicsFor(state, role) {
  const c = personOf(state, role);
  return Object.entries(TOPICS)
    .filter(([, t]) => t.roles.includes(kindOf(role)) && (!t.quirk || t.quirk === c.quirk) && (!t.available || t.available(c, state)))
    .map(([key, t]) => {
      let block = null;
      if (t.yearly && c.topicYear && c.topicYear[key] === state.year) block = 'Letos už jste o tom mluvili.';
      const cost = t.cost ? t.cost(state) : null;
      if (!block && cost && Object.entries(cost).some(([k, v]) => (state.resources[k] ?? 0) < v)) block = 'Na to nemáš.';
      return { key, def: t, block, cost };
    });
}

/** A pseudo-choice for rollParts: the topic's trait, and a cold heart makes it harder. */
export function topicRollChoice(state, role, key) {
  const t = TOPICS[key];
  if (!t.roll) return null;
  const c = personOf(state, role);
  const suitor = kindOf(role) === 'suitor';
  const heart = suitor ? c.affection : c.loyalty;
  const cold = (heart < 40 ? -0.1 : heart >= 70 ? 0.05 : 0) + (t.roll.bonus ? t.roll.bonus(c) : 0);
  return {
    label: topicLabel(t, c), isRoll: true, baseChance: typeof t.roll.base === 'function' ? t.roll.base(state, c) : t.roll.base,
    traitKey: t.roll.trait, traitScale: t.roll.scale,
    chanceBonus: cold ? () => cold : null, bonusLabel: suitor ? 'Náklonnost' : cold < 0 ? 'Chladný vztah' : 'Důvěra',
  };
}

/** How the person greets the ruler, by loyalty. */
export function greeting(state, role) {
  const c = personOf(state, role);
  if (kindOf(role) === 'suitor') {
    if (c.affection >= 60) return `${c.name} se rozzáří, sotva tě uvidí. „Doufal${g(c, '', 'a')} jsem, že přijdeš.“`;
    if (c.affection >= 30) return `${c.name} se usměje a upraví si vlasy. „Dobrý den.“`;
    return `${c.name} tě zdvořile pozdraví a čeká, co řekneš.`;
  }
  const title = roleLabel(role, c.gender, state.scenario, state.flags);
  if (c.loyalty >= 70) return `${title} ${c.name} se usměje a odloží práci. „Pro tebe mám vždycky čas.“`;
  if (c.loyalty >= 40) return state.scenario === 'sedlak' || ['spouse', 'heir'].includes(role) ? `${title} ${c.name} zvedne hlavu od práce. „Co potřebuješ?“` : `${title} ${c.name} se ukloní. „Čím mohu posloužit?“`;
  return `${title} ${c.name} se zvedne jen napůl a dívá se kamsi za tebe. „Ano?“`;
}

/**
 * Holds the conversation: pays the cost, applies the result. success = the roll
 * (true for topics without one). Returns { text, notes, delta }.
 */
export function holdTalk(state, role, key, success) {
  const c = personOf(state, role);
  const t = TOPICS[key];
  const res = success ? t.win : t.lose || t.win;
  const notes = [];
  const cost = t.cost ? t.cost(state) : null;
  for (const [k, v] of Object.entries(cost || {})) state.resources[k] = clampRes(k, state.resources[k] - v);
  // a suitor's heart, a court member's loyalty
  let delta = res.loyalty || res.affection || 0;
  if (kindOf(role) === 'suitor') {
    c.affection = clamp(c.affection + (res.affection || 0));
    c.loyalty = clamp((c.loyalty ?? 45) + (res.heart || 0)); // věrnost
    const idx = Number(String(role).split(':')[1]);
    if (res.lover) takeLover(state, idx);
    if (res.bastard) startLoverPregnancy(state, idx);
    if (res.endLover) c.lover = false;
    for (const [k, v] of Object.entries(res.effects || {})) if (state.resources[k] !== undefined) state.resources[k] = clampRes(k, state.resources[k] + v);
    const text = (success ? t.text[0] : t.text[1] || t.text[0])(c, state, role);
    c.talkTurn = state.turn;
    if (t.yearly) { c.topicYear = c.topicYear || {}; c.topicYear[key] = state.year; }
    bumpStat(state, 'talks');
    if (res.marry) {
      // the suitor becomes the spouse: the sheet switches to them
      marry(state, Number(String(role).split(':')[1]));
      state.spouse.talkTurn = state.turn;
      return { text, delta: 0, notes, role: 'spouse' };
    }
    return { text, delta, notes, role };
  }
  if (res.child) { startPregnancy(state); delete state.flags.no_more_children; }
  if (key === 'dar' && c.quirk === 'chamtivy') delta += 4;
  // a promise to the ambitious is paid in loyalty now and remembered
  if (res.promise) { c.promised = state.turn; }
  c.loyalty = clamp(c.loyalty + delta);
  for (const [k, v] of Object.entries(res.effects || {})) if (state.resources[k] !== undefined) state.resources[k] = clampRes(k, state.resources[k] + v);
  if (res.advice) {
    const a = (state.scenario === 'sedlak' ? ADVICE_PEASANT : ADVICE)[role];
    for (const [k, v] of Object.entries(a.effects)) if (state.resources[k] !== undefined) state.resources[k] = clampRes(k, state.resources[k] + v);
    notes.push(...Object.entries(a.effects).map(([k, v]) => `${k}:${v}`));
  }
  if (res.teach) state.ruler.traits[TEACHES[role]] = Math.min(10, state.ruler.traits[TEACHES[role]] + 1);
  if (res.heirTrait && c.traits) {
    const low = Object.entries(c.traits).sort((a, b) => a[1] - b[1])[0][0];
    c.traits[low] = Math.min(10, c.traits[low] + 1);
    notes.push(`heir:${low}`);
  }
  if (res.envy) {
    // the others notice who was praised
    for (const other of ADVISERS) {
      if (other === role || !state[other] || state[other].alive === false) continue;
      if (state[other].quirk === 'ctizadostivy') state[other].loyalty = clamp(state[other].loyalty - 3);
    }
  }
  let text = (success ? t.text[0] : t.text[1] || t.text[0])(c, state, role);
  if (res.gossip) text += ` ${gossip(state, role)}`;
  c.talkTurn = state.turn;
  if (t.yearly) { c.topicYear = c.topicYear || {}; c.topicYear[key] = state.year; }
  c.history = c.history || [];
  c.history.push({ year: state.year, season: state.seasonIndex, title: `Rozhovor: ${topicLabel(t, c).toLowerCase()}`, choice: null, outcome: t.roll ? (success ? 'success' : 'failure') : null, delta: delta || null });
  if (c.history.length > 40) c.history.shift();
  bumpStat(state, 'talks');
  return { text, delta, notes, role };
}

/** The gossip: who at court is least loyal, and what the great houses think. */
function gossip(state, role) {
  const others = COURT_ROLES.filter((r) => r !== role && state[r] && state[r].alive !== false && r !== 'heir');
  const worst = others.sort((a, b) => state[a].loyalty - state[b].loyalty)[0];
  const w = state[worst];
  const who = `${roleLabel(worst, w.gender, state.scenario, state.flags).toLowerCase()} ${w.name}`;
  let line = w.loyalty < 45
    ? `„Dej si pozor na ${who}. Mluví o tobě ve sklepě, když myslí, že nikdo neposlouchá.“`
    : `„Na dvoře je klid. Nejméně nadšený je ${who}, ale nic víc za tím nehledej.“`;
  const houses = (state.houses || []).slice().sort((a, b) => a.attitude - b.attitude);
  if (houses.length && houses[0].attitude < 40) line += ' A z rodů ti nejvíc nepřeje ten, kdo se ti nejvíc usmívá.';
  return line;
}
