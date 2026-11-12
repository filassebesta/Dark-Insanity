// Events about the ruler's wounds (see injuries.js). Branch extras:
//   injury: '<key>' | 'random' | { pool, chance }  — a new wound
//   heal: true    — the worst temporary wound is cured
//   treat: true   — wounds no longer fester and heal sooner
//   worsen: true  — a botched cure: a broken arm or a wound turns into a lasting injury
//   aid: true     — a wooden leg, an iron hand or an eye patch for a lost limb

import { treatable, aidable, injuriesOf } from './injuries.js';

const ALL = ['panovnik', 'slechtic', 'sedlak'];
const REALM = ['panovnik', 'slechtic'];
const img = (id) => `assets/events/${id}.jpg`;
const peasant = (s) => s.scenario === 'sedlak';
const lord = (s) => s.scenario !== 'sedlak';
const visible = (s) => injuriesOf(s.ruler).some((i) => ['noha', 'ruka', 'oko', 'jizva'].includes(i.key));

export const INJURY_EVENTS = [
  {
    id: 'z_ranhojic',
    scenarios: ALL, cooldown: 4, weight: 4,
    image: img('nemoc_vladce'),
    requires: (s) => !!treatable(s),
    title: 'Rána, která se nehojí',
    text: 'Obvazy se každé ráno mění a každé ráno jsou krvavější. {injury.Name} pálí a v noci přichází horečka. U dveří čekají dva: učený lékař s kufříkem nástrojů a stará bylinkářka z lesa.',
    choices: [
      {
        label: 'Zaplatit učeného lékaře',
        requires: (s) => lord(s) && s.resources.gold >= 6,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -6 },
        treat: true,
        chronicle: 'Lékař ránu vypálil, sešil a zakázal víno. {ruler.name} {R:zuřil|zuřila}, ale horečka ustoupila.',
      },
      {
        label: 'Poslat pro ranhojiče z Brodu',
        requires: (s) => peasant(s) && s.resources.gold >= 3,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -3 },
        treat: true,
        chronicle: 'Ranhojič z Brodu vymyl ránu pálenkou a přiložil plátno namočené v octě. Bolelo to víc než samo zranění, ale pomohlo to.',
      },
      {
        label: 'Svěřit se bylinkářce',
        hintType: 'trait', hintKey: 'patience',
        isRoll: true, baseChance: 0.55, traitKey: 'patience', traitScale: 0.03,
        onSuccess: { heal: true, chronicle: 'Bylinkářka přiložila mech, med a cosi, o čem nechtěla mluvit. Do týdne bylo po všem.' },
        onFailure: { worsen: true, chronicle: 'Bylinky nepomohly. Když se konečně přivolal lékař, bylo už pozdě to napravit — zůstane to {R:mu|jí} na celý život.' },
      },
      {
        label: 'Modlit se a vydržet',
        hintType: 'resource', hintKey: 'faith',
        isRoll: true, baseChance: 0.3, resourceKey: 'faith', resourceScale: 0.5,
        onSuccess: { effects: { faith: 2 }, heal: true, chronicle: 'Po třech dnech modliteb horečka v noci povolila. Kaplan mluví o zázraku.' },
        onFailure: { effects: { faith: -1 }, chronicle: 'Modlitby se nesly prázdnou kaplí. Rána se hojí, jak se jí zachce.' },
      },
    ],
  },

  {
    id: 'z_nahrada',
    scenarios: ALL, cooldown: 8, weight: 3,
    image: img('nove_kuse'),
    requires: (s) => !!aidable(s),
    title: 'Řemeslník s nabídkou',
    text: '{aid.Maker} se uklonil a rozbalil plátno. Slyšel prý, jak {ruler.name} {R:přišel|přišla} o {aid.lost}, a přináší {aid.name}, změřenou na míru. Nebude to jako dřív, ale bude to lepší než teď.',
    choices: [
      {
        label: 'Nechat si ji udělat',
        requires: (s) => lord(s) && s.resources.gold >= 8,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -8 },
        aid: true,
        chronicle: 'Řemeslník pracoval celý měsíc. {ruler.name} se na náhradu nejdřív mračil{R:|a}, pak si zvykl{R:|a} a nakonec bez ní {R:nevyšel|nevyšla} ze dveří.',
      },
      {
        label: 'Zaplatit, kolik dům dá',
        requires: (s) => peasant(s) && s.resources.gold >= 3,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -3 },
        aid: true,
        chronicle: 'Řemeslník vzal tři groše a pytel mouky. Náhrada je hrubá, ale drží — a na gruntu se zase dá pracovat.',
      },
      {
        label: 'Odmítnout a naučit se žít bez ní',
        hintType: 'trait', hintKey: 'patience',
        traitGain: 'patience',
        chronicle: '{ruler.name} řemeslníka poslal{R:|a} pryč. Co je ztracené, je ztracené — a s tím se dá žít i bez dřeva a železa.',
      },
    ],
  },

  {
    id: 'z_posmech',
    scenarios: REALM, cooldown: 24, minTurn: 2,
    image: img('dvorni_blazen'),
    requires: visible,
    title: 'Smích za zády',
    text: 'Na hostině si šašek přivázal ke koleni násadu od koštěte, přes oko pásku a začal se potácet mezi stoly. Hosté se dusí smíchem — a pak jeden po druhém zmlknou a dívají se k čelu stolu, kde sedí {ruler.name}.',
    choices: [
      {
        label: 'Dát ho zbičovat',
        hintType: 'trait', hintKey: 'strength',
        effects: { prestige: 1, stability: -1 },
        hiddenEffects: { setFlag: 'harsh_ruler' },
        chronicle: 'Šašek dostal dvacet ran na nádvoří. Hostina pokračovala v tichu a nikdo už se nesmál — ani tam, kde by měl.',
      },
      {
        label: 'Smát se s nimi',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.35, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { prestige: 5, stability: 1 }, traitGain: 'eloquence', chronicle: '{ruler.name} se smál{R:|a} nejhlasitěji a pak šaškovi ukázal{R:|a}, jak se to dělá doopravdy. O té hostině se vyprávělo ještě za vnuků.' },
        onFailure: { effects: { prestige: -4 }, chronicle: 'Smích {R:mu|jí} zamrzl na rtech. Všichni viděli, jak to bolí — a to je horší než každý vtip.' },
      },
      {
        label: 'Přejít to mlčením',
        hintType: 'trait', hintKey: 'patience',
        traitGain: 'patience',
        effects: { prestige: -1 },
        chronicle: '{ruler.name} dopil{R:|a} pohár a {R:odešel|odešla} spát. Šašek ráno zmizel z hradu sám od sebe.',
      },
    ],
  },
];
