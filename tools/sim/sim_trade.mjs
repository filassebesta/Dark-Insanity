const root = new URL('../../js/', import.meta.url).href;
const { createNewGame } = await import(root + 'state.js');
const E = await import(root + 'engine.js');
const T = await import(root + 'trade.js');
const scen = process.argv[2] || 'panovnik', runs = +(process.argv[3] || 200), trade = process.argv[4] !== 'notrade';
const ends = {}, lens = [], stats = { sent: 0, delivered: 0, incidents: 0, goldFromTrade: 0 };
let errors = 0;
for (let r = 0; r < runs; r++) {
  const st = createNewGame('A', 'B', 'male', scen);
  for (let t = 0; t < 400; t++) {
    const g0 = st.resources.gold;
    const res = E.advanceTurn(st);
    if (res.tradeNews) stats.delivered += res.tradeNews.filter((n) => n.includes('vrátila')).length;
    if (res.gameOver) { ends[res.gameOver.type] = (ends[res.gameOver.type] || 0) + 1; break; }
    const e = res.event;
    if (/^o_(prepadeni|pirati)$/.test(e.id)) stats.incidents++;
    try {
      if (e.type === 'route') E.resolveRouteChoice(st, e, 'traderoute');
      else {
        const avail = e.choices.map((c, i) => [c, i]).filter(([c]) => !c.requires || c.requires(st));
        E.resolveChoice(st, e, avail[Math.floor(Math.random() * avail.length)][1]);
      }
      if (trade) {
        const tr = T.ensureTrade(st);
        // bot: ship the fullest good to the best-paying reachable market
        const [good, qty] = Object.entries(tr.stock).sort((a, b) => b[1] - a[1])[0];
        if (qty >= 3) {
          const dests = Object.keys(T.MARKETS).filter((d) => !T.MARKETS[d].home && !T.canSend(st, d, good, qty, false));
          if (dests.length) {
            const best = dests.sort((a, b) => T.price(st, b, good) - T.price(st, a, good))[0];
            if (T.sendCaravan(st, best, good, qty, Math.random() < 0.4 && !T.canSend(st, best, good, qty, true)).caravan) stats.sent++;
          } else if (qty >= 8) T.sellAtHome(st, good, qty - 4);
        }
      }
      const g = E.checkEndConditions(st);
      if (g) { ends[g.type] = (ends[g.type] || 0) + 1; break; }
    } catch (err) { errors++; console.log(e.id, err.stack.split('\n').slice(0, 4).join(' | ')); break; }
    if (t === 399) ends.timeout = (ends.timeout || 0) + 1;
  }
  lens.push(st.turn);
}
lens.sort((a, b) => a - b);
console.log(scen, trade ? 'TRADE' : 'no trade', 'years median', (lens[runs >> 1] / 4).toFixed(1), JSON.stringify(ends), 'errors', errors, JSON.stringify(stats));
