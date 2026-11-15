// The tabs of the book at the top ("Postava", "Mapa", …) are illustrated icon buttons. The painted art
// assets/ui/tab_<key>.webp (cut out of a flat background, see docs/obrazky-ikony.md) replaces the drawn line
// icon below as soon as its key is listed in TAB_ART. The name appears as a bubble when the pointer rests on a tab.
// No game logic here.

import { ICONS } from './icons.js';

const line = (paths) => `<svg class="bt-line" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

// keys with a painted icon in assets/ui/ (the lead adds a key when the file arrives)
export const TAB_ART = new Set(['character', 'map', 'trade', 'war', 'chronicle']);

/** What each tab shows: label, a one-line hint for the bubble, and the drawn icon used until the art exists. */
export const TABS = {
  character: { label: 'Postava', hint: 'Tvé vlastnosti, zranění, výbava a rodokmen.', art: 'character', line: line('<circle cx="12" cy="8" r="3.6"/><path d="M4.5 21c.6-4.6 3.6-7 7.5-7s6.9 2.4 7.5 7"/>') },
  map: { label: 'Mapa', hint: 'Mapa království: kraje, osady, stavby.', art: 'map', line: line('<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>') },
  trade: { label: 'Obchod', hint: 'Ceny, karavany a povinné zakázky.', art: 'trade', line: line('<path d="M3 8h13v8H3z"/><path d="M16 11h3.5l1.5 2.5V16h-5z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>') },
  war: { label: 'Válka', hint: 'Verbování, tažení a posádky.', art: 'war', line: ICONS.army.replace('class="ico"', 'class="bt-line"') },
  court: { label: 'Dvůr', hint: 'Rodina a rádci: kdo je kdo a co si myslí.', art: 'court', line: ICONS.legitimacy.replace('class="ico"', 'class="bt-line"') },
  family: { label: 'Rodina', hint: 'Rodina a sousedé ve vsi.', art: 'family', line: line('<path d="M3.5 11.5L12 4l8.5 7.5"/><path d="M6 10v10h12V10"/><path d="M10 20v-6h4v6"/>') },
  houses: { label: 'Rody', hint: 'Velké rody: vztahy, moc a družiny.', art: 'houses', line: ICONS.houses.replace('class="ico"', 'class="bt-line"') },
  chronicle: { label: 'Kronika', hint: 'Co se stalo od začátku kroniky.', art: 'chronicle', line: line('<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h10"/>') },
};

/** Draws the icon (painted when available, otherwise the line drawing) and a hidden text label into a tab. */
export function paintTab(tab, key, label, hint) {
  const def = TABS[key] || TABS[tab.dataset.panel];
  if (!def) return;
  const art = TAB_ART.has(def.art) ? `<img class="bt-art" src="assets/ui/tab_${def.art}.webp" alt="" draggable="false">` : def.line;
  tab.innerHTML = `<span class="bt-icon">${art}</span><span class="bt-label">${label}</span>`;
  tab.setAttribute('aria-label', label);
  tab.dataset.tipTitle = label;
  tab.dataset.tipText = hint || def.hint;
  tab.dataset.tabKey = key;
}
