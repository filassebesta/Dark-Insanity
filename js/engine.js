import { SEASONS, TERRAIN_DEFS, NOBLE_HOUSES, PEASANT_HOME, clamp, randomName, randInt, tierTitle } from './data.js';
import { makeChronicleEntry, inheritTraits } from './state.js';
import { EVENTS, QUIET_EVENTS } from './events.js';
import { roleLabel, QUIRK_ROLES, randomQuirk, quirkLabel } from './court.js';
import { processTrade, resolveIncident, resolveOffer, addTradeMod, ensureTrade, cargoTokens, GOODS, MAX_STOCK } from './trade.js';
import { processBuilding, buildingDrift, applyTownEffects, settlementDef } from './build.js';
import {
  effectiveTraits, injuryMods, injure, applyInjuryEffects, processInjuries, injuryTokens,
  injuryEpithetScores, INJURY_EPITHETS, lastingInjuryNames, STRENGTH_FAIL_INJURY,
} from './injuries.js';

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
  Object.assign(dict, cargoTokens(state));
  Object.assign(dict, injuryTokens(state));
  const town = ctx.town && settlementDef(ctx.town);
  if (town) {
    // {town.name} Brod, {town.loc} v Brodu, {town.Loc} V Brodu
    Object.assign(dict, { 'town.name': town.name, 'town.loc': town.loc, 'town.Loc': town.loc[0].toUpperCase() + town.loc.slice(1) });
  }
  const lord = lordOf(state);
  if (lord) {
    Object.assign(dict, {
      'lord.name': lord.name, 'lord.title': lord.gender === 'female' ? 'paní' : 'pán',
      'lord.Title': lord.gender === 'female' ? 'Paní' : 'Pán',
      'lord.house': NOBLE_HOUSES.find((d) => d.id === PEASANT_HOME.house).name,
      village: PEASANT_HOME.village,
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
  const genderOf = {
    R: state.ruler.gender, H: house ? house.head.gender : 'male',
    T: target ? target.gender : 'male', D: state.heir ? state.heir.gender : 'male',
    L: lord ? lord.gender : 'male', M: state.spouse ? state.spouse.gender : 'male',
  };
  return text
    .replace(/\{([RHTDLM]):([^|{}]*)\|([^|{}]*)\}/g, (m, who, male, female) => (genderOf[who] === 'female' ? female : male))
    .replace(/\{([\w.]+)\}/g, (m, key) => (key in dict ? dict[key] : m));
}

// ---------- scenario helpers ----------

export function isNoble(state) {
  return state.scenario === 'slechtic';
}

export function isPeasant(state) {
  return state.scenario === 'sedlak';
}

/** The peasant's lord: the head of the house that owns the village. */
export function lordOf(state) {
  if (!isPeasant(state) || !state.houses) return null;
  const h = state.houses.find((x) => x.id === PEASANT_HOME.house);
  return h ? h.head : null;
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
    ...(QUIRK_ROLES.includes(role) ? { quirk: randomQuirk() } : {}),
    history: [{ year: state.year, season: state.seasonIndex, title: 'Jmenování do úřadu', choice: meta?.label || '', outcome: 'normal', delta: null }],
  };
  if (meta) meta.replaced = true;
  const fem = state[role].gender === 'female';
  const quirk = quirkLabel(state[role]);
  notes.push({ text: `${fem ? 'Nová' : 'Nový'} ${roleLabel(role, state[role].gender, state.scenario).toLowerCase()}: ${state[role].name}${quirk ? ` (${quirk.toLowerCase()})` : ''}`, tone: 'pos' });
}

const TRAIT_NAMES = { strength: 'síla', eloquence: 'výřečnost', intelligence: 'inteligence', patience: 'trpělivost' };

// heirTraits: { strength: 2, ... } — upbringing shapes the next ruler
function applyHeirTraits(state, fx, notes) {
  if (!fx || !state.heir || state.heir.alive === false) return;
  state.heir.traits = state.heir.traits || inheritTraits();
  for (const [k, v] of Object.entries(fx)) {
    state.heir.traits[k] = clampTrait(state.heir.traits[k] + v);
    notes.push({ text: `${state.heir.name}: ${TRAIT_NAMES[k]} ${v > 0 ? '+' : ''}${v}`, tone: v > 0 ? 'pos' : 'neg' });
  }
}

// trade / tradeOffer / tradeMod / tradeStock (see events_trade.js)
function applyTradeEffects(state, branch, notes) {
  if (branch.trade) resolveIncident(state, branch.trade, notes);
  if (branch.tradeOffer !== undefined) {
    if (branch.tradeOffer > 0) resolveOffer(state, branch.tradeOffer, notes);
    else state.tradeCtx = null;
  }
  if (branch.tradeMod) addTradeMod(state, branch.tradeMod);
  if (branch.tradeStock) {
    const t = ensureTrade(state);
    for (const [g, n] of Object.entries(branch.tradeStock)) {
      t.stock[g] = Math.max(0, Math.min(MAX_STOCK, t.stock[g] + n));
      notes.push({ text: `Sklad: ${GOODS[g].name.toLowerCase()} ${n > 0 ? '+' : ''}${n}`, tone: n > 0 ? 'pos' : 'neg' });
    }
  }
}

/** Fills in what older saves lack: adviser quirks and the heir's own traits. */
export function ensureCourtData(state) {
  for (const role of QUIRK_ROLES) {
    if (state[role] && !state[role].quirk) state[role].quirk = randomQuirk();
  }
  if (state.heir && !state.heir.traits) state.heir.traits = inheritTraits(state.ruler.traits);
}

// Yearly weight of personalities, and the heir slowly growing up.
function applyQuirks(state) {
  const r = state.resources;
  for (const role of QUIRK_ROLES) {
    const c = state[role];
    if (!c || c.alive === false) continue;
    if (c.quirk === 'oddany') c.loyalty = Math.min(90, c.loyalty + 2);
    if (c.quirk === 'ctizadostivy' && r.prestige < 40) c.loyalty = clamp(c.loyalty - 3);
    if (c.quirk === 'chamtivy') r.gold = clamp(r.gold - 2);
    if (c.quirk === 'zbozny') r.faith = clamp(r.faith + 2);
  }
  const h = state.heir;
  if (h && h.alive !== false && h.age >= 6 && h.age <= 18 && Math.random() < 0.3) {
    h.traits = h.traits || inheritTraits();
    const keys = Object.keys(h.traits);
    const k = keys[randInt(0, keys.length - 1)];
    h.traits[k] = clampTrait(h.traits[k] + 1);
  }
}

function capable(state, role) {
  const c = state[role];
  return !!c && c.alive !== false && c.quirk === 'schopny';
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
  ennobled: (s) => `${s.ruler.name} z rodu ${s.dynastyName} {R:povstal|povstala} jako {R:šlechtic|šlechtična}. Rod, který oral cizí pole, bude mít vlastní erb a vlastní tvrz.`,
  expelled: (s) => `Pán ztratil s rodem ${s.dynastyName} trpělivost. Grunt dostal jiný hospodář a ${s.ruler.name} odchází s rodinou a uzlíkem na cestu, která nikam nevede.`,
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
    state.gameOver = { type: branch.endGame, text: interpolate(state, NOBLE_ENDINGS[branch.endGame](state)) };
  }
  applyEffects(state, branch.effects);
  applyHiddenEffects(state, branch.hiddenEffects);
  applyProvinceEffects(state, branch.provinceEffects, notes);
  applyCourtEffects(state, branch.courtEffects, notes, touched);
  applyCourtReplacement(state, branch.replaceCourt, notes, meta);
  applyHeirTraits(state, branch.heirTraits, notes);
  applyTradeEffects(state, branch, notes);
  applyTownEffects(state, state.eventContext?.town, branch.town, notes);
  applyInjuryEffects(state, branch, notes); // wounds, cures and wooden legs
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

// ---------- decrees: one deliberate act a year, issued from the map ----------

// prov = effects on the chosen province; effects = on the realm's resources
export const DECREES = {
  garrison: { label: 'Posílit posádku', text: 'Naverbovat a vyzbrojit muže pro místní posádku.', effects: { gold: -10 }, prov: { garrison: 15, unrest: -4 } },
  relief: { label: 'Odpustit dávky', text: 'Na rok odpustit kraji část dávek.', effects: { gold: -8 }, prov: { loyalty: 10, unrest: -10 } },
  develop: { label: 'Zvelebit kraj', text: 'Cesty, mlýny a tržiště. Vyplatí se až časem.', effects: { gold: -15 }, prov: { wealth: 8 } },
  shrine: { label: 'Postavit kapli', text: 'Kaple a kněz pro kraj, který po nich volá.', effects: { gold: -8, faith: 4 }, prov: { loyalty: 4 } },
  levy: { label: 'Vybrat mimořádnou daň', text: 'Zlato hned, nevole na dlouho.', effects: { gold: 12 }, prov: { loyalty: -8, unrest: 10 } },
  muster: { label: 'Odvést muže do vojska', text: 'Mladí muži z kraje půjdou pod korouhev.', effects: { army: 6 }, prov: { wealth: -4, unrest: 6 } },
};

// a peasant has no province to command, only the farm and the village
export const FARM_DECREES = {
  clear: { label: 'Vyklučit kus lesa', text: 'Nové pole za cenu potu a jedné zimy.', effects: { stability: 6, food: 3, army: -2 } },
  market: { label: 'Prodat přebytky na trhu', text: 'Obilí a sýry na trh do Brodné.', effects: { food: -10, gold: 6 } },
  cattle: { label: 'Přikoupit dobytek', text: 'Kráva navíc znamená mléko i tah.', effects: { gold: -10, food: 4, stability: 5 } },
  neighbours: { label: 'Pomoci sousedům', text: 'Půjčit ruce a sdílet zásoby.', effects: { food: -5, prestige: 6 } },
  lord: { label: 'Přilepšit pánovi', text: 'Dar navíc pro panský dvůr.', effects: { gold: -6, favor: 8 } },
};

export function decreeList(state) {
  return state.scenario === 'sedlak' ? FARM_DECREES : DECREES;
}

/** True when this year's decree has not yet been issued. */
export function decreeAvailable(state) {
  return !state.gameOver && state.decreeYear !== state.year;
}

export function canAffordDecree(state, key) {
  const d = decreeList(state)[key];
  if (!d) return false;
  return Object.entries(d.effects || {}).every(([k, v]) => v >= 0 || (state.resources[k] ?? 0) + v >= 0);
}

/** Issues a decree; returns notes, or null when it cannot be issued. */
export function issueDecree(state, key, provinceId) {
  const d = decreeList(state)[key];
  if (!d || !decreeAvailable(state) || !canAffordDecree(state, key)) return null;
  const notes = [];
  if (d.prov) {
    const prov = ownProvinces(state).find((p) => p.id === provinceId);
    if (!prov) return null;
    applyProvinceEffects(state, { [prov.id]: d.prov }, notes);
  }
  applyEffects(state, d.effects);
  state.decreeYear = state.year;
  const where = d.prov ? ` (${state.provinces.find((p) => p.id === provinceId).name.replace(/ \(.*\)$/, '')})` : '';
  state.chronicle.push(makeChronicleEntry(state, `Výnos roku ${state.year}: ${d.label}${where}.`));
  return notes;
}

// ---------- crises: what happens when a resource runs out ----------

const RULERS = ['panovnik', 'slechtic'];
const CRISES = [
  { key: 'food', max: 3, event: 'krize_hlad', scenarios: RULERS },
  { key: 'gold', max: 2, event: 'krize_pokladna', scenarios: RULERS },
  { key: 'favor', max: 10, event: 'krize_nemilost', scenarios: ['slechtic'] },
  { key: 'army', max: 5, event: 'krize_vojsko', scenarios: RULERS },
  { key: 'legitimacy', max: 8, event: 'krize_uchvatitel', scenarios: ['panovnik'] },
  { key: 'faith', max: 8, event: 'krize_vira', scenarios: RULERS },
  { key: 'prestige', max: 5, event: 'krize_posmech', scenarios: RULERS },
  // a peasant's crises: hunger, empty purse, and the lord's patience running out
  { key: 'food', max: 3, event: 'krize_s_hlad', scenarios: ['sedlak'] },
  { key: 'gold', max: 1, event: 'krize_s_bida', scenarios: ['sedlak'] },
  { key: 'favor', max: 10, event: 'krize_s_nemilost', scenarios: ['sedlak'] },
];
const CRISIS_COOLDOWN = 12;

function raiseCrisis(state) {
  if (state.pendingEvent) return;
  const history = state.eventHistory || {};
  for (const c of CRISES) {
    if (!c.scenarios.includes(state.scenario)) continue;
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
  if (!meta || !meta.event || /^(quiet_season|n_klidne_obdobi|s_klidne_obdobi)$/.test(meta.event.id)) return;
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
  const t = effectiveTraits(ruler);
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
    ...injuryEpithetScores(ruler), // Jednooký, Chromá…
  };
  let best = 'quiet';
  let bestScore = 28; // anything weaker than this leaves a quiet name
  for (const [key, score] of Object.entries(scores)) {
    if (score > bestScore) { best = key; bestScore = score; }
  }
  if (best === 'quiet' && years < 2) return null; // too early to tell
  const [male, female, reason] = EPITHETS[best] || INJURY_EPITHETS[best.replace('injury_', '')];
  const f = ruler.gender === 'female';
  return {
    key: best,
    word: f ? female : male,
    reason: reason.replace(/\{([^|{}]*)\|([^|{}]*)\}/g, (m, a, b) => (f ? b : a)),
  };
}

export function computeSuccessChance(state, choice) {
  let chance = choice.baseChance ?? 0.5;
  if (choice.traitKey) chance += (effectiveTraits(state.ruler)[choice.traitKey] || 0) * (choice.traitScale ?? 0.03);
  // wounds weigh on every test, a lost limb most of all on those of the sword
  const hurt = injuryMods(state.ruler);
  chance += hurt.rolls;
  if (choice.resourceKey === 'army' || choice.traitKey === 'strength') chance += hurt.army;
  // optional resource weight, e.g. a battle depends on the size of the army
  if (choice.resourceKey) chance += ((state.resources[choice.resourceKey] ?? 50) - 50) / 100 * (choice.resourceScale ?? 0.4);
  if (choice.chanceBonus) chance += choice.chanceBonus(state); // e.g. allies backing a claim
  // a capable adviser helps in their own field
  if (choice.resourceKey === 'army' && capable(state, 'marshal')) chance += 0.06;
  if (choice.traitKey === 'intelligence' && capable(state, 'spymaster')) chance += 0.06;
  if (choice.traitKey === 'eloquence' && capable(state, 'spouse')) chance += 0.06;
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
  // a lost test of strength (a brawl, a hunt, a duel) can leave a wound even where the story does not say so
  if (outcome === 'failure' && choice.traitKey === 'strength' && !branch.injury && !branch.noInjury && !choice.noInjury
    && Math.random() < STRENGTH_FAIL_INJURY) injure(state, 'random', notes);
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
  if (!(e.scenarios || [e.scenario || 'panovnik']).includes(state.scenario)) return false;
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
  if (event.onPick) event.onPick(state); // e.g. a buyer asking for whatever fills the warehouse
  if (event.target) {
    const t = event.target(state);
    // 'town:<id>' = a settlement; its province counts as the event's province too
    if (typeof t === 'string' && t.startsWith('town:')) {
      const id = t.slice(5);
      state.eventContext = { town: id, province: settlementDef(id).province };
    } else if (state.provinces.some((p) => p.id === t)) state.eventContext = { province: t };
    else if ((state.houses || []).some((h) => h.id === t)) state.eventContext = { house: t };
    else state.eventContext = { role: t };
  }
  return event;
}

// A peasant lives off the farm: the land (Grunt) and the hands that work it (Čeleď).
// Every autumn the lord takes his due: labour and grain from a serf, coin from a freeman.
function processPeasantEconomy(state) {
  const r = state.resources;
  const free = state.ruler.statusTier >= 2;
  const SEASON_FOOD = [-2, 1, 7, -6];
  let goldIncome = Math.round(r.stability / 35) - 1 + traitBonuses(state).gold
    + (capable(state, 'chancellor') ? 1 : 0) + (state.flags.s_rychtar ? 1 : 0);
  let foodIncome = Math.round((r.stability + r.army) / 35) - 2 + SEASON_FOOD[state.seasonIndex]
    - injuryMods(state.ruler).work; // a farmer without a leg or a hand does half the work
  if (state.seasonIndex === 2) {
    foodIncome -= free ? 2 : 5;
    goldIncome -= free ? 3 : 1;
  }
  r.gold = clamp(r.gold + goldIncome);
  r.food = clamp(r.food + foodIncome);
  if (r.army < 15 && state.turn % 2 === 0) r.stability = clamp(r.stability - 1); // too few hands for the fields
  else if (r.food >= 20 && r.favor >= 40 && r.stability < 65 && state.turn % 2 === 1) r.stability = clamp(r.stability + 1);
  if (r.food <= 5) r.stability = clamp(r.stability - 5);
  if (r.prestige > 50 && state.turn % 2 === 1) r.prestige -= 1;
  if (r.faith !== 50 && state.turn % 3 === 0) r.faith += r.faith > 50 ? -1 : 1;
  // a lord forgets good service quickly and remembers nothing else
  if (r.favor > 40 && state.turn % 2 === 0) r.favor -= 1;
  driftNoble(state);
  return { goldIncome, foodIncome };
}

function processTurnEconomy(state) {
  if (isPeasant(state)) return processPeasantEconomy(state);
  const lands = ownProvinces(state);
  const totalWealth = lands.reduce((s, p) => s + p.wealth, 0);
  const totalUnrest = lands.reduce((s, p) => s + p.unrest, 0);
  // taxes minus the court and the army; the land feeds itself, the harvest comes in
  // autumn and winter eats into the stores. A noble lives off a single estate.
  const SEASON_FOOD = isNoble(state) ? [-2, 0, 6, -5] : [-3, 0, 8, -7]; // jaro, léto, podzim, zima
  const [goldDiv, armyGoldDiv, foodDiv, armyFoodDiv] = isNoble(state) ? [11, 14, 16, 20] : [50, 15, 80, 25];
  const tierBonus = isNoble(state) && state.ruler.statusTier >= 4 ? 2 : 0;
  const goldIncome = (capable(state, 'chancellor') ? 1 : 0) + Math.round(totalWealth / goldDiv) - Math.round(state.resources.army / armyGoldDiv) - 1 + traitBonuses(state).gold + tierBonus;
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
  const t = effectiveTraits(state.ruler); // an injured ruler governs with what is left
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
    const built = buildingDrift(state, p.id); // churches, walls, taverns… in the province's towns
    // a noble's villages answer to their lord, not to a claim on the throne
    const unrestBase = noble ? 34 : 45;
    const unrestTarget = unrestBase - (r.stability - 50) * 0.6 - (p.garrison - 50) * 0.25 - (p.wealth - 50) * 0.15 + (r.food < 20 ? 20 : 0) - bonus.order - built.order;
    p.unrest = clamp(toward(p.unrest, unrestTarget, 0.2, 4) + randInt(-3, 3));
    const standing = noble ? 55 + (r.stability - 50) * 0.4 + (r.prestige - 50) * 0.2 : 45 + (r.legitimacy - 50) * 0.7 + (r.prestige - 50) * 0.2;
    const loyaltyTarget = standing - Math.max(0, p.unrest - 50) * 0.4 + bonus.loyalty + built.loyalty;
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
      if (isNoble(state)) state.pendingEvent = 'n_smrt_krale';
      else {
        // far from the throne, a king's death is news, not a choice
        const oldName = k.name;
        crownNewKing(state);
        state.chronicle.push(makeChronicleEntry(state, `Zemřel král ${oldName}. Na trůn usedá ${state.king.name}.`));
      }
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
  applyQuirks(state);
  if (state.king && state.houses) ageNobleWorld(state);
}

function checkNaturalDeath(state) {
  const age = state.ruler.age;
  // old wounds shorten life at any age
  const chance = Math.min(0.6, Math.max(0, (age - 50) * 0.02) + injuryMods(state.ruler).deathRisk);
  return Math.random() < chance;
}

function generateSuccessorHousehold(state) {
  const heirGender = Math.random() < 0.5 ? 'male' : 'female';
  const spouseGender = heirGender === 'male' ? 'female' : 'male';
  state.heir = {
    role: 'heir', name: randomName(heirGender), gender: heirGender,
    age: randInt(1, 6), loyalty: clamp(70 + randInt(-10, 10)), alive: true,
    traits: inheritTraits(state.ruler.traits),
  };
  state.spouse = {
    role: 'spouse', name: randomName(spouseGender), gender: spouseGender,
    age: randInt(24, 36), loyalty: clamp(65 + randInt(-10, 10)), alive: true,
    quirk: randomQuirk(),
  };
}

function handleSuccession(state, cause = 'stářím') {
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
      injuries: lastingInjuryNames(state.ruler),
      cause: cause === 'stářím' ? null : cause,
    });
    state.reign = newReign();
    state.chronicle.push(makeChronicleEntry(state, `${oldName}${state.pastRulers.at(-1).epithet ? ` ${state.pastRulers.at(-1).epithet}` : ''} umírá ${cause}. ${isPeasant(state) ? 'Grunt' : isNoble(state) ? 'Panství' : 'Korunu'} přebírá ${newRulerName}.`));
    state.ruler = {
      name: newRulerName,
      gender: state.heir.gender,
      age: state.heir.age,
      // the heir brings the traits their upbringing gave them
      traits: state.heir.traits ? { ...state.heir.traits } : { strength: 5, eloquence: 5, intelligence: 5, patience: 5 },
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
    type: isPeasant(state) ? 'ruined' : 'collapse',
    reason: 'dynasty-extinct',
    text: isPeasant(state)
      ? `${state.ruler.name} umírá bez žijícího dědice. Rod ${state.dynastyName} vymírá a grunt dostane pán někomu jinému.`
      : isNoble(state)
      ? `${state.ruler.name} umírá bez žijícího dědice. Rod ${state.dynastyName} vymírá a jeho panství připadá koruně.`
      : `${state.ruler.name} umírá bez žijícího dědice. Dynastie ${state.dynastyName} vymírá a království se hroutí do chaosu.`,
  };
  return false;
}

