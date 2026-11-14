// The empire: what a king who wears foreign crowns (realms.js) has to govern.
// A held realm has a mood (realm.attitude, 0–100: how loyal it is), a grip
// (realm.power: how firmly the crown holds its castles) and, kept here in
// state.empire, a local lord, his ambition and the claimants of the old dynasty.
//
// state.empire = {
//   r: { <realm key>: { lord: {name, gender}, ambition, decreed: <year>, viceroy, pretender, claimant } },
//   peak,          // consecutive years of a loyal, quiet empire (events_empire.js risa_vrchol)
//   peakOffered,   // turn the 'empire at its peak' card was last offered
// }
// pretender: 0 none · 1 at large · 2 in the tower · 3 honoured at court · 4 dead
// No DOM here — engine.js runs it, events_empire.js tells the stories.

import { clamp, randInt, randomName, bumpStat, yearsLabel } from './data.js';

/** A forced scene that must not push out another one already waiting (the same as engine.js queueEvent, kept here so the data modules do not import the engine). */
function queueEvent(state, id) {
  if (!state.pendingEvent) state.pendingEvent = id;
  else if (state.pendingEvent !== id) (state.eventQueue = state.eventQueue || []).push(id);
}

// the realm names in every case the texts need, and who rules there under the crown
export const EMPIRE_REALMS = {
  east: {
    name: 'Východní marky', gen: 'Východních marek', dat: 'Východním markám', loc: 've Východních markách', ins: 's Východními markami',
    adj: 'markští', lordTitle: ['markrabě', 'markraběnka'],
    woe: 'V markských vsích se šíří mor. Hřbitovy se plní rychleji, než je kněží stačí žehnat, a kdo může, utíká přes hvozd.',
  },
  north: {
    name: 'Severní pustiny', gen: 'Severních pustin', dat: 'Severním pustinám', loc: 'v Severních pustinách', ins: 'se Severními pustinami',
    adj: 'severští', lordTitle: ['náčelník', 'náčelnice'],
    woe: 'Zima přišla dřív a vzala stáda i zásoby. Kmeny v horách hladoví a říkají, že koruna, která bere daně, má dávat i chleba.',
  },
};

const heldKeys = (state) => Object.keys(EMPIRE_REALMS).filter((k) => state.realms && state.realms[k] && state.realms[k].owner === 'player');
export { heldKeys };

export function ensureEmpire(state) {
  if (!state.empire) state.empire = { r: {}, peak: 0, peakOffered: -99 };
  if (!state.empire.r) state.empire.r = {};
  return state.empire;
}

/** The empire's record of one held realm; the local lord is made up the first time he is needed. */
export function realmRec(state, key) {
  const e = ensureEmpire(state);
  if (!e.r[key]) {
    const g = Math.random() < 0.75 ? 'male' : 'female';
    e.r[key] = { lord: { name: randomName(g), gender: g }, ambition: randInt(25, 45), decreed: state.year - 1, viceroy: false, pretender: 0 };
  }
  return e.r[key];
}

/** The claimant of a held realm's old dynasty, made up when first mentioned. */
export function claimantOf(state, key) {
  const rec = realmRec(state, key);
  if (!rec.claimant) {
    const g = Math.random() < 0.6 ? 'male' : 'female';
    rec.claimant = { name: randomName(g), gender: g };
  }
  return rec.claimant;
}

/** Years since the empire was proclaimed (0 before it). */
export function empireYears(state) {
  const t = state.milestones && state.milestones.empire;
  return t === undefined ? 0 : Math.floor((state.turn - t) / 4);
}

export const isEmpire = (state) => state.ruler.statusTier >= 6 && heldKeys(state).length >= 2;

/** The held realm that has not had its decree this year: the least loyal first. */
export function nextUndecreed(state) {
  const keys = heldKeys(state).filter((k) => realmRec(state, k).decreed !== state.year);
  keys.sort((a, b) => state.realms[a].attitude - state.realms[b].attitude);
  return keys[0] || null;
}

