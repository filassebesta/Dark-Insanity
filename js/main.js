import { createNewGame, crownNoble, ennoblePeasant, saveGame, listSaves, loadGame, loadMostRecentSave, deleteSave, loadSettings, saveSettings } from './state.js';
import { advanceTurn, resolveChoice, resolveRouteChoice, checkEndConditions, pickNextEvent } from './engine.js';
import {
  showScreen, renderResourceBar, updateBookTabFlags, renderTurnSummary, renderEventCard,
  renderCourtPanel, renderChroniclePanel, openPanel, closePanels, isPanelOpen,
  renderEndingScreen, toast, setTypewriterEnabled, skipTypewriter, setMusicMuted,
  renderReignInfo, renderCharacterPlaque, renderOutcome, renderStaticIcons,
  resetResourceMemory, esc, upgradeScenarioArt, renderHousesPanel, renderTradeNews,
} from './ui.js';
import { openMap, closeMap, isMapOpen, wireMapChrome, closeTownIfOpen } from './map.js';
import { openCharacter, closeCharacter, isCharacterOpen, openPerson, closePerson, isPersonOpen } from './character.js';
import { playMusic, setMusicVolume } from './audio.js';
import { checkAchievements } from './achievements.js';
import { renderAmbitionBar, renderHall, renderEndingAchievements, announceAchievement } from './fame.js';
import { showTip, setTipsEnabled, tipsEnabled, resetTips, hideTip } from './tips.js';

let currentState = null;
let activeEvent = null;
let awaitingChoice = false;
let pendingRulerName = '';
let pendingDynastyName = '';
let pendingGender = 'male';

const settings = loadSettings();
setTypewriterEnabled(settings.typewriter);
setMusicVolume(settings.musicVolume / 100);
setMusicMuted(settings.musicMuted);
renderStaticIcons();
upgradeScenarioArt();

function refreshAllPanels(bumpedTrait = null) {
  renderResourceBar(currentState);
  renderReignInfo(currentState);
  renderCharacterPlaque(currentState, bumpedTrait);
  updateBookTabFlags(currentState);
  renderCourtPanel(currentState);
  renderChroniclePanel(currentState);
  renderHousesPanel(currentState);
  renderAmbitionBar(currentState);
}

// achievements earned by what just happened go to the Hall of Fame
function award() {
  const fresh = checkAchievements(currentState);
  fresh.forEach((a, i) => setTimeout(() => announceAchievement(a), i * 900));
}

let hallReturn = 'screen-menu';

function closeOverlays() {
  closePanels();
  closeMap();
  closeCharacter();
  closePerson();
}

function isOverlayOpen() {
  return isPanelOpen() || isMapOpen() || isCharacterOpen() || isPersonOpen();
}

function openRouteMap() {
  if (!awaitingChoice || activeEvent?.type !== 'route') return;
  openMap(currentState, {
    layer: 'routes',
    focusRoutes: true,
    allowedRoutes: activeEvent.routeOptions.map((o) => o.terrainKey),
    onChooseRoute: handleRouteSelected,
  });
}

function endGame(gameOver) {
  closeOverlays();
  hideTip();
  playMusic(BATTLE_ENDINGS.includes(gameOver.type) ? 'battle' : 'menu');
  currentState.gameOver = gameOver;
  award();
  saveGame(currentState);
  renderEndingScreen(currentState, gameOver);
  renderEndingAchievements(currentState);
  if ((currentState.achievementsEarned || []).length) showTip('hall');
  showScreen('screen-ending');
}

// The main theme plays throughout; fights and wars switch to the battle theme.
const BATTLE_ENDINGS = ['conquest', 'collapse', 'executed', 'ruined'];

function presentEvent(event) {
  playMusic(event.music || 'menu'); // the main theme runs through the whole game
  activeEvent = event;
  awaitingChoice = true;
  if (event.id === 'ambice') showTip('ambition');
  else if (/^krize/.test(event.id)) showTip('crisis');
  if ((event.choices || []).some((c) => c.isRoll && (!c.requires || c.requires(currentState)))) showTip('roll');
  renderEventCard(currentState, event, {
    onChoiceSelected: handleChoiceSelected,
    onRouteSelected: handleRouteSelected,
  });
}

const TRAIT_LABELS = { strength: 'Síla', eloquence: 'Výřečnost', intelligence: 'Inteligence', patience: 'Trpělivost' };

