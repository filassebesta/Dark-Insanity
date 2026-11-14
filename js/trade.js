// Trade: goods, markets, caravans and contracts.
//
// Own provinces produce goods into a warehouse (state.trade.stock). Goods sell
// at once on the home market in Brod, or travel by caravan or ship to distant
// markets (Východní marky, Jižní říše, Severní pustiny) and, for a noble or a
// peasant, to the king's or the lord's court. Long journeys pay better but take
// seasons and can be ambushed (event o_prepadeni). Contracts (zakázky) ask for
// a given load by a deadline; the king's and the lord's are obligations.
// No DOM here — map.js draws it, engine.js runs it every season.

import { clamp, randInt, bumpStat, grosLabel, clampRes } from './data.js';
import { makeChronicleEntry } from './state.js';
import { privilegeStock, contractBonus } from './privileges.js';

export const GOODS = {
  grain: { name: 'Obilí', gen: 'obilí' },
  iron: { name: 'Železo', gen: 'železa' },
  furs: { name: 'Kožešiny', gen: 'kožešin' },
  salt: { name: 'Sůl a ryby', gen: 'soli a ryb' },
  cloth: { name: 'Sukno', gen: 'sukna' },
  wine: { name: 'Víno', gen: 'vína' },
};

// what each land yields
export const PROVINCE_GOOD = { brodna: 'grain', 'zelezny-hreben': 'iron', 'sokoli-hvozd': 'furs', 'pobrezni-mark': 'salt', capital: 'cloth' };

const HUB = [633, 368];
const PORT = [328, 388];
const LIPNICE = [585, 640];

// days = seasons on the road; risk = chance of trouble; buy = what can be bought there
export const MARKETS = {
  brod: {
    name: 'Trh v Brodu', short: 'Brod', to: 'na trh do Brodu', from: 'z Brodu', at: [716, 652], home: true,
    text: 'Velký trh u brodu přes Brodnici. Prodá se tu všechno a hned, jen ne za nejlepší cenu.',
    sell: { grain: 1, iron: 2, furs: 2, salt: 1, cloth: 2, wine: 1 },
    buy: { grain: 2, iron: 4, furs: 4, salt: 2, cloth: 4 },
  },
  court: {
    name: 'Královský dvůr', short: 'Dvůr', to: 'ke královskému dvoru', from: 'od královského dvora', at: HUB, days: 1, risk: 0.06,
    danger: 'zloději na Královské cestě', scenarios: ['slechtic'],
    text: 'Dvůr krále ve Vlčím Údělu. Platí slušně, a kdo dodává koruně, toho si král pamatuje.',
    sell: { grain: 2, iron: 3, furs: 3, salt: 2, cloth: 3, wine: 5 }, favor: true,
  },
  manor: {
    name: 'Panský dvůr', short: 'Pán', to: 'na panský dvůr', from: 'z panského dvora', at: [505, 600], days: 1, risk: 0.03,
    danger: 'lapkové u cesty', scenarios: ['sedlak'],
    text: 'Dvůr pánů z Bílé Brány. Bere, co sedlák přiveze, a dobrou dodávku si zapamatuje.',
    sell: { grain: 2, iron: 2, furs: 3, salt: 2, cloth: 3, wine: 4 }, favor: true,
  },
  east: {
    name: 'Východní marky', short: 'Marky', to: 'do Východních marek', from: 'z Východních marek', at: [1222, 440], days: 2, risk: 0.22,
    danger: 'lapkové v Sokolím hvozdu', route: [HUB, [700, 402], [780, 414], [860, 424], [985, 398], [1100, 420], [1222, 440]],
    text: 'Bojovní markrabata za hvozdem. Platí dobře za železo a sukno, obilí mají vlastní.',
    sell: { grain: 1, iron: 7, furs: 2, salt: 3, cloth: 5, wine: 4 },
  },
  south: {
    name: 'Jižní říše', short: 'Jih', to: 'do Jižní říše', from: 'z Jižní říše', at: [262, 812], days: 2, risk: 0.18, sea: true,
    danger: 'piráti a bouře', route: [PORT, [230, 430], [150, 520], [140, 650], [190, 760], [262, 812]],
    text: 'Bohatá říše za mořem. Kupí kožešiny a železo a prodává víno, které se jinde zlatem vyvažuje.',
    sell: { grain: 2, iron: 4, furs: 7, salt: 2, cloth: 3 }, buy: { wine: 2 },
  },
  north: {
    name: 'Severní pustiny', short: 'Sever', to: 'do Severních pustin', from: 'ze Severních pustin', at: [820, 34], days: 3, risk: 0.3,
    danger: 'horalé v průsmyku a mráz', route: [HUB, [612, 300], [602, 238], [626, 172], [632, 138], [720, 90], [820, 34]],
    text: 'Chladná země za horami. Obilí tam má cenu stříbra, cesta přes průsmyk ale bere životy.',
    sell: { grain: 5, iron: 3, furs: 1, salt: 5, cloth: 5, wine: 5 },
  },
};

