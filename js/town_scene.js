// The painted scene around the plots of a settlement (town.js draws plots and sidebar on top of it).
//
// It is built in two SVG layers that share one viewBox:
//  - the GROUND (static: sky, hills, painted terrain with filters, roads, fields, fences, trees, cottages,
//    walls) sits in its own composited layer, so the heavy filters are painted once and never again;
//  - the FRONT (centrepiece, farm yard, villagers, smoke, flags, birds) is light, animated, y-sorted with plots.
// If a painted backdrop assets/towns/<id>.jpg exists (TOWN_BACKDROPS), it replaces sky, terrain, roads and
// fields; trees, fences, cottages, walls and all the life stay on top of it.
//
// Everything is derived from the settlement id (seeded random numbers), kind, level and season, so a place
// always looks the same and grows with its level: more cottages, fewer wild trees, cobbles, walls, torches.

import {
  C, rngFor, mix, lighten, darken, smoothPath, distToLine, f1, cottage, longhouse, figure, crow, rect, poly, crenels,
} from './town_kit.js';
import { TOWN_LAYOUTS, IMG_W, IMG_H } from './town_layouts.js';

// ids that have a painted map assets/towns/<id>.jpg (1376 x 768, 16:9); the lead adds an id when the file arrives.
// A settlement without a file keeps the procedural ground below.
export const TOWN_BACKDROPS = new Set(['capital', 'brod', 'port', 'abbey', 'mine', 'lodge', 'lipnice', 'dubovice', 'zareci', 'grunt']);

// ---------- layout: where plots, roads and the square are ----------

// A painted map is shown in a scene 1000 units wide with the picture's own aspect; the one place that turns
// picture fractions (u, v) into scene units is `toScene`.
const SCENE_W = 1000;
const SCENE_H = Math.round((SCENE_W * IMG_H) / IMG_W * 10) / 10;
export const toScene = ([u, v]) => [u * SCENE_W, v * SCENE_H];

/** Layout of a painted settlement in scene units: plot feet with building width, farm yard, walking routes. */
function paintedLayout(id) {
  const t = TOWN_LAYOUTS[id];
  const wide = (w) => w * SCENE_W;
  return {
    W: SCENE_W, H: SCENE_H, painted: true, c: toScene([0.5, 0.5]),
    // the foot of a building is the middle of its clearing, `wu` the clearing's width
    feet: t.plots.map(([u, v, w, free]) => [...toScene([u, v]), wide(w), free || 0]),
    grow: t.grow || 1.14,
    roads: (t.roads || []).map((l) => l.map(toScene)),
    house: t.house ? [...toScene(t.house), wide(t.house[2])] : null,
    paddock: t.paddock ? [...toScene(t.paddock.slice(0, 2)), ...toScene(t.paddock.slice(2))] : null,
    sty: t.sty ? [...toScene(t.sty.slice(0, 2)), ...toScene(t.sty.slice(2))] : null,
    sacks: t.sacks ? toScene(t.sacks) : null,
    roadW: 20,
  };
}

// the procedural ground (no painted map): foot points in the order plots open with each level
const WIDE = {
  W: 1000, H: 620, painted: false, c: [500, 332],
  feet: [[420, 225, 138], [580, 225, 138], [420, 500, 138], [580, 500, 138], [270, 225, 138], [730, 225, 138], [270, 500, 138], [730, 500, 138], [120, 225, 138], [880, 225, 138], [120, 500, 138], [880, 500, 138]],
  grow: 1.1, roadW: 34,
  wall: { x0: 40, y0: 104, x1: 960, y1: 566 },
  paddock: [660, 352, 890, 398], sty: [180, 350, 340, 396], sacks: [556, 378], house: [500, 350, 100],
  shore: 566,
};
export const layoutOf = (id, painted) => (painted ? paintedLayout(id) : WIDE);

// ---------- seasons ----------

const SEASON = [
  { // spring
    g0: '#8d9b5c', g1: '#6e7e46', tones: ['#a2ad68', '#7a8a4e', '#b4b977', '#697944', '#8fa05a'], leaf: ['#86a052', '#9db35e', '#6c8946'], bloom: '#ead3d8',
    crop: '#8fb052', soil: '#86694a', haze: '#dde1cb', sky0: '#b9c9cc', sky1: '#dfe3d2', tint: 'rgba(196,220,160,.08)', hill: '#7f9a78', snow: false,
  },
  { // summer
    g0: '#8c9a52', g1: '#6c7c3c', tones: ['#9cab5c', '#78893f', '#adb36a', '#657638', '#8a9a4c'], leaf: ['#6f8c42', '#84a04c', '#58763a'], bloom: null,
    crop: '#cbb15f', soil: '#86694a', haze: '#e6e0c4', sky0: '#bccdd0', sky1: '#e8e3cc', tint: 'rgba(230,205,130,.06)', hill: '#7a9272', snow: false,
  },
  { // autumn
    g0: '#9a9355', g1: '#7a7140', tones: ['#a9985a', '#8c7b45', '#b3883f', '#7a693a', '#9d8a4c'], leaf: ['#b7692d', '#c58d37', '#9b5127'], bloom: null,
    crop: '#b99e5a', soil: '#7d5f40', haze: '#e0d0aa', sky0: '#c4c3b6', sky1: '#e3d6b6', tint: 'rgba(214,142,62,.10)', hill: '#9a8a62', snow: false,
  },
  { // winter
    g0: '#9a9c76', g1: '#80845f', tones: ['#aeb08c', '#8d9170', '#b9bba2', '#767b58', '#a2a58a'], leaf: ['#7e8a78', '#8c9885', '#6b7765'], bloom: null,
    crop: '#d4d8d6', soil: '#8b7a62', haze: '#e4e8e8', sky0: '#b6c3cb', sky1: '#e1e7ea', tint: 'rgba(172,196,222,.14)', hill: '#8f9fa6', snow: true,
  },
];
export const seasonOf = (i) => SEASON[((i % 4) + 4) % 4];

// ground colour pulled towards the character of the place
const KIND_GROUND = { castle: ['#9a9378', 0.34], town: ['#a39c7d', 0.28], port: ['#a59f7f', 0.22], abbey: ['#8c9a6c', 0.15], mine: ['#8f8872', 0.62], lodge: ['#6e7a4a', 0.4], village: ['#9aa060', 0.04], farm: ['#9aa060', 0.04] };

// ---------- the scene context ----------

export function sceneContext({ id, kind, level, season, walls, painted, reduced, open }) {
  const lay = layoutOf(id, painted);
  const P = SEASON[((season % 4) + 4) % 4];
  const [kc, kt] = KIND_GROUND[kind] || ['#9aa060', 0];
  const ctx = {
    id, kind, level, season: ((season % 4) + 4) % 4, tall: false, walls: walls && !painted, backdrop: painted, reduced, lay, P,
    g0: mix(P.g0, kc, kt), g1: mix(P.g1, kc, kt),
    open, // foot points of the plots that are open
    rng: rngFor(`${id}:${kind}`),
    cobble: level >= 3 && kind !== 'farm' && kind !== 'lodge' && kind !== 'mine',
  };
  // the two roads (centre lines): slightly wavy, straight when a backdrop shows roads of its own
  const wob = painted ? 0 : 5;
  const r = rngFor(`${id}:roads`);
  const [cx, cy] = lay.c;
  const mk = (a, b, horizontal) => {
    const pts = [];
    const n = 9;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const u = a + (b - a) * t;
      const off = i === 0 || i === n ? 0 : Math.sin(i * 1.7 + (horizontal ? 1 : 3)) * wob + (r() - 0.5) * wob * 0.6;
      const near = Math.abs(u - (horizontal ? cx : cy));
      const k = near < 90 ? near / 90 : 1;
      pts.push(horizontal ? [u, cy + off * k] : [cx + off * k, u]);
    }
    return pts;
  };
  ctx.roadH = mk(-120, lay.W + 120, true);
  ctx.roadV = mk(-120, lay.H + 120, false);
  return ctx;
}

// something at (x, y) with a box (w wide, h tall above y) may not overlap a plot, a road or the square
function blocked(c, x, y, w, h, pad = 8) {
  const [cx, cy] = c.lay.c;
  if (Math.hypot(x - cx, (y - cy) * 1.5) < c.plazaR + w * 0.3) return true;
  for (const [fx, fy] of c.open) {
    if (Math.abs(x - fx) < 86 + w / 2 + pad && y > fy - 112 - pad && y - h < fy + 34 + pad) return true;
  }
  const road = c.lay.roadW / 2 + 8 + pad;
  if (Math.abs(x - cx) < road + w / 2 || (y > cy - road && y - h < cy + road)) return true;
  return false;
}

// ---------- defs: filters, gradients, tree and prop symbols ----------

