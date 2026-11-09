// Static definitions shared by state/engine/ui.

import { ICONS } from './icons.js';

export const SEASONS = ['Jaro', 'Léto', 'Podzim', 'Zima'];

export const RESOURCE_DEFS = [
  { key: 'gold', label: 'Zlato', icon: ICONS.gold, critical: 10 },
  { key: 'food', label: 'Jídlo', icon: ICONS.food, critical: 15 },
  { key: 'army', label: 'Vojsko', icon: ICONS.army, critical: 10 },
  { key: 'stability', label: 'Stabilita', icon: ICONS.stability, critical: 15 },
  { key: 'legitimacy', label: 'Legitimita', icon: ICONS.legitimacy, critical: 15 },
  { key: 'faith', label: 'Víra', icon: ICONS.faith, critical: 10 },
  { key: 'prestige', label: 'Prestiž', icon: ICONS.prestige, critical: 5 },
];

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

export const MALE_NAMES = ['Bořivoj', 'Vratislav', 'Jaromír', 'Přemysl', 'Zbyněk', 'Ctibor', 'Slavomír', 'Miloš'];
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
