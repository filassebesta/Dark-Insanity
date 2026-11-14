// Building: the towns and villages on the map grow plot by plot.
//
// Every settlement (SETTLEMENTS) has a level and as many plots as the level
// allows. On a free plot the player raises a building: it is paid at once,
// takes a few seasons and from then on works every season (income), every
// spring (yearly), on the mood of its province (drift: order lowers the unrest
// the province settles at, loyalty raises its loyalty) and on the warehouse
// (stock). A settlement with enough buildings can be raised to the next level,
// which opens more plots. A peasant builds on the farm (grunt) in Lipnice.
// Only one project at a time runs in each settlement. What already stands at
// the start (base) is part of the land's old economy and adds nothing more;
// only what the player builds pays off on top.
// No DOM here — town.js draws it, engine.js runs it every season.

import { clamp, bumpStat, clampRes } from './data.js';
import { makeChronicleEntry } from './state.js';
import { ensureTrade, MAX_STOCK } from './trade.js';
import { farmBuildingDone } from './farm.js';

// ---------- settlements ----------

export const SETTLEMENTS = {
  capital: {
    name: 'Vlčí Úděl', kind: 'castle', kindLabel: 'Královský hrad a město', province: 'capital', loc: 've Vlčím Údělu',
    level: 4, start: ['kostel', 'hradby', 'kasarna'],
    text: 'Hrad koruny a město pod jeho hradbami. Sjíždějí se sem páni, kupci i prosebníci z celé země.',
  },
  brod: {
    name: 'Brod', kind: 'town', kindLabel: 'Trhové město', province: 'brodna', loc: 'v Brodu',
    level: 3, start: ['trziste', 'mlyn'],
    text: 'Město u jediného brodu přes Brodnici. Žije z obilí, mýta a podzimního trhu.',
  },
  port: {
    name: 'Přístav Mark', kind: 'port', kindLabel: 'Přístavní městečko', province: 'pobrezni-mark', loc: 'v Přístavu Mark',
    level: 3, start: ['krcma'],
    text: 'Jediný přístav země. Rybáři, solivary, cizí lodě a hospody, kde se mluví deseti jazyky.',
  },
  abbey: {
    name: 'Klášter na útesu', kind: 'abbey', kindLabel: 'Klášter', province: 'pobrezni-mark', loc: 'v klášteře na útesu',
    level: 2, start: ['kostel'],
    text: 'Starý klášter nad mořem. Mniši tu léčí, učí a opisují knihy, když je zrovna nikdo nevypaluje.',
  },
  mine: {
    name: 'Železná Huť', kind: 'mine', kindLabel: 'Hornická osada', province: 'zelezny-hreben', loc: 'v Železné Huti',
    level: 2, start: ['sachta'],
    text: 'Šachty, struskové haldy a kouř z hutí. Každá nová štola znamená víc železa a víc vdov.',
  },
  lodge: {
    name: 'Sokolov', kind: 'lodge', kindLabel: 'Myslivecká osada', province: 'sokoli-hvozd', loc: 'v Sokolově',
    level: 1, start: ['lovci'],
    text: 'Pár srubů na okraji hvozdu. Myslivci, uhlíři a dřevaři, kteří se lesa bojí míň než výběrčích.',
  },
  lipnice: {
    name: 'Lipnice', kind: 'village', kindLabel: 'Ves', province: 'brodna', loc: 'v Lipnici',
    level: 2, start: [],
    text: 'Selská ves uprostřed obilných lánů Brodné. Na návsi lípa, kolem ní grunty a chalupy.',
  },
  dubovice: {
    name: 'Dubovice', kind: 'village', kindLabel: 'Ves', province: 'capital', loc: 'v Dubovicích',
    level: 2, start: ['mlyn'],
    text: 'Ves pod hradem, která živí královskou kuchyni. Sedláci tu znají jména všech koní ve stájích.',
  },
  zareci: {
    name: 'Zářečí', kind: 'village', kindLabel: 'Osada za řekou', province: 'capital', loc: 'v Zářečí',
    level: 1, start: [],
    text: 'Pár chalup na druhém břehu Brodnice. Kdo tu zakopne, ten tu zůstane — půda je dobrá.',
  },
};

