// Static check of all game content — run before every commit.
//
//   node tools/check/validate.mjs            # errors + warnings, exit 1 on any error
//   node tools/check/validate.mjs --art      # also list events that still borrow art
//
// Catches what the game itself silently ignores: unknown resource keys in
// effects (applyEffects skips them), unknown text tokens (left as "{x}" on
// screen), broken gender forms, missing images, references to event ids that
// do not exist, duplicate ids and choices without any outcome.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const js = (f) => new URL(`file://${join(ROOT, 'js', f)}`).href;
const { EVENTS, QUIET_EVENTS } = await import(js('events.js'));
const { RESOURCE_DEFS, TRAIT_DEFS } = await import(js('data.js'));

const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

const RESOURCES = new Set(RESOURCE_DEFS.map((d) => d.key));
const TRAITS = new Set(TRAIT_DEFS.map((d) => d.key));
const SCENARIOS = new Set(['panovnik', 'slechtic', 'sedlak', 'any']); // 'any' = forced crises shared by all
const PROVINCE_STATS = new Set(['loyalty', 'unrest', 'wealth', 'garrison', 'lost']);
// every {key} that engine.interpolate() knows (keep in sync with js/engine.js)
const TOKENS = new Set([
  'ruler.name', 'heir.name', 'spouse.name', 'chancellor.name', 'marshal.name', 'spymaster.name',
  'dynastyName', 'province.name', 'target.name', 'target.role', 'target.age', 'target.Old',
  'target.died', 'target.your', 'ruler.title', 'own.name',
  'house.name', 'house.short', 'house.head', 'house.headTitle', 'house.HeadTitle', 'house.seat',
  'cargo.load', 'cargo.good', 'cargo.to', 'cargo.danger', 'cargo.ransom', 'cargo.offer', 'cargo.escort',
  'lord.name', 'lord.title', 'lord.Title', 'lord.house', 'village',
  'king.name', 'king.age', 'king.heirName', 'king.heirTitle', 'king.heirTitleGen',
  'chancellor.Title', 'chancellor.title', 'marshal.Title', 'marshal.title', 'spymaster.Title', 'spymaster.title',
]);

const all = [...EVENTS, ...Object.values(QUIET_EVENTS)];
const ids = new Set();
for (const e of EVENTS) {
  if (ids.has(e.id)) err(e.id, 'duplicate event id');
  ids.add(e.id);
}
for (const q of Object.values(QUIET_EVENTS)) ids.add(q.id);

function checkText(where, text) {
  if (text == null) return;
  if (typeof text !== 'string') return err(where, 'text is not a string');
  // gender forms {R:male|female}
  const gendered = /\{([A-Z]):([^{}]*)\}/g;
  let m;
  while ((m = gendered.exec(text))) {
    if (!'RHTDLM'.includes(m[1])) err(where, `unknown gender owner {${m[1]}:…}`);
    if (m[2].split('|').length !== 2) err(where, `gender form needs exactly one "|": {${m[1]}:${m[2]}}`);
  }
  const rest = text.replace(gendered, '');
  for (const t of rest.matchAll(/\{([^{}]*)\}/g)) {
    if (!TOKENS.has(t[1])) err(where, `unknown token {${t[1]}}`);
  }
  const open = (rest.match(/\{/g) || []).length;
  const close = (rest.match(/\}/g) || []).length;
  if (open !== close) err(where, 'unbalanced { } in text');
}

function checkBranch(where, b, needOutcome = true) {
  if (!b) return err(where, 'missing branch');
  for (const [k, v] of Object.entries(b.effects || {})) {
    if (!RESOURCES.has(k)) err(where, `unknown resource "${k}" in effects (would be ignored silently)`);
    if (typeof v !== 'number' || Number.isNaN(v)) err(where, `effect ${k} is not a number`);
  }
  if (b.traitGain && !TRAITS.has(b.traitGain)) err(where, `unknown traitGain "${b.traitGain}"`);
  for (const k of Object.keys(b.heirTraits || {})) if (!TRAITS.has(k)) err(where, `unknown heir trait "${k}"`);
  for (const [p, stats] of Object.entries(b.provinceEffects || {})) {
    for (const k of Object.keys(stats || {})) if (!PROVINCE_STATS.has(k)) err(where, `unknown province stat "${k}" (${p})`);
  }
  if (b.echo) {
    const echoId = typeof b.echo === 'string' ? b.echo : b.echo.event;
    if (echoId && !ids.has(echoId)) err(where, `echo points to missing event "${echoId}"`);
  }
  checkText(`${where} chronicle`, b.chronicle);
  if (needOutcome && !b.chronicle && !b.effects && !b.endGame && !b.hiddenEffects) {
    warn(where, 'branch has no chronicle and no effects');
  }
}

