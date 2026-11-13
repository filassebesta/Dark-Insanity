// Drawing of a settlement: the town plan with its plots (an SVG scene) and the
// sidebar where the player builds. Logic lives in build.js; map.js shows this
// in place of the map and wires the clicks.

import {
  settlementDef, townOf, ownsTown, catalogFor, buildingDef, buildBlock, currentProject, readyBuildings,
  levelName, slotCount, maxLevel, upgradeInfo, townYield, isFarm, crewLimit, projectsRunning,
} from './build.js';
import { GOODS } from './trade.js';
import { RESOURCE_DEFS, resourceLabel, NOBLE_HOUSES } from './data.js';
import { esc } from './ui.js';

// Painted art that has arrived (see docs/gemini-prompts.md, section 16).
// Add a key here once assets/buildings/<key>.jpg or assets/towns/<kind>.jpg exists.
const BUILDING_ART = new Set([]);
const TOWN_ART = new Set([]);

const PW = 1000;
const PH = 620;
// plot centres, in the order the plots open with each level
const PLOTS = [
  [420, 195], [580, 195], [420, 470], [580, 470],
  [270, 195], [730, 195], [270, 470], [730, 470],
  [120, 195], [880, 195], [120, 470], [880, 470],
];
const PLOT_W = 128;
const PLOT_H = 112;

// ---------- small drawing kit (all centred on 0,0, about 110 × 90) ----------

const C = { wall: '#e6d6b0', wall2: '#d2bf93', stone: '#b7aa92', stone2: '#9d907a', roof: '#8e3f2b', roof2: '#6b4a35', slate: '#5e6670', wood: '#8a6440', wood2: '#6e4e30', green: '#6f8a4a', gold: '#d8a650', ink: '#3a2a1a', water: '#7f98a3' };
const rect = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
const poly = (pts, fill, extra = '') => `<polygon points="${pts}" fill="${fill}" ${extra}/>`;
const gable = (x, y, w, h, fill) => poly(`${x - 4},${y} ${x + w / 2},${y - h} ${x + w + 4},${y}`, fill);
const hip = (x, y, w, h, fill) => poly(`${x - 4},${y} ${x + 8},${y - h} ${x + w - 8},${y - h} ${x + w + 4},${y}`, fill);
const door = (cx, y, w = 9, h = 13) => `<path d="M${cx - w / 2} ${y}v-${h - w / 2}a${w / 2} ${w / 2} 0 0 1 ${w} 0v${h - w / 2}z" fill="${C.wood2}"/>`;
const win = (x, y, w = 6, h = 8) => rect(x, y, w, h, '#3d3326');
const cross = (x, y, s = 7) => `<path d="M${x} ${y}v-${s * 2}M${x - s * 0.7} ${y - s * 1.35}h${s * 1.4}" stroke="${C.ink}" stroke-width="2.4" fill="none"/>`;
const crenels = (x, y, w, n, fill) => Array.from({ length: n }, (_, i) => rect(x + (i * w) / n, y - 6, w / n / 2, 6, fill)).join('');
const tree = (x, y, r = 12, fill = C.green) => `${rect(x - 2, y, 4, 9, C.wood2)}<circle cx="${x}" cy="${y - 2}" r="${r}" fill="${fill}"/>`;
const pine = (x, y, s = 1) => poly(`${x},${y - 30 * s} ${x - 12 * s},${y} ${x + 12 * s},${y}`, '#4d6440') + rect(x - 2 * s, y, 4 * s, 6 * s, C.wood2);
const smoke = (x, y) => `<g class="b-smoke"><circle cx="${x}" cy="${y}" r="4"/><circle cx="${x + 4}" cy="${y - 8}" r="5"/><circle cx="${x + 1}" cy="${y - 17}" r="6"/></g>`;
const flag = (x, y, fill = C.roof) => `<path d="M${x} ${y}v-26" stroke="${C.ink}" stroke-width="2"/><path class="b-flag" d="M${x} ${y - 26}h16l-5 5 5 5h-16z" fill="${fill}"/>`;

function house(x, y, w, h, roofH, roofFill = C.roof, wall = C.wall) {
  return `${rect(x, y - h, w, h, wall)}${gable(x, y - h, w, roofH, roofFill)}${door(x + w / 2, y)}`;
}

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
};

function scaffold() {
  return `<g class="b-scaffold">${rect(-40, -10, 80, 24, C.stone2)}${crenels(-40, -10, 80, 6, C.stone2)}
    <path d="M-44 14v-62M44 14v-62M-44 -24h88M-44 -48h88M-44 -24l20 -24M24 -24l20 -24" stroke="${C.wood}" stroke-width="3" fill="none"/>
    <path d="M-6 14v-86M-6 -72h44M34 -72v18" stroke="${C.wood2}" stroke-width="3" fill="none"/>${rect(28, -54, 12, 8, C.stone)}</g>`;
}

