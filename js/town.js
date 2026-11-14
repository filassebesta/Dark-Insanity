// Drawing of a settlement: the town plan with its plots (an SVG scene) and the
// sidebar where the player builds. Logic lives in build.js; map.js shows this
// in place of the map and wires the clicks.

import {
  settlementDef, townOf, ownsTown, catalogFor, buildingDef, buildBlock, currentProject, readyBuildings,
  levelName, slotCount, maxLevel, upgradeInfo, townYield, isFarm, crewLimit, projectsRunning,
} from './build.js';
import { GOODS, MARKETS, bestMarket, trendOf, riskOf, price } from './trade.js';
import { RESOURCE_DEFS, resourceLabel, NOBLE_HOUSES } from './data.js';
import { esc } from './ui.js';
import {
  ensureFarm, roomFor, countOf, STOCK, ANIMALS, buyBlock, sellBlock, sellPrice, millBlock, eatBlock, eatFood, farmOutlook, farmChain, worksChips, plural,
} from './farm.js';

import { C, rect, poly, gable, hip, door, win, cross, crenels, tree, pine, smoke, flag, house } from './town_kit.js';
import { CUTOUTS } from './town_art.js';
import { sceneContext, groundMarkup, defsMarkup, centreItems, lifeMarkup, houseSmokers, weatherMarkup, TOWN_BACKDROPS } from './town_scene.js';

// Painted art that has arrived (see docs/obrazky-stavby.md). BUILDING_ART: assets/buildings/<key>.jpg is the card
// picture in the build menu and the detail panel; for the keys in CUTOUTS (town_art.js, made by tools/images/make_cutouts.py)
// assets/buildings/<key>.webp is the same building cut out of its background, standing right on the scene.
// The rest keep their drawn icon.
// The painted cut-outs on the SCENE are switched off by default: next to the painted maps the drawn buildings read crisper.
// Set USE_PAINTED_BUILDINGS to true to show every cut-out, or put single keys into PAINTED_ALLOW to show just those
// (build menu thumbnails and the detail picture always use the painted art).
export const USE_PAINTED_BUILDINGS = false;
const PAINTED_ALLOW = new Set(['mlynek', 'vcelin', 'staj', 'kolna']); // painted cut-outs that beat the drawn icon on the maps
const paintedOnScene = (key) => !!CUTOUTS[key] && (USE_PAINTED_BUILDINGS || PAINTED_ALLOW.has(key));
const BUILDING_ART = new Set(['stodola', 'mlynek', 'chlev', 'staj', 'chlivek', 'kolna', 'vcelin', 'sad', 'kaplicka', 'kostel']);
const TOWN_ART = new Set([]);

// rough height of the drawn icons above their base line (for scaling them into a clearing)
const ICON_H = { kostel: 112, mlyn: 98, radnice: 122, katedrala: 136, hradby: 70, skola: 84, sachta: 76, spital: 90, lovci: 62, trziste: 46, kasarna: 66, lodenice: 62, sypka: 70, stodola: 62, kolna: 54, sad: 54, kaplicka: 70, vcelin: 50, chlivek: 40, chlev: 50, staj: 44, krcma: 66, kovarna: 68, cech: 68, sklad: 52, dilna: 60, celednik: 74, rybnik: 30, mlynek: 82 };

