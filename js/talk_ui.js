// The conversation box in a court member's sheet (see talk.js). Topics with
// a roll go through the same k% table as risky choices (dice_ui.js).

import { talkBlock, topicsFor, topicRollChoice, greeting, holdTalk, TOPICS } from './talk.js';
import { openRoll } from './dice_ui.js';
import { rollParts } from './engine.js';
import { RESOURCE_DEFS, TRAIT_DEFS, resourceLabel } from './data.js';
import { esc } from './ui.js';
import { personOf } from './family.js';

let current = null; // { state, role } of the open sheet

/** HTML of the conversation section for the person sheet. */
export function talkSection(state, role) {
  current = { state, role };
  const why = talkBlock(state, role);
  const c = personOf(state, role);
  if (c && c.alive === false) return '';
  const suitor = String(role).startsWith('suitor:');
  if (String(role).startsWith('child:') && !topicsFor(state, role).length) return '';
  const head = `<h4 class="ps-section">${suitor ? 'Námluvy' : 'Rozhovor'}</h4>`;
  if (why) {
    const fresh = c.talkTurn === state.turn && c.lastTalk;
    const delta = fresh && c.lastTalkDelta ? `<span class="ph-delta ${c.lastTalkDelta > 0 ? 'pos' : 'neg'}">${suitor ? 'náklonnost' : 'věrnost'} ${c.lastTalkDelta > 0 ? '+' : ''}${c.lastTalkDelta}</span>` : '';
    return `${head}<div class="talk-box">${fresh ? `<p class="talk-reply">${esc(c.lastTalk)}</p>${delta}` : ''}<p class="talk-note">${esc(why)}</p></div>`;
  }
  const topics = topicsFor(state, role).map(({ key, def, block, cost }) => {
    const roll = topicRollChoice(state, role, key);
    const pct = roll ? Math.round(rollParts(state, roll).chance * 100) : null;
    const trait = roll && roll.traitScale ? TRAIT_DEFS.find((t) => t.key === roll.traitKey).label : ''; // a wish for a child is luck, not skill
    const price = cost ? Object.entries(cost).map(([k, v]) => `${v} ${resourceLabel(RESOURCE_DEFS.find((d) => d.key === k), state.scenario).toLowerCase()}`).join(', ') : '';
    const tag = roll ? `${trait ? `${trait} · ` : ''}k% · ${pct} %` : price || 'jistě';
    return `<button class="talk-topic" data-talk-topic="${key}"${block ? ` disabled title="${esc(block)}"` : ''}>
      <b>${esc(def.label)}</b><span>${esc(block || tag)}</span></button>`;
  }).join('');
  return `${head}<div class="talk-box">
      <p class="talk-greet">${esc(greeting(state, role))}</p>
      <div class="talk-topics">${topics}</div>
      <div class="talk-table"></div>
    </div>`;
}

function finish(key, success) {
  const { state, role } = current;
  const res = holdTalk(state, role, key, success);
  const shown = res.role || role; // after a wedding the sheet shows the new spouse
  const c = personOf(state, shown);
  c.lastTalk = res.text;
  c.lastTalkDelta = res.delta;
  document.dispatchEvent(new CustomEvent('kingdom:talk', { detail: { role: shown } }));
}

/** Clicks in the person sheet: pick a topic, roll if needed, show the answer. */
export function wireTalk() {
  document.getElementById('person-view').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-talk-topic]');
    if (!btn || btn.disabled || !current) return;
    const key = btn.dataset.talkTopic;
    const { state, role } = current;
    const roll = topicRollChoice(state, role, key);
    const box = document.querySelector('#person-sheet .talk-box');
    box.querySelectorAll('.talk-topic').forEach((b) => { b.disabled = true; });
    if (!roll) { finish(key, true); return; }
    const table = box.querySelector('.talk-table');
    openRoll(state, { ...roll, label: TOPICS[key].label }, (rolled) => finish(key, rolled.success), table);
    table.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}