// ---------- the scene around the plots ----------

function sceneDecor(kind, level, town) {
  const parts = [];
  const cobble = level >= 3 && kind !== 'farm';
  const road = cobble ? '#b6a786' : '#c2a878';
  // roads cross at the square
  parts.push(`<path class="tp-road" d="M-20 ${PH / 2 + 22}H${PW + 20}M${PW / 2} -20V${PH + 20}" stroke="${road}" stroke-width="${cobble ? 46 : 34}"/>`);
  if (cobble) parts.push(`<path d="M-20 ${PH / 2 + 22}H${PW + 20}M${PW / 2} -20V${PH + 20}" stroke="#a09272" stroke-width="46" stroke-dasharray="3 9" opacity=".5"/>`);
  // what lies around: sea, mountains, forest, fields
  if (kind === 'port' || kind === 'abbey') {
    parts.push(`<path d="M0 0H44Q20 160 50 300Q24 470 40 ${PH}H0z" fill="${C.water}"/><path d="M10 120q10 -6 20 0M14 380q10 -6 20 0M8 520q10 -6 20 0" stroke="#c9d6da" stroke-width="2" fill="none"/>`);
    if (kind === 'port') parts.push(`<path d="M-10 ${PH / 2 + 22}H60" stroke="${C.wood}" stroke-width="18"/><path d="M8 ${PH / 2 - 10}l10 -14h30l-6 14z" fill="${C.wood2}"/><path d="M28 ${PH / 2 - 24}v-30l16 26z" fill="${C.wall}"/>`);
  }
  if (kind === 'mine') parts.push(`<path d="M0 70L60 18 120 64 190 6 260 60 330 20 380 64H620L680 14 750 58 820 2 900 56 960 18 1000 50V0H0z" fill="${C.stone2}"/>`);
  if (kind === 'lodge') {
    for (let i = 0; i < 14; i++) parts.push(pine(30 + i * 72, 64 + (i % 2) * 12, 1.3));
    for (let i = 0; i < 14; i++) parts.push(pine(20 + i * 72, PH - 6 - (i % 2) * 10, 1.2));
  }
  if (kind === 'village' || kind === 'farm' || kind === 'town') {
    parts.push(`<g class="tp-fields">${[[20, 560, 140], [180, 575, 120], [700, 565, 130], [850, 575, 140], [30, 20, 140], [830, 18, 150]].map(([x, y, w], i) =>
      `<rect x="${x}" y="${y}" width="${w}" height="44" fill="${i % 2 ? '#c8b06a' : '#9fa565'}" opacity=".7"/>`).join('')}</g>`);
  }
  // little houses that come with each level
  const spots = [[200, 300], [800, 300], [60, 320], [940, 330], [330, 560], [650, 560], [320, 70], [690, 70], [180, 580], [820, 590], [470, 580], [530, 60]];
  const n = kind === 'farm' ? 1 : Math.min(spots.length, level * 2 + 1);
  for (let i = 0; i < n; i++) {
    const [x, y] = spots[i];
    parts.push(`<g transform="translate(${x} ${y}) scale(.7)">${house(-24, 20, 48, 28, 20, i % 3 ? C.roof : C.roof2)}</g>`);
  }
  // walls around the whole place once they stand
  if (readyBuildings(town).some((b) => b.key === 'hradby')) {
    parts.push(`<rect class="tp-wall" x="34" y="104" width="${PW - 68}" height="${PH - 168}" rx="28"/>`);
  }
  return parts.join('');
}

