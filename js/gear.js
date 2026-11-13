// Gear (výzbroj): a weapon, armour, a shield and a horse the ruler buys with
// gold. Gear changes the numbers of a fight (combat.js: ÚČ, OČ, the weapon's
// damage, escape) and a war horse helps every roll that needs the sword arm
// (engine.js rollParts). A lord starts with a sword and mail, a peasant with
// a flail and nothing else. No DOM here — character.js shows the shop.
// A peasant's horse lives in the farm's stable: buying one needs a free stall
// and it counts as one of the farm's horses (farm.js).

import { ensureFarm, roomFor, freeRoom, buyStock } from './farm.js';

// slot: weapon | armor | shield | horse · who: 'lord' | 'peasant' | 'all'
// uc / oc: attack and defence numbers · dmg: damage of a hit · flee: escape rolls
// roll: bonus to rolls with strength or the army (k%)
export const ITEMS = {
  cep: { slot: 'weapon', name: 'Cep', who: 'peasant', cost: 0, dmg: 1, text: 'Mlátí se jím obilí. A když je potřeba, i hlavy.' },
  sekera: { slot: 'weapon', name: 'Sekera', who: 'peasant', cost: 5, dmg: 2, text: 'Dobrá sekera od kováře. Štípe dříví i štíty.' },
  mec: { slot: 'weapon', name: 'Meč', who: 'lord', cost: 0, dmg: 2, text: 'Rovný meč, jaký nosí každý pán.' },
  dlouhy_mec: { slot: 'weapon', name: 'Dlouhý meč', who: 'lord', cost: 20, uc: 1, dmg: 2, text: 'Jeden a půl ruky oceli. Delší dosah, lepší útok.' },
  valecna_sekera: { slot: 'weapon', name: 'Válečná sekera', who: 'lord', cost: 16, dmg: 3, text: 'Těžká a pomalá, ale co zasáhne, to nevstane.' },
  mistrovsky_mec: { slot: 'weapon', name: 'Mistrovský meč', who: 'lord', cost: 36, uc: 1, dmg: 3, text: 'Čepel z dílny cizího mistra. Takový meč se dědí.' },
  kabatec: { slot: 'armor', name: 'Prošívaný kabátec', who: 'peasant', cost: 4, oc: 1, text: 'Lněné vrstvy prošité koudelí. Zastaví sečnou ránu, ne bodnou.' },
  kruzky: { slot: 'armor', name: 'Kroužková košile', who: 'lord', cost: 0, oc: 1, text: 'Tisíce železných kroužků. Standard každého rytíře.' },
  platy: { slot: 'armor', name: 'Plátová zbroj', who: 'lord', cost: 32, oc: 1, hp: 4, flee: -2, text: 'Kov od hlavy k patě: snese rány, které by jinak zabily (+4 životy). Utéct se v ní ale nedá.' },
  stit: { slot: 'shield', name: 'Štít', who: 'all', cost: 8, oc: 1, text: 'Dřevo potažené kůží s kovanou puklicí.' },
  kun: { slot: 'horse', name: 'Jezdecký kůň', who: 'all', cost: 10, flee: 2, roll: 2, text: 'Rychlý a vytrvalý. Když je zle, odnese tě do bezpečí.' },
  orr: { slot: 'horse', name: 'Válečný oř', who: 'lord', cost: 26, flee: 2, roll: 4, text: 'Kůň vycvičený do bitvy. Nebojí se ohně, oceli ani řevu.' },
};

export const SLOTS = { weapon: 'Zbraň', armor: 'Zbroj', shield: 'Štít', horse: 'Kůň' };

const isLord = (state) => state.scenario !== 'sedlak';

/** Why a peasant cannot keep a horse now (null = there is a free stall). */
function stableBlock(state) {
  if (!ensureFarm(state)) return null;
  if (!roomFor(state, 'horses')) return 'Kůň potřebuje stáj. Nejdřív ji postav na gruntu.';
  if (!freeRoom(state, 'horses')) return 'Ve stáji není volné místo.';
  return null;
}

/** The ruler's gear, created on first use from the scenario's defaults. */
export function ensureGear(state) {
  if (!state.gear) state.gear = isLord(state) ? { weapon: 'mec', armor: 'kruzky' } : { weapon: 'cep' };
  // a peasant made a noble keeps the farm gear but gets a lord's sword and mail
  if (isLord(state) && (state.gear.weapon === 'cep' || state.gear.weapon === 'sekera')) state.gear.weapon = 'mec';
  if (isLord(state) && !state.gear.armor) state.gear.armor = 'kruzky';
  return state.gear;
}

/** Everything the gear adds up to. */
export function gearMods(state) {
  const out = { uc: 0, oc: 0, dmg: 0, hp: 0, flee: 0, roll: 0, items: [] };
  for (const key of Object.values(ensureGear(state))) {
    const it = ITEMS[key];
    if (!it) continue;
    out.items.push(it);
    for (const k of ['uc', 'oc', 'dmg', 'hp', 'flee', 'roll']) out[k] += it[k] || 0;
  }
  return out;
}

/** Items this ruler can buy now: [{ key, item, owned, block }]. */
export function shopFor(state) {
  const gear = ensureGear(state);
  return Object.entries(ITEMS)
    .filter(([, it]) => it.cost > 0 && (it.who === 'all' || (it.who === 'lord') === isLord(state)))
    .map(([key, item]) => {
      const owned = gear[item.slot] === key;
      let block = null;
      if (owned) block = 'Už máš.';
      else if (item.slot === 'horse' && !isLord(state) && stableBlock(state)) block = stableBlock(state);
      else if (state.resources.gold < item.cost) block = 'Na to nemáš.';
      return { key, item, owned, block };
    });
}

export function buyItem(state, key) {
  const item = ITEMS[key];
  if (!item) return { error: 'Taková věc není.' };
  const offer = shopFor(state).find((o) => o.key === key);
  if (!offer) return { error: 'Tohle se tu koupit nedá.' };
  if (offer.block) return { error: offer.block };
  // a peasant buys one of the farm's horses; it then carries its master too
  if (item.slot === 'horse' && !isLord(state) && ensureFarm(state)) {
    const res = buyStock(state, 'horses');
    if (res.error) return res;
    ensureGear(state).horse = key;
    return { message: `Koupeno: ${item.name}. Stojí ve stáji na gruntu.` };
  }
  state.resources.gold = Math.max(0, state.resources.gold - item.cost);
  ensureGear(state)[item.slot] = key;
  return { message: `Koupeno: ${item.name}.` };
}
