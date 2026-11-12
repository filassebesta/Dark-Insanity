// Trade events (see trade.js). The ambushes are raised by the engine when a
// caravan or a ship runs into trouble; the rest are drawn like any event once
// the player trades. Branch effects:
//   trade: 'ransom' | 'deliver' | 'lose'   — how an ambush ends
//   tradeOffer: <multiplier>               — sell the stock to a foreign buyer (0 = refuse)
//   tradeMod: { dest, good?, mult, turns } — a market's prices change for a while
//   tradeStock: { <good>: n }              — goods taken from or added to the warehouse

import { pickOffer } from './trade.js';

const ALL = ['panovnik', 'slechtic', 'sedlak'];
const img = (id) => `assets/events/${id}.jpg`;
// someone who has sent goods abroad (a serf may only deliver to the lord's manor)
const hasSent = (s) => s.trade && s.trade.sent >= 1 && (s.scenario !== 'sedlak' || s.ruler.statusTier >= 2);
const canRansom = (s) => s.tradeCtx && s.resources.gold >= s.tradeCtx.ransom;
const escortBonus = (s) => (s.tradeCtx && s.tradeCtx.escort ? 0.2 : 0);

export const TRADE_EVENTS = [
  {
    id: 'o_prepadeni',
    scenarios: ALL, forced: true, music: 'battle',
    image: img('lapkove_ve_hvozdu'),
    title: 'Přepadená karavana',
    text: 'Karavanu s nákladem {cargo.load} cestou {cargo.to} zastavili {cargo.danger}. Vozky drží v šachu a chtějí výkupné: {cargo.ransom}, jinak si vezmou všechno. {cargo.escort}',
    choices: [
      {
        label: 'Zaplatit výkupné',
        requires: canRansom,
        hintType: 'resource', hintKey: 'gold',
        trade: 'ransom',
        chronicle: 'Výkupné bylo zaplaceno a karavana pokračovala v cestě. Lapkové se smáli.',
      },
      {
        label: 'Poslat ozbrojence',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.35, resourceKey: 'army', resourceScale: 0.5,
        chanceBonus: escortBonus,
        onSuccess: { trade: 'deliver', effects: { prestige: 2 }, music: 'battle', chronicle: 'Ozbrojenci lapky rozprášili a náklad dorazil do cíle.' },
        onFailure: { trade: 'lose', effects: { army: -4 }, music: 'battle', chronicle: 'Lapkové byli silnější. Náklad je pryč a s ním i několik dobrých mužů.' },
      },
      {
        label: 'Odepsat náklad',
        hintType: 'trait', hintKey: 'patience',
        trade: 'lose',
        chronicle: 'Náklad propadl lapkům. Vozky se aspoň vrátili živí.',
      },
    ],
  },

  {
    id: 'o_pirati',
    scenarios: ALL, forced: true, music: 'battle',
    image: img('pirati'),
    title: 'Piráti na obzoru',
    text: 'Loď s nákladem {cargo.load} plující {cargo.to} dostihly pirátské plachty. Kapitán posílá rychlý člun: piráti chtějí {cargo.ransom} za volnou plavbu, jinak loď přepadnou. {cargo.escort}',
    choices: [
      {
        label: 'Zaplatit pirátům',
        requires: canRansom,
        hintType: 'resource', hintKey: 'gold',
        trade: 'ransom',
        chronicle: 'Piráti dostali svůj podíl a loď doplula do přístavu.',
      },
      {
        label: 'Bránit loď',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.3, resourceKey: 'army', resourceScale: 0.5,
        chanceBonus: escortBonus,
        onSuccess: { trade: 'deliver', effects: { prestige: 3 }, music: 'battle', chronicle: 'Posádka odrazila abordáž. Pirátská loď odplula s děrou v trupu.' },
        onFailure: { trade: 'lose', effects: { army: -3 }, music: 'battle', chronicle: 'Piráti vzali loď i náklad. Námořníci se vrátili na vypůjčeném člunu.' },
      },
      {
        label: 'Zkusit jim uplout',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.4, traitKey: 'intelligence', traitScale: 0.03,
        onSuccess: { trade: 'deliver', chronicle: 'Kapitán vyplul do mlhy a piráti ztratili stopu.' },
        onFailure: { trade: 'lose', chronicle: 'Vítr se otočil. Piráti loď dostihli a vyplenili.' },
      },
    ],
  },

  {
    id: 'o_cizi_kupec',
    scenarios: ALL, cooldown: 12, minTurn: 4,
    requires: (s) => !!pickOffer(s),
    onPick: (s) => { s.tradeCtx = pickOffer(s); },
    image: img('kupci_z_jihu'),
    title: 'Kupec s plným měšcem',
    text: 'Do Brodu dorazil cizí kupec a ptá se po {cargo.good}. Slyšel, že ho máš ve skladu: {cargo.load}. Nabízí {cargo.offer} za všechno najednou, a hned.',
    choices: [
      {
        label: 'Prodat',
        hintType: 'resource', hintKey: 'gold',
        tradeOffer: 1,
        chronicle: 'Kupec odjel s plnými vozy a sklad zeje prázdnotou. Měšec ne.',
      },
      {
        label: 'Smlouvat o víc',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.45, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { tradeOffer: 1.3, traitGain: 'eloquence', chronicle: 'Kupec nakonec přidal. Prý jen proto, že spěchá.' },
        onFailure: { tradeOffer: 0, chronicle: 'Kupec se urazil a odjel do Brodné k jinému prodejci.' },
      },
      {
        label: 'Neprodávat',
        hintType: 'trait', hintKey: 'patience',
        tradeOffer: 0,
        chronicle: 'Zboží zůstalo ve skladu. Za hranicemi se prodá dráž.',
      },
    ],
  },

  {
    id: 'o_clo',
    scenarios: ALL, cooldown: 24, minTurn: 6,
    requires: hasSent,
    image: img('cizi_vyslanec'),
    title: 'Nové clo',
    text: 'Markrabata z Východních marek zvedla clo na všechno zboží, které přijíždí přes hvozd. Kupci skřípou zuby a ceny v markách padají.',
    choices: [
      {
        label: 'Smířit se s tím',
        hintType: 'trait', hintKey: 'patience',
        tradeMod: { dest: 'east', mult: 0.7, turns: 10 },
        chronicle: 'Clo platí. Karavany do marek vozí méně a za méně.',
      },
      {
        label: 'Vyjednat výjimku',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.4, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { prestige: 3 }, traitGain: 'eloquence', chronicle: 'Markrabě udělil výjimku. Tvé vozy projedou bez cla.' },
        onFailure: { tradeMod: { dest: 'east', mult: 0.6, turns: 10 }, chronicle: 'Vyjednávání markraběte rozzlobilo. Clo pro tvé vozy je ještě vyšší.' },
      },
      {
        label: 'Obrátit obchod jinam',
        hintType: 'resource', hintKey: 'gold',
        tradeMod: { dest: 'east', mult: 0.7, turns: 10 },
        effects: { gold: -3 },
        chronicle: 'Kupci dostali vzkaz: na sever a přes moře. Marky ať si nechají své clo.',
      },
    ],
  },

  {
    id: 'o_hlad_na_severu',
    scenarios: ALL, cooldown: 30, minTurn: 6,
    requires: hasSent,
    image: img('hladomor'),
    title: 'Hlad za horami',
    text: 'Ze Severních pustin přicházejí zprávy o hladu. Kdo tam teď doveze obilí, dostane zaplaceno stříbrem. Nebo vděčností, pokud ho daruje.',
    choices: [
      {
        label: 'Využít toho a prodávat draze',
        hintType: 'resource', hintKey: 'gold',
        tradeMod: { dest: 'north', good: 'grain', mult: 2, turns: 8 },
        chronicle: 'Do skladu se vozí obilí. Na severu se platí zlatem za každý pytel.',
      },
      {
        label: 'Poslat obilí jako dar',
        requires: (s) => s.trade && s.trade.stock.grain >= 3,
        hintType: 'resource', hintKey: 'prestige',
        tradeStock: { grain: -3 },
        tradeMod: { dest: 'north', good: 'grain', mult: 2, turns: 8 },
        effects: { prestige: 7, faith: 3 },
        chronicle: 'Tři vozy obilí odjely na sever jako dar. Náčelníci na to nezapomenou.',
      },
      {
        label: 'Nevšímat si toho',
        hintType: 'trait', hintKey: 'patience',
        tradeMod: { dest: 'north', good: 'grain', mult: 2, turns: 8 },
        chronicle: 'Sever má své starosti, my své.',
      },
    ],
  },

  {
    id: 'o_lod',
    scenarios: ['panovnik', 'slechtic'], oneTime: true, minTurn: 8,
    requires: hasSent,
    image: img('kupecka_gilda'),
    title: 'Vlastní loď',
    text: 'Loďař z Přístavu Mark nabízí postavit pevnou loď s vysokými boky, jakou piráti neradi napadají. Bude to stát hodně dřeva, hodně zlata a celý rok.',
    choices: [
      {
        label: 'Loď postavit',
        requires: (s) => s.resources.gold >= 18,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -18, prestige: 3 },
        hiddenEffects: { setFlag: 'o_lod' },
        chronicle: 'Na vodu se spustila nová loď. Plavby do Jižní říše budou bezpečnější.',
      },
      {
        label: 'Spokojit se s pronajatými loděmi',
        hintType: 'trait', hintKey: 'patience',
        effects: {},
        chronicle: 'Loďař odešel se svými výkresy jinam.',
      },
    ],
  },
];