const ICONS = {
  kostel: () => `${rect(-48, -28, 62, 42, C.wall)}${gable(-48, -28, 62, 24, C.roof)}${win(-38, -16)}${win(-22, -16)}
    ${rect(14, -64, 26, 78, C.stone)}${poly('11,-64 27,-98 43,-64', C.slate)}${cross(27, -98)}${door(27, 14, 11, 18)}${win(24, -52, 6, 10)}`,
  trziste: () => [[-50, C.roof], [-14, C.gold], [22, C.green]].map(([x, c]) =>
    `${rect(x, -14, 30, 24, C.wood)}${rect(x + 2, -12, 26, 8, C.wall2)}<path d="M${x - 3} -14l5 -16h26l5 16z" fill="${c}"/><path d="M${x + 6} -30l-2 16M${x + 15} -30v16M${x + 24} -30l2 16" stroke="${C.wall}" stroke-width="2.5"/>
    <circle cx="${x + 8}" cy="-8" r="3" fill="${C.roof}"/><circle cx="${x + 16}" cy="-8" r="3" fill="${C.gold}"/><circle cx="${x + 23}" cy="-8" r="3" fill="${C.green}"/>`).join(''),
  mlyn: () => `${poly('-16,14 16,14 11,-40 -11,-40', C.wall)}${poly('-15,-40 0,-56 15,-40', C.roof2)}${door(0, 14)}${win(-3, -26)}
    <g class="b-blades"><animateTransform attributeName="transform" type="rotate" from="0 0 -42" to="360 0 -42" dur="12s" repeatCount="indefinite"/>${[0, 90, 180, 270].map((a) => `<g transform="rotate(${a} 0 -42)"><path d="M0 -42v-42" stroke="${C.wood2}" stroke-width="3"/>${rect(1, -82, 11, 34, C.wall2, `stroke="${C.wood2}" stroke-width="1.2"`)}</g>`).join('')}</g>
    <circle cx="0" cy="-42" r="4" fill="${C.ink}"/>`,
  krcma: () => `${house(-44, 14, 64, 38, 26, C.roof2)}${win(-36, -14)}${win(4, -14)}${rect(-18, -50, 9, 18, C.stone2)}${smoke(-14, -56)}
    <path d="M20 -16h22M38 -16v6" stroke="${C.ink}" stroke-width="2.2"/>${rect(28, -10, 18, 14, C.gold, `stroke="${C.ink}" stroke-width="1.5"`)}<path d="M33 -6h7v7h-7zM40 -4h3v4h-3" fill="${C.wall}"/>`,
  sypka: () => `${rect(-36, -40, 72, 54, C.wood)}${gable(-36, -40, 72, 34, C.roof2)}<path d="M-14 14v-30h28v30M0 -16v30" fill="${C.wood2}" stroke="${C.ink}" stroke-width="1.5"/>${win(-4, -58, 8, 9)}
    ${[-30, -22].map((x) => `<ellipse cx="${x + 60}" cy="8" rx="7" ry="6" fill="${C.gold}"/>`).join('')}`,
  kovarna: () => `${house(-48, 14, 58, 38, 22, C.slate, C.stone)}${rect(-38, -54, 10, 22, C.stone2)}${smoke(-34, -60)}${win(-28, -14)}
    <path d="M18 2h30l-6 6h-18z" fill="${C.ink}"/>${rect(28, 8, 8, 8, C.ink)}<circle cx="16" cy="-6" r="7" fill="#e07a2e" class="b-glow"/>`,
  kasarna: () => `${rect(-52, -30, 104, 44, C.stone)}${hip(-52, -30, 104, 20, C.roof2)}${[-42, -24, 12, 30].map((x) => win(x, -18)).join('')}${door(0, 14, 12, 18)}
    ${flag(-40, -50, C.roof)}${flag(40, -50, C.gold)}${Array.from({ length: 9 }, (_, i) => `<path d="M${-52 + i * 13} 26v-12l3 -4 3 4v12" fill="${C.wood}"/>`).join('')}`,
  hradby: () => `${rect(-56, -24, 40, 38, C.stone)}${rect(16, -24, 40, 38, C.stone)}${crenels(-56, -24, 40, 4, C.stone)}${crenels(16, -24, 40, 4, C.stone)}
    ${rect(-18, -54, 36, 68, C.stone2)}${crenels(-18, -54, 36, 4, C.stone2)}<path d="M-9 14v-20a9 9 0 0 1 18 0v20z" fill="${C.ink}"/><path d="M-9 -2h18M-9 6h18M-4 -12v26M4 -12v26" stroke="${C.stone2}" stroke-width="1.2"/>${win(-3, -40, 6, 10)}`,
  spital: () => `${house(-52, 14, 104, 36, 24, C.roof)}${[-42, -26, 18, 34].map((x) => win(x, -12)).join('')}${rect(-8, -72, 16, 14, C.stone)}${poly('-10,-72 0,-82 10,-72', C.slate)}
    <circle cx="0" cy="-36" r="9" fill="${C.wall2}" stroke="${C.ink}" stroke-width="1.5"/><path d="M0 -42v12M-6 -36h12" stroke="${C.roof}" stroke-width="3"/>`,
  radnice: () => `${rect(-52, -32, 104, 46, C.wall)}${hip(-52, -32, 104, 18, C.roof)}${[-44, -30, 22, 36].map((x) => `<path d="M${x} 14v-12a5 5 0 0 1 10 0v12z" fill="${C.wood2}"/>`).join('')}
    ${rect(-14, -82, 28, 96, C.stone)}${poly('-17,-82 0,-108 17,-82', C.slate)}<circle cx="0" cy="-64" r="8" fill="${C.wall}" stroke="${C.ink}" stroke-width="1.5"/><path d="M0 -64v-5M0 -64l4 2" stroke="${C.ink}" stroke-width="1.5"/>${door(0, 14, 12, 20)}${flag(0, -108, C.gold)}`,
  cech: () => [[-48, 34, C.wall], [-14, 30, C.wall2], [16, 34, C.wall]].map(([x, w, c], i) =>
    `${rect(x, -40 - i % 2 * 8, w, 54 + i % 2 * 8, c)}<path d="M${x} ${-40 - i % 2 * 8}h${w / 6}v-6h${w / 6}v-6h${w / 3}v6h${w / 6}v6h${w / 6}z" fill="${c}"/>${win(x + w / 2 - 3, -26 - i % 2 * 8)}${door(x + w / 2, 14)}`).join('')
    + `<path d="M50 -20h10M57 -20v5" stroke="${C.ink}" stroke-width="2"/><circle cx="57" cy="-8" r="7" fill="${C.gold}" stroke="${C.ink}" stroke-width="1.5"/>`,
  skola: () => `${house(-50, 14, 76, 44, 26, C.slate, C.stone)}${[-42, -28, 2].map((x) => win(x, -18)).join('')}${rect(26, -46, 24, 60, C.stone2)}${poly('23,-46 38,-70 53,-46', C.roof)}${cross(38, -70, 5)}
    <path d="M-28 -52l12 -4 12 4v10l-12 -4 -12 4z" fill="${C.wall}" stroke="${C.ink}" stroke-width="1.5"/><path d="M-16 -56v10" stroke="${C.ink}" stroke-width="1.2"/>`,
  katedrala: () => `${rect(-30, -44, 60, 58, C.stone)}${gable(-30, -44, 60, 28, C.slate)}<circle cx="0" cy="-22" r="11" fill="${C.water}" stroke="${C.ink}" stroke-width="2"/><path d="M0 -33v22M-11 -22h22" stroke="${C.ink}" stroke-width="1"/>
    ${[-56, 32].map((x) => `${rect(x, -84, 24, 98, C.stone2)}${poly(`${x - 3},-84 ${x + 12},-122 ${x + 27},-84`, C.slate)}${cross(x + 12, -122, 5)}${win(x + 9, -66, 6, 12)}${win(x + 9, -40, 6, 12)}`).join('')}${door(0, 14, 16, 26)}`,
  lodenice: () => `${rect(-56, 8, 112, 8, C.water)}<path d="M-50 10l10 -18h-6h86l-10 18z" fill="${C.wood}" stroke="${C.ink}" stroke-width="1.5"/>
    ${[-30, -10, 10, 30].map((x) => `<path d="M${x} -8v-26" stroke="${C.wood2}" stroke-width="2.5"/>`).join('')}<path d="M-36 -34h72" stroke="${C.wood2}" stroke-width="3"/>
    ${house(20, -8, 34, 0, 0)}${rect(28, -46, 30, 26, C.wall2)}${gable(28, -46, 30, 16, C.roof2)}`,
  sachta: () => `<path d="M-56 14q20 -70 56 -72q40 2 56 72z" fill="${C.stone2}"/><path d="M-18 14v-36h36v36" fill="${C.ink}"/><path d="M-22 -22h44M-18 -22v36M18 -22v36" stroke="${C.wood}" stroke-width="5"/>
    <path d="M24 2h22l-3 10h-16z" fill="${C.wood2}"/><circle cx="30" cy="13" r="3" fill="${C.ink}"/><circle cx="40" cy="13" r="3" fill="${C.ink}"/><circle cx="34" cy="0" r="5" fill="${C.slate}"/><path d="M-60 14h120" stroke="${C.wood2}" stroke-width="2"/>`,
  lovci: () => `${pine(-44, 14, 1.4)}${pine(46, 14, 1.2)}${rect(-30, -24, 60, 38, C.wood)}${[-18, -10, -2, 6].map((y) => `<path d="M-30 ${y}h60" stroke="${C.wood2}" stroke-width="1.5"/>`).join('')}${gable(-30, -24, 60, 24, C.roof2)}${door(0, 14)}
    <path d="M-10 -36q-6 -8 -12 -6M-10 -36q-2 -10 -8 -14M10 -36q6 -8 12 -6M10 -36q2 -10 8 -14M-10 -36h20" stroke="${C.wall}" stroke-width="2.2" fill="none"/>`,
  // the farm
  // Skladiště (warehouse in a town): a long low storehouse, big double door, crates and barrels outside
  sklad: () => `${rect(-52, -26, 104, 40, C.stone)}${hip(-52, -26, 104, 22, C.roof2)}${win(-42, -14)}${win(34, -14)}
    <path d="M-14 14v-24h28v24" fill="${C.wood2}" stroke="${C.ink}" stroke-width="1.5"/><path d="M0 -10v24M-14 -2h28" stroke="${C.wood}" stroke-width="2"/>
    ${rect(30, 4, 14, 10, C.wood)}${rect(36, -4, 10, 8, C.wood2)}<ellipse cx="-34" cy="9" rx="6" ry="5" fill="${C.wood}" stroke="${C.ink}" stroke-width="1.2"/><ellipse cx="-24" cy="10" rx="5" ry="4.5" fill="${C.wood2}" stroke="${C.ink}" stroke-width="1.2"/>`,
  // Kolna na vozy (farm): an open-fronted cart shed with a wagon under the roof
  kolna: () => `${rect(-44, -28, 4, 42, C.wood2)}${rect(40, -28, 4, 42, C.wood2)}${rect(-44, -30, 88, 6, C.wood)}${gable(-46, -30, 92, 20, '#a08550')}
    ${rect(-30, -4, 60, 10, C.wood)}<circle cx="-18" cy="10" r="8" fill="none" stroke="${C.wood2}" stroke-width="3"/><circle cx="18" cy="10" r="8" fill="none" stroke="${C.wood2}" stroke-width="3"/>
    <path d="M-18 10h0M18 10h0M-30 -4v-10h60v10" stroke="${C.wood2}" stroke-width="2" fill="none"/>${[-18, -6, 6, 18].map((x) => `<ellipse cx="${x}" cy="-9" rx="6" ry="5" fill="${C.gold}" stroke="${C.ink}" stroke-width="1"/>`).join('')}`,
  stodola: () => `${rect(-44, -36, 88, 50, C.wood)}${[-30, -14, 2, 18, 34].map((x) => `<path d="M${x} -36v50" stroke="${C.wood2}" stroke-width="1.5"/>`).join('')}${gable(-44, -36, 88, 34, '#a08550')}
    <path d="M-14 14v-28h28v28" fill="${C.wood2}" stroke="${C.ink}" stroke-width="1.5"/><path d="M-14 -14l28 28M14 -14l-28 28" stroke="${C.wood}" stroke-width="2"/>`,
  chlev: () => `${rect(-46, -18, 70, 32, C.wall2)}${hip(-46, -18, 70, 18, '#a08550')}${win(-36, -10)}${win(-14, -10)}${door(12, 14)}
    ${[28, 38, 48].map((x) => `<path d="M${x} 14v-18" stroke="${C.wood2}" stroke-width="2.5"/>`).join('')}<path d="M26 -2h26M26 6h26" stroke="${C.wood}" stroke-width="2.5"/>
    <ellipse cx="-4" cy="22" rx="12" ry="6" fill="${C.wall}" stroke="${C.ink}" stroke-width="1.2"/><circle cx="-16" cy="19" r="4" fill="${C.wall}" stroke="${C.ink}" stroke-width="1.2"/>`,
  vcelin: () => `${rect(-46, -14, 40, 28, C.wood)}${gable(-46, -14, 40, 16, C.roof2)}${[[14, 0], [34, 0], [24, -22]].map(([x, y]) => `<path d="M${x - 9} ${y + 12}q0 -24 9 -24q9 0 9 24z" fill="${C.gold}" stroke="${C.ink}" stroke-width="1.3"/><path d="M${x - 8} ${y + 2}h16M${x - 6} ${y - 5}h12" stroke="${C.wood2}" stroke-width="1"/>`).join('')}
    <circle class="b-bee" cx="0" cy="-34" r="2" fill="${C.ink}"/><circle class="b-bee" cx="10" cy="-44" r="2" fill="${C.ink}"/>`,
  sad: () => `${tree(-36, 6, 16)}${tree(0, -6, 18)}${tree(36, 6, 16)}${[[-40, 0], [-30, 8], [-4, -14], [6, -4], [32, 2], [42, 8]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="${C.roof}"/>`).join('')}`,
  kaplicka: () => `${rect(-8, -40, 16, 54, C.stone)}${poly('-14,-40 0,-56 14,-40', C.roof2)}${cross(0, -56, 5)}<path d="M-5 -32h10v12h-10z" fill="${C.water}"/>${tree(-34, 6, 12)}${tree(34, 6, 12)}`,
  dilna: () => `${house(-50, 14, 66, 36, 22, C.roof2)}${win(-40, -12)}${win(-2, -12)}${rect(22, -2, 30, 6, C.wood)}<path d="M26 4v10M48 4v10" stroke="${C.wood2}" stroke-width="3"/>
    <path d="M28 -14l18 -6" stroke="${C.slate}" stroke-width="3"/><path d="M28 -14l-4 2" stroke="${C.wood2}" stroke-width="4"/>`,
  celednik: () => `${house(-46, 14, 92, 34, 24, '#a08550')}${[-36, -20, 14, 30].map((x) => win(x, -12)).join('')}${rect(24, -52, 9, 16, C.stone2)}${smoke(28, -58)}`,
  rybnik: () => `<ellipse cx="0" cy="0" rx="54" ry="22" fill="${C.water}" stroke="${C.wood2}" stroke-width="2"/><path d="M-30 -2q8 -4 16 0M8 6q8 -4 16 0" stroke="#c9d6da" stroke-width="2" fill="none"/>
    ${[-50, -44, 46, 52].map((x) => `<path d="M${x} 6v-18" stroke="${C.green}" stroke-width="2"/>`).join('')}<path class="b-fish" d="M-6 -6q6 -5 12 0q-6 5 -12 0l-4 -3v6z" fill="${C.gold}"/>`,
  // a water mill on the brook: a cottage and a turning wheel
  mlynek: () => `<path d="M-58 14q20 -6 40 0t40 0" stroke="${C.water}" stroke-width="8" fill="none"/>${house(-46, 10, 60, 40, 26, C.roof2)}${win(-36, -16)}${win(-4, -16)}${rect(-10, -64, 9, 16, C.stone2)}
    <g><animateTransform attributeName="transform" type="rotate" from="0 34 -12" to="360 34 -12" dur="9s" repeatCount="indefinite"/><circle cx="34" cy="-12" r="22" fill="none" stroke="${C.wood2}" stroke-width="3"/>
    ${[0, 45, 90, 135].map((a) => `<path d="M34 -34v44" stroke="${C.wood}" stroke-width="2.5" transform="rotate(${a} 34 -12)"/>`).join('')}</g><circle cx="34" cy="-12" r="4" fill="${C.ink}"/>`,
  staj: () => `${rect(-52, -22, 104, 36, C.wood)}${hip(-52, -22, 104, 18, C.roof2)}${[-40, -12, 16].map((x) => `${rect(x, -14, 22, 28, C.wood2)}<path d="M${x} 0h22" stroke="${C.wood}" stroke-width="2"/>`).join('')}
    <path d="M-34 -10q2 -10 9 -12l3 4q-3 2 -4 8z" fill="#7a5232" stroke="${C.ink}" stroke-width="1"/><path d="M42 14v-22h10" stroke="${C.wood2}" stroke-width="2.5" fill="none"/>`,
  chlivek: () => `${rect(-44, -14, 50, 28, C.stone)}${gable(-44, -14, 50, 16, '#a08550')}${door(-19, 14, 10, 14)}<path d="M10 14v-14M24 14v-14M38 14v-14M10 2h28M10 9h28" stroke="${C.wood2}" stroke-width="2.2"/>
    <g transform="translate(25 20) scale(.8)">${beast('pigs')}</g>`,
};

// ---------- farm animals and grain (farm.js), drawn about 60 × 36 around 0,0 ----------

/** The farm icon of an animal, a sack of grain or of flour (also drawn in the trade panel). */
export const farmIcon = (key) => beast(key);

function beast(key) {
  if (key === 'cows') {
    return `${[-11, -5, 8, 13].map((x) => `<path d="M${x} 6v10" stroke="${C.ink}" stroke-width="2.6"/>`).join('')}
      <path d="M-17 -2q-6 4 -4 11" stroke="${C.ink}" stroke-width="1.5" fill="none"/><ellipse cx="0" cy="0" rx="17" ry="9" fill="#f1ead8" stroke="${C.ink}" stroke-width="1.2"/>
      <path d="M-7 -8q5 3 1 9q-6 -2 -1 -9zM5 -3q6 1 4 7q-6 0 -4 -7z" fill="${C.ink}"/>
      <path d="M15 -5q9 -4 12 2q1 7 -6 7q-5 -1 -6 -5z" fill="#f1ead8" stroke="${C.ink}" stroke-width="1.2"/><ellipse cx="25" cy="3" rx="3.2" ry="2.4" fill="#d9a59a"/><path d="M18 -6l-3 -5M24 -6l3 -5" stroke="${C.ink}" stroke-width="1.5"/>`;
  }
  if (key === 'horses') {
    return `${[-11, -5, 8, 13].map((x) => `<path d="M${x} 5v12" stroke="#4d3220" stroke-width="2.6"/>`).join('')}
      <path d="M-16 -3q-9 2 -8 14" stroke="#3a2416" stroke-width="3" fill="none"/><ellipse cx="0" cy="0" rx="16" ry="8" fill="#7a5232" stroke="${C.ink}" stroke-width="1.2"/>
      <path d="M10 -4l6 -14q4 -4 10 -1l3 6q-1 3 -5 2l-4 -1l-3 10z" fill="#7a5232" stroke="${C.ink}" stroke-width="1.2"/><path d="M11 -6l5 -13" stroke="#3a2416" stroke-width="3"/><circle cx="23" cy="-15" r="1.2" fill="${C.ink}"/>`;
  }
  if (key === 'pigs') {
    return `${[-8, -3, 5, 9].map((x) => `<path d="M${x} 5v6" stroke="${C.ink}" stroke-width="2.4"/>`).join('')}
      <path d="M-13 -2q-6 -3 -4 -6q3 -1 2 3" stroke="${C.ink}" stroke-width="1.3" fill="none"/><ellipse cx="0" cy="0" rx="13" ry="8.5" fill="#e7a99a" stroke="${C.ink}" stroke-width="1.2"/>
      <ellipse cx="14" cy="1" rx="3.4" ry="4" fill="#d98c7c" stroke="${C.ink}" stroke-width="1.1"/><path d="M6 -7l3 -6l3 5z" fill="#d98c7c" stroke="${C.ink}" stroke-width="1"/><circle cx="9" cy="-2" r="1.1" fill="${C.ink}"/>`;
  }
  // a sack of grain, or of flour (whiter)
  return `<path d="M-10 14q-6 -4 -5 -14q1 -10 8 -14l-2 -4h18l-2 4q7 4 8 14q1 10 -5 14z" fill="${key === 'flour' ? '#f1ead8' : '#d8c08a'}" stroke="${C.ink}" stroke-width="1.2"/><path d="M-8 -14h16" stroke="${C.wood2}" stroke-width="2.5"/>
    <path d="M-4 0l4 4l4 -4M0 -4v10" stroke="#a08550" stroke-width="1.4" fill="none"/>`;
}

/** The animals in their pens and the sacks by the door; the pens stand where the layout puts them (town_layouts.js, grunt). */
function farmYard(state, c) {
  const f = ensureFarm(state);
  if (!f) return '';
  const lay = c.lay;
  const parts = [];
  const sc = c.backdrop ? 0.56 : 0.62;
  const row = (rc, n, key, size, i0 = 0) => {
    const [x0, y0, x1, y1] = rc;
    const step = Math.min(size * 56, (x1 - x0 - 36) / Math.max(1, n));
    return Array.from({ length: n }, (_, i) => {
      const k = Array.isArray(key) ? key[i] : key;
      const flip = (i + i0) % 2 ? -1 : 1;
      return `<g class="tp-beast" style="--bd:${-(i * 0.7).toFixed(1)}s" transform="translate(${(x0 + 26 + i * step).toFixed(1)} ${(y0 + (y1 - y0) * 0.66 + ((i + i0) % 2) * 5).toFixed(1)}) scale(${flip * size} ${size})">${beast(k)}</g>`;
    }).join('');
  };
  const big = [...Array(Math.min(f.cows, 4)).fill('cows'), ...Array(Math.min(f.horses, 4)).fill('horses')];
  if (lay.paddock && (big.length || roomFor(state, 'cows') || roomFor(state, 'horses'))) {
    parts.push(row(lay.paddock, big.length, big, sc));
  }
  if (lay.sty && (f.pigs || roomFor(state, 'pigs'))) {
    parts.push(row(lay.sty, Math.min(f.pigs, 5), 'pigs', sc * 0.97, 1));
  }
  // a few sacks by the house door once there is grain
  const [sx, sy] = lay.sacks;
  for (let i = 0; i < Math.min(countOf(state, 'grain'), 5); i++) parts.push(`<g transform="translate(${(sx + (i % 3) * 13).toFixed(1)} ${(sy - Math.floor(i / 3) * 12).toFixed(1)}) scale(.46)">${beast('grain')}</g>`);
  return `<g class="tp-yard">${parts.join('')}</g>`;
}

function scaffold() {
  return `<g class="b-scaffold">${rect(-40, -10, 80, 24, C.stone2)}${crenels(-40, -10, 80, 6, C.stone2)}
    <path d="M-44 14v-62M44 14v-62M-44 -24h88M-44 -48h88M-44 -24l20 -24M24 -24l20 -24" stroke="${C.wood}" stroke-width="3" fill="none"/>
    <path d="M-6 14v-86M-6 -72h44M34 -72v18" stroke="${C.wood2}" stroke-width="3" fill="none"/>${rect(28, -54, 12, 8, C.stone)}</g>`;
}

// ---------- plots ----------

/** How wide a plaque has to be for a text (an estimate; fitPlaques() measures the real text once it is on the page). */
const plaqueW = (text, em = 12.5) => Math.round(text.length * em * 0.66 + 16);

function plaque(text, y, cls = '') {
  const w = plaqueW(text);
  return `<g class="plot-label ${cls}" transform="translate(0 ${y.toFixed(1)})"><g class="pl-in"><rect class="pl-bg" x="${-w / 2}" y="-9.5" width="${w}" height="19" rx="9.5"/><text class="pl-text" y="4">${esc(text)}</text></g></g>`;
}

/** One plot: a clearing with a building cut out of its painting (or a drawn icon, or a building site) standing in it. */
function plotMarkup(state, id, town, slot, selectedSlot, c, tags) {
  const [x, y, wu, freeLawn] = c.lay.feet[slot];
  const target = wu * c.lay.grow; // width of a painted cut-out (its ground patch included)
  const iconW = target * 0.74;    // width of a drawn building: about the clearing
  const open = slot < slotCount(id, town.level);
  const b = town.buildings.find((q) => q.slot === slot);
  const own = ownsTown(state, id);
  const sel = selectedSlot === slot ? ' selected' : '';
  const ringRx = iconW * 0.52, ringRy = iconW * 0.2;
  const ring = `<ellipse class="plot-ring" rx="${ringRx.toFixed(1)}" ry="${ringRy.toFixed(1)}" cy="2"/>`;
  // a plot on open lawn or beach (not on a painted clearing) gets a patch of trodden earth so it still reads as a plot
  const soil = freeLawn ? `<ellipse class="plot-soil" rx="${(iconW * 0.62).toFixed(1)}" ry="${(iconW * 0.24).toFixed(1)}" cy="2"/>` : '';
  const at = `transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"`;
  const hitW = Math.max(iconW * 0.58, 40);
  const lbl = wu * 0.2 + 8;
  if (!open) {
    return `<g class="plot locked" ${at}><title>s vyšší úrovní</title>${soil}${ring}<g class="plot-lock" transform="translate(0 -2)"><rect x="-6" y="-2" width="12" height="9" rx="2"/><path d="M-3.4 -2v-3.4a3.4 3.4 0 0 1 6.8 0v3.4"/></g></g>`;
  }
  if (!b && !own) {
    return `<g class="plot empty foreign" ${at}>${soil}${ring}<g class="plot-plus"><circle r="9"/><path d="M-4.5 0h9M0 -4.5v9"/></g></g>`;
  }
  if (!b) {
    return `<g class="plot empty${sel}" data-town-slot="${slot}" ${at} tabindex="0" role="button" aria-label="Volná parcela">
      <rect class="plot-hit" x="${-hitW}" y="${-hitW * 0.5}" width="${hitW * 2}" height="${hitW * 0.9}"/>${soil}${ring}
      <title>Volná parcela</title><g class="plot-plus"><circle r="11"/><path d="M-5.5 0h11M0 -5.5v11"/></g></g>`;
  }
  const def = buildingDef(b.key);
  const cut = paintedOnScene(b.key) ? CUTOUTS[b.key] : null;
  const k = !b.ready ? buildProgress(state, b.start, b.done) : 1;
  let art, topY, pad = '';
  if (cut) {
    const s = target / 500;
    const w = cut.w * s, h = cut.h * s, ax = -cut.fx * s, ay = -cut.fy * s;
    topY = ay;
    const img = (extra = '') => `<image class="b-art${extra}" href="assets/buildings/${b.key}.webp" x="${ax.toFixed(1)}" y="${ay.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" mask="url(#tw-patch)"/>`;
    if (b.ready) art = img();
    else {
      // the site: the future building as a ghost, rising out of the ground as the work goes on, with scaffolding around it
      const cy = ay + h * (1 - k);
      art = `${img(' ghost')}<clipPath id="rv-${slot}"><rect x="${ax.toFixed(1)}" y="${cy.toFixed(1)}" width="${w.toFixed(1)}" height="${(h * k + 4).toFixed(1)}"/></clipPath><g clip-path="url(#rv-${slot})">${img()}</g>
        <g class="b-site" transform="translate(0 ${(-h * 0.1).toFixed(1)}) scale(${(w / 100).toFixed(2)})">${scaffold()}</g>`;
    }
  } else {
    // a drawn building: scaled to the clearing (and so to the perspective of its row); tall ones are kept from towering over it
    const hh = ICON_H[b.key] || 84;
    const is = Math.min(iconW / 108, (iconW * 0.95) / hh);
    topY = -hh * is;
    pad = `<ellipse class="b-pad" cx="${(iconW * 0.03).toFixed(1)}" cy="1" rx="${(iconW * 0.56).toFixed(1)}" ry="${(iconW * 0.17).toFixed(1)}"/>`;
    art = `<g class="b-icon${b.ready ? '' : ' site'}" transform="translate(0 ${(-9 * is).toFixed(1)}) scale(${is.toFixed(3)})">${b.ready ? (ICONS[b.key] || ICONS.stodola)() : scaffold()}</g>`;
  }
  const shadow = `<ellipse class="b-shadow" cx="${(iconW * 0.1).toFixed(1)}" cy="3" rx="${(iconW * 0.5).toFixed(1)}" ry="${(iconW * 0.12).toFixed(1)}"/>`;
  const progress = !b.ready ? `<g class="plot-progress" transform="translate(-28 ${(lbl + 7).toFixed(1)})"><rect width="56" height="5" rx="2.5"/><rect class="fill" width="${(56 * k).toFixed(0)}" height="5" rx="2.5"/></g>` : '';
  const top = Math.min(topY, -iconW * 0.3);
  const body = `<g class="plot built${b.ready ? '' : ' building'}${sel}" data-town-slot="${slot}" ${at} tabindex="0" role="button" aria-label="${esc(def.name)}">
    <rect class="plot-hit" x="${-hitW}" y="${(top - 4).toFixed(1)}" width="${hitW * 2}" height="${(-top + 4 + lbl * 0.6).toFixed(1)}"/>${soil}${ring}${pad}${shadow}${art}</g>`;
  // the plaque and the progress bar go on top of everything, so a building in front never hides the name of the one behind it
  tags.push(`<g class="plot-tag" data-town-slot="${slot}" ${at}>${plaque(def.name, lbl, b.ready ? '' : 'site')}${progress}</g>`);
  return body;
}

