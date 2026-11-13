// The whole chronicle from the plough: a new game starts as a peasant and is
// promoted in the same save (sedlák → svobodník → šlechtic → významný šlechtic → král).
// node tools/sim/sim_career.mjs [runs=400] [ambition 0–1 = 0.6] [maxYears=150]
// FARM=1 … the peasant also builds the farm and buys animals (farm.js, smart.mjs farmRule).
// SMART=0.4 node tools/sim/sim_career.mjs … plays like a sensible player (smart.mjs) who errs
// in 40 % of choices, instead of picking at random; the yearly farm work then comes from the story only.
// Prints how far the houses got, when, how the chronicles ended, errors and
// text tokens that did not resolve.
const root = new URL('../../js/', import.meta.url).href;
const { settleFree } = await import(new URL('./free.mjs', import.meta.url).href);
const { createNewGame } = await import(root + 'state.js');
const E = await import(root + 'engine.js');
const W = await import(root + 'war.js');
const { smartPick, farmRule } = await import(new URL('./smart.mjs', import.meta.url).href);
// FARM=1: the peasant also builds the farm and keeps animals (smart.mjs farmRule)
const FARM = process.env.FARM === '1';
const B = await import(root + 'build.js');
const F = await import(root + 'farm.js');
const SMART = process.env.SMART !== undefined ? Number(process.env.SMART) : null;
const runs = Number(process.argv[2] || 400);
const AMB = Number(process.argv[3] ?? 0.6);
const MAX = Number(process.argv[4] || 150) * 4;

// choices an ambitious house takes on the way up
const WANT = /Zaplatit plnou cenu|Smlouvat o cenu|Koupit tvrz a žádat o erb|Pokleknout a přijmout pás|Vrhnout se do první řady|Koupit pole|nárok|Udeřit|Povstat|Přijmout s pokorou|Navrhnout sňatek/;

const ends = {}, reached = { svobodnik: [], erb: [], velmoz: [], koruna: [], cisar: [] }, stageEnds = {}, unresolved = new Set();
let errors = 0, rebellions = 0;
const check = (st, t, id) => { const o = E.interpolate(st, t || ''); if (/[{}]|\(a\)/.test(o)) unresolved.add(id + ': ' + o.slice(0, 100)); };

for (let r = 0; r < runs; r++) {
  const st = createNewGame('A', 'B', r % 2 ? 'female' : 'male');
  const mark = (k) => { if (!st['_' + k]) { st['_' + k] = 1; reached[k].push(st.turn / 4); } };
  let end = 'timeout';
  for (let t = 0; t < MAX; t++) {
    let res;
    try {
      res = E.advanceTurn(st);
      if (res.event && SMART !== null) {
        for (let i = 0; i < 3 && res.event && res.event.free; i++) { E.resolveChoice(st, res.event, smartPick(E, st, res.event, SMART)); res.event = E.pickNextEvent(st); }
      } else if (res.event) res.event = settleFree(E, st, res.event);
    } catch (err) { errors++; console.log('turn', st.scenario, err.stack.split('\n').slice(0, 4).join(' | ')); end = 'error'; break; }
    if (res.gameOver) { end = res.gameOver.type; break; }
    const e = res.event;
    if (!e) { errors++; console.log('no event', st.scenario); end = 'error'; break; }
    check(st, e.text, e.id);
    try {
      if (e.type === 'route') {
        E.resolveRouteChoice(st, e, e.routeOptions[Math.floor(Math.random() * e.routeOptions.length)].terrainKey);
        const g = E.checkEndConditions(st);
        if (g) { end = g.type; break; }
        continue;
      }
      const avail = e.choices.map((c, i) => [c, i]).filter(([c]) => !c.requires || c.requires(st));
      let pick = SMART !== null ? smartPick(E, st, e, SMART) : avail[Math.floor(Math.random() * avail.length)][1];
      const amb = avail.find(([c]) => WANT.test(c.label));
      if (amb && Math.random() < AMB) pick = amb[1];
      const out = E.resolveChoice(st, e, pick);
      check(st, out.text, e.id + '/out');
      if (FARM) farmRule(B, F, st);
      if (SMART === null && E.decreeAvailable(st) && st.scenario === 'sedlak') E.issueDecree(st, st.resources.food > 45 ? 'market' : st.resources.favor < 35 ? 'lord' : 'clear');
      // a great lord with men to spare rises against the king
      if (st.scenario === 'slechtic' && !st.war && Math.random() < AMB * 0.3) {
        const size = st.resources.army >= 48 ? 'large' : st.resources.army >= 33 ? 'medium' : null;
        if (size && W.warTargets(st).crown && !W.warBlock(st, 'crown', size)) { W.startWar(st, 'crown', size, 'ruler'); rebellions++; }
      }
      const g = E.checkEndConditions(st);
      if (g) { end = g.type; break; }
    } catch (err) { errors++; console.log(e.id, err.stack.split('\n').slice(0, 4).join(' | ')); end = 'error'; break; }
    if (st.ruler.statusTier >= 2) mark('svobodnik');
    if (st.ruler.statusTier >= 3) mark('erb');
    if (st.ruler.statusTier >= 4) mark('velmoz');
    if (st.ruler.statusTier >= 5) mark('koruna');
    if (st.ruler.statusTier >= 6) mark('cisar');
  }
  ends[end] = (ends[end] || 0) + 1;
  stageEnds[st.scenario] = (stageEnds[st.scenario] || 0) + 1;
}
const med = (a) => (a.length ? a.sort((x, y) => x - y)[a.length >> 1].toFixed(0) : '-');
console.log('reached (share · median year):', Object.entries(reached).map(([k, a]) => `${k} ${(100 * a.length / runs).toFixed(0)} % · r. ${med(a)}`).join(' | '));
console.log('endings', ends);
console.log('stage at the end', stageEnds, '| rebellions started', rebellions, '| errors', errors);
console.log('unresolved', [...unresolved].slice(0, 10));
