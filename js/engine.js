import { SEASONS, TERRAIN_DEFS, NOBLE_HOUSES, PEASANT_HOME, clamp, randomName, randInt, tierTitle, bumpStat, TRAIT_DEFS, RESOURCE_DEFS, resourceLabel, grosLabel, clampRes } from './data.js';
import { makeChronicleEntry, inheritTraits, promote } from './state.js';
import { ageRealms, realmIncome, realmRulerLabel, realmTitle, REALMS } from './realms.js';
import { THRONE_STEPS } from './events_throne.js';
import { processFamily, nextHeir, marry, canConceive, conceiveChance, startPregnancy, acknowledgeBastard, keepDaughterHeir } from './family.js';
import { EVENTS, QUIET_EVENTS } from './events.js';
import { roleLabel, QUIRK_ROLES, randomQuirk, quirkLabel } from './court.js';
import { processTrade, resolveIncident, resolveOffer, addTradeMod, ensureTrade, cargoTokens, GOODS, maxStock } from './trade.js';
import { processBuilding, buildingDrift, applyTownEffects, settlementDef } from './build.js';
import { processFarm, applyFarmEffects, loseFarmStock } from './farm.js';
import {
  effectiveTraits, injuryMods, injure, applyInjuryEffects, processInjuries, injuryTokens,
  injuryEpithetScores, INJURY_EPITHETS, lastingInjuryNames, STRENGTH_FAIL_INJURY,
} from './injuries.js';
import { gearMods } from './gear.js';
import { readyToOffer, startAmbition, skipAmbition, settleAmbition, dropAmbition, FAILURE } from './ambitions.js';
import { processWar, applyWarEffects, warTokens } from './war.js';
import { processPrivileges, applyPrivilegeEffects, flushPrivilegeNews, privilegeTokens } from './privileges.js';
import { empireTokens, empireGenders, processEmpire, empireYear, applyEmpireBranch, heldKeys } from './empire.js';
import { regencyTokens, startRegency, applyRegencyBranch, processRegency, regencyOn, childRuler, COMING_OF_AGE } from './regency.js';

const TRAIT_MIN = 1;
const TRAIT_MAX = 10;
const GOLDEN_AGE_TARGET = 12; // consecutive seasons (three years) of prosperity needed

export function interpolate(state, text) {
  // {arc.cause} expands to a sentence with tokens of its own, so it goes in first
  if (text.includes('{arc.cause}')) text = text.replace('{arc.cause}', interpolateCause(state));
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
    'target.role': target ? roleLabel(ctx.role, target.gender, state.scenario, state.flags).toLowerCase() : '',
    'target.Role': target ? roleLabel(ctx.role, target.gender, state.scenario, state.flags) : '', // at the start of a sentence
    'target.age': target ? String(target.age) : '',
    'target.Old': target && target.gender === 'female' ? 'Stará' : 'Starý',
    'target.died': target && target.gender === 'female' ? 'zemřela' : 'zemřel',
    'target.your': target && target.gender === 'female' ? 'tvoje' : 'tvůj',
    'ruler.title': tierTitle(state.ruler.statusTier, state.ruler.gender).toLowerCase(),
    'own.name': own ? own.name.replace(/ \(.*\)$/, '') : '',
  };
  if (house) {
    Object.assign(dict, {
      'house.name': house.def.name, 'house.gen': house.def.gen, 'house.short': house.def.short, // {house.gen}: "z rodu pánů z Bílé Brány"
      'house.head': house.head.name, 'house.headTitle': house.head.gender === 'female' ? 'paní' : 'pán',
      'house.HeadTitle': house.head.gender === 'female' ? 'Paní' : 'Pán',
      'house.seat': state.provinces.find((p) => p.id === house.def.seat).name,
    });
  }
  Object.assign(dict, cargoTokens(state));
  Object.assign(dict, injuryTokens(state));
  Object.assign(dict, warTokens(state));
  Object.assign(dict, privilegeTokens(state)); // {privilege.name} the right a lord is taking back
  Object.assign(dict, empireTokens(state), regencyTokens(state));
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
      // {lord.nature} "chamtivý", {lord.natureText} "počítá každé zrno…"
      'lord.nature': LORD_NATURES[lordNature(state)][lord.gender === 'female' ? 'f' : 'm'],
      'lord.natureText': LORD_NATURES[lordNature(state)].text[lord.gender === 'female' ? 1 : 0],
      village: PEASANT_HOME.village,
    });
  }
  if (state.formerKing) dict['formerKing.name'] = state.formerKing.name;
  const pred = (state.pastRulers || []).at(-1);
  if (pred) dict['predecessor.name'] = pred.name;
  // {domain} what the house holds: the farm, the estate, the crown (4th case)
  dict.domain = isPeasant(state) ? 'grunt' : isNoble(state) ? 'panství' : 'korunu';
  dict['domain.nom'] = isPeasant(state) ? 'grunt' : isNoble(state) ? 'panství' : 'koruna';
  // {child.name} {child.word} the newborn · {suitor.0.name} {suitor.0.kind} the people to court
  if (state.lastBirth) Object.assign(dict, { 'child.name': state.lastBirth.name, 'child.word': state.lastBirth.gender === 'female' ? 'dcera' : 'syn' });
  (state.suitors || []).forEach((x, i) => Object.assign(dict, { [`suitor.${i}.name`]: x.name, [`suitor.${i}.kind`]: x.kindLabel }));
  dict['succession.note'] = state.successionNote || '';
  // the yearly decree card reads a little differently each year
  const LEADS = ['Na zemský sněm přicházejí prosby, stížnosti a účty.', 'Jaro přineslo hromadu listin: daňové knihy, žaloby a prosby o milost.', 'Kancléř položil na stůl účty z celého roku a vedle nich seznam stížností.', 'Poslové z krajů čekají u dveří síně, každý s vlastním pergamenem a vlastní bídou.'];
  const FOCI = ['Nejvíc se jich letos sešlo z kraje {province.name}.', 'Nejvíc starostí dělá kraj {province.name}.', 'Kraj {province.name} se ozývá hlasitěji než ostatní.'];
  dict['decree.lead'] = LEADS[(state.year || 0) % LEADS.length];
  dict['decree.focus'] = (FOCI[(state.year || 0) % FOCI.length]).replace('{province.name}', (state.eventContext && state.eventContext.province && state.provinces.find((p) => p.id === state.eventContext.province)?.name) || 'v zemi');
  if (state.lastSwap) Object.assign(dict, { 'swap.son': state.lastSwap.son, 'swap.daughter': state.lastSwap.daughter });
  // {bastard.name} {bastard.word} "syn"/"dcera" {bastard.parent} the lover
  if (state.lastBastard) Object.assign(dict, { 'bastard.name': state.lastBastard.name, 'bastard.word': state.lastBastard.gender === 'female' ? 'dcera' : 'syn', 'bastard.parent': state.lastBastard.parent });
  dict['predecessor.rel'] = state.predecessorRel || 'otec';
  // {conquest.name} "Východní marky", {conquest.gen} "Východních marek", {conquest.old} the ruler who yielded
  if (state.lastConquest) Object.assign(dict, { 'conquest.name': state.lastConquest.name, 'conquest.gen': state.lastConquest.gen, 'conquest.loc': state.lastConquest.loc, 'conquest.old': state.lastConquest.old, 'conquest.yield': state.lastConquest.yield });
  // {realm.east} = "král Ctibor", {realm.south.name} = "Ctibor"
  if (state.realms) {
    for (const key of Object.keys(REALMS)) {
      if (!state.realms[key]) continue;
      const r = state.realms[key];
      const label = realmRulerLabel(state, key);
      dict[`realm.${key}`] = label;
      dict[`realm.${key}.Ruler`] = label[0].toUpperCase() + label.slice(1); // at the start of a sentence
      dict[`realm.${key}.name`] = r.ruler.name;
      // {realm.east.title} "král" / "královna", {realm.east.Title} at the start of a sentence,
      // {realm.north.claimant} who fights for that crown (events_foreign.js)
      const title = realmTitle(key, r.ruler.gender);
      dict[`realm.${key}.title`] = title;
      dict[`realm.${key}.Title`] = title[0].toUpperCase() + title.slice(1);
      if (r.claimant) dict[`realm.${key}.claimant`] = r.claimant.name;
    }
  }
  if (king) {
    const kh = king.heir || {};
    Object.assign(dict, {
      'king.name': king.name, 'king.age': String(king.age),
      'king.title': king.gender === 'female' ? 'královna' : 'král', 'king.Title': king.gender === 'female' ? 'Královna' : 'Král',
      'king.heirName': kh.name || '', 'king.heirTitle': kh.gender === 'female' ? 'princezna' : 'princ',
      'king.heirTitleGen': kh.gender === 'female' ? 'princezny' : 'prince',
    });
  }
  // gendered titles: {chancellor.Title} = Kancléř / Kancléřka, {chancellor.title} = lower case
  for (const role of ['chancellor', 'marshal', 'spymaster']) {
    const t = roleLabel(role, state[role].gender, state.scenario, state.flags);
    dict[`${role}.Title`] = t;
    dict[`${role}.title`] = t.toLowerCase();
  }
  // gendered word forms: {R:přijel|přijela} follows the ruler, {H:...} the house head in context
  const genderOf = {
    R: state.ruler.gender, H: house ? house.head.gender : 'male',
    T: target ? target.gender : 'male', D: state.heir ? state.heir.gender : 'male',
    L: lord ? lord.gender : 'male', M: state.spouse ? state.spouse.gender : 'male',
    K: king ? king.gender : 'male', F: state.formerKing ? state.formerKing.gender : 'male',
    C: state.lastBirth ? state.lastBirth.gender : 'male',
    B: state.lastBastard ? state.lastBastard.gender : 'male',
    Q: state.chancellor ? state.chancellor.gender : 'male', V: state.marshal ? state.marshal.gender : 'male', Y: state.spymaster ? state.spymaster.gender : 'male',
    P: (state.pastRulers || []).length ? state.pastRulers.at(-1).gender : 'male',
    // the foreign rulers: {E:…|…} Eastern Marches, {N:…|…} Northern Wastes, {S:…|…} Southern Empire
    E: state.realms?.east?.ruler.gender, N: state.realms?.north?.ruler.gender, S: state.realms?.south?.ruler.gender,
    // the regent {G:…|…}; the local lords of the held crowns {U:…|…} Marches, {W:…|…} Wastes, {X:…|…} the one in question, {Z:…|…} the claimant
    G: state.regency && state.regency.regent ? state.regency.gender : 'male',
    ...empireGenders(state),
  };
  return text
    .replace(/\{([RHTDLMKFCPBENSQVYGUWXZ]):([^|{}]*)\|([^|{}]*)\}/g, (m, who, male, female) => (genderOf[who] === 'female' ? female : male))
    .replace(/\{([\w.]+)\}/g, (m, key) => (key in dict ? dict[key] : m));
}