function buildProgress(state, start, done) {
  const total = Math.max(1, done - (start ?? done - 1));
  return Math.max(0.1, Math.min(1, (state.turn - (start ?? state.turn)) / total));
}

/**
 * Measures the plaque texts, sizes their backgrounds (the font is known only on the page) and moves a plaque
 * down when it would sit on its neighbour's, so names never overlap.
 */
export function fitPlaques(root) {
  const sc = root.querySelector('.town-scene');
  const k = sc && sc.clientHeight && sc.clientWidth / sc.clientHeight < 1.1 ? 1.3 : 1; // plaques are drawn larger when the picture is dragged sideways
  const placed = [];
  const tags = [...root.querySelectorAll('.plot-tag')].map((g) => {
    const t = g.querySelector('.pl-text');
    const bg = g.querySelector('.pl-bg');
    if (t && bg) {
      const w = t.getComputedTextLength() + 18;
      if (w > 20) { bg.setAttribute('width', w.toFixed(1)); bg.setAttribute('x', (-w / 2).toFixed(1)); }
    }
    const m = /translate\(([-\d.]+)[ ,]+([-\d.]+)\)/.exec(g.getAttribute('transform') || '');
    const lab = g.querySelector('.plot-label');
    const ly = lab ? Number((/translate\(0 ([-\d.]+)\)/.exec(lab.getAttribute('transform')) || [0, 0])[1]) : 0;
    return { lab, x: m ? Number(m[1]) : 0, y: m ? Number(m[2]) : 0, ly, w: (bg ? Number(bg.getAttribute('width')) : 60) * k };
  }).sort((a, b) => a.y - b.y || a.x - b.x);
  for (const t of tags) {
    let dy = 0;
    for (let tries = 0; tries < 4; tries++) {
      const top = t.y + t.ly + dy - 11 * k, bot = top + 22 * k;
      const hit = placed.find((p) => Math.abs(p.x - t.x) < (p.w + t.w) / 2 + 3 && p.top < bot && p.bot > top);
      if (!hit) break;
      dy += hit.bot - top + 2;
    }
    if (dy && t.lab) t.lab.setAttribute('transform', `translate(0 ${(t.ly + dy).toFixed(1)})`);
    const top = t.y + t.ly + dy - 11 * k;
    placed.push({ x: t.x, w: t.w, top, bot: top + 22 * k });
  }
}

