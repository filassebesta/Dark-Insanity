const root = new URL('../../js/', import.meta.url).href;
const { settleFree } = await import(new URL('./free.mjs', import.meta.url).href);
const { createNewGame } = await import(root + 'state.js');
const E = await import(root + 'engine.js');
const runs = 400, lens = [], ends = {}, seen = {}, quietStreakMax = [];
let errors = 0;
for (let r = 0; r < runs; r++) {
  const st = createNewGame('A', 'B', 'male', 'panovnik');
  let quiet = 0, maxQ = 0;
  for (let t = 0; t < 400; t++) {
    const res = E.advanceTurn(st);
    if (res.event) res.event = settleFree(E, st, res.event);
    if (res.gameOver) { const k = res.gameOver.type + ':' + (res.gameOver.reason || ''); ends[k] = (ends[k] || 0) + 1; break; }
    const ev = res.event;
    if (!ev) { errors++; break; }
    seen[ev.id] = (seen[ev.id] || 0) + 1;
    quiet = ev.id === 'quiet_season' ? quiet + 1 : 0; maxQ = Math.max(maxQ, quiet);
    try {
      let out;
      if (ev.type === 'route') out = E.resolveRouteChoice(st, ev, ev.routeOptions[Math.floor(Math.random() * 3)].terrainKey);
      else { const ok = ev.choices.map((c, i) => i).filter((i) => !ev.choices[i].requires || ev.choices[i].requires(st)); out = E.resolveChoice(st, ev, ok[Math.floor(Math.random() * ok.length)]); }
      const g = E.checkEndConditions(st);
      if (g) { ends[g.type] = (ends[g.type] || 0) + 1; break; }
    } catch (e) { errors++; console.log(ev.id, e.message); break; }
    if (t === 399) ends.timeout = (ends.timeout || 0) + 1;
  }
  lens.push(st.turn); quietStreakMax.push(maxQ);
}
lens.sort((a, b) => a - b);
console.log('turns: median', lens[runs >> 1], 'p10', lens[runs * 0.1 | 0], 'p90', lens[runs * 0.9 | 0], 'years median', (lens[runs >> 1] / 4).toFixed(1));
console.log('endings', ends, 'errors', errors, 'max quiet streak', Math.max(...quietStreakMax));
console.log('event frequency', Object.entries(seen).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(' '));
const special = Object.entries(seen).filter(([k]) => /^(krize|ozvena)/.test(k)).map(([k, v]) => `${k}:${v}`).join(' ');
console.log('crises/echoes', special);