function showOutcome(result) {
  awaitingChoice = false;
  if (result.traitGained) toast(`+1 ${TRAIT_LABELS[result.traitGained]}`);
  if ((result.notes || []).some((n) => n.text.startsWith('Zranění'))) showTip('injury');
  award();
  saveGame(currentState);
  refreshAllPanels(result.traitGained);
  const gameOver = checkEndConditions(currentState);
  const free = activeEvent && activeEvent.free;
  renderOutcome(currentState, result, () => {
    if (gameOver) endGame(gameOver);
    else if (free) nextEventSameSeason();
    else runNextTurn();
  });
}

function handleChoiceSelected(index) {
  if (!awaitingChoice) return;
  showOutcome(resolveChoice(currentState, activeEvent, index));
}

function handleRouteSelected(terrainKey) {
  if (!awaitingChoice) return;
  const result = resolveRouteChoice(currentState, activeEvent, terrainKey);
  if (result.outcome === 'danger' && result.terrainKey === 'forest') playMusic('battle'); // bandit ambush
  showOutcome(result);
}

function runNextTurn() {
  const result = advanceTurn(currentState);
  refreshAllPanels();
  award();

  if (result.successionOccurred) {
    toast(`Nastupuje nová generace: ${currentState.ruler.name} usedá na trůn.`);
  }

  if (result.gameOver) {
    endGame(result.gameOver);
    return;
  }

  renderTurnSummary(result.turnSummary);
  renderTradeNews(result.tradeNews);

  presentEvent(result.event); // the engine falls back to the quiet-season event
}

// after a 'free' event (the ambition offer) the season's own event comes without a new season
function nextEventSameSeason() {
  const event = pickNextEvent(currentState);
  currentState.currentEvent = event ? event.id : null;
  saveGame(currentState);
  renderTurnSummary('');
  renderTradeNews([]);
  presentEvent(event);
}

