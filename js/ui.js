import { RESOURCE_DEFS, TRAIT_DEFS, STATUS_TIERS, TERRAIN_DEFS, SEASONS } from './data.js';
import { interpolate, previewVisibleEffects, computeSuccessChance } from './engine.js';
import { ICONS } from './icons.js';
import { playMusic, setAllMuted } from './audio.js';
import { rulerPortraitCandidates, memberPortraitCandidates, portraitImg } from './character.js';
import { roleLabel, loyaltyLabel } from './court.js';

const DEFAULT_SCENE = 'assets/events/scene_default.jpg';

let typewriterTimer = null;
let typewriterEnabled = true;

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function setTypewriterEnabled(enabled) {
  typewriterEnabled = enabled;
}

export function showScreen(id) {
  document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  // main theme in the menus; in-game the event decides (see main.js)
  if (id !== 'screen-game' && id !== 'screen-ending') playMusic('menu');
}

// ---------- music state shown in the UI ----------

export function setMusicMuted(muted) {
  setAllMuted(muted);
  document.querySelectorAll('[data-action="toggle-music"]').forEach((btn) => {
    btn.innerHTML = muted ? ICONS.mute : ICONS.sound;
    btn.title = muted ? 'Zapnout hudbu' : 'Ztlumit hudbu';
    btn.setAttribute('aria-label', btn.title);
  });
}

/** Swap in dedicated scenario-card art when the files exist (assets/ui/scenario_<key>.jpg). */
export function upgradeScenarioArt() {
  document.querySelectorAll('.scenario-card').forEach((card) => {
    const src = `assets/ui/scenario_${card.dataset.scenario}.jpg`;
    firstExistingImage([src, src.replace(/\.jpg$/, '.png')], null).then((found) => {
      if (found) card.querySelector('.scenario-art').style.backgroundImage = `url("${found}")`;
    });
  });
}

export function renderStaticIcons() {
  const back = document.querySelector('.menu-return-button');
  if (back) back.innerHTML = ICONS.menu;
}

export function toast(message) {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 2900);
}

// ---------- typewriter ----------

function typewrite(el, text, onDone) {
  clearInterval(typewriterTimer);
  typewriterTimer = null;
  el._skipHandler = null;
  if (!typewriterEnabled) {
    el.textContent = text;
    if (onDone) onDone();
    return;
  }
  el.textContent = '';
  let i = 0;
  const finish = () => {
    clearInterval(typewriterTimer);
    typewriterTimer = null;
    el._skipHandler = null;
    el.textContent = text;
    if (onDone) onDone();
  };
  typewriterTimer = setInterval(() => {
    i += 2;
    el.textContent = text.slice(0, i);
    if (i >= text.length) finish();
  }, 18);
  el._skipHandler = finish;
}

// Returns true when there was running text to complete.
export function skipTypewriter() {
  const el = document.getElementById('event-text');
  if (el && el._skipHandler) {
    el._skipHandler();
    return true;
  }
  return false;
}

// ---------- top bar ----------

let previousResourceValues = null;

export function resetResourceMemory() {
  previousResourceValues = null;
}

export function renderResourceBar(state) {
  const bar = document.getElementById('resource-chips');
  bar.innerHTML = '';
  for (const def of RESOURCE_DEFS) {
    const value = state.resources[def.key];
    const previous = previousResourceValues ? previousResourceValues[def.key] : value;
    const chip = document.createElement('div');
    let flashClass = '';
    if (value !== previous) flashClass = value > previous ? ' flash-pos' : ' flash-neg';
    chip.className = 'resource-chip' + (value <= def.critical ? ' critical' : '') + flashClass;
    chip.title = def.label;
    chip.style.setProperty('--chip-color', `var(--res-${def.key})`);
    chip.innerHTML = `<span class="icon">${def.icon}</span><span class="value">${value}</span>`;
    bar.appendChild(chip);
  }
  previousResourceValues = { ...state.resources };
}

export function renderReignInfo(state) {
  document.getElementById('reign-name').textContent = `${state.ruler.name} ${state.dynastyName}`;
  const date = `${SEASONS[state.seasonIndex]} · rok ${state.year}`;
  document.getElementById('reign-date').textContent = `${date} · ${state.generation}. generace`;
  document.getElementById('scene-date').textContent = date;
}

export function updateBookTabFlags(state) {
  const anyUnrest = state.provinces.some((p) => !p.lost && p.unrest >= 70);
  const anyDisloyal = [state.heir, state.spouse, state.chancellor, state.marshal, state.spymaster]
    .some((c) => c.alive && c.loyalty <= 25);
  document.querySelector('.book-tab[data-panel="map"]').classList.toggle('flagged', anyUnrest);
  document.querySelector('.book-tab[data-panel="court"]').classList.toggle('flagged', anyDisloyal);
}

