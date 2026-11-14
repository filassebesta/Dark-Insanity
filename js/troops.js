// Troops (vojsko podle typů): spearmen, archers, cavalry, siege engines and mercenaries.
//
// state.resources.army stays the one number every event and the economy know; state.troops
// splits that number by type and syncTroops() keeps the two equal (army == sum of troops) after
// anything changed the army. Men in the field (state.war.troops) and in training
// (state.recruitQueue) are not part of it; men posted to a province (province.troops) are:
// they are home troops that are not free to march.
//
// state.troops       = { spear, archer, horse, siege, merc }
// state.recruitQueue = [{ type, n, ready }]
// province.troops    = { spear, archer, horse, merc }  (the garrison the player posted there)
//
// Only the noble and the king keep troops; a peasant's "army" is his farmhands. No DOM here.

import { clampRes, RESOURCE_CAP } from './data.js';
import { ownTowns } from './build.js';

export const TROOP_KEYS = ['spear', 'archer', 'horse', 'siege', 'merc'];
export const GARRISON_KEYS = ['spear', 'archer', 'horse', 'merc'];

// batch: how many men one step buys · cost: per batch · train: seasons in training
// goldW / foodW: upkeep weight against the old flat "army / 14" (the default 60/25/15 mix weighs 1.0)
// pow: strength of one man in the field (battle.js) · gar: weight of one man in a garrison
export const TROOPS = {
  spear: {
    key: 'spear', short: 'kopí', name: 'Kopiníci', batch: 5, cost: { gold: 6 }, train: 1, goldW: 0.8, foodW: 0.92, pow: 1.0, gar: 1.0,
    forms: ['kopiník', 'kopiníci', 'kopiníků'],
    text: 'Levná a rychlá pěchota. Kopí zastaví jízdu, ale na volném poli je střílí lučištníci.',
  },
  archer: {
    key: 'archer', short: 'luky', name: 'Lučištníci', batch: 5, cost: { gold: 9 }, train: 1, goldW: 0.95, foodW: 0.92, pow: 0.9, gar: 0.8,
    forms: ['lučištník', 'lučištníci', 'lučištníků'],
    text: 'Palba z dálky. Slabí zblízka a proti jízdě, ale za kopiníky jsou strašliví.',
  },
  horse: {
    key: 'horse', short: 'jízda', name: 'Jízda a rytíři', batch: 2, cost: { gold: 10, iron: 1 }, train: 2, goldW: 1.9, foodW: 1.45, pow: 2.0, gar: 0.6,
    forms: ['jezdec', 'jezdci', 'jezdců'],
    text: 'Drahý a pomalu cvičený úder. Na křídle smete lučištníky, do ježka kopí nechoďte.',
  },
  siege: {
    key: 'siege', short: 'stroje', name: 'Obléhací stroje', batch: 1, cost: { gold: 18, iron: 2 }, train: 2, goldW: 1.5, foodW: 0.5, pow: 0.4, gar: 0,
    forms: ['stroj', 'stroje', 'strojů'],
    text: 'Vrhače a beranidla s obsluhou. K ničemu v poli, ale hradby a brány před nimi padají.',
  },
  merc: {
    key: 'merc', short: 'žold', name: 'Žoldnéři', batch: 5, cost: { gold: 12 }, train: 0, goldW: 4.5, foodW: 0, pow: 1.45, gar: 1.2,
    forms: ['žoldnéř', 'žoldnéři', 'žoldnéřů'],
    text: 'Zkušení a hned k dispozici, bez jídla z domova. Žold se platí zlatem každé období, jinak odejdou.',
  },
};

/** "1 kopiník", "3 kopiníci", "7 kopiníků". */
export function countLabel(type, n) {
  const f = TROOPS[type].forms;
  return `${n} ${n === 1 ? f[0] : n >= 2 && n <= 4 ? f[1] : f[2]}`;
}

export const emptyTroops = () => ({ spear: 0, archer: 0, horse: 0, siege: 0, merc: 0 });
export const troopsTotal = (t) => TROOP_KEYS.reduce((s, k) => s + ((t && t[k]) || 0), 0);