// ---------- scenario helpers ----------

export function isNoble(state) {
  return state.scenario === 'slechtic';
}

export function isPeasant(state) {
  return state.scenario === 'sedlak';
}

// the lord's temper (state.peasant.lordNature): what the autumn dues and the lord's memory are like
export const LORD_NATURES = {
  chamtivy: { m: 'chamtivý', f: 'chamtivá', text: ['počítá každé zrno a dávky zvedá, kdykoli může', 'počítá každé zrno a dávky zvedá, kdykoli může'] },
  spravedlivy: { m: 'spravedlivý', f: 'spravedlivá', text: ['je přísný, ale drží slovo a v neúrodě sleví', 'je přísná, ale drží slovo a v neúrodě sleví'] },
  kruty: { m: 'krutý', f: 'krutá', text: ['zapomíná na službu dřív, než vychladne pot, a trestá rád', 'zapomíná na službu dřív, než vychladne pot, a trestá ráda'] },
};

/** The current lord's temper; a new lord brings a new one. */
export function lordNature(state) {
  const p = state.peasant;
  const lord = lordOf(state);
  if (!p || !lord) return null;
  if (p.lordName !== lord.name) {
    const keys = Object.keys(LORD_NATURES);
    const had = p.lordName;
    p.lordName = lord.name;
    p.lordNature = keys[randInt(0, keys.length - 1)];
    if (had) state.chronicle.push(makeChronicleEntry(state, `Lipnice má nového pána: ${lord.name}. Prý je ${LORD_NATURES[p.lordNature][lord.gender === 'female' ? 'f' : 'm']}.`));
  }
  return p.lordNature;
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
    state.resources[key] = clampRes(key, state.resources[key] + effects[key]);
  }
}

function applyHiddenEffects(state, hidden) {
  if (!hidden) return;
  for (const f of [].concat(hidden.setFlag || [])) state.flags[f] = true;
  for (const f of [].concat(hidden.clearFlag || [])) delete state.flags[f];
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
      title: interpolate(state, meta.event.title), choice: meta.label, outcome,
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
  let name = randomName(gender);
  for (let i = 0; i < 5 && name === state[role].name; i++) name = randomName(gender); // the successor is someone else
  state[role] = {
    role, name, gender,
    age: randInt(spec.minAge ?? 30, spec.maxAge ?? 50),
    loyalty: clamp((spec.loyalty ?? 60) + randInt(-5, 5)), alive: true,
    ...(QUIRK_ROLES.includes(role) ? { quirk: randomQuirk() } : {}),
    history: [{ year: state.year, season: state.seasonIndex, title: 'Jmenování do úřadu', choice: meta?.label || '', outcome: 'normal', delta: null }], since: state.turn };
  if (meta) meta.replaced = true;
  const fem = state[role].gender === 'female';
  const quirk = quirkLabel(state[role]);
  notes.push({ text: `${fem ? 'Nová' : 'Nový'} ${roleLabel(role, state[role].gender, state.scenario, state.flags).toLowerCase()}: ${state[role].name}${quirk ? ` (${quirk.toLowerCase()})` : ''}`, tone: 'pos' });
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
      t.stock[g] = Math.max(0, Math.min(maxStock(state), t.stock[g] + n));
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
    if (c.quirk === 'chamtivy') r.gold = clampRes('gold', r.gold - 2);
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
        state.flags.heir_married = true; // one heir, one marriage — in every stage
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
  golden_age: (s) => `${s.ruler.name} z rodu ${s.dynastyName} ${s.ruler.gender === 'female' ? 'přinesla' : 'přinesl'} zemi dlouhý mír a plné sýpky — zlatý věk, na který budou kronikáři vzpomínat po staletí. Rod, který začínal ${s.origin === 'sedlak' ? 'u pluhu' : 's málem'}, odchází na vrcholu slávy.`,
  executed: (s) => `${s.flags && s.flags.rebellion ? 'Povstání proti koruně bylo zlomeno' : 'Spiknutí bylo odhaleno'}. ${s.ruler.name} končí na popravišti a jméno rodu ${s.dynastyName} je vymazáno z listin.${s.spouse && s.spouse.alive !== false ? ` ${s.spouse.name} s dětmi hledá útočiště u cizích lidí.` : ''}`,
  ennobled: (s) => `${s.ruler.name} z rodu ${s.dynastyName} {R:povstal|povstala} jako {R:šlechtic|šlechtična}. Rod, který oral cizí pole, bude mít vlastní erb a vlastní tvrz.`,
  expelled: (s) => {
    const lady = lordOf(s)?.gender === 'female';
    const lost = s.ruler.statusTier >= 2
      ? 'Svobodu rodu vzít nemohl' + (lady ? 'a' : '') + ', a tak vzal' + (lady ? 'a' : '') + ' grunt: zemský soud ho kvůli staré žalobě přiřkl jinému hospodáři'
      : 'Grunt dostal jiný hospodář';
    return `${lady ? 'Paní' : 'Pán'} ztratil${lady ? 'a' : ''} s rodem ${s.dynastyName} trpělivost. ${lost} a ${s.ruler.name} odchází s rodinou a uzlíkem na cestu, která nikam nevede.`;
  },
  empire_peak: (s) => `Tři koruny drží pohromadě i bez meče na stole. ${s.ruler.name} z rodu ${s.dynastyName} odchází na vrcholu říše, v níž markrabata, náčelníci i velmoži z Vlčího Údělu sedí u jednoho stolu a daně chodí včas. Kronikáři v Markách, v horách i v hlavním městě budou psát o době, kdy se země poprvé naučily dohodnout — a nikdo ještě netuší, jak dlouho to bez ${s.ruler.gender === 'female' ? 'ní' : 'něj'} vydrží.`,
  empire_fall: (s) => `Poslední cizí koruna je pryč a říše, kterou ${s.ruler.name} {R:skládal|skládala} z dobytých zemí, se rozpadla stejně rychle, jako vznikla. Zbývá Vlčí Úděl, rod ${s.dynastyName} a kronika, která si zapamatuje, že kdo dobývá mečem, musí vládnout trpělivostí — a že to druhé je těžší.`,
  exile: (s) => `Král ztratil s rodem ${s.dynastyName} trpělivost. Panství bylo zabaveno a ${s.ruler.name} odchází s rodinou do vyhnanství.`,
};

/** A new monarch takes the throne (the old king's heir, or a stranger if there is none). */
function crownNewKing(state) {
  const old = state.king;
  const heir = old.heir && old.heir.alive ? old.heir : null;
  const g = heir ? heir.gender : 'male';
  const age = heir ? heir.age : randInt(30, 45);
  const childG = Math.random() < 0.5 ? 'male' : 'female';
  state.king = {
    name: heir ? heir.name : randomName('male'), gender: g, age, alive: true,
    // a grown monarch usually has a child of their own: royal marriages and claims stay possible
    heir: age >= 24 && Math.random() < 0.75 ? { name: randomName(childG), gender: childG, age: randInt(1, Math.min(14, age - 18)), alive: true } : null,
    reign: (old.reign || 1) + 1,
  };
  if (isNoble(state)) state.resources.favor = clamp(Math.round((state.resources.favor + 50) / 2));
  state.throneReset = state.turn;
  delete state.flags.regent;
}

