// Love, marriage and children. A new chronicle starts unmarried and childless:
// the ruler courts someone in conversation (talk.js topics for the role
// 'suitor:<i>'), wins their heart, asks for their hand — and a child of the
// marriage becomes the heir. Children are born from pregnancies (a talk with
// the spouse, or nature now and then); the eldest living child is the heir and
// the younger ones wait in state.children. If a ruler grows old without an heir,
// a relative's child can be taken in (event f_schovanec, events_family.js).
//
// state.suitors = [{ name, gender, age, kind, affection, quirk, traits, dowry, house?, realm? }]
// state.children = [{ role: 'child', name, gender, age, traits, loyalty, alive }]
// state.pregnancy = { due }   ·   No DOM here.

import { clamp, randInt, randomName, NOBLE_HOUSES, pickRandom } from './data.js';
import { randomQuirk } from './court.js';
import { makeChronicleEntry, inheritTraits } from './state.js';

const MAX_CHILDREN = 5; // the heir and the younger ones together
const FERTILE_UNTIL = 42; // the mother's age

// who there is to court, by stage of life: text in both genders [about a woman, about a man]
const KINDS = {
  sedlak: [
    { kind: ['mlynářova dcera', 'mlynářův syn'], text: ['Smějí se jí oči a umí počítat pytle líp než otec.', 'Silný jako kůň a o něco chytřejší, než se zdá.'], dowry: { gold: 6 } },
    { kind: ['vdova po kovářovi', 'vdovec po kovářce'], text: ['Zná práci a bídu a nebojí se ani jednoho.', 'Tichý muž s rukama od sazí a s chalupou po ženě.'], dowry: { army: 3, stability: 3 } },
    { kind: ['rychtářova neteř', 'rychtářův synovec'], text: ['Čte, píše a ví, kdo ve vsi komu dluží.', 'Mluví za dva a ve vsi ho znají všichni.'], dowry: { prestige: 5 } },
    { kind: ['dcera ovčáka z kopců', 'syn ovčáka z kopců'], text: ['Divoká jako kopce, odkud přišla.', 'Zvyklý na samotu, vítr a vlky.'], dowry: { food: 8 } },
    { kind: ['dcera krčmáře', 'syn krčmáře'], text: ['Zná každý drb ve vsi, a dřív než ostatní.', 'Umí naslouchat, když ostatní mluví.'], dowry: { gold: 4, prestige: 2 } },
  ],
  slechtic: [
    { kind: ['dcera rytíře z pobřeží', 'syn rytíře z pobřeží'], text: ['Jezdí na koni lépe než bratři a nedá na sebe sáhnout.', 'Mladý rytíř bez půdy, ale s dobrým mečem.'], dowry: { army: 6, prestige: 3 } },
    { kind: ['dcera bohatého měšťana z Brodu', 'syn bohatého měšťana z Brodu'], text: ['Bez erbu, ale s truhlou, na kterou se dívá i dvůr.', 'Bez erbu, ale s měšcem a s rozumem kupce.'], dowry: { gold: 20 } },
    { kind: ['dvorní dáma královny', 'královský páže'], text: ['Zná dvůr zevnitř a ví, kdo s kým mluví.', 'Vyrostl u dvora a zná každou chodbu hradu.'], dowry: { favor: 8 } },
    { house: true, kind: ['dcera rodu {house}', 'syn rodu {house}'], text: ['Krev starého rodu. Sňatek s ní by byl i spojenectvím.', 'Krev starého rodu. Sňatek s ním by byl i spojenectvím.'], dowry: { gold: 10, legitimacy: 4 } },
  ],
  panovnik: [
    { realm: 'east', kind: ['princezna z Východních marek', 'princ z Východních marek'], text: ['Vyrostla mezi vojáky a nebojí se ničeho.', 'Bojovník, který zná hranici z obou stran.'], dowry: { army: 10 } },
    { realm: 'south', kind: ['princezna z Jižní říše', 'princ z Jižní říše'], text: ['Mluví pěti jazyky a usmívá se jako diplomat.', 'Vzdělaný, bohatý a nikdy nemluví nahlas.'], dowry: { gold: 30 } },
    { realm: 'north', kind: ['dcera velkého náčelníka ze severu', 'syn velkého náčelníka ze severu'], text: ['Nosí kožešiny i na hostinách a směje se nahlas.', 'Mohutný a přímý, jako zimní vítr.'], dowry: { army: 6, prestige: 4 } },
    { house: true, kind: ['dcera rodu {house}', 'syn rodu {house}'], text: ['Sňatek s domácím rodem uklidní šlechtu.', 'Sňatek s domácím rodem uklidní šlechtu.'], dowry: { legitimacy: 8, stability: 4 } },
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
  return state[role] || null;
}

export function suitorLabel(c) {
  return c.kindLabel || (f(c) ? 'Nápadnice' : 'Nápadník');
}

function usedNames(state) {
  return new Set([state.ruler.name, state.heir && state.heir.name, state.spouse && state.spouse.name,
    ...(state.suitors || []).map((x) => x.name), ...(state.children || []).map((x) => x.name)]);
}

function freshName(state, gender) {
  const used = usedNames(state);
  let name = randomName(gender);
  for (let i = 0; i < 20 && used.has(name); i++) name = randomName(gender);
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
    age: clamp(state.ruler.age + randInt(-6, 3), 17, 45),
    kindKey: i, kindLabel: k.kind[g].replace('{house}', houseGen), bio: k.text[g],
    affection: randInt(10, 30), quirk: randomQuirk(), traits: inheritTraits(),
    dowry: { ...k.dowry }, house, realm: k.realm || null, alive: true,
    portrait: `suitor_${state.scenario}_${i}_${gender}`, // assets/portraits, see docs/obrazky-rodina.md
  };
}

