// Conversations with the household (rozhovory): once a season the ruler can
// sit down with each member of the court and pick a topic. Some topics are a
// sure thing, others are a roll of k% like any risky choice (engine.js
// rollParts); a cold relationship makes them harder. Talks change loyalty,
// sometimes a trait, a resource or bring news. No DOM here — talk_ui.js draws it.

import { clamp, bumpStat, TRAIT_DEFS } from './data.js';
import { roleLabel, COURT_ROLES } from './court.js';

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
    text: [(c) => `${c.name} se rozhovořil${g(c, '', 'a')} o věcech, o kterých na dvoře nikdo nemluví. Odcházíte jako lidé, ne jako pán a služebník.`,
      (c) => `${c.name} odpovídal${g(c, '', 'a')} zdvořile a krátce. Snad jindy.`],
  },
  rada: {
    label: 'Požádat o radu', roles: ['spouse', ...ADVISERS], yearly: true,
    roll: { trait: 'intelligence', base: 0.5, scale: 0.04 },
    win: { loyalty: 3, advice: true }, lose: { loyalty: 1 },
    text: [(c, s, role) => `${(s.scenario === 'sedlak' ? ADVICE_PEASANT : ADVICE)[role].line} ${c.name} je rád${g(c, '', 'a')}, že se ${g(c, 'ho', 'jí')} ptáš.`,
      (c) => `Rada byla dlouhá a spletitá. ${c.name} odešel${g(c, '', 'a')} s pocitem, že tě odpověď nezajímala.`],
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
    text: [(c) => `${c.name} vytáhl${g(c, '', 'a')} seznam všeho, co se může pokazit. Byl dlouhý, ale po rozhovoru spíš klidněji.`],
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
  drby: {
    label: 'Vyptat se na drby', roles: ['spymaster'],
    roll: { trait: 'eloquence', base: 0.5, scale: 0.04 },
    win: { loyalty: 1, gossip: true }, lose: { loyalty: 0 },
    text: [(c) => `${c.name} se naklonil${g(c, '', 'a')} blíž a ztišil${g(c, '', 'a')} hlas.`,
      (c) => `${c.name} se tvářil${g(c, '', 'a')}, že nic neví. Možná opravdu neví — nebo neřekne.`],
  },
};

/** Why the ruler cannot talk to this person now (null = can). */
export function talkBlock(state, role) {
  const c = state[role];
  if (!c || c.alive === false) return 'Mrtví už nemluví.';
  if (role === 'heir' && c.age < 4) return 'Dědic je ještě malé dítě.';
  if (c.talkTurn === state.turn) return `Tohle období jste spolu už mluvili. Příště v dalším období.`;
  if (state.gameOver) return 'Kronika skončila.';
  return null;
}

/** Topics open with this person now: [{ key, def, block }] (block = why not, if any). */
export function topicsFor(state, role) {
  const c = state[role];
  return Object.entries(TOPICS)
    .filter(([, t]) => t.roles.includes(role) && (!t.quirk || t.quirk === c.quirk) && (!t.available || t.available(c)))
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
  const c = state[role];
  const cold = c.loyalty < 40 ? -0.1 : c.loyalty >= 70 ? 0.05 : 0;
  return {
    label: t.label, isRoll: true, baseChance: t.roll.base, traitKey: t.roll.trait, traitScale: t.roll.scale,
    chanceBonus: cold ? () => cold : null, bonusLabel: cold < 0 ? 'Chladný vztah' : 'Důvěra',
  };
}

/** How the person greets the ruler, by loyalty. */
export function greeting(state, role) {
  const c = state[role];
  const title = roleLabel(role, c.gender, state.scenario, state.flags);
  if (c.loyalty >= 70) return `${title} ${c.name} se usměje a odloží práci. „Pro tebe mám vždycky čas.“`;
  if (c.loyalty >= 40) return `${title} ${c.name} se ukloní. „Čím mohu posloužit?“`;
  return `${title} ${c.name} se zvedne jen napůl a dívá se kamsi za tebe. „Ano?“`;
}

/**
 * Holds the conversation: pays the cost, applies the result. success = the roll
 * (true for topics without one). Returns { text, notes, delta }.
 */
export function holdTalk(state, role, key, success) {
  const c = state[role];
  const t = TOPICS[key];
  const res = success ? t.win : t.lose || t.win;
  const notes = [];
  const cost = t.cost ? t.cost(state) : null;
  for (const [k, v] of Object.entries(cost || {})) state.resources[k] = clamp(state.resources[k] - v);
  let delta = res.loyalty || 0;
  if (key === 'dar' && c.quirk === 'chamtivy') delta += 4;
  // a promise to the ambitious is paid in loyalty now and remembered
  if (res.promise) { c.promised = state.turn; }
  c.loyalty = clamp(c.loyalty + delta);
  for (const [k, v] of Object.entries(res.effects || {})) if (state.resources[k] !== undefined) state.resources[k] = clamp(state.resources[k] + v);
  if (res.advice) {
    const a = (state.scenario === 'sedlak' ? ADVICE_PEASANT : ADVICE)[role];
    for (const [k, v] of Object.entries(a.effects)) if (state.resources[k] !== undefined) state.resources[k] = clamp(state.resources[k] + v);
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
  c.history.push({ year: state.year, season: state.seasonIndex, title: `Rozhovor: ${t.label.toLowerCase()}`, choice: null, outcome: t.roll ? (success ? 'success' : 'failure') : null, delta: delta || null });
  if (c.history.length > 40) c.history.shift();
  bumpStat(state, 'talks');
  return { text, delta, notes };
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
