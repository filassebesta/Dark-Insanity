// Hospodářství: the grain in the barn and the animals of the peasant's farm.
// The farm's buildings (build.js FARM_BUILDINGS) give room and yields here:
// the barn holds the grain, the mill keeps a toll of sacks every season, the
// cowshed, the stable and the pigsty hold cows, horses and pigs. Animals are
// bought and sold in the farm view (town.js), only within free room.
// Every season engine.js calls processFarm. No DOM here.
// state.farm = { grain, cows, horses, pigs }, created lazily (old saves work).

import { clamp, randInt, clampRes } from './data.js';

const FARM_TOWN = 'grunt';

// what a farm building does for the stock:
// holds: room · makes: sacks every season · brings: animals once, when finished
export const FARM_WORKS = {
  stodola: { holds: { grain: 12 } },
  mlynek: { makes: { grain: 1 } },
  chlev: { holds: { cows: 3 }, brings: { cows: 1 } },
  staj: { holds: { horses: 3 } },
  chlivek: { holds: { pigs: 4 }, brings: { pigs: 1 } },
};
const LOFT = 4; // sacks that fit in the cottage loft without a barn

// buy / sell in groše; forms = 1 / 2–4 / 5+ (and 0)
export const STOCK = {
  grain: {
    name: 'Obilí', forms: ['pytel', 'pytle', 'pytlů'], sell: 1, building: 'stodola',
    sold: 'Prodán pytel obilí',
  },
  cows: {
    name: 'Krávy', forms: ['kráva', 'krávy', 'krav'], buy: 5, sell: 3, building: 'chlev',
    bought: 'Koupena kráva', sold: 'Prodána kráva', first: 'první krávu', none: 'Krávy potřebují chlév.', full: 'V chlévě není volné místo.',
  },
  horses: {
    name: 'Koně', forms: ['kůň', 'koně', 'koní'], buy: 10, sell: 6, building: 'staj',
    bought: 'Koupen kůň', sold: 'Prodán kůň', none: 'Koně potřebují stáj.', full: 'Ve stáji není volné místo.',
  },
  pigs: {
    name: 'Prasata', forms: ['prase', 'prasata', 'prasat'], buy: 3, sell: 2, building: 'chlivek',
    bought: 'Koupeno prase', sold: 'Prodáno prase', first: 'prasnici', none: 'Prasata potřebují chlívek.', full: 'V chlívku není volné místo.',
  },
};
export const ANIMALS = ['cows', 'horses', 'pigs'];

export const FLOUR = 2;        // zásoby from one sack ground at home
const HUNGRY = 15;             // below this the household grinds its own grain
const PLOUGH = 2;              // sacks a horse adds in spring (more land ploughed)
const HAUL = 1;                // and in autumn (the harvest brought in on time)
const SLAUGHTER = 4;           // zásoby from the winter pig
const CALF = 0.5;              // chance of a calf each spring
const LITTER = 0.75;           // chance of piglets each spring

export const plural = (n, forms) => (n === 1 ? forms[0] : n >= 2 && n <= 4 ? forms[1] : forms[2]);
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const coins = (n) => `${n} ${plural(n, ['groš', 'groše', 'grošů'])}`;

function farmTown(state) {
  return state.towns && state.towns[FARM_TOWN];
}

/** Keys of the farm's finished buildings (the old barn counts: room is not a yield). */
function standing(state) {
  const town = farmTown(state);
  return town ? town.buildings.filter((b) => b.ready).map((b) => b.key) : [];
}

// (a new game has no towns until its first season: the farm is there all the same)
export const hasFarm = (state) => state.scenario === 'sedlak' && (!state.towns || !!farmTown(state));

/** The farm stock, created on first use; old saves get what their buildings imply. */
export function ensureFarm(state) {
  if (!hasFarm(state)) return null;
  if (!state.farm) {
    const keys = standing(state);
    state.farm = {
      grain: 4, // what is left from last year's harvest
      cows: keys.includes('chlev') ? 1 : 0,
      horses: state.gear && state.gear.horse === 'kun' ? 1 : 0,
      pigs: keys.includes('chlivek') ? 1 : 0,
    };
  }
  return state.farm;
}

/** How much of a stock fits on the farm. */
export function roomFor(state, key) {
  let n = key === 'grain' ? LOFT : 0;
  for (const b of standing(state)) n += (FARM_WORKS[b] && FARM_WORKS[b].holds && FARM_WORKS[b].holds[key]) || 0;
  return n;
}

export function freeRoom(state, key) {
  const f = ensureFarm(state);
  return f ? Math.max(0, roomFor(state, key) - f[key]) : 0;
}

/** A peasant's riding horse is one of the farm's horses (gear.js shows it in the smith's shop). */
function syncHorse(state) {
  const f = state.farm;
  if (!f || state.scenario !== 'sedlak') return;
  if (!state.gear) state.gear = { weapon: 'cep' }; // a peasant's default gear (gear.js ensureGear)
  if (f.horses > 0 && !state.gear.horse) state.gear.horse = 'kun';
  if (f.horses === 0 && state.gear.horse === 'kun') delete state.gear.horse;
}

