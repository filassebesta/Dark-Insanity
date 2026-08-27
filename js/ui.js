import { RESOURCE_DEFS, TRAIT_DEFS, STATUS_TIERS, TERRAIN_DEFS, SEASONS } from './data.js';
import { interpolate, previewVisibleEffects, computeSuccessChance } from './engine.js';

let typewriterTimer = null;
let typewriterEnabled = true;

export function setTypewriterEnabled(enabled) {
  typewriterEnabled = enabled;
}

export function showScreen(id) {
  document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  syncMenuMusic(id === 'screen-menu');
}

// ---------- menu music ----------

let musicUnlockBound = false;

function syncMenuMusic(shouldPlay) {
  const music = document.getElementById('menu-music');
  if (!music) return;
  if (shouldPlay) {
    const playPromise = music.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(() => {
        if (musicUnlockBound) return;
        musicUnlockBound = true;
        const unlock = () => {
          music.play().catch(() => {});
          document.removeEventListener('click', unlock);
          document.removeEventListener('keydown', unlock);
        };
        document.addEventListener('click', unlock, { once: true });
        document.addEventListener('keydown', unlock, { once: true });
      });
    }
  } else {
    music.pause();
  }
}

export function setMusicMuted(muted) {
  const music = document.getElementById('menu-music');
  if (music) music.muted = muted;
  const btn = document.getElementById('music-toggle');
  if (btn) btn.textContent = muted ? '🔇' : '🔊';
}