/** A held realm for a story that needs one: `pick` = 'low' (least loyal), 'strong' (most power), 'rich' (the one that pays most), or by year. */
export function pickHeld(state, pick = 'year', filter = () => true) {
  const keys = heldKeys(state).filter((k) => filter(state.realms[k], realmRec(state, k), k));
  if (!keys.length) return null;
  const R = state.realms;
  if (pick === 'low') keys.sort((a, b) => R[a].attitude - R[b].attitude);
  else if (pick === 'strong') keys.sort((a, b) => R[b].power - R[a].power);
  else if (pick === 'rich') keys.sort((a, b) => (b === 'east') - (a === 'east'));
  else keys.sort();
  return pick === 'year' ? keys[(state.year + state.seasonIndex) % keys.length] : keys[0];
}

// ---------- what the yearly decree and the events change ----------

const MOODS = [
  [70, 'Země je klidná a daně chodí včas.'],
  [50, 'Země je zatím poslušná, ale ne nadšená.'],
  [35, 'V zemi se mluví o starých časech víc, než je zdrávo.'],
  [0, 'V zemi se šeptá o povstání a výběrčí chodí s ozbrojenci.'],
];
const moodOf = (attitude) => MOODS.find(([min]) => attitude >= min)[1];

/**
 * Branch extra `empire`, acting on the realm the event is about (eventContext.realm):
 * decreed: the year's decree is issued · ambition: the local lord's ambition · viceroy: the heir rules there
 * pretender: the state of the old dynasty's claimant · pardon: jailed claimants are pardoned.
 */
export function applyEmpireBranch(state, fx, notes) {
  if (!fx) return;
  const key = state.eventContext && state.eventContext.realm;
  if (fx.pardon) {
    for (const k of heldKeys(state)) if (realmRec(state, k).pretender === 2) realmRec(state, k).pretender = 3;
  }
  if (!key || !state.realms || !state.realms[key] || state.realms[key].owner !== 'player') return;
  const rec = realmRec(state, key);
  if (fx.ambition) rec.ambition = clamp(rec.ambition + fx.ambition);
  if (fx.pretender !== undefined) rec.pretender = fx.pretender;
  if (fx.viceroy) {
    rec.viceroy = true;
    bumpStat(state, 'viceroys');
    notes.push({ text: `${EMPIRE_REALMS[key].name}: místokrál z rodu`, tone: 'pos' });
  }
  if (fx.decreed) {
    rec.decreed = state.year;
    bumpStat(state, 'empireDecrees');
    // the other crown has its decree to give too, right after this one
    if (nextUndecreed(state)) queueEvent(state, 'risa_sprava');
  }
}

/** Every season: what the held crowns' lords and claimants do on their own. */
export function processEmpire(state) {
  if (state.scenario !== 'panovnik') return;
  const held = heldKeys(state);
  if (!held.length) return;
  // the autumn decree for every held realm, winter if the autumn was busy
  if (state.seasonIndex >= 2 && !state.pendingEvent && nextUndecreed(state)) state.pendingEvent = 'risa_sprava';
}

/** Once a year after the realms have aged: the empire's long streak, a viceroy's work, a claimant's whispers. Returns news lines. */
export function empireYear(state) {
  const news = [];
  const held = heldKeys(state);
  if (state.scenario !== 'panovnik' || !held.length) return news;
  const e = ensureEmpire(state);
  for (const k of held) {
    const r = state.realms[k];
    const rec = realmRec(state, k);
    if (rec.viceroy) r.attitude = clamp(r.attitude + 2); // a ruler of their own blood in the land
    if (rec.pretender === 1) r.attitude = clamp(r.attitude - 1); // a claimant at large keeps the old loyalties alive
    if (r.attitude < 35) news.push(`Zpráva z říše: ${EMPIRE_REALMS[k].name} se vaří, šeptá se o povstání.`);
  }
  // the streak of a loyal, quiet empire: two crowns, both above 60, the home realm steady
  const R = state.resources;
  const calm = held.length >= 2 && held.every((k) => state.realms[k].attitude >= 60) && R.stability >= 55 && (R.legitimacy ?? 0) >= 55 && !state.flags.rebellion;
  e.peak = calm ? (e.peak || 0) + 1 : 0;
  if (e.peak >= 8 && state.turn - (e.peakOffered ?? -99) >= 48 && state.ruler.statusTier >= 6) {
    e.peakOffered = state.turn;
    queueEvent(state, 'risa_vrchol');
  }
  return news;
}

