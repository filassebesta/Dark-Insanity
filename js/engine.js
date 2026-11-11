import { SEASONS, TERRAIN_DEFS, NOBLE_HOUSES, clamp, randomName, randInt, tierTitle } from './data.js';
import { makeChronicleEntry } from './state.js';
import { EVENTS, QUIET_EVENTS } from './events.js';
import { roleLabel } from './court.js';

const TRAIT_MIN = 1;
const TRAIT_MAX = 10;
const GOLDEN_AGE_TARGET = 12; // consecutive seasons (three years) of prosperity needed

export function interpolate(state, text) {
  const ctx = state.eventContext || {};
  const province = ctx.province && state.provinces.find((p) => p.id === ctx.province);
  const target = ctx.role && state[ctx.role];
  const house = ctx.house && houseOf(state, ctx.house);
  const king = state.king;
  const own = ownProvinces(state)[0];
  const dict = {
    'ruler.name': state.ruler.name,
    'heir.name': state.heir.alive ? state.heir.name : 'nikdo',
    'spouse.name': state.spouse.alive ? state.spouse.name : 'nikdo',
    'chancellor.name': state.chancellor.name,
    'marshal.name': state.marshal.name,
    'spymaster.name': state.spymaster.name,
    'dynastyName': state.dynastyName,
    'province.name': province ? province.name.replace(/ \(.*\)$/, '') : 'provincie',
    'target.name': target ? target.name : '',
    'target.role': target ? roleLabel(ctx.role, target.gender, state.scenario).toLowerCase() : '',
    'target.age': target ? String(target.age) : '',
    'target.Old': target && target.gender === 'female' ? 'Stará' : 'Starý',
    'target.died': target && target.gender === 'female' ? 'zemřela' : 'zemřel',
    'target.your': target && target.gender === 'female' ? 'tvoje' : 'tvůj',
    'ruler.title': tierTitle(state.ruler.statusTier, state.ruler.gender).toLowerCase(),
    'own.name': own ? own.name.replace(/ \(.*\)$/, '') : '',
  };
  if (house) {
    Object.assign(dict, {
      'house.name': house.def.name, 'house.short': house.def.short,
      'house.head': house.head.name, 'house.headTitle': house.head.gender === 'female' ? 'paní' : 'pán',
      'house.HeadTitle': house.head.gender === 'female' ? 'Paní' : 'Pán',
      'house.seat': state.provinces.find((p) => p.id === house.def.seat).name,
    });
  }
  if (king) {
    const kh = king.heir || {};
    Object.assign(dict, {
      'king.name': king.name, 'king.age': String(king.age),
      'king.heirName': kh.name || '', 'king.heirTitle': kh.gender === 'female' ? 'princezna' : 'princ',
      'king.heirTitleGen': kh.gender === 'female' ? 'princezny' : 'prince',
    });
  }
  // gendered titles: {chancellor.Title} = Kancléř / Kancléřka, {chancellor.title} = lower case
  for (const role of ['chancellor', 'marshal', 'spymaster']) {
    const t = roleLabel(role, state[role].gender, state.scenario);
    dict[`${role}.Title`] = t;
    dict[`${role}.title`] = t.toLowerCase();
  }
  // gendered word forms: {R:přijel|přijela} follows the ruler, {H:...} the house head in context
  const genderOf = { R: state.ruler.gender, H: house ? house.head.gender : 'male' };
  return text
    .replace(/\{([RH]):([^|{}]*)\|([^|{}]*)\}/g, (m, who, male, female) => (genderOf[who] === 'female' ? female : male))
    .replace(/\{([\w.]+)\}/g, (m, key) => (key in dict ? dict[key] : m));
}

// ---------- scenario helpers ----------

export function isNoble(state) {
  return state.scenario === 'slechtic';
}

/** Provinces the player actually rules (all of them as king, the home estate as a noble). */
export function ownProvinces(state) {
  return state.provinces.filter((p) => !p.lost && (!p.owner || p.owner === 'player'));
}

export function houseOf(state, id) {
  const h = (state.houses || []).find((x) => x.id === id);
  return h ? { ...h, def: NOBLE_HOUSES.find((d) => d.id === id) } : null;
}