function updateGoldenAgeStreak(state) {
  if (state.scenario !== 'panovnik') return; // a noble wins by taking the throne, a peasant by nobility
  const r = state.resources;
  const held = state.provinces.filter((p) => !p.lost);
  const avgUnrest = held.reduce((sum, p) => sum + p.unrest, 0) / (held.length || 1);
  const prosperous = r.stability >= 75 && r.gold >= 55 && r.food >= 50 && r.legitimacy >= 70
    && r.prestige >= 60 && avgUnrest <= 25 && held.length === state.provinces.length;
  state.goldenAgeStreak = prosperous ? state.goldenAgeStreak + 1 : 0;
}

export function checkEndConditions(state) {
  if (state.gameOver) return state.gameOver;
  if (isPeasant(state)) {
    if (state.resources.favor <= 0) return { type: 'expelled', text: NOBLE_ENDINGS.expelled(state) };
    if (state.resources.stability <= 0) {
      return { type: 'ruined', reason: 'stability', text: `Grunt zpustl. Pole zarostla, dobytek pošel a rod ${state.dynastyName} odchází žebrat po cestách.` };
    }
    return null;
  }
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
  ensureCourtData(state);
  state.turn += 1;
  state.seasonIndex = state.turn % SEASONS.length;
  if (state.seasonIndex === 0) state.year += 1;

  const economy = processTurnEconomy(state);
  const built = processBuilding(state); // finished work and what the towns' buildings yield
  const goldIncome = economy.goldIncome + built.gold;
  const foodIncome = economy.foodIncome + built.food;
  let successionOccurred = false;
  let deathCheckText = '';

  // wounds heal, or a festering one kills
  const wounds = processInjuries(state);
  if (wounds.died) {
    successionOccurred = handleSuccession(state, 'na následky zranění');
    deathCheckText = ' Vládce podlehl zranění.';
  }

  if (state.seasonIndex === 0 && !wounds.died) {
    ageCharacters(state);
    if (checkNaturalDeath(state)) {
      successionOccurred = handleSuccession(state);
      deathCheckText = ' Vládce zemřel přirozenou smrtí.';
    }
  }

  updateGoldenAgeStreak(state);
  const tradeNews = [...wounds.news, ...built.news, ...processTrade(state)];

  const seasonLabel = SEASONS[state.seasonIndex];
  const [goldWord, foodWord] = isPeasant(state) ? ['grošů', 'zásob'] : ['zlata', 'jídla'];
  const turnSummary = `${seasonLabel} roku ${state.year}. Příjem: ${goldIncome >= 0 ? '+' : ''}${goldIncome} ${goldWord}, ${foodIncome >= 0 ? '+' : ''}${foodIncome} ${foodWord}.${deathCheckText}`;
  state.chronicle.push(makeChronicleEntry(state, turnSummary));

  const gameOver = checkEndConditions(state);
  if (gameOver) {
    state.gameOver = gameOver;
    return { turnSummary, event: null, successionOccurred, gameOver };
  }

  raiseCrisis(state);
  const event = pickNextEvent(state);
  state.currentEvent = event ? event.id : null;
  return { turnSummary, event, successionOccurred, gameOver: null, tradeNews };
}
