// Interactive kingdom map: a painted map image (assets/map/kingdom_map.jpg)
// with clickable SVG overlays. Coordinates are pixels of the original
// 1264x848 painting; zoom/pan works by animating the SVG viewBox.

import { TERRAIN_DEFS, NOBLE_HOUSES, SEASONS } from './data.js';
import { attitudeLabel, interpolate } from './engine.js';
import {
  GOODS, MARKETS, MAX_STOCK, ESCORT_ARMY, ensureTrade, routeFor, originPoint, marketAccess, price, riskOf,
  caravanFee, canSend, sendCaravan, sellAtHome, buyAtHome, convertFood, loadText,
} from './trade.js';
import { esc } from './ui.js';
import {
  PEASANT_VILLAGE, townIdFor, townOf, levelName, currentProject, ownsTown, startBuilding, startUpgrade, cancelProject, demolish,
} from './build.js';
import { renderTownPlan, townSidebar } from './town.js';
import { worldSvg, worldSidebar, WORLD_IMAGE } from './world.js';
import {
  warTargets, warBlock, startWar, recallWar, warTarget, marchShare, warOrigin, oddsLabel, leaderLabel, SIZES,
} from './war.js';

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
  lipnice: { name: 'Lipnice', kind: 'Selská ves', at: [585, 640], r: 26, province: 'brodna', text: 'Selská ves uprostřed obilných lánů.' },
  dubovice: { name: 'Dubovice', kind: 'Ves pod hradem', at: [540, 300], r: 28, province: 'capital', text: 'Ves, která živí královskou kuchyni.' },
  zareci: { name: 'Zářečí', kind: 'Osada za řekou', at: [744, 458], r: 26, province: 'capital', text: 'Pár chalup na druhém břehu Brodnice.' },
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