export function defsMarkup(c) {
  const P = c.P;
  const [l0, l1, l2] = P.leaf;
  const lf = (id, col) => `<radialGradient id="tw-lf${id}" cx=".35" cy=".28" r=".85"><stop offset="0" stop-color="${lighten(col, 0.32)}"/><stop offset=".55" stop-color="${col}"/><stop offset="1" stop-color="${darken(col, 0.38)}"/></radialGradient>`;
  const pineCol = c.season === 3 ? '#4c6149' : '#46603f';
  const blossom = P.bloom ? Array.from({ length: 12 }, (_, i) => `<circle cx="${((i * 37) % 38) - 19}" cy="${-52 + ((i * 53) % 34)}" r="1.9" fill="${P.bloom}" opacity=".9"/>`).join('') : '';
  const snowCaps = c.season === 3;
  const crown = (leaves, extra = '') => `<ellipse cx="7" cy="1" rx="25" ry="7" fill="url(#tw-shadow)"/><path d="M-3 1l1-18h3l1 18z" fill="#5a4230"/>${leaves}${extra}`;
  const oak = (variant) => {
    if (c.season === 3 && variant !== 9) {
      // bare winter tree: trunk and forked branches, a little snow on top
      return `<ellipse cx="7" cy="1" rx="22" ry="6" fill="url(#tw-shadow)"/><path d="M-2.5 1l1-26h3l1 26z" fill="#5a4230"/><g stroke="#5a4230" stroke-linecap="round" fill="none"><path d="M-1 -22l-13 -18M0 -26l-2 -24M1 -22l14 -17M-8 -34l-8 -3M8 -34l9 -6M-2 -42l4 -10M-13 -40l-6 -8" stroke-width="2.2"/><path d="M-14 -40l-3 -9M15 -39l5 -8M-2 -50l-5 -7M-2 -50l4 -6" stroke-width="1.4"/></g><path d="M-18 -37q3 -3 6 0M12 -38q3 -3 7 0" stroke="#f3f5f4" stroke-width="2" fill="none" opacity=".8"/>`;
    }
    const sets = [
      `<circle cx="-10" cy="-30" r="15" fill="url(#tw-lf2)"/><circle cx="11" cy="-32" r="14" fill="url(#tw-lf2)"/><circle cx="0" cy="-43" r="17" fill="url(#tw-lf0)"/><circle cx="-9" cy="-24" r="13" fill="url(#tw-lf1)"/><circle cx="9" cy="-24" r="13" fill="url(#tw-lf1)"/><circle cx="-4" cy="-49" r="7" fill="${lighten(l0, 0.5)}" opacity=".3"/>`,
      `<circle cx="-12" cy="-27" r="13" fill="url(#tw-lf2)"/><circle cx="12" cy="-29" r="14" fill="url(#tw-lf1)"/><circle cx="-2" cy="-38" r="16" fill="url(#tw-lf1)"/><circle cx="1" cy="-47" r="12" fill="url(#tw-lf0)"/><circle cx="-6" cy="-51" r="5" fill="${lighten(l0, 0.5)}" opacity=".3"/>`,
      `<circle cx="-8" cy="-26" r="14" fill="url(#tw-lf1)"/><circle cx="9" cy="-28" r="13" fill="url(#tw-lf2)"/><circle cx="1" cy="-36" r="15" fill="url(#tw-lf0)"/><circle cx="-2" cy="-45" r="10" fill="url(#tw-lf0)"/><circle cx="-5" cy="-48" r="4.5" fill="${lighten(l0, 0.55)}" opacity=".35"/>`,
    ][variant % 3];
    return crown(sets, blossom);
  };
  const pine = (v) => {
    const s = v ? 0.82 : 1;
    const tiers = [[-4, 22, 20], [-16, 19, 17], [-28, 15, 14], [-38, 11, 12]];
    const body = tiers.map(([y, w, h], i) => `<polygon points="${-w * s},${y * s} ${w * s * 0},${(y - h) * s} ${w * s},${y * s}" fill="${i % 2 ? darken(pineCol, 0.12) : pineCol}"/>`).join('');
    const caps = snowCaps ? tiers.map(([y, w, h]) => `<polygon points="${-w * s * 0.55},${(y - h * 0.45) * s} 0,${(y - h) * s} ${w * s * 0.55},${(y - h * 0.45) * s} 0,${(y - h * 0.62) * s}" fill="#eef1ef" opacity=".92"/>`).join('') : '';
    return `<ellipse cx="6" cy="2" rx="${18 * s}" ry="5.5" fill="url(#tw-shadow)"/><rect x="-2" y="-6" width="4" height="9" fill="#4d3a2a"/>${body}${caps}`;
  };
  const bush = `<ellipse cx="3" cy="1" rx="14" ry="4" fill="url(#tw-shadow)"/><circle cx="-6" cy="-5" r="7" fill="url(#tw-lf2)"/><circle cx="6" cy="-6" r="7.5" fill="url(#tw-lf1)"/><circle cx="0" cy="-10" r="6.5" fill="url(#tw-lf0)"/>${snowCaps ? '<ellipse cx="0" cy="-14" rx="5" ry="1.8" fill="#f1f4f2"/>' : ''}`;
  const limeCol = c.season === 2 ? '#d1b94a' : c.season === 1 ? '#8fae4c' : c.season === 0 ? '#a9c765' : '#7e8a78';
  const lime = c.season === 3 ? oak(9) : `<ellipse cx="9" cy="1" rx="34" ry="9" fill="url(#tw-shadow)"/><path d="M-5 1l2-24h6l2 24z" fill="#5a4230"/>
    <circle cx="-18" cy="-36" r="19" fill="${darken(limeCol, 0.28)}"/><circle cx="18" cy="-38" r="18" fill="${darken(limeCol, 0.22)}"/><circle cx="0" cy="-52" r="22" fill="${limeCol}"/><circle cx="-14" cy="-28" r="17" fill="${mix(limeCol, '#4d6a2a', 0.2)}"/><circle cx="15" cy="-27" r="16" fill="${mix(limeCol, '#4d6a2a', 0.3)}"/><circle cx="-6" cy="-60" r="10" fill="${lighten(limeCol, 0.4)}" opacity=".5"/>`;
  const hayCol = c.season === 3 ? '#cdb98a' : '#d3b366';
  const hay = `<ellipse cx="4" cy="1" rx="17" ry="5" fill="url(#tw-shadow)"/><path d="M-13 0q-1 -22 13 -23q14 1 13 23z" fill="${hayCol}"/><path d="M-13 0q-1 -22 13 -23q-8 8 -7 23z" fill="${lighten(hayCol, 0.3)}" opacity=".55"/><path d="M-11 -6q11 3 22 0M-9 -13q9 3 18 0" stroke="${darken(hayCol, 0.3)}" stroke-width="1" fill="none" opacity=".6"/>${snowCaps ? '<path d="M-8 -18q8 -8 16 0q-8 -3 -16 0z" fill="#f1f4f2"/>' : ''}`;
  const rock = `<ellipse cx="3" cy="1" rx="14" ry="4" fill="url(#tw-shadow)"/><path d="M-12 0q-2 -9 5 -12q8 -4 14 3q4 5 1 9z" fill="#8f8a7c"/><path d="M-12 0q-2 -9 5 -12q4 6 0 12z" fill="#a8a392" opacity=".7"/>${snowCaps ? '<path d="M-6 -11q6 -4 12 2q-6 -1 -12 -2z" fill="#f1f4f2"/>' : ''}`;
  const sea = '#7d97a3';
  return `<defs>
    <filter id="tw-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter>
    <filter id="tw-soft2" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.6"/></filter>
    <filter id="tw-rough" x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency=".022" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="26"/><feGaussianBlur stdDeviation="3.5"/></filter>
    <filter id="tw-edge" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".06" numOctaves="2" seed="9" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="7"/></filter>
    <filter id="tw-paint" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="2" seed="2" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.4"/></filter>
    <filter id="tw-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 .13  0 0 0 0 .1  0 0 0 0 .05  0 0 0 -2.2 1.12"/></filter>
    <filter id="tw-mottle" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".011 .016" numOctaves="3" seed="12"/><feColorMatrix values="0 0 0 0 .2  0 0 0 0 .22  0 0 0 0 .1  0 0 0 -2.6 1.3"/></filter>
    <filter id="tw-lit" x="-12%" y="-12%" width="124%" height="124%">
      <feTurbulence type="fractalNoise" baseFrequency=".07" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" result="w"/>
      <feColorMatrix in="w" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="sil"/>
      <feOffset in="sil" dx="-7" dy="-3" result="o1"/><feComposite in="sil" in2="o1" operator="out" result="rim"/>
      <feGaussianBlur in="rim" stdDeviation="3.2" result="rimb"/><feColorMatrix in="rimb" values="0 0 0 0 .1  0 0 0 0 .07  0 0 0 0 .03  0 0 0 .55 0" result="shade"/>
      <feOffset in="sil" dx="6" dy="3" result="o2"/><feComposite in="sil" in2="o2" operator="out" result="hi"/>
      <feGaussianBlur in="hi" stdDeviation="2.2" result="hib"/><feColorMatrix in="hib" values="0 0 0 0 1  0 0 0 0 .93  0 0 0 0 .75  0 0 0 .32 0" result="light"/>
      <feMerge><feMergeNode in="w"/><feMergeNode in="shade"/><feMergeNode in="light"/></feMerge><feComposite in2="sil" operator="in"/>
    </filter>
    <radialGradient id="tw-shadow"><stop offset="0" stop-color="#1d160d" stop-opacity=".42"/><stop offset=".6" stop-color="#1d160d" stop-opacity=".18"/><stop offset="1" stop-color="#1d160d" stop-opacity="0"/></radialGradient>
    <radialGradient id="tw-patchfade" gradientTransform="translate(.5 .5) scale(1 .9) translate(-.5 -.5)" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#fff"/><stop offset=".9" stop-color="#777"/><stop offset="1" stop-color="#444"/></radialGradient>
    <mask id="tw-patch" maskContentUnits="objectBoundingBox" x="0" y="0" width="1" height="1"><rect width="1" height="1" fill="url(#tw-patchfade)"/></mask>
    <radialGradient id="tw-pad"><stop offset="0" stop-color="#6d5a3c" stop-opacity=".5"/><stop offset=".65" stop-color="#6d5a3c" stop-opacity=".32"/><stop offset="1" stop-color="#6d5a3c" stop-opacity="0"/></radialGradient>
    <radialGradient id="tw-soil"><stop offset="0" stop-color="#8f7650" stop-opacity=".78"/><stop offset=".7" stop-color="#85694a" stop-opacity=".6"/><stop offset="1" stop-color="#7a6040" stop-opacity="0"/></radialGradient>
    <radialGradient id="tw-glow"><stop offset="0" stop-color="#ffe9a6" stop-opacity=".95"/><stop offset=".4" stop-color="#f4b24e" stop-opacity=".5"/><stop offset="1" stop-color="#f4b24e" stop-opacity="0"/></radialGradient>
    <radialGradient id="tw-ring"><stop offset=".6" stop-color="#f6d27c" stop-opacity="0"/><stop offset=".86" stop-color="#f6d27c" stop-opacity=".55"/><stop offset="1" stop-color="#f6d27c" stop-opacity="0"/></radialGradient>
    <radialGradient id="tw-yard" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${mix(c.g0, '#d9cfa0', 0.35)}" stop-opacity=".9"/><stop offset=".7" stop-color="${mix(c.g0, '#cfc690', 0.2)}" stop-opacity=".55"/><stop offset="1" stop-color="${c.g0}" stop-opacity="0"/></radialGradient>
    <linearGradient id="tw-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.sky0}"/><stop offset="1" stop-color="${P.sky1}"/></linearGradient>
    <linearGradient id="tw-haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.haze}" stop-opacity="0"/><stop offset="1" stop-color="${P.haze}" stop-opacity=".7"/></linearGradient>
    <linearGradient id="tw-under" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f2a14" stop-opacity=".5"/><stop offset="1" stop-color="#1f2a14" stop-opacity="0"/></linearGradient>
    <linearGradient id="tw-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fb4b6"/><stop offset=".35" stop-color="${sea}"/><stop offset="1" stop-color="#4f6b79"/></linearGradient>
    <linearGradient id="tw-river" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fa8aa"/><stop offset="1" stop-color="#6d8b97"/></linearGradient>
    <radialGradient id="tw-ground" cx=".5" cy=".5" r=".75"><stop offset="0" stop-color="${lighten(c.g0, 0.12)}"/><stop offset=".6" stop-color="${c.g0}"/><stop offset="1" stop-color="${c.g1}"/></radialGradient>
    ${lf(0, l0)}${lf(1, l1)}${lf(2, l2)}
    <pattern id="tw-cobble" width="15" height="11" patternUnits="userSpaceOnUse"><rect width="15" height="11" fill="#8d8265"/>
      <rect x=".8" y=".8" width="6.4" height="4.4" rx="2" fill="#bdb196"/><rect x="8.3" y=".8" width="5.9" height="4.4" rx="2" fill="#b3a78b"/>
      <rect x="-2.6" y="6.2" width="6.4" height="4.2" rx="2" fill="#b6aa8e"/><rect x="4.8" y="6.2" width="6.6" height="4.2" rx="2" fill="#c3b79c"/><rect x="12.6" y="6.2" width="5" height="4.2" rx="2" fill="#b3a78b"/></pattern>
    <pattern id="tw-dirt" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#c2a877"/>
      <circle cx="6" cy="9" r="1.4" fill="#a98f61"/><circle cx="22" cy="5" r="1" fill="#d6bf90"/><circle cx="31" cy="21" r="1.6" fill="#a98f61"/><circle cx="12" cy="30" r="1.1" fill="#d6bf90"/><circle cx="35" cy="35" r="1.2" fill="#b39968"/><circle cx="20" cy="19" r="1" fill="#b39968"/></pattern>
    ${['soil', 'crop', 'stub'].map((k, i) => {
    const base = k === 'crop' ? mix(P.crop, P.soil, 0.45) : k === 'stub' ? mix(P.crop, '#9a7c4e', 0.4) : P.soil;
    const line = k === 'crop' ? P.crop : k === 'stub' ? lighten(P.crop, 0.15) : darken(P.soil, 0.25);
    const snow = c.season === 3 ? `<rect width="9" height="9" fill="#e8ecea" opacity=".62"/>` : '';
    return `<pattern id="tw-rows-${i}" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(${i * 7 - 6})"><rect width="9" height="9" fill="${base}"/><path d="M0 2.4H9" stroke="${line}" stroke-width="${k === 'crop' ? 3 : 1.6}" opacity="${k === 'crop' ? 0.95 : 0.8}"/><path d="M0 6.9H9" stroke="${darken(base, 0.2)}" stroke-width="1" opacity=".5"/>${snow}</pattern>`;
  }).join('')}
    <g id="tw-oak0">${oak(0)}</g><g id="tw-oak1">${oak(1)}</g><g id="tw-oak2">${oak(2)}</g>
    <g id="tw-pine0">${pine(0)}</g><g id="tw-pine1">${pine(1)}</g>
    <g id="tw-bush">${bush}</g><g id="tw-lime">${lime}</g><g id="tw-hay">${hay}</g><g id="tw-rock">${rock}</g>
  </defs>`;
}

// ---------- ground ----------

function smoothClosed(pts, bottomY) {
  return `${smoothPath(pts)}L${pts[pts.length - 1][0]} ${bottomY}L${pts[0][0]} ${bottomY}z`;
}

function skyAndHills(c) {
  const { W } = c.lay;
  const { P, rng } = c;
  const y0 = 100;
  const out = [];
  out.push(`<rect x="${-700}" y="-700" width="${W + 1400}" height="${700 + y0 + 20}" fill="url(#tw-sky)"/>`);
  const ridge = (base, amp, col, seedOff, step = 80, op = 1) => {
    const pts = [];
    for (let x = -700; x <= W + 700; x += step) pts.push([x, base - amp * (0.55 + 0.45 * Math.sin(x * 0.011 + seedOff)) - amp * 0.4 * Math.sin(x * 0.027 + seedOff * 2.3) - rng() * amp * 0.12]);
    return `<path d="${smoothClosed(pts, y0 + 60)}" fill="${col}" opacity="${op}"/>`;
  };
  if (c.kind === 'mine') {
    // jagged mountains with a lit and a shaded face and snow on the tops
    const peaks = [];
    for (let x = -700; x <= W + 700; x += 120 + rng() * 60) peaks.push([x, y0 - 36 - rng() * 70 - (Math.abs(x - W / 2) < 300 ? 30 : 0)]);
    for (let i = 0; i < peaks.length - 1; i++) {
      const [x, y] = peaks[i], [nx] = peaks[i + 1];
      const mx = (x + nx) / 2;
      out.push(`<polygon points="${x - 90},${y0 + 30} ${x},${y} ${mx},${y0 + 30}" fill="${mix('#8a8777', P.hill, 0.35)}"/><polygon points="${x},${y} ${x + 70},${y0 + 30} ${mx},${y0 + 30}" fill="${mix('#5f5e56', P.hill, 0.25)}"/>`);
      out.push(`<path d="M${x - 14} ${y + 22}L${x} ${y}L${x + 16} ${y + 24}q-8 -5 -12 3q-4 -6 -10 -2q-4 -3 -8 1z" fill="#eef0ee" opacity="${c.season === 1 ? 0.5 : 0.85}"/>`);
    }
  } else {
    out.push(ridge(y0 - 6, 52, mix(P.hill, P.haze, 0.55), 1.3, 90, 0.95));
    out.push(ridge(y0 + 10, 34, mix(P.hill, '#4f6a48', 0.35), 4.1, 70));
    if (c.id === 'dubovice' || c.id === 'capital') {
      // a castle on the far hill
      const x = c.id === 'capital' ? 820 : 150;
      out.push(`<g transform="translate(${x} ${y0 - 32})" opacity=".8"><g fill="${mix(P.hill, '#6f7078', 0.5)}"><rect x="-22" y="-26" width="44" height="28"/><rect x="-28" y="-40" width="12" height="42"/><rect x="16" y="-34" width="12" height="36"/><polygon points="-30,-40 -22,-54 -14,-40"/><polygon points="14,-34 22,-48 30,-34"/></g></g>`);
    }
  }
  out.push(`<rect x="-700" y="${y0 - 70}" width="${W + 1400}" height="80" fill="url(#tw-haze)"/>`);
  // the forest line: two rows of crowns and a few pines
  const forest = [];
  const dens = c.kind === 'lodge' ? 11 : c.kind === 'mine' ? 30 : 16;
  const dark = darken(mix(P.leaf[2], P.hill, 0.3), 0.18);
  const mid = mix(P.leaf[2], P.leaf[1], 0.3);
  const rows = c.kind === 'mine' ? [] : [[y0 + 4, dark, 17], [y0 + 15, mid, 15]];
  for (const [yy, col, rad] of rows) {
    for (let x = -240; x <= W + 240; x += dens) {
      const r = rad * (0.7 + rng() * 0.6);
      forest.push(`<circle cx="${f1(x + rng() * 8)}" cy="${f1(yy + rng() * 9 - 4)}" r="${f1(r)}" fill="${col}"/>`);
    }
  }
  if (c.kind === 'lodge' || c.kind === 'mine') {
    const step = c.kind === 'lodge' ? 24 : 70;
    for (let x = -240; x <= W + 240; x += step) {
      const s = (c.kind === 'lodge' ? 1.1 : 0.9) * (0.8 + rng() * 0.5);
      forest.push(`<use href="#tw-pine${rng() < 0.5 ? 0 : 1}" transform="translate(${f1(x + rng() * 14)} ${f1(y0 + 12 + rng() * 16)}) scale(${f1(s)})"/>`);
    }
  }
  out.push(`<g filter="url(#tw-paint)">${forest.join('')}</g>`);
  out.push(`<rect x="-700" y="${y0 + 6}" width="${W + 1400}" height="46" fill="url(#tw-under)"/>`);
  return out.join('');
}

function terrainBlotches(c) {
  const { W, H } = c.lay;
  const r = rngFor(`${c.id}:blot`);
  const P = c.P;
  const tones = P.tones.map((t) => mix(t, c.g0, 0.25));
  const out = [];
  for (let i = 0; i < 46; i++) {
    const x = r.range(-180, W + 180), y = r.range(90, H + 160);
    const rx = r.range(40, 150), ry = rx * r.range(0.35, 0.6);
    out.push(`<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="${r.pick(tones)}" opacity="${f1(r.range(0.28, 0.6))}"/>`);
  }
  if (c.season === 3) {
    for (let i = 0; i < 22; i++) {
      const x = r.range(-100, W + 100), y = r.range(110, H + 80), rx = r.range(26, 90);
      out.push(`<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(rx)}" ry="${f1(rx * r.range(0.3, 0.5))}" fill="#eef1ef" opacity="${f1(r.range(0.35, 0.65))}"/>`);
    }
  }
  return `<g filter="url(#tw-rough)">${out.join('')}</g>`;
}

