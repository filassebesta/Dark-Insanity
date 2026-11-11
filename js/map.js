// Interactive kingdom map: a painted map image (assets/map/kingdom_map.jpg)
// with clickable SVG overlays. Coordinates are pixels of the original
// 1264x848 painting; zoom/pan works by animating the SVG viewBox.

import { TERRAIN_DEFS, NOBLE_HOUSES } from './data.js';
import { attitudeLabel, decreeList, decreeAvailable, canAffordDecree, issueDecree } from './engine.js';
import { esc } from './ui.js';

const W = 1264;
const H = 848;
const MIN_VIEW_W = 430;
const MAP_IMAGE = 'assets/map/kingdom_map.jpg';

// ---------- geography (traced from the painting) ----------

const PROVINCES = {
  'pobrezni-mark': {
    label: 'Pobřežní Mark',
    subtitle: 'Přímořské marky',
    color: '#7f9097',
    points: [[60, 20], [330, 20], [340, 100], [430, 195], [480, 250], [485, 330], [470, 410], [430, 470], [360, 520], [345, 560], [340, 640], [330, 715], [270, 700], [235, 675], [197, 655], [185, 610], [200, 580], [235, 540], [265, 470], [285, 420], [280, 395], [290, 355], [265, 340], [200, 280], [170, 240], [125, 175], [95, 120]],
    labelAt: [262, 238], smokeAt: [345, 372], garrisonAt: [400, 300],
    text: 'Větrné pobřeží s jediným námořním přístavem. Kupci sem přivážejí sůl, víno a zprávy z ciziny — a s nimi i cizí nemoci.',
  },
  'zelezny-hreben': {
    label: 'Železný Hřeben',
    subtitle: 'Hornické panství',
    color: '#8c8378',
    points: [[330, 20], [600, 25], [760, 40], [900, 65], [935, 110], [930, 170], [870, 200], [800, 205], [700, 205], [640, 205], [560, 200], [480, 200], [430, 195], [340, 100]],
    labelAt: [790, 168], smokeAt: [660, 140], garrisonAt: [540, 150],
    text: 'Horský hřbet bohatý na železnou rudu. Odsud pochází železo pro meče královského vojska. Horníci jsou hrdí a snadno se bouří.',
  },
  'sokoli-hvozd': {
    label: 'Sokolí Hvozd',
    subtitle: 'Hraniční prales',
    color: '#6f7f55',
    points: [[930, 170], [1000, 185], [1060, 222], [1110, 268], [1170, 320], [1200, 400], [1185, 500], [1120, 560], [1080, 600], [1000, 612], [900, 602], [850, 560], [845, 440], [840, 380], [845, 300], [880, 225]],
    labelAt: [972, 520], smokeAt: [985, 372], garrisonAt: [1060, 470],
    text: 'Hluboký prales na východní hranici. Žijí tu myslivci a uhlíři — a lapkové, kteří na lesních stezkách číhají na pocestné.',
  },
  capital: {
    label: 'Vlčí Úděl',
    subtitle: 'Korunní země',
    color: '#c9a76a',
    points: [[430, 195], [480, 200], [560, 200], [640, 205], [700, 205], [800, 205], [870, 200], [930, 170], [880, 225], [845, 300], [840, 380], [845, 440], [800, 470], [740, 500], [660, 510], [560, 500], [470, 470], [430, 470], [470, 410], [485, 330], [480, 250]],
    labelAt: [540, 252], smokeAt: [585, 300], garrisonAt: [710, 300],
    text: 'Srdce království. Úrodné pláně kolem královského hradu, odkud vede Královská cesta na všechny strany. Kdo drží Vlčí Úděl, drží korunu.',
  },
  brodna: {
    label: 'Brodná',
    subtitle: 'Obilnice království',
    color: '#a7a86a',
    points: [[360, 520], [430, 470], [470, 470], [560, 500], [660, 510], [740, 500], [800, 470], [845, 440], [850, 560], [900, 602], [1000, 612], [1080, 600], [1095, 627], [1000, 650], [900, 647], [850, 665], [820, 685], [795, 725], [770, 725], [725, 700], [712, 745], [640, 760], [575, 770], [525, 790], [480, 760], [465, 730], [380, 735], [330, 715], [340, 640], [345, 560]],
    labelAt: [505, 588], smokeAt: [700, 622], garrisonAt: [600, 650],
    text: 'Obilnice království. Řeka Brodnice tu tvoří jediný bezpečný brod a trhové město Brod žije z obchodu se zrnem.',
  },
};

