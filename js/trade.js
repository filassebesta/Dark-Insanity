// Trade: goods, markets, caravans and contracts.
//
// Own provinces produce goods into a warehouse (state.trade.stock). Goods sell
// at once on the home market in Brod, or travel by caravan or ship to distant
// markets (Východní marky, Jižní říše, Severní pustiny) and, for a noble or a
// peasant, to the king's or the lord's court. Long journeys pay better but take
// seasons and can be ambushed (event o_prepadeni). Contracts (zakázky) ask for
// a given load by a deadline; the king's and the lord's are obligations.
// No DOM here — map.js draws it, engine.js runs it every season.

import { clamp, randInt } from './data.js';
import { makeChronicleEntry } from './state.js';

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
    sell: { grain: 1, iron: 2, furs: 2, salt: 1, cloth: 2, wine: 3 },
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
    text: 'Dvůr pánů z Bílé Brány. Pán bere, co mu sedlák přiveze, a dobrou dodávku si zapamatuje.',
    sell: { grain: 2, iron: 2, furs: 3, salt: 2, cloth: 3, wine: 4 }, favor: true,
  },
  east: {
    name: 'Východní marky', short: 'Marky', to: 'do Východních marek', from: 'z Východních marek', at: [1222, 440], days: 2, risk: 0.22,
    danger: 'lapkové v Sokolím hvozdu', route: [HUB, [700, 402], [780, 414], [860, 424], [985, 398], [1100, 420], [1222, 440]],
    text: 'Bojovní markrabata za hvozdem. Platí dobře za železo a sukno, obilí mají vlastní.',
    sell: { grain: 1, iron: 5, furs: 2, salt: 3, cloth: 4, wine: 4 },
  },
  south: {
    name: 'Jižní říše', short: 'Jih', to: 'do Jižní říše', from: 'z Jižní říše', at: [262, 812], days: 2, risk: 0.18, sea: true,
    danger: 'piráti a bouře', route: [PORT, [230, 430], [150, 520], [140, 650], [190, 760], [262, 812]],
    text: 'Bohatá říše za mořem. Kupí kožešiny a železo a prodává víno, které se jinde zlatem vyvažuje.',
    sell: { grain: 2, iron: 4, furs: 5, salt: 2, cloth: 3 }, buy: { wine: 2 },
  },
  north: {
    name: 'Severní pustiny', short: 'Sever', to: 'do Severních pustin', from: 'ze Severních pustin', at: [820, 34], days: 3, risk: 0.3,
    danger: 'horalé v průsmyku a mráz', route: [HUB, [612, 300], [602, 238], [626, 172], [632, 138], [720, 90], [820, 34]],
    text: 'Chladná země za horami. Obilí tam má cenu stříbra, cesta přes průsmyk ale bere životy.',
    sell: { grain: 4, iron: 3, furs: 1, salt: 4, cloth: 4, wine: 5 },
  },
};

const CONTRACT_GIVER = {
  court: 'Král {king.name} žádá',
  manor: '{lord.Title} {lord.name} žádá',
  east: 'Markrabě z Východních marek poptává',
  south: 'Kupci z Jižní říše poptávají',
  north: 'Náčelníci Severních pustin chtějí',
};

export const MAX_STOCK = 20;
const MAX_CARAVANS = 3;

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
  const t = ensureTrade(state);
  let mult = mode === 'buy' ? 1 : (t.drift[dest]?.[good] || 1);
  for (const mod of t.mods) {
    if (mod.dest === dest && (!mod.good || mod.good === good) && mod.until > state.turn) mult *= mod.mult;
  }
  return Math.max(1, Math.round(base * mult));
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
  state.resources.gold = clamp(state.resources.gold + gold);
  return `Prodáno ${loadText(qty, good)} za ${gold} ${state.scenario === 'sedlak' ? 'grošů' : 'zlata'}.`;
}

export function buyAtHome(state, good, qty, dest = 'brod') {
  const t = ensureTrade(state);
  const cost = qty * price(state, dest, good, 'buy');
  if (!cost || state.resources.gold < cost || t.stock[good] + qty > MAX_STOCK) return null;
  state.resources.gold = clamp(state.resources.gold - cost);
  t.stock[good] += qty;
  return `Koupeno ${loadText(qty, good)} za ${cost}.`;
}

