// Injuries: what fights, hunts, duels and accidents leave on the ruler's body.
//
// An injury lowers traits (so every roll and the yearly influence of the
// traits suffer), can weaken the ruler in battle (army), on the farm (work)
// and in health (deathRisk). Temporary ones heal after a few seasons; a deep
// wound can turn bad and kill. Permanent ones stay for life, though an aid
// (a wooden leg, an iron hand, an eye patch) softens them. The ruler's
// injuries live in state.ruler.injuries = [{ key, since, healsAt?, treated?, aided? }].
// No DOM here — engine.js applies them, ui.js and character.js show them.

import { randInt, bumpStat, clampRes } from './data.js';
import { makeChronicleEntry } from './state.js';

// traits: change to the ruler's traits · rolls: every roll · army: rolls that need the sword
// work: lost food every season on a farm · deathRisk: extra chance a year of dying
// onset: resources lost when it happens · heals: [min, max] seasons, absent = for life
export const INJURIES = {
  pohmozdeni: {
    name: 'Pohmožděniny', short: ['pohmožděný', 'pohmožděná'], heals: [1, 2],
    traits: { strength: -1 },
    text: 'Modřiny a naražená žebra. Každý pohyb bolí, ale za pár týdnů to přejde.',
  },
  zlomenina: {
    name: 'Zlomená ruka', short: ['ruka v dlaze', 'ruka v dlaze'], heals: [3, 5],
    traits: { strength: -2 }, army: -0.04,
    text: 'Ruka v dlahách. Meč, pluh ani otěže teď neudrží.',
  },
  rana: {
    name: 'Hluboká rána', short: ['raněný', 'raněná'], heals: [4, 6],
    traits: { strength: -1, patience: -1 }, rolls: -0.04, infection: 0.04,
    text: 'Rána, která se hojí špatně. Horečka přichází a odchází — a dokud se nezacelí, může se zanítit.',
  },
  kulhani: {
    name: 'Chromá noha', short: ['chromý', 'chromá'],
    traits: { strength: -1 }, army: -0.03,
    text: 'Noha se zhojila nakřivo. Chůze o holi, do sedla jen s cizí pomocí.',
  },
  jizva: {
    name: 'Zohyzděná tvář', short: ['zjizvený', 'zjizvená'],
    traits: { eloquence: -2 }, onset: { prestige: -1 },
    text: 'Jizva přes celou tvář. Někoho děsí, jiného odpuzuje — vyjednává se s ní hůř.',
  },
  oko: {
    name: 'Ztracené oko', short: ['jednooký', 'jednooká'],
    traits: { strength: -1, eloquence: -1 }, onset: { prestige: -2 },
    aid: { name: 'Páska přes oko', acc: 'koženou pásku přes oko', lost: 'oko', maker: 'Sedlář', traits: { strength: -1 } },
    text: 'Prázdný důlek pod víčkem. Vzdálenost se odhaduje špatně a lidé se dívají jinam.',
  },
  ruka: {
    name: 'Ztracená ruka', short: ['bez ruky', 'bez ruky'],
    traits: { strength: -3 }, army: -0.06, work: 1, onset: { prestige: -3 },
    aid: { name: 'Železná ruka', acc: 'železnou ruku s pákou a hákem', lost: 'ruku', maker: 'Kovář', traits: { strength: -2 }, army: -0.03 },
    text: 'Pahýl v obvazech. Co dřív zvládla jedna ruka, teď nezvládnou ani dvě cizí.',
  },
  noha: {
    name: 'Ztracená noha', short: ['bez nohy', 'bez nohy'],
    traits: { strength: -2, patience: -1 }, army: -0.1, work: 1, deathRisk: 0.02, onset: { prestige: -4 },
    aid: { name: 'Dřevěná noha', acc: 'dřevěnou nohu z jasanu', lost: 'nohu', maker: 'Řezbář', traits: { strength: -1 }, army: -0.05 },
    text: 'Noha uříznutá pod kolenem. Do sedla jen s pomocí, do boje vůbec, a stará rána bolí při každé změně počasí.',
  },
};

// what a failed test of strength leaves behind, from the likely to the rare
const RANDOM_POOL = [['pohmozdeni', 40], ['zlomenina', 22], ['rana', 16], ['kulhani', 8], ['jizva', 7], ['oko', 3], ['ruka', 2], ['noha', 2]];
// chance that a failed test of strength (a fight, a hunt, a duel) leaves an injury
export const STRENGTH_FAIL_INJURY = 0.3;

const PERMANENT = (key) => !INJURIES[key].heals;
const SEVERITY = ['noha', 'ruka', 'oko', 'rana', 'jizva', 'kulhani', 'zlomenina', 'pohmozdeni'];

