// Love, marriage and children. A new chronicle starts unmarried and childless:
// the ruler courts someone in conversation (talk.js topics for the role
// 'suitor:<i>'), wins their heart, asks for their hand — and a child of the
// marriage becomes the heir. Children are born from pregnancies (a talk with
// the spouse, or nature now and then); the eldest living child is the heir and
// the younger ones wait in state.children. If a ruler grows old without an heir,
// a relative's child can be taken in (event f_schovanec, events_family.js).
//
// Beyond marriage: a woman (or man) with high affection can become a lover; a child of a
// lover is a bastard (state.bastards), outside the line unless acknowledged and nobody else is left.
//
// state.suitors = [{ name, gender, age, kind, affection, loyalty, lover?, quirk, traits, dowry, house?, realm? }]
// state.bastards = [{ role: 'bastard', name, gender, age, parent, acknowledged, alive }]
// state.children = [{ role: 'child', name, gender, age, traits, loyalty, alive }]
// state.pregnancy = { due }   ·   No DOM here.

import { clamp, randInt, randomName, NOBLE_HOUSES, pickRandom, clampRes } from './data.js';
import { randomQuirk } from './court.js';
import { makeChronicleEntry, inheritTraits } from './state.js';

const MAX_CHILDREN = 5; // the heir and the younger ones together
const FERTILE_UNTIL = 42; // the mother's age

// who there is to court, by stage of life: text in both genders [about a woman, about a man]
const KINDS = {
  sedlak: [
    { kind: ['mlynářova dcera', 'mlynářův syn'], text: ['Smějí se jí oči a umí počítat pytle líp než otec.', 'Silný jako kůň a o něco chytřejší, než se zdá.'], dowry: { gold: 6 } },
    { minAge: 24, kind: ['vdova po uhlíři', 'vdovec po bylinkářce'], text: ['Zná práci a bídu a nebojí se ani jednoho.', 'Tichý muž s chalupou po ženě a s rukama od práce.'], dowry: { army: 3, stability: 3 } },
    { kind: ['rychtářova neteř', 'rychtářův synovec'], text: ['Čte, píše a ví, kdo ve vsi komu dluží.', 'Mluví za dva a ve vsi ho znají všichni.'], dowry: { prestige: 5 } },
    { kind: ['dcera ovčáka z kopců', 'syn ovčáka z kopců'], text: ['Divoká jako kopce, odkud přišla.', 'Zvyklý na samotu, vítr a vlky.'], dowry: { food: 8 } },
    { kind: ['dcera krčmáře', 'syn krčmáře'], text: ['Zná každý drb ve vsi, a dřív než ostatní.', 'Umí naslouchat, když ostatní mluví.'], dowry: { gold: 4, prestige: 2 } },
    { kind: ['švadlena z Brodu', 'tovaryš z Brodu'], text: ['Šije pro měšťanky a vypráví, co se v městě nosí.', 'Prošel půl země a vrátil se s rukama plnýma řemesla.'], dowry: { gold: 5 } },
    { kind: ['dcera sedláka od lípy', 'syn sedláka od lípy'], text: ['Pracovitá, tichá a pole zná jako vlastní dlaň.', 'Pracovitý a tichý, pole zná jako vlastní dlaň.'], dowry: { food: 6, stability: 2 } },
    { kind: ['farářova hospodyně', 'kostelník od fary'], text: ['Umí trochu číst a ještě víc mlčet.', 'Zná všechny ve vsi od křtu po pohřeb.'], dowry: { faith: 5 } },
  ],
  slechtic: [
    { kind: ['dcera rytíře z pobřeží', 'syn rytíře z pobřeží'], text: ['Jezdí na koni lépe než bratři a nedá na sebe sáhnout.', 'Mladý rytíř bez půdy, ale s dobrým mečem.'], dowry: { army: 6, prestige: 3 } },
    { kind: ['dcera bohatého měšťana z Brodu', 'syn bohatého měšťana z Brodu'], text: ['Bez erbu, ale s truhlou, na kterou se dívá i dvůr.', 'Bez erbu, ale s měšcem a s rozumem kupce.'], dowry: { gold: 20 } },
    { kind: ['dvorní dáma královny', 'královský páže'], text: ['Zná dvůr zevnitř a ví, kdo s kým mluví.', 'Vyrostl u dvora a zná každou chodbu hradu.'], dowry: { favor: 8 } },
    { house: true, kind: ['dcera rodu {house}', 'syn rodu {house}'], text: ['Krev starého rodu. Sňatek s ní by byl i spojenectvím.', 'Krev starého rodu. Sňatek s ním by byl i spojenectvím.'], dowry: { gold: 10, legitimacy: 4 } },
    { minAge: 24, kind: ['mladá vdova po zemanovi', 'mladý vdovec po zemance'], text: ['Spravuje statek sama a nikdo jí nic nedaruje.', 'Spravuje statek sám a ví, co stojí každý groš.'], dowry: { gold: 8, food: 4 } },
    { kind: ['dcera purkrabího', 'syn purkrabího'], text: ['Vyrostla na hradbách mezi strážemi a zná řeč vojáků.', 'Vyrostl na hradbách mezi strážemi a umí velet.'], dowry: { army: 4, stability: 3 } },
  ],
  panovnik: [
    { realm: 'east', kind: ['princezna z Východních marek', 'princ z Východních marek'], text: ['Vyrostla mezi vojáky a nebojí se ničeho.', 'Bojovník, který zná hranici z obou stran.'], dowry: { army: 10 } },
    { realm: 'south', kind: ['princezna z Jižní říše', 'princ z Jižní říše'], text: ['Mluví pěti jazyky a usmívá se jako diplomat.', 'Vzdělaný, bohatý a nikdy nemluví nahlas.'], dowry: { gold: 30 } },
    { realm: 'north', kind: ['dcera velkého náčelníka ze severu', 'syn velkého náčelníka ze severu'], text: ['Nosí kožešiny i na hostinách a směje se nahlas.', 'Mohutný a přímý, jako zimní vítr.'], dowry: { army: 6, prestige: 4 } },
    { house: true, kind: ['dcera rodu {house}', 'syn rodu {house}'], text: ['Sňatek s domácím rodem uklidní šlechtu.', 'Sňatek s domácím rodem uklidní šlechtu.'], dowry: { legitimacy: 8, stability: 4 } },
    { kind: ['dvorní dáma s ostrým jazykem', 'dvořan s ostrým jazykem'], text: ['Krásná, vtipná a nebezpečná. Dvůr se jí bojí i obdivuje.', 'Vtipný a nebezpečný. Dvůr se ho bojí i obdivuje.'], dowry: { prestige: 6 } },
    { kind: ['neteř arcibiskupa', 'synovec arcibiskupa'], text: ['Zbožná na pohled, zvědavá v duši.', 'Zbožný na pohled, ctižádostivý v duši.'], dowry: { faith: 6, legitimacy: 4 } },
  ],
};