// the peasant's own farm, shown instead of Lipnice in the Sedlák scenario
export const FARM = {
  name: 'Tvůj grunt', kind: 'farm', kindLabel: 'Selský grunt ve vsi Lipnice', province: 'brodna', loc: 'na gruntu',
  level: 2, start: ['stodola'],
  text: 'Chalupa, dvůr a kus pole. Co tu postavíš, to tu po tobě zůstane.',
};

export const FARM_ID = 'grunt';
export const PEASANT_VILLAGE = 'lipnice';

const LEVELS = ['', 'Osada', 'Ves', 'Městys', 'Město', 'Královské město'];
const ABBEY_LEVELS = ['', 'Poustevna', 'Převorství', 'Klášter', 'Opatství', 'Velké opatství'];
const FARM_LEVELS = ['', 'Chalupa', 'Grunt', 'Statek', 'Dvůr'];
const SLOTS = [0, 3, 4, 6, 8, 10];
const FARM_SLOTS = [0, 2, 4, 6, 7];

// what raising a settlement to a level costs: gold, seasons, finished buildings and a required one
const UPGRADES = {
  2: { cost: { gold: 12 }, turns: 2, need: 2 },
  3: { cost: { gold: 25 }, turns: 3, need: 3 },
  4: { cost: { gold: 40 }, turns: 4, need: 5, requires: 'hradby' },
  5: { cost: { gold: 60 }, turns: 5, need: 7, requires: 'katedrala' },
};
const FARM_UPGRADES = {
  3: { cost: { gold: 20 }, turns: 3, need: 3, free: true },
  4: { cost: { gold: 35 }, turns: 4, need: 5, free: true },
};

// ---------- buildings ----------
// cost: paid at once · turns: seasons of work · minLevel: settlement level
// income: every season (seasons = only in these seasons, 0 = spring)
// yearly: every spring · drift: order / loyalty of the province
// stock: wagons of goods every spring · onBuild: once, resources · onProv: once, the province

