// Interactive hand-drawn kingdom map (SVG). Geometry lives in a 1000x700
// coordinate space; zoom/pan works by animating the SVG viewBox.

import { TERRAIN_DEFS } from './data.js';
import { ICONS } from './icons.js';
import { esc } from './ui.js';

const W = 1000;
const H = 700;
const MIN_VIEW_W = 280;

// ---------- static geography ----------

const PROVINCES = {
  'pobrezni-mark': {
    label: 'Pobřežní Mark',
    subtitle: 'Přímořské marky',
    color: '#7f9097',
    points: [[150, 120], [260, 90], [330, 150], [350, 260], [320, 380], [280, 470], [200, 520], [140, 480], [120, 380], [135, 250]],
    labelAt: [240, 212], smokeAt: [272, 400], garrisonAt: [262, 285],
    text: 'Větrné pobřeží s jediným námořním přístavem. Kupci sem přivážejí sůl, víno a zprávy z ciziny — a s nimi i cizí nemoci.',
  },
  'zelezny-hreben': {
    label: 'Železný Hřeben',
    subtitle: 'Hornické panství',
    color: '#8c8378',
    points: [[260, 90], [380, 50], [520, 40], [650, 60], [720, 110], [690, 190], [600, 210], [500, 200], [420, 190], [330, 150]],
    labelAt: [612, 146], smokeAt: [400, 138], garrisonAt: [442, 166],
    text: 'Horský hřbet bohatý na železnou rudu. Odsud pochází železo pro meče královského vojska. Horníci jsou hrdí a snadno se bouří.',
  },
  'sokoli-hvozd': {
    label: 'Sokolí Hvozd',
    subtitle: 'Hraniční prales',
    color: '#6f7f55',
    points: [[720, 110], [820, 140], [880, 230], [890, 360], [850, 470], [760, 500], [680, 450], [650, 350], [640, 260], [690, 190]],
    labelAt: [778, 448], smokeAt: [722, 392], garrisonAt: [836, 392],
    text: 'Hluboký prales na východní hranici. Žijí tu myslivci a uhlíři — a lapkové, kteří na lesních stezkách číhají na pocestné.',
  },
  capital: {
    label: 'Vlčí Úděl',
    subtitle: 'Korunní země',
    color: '#c9a76a',
    points: [[330, 150], [420, 190], [500, 200], [600, 210], [690, 190], [640, 260], [650, 350], [600, 400], [500, 420], [400, 400], [320, 380], [350, 260]],
    labelAt: [482, 256], smokeAt: [410, 330], garrisonAt: [552, 282],
    text: 'Srdce království. Úrodné pláně kolem královského hradu, odkud vede Královská cesta na všechny strany. Kdo drží Vlčí Úděl, drží korunu.',
  },
  brodna: {
    label: 'Brodná',
    subtitle: 'Obilnice království',
    color: '#a7a86a',
    points: [[320, 380], [400, 400], [500, 420], [600, 400], [650, 350], [680, 450], [760, 500], [700, 580], [580, 630], [440, 640], [320, 600], [250, 540], [200, 520], [280, 470]],
    labelAt: [420, 556], smokeAt: [352, 482], garrisonAt: [500, 600],
    text: 'Obilnice království. Řeka Brodnice tu tvoří jediný bezpečný brod a trhové město Brod žije z obchodu se zrnem.',
  },
};

const COAST = [[150, 120], [135, 250], [120, 380], [140, 480], [200, 520], [250, 540], [320, 600], [440, 640], [580, 630], [700, 580], [760, 500], [850, 470]];
const SEA = [[0, 0], [190, 0], ...COAST, [1000, 560], [1000, 700], [0, 700]];
const RIVER = [[585, 45], [562, 130], [546, 215], [566, 300], [596, 395], [590, 470], [600, 512], [560, 575], [522, 650]];

