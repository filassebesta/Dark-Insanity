// Hospodářství: one chain "grow -> store -> mill -> sell" and the animals of the peasant's farm.
// The grain of the farm is the SAME grain as the trade stock (state.trade.stock.grain, in wagons):
// the harvest and the horses fill the barn, the barn limits it (grainRoom; what does not fit rots),
// the farm mill turns up to two wagons of grain a season into flour (stock.flour, a tradable good),
// and grain, flour and animals sell in the farm view (grain and flour at the Brod prices, trade.js price).
// The cowshed, the stable and the pigsty hold cows, horses and pigs.
// Every season engine.js calls processFarm. No DOM here.
// state.farm = { cows, horses, pigs }, created lazily (old saves work; their `grain` sacks move
// into the trade stock once, see ensureFarm).

import { clamp, randInt, clampRes } from './data.js';
import { ensureTrade, maxStock, price, reservedFor, sellAtHome, MAX_STOCK } from './trade.js';

const FARM_TOWN = 'grunt';

// what a farm building does for the stock:
// holds: room · mills: wagons of grain ground into flour every season · brings: animals once, when finished
export const FARM_WORKS = {
  stodola: { holds: { grain: 12 } },
  mlynek: { mills: 2 },
  chlev: { holds: { cows: 3 }, brings: { cows: 1 } },
  staj: { holds: { horses: 3 } },
  chlivek: { holds: { pigs: 4 }, brings: { pigs: 1 } },
};
const LOFT = 4; // wagons of grain that fit in the cottage loft without a barn

// sell / buy in groše for animals; forms = 1 / 2–4 / 5+ (and 0)
export const STOCK = {
  // grain and flour are wagons of the trade stock: their price is the Brod price (trade.js)
  grain: { name: 'Obilí', forms: ['vůz', 'vozy', 'vozů'], building: 'stodola', trade: true },
  flour: { name: 'Mouka', forms: ['vůz', 'vozy', 'vozů'], building: 'mlynek', trade: true },
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

// zásoby from a wagon eaten at home: hand quern, a mill (the farm's, or a lord's town mill), baked flour
export const QUERN = 3;
export const MILL_FOOD = 4;
export const FLOUR_FOOD = 5;
export const MILL_TOLL = 1;    // zásoby the miller's cut gives for every wagon of grain ground into flour
const HUNGRY = 15;             // below this the household eats its own grain (then flour)
const PLOUGH = 2;              // wagons of grain a horse adds in spring (more land ploughed)
const HAUL = 1;                // and in autumn (the harvest brought in on time)
const SLAUGHTER = 4;           // zásoby from the winter pig
const CALF = 0.5;              // chance of a calf each spring
const LITTER = 0.75;           // chance of piglets each spring

export const plural = (n, forms) => (n === 1 ? forms[0] : n >= 2 && n <= 4 ? forms[1] : forms[2]);
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const coins = (n) => `${n} ${plural(n, ['groš', 'groše', 'grošů'])}`;
const wagons = (n) => `${n} ${plural(n, STOCK.grain.forms)}`;

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
      cows: keys.includes('chlev') ? 1 : 0,
      horses: state.gear && state.gear.horse === 'kun' ? 1 : 0,
      pigs: keys.includes('chlivek') ? 1 : 0,
    };
    // what is left from last year's harvest (a new game only)
    if (state.turn <= 2) ensureTrade(state).stock.grain += 4;
  }
  // old saves kept the barn in sacks of their own: those are wagons of the trade stock now (once)
  if (state.farm.grain !== undefined) {
    const t = ensureTrade(state);
    t.stock.grain = Math.min(maxStock(state), t.stock.grain + Math.max(0, state.farm.grain | 0));
    delete state.farm.grain;
  }
  return state.farm;
}

/** Does the player own a finished mill that grinds for the household (the farm mill, or a town mill of a lord)? */
export function hasMill(state) {
  // a peasant has only his own: the mills of the towns in the state are not his
  if (state.scenario === 'sedlak') return millBatch(state) > 0;
  return Object.entries(state.towns || {}).some(([id, town]) => (town.buildings || []).some((b) => b.ready && (b.key === 'mlynek' ? id === FARM_TOWN : b.key === 'mlyn')));
}

