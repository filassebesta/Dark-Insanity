import { SEASONS, TERRAIN_DEFS, clamp, randomName, randInt } from './data.js';
import { makeChronicleEntry } from './state.js';
import { EVENTS } from './events.js';

const TRAIT_MIN = 1;
const TRAIT_MAX = 10;
const GOLDEN_AGE_TARGET = 8; // consecutive turns of prosperity needed

export function interpolate(state, text) {
  const dict = {
    'ruler.name': state.ruler.name,
    'heir.name': state.heir.alive ? state.heir.name : 'nikdo',
    'spouse.name': state.spouse.alive ? state.spouse.name : 'nikdo',
    'chancellor.name': state.chancellor.name,
    'marshal.name': state.marshal.name,
    'spymaster.name': state.spymaster.name,
    'dynastyName': state.dynastyName,
  };
  return text.replace(/\{([\w.]+)\}/g, (m, key) => (key in dict ? dict[key] : m));
}

function clampTrait(value) {
  return Math.max(TRAIT_MIN, Math.min(TRAIT_MAX, value));
}

export function applyEffects(state, effects) {
  if (!effects) return;
  for (const key of Object.keys(effects)) {
    if (state.resources[key] === undefined) continue;
    state.resources[key] = clamp(state.resources[key] + effects[key]);
  }
}

function applyHiddenEffects(state, hidden) {
  if (!hidden) return;
  if (hidden.setFlag) state.flags[hidden.setFlag] = true;
  if (hidden.clearFlag) delete state.flags[hidden.clearFlag];
}

export function computeSuccessChance(state, choice) {
  let chance = choice.baseChance ?? 0.5;
  if (choice.traitKey) chance += (state.ruler.traits[choice.traitKey] || 0) * (choice.traitScale ?? 0.03);
  return Math.max(0.05, Math.min(0.95, chance));
}

export function previewVisibleEffects(choice) {
  if (choice.isRoll) return null; // hidden until resolved by design
  return choice.effects || {};
}

export function resolveChoice(state, event, choiceIndex) {
  const choice = event.choices[choiceIndex];
  let outcome = 'normal';
  let effects = choice.effects || {};
  let hiddenEffects = choice.hiddenEffects;
  let traitGained = choice.traitGain || null;
  let chronicleText = choice.chronicle || '';

  if (choice.isRoll) {
    const chance = computeSuccessChance(state, choice);
    const branch = Math.random() < chance ? choice.onSuccess : choice.onFailure;
    outcome = branch === choice.onSuccess ? 'success' : 'failure';
    effects = branch.effects || {};
    hiddenEffects = branch.hiddenEffects;
    traitGained = branch.traitGain || null;
    chronicleText = branch.chronicle || '';
  }

  applyEffects(state, effects);
  applyHiddenEffects(state, hiddenEffects);
  if (traitGained) {
    state.ruler.traits[traitGained] = clampTrait(state.ruler.traits[traitGained] + 1);
  }
  if (chronicleText) state.chronicle.push(makeChronicleEntry(state, interpolate(state, chronicleText)));
  state.usedEvents.push(event.id);

  return { outcome, effects, traitGained };
}

export function resolveRouteChoice(state, event, terrainKey) {
  const option = event.routeOptions.find((o) => o.terrainKey === terrainKey);
  const risk = TERRAIN_DEFS[terrainKey] ? TERRAIN_DEFS[terrainKey].baseRisk : 0.3;
  const danger = Math.random() < risk;
  const branch = danger ? option.onDanger : option.onSafe;
  applyEffects(state, branch.effects);
  applyHiddenEffects(state, branch.hiddenEffects);
  if (branch.chronicle) state.chronicle.push(makeChronicleEntry(state, interpolate(state, branch.chronicle)));
  state.usedEvents.push(event.id);
  return { danger, outcome: branch };
}

export function pickNextEvent(state) {
  const available = EVENTS.filter((e) => !state.usedEvents.includes(e.id))
    .filter((e) => !e.requires || e.requires(state));
  if (!available.length) return null;
  return available[randInt(0, available.length - 1)];
}

function processTurnEconomy(state) {
  const totalWealth = state.provinces.reduce((s, p) => s + (p.lost ? 0 : p.wealth), 0);
  const totalUnrest = state.provinces.reduce((s, p) => s + (p.lost ? 0 : p.unrest), 0);
  const goldIncome = 6 + Math.round(totalWealth / 25) - Math.round(state.resources.army / 12);
  const foodIncome = 5 + Math.round(totalWealth / 30) - Math.round(state.resources.army / 15);
  state.resources.gold = clamp(state.resources.gold + goldIncome);
  state.resources.food = clamp(state.resources.food + foodIncome);
  if (totalUnrest > 0) state.resources.stability = clamp(state.resources.stability - Math.round(totalUnrest / 40));
  if (state.resources.food <= 5) state.resources.stability = clamp(state.resources.stability - 5);
  return { goldIncome, foodIncome };
}