const f = (c) => c.gender === 'female';

export function isMarried(state) {
  return !!(state.spouse && state.spouse.alive !== false);
}

/** The person behind a role: a court member, a suitor ('suitor:1') or a younger child ('child:0'). */
export function personOf(state, role) {
  if (typeof role !== 'string') return null;
  const [kind, i] = role.split(':');
  if (kind === 'suitor') return (state.suitors || [])[Number(i)] || null;
  if (kind === 'child') return (state.children || [])[Number(i)] || null;
  if (kind === 'sibling') return (state.siblings || [])[Number(i)] || null;
  if (kind === 'bastard') return (state.bastards || [])[Number(i)] || null;
  return state[role] || null;
}

export function suitorLabel(c) {
  return c.kindLabel || (f(c) ? 'Nápadnice' : 'Nápadník');
}

function usedNames(state) {
  return new Set([...(state.pastSuitorNames || []), ...(state.bastards || []).map((x) => x.name),state.ruler.name, state.heir && state.heir.name, state.spouse && state.spouse.name,
    ...(state.suitors || []).map((x) => x.name), ...(state.children || []).map((x) => x.name),
    ...(state.siblings || []).map((x) => x.name), ...['chancellor', 'marshal', 'spymaster'].map((r) => state[r] && state[r].name)]);
}

function freshName(state, gender) {
  const used = usedNames(state);
  let name = randomName(gender);
  for (let i = 0; i < 80 && used.has(name); i++) name = randomName(gender);
  return name;
}

