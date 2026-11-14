// Regency: a ruler under sixteen does not rule. When the heir is a child at the succession
// (engine.js handleSuccession) the player chooses in the forced scene 'regentstvi' who governs in
// the child's name: the surviving parent, an uncle or aunt, the chancellor or a council. The regent
// has a loyalty and an ambition (hidden); an ambitious one may reach for more (event regent_moc) and
// at sixteen the scene 'plnoletost' ends the regency, peacefully or not.
//
// state.regency = {
//   started, until,             // turns: the succession and the spring the ruler turns sixteen
//   regent: null | 'spouse' | 'sibling' | 'chancellor' | 'council',
//   name, gender, rel, ageAt, since,    // who governs ('rada velmožů' for the council, which is feminine)
//   loyalty, ambition, grab,    // hidden: grab = the regent has already been caught reaching for power
//   cand: { spouse, sibling },  // who could be asked (the old ruler's widow(er), a brother or sister of theirs)
//   ended?, how?,               // turn and way the regency ended
// }
// No DOM here — engine.js runs it, events_regency.js tells it, ui.js shows the name on the plaque.

import { clamp, clampRes, randInt, yearsLabel } from './data.js';
import { makeChronicleEntry } from './state.js';
import { roleLabel } from './court.js';

export const COMING_OF_AGE = 16;

export const childRuler = (state) => state.ruler.age < COMING_OF_AGE;
/** A regency that has begun and has not been closed by the coming-of-age scene. */
export const regencyOn = (state) => !!(state.regency && !state.regency.ended);

/** The spring the ruler turns sixteen (ages are added every spring). */
function untilTurn(state) {
  const springs = Math.max(1, COMING_OF_AGE - state.ruler.age);
  return state.turn + (4 - state.seasonIndex) + (springs - 1) * 4;
}

const councilName = (state) => (state.scenario === 'sedlak' ? 'rada sousedů' : state.scenario === 'slechtic' ? 'rada vazalů' : 'rada velmožů');

/**
 * Opens a regency for a child ruler. `parent` = the old ruler's living spouse (the child's mother or father),
 * `kin` = a grown brother or sister of the old ruler: { name, gender, age, rel }.
 */
export function startRegency(state, { parent = null, kin = null } = {}) {
  state.regency = {
    started: state.turn, until: untilTurn(state), regent: null, name: '', gender: 'male', rel: '', ageAt: 0, since: state.turn,
    loyalty: 60, ambition: 30, grab: false, cand: { spouse: parent, sibling: kin },
  };
  return state.regency;
}

/** The regent's name with a title: "matka Ludmila", "kancléř Vok", "rada velmožů". */
export function regentWho(state) {
  const C = state.regency;
  if (!C || !C.regent) return '';
  return C.regent === 'council' ? C.name : `${C.rel} ${C.name}`;
}

/** The regent's age now (a council has none). */
export function regentAge(state) {
  const C = state.regency;
  return C && C.regent && C.regent !== 'council' ? C.ageAt + Math.floor((state.turn - C.since) / 4) : 0;
}

/** Puts a regent in charge. Returns the regency. */
export function appointRegent(state, kind, notes = []) {
  const C = state.regency;
  if (!C) return null;
  if (kind === 'spouse' && C.cand.spouse) {
    const c = C.cand.spouse;
    Object.assign(C, { regent: 'spouse', name: c.name, gender: c.gender, rel: c.gender === 'female' ? 'matka' : 'otec', ageAt: c.age, loyalty: clamp(c.loyalty ?? 65), ambition: randInt(10, 30) });
  } else if (kind === 'sibling' && C.cand.sibling) {
    const c = C.cand.sibling;
    Object.assign(C, { regent: 'sibling', name: c.name, gender: c.gender, rel: c.rel, ageAt: c.age, loyalty: 55, ambition: randInt(50, 80) });
  } else if (kind === 'chancellor') {
    const c = state.chancellor;
    Object.assign(C, {
      regent: 'chancellor', name: c.name, gender: c.gender, rel: roleLabel('chancellor', c.gender, state.scenario, state.flags).toLowerCase(),
      ageAt: c.age, loyalty: clamp(c.loyalty), ambition: clamp(randInt(30, 65) - Math.round((c.loyalty - 60) / 2)),
    });
  } else {
    Object.assign(C, { regent: 'council', name: councilName(state), gender: 'female', rel: 'rada', ageAt: 0, loyalty: 50, ambition: 10 });
  }
  C.since = state.turn;
  return C;
}

/** Closes the regency (the coming-of-age scene decides how). */
export function endRegency(state, how) {
  const C = state.regency;
  if (!C || C.ended) return;
  C.ended = state.turn;
  C.how = how;
}