/** Zásoby that one wagon of grain gives when it is ground for the household: one rate everywhere. */
export const grindRate = (state) => (hasMill(state) ? MILL_FOOD : QUERN);

/** Wagons of grain the farm mill grinds each season (0 without a finished farm mill). */
export function millBatch(state) {
  return standing(state).reduce((n, b) => n + ((FARM_WORKS[b] && FARM_WORKS[b].mills) || 0), 0);
}

/** How many wagons of a stock fit on the farm (grain: loft or barn plus the room of a cart shed). */
export function roomFor(state, key) {
  if (key === 'flour') return maxStock(state);
  let n = key === 'grain' ? LOFT + Math.max(0, maxStock(state) - MAX_STOCK) : 0;
  for (const b of standing(state)) n += (FARM_WORKS[b] && FARM_WORKS[b].holds && FARM_WORKS[b].holds[key]) || 0;
  return n;
}

/** Wagons of grain a peasant can keep (trade.js stockCap asks for it). */
export const grainRoom = (state) => roomFor(state, 'grain');

/** What is in store: wagons for grain and flour (the trade stock), animals for the rest. */
export function countOf(state, key) {
  if (STOCK[key] && STOCK[key].trade) return ensureTrade(state).stock[key] || 0;
  const f = ensureFarm(state);
  return f ? f[key] : 0;
}

export function freeRoom(state, key) {
  if (!ensureFarm(state)) return 0;
  return Math.max(0, roomFor(state, key) - countOf(state, key));
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
  if (!ensureFarm(state) || !n) return 0;
  if (STOCK[key] && STOCK[key].trade) {
    const t = ensureTrade(state);
    const before = t.stock[key] || 0;
    t.stock[key] = n > 0 ? Math.max(before, Math.min(roomFor(state, key), before + n)) : Math.max(0, before + n);
    return t.stock[key] - before;
  }
  const f = state.farm;
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
  if (!ensureFarm(state) || !STOCK[key]) return 'Tohle se tu prodat nedá.';
  const n = countOf(state, key);
  if (n <= 0) return 'Nemáš co prodat.';
  if (STOCK[key].trade && n <= reservedFor(state, key)) return 'Tenhle náklad je slíbený povinné zakázce.';
  return null;
}

/** What one wagon fetches in Brod, or one animal on the farm. */
export function sellPrice(state, key) {
  return STOCK[key].trade ? price(state, 'brod', key) : STOCK[key].sell;
}

export function sellStock(state, key) {
  const why = sellBlock(state, key);
  if (why) return { error: why };
  const s = STOCK[key];
  if (s.trade) return { message: sellAtHome(state, key, 1) };
  const rider = key === 'horses' && state.farm.horses === 1 && state.gear && state.gear.horse === 'kun';
  addStock(state, key, -1);
  state.resources.gold = clampRes('gold', state.resources.gold + s.sell);
  return { message: `${s.sold} (+${coins(s.sell)}).${rider ? ' S ním odešel i tvůj jezdecký kůň.' : ''}` };
}

/** Why the mill cannot grind a wagon of grain into flour now (null = it can). */
export function millBlock(state) {
  if (!ensureFarm(state)) return 'Tohle se tu nedá.';
  if (!millBatch(state)) return 'Na to je třeba mlýn na gruntu.';
  const t = ensureTrade(state);
  if (t.stock.grain - reservedFor(state, 'grain') <= 0) return t.stock.grain ? 'Obilí je slíbené povinné zakázce.' : 'Ve stodole není obilí.';
  if (t.stock.flour >= roomFor(state, 'flour')) return 'Sklad mouky je plný.';
  return null;
}

/** One wagon of grain ground into a wagon of flour at the farm mill; the miller's cut stays as food. */
export function millGrain(state) {
  const why = millBlock(state);
  if (why) return { error: why };
  const t = ensureTrade(state);
  t.stock.grain -= 1;
  t.stock.flour += 1;
  state.resources.food = clampRes('food', state.resources.food + MILL_TOLL);
  return { message: `Vůz obilí se semlel na vůz mouky (zásoby +${MILL_TOLL} z mlynářovy míry).` };
}