const CONTRACT_GIVER = {
  court: '{king.Title} {king.name} žádá',
  manor: '{lord.Title} {lord.name} žádá',
  east: 'Markrabě z Východních marek poptává',
  south: 'Kupci z Jižní říše poptávají',
  north: 'Náčelníci Severních pustin chtějí',
};

export const MAX_STOCK = 20; // the bare warehouse; buildings add room (maxStock)
const MAX_CARAVANS = 3;
// room a finished building adds to the warehouse (build.js: Skladiště in towns, Kolna on the farm)
export const WAREHOUSE = { sklad: 6, kolna: 4 };
const WAREHOUSE_CAP = 18;

/** How many wagons of each good the warehouse holds: 20 plus finished storehouses. */
export function maxStock(state) {
  let extra = 0;
  for (const town of Object.values((state && state.towns) || {})) {
    for (const b of town.buildings || []) if (b.ready && !b.base && WAREHOUSE[b.key]) extra += WAREHOUSE[b.key];
  }
  return MAX_STOCK + Math.min(WAREHOUSE_CAP, extra) + privilegeStock(state); // the toll right adds room of its own
}

// ---------- state ----------

export function ensureTrade(state) {
  if (!state.trade) {
    const drift = {};
    for (const m of Object.keys(MARKETS)) drift[m] = {};
    state.trade = { stock: {}, caravans: [], contracts: [], drift, mods: [], log: [], nextId: 1, sent: 0 };
  }
  for (const g of Object.keys(GOODS)) state.trade.stock[g] = state.trade.stock[g] || 0;
  return state.trade;
}

export function originPoint(state) {
  if (state.scenario === 'sedlak') return LIPNICE;
  if (state.scenario === 'slechtic') return PORT;
  return HUB;
}

/** The path a caravan takes from the player's home to a market (map pixel points). */
export function routeFor(state, dest) {
  const m = MARKETS[dest];
  const from = originPoint(state);
  const to = m.route || [HUB, m.at];
  if (m.sea) {
    if (from === PORT) return to;
    return [from, from === LIPNICE ? [470, 520] : [480, 390], ...to];
  }
  if (from === HUB) return to;
  const lead = from === PORT ? [PORT, [420, 380], [520, 372]] : [LIPNICE, [640, 560], [680, 470]];
  return [...lead, ...to];
}

/** Markets this player can trade with right now, and why not if not. */
export function marketAccess(state, dest) {
  const m = MARKETS[dest];
  if (!m) return 'Neznámý trh.';
  if (m.scenarios && !m.scenarios.includes(state.scenario)) return 'Sem tvé zboží nepatří.';
  if (state.scenario === 'sedlak' && state.ruler.statusTier < 2 && !m.home && dest !== 'manor') {
    return 'Poddaný nesmí obchodovat za hranicemi panství. Až budeš svobodn' + (state.ruler.gender === 'female' ? 'á' : 'ý') + ', můžeš si koupit místo v kupecké karavaně.';
  }
  if (m.sea && state.scenario === 'panovnik' && state.provinces.find((p) => p.id === 'pobrezni-mark')?.lost) {
    return 'Bez Pobřežní marky nemá koruna přístav.';
  }
  return null;
}

export function price(state, dest, good, mode = 'sell') {
  const m = MARKETS[dest];
  const base = (mode === 'buy' ? m.buy : m.sell)?.[good];
  if (!base) return 0;
  return Math.max(1, Math.round(base * (mode === 'buy' ? 1 : priceMult(state, dest, good))));
}

export function riskOf(state, dest, escort) {
  const m = MARKETS[dest];
  let risk = m.risk || 0;
  if (m.sea && state.flags.o_lod) risk -= 0.08;
  if (escort) risk /= 2;
  return Math.max(0.02, risk);
}

export function caravanFee(state, dest, qty) {
  if (MARKETS[dest].home) return 0;
  return 1 + Math.ceil(qty / 3) + (state.scenario === 'sedlak' && !['manor'].includes(dest) ? 2 : 0);
}

export const ESCORT_ARMY = 3;

