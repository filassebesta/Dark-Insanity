// Fights in rounds, in the spirit of Dračí doupě: opposed rolls of k6+
// (a six is rolled again and added) plus the fighter's numbers.
//   attack:  k6+ + útočné číslo (ÚČ)  vs  k6+ + obranné číslo (OČ)
//   a hit takes (attack − defence) + weapon lives.
// Each round the player picks an action; the enemy answers. The fight ends
// when one side falls, the enemy breaks and runs, or the player escapes.
// A choice with `combat: '<enemy>'` is fought out instead of a single roll.
// No DOM here — combat_ui.js draws it.

import { effectiveTraits, injuryMods, injure } from './injuries.js';
import { gearMods } from './gear.js';
import { roleLabel } from './court.js';

// hp: lives · uc / oc: attack and defence numbers · dmg: weapon · nerve: how hard it is to scare off
// lethal: a lost fight is a real wound (not just bruises) · wounds: what a lost fight leaves
export const ENEMIES = {
  rvaci: { name: 'Rváči z krčmy', plural: true, hp: 15, uc: 3, oc: 3, dmg: 0, nerve: 3, wounds: ['pohmozdeni', 'pohmozdeni', 'zlomenina', 'jizva'], text: 'Tři opilí žoldnéři s pěstmi jako palice a jedním stolem navíc.' },
  zbojnici: { name: 'Zbojníci', plural: true, hp: 17, uc: 3, oc: 3, dmg: 1, nerve: 3, lethal: true, wounds: ['rana', 'zlomenina', 'jizva', 'oko', 'ruka'], text: 'Tlupa zbojníků se sekerami a kosami nasazenými na stojato.' },
  hejtman: { duel: true, name: 'Zbojnický hejtman', hp: 16, uc: 4, oc: 3, dmg: 2, nerve: 5, lethal: true, wounds: ['rana', 'jizva', 'oko', 'ruka', 'noha'], text: 'Vůdce tlupy s valaškou a bez špetky strachu.' },
  vrah: { duel: true, name: 'Najatý vrah', hp: 11, uc: 4, oc: 3, dmg: 2, nerve: 6, lethal: true, wounds: ['rana', 'rana', 'jizva', 'oko'], text: 'Muž ve tmě s dýkou, která už zabíjela.' },
  vlci: { name: 'Vlčí smečka', hp: 16, uc: 3, oc: 3, dmg: 1, nerve: 2, lethal: true, wounds: ['rana', 'kulhani', 'noha', 'zlomenina'], text: 'Šedé stíny mezi stromy. Vůdce smečky je velký jako tele.' },
  vlk: { name: 'Vlk', hp: 11, uc: 3, oc: 2, dmg: 1, nerve: 2, lethal: true, wounds: ['rana', 'kulhani', 'pohmozdeni'], text: 'Vyhladovělý vlk u ovčína, zuby vyceněné.' },
  rytir: { duel: true, name: 'Rytíř v plné zbroji', hp: 14, uc: 4, oc: 3, dmg: 1, nerve: 6, wounds: ['pohmozdeni', 'zlomenina', 'oko', 'jizva', 'kulhani'], text: 'Zkušený turnajový rytíř s dřevcem a štítem s cizím erbem.' },
  souper: { duel: true, name: 'Šlechtic s mečem', hp: 14, uc: 4, oc: 3, dmg: 1, nerve: 5, lethal: true, wounds: ['rana', 'jizva', 'zlomenina', 'oko'], text: 'Uražený šlechtic, který s mečem zachází líp než s rýmy.' },
  drab: { name: 'Dráb a pacholci', plural: true, hp: 13, uc: 3, oc: 3, dmg: 1, nerve: 4, wounds: ['pohmozdeni', 'zlomenina', 'jizva'], text: 'Panský dráb s holí a dva pacholci za zády.' },
  hruby: { duel: true, name: 'Hrubý', hp: 13, uc: 3, oc: 2, dmg: 1, nerve: 4, wounds: ['pohmozdeni', 'zlomenina'], text: 'Soused Hrubý, ramena jako vrata a nálada jako bouřka.' },
};

export const ACTIONS = {
  utok: { label: 'Útok', text: 'Obyčejný útok: tvůj hod proti jeho obraně.' },
  silny: { label: 'Silný úder', text: 'ÚČ −1, ale zásah vezme o 3 životy víc. Proti silné zbroji i velkému počtu životů.' },
  kryt: { label: 'Kryt', text: 'Neútočíš, OČ +3. Příští útok dostane +1.' },
  zastrasit: { label: 'Zastrašit', trait: 'eloquence', text: 'Výřečnost proti odvaze nepřítele. Když uspěješ, uteče.' },
  lest: { label: 'Lest', trait: 'intelligence', text: 'Inteligence proti jeho obraně. Úspěch mu sníží OČ o 2 a dá ti +2 k útoku.' },
  utek: { label: 'Útěk', trait: 'patience', text: 'Trpělivost proti jeho útoku. Úspěch tě dostane pryč — za cenu prohry.' },
};

