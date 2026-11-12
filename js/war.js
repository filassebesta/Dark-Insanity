// War campaigns (válečná tažení): the player sends part of the army against
// a foreign land, a lost province or (as a noble) a rival house. The army
// marches for a season or two, then every season brings a war event
// (events_war.js) whose choices move the campaign's progress and morale.
// At 100 % progress the campaign is won, at zero morale or with no men
// left it is lost; the player can recall the army at any time.
//
// state.war = { target, power, start, morale, progress, leader, arrive, seasons, log }
// state.tributes = [{ from, gold, until }]   ·   No DOM here.

import { clamp, bumpStat, NOBLE_HOUSES } from './data.js';
import { makeChronicleEntry } from './state.js';
import { injure } from './injuries.js';

const HUB = [633, 368];
const NOBLE_SEAT = [345, 372];

// strength: how hard the enemy fights (troops needed for even odds = 25 × strength)
// march: seasons on the road · at: where the army goes on the map
export const WAR_TARGETS = {
  east: {
    name: 'Východní marky', enemy: 'markrabata se svými družinami', loc: 've Východních markách', strength: 1.3, march: 2, at: [1222, 440],
    text: 'Bojovní markrabata za Sokolím hvozdem. Těžký protivník, ale porážka je donutí platit tribut na léta.',
    reward: 'tribut 3 zlata za období na 6 let, velká prestiž', scenarios: ['panovnik'],
  },
  north: {
    name: 'Severní pustiny', enemy: 'severní kmeny', loc: 'v Severních pustinách', strength: 0.9, march: 2, at: [1010, 60],
    text: 'Chudé kmeny za horami. Snadnější kořist, ale zima tam zabíjí víc mužů než meče.',
    reward: 'kožešiny do skladu, tribut 1 zlato za období na 3 roky, prestiž', scenarios: ['panovnik'], winterHard: true,
  },
  south: {
    name: 'Jižní říše', enemy: 'jižní flotila a přístavní posádky', loc: 'na pobřeží Jižní říše', strength: 1.6, march: 1, at: [262, 812], sea: true,
    text: 'Bohatá říše za mořem. Dobýt ji nejde, ale nájezd na její přístavy přinese velkou kořist.',
    reward: 'velká kořist ve zlatě, prestiž; jižní kupci budou rok platit méně', scenarios: ['panovnik'],
  },
};

const LEADERS = { ruler: 'vládce osobně', marshal: 'maršál' };
export const SIZES = { small: 15, medium: 25, large: 40 };
const WAR_GAP = 8; // seasons of rest between campaigns

// ---------- what can be attacked ----------

/** Every target open to this scenario: lands abroad, lost provinces, rival houses. */
export function warTargets(state) {
  const out = {};
  for (const [k, t] of Object.entries(WAR_TARGETS)) if (t.scenarios.includes(state.scenario)) out[k] = t;
  if (state.scenario === 'panovnik') {
    for (const p of state.provinces.filter((x) => x.lost)) {
      const name = p.name.replace(/ \(.*\)$/, '');
      out[`prov:${p.id}`] = {
        name: `Znovudobytí: ${name}`, enemy: 'vzbouřenci a cizí posádky', loc: `v kraji ${name}`, strength: 1.0, march: 1, province: p.id,
        text: `Kraj ${name} se odtrhl od koruny. Dokud ho nezískáš zpět, zlatý věk nepřijde.`,
        reward: 'kraj se vrátí koruně, legitimita a prestiž',
      };
    }
  }
  if (state.scenario === 'slechtic') {
    for (const h of state.houses || []) {
      const def = NOBLE_HOUSES.find((d) => d.id === h.id);
      if (h.ally || h.married) continue; // one does not raid allies or in-laws
      const prov = state.provinces.find((p) => p.id === def.seat);
      out[`house:${h.id}`] = {
        name: `Soukromá válka: ${def.short}`, enemy: `družina rodu ${def.short}`, loc: `na panství rodu ${def.short}`,
        strength: 0.6 + h.power / 140, march: 1, house: h.id, province: prov ? prov.id : null,
        text: `Nájezd na ${prov ? `panství ${prov.name.replace(/ \(.*\)$/, '')}` : 'jejich panství'}. Kořist a oslabení soupeře — ale král soukromé války nevidí rád.`,
        reward: 'kořist, oslabení rodu; přízeň krále klesne',
      };
    }
  }
  return out;
}

export function warPoint(state, key) {
  const t = warTargets(state)[key] || {};
  return t.at || null;
}