export function attitudeLabel(attitude) {
  if (attitude >= 75) return 'Přátelský';
  if (attitude >= 55) return 'Vstřícný';
  if (attitude >= 40) return 'Neutrální';
  if (attitude >= 25) return 'Chladný';
  return 'Nepřátelský';
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

const PROVINCE_STAT_LABELS = { loyalty: 'věrnost', unrest: 'nepokoje', wealth: 'bohatství', garrison: 'posádka' };

// provinceEffects: { <provinceId> | 'target' | '*': { loyalty, unrest, wealth, garrison, lost } }
function applyProvinceEffects(state, provinceEffects, notes) {
  if (!provinceEffects) return;
  for (const [key, fx] of Object.entries(provinceEffects)) {
    const ids = (key === '*' || key === 'own') ? ownProvinces(state).map((p) => p.id)
      : [key === 'target' ? state.eventContext?.province : key];
    for (const id of ids) {
      const prov = state.provinces.find((p) => p.id === id);
      if (!prov || prov.lost) continue;
      const shortName = prov.name.replace(/ \(.*\)$/, '');
      if (fx.lost) {
        prov.lost = true;
        notes.push({ text: `Ztracena provincie ${shortName}`, tone: 'neg' });
        continue;
      }
      for (const stat of Object.keys(PROVINCE_STAT_LABELS)) {
        if (!fx[stat]) continue;
        prov[stat] = clamp(prov[stat] + fx[stat]);
        if (key !== '*' || isNoble(state)) {
          const good = stat === 'unrest' ? fx[stat] < 0 : fx[stat] > 0;
          notes.push({ text: `${shortName}: ${PROVINCE_STAT_LABELS[stat]} ${fx[stat] > 0 ? '+' : ''}${fx[stat]}`, tone: good ? 'pos' : 'neg' });
        }
      }
    }
    if (key === '*' && !isNoble(state)) {
      const [stat, val] = Object.entries(fx)[0] || [];
      if (stat) notes.push({ text: `Všechny provincie: ${PROVINCE_STAT_LABELS[stat]} ${val > 0 ? '+' : ''}${val}`, tone: (stat === 'unrest' ? val < 0 : val > 0) ? 'pos' : 'neg' });
    }
  }
}

// courtEffects: { <role> | 'target': { loyalty } }
function applyCourtEffects(state, courtEffects, notes, touched) {
  if (!courtEffects) return;
  for (const [key, fx] of Object.entries(courtEffects)) {
    const role = key === 'target' ? state.eventContext?.role : key;
    const c = state[role];
    if (!c || c.alive === false || !fx.loyalty) continue;
    c.loyalty = clamp(c.loyalty + fx.loyalty);
    touched[role] = (touched[role] || 0) + fx.loyalty;
    notes.push({ text: `${c.name}: věrnost ${fx.loyalty > 0 ? '+' : ''}${fx.loyalty}`, tone: fx.loyalty > 0 ? 'pos' : 'neg' });
  }
}

const COURT_ROLES = ['heir', 'spouse', 'chancellor', 'marshal', 'spymaster'];

// Every decision that involved a court member (named in the event, targeted by it
// or changing their loyalty) goes into that person's own history.
function recordCourtHistory(state, meta, touched, outcome) {
  if (!meta || !meta.event) return;
  const involved = new Set(Object.keys(touched));
  for (const role of COURT_ROLES) {
    if (meta.event.text.includes(`{${role}.name}`)) involved.add(role);
  }
  if (state.eventContext?.role && !meta.replaced) involved.add(state.eventContext.role);
  for (const role of involved) {
    const c = state[role];
    if (!c || c.alive === false) continue;
    c.history = c.history || [];
    c.history.push({
      year: state.year, season: state.seasonIndex,
      title: meta.event.title, choice: meta.label, outcome,
      delta: touched[role] ?? null,
    });
    if (c.history.length > 40) c.history.shift();
  }
}

// replaceCourt: { loyalty, minAge, maxAge } — the targeted adviser is replaced by a new one
function applyCourtReplacement(state, spec, notes, meta) {
  if (!spec) return;
  const role = state.eventContext?.role;
  if (!role || !state[role]) return;
  const gender = Math.random() < 0.5 ? 'male' : 'female';
  state[role] = {
    role, name: randomName(gender), gender,
    age: randInt(spec.minAge ?? 30, spec.maxAge ?? 50),
    loyalty: clamp((spec.loyalty ?? 60) + randInt(-5, 5)), alive: true,
    history: [{ year: state.year, season: state.seasonIndex, title: 'Jmenování do úřadu', choice: meta?.label || '', outcome: 'normal', delta: null }],
  };
  if (meta) meta.replaced = true;
  const fem = state[role].gender === 'female';
  notes.push({ text: `${fem ? 'Nová' : 'Nový'} ${roleLabel(role, state[role].gender, state.scenario).toLowerCase()}: ${state[role].name}`, tone: 'pos' });
}

// houseEffects: { <houseId> | 'target' | '*' | 'allies': { attitude, power, ally, married } }
function applyHouseEffects(state, houseEffects, notes) {
  if (!houseEffects || !state.houses) return;
  for (const [key, fx] of Object.entries(houseEffects)) {
    const list = key === '*' ? state.houses
      : key === 'allies' ? state.houses.filter((h) => h.ally)
        : state.houses.filter((h) => h.id === (key === 'target' ? state.eventContext?.house : key));
    for (const h of list) {
      const short = NOBLE_HOUSES.find((d) => d.id === h.id).short;
      if (fx.attitude) {
        h.attitude = clamp(h.attitude + fx.attitude);
        notes.push({ text: `${short}: vztah ${fx.attitude > 0 ? '+' : ''}${fx.attitude}`, tone: fx.attitude > 0 ? 'pos' : 'neg' });
      }
      if (fx.power) {
        h.power = clamp(h.power + fx.power);
        notes.push({ text: `${short}: moc ${fx.power > 0 ? '+' : ''}${fx.power}`, tone: fx.power < 0 ? 'pos' : 'neg' });
      }
      if (fx.ally !== undefined && h.ally !== fx.ally) {
        h.ally = fx.ally;
        notes.push({ text: fx.ally ? `Spojenectví: ${short}` : `Konec spojenectví: ${short}`, tone: fx.ally ? 'pos' : 'neg' });
      }
      if (fx.married) {
        h.married = true;
        notes.push({ text: `Sňatek s rodem: ${short}`, tone: 'pos' });
      }
    }
  }
}

// noble: { plot, secrets } — the conspiracy (0-3) and compromising secrets in hand
function applyNobleEffects(state, fx, notes) {
  if (!fx || !state.noble) return;
  if (fx.plot) {
    state.noble.plot = Math.max(0, Math.min(3, state.noble.plot + fx.plot));
    notes.push({ text: `Spiknutí: ${state.noble.plot}/3`, tone: fx.plot > 0 ? 'pos' : 'neg' });
  }
  if (fx.plotReset) {
    state.noble.plot = 0;
    notes.push({ text: 'Spiknutí rozpuštěno', tone: 'neg' });
  }
  if (fx.secrets) {
    state.noble.secrets = Math.max(0, state.noble.secrets + fx.secrets);
    notes.push({ text: `Tajemství v rukou: ${state.noble.secrets}`, tone: fx.secrets > 0 ? 'pos' : 'neg' });
  }
}

export const NOBLE_ENDINGS = {
  crowned: (s) => `${s.ruler.name} z rodu ${s.dynastyName} usedá na trůn. Rod, který začínal s jedinou tvrzí na pobřeží, teď vládne celé zemi.`,
  executed: (s) => `Spiknutí bylo odhaleno. ${s.ruler.name} končí na popravišti a jméno rodu ${s.dynastyName} je vymazáno z listin.`,
  exile: (s) => `Král ztratil s rodem ${s.dynastyName} trpělivost. Panství bylo zabaveno a ${s.ruler.name} odchází s rodinou do vyhnanství.`,
};

/** A new monarch takes the throne (the old king's heir, or a stranger if there is none). */
function crownNewKing(state) {
  const old = state.king;
  const heir = old.heir && old.heir.alive ? old.heir : null;
  const g = heir ? heir.gender : 'male';
  state.king = {
    name: heir ? heir.name : randomName('male'), gender: g, age: heir ? heir.age : randInt(30, 45), alive: true,
    heir: null, reign: (old.reign || 1) + 1,
  };
  state.resources.favor = clamp(Math.round((state.resources.favor + 50) / 2));
}

function applyBranch(state, branch, meta, outcome = 'normal') {
  const notes = [];
  const touched = {};
  applyHouseEffects(state, branch.houseEffects, notes);
  applyNobleEffects(state, branch.noble, notes);
  if (branch.setTier && branch.setTier !== state.ruler.statusTier) {
    state.ruler.statusTier = branch.setTier;
    notes.push({ text: `Nový titul: ${tierTitle(branch.setTier, state.ruler.gender)}`, tone: 'pos' });
  }
  if (branch.newKing && state.king) {
    crownNewKing(state);
    notes.push({ text: `Nový panovník: ${state.king.name}`, tone: 'pos' });
  }
  if (branch.endGame && NOBLE_ENDINGS[branch.endGame]) {
    state.gameOver = { type: branch.endGame, text: NOBLE_ENDINGS[branch.endGame](state) };
  }
  applyEffects(state, branch.effects);
  applyHiddenEffects(state, branch.hiddenEffects);
  applyProvinceEffects(state, branch.provinceEffects, notes);
  applyCourtEffects(state, branch.courtEffects, notes, touched);
  applyCourtReplacement(state, branch.replaceCourt, notes, meta);
  recordCourtHistory(state, meta, touched, outcome);
  scheduleEcho(state, branch.echo, meta);
  tallyReign(state, branch, meta, outcome);
  return notes;
}

// ---------- echoes: decisions that come back years later ----------

// branch.echo = { event: '<echo event id>', after: [minTurns, maxTurns] }
function scheduleEcho(state, spec, meta) {
  if (!spec || !meta || !meta.event) return;
  state.echoes = state.echoes || [];
  if (state.echoes.some((e) => e.event === spec.event)) return; // the same story only once at a time
  const [a, b] = spec.after || [8, 16];
  state.echoes.push({
    event: spec.event,
    due: state.turn + randInt(a, b),
    context: state.eventContext ? { ...state.eventContext } : null,
    from: { year: state.year, title: meta.event.title, choice: meta.label, ruler: state.ruler.name, gender: state.ruler.gender },
  });
}

/** The next echo whose time has come, or null. Echoes whose story no longer fits are dropped. */
function takeDueEcho(state) {
  const list = state.echoes || [];
  for (let i = 0; i < list.length; i++) {
    const echo = list[i];
    if (echo.due > state.turn) continue;
    list.splice(i, 1);
    i -= 1;
    const event = EVENTS.find((e) => e.id === echo.event);
    if (!event || (event.scenario || 'panovnik') !== state.scenario) continue;
    state.eventContext = echo.context;
    if (event.requires && !event.requires(state)) { state.eventContext = null; continue; }
    state.echoOrigin = echo.from;
    return event;
  }
  return null;
}

// ---------- crises: what happens when a resource runs out ----------

const CRISES = [
  { key: 'food', max: 3, event: 'krize_hlad' },
  { key: 'gold', max: 2, event: 'krize_pokladna' },
  { key: 'favor', max: 10, event: 'krize_nemilost', scenario: 'slechtic' },
  { key: 'army', max: 5, event: 'krize_vojsko' },
  { key: 'legitimacy', max: 8, event: 'krize_uchvatitel', scenario: 'panovnik' },
  { key: 'faith', max: 8, event: 'krize_vira' },
  { key: 'prestige', max: 5, event: 'krize_posmech' },
];
const CRISIS_COOLDOWN = 12;

function raiseCrisis(state) {
  if (state.pendingEvent) return;
  const history = state.eventHistory || {};
  for (const c of CRISES) {
    if (c.scenario && c.scenario !== state.scenario) continue;
    const value = state.resources[c.key];
    if (value === undefined || value > c.max) continue;
    if (history[c.event] !== undefined && state.turn - history[c.event] < CRISIS_COOLDOWN) continue;
    state.pendingEvent = c.event;
    return;
  }
}

// ---------- the reign: deeds, battles and the name history will give the ruler ----------

function newReign() {
  return { rolls: { won: 0, lost: 0 }, battles: { won: 0, lost: 0 }, sums: {}, unrest: 0, deeds: [] };
}

function reignOf(state) {
  if (!state.reign) state.reign = newReign();
  return state.reign;
}

function tallyReign(state, branch, meta, outcome) {
  if (!meta || !meta.event || /^(quiet_season|n_klidne_obdobi)$/.test(meta.event.id)) return;
  const reign = reignOf(state);
  let weight = 0;
  for (const [k, v] of Object.entries(branch.effects || {})) {
    reign.sums[k] = (reign.sums[k] || 0) + v;
    weight += Math.abs(v);
  }
  for (const fx of Object.values(branch.provinceEffects || {})) {
    if (fx.unrest) reign.unrest += fx.unrest;
    weight += Math.abs(fx.loyalty || 0) + Math.abs(fx.unrest || 0) + (fx.lost ? 40 : 0);
  }
  if (outcome === 'success' || outcome === 'failure') {
    reign.rolls[outcome === 'success' ? 'won' : 'lost'] += 1;
    if (meta.battle) reign.battles[outcome === 'success' ? 'won' : 'lost'] += 1;
    weight += 10;
  }
  if (branch.setTier || branch.newKing || branch.endGame) weight += 60;
  if (meta.event.forced) weight += 15;
  // the three weightiest decisions of a reign are what the chronicle remembers
  reign.deeds.push({ year: state.year, title: meta.event.title, choice: meta.label, outcome, weight });
  reign.deeds.sort((x, y) => y.weight - x.weight);
  reign.deeds.length = Math.min(reign.deeds.length, 3);
}

// Adjective epithets [male, female, reason]; the strongest claim on the ruler's memory wins.
const EPITHETS = {
  brave: ['Udatný', 'Udatná', 'za bitvy, které vyhrál{|a}'],
  unlucky: ['Nešťastný', 'Nešťastná', 'za to, že {mu|jí} štěstí nepřálo'],
  thrifty: ['Hospodárný', 'Hospodárná', 'za plnou pokladnici'],
  generous: ['Štědrý', 'Štědrá', 'za zlato, které rozdal{|a}'],
  pious: ['Zbožný', 'Zbožná', 'za věrnost církvi'],
  godless: ['Bezbožný', 'Bezbožná', 'za spory s církví'],
  famous: ['Slavný', 'Slavná', 'za slávu rodu'],
  cruel: ['Krutý', 'Krutá', 'za tvrdou ruku'],
  good: ['Dobrý', 'Dobrá', 'za laskavost k poddaným'],
  strong: ['Silný', 'Silná', 'za sílu paže i vůle'],
  eloquent: ['Výmluvný', 'Výmluvná', 'za dar slova'],
  wise: ['Moudrý', 'Moudrá', 'za moudrost v radě'],
  patient: ['Trpělivý', 'Trpělivá', 'za klid v bouřích'],
  old: ['Starý', 'Stará', 'za dlouhý život'],
  quiet: ['Tichý', 'Tichá', 'za vládu bez velkých bouří'],
};

/** The name history gives the current ruler, judged by the reign so far. */
export function reignEpithet(state, ruler = state.ruler) {
  const reign = reignOf(state);
  const s = reign.sums;
  const t = ruler.traits;
  const years = Math.round((state.turn - (ruler.reignStartTurn || 0)) / 4);
  const scores = {
    brave: reign.battles.won >= 3 && reign.battles.won > reign.battles.lost ? 20 + reign.battles.won * 8 : 0,
    unlucky: reign.rolls.lost >= 5 && reign.rolls.lost > reign.rolls.won * 1.5 ? 15 + reign.rolls.lost * 4 : 0,
    thrifty: (s.gold || 0) / 2,
    generous: -(s.gold || 0) / 2,
    pious: s.faith || 0,
    godless: -(s.faith || 0),
    famous: s.prestige || 0,
    cruel: reign.unrest,
    good: -reign.unrest,
    strong: (t.strength - 7) * 16,
    eloquent: (t.eloquence - 7) * 16,
    wise: (t.intelligence - 7) * 16,
    patient: (t.patience - 7) * 16,
    old: ruler.age >= 72 ? 20 + (ruler.age - 72) * 3 : 0,
  };
  let best = 'quiet';
  let bestScore = 28; // anything weaker than this leaves a quiet name
  for (const [key, score] of Object.entries(scores)) {
    if (score > bestScore) { best = key; bestScore = score; }
  }
  if (best === 'quiet' && years < 2) return null; // too early to tell
  const [male, female, reason] = EPITHETS[best];
  const f = ruler.gender === 'female';
  return {
    key: best,
    word: f ? female : male,
    reason: reason.replace(/\{([^|{}]*)\|([^|{}]*)\}/g, (m, a, b) => (f ? b : a)),
  };
}

export function computeSuccessChance(state, choice) {
  let chance = choice.baseChance ?? 0.5;
  if (choice.traitKey) chance += (state.ruler.traits[choice.traitKey] || 0) * (choice.traitScale ?? 0.03);
  // optional resource weight, e.g. a battle depends on the size of the army
  if (choice.resourceKey) chance += ((state.resources[choice.resourceKey] ?? 50) - 50) / 100 * (choice.resourceScale ?? 0.4);
  if (choice.chanceBonus) chance += choice.chanceBonus(state); // e.g. allies backing a claim
  return Math.max(0.05, Math.min(0.95, chance));
}

function markEventSeen(state, event) {
  state.usedEvents = state.usedEvents || [];
  if (!state.usedEvents.includes(event.id)) state.usedEvents.push(event.id);
  state.eventHistory = state.eventHistory || {};
  state.eventHistory[event.id] = state.turn;
  state.lastEventId = event.id;
  if (event.markSeen) event.markSeen(state);
}

export function resolveChoice(state, event, choiceIndex) {
  const choice = event.choices[choiceIndex];
  let outcome = 'normal';
  let branch = choice;

  if (choice.isRoll) {
    const chance = computeSuccessChance(state, choice);
    const success = Math.random() < chance;
    branch = success ? choice.onSuccess : choice.onFailure;
    outcome = success ? 'success' : 'failure';
  }

  const notes = applyBranch(state, branch, { event, label: choice.label, battle: choice.resourceKey === 'army' }, outcome);
  const traitGained = branch.traitGain || null;
  if (traitGained) {
    state.ruler.traits[traitGained] = clampTrait(state.ruler.traits[traitGained] + 1);
  }
  const text = branch.chronicle ? interpolate(state, branch.chronicle) : '';
  if (text) state.chronicle.push(makeChronicleEntry(state, text));
  markEventSeen(state, event);

  return { outcome, effects: branch.effects || {}, traitGained, text, notes, music: branch.music || null };
}

export function resolveRouteChoice(state, event, terrainKey) {
  const option = event.routeOptions.find((o) => o.terrainKey === terrainKey);
  const risk = TERRAIN_DEFS[terrainKey] ? TERRAIN_DEFS[terrainKey].baseRisk : 0.3;
  const danger = Math.random() < risk;
  const branch = danger ? option.onDanger : option.onSafe;
  const notes = applyBranch(state, branch, { event, label: TERRAIN_DEFS[terrainKey]?.label || terrainKey }, danger ? 'danger' : 'safe');
  const text = branch.chronicle ? interpolate(state, branch.chronicle) : '';
  if (text) state.chronicle.push(makeChronicleEntry(state, text));
  markEventSeen(state, event);
  return { outcome: danger ? 'danger' : 'safe', effects: branch.effects || {}, traitGained: null, text, notes, terrainKey };
}

const DEFAULT_COOLDOWN = 10; // turns (two and a half years) before an event can repeat
const QUIET_CHANCE = 0.12;

function eventAvailable(state, e) {
  if ((e.scenario || 'panovnik') !== state.scenario) return false;
  if (e.forced) return false; // only ever raised by the engine (state.pendingEvent)
  if (e.oneTime && (state.usedEvents || []).includes(e.id)) return false;
  const last = (state.eventHistory || {})[e.id];
  if (last !== undefined && state.turn - last < (e.cooldown ?? DEFAULT_COOLDOWN)) return false;
  if (e.id === state.lastEventId) return false;
  if (e.minTurn && state.turn < e.minTurn) return false;
  if (e.seasons && !e.seasons.includes(state.seasonIndex)) return false;
  if (e.requires && !e.requires(state)) return false;
  if (e.target && !e.target(state)) return false;
  return true;
}

export function pickNextEvent(state) {
  state.eventContext = null;
  state.echoOrigin = null;
  if (state.pendingEvent) {
    const forced = EVENTS.find((e) => e.id === state.pendingEvent);
    state.pendingEvent = null;
    if (forced) return forced;
  }
  const echo = takeDueEcho(state);
  if (echo) return echo;
  const QUIET_EVENT = QUIET_EVENTS[state.scenario] || QUIET_EVENTS.panovnik;
  const available = EVENTS.filter((e) => eventAvailable(state, e));
  const quietAllowed = state.lastEventId !== QUIET_EVENT.id;
  if (!available.length || (quietAllowed && Math.random() < QUIET_CHANCE)) {
    return quietAllowed || !available.length ? QUIET_EVENT : available[0];
  }
  // weighted draw: consequence events (weight 3) surface sooner than ordinary ones
  const total = available.reduce((sum, e) => sum + (e.weight ?? 1), 0);
  let roll = Math.random() * total;
  let event = available[available.length - 1];
  for (const e of available) {
    roll -= e.weight ?? 1;
    if (roll <= 0) { event = e; break; }
  }
  if (event.target) {
    const t = event.target(state);
    if (state.provinces.some((p) => p.id === t)) state.eventContext = { province: t };
    else if ((state.houses || []).some((h) => h.id === t)) state.eventContext = { house: t };
    else state.eventContext = { role: t };
  }
  return event;
}

function processTurnEconomy(state) {
  const lands = ownProvinces(state);
  const totalWealth = lands.reduce((s, p) => s + p.wealth, 0);
  const totalUnrest = lands.reduce((s, p) => s + p.unrest, 0);
  // taxes minus the court and the army; the land feeds itself, the harvest comes in
  // autumn and winter eats into the stores. A noble lives off a single estate.
  const SEASON_FOOD = isNoble(state) ? [-2, 0, 6, -5] : [-3, 0, 8, -7]; // jaro, léto, podzim, zima
  const [goldDiv, armyGoldDiv, foodDiv, armyFoodDiv] = isNoble(state) ? [11, 14, 16, 20] : [50, 15, 80, 25];
  const tierBonus = isNoble(state) && state.ruler.statusTier >= 4 ? 2 : 0;
  const goldIncome = Math.round(totalWealth / goldDiv) - Math.round(state.resources.army / armyGoldDiv) - 1 + traitBonuses(state).gold + tierBonus;
  const foodIncome = Math.round(totalWealth / foodDiv) - Math.round(state.resources.army / armyFoodDiv) + SEASON_FOOD[state.seasonIndex];
  state.resources.gold = clamp(state.resources.gold + goldIncome);
  state.resources.food = clamp(state.resources.food + foodIncome);
  // stability erodes only once the provinces are noticeably restless, and recovers under a legitimate ruler
  const held = lands.length || 1;
  const avgUnrest = totalUnrest / held - traitBonuses(state).calm;
  // a king's order rests on legitimacy, a noble's on the loyalty of his own villages
  const settled = isNoble(state)
    ? lands.every((p) => p.loyalty >= 50) || state.resources.favor >= 60
    : state.resources.legitimacy >= 55;
  if (avgUnrest > 30) state.resources.stability = clamp(state.resources.stability - Math.round((avgUnrest - 30) / 10));
  else if (settled && state.resources.stability < 70) state.resources.stability = clamp(state.resources.stability + 1);
  if (state.resources.food <= 5) state.resources.stability = clamp(state.resources.stability - 5);
  driftProvinces(state);
  if (isNoble(state)) driftNoble(state);
  return { goldIncome, foodIncome };
}

// Passive weight of the ruler's traits (5 is average): strength keeps order in
// the provinces, eloquence wins their loyalty, intelligence fills the treasury,
// patience keeps unrest from eating into stability.
export function traitBonuses(state) {
  const t = state.ruler.traits;
  return {
    order: t.strength - 5,        // lower unrest target in every province
    loyalty: t.eloquence - 5,     // higher loyalty target in every province
    gold: Math.floor((t.intelligence - 5) / 3), // extra gold each season
    calm: t.patience - 5,         // unrest tolerated before stability erodes
  };
}

const toward = (value, target, rate, maxStep) => {
  const step = Math.max(-maxStep, Math.min(maxStep, (target - value) * rate));
  return value + Math.round(step);
};

// Provinces drift toward what the realm makes of them: stability, garrisons and
// full granaries keep the peace, legitimacy earns loyalty. Events push them away.
function driftProvinces(state) {
  const r = state.resources;
  const bonus = traitBonuses(state);
  const noble = isNoble(state);
  for (const p of ownProvinces(state)) {
    // a noble's villages answer to their lord, not to a claim on the throne
    const unrestBase = noble ? 34 : 45;
    const unrestTarget = unrestBase - (r.stability - 50) * 0.6 - (p.garrison - 50) * 0.25 - (p.wealth - 50) * 0.15 + (r.food < 20 ? 20 : 0) - bonus.order;
    p.unrest = clamp(toward(p.unrest, unrestTarget, 0.2, 4) + randInt(-3, 3));
    const standing = noble ? 55 + (r.stability - 50) * 0.4 + (r.prestige - 50) * 0.2 : 45 + (r.legitimacy - 50) * 0.7 + (r.prestige - 50) * 0.2;
    const loyaltyTarget = standing - Math.max(0, p.unrest - 50) * 0.4 + bonus.loyalty;
    p.loyalty = clamp(toward(p.loyalty, loyaltyTarget, 0.15, 3) + randInt(-2, 2));
  }
  // fame and legitimacy fade unless renewed; faith settles back toward custom
  if (r.legitimacy > 55 && state.turn % 2 === 0) r.legitimacy -= 1;
  if (r.prestige > 50 && state.turn % 2 === 1) r.prestige -= 1;
  if (r.faith !== 50 && state.turn % 3 === 0) r.faith += r.faith > 50 ? -1 : 1;
}

// The king's goodwill and the rival houses' moods slowly settle unless events stir them.
function driftNoble(state) {
  const r = state.resources;
  if (r.favor > 55 && state.turn % 2 === 0) r.favor -= 1;
  if (r.favor < 45 && state.turn % 3 === 0) r.favor += 1;
  for (const h of state.houses) {
    if (state.turn % 3 === 0) h.attitude = clamp(toward(h.attitude, h.ally ? 65 : 48, 0.15, 2));
    h.power = clamp(h.power + randInt(-1, 1));
  }
}

function ageNobleWorld(state) {
  const k = state.king;
  if (k && k.alive) {
    k.age += 1;
    if (k.heir && k.heir.alive) k.heir.age += 1;
    const chance = k.age < 60 ? 0.01 : Math.min(0.45, (k.age - 58) * 0.03);
    if (Math.random() < chance) {
      k.alive = false;
      state.pendingEvent = 'n_smrt_krale';
    }
  }
  for (const h of state.houses) {
    h.head.age += 1;
    if (h.head.age > 64 && Math.random() < (h.head.age - 62) * 0.04) {
      const g = Math.random() < 0.75 ? 'male' : 'female';
      const successor = { name: randomName(g), gender: g, age: randInt(28, 45) };
      const houseName = NOBLE_HOUSES.find((d) => d.id === h.id).name;
      state.chronicle.push(makeChronicleEntry(state, `${h.head.gender === 'female' ? 'Zemřela' : 'Zemřel'} ${h.head.name}, hlava rodu ${houseName}. Rod nyní vede ${successor.name}.`));
      h.head = successor;
      h.attitude = clamp(Math.round((h.attitude + 48) / 2)); // a new head starts with a cleaner slate
    }
  }
}

function ageCharacters(state) {
  state.ruler.age += 1;
  if (state.heir.alive) state.heir.age += 1;
  if (state.spouse.alive) state.spouse.age += 1;
  state.chancellor.age += 1;
  state.marshal.age += 1;
  state.spymaster.age += 1;
  if (isNoble(state)) ageNobleWorld(state);
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
    state.pastRulers = state.pastRulers || [];
    state.ruler.alive = false;
    const epithet = reignEpithet(state);
    state.pastRulers.push({
      name: oldName,
      gender: state.ruler.gender,
      generation: state.generation,
      years: Math.max(1, Math.round((state.turn - (state.ruler.reignStartTurn || 0)) / 4)),
      diedAt: state.ruler.age,
      epithet: epithet ? epithet.word : null,
      epithetReason: epithet ? epithet.reason : null,
      deeds: reignOf(state).deeds,
    });
    state.reign = newReign();
    state.chronicle.push(makeChronicleEntry(state, `${oldName}${state.pastRulers.at(-1).epithet ? ` ${state.pastRulers.at(-1).epithet}` : ''} umírá stářím. ${isNoble(state) ? 'Panství' : 'Korunu'} přebírá ${newRulerName}.`));
    state.ruler = {
      name: newRulerName,
      gender: state.heir.gender,
      age: state.heir.age,
      traits: { strength: 5, eloquence: 5, intelligence: 5, patience: 5 },
      statusTier: state.ruler.statusTier,
      alive: true,
      reignStartTurn: state.turn,
    };
    state.generation += 1;
    generateSuccessorHousehold(state);
    state.pendingSuccessionCeremony = true;
    return true;
  }
  state.gameOver = {
    type: 'collapse',
    reason: 'dynasty-extinct',
    text: isNoble(state)
      ? `${state.ruler.name} umírá bez žijícího dědice. Rod ${state.dynastyName} vymírá a jeho panství připadá koruně.`
      : `${state.ruler.name} umírá bez žijícího dědice. Dynastie ${state.dynastyName} vymírá a království se hroutí do chaosu.`,
  };
  return false;
}

