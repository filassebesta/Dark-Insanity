// Static definitions shared by state/engine/ui.

import { ICONS } from './icons.js';

export const SEASONS = ['Jaro', 'Léto', 'Podzim', 'Zima'];

export const RESOURCE_DEFS = [
  { key: 'gold', label: 'Zlato', icon: ICONS.gold, critical: 10, labels: { sedlak: 'Groše' } },
  { key: 'food', label: 'Jídlo', icon: ICONS.food, critical: 15, labels: { sedlak: 'Zásoby' } },
  { key: 'army', label: 'Vojsko', icon: ICONS.army, critical: 10, labels: { sedlak: 'Čeleď' } },
  { key: 'stability', label: 'Stabilita', icon: ICONS.stability, critical: 15, labels: { sedlak: 'Grunt' } },
  { key: 'legitimacy', label: 'Legitimita', icon: ICONS.legitimacy, critical: 15, labels: { slechtic: 'Nárok na trůn' } },
  { key: 'faith', label: 'Víra', icon: ICONS.faith, critical: 10 },
  { key: 'prestige', label: 'Prestiž', icon: ICONS.prestige, critical: 5, labels: { sedlak: 'Pověst' } },
  // Šlechtic: the king's goodwill, Sedlák: the lord's; at zero the land is taken away
  { key: 'favor', label: 'Přízeň krále', icon: ICONS.favor, critical: 15, labels: { sedlak: 'Přízeň vrchnosti', slechtic: 'Přízeň koruny' } },
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
  'Císař', // a king who holds two foreign crowns as well (realms.js)
];
export const STATUS_TIERS_FEMALE = [null, 'Selka', 'Svobodnice', 'Drobná šlechtična', 'Významná šlechtična', 'Královna', 'Císařovna'];

export function tierTitle(tier, gender) {
  return (gender === 'female' ? STATUS_TIERS_FEMALE : STATUS_TIERS)[tier];
}