function centrepiece(kind, level) {
  const at = (inner) => `<g class="tp-centre" transform="translate(${PW / 2} ${PH / 2 + 22})">${inner}</g>`;
  if (kind === 'castle') {
    return at(`<g transform="translate(0 30) scale(.95)">${rect(-50, -60, 100, 70, C.stone)}${crenels(-50, -60, 100, 8, C.stone)}${rect(-18, -110, 36, 120, C.stone2)}${crenels(-18, -110, 36, 4, C.stone2)}
      ${[-56, 44].map((x) => `${rect(x, -76, 14, 86, C.stone2)}${poly(`${x - 3},-76 ${x + 7},-100 ${x + 17},-76`, C.slate)}`).join('')}<path d="M-10 10v-24a10 10 0 0 1 20 0v24z" fill="${C.ink}"/>${flag(0, -110, C.roof)}</g>`);
  }
  if (kind === 'farm') {
    return at(`<g transform="translate(0 22)">${house(-46, 12, 92, 40, 30, C.roof2)}${win(-34, -14)}${win(22, -14)}${rect(18, -66, 9, 18, C.stone2)}${smoke(22, -72)}</g>`);
  }
  if (kind === 'abbey') {
    return at(`<rect x="-62" y="-50" width="124" height="100" rx="6" fill="${C.stone}"/><rect x="-46" y="-34" width="92" height="68" fill="#8ea463"/>${tree(0, 6, 14)}
      ${Array.from({ length: 8 }, (_, i) => `<path d="M${-44 + i * 12} -34v-6" stroke="${C.ink}" stroke-width="1"/>`).join('')}`);
  }
  // the square: a well in a village, a fountain and a market cross in a town
  const square = `<circle r="${level >= 3 ? 68 : 52}" fill="${level >= 3 ? '#cbbd99' : '#c9b384'}" stroke="#a89670" stroke-width="3"/>`;
  if (level >= 3) {
    return at(`${square}<circle r="22" fill="${C.stone}" stroke="${C.ink}" stroke-width="2"/><circle r="15" fill="${C.water}"/><path d="M0 -4v-34" stroke="${C.stone2}" stroke-width="5"/>${cross(0, -38, 6)}`);
  }
  return at(`${square}<circle r="14" fill="${C.stone}" stroke="${C.ink}" stroke-width="2"/><circle r="8" fill="#3d3326"/><path d="M-14 -2v-26M14 -2v-26M-18 -28h36" stroke="${C.wood}" stroke-width="3"/>${tree(-30, 26, 16)}`);
}

// ---------- plots ----------

function plotMarkup(state, id, town, slot, selectedSlot) {
  const [x, y] = PLOTS[slot];
  const open = slot < slotCount(id, town.level);
  const b = town.buildings.find((q) => q.slot === slot);
  const own = ownsTown(state, id);
  const sel = selectedSlot === slot ? ' selected' : '';
  const ground = `<rect class="plot-ground" x="${-PLOT_W / 2}" y="${-PLOT_H / 2}" width="${PLOT_W}" height="${PLOT_H}" rx="10"/>`;
  if (!open) {
    return `<g class="plot locked" transform="translate(${x} ${y})">${ground}<text class="plot-note" y="4">s vyšší úrovní</text></g>`;
  }
  if (!b && !own) {
    return `<g class="plot empty foreign" transform="translate(${x} ${y})">${ground}<text class="plot-note" y="4">volná parcela</text></g>`;
  }
  if (!b) {
    return `<g class="plot empty${sel}" data-town-slot="${slot}" transform="translate(${x} ${y})" tabindex="0" role="button" aria-label="Volná parcela">
      ${ground}<path class="plot-plus" d="M0 -14v28M-14 0h28"/><text class="plot-note" y="38">volná parcela</text></g>`;
  }
  const def = buildingDef(b.key);
  const art = BUILDING_ART.has(b.key)
    ? `<clipPath id="clip-${slot}"><rect x="${-PLOT_W / 2 + 4}" y="${-PLOT_H / 2 + 4}" width="${PLOT_W - 8}" height="${PLOT_H - 26}" rx="8"/></clipPath>
       <image href="assets/buildings/${b.key}.jpg" x="${-PLOT_W / 2 + 4}" y="${-PLOT_H / 2 + 4}" width="${PLOT_W - 8}" height="${PLOT_H - 26}" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip-${slot})"/>`
    : `<g class="b-icon" transform="translate(0 ${b.ready ? 24 : 26}) scale(.8)">${b.ready ? ICONS[b.key]() : scaffold()}</g>`;
  const building = !b.ready ? ' building' : '';
  const progress = !b.ready ? progressBar(state, b.start, b.done) : '';
  return `<g class="plot built${building}${sel}" data-town-slot="${slot}" transform="translate(${x} ${y})" tabindex="0" role="button" aria-label="${esc(def.name)}">
    ${ground}${art}${progress}<text class="plot-name" y="${PLOT_H / 2 + 16}">${esc(def.name)}</text></g>`;
}

function progressBar(state, start, done) {
  const total = Math.max(1, done - (start ?? done - 1));
  const k = Math.max(0.08, Math.min(1, (state.turn - (start ?? state.turn)) / total));
  return `<g class="plot-progress" transform="translate(${-PLOT_W / 2 + 12} ${PLOT_H / 2 - 12})"><rect width="${PLOT_W - 24}" height="6" rx="3"/><rect class="fill" width="${((PLOT_W - 24) * k).toFixed(0)}" height="6" rx="3"/></g>`;
}

