// Privileges and offices: rights a lord, a town or an abbot grants to a peasant or a free man
// (the reeve's seal, a mill, an inn, the hunt, a toll, the council seat). Each one gives a little
// every season and asks for something in return; most can be lost. No DOM here.
// state.privileges = { <key>: { since, year, season, low?, grace? } }, created lazily (old saves work).
// The village reeve is the first entry and stays tied to flags.s_rychtar, which the old events use.
// Branch effects of an event (engine.js applyBranch → applyPrivilegeEffects):
//   grantPrivilege: '<key>' | [...]   revokePrivilege: '<key>' | '$loss'   keepPrivilege: '$loss'
// where '$loss' is the privilege the lord is about to take back (state.privilegeLoss, event pv_odebrani).

import { RESOURCE_DEFS, RESOURCE_CAP, resourceLabel, clamp, clampRes } from './data.js';

export const MAX_PRIVILEGES = 3;   // what a lord will grant a house at one time (the reeve's seal is not his gift)
const OFFER_GAP = 6;               // seasons between two new privileges (a year and a half)
const LOST_GAP = 12;               // a lost privilege is not offered again for three years
const LOSE_FAVOR = 12;             // a lord whose favour is this low (two seasons in a row) starts taking things back
const GRACE = 8;                   // seasons of peace after the lord was talked round

const farmTown = (s) => s.towns && s.towns.grunt;
const hasMill = (s) => !!farmTown(s) && farmTown(s).buildings.some((b) => b.key === 'mlynek' && b.ready);

// grants / duties: { season: fx, spring: fx, autumn: fx } with fx = { gold, food, army, stability, faith, prestige, favor, grain }
//   ('grain' = sacks in the farm's barn); risks: now and then something goes wrong (chance per matching season)
export const PRIVILEGES = {
  rychtar: {
    key: 'rychtar', name: 'Rychtář', what: 'rychtářský úřad', tiers: [1, 2], giver: 'lord',
    text: 'Pečeť vsi, obecní soud a výběr dávek. Rychtář rozhoduje spory a ručí pánovi za to, že ves zaplatí. Má přízeň obou stran a důvěru žádné.',
    grants: { spring: { prestige: 1 } },
    grantsNote: ['poplatky a pokuty: +1 groš každé období (započteno v hospodářství)', 'konšel po boku v obecní radě'],
    duties: { autumn: { gold: -1 } },
    dutiesNote: ['za nedoplatky vsi ručíš pánovi ze svého'],
    hint: 'pověst od 35, až ves volí nového rychtáře',
  },
  mlyn: {
    key: 'mlyn', name: 'Mlýnské právo', what: 'mlýnské právo', tiers: [1, 2], giver: 'lord',
    text: 'Právo mlít pro celou ves a brát si z každého pytle mírku. Panský mlynář o ně přichází, a proto ho bere jako urážku.',
    needs: hasMill, needsText: 'Platí jen dokud na gruntu stojí mlýn.',
    grants: { autumn: { gold: 3, grain: 3 } },
    duties: { spring: { gold: -1 } },
    dutiesNote: ['ročně činže panskému dvoru'],
    risks: [{ on: 'autumn', chance: 0.15, fx: { gold: -2 }, news: 'Na mlýnském potoce se utrhla stavidla. Oprava stála dva groše.' }],
    hint: 'mlýn na gruntu a přízeň pána',
  },
  hospoda: {
    key: 'hospoda', name: 'Hospodské právo', what: 'hospodské právo', tiers: [2, 3], giver: 'lord',
    text: 'Právo vařit pivo a čepovat ho hostům. Kde se čepuje, tam se platí, zpívá, hádá a občas láme nábytek.',
    grants: { autumn: { gold: 3 } },
    duties: { autumn: { food: -1 } },
    dutiesNote: ['ječmen a slad ze spíže'],
    risks: [{ on: 'autumn', chance: 0.3, fx: { gold: -2, prestige: -1 }, news: 'Ve výčepu se zase někdo porval. Škoda na lavicích se platila z tvého.' }],
    hint: 'svobodný stav, pověst od 30 a pár grošů na koupi',
  },
  lov: {
    key: 'lov', name: 'Právo lovu a rybolovu', what: 'právo lovu a rybolovu', tiers: [2, 3], giver: 'lord',
    text: 'Zajíc, bažant a kapr z panských rybníků pro tvůj stůl. Jelen zůstává panský a hajný to ví líp než ty.',
    grants: { season: { food: 1 } },
    duties: { autumn: { favor: -1 } },
    dutiesNote: ['kýta z každé zvěřiny panskému dvoru'],
    risks: [{ on: 'autumn', chance: 0.2, fx: { gold: -2, favor: -2 }, news: 'Hajný tě přistihl u rybníka za mezí. Pokuta a kyselý pohled.' }],
    hint: 'svobodný stav, přízeň pána nebo opatova důvěra',
  },
  myto: {
    key: 'myto', name: 'Tržní právo a mýto', what: 'tržní právo a mýto', tiers: [2, 3], giver: 'lord',
    text: 'Trh na návsi a mýto na mostě. Kdo chce projet, zaplatí. Sklad se rozroste, ale panský pacholek, který mýto bral dřív, je tvým nepřítelem.',
    grants: { autumn: { gold: 4 } }, stock: 4,
    grantsNote: ['sklad pojme o 4 vozy zboží víc'],
    duties: { spring: { gold: -2 } },
    dutiesNote: ['roční poplatek panství za trh'],
    risks: [{ on: 'autumn', chance: 0.2, fx: { gold: -1, prestige: -1 }, news: 'U mýta se hádali formani. Mýtník utržil modřiny a ty hanbu.' }],
    hint: 'svobodný stav, pověst od 40 a groše na koupi',
  },
  robota: {
    key: 'robota', name: 'Osvobození od roboty', what: 'osvobození od roboty', tiers: [1, 1], giver: 'lord', quiet: true,
    text: 'Místo dnů na panském poli platíš pevnou částku. Tvé ruce zůstávají na tvém gruntu, ale pán ti to nezapomene.',
    grants: { autumn: { food: 3 }, spring: { stability: 1 } },
    duties: { spring: { gold: -1, favor: -1 } },
    dutiesNote: ['robotní peníze panstvu'],
    hint: 'přízeň pána od 45 a hotovost',
  },
  konsel: {
    key: 'konsel', name: 'Konšelské místo', what: 'místo v městské radě', tiers: [2, 3], giver: 'town',
    text: 'Křeslo v radě města Brodné. Radní si tě zvou ke svému stolu a kupci k svým zakázkám, jenže každá schůze něco stojí.',
    grants: { spring: { prestige: 2, favor: 1 } },
    grantsNote: ['zakázky z městské rady jsou o čtvrtinu štědřejší'],
    duties: { spring: { gold: -1 } },
    dutiesNote: ['hostiny a příspěvky radních'],
    hint: 'svobodný stav, pověst od 50 a dobré jméno u kupců',
  },
};

