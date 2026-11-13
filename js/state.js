import { RESOURCE_DEFS, PROVINCE_TEMPLATES, NOBLE_HOUSES, NOBLE_HOME, PEASANT_HOME, randInt, randomName, clamp } from './data.js';
import { QUIRK_ROLES, randomQuirk, biography } from './court.js';
import { ensureRealms } from './realms.js';
import { dropAmbition } from './ambitions.js';

const SAVE_PREFIX = 'insanityKingdom.save.';
const SAVE_INDEX_KEY = 'insanityKingdom.saveIndex';
const SETTINGS_KEY = 'insanityKingdom.settings';

function newCharacter(role, { gender, minAge, maxAge, loyalty = 60 } = {}) {
  const g = gender || (Math.random() < 0.5 ? 'male' : 'female');
  return {
    role,
    name: randomName(g),
    gender: g,
    age: randInt(minAge ?? 20, maxAge ?? 40),
    loyalty: clamp(loyalty + randInt(-10, 10)),
    alive: true,
    ...(QUIRK_ROLES.includes(role) ? { quirk: randomQuirk() } : {}),
    ...(role === 'heir' ? { traits: inheritTraits() } : {}),
  };
}

/** A child's traits: around average, leaning toward the parent's strengths. */
export function inheritTraits(parent) {
  const t = {};
  for (const key of ['strength', 'eloquence', 'intelligence', 'patience']) {
    const lean = parent ? Math.round((parent[key] - 5) / 3) : 0;
    t[key] = Math.max(2, Math.min(8, 4 + randInt(0, 2) + lean));
  }
  return t;
}

function initialResources() {
  const values = {};
  for (const def of RESOURCE_DEFS) {
    if (def.key === 'favor') continue; // noble only
    values[def.key] = def.key === 'legitimacy' ? 70 : def.key === 'stability' ? 65 : 55;
  }
  return values;
}

function initialProvinces() {
  return PROVINCE_TEMPLATES.map((tpl) => ({
    id: tpl.id,
    name: tpl.name,
    isCapital: !!tpl.isCapital,
    loyalty: clamp(60 + randInt(-10, 15)),
    unrest: clamp(20 + randInt(-10, 15)),
    wealth: clamp(50 + randInt(-15, 20)),
    garrison: clamp(50 + randInt(-15, 15)),
    lost: false,
  }));
}

// Every new chronicle starts on the plough: a peasant who can rise to a free man,
// a noble, a great lord and the throne in the same save. The scenario argument is
// kept for the simulations and tests that start a later stage directly.
export function createNewGame(rulerName, dynastyName, gender, scenario = 'sedlak') {
  const game = scenario === 'slechtic' ? createNobleGame(rulerName, dynastyName, gender)
    : scenario === 'sedlak' ? createPeasantGame(rulerName, dynastyName, gender)
      : createKingGame(rulerName, dynastyName, gender);
  game.origin = scenario; // where the house began: a peasant's line that reaches the crown earns a mark in the Hall of Fame
  // every chronicle from the plough opens with the prologue (events_prologue.js): upbringing, first winter, the lord
  if (scenario === 'sedlak') { game.pendingEvent = 'p_puvod'; game.eventQueue = ['p_prvni_zima', 'p_pan']; }
  game.stats = {};
  game.milestones = {}; // turn of each promotion: { ennobled, crowned, empire }
  ensureRealms(game); // the neighbouring kingdoms and their rulers
  return game;
}

/** New officers never share a first name with anyone in the household (the family keeps theirs). */
function uniqueOfficers(state) {
  const used = new Set([state.ruler.name, state.heir.name, state.spouse.name]);
  for (const role of ['chancellor', 'marshal', 'spymaster']) {
    const c = state[role];
    for (let i = 0; i < 20 && used.has(c.name); i++) c.name = randomName(c.gender);
    used.add(c.name);
  }
}