/** Splits `total` by the weights of `w` (object) into whole numbers that sum to `total`. */
export function apportion(w, total) {
  const keys = Object.keys(w);
  const sum = keys.reduce((s, k) => s + Math.max(0, w[k]), 0);
  const out = {};
  if (total <= 0 || sum <= 0) { for (const k of keys) out[k] = 0; return out; }
  let given = 0;
  const rest = [];
  for (const k of keys) {
    const exact = (Math.max(0, w[k]) / sum) * total;
    out[k] = Math.floor(exact);
    given += out[k];
    rest.push([k, exact - out[k]]);
  }
  rest.sort((a, b) => b[1] - a[1]);
  for (let i = 0; given < total && i < rest.length; i++, given++) out[rest[i][0]] += 1;
  return out;
}

const isPlayersLand = (p) => !p.lost && (!p.owner || p.owner === 'player');

// ---------- the book of troops ----------

/** state.troops, made from the army number the first time it is needed (old saves). Null for a peasant. */
export function ensureTroops(state) {
  if (state.scenario === 'sedlak') return null;
  if (!state.recruitQueue) state.recruitQueue = [];
  if (!state.troops) {
    // old saves know only the number: levy first, then bows, a few riders
    const a = apportion({ spear: 60, archer: 25, horse: 15 }, state.resources.army);
    state.troops = { ...emptyTroops(), ...a };
  }
  return state.troops;
}

/** Men of each type posted to provinces. */
export function stationed(state) {
  const out = emptyTroops();
  for (const p of state.provinces || []) if (p.troops) for (const k of GARRISON_KEYS) out[k] += p.troops[k] || 0;
  return out;
}

/** Home troops that are not tied down in a garrison: the ones that can march. */
export function freeTroops(state) {
  const t = ensureTroops(state);
  const s = stationed(state);
  const out = emptyTroops();
  if (!t) return out;
  for (const k of TROOP_KEYS) out[k] = Math.max(0, (t[k] || 0) - (s[k] || 0));
  return out;
}

/**
 * Keeps state.troops equal to state.resources.army. Call after anything that changed the army number.
 * More men arrive as levy (spearmen and a few archers); fewer leave proportionally, men in garrisons last.
 */
export function syncTroops(state) {
  const t = ensureTroops(state);
  if (!t) return null;
  const army = Math.max(0, Math.round(state.resources.army));
  let total = troopsTotal(t);
  if (army > total) {
    const add = apportion({ spear: 4, archer: 1 }, army - total);
    t.spear += add.spear;
    t.archer += add.archer;
  } else if (army < total) {
    let cut = total - army;
    // the free men go first, the garrisons only when there is no one else
    const free = freeTroops(state);
    const w = {};
    for (const k of TROOP_KEYS) w[k] = free[k] * (k === 'siege' ? 0.5 : 1);
    const freeSum = Object.values(w).reduce((a, b) => a + b, 0);
    if (freeSum > 0) {
      const take = apportion(w, Math.min(cut, TROOP_KEYS.reduce((s, k) => s + free[k], 0)));
      for (const k of TROOP_KEYS) {
        const n = Math.min(take[k], free[k]);
        t[k] -= n;
        cut -= n;
      }
    }
    for (let guard = 0; cut > 0 && guard < 400; guard++) {
      // still short: take from the biggest remaining stock, garrisons included
      const k = TROOP_KEYS.slice().sort((a, b) => t[b] - t[a])[0];
      if (!t[k]) break;
      t[k] -= 1;
      cut -= 1;
    }
    clampGarrisons(state);
  }
  return t;
}

/** A garrison cannot hold more men of a type than the realm has. */
function clampGarrisons(state) {
  const t = state.troops;
  const s = stationed(state);
  for (const k of GARRISON_KEYS) {
    let over = s[k] - (t[k] || 0);
    if (over <= 0) continue;
    const provs = (state.provinces || []).filter((p) => p.troops && p.troops[k]).sort((a, b) => b.troops[k] - a.troops[k]);
    for (const p of provs) {
      const n = Math.min(over, p.troops[k]);
      p.troops[k] -= n;
      over -= n;
      if (over <= 0) break;
    }
  }
}

/** Removes `n` men (proportionally) from the home troops and the army number alike. */
export function loseHome(state, n) {
  state.resources.army = clampRes('army', state.resources.army - n);
  syncTroops(state);
}

// ---------- upkeep ----------

/** [goldDiv, foodDiv]: how many men one gold and one food feed in a season (as the economy always had it). */
export function upkeepDivs(state) {
  return state.scenario === 'slechtic' ? [14, 20] : [15, 25];
}

