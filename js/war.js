// War campaigns (válečná tažení): the player sends part of the army against
// a foreign land, a lost province or (as a noble) a rival house. The army
// marches for a season or two, then every season brings a war event
// (events_war.js) whose choices move the campaign's progress and morale.
// At 100 % progress the campaign is won, at zero morale or with no men
// left it is lost; the player can recall the army at any time.
//
// state.war = { target, power, troops, start, morale, progress, leader, arrive, seasons, log, battles, scouted, battle }
//   power = men in the field (always the sum of troops = { spear, archer, horse, siege, merc }, see troops.js);
//   battle = the enemy's line of the battle being fought (battle.js)
// state.tributes = [{ from, gold, until }]   ·   No DOM here.

import { clamp, bumpStat, NOBLE_HOUSES, clampRes } from './data.js';
import { makeChronicleEntry } from './state.js';
import { injure } from './injuries.js';
import { roleLabel } from './court.js';
import { REALMS, ensureRealms, realmStrength, realmRulerLabel, beatRealm, ownsRealm } from './realms.js';
import {
  TROOP_KEYS, apportion, emptyTroops, troopsTotal, ensureTroops, freeTroops, syncTroops, countLabel,
} from './troops.js';
import { AVG_POW, avgPow, buildEnemy, fieldCorps, scoreAgainst, GRADE_LABEL, lossLine } from './battle.js';

const HUB = [633, 368];
const NOBLE_SEAT = [345, 372];

// strength: how hard the enemy fights (troops needed for even odds = 25 × strength)
// march: seasons on the road · at: where the army goes on the map
// army: the mix of the enemy host (weights) · style: how it stands in the line (battle.js STYLES)
// terrain / def: where the battle is fought and the home advantage · fort: has walls (siege engines help)
export const WAR_TARGETS = {
  east: {
    name: 'Východní marky', enemy: 'markrabata se svými družinami', loc: 've Východních markách', strength: 1.3, march: 2, at: [1222, 440],
    army: { horse: 0.55, spear: 0.3, archer: 0.15 }, style: 'wings', terrain: 'plain', def: 1, fort: true,
    text: 'Bojovní markrabata za Sokolím hvozdem. Těžký protivník, ale porážka je donutí platit tribut na léta.',
    reward: 'tribut 3 zlata za období na 6 let, velká prestiž', scenarios: ['panovnik'],
  },
  north: {
    name: 'Severní pustiny', enemy: 'severní kmeny', loc: 'v Severních pustinách', strength: 0.9, march: 2, at: [1010, 60],
    army: { spear: 0.5, archer: 0.4, horse: 0.1 }, style: 'skirmish', terrain: 'forest', def: 1, fort: false,
    text: 'Chudé kmeny za horami. Snadnější kořist, ale zima tam zabíjí víc mužů než meče.',
    reward: 'kožešiny do skladu, tribut 1 zlato za období na 3 roky, prestiž', scenarios: ['panovnik'], winterHard: true,
  },
  south: {
    name: 'Jižní říše', enemy: 'jižní flotila a přístavní posádky', loc: 'na pobřeží Jižní říše', strength: 1.6, march: 1, at: [262, 812], sea: true,
    army: { archer: 0.45, spear: 0.45, horse: 0.1 }, style: 'garrison', terrain: 'coast', def: 1.08, fort: true,
    text: 'Bohatá říše za mořem. Dobýt ji nejde, ale nájezd na její přístavy přinese velkou kořist.',
    reward: 'velká kořist ve zlatě, prestiž; jižní kupci budou rok platit méně', scenarios: ['panovnik'],
  },
};

// "5 mužů", "1 muž", "3 muži"
export const men = (n) => `${n} ${n === 1 ? 'muž' : n >= 2 && n <= 4 ? 'muži' : 'mužů'}`;
export const SIZES = { small: 15, medium: 25, large: 40 };
const WAR_GAP = 8; // seasons of rest between campaigns

// ---------- what can be attacked ----------

