// Ambitions: a goal the ruler sets for a few years (Velký stavitel, Plná
// pokladna, Vojevůdce…). Every so often the event 'ambice' offers three that
// fit the scenario; the chosen one is tracked season by season and pays a
// reward when met, or costs a little prestige when the deadline passes.
// state.ambition = { key, start, deadline, base } · state.ambitionLog = [...]
// No DOM here — engine.js runs it, ui.js and character.js show it.

import { stat } from './data.js';

const heldKeys = (s) => Object.keys(s.realms || {}).filter((k) => s.realms[k].owner === 'player');

const REALM = ['panovnik', 'slechtic'];
const ownProvinces = (s) => s.provinces.filter((p) => !p.lost && (!p.owner || p.owner === 'player'));
const heirSum = (s) => (s.heir && s.heir.alive !== false && s.heir.traits ? Object.values(s.heir.traits).reduce((a, b) => a + b, 0) : 0);

// kind: 'gain' = metric must grow by `goal` since the start · 'reach' = metric must be at least `goal`
//       'below' = metric must be at most `goal`
// unit: how the progress is written; years: time given; reward: an event branch (+ trait: a trait point)
export const AMBITIONS = {
  stavitel: {
    name: 'Velký stavitel', goal: 4, kind: 'gain', years: 4, scenarios: REALM, unit: 'staveb',
    text: 'Dokončit čtyři nové stavby ve svých sídlech.',
    metric: (s) => stat(s, 'built'),
    reward: { effects: { prestige: 5 } }, trait: 'intelligence',
  },
  mesto: {
    name: 'Sídlo pro budoucnost', goal: 1, kind: 'gain', years: 4, scenarios: REALM, unit: 'povýšení',
    text: 'Rozšířit jedno ze svých sídel na vyšší úroveň.',
    metric: (s) => stat(s, 'upgrades'),
    reward: { effects: { prestige: 4, stability: 3 } }, trait: 'patience',
  },
  pokladna: {
    name: 'Plná pokladna', goal: 80, kind: 'reach', years: 4, scenarios: REALM, unit: 'zlata',
    text: 'Naplnit pokladnu na osmdesát zlatých.',
    metric: (s) => s.resources.gold,
    reward: { effects: { prestige: 3, stability: 2 } }, trait: 'intelligence',
  },
  vojevudce: {
    name: 'Vojevůdce', goal: 2, kind: 'gain', years: 5, scenarios: REALM, unit: 'vítězství',
    text: 'Vyhrát dvě bitvy nebo šarvátky.',
    metric: (s) => stat(s, 'battlesWon'),
    reward: { effects: { prestige: 6, army: 4 } }, trait: 'strength',
  },
  tazeni: {
    name: 'Vítězné tažení', goal: 1, kind: 'gain', years: 5, scenarios: REALM, unit: 'vyhraných tažení',
    text: 'Vyhrát válečné tažení (záložka Válka).',
    metric: (s) => stat(s, 'warsWon'),
    reward: { effects: { prestige: 5, legitimacy: 2 } }, trait: 'strength',
  },
  zbozny: {
    name: 'Bohulibá vláda', goal: 80, kind: 'reach', years: 4, scenarios: REALM, unit: 'víry',
    text: 'Pozvednout víru v zemi na osmdesát.',
    metric: (s) => s.resources.faith,
    reward: { effects: { stability: 4, prestige: 2 } }, trait: 'patience',
  },
  slava: {
    name: 'Jméno, které se pamatuje', goal: 75, kind: 'reach', years: 4, scenarios: REALM, unit: 'prestiže',
    text: 'Dosáhnout prestiže sedmdesát pět.',
    metric: (s) => s.resources.prestige,
    reward: { effects: { stability: 4 } }, trait: 'eloquence',
  },
  mir: {
    name: 'Klidná země', goal: 25, kind: 'below', years: 3, scenarios: REALM, unit: 'nepokojů',
    text: 'Utišit všechny své kraje: nikde víc než dvacet pět nepokojů.',
    metric: (s) => Math.max(0, ...ownProvinces(s).map((p) => p.unrest)),
    reward: { effects: { stability: 6 }, provinceEffects: { own: { loyalty: 3 } } }, trait: 'patience',
  },
  obchod: {
    name: 'Obchodní dům', goal: 40, kind: 'gain', years: 4, scenarios: REALM, unit: 'zlata z obchodu',
    text: 'Vydělat obchodem čtyřicet zlatých.',
    metric: (s) => stat(s, 'tradeGold'),
    reward: { effects: { gold: 10, prestige: 2 } }, trait: 'intelligence',
  },
  nastupce: {
    name: 'Dobrý nástupce', goal: 24, kind: 'reach', years: 5, scenarios: ['panovnik', 'slechtic', 'sedlak'], unit: 'bodů vlastností dědice',
    text: 'Vychovat dědice, jehož vlastnosti dají dohromady aspoň dvacet čtyři.',
    available: (s) => s.heir && s.heir.alive !== false && s.heir.age < 16 && heirSum(s) < 22,
    metric: heirSum,
    reward: { effects: { prestige: 3 }, courtEffects: { heir: { loyalty: 10 } } }, trait: 'patience',
  },
  legitimita: {
    name: 'Nezpochybnitelná koruna', goal: 85, kind: 'reach', years: 4, scenarios: ['panovnik'], unit: 'legitimity',
    text: 'Upevnit legitimitu koruny na osmdesát pět.',
    metric: (s) => s.resources.legitimacy,
    reward: { effects: { stability: 4, prestige: 3 } }, trait: 'eloquence',
  },
  prizen: {
    name: 'Královský oblíbenec', goal: 80, kind: 'reach', years: 4, scenarios: ['slechtic'], unit: 'přízně',
    text: 'Získat královu přízeň osmdesát.',
    metric: (s) => s.resources.favor,
    reward: { effects: { prestige: 4, legitimacy: 3 } }, trait: 'eloquence',
  },
  spojenec: {
    name: 'Spojenectví rodů', goal: 1, kind: 'reach', years: 5, scenarios: ['slechtic'], unit: 'spojenců',
    text: 'Uzavřít spojenectví s jedním z velkých rodů.',
    available: (s) => !(s.houses || []).some((h) => h.ally),
    metric: (s) => (s.houses || []).filter((h) => h.ally).length,
    reward: { effects: { prestige: 4, legitimacy: 2 } }, trait: 'eloquence',
  },
  // the farm
  hospodar: {
    name: 'Dobrý hospodář', goal: 2, kind: 'gain', years: 3, scenarios: ['sedlak'], unit: 'staveb',
    text: 'Postavit na gruntu dvě nové stavby.',
    metric: (s) => stat(s, 'built'),
    reward: { effects: { stability: 5, prestige: 2 } }, trait: 'strength',
  },
  grose: {
    name: 'Truhla pod postelí', goal: 30, kind: 'reach', years: 3, scenarios: ['sedlak'], unit: 'grošů',
    text: 'Našetřit třicet grošů.',
    metric: (s) => s.resources.gold,
    reward: { effects: { prestige: 4 } }, trait: 'intelligence',
  },
  povest: {
    name: 'Slovo platí', goal: 45, kind: 'reach', years: 4, scenarios: ['sedlak'], unit: 'pověsti',
    text: 'Získat ve vsi pověst čtyřicet pět.',
    metric: (s) => s.resources.prestige,
    reward: { effects: { favor: 5, stability: 2 } }, trait: 'eloquence',
  },
  svoboda: {
    name: 'Svobodný člověk', goal: 2, kind: 'reach', years: 6, scenarios: ['sedlak'], unit: 'stav',
    text: 'Vykoupit se z poddanství a stát se svobodníkem.',
    available: (s) => s.ruler.statusTier < 2,
    metric: (s) => s.ruler.statusTier,
    reward: { effects: { prestige: 6, stability: 3 } }, trait: 'patience',
  },
  // the way to the empire: both neighbouring crowns on one head (tier 6), however many are already held
  cisarstvi: {
    name: 'Říše', goal: 2, kind: 'reach', years: 14, scenarios: ['panovnik'], unit: 'cizích korun',
    text: 'Nosit korunu Východních marek i Severních pustin a stát se císařem.',
    available: (s) => heldKeys(s).length < 2,
    metric: (s) => heldKeys(s).length,
    reward: { effects: { prestige: 8, legitimacy: 5 } }, trait: 'strength',
  },
  // the late game: an empire is held, not won
  risa_pevna: {
    name: 'Pevná říše', goal: 60, kind: 'reach', years: 6, scenarios: ['panovnik'], unit: 'věrnosti nejméně věrné země',
    text: 'Dovést všechny dobyté země k věrnosti aspoň šedesát.',
    available: (s) => heldKeys(s).length >= 1 && Math.min(...heldKeys(s).map((k) => s.realms[k].attitude)) < 60,
    metric: (s) => (heldKeys(s).length ? Math.min(...heldKeys(s).map((k) => s.realms[k].attitude)) : 0),
    reward: { effects: { prestige: 6, stability: 4, legitimacy: 3 } }, trait: 'patience',
  },
  risa_dedic: {
    name: 'Místokrál z rodu', goal: 1, kind: 'gain', years: 6, scenarios: ['panovnik'], unit: 'místokrálů',
    text: 'Poslat dědice vládnout jedné z dobytých zemí jako místokrále.',
    available: (s) => heldKeys(s).length >= 1 && !!s.heir && s.heir.alive !== false && !s.heir.none && s.heir.age >= 13 && !heldKeys(s).some((k) => s.empire && s.empire.r && s.empire.r[k] && s.empire.r[k].viceroy),
    metric: (s) => stat(s, 'viceroys'),
    reward: { effects: { prestige: 5, legitimacy: 4 }, courtEffects: { heir: { loyalty: 10 } } }, trait: 'eloquence',
  },
  sypka: {
    name: 'Plná sýpka', goal: 60, kind: 'reach', years: 3, scenarios: ['sedlak'], unit: 'zásob',
    text: 'Mít v komoře a na půdě zásoby šedesát.',
    metric: (s) => s.resources.food,
    reward: { effects: { stability: 4, prestige: 2 } }, trait: 'patience',
  },
  celed: {
    name: 'Ruce k práci', goal: 8, kind: 'gain', years: 4, scenarios: ['sedlak'], unit: 'čeledi navíc',
    text: 'Rozšířit čeleď na gruntu o osm lidí.',
    metric: (s) => s.resources.army,
    reward: { effects: { stability: 3, food: 4 } }, trait: 'strength',
  },
  pan: {
    name: 'V pánově přízni', goal: 75, kind: 'reach', years: 3, scenarios: ['sedlak'], unit: 'přízně pána',
    text: 'Získat přízeň vrchnosti sedmdesát pět.',
    metric: (s) => s.resources.favor,
    reward: { effects: { gold: 4, prestige: 2 } }, trait: 'eloquence',
  },
};