// threshing grain out of the stores, or putting grain back into them
export function convertFood(state, toGrain) {
  const t = ensureTrade(state);
  if (toGrain) {
    if (state.resources.food < 6 || t.stock.grain >= MAX_STOCK) return null;
    state.resources.food = clamp(state.resources.food - 6);
    t.stock.grain += 1;
    return 'Z vlastních zásob se nachystal vůz obilí na prodej.';
  }
  if (t.stock.grain < 1) return null;
  t.stock.grain -= 1;
  state.resources.food = clamp(state.resources.food + 4);
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
  state.resources.gold = clamp(state.resources.gold - fee);
  if (escort) state.resources.army = clamp(state.resources.army - ESCORT_ARMY);
  t.stock[good] -= qty;
  const contract = t.contracts.find((c) => c.dest === dest && c.good === good && c.qty <= qty && !c.taken);
  if (contract) contract.taken = true;
  const caravan = {
    id: t.nextId++, dest, good, qty, escort: !!escort, sea: !!m.sea,
    depart: state.turn, arrive: state.turn + m.days, contract: contract ? contract.id : null,
  };
  t.caravans.push(caravan);
  t.sent += 1;
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
  state.resources.gold = clamp(state.resources.gold + gold);
  if (caravan.escort) state.resources.army = clamp(state.resources.army + ESCORT_ARMY);
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
    state.resources.gold = clamp(state.resources.gold - ctx.ransom);
    deliver(state, caravan, news);
  } else if (kind === 'deliver') {
    deliver(state, caravan, news);
  } else if (kind === 'lose') {
    t.caravans = t.caravans.filter((c) => c.id !== caravan.id);
    const contract = t.contracts.find((c) => c.id === caravan.contract);
    if (contract) contract.taken = false; // the order still stands, if there is time to send another load
    log(state, `Náklad ${loadText(caravan.qty, caravan.good)} je ztracen${caravan.escort ? ', doprovod se vrátil s prázdnou' : ''}.`);
    if (caravan.escort) state.resources.army = clamp(state.resources.army + ESCORT_ARMY - 2);
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
  state.resources.gold = clamp(state.resources.gold + gold);
  notes.push({ text: `Prodáno ${loadText(qty, ctx.good)} za ${gold}`, tone: 'pos' });
  state.tradeCtx = null;
}

export function addTradeMod(state, mod) {
  const t = ensureTrade(state);
  t.mods.push({ dest: mod.dest, good: mod.good || null, mult: mod.mult, until: state.turn + (mod.turns || 8) });
}

// ---------- every season ----------

function produce(state) {
  const t = state.trade;
  const add = (good, n) => { t.stock[good] = Math.min(MAX_STOCK, t.stock[good] + n); };
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
  if (state.scenario === 'slechtic') return ['court', 'court', 'east', 'south', 'north'];
  return ['east', 'south', 'north'];
}

function offerContract(state) {
  const t = state.trade;
  const dest = contractMarkets(state)[randInt(0, contractMarkets(state).length - 1)];
  const m = MARKETS[dest];
  const goods = Object.keys(m.sell).filter((g) => g !== 'wine' || dest !== 'south');
  const good = goods[randInt(0, goods.length - 1)];
  const qty = state.scenario === 'sedlak' ? randInt(2, 4) : randInt(3, 7);
  const obligation = dest === 'court' || dest === 'manor';
  t.contracts.push({
    id: t.nextId++, dest, good, qty,
    until: state.turn + randInt(6, 10),
    reward: Math.round(qty * m.sell[good] * 1.5),
    favor: obligation ? qty + 2 : 0,
    prestige: obligation ? 0 : 3,
    obligation,
    giver: CONTRACT_GIVER[dest],
  });
}

/** Runs trade for one season. Returns short news lines for the turn summary. */
export function processTrade(state) {
  const t = ensureTrade(state);
  const news = [];
  produce(state);
  driftPrices(state);
  // contracts: new ones in spring, broken obligations cost favour
  for (const c of [...t.contracts]) {
    if (c.until <= state.turn && !c.taken) {
      t.contracts = t.contracts.filter((x) => x.id !== c.id);
      if (c.obligation && state.resources.favor !== undefined) {
        state.resources.favor = clamp(state.resources.favor - 3);
        const text = `Nesplněná zakázka: ${loadText(c.qty, c.good)} ${MARKETS[c.dest].to} nedorazilo. Přízeň −3.`;
        log(state, text);
        news.push(text);
      }
    }
  }
  if (state.seasonIndex === 0 && t.contracts.length < 2 && Math.random() < 0.75) offerContract(state);
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