/** The part of the picture the plots occupy, as fractions u0, u1, v0, v1 (with room for the buildings and their names). */
function bbox(c, total) {
  const f = c.lay.feet.slice(0, total);
  const half = (p) => p[2] * c.lay.grow * 0.42;
  const u0 = Math.min(...f.map((p) => p[0] - half(p))) / c.lay.W, u1 = Math.max(...f.map((p) => p[0] + half(p))) / c.lay.W;
  const v0 = Math.min(...f.map((p) => p[1] - p[2] * 0.7)) / c.lay.H, v1 = Math.max(...f.map((p) => p[1] + p[2] * 0.3)) / c.lay.H;
  return [u0, u1, v0, v1].map((n) => n.toFixed(3)).join(',');
}

let sceneWatch = null;

/**
 * Crops the picture to the shape of the stage (like "cover") but keeps the plots in view: the visible window is moved
 * to the middle of the plot area. On a stage much narrower than the picture (a phone) nothing is cropped; the picture
 * is as tall as the stage and can be dragged sideways (CSS), starting from the middle of the plots.
 */
export function fitScene(stage) {
  const sc = stage.querySelector('.town-scene');
  if (!sc) return;
  const apply = () => {
    const W = Number(sc.dataset.w), H = Number(sc.dataset.h);
    const cw = sc.clientWidth, ch = sc.clientHeight;
    if (!cw || !ch) return;
    const A = cw / ch;
    const [u0, u1, v0, v1] = sc.dataset.bbox.split(',').map(Number);
    let box = [0, 0, W, H];
    if (A >= 1.1) {
      // never narrower than the plot area: a stage too narrow for it shows a little more than the picture (the glow fills the rim)
      const need = (u1 - u0) * W;
      const vw = A < W / H ? Math.min(W, Math.max(H * A, need)) : W;
      const vh = A < W / H ? vw / A : W / A;
      const x = Math.max(0, Math.min(W - vw, ((u0 + u1) / 2) * W - vw / 2));
      const y = vh >= H ? (H - vh) / 2 : Math.max(0, Math.min(H - vh, ((v0 + v1) / 2) * H - vh / 2));
      box = [x, y, vw, vh];
    }
    for (const s of sc.querySelectorAll('svg.town-ground, svg.town-svg')) s.setAttribute('viewBox', box.map((n) => n.toFixed(1)).join(' '));
    const scroll = sc.querySelector('.town-scroll');
    if (A < 1.1 && scroll && !sc.dataset.panned) {
      scroll.scrollLeft = Math.max(0, ((u0 + u1) / 2) * scroll.scrollWidth - scroll.clientWidth / 2);
      sc.dataset.panned = '1';
    }
  };
  apply();
  if (sceneWatch) sceneWatch.disconnect();
  if (typeof ResizeObserver === 'function') { sceneWatch = new ResizeObserver(apply); sceneWatch.observe(sc); }
}

