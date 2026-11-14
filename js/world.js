// The world map: the kingdom and its neighbours (realms.js), drawn as SVG on
// parchment — no painting needed. map.js shows it when the player switches the
// map to "Svět"; clicking the home kingdom goes back to the painted map.
// Exports the SVG and the sidebar HTML; map.js wires the clicks.

import { REALMS, HOME_REALM, ensureRealms, realmRulerLabel, ownsRealm, realmYield } from './realms.js';
import { attitudeLabel } from './engine.js';
import { warTargets, warTarget } from './war.js';
import { SEASONS } from './data.js';
import { esc } from './ui.js';
import { portraitImg } from './character.js';

// a painted world map (docs/obrazky-kariera.md) goes under the shapes once it exists
export const WORLD_IMAGE = 'assets/map/world_map.jpg';

export const WORLD_W = 1264;
export const WORLD_H = 848;

// Traced from the painting (assets/map/world_map.jpg, 2000 × 1342 px) and scaled to the 1264 × 848 view.
// Shared borders, so neighbouring lands meet without gaps.
const P = (pts) => pts.map(([x, y]) => [Math.round(x * 0.632), Math.round(y * 0.632)]);
const HOME_NORTH = P([[440, 320], [560, 250], [700, 228], [850, 218], [1000, 235], [1150, 262], [1300, 290], [1430, 330]]);
const HOME_EAST = P([[1430, 330], [1462, 450], [1462, 620], [1455, 780], [1450, 880]]);
const EAST_NORTH = P([[1430, 330], [1600, 318], [1800, 300], [2000, 290]]);
const HOME_COAST = P([[1350, 868], [1250, 860], [1100, 870], [1000, 880], [900, 900], [850, 930], [760, 920], [650, 900], [520, 890],
  [420, 850], [360, 800], [330, 720], [310, 620], [310, 500], [330, 390]]);

const SHAPES = {
  home: [...HOME_NORTH, ...HOME_EAST.slice(1), ...HOME_COAST],
  north: [...P([[200, 0], [2000, 0]]), ...[...EAST_NORTH].reverse(), ...[...HOME_NORTH].reverse().slice(1), ...P([[360, 230], [300, 140], [230, 60]])],
  east: [...EAST_NORTH, ...P([[2000, 1000], [1900, 990], [1800, 960], [1700, 920], [1600, 890], [1500, 880]]), ...[...HOME_EAST].reverse().slice(0, -1)],
  south: P([[0, 1240], [100, 1180], [300, 1140], [600, 1120], [900, 1100], [1200, 1080], [1500, 1060], [1700, 1040], [1900, 1030], [2000, 1030], [2000, 1342], [0, 1342]]),
};

// label, colour and where the army plants its banner (away from the painted castle and towns)
const LOOK = {
  home: { at: P([[1010, 540]])[0], color: '#c9a76a' },
  north: { at: P([[1060, 150]])[0], color: '#a2a9a6' },
  east: { at: P([[1730, 660]])[0], color: '#9a7a5c' },
  south: { at: P([[1000, 1250]])[0], color: '#bb8c63' },
};

