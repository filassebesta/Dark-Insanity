// The player's own coat of arms (vlastní erb). The peasant who earns a noble rank designs it
// (crest_ui.js); it is kept as state.crest and drawn wherever the house is shown.
//
// state.crest = { shape, division, c1, c2, charge, count, cc, border, auto }
//   shape    'heater' | 'round' | 'pointed'
//   division 'plain' | 'pale' | 'fess' | 'bend' | 'quarterly' | 'chevron' | 'cross'
//   c1, c2   tincture keys of the field (c2 is the second part of the division)
//   charge   key of CHARGES or 'none'; count 1 | 3; cc = charge tincture; border = tincture key or null
//   auto     true while the crest is only a placeholder nobody chose (saves from before the editor)
// No DOM here.

export const SHAPES = {
  heater: { label: 'Klasický', d: 'M3 3h34v22c0 11-9 17-17 21C12 42 3 36 3 25z' },
  round: { label: 'Oblý', d: 'M3 3h34v19c0 14-9 21-17 24C12 43 3 36 3 22z' },
  pointed: { label: 'Špičatý', d: 'M3 3h34v16c0 12-8 20-17 27C11 39 3 31 3 19z' },
};

// tinctures: colours (barvy) and metals (kovy); `adj` is the stem of the Czech adjective
export const TINCTURES = {
  cervena: { label: 'červená', hex: '#9b2a22', metal: false, adj: 'červen' },
  modra: { label: 'modrá', hex: '#2b4f86', metal: false, adj: 'modr' },
  zelena: { label: 'zelená', hex: '#2f6a3a', metal: false, adj: 'zelen' },
  cerna: { label: 'černá', hex: '#1f1b18', metal: false, adj: 'čern' },
  purpurova: { label: 'purpurová', hex: '#6a2f6d', metal: false, adj: 'purpurov' },
  stribrna: { label: 'stříbrná', hex: '#e2e0d8', metal: true, adj: 'stříbrn' },
  zlata: { label: 'zlatá', hex: '#dcae3c', metal: true, adj: 'zlat' },
};
const T = Object.keys(TINCTURES);

export const DIVISIONS = {
  plain: { label: 'Celé pole' },
  pale: { label: 'Polcený', poly: 'M20 0h20v48H20z' },
  fess: { label: 'Dělený', poly: 'M0 24.5h40V48H0z' },
  bend: { label: 'Šikmý', poly: 'M3 3L37 46H3z' },
  quarterly: { label: 'Čtvrcený', poly: 'M20 0h20v24.5H20zM0 24.5h20V48H0z' },
  chevron: { label: 'Krokev', poly: 'M0 33L20 17l20 16v9L20 26 0 42z' },
  cross: { label: 'Kříž', poly: 'M16 0h8v48h-8zM0 19h40v8H0z' },
};

/*
 * Charges (znamení) are drawn around the point (20 24), about 24 × 32 units, in the colour `c`;
 * `f` is the field colour for the fine lines cut into a figure. g = grammatical gender,
 * anim = a masculine animate noun, pl = nominative plural.
 */