function startGame(state) {
  playMusic('menu');
  currentState = state;
  activeEvent = null;
  resetResourceMemory();
  document.body.className = 'mood-' + state.scenario;
  showScreen('screen-game');
  refreshAllPanels();
  showTip('start');
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
        closeOverlays();
        hideTip();
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
      case 'goto-hall':
        hallReturn = document.querySelector('.screen.active')?.id || 'screen-menu';
        renderHall();
        showScreen('screen-hall');
        break;
      case 'back-from-hall':
        showScreen(hallReturn === 'screen-hall' ? 'screen-menu' : hallReturn);
        break;
      case 'reset-tips':
        resetTips();
        document.getElementById('input-tips-toggle').checked = true;
        toast('Rady se v příští hře ukážou znovu.');
        break;
      case 'quit-game':
        toast('Hru lze zavřít v prohlížeči.');
        break;
      case 'goto-scenario-select':
        pendingRulerName = document.getElementById('input-ruler-name').value.trim();
        pendingDynastyName = document.getElementById('input-dynasty-name').value.trim();
        pendingGender = document.querySelector('input[name="ruler-gender"]:checked')?.value || 'male';
        showScreen('screen-scenario');
        break;
      case 'close-panel':
        closePanels();
        break;
      case 'close-map':
        closeMap();
        break;
      case 'open-map-routes':
        openRouteMap();
        break;
      case 'open-character':
        closeOverlays();
        openCharacter(currentState);
        break;
      case 'close-character':
        closeCharacter();
        break;
      case 'close-person':
        closePerson();
        break;
      case 'continue-as-king':
        // the noble took the throne: the same save carries on as the Panovník scenario
        if (currentState && currentState.gameOver && currentState.gameOver.type === 'crowned') {
          crownNoble(currentState);
          saveGame(currentState);
          toast(`${currentState.ruler.name} usedá na trůn.`);
          startGame(currentState);
        } else if (currentState && currentState.gameOver && currentState.gameOver.type === 'ennobled') {
          // the peasant earned a coat of arms: the save carries on as the Šlechtic scenario
          ennoblePeasant(currentState);
          saveGame(currentState);
          toast(`${currentState.ruler.name} přebírá tvrz v Pobřežní marce.`);
          startGame(currentState);
        }
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
      startGame(createNewGame(pendingRulerName, pendingDynastyName, pendingGender, card.dataset.scenario));
    });
  });

  document.querySelectorAll('.book-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const panel = tab.dataset.panel;
      closeOverlays();
      if (panel === 'map') {
        if (awaitingChoice && activeEvent?.type === 'route') openRouteMap();
        else openMap(currentState);
        return;
      }
      if (panel === 'trade') {
        openMap(currentState, { layer: 'trade' });
        return;
      }
      if (panel === 'character') {
        openCharacter(currentState);
        return;
      }
      if (panel === 'court') renderCourtPanel(currentState);
      if (panel === 'houses') renderHousesPanel(currentState);
      if (panel === 'chronicle') renderChroniclePanel(currentState);
      openPanel(panel);
    });
  });

  // court cards (Dvůr) and family in the character sheet open the person detail
  document.addEventListener('click', (e) => {
    const personEl = e.target.closest('[data-person]');
    if (!personEl || !currentState) return;
    closeOverlays();
    openPerson(currentState, personEl.dataset.person);
  });
  document.addEventListener('keydown', (e) => {
    const personEl = e.target.closest && e.target.closest('[data-person]');
    if (personEl && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); personEl.click(); }
  });
  document.getElementById('person-view').addEventListener('click', (e) => {
    if (e.target.id === 'person-view') closePerson();
  });

  document.getElementById('character-plaque').addEventListener('click', () => {
    closeOverlays();
    openCharacter(currentState);
  });

  document.getElementById('event-card').addEventListener('click', (e) => {
    if (e.target.closest('.choice-button, [data-action]')) return;
    skipTypewriter();
  });

  document.getElementById('input-typewriter-toggle').addEventListener('change', (e) => {
    settings.typewriter = e.target.checked;
    setTypewriterEnabled(settings.typewriter);
    saveSettings(settings);
  });
  document.getElementById('input-typewriter-toggle').checked = settings.typewriter;
  const tipsInput = document.getElementById('input-tips-toggle');
  tipsInput.checked = tipsEnabled();
  tipsInput.addEventListener('change', (e) => setTipsEnabled(e.target.checked));

  const volumeInput = document.getElementById('input-music-volume');
  const volumeLabel = document.getElementById('music-volume-value');
  const showVolume = () => {
    volumeInput.value = settings.musicVolume;
    volumeLabel.textContent = `${settings.musicVolume} %`;
    volumeInput.style.setProperty('--fill', `${settings.musicVolume}%`);
  };
  volumeInput.addEventListener('input', () => {
    settings.musicVolume = Number(volumeInput.value);
    setMusicVolume(settings.musicVolume / 100);
    if (settings.musicMuted && settings.musicVolume > 0) {
      settings.musicMuted = false;
      setMusicMuted(false);
    }
    showVolume();
    saveSettings(settings);
  });
  showVolume();

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
      if (closeTownIfOpen()) return; // from a town back to the map first
      closeOverlays();
      return;
    }
    if (e.key === 'm' || e.key === 'M') {
      if (isMapOpen()) closeMap();
      else { closeOverlays(); document.querySelector('.book-tab[data-panel="map"]').click(); }
      return;
    }
    if (e.key === 'o' || e.key === 'O') {
      if (isMapOpen()) closeMap();
      else { closeOverlays(); openMap(currentState, { layer: 'trade' }); }
      return;
    }
    if (e.key === 'p' || e.key === 'P') {
      if (isCharacterOpen()) closeCharacter();
      else { closeOverlays(); openCharacter(currentState); }
      return;
    }
    if (isOverlayOpen()) return;

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
  if (settings.musicMuted || !settings.musicVolume) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.09);
    gain.gain.setValueAtTime(0.06 * (settings.musicVolume / 100), now);
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

// a trade on the map (sale, purchase, caravan sent): save and refresh
document.addEventListener('kingdom:trade', (e) => {
  if (!currentState) return;
  saveGame(currentState);
  refreshAllPanels();
  if (e.detail.message) toast(e.detail.message);
});

// a decree issued on the map: save, refresh the bars and tell the player
document.addEventListener('kingdom:decree', (e) => {
  if (!currentState) return;
  saveGame(currentState);
  refreshAllPanels();
  toast(`${currentState.scenario === 'sedlak' ? 'Naplánováno' : 'Výnos vydán'}: ${e.detail.label}`);
});

// building in a town or on the farm: save, refresh the bars and tell the player
document.addEventListener('kingdom:build', (e) => {
  if (!currentState) return;
  if (!e.detail.error) saveGame(currentState);
  refreshAllPanels();
  if (e.detail.message) toast(e.detail.message);
});

// the first visit to the map, a town or the trade table brings a tip
document.addEventListener('kingdom:map-open', (e) => showTip(e.detail.layer === 'trade' ? 'trade' : 'map'));
document.addEventListener('kingdom:town-open', () => showTip('town'));

wireActions();
wireMapChrome();
wireKeyboard();
wireMenuAmbience();
wireClickSound();
showScreen('screen-menu');