// ---------- character plaque (bottom of the scene) ----------

function tierLabel(r) {
  if (r.statusTier === 5) return r.gender === 'female' ? 'Královna' : 'Král';
  return STATUS_TIERS[r.statusTier];
}

export function renderCharacterPlaque(state, bumpedTrait = null) {
  const r = state.ruler;
  const initial = esc(r.name ? r.name[0] : '?');
  document.getElementById('character-plaque').innerHTML = `
    <div class="plaque-portrait" data-action="open-character" title="Zobrazit postavu">${initial}${portraitImg(rulerPortraitCandidates(r), r.name)}</div>
    <div class="plaque-id">
      <span class="plaque-name">${esc(r.name)}</span>
      <span class="plaque-sub">${esc(tierLabel(r))} · ${r.age} let</span>
    </div>
    <div class="plaque-traits">
      ${TRAIT_DEFS.map((t) => `<span class="plaque-trait${t.key === bumpedTrait ? ' bump' : ''}" title="${t.label}">${t.icon}${r.traits[t.key]}</span>`).join('')}
    </div>
  `;
}

// ---------- scene + story ----------

export function renderTurnSummary(text) {
  document.getElementById('turn-summary').textContent = text || '';
}

const imageProbe = new Map();
function probeImage(src) {
  if (!imageProbe.has(src)) {
    imageProbe.set(src, new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    }));
  }
  return imageProbe.get(src);
}

/** First existing image from the list (optional per-event art first), else the default scene. */
export async function firstExistingImage(candidates, fallback = DEFAULT_SCENE) {
  for (const src of candidates.filter(Boolean)) {
    if (await probeImage(src)) return src;
  }
  return fallback;
}

let sceneRequest = 0;
export async function setSceneImage(candidates) {
  const list = Array.isArray(candidates) ? candidates : [candidates];
  const ticket = ++sceneRequest;
  const src = await firstExistingImage([...list, DEFAULT_SCENE], null);
  if (ticket !== sceneRequest) return;
  const el = document.getElementById('event-image');
  const url = src ? `url("${src}")` : 'none';
  if (el.style.backgroundImage === url) return;
  el.style.backgroundImage = url;
  el.classList.remove('swap');
  void el.offsetWidth;
  el.classList.add('swap');
}

function hintIcon(hintType, hintKey) {
  const source = hintType === 'trait' ? TRAIT_DEFS : RESOURCE_DEFS;
  const found = source.find((d) => d.key === hintKey);
  return found ? found.icon : ICONS.unknown;
}

function renderChoicePreview(deltaEffects) {
  const el = document.getElementById('choice-preview');
  if (!deltaEffects || !Object.keys(deltaEffects).length) {
    el.innerHTML = '';
    return;
  }
  el.innerHTML = Object.entries(deltaEffects).map(([key, delta]) => {
    const def = RESOURCE_DEFS.find((d) => d.key === key);
    if (!def || !delta) return '';
    const cls = delta > 0 ? 'delta-pos' : 'delta-neg';
    return `<span class="${cls}">${def.icon}${delta > 0 ? '+' : ''}${delta} ${def.label}</span>`;
  }).join('');
}

export function triggerCardEntrance() {
  const card = document.getElementById('event-card');
  card.classList.remove('event-enter');
  void card.offsetWidth;
  card.classList.add('event-enter');
  card.scrollTop = 0;
}

function resetOutcomeBlocks() {
  document.getElementById('event-extra').innerHTML = '';
  document.getElementById('outcome-label').hidden = true;
  document.getElementById('outcome-effects').hidden = true;
  document.getElementById('outcome-effects').innerHTML = '';
}

function makeChoiceButton(index, iconHtml, label, tagHtml) {
  const btn = document.createElement('button');
  btn.className = 'choice-button';
  btn.innerHTML = `<span class="choice-index">${index + 1}.</span><span class="icon">${iconHtml}</span><span class="choice-label">${label}</span>${tagHtml}`;
  return btn;
}

