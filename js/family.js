// The family through the years: everybody ages, children are born, people die,
// heirs grow up, marry and have children of their own, widowed rulers remarry,
// old advisers pass away and child rulers need a regent.
//
// state.heir      the designated heir: the ruler's eldest living child (or a placeholder: alive false, none true)
// state.children  the ruler's other living children (the heir's younger brothers and sisters)
// state.siblings  the ruler's living brothers and sisters (they inherit when there is no child)
// state.parent    the ruler's widowed mother or father, if still alive
// state.spouse    the ruler's husband or wife (alive false when widowed or never married)
// heir.spouse / heir.kids  the heir's own marriage and children (the next generation after them)
// state.regent    who governs for a ruler younger than 16: 'parent' | 'chancellor' | 'self'
//
// Family events (mourning, the regency) wait in state.familyQueue and are raised by pickNextEvent.

import { randInt, randomName, clamp } from './data.js';
import { randomQuirk } from './court.js';
import { makeChronicleEntry, inheritTraits } from './state.js';

export const ADULT_AGE = 16;
export const OLD_AGE = 55;
const COUNCIL = ['chancellor', 'marshal', 'spymaster'];

const isPeasantGame = (state) => state.scenario === 'sedlak';
const fem = (p) => p && p.gender === 'female';
const opposite = (g) => (g === 'female' ? 'male' : 'female');

// ---------- life stages (for the UI) ----------

export function lifeStage(age, gender) {
  const f = gender === 'female';
  if (age < 1) return 'novorozeně';
  if (age < 6) return 'malé dítě';
  if (age < 12) return 'dítě';
  if (age < ADULT_AGE) return f ? 'dospívající dívka' : 'dospívající chlapec';
  if (age < 25) return f ? 'mladá žena' : 'mladý muž';
  if (age < 60) return f ? 'dospělá žena' : 'dospělý muž';
  return f ? 'stařena' : 'stařec';
}

/** "1 rok", "3 roky", "40 let" */
export function yearsText(n) {
  if (n === 1) return '1 rok';
  if (n >= 2 && n <= 4) return `${n} roky`;
  return `${n} let`;
}

export function childWord(c) {
  return fem(c) ? 'dcera' : 'syn';
}

// ---------- names ----------

/** Every first name somebody in the family (living or in the hall of ancestors) already carries. */
function familyNames(state) {
  const names = new Set();
  const add = (p) => { if (p && p.name) names.add(p.name); };
  add(state.ruler); add(state.spouse); add(state.heir); add(state.parent);
  if (state.heir && state.heir.spouse) add(state.heir.spouse);
  for (const k of (state.heir && state.heir.kids) || []) add(k);
  for (const c of state.children || []) add(c);
  for (const c of state.siblings || []) add(c);
  for (const role of COUNCIL) add(state[role]);
  return names;
}

export function freshName(state, gender) {
  const used = familyNames(state);
  let name = randomName(gender);
  for (let i = 0; i < 30 && used.has(name); i++) name = randomName(gender);
  return name;
}

// ---------- people ----------

export function makeChild(state, gender, age = 0, parentTraits = state.ruler.traits) {
  const g = gender || (Math.random() < 0.5 ? 'male' : 'female');
  return { name: freshName(state, g), gender: g, age, alive: true, traits: inheritTraits(parentTraits) };
}

/** A husband or wife for someone of this age and gender. */
export function makeSpouse(state, partner, { loyalty = 65, minAge, maxAge } = {}) {
  const g = opposite(partner.gender);
  const lo = minAge ?? Math.max(ADULT_AGE, partner.age - 6);
  const hi = maxAge ?? Math.max(lo, partner.age + 4);
  return {
    role: 'spouse', name: freshName(state, g), gender: g, age: randInt(lo, hi),
    loyalty: clamp(loyalty + randInt(-8, 8)), alive: true, quirk: randomQuirk(),
    married: state.turn,
  };
}

