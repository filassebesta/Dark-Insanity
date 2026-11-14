// The war panel's army pages (map sidebar, "Válka"): who marches, the roll of troops and recruiting,
// garrisons of the provinces. Builds HTML only; clicks are handled in handleWarUi (map.js delegates).
//
// form = { tab: 'campaign' | 'army' | 'garrison', corps, rec: { <type>: batches }, garProv }
// Styles: .rc-* (css/style.css)

import { TROOP_ICONS } from './icons.js';
import {
  TROOPS, TROOP_KEYS, GARRISON_KEYS, countLabel, ensureTroops, freeTroops, stationed, troopsTotal, armyUpkeep, upkeepOf,
  recruitCap, queuedMen, ironStock, recruitBlock, recruit, cancelRecruit, disband, garrisonOf, garrisonMen,
  garrisonDrift, garrisonLabel, assignGarrison, garrisonBlock,
} from './troops.js';
import { presetCorps, SIZES } from './war.js';
import { esc } from './ui.js';

const TAGS = {
  spear: ['odolní proti jízdě', 'levní'],
  archer: ['palba z dálky', 'silní za kopiníky', 'slabí zblízka'],
  horse: ['silný náraz na křídle', 'slabá proti kopí', 'potřebuje železo'],
  siege: ['hradby a brány', 'v poli k ničemu'],
  merc: ['hned k dispozici', 'žold zlatem', 'bez jídla z domova'],
};

const f1 = (n) => (Math.round(n * 100) / 100).toString().replace('.', ',');
const ownLands = (state) => state.provinces.filter((p) => !p.lost && (!p.owner || p.owner === 'player'));
const ico = (k) => `<span class="rc-ico">${TROOP_ICONS[k]}</span>`;

export function warTabsHtml(form) {
  const tab = (id, label) => `<button class="rc-tab${form.tab === id ? ' on' : ''}" data-war-tab="${id}">${label}</button>`;
  return `<div class="rc-tabs" role="tablist">${tab('campaign', 'Tažení')}${tab('army', 'Vojsko')}${tab('garrison', 'Posádky')}</div>`;
}

// ---------- the roll of troops and recruiting ----------

function summaryHtml(state) {
  const t = ensureTroops(state);
  const field = state.war ? state.war.power : 0;
  const keep = armyUpkeep(state);
  const unit = (n, label) => `<div><b>${n}</b><small>${label}</small></div>`;
  return `<div class="rc-summary">${unit(state.resources.army, 'doma')}${unit(field, 'v poli')}${unit(queuedMen(state), 've výcviku')}${unit(recruitCap(state), 'limit')}</div>
    <p class="rc-upkeep">Údržba za období: <b>${Math.round(keep.gold)} zlata</b> a <b>${Math.round(keep.food)} jídla</b>${t.merc ? ` <small>(z toho žold ${f1(upkeepOf(state, 'merc').gold * t.merc)} zlata)</small>` : ''}. Železa ve skladu: <b>${ironStock(state)}</b>.</p>`;
}

function rosterHtml(state) {
  const t = ensureTroops(state);
  const free = freeTroops(state);
  const post = stationed(state);
  const field = state.war ? state.war.troops || {} : {};
  const rows = TROOP_KEYS.filter((k) => t[k] || field[k]).map((k) => `<div class="rc-row">
      ${ico(k)}<span class="rc-name"><b>${TROOPS[k].name}</b><small>${t[k]} doma${post[k] ? ` · z toho ${post[k]} v posádkách` : ''}${field[k] ? ` · ${field[k]} v poli` : ''}</small></span>
      <span class="rc-act">${free[k] ? `<button class="trade-mini" data-rc-disband="${k}:${Math.min(free[k], TROOPS[k].batch)}" title="Propustit">−${Math.min(free[k], TROOPS[k].batch)}</button>` : ''}</span>
    </div>`).join('');
  return `<h4 class="map-sub">Co máš</h4><div class="rc-roster">${rows || '<p class="map-desc">Zatím žádní muži pod zbraní.</p>'}</div>`;
}

function queueHtml(state) {
  const q = state.recruitQueue || [];
  if (!q.length) return '';
  return `<h4 class="map-sub">Ve výcviku</h4><ul class="rc-queue">${q.map((x, i) => {
    const left = Math.max(1, x.ready - state.turn);
    return `<li>${ico(x.type)}<span>${esc(countLabel(x.type, x.n))} <small>za ${left === 1 ? 'období' : `${left} období`}</small></span><button class="trade-mini" data-rc-cancel="${i}">Zrušit</button></li>`;
  }).join('')}</ul>`;
}