function newSuitor(state) {
  const gender = state.ruler.gender === 'female' ? 'male' : 'female';
  const pool = KINDS[state.scenario] || KINDS.sedlak;
  const taken = (state.suitors || []).map((x) => x.kindKey);
  const options = pool.map((k, i) => [k, i]).filter(([, i]) => !taken.includes(i));
  const [k, i] = pickRandom(options.length ? options : pool.map((x, j) => [x, j]));
  const g = gender === 'female' ? 0 : 1;
  let house = null;
  if (k.house && state.houses && state.houses.length) house = pickRandom(state.houses).id;
  const houseGen = house ? NOBLE_HOUSES.find((d) => d.id === house).gen : '';
  return {
    name: freshName(state, gender), gender,
    age: clamp(state.ruler.age + randInt(-6, 3), k.minAge || 17, 45),
    kindKey: i, kindLabel: k.kind[g].replace('{house}', houseGen), bio: k.text[g],
    affection: randInt(10, 30), loyalty: randInt(35, 55), quirk: randomQuirk(), traits: inheritTraits(),
    dowry: { ...k.dowry }, house, realm: k.realm || null, alive: true,
    portrait: `suitor_${state.scenario}_${i}_${gender}`, // assets/portraits, see docs/obrazky-rodina.md
  };
}

// how many people to court: a choice of five while single, three around the court once married
const COURT_SIZE = (state) => (isMarried(state) ? 3 : 5);

/** Keeps people to court (and lovers) while the ruler is young enough. */
export function refreshSuitors(state) {
  if (state.ruler.age > 60 || state.ruler.age < 16 || state.gameOver) { state.suitors = (state.suitors || []).filter((x) => x.lover); return; }
  state.suitors = (state.suitors || []).filter((x) => x.stage === state.scenario || x.lover);
  for (const x of state.suitors) {
    // suitors from an older save get their face and a loyalty too
    if (!x.portrait && x.kindKey !== undefined) x.portrait = `suitor_${x.stage}_${x.kindKey}_${x.gender}`;
    if (x.loyalty === undefined) x.loyalty = 45;
  }
  while (state.suitors.length < COURT_SIZE(state)) state.suitors.push({ ...newSuitor(state), stage: state.scenario });
  // once married, the circle shrinks — lovers stay
  while (state.suitors.length > COURT_SIZE(state) && state.suitors.some((x) => !x.lover)) {
    const i = state.suitors.findIndex((x) => !x.lover);
    rememberSuitor(state, state.suitors[i]);
    state.suitors.splice(i, 1);
  }
}

function rememberSuitor(state, s) {
  state.pastSuitorNames = state.pastSuitorNames || [];
  if (!state.pastSuitorNames.includes(s.name)) state.pastSuitorNames.push(s.name);
}

/** Marries a suitor: they become the spouse, the dowry comes in. Returns the chronicle text. */
export function marry(state, i, { arranged = false } = {}) {
  const s = state.suitors[i];
  if (!s) return '';
  state.spouse = {
    role: 'spouse', name: s.name, gender: s.gender, age: s.age, alive: true,
    loyalty: clamp(55 + Math.round(s.affection / 4)), quirk: s.quirk, traits: s.traits, portrait: s.portrait,
    bio: `${s.kindLabel[0].toUpperCase()}${s.kindLabel.slice(1)}. ${s.bio} ${arranged ? 'Sňatek domluvil dohazovač; láska se teprve ukáže.' : 'Svatba z lásky, ne z povinnosti.'}`,
  };
  for (const [k, v] of Object.entries(s.dowry || {})) if (state.resources[k] !== undefined) state.resources[k] = clampRes(k, state.resources[k] + v);
  if (s.house) {
    const h = state.houses.find((x) => x.id === s.house);
    if (h) { h.attitude = clamp(h.attitude + 20); h.married = true; }
  }
  if (s.realm && state.realms && state.realms[s.realm]) state.realms[s.realm].attitude = clamp(state.realms[s.realm].attitude + 20);
  rememberSuitor(state, s);
  state.suitors.splice(i, 1);
  refreshSuitors(state);
  if (!arranged) state.flags.married_for_love = true;
  const text = `Svatba: ${state.ruler.name} a ${s.name}, ${s.kindLabel}. Svatba se slavila tři dny.`;
  state.chronicle.push(makeChronicleEntry(state, text));
  return text;
}

/** Can the couple have a child now? */
export function canConceive(state) {
  if (!isMarried(state) || state.pregnancy || state.ruler.age < 16) return false;
  const mother = f(state.ruler) ? state.ruler : state.spouse;
  const kids = (state.heir && state.heir.alive !== false ? 1 : 0) + (state.children || []).filter((c) => c.alive !== false).length;
  return mother.age <= FERTILE_UNTIL && kids < MAX_CHILDREN;
}