export function renderEventCard(state, event, handlers) {
  triggerCardEntrance();
  resetOutcomeBlocks();
  const g = state.ruler.gender === 'female' ? 'female' : 'male';
  setSceneImage([
    `assets/events/${event.id}_${g}.jpg`, // optional variant matching the ruler's gender
    `assets/events/${event.id}.jpg`,
    `assets/events/${event.id}.png`,
    event.image,
  ]);
  document.getElementById('event-title').textContent = event.title;
  const choiceList = document.getElementById('choice-list');
  choiceList.innerHTML = '';
  renderChoicePreview(null);

  typewrite(document.getElementById('event-text'), interpolate(state, event.text));

  if (event.type === 'route') {
    event.routeOptions.forEach((option, index) => {
      const terrain = TERRAIN_DEFS[option.terrainKey];
      const riskPct = Math.round(terrain.baseRisk * 100);
      const btn = makeChoiceButton(index, terrain.icon, terrain.label, `<span class="risk-tag">${riskPct}% ${terrain.riskLabel}</span>`);
      btn.addEventListener('click', () => handlers.onRouteSelected(option.terrainKey));
      choiceList.appendChild(btn);
    });
    document.getElementById('event-extra').innerHTML =
      `<button class="map-link" data-action="open-map-routes">${TERRAIN_DEFS.traderoute.icon}Prohlédnout cesty na mapě</button>`;
    return;
  }

  event.choices.forEach((choice, index) => {
    let tag = '';
    if (choice.isRoll) {
      const pct = Math.round(computeSuccessChance(state, choice) * 100);
      const trait = TRAIT_DEFS.find((d) => d.key === choice.traitKey);
      const res = RESOURCE_DEFS.find((d) => d.key === choice.resourceKey);
      const basis = [
        trait ? `${trait.label} ${state.ruler.traits[trait.key]}` : '',
        res ? `${res.label} ${state.resources[res.key]}` : '',
      ].filter(Boolean).join(' + ');
      tag = `<span class="risk-tag" title="Šance na úspěch závisí na: ${basis || 'náhodě'}">${basis ? `${esc(basis)} · ` : ''}${pct} %</span>`;
    }
    const gain = choice.traitGain || (choice.isRoll && choice.onSuccess && choice.onSuccess.traitGain);
    if (gain) {
      const g = TRAIT_DEFS.find((d) => d.key === gain);
      tag += `<span class="grow-tag" title="${choice.isRoll ? 'Při úspěchu' : 'Touto volbou'} se zlepší ${g.label}">${g.icon}rozvíjí</span>`;
    }
    const btn = makeChoiceButton(index, hintIcon(choice.hintType, choice.hintKey), choice.label, tag);
    const preview = () => renderChoicePreview(previewVisibleEffects(choice));
    btn.addEventListener('mouseenter', preview);
    btn.addEventListener('focus', preview);
    btn.addEventListener('mouseleave', () => renderChoicePreview(null));
    btn.addEventListener('click', () => handlers.onChoiceSelected(index));
    choiceList.appendChild(btn);
  });
}

const OUTCOME_LABELS = {
  success: ['Úspěch', 'good'],
  failure: ['Nezdar', 'bad'],
  safe: ['Bez úhony', 'good'],
  danger: ['Nebezpečí', 'bad'],
};

export function renderOutcome(state, result, onContinue) {
  triggerCardEntrance();
  document.getElementById('event-extra').innerHTML = '';
  renderChoicePreview(null);

  const labelEl = document.getElementById('outcome-label');
  const label = OUTCOME_LABELS[result.outcome];
  if (label) {
    labelEl.textContent = label[0];
    labelEl.className = `outcome-label ${label[1]}`;
    labelEl.hidden = false;
  } else {
    labelEl.hidden = true;
  }

  const chips = Object.entries(result.effects || {})
    .filter(([key, delta]) => delta && RESOURCE_DEFS.some((d) => d.key === key))
    .map(([key, delta]) => {
      const def = RESOURCE_DEFS.find((d) => d.key === key);
      return `<span class="effect-chip ${delta > 0 ? 'pos' : 'neg'}">${def.icon}${delta > 0 ? '+' : ''}${delta} ${def.label}</span>`;
    });
  if (result.traitGained) {
    const t = TRAIT_DEFS.find((d) => d.key === result.traitGained);
    chips.push(`<span class="effect-chip trait">${t.icon}+1 ${t.label}</span>`);
  }
  for (const note of result.notes || []) {
    chips.push(`<span class="effect-chip note ${note.tone}">${esc(note.text)}</span>`);
  }
  const effectsEl = document.getElementById('outcome-effects');
  effectsEl.innerHTML = chips.map((c, i) => c.replace('class="effect-chip', `style="animation-delay:${0.25 + i * 0.08}s" class="effect-chip`)).join('');
  effectsEl.hidden = chips.length === 0;

  const choiceList = document.getElementById('choice-list');
  choiceList.innerHTML = '';
  const btn = document.createElement('button');
  btn.className = 'choice-button continue-button';
  btn.textContent = 'Pokračovat';
  btn.addEventListener('click', onContinue);
  choiceList.appendChild(btn);

  typewrite(document.getElementById('event-text'), result.text || 'Rozhodnutí bylo učiněno.');
}