export function loadText(qty, good) {
  const w = qty === 1 ? 'vůz' : qty < 5 ? 'vozy' : 'vozů';
  return `${qty} ${w} ${GOODS[good].gen}`;
}

const SEASON_GEN = ['jara', 'léta', 'podzimu', 'zimy'];

/** "podzimu roku 4": the season a given turn falls into (genitive, for "do …"). */
export function dateGen(state, turn) {
  const ahead = turn - state.turn;
  const year = state.year + Math.floor((state.seasonIndex + ahead) / 4);
  return `${SEASON_GEN[turn % 4]} roku ${year}`;
}

const SEASON_LOC = ['na jaře', 'v létě', 'na podzim', 'v zimě'];

/** "v létě roku 1": when a given turn happens. */
export function dateLoc(state, turn) {
  const ahead = turn - state.turn;
  const year = state.year + Math.floor((state.seasonIndex + ahead) / 4);
  return `${SEASON_LOC[turn % 4]} roku ${year}`;
}

export const coinName = (state) => (state.scenario === 'sedlak' ? 'grošů' : 'zlata');

// ---------- prices, trends, margins ----------

/** Market mood: drift and temporary changes together, 1 = the base price. */
export function priceMult(state, dest, good) {
  const t = ensureTrade(state);
  let mult = t.drift[dest]?.[good] || 1;
  for (const mod of t.mods) {
    if (mod.dest === dest && (!mod.good || mod.good === good) && mod.until > state.turn) mult *= mod.mult;
  }
  return mult;
}

// ---------- price history (for the chart in the trade panel) ----------

const HISTORY_MAX = 80; // twenty years of seasons

/** Remembers what every market pays this season (base × mood, to a tenth of a coin). */
export function recordPrices(state) {
  const t = ensureTrade(state);
  t.history = t.history || [];
  const p = {};
  for (const [dest, m] of Object.entries(MARKETS)) {
    p[dest] = {};
    for (const good of Object.keys(m.sell)) p[dest][good] = Math.round(m.sell[good] * priceMult(state, dest, good) * 10) / 10;
  }
  const last = t.history[t.history.length - 1];
  if (last && last.turn === state.turn) { last.p = p; return; }
  t.history.push({ turn: state.turn, year: state.year, season: state.seasonIndex, p });
  if (t.history.length > HISTORY_MAX) t.history.splice(0, t.history.length - HISTORY_MAX);
}

/**
 * The price of one good over the last `span` seasons in every market the player can reach:
 * { entries: [{ turn, year, season }], series: [{ dest, name, values: [..], now, min, max, avg, delta }] }.
 */
export function priceSeries(state, good, span) {
  const t = ensureTrade(state);
  if (!t.history || !t.history.length) recordPrices(state); // an old save starts its book now
  const entries = t.history.slice(-Math.max(2, span));
  const series = [];
  for (const [dest, m] of Object.entries(MARKETS)) {
    if (!m.sell[good] || marketAccess(state, dest)) continue;
    const values = entries.map((e) => (e.p[dest] && e.p[dest][good]) ?? m.sell[good]);
    const now = values[values.length - 1];
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    series.push({ dest, name: m.name, short: m.short, values, now, min: Math.min(...values), max: Math.max(...values), avg, delta: now - avg });
  }
  return { entries: entries.map(({ turn, year, season }) => ({ turn, year, season })), series };
}

/** Trend of a selling price against its base: { pct, arrow: '↑' | '↓' | '→', cls }. */
export function trendOf(state, dest, good) {
  const pct = Math.round((priceMult(state, dest, good) - 1) * 100);
  if (pct >= 5) return { pct, arrow: '↑', cls: 'up' };
  if (pct <= -5) return { pct, arrow: '↓', cls: 'down' };
  return { pct, arrow: '→', cls: 'flat' };
}

/** The market that pays most for a good the player can reach: { dest, price, mult, home } or null. */
export function bestMarket(state, good) {
  let best = null;
  for (const [dest, m] of Object.entries(MARKETS)) {
    if (!m.sell[good] || marketAccess(state, dest)) continue;
    const cand = { dest, price: price(state, dest, good), mult: priceMult(state, dest, good), home: !!m.home, days: m.days || 0 };
    if (!best || cand.price > best.price || (cand.price === best.price && (cand.mult > best.mult + 0.005 || (Math.abs(cand.mult - best.mult) <= 0.005 && cand.days < best.days)))) best = cand;
  }
  return best;
}

/** What a market wants: its best-paying goods first, as { good, base }. */
export function marketWants(dest) {
  const m = MARKETS[dest];
  return Object.entries(m.sell).map(([good, base]) => ({ good, base })).sort((a, b) => b.base - a.base);
}

