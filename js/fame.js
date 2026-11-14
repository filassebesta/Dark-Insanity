// What drives a player beyond the next event: the ambition bar above the
// story, the Hall of Fame screen and the achievements of a finished chronicle.

import { ambitionProgress, AMBITIONS } from './ambitions.js';
import { ACHIEVEMENTS, unlockedAchievements } from './achievements.js';
import { esc } from './ui.js';
import { warTarget, oddsLabel } from './war.js';

const SEASON_GEN = ['jara', 'léta', 'podzimu', 'zimy'];

function untilText(state, turn) {
  const ahead = turn - state.turn;
  const year = state.year + Math.floor((state.seasonIndex + ahead) / 4);
  return `do ${SEASON_GEN[turn % 4]} roku ${year}`;
}

/** The ribbon above the story: the current ambition and how far it is. */
export function renderAmbitionBar(state) {
  const el = document.getElementById('ambition-bar');
  if (!el) return;
  const p = state && ambitionProgress(state);
  el.hidden = !p;
  if (!p) { el.innerHTML = ''; return; }
  const left = p.deadline - state.turn;
  el.classList.toggle('urgent', left <= 4 && !p.met);
  el.innerHTML = `
    <span class="amb-over">Ambice</span>
    <strong>${esc(p.def.name)}</strong>
    <span class="amb-goal">${esc(p.def.text)}</span>
    <span class="amb-track"><i style="width:${Math.round(p.pct * 100)}%"></i></span>
    <span class="amb-state">${esc(p.label)} · ${esc(untilText(state, p.deadline))}</span>`;
}

/** The ribbon of a running campaign above the story. */
export function renderWarBar(state) {
  const el = document.getElementById('war-bar');
  if (!el) return;
  const w = state && state.war;
  el.hidden = !w;
  if (!w) { el.innerHTML = ''; return; }
  const t = warTarget(state);
  const leader = w.leader === 'ruler' ? state.ruler.name : state.marshal.name;
  const marching = state.turn < w.arrive;
  const [odds] = oddsLabel(state, w.target, w.troops || w.power);
  el.classList.toggle('urgent', w.morale < 30);
  el.innerHTML = `
    <span class="amb-over">Tažení</span>
    <strong>${esc(t.name)}</strong>
    <span class="amb-goal">${marching ? 'Vojsko je na pochodu.' : `V poli ${w.seasons}. období.`} Velí ${esc(leader)}, ${w.power} mužů · ${esc(odds.toLowerCase())}.</span>
    <span class="war-tracks"><span>Postup</span><span class="amb-track"><i style="width:${w.progress}%"></i></span><b>${w.progress} %</b>
      <span>Morálka</span><span class="amb-track morale"><i style="width:${w.morale}%"></i></span><b>${w.morale}</b></span>`;
}

/** Ambition section of the character sheet: the goal now and the ones before. */
export function ambitionSection(state) {
  const p = ambitionProgress(state);
  const log = (state.ambitionLog || []).slice(-6).reverse();
  if (!p && !log.length) return '';
  const now = p ? `<div class="cs-ambition"><b>${esc(p.def.name)}</b><span>${esc(p.def.text)}</span>
      <span class="amb-track"><i style="width:${Math.round(p.pct * 100)}%"></i></span><small>${esc(p.label)} · ${esc(untilText(state, p.deadline))}</small></div>` : '';
  const past = log.length ? `<ul class="cs-ambition-log">${log.map((a) => `<li class="${a.result === 'met' ? 'pos' : 'neg'}">${a.year} · ${esc(a.ruler)}: ${esc(a.name)} — ${a.result === 'met' ? 'splněno' : 'nesplněno'}</li>`).join('')}</ul>` : '';
  return `<h4 class="cs-section">Ambice</h4>${now}${past}`;
}

/** The Hall of Fame screen. */
export function renderHall() {
  const have = unlockedAchievements();
  const groups = [...new Set(ACHIEVEMENTS.map((a) => a.group))];
  const done = ACHIEVEMENTS.filter((a) => have[a.key]).length;
  document.getElementById('hall-count').textContent = `Odemčeno ${done} z ${ACHIEVEMENTS.length}`;
  document.getElementById('hall-list').innerHTML = groups.map((g) => `
    <h4 class="hall-group">${esc(g)}</h4>
    <div class="hall-grid">${ACHIEVEMENTS.filter((a) => a.group === g).map((a) => {
      const got = have[a.key];
      const hidden = a.secret && !got;
      const when = got ? `${got.ruler}${got.dynasty ? ` · ${got.dynasty}` : ''} · rok ${got.year}` : '';
      return `<div class="hall-item${got ? ' got' : ''}">
        <span class="hall-seal">${got ? '✦' : '?'}</span>
        <div><b>${esc(hidden ? 'Skrytý úspěch' : a.name)}</b><span>${esc(hidden ? 'Odhalí se, až se to stane.' : a.text)}</span>${got ? `<small>${esc(when)}</small>` : ''}</div>
      </div>`;
    }).join('')}</div>`).join('');
}

/** Achievements earned in this chronicle, under the ending. */
export function renderEndingAchievements(state) {
  const el = document.getElementById('ending-achievements');
  const keys = state.achievementsEarned || [];
  el.hidden = !keys.length;
  el.innerHTML = keys.length ? `<span class="panel-overline light">Do Síně slávy</span>
    <div class="ending-ach-list">${keys.map((k) => ACHIEVEMENTS.find((a) => a.key === k)).filter(Boolean).map((a) => `<span>✦ ${esc(a.name)}</span>`).join('')}</div>` : '';
}

/** A short announcement for a freshly unlocked achievement. */
export function announceAchievement(a) {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = 'toast achievement-toast';
  el.innerHTML = `<span>Síň slávy</span><b>✦ ${esc(a.name)}</b><small>${esc(a.text)}</small>`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4600);
}

export { AMBITIONS };