/** Keeps three people to court while the ruler is unmarried and young enough; none once married. */
export function refreshSuitors(state) {
  if (isMarried(state) || state.ruler.age > 60 || state.gameOver) { state.suitors = []; return; }
  state.suitors = (state.suitors || []).filter((x) => x.stage === state.scenario);
  // suitors from an older save get their face too
  for (const x of state.suitors) if (!x.portrait && x.kindKey !== undefined) x.portrait = `suitor_${x.stage}_${x.kindKey}_${x.gender}`;
  while (state.suitors.length < 3) state.suitors.push({ ...newSuitor(state), stage: state.scenario });
}

/** Marries a suitor: they become the spouse, the dowry comes in. Returns the chronicle text. */
export function marry(state, i) {
  const s = state.suitors[i];
  if (!s) return '';
  state.spouse = {
    role: 'spouse', name: s.name, gender: s.gender, age: s.age, alive: true,
    loyalty: clamp(55 + Math.round(s.affection / 4)), quirk: s.quirk, traits: s.traits, portrait: s.portrait,
    bio: `${s.kindLabel[0].toUpperCase()}${s.kindLabel.slice(1)}. ${s.bio} Svatba z lásky, ne z povinnosti.`,
  };
  for (const [k, v] of Object.entries(s.dowry || {})) if (state.resources[k] !== undefined) state.resources[k] = clamp(state.resources[k] + v);
  if (s.house) {
    const h = state.houses.find((x) => x.id === s.house);
    if (h) { h.attitude = clamp(h.attitude + 20); h.married = true; }
  }
  if (s.realm && state.realms && state.realms[s.realm]) state.realms[s.realm].attitude = clamp(state.realms[s.realm].attitude + 20);
  state.suitors = [];
  state.flags.married_for_love = true;
  const text = `${state.ruler.name} ${f(state.ruler) ? 'se provdala za' : 'se oženil s'} ${s.name}, ${s.kindLabel}. Svatba se slavila tři dny.`;
  state.chronicle.push(makeChronicleEntry(state, text));
  return text;
}

/** Can the couple have a child now? */
export function canConceive(state) {
  if (!isMarried(state) || state.pregnancy) return false;
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
  if (!state.heir || state.heir.alive === false) state.heir = child;
  else state.children.push({ ...child, role: 'child' });
  state.lastBirth = { name: child.name, gender, heir: state.heir === child };
  return child;
}

/** The eldest living younger child steps up when the heir is gone. Returns true when it happened. */
export function nextHeir(state) {
  if (state.heir && state.heir.alive !== false) return false;
  const kids = (state.children || []).filter((c) => c.alive !== false).sort((a, b) => b.age - a.age);
  if (!kids.length) return false;
  const next = kids[0];
  state.children = state.children.filter((c) => c !== next);
  state.heir = { ...next, role: 'heir' };
  state.chronicle.push(makeChronicleEntry(state, `${next.name} je teď ${f(next) ? 'dědičkou' : 'dědicem'} rodu ${state.dynastyName}.`));
  return true;
}

/**
 * Every season: pregnancies come to term (the birth event), children grow, the heir's place is
 * filled, now and then a married couple has a child without asking. Returns news lines.
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
  }
  if (state.seasonIndex === 0) {
    for (const c of state.children) if (c.alive !== false) c.age += 1;
    for (const s of state.suitors || []) s.age += 1;
    // nature does not always wait to be asked
    if (canConceive(state) && Math.random() < conceiveChance(state) * 0.25) startPregnancy(state);
    // a suitor who waits too long marries someone else
    if ((state.suitors || []).length && Math.random() < 0.25) {
      const i = randInt(0, state.suitors.length - 1);
      const gone = state.suitors[i];
      news.push(`${gone.name} (${gone.kindLabel}) ${f(gone) ? 'se vdala' : 'se oženil'} jinam.`);
      state.suitors.splice(i, 1);
    }
  }
  if (nextHeir(state)) news.push(`Novým dědicem je ${state.heir.name}.`);
  refreshSuitors(state);
  return news;
}