// failure costs a little face
export const FAILURE = { panovnik: { prestige: -2 }, slechtic: { prestige: -2 }, sedlak: { prestige: -1 } };

const OFFER_GAP = 6; // seasons between the end of one ambition and the next offer

/** Ambitions this ruler could take up now. */
export function availableAmbitions(state) {
  return Object.entries(AMBITIONS).filter(([, a]) => a.scenarios.includes(state.scenario)
    && (!a.available || a.available(state)) && !isMet(a, state, a.metric(state)));
}

function isMet(a, state, value, base = 0) {
  if (a.kind === 'gain') return value - base >= a.goal;
  if (a.kind === 'below') return value <= a.goal;
  return value >= a.goal;
}

/** Should the 'ambice' event come now? Sets state.ambitionOffer to three keys when it should. */
export function readyToOffer(state) {
  if (state.ambition || state.gameOver || state.turn < 2) return false;
  if (state.turn < (state.ambitionNext || 0)) return false;
  const pool = availableAmbitions(state).map(([k]) => k);
  if (pool.length < 2) return false;
  const last = state.ambitionLog && state.ambitionLog.length ? state.ambitionLog[state.ambitionLog.length - 1].key : null;
  const fresh = pool.filter((k) => k !== last);
  const picks = [];
  const source = fresh.length >= 3 ? fresh : pool;
  while (picks.length < 3 && picks.length < source.length) {
    const k = source[Math.floor(Math.random() * source.length)];
    if (!picks.includes(k)) picks.push(k);
  }
  state.ambitionOffer = picks;
  return true;
}

