// The great houses: who they are, how they stand to one another and what the player can do with them.
//
// state.houses = [{ id, power, attitude, ally, married, head, rel, cd?, fief?, rebelPending? }]
//   attitude  how the house stands to the player (the noble, later the king)
//   power     its weight in the realm (0-100)
//   rel       { <otherHouseId>: -100…100 } — how the houses stand to one another, drifting in the background
//   cd        first turn on which the player can act on the house again (panel actions)
//   fief      the king has already granted this house a fief · rebelPending: it is about to rise (h_v_vzpoura_rodu)
// Definitions (name, seat, retinue, boon) live in data.js NOBLE_HOUSES; the coats of arms in crests.js.
// No DOM here and no import of state.js or engine.js (they import this module).

import { NOBLE_HOUSES, clamp, clampRes, randInt, randomName } from './data.js';

export const houseDef = (id) => NOBLE_HOUSES.find((d) => d.id === id);

/** What each speciality is, for the panels: a label and what a friendly house brings. */
export const FOCUS = {
  finance: { label: 'Peníze a dluhy' },
  war: { label: 'Zbraně a válka' },
  border: { label: 'Hranice a stráže' },
  forest: { label: 'Dřevo a lov' },
  church: { label: 'Víra a desátky' },
  river: { label: 'Řeka, mýta a trh' },
  steppe: { label: 'Koně a jízda' },
  law: { label: 'Právo a listiny' },
};

const RES_WORD = { gold: 'zlata', food: 'jídla', army: 'vojska', faith: 'víry', prestige: 'prestiže', legitimacy: 'legitimity', stability: 'stability' };

/** "+2 zlata, +1 prestiže ročně" — what a friendly house brings. */
export function boonText(def) {
  return Object.entries(def.boon || {}).map(([k, v]) => `+${v} ${RES_WORD[k]}`).join(', ') + ' ročně';
}

// ---------- creating and mending the houses ----------

/** A new house with a head whose name nobody else at the heads of the houses already bears. */
function newHouse(def, taken = []) {
  const g = Math.random() < 0.75 ? 'male' : 'female';
  let name = randomName(g);
  for (let i = 0; i < 60 && taken.includes(name); i++) name = randomName(g);
  return {
    id: def.id, power: randInt(50, 70), attitude: randInt(40, 55), ally: false, married: false,
    head: { name, gender: g, age: randInt(38, 62) }, rel: {},
  };
}

const relClamp = (v) => Math.max(-100, Math.min(100, Math.round(v)));

/** The starting relation of two houses: the bond written in their definitions, a little shaken. */
export function baseRel(a, b) {
  const da = houseDef(a);
  const db = houseDef(b);
  return (da && da.bonds && da.bonds[b]) ?? (db && db.bonds && db.bonds[a]) ?? 0;
}

function seedRelations(houses) {
  for (const h of houses) h.rel = h.rel || {};
  for (const a of houses) {
    for (const b of houses) {
      if (a.id >= b.id || a.rel[b.id] !== undefined) continue;
      const v = relClamp(baseRel(a.id, b.id) + randInt(-12, 12));
      a.rel[b.id] = v;
      b.rel[a.id] = v;
    }
  }
}

/** All the houses of the realm for a new world. */
export function createHouses() {
  const houses = [];
  for (const def of NOBLE_HOUSES) houses.push(newHouse(def, houses.map((h) => h.head.name)));
  seedRelations(houses);
  return houses;
}

/**
 * Brings an older save up to date: houses added since (the five newer ones), relations between the houses.
 * A king from before there were houses at all (a legacy Panovník) gets them too.
 */
export function ensureHouses(state) {
  if (!state) return state;
  if (!state.houses) {
    if (state.scenario !== 'panovnik') return state;
    state.houses = [];
  }
  for (const def of NOBLE_HOUSES) if (!state.houses.some((h) => h.id === def.id)) state.houses.push(newHouse(def, state.houses.map((h) => h.head.name)));
  seedRelations(state.houses);
  return state;
}

export const housesNeedMending = (state) => !!state.houses && (state.houses.length < NOBLE_HOUSES.length || !state.houses[0].rel);

// ---------- relations ----------

export function relation(state, a, b) {
  const h = (state.houses || []).find((x) => x.id === a);
  return h && h.rel && h.rel[b] !== undefined ? h.rel[b] : 0;
}

