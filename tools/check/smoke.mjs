// Browser smoke test: plays every scenario in real Chromium through the real UI.
//
//   node tools/check/smoke.mjs                    # 3 scenarios × 40 turns
//   node tools/check/smoke.mjs 80                 # turns per scenario
//   node tools/check/smoke.mjs 40 <dir>           # also save a screenshot per scenario into <dir>
//                                                 # (never into the repository)
//
// Fails (exit 1) on: uncaught page errors, console errors, failed CSS/JS/audio
// requests, visible text with leftover tokens ("{…}", "undefined", "NaN"),
// a turn where no button can be clicked, and panels (map M, character P,
// trade O) that do not open. Missing event art is NOT an error — the game
// probes several file names and falls back on purpose.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// require() also finds a globally installed Playwright, an ESM import does not
const { chromium } = createRequire(import.meta.url)('playwright');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TURNS = Number(process.argv[2]) || 40;
const SHOTS = process.argv[3] || null;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.json': 'application/json' };

const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try {
    const body = await readFile(join(ROOT, path));
    res.writeHead(200, { 'content-type': MIME[extname(path)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end();
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch();
const problems = [];
const report = {};

for (const scenario of ['sedlak', 'slechtic', 'panovnik']) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const bad = (msg) => problems.push(`[${scenario}] ${msg}`);
  page.on('pageerror', (e) => bad(`page error: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) bad(`console: ${m.text()}`); });
  page.on('response', (r) => {
    if (r.status() >= 400 && /\.(js|css|mp3|svg)$/.test(new URL(r.url()).pathname)) bad(`${r.status()} ${new URL(r.url()).pathname}`);
  });

  await page.goto(BASE);
  await page.evaluate(async (sc) => {
    const S = await import('/js/state.js');
    localStorage.clear();
    const st = S.createNewGame('Test', 'z Testu', 'female', sc);
    S.saveGame(st);
    localStorage.setItem('insanityKingdom.settings', JSON.stringify({ typewriter: false, musicMuted: true, musicVolume: 0 }));
  }, scenario);
  await page.reload();
  await page.click('[data-action="continue-game"]');
  await page.waitForSelector('#screen-game.active', { timeout: 5000 });

  const seen = new Set();
  let turns = 0;
  let ended = null;
  for (; turns < TURNS; turns++) {
    if (await page.locator('#screen-ending.active').count()) { ended = await page.textContent('#ending-title'); break; }
    await page.keyboard.press('Enter'); // finish the typewriter if it runs
    const title = (await page.textContent('#event-title')) || '';
    seen.add(title);
    const visible = `${title}\n${await page.textContent('#event-text')}\n${await page.locator('#choice-list').innerText()}`;
    const leftover = visible.match(/\{[^}]*\}|\bundefined\b|\bNaN\b/);
    if (leftover) bad(`turn ${turns} "${title}": leftover "${leftover[0]}" in visible text`);

    const choices = page.locator('#choice-list .choice-button:not(.continue-button)');
    const n = await choices.count();
    if (n === 0) { bad(`turn ${turns} "${title}": no choice to click`); break; }
    await choices.nth(Math.floor(Math.random() * n)).click(); // (Enter here would already press "Pokračovat")
    const cont = page.locator('#choice-list .continue-button');
    try { await cont.waitFor({ timeout: 3000 }); } catch { bad(`turn ${turns} "${title}": no "Pokračovat" after the choice`); break; }
    const outcome = await page.textContent('#event-text');
    const left2 = outcome.match(/\{[^}]*\}|\bundefined\b|\bNaN\b/);
    if (left2) bad(`turn ${turns} "${title}" outcome: leftover "${left2[0]}"`);
    await cont.click();

    if (turns === 3) { // panels open and close without errors
      for (const [key, sel] of [['m', '#map-view'], ['p', '#character-view'], ['o', '#map-view']]) {
        await page.keyboard.press(key);
        await page.waitForTimeout(300);
        if ((await page.getAttribute(sel, 'aria-hidden')) !== 'false') bad(`key ${key.toUpperCase()} did not open ${sel}`);
        if (SHOTS && key === 'm') await page.screenshot({ path: join(SHOTS, `smoke_${scenario}_map.png`) });
        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);
        if ((await page.getAttribute(sel, 'aria-hidden')) !== 'true') bad(`Escape did not close ${sel}`);
      }
    }
  }
  if (SHOTS) { await page.waitForTimeout(1500); await page.screenshot({ path: join(SHOTS, `smoke_${scenario}.png`) }); }
  report[scenario] = { turns, distinctEvents: seen.size, ended: ended || '—' };
  await page.close();
}

await browser.close();
server.close();
console.table(report);
if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of [...new Set(problems)]) console.log('  ' + p);
  process.exit(1);
}
console.log('smoke test OK');