/** Why a campaign cannot start now (null = it can). */
export function warBlock(state, key, size) {
  if (state.gameOver) return 'Kronika skončila.';
  if (state.scenario === 'sedlak') return 'Sedlák války nevede.';
  if (state.war) return 'Vojsko už je v poli.';
  if (state.turn < (state.warNext || 0)) return 'Vojsko se ještě zotavuje z minulého tažení.';
  const t = warTargets(state)[key];
  if (!t) return 'Tenhle cíl teď není.';
  const men = SIZES[size];
  if (!men) return 'Vyber, kolik mužů vytáhne.';
  if (state.resources.army - men < 8) return 'Tolik mužů nemáš — doma musí zůstat aspoň posádka.';
  if (state.resources.food < 10) return 'Bez zásob se do pole táhnout nedá.';
  return null;
}

export function startWar(state, key, size, leader = 'marshal') {
  const why = warBlock(state, key, size);
  if (why) return { error: why };
  const t = warTargets(state)[key];
  const men = SIZES[size];
  state.resources.army = clamp(state.resources.army - men);
  state.war = {
    target: key, power: men, start: state.turn, morale: leader === 'ruler' ? 70 : 60, progress: 0,
    leader: leader === 'ruler' ? 'ruler' : 'marshal', arrive: state.turn + t.march, seasons: 0, log: [],
  };
  const who = leader === 'ruler' ? state.ruler.name : state.marshal.name;
  const text = `Vojsko vytáhlo do pole: ${t.name}. ${men} mužů vede ${who}.`;
  state.chronicle.push(makeChronicleEntry(state, text));
  return { message: text };
}

// ---------- the campaign itself ----------

export function warTarget(state) {
  return state.war ? warTargets(state)[state.war.target] || lostTargetFallback(state) : null;
}

// a target that vanished meanwhile (the province came back by an event, the house became an ally)
function lostTargetFallback(state) {
  return { name: 'tažení', enemy: 'nepřítel', loc: 'v poli', strength: 1, march: 0, gone: true, text: '', reward: '' };
}

/** The army against the enemy in words, for a planned or running campaign: [label, tone]. */
export function oddsLabel(state, key, men) {
  const t = warTargets(state)[key] || warTarget(state);
  if (!t) return ['', ''];
  const ratio = men / (25 * t.strength);
  if (ratio >= 1.3) return ['Převaha', 'good'];
  if (ratio >= 0.85) return ['Vyrovnané síly', 'warn'];
  return ['Nepřítel je silnější', 'bad'];
}

/** How the odds of the war events lean: numbers against the enemy, morale and who leads. */
export function warBonus(state) {
  const w = state.war;
  if (!w) return 0;
  const t = warTarget(state);
  const ratio = w.power / (25 * t.strength);
  return Math.max(-0.25, Math.min(0.25, (ratio - 1) * 0.3)) + (w.morale - 50) / 250 + (w.leader === 'ruler' ? 0.08 : 0);
}

export function warTokens(state) {
  const w = state.war;
  const t = warTarget(state);
  if (!w || !t) return state.lastWar ? { ...state.lastWar } : {}; // the closing event after a campaign
  const leader = w.leader === 'ruler' ? state.ruler : state.marshal;
  return {
    'war.target': t.name.replace(/^(Znovudobytí|Soukromá válka): /, ''),
    'war.enemy': t.enemy,
    'war.loc': t.loc,
    'war.leader': leader ? leader.name : 'velitel',
    'war.men': String(w.power),
  };
}

/**
 * Branch effect `war` of a war event:
 *   progress, morale, power (men lost or gained), end: 'win' | 'peace' | 'retreat',
 *   wound: chance that a ruler who leads in person is hurt
 */
export function applyWarEffects(state, fx, notes) {
  if (!fx || !state.war) return;
  const w = state.war;
  if (fx.progress) {
    // more men than the enemy needs push harder; too few push less
    const t = warTarget(state);
    const scale = fx.progress > 0 ? Math.max(0.6, Math.min(1.4, w.power / (25 * t.strength))) : 1;
    w.progress = Math.max(0, Math.min(100, w.progress + Math.round(fx.progress * scale)));
  }
  if (fx.morale) w.morale = Math.max(0, Math.min(100, w.morale + fx.morale));
  if (fx.power) w.power = Math.max(0, w.power + fx.power);
  if (fx.won) bumpStat(state, 'battlesWon');
  if (fx.wound && w.leader === 'ruler' && Math.random() < fx.wound) {
    injure(state, { pool: ['pohmozdeni', 'zlomenina', 'rana', 'rana', 'jizva', 'oko', 'ruka', 'noha'] }, notes);
  }
  const parts = [];
  if (fx.progress) parts.push(`postup ${fx.progress > 0 ? '+' : ''}${fx.progress}`);
  if (fx.morale) parts.push(`morálka ${fx.morale > 0 ? '+' : ''}${fx.morale}`);
  if (fx.power) parts.push(`muži ${fx.power > 0 ? '+' : ''}${fx.power}`);
  if (parts.length) notes.push({ text: `Tažení: ${parts.join(', ')}`, tone: (fx.progress || 0) + (fx.morale || 0) >= 0 ? 'pos' : 'neg' });
  if (fx.end) w.ending = fx.end; // settled at the start of the next season
}