/** The chance a wish for a child comes true this season, by the mother's age. */
export function conceiveChance(state) {
  const mother = f(state.ruler) ? state.ruler : state.spouse;
  return Math.max(0.15, Math.min(0.75, 0.75 - Math.max(0, mother.age - 26) * 0.035));
}

export function startPregnancy(state) {
  state.pregnancy = { due: state.turn + 3 };
}

/** A child is born: the heir if there is none, otherwise a younger child. Returns the child. */
export function bearChild(state) {
  const gender = Math.random() < 0.5 ? 'male' : 'female';
  // the child leans toward both parents' strengths
  const parent = { ...state.ruler.traits };
  if (state.spouse && state.spouse.traits) for (const k of Object.keys(parent)) parent[k] = Math.round((parent[k] + state.spouse.traits[k]) / 2);
  const child = { role: 'heir', name: freshName(state, gender), gender, age: 0, loyalty: clamp(70 + randInt(-5, 10)), alive: true, traits: inheritTraits(parent) };
  state.children = state.children || [];
  // the ruler's own child takes the place of a brother or sister who only held it (engine.js)
  if (state.heir && state.heir.alive !== false && state.heir.presumptive) {
    const { presumptive, ...sib } = state.heir;
    (state.siblings = state.siblings || []).push({ ...sib, role: 'sibling' });
    state.heir = child;
  } else if (!state.heir || state.heir.alive === false) state.heir = child;
  else if (maleFirst(state) && state.heir.gender === 'female' && !state.heir.bastard && gender === 'male') {
    // custom: a son comes before an older daughter unless the ruler decides otherwise (event dedicke_pravo, makeHeir)
    const old = state.heir;
    state.children.push({ ...old, role: 'child' });
    state.heir = child;
    state.lastSwap = { son: child.name, daughter: old.name, fresh: true };
  } else state.children.push({ ...child, role: 'child' });
  state.lastBirth = { name: child.name, gender, heir: state.heir === child };
  state.lastBirthTurn = state.turn;
  return child;
}

/** The custom of the house: sons inherit before daughters unless the ruler chose otherwise. */
export function maleFirst(state) {
  return state.heirPolicy !== 'eldest';
}

/** The ruler names a younger child heir (the old heir joins the others). Returns the chronicle line. */
export function makeHeir(state, i) {
  const next = (state.children || [])[i];
  if (!next || next.alive === false || !state.heir || state.heir.alive === false || state.heir.presumptive) return '';
  const old = state.heir;
  state.children = state.children.filter((c) => c !== next);
  state.children.push({ ...old, role: 'child' });
  state.heir = { ...next, role: 'heir' };
  // the choice becomes the house's custom: a daughter over a son means eldest first, a son over a daughter, sons first
  const all = [old, ...state.children];
  if (f(next) && all.some((c) => !f(c) && c.alive !== false)) state.heirPolicy = 'eldest';
  else if (!f(next) && all.some((c) => f(c) && c.alive !== false)) state.heirPolicy = 'male';
  const text = `${state.ruler.name} ${f(state.ruler) ? 'určila' : 'určil'} za ${f(next) ? 'dědičku' : 'dědice'} rodu ${state.dynastyName}: ${next.name}.`;
  state.chronicle.push(makeChronicleEntry(state, text));
  return text;
}

/** The ruler keeps the firstborn daughter as heir after a son was born (event dedicke_pravo). */
export function keepDaughterHeir(state) {
  const sw = state.lastSwap;
  const i = sw ? (state.children || []).findIndex((c) => c.name === sw.daughter) : -1;
  if (i >= 0) { makeHeir(state, i); state.heirPolicy = 'eldest'; }
}