/** A held crown was lost to a revolt: the record goes, and the end of an empire is told. */
export function empireLost(state, key, wasEmpire) {
  const e = ensureEmpire(state);
  delete e.r[key];
  e.peak = 0;
  const def = EMPIRE_REALMS[key];
  e.lost = { name: def.name, gen: def.gen, loc: def.loc, turn: state.turn };
  if (wasEmpire || (state.milestones && state.milestones.empire !== undefined)) queueEvent(state, 'risa_rozpad');
}

/** What a held realm pays: its base, a little more when it is loyal, a little less when it is not. */
export function incomeFactor(attitude) {
  return attitude >= 60 ? 1.34 : attitude < 30 ? 0.6 : 1;
}

// ---------- text tokens ----------

/** Tokens for the realm the event is about: {emp.gen}, {emp.loc}, {emp.lord}… and for the whole empire. */
export function empireTokens(state) {
  const d = {};
  const lost = state.empire && state.empire.lost; // the crown that has just risen up (risa_rozpad)
  if (lost) Object.assign(d, { 'lost.name': lost.name, 'lost.gen': lost.gen, 'lost.loc': lost.loc });
  const held = heldKeys(state);
  if (!held.length || !state.realms) return d;
  const names = held.map((k) => EMPIRE_REALMS[k].name);
  d['empire.realms'] = names.join(' a ');
  d['empire.realmsGen'] = held.map((k) => EMPIRE_REALMS[k].gen).join(' a ');
  d['empire.yearsLabel'] = yearsLabel(empireYears(state));
  for (const k of held) {
    const lord = realmRec(state, k).lord;
    const title = EMPIRE_REALMS[k].lordTitle[lord.gender === 'female' ? 1 : 0];
    d[`elord.${k}`] = lord.name;
    d[`elord.${k}.title`] = title;
    d[`elord.${k}.Title`] = title[0].toUpperCase() + title.slice(1);
  }
  const ctx = state.eventContext || {};
  const key = ctx.realm && held.includes(ctx.realm) ? ctx.realm : held[0];
  const def = EMPIRE_REALMS[key];
  const rec = realmRec(state, key);
  const r = state.realms[key];
  const title = def.lordTitle[rec.lord.gender === 'female' ? 1 : 0];
  Object.assign(d, {
    'emp.name': def.name, 'emp.gen': def.gen, 'emp.dat': def.dat, 'emp.loc': def.loc, 'emp.Loc': def.loc[0].toUpperCase() + def.loc.slice(1), 'emp.ins': def.ins,
    'emp.adj': def.adj, 'emp.Adj': def.adj[0].toUpperCase() + def.adj.slice(1),
    'emp.lord': rec.lord.name, 'emp.lordTitle': title, 'emp.LordTitle': title[0].toUpperCase() + title.slice(1),
    'emp.mood': moodOf(r.attitude), 'emp.woe': def.woe,
  });
  // a sentence about what is brewing: a claimant at large, southern gold
  const plot = [];
  if (rec.pretender === 1) plot.push(`Mezi podpisy je i jméno ${claimantOf(state, key).name} — a to se v zemi dobře pamatuje.`);
  if (state.flags.risa_jih_nepritel) plot.push('Dopis nese cizí pečeť a za řádky se tuší jižní zlato.');
  d['emp.plot'] = plot.join(' ');
  d['pretender.name'] = claimantOf(state, key).name;
  return d;
}

/** Gender of the people in empire texts: {U:…|…} the lord of the Marches, {W:…|…} of the Wastes, {X:…|…} the lord of the realm in question, {Z:…|…} the claimant. */
export function empireGenders(state) {
  const g = {};
  const held = heldKeys(state);
  if (!held.length) return g;
  if (held.includes('east')) g.U = realmRec(state, 'east').lord.gender;
  if (held.includes('north')) g.W = realmRec(state, 'north').lord.gender;
  const ctx = state.eventContext || {};
  const key = ctx.realm && held.includes(ctx.realm) ? ctx.realm : held[0];
  g.X = realmRec(state, key).lord.gender;
  g.Z = claimantOf(state, key).gender;
  return g;
}