const FEATURES = {
  capital: { name: 'Hrad Vlčí Úděl', kind: 'Královské sídlo', icon: 'castle', at: [480, 300], province: 'capital', text: 'Sídlo koruny a dvora. Tady se rozhoduje o osudu království.' },
  brod: { name: 'Brod', kind: 'Trhové město', icon: 'town', at: [602, 524], province: 'brodna', text: 'Město u jediného brodu přes Brodnici. Každý podzim tu probíhá velký trh se zrnem.' },
  port: { name: 'Přístav Mark', kind: 'Námořní přístav', icon: 'port', at: [196, 332], province: 'pobrezni-mark', text: 'Jediný přístav království. Clo z lodí plní pokladnu, ale přístavní čtvrti jsou neklidné.' },
  mine: { name: 'Železná Huť', kind: 'Doly a hutě', icon: 'mine', at: [500, 122], province: 'zelezny-hreben', text: 'Doly na železnou rudu a kovárny, které zásobují královské vojsko zbraněmi.' },
  lodge: { name: 'Sokolov', kind: 'Myslivecká osada', icon: 'lodge', at: [780, 330], province: 'sokoli-hvozd', text: 'Poslední osada před hlubokým hvozdem. Kdo jde lesní stezkou dál na sever, je odsud sám.' },
  toll: { name: 'Mýtnice', kind: 'Strážnice na obchodní cestě', icon: 'toll', at: [690, 190], province: 'zelezny-hreben', text: 'Strážnice v sedle mezi horami a hvozdem. Bezpečný průchod — za mýto a čekání.' },
  abbey: { name: 'Klášter na útesu', kind: 'Klášter', icon: 'abbey', at: [214, 448], province: 'pobrezni-mark', text: 'Starý klášter nad mořem. Opat má vliv na víru celého pobřeží.' },
  vassal: { name: 'Orlí Stráž', kind: 'Sídlo vzdáleného vazala', icon: 'vassal', at: [935, 74], province: null, text: 'Hrad vazala za severovýchodní hranicí. Vedou k němu tři cesty — každá s jiným nebezpečím.' },
};

const ROADS = [
  [[480, 300], [400, 312], [300, 326], [196, 332]],
  [[480, 300], [505, 380], [560, 452], [602, 524]],
  [[196, 332], [205, 400], [214, 448]],
];

const ROUTES = {
  forest: { points: [[480, 300], [590, 318], [700, 320], [780, 330], [845, 255], [892, 165], [930, 84]], color: '#9c4a31', dash: '3 6' },
  mountain: { points: [[480, 300], [470, 222], [500, 122], [580, 96], [700, 72], [820, 58], [930, 74]], color: '#a8823f', dash: '10 6' },
  traderoute: { points: [[480, 300], [560, 256], [640, 216], [690, 190], [760, 150], [850, 106], [930, 78]], color: '#5f7a43', dash: '14 5 2 5' },
};

const ROUTE_TEXT = {
  forest: 'Nejkratší cesta k Orlí Stráži vede hlubokým Sokolím hvozdem. Les je ale plný lapků.',
  mountain: 'Stezka přes Železný Hřeben kolem dolů. Kratší než obchodní cesta, ale sesuvy a mráz zdrží každého.',
  traderoute: 'Udržovaná obchodní cesta sedlem přes Mýtnici. Nejbezpečnější, ale pomalá — mýto a čekání na karavany.',
};

const FEATURE_ICONS = {
  castle: '<path d="M-11 9V-3h4v-5h3v5h8v-5h3v5h4V9z"/><path d="M-11 -3l2-3 2 3M7 -3l2-3 2 3M-2 -8l2-4 2 4"/><path d="M-2 9V3h4v6"/>',
  town: '<path d="M-10 8V0l5-5 5 5v8zM0 8V-2l5-4 5 4v10z"/><path d="M-6 8V3h2v5"/>',
  port: '<circle cx="0" cy="-7" r="2.6"/><path d="M0 -4.4V9M-5 -1h10M-9 3c1 4 5 6 9 6s8-2 9-6"/>',
  mine: '<path d="M-9 8l10-10M-8 -4c4-4 10-4 14 0"/><path d="M2 -1l7 9"/>',
  lodge: '<path d="M-10 8V1l7-6 7 6v7z"/><path d="M7 8V-4l3-5 3 5z" transform="translate(-2 0)"/>',
  toll: '<path d="M-8 9V-6h7v15M-1 -2h11"/><path d="M-8 -6l3.5-4 3.5 4"/>',
  abbey: '<path d="M-9 9V0h6v-6l3-3 3 3v6h6v9z"/><path d="M0 -14v5M-2 -12h4"/>',
  vassal: '<path d="M-10 9V-2h4v-4h3v4h6v-4h3v4h4V9z"/><path d="M3 -6v-9l7 3-7 3"/>',
};

const LAYERS = [
  { key: 'loyalty', label: 'Věrnost' },
  { key: 'unrest', label: 'Nepokoje' },
  { key: 'garrison', label: 'Posádky' },
  { key: 'routes', label: 'Cesty' },
];

// ---------- helpers ----------