export function addRel(state, a, b, delta) {
  const ha = (state.houses || []).find((x) => x.id === a);
  const hb = (state.houses || []).find((x) => x.id === b);
  if (!ha || !hb || a === b) return;
  const v = relClamp(relation(state, a, b) + delta);
  (ha.rel = ha.rel || {})[b] = v;
  (hb.rel = hb.rel || {})[a] = v;
}

export function relLabel(v) {
  if (v >= 60) return 'spřízněni';
  if (v >= 25) return 'přátelé';
  if (v > -25) return 'chladní';
  if (v > -60) return 've sporu';
  return 'nepřátelé';
}

/** Every pair of houses, as [a, b, rel] (each pair once, strongest bond or feud first). */
export function housePairs(state) {
  const out = [];
  const hs = state.houses || [];
  for (let i = 0; i < hs.length; i++) for (let j = i + 1; j < hs.length; j++) out.push([hs[i], hs[j], relation(state, hs[i].id, hs[j].id)]);
  return out.sort((x, y) => Math.abs(y[2]) - Math.abs(x[2]));
}

/** A random pair of houses that fits `test(a, b, rel)`; the event context takes both: { house, house2 }. */
export function pickPair(state, test) {
  const pool = housePairs(state).filter(([a, b, r]) => test(a, b, r));
  if (!pool.length) return null;
  const [a, b] = pool[Math.floor(Math.random() * pool.length)];
  return Math.random() < 0.5 ? { house: a.id, house2: b.id } : { house: b.id, house2: a.id };
}

// ---------- the retinue ----------

const countWord = (n, one, few, many) => `${n} ${n === 1 ? one : n >= 2 && n <= 4 ? few : many}`;

/** The men a house sends to a war: its base muster scaled by its power (power 50 = the base). */
export function houseMuster(h) {
  const def = houseDef(h.id);
  if (!def) return { total: 0, spear: 0, archer: 0, horse: 0 };
  const total = Math.max(0, Math.round(def.muster * (0.5 + h.power / 100)));
  const out = { total, spear: 0, archer: 0, horse: 0 };
  let left = total;
  const kinds = ['spear', 'archer', 'horse'];
  for (const k of kinds.slice(0, 2)) { out[k] = Math.round(total * def.troops[k]); left -= out[k]; }
  out.horse = Math.max(0, left);
  return out;
}

/** "7 kopiníků, 4 lučištníci, 3 jezdci" */
export function musterText(m) {
  return [
    m.spear && countWord(m.spear, 'kopiník', 'kopiníci', 'kopiníků'),
    m.archer && countWord(m.archer, 'lučištník', 'lučištníci', 'lučištníků'),
    m.horse && countWord(m.horse, 'jezdec', 'jezdci', 'jezdců'),
  ].filter(Boolean).join(', ');
}

// ---------- what a house holds ----------

/** Does the house still have land to lose (and to feast on)? Old houses own their province, newer ones hold a držba in it. */
export function houseLanded(state, h) {
  const def = houseDef(h.id);
  if (!def) return false;
  if (state.scenario === 'panovnik') return true; // under the crown every house sits on its land
  if ((state.provinces || []).some((p) => p.owner === h.id)) return true;
  return !!def.hold && h.power > 20;
}

// ---------- the world's yearly weather ----------

const note = (state, text) => state.chronicle.push({ turn: state.turn, year: state.year, season: state.seasonIndex, text });

/**
 * Once a year (called in spring, engine.js): the houses drift against one another, grow or shrink, the friendly ones
 * pay their boon and the hostile powerful ones make themselves felt; under a king a mighty, sullen house may rise.
 * `queue(id)` raises an event. Returns news lines for the season summary.
 */
