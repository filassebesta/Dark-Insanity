// Troops, recruiting, garrisons and battles under load (troops.js, battle.js, war.js).
// node tools/sim/sim_war.mjs [runs=150] [years=40]
// A bot raises troops of every type, posts garrisons, disbands, goes to war with a random corps and
// answers every event at random (war events place the army with the engine's autoDeploy). After every
// step the invariants are checked: army == sum of troops, power == sum of the corps, no negative or
// fractional men, no garrison larger than the stock. Prints the battle results and any violations.
const root = new URL('../../js/', import.meta.url).href;
const { createNewGame } = await import(root + 'state.js');
const E = await import(root + 'engine.js');
const W = await import(root + 'war.js');
const T = await import(root + 'troops.js');
const B = await import(root + 'battle.js');
const { ensureTrade } = await import(root + 'trade.js');
const { settleFree } = await import(new URL('./free.mjs', import.meta.url).href);

const runs = Number(process.argv[2] || 150);
const years = Number(process.argv[3] || 40);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
let errors = 0, violations = 0;
const grades = {}, kinds = {}, ends = {}, unresolved = new Set();
let wars = 0, recruited = 0, desertions = 0, garrisonSaves = 0, battles = 0, flankWins = 0, flanks = 0;

function check(st, where) {
  if (st.scenario === 'sedlak') return;
  const bad = (m) => { violations++; if (violations <= 12) console.log('VIOLATION', where, m, 'turn', st.turn); };
  const t = st.troops;
  if (!t) return bad('no troops');
  const sum = T.troopsTotal(t);
  if (sum !== st.resources.army) bad(`army ${st.resources.army} != troops ${sum} ${JSON.stringify(t)}`);
  for (const k of T.TROOP_KEYS) if (!Number.isInteger(t[k]) || t[k] < 0) bad(`troops.${k} = ${t[k]}`);
  const post = T.stationed(st);
  for (const k of T.GARRISON_KEYS) if (post[k] > t[k]) bad(`garrison ${k} ${post[k]} > ${t[k]}`);
  if (st.war) {
    const c = st.war.troops;
    if (!c) return bad('war without corps');
    if (T.troopsTotal(c) !== st.war.power) bad(`power ${st.war.power} != corps ${T.troopsTotal(c)}`);
    for (const k of T.TROOP_KEYS) if (!Number.isInteger(c[k]) || c[k] < 0) bad(`corps.${k} = ${c[k]}`);
  }
}