function updateGoldenAgeStreak(state) {
  if (isNoble(state)) return; // a noble wins by taking the throne instead
  const r = state.resources;
  const held = state.provinces.filter((p) => !p.lost);
  const avgUnrest = held.reduce((sum, p) => sum + p.unrest, 0) / (held.length || 1);
  const prosperous = r.stability >= 75 && r.gold >= 55 && r.food >= 50 && r.legitimacy >= 70
    && r.prestige >= 60 && avgUnrest <= 25 && held.length === state.provinces.length;
  state.goldenAgeStreak = prosperous ? state.goldenAgeStreak + 1 : 0;
}

export function checkEndConditions(state) {
  if (state.gameOver) return state.gameOver;
  if (isNoble(state)) {
    if (state.resources.favor <= 0) return { type: 'exile', text: NOBLE_ENDINGS.exile(state) };
    if (!ownProvinces(state).length) {
      return { type: 'exile', text: `Panství rodu ${state.dynastyName} padlo do cizích rukou. ${state.ruler.name} odchází do vyhnanství bez půdy a bez jména.` };
    }
    if (state.resources.stability <= 0) {
      return { type: 'collapse', reason: 'stability', text: 'Panství se vzbouřilo. Sedláci vypálili tvrz a král odmítl pomoci rodu, který neudrží ani vlastní vesnice.' };
    }
    return null;
  }
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

  raiseCrisis(state);
  const event = pickNextEvent(state);
  state.currentEvent = event ? event.id : null;
  return { turnSummary, event, successionOccurred, gameOver: null };
}
