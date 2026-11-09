import { createNewGame, saveGame, listSaves, loadGame, loadMostRecentSave, deleteSave, loadSettings, saveSettings } from './state.js';
import { advanceTurn, resolveChoice, resolveRouteChoice, checkEndConditions } from './engine.js';
import {
  showScreen, renderResourceBar, updateBookTabFlags, renderTurnSummary, renderEventCard,
  renderMapPanel, renderCourtPanel, renderChroniclePanel, openPanel, closePanels, isPanelOpen,
  renderEndingScreen, toast, setTypewriterEnabled, skipTypewriter, setMusicMuted,
  renderReignInfo, renderCharacterPlaque, renderOutcome, renderQuietSeason, renderStaticIcons,
  resetResourceMemory, esc,
} from './ui.js';

let currentState = null;
let activeEvent = null;
let awaitingChoice = false;
let pendingRulerName = '';
let pendingDynastyName = '';

const settings = loadSettings();
setTypewriterEnabled(settings.typewriter);
setMusicMuted(settings.musicMuted);
renderStaticIcons();

function refreshAllPanels(bumpedTrait = null) {
  renderResourceBar(currentState);
  renderReignInfo(currentState);
  renderCharacterPlaque(currentState, bumpedTrait);
  updateBookTabFlags(currentState);
  renderMapPanel(currentState, onProvinceClick);
  renderCourtPanel(currentState);
  renderChroniclePanel(currentState);
}

function onProvinceClick(provinceId) {
  const detail = document.getElementById('map-province-detail');
  const province = currentState.provinces.find((p) => p.id === provinceId);
  if (!province) return;
  detail.textContent = province.isCapital
    ? `${province.name} je vaše hlavní město.`
    : `${province.name} je jednou z vašich pěti provincií.`;
}

function endGame(gameOver) {
  currentState.gameOver = gameOver;
  saveGame(currentState);
  renderEndingScreen(currentState, gameOver);
  showScreen('screen-ending');
}

function presentEvent(event) {
  activeEvent = event;
  awaitingChoice = true;
  renderEventCard(currentState, event, {
    onChoiceSelected: handleChoiceSelected,
    onRouteSelected: handleRouteSelected,
  });
}

const TRAIT_LABELS = { strength: 'Síla', eloquence: 'Výřečnost', intelligence: 'Inteligence', patience: 'Trpělivost' };

function showOutcome(result) {
  awaitingChoice = false;
  if (result.traitGained) toast(`+1 ${TRAIT_LABELS[result.traitGained]}`);
  saveGame(currentState);
  refreshAllPanels(result.traitGained);
  const gameOver = checkEndConditions(currentState);
  renderOutcome(currentState, result, () => {
    if (gameOver) endGame(gameOver);
    else runNextTurn();
  });
}

function handleChoiceSelected(index) {
  if (!awaitingChoice) return;
  showOutcome(resolveChoice(currentState, activeEvent, index));
}

function handleRouteSelected(terrainKey) {
  if (!awaitingChoice) return;
  showOutcome(resolveRouteChoice(currentState, activeEvent, terrainKey));
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
    awaitingChoice = false;
    renderQuietSeason(runNextTurn);
  }
}

function startGame(state) {
  currentState = state;
  activeEvent = null;
  resetResourceMemory();
  document.body.className = 'mood-' + state.scenario;
  showScreen('screen-game');
  refreshAllPanels();
  runNextTurn();
}

function renderSaveSlotList() {
  const host = document.getElementById('save-slot-list');
  const saves = listSaves();
  if (!saves.length) {
    host.innerHTML = '<p>Archiv je zatím prázdný.</p>';
    return;
  }
  host.innerHTML = '';
  for (const s of saves) {
    const row = document.createElement('div');
    row.className = 'province-card';
    const date = new Date(s.savedAt).toLocaleString('cs-CZ');
    row.innerHTML = `
      <strong>${esc(s.rulerName)} ${esc(s.dynastyName)}</strong>
      <div>Rok ${s.year} · ${s.generation}. generace</div>
      <div class="hint">${date}</div>
      <div class="dialog-actions">
        <button class="seal-button ghost" data-delete="${esc(s.slotId)}">Smazat</button>
        <button class="seal-button primary" data-load="${esc(s.slotId)}">Načíst</button>
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

    switch (actionEl.dataset.action) {
      case 'goto-new-game':
        showScreen('screen-new-game');
        document.getElementById('input-ruler-name').focus();
        break;
      case 'back-to-menu':
        closePanels();
        showScreen('screen-menu');
        break;
      case 'back-to-new-game':
        showScreen('screen-new-game');
        break;
      case 'continue-game': {
        const state = loadMostRecentSave();
        if (state && !state.gameOver) startGame(state);
        else toast('Žádná rozehraná kronika.');
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
      startGame(createNewGame(pendingRulerName, pendingDynastyName));
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

  document.getElementById('panel-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'panel-overlay') closePanels();
  });

  document.getElementById('input-dynasty-name').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.querySelector('[data-action="goto-scenario-select"]').click();
  });
}

// ---------- keyboard: 1-4 choose, Enter/Space continue or finish text, Esc close panel ----------

function wireKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (!document.getElementById('screen-game').classList.contains('active')) return;
    if (e.target.matches('input, textarea')) return;

    if (e.key === 'Escape') {
      closePanels();
      return;
    }
    if (isPanelOpen()) return;

    const buttons = [...document.querySelectorAll('#choice-list .choice-button')];
    if (/^[1-9]$/.test(e.key)) {
      const btn = buttons[Number(e.key) - 1];
      if (btn && !btn.classList.contains('continue-button')) {
        skipTypewriter();
        btn.click();
      }
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (skipTypewriter()) return;
      const cont = buttons.find((b) => b.classList.contains('continue-button'));
      if (cont) cont.click();
    }
  });
}

// ---------- ambient polish: menu parallax, UI click sound ----------

function wireMenuAmbience() {
  const parallaxEl = document.getElementById('menu-art-parallax');
  const menuScreen = document.getElementById('screen-menu');
  menuScreen.addEventListener('mousemove', (e) => {
    const rect = parallaxEl.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;
    parallaxEl.style.transform = `translate(${-relX * 10}px, ${-relY * 10}px)`;
  });
  menuScreen.addEventListener('mouseleave', () => {
    parallaxEl.style.transform = 'translate(0, 0)';
  });
}

let audioCtx = null;
function playClickSound() {
  if (settings.musicMuted) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.09);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  } catch {
    // Web Audio unavailable — the click is a non-essential flourish.
  }
}

function wireClickSound() {
  document.addEventListener('click', (e) => {
    if (e.target.closest('button')) playClickSound();
  });
}

wireActions();
wireKeyboard();
wireMenuAmbience();
wireClickSound();
showScreen('screen-menu');
