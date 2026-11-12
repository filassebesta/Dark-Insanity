// Ruler avatar / character sheet ("Postava").
// Portraits are optional files; missing ones fall back gracefully to an initial.

import { TRAIT_DEFS, STATUS_TIERS, SEASONS, tierTitle } from './data.js';
import { traitBonuses, reignEpithet } from './engine.js';
import { biography, loyaltyLabel, roleLabel, quirkLabel, quirkText } from './court.js';
import { esc } from './ui.js';
import { effectiveTraits, injuriesOf, injuryFx, INJURIES } from './injuries.js';
import { ambitionSection } from './fame.js';
import { talkSection } from './talk_ui.js';
import { personOf } from './family.js';
import { ensureGear, shopFor, ITEMS, SLOTS } from './gear.js';
import { fighterOf } from './combat.js';

const TIER_SLUGS = [null, 'peasant', 'freeman', 'minor_noble', 'noble', 'king', 'emperor'];
const OLD_AGE = 55;

const TRAIT_TEXT = {
  strength: 'Rozhoduje v boji, při zastrašování a tam, kde je třeba ukázat pěst.',
  eloquence: 'Přesvědčuje šlechtu, smiřuje znesvářené a vyjednává s posly.',
  intelligence: 'Prohlédne léčky, spravuje pokladnu a čte mezi řádky dopisů.',
  patience: 'Umí čekat na správnou chvíli a nedá se vyprovokovat.',
};

const ROLE_LABEL = {
  heir: (g) => (g === 'male' ? 'Dědic' : 'Dědička'),
  spouse: (g) => (g === 'male' ? 'Manžel' : 'Manželka'),
};

/** Ordered list of portrait files to try for the ruler; the caller falls back to an initial. */
export function rulerPortraitCandidates(ruler) {
  const slug = TIER_SLUGS[ruler.statusTier] || 'king';
  const g = ruler.gender === 'female' ? 'female' : 'male';
  const base = `assets/portraits/ruler_${slug}_${g}`;
  const young = [`${base}.jpg`, `${base}.png`];
  // an emperor without a portrait of his own wears the king's
  const king = slug === 'emperor' ? rulerPortraitCandidates({ ...ruler, statusTier: 5 }) : [];
  return [...(ruler.age >= OLD_AGE ? [`${base}_old.jpg`, `${base}_old.png`, ...young] : young), ...king];
}

/** <img> that walks through candidate URLs and finally hides itself, revealing the initial underneath. */
export function portraitImg(candidates, alt, cls = '') {
  const [first, ...rest] = candidates;
  return `<img class="${cls}" src="${esc(first)}" alt="${esc(alt)}" data-fallbacks="${esc(rest.join('|'))}" onerror="window.__portraitFallback(this)">`;
}

window.__portraitFallback = (img) => {
  const rest = (img.dataset.fallbacks || '').split('|').filter(Boolean);
  if (rest.length) {
    img.dataset.fallbacks = rest.slice(1).join('|');
    img.src = rest[0];
  } else {
    img.remove();
  }
};

/** Court member portrait files: assets/portraits/<role>_<male|female>.jpg (or .png). */
export function memberPortraitCandidates(c, role, scenario) {
  // a peasant's household has its own faces (s_<role>_<gender>), never the royal court's
  const base = `assets/portraits/${scenario === 'sedlak' ? 's_' : ''}${role}_${c.gender === 'male' ? 'male' : 'female'}`;
  return [`${base}.jpg`, `${base}.png`];
}

function reignYears(state) {
  return Math.floor((state.turn - (state.ruler.reignStartTurn || 0)) / 4);
}

function yearsWord(n) {
  if (n === 1) return 'rok';
  if (n >= 2 && n <= 4) return 'roky';
  return 'let';
}

const TRAIT_NAME = { strength: 'síla', eloquence: 'výřečnost', intelligence: 'inteligence', patience: 'trpělivost' };
const SEASON_LOC = ['na jaře', 'v létě', 'na podzim', 'v zimě'];

