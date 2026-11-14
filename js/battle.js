// Battle: how a clash of two armies is decided once the player has placed the men.
//
// A battle has slots: on the field the left wing, the centre and the right wing (plus the
// reserve), at a siege the walls, the gate and the rear. Each slot is a small fight of its own:
// the strength of the men placed there (type, numbers, who stands next to whom, terrain), and
// the types set against each other: spears beat horse, horse beats archers, archers beat spears
// in the open (and win everything behind a screen of spears). The reserve rides to the front
// that is losing. The slots add up to one score, and a little chance is thrown in.
//
// state.war.battle = { kind, stance, turn, seed, enemy: { <slot>: { spear, archer, horse, merc } },
//                      terrain, def, men }   — the enemy's line, made once when the battle is raised.
// deployment       = { <slot>: { spear, archer, horse, siege, merc } }
//
// autoDeploy(state, enemy) places the men sensibly; the simulations and the "Automaticky" button use it.
// No DOM here.

import { TROOPS, TROOP_KEYS, apportion, emptyTroops, troopsTotal, countLabel } from './troops.js';
import { warTarget } from './war.js';

const ENEMY_KEYS = ['spear', 'archer', 'horse', 'merc'];
export const AVG_POW = 1.125; // strength of one man in the default 60/25/15 mix: 25 men are an even match for strength 1.0

export const KINDS = {
  field: {
    title: 'Bitva v poli',
    slots: [
      { key: 'L', name: 'Levé křídlo', loc: 'na levém křídle', to: 'na levé křídlo', wing: true },
      { key: 'C', name: 'Střed', loc: 've středu', to: 'do středu' },
      { key: 'R', name: 'Pravé křídlo', loc: 'na pravém křídle', to: 'na pravé křídlo', wing: true },
      { key: 'Z', name: 'Záloha', loc: 'v záloze', reserve: true },
    ],
  },
  ambush: {
    title: 'Přepadení',
    slots: [
      { key: 'L', name: 'Levé křídlo', loc: 'na levém křídle', to: 'na levé křídlo', wing: true },
      { key: 'C', name: 'Střed', loc: 've středu', to: 'do středu' },
      { key: 'R', name: 'Pravé křídlo', loc: 'na pravém křídle', to: 'na pravé křídlo', wing: true },
      { key: 'Z', name: 'Zadní voj', loc: 'u vozů', reserve: true },
    ],
  },
  siege: {
    title: 'Útok na pevnost',
    slots: [
      { key: 'W', name: 'Hradby', loc: 'u hradeb', to: 'k hradbám' },
      { key: 'G', name: 'Brána', loc: 'u brány', to: 'k bráně' },
      { key: 'B', name: 'Týl', loc: 've vojenském týlu', to: 'do týlu' },
      { key: 'Z', name: 'Záloha', loc: 'v záloze', reserve: true },
    ],
  },
};

export const slotsOf = (kind) => KINDS[kind].slots;
export const frontsOf = (kind) => KINDS[kind].slots.filter((s) => !s.reserve);
export const slotDef = (kind, key) => KINDS[kind].slots.find((s) => s.key === key);

// ---------- the rules of the clash ----------

// how a man of the row's type fares against the column's (open field): spears > horse > archers > spears
const MATCH = {
  spear: { spear: 1, archer: 0.85, horse: 1.55, merc: 0.9, siege: 1 },
  archer: { spear: 1.3, archer: 1, horse: 0.75, merc: 1.1, siege: 1.2 },
  horse: { spear: 0.65, archer: 1.55, horse: 1, merc: 0.85, siege: 1.3 },
  merc: { spear: 1.1, archer: 1.15, horse: 1, merc: 1, siege: 1.2 },
  siege: { spear: 1, archer: 1, horse: 1, merc: 1, siege: 1 },
};

const TERRAIN = {
  plain: { label: 'rovina', horse: 1.1 },
  forest: { label: 'les', horse: 0.75, archer: 0.9, spear: 1.05 },
  hills: { label: 'kopce', horse: 0.85, archer: 1.1 },
  coast: { label: 'pobřeží', horse: 0.7, archer: 1.1 },
  castle: { label: 'pod hradbami', horse: 0.8 },
};
export const terrainLabel = (t) => (TERRAIN[t] || TERRAIN.plain).label;

function placeMult(kind, slot, type) {
  if (kind === 'siege') {
    const t = {
      W: { spear: 1.0, archer: 1.15, horse: 0.4, merc: 1.1, siege: 1.4 },
      G: { spear: 1.0, archer: 0.85, horse: 0.5, merc: 1.1, siege: 1.6 },
      B: { spear: 0.9, archer: 0.9, horse: 1.3, merc: 1.0, siege: 0 },
    }[slot];
    return t ? t[type] ?? 1 : 1;
  }
  const wing = slot === 'L' || slot === 'R';
  if (type === 'horse') return wing ? 1.2 : 0.85;
  if (type === 'spear') return wing ? 1.0 : 1.1;
  if (type === 'archer') return wing ? 0.95 : 1.0;
  return 1;
}