export const CHARGES = {
  wolf: { name: 'vlčí hlava', g: 'f', pl: 'vlčí hlavy', label: 'Vlčí hlava', draw: (f, c) => `<path d="M10 11l5 5h10l5-5v11c0 7-4 12-10 16-6-4-10-9-10-16z" fill="${c}"/>
    <path d="M16.5 24l3.5 2.4 3.5-2.4M20 26.4v5.2M17.4 34h5.2" stroke="${f}" stroke-width="1.5" stroke-linecap="round" fill="none"/><circle cx="16" cy="21.5" r="1.4" fill="${f}"/><circle cx="24" cy="21.5" r="1.4" fill="${f}"/>` },
  bear: { name: 'medvědí hlava', g: 'f', pl: 'medvědí hlavy', label: 'Medvěd', draw: (f, c) => `<circle cx="12.5" cy="12.5" r="4.2" fill="${c}"/><circle cx="27.5" cy="12.5" r="4.2" fill="${c}"/>
    <ellipse cx="20" cy="24" rx="11" ry="12" fill="${c}"/><ellipse cx="20" cy="30" rx="5.2" ry="4.2" fill="${f}" opacity=".85"/>
    <circle cx="15.5" cy="21" r="1.4" fill="${f}"/><circle cx="24.5" cy="21" r="1.4" fill="${f}"/><circle cx="20" cy="28.6" r="1.7" fill="${c}"/>` },
  eagle: { name: 'orel', g: 'm', anim: true, pl: 'orli', label: 'Orel', draw: (f, c) => `<path d="M20 10c-2.5 0-4 1.6-4 3.4l-2.4-1.6C9 14 6.5 18 5 23c3.5-1.8 6.7-2.2 9.6-1.2L16 31l-3.5 5.5L20 35l7.5 1.5L24 31l1.4-9.2c2.9-1 6.1-.6 9.6 1.2-1.5-5-4-9-8.6-11.2L24 13.4C24 11.6 22.500 10 20 10z" fill="${c}"/>
    <path d="M17.2 13.600l-3 1.400 3.200.8z" fill="${f}"/>` },
  tower: { name: 'věž', g: 'f', pl: 'věže', label: 'Věž', draw: (f, c) => `<path d="M11 40V14h3v3h3.5v-3h3v3H24v-3h3v3h2v23z" fill="${c}"/><path d="M17 40v-8a3 3 0 0 1 6 0v8z" fill="${f}"/>
    <path d="M17.500 22.500h5v4h-5z" fill="${f}"/>` },
  sword: { name: 'meč', g: 'm', pl: 'meče', label: 'Meč', draw: (f, c) => `<path d="M20 7l2.800 4v18h-5.600V11z" fill="${c}"/><path d="M11 29h18v3H11z" fill="${c}"/><path d="M18.600 32h2.800v5h-2.800z" fill="${c}"/><circle cx="20" cy="39.500" r="2.300" fill="${c}"/>
    <path d="M20 13v14" stroke="${f}" stroke-width=".9" opacity=".55"/>` },
  crown: { name: 'koruna', g: 'f', pl: 'koruny', label: 'Koruna', draw: (f, c) => `<path d="M8 33l-1-16 8 7 5-11 5 11 8-7-1 16z" fill="${c}"/><path d="M8 36h24v3.500H8z" fill="${c}"/>
    <circle cx="7" cy="16.500" r="2" fill="${c}"/><circle cx="20" cy="11.500" r="2" fill="${c}"/><circle cx="33" cy="16.500" r="2" fill="${c}"/><circle cx="20" cy="30" r="1.800" fill="${f}"/>` },
  star: { name: 'hvězda', g: 'f', pl: 'hvězdy', label: 'Hvězda', draw: (f, c) => `<path d="M20 8l3.600 10.800 11.400.2-9.200 6.800 3.400 10.800L20 30l-9.200 6.600 3.400-10.800L5 19l11.400-.2z" fill="${c}"/>` },
  moon: { name: 'půlměsíc', g: 'm', pl: 'půlměsíce', label: 'Půlměsíc', draw: (f, c) => `<path d="M26 9a15 15 0 1 0 0 30a20 20 0 0 1 0-30z" fill="${c}"/>` },
  sun: { name: 'slunce', g: 'n', pl: 'slunce', label: 'Slunce', draw: (f, c) => `<circle cx="20" cy="24" r="7" fill="${c}"/>
    <g stroke="${c}" stroke-width="2.600" stroke-linecap="round">${Array.from({ length: 12 }, (_, i) => { const a = (i * Math.PI) / 6; return `<path d="M${(20 + Math.cos(a) * 10.500).toFixed(1)} ${(24 + Math.sin(a) * 10.500).toFixed(1)}L${(20 + Math.cos(a) * 14.500).toFixed(1)} ${(24 + Math.sin(a) * 14.500).toFixed(1)}"/>`; }).join('')}</g>` },
  oak: { name: 'dub', g: 'm', pl: 'duby', label: 'Dub', draw: (f, c) => `<path d="M18.500 40V30c-5 0-8-3-8-7 0-2 .8-3.500 2.200-4.600C12 17 12 15 13.500 13.500 15 12 17 11.500 18.800 12.500 19.800 10 23 9.500 25 11c2 .3 3.800 2 3.800 4 2.400 1 3.700 3 3.700 5.500 0 3-2.300 5-5 5.500v14z" fill="${c}"/>
    <path d="M21.500 40V30h-3v10z" fill="${c}"/>` },
  wheat: { name: 'snop', g: 'm', pl: 'snopy', label: 'Snop', draw: (f, c) => `<path d="M20 40V14" stroke="${c}" stroke-width="1.800" stroke-linecap="round"/>
    <g fill="${c}">${[[20, 9, 0], [14.500, 14.500, -35], [25.500, 14.500, 35], [12.500, 22, -35], [27.500, 22, 35], [14.500, 29, -30], [25.500, 29, 30]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="2.400" ry="4.600" transform="rotate(${r} ${x} ${y})"/>`).join('')}</g>
    <path d="M13 37h14" stroke="${f}" stroke-width="1.500" stroke-linecap="round"/>` },
  plough: { name: 'pluh', g: 'm', pl: 'pluhy', label: 'Pluh', draw: (f, c) => `<g stroke="${c}" stroke-linecap="round" fill="none"><path d="M5 19L31 25" stroke-width="3.400"/><path d="M31 25L35 10M32 10h6" stroke-width="3.200"/></g>
    <path d="M11 20l5.500 1.300-2.200 14.700-4.800-1z" fill="${c}"/><path d="M8.500 36.500l12.500-1.700-1.600 3H8.500z" fill="${c}"/>` },
  hammer: { name: 'kladivo', g: 'n', pl: 'kladiva', label: 'Kladivo', draw: (f, c) => `<rect x="9.500" y="9" width="21" height="9" rx="1.600" fill="${c}"/><path d="M18 18h4v22h-4z" fill="${c}"/>
    <path d="M12 13.500h16" stroke="${f}" stroke-width="1" opacity=".5"/>` },
  horn: { name: 'lovecký roh', g: 'm', pl: 'lovecké rohy', label: 'Roh', draw: (f, c) => `<path d="M30 16C21 13.500 12 18.500 11.500 26c-.3 6 4 10 10 9.500 4-.4 6.500-3 6.500-6.500" fill="none" stroke="${c}" stroke-width="4.200" stroke-linecap="round"/>
    <path d="M27.500 12l9.500-3.500-1.800 13.500-6.200-3.500z" fill="${c}"/><circle cx="28" cy="29" r="2.600" fill="${c}"/>` },
  key: { name: 'klíč', g: 'm', pl: 'klíče', label: 'Klíč', draw: (f, c) => `<circle cx="20" cy="13.500" r="6.500" fill="none" stroke="${c}" stroke-width="3.200"/><path d="M20 20v20M20 33h6M20 38h5" stroke="${c}" stroke-width="3" stroke-linecap="round"/>` },
  lily: { name: 'lilie', g: 'f', pl: 'lilie', label: 'Lilie', draw: (f, c) => `<path d="M20 7c4 5 5 10 2.500 17-.5 2-.5 3.500 0 5h-5c.5-1.500.5-3 0-5C15 17 16 12 20 7z" fill="${c}"/>
    <path d="M18 24c-4-4-9-3-11 2 2 4 6 5 9 2zM22 24c4-4 9-3 11 2-2 4-6 5-9 2z" fill="${c}"/><path d="M11 33h18v3.600H11zM17 36.600h6V41h-6z" fill="${c}"/>` },
  wheel: { name: 'mlýnské kolo', g: 'n', pl: 'mlýnská kola', label: 'Kolo', draw: (f, c) => `<circle cx="20" cy="24" r="14" fill="none" stroke="${c}" stroke-width="3"/><circle cx="20" cy="24" r="3.600" fill="${c}"/>
    <g stroke="${c}" stroke-width="2.400" stroke-linecap="round">${Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return `<path d="M${(20 + Math.cos(a) * 3.600).toFixed(1)} ${(24 + Math.sin(a) * 3.600).toFixed(1)}L${(20 + Math.cos(a) * 13).toFixed(1)} ${(24 + Math.sin(a) * 13).toFixed(1)}"/>`; }).join('')}</g>` },
  lion: { name: 'lví hlava', g: 'f', pl: 'lví hlavy', label: 'Lev', draw: (f, c) => `<g fill="${c}">${Array.from({ length: 12 }, (_, i) => { const a = (i * Math.PI) / 6; return `<circle cx="${(20 + Math.cos(a) * 11.5).toFixed(1)}" cy="${(24 + Math.sin(a) * 11.5).toFixed(1)}" r="4.2"/>`; }).join('')}</g>
    <circle cx="20" cy="24" r="9.4" fill="${c}" stroke="${f}" stroke-width="1.4"/><circle cx="16.4" cy="21.8" r="1.4" fill="${f}"/><circle cx="23.6" cy="21.8" r="1.4" fill="${f}"/>
    <path d="M18 26h4l-2 2.8z" fill="${f}"/><path d="M20 28.8v2.2M16.4 31c1.700 1.300 5.500 1.300 7.200 0" stroke="${f}" stroke-width="1.2" stroke-linecap="round" fill="none"/>` },
  horse: { name: 'koňská hlava', g: 'f', pl: 'koňské hlavy', label: 'Kůň', draw: (f, c) => `<path d="M21 7l3 5c4 1.600 6.500 6 7.500 12L34 40H21l-.6-9c-3.200.6-6.200 0-8.700-1.600L8 27c-1.200-1.500-1-3.600.5-4.700L14 19.500c1.200-4 3.800-8 7-12.500z" fill="${c}"/>
    <circle cx="19.600" cy="17" r="1.500" fill="${f}"/><path d="M11 25.500l2.200 1.200M25 14c2 4 3 8 3 13" stroke="${f}" stroke-width="1.200" stroke-linecap="round" fill="none"/>` },
  fish: { name: 'ryba', g: 'f', pl: 'ryby', label: 'Ryba', draw: (f, c) => `<path d="M6 24c5-8.500 15-10 21-3l7-5.500v17L27 27c-6 7-16 5.500-21-3z" fill="${c}"/>
    <circle cx="12.500" cy="22.500" r="1.500" fill="${f}"/><path d="M17 19c1.500 3.500 1.500 7 0 10M21.500 18c1.500 4 1.500 8.500 0 11.500" stroke="${f}" stroke-width="1.100" stroke-linecap="round" fill="none" opacity=".7"/>` },
  ship: { name: 'loď', g: 'f', pl: 'lodě', label: 'Loď', draw: (f, c) => `<path d="M6 29h28l-4.500 8H10.500z" fill="${c}"/><path d="M20 7.500V29" stroke="${c}" stroke-width="2" stroke-linecap="round"/>
    <path d="M21.500 9C28 12 30.500 18 29.500 26.500H21.500zM18.500 12.500C13 15.500 11 20 12 26.500h6.500z" fill="${c}"/><path d="M20 7.500l5.500 2L20 11.500z" fill="${c}"/>
    <path d="M5 39.500q3-2.500 6 0t6 0 6 0 6 0 6 0" stroke="${c}" stroke-width="1.600" stroke-linecap="round" fill="none"/>` },
  boar: { name: 'kančí hlava', g: 'f', pl: 'kančí hlavy', label: 'Kanec', draw: (f, c) => `<path d="M6 27c0-4.500 4-7.500 10-8.500 4-4 10-4.500 14-1l4-3-1 7c1.500 4 .5 9-4 13H19c-4-1.500-6.500-4.500-7-8-3.500.5-6-.5-6-3.500z" fill="${c}"/>
    <path d="M9 30c-3.200 1-4 3.600-3 6 3-.5 5-2.200 6-4.500z" fill="${c}"/><circle cx="19.500" cy="22.500" r="1.500" fill="${f}"/><circle cx="8.200" cy="26.500" r="1.100" fill="${f}"/>
    <path d="M26 20c1.500 3 2 6 1.500 9" stroke="${f}" stroke-width="1.200" stroke-linecap="round" fill="none"/>` },
  wing: { name: 'křídlo', g: 'n', pl: 'křídla', label: 'Křídlo', draw: (f, c) => `<path d="M8 37C7 23 15 12 32 8c-3 3-4 5-5 8 3-1 5-1 7 0-3 2-5 4-6 7 2 0 4 1 5 2-4 2-8 4-11 8 2 0 3.500.5 4.500 1.500-6 2-12 2.500-18.500 2.500z" fill="${c}"/>
    <path d="M13 34c2-7 7-12 14-15" stroke="${f}" stroke-width="1.100" stroke-linecap="round" fill="none" opacity=".6"/>` },
  bell: { name: 'zvon', g: 'm', pl: 'zvony', label: 'Zvon', draw: (f, c) => `<path d="M20 7.500c-1.700 0-2.800 1.100-2.800 2.700C12 12 11 18 11 25.500L7.500 32v2.500h25V32L29 25.500c0-7.500-1-13.500-6.200-15.300 0-1.600-1.100-2.700-2.800-2.700z" fill="${c}"/>
    <circle cx="20" cy="37.500" r="2.800" fill="${c}"/><path d="M14.500 28.500h11" stroke="${f}" stroke-width="1.100" opacity=".6"/>` },
  anchor: { name: 'kotva', g: 'f', pl: 'kotvy', label: 'Kotva', draw: (f, c) => `<circle cx="20" cy="11" r="3.300" fill="none" stroke="${c}" stroke-width="2.600"/>
    <g stroke="${c}" stroke-width="2.800" stroke-linecap="round" fill="none"><path d="M20 14.500V38M13.500 19h13M8.500 29c1 6.500 5.500 9.500 11.500 9.500S30.500 35.500 31.500 29"/></g>
    <path d="M5.500 28.500l6-1.500-2 6zM34.500 28.500l-6-1.500 2 6z" fill="${c}"/>` },
  cross: { name: 'kříž', g: 'm', pl: 'kříže', label: 'Kříž', draw: (f, c) => `<path d="M17 8h6v11h11v6H23v16h-6V25H6v-6h11z" fill="${c}"/>` },
};
export const CHARGE_KEYS = Object.keys(CHARGES);

// ---------- the model ----------

const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)];

/** A random crest that follows the old rule: metal on colour, colour on metal. */
export function randomCrest(rng = Math.random) {
  const c1 = pick(T, rng);
  const c1metal = TINCTURES[c1].metal;
  const other = T.filter((k) => TINCTURES[k].metal !== c1metal);
  const division = pick(['plain', 'plain', 'pale', 'fess', 'bend', 'quarterly', 'chevron', 'cross'], rng);
  const c2 = division === 'plain' ? c1 : pick(other, rng);
  // the charge contrasts with the field; on a divided shield, with the colour behind its centre
  const cc = pick(T.filter((k) => TINCTURES[k].metal !== c1metal), rng);
  return {
    shape: pick(Object.keys(SHAPES), rng), division, c1, c2,
    charge: division === 'chevron' || division === 'cross' ? (rng() < 0.5 ? 'none' : pick(CHARGE_KEYS, rng)) : pick(CHARGE_KEYS, rng),
    count: rng() < 0.2 ? 3 : 1, cc, border: rng() < 0.2 ? pick(other, rng) : null, auto: false,
  };
}

/** A small deterministic generator, so a save without a crest always gets the same placeholder. */
function seeded(text) {
  let h = 2166136261;
  for (const ch of String(text)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0; return ((h ^= h >>> 16) >>> 0) / 4294967296; };
}

/** The player's crest; an older save that never designed one gets a placeholder from the dynasty name. */
export function ensureCrest(state) {
  if (!state.crest) state.crest = { ...randomCrest(seeded(state.dynastyName)), auto: true };
  return state.crest;
}

/** Has the player chosen a crest of their own (a placeholder does not count)? */
export const hasOwnCrest = (state) => !!(state.crest && !state.crest.auto);

/** A crest from untrusted data (a save, the editor): every field forced to a known value. */
export function cleanCrest(c) {
  const src = c || {};
  const t = (k, d) => (TINCTURES[k] ? k : d);
  const division = DIVISIONS[src.division] ? src.division : 'plain';
  return {
    shape: SHAPES[src.shape] ? src.shape : 'heater', division,
    c1: t(src.c1, 'cervena'), c2: division === 'plain' ? t(src.c1, 'cervena') : t(src.c2, 'stribrna'),
    charge: src.charge === 'none' || CHARGES[src.charge] ? src.charge : 'none', count: src.count === 3 ? 3 : 1,
    cc: t(src.cc, 'zlata'), border: TINCTURES[src.border] ? src.border : null, auto: !!src.auto,
  };
}

// ---------- drawing ----------

let clipSeq = 0;
const TRIPLE = [[11.500, 14.500], [28.500, 14.500], [20, 33]];

function chargeInner(key, count, field, colour) {
  const ch = CHARGES[key];
  if (!ch) return '';
  const one = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s}) translate(-20 -24)">${ch.draw(field, colour)}</g>`;
  return count === 3 ? TRIPLE.map(([x, y]) => one(x, y, 0.4)).join('') : one(20, 24, 1);
}