/** The eldest living younger child steps up when the heir is gone. Returns true when it happened. */
export function nextHeir(state) {
  if (state.heir && state.heir.alive !== false) return false;
  const kids = (state.children || []).filter((c) => c.alive !== false)
    .sort((a, b) => (maleFirst(state) ? (b.gender === 'male') - (a.gender === 'male') : 0) || b.age - a.age);
  if (!kids.length) {
    // no child of their own: the eldest brother or sister holds the place
    const sibs = (state.siblings || []).filter((c) => c.alive !== false).sort((a, b) => b.age - a.age);
    if (!sibs.length) {
      // last of all an acknowledged bastard — better than the house dying out
      const b = (state.bastards || []).filter((c) => c.alive !== false && c.acknowledged).sort((x, y) => y.age - x.age)[0];
      if (!b) return false;
      state.bastards = state.bastards.filter((c) => c !== b);
      state.heir = { ...b, role: 'heir', presumptive: true, bastard: true };
      state.chronicle.push(makeChronicleEntry(state, `${b.name}, ${f(b) ? 'uznaná levobočka' : 'uznaný levoboček'}, je teď jedinou nadějí rodu ${state.dynastyName}.`));
      return true;
    }
    state.siblings = state.siblings.filter((c) => c !== sibs[0]);
    state.heir = { ...sibs[0], role: 'heir', presumptive: true };
    state.chronicle.push(makeChronicleEntry(state, `${sibs[0].name} je teď ${f(sibs[0]) ? 'dědičkou' : 'dědicem'} rodu ${state.dynastyName}, dokud se nenarodí dítě.`));
    return true;
  }
  const next = kids[0];
  state.children = state.children.filter((c) => c !== next);
  state.heir = { ...next, role: 'heir' };
  state.chronicle.push(makeChronicleEntry(state, `${next.name} je teď ${f(next) ? 'dědičkou' : 'dědicem'} rodu ${state.dynastyName}.`));
  return true;
}

/**
 * Every season: pregnancies come to term (the birth event), children grow, the heir's place is
 * filled. A child comes only when the player wants one (talk 'dite', event touha_po_diteti). Returns news lines.
 */
export function processFamily(state) {
  const news = [];
  state.children = state.children || [];
  if (state.pregnancy && state.turn >= state.pregnancy.due) {
    state.pregnancy = null;
    bearChild(state);
    news.push(`Narodilo se dítě: ${state.lastBirth.name}.`);
    if (!state.pendingEvent) state.pendingEvent = 'narozeni';
    else (state.eventQueue = state.eventQueue || []).unshift('narozeni');
    if (state.lastSwap && state.lastSwap.fresh) {
      state.lastSwap.fresh = false;
      (state.eventQueue = state.eventQueue || []).push('dedicke_pravo'); // right after the birth card
    }
  }
  if (state.seasonIndex === 0) {
    for (const c of state.children) if (c.alive !== false) c.age += 1;
    for (const c of state.siblings || []) {
      if (c.alive === false) continue;
      c.age += 1;
      // brothers and sisters do not live forever either
      if (Math.random() < 0.004 + Math.max(0, c.age - 45) * 0.02) {
        c.alive = false;
        news.push(`${f(c) ? 'Zemřela sestra' : 'Zemřel bratr'} ${c.name} (${c.age} let).`);
        state.chronicle.push(makeChronicleEntry(state, `${f(c) ? 'Zemřela' : 'Zemřel'} ${c.name}, ${f(c) ? 'sestra' : 'bratr'} ${state.scenario === 'sedlak' ? (f(state.ruler) ? 'hospodyně' : 'hospodáře') : state.scenario === 'slechtic' ? (f(state.ruler) ? 'paní' : 'pána') : (f(state.ruler) ? 'vládkyně' : 'vládce')} z rodu ${state.dynastyName}.`));
      }
    }
    if (state.siblings) state.siblings = state.siblings.filter((c) => c.alive !== false);
    for (const s of state.suitors || []) s.age += 1;
    // a suitor who waits too long marries someone else
    if ((state.suitors || []).length && Math.random() < 0.25) {
      const i = randInt(0, state.suitors.length - 1);
      const gone = state.suitors[i];
      if (gone.lover) { /* a lover does not leave with a year's notice — see processLovers */ } else if (!gone.warned) {
        // a year's warning first
        gone.warned = true;
        news.push(`${gone.name} (${gone.kindLabel}) už nebude čekat věčně. ${f(gone) ? 'Ucházejí se o ni' : 'Ucházejí se o něj'} i jiní.`);
      } else {
        news.push(`${gone.name} (${gone.kindLabel}) ${f(gone) ? 'se vdala' : 'se oženil'} jinam.`);
        rememberSuitor(state, gone);
        state.suitors.splice(i, 1);
      }
    }
  }
  news.push(...processLovers(state));
  if (nextHeir(state)) news.push(`Novým dědicem je ${state.heir.name}.`);
  // "we have enough children" holds only while there is a child of their own
  const ownLeft = (state.heir && state.heir.alive !== false && !state.heir.presumptive) || state.children.some((c) => c.alive !== false);
  if (state.flags && state.flags.no_more_children && !ownLeft) delete state.flags.no_more_children;
  refreshSuitors(state);
  return news;
}

