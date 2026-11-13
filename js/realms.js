// The world beyond the kingdom: neighbouring realms with rulers of their own.
// They were only war and trade destinations before; now each has a ruler who
// ages and dies, a strength and a mood toward the player's house. A king can
// beat a neighbour into paying tribute and, once it is weak enough, take its
// crown as well (personal union); two foreign crowns make an emperor.
//
// state.realms = { <key>: { ruler: {name, gender, age}, power, attitude, owner: null | 'player', since, changed?, claimant? } }
// No DOM here — world.js draws the world map, war.js fights the wars.

import { clamp, randInt, randomName } from './data.js';
import { makeChronicleEntry } from './state.js';

// kind: what sort of land it is · title: the ruler's title [male, female]
// conquerable: a crown that can be taken; the southern empire is too big to swallow
export const REALMS = {
  east: {
    name: 'Východní marky', gen: 'Východních marek', kind: 'Markské království', title: ['král', 'královna'],
    conquerable: true, income: 3,
    text: 'Bojovné království za Sokolím hvozdem. Markrabata, která ho drží pohromadě, poslouchají svého panovníka jen v boji — a v boji jsou nejlepší.',
  },
  north: {
    name: 'Severní pustiny', gen: 'Severních pustin', kind: 'Kmenový svaz', title: ['velký náčelník', 'velká náčelnice'],
    conquerable: true, income: 1,
    text: 'Studené kraje za horami. Kmeny se sjednocují jen pod silným náčelníkem a rozpadají se, jakmile zemře.',
  },
  south: {
    name: 'Jižní říše', gen: 'Jižní říše', kind: 'Říše za mořem', title: ['císař', 'císařovna'],
    conquerable: false, income: 0,
    text: 'Bohatá a stará říše za Šedým mořem. Obchoduje se všemi, bojuje rukama žoldnéřů a dobýt se nedá.',
  },
};

export const HOME_REALM = {
  name: 'Vlčí Úděl', gen: 'Vlčího Údělu', kind: 'Tvé království',
  text: 'Království mezi Šedým mořem, Železným hřebenem a Sokolím hvozdem. Pět krajů, hlavní město Vlčí Úděl.',
};

/** Creates the realms in a new game or an older save. */
export function ensureRealms(state) {
  if (state.realms) return state.realms;
  state.realms = {};
  for (const key of Object.keys(REALMS)) {
    const g = Math.random() < 0.8 ? 'male' : 'female';
    state.realms[key] = {
      ruler: { name: randomName(g), gender: g, age: randInt(30, 60) },
      power: key === 'south' ? randInt(80, 90) : randInt(55, 70),
      attitude: randInt(40, 55),
      owner: null,
    };
  }
  return state.realms;
}

export function realmTitle(key, gender) {
  return REALMS[key].title[gender === 'female' ? 1 : 0];
}

/** "král Ctibor" / "velká náčelnice Vlasta" */
export function realmRulerLabel(state, key) {
  const r = ensureRealms(state)[key];
  return `${realmTitle(key, r.ruler.gender)} ${r.ruler.name}`;
}

export function ownsRealm(state, key) {
  return !!(state.realms && state.realms[key] && state.realms[key].owner === 'player');
}

export function ownedRealms(state) {
  return Object.keys(REALMS).filter((k) => ownsRealm(state, k));
}

/** How the war targets scale with a realm's strength (1 at power 60). */
export function realmStrength(state, key) {
  const r = ensureRealms(state)[key];
  return r ? 0.5 + r.power / 120 : 1;
}