const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The town plan (SVG) shown in place of the map. */
export function renderTownPlan(state, id, selectedSlot) {
  const def = settlementDef(id);
  const town = townOf(state, id);
  const total = isFarm(id) ? 7 : 10;
  const p = currentProject(town);
  const painted = TOWN_BACKDROPS.has(id);
  const slots = slotCount(id, town.level);
  const c = sceneContext({
    id, kind: def.kind, level: town.level, season: state.seasonIndex || 0, walls: readyBuildings(town).some((b) => b.key === 'hradby'),
    painted, reduced: reducedMotion(), open: [],
  });
  c.open = c.lay.feet.slice(0, Math.min(slots, total));
  const ground = groundMarkup(c);
  const houses = painted ? null : houseSmokers(c);
  const tags = [];
  const front = [
    ...centreItems(c),
    ...Array.from({ length: total }, (_, i) => ({ y: c.lay.feet[i][1] + 1, svg: plotMarkup(state, id, town, i, selectedSlot, c, tags) })),
  ].sort((a, b) => a.y - b.y).map((q) => q.svg).join('');
  const { W, H } = c.lay;
  return `
    <div class="town-scene season-${c.season} kind-${def.kind} ${painted ? 'painted' : 'drawn'}" style="--tw-w:${W};--tw-h:${H}" data-w="${W}" data-h="${H}" data-bbox="${bbox(c, total)}">
      <svg class="town-defs" width="0" height="0" aria-hidden="true" focusable="false">${defsMarkup(c)}</svg>
      ${painted ? `<div class="town-glow" style="background-image:url(assets/towns/${id}.jpg)"></div>` : ''}
      <div class="town-scroll"><div class="town-pan">
        <svg class="town-ground" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${ground}</svg>
        <svg class="town-svg kind-${def.kind}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(def.name)}">
          ${front}
          ${isFarm(id) ? farmYard(state, c) : ''}
          ${lifeMarkup(c, houses)}
          ${tags.join('')}
          ${p && p.type === 'upgrade' ? `<g class="tp-upgrade" transform="translate(${W / 2} 30)"><rect x="-150" y="-16" width="300" height="30" rx="15"/><text y="4">Rozšiřuje se na ${esc(levelName(id, p.to).toLowerCase())} · ${esc(eta(state, p.done))}</text></g>` : ''}
        </svg>
      </div></div>
      <div class="town-vignette"></div>
      <div class="town-wx" aria-hidden="true">${weatherMarkup(c)}</div>
    </div>
    <div class="town-bar">
      <button class="seal-button ghost light town-back" data-close-town>← Zpět na mapu</button>
      <div class="town-heading"><span class="panel-overline light">${esc(def.kindLabel)}</span><strong>${esc(def.name)}</strong></div>
      <span class="town-level">${esc(levelName(id, town.level))}<small>${'★'.repeat(town.level)}${'☆'.repeat(maxLevel(id) - town.level)}</small></span>
    </div>`;
}