function noSpouse(gender) {
  return { role: 'spouse', name: '', gender, age: 0, loyalty: 50, alive: false, none: true };
}

function noHeir() {
  return { role: 'heir', name: '', gender: 'male', age: 0, loyalty: 70, alive: false, none: true };
}

/** A child (from state.children or heir.kids) becomes the designated heir. */
function asHeir(child) {
  return {
    role: 'heir', name: child.name, gender: child.gender, age: child.age,
    loyalty: clamp(70 + randInt(-8, 8)), alive: true,
    traits: child.traits || inheritTraits(),
    ...(child.spouse ? { spouse: child.spouse } : {}),
    kids: child.kids || [],
    history: child.history || [],
  };
}

export function hasSpouse(state) {
  return !!state.spouse && state.spouse.alive !== false;
}

export function heirMarried(state) {
  return !!(state.heir && state.heir.alive !== false && state.heir.spouse);
}

/** Fills in what older saves lack. */
export function ensureFamily(state) {
  state.children = state.children || [];
  state.siblings = state.siblings || [];
  state.familyQueue = state.familyQueue || [];
  if (state.parent === undefined) state.parent = null;
  if (state.heir && state.heir.alive !== false && !state.heir.kids) state.heir.kids = [];
  // the old global flag becomes a real husband or wife for the heir
  if (state.flags && state.flags.heir_married) {
    if (state.heir && state.heir.alive !== false && !state.heir.spouse) marryHeir(state);
    delete state.flags.heir_married;
  }
}

// ---------- marriages ----------

/** The heir marries; `who` may name the bride or groom (a king's child, a house's daughter). */
export function marryHeir(state, who = {}) {
  const h = state.heir;
  if (!h || h.alive === false || h.spouse) return null;
  const g = opposite(h.gender);
  h.spouse = {
    name: who.name || freshName(state, g), gender: g,
    age: who.age ?? Math.max(ADULT_AGE - 2, h.age + randInt(-3, 3)),
    origin: who.origin || '', married: state.turn,
  };
  h.kids = h.kids || [];
  return h.spouse;
}

/** The ruler takes a husband or a wife (spec from an event: loyalty, age range, origin). */
export function marryRuler(state, spec = {}) {
  const s = makeSpouse(state, state.ruler, spec);
  if (spec.origin) s.origin = spec.origin;
  state.spouse = s;
  delete state.flags.widowedTurn;
  return s;
}

// ---------- the yearly cycle ----------

function deathChance(age, peasant) {
  if (age < 5) return peasant ? 0.035 : 0.02;
  if (age < ADULT_AGE) return peasant ? 0.008 : 0.004;
  if (age < 50) return 0.004;
  return Math.min(0.6, 0.004 + (age - 50) * 0.02);
}

function fertile(mother, father) {
  return mother && father && mother.alive !== false && father.alive !== false
    && mother.age >= 17 && mother.age <= 42;
}

function birthChance(mother, living) {
  let p = 0.32 - Math.max(0, living - 1) * 0.06;
  if (mother.age > 35) p *= 0.55;
  return Math.max(0, p);
}

const CAUSES = {
  infant: ['Horečka přišla v noci a do rána bylo po všem.', 'Bylo slabé od narození a zima byla příliš dlouhá.', 'Kašel, který nepřestal. Ranhojič jen bezradně rozhodil rukama.'],
  child: ['Spadl{X:|a} z vrby u potoka a už se neprobral{X:|a}.', 'Spála přišla s jarem a odnesla víc dětí než jen tohle.', 'Horečka, kterou nikdo nedokázal srazit.'],
  adult: ['Zlomený vaz při pádu z koně.', 'Rána, která se zanítila, a pak už jen horečka.', 'Úplavice, která přišla s horkým létem.'],
  old: ['Usnul{X:|a} a už se neprobudil{X:|a}.', 'Srdce. Lékaři prý nemohli nic dělat.', 'Dlouhá nemoc, kterou snášel{X:|a} beze slova.'],
  childbirth: ['Porod byl těžký a ranhojička nedokázala zastavit krvácení.'],
};