/** Changes a stock by n within its room (or down to zero); returns the real change. */
function addStock(state, key, n) {
  const f = ensureFarm(state);
  if (!f || !n) return 0;
  const before = f[key];
  f[key] = n > 0 ? Math.max(before, Math.min(roomFor(state, key), before + n)) : Math.max(0, before + n);
  if (key === 'horses') syncHorse(state);
  return f[key] - before;
}

// ---------- the farm view: buying and selling ----------

/** Why this animal cannot be bought now (null = it can). */
export function buyBlock(state, key) {
  const s = STOCK[key];
  if (!s || !s.buy || !ensureFarm(state)) return 'Tohle se tu koupit nedá.';
  if (!roomFor(state, key)) return s.none;
  if (!freeRoom(state, key)) return s.full;
  if (state.resources.gold < s.buy) return 'Na to nemáš.';
  return null;
}

export function buyStock(state, key) {
  const why = buyBlock(state, key);
  if (why) return { error: why };
  state.resources.gold = clampRes('gold', state.resources.gold - STOCK[key].buy);
  addStock(state, key, 1);
  return { message: `${STOCK[key].bought} za ${coins(STOCK[key].buy)}.` };
}

export function sellBlock(state, key) {
  const f = ensureFarm(state);
  if (!f || !STOCK[key]) return 'Tohle se tu prodat nedá.';
  if (f[key] <= 0) return 'Nemáš co prodat.';
  return null;
}

export function sellStock(state, key) {
  const why = sellBlock(state, key);
  if (why) return { error: why };
  const s = STOCK[key];
  const rider = key === 'horses' && state.farm.horses === 1 && state.gear && state.gear.horse === 'kun';
  addStock(state, key, -1);
  state.resources.gold = clampRes('gold', state.resources.gold + s.sell);
  return { message: `${s.sold} (+${coins(s.sell)}).${rider ? ' S ním odešel i tvůj jezdecký kůň.' : ''}` };
}

/** One sack ground into flour for the household. */
export function grindGrain(state) {
  const f = ensureFarm(state);
  if (!f || f.grain <= 0) return { error: 'Ve stodole není obilí.' };
  f.grain -= 1;
  state.resources.food = clampRes('food', state.resources.food + FLOUR);
  return { message: `Pytel obilí se semlel na mouku (zásoby +${FLOUR}).` };
}

// ---------- every season ----------

/** Grain, milk, calves, piglets and the winter slaughter. Returns { gold, food, news }. */
export function processFarm(state) {
  const out = { gold: 0, food: 0, news: [] };
  const f = ensureFarm(state);
  if (!f) return out;
  const season = state.seasonIndex;
  const keys = standing(state);
  const r = state.resources;
  const addFood = (n) => {
    const before = r.food;
    r.food = clampRes('food', r.food + n);
    out.food += r.food - before;
  };
  // the mill keeps its toll every season; horses plough in spring and haul the harvest in autumn
  for (const b of keys) f.grain += (FARM_WORKS[b] && FARM_WORKS[b].makes && FARM_WORKS[b].makes.grain) || 0;
  if (season === 0) f.grain += PLOUGH * f.horses;
  if (season === 2) f.grain += HAUL * f.horses;
  // cows give milk except in winter, when they stand dry in the shed
  if (season !== 3 && f.cows) addFood(f.cows);
  if (season === 0) {
    if (f.cows > 0 && freeRoom(state, 'cows') && Math.random() < CALF) {
      f.cows += 1;
      out.news.push('Na gruntu se otelila kráva. V chlévě přibylo tele.');
    }
    if (f.pigs > 0 && freeRoom(state, 'pigs') && Math.random() < LITTER) {
      const n = Math.min(freeRoom(state, 'pigs'), randInt(1, 2));
      f.pigs += n;
      out.news.push(`Prasnice vrhla ${n === 1 ? 'sele' : `${n} selata`}. Chlívek je zase plnější.`);
    }
  }
  if (season === 3 && f.pigs >= 2) {
    f.pigs -= 1;
    addFood(SLAUGHTER);
    out.news.push(`Na gruntu byla zabijačka. Prase skončilo v udírně a v hrncích (zásoby +${SLAUGHTER}).`);
  }
  // what does not fit under a roof rots
  const room = roomFor(state, 'grain');
  if (f.grain > room) {
    const lost = f.grain - room;
    f.grain = room;
    const [fit, rot] = lost === 1 ? ['nevešel', 'zplesnivěl'] : lost <= 4 ? ['nevešly', 'zplesnivěly'] : ['nevešlo', 'zplesnivělo'];
    out.news.push(`${lost} ${plural(lost, STOCK.grain.forms)} obilí se ${fit} pod střechu a ${rot}.`);
  }
  // an empty larder: the household grinds its own grain
  if (r.food < HUNGRY && f.grain > 0) {
    const n = Math.min(f.grain, Math.ceil((HUNGRY - r.food) / FLOUR));
    f.grain -= n;
    addFood(n * FLOUR);
    out.news.push(`Zásoby docházely, a tak se mlelo vlastní obilí: ${n} ${plural(n, ['pytel', 'pytle', 'pytlů'])} (zásoby +${n * FLOUR}).`);
  }
  return out;
}