/** What the home troops cost a season, in gold and food (fractions; the economy rounds). */
export function armyUpkeep(state) {
  const [gd, fd] = upkeepDivs(state);
  const t = ensureTroops(state);
  if (!t) return { gold: state.resources.army / gd, food: state.resources.army / fd };
  let gold = 0;
  let food = 0;
  for (const k of TROOP_KEYS) {
    gold += (t[k] || 0) * TROOPS[k].goldW;
    food += (t[k] || 0) * TROOPS[k].foodW;
  }
  return { gold: gold / gd, food: food / fd };
}

/** Upkeep of one man of a type, for display: { gold, food } per season. */
export function upkeepOf(state, type) {
  const [gd, fd] = upkeepDivs(state);
  return { gold: TROOPS[type].goldW / gd, food: TROOPS[type].foodW / fd };
}

// ---------- recruiting ----------

export const ironStock = (state) => (state.trade && state.trade.stock && state.trade.stock.iron) || 0;

const builtCount = (state, key) => ownTowns(state).reduce((s, id) => s + state.towns[id].buildings.filter((b) => b.ready && b.key === key).length, 0);

/** The most men the land can keep under arms: its provinces, the barracks and the forges. */
export function recruitCap(state) {
  const lands = (state.provinces || []).filter(isPlayersLand).length;
  const cap = 30 + 20 * lands + 10 * builtCount(state, 'kasarna') + 4 * builtCount(state, 'kovarna');
  return Math.min(RESOURCE_CAP.army, cap);
}

export const queuedMen = (state) => (state.recruitQueue || []).reduce((s, x) => s + x.n, 0);

/** Men the realm has altogether: at home, in the field, in training. */
export function committedMen(state) {
  return state.resources.army + (state.war ? state.war.power : 0) + queuedMen(state);
}

/** Why `n` men of a type cannot be raised now (null = they can). */
export function recruitBlock(state, type, n) {
  const def = TROOPS[type];
  if (state.gameOver) return 'Kronika skončila.';
  if (state.scenario === 'sedlak') return 'Sedlák vojsko nevěnuje.';
  if (!def || !(n > 0)) return 'Vyber, koho chceš verbovat.';
  const k = n / def.batch;
  const gold = Math.ceil(def.cost.gold * k);
  const iron = Math.ceil((def.cost.iron || 0) * k);
  if (state.resources.gold < gold) return `Chybí zlato (${gold}).`;
  if (iron && ironStock(state) < iron) return `Chybí železo (${iron}) — kovárna ho dodává, nebo ho kup v obchodě.`;
  const room = recruitCap(state) - committedMen(state);
  if (room < n) return room > 0 ? `Země uživí jen dalších ${room} mužů. Kasárna a kovárna limit zvedají.` : 'Země už víc mužů neuživí. Kasárna a kovárna limit zvedají.';
  if (state.resources.army + n > RESOURCE_CAP.army) return 'Víc vojska se už nevejde.';
  return null;
}

/** Raises `n` men of a type (a whole number of batches): paid now, ready after the training. */
export function recruit(state, type, n) {
  const why = recruitBlock(state, type, n);
  if (why) return { error: why };
  const def = TROOPS[type];
  const k = n / def.batch;
  state.resources.gold = clampRes('gold', state.resources.gold - Math.ceil(def.cost.gold * k));
  const iron = Math.ceil((def.cost.iron || 0) * k);
  if (iron) state.trade.stock.iron -= iron;
  ensureTroops(state);
  if (def.train === 0) {
    state.troops[type] += n;
    state.resources.army = clampRes('army', state.resources.army + n);
    return { message: `${countLabel(type, n)} jsou najati a stojí v táboře.` };
  }
  state.recruitQueue.push({ type, n, ready: state.turn + def.train });
  return { message: `${countLabel(type, n)} se cvičí. Budou hotovi za ${def.train === 1 ? 'jedno období' : 'dvě období'}.` };
}

/** Cancels a unit in training: half of the gold comes back, the iron does not. */
export function cancelRecruit(state, index) {
  const x = (state.recruitQueue || [])[index];
  if (!x) return { error: 'Nic takového se necvičí.' };
  const def = TROOPS[x.type];
  state.recruitQueue.splice(index, 1);
  const back = Math.floor((def.cost.gold * x.n / def.batch) / 2);
  state.resources.gold = clampRes('gold', state.resources.gold + back);
  return { message: `Výcvik zrušen (${countLabel(x.type, x.n)}), vráceno ${back} zlata.` };
}