// three ways the king's strength fails at the start of the struggle for the throne (events_throne.js)
const ARC_CAUSES = [
  'Na honu v Sokolím hvozdu se splašil kůň a {king.title} {king.name} spadl{K:|a} na kameny. Žije, ale ruka {K:mu|jí} neposlouchá a slova se {K:mu|jí} pletou.',
  '{king.Title} {king.name} leží třetí týden v horečce, ze které se nedaří {K:ho|ji} vyvést. Ranhojiči pouštějí žilou a mezi sebou si šeptají.',
  'Uprostřed hostiny {king.title} {king.name} zbledl{K:|a}, chytil{K:|a} se za hruď a svezl{K:|a} se k zemi. Od té doby téměř nemluví.',
];
function interpolateCause(state) {
  const i = state.throneArc && state.throneArc.cause !== undefined ? state.throneArc.cause : 0;
  return ARC_CAUSES[i % ARC_CAUSES.length];
}

/** A forced event that must not push out another one already waiting (a chapter card, a war's end). */
export function queueEvent(state, id) {
  if (!state.pendingEvent) state.pendingEvent = id;
  else if (state.pendingEvent !== id) (state.eventQueue = state.eventQueue || []).push(id);
}

function applyBranch(state, branch, meta, outcome = 'normal') {
  const notes = [];
  const touched = {};
  applyHouseEffects(state, branch.houseEffects, notes);
  applyNobleEffects(state, branch.noble, notes);
  // realm: { <key>: { attitude, power } } — how a foreign court takes what was done;
  // 'conquest' = the crown just taken, 'focus' = the held realm the event is about, 'held' = every held crown
  for (const [k, fx] of Object.entries(branch.realm || {})) {
    const keys = k === 'conquest' ? [state.lastConquest && state.lastConquest.key]
      : k === 'focus' ? [state.eventContext && state.eventContext.realm]
        : k === 'held' ? heldKeys(state) : [k];
    for (const key of keys) {
      const r = state.realms && state.realms[key];
      if (!r) continue;
      if (fx.attitude) r.attitude = clamp(r.attitude + fx.attitude);
      if (fx.power) r.power = clamp(r.power + fx.power);
      // the consequence abroad shows with the outcome
      const rn = REALMS[key] && REALMS[key].name;
      if (rn && fx.attitude) notes.push({ text: `${rn}: ${r.owner === 'player' ? 'věrnost' : 'vztah'} ${fx.attitude > 0 ? '+' : ''}${fx.attitude}`, tone: fx.attitude > 0 ? 'pos' : 'neg' });
      if (rn && fx.power) notes.push({ text: `${rn}: ${r.owner === 'player' ? 'moc koruny' : 'síla'} ${fx.power > 0 ? '+' : ''}${fx.power}`, tone: fx.power > 0 ? 'pos' : 'neg' });
    }
  }
  applyEmpireBranch(state, branch.empire, notes); // the local lord, a viceroy, a claimant, the year's decree
  applyRegencyBranch(state, branch.regency, notes); // a child ruler's regent
  if (branch.setTier && branch.setTier !== state.ruler.statusTier) {
    const rising = branch.setTier > state.ruler.statusTier;
    state.ruler.statusTier = branch.setTier;
    if (rising) (state.milestones = state.milestones || {})[`tier${branch.setTier}`] = state.turn;
    notes.push({ text: `Nový titul: ${tierTitle(branch.setTier, state.ruler.gender)}`, tone: 'pos' });
    // freedom and a great lord's rank open chapters of their own (coat of arms and crown: promote in state.js)
    const card = rising && TIER_CHAPTERS[branch.setTier];
    if (card && !(state.flags[`kapitola_${branch.setTier}`])) {
      state.flags[`kapitola_${branch.setTier}`] = true;
      queueEvent(state, card);
    }
  }
  if (branch.newKing && state.king) {
    crownNewKing(state);
    notes.push({ text: `Nový panovník: ${state.king.name}`, tone: 'pos' });
  }
  // a coat of arms or a crown is not the end of the chronicle but the start of its next chapter
  const promotion = PROMOTIONS.includes(branch.endGame) ? branch.endGame : null;
  if (branch.endGame && !promotion && NOBLE_ENDINGS[branch.endGame]) {
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
  applyFarmEffects(state, branch.farm, notes); // grain and animals of the peasant's farm
  applyInjuryEffects(state, branch, notes); // wounds, cures and wooden legs
  applyPrivilegeEffects(state, branch, notes); // rights granted, lost or kept (privileges.js)
  if (branch.ambition) {
    const a = startAmbition(state, branch.ambition);
    if (a) notes.push({ text: `Ambice: ${a.name} (do ${a.years} let)`, tone: 'pos' });
  }
  if (branch.ambitionSkip) skipAmbition(state);
  for (const [k, d] of Object.entries(branch.traits || {})) {
    state.ruler.traits[k] = clampTrait(state.ruler.traits[k] + d);
    notes.push({ text: `${TRAIT_DEFS.find((t) => t.key === k).label} ${d > 0 ? '+' : ''}${d}`, tone: d > 0 ? 'pos' : 'neg' });
  }
  if (branch.marrySuitor !== undefined && state.suitors && state.suitors[branch.marrySuitor]) {
    const dowry = { ...(state.suitors[branch.marrySuitor].dowry || {}) };
    marry(state, branch.marrySuitor, { arranged: true });
    notes.push({ text: `Sňatek: ${state.spouse.name}`, tone: 'pos' });
    // the dowry shows with the outcome
    for (const [k, v] of Object.entries(dowry)) if (state.resources[k] !== undefined) notes.push({ text: `Věno: ${RESOURCE_DEFS.find((d) => d.key === k) ? resourceLabel(RESOURCE_DEFS.find((d) => d.key === k), state.scenario) : k} +${v}`, tone: 'pos' });
  }
  // a lover's child (events_family.js narozeni_levobocka): acknowledged, or sent to the monastery
  if (branch.acknowledge && state.lastBastard) {
    acknowledgeBastard(state, state.lastBastard.name);
    notes.push({ text: `Uznán${state.lastBastard.gender === 'female' ? 'a' : ''}: ${state.lastBastard.name}`, tone: 'pos' });
  }
  if (branch.keepDaughter) keepDaughterHeir(state);
  if (branch.bastardAway && state.lastBastard) state.bastards = (state.bastards || []).filter((b) => b.name !== state.lastBastard.name);
  if (branch.conceive) {
    if (canConceive(state) && Math.random() < conceiveChance(state)) {
      startPregnancy(state);
      notes.push({ text: 'Čekáte dítě', tone: 'pos' });
    } else notes.push({ text: 'Dítě zatím nepřišlo', tone: 'neg' });
  }
  if (branch.adopt && (!state.heir || state.heir.alive === false)) {
    const g = Math.random() < 0.5 ? 'male' : 'female';
    state.heir = { role: 'heir', name: randomName(g), gender: g, age: randInt(5, 10), loyalty: clamp(55 + randInt(0, 15)), alive: true, traits: inheritTraits() };
    notes.push({ text: `${g === 'female' ? 'Dědička' : 'Dědic'}: ${state.heir.name}`, tone: 'pos' });
  }
  // the year's work or decree chosen in the story (events_farm.js); a decree acts on the event's province
  if (branch.decreeSkip) state.decreeYear = state.year;
  if (branch.decree) notes.push(...(issueDecree(state, branch.decree, state.eventContext?.province) || []));
  applyWarEffects(state, branch.war, notes); // a war event moves the campaign
  recordCourtHistory(state, meta, touched, outcome);
  scheduleEcho(state, branch.echo, meta);
  tallyReign(state, branch, meta, outcome);
  if (promotion) {
    // resolveChoice promotes after writing the choice's own chronicle, so the story reads in order
    state.pendingPromotion = promotion;
    notes.push({ text: promotion === 'ennobled' ? 'Nová kapitola: šlechtický stav' : 'Nová kapitola: koruna', tone: 'pos' });
  }
  return notes;
}

const TIER_CHAPTERS = { 2: 'kapitola_svoboda', 4: 'kapitola_velmoz' };

// ---------- the struggle for the throne (events_throne.js) ----------

const ARC_START_AFTER = 24; // seasons as a great lord before the king falls (six years)

/**
 * A great lord does not wait for the king to die of old age: after six years among the great
 * (or once the king nears sixty) the king falls, a regency forms, the succession is disputed,
 * and a few years later the crown is decided in n_smrt_krale. state.throneArc = { step, next }.
 */
function processThroneArc(state) {
  const k = state.king;
  if (state.scenario !== 'slechtic' || state.ruler.statusTier < 4 || !k || !k.alive) return;
  state.milestones = state.milestones || {};
  if (state.milestones.tier4 === undefined) state.milestones.tier4 = state.turn; // a save from before this storyline
  // a new king (the old one died, the claim failed) starts the clock again
  if (state.throneArc && state.throneArc.reign !== k.reign) state.throneArc = null;
  if (!state.throneArc) {
    const waited = state.turn - Math.max(state.milestones.tier4, state.throneReset ?? -Infinity);
    if (waited < ARC_START_AFTER && k.age < 60) return;
    state.throneArc = { step: 0, next: state.turn, reign: k.reign, cause: randInt(0, ARC_CAUSES.length - 1) };
  }
  const arc = state.throneArc;
  if (arc.done || state.turn < arc.next || state.pendingEvent || state.war) return; // one thing at a time; not while the army is out
  if (arc.step < THRONE_STEPS.length) {
    state.pendingEvent = THRONE_STEPS[arc.step];
    arc.step += 1;
    arc.next = state.turn + randInt(4, 7);
    return;
  }
  // the end of the storyline: the king does not rise again
  k.alive = false;
  arc.done = true;
  state.throneReset = state.turn; // a successor gets six years before the next struggle
  state.pendingEvent = 'n_smrt_krale';
}

// endings that open the next stage of the same chronicle (state.js promote)
export const PROMOTIONS = ['ennobled', 'crowned'];

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
    from: { year: state.year, title: interpolate(state, meta.event.title), choice: meta.label, ruler: state.ruler.name, gender: state.ruler.gender },
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
    if ((event.requires && !event.requires(state)) || (state.flags.rebellion && ROYAL_EVENTS.has(event.id))
      || (MARCHES_ABROAD.has(event.id) && marchesAreOurs(state)) || childActs(state, event)) { state.eventContext = null; continue; }
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
  clear: { label: 'Vyklučit kus lesa', text: 'Nové pole za cenu potu a jedné zimy.', effects: { stability: 6, food: 3, army: -1 } },
  hire: { label: 'Najmout čeledíny', text: 'Dva tři páry rukou navíc za mzdu a stravu.', effects: { gold: -8, army: 6 } },
  market: { label: 'Prodat přebytky na trhu', text: 'Obilí a sýry na trh do Brodné.', effects: { food: -10, gold: 6 } },
  cattle: { label: 'Přikoupit dobytek', text: 'Kráva navíc znamená mléko i tah.', effects: { gold: -10, food: 4, stability: 5 }, farm: { cows: 1 } }, // a real cow when the cowshed has room
  neighbours: { label: 'Pomoci sousedům', text: 'Půjčit ruce a sdílet zásoby.', effects: { food: -5, prestige: 6 } },
  lord: { label: 'Přilepšit vrchnosti', text: 'Dar navíc pro panský dvůr.', effects: { gold: -6, favor: 8 } },
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
  applyFarmEffects(state, d.farm, notes);
  state.decreeYear = state.year;
  const where = d.prov ? ` (${state.provinces.find((p) => p.id === provinceId).name.replace(/ \(.*\)$/, '')})` : '';
  state.chronicle.push(makeChronicleEntry(state, `${isPeasant(state) ? 'Práce na gruntu' : 'Výnos'} roku ${state.year}: ${d.label}${where}.`));
  return notes;
}