/** Why a wagon cannot be eaten now (grain or flour). */
export function eatBlock(state, key = 'grain') {
  if (!ensureFarm(state)) return 'Tohle se tu nedá.';
  const n = countOf(state, key);
  if (n <= 0) return key === 'flour' ? 'Ve skladu není mouka.' : 'Ve stodole není obilí.';
  if (n <= reservedFor(state, key)) return 'Tenhle náklad je slíbený povinné zakázce.';
  return null;
}

/** Zásoby from one wagon of this good eaten at home. */
export const eatFood = (state, key = 'grain') => (key === 'flour' ? FLOUR_FOOD : grindRate(state));

/** One wagon of grain ground (by hand or at the mill) into the larder, or flour baked into bread. */
export function grindGrain(state, key = 'grain') {
  const why = eatBlock(state, key);
  if (why) return { error: why };
  const food = eatFood(state, key);
  ensureTrade(state).stock[key] -= 1;
  state.resources.food = clampRes('food', state.resources.food + food);
  return { message: key === 'flour' ? `Z mouky se napekl chleba (zásoby +${food}).` : `Vůz obilí se semlel pro domácnost (zásoby +${food}).` };
}

// ---------- every season ----------

/** The harvest, the horses, the mill, milk, calves, piglets and the winter slaughter. Returns { gold, food, news }. */
export function processFarm(state) {
  const out = { gold: 0, food: 0, news: [] };
  const f = ensureFarm(state);
  if (!f) return out;
  const season = state.seasonIndex;
  const r = state.resources;
  const t = ensureTrade(state);
  const addFood = (n) => {
    const before = r.food;
    r.food = clampRes('food', r.food + n);
    out.food += r.food - before;
  };
  // the harvest: a surplus of the farm goes into the barn (a wagon pair at harvest, now and then another),
  // horses plough in spring and haul the harvest in autumn
  let grown = 0;
  if (r.food >= 20) {
    if (season === 2) grown += 2;
    if (Math.random() < r.stability / 180) grown += 1;
  }
  if (season === 0) grown += PLOUGH * f.horses;
  if (season === 2) grown += HAUL * f.horses;
  t.stock.grain += grown;
  // what does not fit under a roof rots
  const room = roomFor(state, 'grain');
  if (t.stock.grain > room) {
    const lost = t.stock.grain - room;
    t.stock.grain = room;
    const [fit, rot] = lost === 1 ? ['nevešel', 'zplesnivěl'] : lost <= 4 ? ['nevešly', 'zplesnivěly'] : ['nevešlo', 'zplesnivělo'];
    out.news.push(`${wagons(lost)} obilí se ${fit} pod střechu a ${rot}. Prodej přebytek, nebo postav stodolu a kolnu.`);
  }
  // the mill grinds up to two wagons a season into flour (not the grain promised to a contract)
  const batch = millBatch(state);
  if (batch) {
    const n = Math.max(0, Math.min(batch, t.stock.grain - reservedFor(state, 'grain'), roomFor(state, 'flour') - t.stock.flour));
    if (n > 0) {
      t.stock.grain -= n;
      t.stock.flour += n;
      addFood(n * MILL_TOLL);
      out.news.push(`Mlýn semlel ${wagons(n)} obilí na mouku (mouka +${n}, zásoby +${n * MILL_TOLL} z mlynářovy míry).`);
    }
  }
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
  // an empty larder: the household eats its own grain first, then the flour (never what a contract waits for)
  for (const key of ['grain', 'flour']) {
    if (r.food >= HUNGRY) break;
    const free = t.stock[key] - reservedFor(state, key);
    if (free <= 0) continue;
    const rate = eatFood(state, key);
    const n = Math.min(free, Math.ceil((HUNGRY - r.food) / rate));
    t.stock[key] -= n;
    addFood(n * rate);
    out.news.push(`Zásoby docházely, a tak se ${key === 'flour' ? 'pekl chleba z vlastní mouky' : 'mlelo vlastní obilí'}: ${wagons(n)} (zásoby +${n * rate}).`);
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
    const word = STOCK[k].trade ? wagons(Math.abs(d)) : `${Math.abs(d)}`;
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
  Object.assign(state.farm, { cows: 0, horses: 0, pigs: 0 });
  const t = ensureTrade(state);
  t.stock.grain = 0; // what lay in the barn goes with it (and the flour, which was kept there)
  t.stock.flour = 0;
  syncHorse(state);
}

/** What the animals fetch when the farm is sold (the riding horse leaves with its rider). Grain and flour stay in the stock. */
export function farmWorth(state) {
  const f = state.farm;
  if (!f) return 0;
  const rider = state.gear && state.gear.horse === 'kun' ? 1 : 0;
  return f.cows * STOCK.cows.sell + Math.max(0, f.horses - rider) * STOCK.horses.sell + f.pigs * STOCK.pigs.sell;
}

// ---------- shown in the farm view ----------

/** What a farm building does for the stock, as short chips for the building list. */
export function worksChips(key) {
  const w = FARM_WORKS[key];
  if (!w) return [];
  const out = [];
  const room = { grain: (n) => `místo pro ${wagons(n)} obilí`, cows: (n) => `místo pro ${n} ${plural(n, STOCK.cows.forms)}`, horses: (n) => `místo pro ${n} ${plural(n, STOCK.horses.forms)}`, pigs: (n) => `místo pro ${n} ${plural(n, STOCK.pigs.forms)}` };
  for (const [k, n] of Object.entries(w.holds || {})) out.push(room[k](n));
  if (w.mills) out.push(`semele až ${wagons(w.mills)} obilí na mouku / období`, `mlynářova míra: zásoby +${MILL_TOLL} z vozu`, `obilí pro domácnost: vůz = zásoby +${MILL_FOOD}`);
  for (const k of Object.keys(w.brings || {})) out.push(`přivede ${STOCK[k].first}`);
  return out;
}

/** The chain "od pole k trhu" as numbers for the farm view: harvest, barn, mill, flour, market. */
export function farmChain(state) {
  const f = ensureFarm(state);
  if (!f) return null;
  const t = ensureTrade(state);
  const batch = millBatch(state);
  const horses = f.horses;
  return {
    harvest: { autumn: 2, extra: 1, horsesSpring: PLOUGH * horses, horsesAutumn: HAUL * horses },
    grain: t.stock.grain, room: roomFor(state, 'grain'), reserved: reservedFor(state, 'grain'),
    mill: batch, flour: t.stock.flour, flourRoom: roomFor(state, 'flour'),
    eatGrain: grindRate(state), eatFlour: FLOUR_FOOD,
  };
}

/** What each stock gives now, one line each, for the farm view. */
export function farmOutlook(state) {
  const f = ensureFarm(state);
  if (!f) return {};
  const batch = millBatch(state);
  const grain = [`žně: vozy obilí +2 na podzim (je-li zásob aspoň 20) a občas +1`];
  if (f.horses) grain.push(`koně +${PLOUGH * f.horses} na jaře a +${HAUL * f.horses} na podzim`);
  const rate = grindRate(state);
  return {
    grain: `${cap(grain.join(', '))}. Co se nevejde pod střechu, zplesniví. Vůz se prodá v Brodu (${price(state, 'brod', 'grain')}), nebo ${batch ? 'semele na mouku' : 'se semele pro domácnost'}; pro domácnost dá zásoby +${rate}.`,
    flour: batch
      ? `Mlýn každé období semele až ${wagons(batch)} obilí na mouku a nechá si mírku (zásoby +${MILL_TOLL} z vozu). Mouka se prodá v Brodu (${price(state, 'brod', 'flour')}), na panském dvoře (${price(state, 'manor', 'flour')}) i v cizině, nebo dá zásoby +${FLOUR_FOOD}.`
      : 'Bez mlýna se mouka nemele. Mlýn za potokem z obilí dělá mouku, která se prodá dráž než obilí.',
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