// ---------- sidebar ----------

const SEASON_LOC = ['na jaře', 'v létě', 'na podzim', 'v zimě'];
function eta(state, turn) {
  const ahead = turn - state.turn;
  const year = state.year + Math.floor((state.seasonIndex + ahead) / 4);
  return `hotovo ${SEASON_LOC[turn % 4]} roku ${year}`;
}

const DRIFT_LABEL = { order: 'klid v kraji', loyalty: 'věrnost kraje' };
const PROV_LABEL = { wealth: 'bohatství kraje', garrison: 'posádka kraje', loyalty: 'věrnost kraje', unrest: 'nepokoje' };

function resName(state, key) {
  const def = RESOURCE_DEFS.find((d) => d.key === key);
  const label = def ? resourceLabel(def, state.scenario) : key;
  if (key === 'favor') return state.scenario === 'sedlak' ? 'přízeň vrchnosti' : 'přízeň krále';
  return label.toLowerCase();
}

const sign = (v) => (v > 0 ? `+${v}` : `${v}`);
const chip = (text, good = true) => `<i class="${good ? 'pos' : 'neg'}">${esc(text)}</i>`;

function usable(state, key) {
  if (state.resources[key] === undefined) return false;
  return !(key === 'legitimacy' && state.scenario === 'slechtic');
}

function effectChips(state, b, key) {
  const out = worksChips(key).map((t) => chip(t)); // room and grain on the farm (farm.js)
  const season = b.seasons ? ` ${['na jaře', 'v létě', 'na podzim', 'v zimě'][b.seasons[0]]}` : ' / období';
  for (const [k, v] of Object.entries(b.income || {})) if (usable(state, k)) out.push(chip(`${resName(state, k)} ${sign(v)}${season}`, v > 0));
  for (const [k, v] of Object.entries(b.yearly || {})) if (usable(state, k)) out.push(chip(`${resName(state, k)} ${sign(v)} / rok`, v > 0));
  for (const [g, n] of Object.entries(b.stock || {})) out.push(chip(`${GOODS[g].name.toLowerCase()} +${n} vůz / rok`));
  if (b.warehouse) out.push(chip(`sklad +${b.warehouse} vozů od každého zboží`));
  for (const [k, v] of Object.entries(b.drift || {})) out.push(chip(`${DRIFT_LABEL[k]} +${v}`));
  for (const [k, v] of Object.entries(b.onProv || {})) out.push(chip(`${PROV_LABEL[k]} ${sign(v)} jednou`, k === 'unrest' ? v < 0 : v > 0));
  for (const [k, v] of Object.entries(b.onBuild || {})) if (usable(state, k)) out.push(chip(`${resName(state, k)} ${sign(v)} jednou`, v > 0));
  return out.join('');
}

// "12 zlata", "5 grošů", "5 jídla"
function costText(state, cost) {
  const peasant = state.scenario === 'sedlak';
  const gen = { gold: peasant ? 'grošů' : 'zlata', food: peasant ? 'zásob' : 'jídla' };
  return Object.entries(cost).map(([k, v]) => `${v} ${gen[k] || resName(state, k)}`).join(' + ');
}

function ownerNote(state, id) {
  if (isFarm(id)) return '';
  if (state.scenario === 'sedlak') return 'Sedlák staví jen na vlastním gruntu. Tady se můžeš jen dívat.';
  const prov = state.provinces.find((x) => x.id === settlementDef(id).province);
  if (prov.lost) return 'Kraj je ztracen. Dokud ho nezískáš zpět, nic tu nepostavíš a stavby ti nic nedávají.';
  if (prov.owner === 'crown') return `Leží v korunní zemi krále ${state.king ? state.king.name : ''}. Stavět tu může jen koruna.`;
  const house = NOBLE_HOUSES.find((h) => h.id === prov.owner);
  return house ? `Drží ho ${house.name}. Stavět tu můžou jen oni.` : '';
}

function yieldSummary(state, id) {
  const y = townYield(state, id);
  const rows = [
    ...Object.entries(y.income).filter(([k, v]) => v && usable(state, k)).map(([k, v]) => chip(`${resName(state, k)} ${sign(v)} / období`, v > 0)),
    ...Object.entries(y.yearly).filter(([k, v]) => v && usable(state, k)).map(([k, v]) => chip(`${resName(state, k)} ${sign(v)} / rok`, v > 0)),
    ...Object.entries(y.stock).map(([g, n]) => chip(`${GOODS[g].name.toLowerCase()} +${n} / rok`)),
    ...(y.warehouse ? [chip(`sklad +${y.warehouse} vozů od každého zboží`)] : []),
    ...Object.entries(y.drift).filter(([, v]) => v).map(([k, v]) => chip(`${DRIFT_LABEL[k]} +${v}`)),
    // the farm's own works: room for animals, the mill, the barn (farm.js) are not income lines
    ...(isFarm(id) ? [...new Set((townOf(state, id).buildings || []).filter((b) => b.ready && !b.base).flatMap((b) => worksChips(b.key)))].map((t) => chip(t)) : []),
  ];
  return rows.length ? `<div class="build-chips">${rows.join('')}</div>` : '<p class="map-desc">Zatím tu nestojí nic, co by ti něco dávalo.</p>';
}