/** Profit of a wagon bought in Brod and sold at this market (before fee and risk), or null if not buyable. */
export function buyMargin(state, dest, good) {
  const cost = MARKETS.brod.buy[good];
  if (!cost || !MARKETS[dest].sell[good] || MARKETS[dest].home) return null;
  return price(state, dest, good) - cost;
}

/** The estimate for a planned caravan: revenue, fees, risk and the expected net result. */
export function planEstimate(state, dest, good, qty, escort) {
  const t = ensureTrade(state);
  const m = MARKETS[dest];
  const contract = t.contracts.find((c) => c.dest === dest && c.good === good && c.qty <= qty && !c.taken);
  const leftover = contract ? qty - contract.qty : qty;
  const revenue = (contract ? contract.reward : 0) + Math.max(0, leftover) * price(state, dest, good);
  const fee = caravanFee(state, dest, qty) + (escort ? 1 : 0);
  const risk = riskOf(state, dest, escort);
  // an ambush costs about half the cargo on average (ransom, or the loss of the whole load)
  const expectedNet = Math.round(revenue * (1 - risk * 0.5) - fee);
  return { contract, revenue, fee, risk, net: revenue - fee, expectedNet };
}

function log(state, text) {
  const t = ensureTrade(state);
  t.log.unshift({ year: state.year, season: state.seasonIndex, text });
  t.log.length = Math.min(t.log.length, 12);
  state.chronicle.push(makeChronicleEntry(state, text));
}

// ---------- the home market: instant ----------

export function sellAtHome(state, good, qty) {
  const t = ensureTrade(state);
  qty = Math.min(qty, t.stock[good]);
  if (qty <= 0) return null;
  const gold = qty * price(state, 'brod', good);
  t.stock[good] -= qty;
  state.resources.gold = clampRes('gold', state.resources.gold + gold);
  return `Prodáno ${loadText(qty, good)} za ${state.scenario === 'sedlak' ? grosLabel(gold) : `${gold} zlata`}.`;
}

/** Wagons of a good held back for open mandatory contracts that nobody has taken yet. */
export function reservedFor(state, good) {
  return ensureTrade(state).contracts.filter((c) => c.obligation && !c.taken && c.good === good).reduce((n, c) => n + c.qty, 0);
}

/** Sells the whole warehouse at the home market, except wagons promised to mandatory contracts. */
export function sellAllAtHome(state) {
  const t = ensureTrade(state);
  let gold = 0;
  let wagons = 0;
  for (const good of Object.keys(GOODS)) {
    const qty = t.stock[good] - reservedFor(state, good);
    if (qty <= 0 || !MARKETS.brod.sell[good]) continue;
    gold += qty * price(state, 'brod', good);
    wagons += qty;
    t.stock[good] -= qty;
  }
  if (!wagons) return null;
  state.resources.gold = clampRes('gold', state.resources.gold + gold);
  const kept = Object.keys(GOODS).reduce((n, g) => n + Math.min(t.stock[g], reservedFor(state, g)), 0);
  return `Prodáno ${wagons} ${wagons === 1 ? 'vůz' : wagons < 5 ? 'vozy' : 'vozů'} za ${state.scenario === 'sedlak' ? grosLabel(gold) : `${gold} zlata`}.${kept ? ` ${kept} ${kept === 1 ? 'vůz zůstal' : kept < 5 ? 'vozy zůstaly' : 'vozů zůstalo'} pro zakázky.` : ''}`;
}

export function buyAtHome(state, good, qty, dest = 'brod') {
  const t = ensureTrade(state);
  const cost = qty * price(state, dest, good, 'buy');
  if (!cost || state.resources.gold < cost || t.stock[good] + qty > maxStock(state)) return null;
  state.resources.gold = clampRes('gold', state.resources.gold - cost);
  t.stock[good] += qty;
  return `Koupeno ${loadText(qty, good)} za ${cost}.`;
}

// threshing grain out of the stores, or putting grain back into them
export function convertFood(state, toGrain) {
  const t = ensureTrade(state);
  if (toGrain) {
    if (state.resources.food < 6 || t.stock.grain >= maxStock(state)) return null;
    state.resources.food = clampRes('food', state.resources.food - 6);
    t.stock.grain += 1;
    return 'Z vlastních zásob se nachystal vůz obilí na prodej.';
  }
  if (t.stock.grain < 1) return null;
  t.stock.grain -= 1;
  state.resources.food = clampRes('food', state.resources.food + 4);
  return 'Vůz obilí se vrátil do sýpek.';
}