for (let r = 0; r < runs; r++) {
  const scenario = r % 2 ? 'panovnik' : 'slechtic';
  const st = createNewGame('A', 'B', r % 4 < 2 ? 'female' : 'male', scenario);
  if (scenario === 'slechtic') { st.ruler.statusTier = r % 4 === 0 ? 4 : 3; Object.assign(st.resources, { gold: 80, food: 60 }); }
  else Object.assign(st.resources, { gold: 120, food: 80 });
  ensureTrade(st).stock.iron = 12;
  for (let t = 0; t < years * 4; t++) {
    let res;
    try {
      res = E.advanceTurn(st);
      if (res.event) res.event = settleFree(E, st, res.event);
    } catch (err) { errors++; console.log('turn', err.stack.split('\n').slice(0, 4).join(' | ')); break; }
    check(st, 'advance');
    if (res.gameOver) { const k = res.gameOver.type; ends[k] = (ends[k] || 0) + 1; break; }
    const e = res.event;
    if (!e) { errors++; console.log('no event'); break; }
    try {
      // the bot's own business with the army
      if (Math.random() < 0.5) {
        const type = pick(T.TROOP_KEYS);
        const out = T.recruit(st, type, T.TROOPS[type].batch * (1 + Math.floor(Math.random() * 3)));
        if (!out.error) recruited++;
        check(st, 'recruit ' + type);
      }
      if (Math.random() < 0.2) { const k = pick(T.TROOP_KEYS); T.disband(st, k, 1 + Math.floor(Math.random() * 6)); check(st, 'disband'); }
      if (Math.random() < 0.3) {
        const p = pick(st.provinces);
        const k = pick(T.GARRISON_KEYS);
        T.assignGarrison(st, p.id, k, Math.random() < 0.7 ? 1 + Math.floor(Math.random() * 6) : -1 - Math.floor(Math.random() * 6));
        check(st, 'garrison');
      }
      if (!st.war && st.scenario !== 'sedlak' && Math.random() < 0.25) {
        const keys = Object.keys(W.warTargets(st));
        if (keys.length) {
          const key = pick(keys);
          const corps = {};
          for (const k of T.TROOP_KEYS) corps[k] = Math.floor(Math.random() * (T.freeTroops(st)[k] + 1));
          const out = W.startWar(st, key, Math.random() < 0.5 ? pick(['small', 'medium', 'large']) : corps, pick(['ruler', 'marshal']));
          if (!out.error) wars++;
          check(st, 'startWar');
        }
      }
      if (e.type === 'route') { E.resolveRouteChoice(st, e, pick(e.routeOptions).terrainKey); check(st, 'route'); continue; }
      const avail = e.choices.map((c, i) => [c, i]).filter(([c]) => !c.requires || c.requires(st));
      const [choice, index] = pick(avail);
      // now and then fight the battle with a random placing instead of the engine's
      let decided = null;
      if (choice.deploy && st.war && Math.random() < 0.3) {
        const b = B.prepareBattle(st, choice.deploy, choice.stance || null);
        const corps = B.fieldCorps(st);
        const dep = B.emptyDeployment(b.kind);
        for (const k of T.TROOP_KEYS) {
          let left = corps[k];
          for (const s of B.slotsOf(b.kind)) { const n = Math.floor(Math.random() * (left + 1)); dep[s.key][k] = n; left -= n; }
        }
        const fought = B.fightBattle(st, b, dep);
        decided = { success: fought.win, battle: fought };
      }
      const before = st.war ? st.war.battles : 0;
      const out = E.resolveChoice(st, e, index, decided);
      if (choice.deploy && st.war && st.war.battles > before) {
        battles++;
        const fight = decided ? decided.battle : null;
        void fight;
      }
      // what the battle said, from the chronicle's last line
      check(st, 'resolve ' + e.id);
      const text = E.interpolate(st, out.text || '');
      if (/[{}]|\(a\)/.test(text)) unresolved.add(e.id + ': ' + text.slice(0, 120));
      const g = E.checkEndConditions(st);
      if (g) { ends[g.type] = (ends[g.type] || 0) + 1; break; }
    } catch (err) { errors++; console.log(e.id, err.stack.split('\n').slice(0, 4).join(' | ')); break; }
  }
}

// the engine's own placing against a spread of enemies: how the grades fall
for (let i = 0; i < 600; i++) {
  const st = createNewGame('A', 'B', 'male', 'slechtic');
  st.ruler.statusTier = 4; st.ruler.age = 30;
  Object.assign(st.resources, { army: 120, gold: 50, food: 60 });
  E.advanceTurn(st);
  st.houses[0].ally = i % 2 === 0; st.houses[0].attitude = 60;
  const key = pick(Object.keys(W.warTargets(st)));
  const out = W.startWar(st, key, pick(['medium', 'large', 'large']), pick(['ruler', 'marshal']));
  if (out.error) continue;
  st.war.seasons = 2;
  for (const kind of ['field', 'siege', 'ambush']) {
    st.turn += 1;
    const stance = kind === 'field' && Math.random() < 0.3 ? 'flank' : null;
    const f = B.autoFight(st, kind, stance);
    const k = `${kind}${stance ? '/flank' : ''}`;
    kinds[k] = kinds[k] || { n: 0, win: 0, lost: 0 };
    kinds[k].n++; kinds[k].win += f.win ? 1 : 0; kinds[k].lost += f.lost;
    grades[f.grade] = (grades[f.grade] || 0) + 1;
    if (stance) { flanks++; if (f.win) flankWins++; }
    if (/[{}]|\(a\)/.test(E.interpolate(st, f.story))) unresolved.add('story: ' + E.interpolate(st, f.story).slice(0, 140));
    if (f.story.split('. ').length < 3) unresolved.add('short story: ' + f.story);
    delete st.war.battle;
  }
}

console.log(`runs ${runs} · wars started ${wars} · recruits ${recruited} · battles fought through the engine ${battles}`);
console.log('endings', ends);
console.log('autoFight grades', grades);
console.log('by kind (n, win %, men lost on average)', Object.fromEntries(Object.entries(kinds).map(([k, v]) => [k, [v.n, Math.round(100 * v.win / v.n), +(v.lost / v.n).toFixed(1)]])));
console.log('flank wins', flankWins, 'of', flanks);
console.log('violations', violations, '| errors', errors);
console.log('unresolved', [...unresolved].slice(0, 8));