export const BUILDINGS = {
  kostel: {
    name: 'Kostel', cost: { gold: 10 }, turns: 2, minLevel: 1,
    yearly: { faith: 2 }, drift: { loyalty: 3 }, onBuild: { faith: 2 },
    text: 'Zvon svolává kraj ke mši. Lidé, kteří se modlí spolu, se spolu méně bouří.',
  },
  trziste: {
    name: 'Tržiště', cost: { gold: 12 }, turns: 2, minLevel: 1,
    income: { gold: 1 }, onProv: { wealth: 4 },
    text: 'Stánky, váhy a tržní právo. Z každého vozu kus mýta pro pokladnu.',
  },
  mlyn: {
    name: 'Mlýn', cost: { gold: 10 }, turns: 2, minLevel: 1,
    income: { food: 1 },
    text: 'Mele obilí celého okolí a mlynář odvádí každý desátý pytel.',
  },
  krcma: {
    name: 'Krčma', cost: { gold: 6 }, turns: 1, minLevel: 1,
    yearly: { gold: 1 }, drift: { order: 2 },
    text: 'Pivo, zprávy a občas rvačka. Spokojení lidé se nebouří a výčepní platí daň.',
  },
  sypka: {
    name: 'Sýpka', cost: { gold: 8 }, turns: 2, minLevel: 1,
    income: { food: 3 }, seasons: [3],
    text: 'Zásoby na zimu. Hlad přijde později, nebo vůbec.',
  },
  kovarna: {
    name: 'Kovárna', cost: { gold: 12 }, turns: 2, minLevel: 2,
    yearly: { army: 1 }, stock: { iron: 1 },
    text: 'Podkovy, hroty kopí a železo navíc do skladu.',
  },
  kasarna: {
    name: 'Kasárna', cost: { gold: 15 }, turns: 3, minLevel: 2,
    yearly: { army: 3 }, income: { gold: -1 }, drift: { order: 3 }, onProv: { garrison: 10 },
    text: 'Stálá posádka a výcvik nováčků. Žold se ale platí každé období.',
  },
  hradby: {
    name: 'Hradby', cost: { gold: 20 }, turns: 4, minLevel: 2,
    drift: { order: 4 }, onProv: { garrison: 8 }, onBuild: { prestige: 2 },
    text: 'Kamenný věnec kolem sídla. Bez hradeb se z vesnice nikdy nestane město.',
  },
  spital: {
    name: 'Špitál', cost: { gold: 12 }, turns: 2, minLevel: 2,
    yearly: { stability: 1 }, drift: { loyalty: 2, order: 1 },
    text: 'Lůžka pro nemocné, chudé a poutníky. Kraj si pamatuje, kdo se o něj postaral.',
  },
  radnice: {
    name: 'Radnice', cost: { gold: 25 }, turns: 3, minLevel: 3,
    income: { gold: 1 }, drift: { order: 2, loyalty: 2 },
    text: 'Konšelé, městská kniha a pečeť. Město si začne vládnout samo — a platit za to.',
  },
  cech: {
    name: 'Cechovní dům', cost: { gold: 20 }, turns: 3, minLevel: 3, requires: 'trziste',
    yearly: { gold: 2 }, stock: { cloth: 1 }, onProv: { wealth: 6 },
    text: 'Soukeníci, koželuzi a zlatníci pod jednou střechou. Tkají sukno na prodej.',
  },
  skola: {
    name: 'Klášterní škola', cost: { gold: 18 }, turns: 3, minLevel: 3, requires: 'kostel',
    yearly: { prestige: 1 }, drift: { loyalty: 1 },
    text: 'Písaři, právníci a kněží z vlastních řad. Učenost se šíří i do kanceláře.',
  },
  katedrala: {
    name: 'Katedrála', cost: { gold: 40, food: 5 }, turns: 6, minLevel: 4, requires: 'kostel',
    yearly: { faith: 2, prestige: 1 }, onBuild: { prestige: 6, faith: 5, legitimacy: 3 },
    text: 'Stavba na celou generaci. Až bude stát, poutníci přijdou z půli světa.',
  },
  lodenice: {
    name: 'Loděnice', cost: { gold: 18 }, turns: 3, minLevel: 2, kinds: ['port'],
    income: { gold: 1 }, stock: { salt: 1 },
    text: 'Kýly nových lodí a sklady soli. Víc lodí znamená víc ryb, soli a cla.',
  },
  sachta: {
    name: 'Nová šachta', cost: { gold: 14 }, turns: 3, minLevel: 1, kinds: ['mine'],
    stock: { iron: 2 }, onProv: { wealth: 3 },
    text: 'Hlubší štola do bohaté žíly. Železo přibývá ve skladu každé jaro.',
  },
  lovci: {
    name: 'Lovecká chata', cost: { gold: 8 }, turns: 2, minLevel: 1, kinds: ['lodge'],
    yearly: { food: 2 }, stock: { furs: 1 },
    text: 'Myslivci, sušárna kůží a udírna. Zvěřina na stůl a kožešiny na trh.',
  },
};

// a monastery has no market or barracks
const ABBEY_ALLOWED = ['kostel', 'spital', 'skola', 'sypka', 'mlyn', 'katedrala', 'hradby'];