// ---------- caravans ----------

export function canSend(state, dest, good, qty, escort) {
  const t = ensureTrade(state);
  const why = marketAccess(state, dest);
  if (why) return why;
  if (MARKETS[dest].home) return 'Na domácím trhu se prodává hned.';
  if (!MARKETS[dest].sell[good]) return 'Tohle zboží tam nikdo nekoupí.';
  if (qty < 1 || t.stock[good] < qty) return 'Tolik zboží ve skladu nemáš.';
  if (t.caravans.length >= MAX_CARAVANS) return 'Na cestě jsou už tři karavany. Víc jich neuhlídáš.';
  if (t.caravans.some((c) => c.dest === dest)) return 'Do téhle země už jedna karavana jede.';
  const fee = caravanFee(state, dest, qty) + (escort ? 1 : 0);
  if (state.resources.gold < fee) return `Na cestu potřebuješ ${fee} na mýta a vozky.`;
  if (escort && state.resources.army < ESCORT_ARMY + 2) return 'Nemáš dost mužů na doprovod.';
  return null;
}

export function sendCaravan(state, dest, good, qty, escort) {
  const why = canSend(state, dest, good, qty, escort);
  if (why) return { error: why };
  const t = ensureTrade(state);
  const m = MARKETS[dest];
  const fee = caravanFee(state, dest, qty) + (escort ? 1 : 0);
  state.resources.gold = clampRes('gold', state.resources.gold - fee);
  if (escort) state.resources.army = clampRes('army', state.resources.army - ESCORT_ARMY);
  t.stock[good] -= qty;
  const contract = t.contracts.find((c) => c.dest === dest && c.good === good && c.qty <= qty && !c.taken);
  if (contract) contract.taken = true;
  const caravan = {
    id: t.nextId++, dest, good, qty, escort: !!escort, sea: !!m.sea,
    depart: state.turn, arrive: state.turn + m.days, contract: contract ? contract.id : null,
  };
  t.caravans.push(caravan);
  t.sent += 1;
  t.last = { dest, good, escort: !!escort };
  log(state, `${m.sea ? 'Loď' : 'Karavana'} s nákladem ${loadText(qty, good)} vyrazila ${m.to}.`);
  return { caravan };
}

/** Pays out a caravan that reached its market. */
function deliver(state, caravan, news) {
  const t = state.trade;
  const m = MARKETS[caravan.dest];
  const contract = t.contracts.find((c) => c.id === caravan.contract);
  let gold;
  const extras = [];
  if (contract) {
    gold = contract.reward;
    if (contract.favor && state.resources.favor !== undefined) {
      state.resources.favor = clamp(state.resources.favor + contract.favor);
      extras.push(`přízeň +${contract.favor}`);
    }
    if (contract.prestige) {
      state.resources.prestige = clamp(state.resources.prestige + contract.prestige);
      extras.push(`prestiž +${contract.prestige}`);
    }
    t.contracts = t.contracts.filter((c) => c.id !== contract.id);
    const leftover = caravan.qty - contract.qty;
    if (leftover > 0) gold += leftover * price(state, caravan.dest, caravan.good);
  } else {
    gold = caravan.qty * price(state, caravan.dest, caravan.good);
    if (m.favor && state.resources.favor !== undefined) {
      // only a proper load is worth the lord's notice
      const f = caravan.qty >= 3 ? Math.min(6, Math.floor(caravan.qty / 2)) : 0;
      if (f) {
        state.resources.favor = clamp(state.resources.favor + f);
        extras.push(`přízeň +${f}`);
      }
    }
  }
  if (gold >= 15) {
    state.resources.prestige = clamp(state.resources.prestige + 1);
  }
  state.resources.gold = clampRes('gold', state.resources.gold + gold);
  bumpStat(state, 'delivered');
  bumpStat(state, 'tradeGold', gold);
  if (caravan.escort) state.resources.army = clampRes('army', state.resources.army + ESCORT_ARMY);
  t.caravans = t.caravans.filter((c) => c.id !== caravan.id);
  const coin = state.scenario === 'sedlak' ? 'grošů' : 'zlata';
  const text = `${caravan.sea ? 'Loď' : 'Karavana'} se vrátila ${m.from}: ${loadText(caravan.qty, caravan.good)}${contract ? ' (zakázka)' : ''} vyneslo ${gold} ${coin}${extras.length ? `, ${extras.join(', ')}` : ''}.`;
  log(state, text);
  news.push(text);
}