/** Every target open to this scenario: lands abroad, lost provinces, rival houses. */
export function warTargets(state) {
  const out = {};
  for (const [k, t] of Object.entries(WAR_TARGETS)) {
    if (!t.scenarios.includes(state.scenario) || ownsRealm(state, k)) continue;
    // a foreign realm fights as hard as it is strong; a broken one can lose its crown
    const r = ensureRealms(state)[k];
    const canFall = REALMS[k].conquerable && r.power - 25 <= 25; // beatRealm takes 25 power; at 25 or less the crown falls
    out[k] = {
      ...t, strength: +(t.strength * realmStrength(state, k)).toFixed(2),
      text: `${t.text} Vládne ${realmRulerLabel(state, k)}.`,
      reward: canFall ? `koruna ${REALMS[k].gen} — budeš vládnout i jim` : t.reward,
    };
  }
  if (state.scenario === 'panovnik') {
    for (const p of state.provinces.filter((x) => x.lost)) {
      const name = p.name.replace(/ \(.*\)$/, '');
      out[`prov:${p.id}`] = {
        name: `Znovudobytí: ${name}`, enemy: 'vzbouřenci a cizí posádky', loc: `v kraji ${name}`, strength: 1.0, march: 1, province: p.id,
        army: { spear: 0.55, archer: 0.25, horse: 0.2 }, style: 'line', terrain: 'plain', def: 1, fort: true,
        text: `Kraj ${name} se odtrhl od koruny. Dokud ho nezískáš zpět, zlatý věk nepřijde.`,
        reward: 'kraj se vrátí koruně, legitimita a prestiž',
      };
    }
  }
  if (state.scenario === 'slechtic') {
    const crown = rebellionTarget(state);
    if (crown) out.crown = crown;
    for (const h of state.houses || []) {
      const def = NOBLE_HOUSES.find((d) => d.id === h.id);
      if (h.ally || h.married) continue; // one does not raid allies or in-laws
      const prov = state.provinces.find((p) => p.id === def.seat);
      if (prov && prov.owner === 'player') continue; // their seat is already yours
      // the house's own mix and muster if its record has them (noble houses may), else a plain line army
      const army = def.troops || h.troops || { spear: 0.5, archer: 0.25, horse: 0.25 };
      const muster = h.muster || def.muster || 0;
      out[`house:${h.id}`] = {
        name: `Soukromá válka: ${def.short}`, enemy: `družina ${def.gen}`, loc: `na panství ${def.gen}`,
        strength: muster ? (muster * avgPow(army)) / (25 * AVG_POW) : 0.6 + h.power / 140, march: 1, house: h.id, province: prov ? prov.id : null,
        army, men: muster || 0, style: 'line', terrain: 'hills', def: 1.06, fort: true,
        text: `Nájezd na ${def.hold ? `državu ${def.hold.name}` : prov ? `panství ${prov.name.replace(/ \(.*\)$/, '')}` : 'jejich panství'}. Kořist a oslabení soupeře — ale král soukromé války nevidí rád.`,
        reward: 'kořist, oslabení rodu; přízeň krále klesne',
      };
    }
  }
  return out;
}

// ---------- the great lord against the king ----------

/** Houses that would ride with the player against the crown. */
export function rebelAllies(state) {
  return (state.houses || []).filter((h) => (h.ally || h.married) && h.attitude >= 50);
}

const houseDef = (h) => NOBLE_HOUSES.find((d) => d.id === h.id) || {};
/** The retinue an allied house sends: its muster in its own mix of men. */
export function allyRetinue(h) {
  const d = houseDef(h);
  const n = h.muster || d.muster || 6;
  return apportion(d.troops || h.troops || { spear: 0.5, archer: 0.25, horse: 0.25 }, n);
}

/**
 * A great lord (významný šlechtic) can rise against the king. The royal army is strong;
 * allied houses, a claim to the throne, conspirators at court and foreign help weaken it.
 */