// ---------- the story ----------

/** Branch effect `farm: { cows: -1, grain: -99 }` of an event or a decree; capped by room. */
export function applyFarmEffects(state, fx, notes) {
  if (!fx || !ensureFarm(state)) return;
  for (const [k, n] of Object.entries(fx)) {
    if (!STOCK[k]) continue;
    const d = addStock(state, k, n);
    if (!d) continue;
    const word = k === 'grain' ? `${Math.abs(d)} ${plural(Math.abs(d), STOCK.grain.forms)}` : `${Math.abs(d)}`;
    notes.push({ text: `${STOCK[k].name} ${d > 0 ? '+' : '−'}${word}`, tone: d > 0 ? 'pos' : 'neg' });
  }
}

/** A finished farm building brings its first animal (build.js finishBuilding). */
export function farmBuildingDone(state, key) {
  const brings = FARM_WORKS[key] && FARM_WORKS[key].brings;
  if (!brings || !ensureFarm(state)) return;
  for (const [k, n] of Object.entries(brings)) if (!state.farm[k]) addStock(state, k, n);
}

/** The farm went to ruin (engine.js, the cottage at the edge of the village): the stock is gone. */
export function loseFarmStock(state) {
  if (!ensureFarm(state)) return;
  Object.assign(state.farm, { grain: 0, cows: 0, horses: 0, pigs: 0 });
  syncHorse(state);
}

/** What the stock fetches when the farm is sold (the riding horse leaves with its rider). */
export function farmWorth(state) {
  const f = state.farm;
  if (!f) return 0;
  const rider = state.gear && state.gear.horse === 'kun' ? 1 : 0;
  return f.grain * STOCK.grain.sell + f.cows * STOCK.cows.sell + Math.max(0, f.horses - rider) * STOCK.horses.sell + f.pigs * STOCK.pigs.sell;
}

// ---------- shown in the farm view ----------

/** What a farm building does for the stock, as short chips for the building list. */
export function worksChips(key) {
  const w = FARM_WORKS[key];
  if (!w) return [];
  const out = [];
  const room = { grain: (n) => `místo pro ${n} ${plural(n, STOCK.grain.forms)} obilí`, cows: (n) => `místo pro ${n} ${plural(n, STOCK.cows.forms)}`, horses: (n) => `místo pro ${n} ${plural(n, STOCK.horses.forms)}`, pigs: (n) => `místo pro ${n} ${plural(n, STOCK.pigs.forms)}` };
  for (const [k, n] of Object.entries(w.holds || {})) out.push(room[k](n));
  if (w.makes && w.makes.grain) out.push(`obilí +${w.makes.grain} ${plural(w.makes.grain, STOCK.grain.forms)} / období`);
  for (const k of Object.keys(w.brings || {})) out.push(`přivede ${STOCK[k].first}`);
  return out;
}

/** What each stock gives now, one line each, for the farm view. */
export function farmOutlook(state) {
  const f = ensureFarm(state);
  if (!f) return {};
  const mill = standing(state).reduce((s, b) => s + ((FARM_WORKS[b] && FARM_WORKS[b].makes && FARM_WORKS[b].makes.grain) || 0), 0);
  const grain = [];
  if (mill) grain.push(`mlýn +${mill} ${plural(mill, STOCK.grain.forms)} každé období`);
  if (f.horses) grain.push(`koně +${PLOUGH * f.horses} na jaře a +${HAUL * f.horses} na podzim`);
  if (!grain.length) grain.push('nic nepřibývá — postav mlýn nebo stáj s koňmi');
  return {
    grain: `${cap(grain.join(', '))}. Pytel se dá prodat za ${coins(STOCK.grain.sell)} nebo semlít (zásoby +${FLOUR}); když zásoby dojdou, semele se sám.`,
    cows: f.cows
      ? `Mléko: zásoby +${f.cows} každé období kromě zimy. Na jaře se kráva může otelit, když je v chlévě místo.`
      : 'Kráva dává mléko: zásoby +1 každé období kromě zimy.',
    horses: f.horses
      ? `Orba a svážení: obilí +${PLOUGH * f.horses} na jaře a +${HAUL * f.horses} na podzim. Jeden z koní ti slouží i pod sedlem.`
      : `Kůň orá: obilí +${PLOUGH} na jaře a +${HAUL} na podzim. Poslouží i pod sedlem.`,
    pigs: f.pigs >= 2
      ? `Na jaře selata, když je v chlívku místo. V zimě zabijačka: zásoby +${SLAUGHTER}.`
      : f.pigs
        ? `Prasnice na jaře vrhne selata, když je v chlívku místo. Zabijačka až od dvou prasat (zásoby +${SLAUGHTER}).`
        : `Selata na jaře, v zimě zabijačka (zásoby +${SLAUGHTER}).`,
  };
}