function tufts(c, n = 230) {
  const { W, H } = c.lay;
  const r = rngFor(`${c.id}:tufts`);
  const dark = [], light = [];
  for (let i = 0; i < n; i++) {
    const x = r.range(-60, W + 60), y = r.range(110, H + 70);
    if (blocked(c, x, y, 6, 6, -4)) continue;
    const s = r.range(0.8, 1.5);
    const p = `M${f1(x)} ${f1(y)}l${f1(-2.4 * s)} ${f1(-6 * s)}M${f1(x)} ${f1(y)}l${f1(0.4 * s)} ${f1(-7.5 * s)}M${f1(x)} ${f1(y)}l${f1(2.6 * s)} ${f1(-5.5 * s)}`;
    (i % 3 ? dark : light).push(p);
  }
  const sn = c.season === 3;
  return `<path d="${dark.join('')}" stroke="${darken(c.g1, sn ? 0.1 : 0.25)}" stroke-width="1.1" fill="none" opacity=".62" stroke-linecap="round"/><path d="${light.join('')}" stroke="${lighten(c.g0, 0.3)}" stroke-width="1" fill="none" opacity=".55" stroke-linecap="round"/>`;
}

function flowers(c) {
  const P = c.P;
  if (c.season === 3 || (c.season === 2 && c.kind === 'mine')) return '';
  const cols = c.season === 0 ? ['#f1e7ee', '#e8c5d2', '#f4e9a8', '#cdb7e0'] : c.season === 1 ? ['#f4e9a8', '#f1efe6', '#d9a0a0', '#e4c36b'] : ['#d98a3d', '#c9704a', '#e0b45a'];
  if (c.kind === 'mine' || c.kind === 'castle') return '';
  const { W, H } = c.lay;
  const r = rngFor(`${c.id}:flow`);
  const out = [];
  for (let i = 0; i < (c.season === 2 ? 90 : 120); i++) {
    const x = r.range(-40, W + 40), y = r.range(115, H + 50);
    if (blocked(c, x, y, 4, 4, -2)) continue;
    out.push(`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r.range(0.9, 1.8))}" fill="${r.pick(cols)}" opacity=".85"/>`);
  }
  return out.join('');
}

function roadsMarkup(c) {
  const { roadW } = c.lay;
  const w = c.cobble ? roadW + 12 : roadW;
  const dH = smoothPath(c.roadH), dV = smoothPath(c.roadV);
  const both = (fn) => fn(dH) + fn(dV);
  const out = [];
  // ambient occlusion on the grass, the worn edge, the body, a lighter trodden middle
  out.push(both((d) => `<path d="${d}" stroke="#1f2a14" stroke-width="${w + 22}" fill="none" opacity=".2" filter="url(#tw-soft)"/>`));
  out.push(both((d) => `<path d="${d}" stroke="${c.cobble ? '#7d735a' : '#8e774e'}" stroke-width="${w + 7}" fill="none" filter="url(#tw-edge)"/>`));
  out.push(both((d) => `<path d="${d}" stroke="url(#${c.cobble ? 'tw-cobble' : 'tw-dirt'})" stroke-width="${w}" fill="none"/>`));
  if (!c.cobble) {
    out.push(both((d) => `<path d="${d}" stroke="#dcc794" stroke-width="${w * 0.42}" fill="none" opacity=".4" filter="url(#tw-soft2)"/>`));
    out.push(both((d) => `<path d="${d}" stroke="#7a6240" stroke-width="1.3" fill="none" stroke-dasharray="26 7 3 9" opacity=".35" transform="translate(0 ${-w * 0.2})"/><path d="${d}" stroke="#7a6240" stroke-width="1.3" fill="none" stroke-dasharray="19 9 5 8" opacity=".35" transform="translate(0 ${w * 0.2})"/>`));
  } else {
    out.push(both((d) => `<path d="${d}" stroke="#4f4630" stroke-width="2" fill="none" opacity=".35" transform="translate(0 ${w / 2})"/>`));
  }
  if (c.season === 3) out.push(both((d) => `<path d="${d}" stroke="#eef1ef" stroke-width="${w * 0.9}" fill="none" opacity=".22" stroke-dasharray="40 55" stroke-linecap="round"/>`));
  return out.join('');
}