// river centre line — only carries the "Brodnice" label, the river itself is painted
const RIVER = [[628, 168], [648, 205], [658, 245], [692, 278], [716, 330], [740, 362], [744, 402], [700, 455], [728, 515], [740, 560], [722, 600], [712, 640]];

const FEATURES = {
  capital: { name: 'Hrad Vlčí Úděl', kind: 'Královské sídlo', at: [633, 368], r: 52, province: 'capital', text: 'Sídlo koruny a dvora. Tady se rozhoduje o osudu království.' },
  brod: { name: 'Brod', kind: 'Trhové město', at: [716, 652], r: 46, province: 'brodna', text: 'Město u jediného brodu přes Brodnici. Každý podzim tu probíhá velký trh se zrnem.' },
  port: { name: 'Přístav Mark', kind: 'Námořní přístav', at: [328, 388], r: 36, province: 'pobrezni-mark', text: 'Jediný přístav království. Clo z lodí plní pokladnu, ale přístavní čtvrti jsou neklidné.' },
  mine: { name: 'Železná Huť', kind: 'Doly a hutě', at: [630, 135], r: 30, province: 'zelezny-hreben', text: 'Doly na železnou rudu a kovárny, které zásobují královské vojsko zbraněmi.' },
  lodge: { name: 'Sokolov', kind: 'Myslivecká osada', at: [985, 394], r: 38, province: 'sokoli-hvozd', text: 'Poslední osada před hlubokým hvozdem. Kdo jde lesní stezkou dál na sever, je odsud sám.' },
  toll: { name: 'Mýtnice', kind: 'Strážní věž na obchodní cestě', at: [1082, 250], r: 30, province: 'sokoli-hvozd', text: 'Strážní věž na okraji hvozdu. Bezpečný průchod k severu — za mýto a čekání.' },
  abbey: { name: 'Klášter na útesu', kind: 'Klášter', at: [297, 505], r: 40, province: 'pobrezni-mark', text: 'Starý klášter nad mořem. Opat má vliv na víru celého pobřeží.' },
  vassal: { name: 'Orlí Stráž', kind: 'Sídlo vzdáleného vazala', at: [1160, 88], r: 44, province: null, text: 'Hrad vazala za severovýchodní hranicí. Vedou k němu tři cesty — každá s jiným nebezpečím.' },
};

const ROUTES = {
  forest: { points: [[633, 368], [700, 402], [780, 414], [860, 424], [985, 398], [1060, 382], [1160, 350], [1212, 255], [1190, 160], [1162, 112]], color: '#c0573a', dash: '3 7' },
  mountain: { points: [[633, 368], [612, 300], [602, 238], [626, 172], [632, 138], [700, 108], [800, 92], [905, 86], [1010, 84], [1118, 88]], color: '#d8a650', dash: '12 7' },
  traderoute: { points: [[633, 368], [692, 350], [737, 330], [802, 290], [870, 236], [930, 184], [1010, 206], [1080, 252], [1128, 182], [1158, 118]], color: '#9cbc6c', dash: '16 6 2 6' },
};
const VASSAL_VIEW = { x: 590, y: 40, w: 650, h: 400 };

const ROUTE_TEXT = {
  forest: 'Nejkratší cesta k Orlí Stráži vede hlubokým Sokolím hvozdem přes Sokolov a horskou bránu. Les je ale plný lapků.',
  mountain: 'Stezka přes Železný Hřeben kolem dolů. Kratší než obchodní cesta, ale sesuvy a mráz zdrží každého.',
  traderoute: 'Udržovaná obchodní cesta po okraji hvozdu kolem Mýtnice. Nejbezpečnější, ale pomalá — mýto a čekání na karavany.',
};

const LAYERS = [
  { key: 'loyalty', label: 'Věrnost' },
  { key: 'unrest', label: 'Nepokoje' },
  { key: 'garrison', label: 'Posádky' },
  { key: 'routes', label: 'Cesty' },
];

