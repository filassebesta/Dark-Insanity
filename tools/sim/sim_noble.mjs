const root = new URL('../../js/', import.meta.url).href;
const { createNewGame } = await import(root + 'state.js');
const E = await import(root + 'engine.js');
const ev = await import(root + 'events.js');
const runs = Number(process.argv[2] || 400);
const AMB = Number(process.argv[3] ?? 0.6);
const lens = [], ends = {}, seen = {}, tiers = {}, unresolved = new Set();
let errors = 0, kingDeaths = 0, plot3 = 0;
const check = (st, t, id) => { const o = E.interpolate(st, t); if (/[{}]|\(a\)/.test(o)) unresolved.add(id + ': ' + o.slice(0, 90)); };
for (let r = 0; r < runs; r++) {
  const st = createNewGame('A', 'B', r % 2 ? 'female' : 'male', 'slechtic');
  for (let t = 0; t < 400; t++) {
    const res = E.advanceTurn(st);
    if (res.gameOver) { ends[res.gameOver.type] = (ends[res.gameOver.type] || 0) + 1; break; }
    const e = res.event;
    if (!e) { errors++; console.log('no event'); break; }
    if (e.id === 'n_smrt_krale') kingDeaths++;
    if (st.noble.plot >= 3) plot3++;
    seen[e.id] = (seen[e.id] || 0) + 1;
    check(st, e.text, e.id);
    try {
      const avail = e.choices.map((c, i) => [c, i]).filter(([c]) => !c.requires || c.requires(st));
      // a slightly ambitious player: prefer claiming the throne / striking when offered
      let pick = avail[Math.floor(Math.random() * avail.length)][1];
      const ambitious = avail.find(([c]) => /nárok|Udeřit|Povstat|Přijmout s pokorou|Navrhnout sňatek/.test(c.label));
      if (ambitious && Math.random() < AMB) pick = ambitious[1];
      const out = E.resolveChoice(st, e, pick);
      check(st, out.text || '', e.id + '/out');
      const g = E.checkEndConditions(st);
      if (g) { ends[g.type] = (ends[g.type] || 0) + 1; break; }
    } catch (err) { errors++; console.log(e.id, err.stack.split('\n').slice(0, 3).join(' | ')); break; }
    if (t === 399) ends.timeout = (ends.timeout || 0) + 1;
  }
  lens.push(st.turn); tiers[st.ruler.statusTier] = (tiers[st.ruler.statusTier] || 0) + 1;
}
lens.sort((a, b) => a - b);
console.log('turns median', lens[runs >> 1], 'p10', lens[runs * 0.1 | 0], 'p90', lens[runs * 0.9 | 0], '| years median', (lens[runs >> 1] / 4).toFixed(1));
console.log('endings', ends, '| final tiers', tiers, '| king deaths', kingDeaths, '| errors', errors);
console.log('unresolved', [...unresolved].slice(0, 8));
const noble = ev.EVENTS.filter((e) => e.scenario === 'slechtic').map((e) => e.id);
console.log('never seen:', noble.filter((id) => !seen[id]));
console.log('top:', Object.entries(seen).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => k + ':' + v).join(' '));