function rebellionTarget(state) {
  if (state.ruler.statusTier < 4 || !state.king || !state.king.alive) return null;
  const allies = rebelAllies(state);
  const r = state.resources;
  const f = state.flags || {};
  const strength = Math.max(0.7, 1.7 - 0.22 * allies.length - (r.legitimacy >= 40 ? 0.15 : 0)
    - (state.noble && state.noble.plot >= 2 ? 0.15 : 0) - (f.cizi_podpora ? 0.25 : 0));
  const help = [
    allies.length ? `s tebou půjdou ${allies.map((h) => NOBLE_HOUSES.find((d) => d.id === h.id).short).join(' a ')}` : 'žádný rod s tebou nepůjde',
    r.legitimacy >= 40 ? 'tvůj nárok na trůn zná celá země' : 'tvůj nárok na trůn je slabý',
    f.cizi_podpora ? 'cizí panovník pošle muže' : '',
  ].filter(Boolean).join(', ');
  return {
    name: 'Povstání proti koruně', enemy: 'královské vojsko', loc: 'u Vlčího Údělu',
    strength, march: 1, province: 'capital', rebellion: true,
    army: { spear: 0.4, archer: 0.22, horse: 0.28, merc: 0.1 }, style: 'line', terrain: 'plain', def: 1.05, fort: true,
    text: `Otevřená vzpoura proti koruně. Když vyhraješ, usedneš na trůn; když prohraješ, čeká tě kat nebo cizina. Spojenci a nárok oslabují královo vojsko: ${help}.`,
    reward: 'královská koruna',
  };
}

export function warPoint(state, key) {
  const t = warTargets(state)[key] || {};
  return t.at || null;
}

/**
 * The men a size stands for: spread over the free troops in their own mix (no siege engines).
 * `size` is a number or one of SIZES' keys.
 */
export function presetCorps(state, size) {
  const want = typeof size === 'number' ? size : SIZES[size] || 0;
  const free = freeTroops(state);
  const keys = ['spear', 'archer', 'horse', 'merc'];
  const out = emptyTroops();
  let left = Math.min(want, keys.reduce((n, k) => n + free[k], 0));
  for (let pass = 0; pass < 4 && left > 0; pass++) {
    const w = {};
    for (const k of keys) w[k] = Math.max(0, free[k] - out[k]);
    const give = apportion(w, left);
    for (const k of keys) {
      const n = Math.min(give[k], free[k] - out[k]);
      out[k] += n;
      left -= n;
    }
  }
  return out;
}

/** A corps made of a size's name ('small'...) or an object of men by type, cleaned of nonsense. */
function corpsOf(state, sizeOrCorps) {
  if (typeof sizeOrCorps === 'string') return presetCorps(state, sizeOrCorps);
  const out = emptyTroops();
  for (const k of TROOP_KEYS) out[k] = Math.max(0, Math.floor((sizeOrCorps && sizeOrCorps[k]) || 0));
  return out;
}

/** Why a campaign cannot start now (null = it can). `size` is a name of SIZES or a corps { spear, archer, horse, siege, merc }. */
export function warBlock(state, key, size) {
  if (state.gameOver) return 'Kronika skončila.';
  if (state.scenario === 'sedlak') return 'Sedlák války nevede.';
  if (state.war) return 'Vojsko už je v poli.';
  if (state.turn < (state.warNext || 0)) return 'Vojsko se ještě zotavuje z minulého tažení.';
  const t = warTargets(state)[key];
  if (!t) return 'Tenhle cíl teď není.';
  syncTroops(state);
  const named = typeof size === 'string';
  const want = named ? SIZES[size] : troopsTotal(corpsOf(state, size));
  if (!want) return 'Vyber, kolik mužů vytáhne.';
  const free = freeTroops(state);
  if (named) {
    if (TROOP_KEYS.reduce((n, k) => n + (k === 'siege' ? 0 : free[k]), 0) < want) return 'Tolik volných mužů nemáš — část je v posádkách nebo ve výcviku.';
  } else {
    const c = corpsOf(state, size);
    if (TROOP_KEYS.some((k) => c[k] > free[k])) return 'Tolik mužů toho typu nemáš — část je v posádkách.';
  }
  if (state.resources.army - want < 8) return 'Tolik mužů nemáš — doma musí zůstat aspoň posádka.';
  if (state.resources.food < 10) return 'Bez zásob se do pole táhnout nedá.';
  return null;
}