// the farm's stock (grain, cows, horses, pigs) and what these buildings do for it: farm.js FARM_WORKS
export const FARM_BUILDINGS = {
  stodola: {
    name: 'Stodola', cost: { gold: 5 }, turns: 2, minLevel: 1,
    income: { food: 2 }, seasons: [2], onBuild: { stability: 2 },
    text: 'Místo pro úrodu a obilí v pytlích. Co se nevejde pod střechu, to sežerou myši a déšť.',
  },
  mlynek: {
    name: 'Mlýn', cost: { gold: 12 }, turns: 3, minLevel: 2,
    text: 'Vodní mlýnek na potoce za humny. Mele obilí celé vsi a z každého pytle si nechá mírku.',
  },
  chlev: {
    name: 'Chlév', cost: { gold: 6 }, turns: 2, minLevel: 1,
    onBuild: { stability: 3 },
    text: 'Stání pro krávy. Mléko a sýr i v roce, kdy se pole nevydaří, a na jaře občas tele.',
  },
  staj: {
    name: 'Stáj', cost: { gold: 8 }, turns: 2, minLevel: 1,
    text: 'Stáj pro koně. Kůň zorá víc pole než kráva a sveze úrodu dřív, než přijde déšť.',
  },
  chlivek: {
    name: 'Chlívek', cost: { gold: 4 }, turns: 1, minLevel: 1,
    text: 'Chlívek pro prasata. Prasnice na jaře vrhne selata a v zimě je zabijačka.',
  },
  vcelin: {
    name: 'Včelín', cost: { gold: 4 }, turns: 1, minLevel: 1,
    yearly: { gold: 2 },
    text: 'Pár úlů za stodolou. Med a vosk se na trhu v Brodu prodají vždycky.',
  },
  sad: {
    name: 'Ovocný sad', cost: { gold: 4 }, turns: 3, minLevel: 1,
    yearly: { food: 2, prestige: 1 },
    text: 'Jabloně a švestky. Ovoce na zimu a stín, pod kterým se sousedé rádi zastaví.',
  },
  kaplicka: {
    name: 'Boží muka', cost: { gold: 3 }, turns: 1, minLevel: 1,
    yearly: { faith: 2 }, onBuild: { prestige: 2 },
    text: 'Kamenný sloupek s obrázkem svatého na mezi. Ves ví, že tady bydlí zbožný hospodář.',
  },
  dilna: {
    name: 'Dílna', cost: { gold: 8 }, turns: 2, minLevel: 3,
    yearly: { gold: 3 },
    text: 'Ponk, pila a soustruh. V zimě se vyrábí na prodej.',
  },
  celednik: {
    name: 'Čeledník', cost: { gold: 10 }, turns: 2, minLevel: 2, // a serf needs hands too, not only a free man
    yearly: { army: 3 },
    text: 'Světnice pro čeleď. Kde je kde spát, tam se najdou i ruce k práci.',
  },
  rybnik: {
    name: 'Rybník', cost: { gold: 12 }, turns: 3, minLevel: 3,
    yearly: { food: 3, gold: 1 }, onBuild: { prestige: 2 },
    text: 'Hráz, stavidlo a kapři. Výlov je svátek celé vsi.',
  },
};

// ---------- lookups ----------

export const isFarm = (id) => id === FARM_ID;
export const settlementDef = (id) => (isFarm(id) ? FARM : SETTLEMENTS[id]);
export const buildingDef = (key) => BUILDINGS[key] || FARM_BUILDINGS[key];

/** The settlement a map place opens: a peasant's Lipnice is the farm. */
export function townIdFor(state, placeId) {
  if (state.scenario === 'sedlak' && placeId === PEASANT_VILLAGE) return FARM_ID;
  return SETTLEMENTS[placeId] ? placeId : null;
}

export function levelName(id, level) {
  const kind = settlementDef(id).kind;
  return (kind === 'farm' ? FARM_LEVELS : kind === 'abbey' ? ABBEY_LEVELS : LEVELS)[level] || '';
}

export function maxLevel(id) {
  return isFarm(id) ? FARM_LEVELS.length - 1 : LEVELS.length - 1;
}

export function slotCount(id, level) {
  return (isFarm(id) ? FARM_SLOTS : SLOTS)[level] || 0;
}

/** Buildings that can ever stand in this settlement. */
export function catalogFor(id) {
  if (isFarm(id)) return FARM_BUILDINGS;
  const kind = SETTLEMENTS[id].kind;
  return Object.fromEntries(Object.entries(BUILDINGS).filter(([key, b]) =>
    (!b.kinds || b.kinds.includes(kind)) && (kind !== 'abbey' || ABBEY_ALLOWED.includes(key))));
}

function newTown(def) {
  return { level: def.level, buildings: def.start.map((key, slot) => ({ key, slot, ready: true, base: true })), upgrade: null };
}

