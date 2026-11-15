// Forces a king into tier 6 with two held crowns and plays many seasons with random choices.
// node tools/sim/sim_empire.mjs [runs=300] [years=40] [mode=random|smart|careful]
const root = new URL('../../js/', import.meta.url).href;
const { createNewGame } = await import(root + 'state.js');
const E = await import(root + 'engine.js');
const { EVENTS } = await import(root + 'events.js');
const { smartPick } = await import(new URL('./smart.mjs', import.meta.url).href);
const runs = Number(process.argv[2] || 300);
const years = Number(process.argv[3] || 40);
const mode = process.argv[4] || 'random';

const W = { gold: 0.3, army: 0.2, stability: 0.7, legitimacy: 0.5, faith: 0.3, prestige: 0.4, food: 0.2 };
function branchVal(b) {
  if (!b) return 0;
  let v = 0;
  for (const [k, d] of Object.entries(b.effects || {})) v += d * (W[k] || 0);
  for (const [k, fx] of Object.entries(b.realm || {})) v += (fx.attitude || 0) * (k === 'south' ? 0.3 : 1.2) + (fx.power || 0) * 0.1;
  if (b.endGame) v -= 100;
  return v;
}
function careful(st, ev, ok) {
  let best = ok[0], bv = -1e9;
  for (const k of ok) {
    const c = ev.choices[k];
    let v;
    if (c.isRoll) { const p = E.computeSuccessChance(st, c); v = p * branchVal(c.onSuccess) + (1 - p) * branchVal(c.onFailure); } else v = branchVal(c);
    v += Math.random() * 1.5;
    if (v > bv) { bv = v; best = k; }
  }
  return Math.random() < 0.2 ? ok[Math.floor(Math.random() * ok.length)] : best;
}
const seen = {}, games = {}, ends = {}, unresolved = new Set();
let errors = 0, lost = 0, decrees = 0, empireTurns = 0, peaks = 0, fallCards = 0, turnsTotal = 0, tierAtEnd = {};
const check = (st, text, id) => { const o = E.interpolate(st, text || ''); if (/[{}]|\(a\)|undefined|NaN/.test(o)) unresolved.add(id + ': ' + o.slice(0, 140)); };

for (let r = 0; r < runs; r++) {
  const st = createNewGame('Aleš', 'Bartoňů', r % 2 ? 'female' : 'male', 'panovnik');
  st.ruler.age = 35; st.generation = 2;
  st.ruler.statusTier = 6;
  st.milestones = { empire: 0, crowned: 0 };
  for (const k of ['east', 'north']) { Object.assign(st.realms[k], { owner: 'player', since: 0, attitude: 30 + (r % 3) * 10, power: 25 }); }
  st.stats = { crownsTaken: 2 };
  Object.assign(st.resources, { gold: 60, food: 60, army: 50, stability: 70, legitimacy: 70, faith: 60, prestige: 60 });
  st.heir = { role: 'heir', name: 'Dědic', gender: r % 2 ? 'male' : 'female', age: 14, loyalty: 70, alive: true, traits: { strength: 5, eloquence: 5, intelligence: 5, patience: 5 } };
  const gamesSeen = new Set();
  let end = 'timeout';
  for (let t = 0; t < years * 4; t++) {
    let res;
    try {
      res = E.advanceTurn(st);
      for (let i = 0; i < 4 && res.event && res.event.free; i++) {
        const ev = res.event; seen[ev.id] = (seen[ev.id] || 0) + 1; gamesSeen.add(ev.id);
        check(st, ev.title, ev.id + '/title'); check(st, ev.text, ev.id);
        const ok = ev.choices.map((c, k) => k).filter((k) => !ev.choices[k].requires || ev.choices[k].requires(st));
        ok.forEach((k) => check(st, ev.choices[k].label, ev.id + '/label'));
        const pick = mode === 'smart' ? smartPick(E, st, ev, 0.3) : mode === 'careful' ? careful(st, ev, ok) : ok[Math.floor(Math.random() * ok.length)];
        const out = E.resolveChoice(st, ev, pick); check(st, out.text, ev.id + '/out');
        if (ev.id === 'risa_sprava') decrees++;
        res.event = E.pickNextEvent(st);
      }
    } catch (err) { errors++; console.log('turn', err.stack.split('\n').slice(0, 4).join(' | ')); end = 'error'; break; }
    if (res.gameOver) { end = res.gameOver.type; break; }
    const ev = res.event;
    if (!ev) { errors++; end = 'noevent'; break; }
    seen[ev.id] = (seen[ev.id] || 0) + 1; gamesSeen.add(ev.id);
    check(st, ev.title, ev.id + '/title'); check(st, ev.text, ev.id);
    try {
      if (ev.type === 'route') { E.resolveRouteChoice(st, ev, ev.routeOptions[0].terrainKey); continue; }
      const ok = ev.choices.map((c, k) => k).filter((k) => !ev.choices[k].requires || ev.choices[k].requires(st));
      ok.forEach((k) => check(st, ev.choices[k].label, ev.id + '/label'));
      if (!ok.length) { errors++; console.log('no choice', ev.id); end = 'nochoice'; break; }
      const pick = mode === 'smart' ? smartPick(E, st, ev, 0.3) : mode === 'careful' ? careful(st, ev, ok) : ok[Math.floor(Math.random() * ok.length)];
      const out = E.resolveChoice(st, ev, pick); check(st, out.text, ev.id + '/out');
      if (ev.id === 'risa_sprava') decrees++;
      const g = E.checkEndConditions(st);
      if (g) { end = g.type; break; }
    } catch (err) { errors++; console.log(ev.id, err.stack.split('\n').slice(0, 4).join(' | ')); end = 'error'; break; }
    if (st.ruler.statusTier >= 6) empireTurns++;
  }
  turnsTotal += st.turn;
  for (const id of gamesSeen) games[id] = (games[id] || 0) + 1;
  ends[end] = (ends[end] || 0) + 1;
  tierAtEnd[st.ruler.statusTier] = (tierAtEnd[st.ruler.statusTier] || 0) + 1;
  lost += ['east', 'north'].filter((k) => st.realms[k].owner !== 'player').length;
}
const ids = EVENTS.filter((e) => /^(risa_|regent|plnoletost)/.test(e.id)).map((e) => e.id);
console.log(`mode ${mode}, ${runs} games x ${years} years, avg years ${(turnsTotal / runs / 4).toFixed(1)}, errors ${errors}`);
console.log('endings', ends, 'tier at end', tierAtEnd, 'crowns lost (of', runs * 2, ')', lost, 'decrees per game', (decrees / runs).toFixed(1));
console.log('events (times | share of games):');
for (const id of ids) console.log('  ', id.padEnd(18), String(seen[id] || 0).padStart(5), ((100 * (games[id] || 0)) / runs).toFixed(0).padStart(4) + ' %');
console.log('unresolved', [...unresolved].slice(0, 20));