function causeOf(age, special) {
  const pool = CAUSES[special] || (age < 5 ? CAUSES.infant : age < ADULT_AGE ? CAUSES.child : age < 55 ? CAUSES.adult : CAUSES.old);
  return pool[randInt(0, pool.length - 1)];
}

function mourn(state, person, relation, special) {
  state.familyQueue.push({
    event: 'rodina_smrt',
    dead: {
      name: person.name, gender: person.gender, age: person.age, relation,
      cause: causeOf(person.age, special).replace(/\{X:([^|{}]*)\|([^|{}]*)\}/g, (m, male, female) => (fem(person) ? female : male)),
    },
  });
}

const REL_WORD = {
  spouse: (p) => (fem(p) ? 'manželka' : 'manžel'),
  heir: (p) => (fem(p) ? 'dědička' : 'dědic'),
  child: (p) => (fem(p) ? 'dcera' : 'syn'),
  grandchild: (p) => (fem(p) ? 'vnučka' : 'vnuk'),
  sibling: (p) => (fem(p) ? 'sestra' : 'bratr'),
  parent: (p) => (fem(p) ? 'matka' : 'otec'),
  heirSpouse: (p) => (fem(p) ? 'snacha' : 'zeť'),
};

export function relationWord(relation, person) {
  return (REL_WORD[relation] || (() => ''))(person);
}

/**
 * One year of family life. Returns short news lines for the season summary.
 * Called once a year (spring), after everybody has aged by a year.
 */
