import { createNewGame, saveGame, listSaves, loadGame, loadMostRecentSave, deleteSave, loadSettings, saveSettings } from './state.js';
import { advanceTurn, resolveChoice, resolveRouteChoice, checkEndConditions } from './engine.js';
import {
  showScreen, renderResourceBar, updateBookTabFlags, renderTurnSummary, renderEventCard,
  renderMapPanel, renderCourtPanel, renderChroniclePanel, openPanel, closePanels,
  renderEndingScreen, toast, setTypewriterEnabled, skipTypewriter, setMusicMuted,
} from './ui.js';

let currentState = null;
let activeEvent = null;
let pendingRulerName = '';
let pendingDynastyName = '';

const settings = loadSettings();
setTypewriterEnabled(settings.typewriter);
setMusicMuted(settings.musicMuted);

function applyMood(state) {
  document.body.className = 'mood-' + state.scenario;
}

function refreshAllPanels() {
  renderResourceBar(currentState);
  updateBookTabFlags(currentState);
  renderMapPanel(currentState, onProvinceClick);
  renderCourtPanel(currentState);
  renderChroniclePanel(currentState);
}

function onProvinceClick(provinceId) {
  const detail = document.getElementById('map-province-detail');
  const province = currentState.provinces.find((p) => p.id === provinceId);
  if (!province) return;
  detail.innerHTML = province.isCapital
    ? `<em>${province.name} je vaše hlavní město.</em>`
    : `<em>${province.name} je jednou z vašich pěti provincií.</em>`;
}

function endGame(gameOver) {
  currentState.gameOver = gameOver;
  saveGame(currentState);
  renderEndingScreen(currentState, gameOver);
  showScreen('screen-ending');
}

function presentEvent(event) {
  activeEvent = event;
  renderEventCard(currentState, event, {
    onChoiceSelected: handleChoiceSelected,
    onRouteSelected: handleRouteSelected,
  });
}

function afterResolution(traitGained) {
  if (traitGained) {
    const label = { strength: 'Síla', eloquence: 'Výřečnost', intelligence: 'Inteligence', patience: 'Trpělivost' }[traitGained];
    toast(`+1 ${label}`);
  }
  saveGame(currentState);
  const gameOver = checkEndConditions(currentState);
  if (gameOver) {
    endGame(gameOver);
    return;
  }
  runNextTurn();
}

function handleChoiceSelected(index) {
  const result = resolveChoice(currentState, activeEvent, index);
  afterResolution(result.traitGained);
}

function handleRouteSelected(terrainKey) {
  resolveRouteChoice(currentState, activeEvent, terrainKey);
  afterResolution(null);
}

function runNextTurn() {
  const result = advanceTurn(currentState);
  refreshAllPanels();

  if (result.successionOccurred) {
    toast(`Nastupuje nová generace: ${currentState.ruler.name} usedá na trůn.`);
  }

  if (result.gameOver) {
    endGame(result.gameOver);
    return;
  }

  renderTurnSummary(result.turnSummary);

  if (result.event) {
    presentEvent(result.event);
  } else {
    document.getElementById('event-title').textContent = 'Klidné období';
    document.getElementById('event-text').textContent = 'Království si tento sezónu oddechlo od velkých rozhodnutí.';
    document.getElementById('choice-list').innerHTML = '<button class="choice-button" id="btn-next-season"><span>Pokračovat do dalšího období</span></button>';
    document.getElementById('btn-next-season').addEventListener('click', runNextTurn);
  }
}

function startGame(state) {
  currentState = state;
  activeEvent = null;
  applyMood(state);
  showScreen('screen-game');
  refreshAllPanels();
  runNextTurn();
}

function renderSaveSlotList() {
  const host = document.getElementById('save-slot-list');
  const saves = listSaves();
  if (!saves.length) {
    host.innerHTML = '<p>Žádné uložené hry.</p>';
    return;
  }
  host.innerHTML = '';
  for (const s of saves) {
    const row = document.createElement('div');
    row.className = 'province-card';
    const date = new Date(s.savedAt).toLocaleString('cs-CZ');
    row.innerHTML = `
      <strong>${s.dynastyName} — ${s.rulerName}</strong>
      <div>Rok ${s.year}, generace ${s.generation}</div>
      <div style="font-size:.8rem;color:var(--color-ink-soft)">${date}</div>
      <div class="dialog-actions">
        <button class="seal-button" data-load="${s.slotId}">Načíst</button>
        <button class="seal-button" data-delete="${s.slotId}">Smazat</button>
      </div>
    `;
    host.appendChild(row);
  }
  host.querySelectorAll('[data-load]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const state = loadGame(btn.dataset.load);
      if (state) startGame(state);
    });
  });
  host.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', () => {
      deleteSave(btn.dataset.delete);
      renderSaveSlotList();
    });
  });
}

function wireActions() {
  document.addEventListener('click', (e) => {
    const actionEl = e.target.closest('[data-action]');
    if (!actionEl) return;
    const action = actionEl.dataset.action;

    switch (action) {
      case 'goto-new-game':
        showScreen('screen-new-game');
        break;
      case 'back-to-menu':
        showScreen('screen-menu');
        break;
      case 'back-to-new-game':
        showScreen('screen-new-game');
        break;
      case 'continue-game': {
        const state = loadMostRecentSave();
        if (state) startGame(state);
        else toast('Žádná uložená hra.');
        break;
      }
      case 'goto-load-game':
        renderSaveSlotList();
        showScreen('screen-load');
        break;
      case 'goto-options':
        showScreen('screen-options');
        break;
      case 'quit-game':
        toast('Hru lze zavřít v prohlížeči.');
        break;
      case 'goto-scenario-select':
        pendingRulerName = document.getElementById('input-ruler-name').value.trim();
        pendingDynastyName = document.getElementById('input-dynasty-name').value.trim();
        showScreen('screen-scenario');
        break;
      case 'close-panel':
        closePanels();
        break;
      case 'toggle-music':
        settings.musicMuted = !settings.musicMuted;
        setMusicMuted(settings.musicMuted);
        saveSettings(settings);
        break;
      default:
        break;
    }
  });

  document.querySelectorAll('.scenario-card').forEach((card) => {
    card.addEventListener('click', () => {
      if (card.classList.contains('locked')) {
        toast('Tento scénář se ještě připravuje.');
        return;
      }
      const state = createNewGame(pendingRulerName, pendingDynastyName);
      startGame(state);
    });
  });

  document.querySelectorAll('.book-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const panel = tab.dataset.panel;
      if (panel === 'map') renderMapPanel(currentState, onProvinceClick);
      if (panel === 'court') renderCourtPanel(currentState);
      if (panel === 'chronicle') renderChroniclePanel(currentState);
      openPanel(panel);
    });
  });

  document.getElementById('event-card').addEventListener('click', (e) => {
    if (e.target.closest('.choice-button')) return;
    skipTypewriter();
  });

  document.getElementById('input-typewriter-toggle').addEventListener('change', (e) => {
    settings.typewriter = e.target.checked;
    setTypewriterEnabled(settings.typewriter);
    saveSettings(settings);
  });
  document.getElementById('input-typewriter-toggle').checked = settings.typewriter;
}

wireActions();
showScreen('screen-menu');