export function ensureTowns(state) {
  if (!state.towns) state.towns = {};
  for (const [id, def] of Object.entries(SETTLEMENTS)) if (!state.towns[id]) state.towns[id] = newTown(def);
  if (state.scenario === 'sedlak' && !state.towns[FARM_ID]) state.towns[FARM_ID] = newTown(FARM);
  return state.towns;
}

export function townOf(state, id) {
  return ensureTowns(state)[id];
}

/** True when the player may build here and the town works for the player. */
export function ownsTown(state, id) {
  if (isFarm(id)) return state.scenario === 'sedlak';
  if (state.scenario === 'sedlak') return false;
  const prov = state.provinces.find((p) => p.id === SETTLEMENTS[id].province);
  return !!prov && !prov.lost && (!prov.owner || prov.owner === 'player');
}

export function readyBuildings(town) {
  return town.buildings.filter((b) => b.ready);
}

/** Finished buildings the player raised: only these yield anything. */
export function workingBuildings(town) {
  return town.buildings.filter((b) => b.ready && !b.base);
}

/** The work going on in a town: { type: 'build' | 'upgrade', key?, slot?, done, start }. */
export function currentProject(town) {
  if (town.upgrade) return { type: 'upgrade', ...town.upgrade };
  const b = town.buildings.find((x) => !x.ready);
  return b ? { type: 'build', key: b.key, slot: b.slot, done: b.done, start: b.start } : null;
}

// how many building crews work at once across the whole land
const CREWS = { panovnik: 2, slechtic: 1, sedlak: 1 };

export function crewLimit(state) {
  // a master builder taken into service (event t_stavitel) runs one more crew
  return (CREWS[state.scenario] || 1) + (state.flags && state.flags.mistr_stavitel ? 1 : 0);
}

/** Projects running in the player's own settlements. */
export function projectsRunning(state) {
  return Object.entries(ensureTowns(state)).filter(([id, town]) => ownsTown(state, id) && currentProject(town)).length;
}

function crewBlock(state) {
  const n = crewLimit(state);
  if (projectsRunning(state) < n) return null;
  return n === 1 ? 'Stavitelé už pracují jinde. Počkej, až dokončí stavbu.' : `Všechny ${n} stavební hutě už pracují. Počkej, až některá dokončí stavbu.`;
}

export function canAfford(state, cost) {
  return Object.entries(cost || {}).every(([k, v]) => (state.resources[k] ?? 0) >= v);
}

function pay(state, cost, share = 1) {
  for (const [k, v] of Object.entries(cost || {})) {
    if (state.resources[k] !== undefined) state.resources[k] = clampRes(k, state.resources[k] - Math.round(v * share));
  }
}

/** Adds to a resource the scenario has; a noble's claim to the throne is not for sale. Returns the real change. */
function addRes(state, key, value) {
  const r = state.resources;
  if (r[key] === undefined || !value) return 0;
  if (key === 'legitimacy' && state.scenario === 'slechtic') return 0;
  const before = r[key];
  r[key] = clampRes(key, before + value);
  return r[key] - before;
}

// ---------- what the player can do ----------

/** Why a building cannot be started here (null = it can). */
export function buildBlock(state, id, key) {
  const def = buildingDef(key);
  const town = townOf(state, id);
  if (!def || !catalogFor(id)[key]) return 'Tady se to postavit nedá.';
  if (!ownsTown(state, id)) return 'Tohle místo ti nepatří.';
  if (town.buildings.some((b) => b.key === key)) return 'Už tu stojí.';
  if (town.level < def.minLevel) return `Potřebuje, aby sídlo bylo aspoň ${levelName(id, def.minLevel).toLowerCase()}.`;
  if (def.requires && !readyBuildings(town).some((b) => b.key === def.requires)) return `Nejdřív musí stát ${buildingDef(def.requires).name.toLowerCase()}.`;
  if (currentProject(town)) return 'V tomhle sídle se už staví.';
  const crews = crewBlock(state);
  if (crews) return crews;
  if (!canAfford(state, def.cost)) return 'Na tohle nemáš.';
  return null;
}

