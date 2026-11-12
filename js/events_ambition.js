// The ambition offer (see ambitions.js): raised by the engine as state.pendingEvent
// 'ambice' with three fitting goals in state.ambitionOffer. Branch extras:
//   ambition: '<key>' — the ruler takes up this goal · ambitionSkip: true — none for now

import { AMBITIONS } from './ambitions.js';

const HINT = { intelligence: ['trait', 'intelligence'], strength: ['trait', 'strength'], eloquence: ['trait', 'eloquence'], patience: ['trait', 'patience'] };

export const AMBITION_EVENTS = [
  {
    id: 'ambice',
    scenarios: ['panovnik', 'slechtic', 'sedlak'], forced: true,
    free: true, // takes no season: the season's own event follows right after
    image: 'assets/events/portret_vladce.jpg',
    title: 'Čeho chceš dosáhnout',
    text: 'Je čas se zastavit a rozhodnout, kam dál. Dny plynou jeden za druhým a kdo nemá cíl, toho nesou. {ruler.name} ví, že na všechno síly nestačí — a že lidé si pamatují ty, kdo něco slíbili a dokázali.',
    choices: [
      ...Object.entries(AMBITIONS).map(([key, a]) => ({
        label: `${a.name}: ${a.text.charAt(0).toLowerCase()}${a.text.slice(1, -1)} (do ${a.years} let)`,
        requires: (s) => (s.ambitionOffer || []).includes(key),
        hintType: HINT[a.trait][0], hintKey: HINT[a.trait][1],
        ambition: key,
        chronicle: `${'{ruler.name}'} si {R:předsevzal|předsevzala}: ${a.name.toLowerCase()}. ${a.text}`,
      })),
      {
        label: 'Žít ze dne na den a nic nesvazovat slibem',
        hintType: 'trait', hintKey: 'patience',
        ambitionSkip: true,
        chronicle: '{ruler.name} si nic {R:nepředsevzal|nepředsevzala}. Co přijde, to přijde.',
      },
    ],
  },
];
