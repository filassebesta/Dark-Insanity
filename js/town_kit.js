// Drawing kit shared by the settlement view (town.js) and its painted scene (town_scene.js):
// palette, seeded random numbers, colour mixing, and the small hand-drawn building parts.
// Everything is plain SVG markup in strings, centred on 0,0 unless said otherwise.

export const C = { wall: '#e6d6b0', wall2: '#d2bf93', stone: '#b7aa92', stone2: '#9d907a', roof: '#8e3f2b', roof2: '#6b4a35', slate: '#5e6670', wood: '#8a6440', wood2: '#6e4e30', green: '#6f8a4a', gold: '#d8a650', ink: '#3a2a1a', water: '#7f98a3' };

export const rect = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
export const poly = (pts, fill, extra = '') => `<polygon points="${pts}" fill="${fill}" ${extra}/>`;
export const gable = (x, y, w, h, fill) => poly(`${x - 4},${y} ${x + w / 2},${y - h} ${x + w + 4},${y}`, fill);
export const hip = (x, y, w, h, fill) => poly(`${x - 4},${y} ${x + 8},${y - h} ${x + w - 8},${y - h} ${x + w + 4},${y}`, fill);
export const door = (cx, y, w = 9, h = 13) => `<path d="M${cx - w / 2} ${y}v-${h - w / 2}a${w / 2} ${w / 2} 0 0 1 ${w} 0v${h - w / 2}z" fill="${C.wood2}"/>`;
export const win = (x, y, w = 6, h = 8) => rect(x, y, w, h, '#3d3326');
export const cross = (x, y, s = 7) => `<path d="M${x} ${y}v-${s * 2}M${x - s * 0.7} ${y - s * 1.35}h${s * 1.4}" stroke="${C.ink}" stroke-width="2.4" fill="none"/>`;
export const crenels = (x, y, w, n, fill) => Array.from({ length: n }, (_, i) => rect(x + (i * w) / n, y - 6, w / n / 2, 6, fill)).join('');
export const tree = (x, y, r = 12, fill = C.green) => `${rect(x - 2, y, 4, 9, C.wood2)}<circle cx="${x}" cy="${y - 2}" r="${r}" fill="${fill}"/>`;
export const pine = (x, y, s = 1) => poly(`${x},${y - 30 * s} ${x - 12 * s},${y} ${x + 12 * s},${y}`, '#4d6440') + rect(x - 2 * s, y, 4 * s, 6 * s, C.wood2);
export const smoke = (x, y) => `<g class="b-smoke"><circle cx="${x}" cy="${y}" r="4"/><circle cx="${x + 4}" cy="${y - 8}" r="5"/><circle cx="${x + 1}" cy="${y - 17}" r="6"/></g>`;
export const flag = (x, y, fill = C.roof) => `<path d="M${x} ${y}v-26" stroke="${C.ink}" stroke-width="2"/><path class="b-flag" d="M${x} ${y - 26}h16l-5 5 5 5h-16z" fill="${fill}"/>`;

export function house(x, y, w, h, roofH, roofFill = C.roof, wall = C.wall) {
  return `${rect(x, y - h, w, h, wall)}${gable(x, y - h, w, roofH, roofFill)}${door(x + w / 2, y)}`;
}

// ---------- seeded random numbers (a settlement always looks the same) ----------