function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function inPolygon([x, y], poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function smoothPath(pts) {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

const polyPoints = (pts) => pts.map((p) => p.join(',')).join(' ');

function bounds(pts) {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}

function mix(a, b, t) {
  const pa = a.match(/\w\w/g).map((h) => parseInt(h, 16));
  const pb = b.match(/\w\w/g).map((h) => parseInt(h, 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

const exclusionZones = [
  ...Object.values(FEATURES).map((f) => ({ at: f.at, r: 30 })),
  ...Object.values(PROVINCES).map((p) => ({ at: p.labelAt, r: 46, wide: true })),
];

function freeSpot([x, y]) {
  return exclusionZones.every(({ at, r, wide }) => {
    const dx = (x - at[0]) / (wide ? 2.2 : 1);
    const dy = y - at[1];
    return dx * dx + dy * dy > r * r;
  });
}

function scatter(poly, count, seed, minDist) {
  const rnd = mulberry32(seed);
  const b = bounds(poly);
  const pts = [];
  let tries = 0;
  while (pts.length < count && tries < count * 60) {
    tries++;
    const p = [b.x + rnd() * b.w, b.y + rnd() * b.h];
    if (!inPolygon(p, poly) || !freeSpot(p)) continue;
    if (pts.some((q) => (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2 < minDist * minDist)) continue;
    pts.push(p);
  }
  return pts.sort((a, b2) => a[1] - b2[1]);
}

// ---------- static terrain (computed once) ----------

const TERRAIN_SVG = (() => {
  const trees = scatter(PROVINCES['sokoli-hvozd'].points, 95, 11, 15)
    .concat(scatter([[650, 350], [680, 450], [760, 500], [700, 560], [640, 470]], 12, 5, 15));
  const peaks = scatter(PROVINCES['zelezny-hreben'].points, 34, 23, 24);
  const fields = scatter(PROVINCES.brodna.points, 13, 41, 46).concat(scatter(PROVINCES.capital.points, 8, 43, 50));
  const hills = scatter(PROVINCES['pobrezni-mark'].points, 12, 61, 34);

  const tree = ([x, y], i) => i % 3 === 0
    ? `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><circle cx="0" cy="-5" r="5.4" class="t-crown"/><path d="M0 0v4" class="t-trunk"/></g>`
    : `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><path d="M0 -11l5.5 9h-3l4 6h-13l4-6h-3z" class="t-conifer"/></g>`;
  const peak = ([x, y], i) => {
    const s = 0.85 + (i % 4) * 0.12;
    return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s})"><path d="M-14 8L-2 -12L4 -3L7 -7L16 8z" class="p-body"/><path d="M-2 -12L1 -2M4 -3l2 5M-2 -12l-3 6" class="p-shade"/></g>`;
  };
  const field = ([x, y], i) => {
    const rot = (i * 37) % 60 - 30;
    const lines = [0, 4, 8, 12].map((o) => `<path d="M-14 ${o - 6}h28"/>`).join('');
    return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot})" class="field">${lines}</g>`;
  };
  const hill = ([x, y]) => `<path transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" d="M-12 4c4-8 10-8 14 0M-2 4c3-5 7-5 10 0" class="hill"/>`;

  return `
    <g class="map-terrain">
      ${fields.map(field).join('')}
      ${hills.map(hill).join('')}
      ${peaks.map(peak).join('')}
      ${trees.map(tree).join('')}
    </g>`;
})();

// ---------- runtime state ----------

let host = null;
let svg = null;
let state = null;
let options = {};
let view = { x: 0, y: 0, w: W, h: H };
let animFrame = null;
let selected = null;
const layers = { loyalty: false, unrest: true, garrison: false, routes: false };
let drag = null;
let suppressClick = false;

export function isMapOpen() {
  return host && host.classList.contains('open');
}

export function openMap(gameState, opts = {}) {
  state = gameState;
  options = opts;
  host = document.getElementById('map-view');
  if (opts.layer) layers[opts.layer] = true;
  render();
  host.classList.add('open');
  host.setAttribute('aria-hidden', 'false');
  selected = null;
  view = { x: 0, y: 0, w: W, h: H };
  applyView();
  if (opts.focusRoutes) {
    selectThing({ type: 'feature', id: 'vassal' });
    animateTo(fitBox({ x: 460, y: 40, w: 500, h: 320 }));
  } else {
    showOverview();
  }
}

export function closeMap() {
  if (host) {
    host.classList.remove('open');
    host.setAttribute('aria-hidden', 'true');
  }
  hideTooltip();
}

// ---------- rendering ----------

function render() {
  host.querySelector('.map-layer-toggles').innerHTML = LAYERS.map((l) =>
    `<button class="map-toggle${layers[l.key] ? ' on' : ''}" data-layer="${l.key}">${l.label}</button>`).join('');

  const canvas = host.querySelector('.map-canvas');
  canvas.innerHTML = `
    <svg class="map-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Mapa království">
      <defs>
        <pattern id="map-paper" patternUnits="userSpaceOnUse" width="320" height="320">
          <image href="assets/ui/parchment_bg.png" width="320" height="320"/>
        </pattern>
        <pattern id="map-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
          <path d="M0 0v7" stroke="#3b2f22" stroke-width=".8" opacity=".28"/>
        </pattern>
        <filter id="map-rough" x="-3%" y="-3%" width="106%" height="106%">
          <feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="7" result="n"/>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
        <filter id="map-blur" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="7"/></filter>
        <radialGradient id="map-vignette" cx="50%" cy="50%" r="70%">
          <stop offset="60%" stop-color="#2a1d10" stop-opacity="0"/>
          <stop offset="100%" stop-color="#2a1d10" stop-opacity=".45"/>
        </radialGradient>
      </defs>

      <rect x="-200" y="-200" width="${W + 400}" height="${H + 400}" fill="url(#map-paper)"/>
      <rect x="-200" y="-200" width="${W + 400}" height="${H + 400}" fill="url(#map-hatch)" opacity=".5"/>
      <polygon class="map-sea" points="${polyPoints(SEA)}"/>
      ${seaDecorations()}

      <g class="map-land" filter="url(#map-rough)">
        ${Object.entries(PROVINCES).map(([id, p]) => provincePolygon(id, p)).join('')}
        <path class="map-coast" d="M${polyPoints(COAST).replace(/ /g, ' L')}"/>
      </g>

      ${TERRAIN_SVG}
      <path class="map-river" d="${smoothPath(RIVER)}" id="map-river-path"/>
      <text class="map-natural"><textPath href="#map-river-path" startOffset="18%">Brodnice</textPath></text>

      <g class="map-roads">${ROADS.map((r) => `<path d="${smoothPath(r)}"/>`).join('')}</g>
      <g class="map-routes${layers.routes ? ' show' : ''}">${Object.entries(ROUTES).map(([key, r]) => routePath(key, r)).join('')}</g>
      <g class="map-features">${Object.entries(FEATURES).map(([id, f]) => featureMarker(id, f)).join('')}</g>
      <g class="map-overlays">${overlays()}</g>
      <g class="map-labels">${Object.entries(PROVINCES).map(([id, p]) => provinceLabel(id, p)).join('')}</g>

      <text class="map-natural sea-label" x="640" y="672">Šedé moře</text>
      <text class="map-natural" x="60" y="200" transform="rotate(-80 60 200)">Šedé moře</text>
      <text class="map-foreign" x="950" y="340" transform="rotate(90 950 340)">Východní marky</text>
      <text class="map-foreign" x="760" y="26">Severní pustiny</text>
      ${compass(930, 628)}
      ${cartouche()}
    </svg>
    <div class="map-tooltip" hidden></div>
    <div class="map-zoom">
      <button class="icon-button" data-zoom="in" aria-label="Přiblížit">+</button>
      <button class="icon-button" data-zoom="out" aria-label="Oddálit">−</button>
      <button class="icon-button" data-zoom="reset" aria-label="Celá mapa">⤢</button>
    </div>
    <div class="map-hint">Kolečkem přibližuj · táhni pro posun · klikni na místo</div>
  `;
  svg = canvas.querySelector('svg');
  wireInteractions(canvas);
}

function provinceFill(id, p) {
  const prov = state.provinces.find((x) => x.id === id);
  if (layers.loyalty && prov) return mix('9c4a31', '6e7444', prov.loyalty / 100);
  return p.color;
}

function provincePolygon(id, p) {
  const prov = state.provinces.find((x) => x.id === id);
  const lost = prov && prov.lost;
  return `<polygon class="map-province${lost ? ' lost' : ''}${selected && selected.id === id ? ' selected' : ''}" data-province="${id}"
    points="${polyPoints(p.points)}" style="--pf:${provinceFill(id, p)}"/>`;
}

function provinceLabel(id, p) {
  const prov = state.provinces.find((x) => x.id === id);
  const [x, y] = p.labelAt;
  const status = prov && prov.lost ? 'ztracena' : (id === 'capital' ? 'hlavní město' : p.subtitle.toLowerCase());
  return `<g class="map-label" data-province="${id}">
    <text class="pl-name" x="${x}" y="${y}">${esc(p.label)}</text>
    <text class="pl-sub" x="${x}" y="${y + 15}">${esc(status)}</text>
  </g>`;
}

function routePath(key, r) {
  const d = smoothPath(r.points);
  const active = selected && selected.type === 'route' && selected.id === key;
  return `<g class="map-route${active ? ' active' : ''}" data-route="${key}">
    <path class="r-hit" d="${d}"/>
    <path class="r-line" d="${d}" style="--rc:${r.color}" stroke-dasharray="${r.dash}"/>
  </g>`;
}

function featureMarker(id, f) {
  const [x, y] = f.at;
  const active = selected && selected.type === 'feature' && selected.id === id;
  return `<g class="map-feature${active ? ' active' : ''}" data-feature="${id}" transform="translate(${x} ${y})">
    <circle class="f-ring" r="15"/>
    <g class="f-icon">${FEATURE_ICONS[f.icon]}</g>
  </g>`;
}

function overlays() {
  return state.provinces.map((prov) => {
    const p = PROVINCES[prov.id];
    if (!p) return '';
    let out = '';
    if (prov.lost) return '';
    const showSmoke = prov.unrest >= 70 || (layers.unrest && prov.unrest >= 30);
    if (showSmoke) {
      const k = Math.min(1, prov.unrest / 100);
      const [sx, sy] = p.smokeAt;
      out += `<g class="smoke" style="--k:${k.toFixed(2)}" transform="translate(${sx} ${sy})">
        ${prov.unrest >= 60 ? '<circle class="ember" r="9"/>' : ''}
        <circle class="puff p1" r="${(14 + 14 * k).toFixed(0)}" filter="url(#map-blur)"/>
        <circle class="puff p2" r="${(10 + 12 * k).toFixed(0)}" cx="12" filter="url(#map-blur)"/>
        <circle class="puff p3" r="${(8 + 10 * k).toFixed(0)}" cx="-10" filter="url(#map-blur)"/>
      </g>`;
    }
    if (layers.garrison) {
      const [gx, gy] = p.garrisonAt;
      out += `<g class="garrison-badge" transform="translate(${gx} ${gy})">
        <path d="M-13 -14h26v10c0 9-7 15-13 18-6-3-13-9-13-18z"/>
        <text y="4">${prov.garrison}</text>
      </g>`;
    }
    return out;
  }).join('');
}

function seaDecorations() {
  const waves = [[60, 140], [40, 420], [90, 560], [250, 655], [380, 690], [600, 668], [760, 640], [860, 560], [70, 270]];
  return `<g class="map-waves">${waves.map(([x, y]) => `<path transform="translate(${x} ${y})" d="M-16 0c4-4 8-4 12 0s8 4 12 0 8-4 12 0"/>`).join('')}
    <g class="map-ship" transform="translate(62 330)"><path d="M-14 4h28l-5 7h-18z"/><path d="M0 4v-22M0 -18l11 9H0M0 -14l-9 8h9"/></g>
    <g class="map-ship" transform="translate(470 676) scale(.8)"><path d="M-14 4h28l-5 7h-18z"/><path d="M0 4v-22M0 -18l11 9H0"/></g>
  </g>`;
}

function compass(x, y) {
  return `<g class="map-compass" transform="translate(${x} ${y})">
    <circle r="34"/><circle r="27" class="c-inner"/>
    <path d="M0 -42L6 0 0 42-6 0z" class="c-needle"/><path d="M-42 0L0 5 42 0 0-5z" class="c-needle light"/>
    <path d="M0 -42L6 0H0z" class="c-dark"/>
    <text y="-48">S</text>
  </g>`;
}

function cartouche() {
  return `<g class="map-cartouche" transform="translate(28 594)">
    <rect width="230" height="84" rx="2"/>
    <rect x="5" y="5" width="220" height="74" class="inner"/>
    <text class="c-title" x="115" y="38">Mapa království</text>
    <text class="c-sub" x="115" y="60">země rodu ${esc(state.dynastyName)}</text>
  </g>`;
}

// ---------- sidebar ----------

function sidebar(html) {
  const el = host.querySelector('.map-sidebar');
  el.innerHTML = html;
  el.scrollTop = 0;
}

function statRow(label, value, cls) {
  return `<div class="stat-bar-row"><span class="label">${label}</span><div class="stat-bar"><div class="stat-bar-fill ${cls}" style="width:${value}%"></div></div><span>${value}</span></div>`;
}

function verdict(prov) {
  if (prov.lost) return ['Ztracena', 'bad'];
  if (prov.unrest >= 70) return ['Na pokraji vzpoury', 'bad'];
  if (prov.loyalty <= 30) return ['Nevěrná koruně', 'bad'];
  if (prov.unrest >= 45) return ['Neklidná', 'warn'];
  if (prov.loyalty >= 70) return ['Věrná koruně', 'good'];
  return ['Klidná', 'good'];
}

function showOverview() {
  const provs = state.provinces.filter((p) => PROVINCES[p.id]);
  const avg = (k) => Math.round(provs.reduce((s, p) => s + p[k], 0) / provs.length);
  const worst = [...provs].sort((a, b) => b.unrest - a.unrest)[0];
  sidebar(`
    <span class="panel-overline">Přehled</span>
    <h3 class="panel-title">Království</h3>
    <p class="map-desc">Pět provincií koruny. Klikni na provincii, město nebo cestu a dozvíš se víc.</p>
    ${statRow('Ø věrnost', avg('loyalty'), 'loyalty')}
    ${statRow('Ø nepokoje', avg('unrest'), 'unrest')}
    ${statRow('Ø bohatství', avg('wealth'), 'wealth')}
    ${statRow('Ø posádky', avg('garrison'), 'garrison')}
    <h4 class="map-sub">Provincie</h4>
    <div class="map-chip-list">
      ${provs.map((p) => {
        const [v, cls] = verdict(p);
        return `<button class="map-chip" data-goto-province="${p.id}"><span>${esc(PROVINCES[p.id].label)}</span><em class="${cls}">${v}</em></button>`;
      }).join('')}
    </div>
    ${worst && worst.unrest >= 45 ? `<p class="map-warning">Nejvíc to vře v provincii <strong>${esc(PROVINCES[worst.id].label)}</strong> (nepokoje ${worst.unrest}).</p>` : ''}
    <h4 class="map-sub">Legenda</h4>
    <ul class="map-legend">
      <li><span class="lg-line road"></span>Královská cesta</li>
      <li><span class="lg-line river"></span>Řeka Brodnice</li>
      <li><span class="lg-smoke"></span>Kouř = nepokoje v provincii</li>
    </ul>
  `);
}

function showProvince(id) {
  const p = PROVINCES[id];
  const prov = state.provinces.find((x) => x.id === id);
  const [v, cls] = verdict(prov);
  const features = Object.entries(FEATURES).filter(([, f]) => f.province === id);
  sidebar(`
    <span class="panel-overline">${esc(p.subtitle)}</span>
    <h3 class="panel-title">${esc(p.label)}</h3>
    <span class="map-verdict ${cls}">${v}${id === 'capital' ? ' · hlavní město' : ''}</span>
    <p class="map-desc">${esc(p.text)}</p>
    ${statRow('Věrnost', prov.loyalty, 'loyalty')}
    ${statRow('Nepokoje', prov.unrest, 'unrest')}
    ${statRow('Bohatství', prov.wealth, 'wealth')}
    ${statRow('Posádka', prov.garrison, 'garrison')}
    ${features.length ? `<h4 class="map-sub">Místa</h4><div class="map-chip-list">
      ${features.map(([fid, f]) => `<button class="map-chip" data-goto-feature="${fid}"><span>${esc(f.name)}</span><em>${esc(f.kind)}</em></button>`).join('')}
    </div>` : ''}
    <button class="map-back" data-overview>← Celé království</button>
  `);
}

function showFeature(id) {
  const f = FEATURES[id];
  const routes = id === 'vassal' ? Object.keys(ROUTES) : [];
  sidebar(`
    <span class="panel-overline">${esc(f.kind)}</span>
    <h3 class="panel-title">${esc(f.name)}</h3>
    <p class="map-desc">${esc(f.text)}</p>
    ${f.province ? `<button class="map-chip" data-goto-province="${f.province}"><span>Provincie</span><em>${esc(PROVINCES[f.province].label)}</em></button>` : ''}
    ${routes.length ? `<h4 class="map-sub">Cesty k Orlí Stráži</h4><div class="map-chip-list">
      ${routes.map((k) => `<button class="map-chip route-chip" data-goto-route="${k}" style="--rc:${ROUTES[k].color}">${TERRAIN_DEFS[k].icon}<span>${TERRAIN_DEFS[k].label}</span><em>${Math.round(TERRAIN_DEFS[k].baseRisk * 100)} % ${TERRAIN_DEFS[k].riskLabel}</em></button>`).join('')}
    </div>` : ''}
    <button class="map-back" data-overview>← Celé království</button>
  `);
}

function showRoute(key) {
  const t = TERRAIN_DEFS[key];
  const pct = Math.round(t.baseRisk * 100);
  const canChoose = typeof options.onChooseRoute === 'function'
    && (!options.allowedRoutes || options.allowedRoutes.includes(key));
  sidebar(`
    <span class="panel-overline">Cesta k Orlí Stráži</span>
    <h3 class="panel-title">${t.label}</h3>
    <div class="map-risk" style="--rc:${ROUTES[key].color}">
      <span class="risk-num">${pct} %</span><span class="risk-label">riziko: ${t.riskLabel}</span>
      <div class="risk-bar"><div style="width:${pct}%"></div></div>
    </div>
    <p class="map-desc">${ROUTE_TEXT[key]}</p>
    ${canChoose ? `<button class="seal-button primary map-choose" data-choose-route="${key}">Vyslat posla touto cestou</button>` : ''}
    <button class="map-back" data-goto-feature="vassal">← Všechny cesty</button>
  `);
}

// ---------- selection + view ----------

function selectThing(sel) {
  selected = sel;
  svg.querySelectorAll('.map-province.selected, .map-feature.active, .map-route.active').forEach((el) => el.classList.remove('selected', 'active'));
  if (!sel) {
    showOverview();
    return;
  }
  if (sel.type === 'province') {
    svg.querySelector(`.map-province[data-province="${sel.id}"]`).classList.add('selected');
    showProvince(sel.id);
  } else if (sel.type === 'feature') {
    svg.querySelector(`.map-feature[data-feature="${sel.id}"]`).classList.add('active');
    if (sel.id === 'vassal') svg.querySelector('.map-routes').classList.add('show');
    showFeature(sel.id);
  } else if (sel.type === 'route') {
    svg.querySelector('.map-routes').classList.add('show');
    svg.querySelector(`.map-route[data-route="${sel.id}"]`).classList.add('active');
    showRoute(sel.id);
  }
}

function fitBox(b, pad = 0.18) {
  const cw = b.w * (1 + pad * 2);
  const ch = b.h * (1 + pad * 2);
  let w = Math.max(cw, ch / (H / W), MIN_VIEW_W);
  w = Math.min(w, W);
  const h = w * (H / W);
  return clampView({ x: b.x + b.w / 2 - w / 2, y: b.y + b.h / 2 - h / 2, w, h });
}

function clampView(v) {
  const w = Math.min(Math.max(v.w, MIN_VIEW_W), W);
  const h = w * (H / W);
  const x = Math.min(Math.max(v.x, -60), W + 60 - w);
  const y = Math.min(Math.max(v.y, -40), H + 40 - h);
  return { x, y, w, h };
}

function applyView() {
  if (svg) svg.setAttribute('viewBox', `${view.x} ${view.y} ${view.w} ${view.h}`);
}

function animateTo(target, ms = 600) {
  cancelAnimationFrame(animFrame);
  const from = { ...view };
  const start = performance.now();
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const step = (now) => {
    const t = Math.min(1, (now - start) / ms);
    const e = ease(t);
    view = {
      x: from.x + (target.x - from.x) * e,
      y: from.y + (target.y - from.y) * e,
      w: from.w + (target.w - from.w) * e,
      h: from.h + (target.h - from.h) * e,
    };
    applyView();
    if (t < 1) animFrame = requestAnimationFrame(step);
  };
  animFrame = requestAnimationFrame(step);
}

function zoomAt(point, factor) {
  cancelAnimationFrame(animFrame);
  const w = Math.min(Math.max(view.w * factor, MIN_VIEW_W), W);
  const s = w / view.w;
  view = clampView({ x: point.x - (point.x - view.x) * s, y: point.y - (point.y - view.y) * s, w, h: view.h * s });
  applyView();
}

function toSvgPoint(clientX, clientY) {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}

// ---------- tooltip ----------

function showTooltip(e, html) {
  const tip = host.querySelector('.map-tooltip');
  const rect = host.querySelector('.map-canvas').getBoundingClientRect();
  tip.innerHTML = html;
  tip.hidden = false;
  tip.style.left = `${e.clientX - rect.left + 16}px`;
  tip.style.top = `${e.clientY - rect.top + 16}px`;
}

function hideTooltip() {
  const tip = host && host.querySelector('.map-tooltip');
  if (tip) tip.hidden = true;
}

function tooltipFor(target) {
  const provEl = target.closest('[data-province]');
  const featEl = target.closest('[data-feature]');
  const routeEl = target.closest('[data-route]');
  if (featEl) {
    const f = FEATURES[featEl.dataset.feature];
    return `<strong>${esc(f.name)}</strong><span>${esc(f.kind)}</span>`;
  }
  if (routeEl) {
    const t = TERRAIN_DEFS[routeEl.dataset.route];
    return `<strong>${t.label}</strong><span>${Math.round(t.baseRisk * 100)} % ${t.riskLabel}</span>`;
  }
  if (provEl) {
    const prov = state.provinces.find((x) => x.id === provEl.dataset.province);
    return `<strong>${esc(PROVINCES[prov.id].label)}</strong><span>Věrnost ${prov.loyalty} · Nepokoje ${prov.unrest}</span>`;
  }
  return null;
}

// ---------- interactions ----------

function wireInteractions(canvas) {
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoomAt(toSvgPoint(e.clientX, e.clientY), e.deltaY < 0 ? 1 / 1.18 : 1.18);
  }, { passive: false });

  svg.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    cancelAnimationFrame(animFrame);
    drag = { x: e.clientX, y: e.clientY, view: { ...view }, scale: 1 / svg.getScreenCTM().a, moved: false, id: e.pointerId };
  });
  svg.addEventListener('pointermove', (e) => {
    if (drag) {
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 5) {
        drag.moved = true;
        svg.setPointerCapture(drag.id);
        svg.classList.add('dragging');
        hideTooltip();
      }
      if (drag.moved) {
        view = clampView({ ...drag.view, x: drag.view.x - dx * drag.scale, y: drag.view.y - dy * drag.scale });
        applyView();
      }
      return;
    }
    const html = tooltipFor(e.target);
    if (html) showTooltip(e, html);
    else hideTooltip();
  });
  const endDrag = () => {
    if (drag && drag.moved) {
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 0);
    }
    drag = null;
    svg.classList.remove('dragging');
  };
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);
  svg.addEventListener('pointerleave', hideTooltip);

  svg.addEventListener('click', (e) => {
    if (suppressClick) return;
    const featEl = e.target.closest('[data-feature]');
    const routeEl = e.target.closest('[data-route]');
    const provEl = e.target.closest('[data-province]');
    if (featEl) return focusFeature(featEl.dataset.feature);
    if (routeEl) return focusRoute(routeEl.dataset.route);
    if (provEl) return focusProvince(provEl.dataset.province);
    selectThing(null);
  });

  canvas.querySelector('.map-zoom').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-zoom]');
    if (!btn) return;
    const center = { x: view.x + view.w / 2, y: view.y + view.h / 2 };
    if (btn.dataset.zoom === 'in') animateTo(clampView(scaleAround(center, 1 / 1.5)), 350);
    if (btn.dataset.zoom === 'out') animateTo(clampView(scaleAround(center, 1.5)), 350);
    if (btn.dataset.zoom === 'reset') { animateTo({ x: 0, y: 0, w: W, h: H }); selectThing(null); }
  });
}

