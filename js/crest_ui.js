// The coat-of-arms editor (editor erbu): a window with a live preview. It opens right after the
// peasant is raised to a noble (the chapter card "Erb a tvrz") and again from the house panel.
// Pure UI over heraldry.js; the finished crest is written to state.crest.

import {
  SHAPES, DIVISIONS, TINCTURES, CHARGES, CHARGE_KEYS, cleanCrest, ensureCrest, randomCrest,
  crestInnerOf, crestSvgOf, blazon, legibilityNote,
} from './heraldry.js';
import { makeChronicleEntry } from './state.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const NEUTRAL = { shape: 'heater', division: 'plain', c1: 'cervena', c2: 'stribrna', charge: 'none', count: 1, cc: 'zlata', border: null };

let host = null;

export function isCrestEditorOpen() { return !!host; }

export function closeCrestEditor() {
  if (host) { host.remove(); host = null; }
  document.body.classList.remove('ce-open');
}

const swatches = (name, current, { none = false } = {}) => `
  <div class="ce-swatches" role="group" aria-label="${name}">
    ${none ? `<button type="button" class="ce-sw none${current ? '' : ' on'}" data-ce="${name}" data-v="" title="Bez lemu" aria-label="Bez lemu">∅</button>` : ''}
    ${Object.entries(TINCTURES).map(([k, t]) => `<button type="button" class="ce-sw${current === k ? ' on' : ''}${t.metal ? ' metal' : ''}" data-ce="${name}" data-v="${k}" style="--sw:${t.hex}" title="${t.label}" aria-label="${t.label}"></button>`).join('')}
  </div>`;

/** A small preview of a division or a charge for its button. */
const miniDivision = (key, d) => `<svg viewBox="0 0 40 48" aria-hidden="true">${crestInnerOf({ ...NEUTRAL, shape: d.shape, division: key, c1: 'modra', c2: 'stribrna' })}</svg>`;
const miniShape = (key, d) => `<svg viewBox="0 0 40 48" aria-hidden="true">${crestInnerOf({ ...NEUTRAL, shape: key, c1: 'modra' })}</svg>`;
const miniCharge = (key, d) => `<svg viewBox="0 0 40 48" aria-hidden="true">${key === 'none' ? '<path d="M10 14l20 20M30 14L10 34" stroke="#7a6a52" stroke-width="3" stroke-linecap="round"/>' : CHARGES[key].draw('#1f1b18', '#3a2d1f')}</svg>`;

/**
 * Opens the editor. `first` = the first design (no way to leave without a crest; the random button is there).
 * onDone(crest) runs after the crest is saved.
 */