// ---------- helpers ----------

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

// ---------- ownership (Šlechtic) ----------

function provState(id) {
  return state.provinces.find((x) => x.id === id);
}

/** null for the player's own land (and always in the king scenario), otherwise who holds it. */
function foreignOwner(id) {
  const prov = provState(id);
  if (!prov || !prov.owner || prov.owner === 'player') return null;
  if (prov.owner === 'crown') return { kind: 'crown', label: 'Koruna', name: `Korunní země krále ${state.king ? state.king.name : ''}` };
  const def = NOBLE_HOUSES.find((d) => d.id === prov.owner);
  const house = (state.houses || []).find((h) => h.id === prov.owner);
  return { kind: 'house', label: def.short, name: def.name, def, house };
}

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
    animateTo(fitBox(VASSAL_VIEW));
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
        <filter id="map-blur" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="9"/></filter>
      </defs>
      <image class="map-image" href="${MAP_IMAGE}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="none"/>

      <g class="map-land">${Object.entries(PROVINCES).map(([id, p]) => provincePolygon(id, p)).join('')}</g>
      <path class="map-river-guide" d="${smoothPath(RIVER)}" id="map-river-path"/>
      <text class="map-natural river-label"><textPath href="#map-river-path" startOffset="30%">Brodnice</textPath></text>

      <g class="map-routes${layers.routes ? ' show' : ''}">${Object.entries(ROUTES).map(([key, r]) => routePath(key, r)).join('')}</g>
      <g class="map-overlays">${overlays()}</g>
      <g class="map-labels">${Object.entries(PROVINCES).map(([id, p]) => provinceLabel(id, p)).join('')}</g>
      <g class="map-features">${Object.entries(FEATURES).map(([id, f]) => featureMarker(id, f)).join('')}</g>

      <text class="map-natural sea-label" x="128" y="520" transform="rotate(-84 128 520)">Šedé moře</text>
      <text class="map-natural sea-label" x="960" y="760">Šedé moře</text>
      <text class="map-foreign" x="1236" y="440" transform="rotate(90 1236 440)">Východní marky</text>
      <text class="map-foreign" x="1010" y="40">Severní pustiny</text>
      ${compass(118, 770)}
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
  if (layers.loyalty && prov) return mix('b8402c', '5f8a3a', prov.loyalty / 100);
  return p.color;
}

function provincePolygon(id, p) {
  const prov = state.provinces.find((x) => x.id === id);
  const lost = prov && prov.lost;
  const foreign = foreignOwner(id);
  const own = state.scenario === 'slechtic' && !foreign;
  return `<polygon class="map-province${lost ? ' lost' : ''}${layers.loyalty && !foreign ? ' tinted' : ''}${foreign ? ' foreign' : ''}${own ? ' own' : ''}${selected && selected.id === id ? ' selected' : ''}" data-province="${id}"
    points="${polyPoints(p.points)}" style="--pf:${provinceFill(id, p)}"/>`;
}

function provinceLabel(id, p) {
  const prov = state.provinces.find((x) => x.id === id);
  const [x, y] = p.labelAt;
  const foreign = foreignOwner(id);
  const status = prov && prov.lost ? 'ztracena'
    : foreign ? (foreign.kind === 'crown' ? 'korunní země' : `panství: ${foreign.label}`)
      : state.scenario === 'slechtic' ? 'tvé panství'
        : (id === 'capital' ? 'hlavní město' : p.subtitle.toLowerCase());
  return `<g class="map-label" data-province="${id}">
    <text class="pl-name" x="${x}" y="${y}">${esc(p.label)}</text>
    <text class="pl-sub" x="${x}" y="${y + 18}">${esc(status)}</text>
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
    <circle class="f-hit" r="${f.r}"/>
    <circle class="f-dot" r="5"/>
    <circle class="f-ring" r="${f.r}"/>
    <text class="f-label" y="${f.r + 15}">${esc(f.name)}</text>
  </g>`;
}

