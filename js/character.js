// Ruler avatar / character sheet ("Postava").
// Portraits are optional files; missing ones fall back gracefully to an initial.

import { TRAIT_DEFS, STATUS_TIERS, SEASONS, tierTitle } from './data.js';
import { traitBonuses, reignEpithet } from './engine.js';
import { biography, loyaltyLabel, roleLabel } from './court.js';
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

/** Court member portrait files: assets/portraits/<role>_<male|female>.jpg (or .png). */
export function memberPortraitCandidates(c, role) {
  const base = `assets/portraits/${role}_${c.gender === 'male' ? 'male' : 'female'}`;
  return [`${base}.jpg`, `${base}.png`];
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
  const title = tierTitle(r.statusTier, r.gender);
  const ageK = Math.max(0, Math.min(0.5, (r.age - 40) / 60));
  const years = reignYears(state);

  const ladder = STATUS_TIERS.slice(1).map((label, i) => {
    const tier = i + 1;
    const cls = tier < r.statusTier ? 'done' : tier === r.statusTier ? 'current' : '';
    const shown = tier === 5 || tier === r.statusTier ? tierTitle(tier, r.gender) : label;
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

  // what the traits do every season (see traitBonuses in engine.js)
  const b = traitBonuses(state);
  const sign = (v) => (v > 0 ? `+${v}` : `${v}`);
  const influence = [
    ['strength', b.order, `${sign(b.order)} k pořádku v provinciích (méně nepokojů)`],
    ['eloquence', b.loyalty, `${sign(b.loyalty)} k věrnosti provincií`],
    ['intelligence', b.gold, `${sign(b.gold)} zlata do pokladny každé období`],
    ['patience', b.calm, `${sign(b.calm)} k trpělivosti s nepokoji, než se otřese stabilita`],
  ].map(([key, val, text]) => {
    const t = TRAIT_DEFS.find((d) => d.key === key);
    return `<li class="${val > 0 ? 'pos' : val < 0 ? 'neg' : ''}">${t.icon}<b>${t.label}</b><span>${val === 0 ? 'průměrná, bez zvláštního vlivu' : text}</span></li>`;
  }).join('');

  const family = ['spouse', 'heir'].map((role) => {
    const c = state[role];
    if (!c) return '';
    const alive = c.alive !== false;
    const initial = esc(c.name ? c.name[0] : '?');
    return `
      <div class="cs-member${alive ? '' : ' deceased'}" data-person="${role}" role="button" tabindex="0" title="Zobrazit detail">
        <span class="cs-mini">${initial}</span>
        ${portraitImg(memberPortraitCandidates(c, role), c.name, 'cs-mini-img')}
        <div>
          <span>${ROLE_LABEL[role](c.gender)}</span>
          <strong>${esc(c.name)}${alive ? '' : ' †'}</strong>
          <small>${c.age} let · věrnost ${c.loyalty}</small>
        </div>
      </div>`;
  }).join('');

  const OUTCOME_WORD = { success: ' (úspěch)', failure: ' (nezdar)', danger: ' (nebezpečí)' };
  const ancestors = (state.pastRulers || []).slice().reverse().map((a) => {
    const f = a.gender === 'female' ? 'a' : '';
    const deeds = (a.deeds || []).map((d) => `<li>${d.year} · ${esc(d.title)}: ${esc(d.choice)}${OUTCOME_WORD[d.outcome] || ''}</li>`).join('');
    return `
      <li><strong>${esc(a.name)}${a.epithet ? ` <em>${esc(a.epithet)}</em>` : ''}</strong>
        ${a.epithetReason ? `<span class="cs-reason">${esc(a.epithetReason)}</span>` : ''}
        <span>${a.generation}. generace · vládl${f} ${a.years} ${yearsWord(a.years)} · zemřel${f} v ${a.diedAt} letech</span>
        ${deeds ? `<ul class="cs-deeds">${deeds}</ul>` : ''}</li>`;
  }).join('');
  const epithet = reignEpithet(state);
  const epithetLine = epithet
    ? `<p class="cs-epithet">Lid ${r.gender === 'female' ? 'ji' : 'ho'} už teď nazývá <em>${esc(r.name)} ${esc(epithet.word)}</em>, ${esc(epithet.reason)}.</p>`
    : `<p class="cs-epithet">Lid ještě neví, jak ${r.gender === 'female' ? 'ji' : 'ho'} bude nazývat.</p>`;

  document.getElementById('character-sheet').innerHTML = `
    <div class="cs-portrait-wrap">
      <div class="cs-portrait" style="--age-k:${ageK.toFixed(2)}">
        <span class="cs-initial">${esc(r.name ? r.name[0] : '?')}</span>
        ${portraitImg(rulerPortraitCandidates(r), r.name, 'cs-portrait-img')}
        <div class="cs-aging"></div>
      </div>
      <p class="cs-portrait-note">${r.age >= OLD_AGE ? 'Léta vlády se do tváře vepsala.' : state.scenario === 'slechtic' ? `Portrét ${r.gender === 'female' ? 'paní' : 'pána'} rodu ${esc(state.dynastyName)}.` : 'Portrét z doby nástupu na trůn.'}</p>
    </div>
    <div class="cs-info">
      <span class="panel-overline">${esc(title)} · ${state.generation}. generace</span>
      <h2 class="cs-name">${esc(r.name)}</h2>
      <div class="cs-dynasty">z dynastie ${esc(state.dynastyName)}</div>
      ${epithetLine}
      <div class="cs-facts">
        <div><span>Věk</span><strong>${r.age}</strong></div>
        <div><span>${state.scenario === 'slechtic' ? 'V čele rodu' : 'Vláda'}</span><strong>${years} ${yearsWord(years)}</strong></div>
        <div><span>Rok</span><strong>${state.year}</strong></div>
      </div>
      <h4 class="cs-section">Postavení</h4>
      <div class="cs-ladder">${ladder}</div>
      <h4 class="cs-section">Vlastnosti</h4>
      <div class="cs-traits">${traits}</div>
      <h4 class="cs-section">Vliv na vládu</h4>
      <ul class="cs-influence">${influence}</ul>
      <h4 class="cs-section">Rodina</h4>
      <div class="cs-family">${family}</div>
      ${ancestors ? `<h4 class="cs-section cs-gap">Síň předků</h4><ul class="cs-ancestors">${ancestors}</ul>` : ''}
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

// ---------- court member detail ("person") ----------

const OUTCOME_WORDS = { success: 'úspěch', failure: 'nezdar', danger: 'nebezpečí', safe: 'bez úhony' };

export function renderPersonSheet(state, role) {
  const c = state[role];
  if (!c) return;
  const alive = c.alive !== false;
  const title = roleLabel(role, c.gender, state.scenario);
  const history = (c.history || []).slice().reverse();
  const him = c.gender === 'female' ? 'ji' : 'ho';
  const rows = history.map((h) => {
    const delta = h.delta === null || h.delta === undefined ? ''
      : `<span class="ph-delta ${h.delta > 0 ? 'pos' : 'neg'}">věrnost ${h.delta > 0 ? '+' : ''}${h.delta}</span>`;
    const outcome = OUTCOME_WORDS[h.outcome] ? ` <em>(${OUTCOME_WORDS[h.outcome]})</em>` : '';
    return `<li>
      <span class="ph-date">${SEASONS[h.season]} · rok ${h.year}</span>
      <strong>${esc(h.title)}</strong>
      ${h.choice ? `<span class="ph-choice">Rozhodnutí: ${esc(h.choice)}${outcome}</span>` : ''}
      ${delta}
    </li>`;
  }).join('');

  document.getElementById('person-sheet').innerHTML = `
    <div class="ps-portrait${alive ? '' : ' deceased'}">
      <span class="cs-initial">${esc(c.name ? c.name[0] : '?')}</span>
      ${portraitImg(memberPortraitCandidates(c, role), c.name, 'ps-portrait-img')}
    </div>
    <div class="ps-info">
      <span class="panel-overline">${esc(title)}${alive ? '' : ' · zesnul' + (c.gender === 'female' ? 'á' : 'ý')}</span>
      <h2 class="ps-name">${esc(c.name)}</h2>
      <div class="ps-meta">${c.age} let · <span class="ps-loyal">${loyaltyLabel(c.loyalty, c.gender)}</span></div>
      <div class="ps-bar"><span style="width:${c.loyalty}%"></span><b>věrnost ${c.loyalty}</b></div>
      <p class="ps-bio">${esc(biography(c, role, state.dynastyName))}</p>
      <h4 class="ps-section">Co ${him} ovlivnilo</h4>
      ${rows ? `<ul class="ps-history">${rows}</ul>` : `<p class="ps-empty">Zatím žádné tvé rozhodnutí ${him} nezasáhlo. Až se ${c.gender === 'female' ? 'jí' : 'ho'} nějaké týkat, uvidíš ho tady.</p>`}
    </div>
  `;
}

export function openPerson(state, role) {
  renderPersonSheet(state, role);
  const view = document.getElementById('person-view');
  view.classList.add('open');
  view.setAttribute('aria-hidden', 'false');
  view.querySelector('.person-card').scrollTop = 0;
}

export function closePerson() {
  const view = document.getElementById('person-view');
  view.classList.remove('open');
  view.setAttribute('aria-hidden', 'true');
}

export function isPersonOpen() {
  return document.getElementById('person-view').classList.contains('open');
}