function powOf(kind, type) {
  return kind === 'siege' && type === 'siege' ? 2.2 : TROOPS[type].pow;
}

const num = (g, k) => (g && g[k]) || 0;
const sizeOf = (g) => TROOP_KEYS.reduce((s, k) => s + num(g, k), 0);

/** Archers behind a screen of spears (0 = none, 1 = fully covered). */
function coverOf(g) {
  const a = num(g, 'archer');
  if (!a) return 1;
  return Math.max(0, Math.min(1, (num(g, 'spear') + num(g, 'merc')) / (a * 0.6)));
}

/** What an attacker faces in a group: each type weighs by its strength; covered archers weigh less. */
function exposure(kind, g) {
  const cover = coverOf(g);
  const w = {};
  for (const k of TROOP_KEYS) w[k] = num(g, k) * powOf(kind, k) * (k === 'archer' ? 1 - 0.6 * cover : 1);
  return w;
}

function multAgainst(type, enemyW) {
  const sum = TROOP_KEYS.reduce((s, k) => s + enemyW[k], 0);
  if (sum <= 0) return 1;
  return TROOP_KEYS.reduce((s, k) => s + enemyW[k] * MATCH[type][k], 0) / sum;
}

/** { pow, mult } of a group of one side in a slot against the enemy group there. */
function groupPower(kind, ctx, slot, g, enemy, enemySide, eff = 1) {
  const t = TERRAIN[kind === 'siege' ? 'castle' : ctx.terrain] || TERRAIN.plain;
  const ew = exposure(kind, enemy);
  const cover = coverOf(g);
  let pow = 0;
  const mult = {};
  for (const k of TROOP_KEYS) {
    const n = num(g, k);
    if (!n) continue;
    let m = multAgainst(k, ew) * placeMult(kind, slot, k) * (t[k] ?? 1);
    if (k === 'archer') m *= 1 + 0.3 * cover;
    mult[k] = m;
    pow += n * powOf(kind, k) * m;
  }
  pow *= eff;
  // the defenders: home ground, and walls
  if (enemySide) {
    pow *= ctx.def || 1;
    if (kind === 'siege') pow *= { W: 1.3, G: 1.2, B: 1 }[slot] || 1;
  }
  return { pow, mult };
}

const addTo = (a, b, eff = 1) => {
  const out = { ...a };
  for (const k of TROOP_KEYS) if (num(b, k)) out[k] = num(out, k) + num(b, k) * eff;
  return out;
};

/**
 * The slots against each other, without chance: { fronts: [...], S }.
 * mods: { reserveEff (0–1: how well the reserve arrives), mineEff, theirEff }
 */
export function evaluate(kind, ctx, mine, theirs, mods = {}) {
  const fronts = frontsOf(kind).map((f) => f.key);
  const reserveEff = mods.reserveEff ?? 1;
  const base = fronts.map((k) => {
    const a = groupPower(kind, ctx, k, mine[k] || {}, theirs[k] || {}, false, mods.mineEff ?? 1);
    const b = groupPower(kind, ctx, k, theirs[k] || {}, mine[k] || {}, true, mods.theirEff ?? 1);
    return { key: k, A: a.pow, B: b.pow };
  });
  const margin = (f) => (f.A + f.B > 0 ? (f.A - f.B) / (f.A + f.B) : 0);
  // the reserves ride where it is worst
  let myAt = null;
  let theirAt = null;
  if (sizeOf(mine.Z) > 0) myAt = base.slice().sort((x, y) => margin(x) - margin(y))[0].key;
  if (sizeOf(theirs.Z) > 0) theirAt = base.slice().sort((x, y) => margin(y) - margin(x))[0].key;
  const share = (g, z, eff) => {
    const a = sizeOf(g);
    const b = sizeOf(z);
    return a + b > 0 ? (a + eff * b) / (a + b) : 1;
  };
  const out = fronts.map((k) => {
    const gm = k === myAt ? addTo(mine[k] || {}, mine.Z) : mine[k] || {};
    const gt = k === theirAt ? addTo(theirs[k] || {}, theirs.Z) : theirs[k] || {};
    const effA = (mods.mineEff ?? 1) * (k === myAt ? share(mine[k], mine.Z, reserveEff) : 1);
    const effB = (mods.theirEff ?? 1) * (k === theirAt ? share(theirs[k], theirs.Z, 1) : 1);
    const a = groupPower(kind, ctx, k, gm, gt, false, effA);
    const b = groupPower(kind, ctx, k, gt, gm, true, effB);
    const f = { key: k, A: a.pow, B: b.pow, mine: gm, theirs: gt, multA: a.mult, multB: b.mult, reserve: k === myAt, theirReserve: k === theirAt, coverA: coverOf(gm) };
    f.m = f.A + f.B > 0 ? (f.A - f.B) / (f.A + f.B) : 0;
    f.wasM = margin(base.find((x) => x.key === k));
    return f;
  });
  const tot = out.reduce((s, f) => s + f.A + f.B, 0);
  // half the total weight of metal, half how each front fares: a neglected wing cannot be paid for by a heavy centre
  const contested = out.filter((f) => f.A + f.B > 0);
  const agg = tot > 0 ? out.reduce((s, f) => s + f.A - f.B, 0) / tot : 0;
  const avg = contested.length ? contested.reduce((s, f) => s + f.m, 0) / contested.length : 0;
  let S = 0.5 * agg + 0.5 * avg;
  // a front that breaks lets the enemy round the rest
  const broken = out.filter((f) => f.m <= -0.4 && f.B > 0).length;
  const theirBroken = out.filter((f) => f.m >= 0.4 && f.A > 0).length;
  S += 0.05 * (theirBroken - broken);
  return { fronts: out, S, myReserveAt: myAt, theirReserveAt: theirAt };
}