/** Brings the army home before the war is decided. */
export function recallWar(state) {
  if (!state.war) return { error: 'Žádné vojsko není v poli.' };
  const news = [];
  endWar(state, 'retreat', news);
  return { message: news[0] };
}

const SEASON_WAR_EVENTS = ['w_bitva', 'w_obleh', 'w_nemoc', 'w_dezerce', 'w_mir', 'w_zasoby', 'w_hrdina', 'w_zved'];

/**
 * Every season: supplies, weariness, tributes, the end of a campaign and the
 * next war event (set as state.pendingEvent). Returns news lines.
 */
export function processWar(state) {
  const news = [];
  // tributes from beaten enemies
  if (state.tributes && state.tributes.length) {
    for (const t of state.tributes) state.resources.gold = clamp(state.resources.gold + t.gold);
    const ended = state.tributes.filter((t) => t.until <= state.turn);
    for (const t of ended) news.push(`Poslední tribut ${t.from} dorazil. Další už nepřijde.`);
    state.tributes = state.tributes.filter((t) => t.until > state.turn);
  }
  const w = state.war;
  if (!w) return news;
  const t = warTarget(state);
  if (t.gone) { endWar(state, 'peace', news); return news; }
  if (w.ending) { endWar(state, w.ending, news); return news; }
  w.seasons += 1;
  // the army eats; a hungry army loses heart
  const eat = Math.ceil(w.power / 8);
  if (state.resources.food >= eat) state.resources.food = clamp(state.resources.food - eat);
  else { state.resources.food = 0; w.morale = Math.max(0, w.morale - 12); news.push('Vojsku v poli došly zásoby. Morálka padá.'); }
  if (w.seasons > 4) w.morale = Math.max(0, w.morale - 3); // long wars wear men down
  if (state.seasonIndex === 3) {
    w.morale = Math.max(0, w.morale - (t.winterHard ? 6 : 3));
    if (t.winterHard) w.power = Math.max(0, w.power - 1);
  }
  // a ruler away at war is missed at home
  if (w.leader === 'ruler' && w.seasons % 2 === 0) state.resources.stability = clamp(state.resources.stability - 1);
  if (w.progress >= 100) { endWar(state, 'win', news); return news; }
  if (w.morale <= 0 || w.power <= 2) { endWar(state, 'lose', news); return news; }
  if (state.turn < w.arrive) {
    news.push(`Vojsko táhne: ${t.name}. Na místě bude ${state.turn + 1 >= w.arrive ? 'příští období' : 'za dvě období'}.`);
    return news;
  }
  // in the field: the siege grinds on by itself a little, then the season's war event
  w.progress = Math.min(100, w.progress + 6);
  if (!state.pendingEvent) {
    const pool = SEASON_WAR_EVENTS.filter((id) => warEventFits(state, id));
    const last = w.log.length ? w.log[w.log.length - 1] : null;
    const fresh = pool.filter((id) => id !== last);
    const pick = (fresh.length ? fresh : pool)[Math.floor(Math.random() * (fresh.length || pool.length))];
    if (pick) {
      state.pendingEvent = pick;
      w.log.push(pick);
    }
  }
  return news;
}

/** Which war events make sense at this point of the campaign. */
function warEventFits(state, id) {
  const w = state.war;
  if (id === 'w_obleh') return w.progress >= 35;
  if (id === 'w_mir') return w.progress >= 45 && !w.log.includes('w_mir');
  if (id === 'w_zasoby') return state.resources.food < 25;
  if (id === 'w_hrdina') return w.morale < 70 && !w.log.includes('w_hrdina');
  if (id === 'w_nemoc' || id === 'w_dezerce') return w.seasons >= 2;
  return true;
}