for (const e of all) {
  const w = e.id || '(event without id)';
  if (!e.id) err(w, 'missing id');
  if (!e.title) err(w, 'missing title');
  if (!e.text) err(w, 'missing text');
  checkText(`${w} title`, e.title);
  checkText(`${w} text`, e.text);
  const scen = e.scenarios || [e.scenario || 'panovnik'];
  for (const s of scen) if (!SCENARIOS.has(s)) err(w, `unknown scenario "${s}"`);
  if (e.seasons) for (const s of e.seasons) if (![0, 1, 2, 3].includes(s)) err(w, `bad season ${s}`);
  if (e.image && !existsSync(join(ROOT, e.image))) err(w, `image not found: ${e.image}`);

  if (e.type === 'route') {
    if (!Array.isArray(e.routeOptions) || e.routeOptions.length === 0) err(w, 'route event without routeOptions');
    (e.routeOptions || []).forEach((r, i) => {
      checkBranch(`${w} route#${i} safe`, r.onSafe);
      checkBranch(`${w} route#${i} danger`, r.onDanger);
    });
    continue;
  }
  if (!Array.isArray(e.choices) || e.choices.length === 0) { err(w, 'no choices'); continue; }
  if (e.choices.length > 4) warn(w, `${e.choices.length} choices (keyboard only covers 1–4)`);
  if (e.choices.every((c) => typeof c.requires === 'function')) {
    warn(w, 'every choice has requires() — the player can end up with no option');
  }
  const labels = new Map();
  e.choices.forEach((c, i) => {
    const cw = `${w} choice#${i + 1}`;
    if (!c.label) err(cw, 'missing label');
    // the same label twice is fine only as mutually exclusive variants (both gated by requires)
    const twin = labels.get(c.label);
    if (twin && !(twin.requires && c.requires)) err(cw, `duplicate label "${c.label}"`);
    labels.set(c.label, c);
    checkText(`${cw} label`, c.label);
    if (c.hintType === 'trait' && c.hintKey && !TRAITS.has(c.hintKey)) err(cw, `unknown trait hintKey "${c.hintKey}"`);
    if (c.hintType === 'resource' && c.hintKey && !RESOURCES.has(c.hintKey)) err(cw, `unknown resource hintKey "${c.hintKey}"`);
    if (c.isRoll) {
      if (typeof c.baseChance !== 'number') err(cw, 'roll without numeric baseChance');
      // a negative base is allowed: resourceScale / chanceBonus lift it (n_smrt_krale)
      else if (c.baseChance < -1 || c.baseChance > 1) err(cw, `baseChance ${c.baseChance} outside -1…1`);
      else if (c.baseChance < 0 && !c.resourceKey && !c.chanceBonus && !c.traitKey) err(cw, 'negative baseChance with nothing to raise it');
      if (c.traitKey && !TRAITS.has(c.traitKey)) err(cw, `unknown traitKey "${c.traitKey}"`);
      if (c.resourceKey && !RESOURCES.has(c.resourceKey)) err(cw, `unknown resourceKey "${c.resourceKey}"`);
      checkBranch(`${cw} success`, c.onSuccess);
      checkBranch(`${cw} failure`, c.onFailure);
    } else {
      checkBranch(cw, c, false);
    }
  });
}

// string references to event ids anywhere in the code
for (const f of readdirSync(join(ROOT, 'js')).filter((n) => n.endsWith('.js'))) {
  const src = readFileSync(join(ROOT, 'js', f), 'utf8');
  for (const m of src.matchAll(/(?:pendingEvent\s*=|\bevent:|\becho:)\s*'([a-z0-9_]+)'/g)) {
    if (!ids.has(m[1])) err(`js/${f}`, `reference to missing event "${m[1]}"`);
  }
}

// art coverage (information only — without its own file the game borrows event.image or the default scene)
const missingArt = all.filter((e) => !['_male', '_female', ''].some((s) => existsSync(join(ROOT, 'assets/events', `${e.id}${s}.jpg`))));

console.log(`events: ${EVENTS.length} (+${Object.keys(QUIET_EVENTS).length} quiet) · errors: ${errors.length} · warnings: ${warnings.length} · events without own art: ${missingArt.length}`);
for (const e of errors) console.log(`  ERROR  ${e}`);
for (const w of warnings) console.log(`  warn   ${w}`);
if (process.argv.includes('--art')) for (const e of missingArt) console.log(`  art    ${e.id} (${e.scenario || (e.scenarios || ['panovnik']).join('/')})`);
process.exit(errors.length ? 1 : 0);
