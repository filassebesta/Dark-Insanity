// Coats of arms of the great houses, drawn as small SVG shields (viewBox 0 0 40 48).
// crestSvg(houseId) is a standalone <svg> for panels and cards; crestInner(houseId) is the bare shield
// for placing inside another SVG (the painted map). Colours come from NOBLE_HOUSES[].colors = [field, charge].
// No DOM here.

import { NOBLE_HOUSES } from './data.js';

const SHIELD = 'M3 3h34v22c0 11-9 17-17 21C12 42 3 36 3 25z';
const RIM = '#c8a46a';

// the charge of each coat of arms: f = field colour, c = charge colour
const CHARGES = {
  // a gate with a raised portcullis
  brana: (f, c) => `<path d="M11 40V20a9 9 0 0 1 18 0v20z" fill="${c}"/>
    <path d="M15 40V19M20 40V17M25 40V19M12 26h16M12 32h16" stroke="${f}" stroke-width="1.3" fill="none"/>
    <circle cx="12" cy="11" r="2.1" fill="${c}"/><circle cx="20" cy="9" r="2.1" fill="${c}"/><circle cx="28" cy="11" r="2.1" fill="${c}"/>`,
  // a mountain ridge under a hammer
  rudi: (f, c) => `<path d="M6 38l9-14 5 6 5-9 9 17z" fill="${c}"/>
    <path d="M20 8v15" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/>
    <rect x="13.5" y="7" width="13" height="6" rx="1" fill="${c}"/>`,
  // a falcon with spread wings
  sokolove: (f, c) => `<path d="M20 12c-5 0-11 2-15 9 5-1 9 0 12 3l1 9 2 6 2-6 1-9c3-3 7-4 12-3-4-7-10-9-15-9z" fill="${c}"/>
    <circle cx="20" cy="10.5" r="3.2" fill="${c}"/><path d="M22.4 10.2l3.4 1.2-3.2 1z" fill="${f}"/>`,
  // a stag's antlers over a muzzle
  jelenove: (f, c) => `<g stroke="${c}" stroke-width="2.1" stroke-linecap="round" fill="none">
    <path d="M17 29C14 26 12 22 11 16M14.5 24l-6-3M12 19l-4-4M12 17l3-5M23 29c3-3 5-7 6-13M25.5 24l6-3M28 19l4-4M28 17l-3-5"/></g>
    <path d="M15.5 40l4.5-12 4.5 12z" fill="${c}"/>`,
  // a stone cross
  kriz: (f, c) => `<path d="M17 7h6v11h11v6H23v17h-6V24H6v-6h11z" fill="${c}"/>
    <path d="M20 10v28M9 21h22" stroke="${f}" stroke-width=".9" opacity=".55"/>`,
  // a tower above the river
  ricane: (f, c) => `<path d="M15 20V9h2.6v2h2.1V9h2.6v2h2.1V9H27v11z" fill="${c}"/>
    <path d="M18 20v-4a2 2 0 0 1 4 0v4z" fill="${f}"/>
    <g stroke="${c}" stroke-width="2" fill="none" stroke-linecap="round"><path d="M6 26q3.5-3.5 7 0t7 0 7 0 7 0M6 32q3.5-3.5 7 0t7 0 7 0 7 0M7.5 38q3-3 6 0t6 0 6 0 6 0"/></g>`,
  // a horse-tail standard with a crescent
  pustopolci: (f, c) => `<path d="M20 41V16" stroke="${c}" stroke-width="2" stroke-linecap="round"/>
    <path d="M26.5 7.5a8 8 0 1 0 0 11 6.3 6.3 0 1 1 0-11z" fill="${c}"/>
    <g stroke="${c}" stroke-width="2.4" stroke-linecap="round" fill="none"><path d="M20 22q-8 4-9.5 16M20 22v18M20 22q8 4 9.5 16"/></g>`,
  // scales of justice
  soudci: (f, c) => `<g stroke="${c}" stroke-width="2" stroke-linecap="round" fill="none"><path d="M20 9v27M12 37h16M9 14h22"/></g>
    <circle cx="20" cy="9" r="2.3" fill="${c}"/>
    <path d="M9 14l-5 11h10zM31 14l-5 11h10z" fill="${c}" opacity=".95"/>`,
};

/** The shield of a house without the surrounding <svg> (for the painted map). */
export function crestInner(id) {
  const def = NOBLE_HOUSES.find((h) => h.id === id);
  const [field, charge] = def ? def.colors : ['#555', '#ddd'];
  const draw = CHARGES[id];
  return `<path d="${SHIELD}" fill="${field}"/>${draw ? draw(field, charge) : ''}<path d="${SHIELD}" fill="none" stroke="${RIM}" stroke-width="1.6" stroke-linejoin="round"/>`;
}

/** A standalone crest, as large as its CSS class says. */
export function crestSvg(id, cls = '') {
  return `<svg class="hs-crest ${cls}" viewBox="0 0 40 48" role="img" aria-label="Erb rodu" focusable="false">${crestInner(id)}</svg>`;
}
