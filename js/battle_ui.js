// The deployment screen: before a battle the player places the corps in the slots (wings, centre,
// reserve; at a siege walls, gate, rear), sees what he knows of the enemy line, and then watches the
// result. Works with taps (steppers), no dragging. Drawn in the story panel in place of the choices,
// like the dice table (dice_ui.js); the result goes back to main.js as { success, battle }.
// Styles: .bt-* (css/style.css). The rules are in battle.js.

import { TROOP_ICONS } from './icons.js';
import { TROOPS, TROOP_KEYS, troopsTotal } from './troops.js';
import {
  KINDS, slotsOf, prepareBattle, fieldCorps, enemyView, autoDeploy, normalizeDeployment, previewDeployment,
  fightBattle, terrainLabel, GRADE_LABEL, lossLine,
} from './battle.js';
import { esc } from './ui.js';

const panel = () => document.getElementById('choice-list');
const num = (g, k) => (g && g[k]) || 0;

function hideCouncil() {
  const el = document.getElementById('event-council');
  if (el) { el.hidden = true; el.innerHTML = ''; }
}

const FRONT_WORD = (m) => (m >= 0.12 ? ['Převaha', 'good'] : m <= -0.12 ? ['Hrozí prolomení', 'bad'] : ['Vyrovnáno', 'warn']);
const TOTAL_WORD = (S) => (S >= 0.12 ? ['Převaha', 'good'] : S >= -0.08 ? ['Vyrovnané síly', 'warn'] : ['Nepřítel je silnější', 'bad']);

const unitIcon = (k) => `<span class="bt-ico" title="${esc(TROOPS[k].name)}">${TROOP_ICONS[k]}</span>`;

function compIcons(g) {
  const parts = TROOP_KEYS.filter((k) => num(g, k) > 0).map((k) => `<span class="bt-mini">${unitIcon(k)}${g[k]}</span>`);
  return parts.length ? parts.join('') : '<span class="bt-none">nikdo</span>';
}