export function houseYear(state, queue) {
  const hs = state.houses;
  const news = [];
  if (!hs || !hs.length) return news;
  const peasant = state.scenario === 'sedlak';
  // 1) relations: they settle toward their old bond, are stirred by who is friends with the player, and by the strong bullying the weak
  for (let i = 0; i < hs.length; i++) {
    for (let j = i + 1; j < hs.length; j++) {
      const a = hs[i];
      const b = hs[j];
      const r = relation(state, a.id, b.id);
      const base = baseRel(a.id, b.id);
      let d = Math.round((base - r) * 0.08) + randInt(-4, 4);
      if (!peasant) {
        if ((a.ally || a.married) && (b.ally || b.married)) d += 2; // two friends of the player grow closer
        else if (((a.ally || a.married) && b.attitude < 30) || ((b.ally || b.married) && a.attitude < 30)) d -= 2;
      }
      if (Math.abs(a.power - b.power) >= 30) d -= 1; // a great house leaning on a small one
      addRel(state, a.id, b.id, d);
    }
  }
  // 2) power: slow tides, a sullen peace for the weak, friends of the strong grow
  for (const h of hs) {
    const friends = hs.filter((o) => o !== h && relation(state, h.id, o.id) >= 40).length;
    const foes = hs.filter((o) => o !== h && relation(state, h.id, o.id) <= -60).length;
    const pull = Math.round((55 - h.power) * 0.06);
    h.power = clamp(h.power + pull + randInt(-2, 2) + (friends >= 2 ? 1 : 0) - (foes >= 2 ? 1 : 0));
  }
  // 3) open feuds wear both houses down
  for (const [a, b, r] of housePairs(state)) {
    if (r > -75) break;
    a.power = clamp(a.power - 2);
    b.power = clamp(b.power - 2);
    if (!peasant && Math.random() < 0.5) news.push(`Rod ${houseDef(a.id).gen} a rod ${houseDef(b.id).gen} se v pohraničí potýkají o dobytek i o čest.`);
  }
  if (peasant) return news;
  // 4) boons and grudges
  for (const h of hs) {
    const def = houseDef(h.id);
    const friendly = (h.ally || h.married) && h.attitude >= 45;
    if (friendly && def.boon) {
      for (const [k, v] of Object.entries(def.boon)) if (state.resources[k] !== undefined) state.resources[k] = clampRes(k, state.resources[k] + v);
      if (Math.random() < 0.25) news.push(`Rod ${def.gen} posílá dary: ${boonText(def).replace(' ročně', '')}.`);
    }
  }
  // a king feels the worst of his sullen great houses in the order of the land (a noble has enough of his own worries)
  const sulky = state.scenario === 'panovnik' ? hs.filter((h) => h.attitude < 25 && h.power >= 60).length : 0;
  if (sulky && state.resources.stability !== undefined) {
    state.resources.stability = clamp(state.resources.stability - 1);
    if (Math.random() < 0.3) news.push('Rody, které koruně nevěří, dělají kraji těžký život. Stabilita trochu klesá.');
  }
  // 5) under the crown a strong, sullen house may rise (h_v_vzpoura_rodu)
  if (state.scenario === 'panovnik' && queue && !(state.regency && !state.regency.ended)) {
    const raisers = hs.filter((h) => h.attitude < 30 && h.power >= 60 && !h.rebelPending && !h.ally && !h.married);
    if (raisers.length && Math.random() < 0.35 && !state.houses.some((h) => h.rebelPending)) {
      const h = raisers.sort((a, b) => b.power - a.power)[0];
      h.rebelPending = true;
      queue('h_v_vzpoura_rodu');
      news.push(`V sídle ${houseDef(h.id).gen} se šeptá o vzpouře.`);
    }
  }
  return news;
}

// ---------- the panel's actions (noble: a gift; king: muster, favour, fief, marriage, taming) ----------

export const ACTION_PAUSE = 3; // seasons before the same house can be acted on again

const heirMarriageable = (state) => !!(state.heir && state.heir.alive !== false && !state.heir.none && state.heir.age >= 14) && !state.flags.heir_married && !state.flags.royal_match;

/** What the player can do with a house now, for the panel: [{ key, label, hint, ok, why }]. */
export function houseActions(state, id) {
  const h = (state.houses || []).find((x) => x.id === id);
  const def = houseDef(id);
  if (!h || !def || (state.scenario !== 'slechtic' && state.scenario !== 'panovnik')) return [];
  const wait = (h.cd || 0) - state.turn;
  const gold = state.resources.gold;
  const out = [];
  if (state.scenario === 'slechtic') {
    out.push({ key: 'gift', label: 'Poslat dar', hint: '8 zlata · vztah +7', ok: gold >= 8, why: 'Nemáš dost zlata.' });
  } else {
    const m = houseMuster(h);
    out.push({ key: 'muster', label: 'Svolat hotovost', hint: `${m.total} mužů · vztah −4`, ok: h.attitude >= 35, why: 'Rod odmítá poslat muže koruně.' });
    out.push({ key: 'favor', label: 'Udělit přízeň', hint: '10 zlata · vztah +12', ok: gold >= 10, why: 'Nemáš dost zlata.' });
    out.push({ key: 'fief', label: 'Udělit léno', hint: 'vztah +20, moc +8 · jen jednou', ok: !h.fief && h.attitude >= 40, why: h.fief ? 'Rod už léno má.' : 'Rod koruně příliš nedůvěřuje.' });
    out.push({ key: 'marry', label: 'Oženit dítě', hint: 'sňatek, spojenectví, vztah +20', ok: heirMarriageable(state) && !h.married && h.attitude >= 40, why: h.married ? 'Rody už spojil sňatek.' : 'Není kdo by se ženil, nebo rod stojí stranou.' });
    if (h.power >= 55) out.push({ key: 'tame', label: 'Zkrotit rod', hint: 'moc −10, vztah −18 · hrozí vzpoura', ok: true, why: '' });
  }
  return out.map((a) => (wait > 0 ? { ...a, ok: false, why: `Rod potřebuje oddech (ještě ${wait} období).` } : a));
}

