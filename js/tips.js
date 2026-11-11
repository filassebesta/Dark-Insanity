// Tips for a first game: each one shows once, when the player first meets
// the system it explains. They can be switched off or shown again in Options.

import { esc } from './ui.js';

const STORE = 'insanityKingdom.tips';

const TIPS = {
  start: ['Jak se hraje', 'Každé období přijde událost a ty volíš, co uděláš. Co volba přinese, se dozvíš až potom. U riskantních voleb vidíš jen šanci na úspěch. Ovládání: 1–4 volba, Enter pokračovat, M mapa, P postava, O obchod.'],
  roll: ['Riskantní volba', 'Šance vpravo u volby se počítá z tvých vlastností a zdrojů. Zranění a únava ji snižují, schopný rádce ji zvedá.'],
  ambition: ['Ambice', 'Vyber si cíl na několik let. Lišta nad textem ukáže, jak se ti daří. Splněná ambice přinese odměnu a bod do vlastnosti, nesplněná trochu ostudy.'],
  crisis: ['Krize', 'Některý zdroj ti došel. Krize přichází, když zlato, jídlo, vojsko nebo jiná opora klesne k nule. Hlídej si lištu nahoře.'],
  map: ['Mapa', 'Klikni na kraj a uvidíš jeho stav. Číslo u města nebo vsi je jeho úroveň: klikni na něj a můžeš tam stavět. Jednou za rok tu můžeš vydat výnos.'],
  town: ['Stavění', 'Klikni na volnou parcelu a vyber stavbu. Stavba se platí hned a trvá několik období. Najednou staví jen omezený počet stavebních hutí, tak volí, kam je pošleš.'],
  trade: ['Obchod', 'Tvé kraje plní sklad zbožím. Prodej ho hned v Brodu, nebo ho pošli karavanou za lepší cenou — cesta ale trvá a hrozí přepadení.'],
  injury: ['Zranění', 'Vládce byl zraněn. Zranění snižují vlastnosti a tím i šance ve všech hodech. Dočasná se zahojí, trvalá zůstanou. Podrobnosti najdeš v Postavě (P).'],
  hall: ['Síň slávy', 'Za výjimečné činy se odemykají úspěchy. Zůstávají ti i v dalších hrách — najdeš je v Možnostech a na konci kroniky.'],
};

function load() {
  try {
    return { off: false, seen: [], ...JSON.parse(localStorage.getItem(STORE)) };
  } catch {
    return { off: false, seen: [] };
  }
}

function save(data) {
  try { localStorage.setItem(STORE, JSON.stringify(data)); } catch { /* blocked storage: tips just repeat */ }
}

export function tipsEnabled() {
  return !load().off;
}

export function setTipsEnabled(on) {
  const data = load();
  data.off = !on;
  save(data);
  if (!on) hideTip();
}

export function resetTips() {
  save({ off: false, seen: [] });
}

let queue = [];

/** Shows a tip once (unless switched off). Tips that come together wait their turn. */
export function showTip(key) {
  const data = load();
  if (data.off || data.seen.includes(key) || !TIPS[key] || queue.includes(key)) return;
  queue.push(key);
  if (queue.length === 1) render();
}

function render() {
  const key = queue[0];
  let card = document.getElementById('tip-card');
  if (!key) {
    if (card) card.remove();
    return;
  }
  if (!card) {
    card = document.createElement('aside');
    card.id = 'tip-card';
    card.className = 'tip-card';
    card.setAttribute('role', 'note');
    document.body.appendChild(card);
    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-tip-ok]')) next();
      if (e.target.closest('[data-tip-off]')) { setTipsEnabled(false); queue = []; render(); }
    });
  }
  const [title, text] = TIPS[key];
  card.innerHTML = `<span class="tip-over">Rada</span><strong>${esc(title)}</strong><p>${esc(text)}</p>
    <div class="tip-actions"><button class="tip-off" data-tip-off>Vypnout rady</button><button class="tip-ok" data-tip-ok>Rozumím</button></div>`;
  card.classList.remove('in');
  void card.offsetWidth; // restart the entry animation
  card.classList.add('in');
}

function next() {
  const data = load();
  if (queue[0] && !data.seen.includes(queue[0])) data.seen.push(queue[0]);
  save(data);
  queue.shift();
  render();
}

export function hideTip() {
  queue = [];
  render();
}