/** k6+ : a six is rolled again and added (at most three times). Returns the faces. */
export function rollK6plus() {
  const faces = [];
  for (let i = 0; i < 4; i++) {
    const f = 1 + Math.floor(Math.random() * 6);
    faces.push(f);
    if (f !== 6) break;
  }
  return faces;
}

const sum = (faces) => faces.reduce((a, b) => a + b, 0);
// verb agreement: Zbojníci padají, Vlk padá
const v = (foe, one, many) => (foe.plural ? many : one);

/** The ruler's numbers for a fight: lives, attack, defence, weapon — traits plus gear (gear.js). */
export function fighterOf(state) {
  const t = effectiveTraits(state.ruler);
  const gear = gearMods(state); // a lord starts with a sword and mail, a farmer with a flail
  const hurt = injuryMods(state.ruler);
  const lame = Math.round(hurt.army * 10); // a lost leg or hand weighs on the sword arm
  return {
    name: state.ruler.name,
    female: state.ruler.gender === 'female',
    hp: 8 + t.strength + gear.hp,
    maxHp: 8 + t.strength + gear.hp,
    uc: Math.round(t.strength / 2) + lame + gear.uc,
    oc: Math.round((t.strength + t.patience) / 4) + gear.oc,
    dmg: Math.max(1, gear.dmg),
    flee: gear.flee,
    gear: gear.items.map((i) => i.name),
    traits: t,
  };
}

/**
 * Who fights at the ruler's side against a band (not in single combat): the
 * marshal — for a peasant the smith — if loyal enough. Returns { ally } or { refused }.
 */
export function companionFor(state, enemyKey) {
  const def = ENEMIES[enemyKey];
  const m = state.marshal;
  if (!def || def.duel || !m || m.alive === false) return {};
  const title = roleLabel('marshal', m.gender, state.scenario);
  if (m.loyalty < 50) return { refused: `${title} ${m.name} se drží stranou. Za tebe krvácet nebude.` };
  return { ally: { name: m.name, title, uc: 2 + (m.quirk === 'schopny' ? 1 : 0), dmg: 1, female: m.gender === 'female' } };
}

export function startCombat(state, enemyKey) {
  const def = ENEMIES[enemyKey] || ENEMIES.zbojnici;
  const side = companionFor(state, enemyKey);
  return {
    enemyKey,
    ally: side.ally || null,
    allyRefused: side.refused || null,
    you: fighterOf(state),
    foe: { ...def, maxHp: def.hp, ocMalus: 0 },
    round: 0,
    boost: 0,       // bonus to the next attack (after a guard or a trick)
    tricked: false,
    log: [],
    over: null,     // 'win' | 'lose' | 'fled' | 'scared' | 'broke'
    wounds: [],
  };
}

function opposed(aBonus, dBonus) {
  const a = rollK6plus();
  const d = rollK6plus();
  return { a, d, at: sum(a) + aBonus, df: sum(d) + dBonus };
}

