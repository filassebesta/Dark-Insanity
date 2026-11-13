// The council: before a decision, advisers say which choice they would take.
// Each judges the choices through their own field (and their own interest),
// never with numbers — what a choice brings stays hidden. A loyal adviser
// advises honestly; a disloyal one may steer the ruler toward their own gain
// or straight into trouble. Personalities (court.js QUIRKS) tilt the advice.

import { computeSuccessChance } from './engine.js';

const ADVISERS = ['chancellor', 'marshal', 'spymaster', 'spouse'];

// how much each adviser cares about each resource
const FOCUS = {
  chancellor: { gold: 2, food: 1.6, stability: 1.2, legitimacy: 1, favor: 1.2, army: 0.4, faith: 0.5, prestige: 0.5 },
  marshal: { army: 2, prestige: 1.4, stability: 1, gold: 0.5, food: 0.8, legitimacy: 0.6, favor: 0.6, faith: 0.3 },
  spymaster: { stability: 1.4, legitimacy: 1.3, favor: 1.5, prestige: 0.8, gold: 0.8, army: 0.6, food: 0.6, faith: 0.5 },
  spouse: { prestige: 1.3, faith: 1.2, legitimacy: 1.2, stability: 1, favor: 1, gold: 0.8, food: 0.8, army: 0.6 },
};

const SAY = {
  chancellor: {
    sure: ['Počítal{|a} jsem to dvakrát a vychází to jen jedním způsobem.', 'Pokladna mluví jasně.', 'Čísla nelžou, lidé ano.'],
    unsure: ['Je to vážení na vratkých vahách, ale přikláněl{|a} bych se k jednomu.', 'Žádná cesta není levná. Ta nejméně drahá je tahle.'],
  },
  marshal: {
    sure: ['Tohle se řeší rázně.', 'Vojáci by věděli, co dělat.', 'Váhání stojí víc životů než meč.'],
    unsure: ['Ani jedna cesta se mi nelíbí, ale volil{|a} bych tuhle.', 'Kdybych měl{|a} vsadit vlastní krk, vsadil{|a} bych ho sem.'],
  },
  spymaster: {
    sure: ['Vím, co se šeptá. A šeptá se jen o jednom řešení.', 'Mám své lidi všude. Tohle je správná cesta.', 'Věř mi. Nebo aspoň mým uším.'],
    unsure: ['Moji lidé nevědí všechno. Ale tohle se zdá nejbezpečnější.', 'Ve tmě se chodí opatrně. Já bych volil{|a} tuhle cestu.'],
  },
  spouse: {
    sure: ['Znám tě. A vím, co by bylo správné.', 'Jde o jméno rodu. Rozhodni se takhle.', 'Poslechni srdce i rozum. Oba říkají totéž.'],
    unsure: ['Nevím, jestli je tu dobrá cesta. Ale tahle je nejméně špatná.', 'Je to těžké. Já bych volil{|a} tohle.'],
  },
};

// in the village the same seats are held by the reeve, the smith and the innkeeper
const SAY_VILLAGE = {
  chancellor: {
    sure: ['Ve vsi to chodí jen jedním způsobem.', 'Obecní kniha mluví jasně.', 'Počítal{|a} jsem to dvakrát.'],
    unsure: ['Není to snadné, ale přikláněl{|a} bych se k jednomu.', 'Žádná cesta není levná. Tahle je nejlevnější.'],
  },
  marshal: {
    sure: ['Tohle se řeší rázně.', 'Pevná ruka a hotovo.', 'Kdo váhá, ten na to doplatí.'],
    unsure: ['Ani jedno se mi nelíbí, ale volil{|a} bych tohle.', 'Kdybych měl{|a} vsadit vlastní krk, vsadil{|a} bych ho sem.'],
  },
  spymaster: {
    sure: ['U džbánu se o ničem jiném nemluví. Tohle je správně.', 'Vím, co si lidi šeptají.', 'Věř mi. Nebo aspoň mým uším.'],
    unsure: ['Hosté nevědí všechno. Ale tohle se zdá nejbezpečnější.', 'Potichu a opatrně. Já bych volil{|a} tuhle cestu.'],
  },
};

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// how good a branch looks to an adviser (role) with a personality (quirk)
// what is scarce matters more, what overflows matters less — and more soldiers are more mouths
function need(state, k) {
  const r = state.resources || {};
  const have = r[k];
  let m = have === undefined ? 1 : have < 20 ? 2 : have < 35 ? 1.4 : have > 80 ? 0.4 : 1;
  if (k === 'army' && (r.food ?? 50) < 25) m = -0.5; // an army that is already starving should not grow
  if (k === 'army' && (r.gold ?? 50) < 10) m = Math.min(m, 0.3);
  return m;
}