export function rngFor(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = (Math.imul(h ^ (h >>> 16), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0;
  const next = () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const r = () => next();
  r.range = (lo, hi) => lo + next() * (hi - lo);
  r.pick = (arr) => arr[Math.floor(next() * arr.length) % arr.length];
  r.int = (lo, hi) => Math.floor(lo + next() * (hi - lo + 1));
  return r;
}

// ---------- colour ----------

const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const toHex = (a) => `#${a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
/** Mixes colour a towards colour b by t (0..1). */
export const mix = (a, b, t) => { const x = hex(a), y = hex(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)); };
export const lighten = (c, t) => mix(c, '#fff4d6', t);
export const darken = (c, t) => mix(c, '#1d160d', t);

// ---------- geometry ----------

/** A smooth path (Catmull-Rom as cubic Beziers) through the points. */
export function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

/** Distance from point to a polyline. */
export function distToLine(x, y, pts) {
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    const dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
    best = Math.min(best, Math.hypot(x - (ax + t * dx), y - (ay + t * dy)));
  }
  return best;
}

export const f1 = (n) => Math.round(n * 10) / 10;

// ---------- sprites for the scene (foot of each sprite at 0,0) ----------

/** A village cottage: variant 0 thatched timber, 1 red tiles, 2 half-timbered, 3 stone with slate. Returns { svg, chimney: [x, y] }. */
export function cottage(v, s = 1) {
  const W = 52, Hh = 26;
  const walls = ['#d8c79c', '#e0d1ac', '#e3d6b4', '#bdb29b'][v % 4];
  const wallDark = ['#b8a67c', '#bfae86', '#c2b48d', '#9d9380'][v % 4];
  const roof = ['#a98f52', '#9b4a32', '#7a5a3c', '#5f6770'][v % 4];
  const roofLight = ['#c3a964', '#b9603f', '#94704a', '#79838c'][v % 4];
  const roofDark = ['#7f6a3c', '#73352a', '#5a422d', '#464d55'][v % 4];
  const x0 = -W / 2;
  const beams = v % 4 === 2
    ? `<path d="M${x0 + 2} ${-Hh}h${W - 4}M${x0 + 16} ${-Hh}v${Hh}M${x0 + 36} ${-Hh}v${Hh}M${x0 + 16} ${-Hh}l20 ${Hh}M${x0 + 36} ${-Hh}l-20 ${Hh}" stroke="#5b4330" stroke-width="2" fill="none"/>`
    : '';
  const tiles = Array.from({ length: 4 }, (_, i) => `<path d="M${x0 - 3 + i * 3} ${-Hh - 4 - i * 5}h${W + 6 - i * 6}" stroke="${roofDark}" stroke-width="1" opacity=".55"/>`).join('');
  const svg = `<g class="cot" transform="scale(${s})">
    <ellipse class="sh" cx="10" cy="3" rx="${W / 2 + 12}" ry="6" fill="#1d160d" opacity=".25"/>
    <rect x="${x0}" y="${-Hh}" width="${W}" height="${Hh}" fill="${walls}"/>
    <rect x="${x0 + W - 12}" y="${-Hh}" width="12" height="${Hh}" fill="${wallDark}" opacity=".55"/>
    ${beams}
    <rect x="${x0 + 5}" y="-16" width="7" height="8" fill="#3d3326"/><rect x="${x0 + W - 24}" y="-16" width="7" height="8" fill="#3d3326"/>
    <path d="M-4 0v-13a4 4 0 0 1 8 0v13z" fill="#5b4330"/>
    <path d="M${x0 - 5} ${-Hh + 1}L${x0 + 9} ${-Hh - 26}L${x0 + W - 9} ${-Hh - 26}L${x0 + W + 5} ${-Hh + 1}z" fill="${roof}"/>
    <path d="M${x0 - 5} ${-Hh + 1}L${x0 + 9} ${-Hh - 26}L${x0 + 22} ${-Hh - 26}L${x0 + 10} ${-Hh + 1}z" fill="${roofLight}" opacity=".5"/>
    ${tiles}
    <path d="M${x0 - 5} ${-Hh + 1}L${x0 + 9} ${-Hh - 26}L${x0 + W - 9} ${-Hh - 26}L${x0 + W + 5} ${-Hh + 1}" fill="none" stroke="${roofDark}" stroke-width="1.5"/>
    <rect x="${x0 + W - 22}" y="${-Hh - 36}" width="8" height="16" fill="#8c8068"/><rect x="${x0 + W - 23}" y="${-Hh - 38}" width="10" height="3" fill="#6f6552"/>
  </g>`;
  return { svg, chimney: [(x0 + W - 18) * s, (-Hh - 38) * s] };
}

/** A long barn / warehouse-like outbuilding (town edge): flat gable seen from the front. */
export function longhouse(s = 1) {
  return `<g transform="scale(${s})"><ellipse cx="8" cy="3" rx="46" ry="6" fill="#1d160d" opacity=".25"/>
    <rect x="-38" y="-22" width="76" height="22" fill="#cdbd94"/><rect x="26" y="-22" width="12" height="22" fill="#a9996f" opacity=".6"/>
    <path d="M-43 -21L-30 -44H30L43 -21z" fill="#8e4a35"/><path d="M-43 -21L-30 -44H-18L-30 -21z" fill="#ad6444" opacity=".5"/>
    <rect x="-8" y="-14" width="16" height="14" fill="#5b4330"/><rect x="-30" y="-15" width="6" height="7" fill="#3d3326"/><rect x="24" y="-15" width="6" height="7" fill="#3d3326"/></g>`;
}

/** A tiny walking figure (about 14 px tall). */
export function figure(col = '#8e3f2b', hat = '#5b4330', s = 1) {
  return `<g transform="scale(${s})"><ellipse cx="0" cy="0" rx="4.5" ry="1.8" fill="#1d160d" opacity=".3"/>
    <path d="M-3 0L-2.2 -8h4.4L3 0z" fill="${col}"/><circle cx="0" cy="-10.2" r="2.4" fill="#d9b48f"/><path d="M-3 -10.4q3 -4.6 6 0z" fill="${hat}"/></g>`;
}

export function crow(s = 1) {
  return `<g transform="scale(${s})"><path class="crow-wing" d="M-7 0q3.5 -4.5 7 0q3.5 -4.5 7 0q-3.5 1.6 -7 .6q-3.5 1 -7 -.6z" fill="#231c15"/></g>`;
}