/** Opens the deployment screen for a choice with `deploy`; onDone({ success, battle }) after the result is read. */
export function openBattle(state, choice, onDone, host = panel()) {
  if (host === panel()) hideCouncil();
  const battle = prepareBattle(state, choice.deploy, choice.stance || null);
  const kind = battle.kind;
  const corps = fieldCorps(state);
  const view = enemyView(state, battle);
  const autoDep = () => autoDeploy(state, battle);
  let dep = normalizeDeployment(kind, corps, autoDep());
  let step = 5;
  const slotName = (s) => (s.reserve && battle.stance === 'flank' ? 'Obchvat' : s.name);

  const present = TROOP_KEYS.filter((k) => num(corps, k) > 0);

  const slotCard = (s, fronts) => {
    const g = dep[s.key] || {};
    const men = troopsTotal(g);
    const line = view.lines.find((l) => l.key === s.key);
    const f = fronts.find((x) => x.key === s.key);
    const [word, tone] = s.reserve ? ['', 'neutral'] : f && (men || troopsTotal(f.theirs)) ? FRONT_WORD(f.m) : ['Prázdno', 'neutral'];
    const foeText = line ? (view.exact && line.comp ? `<span class="bt-foe-ico">${compIcons(line.comp)}</span>` : `<span>${esc(line.desc)}</span>`) : s.reserve ? '<span>Nepřítel si zálohu drží v pozadí</span>' : '<span>prázdno</span>';
    const units = present.map((k) => `<div class="bt-unit">
        ${unitIcon(k)}<b>${num(g, k)}</b><small>${esc(TROOPS[k].short)}</small>
        ${s.reserve ? '' : `<div class="bt-btns"><button data-bt-move="${s.key}:${k}:-1" aria-label="Stáhnout ${esc(TROOPS[k].name)}"${num(g, k) ? '' : ' disabled'}>−</button><button data-bt-move="${s.key}:${k}:1" aria-label="Přidat ${esc(TROOPS[k].name)}"${num(dep.Z, k) ? '' : ' disabled'}>+</button></div>`}
      </div>`).join('');
    return `<section class="bt-slot${s.reserve ? ' reserve' : ''} ${tone}" data-slot="${s.key}">
      <header><b>${esc(slotName(s))}</b><em>${men} mužů${word ? ` · <span class="bt-state ${tone}">${word}${view.exact ? '' : '?'}</span>` : ''}</em></header>
      <p class="bt-foe">${s.reserve ? 'Jede tam, kde je nejhůř. ' : 'Proti: '}${s.reserve ? '' : foeText}</p>
      <div class="bt-units">${units}</div>
    </section>`;
  };

  const drawBody = () => {
    const pv = previewDeployment(state, battle, dep);
    const [tw, tt] = TOTAL_WORD(pv.S);
    const slots = host.querySelector('.bt-slots');
    slots.innerHTML = slotsOf(kind).map((s) => slotCard(s, pv.fronts)).join('');
    host.querySelector('.bt-total').innerHTML = `Odhad podle toho, co víš: <b class="${tt}">${tw}</b>${view.exact ? '' : ' <small>(zvědové se mohou plést)</small>'}`;
    host.querySelectorAll('[data-bt-step]').forEach((b) => b.classList.toggle('on', Number(b.dataset.btStep) === step));
  };

  host.innerHTML = `
    <div class="bt-panel">
      <div class="bt-head"><span class="bt-over">${esc(KINDS[kind].title)} · ${esc(battle.place || '')} · ${esc(terrainLabel(kind === 'siege' ? 'castle' : battle.terrain))}</span><b>Rozestav vojsko</b></div>
      <p class="bt-intel ${view.exact ? 'exact' : 'rough'}"><span>${esc(view.why)}</span> <b>Nepřítel: ${esc(view.total)}</b></p>
      <div class="bt-tools">
        <span class="bt-stepper">Krok
          ${[1, 5, 10].map((n) => `<button class="trade-chip" data-bt-step="${n}">${n}</button>`).join('')}</span>
        <button class="trade-mini" data-bt-auto>Automaticky</button>
        <button class="trade-mini" data-bt-reset>Všichni do zálohy</button>
      </div>
      <div class="bt-slots"></div>
      <p class="bt-total"></p>
      <p class="bt-note">${battle.stance === 'flank' ? 'Záloha jde obchvatem: když se vydaří, udeří nepříteli do zad, jinak přijde pozdě. ' : ''}${kind === 'ambush' ? 'Přepadená kolona je nepřipravená, záloha u vozů dorazí jen napůl. ' : ''}Nerozdělení muži zůstanou v záloze.</p>
      <button class="seal-button primary bt-fight" data-bt-fight>Zahájit bitvu</button>
    </div>`;
  drawBody();

  const root = host.querySelector('.bt-panel');
  root.addEventListener('click', (e) => {
    const t = e.target;
    const stepBtn = t.closest('[data-bt-step]');
    if (stepBtn) { step = Number(stepBtn.dataset.btStep); drawBody(); return; }
    const mv = t.closest('[data-bt-move]');
    if (mv && !mv.disabled) {
      const [slot, k, d] = mv.dataset.btMove.split(':');
      const from = Number(d) > 0 ? 'Z' : slot;
      const to = Number(d) > 0 ? slot : 'Z';
      const n = Math.min(step, num(dep[from], k));
      if (n > 0) {
        dep[from][k] = num(dep[from], k) - n;
        dep[to][k] = num(dep[to], k) + n;
      }
      drawBody();
      return;
    }
    if (t.closest('[data-bt-auto]')) { dep = normalizeDeployment(kind, corps, autoDep()); drawBody(); return; }
    if (t.closest('[data-bt-reset]')) { dep = normalizeDeployment(kind, corps, {}); drawBody(); return; }
    if (t.closest('[data-bt-fight]')) showResult(fightBattle(state, battle, dep));
  });

  function showResult(r) {
    const tone = r.win ? 'pos' : r.grade === 'draw' ? 'mid' : 'neg';
    const lossIcons = TROOP_KEYS.filter((k) => r.losses[k] > 0).map((k) => `<span class="bt-mini">${unitIcon(k)}−${r.losses[k]}</span>`).join('') || '<span class="bt-none">žádné ztráty</span>';
    const rows = r.slots.filter((s) => s.men + s.enemyMen > 0).map((s) => {
      const [w, c] = FRONT_WORD(s.m);
      return `<li><span>${esc(s.name)}${s.reserve ? ' <small>(sem dorazila záloha)</small>' : ''}</span><b class="${c}">${w === 'Hrozí prolomení' ? 'Prolomeno' : w}</b><em>padlo ${s.lost}</em></li>`;
    }).join('');
    host.innerHTML = `
      <div class="bt-panel bt-result">
        <div class="bt-verdict ${tone}"><b>${esc(GRADE_LABEL[r.grade])}</b><span>${esc(r.kind === 'siege' ? 'Útok na pevnost' : KINDS[r.kind].title)}</span></div>
        <ul class="bt-fronts">${rows}</ul>
        <div class="bt-losses"><span>Naše ztráty:</span>${lossIcons}<small>(${esc(lossLine(r.losses))})</small></div>
        <p class="bt-effects">Nepřítel ztratil asi ${r.enemyLoss} mužů · postup ${r.progress > 0 ? '+' : ''}${r.progress} % · morálka ${r.morale > 0 ? '+' : ''}${r.morale}${r.engines ? ` · stroje u hradeb: ${r.engines}` : ''}</p>
        <button class="seal-button primary bt-continue" data-bt-done>Pokračovat</button>
      </div>`;
    host.querySelector('[data-bt-done]').addEventListener('click', () => onDone({ success: r.win, battle: r }));
  }
}