export function freeSlot(state, id, slot) {
  const town = townOf(state, id);
  return slot >= 0 && slot < slotCount(id, town.level) && !town.buildings.some((b) => b.slot === slot);
}

export function startBuilding(state, id, key, slot) {
  const why = buildBlock(state, id, key);
  if (why) return { error: why };
  if (!freeSlot(state, id, slot)) return { error: 'Tahle parcela není volná.' };
  const def = buildingDef(key);
  pay(state, def.cost);
  townOf(state, id).buildings.push({ key, slot, ready: false, start: state.turn, done: state.turn + def.turns });
  return { message: `Začala stavba: ${def.name} ${settlementDef(id).loc}.` };
}

/** Stops the work in progress; half of what it cost comes back. */
export function cancelProject(state, id) {
  const town = townOf(state, id);
  const p = currentProject(town);
  if (!p) return { error: 'Nic se tu nestaví.' };
  if (p.type === 'upgrade') {
    refund(state, upgradeSpec(id, p.to).cost);
    town.upgrade = null;
  } else {
    refund(state, buildingDef(p.key).cost);
    town.buildings = town.buildings.filter((b) => b.ready);
  }
  return { message: 'Stavba zastavena. Polovina peněz se vrátila do pokladny.' };
}

function refund(state, cost) {
  for (const [k, v] of Object.entries(cost || {})) addRes(state, k, Math.floor(v / 2));
}

/** Pulls a finished building down to free its plot. */
export function demolish(state, id, slot) {
  const town = townOf(state, id);
  if (!ownsTown(state, id)) return { error: 'Tohle místo ti nepatří.' };
  const b = town.buildings.find((x) => x.slot === slot && x.ready);
  if (!b) return { error: 'Na parcele nic nestojí.' };
  const needed = Object.keys(catalogFor(id)).find((k) => buildingDef(k).requires === b.key && town.buildings.some((x) => x.key === k));
  if (needed) return { error: `Na téhle stavbě závisí ${buildingDef(needed).name.toLowerCase()}.` };
  if (b.key === 'hradby' && town.level >= 4 && !isFarm(id)) return { error: 'Město bez hradeb by přestalo být městem.' };
  town.buildings = town.buildings.filter((x) => x !== b);
  return { message: `${buildingDef(b.key).name} ${settlementDef(id).loc} byl stržen.` };
}

function upgradeSpec(id, to) {
  return (isFarm(id) ? FARM_UPGRADES : UPGRADES)[to];
}

/** The next level of a town and what stands in the way: { to, name, spec, block } or null at the top. */
export function upgradeInfo(state, id) {
  const town = townOf(state, id);
  const to = town.level + 1;
  const spec = upgradeSpec(id, to);
  if (to > maxLevel(id) || !spec) return null;
  const done = readyBuildings(town);
  let block = null;
  if (!ownsTown(state, id)) block = 'Tohle místo ti nepatří.';
  else if (spec.free && state.ruler.statusTier < 2) block = 'Statek může mít jen svobodný člověk. Nejdřív se vykup.';
  else if (done.length < spec.need) block = `Potřebuje ${spec.need} hotové stavby (teď ${done.length}).`;
  else if (spec.requires && !done.some((b) => b.key === spec.requires)) block = `Nejdřív musí stát ${buildingDef(spec.requires).name.toLowerCase()}.`;
  else if (currentProject(town)) block = 'V tomhle sídle se už staví.';
  else if (crewBlock(state)) block = crewBlock(state);
  else if (!canAfford(state, spec.cost)) block = 'Na tohle nemáš.';
  return { to, name: levelName(id, to), spec, block };
}

export function startUpgrade(state, id) {
  const info = upgradeInfo(state, id);
  if (!info) return { error: 'Výš už to nejde.' };
  if (info.block) return { error: info.block };
  pay(state, info.spec.cost);
  townOf(state, id).upgrade = { to: info.to, start: state.turn, done: state.turn + info.spec.turns };
  return { message: `${settlementDef(id).name}: začalo rozšiřování na ${info.name.toLowerCase()}.` };
}