export function startAmbition(state, key) {
  const a = AMBITIONS[key];
  if (!a) return null;
  state.ambition = { key, start: state.turn, deadline: state.turn + a.years * 4, base: a.kind === 'gain' ? a.metric(state) : 0 };
  state.ambitionOffer = null;
  return a;
}

/** No ambition for now: the next offer waits a while. */
export function skipAmbition(state) {
  state.ambitionOffer = null;
  state.ambitionNext = state.turn + OFFER_GAP + 2;
}

/** Progress of the current ambition: { def, value, goal, pct, label, met } or null. */
export function ambitionProgress(state) {
  const amb = state.ambition;
  if (!amb) return null;
  const a = AMBITIONS[amb.key];
  const raw = a.metric(state);
  const value = a.kind === 'gain' ? raw - amb.base : raw;
  const met = isMet(a, state, raw, amb.base);
  let pct;
  if (a.kind === 'below') pct = met ? 1 : Math.max(0, Math.min(0.95, 1 - (value - a.goal) / 60));
  else pct = Math.max(0, Math.min(1, value / a.goal));
  const label = amb.key === 'svoboda'
    ? (met ? 'svobodník' : 'poddaný')
    : a.kind === 'below' ? `nejvíc ${value} ${a.unit} (cíl nejvýš ${a.goal})` : `${Math.max(0, value)} / ${a.goal} ${a.unit}`;
  return { def: a, key: amb.key, value, goal: a.goal, pct, label, met, deadline: amb.deadline };
}

/** Closes a met or expired ambition. Returns { result: 'met' | 'failed', def } or null. */
export function settleAmbition(state) {
  const p = ambitionProgress(state);
  if (!p) return null;
  let result = null;
  if (p.met) result = 'met';
  else if (state.turn >= p.deadline) result = 'failed';
  if (!result) return null;
  state.ambitionLog = state.ambitionLog || [];
  state.ambitionLog.push({ key: p.key, name: p.def.name, year: state.year, ruler: state.ruler.name, result });
  state.ambition = null;
  state.ambitionNext = state.turn + (result === 'met' ? OFFER_GAP - 2 : OFFER_GAP);
  return { result, def: p.def };
}

/** A new ruler does not inherit the old one's ambition. */
export function dropAmbition(state) {
  state.ambition = null;
  state.ambitionOffer = null;
  state.ambitionNext = state.turn + 2;
}