/** The shield without the surrounding <svg> (for placing inside another SVG). */
export function crestInnerOf(crest) {
  const c = cleanCrest(crest);
  const shape = SHAPES[c.shape].d;
  const f1 = TINCTURES[c.c1].hex, f2 = TINCTURES[c.c2].hex, fc = TINCTURES[c.cc].hex;
  const div = DIVISIONS[c.division].poly;
  const id = `ownc-${c.shape}-${++clipSeq}`; // unique per drawing: a clip inside a hidden <svg> does not work for other shields
  const clip = `<clipPath id="${id}"><path d="${shape}"/></clipPath>`;
  // the fine lines cut into a figure take the main colour of the field
  const under = f1;
  const border = c.border ? `<path d="${shape}" fill="none" stroke="${TINCTURES[c.border].hex}" stroke-width="5" clip-path="url(#${id})"/>` : '';
  return `${clip}<g clip-path="url(#${id})"><rect width="40" height="48" fill="${f1}"/>${div ? `<path d="${div}" fill="${f2}"/>` : ''}</g>${border}
    ${c.charge !== 'none' ? chargeInner(c.charge, c.count, under, fc) : ''}
    <path d="${shape}" fill="none" stroke="#c8a46a" stroke-width="1.600" stroke-linejoin="round"/>`;
}