/** Footpaths from each open plot to the nearest road. */
function footpaths(c) {
  const [cx, cy] = c.lay.c;
  const out = [];
  c.open.forEach(([fx, fy], i) => {
    const toH = Math.abs(fy - cy), toV = Math.abs(fx - cx);
    const fromX = fx, fromY = fy + 8;
    let end;
    if (toH < toV * 1.4) end = [fx + (i % 2 ? 6 : -6), cy];
    else end = [cx, fy + 10];
    const mid = [(fromX + end[0]) / 2 + (i % 2 ? 9 : -9), (fromY + end[1]) / 2];
    out.push(smoothPath([[fromX, fromY], mid, end]));
  });
  if (!out.length) return '';
  const d = out.join('');
  return `<path d="${d}" stroke="#1f2a14" stroke-width="22" fill="none" opacity=".16" filter="url(#tw-soft)"/><path d="${d}" stroke="#9a835a" stroke-width="13" fill="none" stroke-linecap="round" filter="url(#tw-edge)"/><path d="${d}" stroke="url(#tw-dirt)" stroke-width="10" fill="none" stroke-linecap="round"/>`;
}

function plazaGround(c) {
  const [cx, cy] = c.lay.c;
  const out = [];
  const k = c.kind;
  if (k === 'village') {
    out.push(`<ellipse cx="${cx}" cy="${cy + 2}" rx="${c.plazaR * 1.45}" ry="${c.plazaR * 0.86}" fill="${lighten(c.g0, 0.18)}" opacity=".75" filter="url(#tw-rough)"/>`);
    out.push(`<ellipse cx="${cx}" cy="${cy + 4}" rx="${c.plazaR * 1.1}" ry="${c.plazaR * 0.62}" fill="${lighten(c.g0, 0.1)}" opacity=".55" filter="url(#tw-soft)"/>`);
  } else if (k === 'farm') {
    out.push(`<ellipse cx="${cx}" cy="${cy + 16}" rx="124" ry="66" fill="url(#tw-yard)" filter="url(#tw-soft)"/>`);
    const r = rngFor('farmstraw');
    out.push(`<path d="${Array.from({ length: 44 }, () => { const a = r() * 6.28, d = r() * 0.9; const x = cx + Math.cos(a) * 110 * d, y = cy + 16 + Math.sin(a) * 52 * d; return `M${f1(x)} ${f1(y)}l${f1(r.range(-5, 5))} ${f1(r.range(-1.5, 1.5))}`; }).join('')}" stroke="#d6bd7a" stroke-width="1.1" opacity=".8"/>`);
  } else if (k === 'mine') {
    out.push(`<ellipse cx="${cx}" cy="${cy + 6}" rx="110" ry="58" fill="#5d5648" opacity=".55" filter="url(#tw-rough)"/>`);
    out.push(`<ellipse cx="${cx}" cy="${cy + 8}" rx="84" ry="42" fill="#4b453a" opacity=".5" filter="url(#tw-soft)"/>`);
  } else if (k === 'lodge') {
    out.push(`<ellipse cx="${cx}" cy="${cy + 8}" rx="96" ry="52" fill="#5b4a33" opacity=".5" filter="url(#tw-rough)"/>`);
    out.push(`<ellipse cx="${cx}" cy="${cy + 8}" rx="64" ry="34" fill="#9a8460" opacity=".5" filter="url(#tw-soft)"/>`);
  } else if (k === 'abbey') {
    out.push(`<ellipse cx="${cx}" cy="${cy + 8}" rx="108" ry="60" fill="${lighten(c.g0, 0.12)}" opacity=".7" filter="url(#tw-rough)"/>`);
  } else {
    const rx = c.cobble ? 96 : 66, ry = c.cobble ? 58 : 40;
    out.push(`<ellipse cx="${cx}" cy="${cy + 6}" rx="${rx + 14}" ry="${ry + 12}" fill="#1f2a14" opacity=".2" filter="url(#tw-soft)"/>`);
    out.push(`<ellipse cx="${cx}" cy="${cy + 4}" rx="${rx + 5}" ry="${ry + 4}" fill="${c.cobble ? '#7d735a' : '#8e774e'}" filter="url(#tw-edge)"/>`);
    out.push(`<ellipse cx="${cx}" cy="${cy + 4}" rx="${rx}" ry="${ry}" fill="url(#${c.cobble ? 'tw-cobble' : 'tw-dirt'})"/>`);
    out.push(`<ellipse cx="${cx - 12}" cy="${cy - 4}" rx="${rx * 0.7}" ry="${ry * 0.55}" fill="#fff4d6" opacity=".1" filter="url(#tw-soft)"/>`);
  }
  return out.join('');
}

// ---------- water: sea, river, quay ----------

function wavyEdge(c, y, amp, seed) {
  const { W } = c.lay;
  const r = rngFor(`${c.id}:${seed}`);
  const pts = [];
  for (let x = -700; x <= W + 700; x += 70) pts.push([x, y + Math.sin(x * 0.012 + seed.length) * amp + (r() - 0.5) * amp * 0.8]);
  return pts;
}

function seaGround(c) {
  const { W, H } = c.lay;
  const y = c.lay.shore;
  const pts = wavyEdge(c, y, 7, 'shore');
  const edge = smoothPath(pts);
  const out = [];
  const sand = mix('#cdbd92', c.g0, 0.25);
  // wet sand and shingle, the water, foam and a few wave strokes
  out.push(`<path d="${edge}L${W + 700} ${H + 600}L-700 ${H + 600}z" fill="${sand}" transform="translate(0 -12)" filter="url(#tw-edge)"/>`);
  out.push(`<path d="${edge}L${W + 700} ${H + 600}L-700 ${H + 600}z" fill="url(#tw-sea)" transform="translate(0 4)"/>`);
  out.push(`<path d="${edge}" stroke="#f3f1e4" stroke-width="3" fill="none" opacity=".75" transform="translate(0 5)" stroke-dasharray="26 12 8 10" filter="url(#tw-soft2)"/>`);
  const r = rngFor(`${c.id}:waves`);
  const w = [];
  for (let i = 0; i < 46; i++) {
    const x = r.range(-300, W + 300), yy = r.range(y + 22, y + 290);
    w.push(`M${f1(x)} ${f1(yy)}q${f1(8)} -4 ${f1(16)} 0t16 0`);
  }
  out.push(`<path d="${w.join('')}" stroke="#d9e4e4" stroke-width="1.5" fill="none" opacity=".5"/>`);
  return out.join('');
}

function abbeyCliff(c) {
  const { W, H } = c.lay;
  const y = c.lay.shore;
  const out = [];
  const pts = wavyEdge(c, y - 4, 10, 'cliff');
  const edge = smoothPath(pts);
  out.push(`<path d="${edge}L${W + 700} ${H + 600}L-700 ${H + 600}z" fill="url(#tw-sea)" transform="translate(0 22)"/>`);
  out.push(`<path d="${edge}L${W + 700} ${H + 600}L-700 ${H + 600}z" fill="#8a8470" transform="translate(0 12)" filter="url(#tw-edge)"/>`);
  out.push(`<path d="${edge}L${W + 700} ${H + 600}L-700 ${H + 600}z" fill="${mix('#7e786a', '#4d4a42', 0.4)}" transform="translate(0 20)" filter="url(#tw-edge)"/>`);
  out.push(`<path d="${edge}L${W + 700} ${H + 600}L-700 ${H + 600}z" fill="url(#tw-sea)" transform="translate(0 40)"/>`);
  out.push(`<path d="${edge}" stroke="#f3f1e4" stroke-width="3" fill="none" opacity=".7" transform="translate(0 40)" stroke-dasharray="20 14 9 11" filter="url(#tw-soft2)"/>`);
  const r = rngFor(`${c.id}:cliffrocks`);
  for (let i = 0; i < 16; i++) {
    const x = r.range(-200, W + 200), yy = y + r.range(40, 130);
    out.push(`<ellipse cx="${f1(x)}" cy="${f1(yy)}" rx="${f1(r.range(8, 20))}" ry="${f1(r.range(4, 8))}" fill="#6d6a5f" opacity=".8"/>`);
  }
  return out.join('');
}

function riverGround(c, where) {
  const { W, H } = c.lay;
  const y = where === 'top' ? 118 : c.lay.shore + 6;
  const pts = wavyEdge(c, y, 12, `river-${where}`);
  const e = smoothPath(pts);
  const width = 54;
  const out = [];
  out.push(`<path d="${e}" stroke="${mix('#8e774e', c.g0, 0.4)}" stroke-width="${width + 16}" fill="none" filter="url(#tw-edge)"/>`);
  out.push(`<path d="${e}" stroke="url(#tw-river)" stroke-width="${width}" fill="none"/>`);
  out.push(`<path d="${e}" stroke="#e8f0ee" stroke-width="2" fill="none" opacity=".4" stroke-dasharray="24 30" transform="translate(0 -9)"/><path d="${e}" stroke="#e8f0ee" stroke-width="2" fill="none" opacity=".35" stroke-dasharray="18 40" transform="translate(0 10)"/>`);
  // reeds on the bank
  const r = rngFor(`${c.id}:reeds`);
  const reeds = [];
  for (let i = 0; i < 40; i++) {
    const x = r.range(-60, W + 60);
    const yy = y + (r() < 0.5 ? -1 : 1) * (width / 2 + 2) + Math.sin(x * 0.012 + `river-${where}`.length) * 12;
    reeds.push(`M${f1(x)} ${f1(yy)}l${f1(-1.5)} -9M${f1(x + 2)} ${f1(yy)}l${f1(1.5)} -11M${f1(x + 4)} ${f1(yy)}l0 -8`);
  }
  out.push(`<path d="${reeds.join('')}" stroke="${darken(c.g1, 0.2)}" stroke-width="1.5" fill="none"/>`);
  return out.join('');
}

// ---------- fields, fences, walls ----------

function fieldsGround(c) {
  const { W, H } = c.lay;
  const n = { village: 7, farm: 8, town: 3, castle: 0, port: 0, abbey: 2, mine: 0, lodge: 0 }[c.kind] || 0;
  if (!n) return '';
  const r = rngFor(`${c.id}:fields`);
  const out = [];
  const boxes = [];
  const kinds = c.season === 3 ? [0, 0, 2] : c.season === 2 ? [2, 2, 0] : c.season === 0 ? [0, 1, 0] : [1, 1, 2];
  for (let tries = 0; tries < 120 && boxes.length < n; tries++) {
    const w = r.range(110, 180), h = r.range(44, 70);
    const x = r.range(-20, W - w + 20), y = r.range(120, H - h + 10);
    const cx = x + w / 2, cy = y + h / 2;
    if (blocked(c, cx, y + h, w, h + 10, 14)) continue;
    if (c.lay.shore && y + h > c.lay.shore - 10) continue;
    if (boxes.some(([bx, by, bw, bh]) => x < bx + bw + 14 && x + w + 14 > bx && y < by + bh + 14 && y + h + 14 > by)) continue;
    boxes.push([x, y, w, h]);
    const sk = r.range(-14, 14);
    const pts = `${f1(x + sk)},${f1(y)} ${f1(x + w + sk)},${f1(y + 3)} ${f1(x + w - sk)},${f1(y + h)} ${f1(x - sk)},${f1(y + h - 3)}`;
    const pat = r.pick(kinds);
    out.push(`<polygon points="${pts}" fill="#2d2415" opacity=".22" transform="translate(3 4)"/><polygon points="${pts}" fill="url(#tw-rows-${pat})" stroke="${darken(c.g1, 0.28)}" stroke-width="2.2" stroke-linejoin="round" filter="url(#tw-paint)"/>`);
  }
  c.fieldBoxes = boxes;
  return out.join('');
}