/** One round: the player's action, then the enemy's answer. Returns the round's record. */
export function combatRound(state, c, action) {
  if (c.over) return null;
  c.round += 1;
  const you = c.you;
  const foe = c.foe;
  const rec = { round: c.round, action, lines: [] };
  let foeBonus = 0;
  let yourDef = you.oc;

  if (action === 'utok' || action === 'silny') {
    const power = action === 'silny';
    const r = opposed(you.uc + c.boost - (power ? 1 : 0), foe.oc - foe.ocMalus);
    rec.you = r;
    c.boost = 0;
    if (r.at > r.df) {
      const dmg = r.at - r.df + you.dmg + (power ? 3 : 0);
      foe.hp = Math.max(0, foe.hp - dmg);
      rec.lines.push({ who: 'you', text: `Zásah! ${foe.name} ${v(foe, 'ztrácí', 'ztrácejí')} ${dmg} ${dmg === 1 ? 'život' : dmg < 5 ? 'životy' : 'životů'}.`, tone: 'pos' });
    } else rec.lines.push({ who: 'you', text: `${foe.name} útok ${v(foe, 'vykryl', 'vykryli')}.`, tone: '' });
  } else if (action === 'kryt') {
    yourDef += 3;
    c.boost = 1;
    rec.lines.push({ who: 'you', text: 'Držíš kryt a čekáš na chybu.', tone: '' });
  } else if (action === 'zastrasit') {
    const r = opposed(Math.round(you.traits.eloquence / 2), foe.nerve + (foe.hp > foe.maxHp / 2 ? 1 : 0));
    rec.you = r;
    if (r.at > r.df) {
      c.over = 'scared';
      rec.lines.push({ who: 'you', text: `${foe.name} ${v(foe, 'couvá a mizí', 'couvají a mizí')} ve tmě. Slova byla ostřejší než meč.`, tone: 'pos' });
      return finish(state, c, rec);
    }
    foe.nerve += 1;
    foeBonus += 1;
    rec.lines.push({ who: 'you', text: 'Výhrůžky nezabraly. Nepřítel se jen vysmál.', tone: 'neg' });
  } else if (action === 'lest') {
    const r = opposed(Math.round(you.traits.intelligence / 2), foe.oc);
    rec.you = r;
    if (r.at > r.df && !c.tricked) {
      c.tricked = true;
      foe.ocMalus = 2;
      c.boost = 2;
      rec.lines.push({ who: 'you', text: 'Lest vyšla: písek do očí, krok stranou. Nepřítel ztrácí kryt.', tone: 'pos' });
    } else {
      foeBonus += 1;
      rec.lines.push({ who: 'you', text: c.tricked ? 'Na stejný trik podruhé neskočí.' : 'Nepřítel lest prokoukl.', tone: 'neg' });
    }
  } else if (action === 'utek') {
    const r = opposed(Math.round(you.traits.patience / 2) + (you.flee || 0), foe.uc);
    rec.you = r;
    if (r.at > r.df) {
      c.over = 'fled';
      rec.lines.push({ who: 'you', text: 'Podařilo se ti uniknout. Se ctí to nemá nic společného, ale žiješ.', tone: '' });
      return finish(state, c, rec);
    }
    foeBonus += 2;
    rec.lines.push({ who: 'you', text: 'Útěk se nezdařil — a nepřítele máš teď za zády.', tone: 'neg' });
  }

  // the ally strikes too
  if (c.ally && foe.hp > 0) {
    const r = opposed(c.ally.uc, foe.oc - foe.ocMalus);
    rec.ally = r;
    if (r.at > r.df) {
      const dmg = r.at - r.df + c.ally.dmg;
      foe.hp = Math.max(0, foe.hp - dmg);
      rec.lines.push({ who: 'ally', text: `${c.ally.title} ${c.ally.name} ${c.ally.female ? 'zasáhla' : 'zasáhl'}: −${dmg}.`, tone: 'pos' });
    }
  }

  if (foe.hp <= 0) {
    c.over = 'win';
    rec.lines.push({ who: 'foe', text: `${foe.name} ${v(foe, 'padá', 'padají')} k zemi. Vítězství!`, tone: 'pos' });
    return finish(state, c, rec);
  }
  // a beaten enemy may break and run
  if (foe.hp <= Math.ceil(foe.maxHp / 4) && foe.nerve < 5 && Math.random() < 0.5) {
    c.over = 'broke';
    rec.lines.push({ who: 'foe', text: `${foe.name} to ${v(foe, 'vzdává a prchá', 'vzdávají a prchají')}.`, tone: 'pos' });
    return finish(state, c, rec);
  }

  // the enemy strikes back
  const e = opposed(foe.uc + foeBonus, yourDef);
  rec.foe = e;
  if (e.at > e.df) {
    const dmg = e.at - e.df + foe.dmg;
    you.hp = Math.max(0, you.hp - dmg);
    rec.lines.push({ who: 'foe', text: `${foe.name} tě ${v(foe, 'zasáhl', 'zasáhli')}: −${dmg} ${dmg === 1 ? 'život' : dmg < 5 ? 'životy' : 'životů'}.`, tone: 'neg' });
    // a heavy blow can leave a mark even in a fight that is won
    if (dmg >= 5 && Math.random() < 0.2) c.wounds.push(foe.wounds[Math.floor(Math.random() * foe.wounds.length)]);
  } else rec.lines.push({ who: 'foe', text: `${you.female ? 'Vykryla' : 'Vykryl'} jsi ${/^Vl/.test(foe.name) ? 'útok zubů' : 'ránu'}.`, tone: '' });

  if (you.hp <= 0) {
    c.over = 'lose';
    rec.lines.push({ who: 'you', text: 'Padáš k zemi. Boj je prohraný.', tone: 'neg' });
    c.wounds.push(foe.lethal ? foe.wounds[Math.floor(Math.random() * foe.wounds.length)] : 'pohmozdeni');
    return finish(state, c, rec);
  }
  if (c.round >= 12) {
    c.over = 'fled';
    rec.lines.push({ who: 'foe', text: 'Oba jste vyčerpaní. Nepřítel se stahuje a boj končí bez vítěze.', tone: '' });
    return finish(state, c, rec);
  }
  c.log.push(rec);
  return rec;
}

function finish(state, c, rec) {
  c.log.push(rec);
  return rec;
}

/** After the fight: wounds are dealt; returns { success, notes } for resolveChoice and the outcome. */
export function settleCombat(state, c) {
  const notes = [];
  const seen = new Set();
  for (const w of c.wounds) {
    if (seen.has(w)) continue;
    seen.add(w);
    injure(state, w, notes);
  }
  return { success: c.over === 'win' || c.over === 'scared' || c.over === 'broke', combat: true, notes, over: c.over };
}

/** For a quick check (sims): fights a whole battle with a simple plan. */
export function autoFight(state, enemyKey, plan = () => 'utok') {
  const c = startCombat(state, enemyKey);
  while (!c.over) combatRound(state, c, plan(c));
  return c;
}