// ---------- every season ----------

function provinceOf(state, id) {
  return state.provinces.find((p) => p.id === settlementDef(id).province);
}

function finishBuilding(state, id, b, news) {
  const def = buildingDef(b.key);
  b.ready = true;
  delete b.done;
  delete b.start;
  for (const [k, v] of Object.entries(def.onBuild || {})) addRes(state, k, v);
  const prov = provinceOf(state, id);
  if (def.onProv && prov && !isFarm(id)) for (const [k, v] of Object.entries(def.onProv)) prov[k] = clamp((prov[k] || 0) + v);
  if (isFarm(id)) farmBuildingDone(state, b.key); // a new cowshed comes with its first cow
  bumpStat(state, 'built');
  const text = `Dostavěno ${settlementDef(id).loc}: ${def.name.toLowerCase()}.`;
  news.push(text);
  state.chronicle.push(makeChronicleEntry(state, text));
}

function finishUpgrade(state, id, town, news) {
  bumpStat(state, 'upgrades');
  town.level = town.upgrade.to;
  town.upgrade = null;
  if (isFarm(id)) {
    addRes(state, 'stability', 5);
    addRes(state, 'prestige', 3);
  } else {
    addRes(state, 'prestige', 1);
    const prov = provinceOf(state, id);
    if (prov) prov.wealth = clamp(prov.wealth + 3);
  }
  const def = settlementDef(id);
  const text = isFarm(id)
    ? `Z gruntu se stal ${levelName(id, town.level).toLowerCase()}. Celá ves se chodí dívat.`
    : `${def.name} ${town.level >= 4 && def.kind !== 'abbey' ? 'dostal městská práva' : 'se rozrostl'}: ${levelName(id, town.level).toLowerCase()}.`;
  news.push(text);
  state.chronicle.push(makeChronicleEntry(state, text));
}

/** Finishes due work and lets every finished building of the player's towns work. Returns { gold, food, news }. */
export function processBuilding(state) {
  const towns = ensureTowns(state);
  const news = [];
  let gold = 0;
  let food = 0;
  const spring = state.seasonIndex === 0;
  for (const [id, town] of Object.entries(towns)) {
    const own = ownsTown(state, id);
    // work goes on only where the player still rules; elsewhere it waits
    if (own) {
      for (const b of town.buildings) if (!b.ready && b.done <= state.turn) finishBuilding(state, id, b, news);
      if (town.upgrade && town.upgrade.done <= state.turn) finishUpgrade(state, id, town, news);
    }
    if (!own) continue;
    for (const b of workingBuildings(town)) {
      const def = buildingDef(b.key);
      if (def.income && (!def.seasons || def.seasons.includes(state.seasonIndex))) {
        for (const [k, v] of Object.entries(def.income)) {
          const d = addRes(state, k, v);
          if (k === 'gold') gold += d;
          if (k === 'food') food += d;
        }
      }
      if (spring && def.yearly) {
        for (const [k, v] of Object.entries(def.yearly)) {
          const d = addRes(state, k, v);
          if (k === 'gold') gold += d;
          if (k === 'food') food += d;
        }
      }
      if (spring && def.stock) {
        const t = ensureTrade(state);
        for (const [g, n] of Object.entries(def.stock)) t.stock[g] = Math.min(MAX_STOCK, (t.stock[g] || 0) + n);
      }
    }
  }
  return { gold, food, news };
}

// ---------- events (see events_build.js) ----------

/** Has the town this building standing (finished)? builtOnly = raised by the player, not there from the start. */
export function hasBuilding(state, id, key, builtOnly = false) {
  const town = state.towns && state.towns[id];
  return !!town && town.buildings.some((b) => b.key === key && b.ready && (!builtOnly || !b.base));
}

/** Own settlements (ids) that pass a test; the farm only for a peasant. */
export function ownTowns(state, test = () => true) {
  return Object.keys(ensureTowns(state)).filter((id) => ownsTown(state, id) && test(id, state.towns[id]));
}

const pickOne = (list) => list[Math.floor(Math.random() * list.length)];

