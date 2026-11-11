// Static definitions shared by state/engine/ui.

import { ICONS } from './icons.js';

export const SEASONS = ['Jaro', 'Léto', 'Podzim', 'Zima'];

export const RESOURCE_DEFS = [
  { key: 'gold', label: 'Zlato', icon: ICONS.gold, critical: 10 },
  { key: 'food', label: 'Jídlo', icon: ICONS.food, critical: 15 },
  { key: 'army', label: 'Vojsko', icon: ICONS.army, critical: 10 },
  { key: 'stability', label: 'Stabilita', icon: ICONS.stability, critical: 15 },
  { key: 'legitimacy', label: 'Legitimita', icon: ICONS.legitimacy, critical: 15, labels: { slechtic: 'Nárok na trůn' } },
  { key: 'faith', label: 'Víra', icon: ICONS.faith, critical: 10 },
  { key: 'prestige', label: 'Prestiž', icon: ICONS.prestige, critical: 5 },
  // Šlechtic only: the king's goodwill; at zero the king takes the estate away
  { key: 'favor', label: 'Přízeň krále', icon: ICONS.favor, critical: 15 },
];

/** Resource label as the current scenario calls it (legitimacy = claim to the throne for a noble). */
export function resourceLabel(def, scenario) {
  return (def.labels && def.labels[scenario]) || def.label;
}

/** Resources that exist in this game (favour only for the noble). */
export function activeResourceDefs(state) {
  return RESOURCE_DEFS.filter((d) => state.resources[d.key] !== undefined);
}

export const TRAIT_DEFS = [
  { key: 'strength', label: 'Síla', icon: ICONS.strength },
  { key: 'eloquence', label: 'Výřečnost', icon: ICONS.eloquence },
  { key: 'intelligence', label: 'Inteligence', icon: ICONS.intelligence },
  { key: 'patience', label: 'Trpělivost', icon: ICONS.patience },
];

// Ruler status tiers — see docs/visual-prompts.md section 4b. Panovník
// scenario starts at tier 5; other scenarios (once built) will start lower
// and can climb this same ladder.
export const STATUS_TIERS = [
  null,
  'Sedlák',
  'Svobodník',
  'Drobný šlechtic',
  'Významný šlechtic',
  'Král',
];
export const STATUS_TIERS_FEMALE = [null, 'Selka', 'Svobodnice', 'Drobná šlechtična', 'Významná šlechtična', 'Královna'];

export function tierTitle(tier, gender) {
  return (gender === 'female' ? STATUS_TIERS_FEMALE : STATUS_TIERS)[tier];
}

// Šlechtic scenario: the realm is shared with the crown and three rival houses.
export const NOBLE_HOUSES = [
  { id: 'brana', name: 'páni z Bílé Brány', short: 'Bílá Brána', seat: 'brodna',
    text: 'Nejbohatší rod v zemi. Drží obilnici Brodnou, půjčují králi peníze a za úsměvem skrývají nůž.' },
  { id: 'rudi', name: 'Rudí páni z Hřebene', short: 'Rudí', seat: 'zelezny-hreben',
    text: 'Válečnický rod z hor. Jejich kovárny zbrojí půl království a jejich trpělivost je krátká jako jejich meče.' },
  { id: 'sokolove', name: 'Sokolové', short: 'Sokolové', seat: 'sokoli-hvozd',
    text: 'Hrdý pohraniční rod, který stráží hranici s Marcemi. Věrní, prchliví a nebezpeční, když se cítí uraženi.' },
];
export const NOBLE_HOME = 'pobrezni-mark';

export const TERRAIN_DEFS = {
  forest: { key: 'forest', label: 'Lesní stezka', icon: ICONS.forest, riskLabel: 'přepadení bandity', baseRisk: 0.45 },
  mountain: { key: 'mountain', label: 'Horský průsmyk', icon: ICONS.mountain, riskLabel: 'sesuv a únava', baseRisk: 0.25 },
  traderoute: { key: 'traderoute', label: 'Obchodní cesta', icon: ICONS.traderoute, riskLabel: 'zdržení a mýto', baseRisk: 0.10 },
};

// Placeholder province names/heraldry — real lore/names are a future spec
// part, these just let the map system function end-to-end for now.
export const PROVINCE_TEMPLATES = [
  { id: 'capital', name: 'Vlčí Úděl (hlavní město)', isCapital: true },
  { id: 'brodna', name: 'Brodná' },
  { id: 'sokoli-hvozd', name: 'Sokolí Hvozd' },
  { id: 'zelezny-hreben', name: 'Železný Hřeben' },
  { id: 'pobrezni-mark', name: 'Pobřežní Mark' },
];

export const MALE_NAMES = ['Bořivoj', 'Vratislav', 'Jaromír', 'Přemysl', 'Zbyněk', 'Ctibor', 'Slavomír', 'Miloš', 'Oldřich', 'Jindřich', 'Kunrát', 'Smil'];
export const FEMALE_NAMES = ['Ludmila', 'Božena', 'Vlasta', 'Drahomíra', 'Milada', 'Kazimíra', 'Radka', 'Anežka'];

export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pickRandom(arr) {
  return arr[randInt(0, arr.length - 1)];
}

export function randomName(gender) {
  return gender === 'female' ? pickRandom(FEMALE_NAMES) : pickRandom(MALE_NAMES);
}

export function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}