/** Branch extra `regency`: { appoint, ambition, loyalty, grab, dismiss, end }. */
export function applyRegencyBranch(state, fx, notes) {
  const C = state.regency;
  if (!fx || !C) return;
  if (fx.appoint) appointRegent(state, fx.appoint, notes);
  if (fx.ambition) C.ambition = clamp(C.ambition + fx.ambition);
  if (fx.loyalty) C.loyalty = clamp(C.loyalty + fx.loyalty);
  if (fx.grab) C.grab = true;
  if (fx.dismiss && C.regent && C.regent !== 'council') appointRegent(state, 'council', notes);
  if (fx.end) endRegency(state, fx.end);
}

const bump = (state, key, n) => { if (state.resources[key] !== undefined) state.resources[key] = clampRes(key, state.resources[key] + n); };

/**
 * Yearly (spring): what each kind of regent does with the years, and the regent's own mortality.
 * Returns news lines.
 */
export function processRegency(state) {
  const C = state.regency;
  const news = [];
  if (!C || C.ended || !C.regent) return news;
  const age = regentAge(state);
  if (C.regent !== 'council' && age >= 58 && Math.random() < (age - 56) * 0.04) {
    const she = C.gender === 'female';
    const text = `${C.rel[0].toUpperCase()}${C.rel.slice(1)} ${C.name} ${she ? 'zemřela' : 'zemřel'} ve věku ${age} let. Regentství přebírá ${councilName(state)}.`;
    news.push(text);
    state.chronicle.push(makeChronicleEntry(state, text));
    appointRegent(state, 'council');
    return news;
  }
  switch (C.regent) {
    case 'spouse':
      if ((state.resources.legitimacy ?? 100) < 75) bump(state, 'legitimacy', 1); // the child's own blood governs
      C.ambition = clamp(C.ambition + 1);
      break;
    case 'sibling':
      C.ambition = clamp(C.ambition + 4); // an uncle or aunt with a claim of their own
      break;
    case 'chancellor':
      bump(state, 'gold', 2); // an administrator keeps the books straight
      C.ambition = clamp(C.ambition + 3);
      break;
    case 'council':
      if (Math.random() < 0.5) bump(state, 'stability', -1); // many voices, no decision
      break;
    default:
  }
  return news;
}

// ---------- text tokens ----------

/** Handover mood: one sentence, gender of the regent worked out here (it is not re-interpolated). */
function handoverMood(C) {
  const f = C.gender === 'female';
  const calm = C.ambition < 60 && !C.grab;
  if (C.regent === 'council') {
    return calm
      ? 'Rada drží slovo: složila své pravomoci a její členové čekají, jak s nimi naložíš.'
      : 'Rada si na vládu zvykla. Její členové se přou, kdo si ponechá které pravomoci, a do předání se jim nechce.';
  }
  const who = f ? 'Ta, která vládla za tebe,' : 'Ten, kdo vládl za tebe,';
  return calm
    ? `${who} stojí stranou, bez prosby a bez námitky, a čeká, co bude dál.`
    : `${who} si na moc zvyk${f ? 'la' : 'l'}. O předání se nemluví, jen o „několika nedokončených věcech“, které prý nesnesou odklad.`;
}

/** Scenario words for the scene of choosing a regent. */
function sceneWords(state) {
  if (state.scenario === 'sedlak') {
    return { duties: 'hospodařit, platit dávky pánovi a rozhodovat, co se na gruntu zaseje', court: 'Rodina se hned rozdělila na ty, kdo hájí vlastní zájem, a ty, kdo čekají, kdo vyhraje spor o grunt.' };
  }
  if (state.scenario === 'slechtic') {
    return { duties: 'spravovat panství, platit dávky králi a vést družinu', court: 'Vazalové se hned rozdělili na ty, kdo hájí vlastní zájem, a ty, kdo čekají, kdo vyhraje.' };
  }
  return { duties: 'podepisovat listiny, přijímat posly a rozhodovat o míru a válce', court: 'Dvůr se hned rozdělil na ty, kdo hájí vlastní zájem, a ty, kdo čekají, kdo vyhraje.' };
}

export function regencyTokens(state) {
  const d = {};
  const C = state.regency;
  if (!C) return d;
  d['ruler.ageLabel'] = yearsLabel(state.ruler.age);
  const w = sceneWords(state);
  d['regency.duties'] = w.duties;
  d['regency.court'] = w.court;
  d['regency.council'] = councilName(state);
  if (C.cand && C.cand.spouse) Object.assign(d, { 'regency.spouseRel': C.cand.spouse.gender === 'female' ? 'matka' : 'otec', 'regency.spouseName': C.cand.spouse.name });
  if (C.cand && C.cand.sibling) Object.assign(d, { 'regency.kinRel': C.cand.sibling.rel, 'regency.kinName': C.cand.sibling.name });
  if (C.regent) {
    const who = regentWho(state);
    d['regent.name'] = C.name;
    d['regent.who'] = who;
    d['regent.Who'] = who[0].toUpperCase() + who.slice(1);
    d['regent.rel'] = C.rel;
    d['regent.mood'] = handoverMood(C);
  }
  return d;
}
