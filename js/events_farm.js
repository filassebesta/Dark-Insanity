// The farm's work for the year, told as a story. A peasant plans one extra job a
// year from the map (FARM_DECREES in engine.js). Whoever has not done so by the
// autumn gets this scene after the harvest instead, with the same choices — the
// farm cannot live without that yearly effort, and the story should not depend
// on finding a map button. Takes no season (free). Branch extra: decree: '<key>'.

import { canAffordDecree } from './engine.js';

const can = (key) => (s) => canAffordDecree(s, key);

export const FARM_EVENTS = [
  {
    id: 's_prace_na_gruntu',
    scenario: 'sedlak', forced: true, free: true,
    image: 'assets/events/bohata_uroda.jpg',
    title: 'Po žních',
    text: 'Obilí je ve stodole a dny se krátí. Do zimy zbývá pár týdnů, kdy se dá udělat ještě jedna velká práce navíc. {ruler.name} stojí na mezi a přemýšlí, kam dát ruce a groše letos — protože grunt, do kterého se nic nevloží, pomalu chátrá.',
    choices: [
      {
        label: 'Vyklučit kus lesa na nové pole',
        requires: can('clear'), hintType: 'resource', hintKey: 'stability',
        decree: 'clear',
        chronicle: 'Celý podzim se na gruntu kácelo a pálily se pařezy. Na jaře se bude orat o kus dál.',
      },
      {
        label: 'Přikoupit krávu',
        requires: can('cattle'), hintType: 'resource', hintKey: 'gold',
        decree: 'cattle',
        chronicle: 'Do chléva přibyla kráva. Mléko pro děti a tah pro pluh.',
      },
      {
        label: 'Odvézt přebytky na trh do Brodné',
        requires: (s) => can('market')(s) && s.resources.food >= 25, // only real surplus goes to market before winter
        hintType: 'resource', hintKey: 'food',
        decree: 'market',
        chronicle: 'Vůz plný obilí a sýrů se vrátil z Brodné prázdný — a měšec plný.',
      },
      {
        label: 'Pomoci sousedům se střechou a zásobami',
        requires: can('neighbours'), hintType: 'resource', hintKey: 'prestige',
        decree: 'neighbours',
        chronicle: 'Půl vsi pomáhalo u sousedů. Na takové věci se v Lipnici nezapomíná.',
      },
      {
        label: 'Zanést na panský dvůr dar navíc',
        requires: can('lord'), hintType: 'resource', hintKey: 'favor',
        decree: 'lord',
        chronicle: 'Na panský dvůr putoval dar, který nikdo nežádal. Takové dary se pamatují.',
      },
      {
        label: 'Odpočinout si, dokud je čas',
        hintType: 'trait', hintKey: 'patience',
        chronicle: 'Letos se na gruntu nic navíc nedělalo. Ruce si odpočinuly — grunt ne.',
      },
    ],
  },
];