export const PRIVILEGE_KEYS = Object.keys(PRIVILEGES);

// ---------- state ----------

/** state.privileges, created on first use; the reeve's flag and his entry are kept in step. */
export function ensurePrivileges(state) {
  if (!state.privileges) state.privileges = {};
  const p = state.privileges;
  if (state.flags && state.flags.s_rychtar && !p.rychtar) p.rychtar = { since: state.turn, year: state.year, season: state.seasonIndex };
  if (p.rychtar && state.flags && !state.flags.s_rychtar) state.flags.s_rychtar = true;
  return p;
}

export const hasPrivilege = (state, key) => !!ensurePrivileges(state)[key];

export function heldPrivileges(state) {
  const p = ensurePrivileges(state);
  return PRIVILEGE_KEYS.filter((k) => p[k]).map((k) => ({ key: k, def: PRIVILEGES[k], entry: p[k] }));
}

export const privilegeCount = (state) => heldPrivileges(state).length;

const inTier = (state, def) => state.ruler.statusTier >= def.tiers[0] && state.ruler.statusTier <= def.tiers[1];

/** May this privilege be offered now? (tier, not held, room under the cap, not too soon after the last one.) */
export function canOffer(state, key) {
  const def = PRIVILEGES[key];
  if (!def || state.scenario !== 'sedlak' || !inTier(state, def) || hasPrivilege(state, key)) return false;
  if (privilegeCount(state) >= MAX_PRIVILEGES) return false;
  if (state.turn - (state.privilegeTurn ?? -99) < OFFER_GAP) return false;
  const lost = state.privilegesLost && state.privilegesLost[key];
  return lost === undefined || state.turn - lost >= LOST_GAP;
}

/** Number of privileges that count against the lord's limit (the reeve's seal does not). */
export const grantedByLord = (state) => heldPrivileges(state).filter((h) => h.key !== 'rychtar').length;