/** A king's victory: tribute while the realm is strong, its crown once it is broken. */
export function beatRealm(state, key) {
  const r = ensureRealms(state)[key];
  const def = REALMS[key];
  if (!r || r.owner) return null;
  r.power = clamp(r.power - 25);
  r.attitude = clamp(r.attitude - 15);
  if (state.scenario === 'panovnik' && def.conquerable && r.power <= 25) {
    r.owner = 'player';
    r.since = state.turn;
    r.attitude = 30;
    const old = realmRulerLabel(state, key);
    const conquered = ownedRealms(state).length;
    let text = `Koruna ${def.gen} padla! ${old[0].toUpperCase()}${old.slice(1)} se poddal${r.ruler.gender === 'female' ? 'a' : ''} a ${state.ruler.name} teď nosí i korunu ${def.gen}.`;
    // two foreign crowns over one head make an empire
    if (conquered >= 2 && state.ruler.statusTier < 6) {
      state.ruler.statusTier = 6;
      state.milestones = state.milestones || {};
      state.milestones.empire = state.turn;
      // the imperial chapter card goes first (events_career.js)
      if (state.pendingEvent) (state.eventQueue = state.eventQueue || []).unshift(state.pendingEvent);
      state.pendingEvent = 'kapitola_cisar';
      text += ` Tři koruny na jedné hlavě: ${state.ruler.name} ${state.ruler.gender === 'female' ? 'se dává korunovat císařovnou' : 'se dává korunovat císařem'}.`;
    }
    return { conquered: true, text };
  }
  return { conquered: false };
}

/** Yearly: foreign rulers age and die, strength returns, held crowns may rise up. Returns news lines. */
export function ageRealms(state) {
  const news = [];
  const realms = ensureRealms(state);
  for (const [key, r] of Object.entries(realms)) {
    const def = REALMS[key];
    if (r.owner === 'player') {
      // a conquered crown: pays every season (processRealms), simmers every year
      r.attitude = clamp(r.attitude + (r.attitude < 45 ? 2 : 0) + ((state.resources.legitimacy || 50) >= 60 ? 1 : -1));
      if (r.attitude < 25 && Math.random() < 0.25) {
        r.owner = null;
        r.power = 45;
        r.attitude = 15;
        const g = Math.random() < 0.8 ? 'male' : 'female';
        r.ruler = { name: randomName(g), gender: g, age: randInt(25, 40) };
        const t = `${def.name} povstaly a zvolily si vlastního vládce: ${realmRulerLabel(state, key)}. Cizí koruna je ztracena.`;
        news.push(t);
        state.chronicle.push(makeChronicleEntry(state, t));
        if (state.ruler.statusTier === 6 && ownedRealms(state).length < 2) state.ruler.statusTier = 5;
      }
      continue;
    }
    r.ruler.age += 1;
    // a realm at war with the player cannot rebuild its strength: the campaign decides what it is left with
    if (!(state.war && state.war.target === key)) r.power = clamp(r.power + (r.power < 60 ? 2 : randInt(-1, 1)));
    r.attitude = clamp(r.attitude + (r.attitude > 50 ? -1 : r.attitude < 40 ? 1 : 0));
    const death = r.ruler.age < 55 ? 0.01 : Math.min(0.4, (r.ruler.age - 52) * 0.03);
    if (Math.random() < death) {
      const old = realmRulerLabel(state, key);
      const she = r.ruler.gender === 'female';
      const g = Math.random() < 0.75 ? 'male' : 'female';
      r.ruler = { name: randomName(g), gender: g, age: randInt(20, 45) };
      r.changed = state.turn; // a new ruler sits uneasily for a while (events_foreign.js: a claimant comes to the king)
      r.attitude = clamp(Math.round((r.attitude + 48) / 2));
      if (key === 'north') r.power = clamp(r.power - 10); // the tribes fall apart without the old chief
      const t = `Zpráva z ciziny: ${def.name} — zemřel${she ? 'a' : ''} ${old}. Vládne ${realmRulerLabel(state, key)}.`;
      news.push(t);
      state.chronicle.push(makeChronicleEntry(state, t));
    }
  }
  return news;
}

/** Every season: what the foreign crowns held by the player pay. Returns the gold. */
export function realmIncome(state) {
  return ownedRealms(state).reduce((sum, k) => sum + REALMS[k].income, 0);
}
