// A 'free' event (the ambition offer) takes no season: the game shows the
// season's own event right after it. The sims do the same — a random valid
// choice for the free event, then the next event of the same season.
export function settleFree(E, st, event) {
  let ev = event;
  for (let i = 0; ev && ev.free && i < 3; i++) {
    const ok = ev.choices.map((c, k) => k).filter((k) => !ev.choices[k].requires || ev.choices[k].requires(st));
    E.resolveChoice(st, ev, ok[Math.floor(Math.random() * ok.length)]);
    ev = E.pickNextEvent(st);
  }
  return ev;
}