// ---------- the enemy ----------

// how each kind of army spreads over the slots: [first front, second front, third front, reserve]
const STYLES = {
  line: { spear: [0.25, 0.4, 0.25, 0.1], archer: [0.2, 0.5, 0.2, 0.1], horse: [0.4, 0.1, 0.4, 0.1], merc: [0.25, 0.4, 0.25, 0.1] },
  wings: { spear: [0.15, 0.55, 0.15, 0.15], archer: [0.1, 0.6, 0.1, 0.2], horse: [0.45, 0, 0.45, 0.1], merc: [0.2, 0.5, 0.2, 0.1] },
  skirmish: { spear: [0.3, 0.3, 0.3, 0.1], archer: [0.3, 0.3, 0.3, 0.1], horse: [0.4, 0.1, 0.4, 0.1], merc: [0.3, 0.4, 0.3, 0] },
  garrison: { spear: [0.2, 0.5, 0.2, 0.1], archer: [0.15, 0.65, 0.15, 0.05], horse: [0.3, 0.2, 0.3, 0.2], merc: [0.2, 0.5, 0.2, 0.1] },
  fortress: { spear: [0.5, 0.4, 0.1, 0], archer: [0.7, 0.15, 0.15, 0], horse: [0, 0.1, 0.7, 0.2], merc: [0.45, 0.4, 0.15, 0] },
  raid: { spear: [0.3, 0.4, 0.3, 0], archer: [0.3, 0.4, 0.3, 0], horse: [0.45, 0.1, 0.45, 0], merc: [0.3, 0.4, 0.3, 0] },
};

/** Weights of a target's army: its own, or the default mix of a line army. */
export const DEFAULT_ARMY = { spear: 0.5, archer: 0.25, horse: 0.25 };

export function avgPow(comp) {
  const sum = ENEMY_KEYS.reduce((s, k) => s + (comp[k] || 0), 0);
  return sum > 0 ? ENEMY_KEYS.reduce((s, k) => s + (comp[k] || 0) * TROOPS[k].pow, 0) / sum : 1;
}

/** How many men a target fields: its muster, or whatever its strength is worth in that mix. */
export function enemyMen(t) {
  if (t.men) return t.men;
  return Math.max(4, Math.round((25 * t.strength * AVG_POW) / avgPow(t.army || DEFAULT_ARMY)));
}