export function startWar(state, key, size, leader = 'marshal') {
  if (state.ruler.age < 16) leader = 'marshal'; // a child does not lead an army
  const why = warBlock(state, key, size);
  if (why) return { error: why };
  const t = warTargets(state)[key];
  const corps = corpsOf(state, size);
  const men = troopsTotal(corps);
  for (const k of TROOP_KEYS) state.troops[k] -= corps[k];
  state.resources.army = clampRes('army', state.resources.army - men);
  state.war = {
    target: key, power: men, troops: { ...corps }, start: state.turn, morale: leader === 'ruler' ? 70 : 60, progress: 0,
    leader: leader === 'ruler' ? 'ruler' : 'marshal', arrive: state.turn + t.march, seasons: 0, log: [], battles: 0,
  };
  const who = leader === 'ruler' ? state.ruler.name : state.marshal.name;
  let text = `Vojsko vytáhlo do pole: ${t.name}. ${men} mužů vede ${who}.`;
  if (t.rebellion) {
    // open revolt: the king's favour is gone, the houses take sides
    state.flags.rebellion = true;
    state.resources.favor = 0;
    const allies = rebelAllies(state);
    let extra = 0;
    for (const h of allies) {
      // the allied houses send their retinues, in their own mix of men
      const r = allyRetinue(h);
      for (const k of TROOP_KEYS) state.war.troops[k] += r[k] || 0;
      extra += troopsTotal(r);
    }
    state.war.power = troopsTotal(state.war.troops);
    for (const h of state.houses) h.attitude = clamp(h.attitude + (allies.includes(h) ? 5 : -6));
    text = `Rod ${state.dynastyName} pozvedl zbraně proti koruně! ${men} mužů${allies.length ? ` a družiny spojenců (${extra} mužů)` : ''} vede ${who} na Vlčí Úděl.`;
  }
  syncTroops(state);
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

/** The score S of a corps against a target in an ordinary battle: positive = the man has the better of it. Memoised. */
let scoreMemo = { key: '', S: 0 };
function corpsScore(state, t, corps, progress = 0) {
  const key = `${t.name}|${t.strength}|${t.men || ''}|${progress}|${TROOP_KEYS.map((k) => corps[k] || 0).join(',')}`;
  if (scoreMemo.key === key) return scoreMemo.S;
  const enemy = buildEnemy(t, 'field', 12345, progress);
  const S = troopsTotal(corps) > 0 ? scoreAgainst('field', { terrain: t.terrain || 'plain', def: t.def || 1 }, corps, enemy, {}) : -1;
  scoreMemo = { key, S };
  return S;
}

/** The army against the enemy in words, for a planned or running campaign: [label, tone]. `men` is a number or a corps. */
export function oddsLabel(state, key, men) {
  const t = warTargets(state)[key] || warTarget(state);
  if (!t) return ['', ''];
  const corps = typeof men === 'number' ? presetCorps(state, men) : men;
  const S = corpsScore(state, t, corps, 0);
  if (S >= 0.12) return ['Převaha', 'good'];
  if (S >= -0.08) return ['Vyrovnané síly', 'warn'];
  return ['Nepřítel je silnější', 'bad'];
}

/** How the odds of the war events lean: the corps against the enemy, morale and who leads. */
export function warBonus(state) {
  const w = state.war;
  if (!w) return 0;
  const t = warTarget(state);
  const S = corpsScore(state, t, fieldCorps(state), w.progress || 0);
  const ratio = (1 + Math.min(0.95, S)) / (1 - Math.min(0.95, S));
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

/** The men of the corps in the field, lost proportionally (engines last): keeps power == sum of troops. */
export function warLose(state, n) {
  const w = state.war;
  const t = fieldCorps(state);
  const weights = {};
  for (const k of TROOP_KEYS) weights[k] = t[k] * (k === 'siege' ? 0.5 : 1);
  const take = apportion(weights, Math.min(n, troopsTotal(t)));
  for (const k of TROOP_KEYS) t[k] = Math.max(0, t[k] - (take[k] || 0));
  w.power = troopsTotal(t);
}

/** Men joining the corps in the field (levy: spearmen first). */
export function warGain(state, n) {
  const w = state.war;
  const t = fieldCorps(state);
  const add = apportion({ spear: 4, archer: 1 }, n);
  t.spear += add.spear;
  t.archer += add.archer;
  w.power = troopsTotal(t);
}

/**
 * Branch effect `war` of a war event:
 *   progress, morale, power (men lost or gained), end: 'win' | 'peace' | 'retreat',
 *   wound: chance that a ruler who leads in person is hurt, scout: the enemy line is now known
 */
export function applyWarEffects(state, fx, notes) {
  if (!fx || !state.war) return;
  const w = state.war;
  fieldCorps(state);
  if (fx.progress) {
    // more men than the enemy needs push harder; too few push less
    const t = warTarget(state);
    const scale = fx.progress > 0 ? Math.max(0.6, Math.min(1.4, w.power / (25 * t.strength))) : 1;
    w.progress = Math.max(0, Math.min(100, w.progress + Math.round(fx.progress * scale)));
  }
  if (fx.morale) w.morale = Math.max(0, Math.min(100, w.morale + fx.morale));
  if (fx.power) fx.power < 0 ? warLose(state, -fx.power) : warGain(state, fx.power);
  if (fx.scout) w.scouted = true;
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

/**
 * What a fought battle (battle.js fightBattle) does to the campaign: the dead by type,
 * progress and morale by how the day went, a wound for a leader in the front rank.
 */
export function applyBattleResult(state, r, notes) {
  const w = state.war;
  if (!w) return;
  const t = fieldCorps(state);
  for (const k of TROOP_KEYS) t[k] = Math.max(0, t[k] - (r.losses[k] || 0));
  w.power = troopsTotal(t);
  w.progress = Math.max(0, Math.min(100, w.progress + r.progress));
  w.morale = Math.max(0, Math.min(100, w.morale + r.morale));
  w.battles = (w.battles || 0) + 1;
  delete w.battle;
  if (r.win) bumpStat(state, 'battlesWon');
  notes.push({ text: `${GRADE_LABEL[r.grade]}. Ztráty: ${lossLine(r.losses)}`, tone: r.win ? 'pos' : r.grade === 'draw' ? 'neutral' : 'neg' });
  const parts = [];
  if (r.progress) parts.push(`postup ${r.progress > 0 ? '+' : ''}${r.progress}`);
  if (r.morale) parts.push(`morálka ${r.morale > 0 ? '+' : ''}${r.morale}`);
  if (parts.length) notes.push({ text: `Tažení: ${parts.join(', ')}`, tone: r.progress + r.morale >= 0 ? 'pos' : 'neg' });
  if (r.wound && w.leader === 'ruler' && Math.random() < r.wound) {
    injure(state, { pool: ['pohmozdeni', 'zlomenina', 'rana', 'rana', 'jizva', 'oko', 'ruka', 'noha'] }, notes);
  }
}

/** Brings the army home before the war is decided. */
export function recallWar(state) {
  if (!state.war) return { error: 'Žádné vojsko není v poli.' };
  const news = [];
  endWar(state, 'retreat', news);
  return { message: news[0] };
}

const SEASON_WAR_EVENTS = ['w_bitva', 'w_obleh', 'w_prepad', 'w_nemoc', 'w_dezerce', 'w_mir', 'w_zasoby', 'w_hrdina', 'w_zved'];

/**
 * Every season: supplies, weariness, tributes, the end of a campaign and the
 * next war event (set as state.pendingEvent). Returns news lines.
 */
export function processWar(state) {
  const news = [];
  // tributes from beaten enemies
  if (state.tributes && state.tributes.length) {
    for (const t of state.tributes) state.resources.gold = clampRes('gold', state.resources.gold + t.gold);
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
  const corps = fieldCorps(state);
  // the army eats (mercenaries bring their own bread); a hungry army loses heart
  const eat = Math.ceil((w.power - corps.merc) / 8);
  if (state.resources.food >= eat) state.resources.food = clampRes('food', state.resources.food - eat);
  else { state.resources.food = 0; w.morale = Math.max(0, w.morale - 12); news.push('Vojsku v poli došly zásoby. Morálka padá.'); }
  if (w.seasons > 4) w.morale = Math.max(0, w.morale - 3); // long wars wear men down
  if (state.seasonIndex === 3) {
    w.morale = Math.max(0, w.morale - (t.winterHard ? 6 : 3));
    if (t.winterHard) warLose(state, 1);
  }
  // hired swords in the field are paid in gold every season, or they walk away
  if (corps.merc > 0) {
    const pay = Math.max(1, Math.round(corps.merc * 0.3));
    if (state.resources.gold >= pay) state.resources.gold = clampRes('gold', state.resources.gold - pay);
    else {
      const gone = Math.max(1, Math.ceil(corps.merc * 0.35));
      corps.merc -= gone;
      w.power = troopsTotal(corps);
      w.morale = Math.max(0, w.morale - 5);
      news.push(`Žoldnéři v poli nedostali žold: ${countLabel('merc', gone)} ${gone === 1 ? 'zběhl' : 'zběhli'}.`);
    }
  }
  // a ruler away at war is missed at home
  if (w.leader === 'ruler' && w.seasons % 2 === 0) state.resources.stability = clamp(state.resources.stability - 1);
  if (w.progress >= 100) { endWar(state, 'win', news); return news; }
  if (w.morale <= 0 || w.power <= 2) { endWar(state, 'lose', news); return news; }
  if (state.turn < w.arrive) {
    news.push(`Vojsko táhne: ${t.name}. Na místě bude ${state.turn + 1 >= w.arrive ? 'příští období' : 'za dvě období'}.`);
    return news;
  }
  // in the field: the siege grinds on by itself a little (engines grind faster at a walled place), then the season's war event
  w.progress = Math.min(100, w.progress + 6 + (t.fort ? Math.min(8, Math.round(1.5 * corps.siege)) : 0));
  if (w.progress >= 100) { endWar(state, 'win', news); return news; } // the siege ground down the last walls by itself
  if (!state.pendingEvent) {
    const pool = SEASON_WAR_EVENTS.filter((id) => warEventFits(state, id));
    // the same scene not again within the last three seasons of this campaign
    const recent = w.log.slice(-3);
    const fresh = pool.filter((id) => !recent.includes(id));
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
  if (id === 'w_obleh') return w.progress >= 60; // "the last fortress"
  if (id === 'w_mir') return w.progress >= 60 && !w.log.includes('w_mir'); // "victory is within reach"
  if (id === 'w_zasoby') return state.resources.food < 15; // the army in the field truly goes hungry
  if (id === 'w_hrdina') return w.morale < 70 && !w.log.includes('w_hrdina');
  if (id === 'w_prepad') return w.seasons >= 2 && !w.log.includes('w_prepad'); // an ambush, once a campaign
  if (id === 'w_nemoc' || id === 'w_dezerce') return w.seasons >= 2;
  return true;
}

/** The closing scene of a war; a stale war event of this campaign gives way, anything else (a chapter card) goes first. */
function queueAfter(state, id) {
  if (!state.pendingEvent || SEASON_WAR_EVENTS.includes(state.pendingEvent)) state.pendingEvent = id;
  else (state.eventQueue = state.eventQueue || []).push(id);
}

function endWar(state, how, news) {
  const w = state.war;
  const t = warTarget(state);
  const key = w.target;
  const f = state.ruler.gender === 'female';
  const corps = fieldCorps(state);
  const back = Math.max(0, w.power);
  state.lastWar = { ...warTokens(state), 'war.men': String(back) };
  if (ensureTroops(state)) for (const k of TROOP_KEYS) state.troops[k] += corps[k] || 0;
  state.resources.army = clampRes('army', state.resources.army + back);
  syncTroops(state);
  state.war = null;
  state.warNext = state.turn + WAR_GAP;
  if (t.rebellion && !t.gone) return endRebellion(state, how, back, news);
  // a won or lost campaign gets its own closing scene
  if ((how === 'win' || how === 'lose') && !t.gone) queueAfter(state, how === 'win' ? 'w_triumf' : 'w_porazka');
  if (key === 'crown') delete state.flags.rebellion; // the king died meanwhile: the revolt has no one left to fight
  let text;
  if (how === 'win') {
    bumpStat(state, 'warsWon');
    text = winWar(state, key, t, back);
  } else if (how === 'peace') {
    text = t.gone ? 'Tažení skončilo: o co se bojovalo, to už není třeba dobývat.' : `Mír s nepřítelem (${t.name}). Vojsko se vrací domů s výkupným a ${back} muži.`;
    if (!t.gone) {
      state.resources.gold = clampRes('gold', state.resources.gold + 10);
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
    text = `Tažení skončilo porážkou (${t.name}). Domů se ${back ? `vrací jen ${men(back)}` : 'nevrátil nikdo'} a ${f ? 'vládkyně' : 'vládce'} přišel${f ? 'a' : ''} o kus cti.`;
  }
  news.push(text);
  state.chronicle.push(makeChronicleEntry(state, text));
}

/** The revolt is decided: the gates open, the rebels scatter, or the king offers terms. */
function endRebellion(state, how, back, news) {
  let text;
  if (how === 'win') {
    bumpStat(state, 'warsWon');
    queueAfter(state, 'w_povstani_vitezstvi'); // the player decides the old king's fate and takes the crown
    text = `Královské vojsko je poraženo! Brány Vlčího Údělu se otevřely rodu ${state.dynastyName}.`;
  } else if (how === 'peace') {
    delete state.flags.rebellion;
    state.resources.favor = 20;
    state.resources.legitimacy = clamp(state.resources.legitimacy + 5);
    state.resources.prestige = clamp(state.resources.prestige + 4);
    const kq = state.king.gender === 'female';
    text = `${kq ? 'Královna' : 'Král'} ${state.king.name} uzavřel${kq ? 'a' : ''} s povstalci smír. Rod ${state.dynastyName} si udržel panství i hlavu a celá země ví, že se s ním musí počítat.`;
  } else {
    // a lost or abandoned revolt: the king will not forget
    bumpStat(state, 'warsLost');
    queueAfter(state, 'w_povstani_porazka');
    text = how === 'retreat'
      ? `Povstalci se stáhli od Vlčího Údělu. ${back} mužů se vrací na tvrz — a královo vojsko táhne za nimi.`
      : `Povstání proti králi skončilo porážkou. Domů se ${back ? `vrací jen ${men(back)}` : 'nevrátil nikdo'}.`;
  }
  news.push(text);
  state.chronicle.push(makeChronicleEntry(state, text));
}

function winWar(state, key, t, back) {
  const r = state.resources;
  const add = (k, v) => { if (r[k] !== undefined) r[k] = clampRes(k, r[k] + v); };
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
    // a house with nothing left to fight with loses its seat: the player's estate grows
    const seat = h && h.power <= 30 && state.provinces.find((p) => p.id === t.province);
    if (seat && seat.owner === t.house) {
      Object.assign(seat, { owner: 'player', loyalty: 35, unrest: 50, garrison: 25 });
      add('favor', -8);
      bumpStat(state, 'seized');
      return `Rod ${NOBLE_HOUSES.find((d) => d.id === t.house).gen} je zlomen. Jeho sídlo ${seat.name.replace(/ \(.*\)$/, '')} teď patří rodu ${state.dynastyName}. Král se mračí, ale panství máš ty.`;
    }
    return `Nájezd se vydařil. Družina ${NOBLE_HOUSES.find((d) => d.id === t.house).gen} je rozprášena a vozy plné kořisti míří domů. Král se mračí.`;
  }
  state.tributes = state.tributes || [];
  const beaten = REALMS[key] ? beatRealm(state, key) : null;
  if (beaten && beaten.conquered) {
    add('prestige', 12); add('legitimacy', 6);
    state.tributes = state.tributes.filter((x) => x.realm !== key); // a crown of your own pays no tribute
    bumpStat(state, 'crownsTaken');
    return `${beaten.text} Vojsko se vrací s ${back} muži.`;
  }
  if (key === 'east') {
    state.tributes.push({ from: 'z Východních marek', realm: 'east', gold: 3, until: state.turn + 24 });
    add('prestige', 10); add('legitimacy', 4);
    return `Markrabata se vzdala! Východní marky budou šest let platit tribut. Vojsko se vrací s ${back} muži.`;
  }
  if (key === 'north') {
    state.tributes.push({ from: 'ze Severních pustin', realm: 'north', gold: 1, until: state.turn + 12 });
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

/** Who leads the army, in the right gender: "vládkyně osobně", "maršálka". */
export function leaderLabel(key, state) {
  if (key === 'ruler') return state.ruler.gender === 'female' ? 'vládkyně osobně' : 'vládce osobně';
  return roleLabel('marshal', state.marshal.gender, state.scenario, state.flags).toLowerCase();
}