/** Gear: what the ruler carries into a fight, and what can be bought (gear.js). */
function gearBlock(state) {
  const gear = ensureGear(state);
  const f = fighterOf(state);
  const fx = (it) => [it.uc ? `ÚČ +${it.uc}` : '', it.oc ? `OČ +${it.oc}` : '', it.dmg ? `zbraň +${it.dmg}` : '', it.hp ? `životy +${it.hp}` : '', it.flee ? `útěk ${it.flee > 0 ? '+' : ''}${it.flee}` : '', it.roll ? `+${it.roll} k hodům v boji` : ''].filter(Boolean).join(' · ');
  const worn = Object.entries(SLOTS).map(([slot, label]) => {
    const it = ITEMS[gear[slot]];
    return `<li><span>${label}</span><b>${it ? esc(it.name) : '—'}</b><em>${it ? esc(fx(it)) : ''}</em></li>`;
  }).join('');
  const coin = state.scenario === 'sedlak' ? 'grošů' : 'zlata';
  const shop = shopFor(state).map(({ key, item, owned, block }) => `
    <button class="gear-buy${owned ? ' owned' : ''}" data-buy="${key}"${block ? ` disabled title="${esc(block)}"` : ''}>
      <b>${esc(item.name)}</b><span>${esc(item.text)}</span><em>${esc(fx(item))}</em><i>${owned ? 'máš' : `${item.cost} ${coin}`}</i>
    </button>`).join('');
  return `<h4 class="cs-section">Výzbroj</h4>
    <p class="cs-gear-sum">V souboji: <b>${f.hp}</b> životů · útočné číslo <b>${f.uc}</b> · obranné číslo <b>${f.oc}</b> · zbraň <b>+${f.dmg}</b></p>
    <ul class="cs-gear">${worn}</ul>
    <h4 class="cs-section cs-sub">${state.scenario === 'sedlak' ? 'U kováře' : 'Zbrojíř a koňský trh'} <small>· v pokladně ${state.resources.gold} ${coin}</small></h4>
    <div class="gear-shop">${shop}</div>`;
}

/** The ruler's wounds: what they take away and when (if ever) they heal. */
function injuryBlock(state) {
  const list = injuriesOf(state.ruler);
  if (!list.length) return '';
  const items = list.map((inj) => {
    const fx = injuryFx(inj);
    const def = INJURIES[inj.key];
    const chips = [
      ...Object.entries(fx.traits || {}).map(([k, v]) => `${TRAIT_NAME[k]} ${v}`),
      fx.army ? `boj ${Math.round(fx.army * 100)} %` : '',
      fx.rolls ? `všechny hody ${Math.round(fx.rolls * 100)} %` : '',
      fx.work && state.scenario === 'sedlak' ? `práce na gruntu −${fx.work} zásob za období` : '',
      fx.deathRisk ? 'kratší život' : '',
      def.infection && !inj.treated ? 'může se zanítit' : '',
    ].filter(Boolean).map((c) => `<i>${esc(c)}</i>`).join('');
    let when = 'Natrvalo.';
    if (def.heals) {
      const ahead = inj.healsAt - state.turn;
      const year = state.year + Math.floor((state.seasonIndex + ahead) / 4);
      when = `Zahojí se ${SEASON_LOC[inj.healsAt % 4]} roku ${year}${inj.treated ? ' (ošetřeno)' : ''}.`;
    } else if (inj.aided) when = `Natrvalo — ${def.aid.name.toLowerCase()} postih zmírňuje.`;
    return `<li><b>${esc(fx.name)}</b><span>${esc(def.text)}</span><em>${chips}</em><small>${esc(when)}</small></li>`;
  }).join('');
  return `<h4 class="cs-section">Zranění</h4><ul class="cs-injuries">${items}</ul>`;
}