function ageCharacters(state) {
  state.ruler.age += 1;
  if (state.heir.alive) state.heir.age += 1;
  if (state.spouse.alive) state.spouse.age += 1;
  state.chancellor.age += 1;
  state.marshal.age += 1;
  state.spymaster.age += 1;
}

function checkNaturalDeath(state) {
  const age = state.ruler.age;
  if (age < 50) return false;
  const chance = Math.min(0.6, (age - 50) * 0.02);
  return Math.random() < chance;
}

function generateSuccessorHousehold(state) {
  const heirGender = Math.random() < 0.5 ? 'male' : 'female';
  const spouseGender = heirGender === 'male' ? 'female' : 'male';
  state.heir = {
    role: 'heir', name: randomName(heirGender), gender: heirGender,
    age: randInt(1, 6), loyalty: clamp(70 + randInt(-10, 10)), alive: true,
  };
  state.spouse = {
    role: 'spouse', name: randomName(spouseGender), gender: spouseGender,
    age: randInt(24, 36), loyalty: clamp(65 + randInt(-10, 10)), alive: true,
  };
}

function handleSuccession(state) {
  if (state.heir.alive) {
    const oldName = state.ruler.name;
    const newRulerName = state.heir.name;
    state.chronicle.push(makeChronicleEntry(state, `${oldName} umírá stářím. Korunu přebírá ${newRulerName}.`));
    state.ruler = {
      name: newRulerName,
      gender: state.heir.gender,
      age: state.heir.age,
      traits: { strength: 5, eloquence: 5, intelligence: 5, patience: 5 },
      statusTier: 5,
      alive: true,
    };
    state.generation += 1;
    generateSuccessorHousehold(state);
    state.pendingSuccessionCeremony = true;
    return true;
  }
  state.gameOver = {
    type: 'collapse',
    reason: 'dynasty-extinct',
    text: `${state.ruler.name} umírá bez žijícího dědice. Dynastie ${state.dynastyName} vymírá a království se hroutí do chaosu.`,
  };
  return false;
}

function updateGoldenAgeStreak(state) {
  const r = state.resources;
  const prosperous = r.stability >= 80 && r.gold >= 50 && r.food >= 50 && r.legitimacy >= 60;
  state.goldenAgeStreak = prosperous ? state.goldenAgeStreak + 1 : 0;
}

export function checkEndConditions(state) {
  if (state.gameOver) return state.gameOver;
  if (state.resources.stability <= 0) {
    return { type: 'collapse', reason: 'stability', text: 'Království se propadá do chaosu. Vaše vláda ztratila veškerou oporu a rozpadá se zevnitř.' };
  }
  const capital = state.provinces.find((p) => p.isCapital);
  const provincesLeft = state.provinces.filter((p) => !p.lost).length;
  if ((capital && capital.lost) || provincesLeft === 0) {
    return { type: 'conquest', text: 'Nepřátelská vojska obsadila vaše hlavní město. Vaše království padlo.' };
  }
  if (state.goldenAgeStreak >= GOLDEN_AGE_TARGET) {
    return { type: 'golden_age', text: 'Vaše vláda přinesla království dlouhotrvající prosperitu a mír — zlatý věk, na který budou kronikáři vzpomínat po staletí.' };
  }
  return null;
}

// Advances one round (season). Returns { turnSummary, event, successionOccurred, gameOver }.
export function advanceTurn(state) {
  state.turn += 1;
  state.seasonIndex = state.turn % SEASONS.length;
  if (state.seasonIndex === 0) state.year += 1;

  const { goldIncome, foodIncome } = processTurnEconomy(state);
  let successionOccurred = false;
  let deathCheckText = '';

  if (state.seasonIndex === 0) {
    ageCharacters(state);
    if (checkNaturalDeath(state)) {
      successionOccurred = handleSuccession(state);
      deathCheckText = ' Vládce zemřel přirozenou smrtí.';
    }
  }

  updateGoldenAgeStreak(state);

  const seasonLabel = SEASONS[state.seasonIndex];
  const turnSummary = `${seasonLabel} roku ${state.year}. Příjem: ${goldIncome >= 0 ? '+' : ''}${goldIncome} zlata, ${foodIncome >= 0 ? '+' : ''}${foodIncome} jídla.${deathCheckText}`;
  state.chronicle.push(makeChronicleEntry(state, turnSummary));

  const gameOver = checkEndConditions(state);
  if (gameOver) {
    state.gameOver = gameOver;
    return { turnSummary, event: null, successionOccurred, gameOver };
  }

  const event = pickNextEvent(state);
  state.currentEvent = event ? event.id : null;
  return { turnSummary, event, successionOccurred, gameOver: null };
}