/** Nobody in the household shares a first name with someone else in it. */
function uniqueNames(state) {
  const used = new Set([state.ruler.name]);
  for (const role of ['heir', 'spouse', 'chancellor', 'marshal', 'spymaster']) {
    const c = state[role];
    for (let i = 0; i < 20 && used.has(c.name); i++) c.name = randomName(c.gender);
    used.add(c.name);
  }
  return state;
}

function createKingGame(rulerName, dynastyName, gender) {
  return uniqueNames(buildKingGame(rulerName, dynastyName, gender));
}

function buildKingGame(rulerName, dynastyName, gender) {
  const rulerGender = gender === 'female' || gender === 'male' ? gender : (Math.random() < 0.5 ? 'male' : 'female');
  const spouseGender = rulerGender === 'male' ? 'female' : 'male';

  return {
    version: 1,
    scenario: 'panovnik',
    dynastyName: dynastyName || 'Bezejmenných', // the 2nd case: "z rodu Bezejmenných"
    slotId: null,
    turn: 0,
    year: 1,
    seasonIndex: 0,
    generation: 1,
    goldenAgeStreak: 0,
    resources: initialResources(),
    ruler: {
      name: rulerName || randomName(rulerGender),
      gender: rulerGender,
      age: 32,
      traits: { strength: 5, eloquence: 5, intelligence: 5, patience: 5 },
      statusTier: 5,
      alive: true,
      reignStartTurn: 0,
    },
    pastRulers: [],
    heir: newCharacter('heir', { minAge: 8, maxAge: 16, loyalty: 70 }),
    spouse: newCharacter('spouse', { gender: spouseGender, minAge: 26, maxAge: 40, loyalty: 65 }),
    chancellor: newCharacter('chancellor', { minAge: 45, maxAge: 62, loyalty: 60 }),
    marshal: newCharacter('marshal', { minAge: 40, maxAge: 58, loyalty: 60 }),
    spymaster: newCharacter('spymaster', { minAge: 35, maxAge: 55, loyalty: 55 }),
    provinces: initialProvinces(),
    chronicle: [],
    flags: {},
    usedEvents: [],
    currentEvent: null,
    pendingSuccessionCeremony: false,
    gameOver: null,
  };
}

// ---------- Šlechtic: a minor noble with one estate, under a king, among rival houses ----------

function createNobleGame(rulerName, dynastyName, gender) {
  const state = createKingGame(rulerName, dynastyName, gender);
  state.scenario = 'slechtic';
  state.ruler.statusTier = 3;
  state.ruler.age = 26;
  state.heir.age = randInt(2, 6);
  state.spouse.age = randInt(22, 30);
  state.resources = { gold: 30, food: 45, army: 25, stability: 60, legitimacy: 12, faith: 50, prestige: 25, favor: 55 };
  createWorld(state, 'player');
  state.noble = { province: NOBLE_HOME, plot: 0, secrets: 0 };
  return state;
}

/** The realm around a noble or a peasant: the king, the three great houses and who holds which land. */
function createWorld(state, homeOwner) {
  // every province exists on the map, but only the home estate is the player's
  const owners = { capital: 'crown', [NOBLE_HOME]: homeOwner };
  for (const h of NOBLE_HOUSES) owners[h.seat] = h.id;
  for (const p of state.provinces) {
    p.owner = owners[p.id];
    if (p.owner === 'player') Object.assign(p, { loyalty: 62, unrest: 22, wealth: 45, garrison: 35 });
  }
  const kingHeirGender = Math.random() < 0.5 ? 'male' : 'female';
  let kingName = randomName('male');
  while (kingName === state.ruler.name) kingName = randomName('male');
  state.king = {
    name: kingName, gender: 'male', age: randInt(55, 59), alive: true,
    heir: { name: randomName(kingHeirGender), gender: kingHeirGender, age: randInt(7, 11), alive: true },
    reign: 1,
  };
  state.houses = NOBLE_HOUSES.map((h) => {
    const g = Math.random() < 0.75 ? 'male' : 'female';
    return {
      id: h.id, power: randInt(50, 70), attitude: randInt(40, 55), ally: false, married: false,
      head: { name: randomName(g), gender: g, age: randInt(38, 62) },
    };
  });
}