/** Resolves an ambush (event o_prepadeni / o_pirati) the way the player chose. */
export function resolveIncident(state, kind, notes) {
  const t = ensureTrade(state);
  const ctx = state.tradeCtx;
  const caravan = ctx && t.caravans.find((c) => c.id === ctx.id);
  if (!caravan) return;
  const news = [];
  if (kind === 'ransom') {
    state.resources.gold = clampRes('gold', state.resources.gold - ctx.ransom);
    deliver(state, caravan, news);
  } else if (kind === 'deliver') {
    deliver(state, caravan, news);
  } else if (kind === 'lose') {
    t.caravans = t.caravans.filter((c) => c.id !== caravan.id);
    const contract = t.contracts.find((c) => c.id === caravan.contract);
    if (contract) contract.taken = false; // the order still stands, if there is time to send another load
    log(state, `Náklad ${loadText(caravan.qty, caravan.good)} je ztracen${caravan.escort ? ', doprovod se vrátil s prázdnou' : ''}.`);
    if (caravan.escort) state.resources.army = clampRes('army', state.resources.army + ESCORT_ARMY - 2);
    notes.push({ text: `Ztraceno: ${loadText(caravan.qty, caravan.good)}`, tone: 'neg' });
  }
  for (const n of news) notes.push({ text: n.replace(/^.*?: /, ''), tone: 'pos' });
  state.tradeCtx = null;
}

// a foreign buyer in Brod takes the whole stock of one good
export function resolveOffer(state, mult, notes) {
  const t = ensureTrade(state);
  const ctx = state.tradeCtx;
  if (!ctx || !ctx.offer) return;
  const qty = Math.min(ctx.qty, t.stock[ctx.good]);
  const gold = Math.round(ctx.offer * mult * (qty / ctx.qty));
  t.stock[ctx.good] -= qty;
  state.resources.gold = clampRes('gold', state.resources.gold + gold);
  notes.push({ text: `Prodáno ${loadText(qty, ctx.good)} za ${state.scenario === 'sedlak' ? grosLabel(gold) : `${gold} zlata`}`, tone: 'pos' });
  state.tradeCtx = null;
}

export function addTradeMod(state, mod) {
  const t = ensureTrade(state);
  t.mods.push({ dest: mod.dest, good: mod.good || null, mult: mod.mult, until: state.turn + (mod.turns || 8) });
}

// ---------- contracts: the mandatory bar and the list ----------

/** Open contracts, mandatory ones first, then by the nearest deadline. */
export function sortedContracts(state) {
  return [...ensureTrade(state).contracts].sort((a, b) => (b.obligation ? 1 : 0) - (a.obligation ? 1 : 0) || a.until - b.until);
}

/** Where a contract stands: wagons in stock, seasons left, the deadline date and how urgent it is. */
export function contractStatus(state, c) {
  const t = ensureTrade(state);
  const have = t.stock[c.good] || 0;
  const left = Math.max(0, c.until - state.turn);
  const span = Math.max(left, c.until - (c.from !== undefined ? c.from : c.until - 8));
  const caravan = c.taken ? t.caravans.find((x) => x.contract === c.id) : null;
  return {
    have, need: c.qty, enough: have >= c.qty, missing: Math.max(0, c.qty - have),
    left, span, share: span ? Math.min(1, left / span) : 0,
    date: dateGen(state, c.until),
    urgency: c.taken ? 'ok' : left <= 1 ? 'crit' : left <= 2 ? 'warn' : 'calm',
    caravan,
    giver: c.dest === 'court' ? 'court' : c.dest === 'manor' ? 'manor' : 'foreign',
  };
}

export function seasonsLeftText(n) {
  return `${n === 1 ? 'zbývá' : 'zbývají'} ${n} období`;
}

/** Sends exactly the wagons a contract asks for to its giver, with sensible defaults. */
export function fulfillContract(state, id) {
  const t = ensureTrade(state);
  const c = t.contracts.find((x) => x.id === id);
  if (!c) return { error: 'Tahle zakázka už neplatí.' };
  if (c.taken) return { error: 'Náklad pro tuhle zakázku už je na cestě.' };
  const m = MARKETS[c.dest];
  // an escort when asked for last time or when the road is dangerous, if the men can be spared
  const wantEscort = (t.last && t.last.escort) || (m.risk || 0) >= 0.15;
  const escort = wantEscort && !canSend(state, c.dest, c.good, c.qty, true);
  const why = canSend(state, c.dest, c.good, c.qty, escort);
  if (why) return { error: why };
  const res = sendCaravan(state, c.dest, c.good, c.qty, escort);
  if (res.error) return res;
  const fee = caravanFee(state, c.dest, c.qty) + (escort ? 1 : 0);
  return {
    caravan: res.caravan,
    message: `${loadText(c.qty, c.good)} jede ${m.to}${escort ? ' s doprovodem' : ''}, poplatky ${fee}. Dorazí ${dateLoc(state, res.caravan.arrive)}.`,
  };
}