export function ageFamily(state) {
  ensureFamily(state);
  const news = [];
  const peasant = isPeasantGame(state);
  const r = state.ruler;

  // everyone else ages (the ruler, spouse, heir and advisers age in engine.js)
  for (const c of state.children) c.age += 1;
  for (const c of state.siblings) c.age += 1;
  if (state.parent) state.parent.age += 1;
  const h = state.heir;
  if (h && h.alive !== false) {
    if (h.spouse) h.spouse.age += 1;
    for (const k of h.kids || []) k.age += 1;
  }

  // ---- deaths ----
  const dies = (p) => Math.random() < deathChance(p.age, peasant);

  if (hasSpouse(state) && dies(state.spouse)) {
    state.spouse.alive = false;
    state.flags.widowedTurn = state.turn;
    news.push(`${fem(state.spouse) ? 'Zemřela' : 'Zemřel'} ${state.spouse.name}.`);
    mourn(state, state.spouse, 'spouse');
  }

  for (const c of state.children.slice()) {
    if (dies(c)) {
      state.children.splice(state.children.indexOf(c), 1);
      news.push(`${fem(c) ? 'Zemřela dcera' : 'Zemřel syn'} ${c.name}.`);
      if (c.age >= 1) mourn(state, c, 'child');
      state.chronicle.push(makeChronicleEntry(state, `${fem(c) ? 'Zemřela' : 'Zemřel'} ${c.name}, ${childWord(c)} z rodu ${state.dynastyName}, ve věku ${c.age} let.`));
    }
  }

  for (const c of state.siblings.slice()) {
    if (dies(c)) {
      state.siblings.splice(state.siblings.indexOf(c), 1);
      state.chronicle.push(makeChronicleEntry(state, `${fem(c) ? 'Zemřela' : 'Zemřel'} ${c.name}, ${fem(c) ? 'sestra' : 'bratr'} ${fem(r) ? 'paní' : 'pána'} rodu, ve věku ${c.age} let.`));
    }
  }

  if (state.parent && dies(state.parent)) {
    const p = state.parent;
    state.parent = null;
    news.push(`${fem(p) ? 'Zemřela matka' : 'Zemřel otec'} ${p.name}.`);
    state.chronicle.push(makeChronicleEntry(state, `${fem(p) ? 'Zemřela' : 'Zemřel'} ${p.name}, ${fem(p) ? 'matka' : 'otec'} ${fem(r) ? 'vládkyně' : 'vládce'}, ve věku ${p.age} let.`));
    if (state.regent === 'parent') state.regent = 'chancellor';
  }

  if (h && h.alive !== false) {
    if (h.spouse && Math.random() < deathChance(h.spouse.age, peasant)) {
      state.chronicle.push(makeChronicleEntry(state, `${fem(h.spouse) ? 'Zemřela' : 'Zemřel'} ${h.spouse.name}, ${fem(h.spouse) ? 'manželka' : 'manžel'} ${fem(h) ? 'dědičky' : 'dědice'} ${h.name}.`));
      delete h.spouse;
    }
    for (const k of (h.kids || []).slice()) {
      if (dies(k)) {
        h.kids.splice(h.kids.indexOf(k), 1);
        state.chronicle.push(makeChronicleEntry(state, `${fem(k) ? 'Zemřela' : 'Zemřel'} ${k.name}, ${fem(k) ? 'vnučka' : 'vnuk'} rodu ${state.dynastyName}, ve věku ${k.age} let.`));
      }
    }
    if (dies(h)) {
      h.alive = false;
      news.push(`${fem(h) ? 'Zemřela dědička' : 'Zemřel dědic'} ${h.name}.`);
      mourn(state, h, 'heir');
      promoteHeir(state, news);
    }
  }

  // ---- births ----
  const mother = fem(r) ? r : state.spouse;
  const father = fem(r) ? state.spouse : r;
  const living = state.children.length + (state.heir && state.heir.alive !== false ? 1 : 0);
  if (hasSpouse(state) && fertile(mother, father) && living < 6 && Math.random() < birthChance(mother, living)) {
    const child = makeChild(state, null, 0);
    // the mother may not survive it; a ruler giving birth is spared, the story needs them
    if (mother === state.spouse && Math.random() < (peasant ? 0.03 : 0.02)) {
      state.spouse.alive = false;
      state.flags.widowedTurn = state.turn;
      mourn(state, state.spouse, 'spouse', 'childbirth');
      news.push(`${state.spouse.name} zemřela při porodu.`);
    }
    if (!state.heir || state.heir.alive === false) {
      state.heir = asHeir(child);
      news.push(`Narodil${fem(child) ? 'a se dcera' : ' se syn'} ${child.name}. Rod má ${fem(child) ? 'dědičku' : 'dědice'}.`);
    } else {
      state.children.push(child);
      news.push(`Narodil${fem(child) ? 'a se dcera' : ' se syn'} ${child.name}.`);
    }
    state.newborn = { name: child.name, gender: child.gender, turn: state.turn };
    state.chronicle.push(makeChronicleEntry(state, `Rodu ${state.dynastyName} se narodil${fem(child) ? 'a dcera' : ' syn'} ${child.name}.`));
  }

  // the heir's own family: a marriage when grown, then grandchildren
  if (state.heir && state.heir.alive !== false) {
    const hh = state.heir;
    hh.kids = hh.kids || [];
    if (!hh.spouse && hh.age >= 19 && Math.random() < (hh.age >= 24 ? 0.35 : 0.18)) {
      const sp = marryHeir(state, { origin: 'domluva' });
      news.push(`${hh.name} se ${fem(hh) ? 'vdala' : 'oženil'}. ${fem(hh) ? 'Manželem' : 'Manželkou'} je ${sp.name}.`);
      state.chronicle.push(makeChronicleEntry(state, `${hh.name} ${fem(hh) ? 'se vdala' : 'se oženil'}. Do rodu ${state.dynastyName} ${fem(sp) ? 'přišla' : 'přišel'} ${sp.name}.`));
    }
    const hm = fem(hh) ? hh : hh.spouse;
    const hf = fem(hh) ? hh.spouse : hh;
    if (hh.spouse && fertile(hm, hf) && hh.kids.length < 5 && Math.random() < birthChance(hm, hh.kids.length) * 0.9) {
      const k = makeChild(state, null, 0, hh.traits);
      hh.kids.push(k);
      news.push(`${hh.name} ${fem(hh) ? 'porodila' : 'má'} ${fem(k) ? 'dceru' : 'syna'} ${k.name}. Rod má ${fem(k) ? 'vnučku' : 'vnuka'}.`);
      state.chronicle.push(makeChronicleEntry(state, `${fem(hh) ? 'Dědičce' : 'Dědici'} ${hh.name} se narodil${fem(k) ? 'a dcera' : ' syn'} ${k.name}.`));
    }
  }

  // ---- advisers grow old and die; their office has to be filled ----
  for (const role of COUNCIL) {
    const c = state[role];
    if (!c || c.alive === false || c.age < 62) continue;
    if (Math.random() < Math.min(0.45, (c.age - 60) * 0.022)) {
      c.alive = false;
      state.chronicle.push(makeChronicleEntry(state, `${fem(c) ? 'Zemřela' : 'Zemřel'} ${c.name} ve věku ${c.age} let.`));
      break; // one funeral a year is enough
    }
  }

  // ---- a child ruler comes of age ----
  if (state.regent && r.age >= ADULT_AGE) {
    state.regent = null;
    news.push(`${r.name} ${fem(r) ? 'dospěla a ujímá se vlády sama' : 'dospěl a ujímá se vlády sám'}.`);
    state.chronicle.push(makeChronicleEntry(state, `${r.name} ${fem(r) ? 'dovršila' : 'dovršil'} šestnácti let. Poručnictví skončilo.`));
  }
  if (state.regent) {
    // a child ruler learns from whoever governs for them
    if (Math.random() < 0.45) {
      const keys = Object.keys(r.traits);
      const k = state.regent === 'chancellor' ? 'intelligence' : state.regent === 'parent' ? 'patience' : keys[randInt(0, keys.length - 1)];
      r.traits[k] = Math.min(10, r.traits[k] + 1);
    }
  }

  return news;
}