// ---------- Sedlák: a peasant farm in Lipnice, under the lords of Bílá Brána ----------

function createPeasantGame(rulerName, dynastyName, gender) {
  const state = createKingGame(rulerName, dynastyName, gender);
  state.scenario = 'sedlak';
  state.ruler.statusTier = 1;
  state.ruler.age = 20;
  // a young farmer starts single and childless: the spouse is courted, the heir born (family.js)
  state.spouse = { role: 'spouse', name: '', gender: gender === 'female' ? 'male' : 'female', age: 0, loyalty: 0, alive: false, none: true };
  state.heir = { role: 'heir', name: '', gender: 'male', age: 0, loyalty: 0, alive: false, none: true, traits: inheritTraits() };
  state.children = [];
  // one to three younger brothers and sisters: if the farmer dies childless, one of them carries the house on
  const used = new Set([state.ruler.name, state.chancellor.name, state.marshal.name, state.spymaster.name]);
  state.siblings = [];
  for (let i = randInt(1, 3); i > 0; i--) {
    const g = Math.random() < 0.5 ? 'male' : 'female';
    let name = randomName(g);
    for (let k = 0; k < 20 && used.has(name); k++) name = randomName(g);
    used.add(name);
    state.siblings.push({ role: 'sibling', name, gender: g, age: randInt(12, 18), loyalty: randInt(60, 80), alive: true, traits: inheritTraits() });
  }
  state.chancellor.age = randInt(45, 60);
  state.marshal.age = randInt(30, 50);
  state.spymaster.age = randInt(30, 50);
  state.resources = { gold: 10, food: 40, army: 30, stability: 55, faith: 55, prestige: 20, favor: 50 };
  createWorld(state, 'crown');
  state.king.age = randInt(38, 48); // a peasant's life is long enough to outlive one king, not three
  state.peasant = { ...PEASANT_HOME };
  return state;
}

/** The peasant became a noble: the save continues as the Šlechtic scenario with a fief on the coast. */
export function ennoblePeasant(state) {
  // the family keeps the life stories of the village they came from
  for (const role of ['heir', 'spouse']) if (!state[role].bio) state[role].bio = biography(state[role], role, '{dynasty}', 'sedlak');
  state.scenario = 'slechtic';
  state.ruler.statusTier = 3;
  const r = state.resources;
  state.resources = {
    gold: Math.max(r.gold, 25), food: Math.max(r.food, 35), army: Math.max(r.army, 22), stability: 60,
    legitimacy: 10, faith: r.faith, prestige: clamp(r.prestige / 2 + 10), favor: 58,
  };
  const home = state.provinces.find((p) => p.id === NOBLE_HOME);
  Object.assign(home, { owner: 'player', loyalty: 55, unrest: 25, wealth: 42, garrison: 30 });
  state.noble = { province: NOBLE_HOME, plot: 0, secrets: 0 };
  for (const h of state.houses) h.attitude = clamp(h.attitude - 8); // the old houses look down on an upstart
  delete state.peasant;
  // the reeve, the smith and the innkeeper stay in Lipnice; a lord's household needs a steward, a captain and an ear at court
  const neighbours = ['chancellor', 'marshal', 'spymaster'].map((r) => state[r].name).join(', ');
  state.chancellor = newCharacter('chancellor', { minAge: 38, maxAge: 55, loyalty: 58 });
  state.marshal = newCharacter('marshal', { minAge: 30, maxAge: 48, loyalty: 60 });
  state.spymaster = newCharacter('spymaster', { minAge: 28, maxAge: 45, loyalty: 52 });
  uniqueOfficers(state);
  dropStageContracts(state, 'manor');
  const farewell = [];
  // the farm in Lipnice goes to a neighbour for what its buildings are worth
  const farm = state.towns && state.towns.grunt;
  if (farm) {
    const worth = 5 + 3 * farm.buildings.filter((b) => b.ready && !b.base).length + 4 * Math.max(0, farm.level - 1);
    state.resources.gold = clamp(state.resources.gold + worth);
    delete state.towns.grunt;
    farewell.push(`Grunt v Lipnici koupil soused za ${worth} zlatých.`);
  }
  // the usurer in Brodná does not forget a debtor just because he now has a coat of arms
  if (state.flags.s_dluh) {
    delete state.flags.s_dluh;
    state.resources.gold = clamp(state.resources.gold - 20);
    farewell.push('Lichvář z Brodné si dluh vybral hned při podpisu listiny.');
  }
  state.gameOver = null;
  const f = state.ruler.gender === 'female';
  state.chronicle.push(makeChronicleEntry(state, `${state.ruler.name} z rodu ${state.dynastyName} ${f ? 'byla povýšena' : 'byl povýšen'} do šlechtického stavu a ${f ? 'dostala' : 'dostal'} v léno tvrz v Pobřežní marce. Rod, který oral cizí pole, má teď vlastní. Sousedé z Lipnice (${neighbours}) zůstali doma; na tvrzi slouží noví lidé.${farewell.length ? ' ' + farewell.join(' ') : ''}`));
  return state;
}

