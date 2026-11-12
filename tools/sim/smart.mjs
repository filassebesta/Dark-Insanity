// A sensible player for the simulations: instead of picking at random it
// weighs what each choice does to the resources, caring most about the ones
// that are running low, and takes the ladder up when it is offered. Hidden
// consequences (flags, echoes) are invisible to it, as they are to a player.
//   import { smartPick } from './smart.mjs';  const i = smartPick(E, state, event);

const END_VALUE = { ennobled: 120, crowned: 120, golden_age: 0, executed: -400, exile: -250, expelled: -250 };

/** How much one point of a resource is worth right now: scarce resources matter more. */
function weight(state, key) {
  const v = state.resources[key];
  if (v === undefined) return 0;
  const danger = { stability: 30, food: 25, favor: 30, gold: 15, army: 15, legitimacy: 25, faith: 15, prestige: 15 }[key] ?? 20;
  return 1 + Math.max(0, danger - v) / 6 + (v >= 90 ? -0.7 : 0);
}

function branchValue(E, state, b) {
  if (!b) return 0;
  let v = 0;
  // the year's farm work chosen in a story does what the same work from the map does
  const fx = { ...(b.effects || {}) };
  if (b.decree) for (const [k, d] of Object.entries(E.decreeList(state)[b.decree].effects)) fx[k] = (fx[k] || 0) + d;
  for (const [k, d] of Object.entries(fx)) v += d * weight(state, k);
  for (const fx of Object.values(b.provinceEffects || {})) v += ((fx.loyalty || 0) - (fx.unrest || 0) + (fx.wealth || 0) * 0.5) * 0.3 - (fx.lost ? 60 : 0);
  if (b.setTier) v += (b.setTier - state.ruler.statusTier) * 60;
  if (b.endGame) v += END_VALUE[b.endGame] ?? -200;
  if (b.injury) v -= 8;
  if (b.traitGain) v += 3;
  return v;
}

export function smartPick(E, state, event, randomness = 0.15) {
  const options = event.choices.map((c, i) => [c, i]).filter(([c]) => !c.requires || c.requires(state));
  if (Math.random() < randomness) return options[Math.floor(Math.random() * options.length)][1]; // nobody plays perfectly
  let best = options[0][1];
  let bestValue = -Infinity;
  for (const [c, i] of options) {
    let v;
    if (c.isRoll) {
      const p = E.computeSuccessChance(state, c);
      v = p * branchValue(E, state, c.onSuccess) + (1 - p) * branchValue(E, state, c.onFailure);
    } else v = branchValue(E, state, c);
    v += Math.random() * 2; // break ties
    if (v > bestValue) { bestValue = v; best = i; }
  }
  return best;
}
