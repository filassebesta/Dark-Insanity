// A won private war ends with the event w_rod_osud: let the beaten house live, take its heirs as hostages,
// or wipe the line out and take its lands. Checks the three outcomes, the lands, the income, old saves,
// and that no token stays unresolved in the story.
//   node tools/sim/test_extinct.mjs
import { createNewGame } from '../../js/state.js';
import * as E from '../../js/engine.js';
import { EVENTS } from '../../js/events.js';
import { ensureHouses, housesNeedMending } from '../../js/houses.js';

let bad = 0;
const ok = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };

function fresh(houseId) {
  const st = createNewGame('A', 'B', 'male', 'slechtic');
  st.ruler.statusTier = 4;
  st.resources.gold = 50;
  st.lastWar = { house: houseId };
  return st;
}
const event = () => EVENTS.find((e) => e.id === 'w_rod_osud');
const open = (st) => { st.pendingEvent = 'w_rod_osud'; return E.pickNextEvent(st); };

// every old house has heirs, a loaded old save gets them
for (const h of createNewGame('A', 'B', 'male', 'slechtic').houses) ok(Array.isArray(h.heirs) && h.heirs.length >= 1, `${h.id} has heirs`);
{
  const st = createNewGame('A', 'B', 'male', 'slechtic');
  for (const h of st.houses) delete h.heirs;
  ok(housesNeedMending(st), 'a save without heirs needs mending');
  ensureHouses(st);
  ok(st.houses.every((h) => h.heirs && h.heirs.length), 'mended save has heirs');
}

for (const id of ['sokolove', 'jelenove', 'rudi', 'brana']) {
  // 1: let the house live
  let st = fresh(id);
  let ev = open(st);
  ok(ev && ev.id === 'w_rod_osud', `${id}: event comes`);
  const n0 = st.houses.length;
  E.resolveChoice(st, ev, 0);
  ok(st.houses.length === n0, `${id}: the house lives`);
  // 2: hostages
  st = fresh(id); ev = open(st);
  const h2 = st.houses.find((h) => h.id === id);
  E.resolveChoice(st, ev, 1);
  ok(h2.hostages === true && h2.heirs.length >= 1, `${id}: hostages`);
  // 3: wipe the line out
  st = fresh(id); ev = open(st);
  const def = (await import('../../js/data.js')).NOBLE_HOUSES.find((d) => d.id === id);
  const seatBefore = st.provinces.find((p) => p.id === def.seat).owner;
  const gold0 = st.resources.gold;
  E.resolveChoice(st, ev, 2);
  ok(!st.houses.some((h) => h.id === id), `${id}: the house is gone`);
  ok((st.deadHouses || []).some((d) => d.id === id), `${id}: noted among the dead`);
  if (!def.hold) ok(st.provinces.find((p) => p.id === def.seat).owner === 'player', `${id}: the seat (was ${seatBefore}) is yours`);
  else ok((st.seized || []).some((x) => x.id === id), `${id}: the hold is yours`);
  const chron = st.chronicle.slice(-3).map((c) => c.text).join(' ');
  ok(!/[{}]/.test(chron) && /vyhasl|přestal existovat/.test(chron), `${id}: chronicle reads well: ${chron.slice(-160)}`);
  ok(st.houses.every((h) => !h.rel || h.rel[id] === undefined), `${id}: nobody keeps a relation to the dead`);
  // the realm goes on: years pass, the line does not come back, nothing breaks
  for (let i = 0; i < 40; i++) { E.advanceTurn(st); st.pendingEvent = null; st.eventQueue = []; st.war = null; }
  ok(!st.houses.some((h) => h.id === id), `${id}: stays dead after ten years`);
  // an old save of the same game does not resurrect it either
  ensureHouses(st);
  ok(!st.houses.some((h) => h.id === id), `${id}: ensureHouses leaves it dead`);
  console.log(id, 'ok · gold', gold0, '->', st.resources.gold, '· houses left', st.houses.length);
}

// the story reads right before the choice too
{
  const st = fresh('sokolove');
  const ev = open(st);
  const text = E.interpolate(st, ev.text);
  ok(!/[{}]/.test(text), 'text without open tokens: ' + text.slice(0, 120));
  ok(/dědic/.test(text), 'the text names the heirs');
}

console.log(bad ? `${bad} problems` : 'all ok');
process.exit(bad ? 1 : 0);