// ---------- court panel ----------

export function renderCourtPanel(state) {
  const grid = document.getElementById('court-grid');
  grid.innerHTML = '';
  const f = (c, male, female) => (c.gender === 'female' ? female : male);
  const members = [
    { data: state.ruler, role: f(state.ruler, 'Vládce', 'Vládkyně'), extra: tierLabel(state.ruler), portraits: rulerPortraitCandidates(state.ruler) },
    ...['heir', 'spouse', 'chancellor', 'marshal', 'spymaster'].map((r) => (
      { data: state[r], role: roleLabel(r, state[r].gender), portraits: memberPortraitCandidates(state[r], r), person: r })),
  ];
  for (const m of members) {
    const card = document.createElement('button');
    const alive = m.data.alive !== false;
    card.className = 'court-card' + (alive ? '' : ' deceased');
    if (m.person) card.dataset.person = m.person;
    else card.dataset.action = 'open-character';
    card.title = 'Zobrazit detail';
    const name = esc(m.data.name);
    const avatar = `<div class="court-avatar">${esc(m.data.name ? m.data.name[0] : '?')}${portraitImg(m.portraits, m.data.name, 'court-avatar-img')}</div>`;
    const detail = m.data.loyalty !== undefined ? `${loyaltyLabel(m.data.loyalty, m.data.gender)} · ${m.data.loyalty}` : esc(m.extra || '');
    card.innerHTML = `
      ${avatar}
      <div class="role">${m.role}</div>
      <strong>${name}${alive ? '' : ' †'}</strong>
      <div>${m.data.age} let · ${detail}</div>
    `;
    grid.appendChild(card);
  }

  grid.parentElement.querySelector('.ruler-status')?.remove();
  const traitsHost = document.createElement('div');
  traitsHost.className = 'ruler-status';
  traitsHost.innerHTML = '<h4>Vlastnosti vládce</h4>' + TRAIT_DEFS.map((t) =>
    `<div class="trait-row"><span>${t.icon}${t.label}</span><span>${state.ruler.traits[t.key]}</span></div>`
  ).join('');
  grid.after(traitsHost);
}

// ---------- chronicle panel ----------

export function renderChroniclePanel(state) {
  const log = document.getElementById('chronicle-log');
  log.innerHTML = '';
  for (const entry of [...state.chronicle].reverse()) {
    const div = document.createElement('div');
    div.className = 'chronicle-entry';
    div.innerHTML = `<span class="entry-date">${SEASONS[entry.season]} · rok ${entry.year}</span>${esc(entry.text)}`;
    log.appendChild(div);
  }
}

// ---------- panels open/close ----------

export function openPanel(panelName) {
  document.querySelectorAll('.side-panel').forEach((el) => el.classList.remove('open'));
  const el = document.getElementById('panel-' + panelName);
  if (el) el.classList.add('open');
  document.getElementById('panel-overlay').classList.add('dim');
}

export function closePanels() {
  document.querySelectorAll('.side-panel').forEach((el) => el.classList.remove('open'));
  document.getElementById('panel-overlay').classList.remove('dim');
}

export function isPanelOpen() {
  return document.querySelector('.side-panel.open') !== null;
}

// ---------- ending screen ----------

const ENDING_TITLES = {
  death: 'Smrt',
  conquest: 'Dobytí',
  collapse: 'Kolaps',
  golden_age: 'Zlatý věk',
};

export function renderEndingScreen(state, gameOver) {
  const screen = document.getElementById('screen-ending');
  screen.style.removeProperty('--backdrop');
  firstExistingImage([`assets/endings/ending_${gameOver.type}.jpg`, `assets/endings/ending_${gameOver.type}.png`], null).then((src) => {
    // absolute URL: a url() inside a custom property resolves against the stylesheet, not the page
    if (src) screen.style.setProperty('--backdrop', `url("${new URL(src, document.baseURI).href}")`);
  });
  document.getElementById('ending-title').textContent = ENDING_TITLES[gameOver.type] || 'Konec';
  document.getElementById('ending-text').textContent = gameOver.text;
  const years = state.turn > 0 ? Math.ceil(state.turn / SEASONS.length) : 0;
  document.getElementById('ending-stats').innerHTML = [
    ['Dynastie', state.dynastyName],
    ['Let vlády', years],
    ['Generací', state.generation],
    ['Zlato', state.resources.gold],
    ['Stabilita', state.resources.stability],
    ['Prestiž', state.resources.prestige],
  ].map(([label, value]) => `<div><span>${label}</span><span>${esc(value)}</span></div>`).join('');
}