function branchValue(state, branch, role, quirk) {
  if (!branch) return 0;
  const focus = FOCUS[role];
  let v = 0;
  for (const [k, val] of Object.entries(branch.effects || {})) {
    const n = need(state, k);
    // a gain counts by how much it is needed; a loss always hurts in full — except soldiers nobody can feed
    let w = (focus[k] ?? 0.6) * (val > 0 || n < 0 ? n : Math.max(1, n));
    if (quirk === 'chamtivy' && k === 'gold') w += 1.5;
    if (quirk === 'zbozny' && k === 'faith') w += 1.2;
    if (quirk === 'ctizadostivy' && k === 'prestige') w += 1;
    v += val * w;
  }
  for (const fx of Object.values(branch.provinceEffects || {})) {
    v += (fx.loyalty || 0) * 0.4 - (fx.unrest || 0) * 0.4 + (fx.wealth || 0) * 0.3
      + (fx.garrison || 0) * (role === 'marshal' ? 0.5 : 0.2) - (fx.lost ? 40 : 0);
  }
  for (const [key, fx] of Object.entries(branch.courtEffects || {})) {
    const who = key === 'target' ? state.eventContext?.role : key;
    // everybody cares about themselves first
    if (who === role) v += (fx.loyalty || 0) * 0.9;
  }
  for (const fx of Object.values(branch.houseEffects || {})) {
    v += (fx.attitude || 0) * 0.3 + (fx.ally ? 10 : 0) - (fx.power || 0) * 0.2;
  }
  if (branch.noble) v += (branch.noble.secrets || 0) * (role === 'spymaster' ? 6 : 3) + (branch.noble.plot || 0) * (role === 'spymaster' ? 3 : -2);
  // a debt is cheap today and dear tomorrow, and the steward knows it best
  if (/loan|dluh/.test(branch.hiddenEffects?.setFlag || '')) v -= role === 'chancellor' ? 30 : 12;
  if (branch.setTier) v += 25;
  if (branch.endGame === 'crowned' || branch.endGame === 'ennobled') v += 80;
  else if (branch.endGame) v -= 120;
  if (branch.replaceCourt && state.eventContext?.role === role) v -= 30; // nobody votes for their own dismissal
  return v;
}

function choiceValue(state, choice, role, quirk) {
  if (!choice.isRoll) return branchValue(state, choice, role, quirk) + (quirk === 'opatrny' ? 4 : 0);
  const p = computeSuccessChance(state, choice);
  const ev = p * branchValue(state, choice.onSuccess, role, quirk) + (1 - p) * branchValue(state, choice.onFailure, role, quirk);
  if (quirk === 'opatrny') return ev - 6 * (1 - p);
  if (quirk === 'odvazny') return ev + 6;
  return ev;
}

/**
 * Up to two advisers with an opinion on this event.
 * Returns [{ role, person, index, sure, line }], index = position in event.choices.
 */
export function councilAdvice(state, event) {
  if (!event || event.type === 'route' || !event.choices || event.choices.length < 2) return [];
  if (/^(quiet_season|n_klidne_obdobi|s_klidne_obdobi)$/.test(event.id)) return [];
  const open = event.choices.map((c, i) => i).filter((i) => !event.choices[i].requires || event.choices[i].requires(state));
  if (open.length < 2) return [];
  const opinions = [];
  for (const role of ADVISERS) {
    const c = state[role];
    if (!c || c.alive === false) continue;
    // an adviser who is the subject of the event keeps quiet about it
    if (state.eventContext?.role === role && event.choices.some((ch) => ch.replaceCourt)) continue;
    const scores = open.map((i) => ({ i, v: choiceValue(state, event.choices[i], role, c.quirk) }));
    scores.sort((a, b) => b.v - a.v);
    const spread = scores[0].v - scores[scores.length - 1].v;
    if (spread < 3) continue;
    const seed = hash(`${event.id}|${state.turn}|${role}|${c.name}`);
    let pick = scores[0].i;
    // a disloyal adviser may advise against the realm: the choice that serves them, or the worst one
    if (c.quirk !== 'oddany' && c.loyalty < 45) {
      const mislead = ((45 - c.loyalty) / 45) * (c.quirk === 'ctizadostivy' ? 1.3 : 1);
      if ((seed % 1000) / 1000 < mislead) pick = scores[scores.length - 1].i;
    }
    const sure = scores[0].v - (scores[1] ? scores[1].v : 0) > 6;
    const pool = ((state.scenario === 'sedlak' && SAY_VILLAGE[role]) || SAY[role])[sure ? 'sure' : 'unsure'];
    const line = pool[(seed >>> 10) % pool.length].replace(/\{([^|{}]*)\|([^|{}]*)\}/g, (m, a, b) => (c.gender === 'female' ? b : a));
    opinions.push({ role, person: c, index: pick, sure, line, weight: spread });
  }
  return opinions.sort((a, b) => b.weight - a.weight).slice(0, 2);
}