// The great houses of the realm: they share the land with the crown (Šlechtic) and bow to it later (Panovník).
//   seat    the province their power sits in (the three old houses own it outright; the five newer ones hold a "držba"
//           inside somebody else's land: `hold` says where on the painted map and what it is called)
//   trait   one line about what the house is known for · focus   its mechanical speciality (houses.js FOCUS)
//   troops  weights of spearmen / archers / horsemen in its retinue (sum 1) — read by the war system
//   muster  men the retinue sends to a war at full strength; the real number scales with the house's power (houses.js houseMuster)
//   boon    what a friendly house (ally or in-law) brings every year · bonds   starting relations with the other houses (-100…100)
//   colors  [field, charge] of the coat of arms drawn in crests.js
export const NOBLE_HOUSES = [
  { id: 'brana', name: 'páni z Bílé Brány', gen: 'pánů z Bílé Brány', short: 'Bílá Brána', seat: 'brodna',
    text: 'Nejbohatší rod v zemi. Drží obilnici Brodnou, půjčují králi peníze a za úsměvem skrývají nůž.',
    trait: 'Lichváři a žoldnéři', focus: 'finance',
    troops: { spear: 0.6, archer: 0.25, horse: 0.15 }, muster: 12, boon: { gold: 2 },
    bonds: { rudi: -15, ricane: -40, soudci: 20 }, colors: ['#e9e2cd', '#2f4f7a'] },
  { id: 'rudi', name: 'Rudí páni z Hřebene', gen: 'Rudých pánů z Hřebene', short: 'Rudí', seat: 'zelezny-hreben',
    text: 'Válečnický rod z hor. Jejich kovárny zbrojí půl království a jejich trpělivost je krátká jako jejich meče.',
    trait: 'Válečníci a kováři', focus: 'war',
    troops: { spear: 0.5, archer: 0.05, horse: 0.45 }, muster: 22, boon: { stability: 1, prestige: 1 },
    bonds: { sokolove: -30, kriz: -25, pustopolci: 25 }, colors: ['#9b2d20', '#d6d3c8'] },
  { id: 'sokolove', name: 'Sokolové', gen: 'Sokolů', short: 'Sokolové', seat: 'sokoli-hvozd',
    text: 'Hrdý pohraniční rod, který stráží hranici s Marcemi. Věrní, prchliví a nebezpeční, když se cítí uraženi.',
    trait: 'Pohraničníci a sokolníci', focus: 'border',
    troops: { spear: 0.15, archer: 0.4, horse: 0.45 }, muster: 16, boon: { stability: 1 },
    bonds: { jelenove: -35, pustopolci: 30 }, colors: ['#2b5578', '#e4dcc2'] },
  { id: 'jelenove', name: 'Jelenové z Doubravy', gen: 'Jelenů z Doubravy', short: 'Jelenové', seat: 'sokoli-hvozd',
    text: 'Lesní rod, který žije ze dřeva, zvěře a smoly. Jejich hájenky jsou schované v hvozdu, kam se cizí vojsko bojí vstoupit, a jejich lučištníci netrefí vedle.',
    trait: 'Lesní páni: dřevo, lov, lučištníci', focus: 'forest',
    troops: { spear: 0.3, archer: 0.6, horse: 0.1 }, muster: 12, boon: { food: 3 },
    bonds: { ricane: 25, kriz: 10 },
    hold: { name: 'Doubrava', kind: 'Lesní hájovna', at: [1042, 452] }, colors: ['#3f5f35', '#d8b24a'] },
  { id: 'kriz', name: 'páni z Kamenného Kříže', gen: 'pánů z Kamenného Kříže', short: 'Kamenný Kříž', seat: 'zelezny-hreben',
    text: 'Zbožný rod, který po generace dává církvi syny a klášteru dary. Opatství na jejich panství drží zpověď, desátky i víru půl země.',
    trait: 'Církevní rod: víra, desátky, kázání', focus: 'church',
    troops: { spear: 0.65, archer: 0.1, horse: 0.25 }, muster: 9, boon: { faith: 3 },
    bonds: { soudci: 35 },
    hold: { name: 'Kamenný Kříž', kind: 'Klášter na hoře', at: [862, 150] }, colors: ['#5c3b72', '#dcc27a'] },
  { id: 'ricane', name: 'Říční páni z Přívozu', gen: 'Říčních pánů z Přívozu', short: 'Přívozští', seat: 'brodna',
    text: 'Plavci a výběrčí mýta. Tři přívozy, dvě věže na řece a nepsané právo, že žádný vůz s obilím nepřejede Brodnici bez jejich požehnání.',
    trait: 'Říční rod: mýta, plavba, trh', focus: 'river',
    troops: { spear: 0.5, archer: 0.35, horse: 0.15 }, muster: 10, boon: { gold: 2 },
    bonds: { soudci: 10 },
    hold: { name: 'Přívoz', kind: 'Říční věž a přívoz', at: [740, 566] }, colors: ['#2a6674', '#dfe6dc'] },
  { id: 'pustopolci', name: 'Jezdci z Pustého Pole', gen: 'Jezdců z Pustého Pole', short: 'Pustopolští', seat: 'brodna',
    text: 'Potomci stepních jezdců, které před sto lety přivedl do země starý král jako žoldnéře a nechal je tady. Chovají koně rychlejší než vítr a nikdy úplně nezapomněli, že na východě leží step.',
    trait: 'Jezdecký rod: koně, ostrá jízda', focus: 'steppe',
    troops: { spear: 0.05, archer: 0.3, horse: 0.65 }, muster: 18, boon: { prestige: 2, food: 1 },
    bonds: { kriz: -10 },
    hold: { name: 'Pusté Pole', kind: 'Stanový tábor a ohrady', at: [905, 626] }, colors: ['#c4973c', '#2d2118'] },
  { id: 'soudci', name: 'páni z Právova', gen: 'pánů z Právova', short: 'Právovští', seat: 'capital',
    text: 'Rod písařů a soudců, kteří znají zemské právo zpaměti a mají starší listiny než sám trůn. Co se jim nehodí, to nepopírají. Oni to jen prohlásí za nezákonné.',
    trait: 'Rod starého práva: soudy, listiny', focus: 'law',
    troops: { spear: 0.7, archer: 0.2, horse: 0.1 }, muster: 8, boon: { legitimacy: 2 },
    bonds: {},
    hold: { name: 'Právov', kind: 'Zemský soudní dvůr', at: [566, 452] }, colors: ['#2c2b36', '#d9d6cc'] },
];
export const NOBLE_HOME = 'pobrezni-mark';