export function injuriesOf(ruler) {
  return (ruler && ruler.injuries) || [];
}

export function hasInjury(state, key) {
  return injuriesOf(state.ruler).some((i) => i.key === key);
}

/** An injury as it now weighs on the ruler: the aid's lighter numbers once it is made. */
export function injuryFx(inj) {
  const def = INJURIES[inj.key];
  return inj.aided && def.aid ? { ...def, ...def.aid, name: def.aid.name } : def;
}

/** Everything the ruler's injuries add up to. */
export function injuryMods(ruler) {
  const out = { traits: {}, rolls: 0, army: 0, work: 0, deathRisk: 0 };
  for (const inj of injuriesOf(ruler)) {
    const fx = injuryFx(inj);
    for (const [k, v] of Object.entries(fx.traits || {})) out.traits[k] = (out.traits[k] || 0) + v;
    out.rolls += fx.rolls || 0;
    out.army += fx.army || 0;
    out.work += fx.work || 0;
    out.deathRisk += fx.deathRisk || 0;
  }
  return out;
}

/** The ruler's traits with the injuries counted in (never below 1). */
export function effectiveTraits(ruler) {
  const mods = injuryMods(ruler).traits;
  const out = {};
  for (const [k, v] of Object.entries(ruler.traits)) out[k] = Math.max(1, v + (mods[k] || 0));
  return out;
}

function pickWeighted(pool) {
  const total = pool.reduce((s, [, w]) => s + w, 0);
  let roll = Math.random() * total;
  for (const [key, w] of pool) {
    roll -= w;
    if (roll <= 0) return key;
  }
  return pool[pool.length - 1][0];
}

/**
 * Wounds the ruler. spec: '<key>' | 'random' | { pool: [keys], chance }.
 * A permanent injury the ruler already has is not given twice; a temporary one heals later instead.
 * Returns the key given, or null.
 */
export function injure(state, spec, notes = []) {
  if (!spec || state.gameOver) return null;
  const r = state.ruler;
  if (typeof spec === 'object' && spec.chance !== undefined && Math.random() >= spec.chance) return null;
  let pool = spec === 'random' ? RANDOM_POOL
    : typeof spec === 'string' ? [[spec, 1]]
      : spec.pool.map((k) => [k, RANDOM_POOL.find(([x]) => x === k)?.[1] || 1]);
  // one blow leaves at most one lasting mark: no second permanent injury in the same season
  const scarredNow = r.lastScarTurn === state.turn;
  pool = pool.filter(([k]) => INJURIES[k] && !(PERMANENT(k) && (hasInjury(state, k) || scarredNow)));
  if (!pool.length) return null;
  const key = pickWeighted(pool);
  const def = INJURIES[key];
  r.injuries = r.injuries || [];
  const same = r.injuries.find((i) => i.key === key);
  if (same) {
    same.healsAt += randInt(...def.heals); // a fresh blow on an old wound
  } else {
    r.injuries.push({ key, since: state.turn, ...(def.heals ? { healsAt: state.turn + randInt(...def.heals) } : {}) });
  }
  for (const [k, v] of Object.entries(def.onset || {})) {
    if (state.resources[k] !== undefined) state.resources[k] = clampRes(k, state.resources[k] + v);
  }
  notes.push({ text: `Zranění: ${def.name.toLowerCase()}${def.heals ? '' : ' (natrvalo)'}`, tone: 'neg' });
  bumpStat(state, 'injuries');
  if (!def.heals) { bumpStat(state, 'scars'); r.lastScarTurn = state.turn; }
  if (!def.heals) state.chronicle.push(makeChronicleEntry(state, `${r.name} si z toho odnes${r.gender === 'female' ? 'la' : 'l'} trvalé zranění: ${def.name.toLowerCase()}.`));
  return key;
}

/** Branch extras of an event: heal, treat, aid. */
export function applyInjuryEffects(state, branch, notes) {
  if (branch.injury) injure(state, branch.injury, notes);
  const list = injuriesOf(state.ruler);
  if (branch.heal) {
    // the worst temporary wound is cured at once
    const temp = SEVERITY.map((k) => list.find((i) => i.key === k && !PERMANENT(k))).find(Boolean);
    if (temp) {
      state.ruler.injuries = list.filter((i) => i !== temp);
      notes.push({ text: `Uzdraveno: ${INJURIES[temp.key].name.toLowerCase()}`, tone: 'pos' });
    }
  }
  if (branch.treat) {
    // a treated wound no longer festers and heals sooner
    for (const i of list) {
      if (PERMANENT(i.key)) continue;
      i.treated = true;
      i.healsAt = Math.max(state.turn + 1, i.healsAt - 2);
    }
    notes.push({ text: 'Rány jsou ošetřené a hojí se rychleji', tone: 'pos' });
  }
  if (branch.worsen) {
    // a botched cure: a broken arm grows crooked, a wound turns into a limp
    const temp = list.find((i) => i.key === 'zlomenina' || i.key === 'rana');
    if (temp) {
      state.ruler.injuries = list.filter((i) => i !== temp);
      injure(state, temp.key === 'zlomenina' ? { pool: ['ruka', 'kulhani'] } : 'kulhani', notes);
    }
  }
  if (branch.aid) {
    const inj = SEVERITY.map((k) => list.find((i) => i.key === k && INJURIES[k].aid && !i.aided)).find(Boolean);
    if (inj) {
      inj.aided = true;
      notes.push({ text: `Náhrada: ${INJURIES[inj.key].aid.name.toLowerCase()}`, tone: 'pos' });
    }
  }
}