/** The noble has taken the crown: the save continues as the Panovník scenario. */
export function crownNoble(state) {
  state.scenario = 'panovnik';
  state.ruler.statusTier = 5;
  state.ruler.reignStartTurn = state.turn;
  delete state.resources.favor;
  state.resources.legitimacy = Math.max(state.resources.legitimacy, 55);
  state.resources.army = clamp(state.resources.army + 25);
  state.resources.gold = clamp(state.resources.gold + 20);
  for (const p of state.provinces) {
    const house = (state.houses || []).find((h) => h.id === p.owner);
    if (p.owner !== 'player') {
      // former rivals' lands now owe the new crown, as loyal as the house was friendly
      p.loyalty = clamp(house ? house.attitude : 55);
      p.unrest = clamp(house ? 45 - Math.round(house.attitude / 3) : 25);
      p.wealth = clamp(p.wealth || 55);
      p.garrison = clamp(p.garrison || 50);
    }
    delete p.owner;
  }
  dropStageContracts(state, 'court');
  delete state.noble;
  delete state.flags.rebellion;
  // help from abroad promised before the crown was won comes due now
  if (state.flags.cizi_podpora) {
    delete state.flags.cizi_podpora;
    state.echoes = state.echoes || [];
    state.echoes.push({ event: 'ozvena_dluh_markam', due: state.turn + randInt(3, 6), context: null,
      from: { year: state.year, title: 'Posel z Východních marek', choice: 'Přijmout nabídku a poslat zpátky prsten', ruler: state.ruler.name, gender: state.ruler.gender } });
  }
  // the old king (dead, or deposed by the player) leaves the story; the player is the crown now
  if (state.king) state.formerKing = { name: state.king.name, gender: state.king.gender, alive: state.king.alive && !state.flags.kral_popraven };
  delete state.king;
  delete state.flags.kral_popraven;
  // an heir who is already grown does not "come of age" again at court
  if (state.heir.alive && state.heir.age >= 16) state.flags[`heir_adult_${state.heir.name}`] = true;
  if (state.flags.royal_match) state.flags.heir_married = true;
  // the lord's old servants make way for royal officers
  const retired = [];
  for (const [role, min, max] of [['chancellor', 40, 55], ['marshal', 35, 50], ['spymaster', 30, 48]]) {
    if (state[role].age < 60) continue;
    retired.push(state[role].name);
    state[role] = newCharacter(role, { minAge: min, maxAge: max, loyalty: 60 });
  }
  if (retired.length) uniqueOfficers(state);
  state.gameOver = null;
  const f = state.ruler.gender === 'female';
  state.chronicle.push(makeChronicleEntry(state, `${state.ruler.name} z rodu ${state.dynastyName} ${f ? 'byla korunována královnou' : 'byl korunován králem'}. ${state.origin === 'sedlak' ? 'Rod, který kdysi oral cizí pole v Lipnici' : 'Rod, který začínal s jedinou tvrzí'}, teď vládne celé zemi.${retired.length ? ` Staří služebníci rodu (${retired.join(', ')}) odešli na odpočinek a u dvora slouží noví rádci.` : ''}`));
  return state;
}