// ---------- lovers and bastards ----------

/** The woman (or man) the ruler courts takes the ruler as a lover. */
export function takeLover(state, i) {
  const s = state.suitors[i];
  if (!s) return;
  s.lover = true;
  s.loverSince = state.turn;
  s.loyalty = clamp(s.loyalty + 10);
}

/** A lover can bear a child while she is young enough and not already expecting. */
export function loverCanConceive(state, i) {
  const s = state.suitors[i];
  if (!s || !s.lover || state.loverPregnancy) return false;
  const mother = f(state.ruler) ? state.ruler : s;
  return mother.age <= FERTILE_UNTIL;
}

export function loverConceiveChance(state, i) {
  const s = state.suitors[i];
  const mother = f(state.ruler) ? state.ruler : s;
  return Math.max(0.15, Math.min(0.7, 0.7 - Math.max(0, mother.age - 26) * 0.035));
}

export function startLoverPregnancy(state, i) {
  state.loverPregnancy = { due: state.turn + 3, parent: state.suitors[i].name };
}

/** A child of a lover: a bastard of the house. Returns the child. */
function bearBastard(state) {
  const gender = Math.random() < 0.5 ? 'male' : 'female';
  const parent = state.loverPregnancy.parent;
  const child = { role: 'bastard', name: freshName(state, gender), gender, age: 0, parent, acknowledged: false,
    loyalty: clamp(55 + randInt(-5, 10)), alive: true, traits: inheritTraits(state.ruler.traits) };
  (state.bastards = state.bastards || []).push(child);
  state.lastBastard = { name: child.name, gender, parent };
  return child;
}

/** Acknowledges a bastard: the child carries the house's name and may inherit when nobody else is left. */
export function acknowledgeBastard(state, name) {
  const b = (state.bastards || []).find((x) => x.name === name);
  if (b) b.acknowledged = true;
}

/**
 * Every season: a lover's child is born; every spring lovers drift — a neglected or disloyal
 * lover may let the affair out, and the spouse finds out. Returns news lines.
 */
function processLovers(state) {
  const news = [];
  if (state.loverPregnancy && state.turn >= state.loverPregnancy.due) {
    const b = bearBastard(state);
    state.loverPregnancy = null;
    news.push(f(state.ruler) ? `Narodilo se ti nemanželské dítě, ${f(b) ? 'dcera' : 'syn'} ${b.name}.` : `${b.parent} porodila ${f(b) ? 'dceru' : 'syna'}: ${b.name}.`);
    if (!state.pendingEvent) state.pendingEvent = 'narozeni_levobocka';
    else (state.eventQueue = state.eventQueue || []).unshift('narozeni_levobocka');
  }
  if (state.seasonIndex !== 0) return news;
  for (const c of state.bastards || []) if (c.alive !== false) c.age += 1;
  for (const s of (state.suitors || []).filter((x) => x.lover)) {
    // a lover left alone for a year cools
    if (s.talkTurn === undefined || state.turn - s.talkTurn > 4) { s.loyalty = clamp(s.loyalty - 6); s.affection = clamp(s.affection - 4); }
    if (isMarried(state) && !state.spouse.knowsAffair && Math.random() < (s.loyalty < 30 ? 0.35 : 0.06)) {
      state.spouse.knowsAffair = true;
      state.spouse.loyalty = clamp(state.spouse.loyalty - 20);
      state.resources.prestige = clamp(state.resources.prestige - 3);
      const t = `${state.spouse.name} se ${f(state.spouse) ? 'dozvěděla' : 'dozvěděl'} o ${f(s) ? 'milence' : 'milenci'} jménem ${s.name}. V domě je od té doby chladno.`;
      news.push(t);
      state.chronicle.push(makeChronicleEntry(state, t));
    }
    if (s.loyalty <= 5 && s.affection < 30) {
      s.lover = false;
      const t = `${s.name} ukončil${f(s) ? 'a' : ''} poměr. Prý už nechce čekat na někoho, kdo nepřichází.`;
      news.push(t);
    }
  }
  return news;
}
