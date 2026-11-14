// Houses (js/houses.js, js/events_houses.js): node tools/sim/test_houses.mjs
// 1) every house event, every choice, success and failure, in the noble and the king stage, for both genders:
//    no unresolved tokens, no exceptions;  2) the panel actions (gift, levy, favour, fief, marriage, taming),
//    mending of old saves, symmetric relations, muster sums, the peasant's lord.
const root = new URL('../../js/', import.meta.url).href;
const S = await import(root + 'state.js');
const E = await import(root + 'engine.js');
const ev = await import(root + 'events.js');
const H = await import(root + 'events_houses.js');

function world(scenario, gender) {
  const st = S.createNewGame('Bořek', 'Vlčí', gender, 'slechtic');
  if (scenario === 'panovnik') S.crownNoble(st);
  st.turn = 60; st.year = 15; st.seasonIndex = 0;
  st.resources.gold = 200; st.resources.army = 60; st.resources.food = 80;
  st.heir.age = 18; st.heir.alive = true;
  if (scenario === 'slechtic') st.king.age = 50;
  st.houses.forEach((h) => { h.power = 75; h.attitude = 50; h.head.age = 65; });
  // a feud and a friendship
  st.houses[1].rel.sokolove = -70; st.houses[2].rel.rudi = -70;
  st.houses[0].rel.soudci = 60; st.houses[7].rel.brana = 60;
  st.houses[3].rel.ricane = 60; st.houses[5].rel.jelenove = 60;
  st.houses[4].attitude = 30; st.houses[4].rebelPending = scenario === 'panovnik';
  return st;
}

let problems = 0;
const bad = (m) => { problems++; console.log('PROBLEM', m); };
const orig = Math.random;
for (const e of H.HOUSE_EVENTS) {
  const scenarios = e.scenarios || [e.scenario];
  for (const sc of scenarios) {
    for (const gender of ['male', 'female']) {
      const base = world(sc, gender);
      base.pendingEvent = e.id;
      const probe = structuredClone(base);
      const picked = E.pickNextEvent(probe);
      if (!picked || picked.id !== e.id) { bad(`${e.id}/${sc}: not raised (${picked && picked.id})`); continue; }
      const ctx = probe.eventContext;
      if (!ctx || !ctx.house) { bad(`${e.id}/${sc}: no house context`); continue; }
      const txt = E.interpolate(probe, e.title + ' ' + e.text);
      if (/[{}]/.test(txt)) bad(`${e.id}/${sc}/${gender}: unresolved text: ${txt.match(/\{[^}]*\}?/)}`);
      e.choices.forEach((c, i) => {
        if (c.requires && !c.requires(probe)) return;
        const lab = E.interpolate(probe, c.label);
        if (/[{}]/.test(lab)) bad(`${e.id}/${sc}: label ${lab}`);
        for (const r of [0.01, 0.99]) {
          const st = structuredClone(base);
          st.pendingEvent = e.id;
          Math.random = () => r;
          let out;
          try {
            const ev2 = E.pickNextEvent(st);
            out = E.resolveChoice(st, ev2, i);
          } catch (err) { bad(`${e.id}/${sc}/c${i}/r${r}: ${err.stack.split('\n').slice(0, 3).join(' | ')}`); Math.random = orig; continue; }
          Math.random = orig;
          const all = [out.text || '', ...(st.chronicle.slice(-2).map((x) => x.text)), ...(out.notes || []).map((n) => n.text)].join(' ');
          if (/[{}]|undefined|NaN/.test(all)) bad(`${e.id}/${sc}/c${i}/r${r}: ${all.match(/.{0,30}([{}]|undefined|NaN).{0,30}/)}`);
        }
      });
    }
  }
}
console.log('house events:', H.HOUSE_EVENTS.length, 'problems:', problems);

// ---------- panel actions and the rest ----------
const HH = await import(root + 'houses.js');
const D = await import(root + 'data.js');
let actionFailures = 0;
const ok = (c, m) => { if (!c) { actionFailures++; console.log('FAIL', m); } };

