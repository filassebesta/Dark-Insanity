// Static definitions shared by state/engine/ui.
// Icons are emoji placeholders (tinted sepia via CSS) standing in for the
// hand-drawn icon sheets described in docs/visual-prompts.md — swap the
// `.icon` rendering in ui.js once real cropped assets exist.

export const SEASONS = ['Jaro', 'Léto', 'Podzim', 'Zima'];

export const RESOURCE_DEFS = [
  { key: 'gold', label: 'Zlato', icon: '🪙', critical: 10 },
  { key: 'food', label: 'Jídlo', icon: '🌾', critical: 15 },
  { key: 'army', label: 'Vojsko', icon: '⚔️', critical: 10 },
  { key: 'stability', label: 'Stabilita', icon: '🏛️', critical: 15 },
  { key: 'legitimacy', label: 'Legitimita', icon: '👑', critical: 15 },
  { key: 'faith', label: 'Víra', icon: '⛪', critical: 10 },
  { key: 'prestige', label: 'Prestiž', icon: '🎖️', critical: 5 },
];

export const TRAIT_DEFS = [
  { key: 'strength', label: 'Síla', icon: '💪' },
  { key: 'eloquence', label: 'Výřečnost', icon: '🗣️' },
  { key: 'intelligence', label: 'Inteligence', icon: '📖' },
  { key: 'patience', label: 'Trpělivost', icon: '⏳' },
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
  forest: { key: 'forest', label: 'Lesní stezka', icon: '🌲', riskLabel: 'přepadení bandity', baseRisk: 0.45 },
  mountain: { key: 'mountain', label: 'Horský průsmyk', icon: '⛰️', riskLabel: 'sesuv a únava', baseRisk: 0.25 },
  traderoute: { key: 'traderoute', label: 'Obchodní cesta', icon: '🛤️', riskLabel: 'zdržení a mýto', baseRisk: 0.10 },
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
