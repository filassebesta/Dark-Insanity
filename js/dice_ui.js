// The table: a risky choice is rolled with k% (two ten-sided dice), a fight
// is fought round by round with k6+ (see combat.js). Both are drawn in the
// story panel in place of the choices; the result goes back to main.js.

import { rollParts, rollDice } from './engine.js';
import { ENEMIES, ACTIONS, startCombat, combatRound, settleCombat } from './combat.js';
import { TRAIT_DEFS } from './data.js';
import { esc } from './ui.js';

const panel = () => document.getElementById('choice-list');
const sign = (v) => (v > 0 ? `+${v}` : v < 0 ? `−${-v}` : '±0');
const traitLabel = (key) => (TRAIT_DEFS.find((d) => d.key === key) || {}).label || '';

function hideCouncil() {
  const el = document.getElementById('event-council');
  if (el) { el.hidden = true; el.innerHTML = ''; }
}

// ---------- k%: a single roll for a risky choice ----------

function d10(cls, value) {
  return `<div class="d10 ${cls}"><svg viewBox="-50 -50 100 100"><path d="M0 -46L42 -12L26 40H-26L-42 -12Z"/><path class="d10-edge" d="M0 -46L0 -10M-42 -12L0 -10L42 -12M0 -10L-26 40M0 -10L26 40"/></svg><b>${value}</b></div>`;
}

/** Shows the roll for a risky choice; calls onDone({ success, roll }) after the player rolls and continues. */
export function openRoll(state, choice, onDone, host = panel()) {
  if (host === panel()) hideCouncil();
  const parts = rollParts(state, choice);
  const trait = choice.traitKey ? traitLabel(choice.traitKey) : '';
  const mods = parts.mods.length ? parts.mods.map((m) => `<li><span>${esc(m.label)}</span><b class="${m.value > 0 ? 'pos' : 'neg'}">${sign(m.value)}</b></li>`).join('')
    : '<li><span>Žádné úpravy</span><b>±0</b></li>';
  host.innerHTML = `
    <div class="dice-panel">
      <div class="dice-head"><span class="dice-over">Zkouška${trait ? ` · ${esc(trait)}` : ''} · hod k%</span><b>${esc(choice.label)}</b></div>
      <div class="dice-row">
        <div class="dice-pair">${d10('tens', '?')}${d10('units', '?')}</div>
        <div class="dice-calc">
          <div class="dice-need">Potřebuješ hodit <b>${parts.target}</b> nebo víc</div>
          <ul class="dice-mods">${mods}</ul>
          <div class="dice-sum">Hod <b class="ds-roll">–</b> ${sign(parts.bonus)} = <b class="ds-total">–</b></div>
        </div>
      </div>
      <p class="dice-note">Šance na úspěch ${Math.round(parts.chance * 100)} %. Na kostce 96–100 vždy uspěješ, 1–5 vždy selžeš.</p>
      <div class="dice-verdict" hidden></div>
      <button class="seal-button primary dice-primary" data-dice="roll">Hodit kostkou</button>
    </div>`;
  const root = host.querySelector('.dice-panel');
  const btn = root.querySelector('.dice-primary');
  let result = null;
  btn.addEventListener('click', () => {
    if (!result) {
      result = rollDice(state, choice);
      btn.disabled = true;
      animateK100(root, result, () => {
        btn.disabled = false;
        btn.textContent = 'Pokračovat';
        btn.dataset.dice = 'done';
        btn.focus();
      });
      return;
    }
    onDone({ success: result.success, roll: result.roll, crit: result.crit });
  });
}

function animateK100(root, r, done) {
  const tens = root.querySelector('.d10.tens');
  const units = root.querySelector('.d10.units');
  tens.classList.add('rolling');
  units.classList.add('rolling');
  const start = performance.now();
  const shown = r.roll === 100 ? [0, 0] : [Math.floor(r.roll / 10), r.roll % 10];
  const tick = (now) => {
    if (now - start < 900) {
      tens.querySelector('b').textContent = `${Math.floor(Math.random() * 10)}0`;
      units.querySelector('b').textContent = Math.floor(Math.random() * 10);
      requestAnimationFrame(tick);
      return;
    }
    tens.classList.remove('rolling');
    units.classList.remove('rolling');
    tens.querySelector('b').textContent = `${shown[0]}0`;
    units.querySelector('b').textContent = shown[1];
    root.querySelector('.ds-roll').textContent = r.roll;
    root.querySelector('.ds-total').textContent = r.total;
    const v = root.querySelector('.dice-verdict');
    const word = r.crit === 'hit' ? 'Kritický úspěch!' : r.crit === 'miss' ? 'Kritický neúspěch!' : r.success ? 'Úspěch' : 'Neúspěch';
    const why = r.crit ? `Padlo ${r.roll}.` : `${r.total} ${r.success ? '≥' : '<'} ${r.target}`;
    v.innerHTML = `<b>${word}</b><span>${why}</span>`;
    v.className = `dice-verdict ${r.success ? 'pos' : 'neg'}`;
    v.hidden = false;
    done();
  };
  requestAnimationFrame(tick);
}

// ---------- k6+: a fight in rounds ----------

const PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };

function d6(face, cls = '') {
  const pips = (PIPS[face] || []).map(([x, y]) => `<circle cx="${x * 11}" cy="${y * 11}" r="4.2"/>`).join('');
  return `<svg class="d6 ${cls}" viewBox="-21 -21 42 42"><rect x="-19" y="-19" width="38" height="38" rx="7"/>${pips}</svg>`;
}