// noble: gift
let st = S.createNewGame('Bořek', 'Vlčí', 'male', 'slechtic');
st.resources.gold = 30;
let acts = HH.houseActions(st, 'brana');
ok(acts.length === 1 && acts[0].key === 'gift' && acts[0].ok, 'noble gift available');
const before = st.houses[0].attitude;
let r = HH.doHouseAction(st, 'brana', 'gift');
ok(r.ok && st.houses[0].attitude === Math.min(100, before + 7) && st.resources.gold === 22, 'gift applied');
ok(!HH.houseActions(st, 'brana')[0].ok, 'cooldown after gift');
ok(!HH.doHouseAction(st, 'brana', 'gift').ok, 'second gift refused');

// king: all actions
st = S.createNewGame('Bořek', 'Vlčí', 'female', 'slechtic');
S.crownNoble(st);
st.resources.gold = 100; st.resources.army = 10; st.heir.age = 17; st.heir.alive = true;
st.houses.forEach((h) => { h.attitude = 60; h.power = 70; });
const id = 'jelenove';
acts = HH.houseActions(st, id);
console.log('king actions', acts.map((a) => `${a.key}:${a.ok}`).join(' '));
const keys = ['muster', 'favor', 'fief', 'marry', 'tame'];
for (const k of keys) {
  st.turn += 5;
  const h = st.houses.find((x) => x.id === id);
  const prev = { army: st.resources.army, gold: st.resources.gold, att: h.attitude, power: h.power };
  const res = HH.doHouseAction(st, id, k);
  ok(res.ok, `${k} ok: ${res.text}`);
  ok(/[{}]|undefined|NaN/.test(res.text) === false, `${k} text: ${res.text}`);
  console.log(k, '->', res.text);
  if (k === 'muster') ok(st.resources.army > prev.army && h.attitude === prev.att - 4, 'muster gave men');
  if (k === 'fief') ok(h.fief && h.power === prev.power + 8, 'fief');
  if (k === 'marry') ok(h.married && h.ally && st.flags.heir_married, 'marry');
}
// muster numbers
for (const h of st.houses) {
  const m = HH.houseMuster(h);
  ok(m.spear + m.archer + m.horse === m.total, `muster sum ${h.id}`);
  const def = D.NOBLE_HOUSES.find((d) => d.id === h.id);
  const w = def.troops.spear + def.troops.archer + def.troops.horse;
  ok(Math.abs(w - 1) < 1e-9, `troops weights ${h.id} = ${w}`);
}
console.log('muster per house at power 70:', st.houses.map((h) => `${h.id}:${HH.houseMuster(h).total}`).join(' '));
// old save mending
const old = S.createNewGame('A', 'B', 'male', 'slechtic');
old.houses = old.houses.slice(0, 3).map((h) => { const { rel, ...rest } = h; return rest; });
ok(HH.housesNeedMending(old), 'old save needs mending');
HH.ensureHouses(old);
ok(old.houses.length === 8 && old.houses.every((h) => h.rel && Object.keys(h.rel).length === 7), 'mended');
// rel symmetric
const rs = S.createNewGame('A', 'B', 'male', 'slechtic');
let sym = true;
for (const a of rs.houses) for (const b of rs.houses) if (a !== b && a.rel[b.id] !== b.rel[a.id]) sym = false;
ok(sym, 'relations symmetric');
// peasant lives under Bílá Brána
const pz = S.createNewGame('A', 'B', 'male', 'sedlak');
ok(E.lordOf(pz) && pz.provinces.find((p) => p.id === 'brodna').owner === 'brana', 'peasant lord');
ok(pz.provinces.map((p) => `${p.id}:${p.owner}`).join() , 'owners: ' + pz.provinces.map((p) => `${p.id}:${p.owner}`).join(' '));
const nz = S.createNewGame('A', 'B', 'male', 'slechtic');
console.log('noble owners:', nz.provinces.map((p) => `${p.id}:${p.owner}`).join(' '));
const total = problems + actionFailures;
console.log(total ? 'FAILURES ' + total : 'all ok');
if (total) process.exitCode = 1;
