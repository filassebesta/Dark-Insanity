// Hall of Fame (Síň slávy): achievements kept across every game in this
// browser. checkAchievements(state) is called after each choice and season;
// it returns the ones just unlocked so the game can announce them.

import { stat } from './data.js';
import { injuriesOf } from './injuries.js';
import { INJURY_EPITHETS } from './injuries.js';

const STORE = 'insanityKingdom.achievements';

const towns = (s) => Object.entries(s.towns || {});
const hasBuilt = (s, key) => towns(s).some(([, t]) => t.buildings.some((b) => b.key === key && b.ready && !b.base));
const ending = (s, type) => s.gameOver && s.gameOver.type === type;
const injuryWords = new Set(Object.values(INJURY_EPITHETS).flatMap(([m, f]) => [m, f]));

// group: shown as sections in the hall · secret: name and text hidden until unlocked
export const ACHIEVEMENTS = [
  // the line
  { key: 'rok', group: 'Rod', name: 'První jaro', text: 'Přežít první rok.', test: (s) => s.year >= 2 },
  { key: 'generace', group: 'Rod', name: 'Krev pokračuje', text: 'Předat vládu dědici.', test: (s) => s.generation >= 2 },
  { key: 'dynastie', group: 'Rod', name: 'Dynastie', text: 'Dočkat se čtvrté generace rodu.', test: (s) => s.generation >= 4 },
  { key: 'stoleti', group: 'Rod', name: 'Sto let', text: 'Vést rod sto let.', test: (s) => s.year >= 100 },
  { key: 'predek', group: 'Rod', name: 'Jméno do kroniky', text: 'Předek dostal od kroniky přídomek.', test: (s) => (s.pastRulers || []).some((r) => r.epithet) },
  { key: 'zjizveny_predek', group: 'Rod', name: 'Ten, co ztratil…', text: 'Předek dostal přídomek podle svého zranění.', test: (s) => (s.pastRulers || []).some((r) => injuryWords.has(r.epithet)) },
  // the endings
  { key: 'zlaty_vek', group: 'Cíle', name: 'Zlatý věk', text: 'Dovést království ke zlatému věku.', test: (s) => ending(s, 'golden_age') },
  { key: 'korunovace', group: 'Cíle', name: 'Z tvrze na trůn', text: 'Jako šlechtic získat královskou korunu.', test: (s) => ending(s, 'crowned') },
  { key: 'erb', group: 'Cíle', name: 'Erb a tvrz', text: 'Jako sedlák získat šlechtický stav.', test: (s) => ending(s, 'ennobled') },
  { key: 'od_pluhu', group: 'Cíle', name: 'Od pluhu ke koruně', text: 'V jedné kronice dojít od sedláka až na královský trůn.', test: (s) => s.origin === 'sedlak' && s.scenario === 'panovnik' },
  // building
  { key: 'stavitel', group: 'Stavby', name: 'Stavitel', text: 'Dokončit v jedné kronice deset staveb.', test: (s) => stat(s, 'built') >= 10 },
  { key: 'kralovske_mesto', group: 'Stavby', name: 'Královské město', text: 'Rozšířit sídlo na královské město.', test: (s) => towns(s).some(([id, t]) => id !== 'grunt' && t.level >= 5) },
  { key: 'katedrala', group: 'Stavby', name: 'Dům Boží', text: 'Dostavět katedrálu.', test: (s) => hasBuilt(s, 'katedrala') },
  { key: 'dvur', group: 'Stavby', name: 'Z chalupy dvůr', text: 'Rozšířit selský grunt na dvůr.', test: (s) => s.towns && s.towns.grunt && s.towns.grunt.level >= 4 },
  { key: 'mistr', group: 'Stavby', name: 'Cizí mistr', text: 'Vzít do služby mistra stavitele.', test: (s) => !!(s.flags && s.flags.mistr_stavitel) },
  // deeds
  { key: 'vojevudce', group: 'Činy', name: 'Vojevůdce', text: 'Vyhrát v jedné kronice deset bitev.', test: (s) => stat(s, 'battlesWon') >= 10 },
  { key: 'kupec', group: 'Činy', name: 'Kupecký rod', text: 'Dovést domů patnáct karavan a lodí.', test: (s) => stat(s, 'delivered') >= 15 },
  { key: 'truhla', group: 'Činy', name: 'Plná truhla', text: 'Mít v pokladně sto.', test: (s) => s.resources.gold >= 100 },
  { key: 'svatost', group: 'Činy', name: 'Svatá vláda', text: 'Dosáhnout víry devadesát pět.', test: (s) => (s.resources.faith || 0) >= 95 },
  { key: 'ambice', group: 'Činy', name: 'Slovo dané', text: 'Splnit první ambici.', test: (s) => stat(s, 'ambitionsDone') >= 1 },
  { key: 'ambice5', group: 'Činy', name: 'Rod, který nezahálí', text: 'Splnit v jedné kronice pět ambicí.', test: (s) => stat(s, 'ambitionsDone') >= 5 },
  { key: 'krize', group: 'Činy', name: 'Přes nejhorší', text: 'Projít třemi krizemi.', test: (s) => stat(s, 'crises') >= 3 },
  { key: 'ozvena', group: 'Činy', name: 'Minulost se vrací', text: 'Zažít ozvěnu dávného rozhodnutí.', test: (s) => (s.usedEvents || []).some((id) => /^ozvena/.test(id)) },
  // the body
  { key: 'dreva', group: 'Jizvy', name: 'Na dřevěné noze', text: 'Vládnout s dřevěnou nohou.', test: (s) => injuriesOf(s.ruler).some((i) => i.key === 'noha' && i.aided) },
  { key: 'jizvy', group: 'Jizvy', name: 'Poznamenaný rod', text: 'Utržit v jedné kronice tři trvalá zranění.', test: (s) => stat(s, 'scars') >= 3 },
  // dark ones, hidden until they happen
  { key: 'poprava', group: 'Temné konce', name: 'Hlava na kůlu', text: 'Skončit na popravišti.', secret: true, test: (s) => ending(s, 'executed') },
  { key: 'vyhnani', group: 'Temné konce', name: 'Bez střechy', text: 'Být vyhnán z gruntu.', secret: true, test: (s) => ending(s, 'expelled') },
  { key: 'kolaps', group: 'Temné konce', name: 'Popel říše', text: 'Nechat království rozpadnout.', secret: true, test: (s) => ending(s, 'collapse') },
];

export function unlockedAchievements() {
  try {
    return JSON.parse(localStorage.getItem(STORE)) || {};
  } catch {
    return {};
  }
}

/** Unlocks what this game has earned. Returns the newly unlocked definitions. */
export function checkAchievements(state) {
  if (!state) return [];
  const have = unlockedAchievements();
  const fresh = [];
  for (const a of ACHIEVEMENTS) {
    if (have[a.key]) continue;
    let ok = false;
    try { ok = a.test(state); } catch { ok = false; }
    if (!ok) continue;
    have[a.key] = { at: Date.now(), ruler: state.ruler.name, dynasty: state.dynastyName, year: state.year };
    fresh.push(a);
  }
  if (fresh.length) {
    try { localStorage.setItem(STORE, JSON.stringify(have)); } catch { /* storage full or blocked: keep playing */ }
    state.achievementsEarned = [...(state.achievementsEarned || []), ...fresh.map((a) => a.key)];
  }
  return fresh;
}