/** A standalone crest, as large as its CSS class says. */
export function crestSvgOf(crest, cls = '') {
  return `<svg class="hs-crest ${cls}" viewBox="0 0 40 48" role="img" aria-label="Erb rodu" focusable="false">${crestInnerOf(crest)}</svg>`;
}

// ---------- the crest in words ----------

const adj = (tk, g, anim, plural) => {
  const s = TINCTURES[tk].adj;
  if (!plural) return s + (g === 'm' ? 'ý' : g === 'f' ? 'á' : 'é');
  return s + (g === 'm' && anim ? 'í' : g === 'n' ? 'á' : 'é');
};
const num = (n) => (n === 3 ? 'tři ' : '');

/** The coat of arms as an old-fashioned description: "V červeném štítě zlatý orel." */
export function blazon(crest) {
  const c = cleanCrest(crest);
  const loc = (tk) => `${TINCTURES[tk].adj}ém`;
  const ch = CHARGES[c.charge];
  const figure = ch ? (c.count === 3 ? `tři ${adj(c.cc, ch.g, ch.anim, true)} ${ch.pl}` : `${adj(c.cc, ch.g, ch.anim, false)} ${ch.name}`) : '';
  let head;
  switch (c.division) {
    case 'pale': head = `Štít polcený: vpravo ${adj(c.c1, 'm')}, vlevo ${adj(c.c2, 'm')}`; break;
    case 'fess': head = `Štít dělený: nahoře ${adj(c.c1, 'm')}, dole ${adj(c.c2, 'm')}`; break;
    case 'bend': head = `Štít šikmo dělený: vpravo nahoře ${adj(c.c1, 'm')}, vlevo dole ${adj(c.c2, 'm')}`; break;
    case 'quarterly': head = `Štít čtvrcený: ${adj(c.c1, 'm')} a ${adj(c.c2, 'm')}`; break;
    case 'chevron': head = `V ${loc(c.c1)} štítě ${adj(c.c2, 'f')} krokev`; break;
    case 'cross': head = `V ${loc(c.c1)} štítě ${adj(c.c2, 'm')} kříž`; break;
    default: head = `V ${loc(c.c1)} štítě`;
  }
  let text = figure ? (c.division === 'plain' ? `${head} ${figure}` : `${head}; ve štítě ${figure}`) : head;
  if (c.border) text += `, lemovaný ${adj(c.border, 'm')}m lemem`;
  return `${text}.`.replace(/\s+/g, ' ');
}

/** What the old rule of heraldry says about the choice (null = fine). */
export function legibilityNote(crest) {
  const c = cleanCrest(crest);
  if (c.charge === 'none') return null;
  const base = c.division === 'plain' ? [c.c1] : [c.c1, c.c2];
  const bad = base.filter((k) => TINCTURES[k].metal === TINCTURES[c.cc].metal);
  if (!bad.length) return null;
  return base.length > 1 && bad.length < base.length
    ? 'Znamení se na jedné půlce pole bude špatně číst. Erb ale může zůstat, jak ho chceš.'
    : 'Kov na kov a barva na barvě se špatně čte: pravidla erbů to nedoporučují. Erb ale může zůstat, jak ho chceš.';
}