function recruitCardsHtml(state, form) {
  form.rec = form.rec || {};
  const have = ensureTroops(state);
  return `<h4 class="map-sub">Verbovat</h4><div class="rc-cards">${TROOP_KEYS.map((k) => {
    const d = TROOPS[k];
    const batches = Math.max(1, form.rec[k] || 1);
    const n = batches * d.batch;
    const why = recruitBlock(state, k, n);
    const cost = [`${Math.ceil(d.cost.gold * batches)} zlata`, d.cost.iron ? `${d.cost.iron * batches} železa` : ''].filter(Boolean).join(' · ');
    const up = upkeepOf(state, k);
    const upText = d.goldW >= 3 ? `žold ${f1(up.gold)} zlata za muže` : `údržba ${f1(up.gold)} zlata${up.food ? ` a ${f1(up.food)} jídla` : ''} za muže`;
    return `<div class="rc-card">
      <div class="rc-card-head">${ico(k)}<b>${d.name}</b><em>máš ${have[k]}</em></div>
      <p class="rc-text">${esc(d.text)}</p>
      <p class="rc-tags">${TAGS[k].map((x) => `<span>${esc(x)}</span>`).join('')}</p>
      <p class="rc-meta">Síla ${f1(d.pow)} · ${d.train ? `cvičení ${d.train === 1 ? '1 období' : `${d.train} období`}` : 'hned k dispozici'} · ${upText}</p>
      <div class="rc-buy">
        <div class="rc-stepper"><button data-rc-step="${k}:-1" aria-label="Méně"${batches <= 1 ? ' disabled' : ''}>−</button><span>${n}</span><button data-rc-step="${k}:1" aria-label="Více">+</button></div>
        <button class="seal-button primary rc-go" data-rc-buy="${k}"${why ? ' disabled' : ''}>Verbovat · ${cost}</button>
      </div>
      ${why ? `<p class="rc-why">${esc(why)}</p>` : ''}
    </div>`;
  }).join('')}</div>`;
}

export function armyTabHtml(state, form) {
  return `<span class="panel-overline">Vojsko</span>
    <h3 class="panel-title">Verbování</h3>
    <p class="map-desc">Levy jsou rychlé a levné, elita drahá a pomalá. Žoldnéři přijdou hned, ale žerou zlato. Čím víc mužů, tím dražší údržba.</p>
    ${summaryHtml(state)}${rosterHtml(state)}${queueHtml(state)}${recruitCardsHtml(state, form)}`;
}

// ---------- who marches ----------

const STEP = (k) => TROOPS[k].batch;

/** The chosen corps, made to fit what is free now (troops were posted, disbanded or lost since). */
export function clampCorps(state, form) {
  const free = freeTroops(state);
  form.corps = form.corps || presetCorps(state, 'medium');
  for (const k of TROOP_KEYS) form.corps[k] = Math.min(form.corps[k] || 0, free[k]);
  return form.corps;
}

/** The corps picker of the campaign page: presets, a stepper per type, the sum. */
export function corpsPickerHtml(state, form, target) {
  const free = freeTroops(state);
  const c = clampCorps(state, form);
  const men = troopsTotal(c);
  const rows = TROOP_KEYS.filter((k) => free[k] > 0).map((k) => `<div class="rc-row">
      ${ico(k)}<span class="rc-name"><b>${TROOPS[k].name}</b><small>volných ${free[k]}${k === 'siege' && target && !target.fort ? ' · cíl nemá hradby' : ''}</small></span>
      <div class="rc-stepper"><button data-rc-corps="${k}:-${STEP(k)}"${c[k] <= 0 ? ' disabled' : ''} aria-label="Méně">−</button><span>${c[k]}</span><button data-rc-corps="${k}:${STEP(k)}"${c[k] >= free[k] ? ' disabled' : ''} aria-label="Více">+</button></div>
    </div>`).join('');
  const presets = Object.entries(SIZES).map(([k, n]) => `<button class="trade-chip" data-rc-preset="${k}">${{ small: 'Oddíl', medium: 'Vojsko', large: 'Celá hotovost' }[k]} <small>${n}</small></button>`).join('');
  return `<h4 class="map-sub">Kdo vytáhne</h4>
    <div class="trade-goods">${presets}</div>
    <div class="rc-roster rc-corps">${rows || '<p class="map-desc">Nemáš volné muže. Verbuj je v záložce Vojsko.</p>'}</div>
    <p class="rc-corps-sum">Vytáhne <b>${men}</b> mužů · doma zůstane <b>${Math.max(0, state.resources.army - men)}</b>${stationedTotal(state) ? ` (z toho ${stationedTotal(state)} v posádkách)` : ''}.</p>`;
}

const stationedTotal = (state) => troopsTotal(stationed(state));

// ---------- garrisons ----------

