// The always-visible strip of mandatory contracts (orders of the lord or the
// crown): who asks, what, how much of it is in the warehouse and how much time is left.
// Drawn into #contract-bar in the top bar; clicks are handled in main.js.

import { ICONS } from './icons.js';
import { esc } from './ui.js';
import { interpolate } from './engine.js';
import {
  MARKETS, sortedContracts, contractStatus, seasonsLeftText, loadText, coinName, canSend, caravanFee,
} from './trade.js';

// the strip can be folded away (the choice is remembered in this browser)
const KEY = 'insanityKingdom.contractBarFolded';
let folded = false;
try { folded = localStorage.getItem(KEY) === '1'; } catch { /* private window: the strip simply starts open */ }

/** Folds or unfolds the strip; returns the new state. */
export function toggleContractBar() {
  folded = !folded;
  try { localStorage.setItem(KEY, folded ? '1' : '0'); } catch { /* not remembered */ }
  return folded;
}

const wagons = (n) => `${n} ${n === 1 ? 'vůz' : n < 5 ? 'vozy' : 'vozů'}`;

function giverLabel(state, c) {
  const token = c.dest === 'court' ? '{king.Title} {king.name}' : '{lord.Title} {lord.name}';
  try { return interpolate(state, token); } catch { return c.dest === 'court' ? 'Královský dvůr' : 'Panský dvůr'; }
}

function arriveText(state, caravan) {
  const left = Math.max(0, caravan.arrive - state.turn);
  return left <= 0 ? 'tohoto období' : `${left} ${left === 1 ? 'období' : 'období'}`;
}

function card(state, c) {
  const st = contractStatus(state, c);
  const m = MARKETS[c.dest];
  const pct = Math.min(100, Math.round((st.have / st.need) * 100));
  let action;
  if (c.taken) {
    action = `<span class="ctb-note ok">Na cestě${st.caravan ? ` · dorazí za ${esc(arriveText(state, st.caravan))}` : ''}</span>`;
  } else if (st.enough) {
    const why = canSend(state, c.dest, c.good, c.qty, false);
    const fee = caravanFee(state, c.dest, c.qty);
    action = `<button class="ctb-go" data-ctb-fulfill="${c.id}"${why ? ` disabled title="${esc(why)}"` : ` title="Pošle ${esc(loadText(c.qty, c.good))} ${esc(m.to)}, poplatek ${fee}"`}>Splnit</button>`;
  } else if (MARKETS.brod.buy[c.good]) {
    action = `<button class="ctb-go ghost" data-ctb-brod="${c.good}" title="Dokup zboží v Brodu">Chybí ${wagons(st.missing)} · koupit</button>`;
  } else {
    action = `<span class="ctb-note bad">Chybí ${wagons(st.missing)}</span>`;
  }
  const pill = c.taken ? 'na cestě' : seasonsLeftText(st.left);
  const dateText = c.taken ? 'náklad vyrazil' : `do ${st.date}`;
  return `<div class="ctb-card ${st.urgency}${st.enough || c.taken ? ' ready' : ''}" data-ctb-open="${c.id}" tabindex="0" role="button" aria-label="Povinná zakázka: ${esc(loadText(c.qty, c.good))}, ${esc(pill)}, ${esc(dateText)}">
    <div class="ctb-top">
      <span class="ctb-giver">${c.dest === 'court' ? ICONS.legitimacy : ICONS.houses}<b>${esc(giverLabel(state, c))}</b></span>
      <span class="ctb-time">${esc(pill)}</span>
    </div>
    <div class="ctb-what"><strong>${esc(loadText(c.qty, c.good))}</strong><span class="ctb-date">${esc(dateText)}</span></div>
    <div class="ctb-meters" title="Zboží ve skladu: ${st.have} z ${st.need}">
      <span class="ctb-lab">Sklad</span>
      <span class="ctb-meter stock"><i style="width:${pct}%"></i></span>
      <span class="ctb-count">${st.have}/${st.need}</span>
      <span class="ctb-action">${action}</span>
    </div>
    <div class="ctb-reward" title="Za splnění odměna a přízeň, za nesplnění ztratíš přízeň −3 i odměnu">Odměna +${c.reward} ${coinName(state)}${c.favor ? `, přízeň +${c.favor}` : ''} · propadnutí: přízeň −3</div>
    <span class="ctb-timebar" title="Zbývající čas"><i style="width:${Math.round(st.share * 100)}%"></i></span>
  </div>`;
}

/** Redraws the strip; hidden while there is no mandatory contract. */
export function renderContractBar(state) {
  const el = document.getElementById('contract-bar');
  if (!el) return;
  const list = state && state.trade ? sortedContracts(state).filter((c) => c.obligation) : [];
  el.hidden = !list.length;
  // a folded strip is short, so the toasts only move down for the open one
  document.body.classList.toggle('has-contract-bar', !!list.length && !folded);
  if (!list.length) { el.innerHTML = ''; return; }
  const focus = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.ctbOpen : null;
  const worst = list.map((c) => ({ c, st: contractStatus(state, c) })).sort((a, b) => a.st.left - b.st.left)[0];
  const urgent = list.some((c) => !c.taken && contractStatus(state, c).urgency === 'crit');
  const sum = folded ? `<span class="ctb-sum${urgent ? ' crit' : ''}">${worst.c.taken ? 'náklad na cestě' : `nejdřív ${esc(seasonsLeftText(worst.st.left))}, do ${esc(worst.st.date)}`}</span>` : '';
  el.classList.toggle('folded', folded);
  el.innerHTML = `<button type="button" class="ctb-title${urgent ? ' crit' : ''}" data-ctb-toggle aria-expanded="${!folded}" title="${folded ? 'Zobrazit povinné zakázky' : 'Skrýt povinné zakázky'}">${ICONS.favor}<b>Povinné zakázky</b><small>${list.length}</small><i class="ctb-chev" aria-hidden="true"></i></button>${sum}${folded ? '' : `<div class="ctb-list">${list.map((c) => card(state, c)).join('')}</div>`}`;
  if (focus) el.querySelector(`[data-ctb-open="${focus}"]`)?.focus();
}