// ---------- granting and losing ----------

const chron = (state, text) => {
  // the story's own chronicle line is written after the branch; this line follows it (flushPrivilegeNews)
  (state.privilegeNews = state.privilegeNews || []).push(text);
};

/** Lines gathered while a choice was applied go into the chronicle after the choice's own text. */
export function flushPrivilegeNews(state) {
  for (const text of state.privilegeNews || []) state.chronicle.push({ turn: state.turn, year: state.year, season: state.seasonIndex, text });
  state.privilegeNews = [];
}

export function grantPrivilege(state, key) {
  const def = PRIVILEGES[key];
  if (!def || hasPrivilege(state, key)) return null;
  if (key !== 'rychtar' && grantedByLord(state) >= MAX_PRIVILEGES) return null; // the lord gives no more than that
  state.privileges[key] = { since: state.turn, year: state.year, season: state.seasonIndex };
  state.privilegeTurn = state.turn;
  if (key === 'rychtar') state.flags.s_rychtar = true;
  chron(state, `Rod ${state.dynastyName} získal privilegium: ${def.what}.`);
  return def;
}

export function revokePrivilege(state, key, why = '', silent = false) {
  const def = PRIVILEGES[key];
  if (!def || !hasPrivilege(state, key)) return null;
  delete state.privileges[key];
  if (key === 'rychtar') delete state.flags.s_rychtar; // the alderman is the reeve again (court.js)
  (state.privilegesLost = state.privilegesLost || {})[key] = state.turn;
  state.privilegeLast = key; // still named in the story's own text ({privilege.what})
  if (state.privilegeLoss === key) state.privilegeLoss = null;
  if (!silent) chron(state, `Rod ${state.dynastyName} přišel o privilegium: ${def.what}.${why ? ` ${why}` : ''}`);
  return def;
}

/** Branch effects of an event (see the top of the file); adds the outcome's notes. */
export function applyPrivilegeEffects(state, branch, notes) {
  if (!branch || (!branch.grantPrivilege && !branch.revokePrivilege && !branch.keepPrivilege)) return;
  const loss = () => state.privilegeLoss;
  for (const k of [].concat(branch.grantPrivilege || [])) {
    const def = grantPrivilege(state, k);
    if (def) notes.push({ text: `Nové privilegium: ${def.name}`, tone: 'pos' });
  }
  for (const k0 of [].concat(branch.revokePrivilege || [])) {
    const k = k0 === '$loss' ? loss() : k0;
    const def = k && revokePrivilege(state, k);
    if (def) notes.push({ text: `Ztraceno privilegium: ${def.name}`, tone: 'neg' });
  }
  if (branch.keepPrivilege) {
    const e = loss() && state.privileges[loss()];
    if (e) { e.low = 0; e.grace = state.turn + GRACE; }
    state.privilegeLast = loss();
    if (state.privilegeLast && PRIVILEGES[state.privilegeLast]) notes.push({ text: `Právo zůstává: ${PRIVILEGES[state.privilegeLast].name}`, tone: 'pos' });
    state.privilegeLoss = null;
  }
}

// ---------- every season ----------

const WHEN = { season: 'každé období', spring: 'každé jaro', autumn: 'každý podzim' };
const WHEN_AT = (state) => ({ season: true, spring: state.seasonIndex === 0, autumn: state.seasonIndex === 2 });

/** What a privilege gives and costs, as readable lines for the character sheet. */
export function privilegeLines(state, def) {
  const label = (k) => {
    if (k === 'grain') return 'obilí (pytle)';
    const d = RESOURCE_DEFS.find((x) => x.key === k);
    return d ? resourceLabel(d, state.scenario) : k;
  };
  const lines = (table) => {
    const out = [];
    for (const [when, fx] of Object.entries(table || {})) {
      const parts = Object.entries(fx).map(([k, v]) => `${label(k)} ${v > 0 ? '+' : '−'}${Math.abs(v)}`);
      if (parts.length) out.push(`${parts.join(', ')} ${WHEN[when]}`);
    }
    return out;
  };
  return {
    grants: [...lines(def.grants), ...(def.grantsNote || [])],
    duties: [...lines(def.duties), ...(def.dutiesNote || [])],
    risks: (def.risks || []).map((r) => `Občas: ${r.news.charAt(0).toLowerCase()}${r.news.slice(1).replace(/\.$/, '')} (zhruba každý ${Math.max(2, Math.round(1 / r.chance))}. podzim).`),
  };
}

