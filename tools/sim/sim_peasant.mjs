const root = new URL('../../js/', import.meta.url).href;
const { createNewGame } = await import(root + 'state.js');
const E = await import(root + 'engine.js');
const { EVENTS } = await import(root + 'events.js');
const runs = +(process.argv[2] || 400), AMB = +(process.argv[3] || 0.6);
const ends = {}, seen = {}, lens = [], tiers = {}; let errors = 0, freedAt = [];
const WANT = ['Zaplatit pánovi plnou cenu', 'Smlouvat o cenu', 'Koupit tvrz a žádat o erb', 'Pokleknout a přijmout pás', 'Vrhnout se do první řady', 'Jít osobně', 'Koupit pole', 'Ucházet se o úřad'];
for (let r = 0; r < runs; r++) {
  const st = createNewGame('A', 'B', 'male', 'sedlak');
  let freed = false;
  for (let t = 0; t < 400; t++) {
    const res = E.advanceTurn(st);
    if (res.gameOver) { ends[res.gameOver.type] = (ends[res.gameOver.type] || 0) + 1; break; }
    const e = res.event;
    seen[e.id] = (seen[e.id] || 0) + 1;
    try {
      const avail = e.choices.map((c, i) => [c, i]).filter(([c]) => !c.requires || c.requires(st));
      let pick = avail[Math.floor(Math.random() * avail.length)][1];
      const amb = avail.find(([c]) => WANT.includes(c.label));
      if (amb && Math.random() < AMB) pick = amb[1];
      E.resolveChoice(st, e, pick);
      if (!freed && st.ruler.statusTier >= 2) { freed = true; freedAt.push(st.turn); }
      // spend the yearly decree sensibly: market when rich in food, otherwise cattle
      if (E.decreeAvailable(st)) E.issueDecree(st, st.resources.food > 45 ? 'market' : st.resources.favor < 35 ? 'lord' : 'clear');
      const g = E.checkEndConditions(st);
      if (g) { ends[g.type] = (ends[g.type] || 0) + 1; if (g.type === 'ennobled') ends['via_' + e.id] = (ends['via_' + e.id] || 0) + 1; break; }
    } catch (err) { errors++; console.log(e.id, err.stack.split('\n').slice(0, 3).join(' | ')); break; }
    if (t === 399) ends.timeout = (ends.timeout || 0) + 1;
  }
  lens.push(st.turn); tiers[st.ruler.statusTier] = (tiers[st.ruler.statusTier] || 0) + 1;
}
lens.sort((a, b) => a - b); freedAt.sort((a, b) => a - b);
console.log('years median', (lens[runs >> 1] / 4).toFixed(1), 'p10', (lens[runs * 0.1 | 0] / 4).toFixed(1), 'p90', (lens[runs * 0.9 | 0] / 4).toFixed(1));
console.log('endings', JSON.stringify(ends), 'tiers', tiers, 'errors', errors, 'freed', freedAt.length, 'median freed year', freedAt.length ? (freedAt[freedAt.length >> 1] / 4).toFixed(1) : '-');
console.log('top', Object.entries(seen).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => k + ':' + v).join(' '));
const pool = EVENTS.filter((e) => (e.scenarios || [e.scenario]).includes('sedlak') && !e.forced).map((e) => e.id);
console.log('distinct events seen', Object.keys(seen).length, '· never seen:', pool.filter((id) => !seen[id]));