// ---------- crises: what happens when a resource runs out ----------

const RULERS = ['panovnik', 'slechtic'];
const CRISES = [
  { key: 'stability', max: 20, event: 'krize_rozvrat', scenarios: RULERS }, // the last warning before the realm falls apart
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
  // a serf can simply be thrown off the farm; a free man's farm is his own, so the lord goes to court
  { key: 'favor', max: 10, event: 'krize_s_nemilost', scenarios: ['sedlak'], when: (s) => s.ruler.statusTier < 2 },
  { key: 'favor', max: 10, event: 'krize_s_nemilost_svobodnik', scenarios: ['sedlak'], when: (s) => s.ruler.statusTier >= 2 },
];
const CRISIS_COOLDOWN = 12;

function raiseCrisis(state) {
  if (state.pendingEvent) return;
  const history = state.eventHistory || {};
  for (const c of CRISES) {
    if (!c.scenarios.includes(state.scenario) || (c.when && !c.when(state))) continue;
    if (c.key === 'favor' && state.flags.rebellion) continue; // a rebel expects no royal grace
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

// routine scenes (the year's work, chapter cards, a funeral, a birth) are not deeds a reign is remembered by
const ROUTINE_SCENES = /^(quiet_season|n_klidne_obdobi|s_klidne_obdobi|vynos_roku|s_prace_na_gruntu|nastupnictvi|narozeni|narozeni_levobocka|touha_po_diteti|kapitola_.*|p_.*|ambice.*|cil_.*|risa_sprava|regentstvi|plnoletost)$/;

function tallyReign(state, branch, meta, outcome) {
  if (!meta || !meta.event || /^(quiet_season|n_klidne_obdobi|s_klidne_obdobi)$/.test(meta.event.id)) return;
  const reign = reignOf(state);
  const routine = ROUTINE_SCENES.test(meta.event.id);
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
    if (meta.battle && outcome === 'success') bumpStat(state, 'battlesWon');
    weight += 10;
  }
  if (branch.setTier || branch.newKing || branch.endGame) weight += 60;
  if (meta.event.forced) weight += 15;
  if (meta.battle) weight += 15;
  if (branch.marrySuitor !== undefined || branch.adopt) weight += 20;
  if (branch.war) weight += 5;
  if (/^krize/.test(meta.event.id)) { bumpStat(state, 'crises'); weight += 15; }
  if (routine) return; // counted in the sums above, never listed as a deed
  // the three weightiest decisions of a reign are what the chronicle remembers
  reign.deeds.push({ year: state.year, title: interpolate(state, meta.event.title), choice: meta.label, outcome, weight });
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
    old: ruler.age >= 72 && years >= 3 ? 20 + (ruler.age - 72) * 3 : 0,
    ...injuryEpithetScores(ruler), // Jednooký, Chromá…
  };
  let best = 'quiet';
  let bestScore = 28; // anything weaker than this leaves a quiet name
  for (const [key, score] of Object.entries(scores)) {
    if (score > bestScore) { best = key; bestScore = score; }
  }
  if (best === 'quiet' && years < 5) return null; // too early to tell
  const [male, female, reason] = EPITHETS[best] || INJURY_EPITHETS[best.replace('injury_', '')];
  const f = ruler.gender === 'female';
  return {
    key: best,
    word: f ? female : male,
    // a farmer has no reign: "za vládu bez bouří" becomes "za život bez bouří"
    reason: reason.replace(/\{([^|{}]*)\|([^|{}]*)\}/g, (m, a, b) => (f ? b : a)).replace('za vládu', isPeasant(state) ? 'za život' : 'za vládu'),
  };
}

// ---------- the dice: every risky choice is a roll of k% (1–100) ----------
//
// A risky choice has a target number (how hard the deed is for an average
// ruler with average means) and modifiers added to the roll: traits counted
// from the average 5, resources from 50, wounds, capable advisers and the
// circumstances (allies, the state of the army…). roll + modifiers ≥ target
// succeeds; 96–100 always succeeds, 1–5 always fails. The chance shown to
// the player is exactly the chance of that roll.

/** { target, mods: [{ label, value }], bonus, chance } for a risky choice. */
export function rollParts(state, choice) {
  let base = choice.baseChance ?? 0.5;
  const mods = [];
  const add = (label, value) => { if (Math.round(value)) mods.push({ label, value: Math.round(value) }); };
  if (choice.traitKey) {
    const scale = choice.traitScale ?? 0.03;
    const v = effectiveTraits(state.ruler)[choice.traitKey] || 0;
    base += 5 * scale; // an average trait (5) is part of the difficulty, the rest is a bonus or a malus
    const def = TRAIT_DEFS.find((d) => d.key === choice.traitKey);
    add(`${def ? def.label : choice.traitKey} ${v}`, (v - 5) * scale * 100);
  }
  if (choice.resourceKey) {
    const v = state.resources[choice.resourceKey] ?? 50;
    const def = RESOURCE_DEFS.find((d) => d.key === choice.resourceKey);
    add(`${def ? resourceLabel(def, state.scenario) : choice.resourceKey} ${v}`, (v - 50) / 100 * (choice.resourceScale ?? 0.4) * 100);
  }
  // wounds weigh on every test, a lost limb most of all on those of the sword
  const hurt = injuryMods(state.ruler);
  add('Zranění', (hurt.rolls + (choice.resourceKey === 'army' || choice.traitKey === 'strength' ? hurt.army : 0)) * 100);
  if (choice.chanceBonus) add(choice.bonusLabel || 'Okolnosti', choice.chanceBonus(state) * 100); // e.g. allies backing a claim
  // a good horse carries the ruler into every fight
  if (choice.traitKey === 'strength' || choice.resourceKey === 'army') {
    const horse = gearMods(state).items.find((i) => i.slot === 'horse');
    if (horse && horse.roll) add(horse.name, horse.roll);
  }
  // a capable adviser helps in their own field
  const helper = (role) => `Schopn${state[role].gender === 'female' ? 'á' : 'ý'} ${roleLabel(role, state[role].gender, state.scenario, state.flags).toLowerCase()}`;
  if (choice.resourceKey === 'army' && capable(state, 'marshal')) add(helper('marshal'), 6);
  if (choice.traitKey === 'intelligence' && capable(state, 'spymaster')) add(helper('spymaster'), 6);
  if (choice.traitKey === 'eloquence' && capable(state, 'spouse')) add(helper('spouse'), 6);
  const target = 101 - Math.round(base * 100);
  const bonus = mods.reduce((s, m) => s + m.value, 0);
  const chance = Math.max(0.05, Math.min(0.95, (101 - target + bonus) / 100));
  return { target, mods, bonus, chance };
}

