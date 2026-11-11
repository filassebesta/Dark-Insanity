import { RESOURCE_DEFS, PROVINCE_TEMPLATES, NOBLE_HOUSES, NOBLE_HOME, randInt, randomName, clamp } from './data.js';

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
  };
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

export function createNewGame(rulerName, dynastyName, gender, scenario = 'panovnik') {
  return scenario === 'slechtic'
    ? createNobleGame(rulerName, dynastyName, gender)
    : createKingGame(rulerName, dynastyName, gender);
}

function createKingGame(rulerName, dynastyName, gender) {
  const rulerGender = gender === 'female' || gender === 'male' ? gender : (Math.random() < 0.5 ? 'male' : 'female');
  const spouseGender = rulerGender === 'male' ? 'female' : 'male';

  return {
    version: 1,
    scenario: 'panovnik',
    dynastyName: dynastyName || 'bezejmenného rodu',
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
  // every province exists on the map, but only the home estate is the player's
  const owners = { capital: 'crown', [NOBLE_HOME]: 'player' };
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
  state.noble = { province: NOBLE_HOME, plot: 0, secrets: 0 };
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
  state.gameOver = null;
  const f = state.ruler.gender === 'female';
  state.chronicle.push(makeChronicleEntry(state, `${state.ruler.name} z rodu ${state.dynastyName} ${f ? 'byla korunována královnou' : 'byl korunován králem'}. Rod, který začínal s jedinou tvrzí, teď vládne celé zemi.`));
  return state;
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