function overlays() {
  return state.provinces.map((prov) => {
    const p = PROVINCES[prov.id];
    if (!p) return '';
    let out = '';
    if (prov.lost || foreignOwner(prov.id)) return ''; // only your own lands show unrest and garrisons
    const showSmoke = prov.unrest >= 70 || (layers.unrest && prov.unrest >= 30);
    if (showSmoke) {
      const k = Math.min(1, prov.unrest / 100);
      const [sx, sy] = p.smokeAt;
      out += `<g class="smoke" style="--k:${k.toFixed(2)}" transform="translate(${sx} ${sy}) scale(1.25)">
        ${prov.unrest >= 60 ? '<circle class="ember" r="9"/>' : ''}
        <circle class="puff p1" r="${(14 + 14 * k).toFixed(0)}" filter="url(#map-blur)"/>
        <circle class="puff p2" r="${(10 + 12 * k).toFixed(0)}" cx="12" filter="url(#map-blur)"/>
        <circle class="puff p3" r="${(8 + 10 * k).toFixed(0)}" cx="-10" filter="url(#map-blur)"/>
      </g>`;
    }
    if (layers.garrison) {
      const [gx, gy] = p.garrisonAt;
      out += `<g class="garrison-badge" transform="translate(${gx} ${gy}) scale(1.25)">
        <path d="M-13 -14h26v10c0 9-7 15-13 18-6-3-13-9-13-18z"/>
        <text y="4">${prov.garrison}</text>
      </g>`;
    }
    return out;
  }).join('');
}

function compass(x, y) {
  return `<g class="map-compass" transform="translate(${x} ${y})">
    <circle r="34"/><circle r="27" class="c-inner"/>
    <path d="M0 -42L6 0 0 42-6 0z" class="c-needle"/><path d="M-42 0L0 5 42 0 0-5z" class="c-needle light"/>
    <path d="M0 -42L6 0H0z" class="c-dark"/>
    <text y="-48">S</text>
  </g>`;
}

// ---------- decrees (one a year) ----------

const RES_SHORT = { gold: 'zlato', food: 'jídlo', army: 'vojsko', stability: 'stabilita', faith: 'víra', prestige: 'prestiž', favor: 'přízeň', legitimacy: 'legitimita' };
const PROV_SHORT = { garrison: 'posádka', loyalty: 'věrnost', unrest: 'nepokoje', wealth: 'bohatství' };
const PEASANT_RES = { gold: 'groše', food: 'zásoby', army: 'čeleď', stability: 'grunt', prestige: 'pověst', favor: 'přízeň pána' };

function decreeChips(d) {
  const sign = (v) => (v > 0 ? `+${v}` : `${v}`);
  const names = state.scenario === 'sedlak' ? { ...RES_SHORT, ...PEASANT_RES } : RES_SHORT;
  const chips = [
    ...Object.entries(d.effects || {}).map(([k, v]) => [`${names[k] || k} ${sign(v)}`, k === 'unrest' ? v < 0 : v > 0]),
    ...Object.entries(d.prov || {}).map(([k, v]) => [`${PROV_SHORT[k]} ${sign(v)}`, k === 'unrest' ? v < 0 : v > 0]),
  ];
  return chips.map(([t, good]) => `<i class="${good ? 'pos' : 'neg'}">${esc(t)}</i>`).join('');
}