export function renderCharacterSheet(state) {
  const r = state.ruler;
  const title = tierTitle(r.statusTier, r.gender);
  const ageK = Math.max(0, Math.min(0.5, (r.age - 40) / 60));
  const years = reignYears(state);

  const ladder = STATUS_TIERS.slice(1).map((label, i) => {
    const tier = i + 1;
    const cls = tier < r.statusTier ? 'done' : tier === r.statusTier ? 'current' : '';
    const shown = tier === 5 || tier === r.statusTier ? tierTitle(tier, r.gender) : label;
    return `<div class="cs-step ${cls}"><i></i>${esc(shown)}</div>`;
  }).join('');

  const eff = effectiveTraits(r);
  const traits = TRAIT_DEFS.map((t) => {
    const v = eff[t.key];
    const base = r.traits[t.key];
    // pips lost to wounds show as broken
    const pips = Array.from({ length: 10 }, (_, i) => `<span class="${i < v ? 'on' : i < base ? 'lost' : ''}"></span>`).join('');
    return `
      <div class="cs-trait${v < base ? ' hurt' : ''}">
        ${t.icon}
        <b>${t.label}</b>
        <em>${v}${v < base ? `<small> z ${base}</small>` : ''}</em>
        <div class="cs-pips">${pips}</div>
        <small>${TRAIT_TEXT[t.key]}</small>
      </div>`;
  }).join('');

  // what the traits do every season (see traitBonuses in engine.js)
  const b = traitBonuses(state);
  const sign = (v) => (v > 0 ? `+${v}` : `${v}`);
  const influence = [
    ['strength', b.order, `${sign(b.order)} k pořádku v provinciích (méně nepokojů)`],
    ['eloquence', b.loyalty, `${sign(b.loyalty)} k věrnosti provincií`],
    ['intelligence', b.gold, `${sign(b.gold)} zlata do pokladny každé období`],
    ['patience', b.calm, `${sign(b.calm)} k trpělivosti s nepokoji, než se otřese stabilita`],
  ].map(([key, val, text]) => {
    const t = TRAIT_DEFS.find((d) => d.key === key);
    return `<li class="${val > 0 ? 'pos' : val < 0 ? 'neg' : ''}">${t.icon}<b>${t.label}</b><span>${val === 0 ? 'průměrná, bez zvláštního vlivu' : text}</span></li>`;
  }).join('');

  // the family: spouse and heir, younger children, a child on the way — or the people to court
  const card = (c, role, label, sub, extra = '') => `
      <div class="cs-member${c.alive !== false ? '' : ' deceased'}${extra}" data-person="${role}" role="button" tabindex="0" title="Zobrazit detail">
        <span class="cs-mini">${esc(c.name ? c.name[0] : '?')}</span>
        ${portraitImg(memberPortraitCandidates(c, role.startsWith('child') ? 'heir' : role.startsWith('suitor') ? 'spouse' : role, state.scenario), c.name, 'cs-mini-img')}
        <div><span>${esc(label)}</span><strong>${esc(c.name)}${c.alive !== false ? '' : ' †'}</strong><small>${esc(sub)}</small></div>
      </div>`;
  const parts = [];
  const sp = state.spouse;
  if (sp && sp.alive !== false) parts.push(card(sp, 'spouse', ROLE_LABEL.spouse(sp.gender), `${sp.age} let · věrnost ${sp.loyalty}`));
  else if (sp && !sp.none) parts.push(card(sp, 'spouse', ROLE_LABEL.spouse(sp.gender), `${sp.age} let`));
  if (state.heir && !state.heir.none) parts.push(card(state.heir, 'heir', ROLE_LABEL.heir(state.heir.gender), `${state.heir.age} let · věrnost ${state.heir.loyalty}`));
  (state.children || []).forEach((c, i) => { if (c.alive !== false) parts.push(card(c, `child:${i}`, c.gender === 'female' ? 'Dcera' : 'Syn', `${c.age} let`)); });
  const family = parts.join('');
  const expecting = state.pregnancy ? `<p class="cs-family-note">${r.gender === 'female' ? 'Čekáš dítě.' : `${esc(sp.name)} čeká dítě.`} Narodí se na ${SEASONS[(state.seasonIndex + (state.pregnancy.due - state.turn)) % 4].toLowerCase()}.</p>` : '';
  const single = !sp || sp.alive === false
    ? `<p class="cs-family-note">${r.gender === 'female' ? (sp && !sp.none ? 'Vdova.' : 'Svobodná.') : (sp && !sp.none ? 'Vdovec.' : 'Svobodný.')} ${(state.heir && state.heir.alive !== false) ? '' : 'Bez dědice rod vymře.'}</p>`
    : '';
  const suitors = (state.suitors || []).map((c, i) => card(c, `suitor:${i}`, c.kindLabel, `${c.age} let · náklonnost ${c.affection}`, ' suitor')).join('');

  const OUTCOME_WORD = { success: ' (úspěch)', failure: ' (nezdar)', danger: ' (nebezpečí)' };
  const ancestors = (state.pastRulers || []).slice().reverse().map((a) => {
    const f = a.gender === 'female' ? 'a' : '';
    const deeds = (a.deeds || []).map((d) => `<li>${d.year} · ${esc(d.title)}: ${esc(d.choice)}${OUTCOME_WORD[d.outcome] || ''}</li>`).join('');
    return `
      <li><strong>${esc(a.name)}${a.epithet ? ` <em>${esc(a.epithet)}</em>` : ''}</strong>
        ${a.epithetReason ? `<span class="cs-reason">${esc(a.epithetReason)}</span>` : ''}
        <span>${a.generation}. generace · vládl${f} ${a.years} ${yearsWord(a.years)} · zemřel${f} v ${a.diedAt} letech${a.cause ? ` ${esc(a.cause)}` : ''}</span>
        ${a.injuries && a.injuries.length ? `<span class="cs-reason">Nesl${f} si do hrobu: ${esc(a.injuries.join(', '))}</span>` : ''}
        ${deeds ? `<ul class="cs-deeds">${deeds}</ul>` : ''}</li>`;
  }).join('');
  const epithet = reignEpithet(state);
  const epithetLine = epithet
    ? `<p class="cs-epithet">Lid ${r.gender === 'female' ? 'ji' : 'ho'} už teď nazývá <em>${esc(r.name)} ${esc(epithet.word)}</em>, ${esc(epithet.reason)}.</p>`
    : `<p class="cs-epithet">Lid ještě neví, jak ${r.gender === 'female' ? 'ji' : 'ho'} bude nazývat.</p>`;

  document.getElementById('character-sheet').innerHTML = `
    <div class="cs-portrait-wrap">
      <div class="cs-portrait" style="--age-k:${ageK.toFixed(2)}">
        <span class="cs-initial">${esc(r.name ? r.name[0] : '?')}</span>
        ${portraitImg(rulerPortraitCandidates(r), r.name, 'cs-portrait-img')}
        <div class="cs-aging"></div>
      </div>
      <p class="cs-portrait-note">${r.age >= OLD_AGE ? (state.scenario === 'sedlak' ? 'Léta práce se do tváře vepsala.' : 'Léta vlády se do tváře vepsala.') : state.scenario === 'slechtic' ? `Portrét ${r.gender === 'female' ? 'paní' : 'pána'} rodu ${esc(state.dynastyName)}.` : state.scenario === 'sedlak' ? `${r.gender === 'female' ? 'Hospodyně' : 'Hospodář'} z Lipnice.` : 'Portrét z doby nástupu na trůn.'}</p>
    </div>
    <div class="cs-info">
      <span class="panel-overline">${esc(title)} · ${state.generation}. generace</span>
      <h2 class="cs-name">${esc(r.name)}</h2>
      <div class="cs-dynasty">${state.scenario === 'panovnik' ? 'z dynastie' : 'z rodu'} ${esc(state.dynastyName)}</div>
      ${epithetLine}
      <div class="cs-facts">
        <div><span>Věk</span><strong>${r.age}</strong></div>
        <div><span>${state.scenario === 'slechtic' ? 'V čele rodu' : state.scenario === 'sedlak' ? 'Na gruntu' : 'Vláda'}</span><strong>${years} ${yearsWord(years)}</strong></div>
        <div><span>Rok</span><strong>${state.year}</strong></div>
      </div>
      <h4 class="cs-section">Postavení</h4>
      <div class="cs-ladder">${ladder}</div>
      <h4 class="cs-section">Vlastnosti</h4>
      <div class="cs-traits">${traits}</div>
      ${ambitionSection(state)}
      ${injuryBlock(state)}
      ${gearBlock(state)}
      <h4 class="cs-section">Vliv na vládu</h4>
      <ul class="cs-influence">${influence}</ul>
      <h4 class="cs-section">Rodina</h4>
      ${single}${family ? `<div class="cs-family">${family}</div>` : ''}${expecting}
      ${suitors ? `<h4 class="cs-section cs-sub">${r.gender === 'female' ? 'Nápadníci' : 'Nápadnice'} <small>· klikni a dej se do řeči</small></h4><div class="cs-family">${suitors}</div>` : ''}
      ${ancestors ? `<h4 class="cs-section cs-gap">Síň předků</h4><ul class="cs-ancestors">${ancestors}</ul>` : ''}
    </div>
  `;

}