function smoothPath(pts) {
  const all = [...pts, pts[0], pts[1]];
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length; i++) {
    const p0 = all[i - 1] || pts[pts.length - 1];
    const [p1, p2, p3] = [all[i], all[i + 1], all[i + 2]];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`;
  }
  return d + 'Z';
}

// little peaks along the mountains and trees along the forest border
function ridge(points, step, draw) {
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [a, b] = [points[i], points[i + 1]];
    const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let k = 0; k < n; k++) out.push(draw(a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n, out.length));
  }
  return out.join('');
}

const peak = (x, y, i) => `<path class="w-peak" d="M${(x - 13).toFixed(0)} ${(y + 8).toFixed(0)}l13 ${i % 2 ? -22 : -17}l13 ${i % 2 ? 22 : 17}"/>`;
const tree = (x, y, i) => `<circle class="w-tree" cx="${(x + (i % 2 ? 9 : -9)).toFixed(0)}" cy="${y.toFixed(0)}" r="${i % 3 ? 7 : 9}"/>`;

/** Who holds a realm and how it stands toward the player: [text, tone]. */
export function realmStatus(state, key) {
  if (key === 'home') {
    if (state.scenario === 'panovnik') return ['tvé království', 'good'];
    return [state.king ? `vládne král ${state.king.name}` : 'trůn je prázdný', ''];
  }
  const r = ensureRealms(state)[key];
  if (ownsRealm(state, key)) return ['tvá koruna', 'good'];
  if (state.war && state.war.target === key) return ['ve válce s tebou', 'bad'];
  if ((state.tributes || []).some((t) => t.realm === key)) return ['platí ti tribut', 'good'];
  return [attitudeLabel(r.attitude).toLowerCase(), r.attitude >= 55 ? 'good' : r.attitude < 40 ? 'bad' : 'warn'];
}

export function worldSvg(state, selected) {
  ensureRealms(state);
  const realm = (key) => {
    const own = key === 'home' ? state.scenario === 'panovnik' : ownsRealm(state, key);
    const [x, y] = LOOK[key].at;
    const name = key === 'home' ? HOME_REALM.name : REALMS[key].name;
    const ruler = key === 'home'
      ? (state.scenario === 'panovnik' ? `${state.ruler.gender === 'female' ? 'královna' : 'král'} ${state.ruler.name}` : state.king ? `král ${state.king.name}` : '')
      : ownsRealm(state, key) ? `${state.ruler.name} z rodu ${state.dynastyName}` : realmRulerLabel(state, key);
    return `<g class="w-realm${own ? ' own' : ''}${selected === key ? ' selected' : ''}" data-realm="${key}">
      <path class="w-land" d="${smoothPath(SHAPES[key])}" style="--rf:${LOOK[key].color}"/>
      <text class="pl-name" x="${x}" y="${y}">${esc(name)}</text>
      <text class="pl-sub" x="${x}" y="${y + 20}">${esc(ruler)}</text>
      ${own ? `<path class="w-crown" transform="translate(${x} ${y - 46})" d="M-16 8h32l4-20-11 9-9-14-9 14-11-9z"/>` : ''}
    </g>`;
  };
  let army = '';
  const t = warTarget(state);
  if (state.war && t && REALMS[state.war.target]) {
    const [hx, hy] = LOOK.home.at;
    const [tx, ty] = LOOK[state.war.target].at;
    const share = state.turn < state.war.arrive ? 0.5 : 0.8;
    const [ax, ay] = [hx + (tx - hx) * share, hy + (ty - hy) * share];
    army = `<path class="w-war-line" d="M${hx} ${hy + 30}L${tx} ${ty - 30}"/>
      <g class="war-army" transform="translate(${ax.toFixed(0)} ${ay.toFixed(0)})"><path class="wa-pole" d="M0 12V-26"/><path class="wa-flag" d="M0 -26h22l-6 7 6 7H0z"/>
      <circle class="wa-base" r="9" cy="12"/><text class="wa-men" y="16">${state.war.power}</text></g>`;
  }
  return `<svg class="map-svg world-svg" viewBox="0 0 ${WORLD_W} ${WORLD_H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Mapa světa">
    <rect class="w-sea" x="0" y="0" width="${WORLD_W}" height="${WORLD_H}"/>
    <image class="w-art" href="${WORLD_IMAGE}" x="0" y="0" width="${WORLD_W}" height="${WORLD_H}" preserveAspectRatio="none"/>
    <g class="w-waves">${[[120, 640], [90, 260], [300, 640], [760, 650], [1060, 680]].map(([x, y]) => `<path d="M${x} ${y}q12 -8 24 0t24 0"/>`).join('')}</g>
    ${['south', 'north', 'east', 'home'].map(realm).join('')}
    <g class="w-relief">${ridge(HOME_NORTH, 44, peak)}${ridge(EAST_NORTH, 44, peak)}${ridge(HOME_EAST, 30, tree)}</g>
    <text class="map-natural sea-label" x="100" y="420" transform="rotate(-84 100 420)">Šedé moře</text>
    <text class="map-natural sea-label" x="560" y="640">Šedé moře</text>
    ${army}
  </svg>`;
}

function bar(label, value, cls) {
  return `<div class="stat-bar-row"><span class="label">${label}</span><div class="stat-bar"><div class="stat-bar-fill ${cls}" style="width:${value}%"></div></div><span>${value}</span></div>`;
}

function realmChip(state, key) {
  const [status, tone] = realmStatus(state, key);
  const name = key === 'home' ? HOME_REALM.name : REALMS[key].name;
  return `<button class="map-chip" data-realm="${key}"><span>${esc(name)}</span><em class="${tone}">${esc(status)}</em></button>`;
}

export function worldSidebar(state, key) {
  ensureRealms(state);
  if (!key) {
    const where = state.scenario === 'sedlak' ? 'Tvůj rod zatím žije na gruntu v Lipnici a o cizích zemích ví jen z vyprávění kupců.'
      : state.scenario === 'slechtic' ? 'Tvůj rod drží tvrz v Pobřežní marce. Cizí panovníci si všímají jen těch pánů, kteří jim mohou být užiteční — nebo nebezpeční.'
        : 'Za hranicemi tvého království leží další koruny. Silné se dají přinutit k tributu, zlomené dobýt.';
    return `
      <span class="panel-overline">Svět</span>
      <h3 class="panel-title">Země a koruny</h3>
      <p class="map-desc">${where} Klikni na zemi.</p>
      <div class="map-chip-list">${['home', ...Object.keys(REALMS)].map((k) => realmChip(state, k)).join('')}</div>
      <button class="trade-mini" data-world-home>Mapa království</button>`;
  }
  if (key === 'home') {
    return `
      <span class="panel-overline">${esc(HOME_REALM.kind)}</span>
      <h3 class="panel-title">${esc(HOME_REALM.name)}</h3>
      <p class="map-desc">${esc(HOME_REALM.text)}</p>
      <span class="map-verdict ${realmStatus(state, 'home')[1]}">${esc(realmStatus(state, 'home')[0])}</span>
      <button class="seal-button primary map-choose" data-world-home>Otevřít mapu království</button>
      <button class="trade-mini" data-world-overview>Zpět na svět</button>`;
  }
  const def = REALMS[key];
  const r = ensureRealms(state)[key];
  const own = ownsRealm(state, key);
  const [status, tone] = realmStatus(state, key);
  const canWar = state.scenario === 'panovnik' && !own && warTargets(state)[key];
  const since = own && r.since !== undefined ? ` od roku ${1 + Math.floor(r.since / SEASONS.length)}` : '';
  return `
    <span class="panel-overline">${esc(def.kind)}</span>
    <h3 class="panel-title">${esc(def.name)}</h3>
    <span class="map-verdict ${tone}">${esc(status)}${esc(since)}</span>
    <p class="map-desc">${esc(def.text)}</p>
    ${own
      ? `<p class="map-desc">Korunu ${esc(def.gen)} nosíš ty. Platí ${realmYield(state, key)} zlata za období — dokud ji udržíš. Nespokojená země se může vzbouřit a zvolit si vlastního vládce; každý rok o ní rozhoduješ výnosem.</p>
         ${bar('Věrnost', r.attitude, 'loyalty')}
         ${bar('Moc koruny', r.power, 'garrison')}`
      : `<div class="w-ruler">${portraitImg([`assets/portraits/realm_${key}_${r.ruler.gender === 'female' ? 'female' : 'male'}.jpg`], r.ruler.name, 'w-ruler-img')}
         <p class="map-desc"><strong>${esc(realmRulerLabel(state, key))}</strong>, ${r.ruler.age} let</p></div>
         ${bar('Síla', r.power, 'garrison')}
         ${bar('Vztah', r.attitude, 'loyalty')}
         <p class="map-desc war-note">${def.conquerable ? 'Silnou zemi porážka donutí k tributu; zlomenou (síla 25 a méně po prohrané válce) můžeš dobýt a nosit i její korunu.' : 'Tuhle říši dobýt nejde — nájezd na její přístavy ale přinese kořist.'}</p>`}
    ${canWar ? `<button class="seal-button primary map-choose" data-world-war="${key}">Připravit tažení</button>` : ''}
    <button class="trade-mini" data-world-overview>Zpět na svět</button>`;
}