/** Goods on their way to a master the player no longer serves go back to the warehouse. */
function bringCaravansHome(state, dest) {
  const t = state.trade;
  if (!t || !t.caravans) return;
  for (const c of t.caravans.filter((x) => x.dest === dest)) {
    t.stock[c.good] = Math.min(20, (t.stock[c.good] || 0) + c.qty); // the warehouse holds 20 loads (trade.js MAX_STOCK)
  }
  t.caravans = t.caravans.filter((x) => x.dest !== dest);
}

/** Obligations to a lord or a king the player has outgrown. */
function dropStageContracts(state, dest) {
  if (state.trade && state.trade.contracts) state.trade.contracts = state.trade.contracts.filter((c) => c.dest !== dest);
}

// ---------- promotions inside one chronicle ----------

// the chapter card (events_career.js) that opens each new stage of life
const CHAPTER_EVENT = { ennobled: 'kapitola_erb', crowned: 'kapitola_koruna' };

/**
 * The house rises one stage in the same save: a peasant with a coat of arms becomes a noble,
 * a noble who took the throne becomes the king. Returns the stage reached, or null.
 */
export function promote(state, type) {
  if (type === 'ennobled' && state.scenario === 'sedlak') ennoblePeasant(state);
  else if (type === 'crowned' && state.scenario === 'slechtic') crownNoble(state);
  else return null;
  state.milestones = state.milestones || {};
  state.milestones[type] = state.turn;
  // echoes of the old life that no longer fit the new one are dropped when due (engine takeDueEcho)
  dropAmbition(state); // a serf's or a vassal's goals do not fit the new life
  bringCaravansHome(state, type === 'ennobled' ? 'manor' : 'court');
  // the chapter card comes first; whatever was waiting (the king's death, a war's end) comes after it
  if (state.pendingEvent) (state.eventQueue = state.eventQueue || []).unshift(state.pendingEvent);
  state.pendingEvent = CHAPTER_EVENT[type];
  return type;
}

export function makeChronicleEntry(state, text) {
  return { turn: state.turn, year: state.year, season: state.seasonIndex, text };
}

// ---------- persistence ----------

function readIndex() {
  try {
    return JSON.parse(localStorage.getItem(SAVE_INDEX_KEY)) || [];
  } catch {
    return [];
  }
}

function writeIndex(index) {
  localStorage.setItem(SAVE_INDEX_KEY, JSON.stringify(index));
}

export function saveGame(state) {
  if (!state.slotId) {
    state.slotId = `slot_${Date.now()}_${randInt(1000, 9999)}`;
  }
  localStorage.setItem(SAVE_PREFIX + state.slotId, JSON.stringify(state));
  const index = readIndex().filter((s) => s.slotId !== state.slotId);
  index.unshift({
    slotId: state.slotId,
    dynastyName: state.dynastyName,
    rulerName: state.ruler.name,
    year: state.year,
    generation: state.generation,
    savedAt: Date.now(),
  });
  writeIndex(index);
  return state.slotId;
}

export function listSaves() {
  return readIndex();
}

export function loadGame(slotId) {
  const raw = localStorage.getItem(SAVE_PREFIX + slotId);
  return raw ? JSON.parse(raw) : null;
}

export function loadMostRecentSave() {
  const index = readIndex();
  if (!index.length) return null;
  return loadGame(index[0].slotId);
}

export function deleteSave(slotId) {
  localStorage.removeItem(SAVE_PREFIX + slotId);
  writeIndex(readIndex().filter((s) => s.slotId !== slotId));
}

export function loadSettings() {
  try {
    return { typewriter: true, musicMuted: false, musicVolume: 60, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) };
  } catch {
    return { typewriter: true, musicMuted: false, musicVolume: 60 };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