/** Rolls k% for a risky choice: { roll, bonus, total, target, success, crit: 'hit' | 'miss' | null }. */
export function rollDice(state, choice) {
  const parts = rollParts(state, choice);
  const roll = 1 + Math.floor(Math.random() * 100);
  const total = roll + parts.bonus;
  const crit = roll >= 96 ? 'hit' : roll <= 5 ? 'miss' : null;
  const success = crit === 'hit' || (crit !== 'miss' && total >= parts.target);
  return { ...parts, roll, total, crit, success };
}

export function computeSuccessChance(state, choice) {
  return rollParts(state, choice).chance;
}

function markEventSeen(state, event) {
  state.usedEvents = state.usedEvents || [];
  if (!state.usedEvents.includes(event.id)) state.usedEvents.push(event.id);
  state.eventHistory = state.eventHistory || {};
  state.eventHistory[event.id] = state.turn;
  state.lastEventId = event.id;
  if (event.markSeen) event.markSeen(state);
}

/**
 * Resolves a choice. `decided` comes from the table: a dice roll the player made
 * ({ success, roll }) or a fight fought out ({ success, combat: true }); without it the
 * engine rolls by itself (the sims).
 */
export function resolveChoice(state, event, choiceIndex, decided = null) {
  state.currentEvent = null; // answered: a loaded save does not show it again
  const choice = event.choices[choiceIndex];
  let outcome = 'normal';
  let branch = choice;

  if (choice.isRoll) {
    const success = decided ? decided.success : rollDice(state, choice).success;
    branch = success ? choice.onSuccess : choice.onFailure;
    outcome = success ? 'success' : 'failure';
    // a fight already dealt its own wounds blow by blow
    if (decided && decided.combat) branch = { ...branch, injury: undefined, noInjury: true };
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
  flushPrivilegeNews(state); // a privilege granted or lost follows the story's own line
  markEventSeen(state, event);
  if (state.pendingPromotion) {
    const type = state.pendingPromotion;
    delete state.pendingPromotion;
    promote(state, type);
  }

  const effects = { ...(branch.effects || {}) };
  if (branch.decree) for (const [k, v] of Object.entries(decreeList(state)[branch.decree]?.effects || {})) effects[k] = (effects[k] || 0) + v;
  return { outcome, effects, traitGained, text, notes, music: branch.music || null };
}

export function resolveRouteChoice(state, event, terrainKey) {
  state.currentEvent = null;
  const option = event.routeOptions.find((o) => o.terrainKey === terrainKey);
  const risk = TERRAIN_DEFS[terrainKey] ? TERRAIN_DEFS[terrainKey].baseRisk : 0.3;
  const danger = Math.random() < risk;
  const branch = danger ? option.onDanger : option.onSafe;
  const notes = applyBranch(state, branch, { event, label: TERRAIN_DEFS[terrainKey]?.label || terrainKey }, danger ? 'danger' : 'safe');
  const text = branch.chronicle ? interpolate(state, branch.chronicle) : '';
  if (text) state.chronicle.push(makeChronicleEntry(state, text));
  flushPrivilegeNews(state);
  markEventSeen(state, event);
  return { outcome: danger ? 'danger' : 'safe', effects: branch.effects || {}, traitGained: null, text, notes, terrainKey };
}

const DEFAULT_COOLDOWN = 10; // turns (two and a half years) before an event can repeat
const QUIET_CHANCE = 0.12;

// the king's court does not invite, tax or honour a lord in open revolt
const ROYAL_EVENTS = new Set(['n_povolavaci_list', 'n_kralovska_bitva', 'n_pozvani_ke_dvoru', 'n_kralova_navsteva', 'n_kraluv_vybirci',
  'n_obvineni_u_dvora', 'n_urad_u_dvora', 'n_povyseni', 'n_koupe_titulu', 'n_kralovsky_snatek', 'n_spiklenci_zvou', 'n_podplatit_straze',
  'n_nemoc_krale', 'n_trzni_pravo', 'n_spor_o_hranici', 'n_najezd_rodu', 'n_nalezeny_dopis', 'n_spiklenec_zradil', 'n_zradce_v_radach',
  'n_vychova_dedice', 'n_cizi_posel', 'ozvena_n_vdecny_rod', 'ozvena_n_pomsta', 'ozvena_n_pisatel']);

// stories of the Eastern Marches as a hostile neighbour: none once the player wears their crown
const MARCHES_ABROAD = new Set(['pohranicni_najezd', 'valka_s_markami', 'cizi_vyslanec', 'uprchlici', 'zajaty_syn_markrabiho',
  'o_clo', 'zrada_spehmistra', 'ozvena_markrabi', 'ozvena_uprchlici', 'ozvena_dluh_markam']);
// events where the king acts in person (beyond ROYAL_EVENTS): not while the king lies helpless
const KING_ACTS = new Set(['v_korunni_rada', 'v_zkouska_vernosti', 'v_ozvena_rada']);
// a child on the throne does not duel, brawl, hunt wolves or court: events where the ruler acts in person
const CHILD_ACTS = new Set(['rvaci_v_krcme', 'turnaj', 'v_turnaj', 'vlci', 'souboj_slechticu', 'potulny_rytir', 'atentat', 'n_kralovsky_snatek', 'cizi_princezna']);
const hasFight = (e) => (e.choices || []).some((c) => c.combat);
const childActs = (state, e) => childRuler(state) && (CHILD_ACTS.has(e.id) || hasFight(e));
const kingHelpless = (state) => !!(state.throneArc && state.throneArc.step >= 1 && !state.throneArc.done);
const marchesAreOurs = (state) => !!(state.realms && state.realms.east && state.realms.east.owner === 'player');

const AT_COURT = new Set(['carodejnice', 'relikvie', 'zebravy_prorok', 'poutnik_zazrak', 'kacirska_sekta', 'skola_ucencu', 'katedrala', 'turnaj', 'hostina_slechty', 'portret_vladce', 'dvorni_blazen', 'vyroci_vlady', 'soud_o_mez', 'prosba_ucitele', 'spor_rybaru', 'hranicni_kamen', 'rvaci_v_krcme', 'touha_po_diteti']);

function eventAvailable(state, e) {
  if (MARCHES_ABROAD.has(e.id) && marchesAreOurs(state)) return false;
  if (!(e.scenarios || [e.scenario || 'panovnik']).includes(state.scenario)) return false;
  if ((state.flags.rebellion || kingHelpless(state)) && (ROYAL_EVENTS.has(e.id) || KING_ACTS.has(e.id))) return false;
  // a ruler leading the army in the field does not hold feasts, sit for portraits or judge village quarrels
  if (state.war && state.war.leader === 'ruler' && AT_COURT.has(e.id)) return false;
  if (childActs(state, e)) return false;
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
  if (!state.pendingEvent && state.eventQueue && state.eventQueue.length) state.pendingEvent = state.eventQueue.shift();
  if (state.pendingEvent) {
    let forced = EVENTS.find((e) => e.id === state.pendingEvent);
    state.pendingEvent = null;
    if (forced && forced.dropIf && forced.dropIf(state)) forced = null; // the reason for the scene is gone (a lost crown, a regency settled)
    // a forced event left over from the previous stage of life (the king's death after the crown is won) is dropped
    if (forced && (forced.scenarios || [forced.scenario || 'panovnik']).includes(state.scenario)) {
      if (forced.target) setTargetContext(state, forced.target(state));
      return forced;
    }
    // a scene that was dropped (no longer fitting, or a crisis card this stage has no text for) must not hold up the ones waiting behind it
    if (state.eventQueue && state.eventQueue.length) return pickNextEvent(state);
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
  // a weight can depend on the state (e.g. a house without an heir hears about children sooner)
  const weightOf = (e) => (typeof e.weight === 'function' ? e.weight(state) : e.weight ?? 1);
  const total = available.reduce((sum, e) => sum + weightOf(e), 0);
  let roll = Math.random() * total;
  let event = available[available.length - 1];
  for (const e of available) {
    roll -= weightOf(e);
    if (roll <= 0) { event = e; break; }
  }
  if (event.onPick) event.onPick(state); // e.g. a buyer asking for whatever fills the warehouse
  if (event.target) setTargetContext(state, event.target(state));
  return event;
}

/** What an event is about: a settlement, a province, a house or a member of the court. */
function setTargetContext(state, t) {
  if (!t) return;
  // 'town:<id>' = a settlement; its province counts as the event's province too
  if (typeof t === 'string' && t.startsWith('town:')) {
    const id = t.slice(5);
    state.eventContext = { town: id, province: settlementDef(id).province };
  } else if (typeof t === 'string' && t.startsWith('realm:')) {
    state.eventContext = { realm: t.slice(6) }; // a held foreign crown (empire.js)
  } else if (state.provinces.some((p) => p.id === t)) state.eventContext = { province: t };
  else if ((state.houses || []).some((h) => h.id === t)) state.eventContext = { house: t };
  else state.eventContext = { role: t };
}

// A peasant lives off the farm: the land (Grunt) and the hands that work it (Čeleď).
// Every autumn the lord takes his due: labour and grain from a serf, coin from a freeman.
function processPeasantEconomy(state) {
  // (an empty larder costs the farm 3 a season, not 5: hunger should hurt, not end the chronicle in a winter)
  const r = state.resources;
  const free = state.ruler.statusTier >= 2;
  const SEASON_FOOD = [-2, 1, 7, -6];
  let goldIncome = Math.round(r.stability / 35) - 1 + traitBonuses(state).gold
    + (capable(state, 'chancellor') ? 1 : 0) + (state.flags.s_rychtar ? 1 : 0);
  let foodIncome = Math.round((r.stability + r.army) / 35) - 2 + SEASON_FOOD[state.seasonIndex]
    - injuryMods(state.ruler).work; // a farmer without a leg or a hand does half the work
  const nature = lordNature(state);
  if (state.seasonIndex === 2) {
    // the autumn dues, heavier under a greedy lord and lighter under a fair one
    foodIncome -= (free ? 2 : 5) + (nature === 'chamtivy' ? (free ? 0 : 2) : nature === 'spravedlivy' ? -1 : 0);
    goldIncome -= (free ? 3 : 1) + (nature === 'chamtivy' && free ? 1 : 0);
  }
  r.gold = clampRes('gold', r.gold + goldIncome);
  r.food = clampRes('food', r.food + foodIncome);
  if (r.army < 15 && state.turn % 2 === 0) r.stability = clamp(r.stability - 1); // too few hands for the fields
  else if (r.food >= 20 && r.favor >= 40 && r.stability < 65 && state.turn % 2 === 1) r.stability = clamp(r.stability + 1);
  if (r.food <= 5) r.stability = clamp(r.stability - 3);
  if (r.prestige > 50 && state.turn % 2 === 1) r.prestige -= 1;
  if (r.faith !== 50 && state.turn % 3 === 0) r.faith += r.faith > 50 ? -1 : 1;
  // a lord forgets good service quickly and remembers nothing else (a cruel one twice as fast, a fair one half)
  const forget = nature === 'kruty' ? state.turn % 2 === 0 || state.turn % 4 === 1 : nature === 'spravedlivy' ? state.turn % 4 === 0 : state.turn % 2 === 0;
  if (r.favor > 40 && forget) r.favor -= 1;
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
  state.resources.gold = clampRes('gold', state.resources.gold + goldIncome);
  state.resources.food = clampRes('food', state.resources.food + foodIncome);
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
  if (state.flags.rebellion) r.favor = 0; // a rebel has no favour to regain
  else if (r.favor > 55 && state.turn % 2 === 0) r.favor -= 1;
  else if (r.favor < 45 && state.turn % 3 === 0) r.favor += 1;
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
    const chance = isNoble(state) && state.ruler.statusTier >= 4 && !(state.throneArc && state.throneArc.done)
      ? 0 // the struggle for the throne decides when this king falls (processThroneArc)
      : k.age < 60 ? 0.01 : Math.min(0.45, (k.age - 58) * 0.03);
    if (Math.random() < chance) {
      k.alive = false;
      if (isNoble(state)) queueEvent(state, 'n_smrt_krale');
      else {
        // far from the throne, a king's death is news, not a choice
        const oldName = k.name;
        crownNewKing(state);
        const was = k.gender === 'female' ? ['Zemřela královna', 'usedá'] : ['Zemřel král', 'usedá'];
        state.chronicle.push(makeChronicleEntry(state, `${was[0]} ${oldName}. Na trůn ${was[1]} ${state.king.gender === 'female' ? 'královna' : 'král'} ${state.king.name}.`));
      }
    }
  }
  for (const h of state.houses) {
    h.head.age += 1;
    if (h.head.age > 64 && Math.random() < (h.head.age - 62) * 0.04) {
      const g = Math.random() < 0.75 ? 'male' : 'female';
      const successor = { name: randomName(g), gender: g, age: randInt(28, 45) };
      const houseName = NOBLE_HOUSES.find((d) => d.id === h.id).gen;
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
  if (state.scenario !== 'panovnik') retireOldAdvisers(state);
  if (state.houses) ageNobleWorld(state); // the great houses age in every stage, the king only while there is one above the player
}

function retireOldAdvisers(state) {
  for (const role of ['chancellor', 'marshal', 'spymaster']) {
    const c = state[role];
    if (c.age < 66 || Math.random() > (c.age - 64) * 0.1) continue;
    const g = Math.random() < 0.5 ? 'male' : 'female';
    let name = randomName(g);
    for (let i = 0; i < 20 && [state.ruler.name, state.heir.name, state.spouse.name, state.chancellor.name, state.marshal.name, state.spymaster.name].includes(name); i++) name = randomName(g);
    const title = roleLabel(role, c.gender, state.scenario, state.flags);
    state.chronicle.push(makeChronicleEntry(state, `${title} ${c.name} ${c.gender === 'female' ? 'zemřela' : 'zemřel'} ve věku ${c.age} let. Na ${c.gender === 'female' ? 'její' : 'jeho'} místo nastupuje ${name}.`));
    state[role] = { role, name, gender: g, age: randInt(28, 45), loyalty: clamp(55 + randInt(-8, 8)), alive: true, quirk: randomQuirk(), since: state.turn };
  }
}

/** "Hospodář" / "Pán" / "Vládce" (or the feminine) by the stage the chronicle is in. */
function deathWord(state, gender) {
  const f = gender === 'female';
  return isPeasant(state) ? (f ? 'Hospodyně' : 'Hospodář') : isNoble(state) ? (f ? 'Paní' : 'Pán') : (f ? 'Vládkyně' : 'Vládce');
}

function checkNaturalDeath(state) {
  const age = state.ruler.age;
  // old wounds shorten life at any age
  const chance = Math.min(0.6, Math.max(0, (age - 50) * 0.02) + injuryMods(state.ruler).deathRisk);
  return Math.random() < chance;
}

/**
 * The new ruler's household. The ruler is married only if the player married the heir off
 * (flags.heir_married) — then the years of marriage before the crown may have brought children.
 * Otherwise they start single and court (family.js) and children come when the player wants them;
 * until then the eldest brother or sister is the heir.
 */
const f = (c) => c.gender === 'female';

function generateSuccessorHousehold(state, siblings = []) {
  const age = state.ruler.age;
  const spouseGender = state.ruler.gender === 'female' ? 'male' : 'female';
  const married = !!state.flags.heir_married && age >= 16; // a child ruler is not married
  // nobody in the household shares a name with the ruler, a sibling or a councillor
  const taken = new Set([state.ruler.name, ...siblings.map((c) => c.name),
    ...['chancellor', 'marshal', 'spymaster'].map((r) => state[r] && state[r].name)].filter(Boolean));
  const freshName = (g) => { let n = randomName(g); for (let i = 0; i < 80 && taken.has(n); i++) n = randomName(g); taken.add(n); return n; };
  state.spouse = married
    ? { role: 'spouse', name: freshName(spouseGender), gender: spouseGender,
      age: Math.max(16, Math.min(randInt(age - 4, age + 4), 60)), loyalty: clamp(65 + randInt(-10, 10)), alive: true, quirk: randomQuirk() }
    : { role: 'spouse', name: '', gender: spouseGender, age: 0, loyalty: 0, alive: false, none: true };
  // an heir the player married off had years of family life before the crown: their children come along
  const kids = married ? Math.max(0, Math.min(3, Math.floor((age - 20) / 6))) : 0;
  const born = [];
  for (let i = 0; i < kids; i++) {
    if (Math.random() > 0.75) continue;
    const g = Math.random() < 0.5 ? 'male' : 'female';
    born.push({ role: 'child', name: freshName(g), gender: g, age: Math.max(0, Math.min(age - 20, randInt(0, 4) + (kids - 1 - i) * 5)),
      loyalty: clamp(70 + randInt(-10, 10)), alive: true, traits: inheritTraits(state.ruler.traits) });
  }
  born.sort((a, b) => b.age - a.age);
  state.successorChildren = born.slice(1);
  if (born.length) {
    state.heir = { ...born[0], role: 'heir' };
  } else if (siblings.length) {
    // the eldest brother or sister holds the place until the ruler has a child
    const next = siblings.slice().sort((a, b) => b.age - a.age)[0];
    state.heir = { ...next, role: 'heir', presumptive: true, loyalty: clamp((next.loyalty || 65) - 5) };
  } else {
    state.heir = { role: 'heir', name: '', gender: 'male', age: 0, loyalty: 0, alive: false, none: true, traits: inheritTraits(state.ruler.traits) };
  }
}

const BIRTH_CARDS = ['narozeni', 'dedicke_pravo', 'narozeni_levobocka'];
/** The birth card of the dying ruler's last child must not come after the succession scene. */
function dropStaleBirthCards(state) {
  const dropped = state.pendingEvent === 'narozeni' || (state.eventQueue || []).includes('narozeni');
  if (BIRTH_CARDS.includes(state.pendingEvent)) state.pendingEvent = null;
  state.eventQueue = (state.eventQueue || []).filter((id) => !BIRTH_CARDS.includes(id));
  if (dropped && state.lastSwap) state.lastSwap.fresh = false;
  if (dropped && state.lastBirth) {
    const b = state.lastBirth;
    state.chronicle.push(makeChronicleEntry(state, `${b.name} ${b.gender === 'female' ? 'se narodila' : 'se narodil'} v týž čas, kdy rod ${state.dynastyName} pochovával ${(state.pastRulers || []).at(-1)?.gender === 'female' ? 'vládkyni' : 'vládce'}.`));
  }
}

function handleSuccession(state, cause = 'stářím') {
  dropAmbition(state); // the new ruler sets their own goals
  if (state.war && state.war.leader === 'ruler') state.war.leader = 'marshal'; // the marshal takes over the campaign
  nextHeir(state); // a younger child steps up if the heir is gone; without children a brother or sister
  // who could govern for a child: the widow(er) and the old ruler's grown brothers and sisters (before the household is renewed)
  const oldSpouse = state.spouse && state.spouse.alive !== false && !state.spouse.none && !state.spouse.divorced ? { ...state.spouse } : null;
  const oldKin = (state.siblings || []).filter((c) => c.alive !== false && c.age >= 18 && c.name !== (state.heir && state.heir.name)).sort((a, b) => b.age - a.age)[0] || null;
  if (state.heir.alive) {
    // a brother or sister taking over: the main line has died out, a cadet branch carries the house on
    const cadet = !!state.heir.presumptive;
    const viaBastard = !!state.heir.bastard; // the ruler's own (acknowledged) child, not a sibling
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
    // the old ruler's younger children are the new ruler's brothers and sisters (for a cadet branch: the old ruler's other siblings)
    const siblings = (viaBastard ? state.bastards || [] : cadet ? state.siblings || [] : state.children || []).filter((c) => c.alive !== false);
    state.successionNote = '';
    const pf = state.pastRulers.at(-1).gender === 'female';
    state.predecessorRel = cadet && !viaBastard ? (pf ? 'sestra' : 'bratr') : (pf ? 'matka' : 'otec');
    if (cadet) {
      state.cadetBranch = (state.cadetBranch || 0) + 1;
      state.lastCadet = state.turn;
      state.resources.legitimacy = clamp((state.resources.legitimacy ?? 50) - 10);
      state.resources.prestige = clamp(state.resources.prestige - 5);
      state.successionNote = viaBastard
        ? ` Hlavní linie rodu vymřela — ${state.ruler.gender === 'female' ? 'nemanželská dcera' : 'nemanželský syn'} ${pf ? 'zesnulé' : 'zesnulého'} vede rod jako vedlejší větev a ne každý to bere jako samozřejmost.`
        : ` Hlavní linie rodu vymřela — ${state.ruler.gender === 'female' ? 'sestra' : 'bratr'} ${pf ? 'zesnulé' : 'zesnulého'} vede rod jako vedlejší větev a ne každý to bere jako samozřejmost.`;
      state.chronicle.push(makeChronicleEntry(state, `${oldName} ${state.pastRulers.at(-1).gender === 'female' ? 'zemřela' : 'zemřel'} bez manželských dětí. Hlavní linie rodu ${state.dynastyName} vymřela; rod pokračuje vedlejší větví.`));
    }
    generateSuccessorHousehold(state, siblings);
    delete state.flags.heir_married;
    delete state.flags.no_more_children;
    delete state.flags.harsh_ruler; // a new ruler is not blamed for the old one's cruelty
    state.children = state.successorChildren || [];
    delete state.successorChildren;
    // brothers and sisters stay with the house (the eldest may hold the heir's place)
    state.siblings = siblings.filter((c) => !(state.heir.presumptive && c.name === state.heir.name)).map((c) => ({ ...c, role: 'sibling' }));
    state.pregnancy = null;
    state.suitors = [];
    dropStaleBirthCards(state); // a child born in the season the ruler died is a brother or sister now, not a card after the funeral
    for (const rec of Object.values((state.empire && state.empire.r) || {})) rec.viceroy = false; // the heir who ruled a held crown is the ruler now
    // a ruler under sixteen governs through a regent: the scene follows the funeral
    state.regency = null;
    if (state.ruler.age < COMING_OF_AGE) {
      startRegency(state, {
        parent: oldSpouse && !cadet && !viaBastard ? { name: oldSpouse.name, gender: oldSpouse.gender, age: oldSpouse.age, loyalty: oldSpouse.loyalty } : null,
        kin: oldKin ? { name: oldKin.name, gender: oldKin.gender, age: oldKin.age, rel: cadet && !viaBastard ? (oldKin.gender === 'female' ? 'sestra' : 'bratr') : (oldKin.gender === 'female' ? 'teta' : 'strýc') } : null,
      });
      state.chronicle.push(makeChronicleEntry(state, `${state.ruler.name} nastupuje ve věku ${state.ruler.age < 1 ? 'několika měsíců' : state.ruler.age === 1 ? 'jednoho roku' : `${state.ruler.age} let`}. Dokud nedospěje, musí za ${f(state.ruler) ? 'ni' : 'něj'} vládnout někdo jiný.`));
    }
    if (siblings.length) {
      const names = siblings.map((c) => c.name).join(', ');
      const presumptive = state.heir.alive && siblings.some((x) => x.name === state.heir.name);
      state.chronicle.push(makeChronicleEntry(state, `Sourozenci ${isPeasant(state) ? (f(state.ruler) ? 'nové hospodyně' : 'nového hospodáře') : isNoble(state) ? (f(state.ruler) ? 'nové paní' : 'nového pána') : (f(state.ruler) ? 'nové vládkyně' : 'nového vládce')} (${names}) zůstávají při rodu${presumptive ? `; ${state.heir.name} je ${f(state.heir) ? 'dědičkou' : 'dědicem'}, dokud se nenarodí dítě` : ''}.`));
    }
    // the new ruler's first scene (events_family.js); for a child, the choice of a regent follows it
    if (state.pendingEvent) (state.eventQueue = state.eventQueue || []).unshift(state.pendingEvent);
    if (regencyOn(state)) (state.eventQueue = state.eventQueue || []).unshift('regentstvi');
    state.pendingEvent = 'nastupnictvi';
    return true;
  }
  const how = cause === 'stářím' ? 'stářím' : cause;
  state.gameOver = {
    type: isPeasant(state) ? 'ruined' : 'collapse',
    reason: 'dynasty-extinct',
    text: isPeasant(state)
      ? `${state.ruler.name} umírá ${how} bez žijícího dědice. Rod ${state.dynastyName} vymírá a grunt dostane pán někomu jinému.`
      : isNoble(state)
      ? `${state.ruler.name} umírá ${how} bez žijícího dědice. Rod ${state.dynastyName} vymírá a jeho panství připadá koruně.`
      : `${state.ruler.name} umírá ${how} bez žijícího dědice. Dynastie ${state.dynastyName} vymírá a království se hroutí do chaosu.`,
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
    if (state.resources.stability <= 0 && !state.flags.chalupa) {
      // the first ruin is not the end: the lord gives the family a cottage at the edge of the village
      state.flags.chalupa = true;
      loseFarmStock(state); // the cattle are gone with the farm
      const r = state.resources;
      Object.assign(r, { stability: 30, gold: 0, food: Math.max(r.food, 15), army: Math.max(r.army, 12), prestige: clamp(r.prestige - 10) });
      state.chronicle.push(makeChronicleEntry(state, `Grunt rodu ${state.dynastyName} zpustl. Rodina dostala chalupu na kraji vsi a začíná znovu.`));
      queueEvent(state, 's_chalupa');
      return null;
    }
    if (state.resources.stability <= 0) {
      return { type: 'ruined', reason: 'stability', text: `Grunt zpustl. Pole zarostla, dobytek pošel a rod ${state.dynastyName} odchází žebrat po cestách.` };
    }
    return null;
  }
  if (isNoble(state)) {
    // in open revolt the king's favour is gone anyway; the war decides
    if (state.resources.favor <= 0 && !state.flags.rebellion) return { type: 'exile', text: NOBLE_ENDINGS.exile(state) };
    if (!ownProvinces(state).length) {
      return { type: 'exile', text: `Panství rodu ${state.dynastyName} padlo do cizích rukou. ${state.ruler.name} odchází do vyhnanství bez půdy a bez jména.` };
    }
    if (state.resources.stability <= 0) {
      return { type: 'collapse', reason: 'stability', text: 'Panství se vzbouřilo. Sedláci vypálili tvrz a koruna odmítla pomoci rodu, který neudrží ani vlastní vesnice.' };
    }
    return null;
  }
  if (state.resources.stability <= 0) {
    return { type: 'collapse', reason: 'stability', text: `Království se propadá do chaosu. ${state.ruler.name} z rodu ${state.dynastyName} ztratil${state.ruler.gender === 'female' ? 'a' : ''} veškerou oporu a koruna se rozpadá zevnitř.` };
  }
  const capital = state.provinces.find((p) => p.isCapital);
  const provincesLeft = state.provinces.filter((p) => !p.lost).length;
  if ((capital && capital.lost) || provincesLeft === 0) {
    return { type: 'conquest', text: `Nepřátelská vojska obsadila Vlčí Úděl. Království rodu ${state.dynastyName} padlo.` };
  }
  // a golden age no longer ends the chronicle by itself: the event 'zlaty_vek' lets the player end it in glory or play on
  return null;
}

// ---------- ambitions: goals the ruler sets (ambitions.js) ----------

/** Pays a met ambition, punishes an expired one. Returns news lines. */
function processAmbition(state) {
  const done = settleAmbition(state);
  if (!done) return [];
  const { result, def } = done;
  const f = state.ruler.gender === 'female';
  if (result === 'met') {
    applyBranch(state, def.reward, null);
    if (def.trait) state.ruler.traits[def.trait] = clampTrait(state.ruler.traits[def.trait] + 1);
    bumpStat(state, 'ambitionsDone');
    const text = `Ambice splněna: ${def.name}. ${state.ruler.name} ${f ? 'dostála' : 'dostál'} svému předsevzetí a lidé to vidí.`;
    state.chronicle.push(makeChronicleEntry(state, text));
    return [text];
  }
  applyEffects(state, FAILURE[state.scenario] || FAILURE.panovnik);
  const text = `Ambice nenaplněna: ${def.name}. Čas vypršel a předsevzetí zůstalo jen slovem.`;
  state.chronicle.push(makeChronicleEntry(state, text));
  return [text];
}

/** A child ruler's regency: the choice of a regent, and the scene that ends it at sixteen. */
function processRegencyScenes(state) {
  if (state.gameOver) return;
  // an older save with a child on the throne gets its regency now
  if (state.regency === undefined && state.generation > 1 && childRuler(state)) startRegency(state);
  const C = state.regency;
  if (!C || C.ended) return;
  const queued = (id) => state.pendingEvent === id || (state.eventQueue || []).includes(id);
  if (!C.regent) {
    if (!queued('regentstvi') && state.turn - (C.askedAt ?? -99) >= 2) { C.askedAt = state.turn; queueEvent(state, 'regentstvi'); }
    return;
  }
  if (state.ruler.age >= COMING_OF_AGE) {
    if (C.comeFirst === undefined) C.comeFirst = state.turn;
    if (!queued('plnoletost') && state.turn - (C.comeAt ?? -99) >= 3) { C.comeAt = state.turn; queueEvent(state, 'plnoletost'); }
    if (state.turn - C.comeFirst > 16) C.ended = state.turn; // the scene never got its turn: the regency simply lapses
  }
}

// Advances one round (season). Returns { turnSummary, event, successionOccurred, gameOver }.
export function advanceTurn(state) {
  ensureCourtData(state);
  state.turn += 1;
  state.seasonIndex = state.turn % SEASONS.length;
  if (state.seasonIndex === 0) state.year += 1;

  const economy = processTurnEconomy(state);
  const built = processBuilding(state); // finished work and what the towns' buildings yield
  const farm = processFarm(state); // the peasant's grain and animals (farm.js)
  const priv = processPrivileges(state); // rights and offices: what they give and what they cost (privileges.js)
  if (priv.event) queueEvent(state, priv.event);
  const crowns = state.scenario === 'panovnik' ? realmIncome(state) : 0; // foreign crowns held by the king pay their dues
  if (crowns) state.resources.gold = clampRes('gold', state.resources.gold + crowns);
  const goldIncome = economy.goldIncome + built.gold + crowns + farm.gold + priv.gold;
  const foodIncome = economy.foodIncome + built.food + farm.food + priv.food;
  let successionOccurred = false;
  let deathCheckText = '';

  // births, children growing up, the heir's place, people to court
  const familyNews = processFamily(state);
  // wounds heal, or a festering one kills
  const wounds = processInjuries(state);
  if (wounds.died) {
    successionOccurred = handleSuccession(state, 'na následky zranění');
    deathCheckText = ` ${deathWord(state, (state.pastRulers || []).at(-1)?.gender)} podle${(state.pastRulers || []).at(-1)?.gender === 'female' ? 'hla' : 'hl'} zranění.`;
  }

  if (state.seasonIndex === 0 && !wounds.died) {
    ageCharacters(state);
    if (checkNaturalDeath(state)) {
      successionOccurred = handleSuccession(state);
      deathCheckText = ` ${deathWord(state, (state.pastRulers || []).at(-1)?.gender)} zemřel${(state.pastRulers || []).at(-1)?.gender === 'female' ? 'a' : ''} přirozenou smrtí.`;
    }
  }

  const worldNews = state.seasonIndex === 0 ? ageRealms(state) : []; // news from abroad: rulers die, crowns rise up
  if (state.seasonIndex === 0) worldNews.push(...empireYear(state), ...processRegency(state)); // held crowns simmer, a regent's years go by
  // an empty granary stirs the lands up; say so before it shows in the stability
  if (!isPeasant(state) && state.resources.food < 20) worldNews.unshift(state.resources.food < 8
    ? 'Sýpky jsou prázdné. Hlad bouří kraje a stabilita se drolí — je třeba sehnat obilí nebo poslat část vojska domů.'
    : 'Zásoby jídla docházejí. V krajích roste nevole.');
  // the realm slides toward revolt: warn well before the crisis card
  if (!isPeasant(state) && state.resources.stability < 28 && state.resources.stability >= 20) worldNews.push('V zemi se bouří nevole. Bez pevné ruky se kraje začnou vymykat z moci.');
  const ambitionNews = processAmbition(state);
  updateGoldenAgeStreak(state);
  const tradeNews = [...familyNews, ...wounds.news, ...worldNews, ...ambitionNews, ...built.news, ...farm.news, ...priv.news, ...processTrade(state)];

  const seasonLabel = SEASONS[state.seasonIndex];
  const [goldWord, foodWord] = isPeasant(state) ? ['grošů', 'zásob'] : ['zlata', 'jídla'];
  const goldText = isPeasant(state) ? grosLabel(goldIncome) : `${goldIncome} ${goldWord}`;
  if (state.lastCadet !== undefined && state.lastCadet !== state.turn) delete state.lastCadet;
  const turnSummary = `${seasonLabel} roku ${state.year}. Příjem: ${goldIncome >= 0 ? '+' : ''}${goldText}, ${foodIncome >= 0 ? '+' : ''}${foodIncome} ${foodWord}.${deathCheckText}`;
  state.chronicle.push(makeChronicleEntry(state, turnSummary));

  const gameOver = checkEndConditions(state);
  if (gameOver) {
    state.gameOver = gameOver;
    return { turnSummary, event: null, successionOccurred, gameOver };
  }

  // scenes waiting in the queue (a regent to choose, the coming of age, a chapter card) go before anything that comes up on its own
  if (!state.pendingEvent && state.eventQueue && state.eventQueue.length) state.pendingEvent = state.eventQueue.shift();
  raiseCrisis(state);
  // the army in the field: supplies, the end of a campaign, the season's war event
  tradeNews.unshift(...processWar(state));
  // now and then the ruler is asked to set a goal for the coming years
  if (!state.pendingEvent && readyToOffer(state)) state.pendingEvent = 'ambice';
  processThroneArc(state);
  // three years of prosperity: the chronicle may end in glory, or the king reaches for more (once in ten years)
  if (state.scenario === 'panovnik' && state.goldenAgeStreak >= GOLDEN_AGE_TARGET && state.turn - (state.goldenOffered ?? -99) >= 40) {
    state.goldenOffered = state.turn;
    queueEvent(state, 'zlaty_vek');
  }
  // after the harvest a farm that got no extra work this year gets its chance in the story
  // a lord or a king decides one thing for one land a year, in spring, in the story (not on the map)
  if (!state.pendingEvent && !isPeasant(state) && state.seasonIndex <= 1 && decreeAvailable(state) && ownProvinces(state).length) state.pendingEvent = 'vynos_roku'; // spring, or summer when spring was busy
  // (autumn, or winter when the autumn was taken by something more pressing)
  if (!state.pendingEvent && isPeasant(state) && state.seasonIndex >= 2 && decreeAvailable(state)) state.pendingEvent = 's_prace_na_gruntu';
  processEmpire(state); // the autumn decree for the foreign crowns the king holds (events_empire.js risa_sprava)
  processRegencyScenes(state); // a child ruler needs a regent, and at sixteen the regency ends
  const event = pickNextEvent(state);
  state.currentEvent = event ? event.id : null;
  return { turnSummary, event, successionOccurred, gameOver: null, tradeNews };
}