// Sedlák scenario: a farm in the village of Lipnice, on the lands of the lords of Bílá Brána.
export const PEASANT_HOME = { village: 'Lipnice', province: 'brodna', house: 'brana' };

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
  { id: 'pobrezni-mark', name: 'Pobřežní marka' },
];

export const MALE_NAMES = ['Bořivoj', 'Vratislav', 'Jaromír', 'Přemysl', 'Zbyněk', 'Ctibor', 'Slavomír', 'Miloš', 'Oldřich', 'Jindřich', 'Kunrát', 'Smil',
  'Václav', 'Boleslav', 'Soběslav', 'Spytihněv', 'Břetislav', 'Vladislav', 'Ota', 'Hynek', 'Hroznata', 'Bohuslav', 'Diviš', 'Mstiš',
  'Kojata', 'Bušek', 'Ojíř', 'Zdislav', 'Beneš', 'Vok', 'Jan', 'Petr', 'Mikuláš', 'Jakub', 'Matěj', 'Ondřej', 'Prokop', 'Vítek', 'Lukáš', 'Štěpán'];
export const FEMALE_NAMES = ['Ludmila', 'Božena', 'Vlasta', 'Drahomíra', 'Milada', 'Kazimíra', 'Radka', 'Anežka',
  'Dobroslava', 'Zdislava', 'Jitka', 'Kunhuta', 'Eliška', 'Markéta', 'Dorota', 'Kateřina', 'Mlada', 'Bohuslava', 'Ratibora', 'Svatava',
  'Přibyslava', 'Dobromila', 'Hedvika', 'Johana', 'Alžběta', 'Marta', 'Barbora', 'Dorotka', 'Libuše', 'Juta', 'Ofka', 'Žofie', 'Bláža', 'Neža', 'Machna', 'Ludka'];

export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pickRandom(arr) {
  return arr[randInt(0, arr.length - 1)];
}

export function randomName(gender) {
  return gender === 'female' ? pickRandom(FEMALE_NAMES) : pickRandom(MALE_NAMES);
}

/** "1 groš", "3 groše", "5 grošů". */
export function grosLabel(n) {
  const a = Math.abs(n);
  return `${n} ${a === 1 ? 'groš' : a >= 2 && a <= 4 ? 'groše' : 'grošů'}`;
}

/** "1 rok", "3 roky", "5 let"; a newborn is "pár měsíců". */
export function yearsLabel(n) {
  if (n <= 0) return 'pár měsíců';
  if (n === 1) return '1 rok';
  if (n >= 2 && n <= 4) return `${n} roky`;
  return `${n} let`;
}

/**
 * Stock resources can grow past 100 (a full treasury, a big granary, a large host); the rest are gauges of 0–100.
 */
export const RESOURCE_CAP = { gold: 999, food: 999, army: 250 };

/** Clamps a resource value to its own ceiling: clampRes('gold', 340) stays 340, clampRes('faith', 140) is 100. */
export function clampRes(key, value) {
  return Math.max(0, Math.min(RESOURCE_CAP[key] ?? 100, value));
}

export function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

/** Counters of what happened in this save (stavby, bitvy, karavany…), read by ambitions and achievements. */
export function bumpStat(state, key, n = 1) {
  state.stats = state.stats || {};
  state.stats[key] = (state.stats[key] || 0) + n;
}

export function stat(state, key) {
  return (state.stats && state.stats[key]) || 0;
}