/** The heir died: the eldest living child takes their place (or nobody, for now). */
function promoteHeir(state, news) {
  const dead = state.heir;
  // the dead heir's own children come first, then their brothers and sisters
  const line = (dead.kids || []).filter((k) => k.alive !== false).sort((a, b) => b.age - a.age);
  if (line.length) {
    // a grandchild would inherit before an uncle, but the grandchild is not the ruler's child:
    // they join the ruler's children as wards and the eldest becomes heir
    state.heir = asHeir(line[0]);
    state.children.push(...line.slice(1));
    news.push(`${fem(state.heir) ? 'Dědičkou' : 'Dědicem'} je teď ${fem(state.heir) ? 'vnučka' : 'vnuk'} ${state.heir.name}.`);
    return;
  }
  state.children.sort((a, b) => b.age - a.age);
  const next = state.children.shift();
  if (next) {
    state.heir = asHeir(next);
    news.push(`${fem(state.heir) ? 'Dědičkou' : 'Dědicem'} je teď ${state.heir.name}.`);
  } else {
    state.heir = { ...noHeir(), name: dead.name, gender: dead.gender, age: dead.age, none: false };
  }
}

// ---------- succession ----------

/**
 * Who takes over when the ruler dies: the heir, else the eldest brother or sister.
 * Returns { person, relation } or null when the line dies out.
 */
export function successor(state) {
  ensureFamily(state);
  if (state.heir && state.heir.alive !== false) return { person: state.heir, relation: 'heir' };
  const sib = state.siblings.filter((s) => s.alive !== false).sort((a, b) => b.age - a.age)[0];
  if (sib) return { person: sib, relation: 'sibling' };
  return null;
}

/**
 * Rebuilds the household around the new ruler (who is already in state.ruler).
 * `from` is what successor() returned; `oldSpouse` the late ruler's husband or wife.
 */