/** Warnings for the toast (deadline close, order missed); the game screen takes and clears them. */
export function takeTradeAlerts(state) {
  const t = state.trade;
  if (!t || !t.alerts || !t.alerts.length) return [];
  const out = t.alerts;
  t.alerts = [];
  return out;
}

function alert(state, text) {
  const t = ensureTrade(state);
  t.alerts = t.alerts || [];
  t.alerts.push(text);
  if (t.alerts.length > 6) t.alerts.shift();
}

// ---------- every season ----------

function produce(state) {
  const t = state.trade;
  const add = (good, n) => { t.stock[good] = Math.min(maxStock(state), t.stock[good] + n); };
  if (state.scenario === 'sedlak') {
    // the farm's surplus: a wagon at harvest, now and then another
    if (state.resources.food >= 20) {
      if (state.seasonIndex === 2) add('grain', 2);
      if (Math.random() < state.resources.stability / 180) add('grain', 1);
    }
    return;
  }
  const rolls = state.scenario === 'slechtic' ? 2 : 1; // the estate lives off its trade
  for (const p of state.provinces) {
    if (p.lost || (p.owner && p.owner !== 'player')) continue;
    const good = PROVINCE_GOOD[p.id];
    for (let i = 0; i < rolls; i++) if (Math.random() < 0.15 + p.wealth / 300) add(good, 1);
  }
}

function driftPrices(state) {
  const t = state.trade;
  for (const [dest, m] of Object.entries(MARKETS)) {
    t.drift[dest] = t.drift[dest] || {};
    for (const good of Object.keys(m.sell)) {
      const v = t.drift[dest][good] || 1;
      const next = v + (1 - v) * 0.25 + (Math.random() - 0.5) * 0.3;
      t.drift[dest][good] = Math.round(Math.max(0.7, Math.min(1.4, next)) * 100) / 100;
    }
  }
  t.mods = t.mods.filter((x) => x.until > state.turn);
}

function contractMarkets(state) {
  if (state.scenario === 'sedlak') return state.ruler.statusTier >= 2 ? ['manor', 'manor', 'east', 'south'] : ['manor'];
  if (state.scenario === 'slechtic') return state.flags.rebellion ? ['east', 'south', 'north'] : ['court', 'court', 'east', 'south', 'north'];
  return ['east', 'south', 'north'];
}

function offerContract(state) {
  const t = state.trade;
  const dest = contractMarkets(state)[randInt(0, contractMarkets(state).length - 1)];
  const m = MARKETS[dest];
  // only goods the player can actually get: bought at home in Brod, or wine from the south once trade reaches it
  const canReachSouth = state.scenario !== 'sedlak' || state.ruler.statusTier >= 2;
  const obtainable = new Set([...Object.keys(MARKETS.brod.buy), ...(canReachSouth ? ['wine'] : [])]);
  const goods = Object.keys(m.sell).filter((g) => (g !== 'wine' || dest !== 'south') && obtainable.has(g));
  const good = goods[randInt(0, goods.length - 1)];
  const qty = state.scenario === 'sedlak' ? randInt(2, 4) : randInt(3, 7);
  const obligation = dest === 'court' || dest === 'manor';
  t.contracts.push({
    id: t.nextId++, dest, good, qty,
    from: state.turn,
    until: state.turn + randInt(6, 10),
    reward: Math.round(qty * m.sell[good] * 1.5 * (obligation ? 1 : contractBonus(state))), // a town councillor gets better orders
    favor: obligation ? qty + 2 : 0,
    prestige: obligation ? 0 : 3,
    obligation,
    giver: CONTRACT_GIVER[dest],
  });
  return t.contracts[t.contracts.length - 1];
}