function decreeBlock(provinceId = '') {
  if (!decreeAvailable(state)) {
    return state.scenario === 'sedlak'
      ? `<h4 class="map-sub">Práce na gruntu</h4><p class="map-desc">Letošní práce už je naplánovaná. Další můžeš naplánovat v roce ${state.year + 1}.</p>`
      : `<h4 class="map-sub">Výnos</h4><p class="map-desc">Letošní výnos už byl vydán. Další můžeš vydat v roce ${state.year + 1}.</p>`;
  }
  const list = decreeList(state);
  return `<h4 class="map-sub">${state.scenario === 'sedlak' ? 'Práce na gruntu' : 'Výnos'} <small>· jednou za rok</small></h4>
    <div class="decree-list">${Object.entries(list).map(([k, d]) => `
      <button class="decree" data-decree="${k}" data-decree-prov="${provinceId}"${canAffordDecree(state, k) ? '' : ' disabled title="Na tohle nemáš."'}>
        <b>${esc(d.label)}</b><span>${esc(d.text)}</span><em>${decreeChips(d)}</em>
      </button>`).join('')}
    </div>`;
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
  if (state.scenario === 'slechtic') return showNobleOverview();
  if (state.scenario === 'sedlak') return showPeasantOverview();
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
    ${decreeAvailable(state) ? '<p class="map-decree-hint">Letos můžeš vydat jeden výnos. Klikni na provincii.</p>' : ''}
    ${worst && worst.unrest >= 45 ? `<p class="map-warning">Nejvíc to vře v provincii <strong>${esc(PROVINCES[worst.id].label)}</strong> (nepokoje ${worst.unrest}).</p>` : ''}
    <h4 class="map-sub">Legenda</h4>
    <ul class="map-legend">
      <li><span class="lg-dot"></span>Zlatý bod = místo, na které jde kliknout</li>
      <li><span class="lg-smoke"></span>Kouř = nepokoje v provincii</li>
      <li><span class="lg-shield"></span>Štít = posádka (vrstva Posádky)</li>
      <li><span class="lg-line route"></span>Čárkované cesty k Orlí Stráži (vrstva Cesty)</li>
    </ul>
  `);
}

function showNobleOverview() {
  const own = state.provinces.find((p) => p.owner === 'player');
  sidebar(`
    <span class="panel-overline">Země koruny</span>
    <h3 class="panel-title">Kdo drží zemi</h3>
    <p class="map-desc">Tvému rodu patří jediné panství. Zbytek země drží král a tři soupeřící rody. Klikni na provincii a uvidíš, kdo v ní vládne.</p>
    <h4 class="map-sub">Panství</h4>
    <div class="map-chip-list">
      ${state.provinces.map((p) => {
        const f = foreignOwner(p.id);
        const att = f && f.house ? attitudeLabel(f.house.attitude) : '';
        const tone = f && f.house ? (f.house.attitude >= 55 ? 'good' : f.house.attitude < 40 ? 'bad' : 'warn') : '';
        return `<button class="map-chip" data-goto-province="${p.id}"><span>${esc(PROVINCES[p.id].label)}</span><em class="${tone}">${f ? esc(f.label) + (att ? ` · ${att}` : '') : 'tvé panství'}</em></button>`;
      }).join('')}
    </div>
    ${own ? `<h4 class="map-sub">Tvé panství</h4>
      ${statRow('Věrnost', own.loyalty, 'loyalty')}${statRow('Nepokoje', own.unrest, 'unrest')}
      ${statRow('Bohatství', own.wealth, 'wealth')}${statRow('Posádka', own.garrison, 'garrison')}
      ${decreeBlock(own.id)}` : ''}
    <h4 class="map-sub">Legenda</h4>
    <ul class="map-legend">
      <li><span class="lg-dot"></span>Zlatý bod = místo, na které jde kliknout</li>
      <li><span class="lg-own"></span>Zlatý okraj = tvé panství</li>
      <li><span class="lg-smoke"></span>Kouř = nepokoje na tvém panství</li>
    </ul>
  `);
}

function showPeasantOverview() {
  const home = state.peasant || { village: 'Lipnice', province: 'brodna' };
  const r = state.resources;
  sidebar(`
    <span class="panel-overline">Kraj ${esc(PROVINCES[home.province].label)}</span>
    <h3 class="panel-title">Ves ${esc(home.village)}</h3>
    <p class="map-desc">Tvůj grunt stojí ve vsi ${esc(home.village)} v kraji Brodná, na panství pánů z Bílé Brány. Zbytek země drží král a velké rody. Klikni na kraj a uvidíš, komu patří.</p>
    ${statRow('Grunt', r.stability, 'wealth')}
    ${statRow('Přízeň pána', r.favor, 'loyalty')}
    ${statRow('Pověst ve vsi', r.prestige, 'garrison')}
    ${decreeBlock()}
    <h4 class="map-sub">Země</h4>
    <div class="map-chip-list">
      ${state.provinces.map((p) => {
        const f = foreignOwner(p.id);
        return `<button class="map-chip" data-goto-province="${p.id}"><span>${esc(PROVINCES[p.id].label)}</span><em>${p.id === home.province ? 'tvůj kraj' : f ? esc(f.label) : ''}</em></button>`;
      }).join('')}
    </div>
  `);
}

function showForeignProvince(id, f) {
  if (state.scenario === 'sedlak') return showPeasantProvince(id, f);
  const p = PROVINCES[id];
  const features = Object.entries(FEATURES).filter(([, x]) => x.province === id);
  const h = f.house;
  sidebar(`
    <span class="panel-overline">${f.kind === 'crown' ? 'Korunní země' : 'Panství soupeřícího rodu'}</span>
    <h3 class="panel-title">${esc(p.label)}</h3>
    <span class="map-verdict ${h ? (h.attitude >= 55 ? 'good' : h.attitude < 40 ? 'bad' : 'warn') : 'warn'}">${esc(f.name)}</span>
    <p class="map-desc">${esc(h ? f.def.text : p.text)}</p>
    ${h ? `<p class="map-desc"><strong>${h.head.gender === 'female' ? 'Paní' : 'Pán'} ${esc(h.head.name)}</strong>, ${h.head.age} let${h.ally ? ' · spojenec tvého rodu' : ''}${h.married ? ' · spřízněni sňatkem' : ''}</p>
      ${statRow('Vztah k tobě', h.attitude, 'loyalty')}${statRow('Moc rodu', h.power, 'garrison')}`
      : `${statRow('Přízeň krále', state.resources.favor, 'loyalty')}`}
    ${features.length ? `<h4 class="map-sub">Místa</h4><div class="map-chip-list">
      ${features.map(([fid, x]) => `<button class="map-chip" data-goto-feature="${fid}"><span>${esc(x.name)}</span><em>${esc(x.kind)}</em></button>`).join('')}
    </div>` : ''}
    <button class="map-back" data-overview>← Celá země</button>
  `);
}

// a peasant sees who rules a land, not its politics
function showPeasantProvince(id, f) {
  const p = PROVINCES[id];
  const home = state.peasant || { village: 'Lipnice', province: 'brodna' };
  const h = f.house;
  sidebar(`
    <span class="panel-overline">${f.kind === 'crown' ? 'Korunní země' : 'Panství velkého rodu'}</span>
    <h3 class="panel-title">${esc(p.label)}</h3>
    <span class="map-verdict ${id === home.province ? 'good' : 'warn'}">${esc(f.name)}</span>
    <p class="map-desc">${esc(h ? f.def.text : p.text)}</p>
    ${h ? `<p class="map-desc"><strong>${h.head.gender === 'female' ? 'Paní' : 'Pán'} ${esc(h.head.name)}</strong>, ${h.head.age} let</p>` : `<p class="map-desc">Vládne tu král ${esc(state.king ? state.king.name : '')}.</p>`}
    ${id === home.province ? `<p class="map-decree-hint">Tady, ve vsi ${esc(home.village)}, stojí tvůj grunt.</p>` : ''}
    <button class="map-back" data-overview>← Celá země</button>
  `);
}

function showProvince(id) {
  const foreign = foreignOwner(id);
  if (foreign) return showForeignProvince(id, foreign);
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
    ${prov.lost ? '' : decreeBlock(id)}
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
  if (!svg) return;
  svg.setAttribute('viewBox', `${view.x} ${view.y} ${view.w} ${view.h}`);
  svg.classList.toggle('zoomed', view.w < W * 0.62); // place names appear once zoomed in
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
    const f = foreignOwner(prov.id);
    if (f) return `<strong>${esc(PROVINCES[prov.id].label)}</strong><span>${esc(f.name)}${f.house ? ` · ${attitudeLabel(f.house.attitude)}` : ''}</span>`;
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
  animateTo(id === 'vassal' ? fitBox(VASSAL_VIEW) : fitBox({ x: x - 210, y: y - 150, w: 420, h: 300 }));
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
    const decree = t.closest('[data-decree]');
    if (decree && !decree.disabled) {
      const notes = issueDecree(state, decree.dataset.decree, decree.dataset.decreeProv);
      if (notes) {
        document.dispatchEvent(new CustomEvent('kingdom:decree', { detail: { label: decreeList(state)[decree.dataset.decree].label, notes } }));
        const keep = selected;
        selected = null;
        if (keep) selectThing(keep);
        else showOverview();
      }
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