function diceLine(faces, bonus, total, label) {
  return `<div class="cb-roll"><span class="cb-who">${esc(label)}</span><span class="cb-faces">${faces.map((f, i) => d6(f, i ? 'again' : '')).join('')}</span><span class="cb-math">${faces.join(' + ')} ${bonus < 0 ? '−' : '+'} ${Math.abs(bonus)} = <b>${total}</b></span></div>`;
}

function hpBar(cur, max) {
  return `<span class="cb-hp"><i style="width:${Math.max(0, (cur / max) * 100)}%"></i></span><b class="cb-hp-num">${cur} / ${max}</b>`;
}

/** Fights out a choice with `combat`; calls onDone({ success, combat: true, notes, over }). */
export function openCombat(state, choice, onDone) {
  hideCouncil();
  const c = startCombat(state, choice.combat);
  const def = ENEMIES[choice.combat] || ENEMIES.zbojnici;
  let last = null;

  const render = () => {
    const you = c.you;
    const foe = c.foe;
    const actions = Object.entries(ACTIONS).map(([k, a], i) => {
      const t = a.trait ? ` <small>${esc(traitLabel(a.trait))} ${you.traits[a.trait]}</small>` : '';
      return `<button class="cb-action" data-act="${k}" title="${esc(a.text)}"><span class="choice-index">${i + 1}.</span>${esc(a.label)}${t}</button>`;
    }).join('');
    const exchange = last ? `
      <div class="cb-exchange">
        ${last.you ? diceLine(last.you.a, last.you.at - last.you.a.reduce((x, y) => x + y, 0), last.you.at, 'Ty') : ''}
        ${last.you ? diceLine(last.you.d, last.you.df - last.you.d.reduce((x, y) => x + y, 0), last.you.df, foe.name) : ''}
        ${last.ally ? diceLine(last.ally.a, last.ally.at - last.ally.a.reduce((x, y) => x + y, 0), last.ally.at, `${c.ally.title} ${c.ally.name}`) : ''}
        ${last.foe ? diceLine(last.foe.a, last.foe.at - last.foe.a.reduce((x, y) => x + y, 0), last.foe.at, `${foe.name} útočí`) : ''}
        ${last.foe ? diceLine(last.foe.d, last.foe.df - last.foe.d.reduce((x, y) => x + y, 0), last.foe.df, 'Tvá obrana') : ''}
      </div>
      <ul class="cb-log">${last.lines.map((l) => `<li class="${l.tone}">${esc(l.text)}</li>`).join('')}</ul>` : `<p class="cb-intro">${esc(def.text)} Hází se k6 — šestka se hází znovu a přičítá. Útok musí přehodit obranu.${c.ally ? ` Po tvém boku stojí ${esc(c.ally.title.toLowerCase())} ${esc(c.ally.name)}.` : ''}${c.allyRefused ? ` ${esc(c.allyRefused)}` : ''}</p>`;
    const over = c.over;
    const verdict = over ? (['win', 'scared', 'broke'].includes(over)
      ? '<div class="dice-verdict pos"><b>Vítězství</b><span>Nepřítel je poražen.</span></div>'
      : over === 'fled' ? '<div class="dice-verdict neg"><b>Konec boje</b><span>Odcházíš bez vítězství.</span></div>'
        : '<div class="dice-verdict neg"><b>Porážka</b><span>Boj je prohraný.</span></div>') : '';
    panel().innerHTML = `
      <div class="dice-panel combat-panel">
        <div class="dice-head"><span class="dice-over">Souboj · kolo ${c.round + (over ? 0 : 1)} · hod k6+</span><b>${esc(choice.label)}</b></div>
        <div class="cb-fighters">
          <div class="cb-f you"><span class="cb-name">${esc(you.name)}</span>${hpBar(you.hp, you.maxHp)}<span class="cb-nums">ÚČ ${you.uc} · OČ ${you.oc} · zbraň +${you.dmg}</span>${c.ally ? `<span class="cb-ally">+ ${esc(c.ally.title)} ${esc(c.ally.name)} (ÚČ ${c.ally.uc})</span>` : ''}</div>
          <div class="cb-vs">⚔</div>
          <div class="cb-f foe"><span class="cb-name">${esc(foe.name)}</span>${hpBar(foe.hp, foe.maxHp)}<span class="cb-nums">ÚČ ${foe.uc} · OČ ${foe.oc - foe.ocMalus}${foe.ocMalus ? ' (lest)' : ''} · zbraň +${foe.dmg}</span></div>
        </div>
        ${exchange}
        ${verdict}
        ${over ? '<button class="seal-button primary dice-primary" data-dice="done">Pokračovat</button>' : `<div class="cb-actions">${actions}</div>${c.boost ? `<p class="dice-note">Příští útok +${c.boost}.</p>` : ''}`}
      </div>`;
    const root = panel().querySelector('.combat-panel');
    root.querySelectorAll('.cb-action').forEach((b) => b.addEventListener('click', () => act(b.dataset.act)));
    const done = root.querySelector('.dice-primary');
    if (done) {
      done.addEventListener('click', () => onDone(settleCombat(state, c)));
      done.focus();
    }
  };

  const act = (action) => {
    if (c.over) return;
    const root = panel().querySelector('.combat-panel');
    root.querySelectorAll('.cb-action').forEach((b) => { b.disabled = true; });
    root.classList.add('shaking');
    setTimeout(() => {
      last = combatRound(state, c, action);
      render();
    }, 450);
  };

  render();
}