export function openCrestEditor(state, { first = false, onDone = null } = {}) {
  closeCrestEditor();
  const start = state.crest && !state.crest.auto ? state.crest : (first ? randomCrest() : ensureCrest(state));
  let draft = cleanCrest(start);

  host = document.createElement('div');
  host.className = 'ce-overlay';
  host.setAttribute('role', 'dialog');
  host.setAttribute('aria-modal', 'true');
  host.setAttribute('aria-label', 'Erb rodu');
  document.body.appendChild(host);
  document.body.classList.add('ce-open');

  const draw = () => {
    const note = legibilityNote(draft);
    host.innerHTML = `
      <div class="ce-panel">
        <div class="ce-head">
          <span class="panel-overline">${first ? 'Šlechtický stav' : 'Heraldika'}</span>
          <h3 class="panel-title">Erb rodu ${esc(state.dynastyName)}</h3>
          <p class="ce-lead">${first ? 'Rod, který oral cizí pole, dostal právo na štít. Navrhni, co bude vidět nad branou tvrze, na praporech i na pečeti.' : 'Přepracovat erb můžeš, jak chceš. Starý štít zůstane v kronice.'}</p>
        </div>
        <div class="ce-preview">
          ${crestSvgOf(draft, 'ce-crest')}
          <p class="ce-blazon">${esc(blazon(draft))}</p>
          ${note ? `<p class="ce-note">${esc(note)}</p>` : ''}
        </div>
        <div class="ce-body">
          <h4 class="ce-sub">Tvar štítu</h4>
          <div class="ce-grid shapes">${Object.entries(SHAPES).map(([k, d]) => `<button type="button" class="ce-opt${draft.shape === k ? ' on' : ''}" data-ce="shape" data-v="${k}" title="${d.label}">${miniShape(k, d)}<span>${d.label}</span></button>`).join('')}</div>
          <h4 class="ce-sub">Dělení pole</h4>
          <div class="ce-grid">${Object.entries(DIVISIONS).map(([k, d]) => `<button type="button" class="ce-opt${draft.division === k ? ' on' : ''}" data-ce="division" data-v="${k}" title="${d.label}">${miniDivision(k, { shape: draft.shape })}<span>${d.label}</span></button>`).join('')}</div>
          <h4 class="ce-sub">${draft.division === 'plain' ? 'Barva pole' : 'Hlavní barva pole'}</h4>
          ${swatches('c1', draft.c1)}
          ${draft.division === 'plain' ? '' : `<h4 class="ce-sub">Druhá barva ${draft.division === 'chevron' || draft.division === 'cross' ? '(krokev, kříž)' : 'pole'}</h4>${swatches('c2', draft.c2)}`}
          <h4 class="ce-sub">Znamení</h4>
          <div class="ce-grid charges">${['none', ...CHARGE_KEYS].map((k) => `<button type="button" class="ce-opt${draft.charge === k ? ' on' : ''}" data-ce="charge" data-v="${k}" title="${k === 'none' ? 'Bez znamení' : CHARGES[k].label}">${miniCharge(k)}<span>${k === 'none' ? 'Žádné' : CHARGES[k].label}</span></button>`).join('')}</div>
          ${draft.charge === 'none' ? '' : `
            <h4 class="ce-sub">Počet znamení</h4>
            <div class="ce-grid counts">${[1, 3].map((n) => `<button type="button" class="ce-opt wide${draft.count === n ? ' on' : ''}" data-ce="count" data-v="${n}"><span>${n === 1 ? 'Jedno' : 'Tři'}</span></button>`).join('')}</div>
            <h4 class="ce-sub">Barva znamení</h4>
            ${swatches('cc', draft.cc)}`}
          <h4 class="ce-sub">Lem štítu</h4>
          ${swatches('border', draft.border, { none: true })}
        </div>
        <div class="ce-actions">
          <button type="button" class="trade-mini" data-ce-random>Náhodný erb</button>
          ${first ? '' : '<button type="button" class="trade-mini" data-ce-cancel>Zrušit</button>'}
          <button type="button" class="seal-button primary ce-save" data-ce-save>${first ? 'Přijmout erb' : 'Uložit erb'}</button>
        </div>
      </div>`;
  };

  const redraw = () => {
    const keep = host.querySelector('.ce-panel');
    const top = keep ? keep.scrollTop : 0;
    draw();
    const now = host.querySelector('.ce-panel');
    if (now) now.scrollTop = top;
  };

  host.addEventListener('click', (e) => {
    const t = e.target;
    const opt = t.closest('[data-ce]');
    if (opt) {
      const k = opt.dataset.ce;
      const v = opt.dataset.v;
      if (k === 'count') draft.count = Number(v);
      else if (k === 'border') draft.border = v || null;
      else draft[k] = v;
      draft = cleanCrest(draft);
      redraw();
      return;
    }
    if (t.closest('[data-ce-random]')) { draft = cleanCrest(randomCrest()); redraw(); return; }
    if (t.closest('[data-ce-cancel]')) { closeCrestEditor(); return; }
    if (t.closest('[data-ce-save]')) {
      const changed = !!state.crest && !state.crest.auto;
      state.crest = { ...cleanCrest(draft), auto: false };
      state.chronicle.push(makeChronicleEntry(state, `${changed ? `Rod ${state.dynastyName} změnil svůj erb` : `Rod ${state.dynastyName} přijal erb`}. ${blazon(state.crest)}`));
      closeCrestEditor();
      if (onDone) onDone(state.crest);
    }
  });
  host.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !first) closeCrestEditor(); });
  draw();
  const focus = host.querySelector('[data-ce-save]');
  if (focus) focus.focus({ preventScroll: true });
}