export function garrisonTabHtml(state, form) {
  const lands = ownLands(state);
  if (!lands.length) return '<span class="panel-overline">Posádky</span><h3 class="panel-title">Bez půdy</h3><p class="map-desc">Nemáš žádný kraj, kam by šla posádka.</p>';
  if (!form.garProv || !lands.some((p) => p.id === form.garProv)) form.garProv = lands[0].id;
  const p = lands.find((x) => x.id === form.garProv);
  const free = freeTroops(state);
  const drift = garrisonDrift(p);
  const [word, tone] = garrisonLabel(p);
  const shortName = (x) => x.name.replace(/ \(.*\)$/, '');
  const chips = lands.map((x) => `<button class="map-chip${x.id === p.id ? ' on' : ''}" data-rc-garprov="${x.id}"><span>${esc(shortName(x))}</span><em>${garrisonMen(x) ? `${garrisonMen(x)} mužů` : 'prázdno'}</em></button>`).join('');
  const bar = (label, value, cls) => `<div class="mc-bar"><span>${label}</span><i><b class="${cls}" style="width:${value}%"></b></i><em>${value}</em></div>`;
  const gar = garrisonOf(p);
  const rows = GARRISON_KEYS.filter((k) => (gar[k] || 0) + free[k] > 0).map((k) => `<div class="rc-row">
      ${ico(k)}<span class="rc-name"><b>${TROOPS[k].name}</b><small>zde ${gar[k] || 0} · volných ${free[k]}</small></span>
      <div class="rc-stepper"><button data-rc-gar="${k}:-${STEP(k)}"${(gar[k] || 0) <= 0 ? ' disabled' : ''} aria-label="Stáhnout">−</button><span>${gar[k] || 0}</span><button data-rc-gar="${k}:${STEP(k)}"${free[k] <= 0 ? ' disabled' : ''} aria-label="Přidat">+</button></div>
    </div>`).join('');
  return `<span class="panel-overline">Posádky</span>
    <h3 class="panel-title">Kde stojí vojáci</h3>
    <p class="map-desc">Posádka ztiší nepokoje a posílí věrnost kraje a pomůže ho udržet před nájezdníky a vzbouřenci. Muži v posádce nemohou do pole.</p>
    <div class="rc-summary">${[['volných', troopsTotal(free)], ['v posádkách', stationedTotal(state)], ['doma', state.resources.army]].map(([l, n]) => `<div><b>${n}</b><small>${l}</small></div>`).join('')}</div>
    <div class="map-chip-list rc-prov">${chips}</div>
    <h4 class="map-sub">${esc(shortName(p))} <small>${esc(word)}</small></h4>
    <div class="mc-summary">${bar('Věrnost', p.loyalty, 'loyalty')}${bar('Nepokoje', p.unrest, 'unrest')}</div>
    <p class="rc-meta">Účinek posádky: nepokoje −${Math.round(drift.order)}, věrnost +${Math.round(drift.loyalty)}<span class="rc-tone ${tone}"> · ${garrisonMen(p)} mužů</span></p>
    <div class="rc-roster">${rows || '<p class="map-desc">Nemáš koho poslat. Verbuj muže v záložce Vojsko.</p>'}</div>`;
}

// ---------- clicks ----------

/**
 * One click on the army pages. Returns null when the element is not ours, else
 * { message?, error?, tab? } — map.js redraws the sidebar and tells the world.
 */
export function handleWarUi(t, state, form) {
  const tab = t.closest('[data-war-tab]');
  if (tab) { form.tab = tab.dataset.warTab; return {}; }
  const step = t.closest('[data-rc-step]');
  if (step) {
    const [k, d] = step.dataset.rcStep.split(':');
    form.rec = form.rec || {};
    form.rec[k] = Math.max(1, (form.rec[k] || 1) + Number(d));
    return {};
  }
  const buy = t.closest('[data-rc-buy]');
  if (buy) {
    if (buy.disabled) return {};
    const k = buy.dataset.rcBuy;
    const res = recruit(state, k, Math.max(1, (form.rec && form.rec[k]) || 1) * TROOPS[k].batch);
    return { ...res, changed: !res.error };
  }
  const cancel = t.closest('[data-rc-cancel]');
  if (cancel) { const res = cancelRecruit(state, Number(cancel.dataset.rcCancel)); return { ...res, changed: !res.error }; }
  const dis = t.closest('[data-rc-disband]');
  if (dis) {
    const [k, n] = dis.dataset.rcDisband.split(':');
    const res = disband(state, k, Number(n));
    return { ...res, changed: !res.error };
  }
  const preset = t.closest('[data-rc-preset]');
  if (preset) { form.corps = presetCorps(state, preset.dataset.rcPreset); return {}; }
  const corps = t.closest('[data-rc-corps]');
  if (corps) {
    const [k, d] = corps.dataset.rcCorps.split(':');
    const free = freeTroops(state);
    form.corps = form.corps || presetCorps(state, 'medium');
    form.corps[k] = Math.max(0, Math.min(free[k], (form.corps[k] || 0) + Number(d)));
    return {};
  }
  const prov = t.closest('[data-rc-garprov]');
  if (prov) { form.garProv = prov.dataset.rcGarprov; return {}; }
  const gar = t.closest('[data-rc-gar]');
  if (gar) {
    const [k, d] = gar.dataset.rcGar.split(':');
    let delta = Number(d);
    if (delta > 0) delta = Math.min(delta, freeTroops(state)[k] || 0);
    else delta = -Math.min(-delta, (garrisonOf(state.provinces.find((p) => p.id === form.garProv) || {})[k]) || 0);
    if (!delta || garrisonBlock(state, form.garProv, k, delta)) return {};
    const res = assignGarrison(state, form.garProv, k, delta);
    return { ...res, changed: !res.error, quiet: true };
  }
  return null;
}

