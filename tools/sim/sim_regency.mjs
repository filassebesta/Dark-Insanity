// A ruler dies leaving a child heir: the regency scenes and what happens until sixteen.
// node tools/sim/sim_regency.mjs [runs=200] [scenario=panovnik] [verbose=0]
const root = new URL('../../js/', import.meta.url).href;
const { createNewGame } = await import(root + 'state.js');
const E = await import(root + 'engine.js');
const runs = Number(process.argv[2] || 200);
const scenario = process.argv[3] || 'panovnik';
const verbose = process.argv[4] === '1';

const seen = {}, how = {}, regents = {}, unresolved = new Set(), order = {};
let errors = 0, blocked = 0, childEvents = 0, bornDup = 0, noScene = 0;
const BAD = /^(rvaci_v_krcme|turnaj|v_turnaj|vlci|souboj_slechticu|potulny_rytir|atentat|cizi_princezna|z_zbojnici_cesta|z_hejtman|z_prepadeni_noc|f_dohazovac|touha_po_diteti)$/;
const check = (st, text, id) => { const o = E.interpolate(st, text || ''); if (/[{}]|\(a\)|undefined|NaN/.test(o)) unresolved.add(id + ': ' + o.slice(0, 140)); };
const pretty = (st, t) => E.interpolate(st, t);

for (let r = 0; r < runs; r++) {
  const st = createNewGame('Aleš', 'Bartoňů', r % 2 ? 'female' : 'male', scenario);
  if (scenario === 'slechtic') { st.ruler.statusTier = 4; }
  st.ruler.age = 88; st.generation = 1;
  st.spouse = { role: 'spouse', name: r % 2 ? 'Vok' : 'Ludmila', gender: r % 2 ? 'male' : 'female', age: 30 + (r % 5), loyalty: 70, alive: true };
  st.siblings = r % 3 ? [{ role: 'sibling', name: r % 2 ? 'Eliška' : 'Bořivoj', gender: r % 2 ? 'female' : 'male', age: 41, loyalty: 60, alive: true }] : [];
  const g = r % 4 < 2 ? 'female' : 'male';
  const age = [0, 1, 4, 9, 14][r % 5];
  st.heir = { role: 'heir', name: g === 'female' ? 'Kunhuta' : 'Přemysl', gender: g, age, loyalty: 70, alive: true, traits: { strength: 5, eloquence: 5, intelligence: 5, patience: 5 } };
  st.children = [];
  // a birth in the season the old ruler dies
  if (r % 2 === 0) st.pregnancy = { due: 4 };
  let log = [];
  let succeeded = false, queueOrder = [];
  for (let t = 0; t < 130 && !st.gameOver; t++) {
    let res;
    try {
      res = E.advanceTurn(st);
      if (res.successionOccurred) { succeeded = true; if (verbose && r < 2) log.push(`--- succession: ${st.ruler.name} age ${st.ruler.age}, pending ${st.pendingEvent}, queue ${JSON.stringify(st.eventQueue)}`); }
    } catch (err) { errors++; console.log('turn', err.stack.split('\n').slice(0, 5).join(' | ')); break; }
    if (res.gameOver) break;
    if (!succeeded) { st.ruler.age = 88; if (!st.ruler.alive) break; }
    let ev = res.event;
    for (let i = 0; ev && i < 8; i++) {
      seen[ev.id] = (seen[ev.id] || 0) + 1;
      if (succeeded && queueOrder.length < 6) queueOrder.push(ev.id);
      check(st, ev.title, ev.id + '/title'); check(st, ev.text, ev.id);
      if (st.ruler.age < 16) { childEvents++; if (BAD.test(ev.id)) { blocked++; console.log('CHILD ACT', ev.id, st.ruler.age); } }
      if (ev.id === 'narozeni' && succeeded && queueOrder.length <= 3) bornDup++;
      if (ev.type === 'route') { E.resolveRouteChoice(st, ev, ev.routeOptions[0].terrainKey); break; }
      const ok = ev.choices.map((c, k) => k).filter((k) => !ev.choices[k].requires || ev.choices[k].requires(st));
      ok.forEach((k) => check(st, ev.choices[k].label, ev.id + '/label'));
      const pick = ok[Math.floor(Math.random() * ok.length)];
      if (verbose && r < 2 && /regent|plnolet|nastup/.test(ev.id)) log.push(`[${ev.id}] ${pretty(st, ev.title)}\n   ${pretty(st, ev.text)}\n   > ${pretty(st, ev.choices[pick].label)}`);
      try {
        const out = E.resolveChoice(st, ev, pick);
        check(st, out.text, ev.id + '/out');
        if (verbose && r < 2 && /regent|plnolet|nastup/.test(ev.id)) log.push(`   => ${out.text}`);
      } catch (err) { errors++; console.log(ev.id, err.stack.split('\n').slice(0, 4).join(' | ')); break; }
      if (ev.free) ev = E.pickNextEvent(st); else break;
    }
    if (st.regency && st.regency.regent && !regents[r]) regents[r] = st.regency.regent;
    if (st.regency && st.regency.ended && !how[r]) how[r] = st.regency.how;
    if (st.regency && st.regency.ended && st.ruler.age >= 17) break;
  }
  if (succeeded && !st.regency) noScene++;
  if (succeeded && st.regency && !st.regency.regent && age < 16) noScene++;
  order[queueOrder.slice(0, 3).join('>')] = (order[queueOrder.slice(0, 3).join('>')] || 0) + 1;
  if (verbose && r < 2) console.log(log.join('\n') + '\n');
}
const cnt = (o) => Object.values(o).reduce((m, v) => { m[v] = (m[v] || 0) + 1; return m; }, {});
console.log(`scenario ${scenario}, ${runs} games, errors ${errors}, events with a child ruler ${childEvents}, forbidden acts ${blocked}, stale birth cards ${bornDup}, games without a regent scene ${noScene}`);
console.log('regents chosen', cnt(regents), 'regency ended', cnt(how));
console.log('first three scenes after the succession', order);
for (const id of ['nastupnictvi', 'regentstvi', 'regent_moc', 'plnoletost', 'narozeni']) console.log('  ', id.padEnd(14), seen[id] || 0);
console.log('unresolved', [...unresolved].slice(0, 20));