/** Does the action. Returns { ok, text, tone } — the text goes to the chronicle and to the panel. */
export function doHouseAction(state, id, key) {
  const act = houseActions(state, id).find((a) => a.key === key);
  const h = (state.houses || []).find((x) => x.id === id);
  const def = houseDef(id);
  if (!act || !act.ok) return { ok: false, text: act ? act.why : 'Tohle teď nejde.', tone: 'bad' };
  const r = state.resources;
  const hn = `rodu ${def.gen}`;
  let text;
  let tone = 'good';
  const f = state.ruler.gender === 'female';
  if (key === 'gift') {
    r.gold = clampRes('gold', r.gold - 8);
    h.attitude = clamp(h.attitude + 7);
    text = `Rod ${state.dynastyName} poslal ${hn} dar: koně, víno a zdvořilý list. ${h.head.gender === 'female' ? 'Paní' : 'Pán'} ${h.head.name} ho přijal${h.head.gender === 'female' ? 'a' : ''} s úsměvem.`;
  } else if (key === 'muster') {
    const m = houseMuster(h);
    r.army = clampRes('army', r.army + m.total);
    h.attitude = clamp(h.attitude - 4);
    text = `Hotovost ${hn} dorazila na zavolání koruny: ${musterText(m)}. Přišli, ale bez nadšení.`;
  } else if (key === 'favor') {
    r.gold = clampRes('gold', r.gold - 10);
    h.attitude = clamp(h.attitude + 12);
    h.power = clamp(h.power + 2);
    text = `Koruna obdarovala rod ${def.gen} úřadem na dvoře a truhlicí mincí. ${h.head.name} se klaní hlouběji než dřív.`;
  } else if (key === 'fief') {
    h.fief = true;
    h.attitude = clamp(h.attitude + 20);
    h.power = clamp(h.power + 8);
    text = `${f ? 'Královna' : 'Král'} ${state.ruler.name} udělil${f ? 'a' : ''} rodu ${def.gen} nové léno. Rod je vděčný a zase o kus silnější.`;
  } else if (key === 'marry') {
    h.married = true;
    h.ally = true;
    h.attitude = clamp(h.attitude + 20);
    state.flags.heir_married = true;
    for (const [k, v] of Object.entries({ gold: 10, legitimacy: 4 })) if (r[k] !== undefined) r[k] = clampRes(k, r[k] + v);
    text = `${f ? 'Královna' : 'Král'} ${state.ruler.name} zasnoubil${f ? 'a' : ''} své dítě s potomkem rodu ${def.gen}. Věno bylo štědré a pouto mezi rody pevné.`;
  } else {
    // tame: a show of force against a house that grew too big
    h.power = clamp(h.power - 10);
    h.attitude = clamp(h.attitude - 18);
    const backfire = Math.random() < (h.attitude < 30 ? 0.4 : 0.15);
    if (backfire && state.scenario === 'panovnik') {
      h.rebelPending = true;
      tone = 'bad';
      text = `Zkrocení rodu ${def.gen} se nezdařilo tak, jak mělo: ${h.head.name} sice ustoupil${h.head.gender === 'female' ? 'a' : ''}, ale ve vsích se šeptá o pomstě.`;
    } else {
      text = `Koruna ukázala rodu ${def.gen}, kdo je pánem v zemi: ztratil část lén, družinu i hrdost. ${h.head.name} se pokořil${h.head.gender === 'female' ? 'a' : ''}.`;
    }
  }
  h.cd = state.turn + ACTION_PAUSE;
  note(state, text);
  return { ok: true, text, tone, pending: key === 'tame' && h.rebelPending };
}