function endWar(state, how, news) {
  const w = state.war;
  const t = warTarget(state);
  const key = w.target;
  const f = state.ruler.gender === 'female';
  const back = Math.max(0, w.power);
  state.lastWar = { ...warTokens(state), 'war.men': String(back) };
  state.resources.army = clamp(state.resources.army + back);
  state.war = null;
  // a won or lost campaign gets its own closing scene
  if ((how === 'win' || how === 'lose') && !t.gone && !state.pendingEvent) state.pendingEvent = how === 'win' ? 'w_triumf' : 'w_porazka';
  state.warNext = state.turn + WAR_GAP;
  let text;
  if (how === 'win') {
    bumpStat(state, 'warsWon');
    text = winWar(state, key, t, back);
  } else if (how === 'peace') {
    text = t.gone ? 'Tažení skončilo: o co se bojovalo, to už není třeba dobývat.' : `Mír s nepřítelem (${t.name}). Vojsko se vrací domů s výkupným a ${back} muži.`;
    if (!t.gone) {
      state.resources.gold = clamp(state.resources.gold + 10);
      state.resources.prestige = clamp(state.resources.prestige + 2);
    }
  } else if (how === 'retreat') {
    state.resources.prestige = clamp(state.resources.prestige - 3);
    text = `Vojsko bylo odvoláno z tažení (${t.name}). Domů se vrací ${back} mužů a posměšky sousedů.`;
  } else {
    bumpStat(state, 'warsLost');
    state.resources.prestige = clamp(state.resources.prestige - 6);
    state.resources.stability = clamp(state.resources.stability - 3);
    if (state.resources.legitimacy !== undefined && state.scenario === 'panovnik') state.resources.legitimacy = clamp(state.resources.legitimacy - 2);
    if (t.house) state.resources.favor = clamp(state.resources.favor - 4);
    text = `Tažení skončilo porážkou (${t.name}). Domů se ${back ? `vrací jen ${back} mužů` : 'nevrátil nikdo'} a ${f ? 'vládkyně' : 'vládce'} přišel${f ? 'a' : ''} o kus cti.`;
  }
  news.push(text);
  state.chronicle.push(makeChronicleEntry(state, text));
}

function winWar(state, key, t, back) {
  const r = state.resources;
  const add = (k, v) => { if (r[k] !== undefined) r[k] = clamp(r[k] + v); };
  if (t.province && !t.house) {
    const p = state.provinces.find((x) => x.id === t.province);
    if (p) Object.assign(p, { lost: false, loyalty: 35, unrest: 50, garrison: 30 });
    add('legitimacy', 6); add('prestige', 8);
    bumpStat(state, 'reconquered');
    return `Vítězství! ${p ? p.name.replace(/ \(.*\)$/, '') : 'Kraj'} je zpět pod korunou. Vojsko se vrací s ${back} muži.`;
  }
  if (t.house) {
    const h = (state.houses || []).find((x) => x.id === t.house);
    if (h) { h.power = clamp(h.power - 12); h.attitude = clamp(h.attitude - 25); }
    add('gold', 15); add('prestige', 4); add('favor', -6);
    return `Nájezd se vydařil. Družina rodu ${t.name.replace('Soukromá válka: ', '')} je rozprášena a vozy plné kořisti míří domů. Král se mračí.`;
  }
  state.tributes = state.tributes || [];
  if (key === 'east') {
    state.tributes.push({ from: 'z Východních marek', gold: 3, until: state.turn + 24 });
    add('prestige', 10); add('legitimacy', 4);
    return `Markrabata se vzdala! Východní marky budou šest let platit tribut. Vojsko se vrací s ${back} muži.`;
  }
  if (key === 'north') {
    state.tributes.push({ from: 'ze Severních pustin', gold: 1, until: state.turn + 12 });
    if (state.trade && state.trade.stock) state.trade.stock.furs = Math.min(10, (state.trade.stock.furs || 0) + 4);
    add('prestige', 6);
    return `Severní kmeny se poddaly. Přinesly kožešiny a slíbily tribut na tři roky. Vojsko se vrací s ${back} muži.`;
  }
  add('gold', 30); add('prestige', 6);
  if (state.trade) {
    state.trade.mods = state.trade.mods || [];
    state.trade.mods.push({ dest: 'south', good: null, mult: 0.8, until: state.turn + 4 });
  }
  return `Nájezd na jižní přístavy vynesl truhly zlata. Jižní kupci si to zapamatují. Vojsko se vrací s ${back} muži.`;
}

/** For the UI: where the army is on its way (0 = home, 1 = at the target). */
export function marchShare(state) {
  const w = state.war;
  if (!w) return 0;
  const t = warTarget(state);
  if (!t.march) return 1;
  return Math.max(0.15, Math.min(1, (state.turn - w.start + 0.5) / t.march));
}

export function warOrigin(state) {
  return state.scenario === 'slechtic' ? NOBLE_SEAT : HUB;
}

export function leaderLabel(key) {
  return LEADERS[key];
}