function projectBlock(state, id, town, own) {
  const p = currentProject(town);
  if (!p) {
    if (!own) return '';
    const free = crewLimit(state) - projectsRunning(state);
    return free > 0
      ? `<p class="map-decree-hint">${free === 1 ? 'Volná stavební huť: 1' : `Volné stavební hutě: ${free}`}. Klikni na volnou parcelu a vyber stavbu.</p>`
      : '<p class="map-warning">Všichni stavitelé teď pracují v jiných sídlech. Až dokončí, můžeš stavět i tady.</p>';
  }
  const what = p.type === 'upgrade' ? `Rozšíření na ${levelName(id, p.to).toLowerCase()}` : buildingDef(p.key).name;
  return `<div class="build-project"><span>Staví se</span><b>${esc(what)}</b><em>${esc(eta(state, p.done))}</em>
    ${own ? '<button class="trade-mini" data-cancel-project>Zastavit stavbu (vrátí se polovina)</button>' : ''}</div>`;
}

function upgradeBlock(state, id) {
  const info = upgradeInfo(state, id);
  if (!info) return `<h4 class="map-sub">Úroveň</h4><p class="map-desc">${esc(levelName(id, townOf(state, id).level))} — výš už to nejde.</p>`;
  const s = info.spec;
  const reqs = [`${s.need} hotové stavby`, s.requires ? buildingDef(s.requires).name.toLowerCase() : null, s.free ? 'svobodný stav' : null].filter(Boolean).join(', ');
  return `<h4 class="map-sub">Rozšířit na ${esc(info.name.toLowerCase())}</h4>
    <p class="map-desc">Víc parcel (${slotCount(id, info.to)} místo ${slotCount(id, info.to - 1)})${isFarm(id) ? ', grunt +5, pověst +3' : ', bohatství kraje +3, prestiž +1'}. Podmínky: ${esc(reqs)}.</p>
    <button class="decree build-upgrade" data-upgrade-town${info.block ? ' disabled' : ''}>
      <b>Rozšířit · ${esc(costText(state, s.cost))}</b><span>${s.turns} ${s.turns >= 5 ? 'období' : 'období'} práce</span>${info.block ? `<em class="build-why">${esc(info.block)}</em>` : ''}
    </button>`;
}

function catalogList(state, id, slot) {
  const town = townOf(state, id);
  const list = Object.entries(catalogFor(id)).filter(([key]) => !town.buildings.some((b) => b.key === key));
  if (!list.length) return '<p class="map-desc">Všechno, co se tu dá postavit, už stojí.</p>';
  // what can be built now first, then what is only blocked by money, then the rest
  const rank = (why) => (!why ? 0 : why === 'Na tohle nemáš.' ? 1 : /^(V tomhle|Stavitelé|Všechny)/.test(why) ? 2 : 3);
  return `<div class="decree-list build-list">${list
    .map(([key, b]) => [key, b, buildBlock(state, id, key)])
    .sort((a, b) => rank(a[2]) - rank(b[2]))
    .map(([key, b, why]) => `
      <button class="decree build-option" data-build="${key}" data-slot="${slot}"${why ? ' disabled' : ''}>
        <span class="build-thumb">${BUILDING_ART.has(key) ? `<img src="assets/buildings/${key}.jpg" alt="">` : `<svg viewBox="-64 -100 128 124">${(ICONS[key] || ICONS.stodola)()}</svg>`}</span>
        <span class="build-body"><b>${esc(b.name)} <small>${esc(costText(state, b.cost))} · ${b.turns} obd.</small></b>
        <span>${esc(b.text)}</span><em>${effectChips(state, b, key)}</em>${why ? `<em class="build-why">${esc(why)}</em>` : ''}</span>
      </button>`).join('')}</div>`;
}

function buildingDetail(state, id, b) {
  const def = buildingDef(b.key);
  const own = ownsTown(state, id);
  return `<div class="build-detail">
      ${BUILDING_ART.has(b.key) ? `<img class="build-art" src="assets/buildings/${b.key}.jpg" alt="">` : `<span class="build-thumb big"><svg viewBox="-64 -100 128 124">${(ICONS[b.key] || ICONS.stodola)()}</svg></span>`}
      <h4 class="map-sub">${esc(def.name)}${b.ready ? '' : ' <small>· ve stavbě</small>'}</h4>
      <p class="map-desc">${esc(def.text)}</p>
      ${b.base && isFarm(id) ? `<p class="map-decree-hint">Stojí tu odjakživa. Úroda je dávno započtená v hospodaření gruntu, ale do téhle stavby se ukládají vozy obilí.</p><div class="build-chips">${worksChips(b.key).map((t) => chip(t)).join('')}</div>` : ''}
      ${b.base && !isFarm(id) ? '<p class="map-decree-hint">Stojí tu odjakživa. Co dává, už je dávno započtené v příjmech kraje — přínos navíc mají jen stavby, které postavíš ty.</p>' : ''}
      ${b.base ? '' : `<div class="build-chips">${effectChips(state, def, b.key)}</div>`}
      ${b.ready ? '' : `<p class="map-decree-hint">${esc(eta(state, b.done))}</p>`}
      ${own && b.ready ? `<button class="trade-mini build-demolish" data-demolish="${b.slot}">Strhnout a uvolnit parcelu</button>` : ''}
      ${own && !b.ready ? '<button class="trade-mini" data-cancel-project>Zastavit stavbu (vrátí se polovina)</button>' : ''}
    </div>`;
}

// ---------- the farm stock (hospodářství, farm.js) ----------

const coinWord = (n) => `${n} ${plural(n, ['groš', 'groše', 'grošů'])}`;
const wagonWord = (n) => `${n} ${plural(n, STOCK.grain.forms)}`;

function stockCard(state, key, f, line) {
  const s = STOCK[key];
  const n = countOf(state, key);
  const room = roomFor(state, key);
  const wagons = !!s.trade;
  const hasMill = state.towns.grunt.buildings.some((b) => b.key === 'mlynek' && b.ready);
  const missing = key === 'flour' ? !n && !hasMill : !wagons && !room && !n; // no building for it yet
  const gauge = wagons
    ? `<span class="farm-bar"><i style="width:${room ? Math.min(100, Math.round((n / room) * 100)) : 0}%"></i></span>`
    : `<span class="farm-pips">${Array.from({ length: Math.max(room, n) }, (_, i) => `<i class="${i < n ? 'on' : ''}${i >= room ? ' over' : ''}"></i>`).join('')}</span>`;
  const none = key === 'flour' ? 'Mouka potřebuje mlýn.' : s.none;
  const count = missing ? `<small>${esc(none)}</small>` : `<small><b>${n}</b> / ${room}${wagons ? ` ${plural(room, s.forms)}` : ''}</small>`;
  let buttons;
  if (wagons) {
    const sell = sellBlock(state, key);
    const eat = eatBlock(state, key);
    buttons = `<button class="trade-mini" data-farm-sell="${key}"${sell ? ` disabled title="${esc(sell)}"` : ''}>Prodat vůz v Brodu (+${coinWord(sellPrice(state, key))})</button>
      <button class="trade-mini" data-farm-grind="${key}"${eat ? ` disabled title="${esc(eat)}"` : ''}>${key === 'flour' ? 'Upéct chleba' : 'Semlít pro domácnost'} (zásoby +${eatFood(state, key)})</button>`;
  } else {
    const buy = buyBlock(state, key);
    const sell = sellBlock(state, key);
    buttons = `<button class="trade-mini" data-farm-buy="${key}"${buy ? ` disabled title="${esc(buy)}"` : ''}>Koupit (${coinWord(s.buy)})</button>
      <button class="trade-mini" data-farm-sell="${key}"${sell ? ` disabled title="${esc(sell)}"` : ''}>Prodat (${coinWord(s.sell)})</button>`;
  }
  const over = !wagons && n > room ? `<em class="farm-warn">${key === 'horses' ? 'Kůň zatím stojí v přístřešku u chalupy, dokud nebude stáj.' : 'Víc, než se vejde pod střechu.'}</em>` : '';
  return `<div class="farm-item${missing ? ' missing' : ''}">
      <span class="farm-ico"><svg viewBox="-30 -24 62 44">${beast(key)}</svg></span>
      <div class="farm-main">
        <b>${esc(s.name)} ${count}</b>
        ${missing ? '' : gauge}
        <em>${esc(line)}</em>${over}
        ${missing ? '' : `<span class="farm-trade">${buttons}</span>`}
      </div>
    </div>`;
}

