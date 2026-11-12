import { RESOURCE_DEFS, TRAIT_DEFS, TERRAIN_DEFS, SEASONS, NOBLE_HOUSES, resourceLabel, activeResourceDefs, tierTitle } from './data.js';
import { interpolate, computeSuccessChance, attitudeLabel, ownProvinces, reignEpithet, decreeAvailable } from './engine.js';
import { ICONS } from './icons.js';
import { playMusic, setAllMuted } from './audio.js';
import { rulerPortraitCandidates, memberPortraitCandidates, portraitImg } from './character.js';
import { roleLabel, loyaltyLabel, quirkLabel } from './court.js';
import { councilAdvice } from './council.js';
import { effectiveTraits, injuryWords } from './injuries.js';
import { ENEMIES } from './combat.js';

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
  for (const def of activeResourceDefs(state)) {
    const value = state.resources[def.key];
    const previous = previousResourceValues ? previousResourceValues[def.key] : value;
    const chip = document.createElement('div');
    let flashClass = '';
    if (value !== previous) flashClass = value > previous ? ' flash-pos' : ' flash-neg';
    chip.className = 'resource-chip' + (value <= def.critical ? ' critical' : '') + flashClass;
    chip.title = resourceLabel(def, state.scenario);
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
  const anyUnrest = ownProvinces(state).some((p) => p.unrest >= 70);
  const housesTab = document.querySelector('.book-tab[data-panel="houses"]');
  housesTab.hidden = state.scenario !== 'slechtic';
  document.querySelector('.book-tab[data-panel="war"]').hidden = state.scenario === 'sedlak'; // a peasant wages no wars
  if (state.houses) housesTab.classList.toggle('flagged', state.resources.favor <= 25 || state.houses.some((h) => h.attitude < 25));
  const anyDisloyal = [state.heir, state.spouse, state.chancellor, state.marshal, state.spymaster]
    .some((c) => c.alive && c.loyalty <= 25);
  const mapTab = document.querySelector('.book-tab[data-panel="map"]');
  mapTab.classList.toggle('flagged', anyUnrest);
  mapTab.classList.toggle('has-decree', decreeAvailable(state));
  mapTab.title = decreeAvailable(state) ? 'Letos můžeš vydat výnos' : '';
  const courtTab = document.querySelector('.book-tab[data-panel="court"]');
  courtTab.classList.toggle('flagged', anyDisloyal);
  // a peasant has a family and neighbours, not a court
  const peasant = state.scenario === 'sedlak';
  courtTab.textContent = peasant ? 'Rodina' : 'Dvůr';
  document.getElementById('court-title').textContent = peasant ? 'Rodina a ves' : 'Dvůr';
  document.getElementById('court-overline').textContent = peasant ? 'Rod a sousedé' : 'Rod a rádci';
  document.getElementById('court-hint').textContent = peasant
    ? 'Klikni na člena rodiny nebo souseda a dozvíš se, kdo to je a co ho ovlivnilo.'
    : 'Klikni na člena dvora a dozvíš se, kdo to je a co ho ovlivnilo.';
  mapTab.title = decreeAvailable(state) ? (peasant ? 'Letos můžeš naplánovat práci na gruntu' : 'Letos můžeš vydat výnos') : '';
}

// ---------- character plaque (bottom of the scene) ----------

function tierLabel(r) {
  return tierTitle(r.statusTier, r.gender);
}

export function renderCharacterPlaque(state, bumpedTrait = null) {
  const r = state.ruler;
  const initial = esc(r.name ? r.name[0] : '?');
  const eff = effectiveTraits(r);
  const hurt = injuryWords(r);
  document.getElementById('character-plaque').innerHTML = `
    <div class="plaque-portrait" data-action="open-character" title="Zobrazit postavu">${initial}${portraitImg(rulerPortraitCandidates(r), r.name)}</div>
    <div class="plaque-id">
      <span class="plaque-name">${esc(r.name)}</span>
      <span class="plaque-sub">${esc(tierLabel(r))} · ${r.age} let${state.war && state.war.leader === 'ruler' ? ' · <em class="plaque-hurt">v poli</em>' : ''}${hurt.length ? ` · <em class="plaque-hurt">${esc(hurt.join(', '))}</em>` : ''}</span>
    </div>
    <div class="plaque-traits">
      ${TRAIT_DEFS.map((t) => {
        const low = eff[t.key] < r.traits[t.key];
        return `<span class="plaque-trait${t.key === bumpedTrait ? ' bump' : ''}${low ? ' hurt' : ''}" title="${t.label}${low ? ` ${eff[t.key]} (bez zranění ${r.traits[t.key]})` : ''}">${t.icon}${eff[t.key]}</span>`;
      }).join('')}
    </div>
  `;
}