/**
 * Branch effect `town` of an event, on the settlement in context (or fx.at):
 *   destroy: 'random' | <key>   — a finished building is lost (walls and cathedrals stand)
 *   start: <key>                — construction begins for free, if there is room
 *   hurry: n                    — the work in progress ends n seasons sooner
 *   levelUp: true               — the settlement rises a level at once
 */
export function applyTownEffects(state, ctxTown, fx, notes) {
  if (!fx) return;
  const id = fx.at || ctxTown;
  if (!id || !settlementDef(id)) return;
  const town = townOf(state, id);
  const def = settlementDef(id);
  const own = ownsTown(state, id); // only the player's own towns get gifts; harm can come anywhere
  if (fx.destroy) {
    const pool = town.buildings.filter((b) => b.ready && !['hradby', 'katedrala'].includes(b.key)
      && (fx.destroy === 'random' || b.key === fx.destroy));
    const b = pickOne(pool);
    if (b) {
      town.buildings = town.buildings.filter((x) => x !== b);
      notes.push({ text: `Zničeno ${def.loc}: ${buildingDef(b.key).name.toLowerCase()}`, tone: 'neg' });
    }
  }
  if (fx.start && own) {
    const bdef = buildingDef(fx.start);
    const slots = slotCount(id, town.level);
    let slot = -1;
    for (let i = 0; i < slots; i++) if (!town.buildings.some((b) => b.slot === i)) { slot = i; break; }
    if (bdef && catalogFor(id)[fx.start] && slot >= 0 && !currentProject(town) && !town.buildings.some((b) => b.key === fx.start)) {
      town.buildings.push({ key: fx.start, slot, ready: false, start: state.turn, done: state.turn + bdef.turns });
      notes.push({ text: `Začala stavba ${def.loc}: ${bdef.name.toLowerCase()}`, tone: 'pos' });
    }
  }
  if (fx.hurry && own) {
    const b = town.buildings.find((x) => !x.ready);
    const target = b || town.upgrade;
    if (target) {
      target.done = Math.max(state.turn + 1, target.done - fx.hurry);
      notes.push({ text: `Stavba ${def.loc} bude hotová dřív`, tone: 'pos' });
    }
  }
  if (fx.levelUp && own) {
    const to = town.level + 1;
    if (to <= maxLevel(id) && upgradeSpec(id, to) && !town.upgrade) {
      town.level = to;
      bumpStat(state, 'upgrades');
      notes.push({ text: `${def.name}: ${levelName(id, to).toLowerCase()}`, tone: 'pos' });
    }
  }
}

/** How the player's buildings in a province shift the unrest and loyalty it settles at (capped). */
export function buildingDrift(state, provinceId) {
  const out = { order: 0, loyalty: 0 };
  if (!state.towns) return out;
  for (const [id, town] of Object.entries(state.towns)) {
    if (isFarm(id) || SETTLEMENTS[id].province !== provinceId || !ownsTown(state, id)) continue;
    for (const b of workingBuildings(town)) {
      const d = buildingDef(b.key).drift;
      if (d) {
        out.order += d.order || 0;
        out.loyalty += d.loyalty || 0;
      }
    }
  }
  out.order = Math.min(out.order, 8);
  out.loyalty = Math.min(out.loyalty, 6);
  return out;
}

/** Everything the finished buildings of a town give, summed for display. */
export function townYield(state, id) {
  const sum = { income: {}, yearly: {}, stock: {}, drift: {} };
  const add = (bucket, obj, seasons) => {
    for (const [k, v] of Object.entries(obj || {})) {
      // seasonal income (a granary in winter) counts once a year
      const target = seasons ? sum.yearly : bucket;
      target[k] = (target[k] || 0) + v * (seasons ? seasons.length : 1);
    }
  };
  for (const b of workingBuildings(townOf(state, id))) {
    const def = buildingDef(b.key);
    add(sum.income, def.income, def.seasons);
    add(sum.yearly, def.yearly);
    add(sum.stock, def.stock);
    add(sum.drift, def.drift);
  }
  return sum;
}