// buying gear from the character sheet
let gearWired = false;
function wireGear(state) {
  if (gearWired) return;
  gearWired = true;
  document.getElementById('character-view').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-buy]');
    if (!btn || btn.disabled) return;
    document.dispatchEvent(new CustomEvent('kingdom:buy', { detail: { key: btn.dataset.buy } }));
  });
}

export function openCharacter(state) {
  wireGear(state);
  renderCharacterSheet(state);
  const view = document.getElementById('character-view');
  view.classList.add('open');
  view.setAttribute('aria-hidden', 'false');
  view.scrollTop = 0;
}

export function closeCharacter() {
  const view = document.getElementById('character-view');
  view.classList.remove('open');
  view.setAttribute('aria-hidden', 'true');
}

export function isCharacterOpen() {
  return document.getElementById('character-view').classList.contains('open');
}

// ---------- court member detail ("person") ----------

const OUTCOME_WORDS = { success: 'úspěch', failure: 'nezdar', danger: 'nebezpečí', safe: 'bez úhony' };

export function renderPersonSheet(state, role) {
  const c = personOf(state, role);
  if (!c) return;
  const alive = c.alive !== false;
  const kind = String(role).split(':')[0];
  const title = kind === 'suitor' ? c.kindLabel : kind === 'child' ? (c.gender === 'female' ? 'Dcera' : 'Syn') : roleLabel(role, c.gender, state.scenario, state.flags);
  const portraitRole = kind === 'suitor' ? 'spouse' : kind === 'child' ? 'heir' : role;
  const heart = kind === 'suitor' ? ['náklonnost', c.affection] : ['věrnost', c.loyalty];
  const history = (c.history || []).slice().reverse();
  const him = c.gender === 'female' ? 'ji' : 'ho';
  const rows = history.map((h) => {
    const delta = h.delta === null || h.delta === undefined ? ''
      : `<span class="ph-delta ${h.delta > 0 ? 'pos' : 'neg'}">věrnost ${h.delta > 0 ? '+' : ''}${h.delta}</span>`;
    const outcome = OUTCOME_WORDS[h.outcome] ? ` <em>(${OUTCOME_WORDS[h.outcome]})</em>` : '';
    return `<li>
      <span class="ph-date">${SEASONS[h.season]} · rok ${h.year}</span>
      <strong>${esc(h.title)}</strong>
      ${h.choice ? `<span class="ph-choice">Rozhodnutí: ${esc(h.choice)}${outcome}</span>` : ''}
      ${delta}
    </li>`;
  }).join('');

  document.getElementById('person-sheet').innerHTML = `
    <div class="ps-portrait${alive ? '' : ' deceased'}">
      <span class="cs-initial">${esc(c.name ? c.name[0] : '?')}</span>
      ${portraitImg(memberPortraitCandidates(c, portraitRole, state.scenario), c.name, 'ps-portrait-img')}
    </div>
    <div class="ps-info">
      <span class="panel-overline">${esc(title)}${alive ? '' : ' · zesnul' + (c.gender === 'female' ? 'á' : 'ý')}</span>
      <h2 class="ps-name">${esc(c.name)}</h2>
      <div class="ps-meta">${c.age} let${kind === 'suitor' ? '' : ` · <span class="ps-loyal">${loyaltyLabel(c.loyalty, c.gender)}</span>`}</div>
      <div class="ps-bar"><span style="width:${heart[1]}%"></span><b>${heart[0]} ${heart[1]}</b></div>
      <p class="ps-bio">${esc(kind === 'suitor' ? `${c.bio}${c.affection >= 55 ? ' Z očí je znát, že by žádost o ruku neodmítl' + (c.gender === 'female' ? 'a.' : '.') : ''}` : kind === 'child' ? `${c.gender === 'female' ? 'Dcera' : 'Syn'} rodu ${state.dynastyName}. Kdyby dědic zemřel, ${c.gender === 'female' ? 'nastoupí ona' : 'nastoupí on'} — nejstarší z mladších dětí.` : biography(c, role, state.dynastyName, state.scenario, state.flags))}</p>
      ${c.quirk ? `<div class="ps-quirk"><b>Povaha: ${esc(quirkLabel(c))}</b><span>${esc(quirkText(c, role))}</span></div>` : ''}
      ${(role === 'heir' || kind === 'child') && c.traits ? `<h4 class="ps-section">Vlastnosti ${c.gender === 'female' ? 'dědičky' : 'dědice'}</h4>
        <p class="ps-note">S těmito vlastnostmi jednou převezme vládu. Utváří je výchova a léta dospívání.</p>
        <div class="ps-traits">${TRAIT_DEFS.map((t) => `<div>${t.icon}<span>${t.label}</span><b>${c.traits[t.key]}</b></div>`).join('')}</div>` : ''}
      ${talkSection(state, role)}
      <h4 class="ps-section">Co ${him} ovlivnilo</h4>
      ${rows ? `<ul class="ps-history">${rows}</ul>` : `<p class="ps-empty">Zatím žádné tvé rozhodnutí ${him} nezasáhlo. Až se ${c.gender === 'female' ? 'jí' : 'ho'} nějaké bude týkat, uvidíš ho tady.</p>`}
    </div>
  `;
}

export function openPerson(state, role) {
  renderPersonSheet(state, role);
  const view = document.getElementById('person-view');
  view.classList.add('open');
  view.setAttribute('aria-hidden', 'false');
  view.querySelector('.person-card').scrollTop = 0;
}

export function closePerson() {
  const view = document.getElementById('person-view');
  view.classList.remove('open');
  view.setAttribute('aria-hidden', 'true');
}

export function isPersonOpen() {
  return document.getElementById('person-view').classList.contains('open');
}