// ---------- scene + story ----------

export function renderTurnSummary(text) {
  document.getElementById('turn-summary').textContent = text || '';
}

/** News from the roads this season: caravans back home, broken orders. */
export function renderTradeNews(lines) {
  const el = document.getElementById('trade-news');
  el.innerHTML = (lines || []).map((l) => `<li>${esc(l)}</li>`).join('');
  el.hidden = !(lines && lines.length);
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

export function triggerCardEntrance() {
  const card = document.getElementById('event-card');
  card.classList.remove('event-enter');
  void card.offsetWidth;
  card.classList.add('event-enter');
  card.scrollTop = 0;
}

function resetOutcomeBlocks() {
  document.getElementById('event-extra').innerHTML = '';
  clearCouncil();
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
  document.getElementById('event-title').textContent = interpolate(state, event.title); // titles may follow the monarch's gender
  renderSceneEcho(state, event);
  const choiceList = document.getElementById('choice-list');
  choiceList.innerHTML = '';

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

  let shown = 0;
  const shownAt = {};
  event.choices.forEach((choice, index) => {
    if (choice.requires && !choice.requires(state)) return; // e.g. needs a secret or a conspiracy
    shownAt[index] = shown;
    let tag = '';
    if (choice.isRoll && choice.combat) {
      const foe = ENEMIES[choice.combat];
      tag = `<span class="risk-tag combat-tag" title="Souboj po kolech s kostkou k6">⚔ Souboj · ${esc(foe ? foe.name : '')}</span>`;
    } else if (choice.isRoll) {
      const pct = Math.round(computeSuccessChance(state, choice) * 100);
      const trait = TRAIT_DEFS.find((d) => d.key === choice.traitKey);
      const res = RESOURCE_DEFS.find((d) => d.key === choice.resourceKey);
      const basis = [
        trait ? `${trait.label} ${effectiveTraits(state.ruler)[trait.key]}` : '',
        res ? `${resourceLabel(res, state.scenario)} ${state.resources[res.key]}` : '',
      ].filter(Boolean).join(' + ');
      tag = `<span class="risk-tag" title="Hod k% — šance závisí na: ${basis || 'náhodě'}">${basis ? `${esc(basis)} · ` : ''}k% · ${pct} %</span>`;
    }
    // what a choice costs or brings stays hidden until it is made
    const btn = makeChoiceButton(shown++, hintIcon(choice.hintType, choice.hintKey), esc(interpolate(state, choice.label)), tag); // labels may follow genders too
    btn.addEventListener('click', () => handlers.onChoiceSelected(index));
    choiceList.appendChild(btn);
  });
  renderCouncil(state, event, shownAt);
}

// ---------- the council: advisers recommend a choice (see council.js) ----------

function clearCouncil() {
  const el = document.getElementById('event-council');
  el.innerHTML = '';
  el.hidden = true;
}

function renderCouncil(state, event, shownAt) {
  const el = document.getElementById('event-council');
  const advice = councilAdvice(state, event);
  if (!advice.length) { clearCouncil(); return; }
  el.innerHTML = `<span class="council-title">Rada</span>` + advice.map((a) => {
    const c = a.person;
    const role = roleLabel(a.role, c.gender, state.scenario, state.flags);
    const choice = event.choices[a.index];
    return `<div class="council-row" data-person="${a.role}" role="button" tabindex="0" title="${esc(role)} ${esc(c.name)} · ${esc(loyaltyLabel(c.loyalty, c.gender))}${c.quirk ? ' · ' + esc(quirkLabel(c)) : ''}">
      <div class="council-avatar">${esc(c.name[0])}${portraitImg(memberPortraitCandidates(c, a.role, state.scenario), c.name, 'council-avatar-img')}</div>
      <div class="council-body">
        <span class="council-who">${esc(role)} ${esc(c.name)} <em>${esc(loyaltyLabel(c.loyalty, c.gender).toLowerCase())}</em></span>
        <span class="council-line">„${esc(a.line)}“</span>
        <span class="council-pick">Doporučuje: <b>${shownAt[a.index] + 1}. ${esc(interpolate(state, choice.label))}</b></span>
      </div>
    </div>`;
  }).join('');
  el.hidden = false;
}

// An echo names the old decision it comes from; a crisis says what ran out.
const CRISIS_CAUSES = {
  krize_pokladna: 'Došlo zlato', krize_hlad: 'Došlo jídlo', krize_vojsko: 'Došlo vojsko',
  krize_vira: 'Víra je na dně', krize_posmech: 'Prestiž je na dně',
  krize_uchvatitel: 'Legitimita je na dně', krize_nemilost: 'Králova přízeň je na dně',
};

function renderSceneEcho(state, event) {
  const el = document.getElementById('scene-echo');
  const origin = event.echo && state.echoOrigin;
  el.classList.toggle('crisis', !!event.crisis);
  if (origin) {
    const who = origin.ruler && origin.ruler !== state.ruler.name ? `, kdy vládl${origin.gender === 'female' ? 'a' : ''} ${esc(origin.ruler)}` : '';
    el.innerHTML = `<b>Ozvěna</b>Rok ${origin.year}${who} · ${esc(origin.title)}: „${esc(origin.choice)}“`;
  } else if (event.crisis) {
    el.innerHTML = `<b>Krize</b>${esc(CRISIS_CAUSES[event.id] || '')}`;
  } else {
    el.innerHTML = '';
  }
  el.hidden = !el.innerHTML;
}

const OUTCOME_LABELS = {
  success: ['Úspěch', 'good'],
  failure: ['Nezdar', 'bad'],
  safe: ['Bez úhony', 'good'],
  danger: ['Nebezpečí', 'bad'],
};

export function renderOutcome(state, result, onContinue) {
  triggerCardEntrance();
  clearCouncil();
  document.getElementById('event-extra').innerHTML = '';

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
      return `<span class="effect-chip ${delta > 0 ? 'pos' : 'neg'}">${def.icon}${delta > 0 ? '+' : ''}${delta} ${resourceLabel(def, state.scenario)}</span>`;
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
    { data: state.ruler, role: state.scenario === 'sedlak' ? f(state.ruler, 'Hospodář', 'Hospodyně') : f(state.ruler, 'Vládce', 'Vládkyně'), extra: tierLabel(state.ruler), portraits: rulerPortraitCandidates(state.ruler) },
    ...['heir', 'spouse', 'chancellor', 'marshal', 'spymaster'].map((r) => (
      { data: state[r], role: roleLabel(r, state[r].gender, state.scenario, state.flags), portraits: memberPortraitCandidates(state[r], r, state.scenario), person: r })),
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
      ${m.data.quirk ? `<div class="court-quirk">${esc(quirkLabel(m.data))}</div>` : ''}
      ${m.person === 'heir' && m.data.traits ? `<div class="court-quirk">${TRAIT_DEFS.map((t) => `${t.icon}${m.data.traits[t.key]}`).join(' ')}</div>` : ''}
    `;
    grid.appendChild(card);
  }

  grid.parentElement.querySelector('.ruler-status')?.remove();
  const traitsHost = document.createElement('div');
  traitsHost.className = 'ruler-status';
  traitsHost.innerHTML = '<h4>Vlastnosti vládce</h4>' + TRAIT_DEFS.map((t) =>
    `<div class="trait-row"><span>${t.icon}${t.label}</span><span>${effectiveTraits(state.ruler)[t.key]}</span></div>`
  ).join('');
  grid.after(traitsHost);
}

// ---------- houses panel (Šlechtic) ----------

function bar(value, cls) {
  return `<div class="stat-bar"><div class="stat-bar-fill ${cls}" style="width:${value}%"></div></div>`;
}

export function renderHousesPanel(state) {
  const host = document.getElementById('houses-list');
  if (!host || !state.houses || !state.noble) return; // the houses panel belongs to the noble scenario
  const k = state.king;
  const kh = k.heir && k.heir.alive ? k.heir : null;
  const kingCard = `
    <div class="house-card crown">
      <div class="house-head">
        <span class="house-crest">${ICONS.legitimacy}</span>
        <div><span class="role">Koruna</span><strong>${k.alive ? `Král ${esc(k.name)}` : 'Trůn je prázdný'}</strong>
        <small>${k.alive ? `${k.age} let` : ''}${kh ? ` · ${kh.gender === 'female' ? 'princezna' : 'princ'} ${esc(kh.name)} (${kh.age})` : ' · bez dědice'}</small></div>
      </div>
      <div class="stat-bar-row"><span class="label">Přízeň krále</span>${bar(state.resources.favor, 'loyalty')}<span>${state.resources.favor}</span></div>
      ${state.flags.royal_match ? '<span class="house-badge gold">Zasnoubeno s korunou</span>' : ''}
    </div>`;
  const houses = state.houses.map((h) => {
    const def = NOBLE_HOUSES.find((d) => d.id === h.id);
    const seat = state.provinces.find((p) => p.id === def.seat);
    const tone = h.attitude >= 55 ? 'good' : h.attitude < 40 ? 'bad' : 'warn';
    return `
      <div class="house-card">
        <div class="house-head">
          <span class="house-crest">${ICONS.houses}</span>
          <div><span class="role">${esc(seat ? seat.name : '')}</span><strong>${esc(def.name)}</strong>
          <small>${h.head.gender === 'female' ? 'Paní' : 'Pán'} ${esc(h.head.name)}, ${h.head.age} let</small></div>
        </div>
        <p class="house-text">${esc(def.text)}</p>
        <div class="stat-bar-row"><span class="label">Vztah</span>${bar(h.attitude, 'loyalty')}<span class="house-att ${tone}">${attitudeLabel(h.attitude)}</span></div>
        <div class="stat-bar-row"><span class="label">Moc rodu</span>${bar(h.power, 'garrison')}<span>${h.power}</span></div>
        <div class="house-badges">${h.ally ? '<span class="house-badge good">Spojenec</span>' : ''}${h.married ? '<span class="house-badge gold">Sňatek</span>' : ''}</div>
      </div>`;
  }).join('');
  const plot = state.noble.plot;
  const held = state.provinces.filter((p) => p.owner === 'player').length;
  host.innerHTML = kingCard + houses + `
    <div class="house-card intrigue">
      <h4>Tajná hra</h4>
      <div class="stat-bar-row"><span class="label">Spiknutí</span><div class="plot-steps">${[1, 2, 3].map((i) => `<i class="${i <= plot ? 'on' : ''}"></i>`).join('')}</div><span>${plot}/3</span></div>
      <div class="stat-bar-row"><span class="label">Tajemství</span><span class="secrets">${'✦'.repeat(Math.min(state.noble.secrets, 8)) || '—'}</span><span>${state.noble.secrets}</span></div>
      <p class="house-text">Cesty k trůnu: nárok po smrti krále (podpoří ho spojenci a sňatek s korunou), spiknutí dovedené do konce, nebo — pro významného šlechtice — otevřené povstání ve válečném tažení. Spojenci zvyšují šance všech tří.</p>
      ${state.flags.rebellion ? '<span class="house-badge bad">Otevřená vzpoura proti koruně</span>' : ''}
      ${held > 1 ? `<p class="house-text">Panství rodu: ${held} kraje.</p>` : ''}
    </div>`;
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
  crowned: 'Korunovace',
  executed: 'Poprava',
  exile: 'Vyhnanství',
  ennobled: 'Erb a tvrz',
  expelled: 'Vyhnání z gruntu',
  ruined: 'Zpustlý grunt',
};

// endings after which the same save carries on one step higher
const CONTINUE_LABELS = { crowned: 'Vládnout jako panovník', ennobled: 'Pokračovat jako šlechtic' };

export function renderEndingScreen(state, gameOver) {
  const screen = document.getElementById('screen-ending');
  screen.style.removeProperty('--backdrop');
  firstExistingImage([`assets/endings/ending_${gameOver.type}.jpg`, `assets/endings/ending_${gameOver.type}.png`], null).then((src) => {
    // absolute URL: a url() inside a custom property resolves against the stylesheet, not the page
    if (src) screen.style.setProperty('--backdrop', `url("${new URL(src, document.baseURI).href}")`);
  });
  document.getElementById('ending-title').textContent = ENDING_TITLES[gameOver.type] || 'Konec';
  document.getElementById('ending-text').textContent = gameOver.text;
  const epithet = reignEpithet(state);
  const epithetEl = document.getElementById('ending-epithet');
  epithetEl.hidden = !epithet;
  if (epithet) epithetEl.textContent = `Kronika zapíše: ${state.ruler.name} ${epithet.word}, ${epithet.reason}.`;
  const cont = document.getElementById('ending-continue');
  cont.hidden = !CONTINUE_LABELS[gameOver.type];
  if (CONTINUE_LABELS[gameOver.type]) cont.textContent = CONTINUE_LABELS[gameOver.type];
  const years = state.turn > 0 ? Math.ceil(state.turn / SEASONS.length) : 0;
  document.getElementById('ending-stats').innerHTML = [
    [state.scenario === 'panovnik' ? 'Dynastie' : 'Rod', state.dynastyName],
    [state.scenario === 'panovnik' ? 'Let vlády' : 'Let rodu', years],
    ['Generací', state.generation],
    ...['gold', 'stability', 'prestige'].map((k) => [resourceLabel(RESOURCE_DEFS.find((d) => d.key === k), state.scenario), state.resources[k]]),
  ].map(([label, value]) => `<div><span>${label}</span><span>${esc(value)}</span></div>`).join('');
}
