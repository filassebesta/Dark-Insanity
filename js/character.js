// Ruler avatar / character sheet ("Postava").
// Portraits are optional files; missing ones fall back gracefully to an initial.

import { TRAIT_DEFS, STATUS_TIERS } from './data.js';
import { esc } from './ui.js';

const TIER_SLUGS = [null, 'peasant', 'freeman', 'minor_noble', 'noble', 'king'];
const OLD_AGE = 55;

const TRAIT_TEXT = {
  strength: 'Rozhoduje v boji, při zastrašování a tam, kde je třeba ukázat pěst.',
  eloquence: 'Přesvědčuje šlechtu, smiřuje znesvářené a vyjednává s posly.',
  intelligence: 'Prohlédne léčky, spravuje pokladnu a čte mezi řádky dopisů.',
  patience: 'Umí čekat na správnou chvíli a nedá se vyprovokovat.',
};

const ROLE_LABEL = {
  heir: (g) => (g === 'male' ? 'Dědic' : 'Dědička'),
  spouse: (g) => (g === 'male' ? 'Manžel' : 'Manželka'),
};

/** Ordered list of portrait files to try for the ruler; the caller falls back to an initial. */
export function rulerPortraitCandidates(ruler) {
  const slug = TIER_SLUGS[ruler.statusTier] || 'king';
  const g = ruler.gender === 'female' ? 'female' : 'male';
  const base = `assets/portraits/ruler_${slug}_${g}`;
  const young = [`${base}.jpg`, `${base}.png`];
  return ruler.age >= OLD_AGE ? [`${base}_old.jpg`, `${base}_old.png`, ...young] : young;
}

/** <img> that walks through candidate URLs and finally hides itself, revealing the initial underneath. */
export function portraitImg(candidates, alt, cls = '') {
  const [first, ...rest] = candidates;
  return `<img class="${cls}" src="${esc(first)}" alt="${esc(alt)}" data-fallbacks="${esc(rest.join('|'))}" onerror="window.__portraitFallback(this)">`;
}

window.__portraitFallback = (img) => {
  const rest = (img.dataset.fallbacks || '').split('|').filter(Boolean);
  if (rest.length) {
    img.dataset.fallbacks = rest.slice(1).join('|');
    img.src = rest[0];
  } else {
    img.remove();
  }
};

function memberPortrait(c, role) {
  if (role === 'spouse') return `assets/portraits/${c.gender === 'male' ? 'spouse_king' : 'spouse_queen'}.png`;
  return `assets/portraits/${role}_${c.gender === 'male' ? 'male' : 'female'}.png`;
}

function title5(r) {
  return r.gender === 'female' ? 'Královna' : 'Král';
}

function reignYears(state) {
  return Math.floor((state.turn - (state.ruler.reignStartTurn || 0)) / 4);
}

function yearsWord(n) {
  if (n === 1) return 'rok';
  if (n >= 2 && n <= 4) return 'roky';
  return 'let';
}

export function renderCharacterSheet(state) {
  const r = state.ruler;
  const tierName = STATUS_TIERS[r.statusTier];
  const title = r.statusTier === 5 ? title5(r) : tierName;
  const ageK = Math.max(0, Math.min(0.5, (r.age - 40) / 60));
  const years = reignYears(state);

  const ladder = STATUS_TIERS.slice(1).map((label, i) => {
    const tier = i + 1;
    const cls = tier < r.statusTier ? 'done' : tier === r.statusTier ? 'current' : '';
    const shown = tier === 5 ? title5(r) : label;
    return `<div class="cs-step ${cls}"><i></i>${esc(shown)}</div>`;
  }).join('');

  const traits = TRAIT_DEFS.map((t) => {
    const v = r.traits[t.key];
    const pips = Array.from({ length: 10 }, (_, i) => `<span class="${i < v ? 'on' : ''}"></span>`).join('');
    return `
      <div class="cs-trait">
        ${t.icon}
        <b>${t.label}</b>
        <em>${v}</em>
        <div class="cs-pips">${pips}</div>
        <small>${TRAIT_TEXT[t.key]}</small>
      </div>`;
  }).join('');

  const family = ['spouse', 'heir'].map((role) => {
    const c = state[role];
    if (!c) return '';
    const alive = c.alive !== false;
    const initial = esc(c.name ? c.name[0] : '?');
    return `
      <div class="cs-member${alive ? '' : ' deceased'}">
        <span class="cs-mini">${initial}</span>
        ${portraitImg([memberPortrait(c, role)], c.name, 'cs-mini-img')}
        <div>
          <span>${ROLE_LABEL[role](c.gender)}</span>
          <strong>${esc(c.name)}${alive ? '' : ' †'}</strong>
          <small>${c.age} let · věrnost ${c.loyalty}</small>
        </div>
      </div>`;
  }).join('');

  const ancestors = (state.pastRulers || []).slice().reverse().map((a) => `
      <li><strong>${esc(a.name)}</strong><span>${a.generation}. generace · vládl${a.gender === 'female' ? 'a' : ''} ${a.years} ${yearsWord(a.years)} · zemřel${a.gender === 'female' ? 'a' : ''} v ${a.diedAt} letech</span></li>`).join('');

  document.getElementById('character-sheet').innerHTML = `
    <div class="cs-portrait-wrap">
      <div class="cs-portrait" style="--age-k:${ageK.toFixed(2)}">
        <span class="cs-initial">${esc(r.name ? r.name[0] : '?')}</span>
        ${portraitImg(rulerPortraitCandidates(r), r.name, 'cs-portrait-img')}
        <div class="cs-aging"></div>
      </div>
      <p class="cs-portrait-note">${r.age >= OLD_AGE ? 'Léta vlády se do tváře vepsala.' : 'Portrét z doby nástupu na trůn.'}</p>
    </div>
    <div class="cs-info">
      <span class="panel-overline">${esc(title)} · ${state.generation}. generace</span>
      <h2 class="cs-name">${esc(r.name)}</h2>
      <div class="cs-dynasty">z dynastie ${esc(state.dynastyName)}</div>
      <div class="cs-facts">
        <div><span>Věk</span><strong>${r.age}</strong></div>
        <div><span>Vláda</span><strong>${years} ${yearsWord(years)}</strong></div>
        <div><span>Rok</span><strong>${state.year}</strong></div>
      </div>
      <h4 class="cs-section">Postavení</h4>
      <div class="cs-ladder">${ladder}</div>
      <h4 class="cs-section">Vlastnosti</h4>
      <div class="cs-traits">${traits}</div>
      <h4 class="cs-section">Rodina</h4>
      <div class="cs-family">${family}</div>
      ${ancestors ? `<h4 class="cs-section cs-gap">Předkové</h4><ul class="cs-ancestors">${ancestors}</ul>` : ''}
    </div>
  `;

}

export function openCharacter(state) {
  renderCharacterSheet(state);
  const view = document.getElementById('character-view');
  view.classList.add('open');
  view.setAttribute('aria-hidden', 'false');
  view.scrollTop = 0;
}

export function closeCharacter() {
  const view = document.getElementById('character-view');
  view.classList.remove('open');
  view.setAttribute('aria-hidden', 'true');
}

export function isCharacterOpen() {
  return document.getElementById('character-view').classList.contains('open');
}