export function toast(message) {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

function typewrite(el, text, onDone) {
  clearInterval(typewriterTimer);
  if (!typewriterEnabled) {
    el.textContent = text;
    if (onDone) onDone();
    return;
  }
  el.textContent = '';
  let i = 0;
  typewriterTimer = setInterval(() => {
    i += 1;
    el.textContent = text.slice(0, i);
    if (i >= text.length) {
      clearInterval(typewriterTimer);
      typewriterTimer = null;
      if (onDone) onDone();
    }
  }, 16);

  const skip = () => {
    if (typewriterTimer) {
      clearInterval(typewriterTimer);
      typewriterTimer = null;
      el.textContent = text;
      if (onDone) onDone();
    }
  };
  el.dataset.skipBound = 'true';
  el._skipHandler = skip;
}

export function skipTypewriter() {
  const el = document.getElementById('event-text');
  if (el && el._skipHandler) el._skipHandler();
}

// ---------- resource bar ----------

export function renderResourceBar(state) {
  const bar = document.getElementById('resource-chips');
  bar.innerHTML = '';
  for (const def of RESOURCE_DEFS) {
    const value = state.resources[def.key];
    const chip = document.createElement('div');
    chip.className = 'resource-chip' + (value <= def.critical ? ' critical' : '');
    chip.title = def.label;
    chip.innerHTML = `<span class="icon">${def.icon}</span><span class="value">${value}</span>`;
    bar.appendChild(chip);
  }
}

export function updateBookTabFlags(state) {
  const anyUnrest = state.provinces.some((p) => !p.lost && p.unrest >= 70);
  const anyDisloyal = [state.heir, state.spouse, state.chancellor, state.marshal, state.spymaster]
    .some((c) => c.alive && c.loyalty <= 25);
  document.querySelector('.book-tab[data-panel="map"]').classList.toggle('flagged', anyUnrest);
  document.querySelector('.book-tab[data-panel="court"]').classList.toggle('flagged', anyDisloyal);
}

// ---------- event card ----------

export function renderTurnSummary(text) {
  document.getElementById('turn-summary').textContent = text || '';
}

function choiceIconLabel(def, hintType, hintKey) {
  const source = hintType === 'trait' ? TRAIT_DEFS : RESOURCE_DEFS;
  const found = source.find((d) => d.key === hintKey);
  return found ? found.icon : '❔';
}

function renderChoicePreview(deltaEffects) {
  const el = document.getElementById('choice-preview');
  if (!deltaEffects || !Object.keys(deltaEffects).length) {
    el.innerHTML = '&nbsp;';
    return;
  }
  const parts = Object.entries(deltaEffects).map(([key, delta]) => {
    const def = RESOURCE_DEFS.find((d) => d.key === key);
    if (!def || !delta) return '';
    const cls = delta > 0 ? 'delta-pos' : 'delta-neg';
    return `<span class="${cls}">${def.icon} ${delta > 0 ? '+' : ''}${delta}</span>`;
  }).filter(Boolean);
  el.innerHTML = parts.join(' &nbsp; ') || '&nbsp;';
}

export function renderEventCard(state, event, handlers) {
  const imageEl = document.getElementById('event-image');
  if (event.image) {
    imageEl.style.backgroundImage = `url('${event.image}')`;
    imageEl.hidden = false;
  } else {
    imageEl.hidden = true;
  }
  document.getElementById('event-title').textContent = event.title;
  const textEl = document.getElementById('event-text');
  const choiceList = document.getElementById('choice-list');
  choiceList.innerHTML = '';
  renderChoicePreview(null);

  typewrite(textEl, interpolate(state, event.text));

  if (event.type === 'route') {
    for (const option of event.routeOptions) {
      const terrain = TERRAIN_DEFS[option.terrainKey];
      const btn = document.createElement('button');
      btn.className = 'choice-button';
      const riskPct = Math.round(terrain.baseRisk * 100);
      btn.innerHTML = `<span class="icon">${terrain.icon}</span><span>${terrain.label}</span><span class="risk-tag">${riskPct}% ${terrain.riskLabel}</span>`;
      btn.addEventListener('click', () => handlers.onRouteSelected(option.terrainKey));
      choiceList.appendChild(btn);
    }
    return;
  }

  event.choices.forEach((choice, index) => {
    const btn = document.createElement('button');
    btn.className = 'choice-button';
    const icon = choiceIconLabel(null, choice.hintType, choice.hintKey);
    let riskTag = '';
    if (choice.isRoll) {
      const pct = Math.round(computeSuccessChance(state, choice) * 100);
      riskTag = `<span class="risk-tag">${pct}% úspěch</span>`;
    }
    btn.innerHTML = `<span class="icon">${icon}</span><span>${choice.label}</span>${riskTag}`;
    btn.addEventListener('mouseenter', () => renderChoicePreview(previewVisibleEffects(choice)));
    btn.addEventListener('mouseleave', () => renderChoicePreview(null));
    btn.addEventListener('click', () => handlers.onChoiceSelected(index));
    choiceList.appendChild(btn);
  });
}

// ---------- map panel ----------

export function renderMapPanel(state, onProvinceClick) {
  const list = document.getElementById('map-provinces');
  list.innerHTML = '';
  for (const p of state.provinces) {
    const card = document.createElement('div');
    card.className = 'province-card';
    if (p.lost) {
      card.innerHTML = `<strong>${p.name}</strong><em>Ztracena</em>`;
    } else {
      card.innerHTML = `
        <strong>${p.name}${p.unrest >= 70 ? ' <span class="province-unrest-icon">☁</span>' : ''}</strong>
        ${statBar('Loajalita', p.loyalty, 'loyalty')}
        ${statBar('Nepokoje', p.unrest, 'unrest')}
        ${statBar('Bohatství', p.wealth, 'wealth')}
        ${statBar('Posádka', p.garrison, 'garrison')}
      `;
    }
    card.addEventListener('click', () => onProvinceClick(p.id));
    list.appendChild(card);
  }
  document.getElementById('map-province-detail').innerHTML = '';
}

function statBar(label, value, cls) {
  return `<div class="stat-bar-row"><span class="label">${label}</span><div class="stat-bar"><div class="stat-bar-fill ${cls}" style="width:${value}%"></div></div><span>${value}</span></div>`;
}

// ---------- court panel ----------

export function renderCourtPanel(state) {
  const grid = document.getElementById('court-grid');
  grid.innerHTML = '';
  const byGender = (base, gender) => `${base}_${gender === 'male' ? 'male' : 'female'}`;
  const members = [
    { data: state.ruler, role: 'Vládce', extra: STATUS_TIERS[state.ruler.statusTier] },
    { data: state.heir, role: 'Dědic', portrait: byGender('heir', state.heir.gender) },
    { data: state.spouse, role: 'Manžel/ka', portrait: state.spouse.gender === 'male' ? 'spouse_king' : 'spouse_queen' },
    { data: state.chancellor, role: 'Kancléř', portrait: byGender('chancellor', state.chancellor.gender) },
    { data: state.marshal, role: 'Maršál', portrait: byGender('marshal', state.marshal.gender) },
    { data: state.spymaster, role: 'Špehmistr', portrait: byGender('spymaster', state.spymaster.gender) },
  ];
  for (const m of members) {
    const card = document.createElement('div');
    const alive = m.data.alive !== false;
    card.className = 'court-card' + (alive ? '' : ' deceased');
    const initial = m.data.name ? m.data.name[0] : '?';
    const avatar = m.portrait
      ? `<img class="court-avatar-img" src="assets/portraits/${m.portrait}.png" alt="${m.data.name}">`
      : `<div class="court-avatar">${initial}</div>`;
    const loyaltyLine = m.data.loyalty !== undefined ? `<div>Věrnost: ${m.data.loyalty}</div>` : (m.extra ? `<div>${m.extra}</div>` : '');
    card.innerHTML = `
      ${avatar}
      <strong>${m.data.name}${alive ? '' : ' †'}</strong>
      <div class="role">${m.role}</div>
      <div>Věk: ${m.data.age}</div>
      ${loyaltyLine}
    `;
    grid.appendChild(card);
  }

  grid.parentElement.querySelector('.ruler-status')?.remove();
  const traitsHost = document.createElement('div');
  traitsHost.className = 'ruler-status';
  traitsHost.innerHTML = '<h4 class="gothic">Vlastnosti vládce</h4>' + TRAIT_DEFS.map((t) =>
    `<div class="trait-row"><span>${t.icon} ${t.label}</span><span>${state.ruler.traits[t.key]}</span></div>`
  ).join('');
  grid.after(traitsHost);
}

// ---------- chronicle panel ----------

export function renderChroniclePanel(state) {
  const log = document.getElementById('chronicle-log');
  log.innerHTML = '';
  const entries = [...state.chronicle].reverse();
  for (const entry of entries) {
    const div = document.createElement('div');
    div.className = 'chronicle-entry';
    div.innerHTML = `<span class="entry-date">${SEASONS[entry.season]} ${entry.year}</span>${entry.text}`;
    log.appendChild(div);
  }
}

// ---------- panels open/close ----------

export function openPanel(panelName) {
  document.querySelectorAll('.side-panel').forEach((el) => el.classList.remove('open'));
  const el = document.getElementById('panel-' + panelName);
  if (el) el.classList.add('open');
}

export function closePanels() {
  document.querySelectorAll('.side-panel').forEach((el) => el.classList.remove('open'));
}

// ---------- ending screen ----------

const ENDING_TITLES = {
  death: 'Smrt',
  conquest: 'Dobytí',
  collapse: 'Kolaps',
  golden_age: 'Zlatý věk',
};

export function renderEndingScreen(state, gameOver) {
  document.getElementById('ending-title').textContent = ENDING_TITLES[gameOver.type] || 'Konec';
  document.getElementById('ending-text').textContent = gameOver.text;
  const stats = document.getElementById('ending-stats');
  const years = state.turn > 0 ? Math.ceil(state.turn / SEASONS.length) : 0;
  stats.innerHTML = [
    ['Dynastie', state.dynastyName],
    ['Let vlády celkem', years],
    ['Počet generací', state.generation],
    ['Zlato', state.resources.gold],
    ['Stabilita', state.resources.stability],
    ['Prestiž', state.resources.prestige],
  ].map(([label, value]) => `<div><span>${label}</span><span>${value}</span></div>`).join('');
}