/** The unaided permanent injury an aid could help, if any. */
export function aidable(state) {
  const list = injuriesOf(state.ruler);
  return SEVERITY.map((k) => list.find((i) => i.key === k && INJURIES[k].aid && !i.aided)).find(Boolean) || null;
}

/** The temporary wound a healer could see to (not mere bruises), if any. */
export function treatable(state) {
  return injuriesOf(state.ruler).find((i) => (i.key === 'rana' || i.key === 'zlomenina') && !i.treated) || null;
}

/** Text tokens: {injury.name} the worst wound, {aid.name} {aid.maker} what could replace a lost limb. */
export function injuryTokens(state) {
  const list = injuriesOf(state.ruler);
  const worst = SEVERITY.map((k) => list.find((i) => i.key === k)).find(Boolean);
  const aid = aidable(state);
  return {
    'injury.name': worst ? INJURIES[worst.key].name.toLowerCase() : 'zranění',
    'injury.Name': worst ? INJURIES[worst.key].name : 'Zranění',
    'aid.name': aid ? INJURIES[aid.key].aid.acc : '',
    'aid.Maker': aid ? INJURIES[aid.key].aid.maker : '',
    'aid.lost': aid ? INJURIES[aid.key].aid.lost : '',
  };
}

/** Every season: wounds heal or fester. Returns { news, died }. */
export function processInjuries(state) {
  const r = state.ruler;
  const news = [];
  if (!r.injuries || !r.injuries.length) return { news, died: false };
  const f = r.gender === 'female';
  for (const inj of [...r.injuries]) {
    const def = INJURIES[inj.key];
    if (!def.heals) continue;
    if (def.infection && !inj.treated && Math.random() < def.infection) {
      news.push(`Rána se zanítila. ${r.name} ${f ? 'podlehla' : 'podlehl'} horečce.`);
      return { news, died: true };
    }
    if (state.turn >= inj.healsAt) {
      r.injuries = r.injuries.filter((x) => x !== inj);
      news.push(`Zahojilo se: ${def.name.toLowerCase()}.`);
    }
  }
  return { news, died: false };
}

/** Short words for the plaque: "bez nohy", "jednooká"… */
export function injuryWords(ruler) {
  const g = ruler.gender === 'female' ? 1 : 0;
  return SEVERITY.map((k) => injuriesOf(ruler).find((i) => i.key === k)).filter(Boolean)
    .map((i) => (i.aided && i.key === 'noha' ? 'o dřevěné noze' : i.aided && i.key === 'ruka' ? 's železnou rukou' : INJURIES[i.key].short[g]));
}

// a lasting injury can give the ruler a name: Jednooký, Chromá, Jednoruký…
export const INJURY_EPITHETS = {
  noha: ['Jednonohý', 'Jednonohá', 'podle nohy, o kterou {přišel|přišla}', 55],
  ruka: ['Jednoruký', 'Jednoruká', 'podle ruky, o kterou {přišel|přišla}', 55],
  oko: ['Jednooký', 'Jednooká', 'podle oka, které {ztratil|ztratila}', 50],
  jizva: ['Zjizvený', 'Zjizvená', 'podle jizvy přes tvář', 40],
  kulhani: ['Chromý', 'Chromá', 'podle nohy, která se zhojila nakřivo', 35],
};

/** Extra scores for reignEpithet: { key: score }. */
export function injuryEpithetScores(ruler) {
  const out = {};
  for (const inj of injuriesOf(ruler)) if (INJURY_EPITHETS[inj.key]) out[`injury_${inj.key}`] = INJURY_EPITHETS[inj.key][3];
  return out;
}

/** Names of the lasting injuries, kept for the Hall of Ancestors. */
export function lastingInjuryNames(ruler) {
  return injuriesOf(ruler).filter((i) => PERMANENT(i.key)).map((i) => injuryFx(i).name.toLowerCase());
}

export function isPermanent(key) {
  return PERMANENT(key);
}