/** The town plan (SVG) shown in place of the map. */
export function renderTownPlan(state, id, selectedSlot) {
  const def = settlementDef(id);
  const town = townOf(state, id);
  const total = isFarm(id) ? 7 : 10;
  const p = currentProject(town);
  return `
    <svg class="town-svg kind-${def.kind}" viewBox="0 0 ${PW} ${PH}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(def.name)}">
      <rect class="tp-ground" width="${PW}" height="${PH}"/>
      ${sceneDecor(def.kind, town.level, town)}
      ${centrepiece(def.kind, town.level)}
      ${Array.from({ length: total }, (_, i) => plotMarkup(state, id, town, i, selectedSlot)).join('')}
      ${p && p.type === 'upgrade' ? `<g class="tp-upgrade" transform="translate(${PW / 2} 40)"><rect x="-150" y="-20" width="300" height="34" rx="17"/><text y="3">Rozšiřuje se na ${esc(levelName(id, p.to).toLowerCase())} · ${esc(eta(state, p.done))}</text></g>` : ''}
    </svg>
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

function effectChips(state, b) {
  const out = [];
  const season = b.seasons ? ` ${['na jaře', 'v létě', 'na podzim', 'v zimě'][b.seasons[0]]}` : ' / období';
  for (const [k, v] of Object.entries(b.income || {})) if (usable(state, k)) out.push(chip(`${resName(state, k)} ${sign(v)}${season}`, v > 0));
  for (const [k, v] of Object.entries(b.yearly || {})) if (usable(state, k)) out.push(chip(`${resName(state, k)} ${sign(v)} / rok`, v > 0));
  for (const [g, n] of Object.entries(b.stock || {})) out.push(chip(`${GOODS[g].name.toLowerCase()} +${n} vůz / rok`));
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
    ...Object.entries(y.drift).filter(([, v]) => v).map(([k, v]) => chip(`${DRIFT_LABEL[k]} +${v}`)),
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
        <span class="build-thumb"><svg viewBox="-64 -100 128 124">${ICONS[key]()}</svg></span>
        <span class="build-body"><b>${esc(b.name)} <small>${esc(costText(state, b.cost))} · ${b.turns} obd.</small></b>
        <span>${esc(b.text)}</span><em>${effectChips(state, b)}</em>${why ? `<em class="build-why">${esc(why)}</em>` : ''}</span>
      </button>`).join('')}</div>`;
}

function buildingDetail(state, id, b) {
  const def = buildingDef(b.key);
  const own = ownsTown(state, id);
  return `<div class="build-detail">
      ${BUILDING_ART.has(b.key) ? `<img class="build-art" src="assets/buildings/${b.key}.jpg" alt="">` : `<span class="build-thumb big"><svg viewBox="-64 -100 128 124">${ICONS[b.key]()}</svg></span>`}
      <h4 class="map-sub">${esc(def.name)}${b.ready ? '' : ' <small>· ve stavbě</small>'}</h4>
      <p class="map-desc">${esc(def.text)}</p>
      ${b.base ? '<p class="map-decree-hint">Stojí tu odjakživa. Co dává, už je dávno započtené v příjmech kraje — přínos navíc mají jen stavby, které postavíš ty.</p>' : `<div class="build-chips">${effectChips(state, def)}</div>`}
      ${b.ready ? '' : `<p class="map-decree-hint">${esc(eta(state, b.done))}</p>`}
      ${own && b.ready ? `<button class="trade-mini build-demolish" data-demolish="${b.slot}">Strhnout a uvolnit parcelu</button>` : ''}
      ${own && !b.ready ? '<button class="trade-mini" data-cancel-project>Zastavit stavbu (vrátí se polovina)</button>' : ''}
    </div>`;
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
    <h4 class="map-sub">Stavby <small>· ${ready.length}</small></h4>
    ${ready.length ? `<div class="map-chip-list">${ready.map((b) => `<button class="map-chip" data-town-slot="${b.slot}"><span>${esc(buildingDef(b.key).name)}</span><em class="${b.base ? '' : 'good'}">${b.base ? 'původní' : 'tvoje'}</em></button>`).join('')}</div>` : '<p class="map-desc">Zatím tu nic nestojí.</p>'}
    ${own ? `<h4 class="map-sub">Co ti dávají tvé stavby</h4>${yieldSummary(state, id)}` : ''}
    ${own ? upgradeBlock(state, id) : ''}
    ${own ? purse : ''}
    <button class="map-back" data-close-town>← Zpět na mapu</button>`;
}