/** Sends `n` free men of a type home to their farms. */
export function disband(state, type, n) {
  ensureTroops(state);
  const free = freeTroops(state)[type] || 0;
  if (!(n > 0) || free < 1) return { error: 'Nikdo takový není k propuštění.' };
  n = Math.min(n, free);
  state.troops[type] -= n;
  state.resources.army = clampRes('army', state.resources.army - n);
  return { message: `Propuštěno: ${countLabel(type, n)}.` };
}

/**
 * Every season: units finish their training, unpaid mercenaries walk away.
 * `unpaid` = the season's gold did not cover the upkeep. Returns news lines.
 */
export function processTroops(state, { unpaid = false } = {}) {
  const news = [];
  const t = ensureTroops(state);
  if (!t) return news;
  const queue = state.recruitQueue || [];
  state.recruitQueue = queue.filter((x) => x.ready > state.turn);
  for (const x of queue.filter((q) => q.ready <= state.turn)) {
    const n = Math.min(x.n, RESOURCE_CAP.army - state.resources.army);
    if (n <= 0) continue;
    t[x.type] += n;
    state.resources.army = clampRes('army', state.resources.army + n);
    news.push(`Výcvik skončil: ${countLabel(x.type, n)} se hlásí do služby.`);
  }
  if (unpaid && t.merc > 0) {
    const gone = Math.max(1, Math.ceil(t.merc * 0.35));
    t.merc -= gone;
    state.resources.army = clampRes('army', state.resources.army - gone);
    clampGarrisons(state);
    news.push(`Žoldnéři nedostali žold: ${countLabel('merc', gone)} v noci ${gone === 1 ? 'odešel' : 'odešli'} i se zbraněmi.`);
  }
  return news;
}

// ---------- garrisons ----------

export const garrisonOf = (p) => p.troops || {};
export const garrisonMen = (p) => GARRISON_KEYS.reduce((s, k) => s + ((p.troops && p.troops[k]) || 0), 0);
/** How much the posted men weigh in the province's order (a rider is worth less behind a wall than a spearman). */
export const garrisonPower = (p) => GARRISON_KEYS.reduce((s, k) => s + ((p.troops && p.troops[k]) || 0) * TROOPS[k].gar, 0);

/** What a garrison does to the province every season: lower unrest target, higher loyalty target. */
export function garrisonDrift(p) {
  const gp = garrisonPower(p);
  return { order: Math.min(12, gp * 0.45), loyalty: Math.min(5, gp * 0.2) };
}

/** Why men cannot be posted to / taken from a province (null = they can). */
export function garrisonBlock(state, provId, type, delta) {
  const p = (state.provinces || []).find((x) => x.id === provId);
  if (state.scenario === 'sedlak') return 'Sedlák posádky nemá.';
  if (!p || !isPlayersLand(p)) return 'Tenhle kraj není tvůj.';
  if (!GARRISON_KEYS.includes(type)) return 'Tihle muži do posádky nepatří.';
  if (delta > 0 && (freeTroops(state)[type] || 0) < delta) return 'Takových volných mužů nemáš.';
  if (delta < 0 && ((p.troops && p.troops[type]) || 0) < -delta) return 'Tolik jich tam není.';
  return null;
}

/** Posts (delta > 0) or recalls (delta < 0) men of a type to a province. */
export function assignGarrison(state, provId, type, delta) {
  const why = garrisonBlock(state, provId, type, delta);
  if (why) return { error: why };
  const p = state.provinces.find((x) => x.id === provId);
  ensureTroops(state);
  p.troops = p.troops || {};
  p.troops[type] = (p.troops[type] || 0) + delta;
  return { message: delta > 0 ? `${countLabel(type, delta)} nastoupili do posádky.` : `${countLabel(type, -delta)} se vrací z posádky.` };
}

/** A short word for the strength of a garrison. */
export function garrisonLabel(p) {
  const gp = garrisonPower(p);
  if (gp >= 24) return ['silná posádka', 'good'];
  if (gp >= 10) return ['pevná posádka', 'good'];
  if (gp >= 1) return ['hlídky', 'warn'];
  return ['bez posádky', ''];
}