/** A wattle fence along a polyline: rails, posts and weave. */
export function fenceMarkup(pts, col = '#7c5d3b', hi = '#a58156', post = 8) {
  const rails = smoothPath(pts).replace(/C/g, 'L').replace(/^M/, 'M');
  const posts = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    const len = Math.hypot(bx - ax, by - ay);
    const n = Math.max(1, Math.round(len / 9));
    for (let k = 0; k <= n; k++) {
      const x = ax + ((bx - ax) * k) / n, y = ay + ((by - ay) * k) / n;
      posts.push(`M${f1(x)} ${f1(y + 1)}v${-post}`);
    }
  }
  const pl = pts.map((p) => p.join(' ')).join('L');
  return `<path d="M${pl}" stroke="#1f160c" stroke-width="3" fill="none" opacity=".25" transform="translate(1.5 2.5)"/><path d="M${pl}" stroke="${col}" stroke-width="2.2" fill="none" transform="translate(0 -2.5)"/><path d="M${pl}" stroke="${col}" stroke-width="2.2" fill="none" transform="translate(0 -5.5)"/><path d="${posts.join('')}" stroke="${hi}" stroke-width="2.4" stroke-linecap="round" fill="none"/>`;
}

const rectPts = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]];

/** Town walls with corner towers and a gate where each road crosses. */
function wallsGround(c) {
  const { x0, y0, x1, y1 } = c.lay.wall;
  const [cx, cy] = c.lay.c;
  const d = `M${x0} ${y0}H${x1}V${y1}H${x0}z`;
  const out = [];
  out.push(`<path d="${d}" stroke="#1f160c" stroke-width="18" fill="none" opacity=".25" transform="translate(2 5)" filter="url(#tw-soft2)"/>`);
  out.push(`<path d="${d}" stroke="#6f6754" stroke-width="15" fill="none" stroke-linejoin="round"/>`);
  out.push(`<path d="${d}" stroke="#b5ab92" stroke-width="11" fill="none" stroke-linejoin="round" transform="translate(0 -2)"/>`);
  out.push(`<path d="${d}" stroke="#cfc6ac" stroke-width="3" fill="none" stroke-linejoin="round" transform="translate(0 -6)" opacity=".7"/>`);
  out.push(`<path d="${d}" stroke="#a69c84" stroke-width="5" fill="none" stroke-dasharray="7 7" transform="translate(0 -9)"/>`);
  const towers = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]];
  const tw = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="4" cy="4" rx="26" ry="9" fill="#1d160d" opacity=".3"/><path d="M-15 4v-34h30v34z" fill="#a89e86"/><path d="M5 4v-34h10v34z" fill="#8b816b"/><path d="M-17 -28h34v-5l-5 -4h-4v4h-4v-4h-4v4h-4v-4h-4v4h-4v-4h-4z" fill="#b5ab92"/><path d="M-17 -30l17 -22 17 22z" fill="#5f6770"/><path d="M-17 -30l17 -22 6 0 -12 22z" fill="#79838c" opacity=".7"/><rect x="-2" y="-22" width="4" height="9" fill="#2a2118"/></g>`;
  const gates = [[cx, y0, 1.15], [cx, y1, 1.15], [x0, cy, 1.15], [x1, cy, 1.15]];
  out.push(towers.map(([x, y]) => tw(x, y + 8)).join(''));
  // gates: two stout towers either side of the road
  for (const [x, y] of gates) {
    const h = y === y0 || y === y1;
    const offs = h ? [[-30, 0], [30, 0]] : [[0, -30], [0, 30]];
    for (const [dx, dy] of offs) out.push(tw(x + dx, y + dy + 8, 0.85));
  }
  return out.join('');
}

// ---------- scattered trees, bushes, cottages ----------

function scatterTrees(c) {
  const { W, H } = c.lay;
  const r = rngFor(`${c.id}:trees`);
  const lvl = c.level;
  const wild = { village: 34 - lvl * 3, farm: 30 - lvl * 3, town: 22 - lvl * 2, castle: 20, port: 16, abbey: 30, mine: 9, lodge: 70 }[c.kind] || 20;
  const want = c.backdrop ? Math.round(wild * 0.55) : wild;
  const placed = [];
  const items = [];
  const pineRatio = { lodge: 0.9, mine: 0.4, abbey: 0.35, castle: 0.2 }[c.kind] ?? 0.12;
  for (let tries = 0; tries < want * 8 && placed.length < want; tries++) {
    const x = r.range(-30, W + 30);
    const y = r.range(112, H + 40);
    const t = r.pick(['oak0', 'oak1', 'oak2']);
    const isPine = r() < pineRatio;
    const s = r.range(0.8, 1.2) * (c.tall ? 1 : 1) * (isPine ? 1.05 : 1);
    const bw = 44 * s, bh = 62 * s;
    if (blocked(c, x, y, bw, bh, 4)) continue;
    if (c.fieldBoxes && c.fieldBoxes.some(([fx, fy, fw, fh]) => x > fx - 8 && x < fx + fw + 8 && y > fy && y - 10 < fy + fh + 16)) continue;
    if (c.lay.shore && (c.kind === 'port' || c.kind === 'abbey' || c.id === 'brod') && y > c.lay.shore - 26) continue;
    if (c.walls) {
      const w = c.lay.wall;
      // keep the wall free
      if (Math.abs(y - w.y0) < 20 || Math.abs(y - w.y1) < 20 || Math.abs(x - w.x0) < 24 || Math.abs(x - w.x1) < 24) continue;
    }
    if (placed.some(([px, py]) => Math.hypot(px - x, (py - y) * 1.6) < 30 * s)) continue;
    placed.push([x, y]);
    items.push({ y, svg: `<use href="#tw-${isPine ? 'pine' + (r() < 0.5 ? 0 : 1) : t}" transform="translate(${f1(x)} ${f1(y)}) scale(${f1(s)})"/>` });
    if (r() < 0.5) {
      const bx = x + r.range(-26, 26), by = y + r.range(2, 8);
      if (!blocked(c, bx, by, 24, 18, 2)) items.push({ y: by, svg: `<use href="#tw-bush" transform="translate(${f1(bx)} ${f1(by)}) scale(${f1(r.range(0.8, 1.1))})"/>` });
    }
  }
  // loose bushes, rocks, haystacks
  const extras = { village: 14, farm: 12, town: 8, castle: 6, port: 6, abbey: 10, mine: 14, lodge: 12 }[c.kind] || 8;
  for (let i = 0, got = 0; i < extras * 8 && got < extras; i++) {
    const x = r.range(-20, W + 20), y = r.range(118, H + 30);
    if (blocked(c, x, y, 26, 24, 2)) continue;
    if (c.lay.shore && y > c.lay.shore - 22) continue;
    got++;
    const rocky = c.kind === 'mine' || (c.kind === 'lodge' && r() < 0.4) || r() < 0.2;
    const hayOk = (c.kind === 'farm' || c.kind === 'village') && c.season !== 0 && r() < 0.35;
    items.push({ y, svg: `<use href="#tw-${hayOk ? 'hay' : rocky ? 'rock' : 'bush'}" transform="translate(${f1(x)} ${f1(y)}) scale(${f1(r.range(0.8, 1.2))})"/>` });
  }
  return items;
}

/** Little cottages along the roads: more of them with each level. */
function decorHouses(c) {
  const k = c.kind;
  const lvl = c.level;
  const want = { village: 2 + lvl * 2, farm: 0, town: 3 + lvl * 2, castle: 10, port: 2 + lvl * 2, abbey: 2, mine: 2 + lvl * 2, lodge: 1 + lvl * 2 }[k] || 0;
  if (!want) return { items: [], smokers: [] };
  const { W, H } = c.lay;
  const r = rngFor(`${c.id}:houses`);
  const items = [], smokers = [];
  const placed = [];
  const s = c.tall ? 0.62 : 0.66;
  const [cx, cy] = c.lay.c;
  for (let tries = 0; tries < 400 && placed.length < want; tries++) {
    const x = r.range(26, W - 26);
    const y = r.range(120, H - 30);
    const v = r.int(0, k === 'lodge' ? 4 : 3);
    const w = 56 * s, h = 70 * s;
    if (blocked(c, x, y, w + 6, h, 6)) continue;
    const dr = Math.min(distToLine(x, y, c.roadH), distToLine(x, y, c.roadV));
    if (dr > 170 && k !== 'lodge' && k !== 'mine') continue;
    if (c.lay.shore && y > c.lay.shore - 30) continue;
    if (c.fieldBoxes && c.fieldBoxes.some(([fx, fy, fw, fh]) => x > fx - 20 && x < fx + fw + 20 && y > fy && y - 30 < fy + fh + 14)) continue;
    if (c.walls) {
      const wl = c.lay.wall;
      if (Math.abs(y - wl.y0) < 24 || Math.abs(y - wl.y1) < 24 || Math.abs(x - wl.x0) < 30 || Math.abs(x - wl.x1) < 30) continue;
    }
    if (placed.some(([px, py]) => Math.abs(px - x) < w + 8 && Math.abs(py - y) < h * 0.9)) continue;
    placed.push([x, y]);
    const cot = cottage(k === 'lodge' ? 2 + (v % 2) : k === 'mine' ? 3 : v, s);
    const flip = x > cx ? -1 : 1;
    items.push({ y, svg: `<g transform="translate(${f1(x)} ${f1(y)})${flip < 0 ? ' scale(-1 1)' : ''}">${cot.svg}</g>` });
    if (r() < 0.65) smokers.push([x + cot.chimney[0] * flip, y + cot.chimney[1]]);
  }
  return { items, smokers };
}

// ---------- the ground layer as a whole ----------

export function groundMarkup(c) {
  const { W, H } = c.lay;
  const out = [];
  const painted = !!c.backdrop;
  if (painted) {
    out.push(backdropMarkup(c));
    c.plazaR = 0;
    c.fieldBoxes = [];
    if (c.kind === 'farm') out.push(fencesFor(c));
    return out.join('');
  } else {
    out.push(`<rect x="-800" y="-800" width="${W + 1600}" height="${H + 1600}" fill="url(#tw-ground)"/>`);
    out.push(terrainBlotches(c));
    out.push(`<rect x="-800" y="-800" width="${W + 1600}" height="${H + 1600}" filter="url(#tw-mottle)" opacity=".45" style="mix-blend-mode:multiply"/>`);
    out.push(skyAndHills(c));
  }
  c.plazaR = { village: 62, farm: 78, town: c.cobble ? 100 : 72, castle: 104, port: 84, abbey: 84, mine: 78, lodge: 64 }[c.kind] || 70;
  if (!painted) {
    if (c.kind === 'port') out.push(seaGround(c));
    if (c.kind === 'abbey') out.push(abbeyCliff(c));
    if (c.id === 'brod') out.push(riverGround(c, 'bottom'));
    if (c.id === 'zareci') out.push(riverGround(c, 'top'));
    out.push(fieldsGround(c));
    out.push(tufts(c));
    out.push(flowers(c));
    if (c.kind === 'mine') out.push(spoilHeaps(c));
    out.push(roadsMarkup(c));
    out.push(footpaths(c));
    out.push(plazaGround(c));
    if (c.id === 'brod') out.push(bridge(c));
  } else {
    c.fieldBoxes = [];
  }
  // fixed things stand in depth order: trees, cottages, haystacks, fences by foot position
  const stand = [...scatterTrees(c), ...decorHouses(c).items];
  stand.sort((a, b) => a.y - b.y);
  if (c.kind === 'farm' || c.kind === 'village') out.push(fencesFor(c));
  if (c.walls) out.push(wallsGround(c));
  out.push(`<g filter="url(#tw-paint)">${stand.map((s) => s.svg).join('')}</g>`);
  if (!painted) {
    // paper-and-brush grain over the whole ground, a touch of season colour
    out.push(`<rect x="-800" y="-800" width="${W + 1600}" height="${H + 1600}" filter="url(#tw-grain)" opacity=".5" style="mix-blend-mode:multiply"/>`);
  }
  return out.join('');
}

/** The painted map, the season's colour grading over it and, in winter, a white wash. */
function backdropMarkup(c) {
  const { W, H } = c.lay;
  const P = c.P;
  return `<image class="tw-backdrop" href="assets/towns/${c.id}.jpg" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>
    <rect class="tw-tint" width="${W}" height="${H}" fill="${P.tint.replace(/[\d.]+\)$/, (m) => `${(parseFloat(m) * 1.4).toFixed(2)})`)}" style="mix-blend-mode:${c.season === 3 ? 'screen' : c.season === 2 ? 'soft-light' : 'soft-light'}"/>
    ${c.season === 3 ? `<rect width="${W}" height="${H}" fill="#f2f6f8" opacity=".24" style="mix-blend-mode:screen"/>` : ''}`;
}

function fencesFor(c) {
  const [cx] = c.lay.c;
  const out = [];
  if (c.kind === 'farm') {
    const f = c.lay;
    for (const [x0, y0, x1, y1] of [f.paddock, f.sty]) out.push(fenceMarkup(rectPts(x0, y0, x1, y1)));
    if (!c.backdrop) {
      // the farmyard fence of the drawn farm, with a gap towards the road on both sides
      const hy = f.house[1];
      out.push(fenceMarkup([[cx - 134, hy - 62], [cx - 134, hy + 20], [cx - 30, hy + 20]]));
      out.push(fenceMarkup([[cx + 30, hy + 20], [cx + 134, hy + 20], [cx + 134, hy - 62]]));
      if (c.level >= 3) out.push(fenceMarkup([[cx - 134, hy - 62], [cx - 40, hy - 62]], '#6e5233', '#96744a'));
    }
  }
  return `<g filter="url(#tw-paint)">${out.join('')}</g>`;
}

function spoilHeaps(c) {
  const { W, H } = c.lay;
  const r = rngFor(`${c.id}:heaps`);
  const out = [];
  const spots = c.tall ? [[60, 300], [580, 560], [70, 700]] : [[60, 300], [940, 390], [210, 585], [800, 105]];
  for (const [x, y] of spots) {
    if (blocked(c, x, y, 70, 40, -10)) continue;
    const s = r.range(0.9, 1.4);
    out.push(`<g transform="translate(${x} ${y}) scale(${f1(s)})"><ellipse cx="4" cy="2" rx="46" ry="10" fill="#1d160d" opacity=".3"/><path d="M-44 0Q-20 -34 0 -38Q22 -32 46 0z" fill="#5b564c"/><path d="M-44 0Q-20 -34 0 -38Q-8 -14 -14 0z" fill="#7a7466" opacity=".8"/><path d="M-20 -8l6 -4M0 -20l5 3M18 -8l5 4M-6 -6l4 1" stroke="#2f2c27" stroke-width="2"/></g>`);
  }
  return out.join('');
}

function bridge(c) {
  const [cx] = c.lay.c;
  const y = c.lay.shore + 6;
  if (c.level < 3) {
    // a ford: stepping stones across the water
    return `<g>${Array.from({ length: 6 }, (_, i) => `<ellipse cx="${cx + (i % 2 ? 6 : -6)}" cy="${y - 22 + i * 9}" rx="8" ry="4.4" fill="#a8a392"/>`).join('')}</g>`;
  }
  return `<g transform="translate(${cx} ${y})"><rect x="-26" y="-34" width="52" height="68" fill="#1f160c" opacity=".25" transform="translate(3 5)"/><rect x="-24" y="-32" width="48" height="64" fill="#b2a78e"/><rect x="-24" y="-32" width="9" height="64" fill="#8f856f"/><rect x="15" y="-32" width="9" height="64" fill="#8f856f"/><rect x="-15" y="-32" width="30" height="64" fill="url(#tw-cobble)"/><path d="M-24 -34h48M-24 34h48" stroke="#cfc6ac" stroke-width="5"/></g>`;
}

// ---------- the front layer: centrepiece, yard, life ----------

const smokeAt = (x, y, delay = 0) => `<g class="tw-smoke" style="--d:${delay}s" transform="translate(${f1(x)} ${f1(y)})"><circle cx="0" cy="0" r="3.4"/><circle cx="3" cy="-8" r="4.4"/><circle cx="-1" cy="-17" r="5.4"/></g>`;
const flagAt = (x, y, col) => `<g transform="translate(${x} ${y})"><path d="M0 0v-30" stroke="#2a2118" stroke-width="2"/><path class="tw-flag" d="M0 -30h17l-5 5.5 5 5.5h-17z" fill="${col}"/></g>`;

function chapel(c, s = 1) {
  return `<g transform="scale(${s})"><ellipse cx="8" cy="3" rx="42" ry="8" fill="url(#tw-shadow)"/>
    <rect x="-24" y="-30" width="36" height="30" fill="#cdbf9d"/><rect x="2" y="-30" width="10" height="30" fill="#aa9d7e"/>
    <path d="M-28 -29L-6 -56L16 -29z" fill="#8e4a35"/><path d="M-28 -29L-6 -56L2 -56L-14 -29z" fill="#ad6444" opacity=".5"/>
    <rect x="8" y="-52" width="16" height="52" fill="#bfb18f"/><rect x="18" y="-52" width="6" height="52" fill="#9d9072"/>
    <path d="M5 -52L16 -74L27 -52z" fill="#5f6770"/><path d="M16 -74v-10M12 -80h8" stroke="#2a2118" stroke-width="2"/>
    <rect x="13" y="-44" width="6" height="10" fill="#3d3326"/><path d="M-16 0v-13a5 5 0 0 1 10 0v13z" fill="#4b3826"/><rect x="-20" y="-24" width="5" height="9" fill="#3d3326"/></g>`;
}

function well(s = 1) {
  return `<g transform="scale(${s})"><ellipse cx="3" cy="3" rx="19" ry="6" fill="url(#tw-shadow)"/>
    <path d="M-13 0v-9a13 5 0 0 1 26 0v9a13 5 0 0 1 -26 0z" fill="#a9a08a"/><ellipse cx="0" cy="-9" rx="13" ry="5" fill="#8f8671"/><ellipse cx="0" cy="-9" rx="9" ry="3.2" fill="#2b3a40"/>
    <path d="M-12 -9v-17M12 -9v-17" stroke="#5a4230" stroke-width="2.4"/><path d="M-16 -25L0 -36L16 -25z" fill="#8e4a35"/><path d="M0 -26v10" stroke="#3a2a1a" stroke-width="1"/><rect x="-2.5" y="-17" width="5" height="4.4" fill="#6e4e30"/></g>`;
}

function fountain(level) {
  const s = level >= 4 ? 1.15 : 1;
  return `<g transform="scale(${s})"><ellipse cx="4" cy="6" rx="52" ry="17" fill="url(#tw-shadow)"/>
    <ellipse cx="0" cy="2" rx="40" ry="17" fill="#8c8369"/><ellipse cx="0" cy="-2" rx="40" ry="17" fill="#b6ab90"/><ellipse cx="0" cy="-3" rx="34" ry="13.5" fill="#6f8b97"/>
    <ellipse cx="0" cy="-3" rx="26" ry="9" fill="#9bb4b9" opacity=".6"/>
    <ellipse class="tw-ripple" cx="0" cy="-3" rx="14" ry="5" fill="none" stroke="#e8f0ee" stroke-width="1.2"/><ellipse class="tw-ripple r2" cx="0" cy="-3" rx="22" ry="8" fill="none" stroke="#e8f0ee" stroke-width="1"/>
    <path d="M-5 -2v-24h10v24z" fill="#a89e86"/><path d="M-5 -2v-24h4v24z" fill="#c4baa1"/>
    <ellipse cx="0" cy="-27" rx="15" ry="5.5" fill="#b6ab90"/><ellipse cx="0" cy="-28" rx="11" ry="3.8" fill="#6f8b97"/>
    <path d="M0 -29q0 -14 -9 -8M0 -29q0 -16 0 -18M0 -29q0 -14 9 -8" stroke="#d6e4e6" stroke-width="1.8" fill="none" opacity=".85" class="tw-jet"/>
    <path d="M-1 -48l1 -7l1 7z" fill="#cfe0e2" opacity=".8"/></g>`;
}

function stall(col, s = 1) {
  return `<g transform="scale(${s})"><ellipse cx="4" cy="3" rx="24" ry="6" fill="url(#tw-shadow)"/>
    <rect x="-18" y="-12" width="36" height="12" fill="#6e4e30"/><rect x="-16" y="-10" width="32" height="5" fill="#c9b78b"/>
    <path d="M-18 -12v-24M18 -12v-24" stroke="#4b3826" stroke-width="2.2"/>
    <path d="M-22 -36h44l-4 11h-36z" fill="${col}"/><path d="M-22 -36h44l-1 3h-42z" fill="${lighten(col, 0.25)}" opacity=".6"/>
    <path d="M-14 -25v6M-6 -25v6M2 -25v6M10 -25v6" stroke="#ece1c3" stroke-width="3" opacity=".7"/>
    <circle cx="-9" cy="-8" r="2.6" fill="#b4472f"/><circle cx="-2" cy="-8" r="2.6" fill="#d8a650"/><circle cx="5" cy="-8" r="2.6" fill="#7f9a4f"/><circle cx="11" cy="-8" r="2.6" fill="#d8a650"/></g>`;
}

function keep(c) {
  return `<g><ellipse cx="6" cy="8" rx="92" ry="20" fill="url(#tw-shadow)"/>
    <rect x="-52" y="-62" width="104" height="66" fill="#aea48c"/><rect x="10" y="-62" width="42" height="66" fill="#8f856f"/>
    <path d="M-52 -62h104v-5h-6v-7h-8v7h-8v-7h-8v7h-8v-7h-8v7h-8v-7h-8v7h-8v-7h-8v7h-8v-7h-6z" fill="#aea48c"/>
    <rect x="-20" y="-120" width="40" height="124" fill="#b7ad95"/><rect x="2" y="-120" width="18" height="124" fill="#968c76"/>
    <path d="M-20 -120h40v-6h-6v-7h-6v7h-6v-7h-6v7h-6v-7h-6v7h-4z" fill="#b7ad95"/>
    ${[-62, 46].map((x) => `<g><rect x="${x}" y="-84" width="18" height="90" fill="#a39982"/><rect x="${x + 9}" y="-84" width="9" height="90" fill="#867c67"/><path d="M${x - 4} -84L${x + 9} -112L${x + 22} -84z" fill="#5f6770"/><path d="M${x - 4} -84L${x + 9} -112L${x + 12} -112L${x + 3} -84z" fill="#79838c" opacity=".7"/></g>`).join('')}
    <path d="M-11 4v-28a11 11 0 0 1 22 0v28z" fill="#241c14"/><path d="M-11 -10h22M-6 -24v34M0 -26v36M6 -24v34" stroke="#6f6754" stroke-width="1.3"/>
    <rect x="-3" y="-96" width="6" height="14" fill="#2a2118"/><rect x="-36" y="-44" width="6" height="12" fill="#2a2118"/><rect x="30" y="-44" width="6" height="12" fill="#2a2118"/>
    <rect x="-1.6" y="-94" width="3.2" height="9" fill="#f4b24e" class="tw-win"/><rect x="-35" y="-42" width="4" height="8" fill="#f4b24e" opacity=".8" class="tw-win"/>
    <path d="M0 -120v-24" stroke="#2a2118" stroke-width="2"/><path class="tw-flag" d="M0 -144h26l-8 8 8 8h-26z" fill="${C.roof}"/>
    ${flagAt(-53, -112, '#8e3f2b').replace('translate(-53 -112)', 'translate(-53 -112) scale(.8)')}${flagAt(53, -112, '#d8a650').replace('translate(53 -112)', 'translate(53 -112) scale(.8)')}</g>`;
}

function headframe() {
  return `<g><ellipse cx="4" cy="6" rx="46" ry="11" fill="url(#tw-shadow)"/>
    <path d="M-30 4L-12 -66M30 4L12 -66M-24 -18H24M-18 -42H18" stroke="#6e4e30" stroke-width="5" fill="none"/>
    <path d="M-12 -66H12" stroke="#5a4230" stroke-width="6"/><path d="M-9 -66L-8 4M9 -66L8 4" stroke="#8a6440" stroke-width="2.4"/>
    <g transform="translate(0 -70)"><circle r="12" fill="none" stroke="#4b3826" stroke-width="3.4"/><g class="tw-wheel"><path d="M-12 0H12M0 -12V12M-8.5 -8.5L8.5 8.5M-8.5 8.5L8.5 -8.5" stroke="#4b3826" stroke-width="2"/></g><circle r="3" fill="#2a2118"/></g>
    <rect x="-18" y="-12" width="36" height="16" fill="#5a4a36"/><path d="M-22 -12L0 -28L22 -12z" fill="#4a4a50"/><path d="M-22 4h44" stroke="#2a2118" stroke-width="2"/>
    <rect x="-5" y="-4" width="10" height="8" fill="#241c14"/></g>`;
}

function cart() {
  return `<g><ellipse cx="2" cy="3" rx="20" ry="5" fill="url(#tw-shadow)"/><path d="M-16 -3L-13 -13H13L16 -3z" fill="#6e4e30"/><path d="M-14 -4H14" stroke="#4b3826" stroke-width="1"/>
    <path d="M-12 -13q3 -9 12 -8q9 -1 12 8z" fill="#4b4640"/><circle cx="-9" cy="2" r="5" fill="none" stroke="#3a2a1a" stroke-width="2"/><circle cx="9" cy="2" r="5" fill="none" stroke="#3a2a1a" stroke-width="2"/></g>`;
}

function campfire() {
  return `<g><ellipse cx="2" cy="4" rx="40" ry="11" fill="url(#tw-shadow)"/>
    ${[[-30, 2], [-14, 10], [14, 10], [30, 2], [0, -8]].map(([x, y]) => `<path d="M${x - 8} ${y}l16 -3l0 5z" fill="#6e4e30" stroke="#3a2a1a" stroke-width="1"/>`).join('')}
    <ellipse cx="0" cy="0" rx="16" ry="6" fill="#2a2118"/><circle cx="0" cy="0" r="30" fill="url(#tw-glow)" opacity=".38" class="tw-fire-glow"/>
    <g class="tw-fire"><path d="M-9 0q-3 -12 3 -20q1 8 6 8q2 -8 8 -14q2 14 -2 26z" fill="#d9772f"/><path d="M-5 0q-2 -8 2 -13q1 5 4 5q1 -5 5 -8q1 9 -2 16z" fill="#f4b24e"/><path d="M-2 0q0 -5 2 -8q1 3 3 3q0 4 -1 5z" fill="#fff0b8"/></g></g>`;
}

function furRack() {
  return `<g><ellipse cx="2" cy="3" rx="22" ry="5" fill="url(#tw-shadow)"/><path d="M-18 2L-12 -34M18 2L12 -34M-14 -30H14M-16 -10H16" stroke="#5a4230" stroke-width="3.2" fill="none"/>
    <path d="M-12 -30q-4 12 0 22q8 4 12 -2q4 6 12 2q4 -10 0 -22z" fill="#9a6e48"/><path d="M-9 -26q4 10 2 18" stroke="#6e4a2e" stroke-width="1.2" fill="none"/></g>`;
}

function cloister(c) {
  const arcs = Array.from({ length: 9 }, (_, i) => `<path d="M${-66 + i * 14.6} -34v-10a5 5 0 0 1 10 0v10" fill="#2a2118" opacity=".55"/>`).join('');
  return `<g><ellipse cx="4" cy="8" rx="84" ry="24" fill="url(#tw-shadow)"/>
    <rect x="-74" y="-52" width="148" height="86" rx="3" fill="#a69c84"/><rect x="-74" y="-52" width="148" height="12" fill="#c4baa1"/><rect x="-60" y="-34" width="120" height="58" fill="${c.season === 3 ? '#c9d0c6' : '#8aa060'}"/>
    <rect x="-60" y="-34" width="120" height="58" fill="none" stroke="#7d7360" stroke-width="2"/>${arcs}
    <path d="M-60 -5H60M0 -34V24" stroke="#cdbf9d" stroke-width="6" opacity=".9"/>
    ${[[-40, -20], [40, -20], [-40, 12], [40, 12]].map(([x, y]) => `<rect x="${x - 15}" y="${y - 7}" width="30" height="14" rx="3" fill="#6f5a3a" opacity=".85"/><path d="M${x - 12} ${y}h24M${x - 8} ${y - 3}h16" stroke="${c.season === 3 ? '#d4d8d6' : '#7a9a4a'}" stroke-width="3" stroke-dasharray="3 3"/>`).join('')}
    <ellipse cx="0" cy="-5" rx="9" ry="4" fill="#9a928a"/><ellipse cx="0" cy="-6" rx="6" ry="2.4" fill="#6f8b97"/>
    <path d="M-4 -6v-14M4 -6v-14M-6 -22h12" stroke="#3a2a1a" stroke-width="2" opacity=".0"/></g>`;
}

function crane() {
  return `<g><ellipse cx="2" cy="4" rx="26" ry="7" fill="url(#tw-shadow)"/><path d="M-10 2L-6 -44M10 2L6 -44M-8 -20H8" stroke="#6e4e30" stroke-width="4" fill="none"/>
    <g class="tw-jib"><path d="M-4 -44L-34 -52M-4 -44L30 -40" stroke="#5a4230" stroke-width="4"/><path d="M-30 -52v18" stroke="#3a2a1a" stroke-width="1.4"/><rect x="-35" y="-34" width="10" height="8" fill="#8a6440"/></g></g>`;
}

function barrels(n = 3) {
  return Array.from({ length: n }, (_, i) => `<g transform="translate(${i * 11 - (n * 11) / 2} ${i % 2 ? -4 : 0})"><ellipse cx="2" cy="3" rx="8" ry="3" fill="#1d160d" opacity=".25"/><path d="M-5 0v-10q5 -2 10 0v10q-5 2 -10 0z" fill="#8a6440"/><path d="M-5 -6q5 2 10 0M-5 -2q5 2 10 0" stroke="#4b3826" stroke-width="1.3" fill="none"/></g>`).join('');
}

function boat(col = '#8a6440', sail = '#e6dcc0', s = 1) {
  return `<g transform="scale(${s})"><ellipse cx="2" cy="6" rx="28" ry="6" fill="#1d160d" opacity=".25"/><path d="M-26 -2q26 14 54 0l-6 9q-21 6 -42 0z" fill="${col}"/><path d="M-26 -2q26 14 54 0" stroke="#3a2a1a" stroke-width="1.4" fill="none"/>
    <path d="M0 -2V-44" stroke="#4b3826" stroke-width="2.4"/><path d="M2 -42Q24 -26 20 -6H2z" fill="${sail}"/><path d="M-2 -40Q-14 -24 -14 -6H-2z" fill="${darkSail(sail)}"/></g>`;
}
const darkSail = (c) => darken(c, 0.12);

function lighthouse() {
  return `<g><ellipse cx="4" cy="4" rx="26" ry="7" fill="url(#tw-shadow)"/><path d="M-12 4L-8 -58H8L12 4z" fill="#d8cfb6"/><path d="M-12 4L-8 -58H-2L-6 4z" fill="#f1e8cc" opacity=".6"/><path d="M-10 -30H10M-9 -46H9" stroke="#8e4a35" stroke-width="5"/>
    <rect x="-9" y="-70" width="18" height="12" fill="#3d3326"/><rect x="-6" y="-68" width="12" height="8" fill="#ffe9a6" class="tw-win"/><path d="M-12 -70L0 -82L12 -70z" fill="#5f6770"/></g>`;
}

function cabin(s = 1) {
  return cottage(2, s).svg;
}

/** Torches at the gates once the walls stand (the level makes them richer). */
function torches(c) {
  if (!c.walls || c.level < 3) return '';
  const { x0, y0, x1, y1 } = c.lay.wall;
  const [cx, cy] = c.lay.c;
  const at = c.level >= 4 ? [[cx - 44, y0 + 18], [cx + 44, y0 + 18], [cx - 44, y1 + 18], [cx + 44, y1 + 18], [x0 + 6, cy - 40], [x0 + 6, cy + 48], [x1 - 6, cy - 40], [x1 - 6, cy + 48]] : [[cx - 44, y0 + 18], [cx + 44, y0 + 18], [cx - 44, y1 + 18], [cx + 44, y1 + 18]];
  return at.map(([x, y]) => `<g transform="translate(${x} ${y})"><path d="M0 0v-14" stroke="#4b3826" stroke-width="2.4"/><circle cx="0" cy="-18" r="13" fill="url(#tw-glow)" class="tw-fire-glow"/><path class="tw-fire" d="M-3 -14q-1 -7 3 -11q1 4 3 4q1 -3 1 -4q2 7 -1 11z" fill="#f4b24e"/></g>`).join('');
}

/** What stands in the middle of the place, as y-sortable items (foot y included). */
export function centreItems(c, farmAnimals) {
  const [cx, cy] = c.lay.c;
  const L = c.level;
  const t = (x, y, inner, extra = '') => `<g class="tw-prop"${extra} transform="translate(${f1(x)} ${f1(y)})">${inner}</g>`;
  const items = [];
  const k = c.kind;
  if (c.backdrop && k !== 'farm') return items; // the painted map already has its squares, wells and quays
  const wall = (c.walls && c.level >= 3) ? true : false;
  if (k === 'village') {
    items.push({ y: cy + 8, svg: t(cx - 44, cy + 10, `<use href="#tw-lime" transform="scale(1.55)"/>`) });
    items.push({ y: cy + 14, svg: t(cx - 44, cy + 14, `<ellipse cx="0" cy="2" rx="30" ry="9" fill="none" stroke="#7a5a38" stroke-width="3" opacity=".9" transform="translate(0 -2)"/>`) });
    items.push({ y: cy + 10, svg: t(cx + 24, cy + 14, well(1)) });
    if (L >= 3) items.push({ y: cy - 16, svg: t(cx + 60, cy - 18, chapel(c, 0.74)) });
    if (L >= 2) items.push({ y: cy + 30, svg: t(cx + 14, cy + 34, `<g class="tw-goose">${[0, 1, 2].map((i) => `<ellipse cx="${i * 9 - 6}" cy="${i % 2}" rx="4.5" ry="3" fill="#f1ead8"/><path d="M${i * 9 - 3} ${i % 2 - 2}q3 -6 3 -8" stroke="#f1ead8" stroke-width="2" fill="none"/><circle cx="${i * 9 + 0.5}" cy="${i % 2 - 10}" r="1.4" fill="#f1ead8"/>`).join('')}</g>`) });
  } else if (k === 'town') {
    items.push({ y: cy + 12, svg: t(cx, cy + 12, fountain(L)) });
    const cols = ['#8e3f2b', '#d8a650', '#6f8a4a', '#5a6e7e'];
    const n = Math.min(4, 1 + Math.floor(L / 1.3));
    const spots = [[cx - 112, cy - 12], [cx + 112, cy - 12], [cx - 100, cy + 52], [cx + 100, cy + 52]];
    for (let i = 0; i < n; i++) items.push({ y: spots[i][1], svg: t(spots[i][0], spots[i][1], stall(cols[i], 0.88)) });
  } else if (k === 'castle') {
    items.push({ y: cy + 28, svg: t(cx, cy + 28, keep(c)) });
    items.push({ y: cy + 60, svg: t(cx - 62, cy + 46, `<g transform="scale(.7)">${stall('#8e3f2b', 1)}</g>`) });
  } else if (k === 'farm') {
    const [hx, hy, hw] = c.lay.house;
    const house = cottage(0, c.backdrop ? (hw * 1.05) / 52 : 1.7);
    items.push({ y: hy + 6, svg: t(hx, hy + 6, house.svg) });
    if (!c.backdrop) {
      items.push({ y: hy + 18, svg: t(hx - 86, hy + 16, well(0.9)) });
      items.push({ y: hy + 20, svg: t(hx + 88, hy + 18, cart()) });
      items.push({ y: hy - 2, svg: t(hx + 66, hy - 6, `<use href="#tw-hay" transform="scale(1.1)"/>`) });
      if (L >= 2) items.push({ y: hy - 2, svg: t(hx - 64, hy - 8, `<use href="#tw-bush" transform="scale(1.1)"/><use href="#tw-bush" transform="translate(-14 5)"/>`) });
    }
    c.chimney = [hx + house.chimney[0], hy + 6 + house.chimney[1]];
  } else if (k === 'abbey') {
    items.push({ y: cy + 20, svg: t(cx, cy + 20, cloister(c)) });
  } else if (k === 'mine') {
    items.push({ y: cy + 10, svg: t(cx, cy + 10, headframe()) });
    items.push({ y: cy + 36, svg: t(cx - 50, cy + 36, cart()) });
    items.push({ y: cy + 40, svg: t(cx + 56, cy + 40, `<use href="#tw-rock" transform="scale(1.3)"/>`) });
    c.chimney = [cx - 4, cy - 50];
  } else if (k === 'lodge') {
    items.push({ y: cy + 12, svg: t(cx, cy + 12, campfire()) });
    items.push({ y: cy + 24, svg: t(cx - 70, cy + 22, furRack()) });
    if (L >= 2) items.push({ y: cy + 26, svg: t(cx + 66, cy + 26, furRack()) });
    items.push({ y: cy + 34, svg: t(cx + 36, cy + 34, `<g transform="scale(.9)">${barrels(2)}</g>`) });
  } else if (k === 'port') {
    items.push({ y: cy + 16, svg: t(cx + 4, cy + 16, well(1)) });
    items.push({ y: cy + 36, svg: t(cx - 52, cy + 36, `<g transform="scale(.95)">${barrels(3)}</g>`) });
    items.push({ y: cy + 6, svg: t(cx + 70, cy - 6, crane()) });
  }
  // the quay and boats of a port, at the bottom of the scene
  if (k === 'port') {
    const y = c.lay.shore;
    const planks = `<g><rect x="${cx - 21}" y="${y - 24}" width="42" height="${c.tall ? 98 : 76}" fill="#1d160d" opacity=".3" transform="translate(3 4)"/><rect x="${cx - 20}" y="${y - 24}" width="40" height="${c.tall ? 98 : 76}" fill="#8a6a44"/>${Array.from({ length: c.tall ? 12 : 9 }, (_, i) => `<path d="M${cx - 20} ${y - 22 + i * 9}h40" stroke="#4b3826" stroke-width="1.2" opacity=".7"/>`).join('')}${[-20, 20].map((dx) => Array.from({ length: 6 }, (_, i) => `<circle cx="${cx + dx}" cy="${y - 14 + i * 14}" r="2.8" fill="#4b3826"/>`).join('')).join('')}</g>`;
    items.push({ y: y - 24, svg: planks });
    items.push({ y: y + 40, svg: t(cx - 78, y + 54, `<g class="tw-bob">${boat('#8a6440', '#e6dcc0', 0.9)}</g>`) });
    items.push({ y: y + 52, svg: t(cx + 84, y + 64, `<g class="tw-bob b2">${boat('#6e4e30', '#d9c58f', 0.82)}</g>`) });
    if (L >= 3) items.push({ y: y + 66, svg: t(cx - 190, y + 74, `<g class="tw-bob b3">${boat('#5e6670', '#e6dcc0', 0.75)}</g>`) });
    if (L >= 4) items.push({ y: y + 30, svg: t(c.lay.W - 90, y - 4, lighthouse()) });
    if (L >= 2) items.push({ y: y + 40, svg: t(cx + 220, y + 44, `<g class="tw-bob b2">${boat('#7a5232', '#e0d2a6', 0.7)}</g>`) });
  }
  if (k === 'abbey') {
    // a few seabirds over the cliff are in life()
  }
  void wall;
  return items;
}

/** Soft life on the scene: smoke, villagers walking the roads, birds. */
export function lifeMarkup(c, houses) {
  const out = [];
  const { W, H } = c.lay;
  const painted = c.backdrop;
  // chimney smoke from cottages and the farmhouse
  (houses?.smokers || []).slice(0, 8).forEach(([x, y], i) => out.push(smokeAt(x, y - 4, -i * 0.9)));
  if (c.chimney) out.push(smokeAt(c.chimney[0], c.chimney[1] - 2, 0));
  if (!c.reduced) {
    const r = rngFor(`${c.id}:folk`);
    // villagers walk along the roads, back and forth (on a painted map the roads are the painted ones, smaller up the picture)
    const base = { village: 3, farm: 1, town: 4, castle: 4, port: 4, abbey: 3, mine: 3, lodge: 2 }[c.kind] ?? 2;
    const people = base + Math.min(3, c.level - 1);
    const cols = ['#8e3f2b', '#5e6670', '#6f8a4a', '#a08550', '#7a5a8a', '#b4472f'];
    const routes = painted ? c.lay.roads : [c.roadH, c.roadV];
    for (let i = 0; i < people && routes.length; i++) {
      const road = routes[i % routes.length];
      const horiz = Math.abs(road[road.length - 1][0] - road[0][0]) > Math.abs(road[road.length - 1][1] - road[0][1]);
      const off = (r() - 0.5) * (c.lay.roadW * 0.5);
      const midV = road.reduce((a, p) => a + p[1], 0) / road.length;
      const s = painted ? 0.5 + (midV / H) * 0.85 : 1;
      const dur = Math.round(r.range(70, 120) * (road.length > 3 ? 1 : 0.8));
      const begin = -Math.round(r.range(0, dur));
      out.push(`<g class="tw-folk" transform="translate(${horiz ? 0 : off} ${horiz ? off * 0.5 : 0})"><g>${figure(r.pick(cols), r.pick(['#5b4330', '#3a2a1a', '#8a6440']), s)}<animateMotion dur="${dur}s" begin="${begin}s" repeatCount="indefinite" path="${smoothPath(road)}" keyPoints="0;1;0" keyTimes="0;.5;1" calcMode="linear"/></g></g>`);
    }
    // crows going round high above the scene
    const crows = Math.min(3, 1 + Math.floor(c.level / 2));
    for (let i = 0; i < crows; i++) {
      const rx = r.range(0.16, 0.3) * W, ry = r.range(0.04, 0.08) * H, ox = r.range(0.3, 0.7) * W, oy = (painted ? r.range(0.1, 0.2) : r.range(0.12, 0.22)) * H;
      const path = `M${f1(ox - rx)} ${f1(oy)}a${f1(rx)} ${f1(ry)} 0 1 1 ${f1(rx * 2)} 0a${f1(rx)} ${f1(ry)} 0 1 1 ${f1(-rx * 2)} 0`;
      out.push(`<g class="tw-crow">${crow(painted ? 0.9 : 1.1)}<animateMotion dur="${Math.round(r.range(34, 60))}s" begin="${-Math.round(r.range(0, 30))}s" repeatCount="indefinite" path="${path}"/></g>`);
    }
    if (c.kind === 'port' || c.kind === 'abbey') {
      for (let i = 0; i < 3; i++) {
        // gulls over the sea (on the left of the painted maps, along the bottom of the drawn one)
        const rx = painted ? r.range(40, 90) : r.range(120, 260), ry = painted ? r.range(14, 30) : r.range(18, 36);
        const ox = painted ? r.range(0.08, 0.2) * W : r.range(0.2, 0.8) * W;
        const oy = painted ? r.range(0.22, 0.5) * H : c.lay.shore + r.range(30, 110);
        const path = `M${f1(ox - rx)} ${f1(oy)}a${f1(rx)} ${f1(ry)} 0 1 1 ${f1(rx * 2)} 0a${f1(rx)} ${f1(ry)} 0 1 1 ${f1(-rx * 2)} 0`;
        out.push(`<g class="tw-crow gull">${crow(1.2).replace('#231c15', '#f1ede0')}<animateMotion dur="${Math.round(r.range(26, 44))}s" begin="${-Math.round(r.range(0, 20))}s" repeatCount="indefinite" path="${path}"/></g>`);
      }
    }
  } else {
    out.push(`<g transform="translate(${W * 0.62} ${H * 0.16})">${crow(1)}</g>`);
  }
  out.push(torches(c));
  return out.join('');
}

export function houseSmokers(c) {
  return decorHouses(c);
}

/** Particles of the season over the picture, as HTML spans. */
export function weatherMarkup(c) {
  if (c.reduced) return '';
  const r = rngFor(`${c.id}:wx`);
  const kind = ['petal', null, 'leaf', 'flake'][c.season];
  if (!kind) return '';
  const n = kind === 'flake' ? 26 : 10;
  return Array.from({ length: n }, () => `<i class="wx ${kind}" style="left:${f1(r.range(0, 100))}%;--s:${f1(r.range(0.6, 1.3))};--dur:${f1(r.range(kind === 'flake' ? 9 : 12, kind === 'flake' ? 17 : 22))}s;--del:${f1(-r.range(0, 20))}s;--dx:${f1(r.range(-60, 60))}px"></i>`).join('');
}

export { rect, poly, crenels, cabin, longhouse };