function scaleAround(c, f) {
  const w = Math.min(Math.max(view.w * f, MIN_VIEW_W), W);
  const h = w * (H / W);
  return { x: c.x - w / 2, y: c.y - h / 2, w, h };
}

function focusProvince(id) {
  selectThing({ type: 'province', id });
  animateTo(fitBox(bounds(PROVINCES[id].points), 0.12));
}

function focusFeature(id) {
  selectThing({ type: 'feature', id });
  const [x, y] = FEATURES[id].at;
  animateTo(id === 'vassal' ? fitBox({ x: 460, y: 40, w: 500, h: 320 }) : fitBox({ x: x - 90, y: y - 70, w: 180, h: 140 }));
}

function focusRoute(key) {
  selectThing({ type: 'route', id: key });
  animateTo(fitBox(bounds(ROUTES[key].points), 0.1));
}

// Sidebar + header controls (wired once from main.js)
export function wireMapChrome() {
  document.getElementById('map-view').addEventListener('click', (e) => {
    const t = e.target;
    const layerBtn = t.closest('[data-layer]');
    if (layerBtn) {
      layers[layerBtn.dataset.layer] = !layers[layerBtn.dataset.layer];
      const keep = selected;
      const keepView = { ...view };
      render();
      view = keepView;
      applyView();
      selected = null;
      if (keep) selectThing(keep);
      else showOverview();
      return;
    }
    const prov = t.closest('[data-goto-province]');
    if (prov) return focusProvince(prov.dataset.gotoProvince);
    const feat = t.closest('[data-goto-feature]');
    if (feat) return focusFeature(feat.dataset.gotoFeature);
    const route = t.closest('[data-goto-route]');
    if (route) return focusRoute(route.dataset.gotoRoute);
    if (t.closest('[data-overview]')) {
      selectThing(null);
      animateTo({ x: 0, y: 0, w: W, h: H });
      return;
    }
    const choose = t.closest('[data-choose-route]');
    if (choose && options.onChooseRoute) {
      const key = choose.dataset.chooseRoute;
      closeMap();
      options.onChooseRoute(key);
    }
  });
}