// four views of the map instead of a row of layer switches: the lands (who holds them, how they
// stand, where to build), trade, war and the world. Decisions are made in the story, not here.
const MODES = [
  { key: 'lands', label: 'Kraje', peasantLabel: 'Ves a kraj' },
  { key: 'trade', label: 'Obchod' },
  { key: 'war', label: 'Válka', noPeasant: true },
  { key: 'world', label: 'Svět' },
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
const layers = { loyalty: false, unrest: true, garrison: false, routes: false, trade: false, war: false };
const modeOf = () => (world ? 'world' : layers.war ? 'war' : layers.trade ? 'trade' : 'lands');
let warForm = { target: null, size: 'medium', leader: 'marshal' };
let tradeForm = { dest: null, good: null, qty: 1, escort: false };
let drag = null;
let suppressClick = false;
let town = null; // { id, slot } while a settlement is open instead of the map
let world = false; // the world map (world.js) instead of the kingdom
let realmSel = null;

export function isMapOpen() {
  return host && host.classList.contains('open');
}

export function openMap(gameState, opts = {}) {
  state = gameState;
  options = opts;
  host = document.getElementById('map-view');
  // a fresh look each time: the lands, unless trade, war or the world was asked for
  layers.trade = opts.layer === 'trade';
  layers.war = opts.layer === 'war';
  layers.routes = !!opts.focusRoutes;
  world = !!opts.world;
  realmSel = null;
  render();
  host.classList.add('open');
  host.setAttribute('aria-hidden', 'false');
  selected = null;
  town = null;
  host.classList.remove('town-open');
  view = { x: 0, y: 0, w: W, h: H };
  applyView();
  if (opts.focusRoutes) {
    selectThing({ type: 'feature', id: 'vassal' });
    animateTo(fitBox(VASSAL_VIEW));
  } else {
    showOverview();
  }
}

/** Esc inside a town goes back to the map first. Returns true when it did. */
export function closeTownIfOpen() {
  if (!isMapOpen() || !town) return false;
  closeTown();
  return true;
}

export function closeMap() {
  town = null;
  if (host) host.classList.remove('town-open');
  if (host) {
    host.classList.remove('open');
    host.setAttribute('aria-hidden', 'true');
  }
  hideTooltip();
}

// ---------- rendering ----------

function render() {
  const peasant = state.scenario === 'sedlak';
  host.querySelector('.map-layer-toggles').innerHTML = `<div class="map-modes" role="tablist">${MODES
    .filter((m) => !(m.noPeasant && peasant))
    .map((m) => `<button class="map-mode${modeOf() === m.key ? ' on' : ''}" role="tab" aria-selected="${modeOf() === m.key}" data-mode="${m.key}">${peasant && m.peasantLabel ? m.peasantLabel : m.label}</button>`).join('')}</div>`;
  host.querySelector('.map-title').textContent = world ? 'Mapa světa' : 'Mapa království';
  if (world) return renderWorld();

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
      <g class="map-trade${layers.trade ? ' show' : ''}">${tradeLayer()}</g>
      <g class="map-overlays">${overlays()}</g>
      <g class="map-labels">${Object.entries(PROVINCES).map(([id, p]) => provinceLabel(id, p)).join('')}</g>
      <g class="map-features">${Object.entries(FEATURES).map(([id, f]) => featureMarker(id, f)).join('')}</g>
      <g class="map-markets${layers.trade ? ' show' : ''}">${marketMarkers()}</g>
      <g class="map-war${layers.war ? ' show' : ''}${state.war ? ' active' : ''}">${warLayer()}</g>

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
    <div class="map-hint">Kolečkem přibližuj · táhni pro posun · klikni na město nebo ves a stav</div>
    <div class="town-stage" hidden></div>
  `;
  svg = canvas.querySelector('svg');
  wireInteractions(canvas);
  if (town) drawTown();
}

// ---------- the world (world.js) ----------

function renderWorld() {
  const canvas = host.querySelector('.map-canvas');
  canvas.innerHTML = `${worldSvg(state, realmSel)}<div class="map-hint">Klikni na zemi · Vlčí Úděl otevře mapu království</div>`;
  svg = canvas.querySelector('svg');
  const art = new Image(); // with the painting in place the drawn lands become a light tint over it
  art.onload = () => svg.classList.add('has-art');
  art.src = WORLD_IMAGE;
  svg.addEventListener('click', (e) => {
    const el = e.target.closest('[data-realm]');
    selectRealm(el ? el.dataset.realm : null);
  });
}

function selectRealm(key) {
  realmSel = key;
  svg.querySelectorAll('.w-realm').forEach((g) => g.classList.toggle('selected', g.dataset.realm === key));
  sidebar(worldSidebar(state, key));
}

function setWorld(on) {
  world = on;
  realmSel = null;
  town = null;
  host.classList.remove('town-open');
  render();
  if (!world) { view = { x: 0, y: 0, w: W, h: H }; applyView(); }
  showOverview();
}

/** Switches the map between the lands, trade, war and the world. */
function setMode(mode) {
  if (mode === 'world') return setWorld(true);
  const wasWorld = world;
  world = false;
  layers.trade = mode === 'trade';
  layers.war = mode === 'war';
  layers.routes = false;
  town = null;
  host.classList.remove('town-open');
  const keepView = { ...view };
  render();
  view = wasWorld ? { x: 0, y: 0, w: W, h: H } : keepView;
  applyView();
  selected = null;
  showOverview();
}

/** Handles the world map's sidebar and header buttons. Returns true when it did. */
function handleWorld(t) {
  if (!world) return false;
  if (t.closest('[data-world-home]')) { setWorld(false); return true; }
  if (t.closest('[data-world-overview]')) { selectRealm(null); return true; }
  const war = t.closest('[data-world-war]');
  if (war) {
    warForm.target = war.dataset.worldWar;
    world = false;
    layers.war = true;
    layers.trade = false;
    render();
    view = { x: 0, y: 0, w: W, h: H };
    applyView();
    showOverview();
    return true;
  }
  const chip = t.closest('.map-sidebar [data-realm]');
  if (chip) { selectRealm(chip.dataset.realm); return true; }
  return false;
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
  const townId = townIdFor(state, id);
  let badge = '';
  if (townId) {
    const town = townOf(state, townId);
    const busy = currentProject(town);
    const mine = ownsTown(state, townId);
    badge = `<g class="f-town${mine ? ' own' : ''}" transform="translate(${f.r * 0.72} ${-f.r * 0.72})">
      <circle r="11"/><text y="4">${town.level}</text>${busy ? '<g class="f-busy" transform="translate(13 -9)"><circle r="7"/><path d="M-3 3l5 -5M0 -4l3 3"/></g>' : ''}
    </g>`;
  }
  return `<g class="map-feature${townId ? ' settlement' : ''}${active ? ' active' : ''}" data-feature="${id}" transform="translate(${x} ${y})">
    <circle class="f-hit" r="${f.r}"/>
    <circle class="f-dot" r="5"/>
    <circle class="f-ring" r="${f.r}"/>
    ${badge}
    <text class="f-label" y="${f.r + 15}">${esc(townId === 'grunt' ? 'Tvůj grunt' : f.name)}</text>
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

// ---------- trade layer (see trade.js) ----------

function marketsShown() {
  return Object.entries(MARKETS).filter(([, m]) => !m.scenarios || m.scenarios.includes(state.scenario));
}

function pointAlong(pts, f) {
  const seg = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    seg.push(d);
    total += d;
  }
  let left = total * f;
  for (let i = 0; i < seg.length; i++) {
    if (left <= seg[i]) {
      const k = seg[i] ? left / seg[i] : 0;
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
    }
    left -= seg[i];
  }
  return pts[pts.length - 1];
}

// 'loc' = "v zimě roku 3" (when it comes back), 'gen' = "zimy roku 3" (until when)
const SEASON_LOC = ['na jaře', 'v létě', 'na podzim', 'v zimě'];
const SEASON_GEN = ['jara', 'léta', 'podzimu', 'zimy'];
function etaText(turn, form = 'loc') {
  const ahead = turn - state.turn;
  const year = state.year + Math.floor((state.seasonIndex + ahead) / 4);
  return `${(form === 'gen' ? SEASON_GEN : SEASON_LOC)[turn % 4]} roku ${year}`;
}

function tradeLayer() {
  const t = ensureTrade(state);
  const routes = marketsShown().filter(([, m]) => !m.home).map(([id, m]) => {
    const blocked = marketAccess(state, id);
    return `<path class="trade-route${m.sea ? ' sea' : ''}${blocked ? ' blocked' : ''}" d="${smoothPath(routeFor(state, id))}"/>`;
  }).join('');
  const caravans = t.caravans.map((c) => {
    const span = Math.max(1, c.arrive - c.depart);
    const f = c.held ? 0.8 : Math.max(0.12, Math.min(0.9, (state.turn - c.depart + 0.5) / span));
    const [x, y] = pointAlong(routeFor(state, c.dest), f);
    const shape = c.sea
      ? '<path d="M-14 0h28l-6 8h-16z"/><path d="M0 -18v18M0 -18l11 14H0" class="sail"/>'
      : '<rect x="-13" y="-9" width="26" height="12" rx="2"/><circle cx="-7" cy="6" r="4.5"/><circle cx="7" cy="6" r="4.5"/>';
    return `<g class="map-caravan${c.held ? ' held' : ''}" data-caravan="${c.id}" transform="translate(${x.toFixed(0)} ${y.toFixed(0)})"><circle class="c-hit" r="22"/>${shape}</g>`;
  }).join('');
  const [ox, oy] = originPoint(state);
  const origin = `<g class="trade-origin" transform="translate(${ox} ${oy})"><rect x="-9" y="-9" width="18" height="18" transform="rotate(45)"/></g>`;
  return routes + origin + caravans;
}

function marketMarkers() {
  return marketsShown().map(([id, m]) => {
    const [x, y] = m.at;
    const blocked = marketAccess(state, id);
    return `<g class="map-market${blocked ? ' blocked' : ''}${selected && selected.type === 'market' && selected.id === id ? ' active' : ''}" data-market="${id}" transform="translate(${x} ${y})">
      <circle class="m-hit" r="30"/><circle class="m-ring" r="15"/><path class="m-coin" d="M-6 -3h12M-6 3h12M0 -8v16"/>
      <text class="m-label" y="${y < 80 ? 36 : -24}" x="${x > 1100 ? 12 : x < 200 ? -12 : 0}" style="text-anchor:${x > 1100 ? 'end' : x < 200 ? 'start' : 'middle'}">${esc(m.name)}</text>
    </g>`;
  }).join('');
}

function stockRows() {
  const t = ensureTrade(state);
  return Object.entries(GOODS).map(([g, def]) =>
    `<div class="trade-stock-row${t.stock[g] ? '' : ' empty'}"><span>${esc(def.name)}</span><div class="stat-bar"><div class="stat-bar-fill wealth" style="width:${(t.stock[g] / MAX_STOCK) * 100}%"></div></div><b>${t.stock[g]}</b></div>`).join('');
}

function contractList(filterDest) {
  const t = ensureTrade(state);
  const list = t.contracts.filter((c) => !filterDest || c.dest === filterDest);
  if (!list.length) return '';
  const coin = state.scenario === 'sedlak' ? 'grošů' : 'zlata';
  return `<h4 class="map-sub">Zakázky</h4><ul class="trade-contracts">${list.map((c) => `
    <li class="${c.obligation ? 'obligation' : ''}">
      <b>${esc(interpolate(state, c.giver))} ${esc(loadText(c.qty, c.good))}</b>
      <span>${esc(MARKETS[c.dest].to)} do ${etaText(c.until, 'gen')} · odměna ${c.reward} ${coin}${c.favor ? ` a přízeň +${c.favor}` : ''}${c.prestige ? ` a prestiž +${c.prestige}` : ''}</span>
      <em>${c.taken ? 'Náklad je na cestě.' : c.obligation ? 'Nesplnění stojí přízeň.' : 'Nabídka bez závazku.'}</em>
    </li>`).join('')}</ul>`;
}

function showTradeOverview() {
  const t = ensureTrade(state);
  sidebar(`
    <span class="panel-overline">Obchod</span>
    <h3 class="panel-title">Sklad a karavany</h3>
    <p class="map-desc">${state.scenario === 'sedlak' ? 'Co grunt vypěstuje navíc, můžeš prodat v Brodu nebo odvézt pánovi. Svobodný sedlák si může koupit místo v kupecké karavaně do ciziny.' : 'Tvé země plní sklad zbožím. Prodej ho hned v Brodu, nebo ho pošli karavanou či lodí do ciziny, kde platí víc, ale cesta trvá a hrozí přepadení.'} Klikni na trh na mapě.</p>
    <h4 class="map-sub">Sklad <small>· nejvýš ${MAX_STOCK} vozů od každého</small></h4>
    <div class="trade-stock">${stockRows()}</div>
    <h4 class="map-sub">Na cestě</h4>
    ${t.caravans.length ? `<ul class="trade-caravans">${t.caravans.map((c) => `
      <li data-goto-market="${c.dest}"><b>${c.sea ? 'Loď' : 'Karavana'} · ${esc(loadText(c.qty, c.good))}</b><span>${esc(MARKETS[c.dest].to)}${c.escort ? ' · s doprovodem' : ''} · ${c.held ? '<em class="bad">přepadena!</em>' : `návrat ${etaText(c.arrive)}`}</span></li>`).join('')}</ul>`
      : '<p class="map-desc">Žádná karavana není na cestě.</p>'}
    ${contractList()}
    <h4 class="map-sub">Trhy</h4>
    <div class="map-chip-list">${marketsShown().map(([id, m]) => {
      const blocked = marketAccess(state, id);
      return `<button class="map-chip" data-goto-market="${id}"><span>${esc(m.name)}</span><em class="${blocked ? 'bad' : 'good'}">${m.home ? 'prodej hned' : blocked ? 'nedostupné' : `${m.days} obd. · riziko ${Math.round(riskOf(state, id, false) * 100)} %`}</em></button>`;
    }).join('')}</div>
    ${t.log.length ? `<h4 class="map-sub">Z obchodní knihy</h4><ul class="trade-log">${t.log.slice(0, 4).map((l) => `<li>${esc(l.text)}</li>`).join('')}</ul>` : ''}
    <p class="map-desc trade-coin">V pokladně: <b>${state.resources.gold}</b> ${state.scenario === 'sedlak' ? 'grošů' : 'zlata'}</p>
  `);
}

function showMarket(dest) {
  const t = ensureTrade(state);
  const m = MARKETS[dest];
  const blocked = marketAccess(state, dest);
  const coin = state.scenario === 'sedlak' ? 'grošů' : 'zlata';
  const rows = Object.keys(GOODS).filter((g) => m.sell[g] || m.buy?.[g]).map((g) => {
    const sell = m.sell[g] ? price(state, dest, g) : null;
    const buy = m.buy?.[g] ? price(state, dest, g, 'buy') : null;
    const trend = m.sell[g] ? (t.drift[dest]?.[g] || 1) : 1;
    const arrow = trend > 1.1 ? '<i class="up">▲</i>' : trend < 0.9 ? '<i class="down">▼</i>' : '';
    const actions = m.home && !blocked ? `
      <button class="trade-mini" data-trade="sell" data-good="${g}" data-n="1"${t.stock[g] && sell ? '' : ' disabled'}>Prodat 1</button>
      <button class="trade-mini" data-trade="sell" data-good="${g}" data-n="${t.stock[g]}"${t.stock[g] > 1 && sell ? '' : ' disabled'}>Vše</button>
      ${buy ? `<button class="trade-mini" data-trade="buy" data-good="${g}" data-dest="${dest}"${state.resources.gold >= buy && t.stock[g] < MAX_STOCK ? '' : ' disabled'}>Koupit</button>` : ''}`
      : buy && !blocked ? `<button class="trade-mini" data-trade="buy" data-good="${g}" data-dest="${dest}"${state.resources.gold >= buy && t.stock[g] < MAX_STOCK ? '' : ' disabled'}>Koupit</button>` : '';
    return `<tr><td>${esc(GOODS[g].name)}</td><td>${sell ? `${sell}${arrow}` : '–'}</td><td>${buy || '–'}</td><td>${t.stock[g]}</td><td class="trade-act">${actions}</td></tr>`;
  }).join('');
  let form = '';
  if (!m.home && !blocked) {
    const goods = Object.keys(GOODS).filter((g) => m.sell[g] && t.stock[g] > 0);
    if (tradeForm.dest !== dest || !goods.includes(tradeForm.good)) tradeForm = { dest, good: goods[0] || null, qty: Math.min(3, t.stock[goods[0]] || 1), escort: false };
    const f = tradeForm;
    if (!goods.length) {
      form = `<p class="map-desc">Ve skladu nemáš nic, co by se tu dalo prodat.</p>`;
    } else {
      f.qty = Math.max(1, Math.min(f.qty, t.stock[f.good]));
      const value = f.qty * price(state, dest, f.good);
      const fee = caravanFee(state, dest, f.qty) + (f.escort ? 1 : 0);
      const contract = t.contracts.find((c) => c.dest === dest && c.good === f.good && c.qty <= f.qty && !c.taken);
      const why = canSend(state, dest, f.good, f.qty, f.escort);
      form = `
        <h4 class="map-sub">Vypravit ${m.sea ? 'loď' : 'karavanu'}</h4>
        <div class="trade-form">
          <div class="trade-goods">${goods.map((g) => `<button class="trade-chip${g === f.good ? ' on' : ''}" data-trade="good" data-good="${g}">${esc(GOODS[g].name)} <small>${t.stock[g]}</small></button>`).join('')}</div>
          <div class="trade-qty">
            <button class="trade-mini" data-trade="qty" data-n="-1">−</button>
            <b>${esc(loadText(f.qty, f.good))}</b>
            <button class="trade-mini" data-trade="qty" data-n="1">+</button>
          </div>
          <label class="trade-escort"><button class="trade-chip${f.escort ? ' on' : ''}" data-trade="escort">${f.escort ? '✓ ' : ''}Ozbrojený doprovod</button><span>${ESCORT_ARMY} muži na cestu, poloviční riziko</span></label>
          <div class="trade-estimate">
            <span>Odhad výnosu <b>${contract ? contract.reward : value} ${coin}</b>${contract ? ' (zakázka)' : ''}${m.favor && !contract ? (f.qty >= 3 ? ` a přízeň +${Math.min(6, Math.floor(f.qty / 2))}` : ' · přízeň až od 3 vozů') : ''}</span>
            <span>Poplatky <b>${fee}</b> · riziko <b>${Math.round(riskOf(state, dest, f.escort) * 100)} %</b> · návrat <b>${etaText(state.turn + m.days)}</b></span>
          </div>
          ${why ? `<p class="map-warning">${esc(why)}</p>` : ''}
          <button class="seal-button primary map-choose" data-trade="send"${why ? ' disabled' : ''}>Vyslat ${m.sea ? 'loď' : 'karavanu'}</button>
        </div>`;
    }
  }
  const convert = m.home ? `
    <h4 class="map-sub">Sýpky a sklad</h4>
    <div class="trade-convert">
      <button class="trade-mini" data-trade="convert-in"${state.resources.food >= 6 && t.stock.grain < MAX_STOCK ? '' : ' disabled'}>Vymlátit vůz obilí ze zásob (−6 jídla)</button>
      <button class="trade-mini" data-trade="convert-out"${t.stock.grain ? '' : ' disabled'}>Vrátit vůz do sýpek (+4 jídla)</button>
    </div>` : '';
  sidebar(`
    <span class="panel-overline">${m.home ? 'Domácí trh' : `${m.sea ? 'Přes moře' : 'Po souši'} · ${m.days} ${m.days === 1 ? 'období' : 'období'} cesty`}</span>
    <h3 class="panel-title">${esc(m.name)}</h3>
    ${!m.home ? `<span class="map-verdict ${m.risk > 0.2 ? 'bad' : m.risk > 0.1 ? 'warn' : 'good'}">Nebezpečí: ${esc(m.danger)} · ${Math.round(riskOf(state, dest, false) * 100)} %</span>` : ''}
    <p class="map-desc">${esc(m.text)}</p>
    ${blocked ? `<p class="map-warning">${esc(blocked)}</p>` : ''}
    <table class="trade-table"><thead><tr><th>Zboží</th><th title="Kolik tu zaplatí za vůz">Platí</th><th title="Kolik tu stojí vůz">Stojí</th><th>Sklad</th><th></th></tr></thead><tbody>${rows}</tbody></table>
    ${convert}
    ${form}
    ${contractList(dest)}
    <button class="map-back" data-overview>← Přehled obchodu</button>
  `);
}

function refreshTradeView(message) {
  const keepView = { ...view };
  const keep = selected;
  render();
  view = keepView;
  applyView();
  selected = null;
  if (keep) selectThing(keep);
  else showOverview();
  document.dispatchEvent(new CustomEvent('kingdom:trade', { detail: { message } }));
}

function handleTrade(btn) {
  const kind = btn.dataset.trade;
  const t = ensureTrade(state);
  let message = null;
  if (kind === 'sell') message = sellAtHome(state, btn.dataset.good, Number(btn.dataset.n));
  else if (kind === 'buy') message = buyAtHome(state, btn.dataset.good, 1, btn.dataset.dest || 'brod');
  else if (kind === 'convert-in') message = convertFood(state, true);
  else if (kind === 'convert-out') message = convertFood(state, false);
  else if (kind === 'good') { tradeForm.good = btn.dataset.good; tradeForm.qty = Math.min(tradeForm.qty, t.stock[tradeForm.good]) || 1; }
  else if (kind === 'qty') tradeForm.qty = Math.max(1, Math.min(10, tradeForm.qty + Number(btn.dataset.n)));
  else if (kind === 'escort') tradeForm.escort = !tradeForm.escort;
  else if (kind === 'send') {
    const res = sendCaravan(state, tradeForm.dest, tradeForm.good, tradeForm.qty, tradeForm.escort);
    message = res.error || `${MARKETS[tradeForm.dest].sea ? 'Loď vyplula' : 'Karavana vyrazila'} ${MARKETS[tradeForm.dest].to}.`;
    tradeForm.dest = null;
  }
  if (['good', 'qty', 'escort'].includes(kind)) { showMarket(tradeForm.dest); return; }
  refreshTradeView(message);
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
  if (world) return sidebar(worldSidebar(state, realmSel));
  if (layers.war && state.scenario !== 'sedlak') return showWarOverview();
  if (layers.trade) return showTradeOverview();
  if (state.scenario === 'sedlak') return showPeasantOverview();
  return showLandsOverview();
}

// ---------- the lands: compact cards instead of long text ----------

const bar = (label, value, cls) => `<div class="mc-bar"><span>${label}</span><i><b class="${cls}" style="width:${value}%"></b></i><em>${value}</em></div>`;
const shortName = (p) => p.name.replace(/ \(.*\)$/, '');
const buildingsWord = (n) => `${n} ${n === 1 ? 'stavba' : n >= 2 && n <= 4 ? 'stavby' : 'staveb'}`;

/** Settlements of a province as small cards: level, work in progress, and whether the player can build. */
function settlementCards(provinceId) {
  const list = Object.entries(FEATURES).filter(([, f]) => f.province === provinceId);
  if (!list.length) return '';
  return `<h4 class="map-sub">Sídla</h4><div class="mc-places">${list.map(([fid, f]) => {
    const tid = townIdFor(state, fid);
    const t = tid && townOf(state, tid);
    const mine = tid && ownsTown(state, tid);
    const busy = t && currentProject(t);
    return `<button class="mc-place${mine ? ' own' : ''}" data-goto-feature="${fid}">
      ${t ? `<span class="mc-level" title="Úroveň sídla">${t.level}</span>` : '<span class="mc-level dot"></span>'}
      <span class="mc-place-name"><b>${esc(tid === 'grunt' ? 'Tvůj grunt' : f.name)}</b><small>${esc(t ? levelName(tid, t.level) : f.kind)}${busy ? ' · staví se' : ''}</small></span>
      ${mine ? '<em class="mc-action">Stavět</em>' : t ? '<em class="mc-action ghost">Prohlédnout</em>' : ''}
    </button>`;
  }).join('')}</div>`;
}

/** One land as a card: who holds it, how it stands. */
function landCard(prov) {
  const def = PROVINCES[prov.id];
  const f = foreignOwner(prov.id);
  let pill;
  let body = '';
  if (prov.lost) pill = ['Ztracena', 'bad'];
  else if (f) {
    const att = f.house ? f.house.attitude : null;
    pill = [f.label + (att !== null ? ` · ${attitudeLabel(att).toLowerCase()}` : ''), att === null ? 'neutral' : att >= 55 ? 'good' : att < 40 ? 'bad' : 'warn'];
  } else {
    pill = verdict(prov);
    body = bar('Věrnost', prov.loyalty, 'loyalty') + bar('Nepokoje', prov.unrest, 'unrest');
  }
  const own = !f && !prov.lost;
  return `<button class="mc-land${own ? ' own' : ''}" data-goto-province="${prov.id}" style="--pf:${def.color}">
    <span class="mc-swatch"></span>
    <span class="mc-head"><b>${esc(def.label)}</b><em class="mc-pill ${pill[1]}">${esc(pill[0])}</em></span>
    ${body}
  </button>`;
}

const LEGEND = (peasant) => `<ul class="map-legend compact">
  <li><span class="lg-town"></span>Číslo u sídla = úroveň; ${peasant ? 'na gruntu' : 've vlastních krajích'} stavíš</li>
  ${peasant ? '' : '<li><span class="lg-own"></span>Zlatý okraj = tvá země</li><li><span class="lg-smoke"></span>Kouř = nepokoje</li>'}
</ul>`;

function showLandsOverview() {
  const king = state.scenario === 'panovnik';
  const own = state.provinces.filter((p) => !p.lost && !foreignOwner(p.id));
  const others = state.provinces.filter((p) => p.lost || foreignOwner(p.id));
  const avg = (k) => Math.round(own.reduce((sum, p) => sum + p[k], 0) / (own.length || 1));
  const worst = own.slice().sort((a, b) => b.unrest - a.unrest)[0];
  sidebar(`
    <span class="panel-overline">${king ? 'Království' : 'Tvé panství'}</span>
    <h3 class="panel-title">${king ? 'Vlčí Úděl' : own.length > 1 ? `${own.length} kraje rodu` : esc(own[0] ? shortName(own[0]) : 'Bez půdy')}</h3>
    ${own.length > 1 ? `<div class="mc-summary">${bar('Ø věrnost', avg('loyalty'), 'loyalty')}${bar('Ø nepokoje', avg('unrest'), 'unrest')}</div>` : ''}
    ${worst && worst.unrest >= 45 ? `<p class="map-warning">Nejvíc to vře v kraji <strong>${esc(PROVINCES[worst.id].label)}</strong>.</p>` : ''}
    <h4 class="map-sub">${king ? 'Kraje koruny' : 'Tvá země'}</h4>
    <div class="mc-lands">${own.map(landCard).join('')}</div>
    ${others.length ? `<h4 class="map-sub">${king ? 'Ztracené kraje' : 'Kdo drží zbytek země'}</h4><div class="mc-lands">${others.map(landCard).join('')}</div>` : ''}
    ${LEGEND(false)}
  `);
}

function showPeasantOverview() {
  const home = state.peasant || { village: 'Lipnice', province: 'brodna' };
  const r = state.resources;
  const farm = townOf(state, 'grunt');
  const busy = currentProject(farm);
  sidebar(`
    <span class="panel-overline">Kraj ${esc(PROVINCES[home.province].label)} · panství pánů z Bílé Brány</span>
    <h3 class="panel-title">Ves ${esc(home.village)}</h3>
    <button class="mc-farm" data-goto-feature="${PEASANT_VILLAGE}">
      <span class="mc-level big">${farm.level}</span>
      <span class="mc-place-name"><b>Tvůj grunt</b><small>${esc(levelName('grunt', farm.level))} · ${buildingsWord(farm.buildings.filter((b) => b.ready).length)}${busy ? ' · staví se' : ''}</small></span>
      <em class="mc-action">Stavět</em>
    </button>
    <div class="mc-summary">${bar('Grunt', r.stability, 'wealth')}${bar('Přízeň pána', r.favor, 'loyalty')}${bar('Pověst', r.prestige, 'garrison')}</div>
    <h4 class="map-sub">Kdo drží zemi</h4>
    <div class="mc-lands">${state.provinces.map(landCard).join('')}</div>
    ${LEGEND(true)}
  `);
}

function showForeignProvince(id, f) {
  const p = PROVINCES[id];
  const h = f.house;
  const peasant = state.scenario === 'sedlak';
  const home = state.peasant;
  sidebar(`
    <span class="panel-overline">${f.kind === 'crown' ? 'Korunní země' : peasant ? 'Panství velkého rodu' : 'Panství soupeřícího rodu'}</span>
    <h3 class="panel-title">${esc(p.label)}</h3>
    <div class="mc-owner">
      <b>${esc(f.name)}</b>
      <span>${h ? `${h.head.gender === 'female' ? 'Paní' : 'Pán'} ${esc(h.head.name)}, ${h.head.age} let${!peasant && h.ally ? ' · spojenec' : ''}${!peasant && h.married ? ' · spřízněni sňatkem' : ''}` : `${state.king ? `${state.king.gender === 'female' ? 'Královna' : 'Král'} ${esc(state.king.name)}` : ''}`}</span>
    </div>
    <p class="map-desc">${esc(h ? f.def.text : p.text)}</p>
    ${!peasant && h ? `<div class="mc-summary">${bar('Vztah k tobě', h.attitude, 'loyalty')}${bar('Moc rodu', h.power, 'garrison')}</div>` : ''}
    ${!peasant && !h ? `<div class="mc-summary">${bar('Přízeň krále', state.resources.favor ?? 0, 'loyalty')}</div>` : ''}
    ${peasant && home && id === home.province ? `<p class="map-note">Tady, ve vsi ${esc(home.village)}, stojí tvůj grunt.</p>` : ''}
    ${settlementCards(id)}
    <button class="map-back" data-overview>← Celá země</button>
  `);
}

function showProvince(id) {
  const foreign = foreignOwner(id);
  if (foreign) return showForeignProvince(id, foreign);
  const p = PROVINCES[id];
  const prov = state.provinces.find((x) => x.id === id);
  const [v, cls] = verdict(prov);
  sidebar(`
    <span class="panel-overline">${esc(p.subtitle)}${id === 'capital' ? ' · hlavní město' : ''}</span>
    <h3 class="panel-title">${esc(p.label)}</h3>
    <em class="mc-pill big ${cls}">${v}</em>
    <p class="map-desc">${esc(p.text)}</p>
    <div class="mc-summary">
      ${bar('Věrnost', prov.loyalty, 'loyalty')}${bar('Nepokoje', prov.unrest, 'unrest')}
      ${bar('Bohatství', prov.wealth, 'wealth')}${bar('Posádka', prov.garrison, 'garrison')}
    </div>
    ${settlementCards(id)}
    <button class="map-back" data-overview>← Celá země</button>
  `);
}

function showFeature(id) {
  const f = FEATURES[id];
  const routes = id === 'vassal' ? Object.keys(ROUTES) : [];
  sidebar(`
    <span class="panel-overline">${esc(f.kind)}</span>
    <h3 class="panel-title">${esc(f.name)}</h3>
    <p class="map-desc">${esc(f.text)}</p>
    ${f.province ? `<button class="mc-place" data-goto-province="${f.province}"><span class="mc-level dot"></span><span class="mc-place-name"><b>${esc(PROVINCES[f.province].label)}</b><small>kraj</small></span></button>` : ''}
    ${routes.length ? `<h4 class="map-sub">Cesty k Orlí Stráži</h4><div class="map-chip-list">
      ${routes.map((k) => `<button class="map-chip route-chip" data-goto-route="${k}" style="--rc:${ROUTES[k].color}">${TERRAIN_DEFS[k].icon}<span>${TERRAIN_DEFS[k].label}</span><em>${Math.round(TERRAIN_DEFS[k].baseRisk * 100)} % ${TERRAIN_DEFS[k].riskLabel}</em></button>`).join('')}
    </div>` : ''}
    <button class="map-back" data-overview>← Celá země</button>
  `);
}

function showRoute(key) {
  const t = TERRAIN_DEFS[key];
  const pct = Math.round(t.baseRisk * 100);
  sidebar(`
    <span class="panel-overline">Cesta k Orlí Stráži</span>
    <h3 class="panel-title">${t.label}</h3>
    <div class="map-risk" style="--rc:${ROUTES[key].color}">
      <span class="risk-num">${pct} %</span><span class="risk-label">riziko: ${t.riskLabel}</span>
      <div class="risk-bar"><div style="width:${pct}%"></div></div>
    </div>
    <p class="map-desc">${ROUTE_TEXT[key]}</p>
    ${options.focusRoutes ? '<p class="map-note">Cestu vybereš v příběhu, tady si ji jen prohlédneš.</p>' : ''}
    <button class="map-back" data-goto-feature="vassal">← Všechny cesty</button>
  `);
}

// ---------- war (see war.js) ----------

function targetPoint(t) {
  if (t.at) return t.at;
  const p = t.province && PROVINCES[t.province];
  // away from the province's own name and from its towns
  if (t.province === 'brodna') return [455, 705];
  return p ? p.garrisonAt : [W / 2, H / 2];
}

function warPath(t) {
  const from = warOrigin(state);
  const to = targetPoint(t);
  const mid = [(from[0] + to[0]) / 2 + (to[1] - from[1]) * 0.12, (from[1] + to[1]) / 2 - (to[0] - from[0]) * 0.12];
  return [from, mid, to];
}

function warLayer() {
  const targets = warTargets(state);
  const marks = Object.entries(targets).map(([key, t]) => {
    const [x, y] = targetPoint(t);
    const active = (state.war && state.war.target === key) || warForm.target === key;
    return `<g class="war-target${active ? ' active' : ''}" data-war-target="${key}" transform="translate(${x} ${y})">
      <circle class="wt-hit" r="30"/><circle class="wt-ring" r="17"/>
      <path class="wt-swords" d="M-8 -8L8 8M8 -8L-8 8M-10 -4l4 -4M10 -4l-4 -4"/>
      ${t.province ? '' : `<text class="wt-label" y="${y < 100 ? 36 : -24}" style="text-anchor:${x > 1100 ? 'end' : x < 200 ? 'start' : 'middle'}" x="${x > 1100 ? 14 : x < 200 ? -14 : 0}">${esc(t.name.replace(/^(Znovudobytí|Soukromá válka): /, ''))}</text>`}
    </g>`;
  }).join('');
  let army = '';
  const t = warTarget(state);
  if (state.war && t && !t.gone) {
    const pts = warPath(t);
    // at the target the army camps just short of it, so the banner stays visible
    const [x, y] = pointAlong(pts, Math.min(0.84, marchShare(state)));
    army = `<path class="war-route" d="${smoothPath(pts)}"/>
      <g class="war-army" data-war-army transform="translate(${x.toFixed(0)} ${y.toFixed(0)})">
        <circle class="wa-hit" r="26"/>
        <path class="wa-pole" d="M0 12V-26"/><path class="wa-flag" d="M0 -26h22l-6 7 6 7H0z"/>
        <circle class="wa-base" r="9" cy="12"/><text class="wa-men" y="16">${state.war.power}</text>
      </g>`;
  }
  return marks + army;
}

const SIZE_LABEL = { small: 'Oddíl', medium: 'Vojsko', large: 'Celá hotovost' };

function showWarOverview() {
  if (state.war) return showWarStatus();
  const targets = warTargets(state);
  const keys = Object.keys(targets);
  if (!warForm.target || !targets[warForm.target]) warForm.target = keys[0] || null;
  const rest = state.turn < (state.warNext || 0) ? `<p class="map-warning">Vojsko se zotavuje z minulého tažení. Další můžeš vypravit ${etaText(state.warNext)}.</p>` : '';
  const t = targets[warForm.target];
  const men = SIZES[warForm.size];
  const why = t ? warBlock(state, warForm.target, warForm.size) : 'Není proti komu táhnout.';
  const [odds, tone] = t ? oddsLabel(state, warForm.target, men) : ['', ''];
  const tributes = (state.tributes || []).map((x) => `<li>${esc(x.from[0].toUpperCase() + x.from.slice(1))}: ${x.gold} zlata za období, do ${etaText(x.until, 'gen')}</li>`).join('');
  sidebar(`
    <span class="panel-overline">Válka</span>
    <h3 class="panel-title">Tažení</h3>
    <p class="map-desc">Vypravit vojsko je velké rozhodnutí. Tažení trvá několik období, vojsko jí ze sýpek a každé období v poli přinese bitvu, obléhání nebo jiné zkoušky. Klikni na cíl na mapě.</p>
    ${rest}
    <h4 class="map-sub">Cíle</h4>
    <div class="map-chip-list">${keys.map((k) => `<button class="map-chip${k === warForm.target ? ' on' : ''}" data-war-target="${k}"><span>${esc(targets[k].name)}</span><em>${targets[k].march} obd. pochodu</em></button>`).join('') || '<p class="map-desc">Žádný cíl.</p>'}</div>
    ${t ? `
      <h4 class="map-sub">${esc(t.name)}</h4>
      <p class="map-desc">${esc(t.text)}</p>
      <p class="map-desc war-reward"><b>Vítězství přinese:</b> ${esc(t.reward)}.</p>
      <h4 class="map-sub">Kolik mužů</h4>
      <div class="trade-goods">${Object.entries(SIZES).map(([k, n]) => `<button class="trade-chip${k === warForm.size ? ' on' : ''}" data-war-size="${k}">${SIZE_LABEL[k]} <small>${n}</small></button>`).join('')}</div>
      <h4 class="map-sub">Kdo povede</h4>
      <div class="trade-goods">
        <button class="trade-chip${warForm.leader === 'marshal' ? ' on' : ''}" data-war-leader="marshal">${esc(state.marshal.name)} <small>${esc(leaderLabel('marshal', state))}</small></button>
        <button class="trade-chip${warForm.leader === 'ruler' ? ' on' : ''}" data-war-leader="ruler">${esc(state.ruler.name)} <small>osobně</small></button>
      </div>
      <p class="map-desc war-note">${warForm.leader === 'ruler' ? (state.ruler.gender === 'female' ? 'Vládkyně v čele zvedá morálku i šance, ale může být zraněna a doma bude chybět.' : 'Vládce v čele zvedá morálku i šance, ale může být zraněn a doma bude chybět.') : `${state.marshal.name} vede bez rizika pro ${state.ruler.gender === 'female' ? 'vládkyni' : 'vládce'}, muži ale bojují s menším zápalem.`}</p>
      <div class="trade-estimate">
        <span>Síly: <b class="${tone}">${odds}</b> · doma zůstane ${Math.max(0, state.resources.army - men)} vojska</span>
        <span>Zásoby: ${Math.ceil(men / 8)} jídla za období · v sýpkách ${state.resources.food}</span>
      </div>
      ${why ? `<p class="map-warning">${esc(why)}</p>` : ''}
      <button class="seal-button primary map-choose" data-war-start${why ? ' disabled' : ''}>Vytáhnout do pole</button>` : ''}
    ${tributes ? `<h4 class="map-sub">Tributy</h4><ul class="trade-log">${tributes}</ul>` : ''}
  `);
}

function showWarStatus() {
  const w = state.war;
  const t = warTarget(state);
  const leader = w.leader === 'ruler' ? state.ruler.name : state.marshal.name;
  const marching = state.turn < w.arrive;
  const [odds, tone] = oddsLabel(state, w.target, w.power);
  sidebar(`
    <span class="panel-overline">Vojsko v poli</span>
    <h3 class="panel-title">${esc(t.name)}</h3>
    <span class="map-verdict ${marching ? 'warn' : 'good'}">${marching ? `Na pochodu · na místě ${etaText(w.arrive)}` : `V poli ${w.seasons} ${w.seasons === 1 ? 'období' : 'období'}`}</span>
    <p class="map-desc">Velí ${esc(leader)} (${leaderLabel(w.leader, state)}). ${esc(t.text)}</p>
    ${statRow('Postup', w.progress, 'wealth')}
    ${statRow('Morálka', w.morale, 'loyalty')}
    <div class="trade-estimate">
      <span>Mužů v poli: <b>${w.power}</b> · <b class="${tone}">${odds}</b></span>
      <span>Spotřeba: ${Math.ceil(w.power / 8)} jídla za období · v sýpkách ${state.resources.food}</span>
    </div>
    <p class="map-desc war-note">Tažení vyhraješ při plném postupu. Když morálka klesne na nulu nebo padnou skoro všichni muži, je prohráno.</p>
    <button class="trade-mini war-recall" data-war-recall>Odvolat vojsko domů</button>
  `);
}

function handleWar(t) {
  const target = t.closest('[data-war-target]');
  if (target) { warForm.target = target.dataset.warTarget; refreshWar(); return true; }
  const size = t.closest('[data-war-size]');
  if (size) { warForm.size = size.dataset.warSize; showWarOverview(); return true; }
  const leader = t.closest('[data-war-leader]');
  if (leader) { warForm.leader = leader.dataset.warLeader; showWarOverview(); return true; }
  const start = t.closest('[data-war-start]');
  if (start) {
    if (!start.disabled) {
      const res = startWar(state, warForm.target, warForm.size, warForm.leader);
      refreshWar();
      document.dispatchEvent(new CustomEvent('kingdom:war', { detail: { message: res.error || res.message } }));
    }
    return true;
  }
  const recall = t.closest('[data-war-recall]');
  if (recall) {
    if (!recall.dataset.confirm) { recall.dataset.confirm = '1'; recall.textContent = 'Opravdu odvolat? Stojí to prestiž. Klikni znovu.'; recall.classList.add('confirm'); return true; }
    const res = recallWar(state);
    refreshWar();
    document.dispatchEvent(new CustomEvent('kingdom:war', { detail: { message: res.error || res.message } }));
    return true;
  }
  return false;
}

function refreshWar() {
  const keepView = { ...view };
  layers.war = true;
  layers.trade = false;
  render();
  view = keepView;
  applyView();
  selected = null;
  showOverview();
}

// ---------- selection + view ----------

function selectThing(sel) {
  selected = sel;
  svg.querySelectorAll('.map-province.selected, .map-feature.active, .map-route.active, .map-market.active').forEach((el) => el.classList.remove('selected', 'active'));
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
  } else if (sel.type === 'market') {
    svg.querySelector(`.map-market[data-market="${sel.id}"]`)?.classList.add('active');
    showMarket(sel.id);
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
  if (target.closest('[data-war-army]') && state.war) {
    const t = warTarget(state);
    return `<strong>Vojsko · ${state.war.power} mužů</strong><span>${esc(t.name)} · postup ${state.war.progress} % · morálka ${state.war.morale}</span>`;
  }
  const warEl = target.closest('[data-war-target]');
  if (warEl && layers.war) {
    const t = warTargets(state)[warEl.dataset.warTarget];
    if (t) return `<strong>${esc(t.name)}</strong><span>${t.march} obd. pochodu · ${esc(t.reward)}</span>`;
  }
  const marketEl = target.closest('[data-market]');
  const caravanEl = target.closest('[data-caravan]');
  if (caravanEl) {
    const c = ensureTrade(state).caravans.find((x) => String(x.id) === caravanEl.dataset.caravan);
    if (c) return `<strong>${c.sea ? 'Loď' : 'Karavana'} · ${esc(loadText(c.qty, c.good))}</strong><span>${esc(MARKETS[c.dest].to)} · ${c.held ? 'přepadena!' : `návrat ${etaText(c.arrive)}`}</span>`;
  }
  if (marketEl) {
    const m = MARKETS[marketEl.dataset.market];
    return `<strong>${esc(m.name)}</strong><span>${m.home ? 'domácí trh, prodej hned' : `${m.days} ${m.days === 1 ? 'období' : 'období'} cesty · riziko ${Math.round(m.risk * 100)} %`}</span>`;
  }
  const provEl = target.closest('[data-province]');
  const featEl = target.closest('[data-feature]');
  const routeEl = target.closest('[data-route]');
  if (featEl) {
    const f = FEATURES[featEl.dataset.feature];
    const tid = townIdFor(state, featEl.dataset.feature);
    if (tid) {
      const tw = townOf(state, tid);
      return `<strong>${esc(tid === 'grunt' ? 'Tvůj grunt' : f.name)}</strong><span>${esc(levelName(tid, tw.level))} · ${tw.buildings.filter((b) => b.ready).length} staveb${currentProject(tw) ? ' · staví se' : ''}</span><span>${ownsTown(state, tid) ? 'Klikni a stav' : 'Klikni a prohlédni si'}</span>`;
    }
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
    if (town) return;
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
    const marketEl = e.target.closest('[data-market]');
    const caravanEl = e.target.closest('[data-caravan]');
    if (caravanEl) {
      const c = ensureTrade(state).caravans.find((x) => String(x.id) === caravanEl.dataset.caravan);
      if (c) return selectThing({ type: 'market', id: c.dest });
    }
    if (marketEl) return selectThing({ type: 'market', id: marketEl.dataset.market });
    if (e.target.closest('[data-war-army]')) { refreshWar(); return; }
    const warEl = e.target.closest('[data-war-target]');
    if (warEl && layers.war) { warForm.target = warEl.dataset.warTarget; refreshWar(); return; }
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

// ---------- settlements: building in towns and villages (build.js, town.js) ----------

function openTown(placeId) {
  const id = townIdFor(state, placeId);
  if (!id) return;
  town = { id, place: placeId, slot: null };
  hideTooltip();
  // the map glides to the place underneath, so going back lands there
  const [x, y] = FEATURES[placeId].at;
  view = fitBox({ x: x - 210, y: y - 150, w: 420, h: 300 });
  applyView();
  host.classList.add('town-open');
  drawTown();
}

function closeTown() {
  const place = town && town.place;
  town = null;
  host.classList.remove('town-open');
  const stage = host.querySelector('.town-stage');
  if (stage) { stage.hidden = true; stage.innerHTML = ''; }
  // the badge on the map may have changed
  const keepView = { ...view };
  render();
  view = keepView;
  applyView();
  selected = null;
  if (place) selectThing({ type: 'feature', id: place });
  else showOverview();
}

function drawTown() {
  const stage = host.querySelector('.town-stage');
  stage.innerHTML = renderTownPlan(state, town.id, town.slot);
  stage.hidden = false;
  sidebar(townSidebar(state, town.id, town.slot));
}

function selectSlot(slot) {
  town.slot = slot;
  const stage = host.querySelector('.town-stage');
  stage.querySelectorAll('.plot.selected').forEach((el) => el.classList.remove('selected'));
  if (slot !== null) stage.querySelector(`.plot[data-town-slot="${slot}"]`)?.classList.add('selected');
  sidebar(townSidebar(state, town.id, slot));
  // on a phone the sidebar sits under the plan: bring the choice into view
  if (slot !== null && window.matchMedia('(max-width: 900px)').matches) {
    host.querySelector('.map-sidebar').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function townAction(result) {
  if (!result) return;
  if (!result.error) town.slot = null;
  drawTown();
  document.dispatchEvent(new CustomEvent('kingdom:build', { detail: { message: result.error || result.message, error: !!result.error } }));
}

function handleTownClick(t) {
  if (t.closest('[data-close-town]')) { closeTown(); return true; }
  const build = t.closest('[data-build]');
  if (build) {
    if (!build.disabled) townAction(startBuilding(state, town.id, build.dataset.build, Number(build.dataset.slot)));
    return true;
  }
  if (t.closest('[data-upgrade-town]')) {
    if (!t.closest('[data-upgrade-town]').disabled) townAction(startUpgrade(state, town.id));
    return true;
  }
  if (t.closest('[data-cancel-project]')) { townAction(cancelProject(state, town.id)); return true; }
  const demo = t.closest('[data-demolish]');
  if (demo) {
    if (demo.dataset.confirm) townAction(demolish(state, town.id, Number(demo.dataset.demolish)));
    else { demo.dataset.confirm = '1'; demo.textContent = 'Opravdu strhnout? Klikni znovu.'; demo.classList.add('confirm'); }
    return true;
  }
  if (t.closest('[data-town-slot-clear]')) { selectSlot(null); return true; }
  const slot = t.closest('[data-town-slot]');
  if (slot) { selectSlot(Number(slot.dataset.townSlot)); return true; }
  return false;
}

function focusFeature(id) {
  if (townIdFor(state, id)) { openTown(id); return; }
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
  const mapView = document.getElementById('map-view');
  mapView.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && town && e.target.closest && e.target.closest('.plot[data-town-slot]')) {
      e.preventDefault();
      e.stopPropagation();
      selectSlot(Number(e.target.closest('.plot').dataset.townSlot));
    }
  });
  mapView.addEventListener('click', (e) => {
    const t = e.target;
    if (town && handleTownClick(t)) return;
    if (handleWorld(t)) return;
    if (!t.closest('.map-svg') && handleWar(t)) return;
    const modeBtn = t.closest('[data-mode]');
    if (modeBtn) return setMode(modeBtn.dataset.mode);
    const tradeBtn = t.closest('[data-trade]');
    if (tradeBtn && !tradeBtn.disabled) return handleTrade(tradeBtn);
    const gotoMarket = t.closest('[data-goto-market]');
    if (gotoMarket) return selectThing({ type: 'market', id: gotoMarket.dataset.gotoMarket });
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
  });
}
