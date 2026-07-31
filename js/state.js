import { RESOURCE_DEFS, PROVINCE_TEMPLATES, randInt, randomName, clamp } from './data.js';

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

export function createNewGame(rulerName, dynastyName) {
  const rulerGender = Math.random() < 0.5 ? 'male' : 'female';
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
    },
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
    return { typewriter: true, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) };
  } catch {
    return { typewriter: true };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