export function rebuildHousehold(state, from, oldSpouse) {
  const r = state.ruler;
  const p = from.person;
  if (from.relation === 'heir') {
    // the widowed parent stays in the house; brothers and sisters stay too
    state.parent = oldSpouse && oldSpouse.alive !== false
      ? { role: 'parent', name: oldSpouse.name, gender: oldSpouse.gender, age: oldSpouse.age, alive: true }
      : null;
    state.siblings = (state.children || []).map((c) => ({ ...c }));
  } else {
    // a brother or sister inherits: the late ruler's widow(er) leaves, the parent (if any) stays
    state.siblings = state.siblings.filter((s) => s !== p);
  }

  // the new ruler's own husband or wife
  if (p.spouse) {
    state.spouse = {
      role: 'spouse', name: p.spouse.name, gender: p.spouse.gender, age: p.spouse.age,
      loyalty: clamp(65 + randInt(-8, 8)), alive: true, quirk: randomQuirk(), married: p.spouse.married,
      ...(p.spouse.origin ? { origin: p.spouse.origin } : {}),
    };
  } else if (from.relation === 'sibling' && r.age >= 22 && Math.random() < 0.7) {
    state.spouse = makeSpouse(state, r);
  } else {
    state.spouse = noSpouse(opposite(r.gender));
  }

  // the new ruler's own children
  const kids = (p.kids || []).filter((k) => k.alive !== false).sort((a, b) => b.age - a.age);
  if (!kids.length && from.relation === 'sibling' && state.spouse.alive && r.age >= 20) {
    // a married brother or sister usually already has children of their own
    const n = randInt(0, Math.min(3, Math.floor((r.age - 18) / 5)));
    for (let i = 0; i < n; i++) kids.push(makeChild(state, null, randInt(0, Math.max(0, r.age - 19)), r.traits));
    kids.sort((a, b) => b.age - a.age);
  }
  state.heir = kids.length ? asHeir(kids[0]) : noHeir();
  state.children = kids.slice(1);

  // a child on the throne needs someone to govern for them
  state.regent = null;
  if (r.age < ADULT_AGE) {
    state.regent = state.parent ? 'parent' : 'chancellor';
    state.familyQueue.push({ event: 'rodina_porucnictvi' });
  }
  delete state.flags.heir_married;
  delete state.flags.widowedTurn;
  delete state.flags.no_remarry;
}

/** A new game: the household gets brothers, sisters and ages that make sense together. */
export function newGameFamily(state) {
  ensureFamily(state);
  const r = state.ruler;
  // the heir is the ruler's child: never older than the ruler minus 17
  if (state.heir && state.heir.alive !== false) {
    state.heir.age = Math.min(state.heir.age, Math.max(0, r.age - 18));
    state.heir.kids = [];
  }
  // a few younger brothers and sisters for the heir
  const maxKidAge = Math.max(0, (state.heir ? state.heir.age : 0) - 2);
  const extra = r.age >= 26 ? randInt(0, 2) : randInt(0, 1);
  for (let i = 0; i < extra && maxKidAge >= 0; i++) {
    state.children.push(makeChild(state, null, randInt(0, maxKidAge)));
  }
  state.children.sort((a, b) => b.age - a.age);
  // a brother or sister of the ruler, so the line does not hang on one child
  if (Math.random() < 0.7) {
    const g = Math.random() < 0.5 ? 'male' : 'female';
    state.siblings.push({ name: freshName(state, g), gender: g, age: Math.max(ADULT_AGE - 2, r.age + randInt(-8, -2)), alive: true, traits: inheritTraits(r.traits) });
  }
  // the spouse is an adult close to the ruler's age
  if (state.spouse && state.spouse.alive !== false) {
    state.spouse.age = Math.max(ADULT_AGE + 1, Math.min(state.spouse.age, r.age + 6));
    state.spouse.married = 0;
  }
}