/** Warehouse room a privilege adds (trade.js maxStock). */
export function privilegeStock(state) {
  return heldPrivileges(state).reduce((n, h) => n + ((h.def.stock && (!h.def.needs || h.def.needs(state))) ? h.def.stock : 0), 0);
}

/** Konšel: contracts from the town council pay a quarter more (trade.js offerContract). */
export const contractBonus = (state) => (hasPrivilege(state, 'konsel') ? 1.25 : 1);

/**
 * Runs the season for every privilege held: grants, duties, bad luck, and a lord who has had enough.
 * Returns { gold, food, news, event } (what it moved, lines for the turn summary, an event to raise).
 */
export function processPrivileges(state) {
  const out = { gold: 0, food: 0, news: [], event: null };
  const held = heldPrivileges(state);
  if (!held.length) return out;
  const r = state.resources;
  const at = WHEN_AT(state);
  const give = (fx) => {
    for (const [k, v] of Object.entries(fx || {})) {
      if (k === 'grain') {
        const f = state.farm;
        if (!f) continue;
        f.grain = Math.max(0, f.grain + v); // what the barn cannot hold rots when the farm is processed
        continue;
      }
      if (r[k] === undefined) continue;
      const before = r[k];
      r[k] = k in RESOURCE_CAP ? clampRes(k, before + v) : clamp(before + v);
      if (k === 'gold') out.gold += r[k] - before;
      if (k === 'food') out.food += r[k] - before;
    }
  };
  for (const { key, def, entry } of held) {
    // a privilege that does not fit the rank any more stays behind with the farm
    if (!inTier(state, def)) {
      revokePrivilege(state, key, '', true);
      delete state.privilegesLost[key]; // not a loss: it may be had again when the rank fits
      if (!def.quiet) {
        const text = `${def.name} už k novému stavu nepatří, správu přebírá jiný hospodář.`;
        out.news.push(text);
        state.chronicle.push({ turn: state.turn, year: state.year, season: state.seasonIndex, text });
      }
      continue;
    }
    if (def.needs && !def.needs(state)) continue; // no mill, no milling right
    for (const when of ['season', 'spring', 'autumn']) {
      if (!at[when]) continue;
      give(def.grants && def.grants[when]);
      give(def.duties && def.duties[when]);
    }
    for (const risk of def.risks || []) {
      if (!at[risk.on] || Math.random() >= risk.chance) continue;
      give(risk.fx);
      out.news.push(risk.news);
    }
    // a lord with no favour left for the house takes back what he gave
    if (state.scenario === 'sedlak' && def.giver === 'lord' && r.favor !== undefined) {
      entry.low = r.favor <= LOSE_FAVOR ? (entry.low || 0) + 1 : 0;
      if (entry.low >= 2 && !(entry.grace > state.turn) && !state.privilegeLoss && !out.event) {
        state.privilegeLoss = key;
        out.event = 'pv_odebrani';
      }
    }
  }
  if (state.privilegeLoss && !hasPrivilege(state, state.privilegeLoss)) state.privilegeLoss = null;
  return out;
}

// ---------- shown in the character sheet ----------

/** What the house holds, what it asks of the house, and what could still be had (names only). */
export function privilegeOverview(state) {
  const held = heldPrivileges(state).map(({ key, def, entry }) => {
    const lines = privilegeLines(state, def);
    return {
      key, name: def.name, text: def.text, year: entry.year ?? state.year, season: entry.season ?? 0,
      grants: lines.grants, duties: lines.duties, risks: lines.risks,
      idle: def.needs && !def.needs(state) ? def.needsText : '',
      danger: !!(entry.low),
    };
  });
  const open = PRIVILEGE_KEYS
    .filter((k) => !hasPrivilege(state, k) && inTier(state, PRIVILEGES[k]) && !(state.privilegesLost && state.privilegesLost[k] !== undefined && state.turn - state.privilegesLost[k] < LOST_GAP))
    .map((k) => ({ key: k, name: PRIVILEGES[k].name, hint: PRIVILEGES[k].hint }));
  return { held, open, full: grantedByLord(state) >= MAX_PRIVILEGES };
}

/** Text tokens: {privilege.name} and {privilege.what} of the one the lord is taking back. */
export function privilegeTokens(state) {
  const def = PRIVILEGES[state.privilegeLoss || state.privilegeLast];
  return def ? { 'privilege.name': def.name, 'privilege.what': def.what } : {};
}