/** Where a good sells best, as a short phrase with the price (the home market when nothing is better). */
function bestLine(state, good) {
  const b = bestMarket(state, good);
  if (!b) return 'nemá se kam prodat';
  const m = MARKETS[b.dest];
  const tr = trendOf(state, b.dest, good);
  const home = price(state, 'brod', good);
  const road = m.home ? 'prodej hned' : `cesta ${m.days} ${m.days === 1 ? 'období' : 'období'}, riziko ${Math.round(riskOf(state, b.dest, false) * 100)} %`;
  return `${esc(m.short)} <b>${b.price}</b> za vůz (${road}${tr.cls === 'flat' ? '' : `, ${tr.arrow} ${tr.pct > 0 ? '+' : ''}${tr.pct} %`})${m.home ? '' : `, v Brodu ${home}`}`;
}

/** "Od pole k trhu": harvest, barn, mill, flour and where it sells, one line each, with the buttons. */
function chainBlock(state) {
  const c = farmChain(state);
  if (!c) return '';
  const mill = millBlock(state);
  const flourSell = sellBlock(state, 'flour');
  const grainFree = c.grain - c.reserved;
  const harvest = [`na podzim ${wagonWord(c.harvest.autumn)} a občas další vůz (když je v komoře aspoň 20 zásob)`];
  if (c.harvest.horsesSpring) harvest.push(`koně: +${c.harvest.horsesSpring} na jaře a +${c.harvest.horsesAutumn} na podzim`);
  const step = (n, name, text) => `<li><span class="fc-name"><i>${n}</i> ${name}</span><span class="fc-text">${text}</span></li>`;
  const steps = [
    step('1', 'Žně', esc(`${harvest.join('; ')}.`)),
    step('2', 'Stodola', `<b>${c.grain}</b> / ${c.room} ${plural(c.room, STOCK.grain.forms)} obilí${c.grain >= c.room ? ' — plná, přebytek zplesniví' : ''}${c.reserved ? ` · ${wagonWord(c.reserved)} slíbeno zakázce` : ''}`),
    step('3', 'Mlýn', c.mill
      ? `semele ${wagonWord(c.mill)} obilí za období na mouku, mlynářova mírka: zásoby +1 z vozu`
      : 'chybí. Bez něj se obilí prodává syrové, nebo se semele ručně na zásoby'),
    step('4', 'Mouka', `<b>${c.flour}</b> ${plural(c.flour, STOCK.grain.forms)} · Brod ${price(state, 'brod', 'flour')}, pán ${price(state, 'manor', 'flour')}`),
    step('5', 'Prodej', `mouka: ${bestLine(state, 'flour')}<br>obilí: ${bestLine(state, 'grain')}`),
  ];
  return `<h4 class="map-sub">Od pole k trhu</h4>
    <ol class="farm-chain">${steps.join('')}</ol>
    <div class="farm-chain-btns">
      <button class="trade-mini" data-farm-mill${mill ? ` disabled title="${esc(mill)}"` : ''}>Semlít vůz na mouku</button>
      <button class="trade-mini" data-farm-sell-all="flour"${flourSell ? ` disabled title="${esc(flourSell)}"` : ''}>Prodat mouku v Brodu</button>
      <button class="trade-mini" data-farm-sell-all="grain"${grainFree > 0 ? '' : ' disabled title="Nemáš co prodat."'}>Prodat obilí v Brodu</button>
      <button class="trade-mini" data-open-trade>Obchod na mapě →</button>
    </div>`;
}

function farmBlock(state) {
  const f = ensureFarm(state);
  if (!f) return '';
  const look = farmOutlook(state);
  return `${chainBlock(state)}
    <h4 class="map-sub">Hospodářství</h4>
    <div class="farm-stock">${['grain', 'flour', ...ANIMALS].map((k) => stockCard(state, k, f, look[k])).join('')}</div>`;
}

/** Sidebar of the town view; with a plot selected it shows what can stand there. */
export function townSidebar(state, id, slot) {
  const def = settlementDef(id);
  const town = townOf(state, id);
  const own = ownsTown(state, id);
  const coin = state.scenario === 'sedlak' ? 'grošů' : 'zlata';
  const head = `
    ${TOWN_ART.has(def.kind) ? `<img class="town-art" src="assets/towns/${def.kind}.jpg" alt="">` : ''}
    <span class="panel-overline">${esc(def.kindLabel)}</span>
    <h3 class="panel-title">${esc(def.name)}</h3>
    <span class="map-verdict ${own ? 'good' : 'warn'}">${esc(levelName(id, town.level))} · parcely ${town.buildings.length}/${slotCount(id, town.level)}</span>`;
  const purse = `<p class="map-desc trade-coin">V pokladně: <b>${state.resources.gold}</b> ${coin}</p>`;

  if (slot !== null && slot !== undefined) {
    const b = town.buildings.find((x) => x.slot === slot);
    if (b) return `${head}${buildingDetail(state, id, b)}<button class="map-back" data-town-slot-clear>← ${esc(def.name)}</button>`;
    return `${head}
      <h4 class="map-sub">Co postavit na parcele</h4>
      ${currentProject(town) ? '<p class="map-warning">V tomhle sídle se už staví. Další stavbu můžeš začít, až bude ta současná hotová.</p>' : ''}
      ${catalogList(state, id, slot)}
      ${purse}
      <button class="map-back" data-town-slot-clear>← ${esc(def.name)}</button>`;
  }

  const ready = readyBuildings(town);
  return `${head}
    <p class="map-desc">${esc(def.text)}</p>
    ${own ? '' : `<p class="map-warning">${esc(ownerNote(state, id))}</p>`}
    ${projectBlock(state, id, town, own)}
    ${own && isFarm(id) ? farmBlock(state) : ''}
    <h4 class="map-sub">Stavby <small>· ${ready.length}</small></h4>
    ${ready.length ? `<div class="map-chip-list">${ready.map((b) => `<button class="map-chip" data-town-slot="${b.slot}"><span>${esc(buildingDef(b.key).name)}</span><em class="${b.base ? '' : 'good'}">${b.base ? 'původní' : 'tvoje'}</em></button>`).join('')}</div>` : '<p class="map-desc">Zatím tu nic nestojí.</p>'}
    ${own ? `<h4 class="map-sub">Co ti dávají tvé stavby</h4>${yieldSummary(state, id)}` : ''}
    ${own ? upgradeBlock(state, id) : ''}
    ${own ? purse : ''}
    <button class="map-back" data-close-town>← Zpět na mapu</button>`;
}