/** Runs trade for one season. Returns short news lines for the turn summary. */
export function processTrade(state) {
  const t = ensureTrade(state);
  const news = [];
  produce(state);
  driftPrices(state);
  recordPrices(state);
  // contracts: new ones in spring, broken obligations cost favour
  for (const c of [...t.contracts]) {
    if (c.until <= state.turn && !c.taken) {
      t.contracts = t.contracts.filter((x) => x.id !== c.id);
      // a lord in open revolt owes the crown no grain
      if (c.obligation && state.resources.favor !== undefined && !(state.flags && state.flags.rebellion)) {
        state.resources.favor = clamp(state.resources.favor - 3);
        const verb = c.qty === 1 ? 'nedorazil' : c.qty < 5 ? 'nedorazily' : 'nedorazilo';
        const lost = `přízeň −3 a odměna ${c.reward} ${coinName(state)}${c.favor ? ` (s ní přízeň +${c.favor})` : ''}`;
        const text = `Zakázka propadla: ${loadText(c.qty, c.good)} ${MARKETS[c.dest].to} ${verb} včas. Ztraceno: ${lost}.`;
        log(state, text);
        news.push(text);
        alert(state, `Zakázka propadla. Ztraceno: ${lost}.`);
      }
    }
  }
  // one season left on an obligation: say so once
  for (const c of t.contracts) {
    if (!c.obligation || c.taken || c.warned || c.until - state.turn !== 1) continue;
    c.warned = true;
    const st = contractStatus(state, c);
    const line = `Pozor, poslední období na zakázku: ${loadText(c.qty, c.good)} ${MARKETS[c.dest].to} do ${st.date}. ${st.enough ? 'Zboží máš ve skladu, stačí ho poslat.' : `Ve skladu chybí ${st.missing} ${st.missing === 1 ? 'vůz' : st.missing < 5 ? 'vozy' : 'vozů'}.`}`;
    news.push(line);
    alert(state, `Zbývá poslední období: ${loadText(c.qty, c.good)} ${MARKETS[c.dest].to}.`);
  }
  if (state.seasonIndex === 0 && t.contracts.length < 2 && Math.random() < 0.75) {
    const c = offerContract(state);
    // a binding order from the lord or the crown is announced, not found later as a penalty
    if (c && c.obligation) news.push(`Povinná zakázka ${c.dest === 'court' ? 'koruny' : 'vrchnosti'}: ${loadText(c.qty, c.good)} ${MARKETS[c.dest].to}, nejpozději do ${dateGen(state, c.until)}. Pošli je v Obchodě, jinak klesne přízeň.`);
  }
  // caravans on the road
  for (const caravan of [...t.caravans]) {
    // an ambush left unanswered (the game was closed mid-event) ends with the cargo getting through
    if (caravan.held && state.turn - caravan.heldAt >= 2) { caravan.held = false; deliver(state, caravan, news); continue; }
    if (caravan.arrive > state.turn || caravan.held) continue;
    const trouble = Math.random() < riskOf(state, caravan.dest, caravan.escort);
    if (trouble && !state.pendingEvent) {
      const value = caravan.qty * price(state, caravan.dest, caravan.good);
      caravan.held = true;
      caravan.heldAt = state.turn;
      state.tradeCtx = { id: caravan.id, good: caravan.good, qty: caravan.qty, dest: caravan.dest, escort: caravan.escort, ransom: Math.max(2, Math.round(value * 0.4)), value };
      state.pendingEvent = caravan.sea ? 'o_pirati' : 'o_prepadeni';
      continue;
    }
    if (trouble) continue; // wait a season: another matter takes precedence
    deliver(state, caravan, news);
  }
  return news;
}

/** Text tokens for trade events: {cargo.load}, {cargo.to}, {cargo.danger}, {cargo.ransom}, {cargo.offer}. */
export function cargoTokens(state) {
  const c = state.tradeCtx;
  if (!c) return {};
  const coin = state.scenario === 'sedlak' ? 'grošů' : 'zlata';
  return {
    'cargo.load': loadText(c.qty, c.good),
    'cargo.good': GOODS[c.good].gen,
    'cargo.to': c.dest ? MARKETS[c.dest].to : '',
    'cargo.danger': c.dest ? MARKETS[c.dest].danger || '' : '',
    'cargo.ransom': `${c.ransom || 0} ${coin}`,
    'cargo.offer': `${c.offer || 0} ${coin}`,
    'cargo.escort': c.dest && MARKETS[c.dest].sea
      ? (c.escort ? 'Na palubě jsou ozbrojenci.' : 'Na palubě nejsou žádní vojáci.')
      : (c.escort ? 'Doprovod tasí meče.' : 'Karavana nemá doprovod.'),
  };
}

/** For the foreign-buyer event: the good with the fullest warehouse. */
export function pickOffer(state) {
  const t = ensureTrade(state);
  const [good, qty] = Object.entries(t.stock).sort((a, b) => b[1] - a[1])[0] || [];
  if (!good || qty < 4) return null;
  return { good, qty, offer: Math.round(qty * price(state, 'brod', good) * 1.6) + 1 };
}