function rngOf(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The enemy's line for a battle: men by type in each slot. Deterministic for a seed. */
export function buildEnemy(t, kind, seed, progress = 0) {
  const rnd = rngOf(seed);
  let men = enemyMen(t) * (1 - 0.25 * (progress / 100));
  if (kind === 'siege') men *= 0.85;
  if (kind === 'ambush') men *= 0.9;
  men = Math.max(4, Math.round(men));
  const weights = {};
  for (const k of ENEMY_KEYS) weights[k] = (t.army || DEFAULT_ARMY)[k] || 0;
  const comp = apportion(weights, men);
  const style = STYLES[kind === 'siege' ? 'fortress' : kind === 'ambush' ? 'raid' : (t.style || 'line')];
  const slots = slotsOf(kind).map((s) => s.key);
  const out = {};
  for (const s of slots) out[s] = {};
  for (const k of ENEMY_KEYS) {
    if (!comp[k]) continue;
    // a little disorder so no two enemies stand quite alike
    const w = style[k].map((v) => (v > 0 ? v * (0.8 + rnd() * 0.4) : 0));
    const split = apportion(Object.fromEntries(slots.map((s, i) => [s, w[i]])), comp[k]);
    for (const s of slots) if (split[s]) out[s][k] = split[s];
  }
  return out;
}

// ---------- what the player knows ----------

/** { exact, why }: whether the enemy line is known to the man. */
export function battleIntel(state) {
  const w = state.war;
  const cap = (r) => !!state[r] && state[r].alive !== false && state[r].quirk === 'schopny';
  if (w && w.scouted) return { exact: true, why: 'Zvěd donesl přesný popis nepřátelských řad.' };
  if (cap('marshal')) return { exact: true, why: `${state.marshal.name} zná nepřítele a vidí mu až do řad.` };
  if (cap('spymaster')) return { exact: true, why: `Špeh ${state.spymaster.name} spočítal nepřátelské prapory.` };
  if (w && w.battles > 0) return { exact: true, why: 'Z minulé srážky znáte jejich řady.' };
  if (w && w.leader === 'ruler' && (state.ruler.traits.intelligence || 0) >= 8) return { exact: true, why: 'Bystrý velitel čte nepřítele z pochodu jeho prapor.' };
  return { exact: false, why: 'Zvědové vidí jen z dálky: skladba je odhad, počty se mohou lišit.' };
}

/** What the player believes the enemy line to be: the truth, or a seeded wrong guess. */
export function knownEnemy(state, battle) {
  const intel = battleIntel(state);
  if (intel.exact) return { ...intel, slots: battle.enemy };
  const rnd = rngOf(battle.seed ^ 0x9e3779b9);
  const slots = {};
  for (const [s, g] of Object.entries(battle.enemy)) {
    slots[s] = {};
    for (const k of ENEMY_KEYS) if (g[k]) slots[s][k] = Math.max(1, Math.round(g[k] * (0.7 + rnd() * 0.6)));
  }
  return { ...intel, slots };
}

const sizeWord = (n) => (n <= 0 ? 'prázdno' : n <= 3 ? 'hlídka' : n <= 8 ? 'malý oddíl' : n <= 16 ? 'oddíl' : 'silný oddíl');

/** One slot of the enemy line in words: "silný oddíl, převážně jízda". */
export function describeGroup(g) {
  const n = sizeOf(g);
  if (n <= 0) return 'prázdno';
  const share = (k) => num(g, k) / n;
  const kind = share('horse') >= 0.5 ? 'převážně jízda' : share('archer') >= 0.5 ? 'převážně lučištníci'
    : share('spear') + share('merc') >= 0.65 ? 'hlavně pěchota' : share('horse') >= 0.3 ? 'pěchota a jízda' : 'smíšený oddíl';
  return `${sizeWord(n)}, ${kind}`;
}

/** The enemy as the player sees it: a line per slot and a total. */
export function enemyView(state, battle) {
  const known = knownEnemy(state, battle);
  const total = sizeOf(Object.values(known.slots).reduce((a, g) => addTo(a, g), {}));
  const real = sizeOf(Object.values(battle.enemy).reduce((a, g) => addTo(a, g), {}));
  const lo = Math.max(1, Math.round((real * 0.8) / 5) * 5);
  const hi = Math.round((real * 1.2) / 5) * 5 + 5;
  return {
    exact: known.exact, why: known.why, slots: known.slots,
    total: known.exact ? `${total} mužů` : `asi ${lo}–${hi} mužů`,
    lines: slotsOf(battle.kind).filter((s) => !s.reserve || sizeOf(known.slots[s.key]) > 0).map((s) => ({
      key: s.key, name: s.name, men: known.exact ? sizeOf(known.slots[s.key]) : null, comp: known.exact ? known.slots[s.key] : null, desc: describeGroup(known.slots[s.key]),
    })),
  };
}

// ---------- preparing a battle ----------

/** Corps in the field (ensures a composition for a war saved without one). */
export function fieldCorps(state) {
  const w = state.war;
  if (!w) return emptyTroops();
  if (!w.troops) {
    const base = state.troops && troopsTotal(state.troops) > 0 ? { spear: state.troops.spear, archer: state.troops.archer, horse: state.troops.horse, merc: state.troops.merc } : { spear: 60, archer: 25, horse: 15 };
    w.troops = { ...emptyTroops(), ...apportion(base, w.power) };
  }
  return w.troops;
}

/** The battle ahead (made once per scene): kind 'field' | 'siege' | 'ambush', stance 'flank' for a march round the enemy. */
export function prepareBattle(state, kind = 'field', stance = null) {
  const w = state.war;
  const t = warTarget(state);
  if (w.battle && w.battle.turn === state.turn && w.battle.kind === kind && w.battle.stance === stance) return w.battle;
  const seed = ((state.turn * 7919 + (w.start || 0) * 104729 + (w.seasons || 0) * 31 + (w.progress || 0)) >>> 0) ^ 0x51ed270b;
  w.battle = {
    kind, stance, turn: state.turn, seed,
    enemy: buildEnemy(t, kind, seed, w.progress || 0),
    terrain: t.terrain || 'plain', def: t.def || 1,
    place: t.loc,
  };
  return w.battle;
}

export function ctxOf(battle) {
  return { terrain: battle.terrain, def: battle.def };
}

// ---------- deploying ----------

export const emptyDeployment = (kind) => Object.fromEntries(slotsOf(kind).map((s) => [s.key, {}]));

/** A deployment with every man placed once: whatever is not placed goes to the reserve. */
export function normalizeDeployment(kind, corps, dep) {
  const out = emptyDeployment(kind);
  for (const k of TROOP_KEYS) {
    let left = num(corps, k);
    for (const s of slotsOf(kind)) {
      if (s.reserve) continue;
      const n = Math.max(0, Math.min(left, Math.floor(num(dep && dep[s.key], k))));
      if (n) out[s.key][k] = n;
      left -= n;
    }
    if (left > 0) out.Z[k] = left;
  }
  return out;
}

const shareOf = (g, k) => {
  const n = sizeOf(g);
  return n ? num(g, k) / n : 0;
};

/** The rule-of-thumb line: horse on the wing where the enemy has fewest spears, spears where the enemy rides, archers behind spears. */
export function quickDeploy(kind, corps, enemy) {
  const fronts = frontsOf(kind).map((f) => f.key);
  const dep = emptyDeployment(kind);
  const c = { ...emptyTroops(), ...corps };
  const put = (slot, k, n) => { if (n > 0) dep[slot][k] = num(dep[slot], k) + n; };
  const total = troopsTotal(c);
  if (kind === 'siege') {
    const share = (arr, n) => apportion(Object.fromEntries(fronts.map((f, i) => [f, arr[i]])), n);
    const res = Math.round((c.spear + c.merc) * 0.1);
    c.spear -= Math.min(c.spear, res);
    put('Z', 'spear', Math.min(num(corps, 'spear'), res));
    for (const [k, arr] of [['siege', [0.6, 0.4, 0]], ['archer', [0.6, 0.2, 0.2]], ['spear', [0.4, 0.4, 0.2]], ['merc', [0.4, 0.4, 0.2]], ['horse', [0, 0, 1]]]) {
      const s = share(arr, c[k]);
      for (const f of fronts) put(f, k, s[f]);
    }
    return dep;
  }
  // reserve: a tenth of the foot in a real battle; an ambushed column has no time to keep one
  if (kind === 'field' && total >= 30) {
    const res = Math.round((c.spear + c.merc) * 0.12);
    const fromSpear = Math.min(c.spear, res);
    c.spear -= fromSpear;
    put('Z', 'spear', fromSpear);
  }
  put('Z', 'siege', c.siege); // engines are only wagons in an open field
  c.siege = 0;
  const wings = fronts.filter((f) => slotDef(kind, f).wing);
  // horse: to the wing where the enemy has fewer spears and more archers
  const score = (f) => Math.max(0.1, 1.2 - shareOf(enemy[f], 'spear') - shareOf(enemy[f], 'merc') * 0.7 + 0.5 * shareOf(enemy[f], 'archer'));
  if (c.horse) {
    const h = apportion(Object.fromEntries(wings.map((f) => [f, score(f)])), c.horse);
    for (const f of wings) put(f, 'horse', h[f]);
  }
  // foot: more where the enemy rides, and always a solid centre
  const base = { L: 0.25, C: 0.4, R: 0.25 };
  const wFoot = Object.fromEntries(fronts.map((f) => [f, base[f] * (1 + 1.5 * shareOf(enemy[f], 'horse'))]));
  for (const k of ['spear', 'merc']) {
    const s = apportion(wFoot, c[k]);
    for (const f of fronts) put(f, k, s[f]);
  }
  // archers: behind the spears
  const foot = Object.fromEntries(fronts.map((f) => [f, num(dep[f], 'spear') + num(dep[f], 'merc') + 0.2]));
  const a = apportion(foot, c.archer);
  for (const f of fronts) put(f, 'archer', a[f]);
  return dep;
}

const scoreOf = (kind, ctx, enemy, mods, dep) => evaluate(kind, ctx, dep, enemy, mods).S;

/**
 * The best placing of the corps against the enemy line the man believes in
 * (a rule of thumb, then moves of a few men between slots while they help).
 */
export function bestDeployment(kind, ctx, corps, enemy, mods = {}, iterations = 24) {
  let dep = normalizeDeployment(kind, corps, quickDeploy(kind, corps, enemy));
  let best = scoreOf(kind, ctx, enemy, mods, dep);
  const keys = slotsOf(kind).map((s) => s.key);
  const bigStep = (k) => Math.max(1, Math.round(num(corps, k) * 0.15));
  for (let it = 0; it < iterations; it++) {
    let move = null;
    let moveScore = best + 1e-6;
    for (const k of TROOP_KEYS) {
      if (!num(corps, k)) continue;
      for (const from of keys) {
        const have = num(dep[from], k);
        if (!have) continue;
        for (const to of keys) {
          if (to === from) continue;
          for (const n of [1, bigStep(k)]) {
            const take = Math.min(n, have);
            const trial = JSON.parse(JSON.stringify(dep));
            trial[from][k] -= take;
            trial[to][k] = num(trial[to], k) + take;
            const s = scoreOf(kind, ctx, enemy, mods, trial);
            if (s > moveScore) { moveScore = s; move = trial; }
          }
        }
      }
    }
    if (!move) break;
    dep = move;
    best = moveScore;
  }
  return dep;
}

// ---------- the fight ----------

const GRADES = {
  field: { decisive: [45, 14], win: [35, 10], draw: [10, -3], loss: [-5, -15], rout: [-15, -22] },
  siege: { decisive: [55, 14], win: [45, 10], draw: [12, -4], loss: [5, -13], rout: [-5, -22] },
  ambush: { decisive: [30, 12], win: [20, 8], draw: [0, -4], loss: [-10, -18], rout: [-20, -25] },
};

const LOSS_MULT = {
  decisive: [0.7, 1.5], win: [0.85, 1.25], draw: [1, 1], loss: [1.3, 0.8], rout: [1.55, 0.6],
};

export const GRADE_LABEL = {
  decisive: 'Rozhodující vítězství', win: 'Vítězství', draw: 'Nerozhodně', loss: 'Porážka v poli', rout: 'Rozprášeni',
};

function gradeOf(S) {
  return S >= 0.3 ? 'decisive' : S >= 0.04 ? 'win' : S > -0.04 ? 'draw' : S > -0.3 ? 'loss' : 'rout';
}

/** Whole numbers of men lost in a group: `rate` of its men, the badly matched types first. */
function groupLosses(kind, g, rate, mult) {
  const n = sizeOf(g);
  const total = Math.min(n, Math.round(n * rate));
  const w = {};
  for (const k of TROOP_KEYS) w[k] = num(g, k) * (1.45 - 0.45 * Math.max(0.5, Math.min(1.5, (mult && mult[k]) || 1)));
  const cut = apportion(w, total);
  for (const k of TROOP_KEYS) cut[k] = Math.min(cut[k] || 0, Math.floor(num(g, k)));
  return cut;
}

/** Everything the man in charge adds to the plain strength of the two lines. */
function commanderEdge(state) {
  const w = state.war;
  let edge = (w.morale - 50) / 250;
  if (w.leader === 'ruler') {
    edge += 0.04 + 0.01 * ((state.ruler.traits.strength || 5) - 5);
    edge += (state.ruler.injuries ? 0 : 0);
  } else if (state.marshal && state.marshal.quirk === 'schopny') edge += 0.05;
  if (state.resources.food < 12) edge -= 0.05; // a hungry army fights badly
  return edge;
}

/**
 * Fights the battle: returns the result without touching the state (applyBattle does that).
 * deployment = the player's placing (or autoDeploy's).
 */
export function fightBattle(state, battle, deployment, rng = Math.random) {
  const w = state.war;
  const kind = battle.kind;
  const corps = fieldCorps(state);
  const dep = normalizeDeployment(kind, corps, deployment);
  const ctx = ctxOf(battle);
  const mods = {};
  let flank = null;
  if (battle.stance === 'flank') {
    // the reserve marches round the enemy: it takes a keen eye and a bit of luck
    const p = Math.max(0.15, Math.min(0.85, 0.4 + 0.05 * ((state.ruler.traits.intelligence || 5) - 5) + (battleIntel(state).exact ? 0.15 : 0)));
    flank = rng() < p;
    mods.reserveEff = flank ? 1.6 : 0.25;
  } else if (kind === 'ambush') mods.reserveEff = 0.5;
  if (kind === 'ambush') mods.theirEff = 1.1;
  const ev = evaluate(kind, ctx, dep, battle.enemy, mods);
  const noise = (rng() + rng() + rng() - 1.5) * 0.22;
  const S = ev.S + commanderEdge(state) + noise + (flank === true ? 0.05 : flank === false ? -0.03 : 0);
  const grade = gradeOf(S);
  const [pg, mg] = GRADES[kind][grade];
  const [lossMine, lossTheirs] = LOSS_MULT[grade];
  // losses: slot by slot, scaled by how hard the slot was pressed and by how the day went
  const losses = emptyTroops();
  let enemyLoss = 0;
  const slots = ev.fronts.map((f) => {
    const rA = Math.max(f.A, 0.5);
    const rB = Math.max(f.B, 0.5);
    const rateMine = Math.max(0.02, Math.min(0.45, 0.13 * Math.pow(rB / rA, 0.6))) * lossMine * (f.reserve && f.wasM < -0.2 ? 0.85 : 1);
    const rateTheirs = Math.max(0.02, Math.min(0.45, 0.13 * Math.pow(rA / rB, 0.6))) * lossTheirs;
    const cut = groupLosses(kind, f.mine, rateMine, f.multA);
    for (const k of TROOP_KEYS) losses[k] += cut[k];
    const theirCut = Math.min(sizeOf(f.theirs), Math.round(sizeOf(f.theirs) * rateTheirs));
    enemyLoss += theirCut;
    const def = slotDef(kind, f.key);
    return {
      key: f.key, name: def.name, loc: def.loc, A: f.A, B: f.B, m: f.m, men: sizeOf(f.mine), enemyMen: sizeOf(f.theirs),
      verdict: f.m >= 0.12 ? 'good' : f.m <= -0.12 ? 'bad' : 'warn', lost: troopsTotal(cut), enemyLost: theirCut, cut,
      reserve: f.reserve, savedByReserve: f.reserve && f.wasM < -0.15 && f.m > f.wasM + 0.12, mult: f.multA, theirMult: f.multB, cover: f.coverA,
      mine: f.mine, theirs: f.theirs,
    };
  });
  for (const k of TROOP_KEYS) losses[k] = Math.min(losses[k], num(corps, k));
  const lost = troopsTotal(losses);
  // a siege goes faster the more engines stand at the walls
  const engines = num(dep.W, 'siege') + num(dep.G, 'siege');
  let progress = pg;
  if (kind === 'siege' && pg > 0) progress = Math.round(pg * (1 + 0.08 * Math.min(5, engines)));
  const wound = w.leader === 'ruler' ? (grade === 'loss' || grade === 'rout' ? 0.35 : grade === 'draw' ? 0.12 : 0.06) : 0;
  const result = {
    kind, grade, win: grade === 'decisive' || grade === 'win', S, noise, flank, slots, losses, lost, enemyLoss, engines,
    progress, morale: mg, wound, reserveAt: ev.myReserveAt, deployment: dep,
  };
  result.story = tellBattle(state, battle, result);
  return result;
}

/** The quick, deterministic odds of a corps against a target's line, as the score S of its best placing. */
export function scoreAgainst(kind, ctx, corps, enemy, mods) {
  const dep = bestDeployment(kind, ctx, corps, enemy, mods, 6);
  return evaluate(kind, ctx, dep, enemy, mods).S;
}

const modsOf = (battle) => (battle.stance === 'flank' ? { reserveEff: 1 } : battle.kind === 'ambush' ? { reserveEff: 0.5 } : {});

/**
 * autoDeploy(state, enemy): the placing the "Automaticky" button and the simulations use. `enemy` is the battle
 * (state.war.battle, made by prepareBattle); the placing is made against the line the man believes in:
 * the true one with a marshal, a spy or a scout, an estimate without.
 */
export function autoDeploy(state, enemy = state.war && state.war.battle) {
  const known = knownEnemy(state, enemy);
  return bestDeployment(enemy.kind, ctxOf(enemy), fieldCorps(state), known.slots, modsOf(enemy));
}

/** Headless: the battle fought with the best placing the man knows how to make (sims and ordinary events). */
export function autoFight(state, kind, stance, rng = Math.random) {
  const battle = prepareBattle(state, kind, stance);
  return fightBattle(state, battle, autoDeploy(state, battle), rng);
}

/** What a man in charge sees for a placing: the score against the enemy line he believes in. */
export function previewDeployment(state, battle, dep) {
  const known = knownEnemy(state, battle);
  const ev = evaluate(battle.kind, ctxOf(battle), normalizeDeployment(battle.kind, fieldCorps(state), dep), known.slots, modsOf(battle));
  return { S: ev.S + commanderEdge(state), fronts: ev.fronts, reserveAt: ev.myReserveAt };
}

// ---------- the story ----------

const NOUN = { spear: ['kopiníci', 'li'], archer: ['lučištníci', 'li'], horse: ['jízda', 'la'], siege: ['obléhací stroje', 'ly'], merc: ['žoldnéři', 'li'] };
const verb = (who, stem, table = NOUN) => `${table[who][0]} ${stem}${table[who][1]}`;

/** The leader in the right gender for the narration: a token the engine fills in ({R:…|…} or {V:…|…}). */
const lead = (state, a, b) => (state.war.leader === 'ruler' ? `{R:${a}|${b}}` : `{V:${a}|${b}}`);

/** "Padl 1 muž", "Padli 3 muži", "Padlo 7 mužů". */
const fell = (n) => (n === 1 ? 'Padl 1 muž' : n >= 2 && n <= 4 ? `Padli ${n} muži` : `Padlo ${n} mužů`);

function dominant(g) {
  let best = null;
  for (const k of ENEMY_KEYS) if (num(g, k) > 0 && (!best || num(g, k) * TROOPS[k].pow > num(g, best) * TROOPS[best].pow)) best = k;
  return best;
}

/** Three to five sentences about how the day went: where it broke, who decided it, what it cost. */
function tellBattle(state, battle, r) {
  const kind = r.kind;
  const out = [];
  const front = r.slots.filter((s) => s.men + s.enemyMen > 0);
  const best = front.slice().sort((a, b) => b.m - a.m)[0];
  const worst = front.slice().sort((a, b) => a.m - b.m)[0];
  // 1: the opening
  if (kind === 'siege') {
    out.push(r.engines >= 2 ? 'Stroje se rozhoupaly a kameny bily do hradeb.' : 'Bez strojů se šlo na hradby po žebřících a pod kameny obránců.');
  } else if (kind === 'ambush') {
    out.push('Útok přišel z lesa a kolona se musela rozvinout pod šípy.');
  } else if (battle.stance === 'flank') {
    out.push(r.flank ? 'Obchvat se vydařil: záloha se vynořila nepříteli v zádech v tu chvíli, kdy se střed začínal viklat.' : 'Obchvat se nezdařil: záloha zabloudila v terénu a do bitvy přišla pozdě.');
  } else {
    out.push(`Za zvuku rohů se obě vojska srazila${battle.terrain === 'forest' ? ' mezi stromy' : battle.terrain === 'hills' ? ' na svahu' : ''}.`);
  }
  // 2: the matchup that told, in the slot where it mattered most
  let told = false;
  const stage = best && best.m > 0.1 ? best : worst;
  if (stage) {
    const sk = (k) => num(stage.mine, k);
    const ek = dominant(stage.theirs);
    const L = cap(stage.loc);
    if (sk('spear') >= 3 && ek === 'horse' && (stage.mult.spear || 1) > 1.2) { out.push(`${L} ${verb('spear', 'zastavi')} nepřátelskou jízdu a ta se rozbila o kopí.`); told = true; }
    else if (sk('horse') >= 2 && ek === 'archer' && (stage.mult.horse || 1) > 1.3) { out.push(`${L} ${verb('horse', 'smetl')} nepřátelské lučištníky dřív, než stačili dvakrát vystřelit.`); told = true; }
    else if (sk('archer') >= 4 && stage.cover >= 0.7 && stage.m > 0) { out.push(`${L} zasypali lučištníci za kopiníky nepřítele šípy.`); told = true; }
    else if (stage.m < -0.1 && ek === 'horse' && sk('archer') > sk('spear') && stage.cover < 0.5) { out.push(`${L} nechala nepřátelská jízda lučištníky bez ochrany kopí a rozsekala je.`); told = true; }
    else if (stage.m < -0.1 && ek === 'archer' && sk('spear') > 0) { out.push(`${L} zasypali nepřátelští lučištníci kopiníky šípy, dřív než se dostali na dosah.`); told = true; }
    if (!told) out.push(stage.m > 0.1 ? `${L} se dařilo nejlíp, tam nepřítel ustoupil první.` : stage.m < -0.1 ? `${L} bylo nejhůř: tam se řady ohýbaly a muži couvali.` : 'Bojovalo se tvrdě všude stejně a žádná strana nepovolila.');
  }
  // 3: the reserve
  const rs = r.slots.find((s) => s.reserve);
  if (rs && battle.stance !== 'flank') {
    const to = slotDef(kind, rs.key).to;
    out.push(rs.savedByReserve ? `Záloha dorazila ${to} právě ve chvíli, kdy se řady lámaly, a zabránila zhroucení.` : r.win ? `Záloha zasáhla ${slotDef(kind, rs.key).loc} a rozhodla věc.` : `Záloha přišla ${to} pozdě, aby věc obrátila.`);
  }
  // 4: how it ended and what it cost
  const cost = r.lost ? `${fell(r.lost)}${r.lost >= 3 ? ` (nejvíc ${nounOfMost(r.losses)})` : ''}` : 'Padl sotva někdo';
  const siege = kind === 'siege';
  out.push({
    decisive: siege ? `Obránci shodili zbraně a brána se otevřela; {war.leader} ${lead(state, 'vjel', 'vjela')} do pevnosti. ${cost}.`
      : `Nepřítel se rozpadl a prchal přes pole; {war.leader} ho ${lead(state, 'nechal', 'nechala')} pronásledovat. ${cost}.`,
    win: siege ? `Obránci ustoupili z hradeb a pevnost je v našich rukou. ${cost}.` : `Nepřítel ustoupil a pole zůstalo nám. ${cost}.`,
    draw: `K večeru obě strany ustoupily, aniž se cokoli rozhodlo. ${cost}.`,
    loss: siege ? `Útok se zadrhl v příkopu a vojsko se stáhlo od hradeb. ${cost}.` : `Řady povolily a vojsko se stáhlo z bojiště. ${cost}.`,
    rout: `Vojsko se rozpadlo a běželo, co mu síly stačily. ${cost}.`,
  }[r.grade]);
  return out.slice(0, 5).join(' ');
}

const cap = (s) => s[0].toUpperCase() + s.slice(1);

function nounOfMost(losses) {
  const k = TROOP_KEYS.slice().sort((a, b) => losses[b] - losses[a])[0];
  return { spear: 'kopiníků', archer: 'lučištníků', horse: 'jezdců', siege: 'strojů', merc: 'žoldnéřů' }[k];
}

/** The line in the report: "3 kopiníci, 1 jezdec". */
export function lossLine(losses) {
  return TROOP_KEYS.filter((k) => losses[k]).map((k) => countLabel(k, losses[k])).join(', ') || 'žádné ztráty';
}

