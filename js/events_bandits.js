// Bandits (zbojníci): events where the ruler can fight in person (combat.js).
// A choice with `combat` is fought round by round at the table; the sims and
// the old roll fields (baseChance, traitKey) stand for it when nobody plays.

const ALL = ['panovnik', 'slechtic', 'sedlak'];
const REALM = ['panovnik', 'slechtic'];
const img = (id) => `assets/events/${id}.jpg`;
const gold = (n) => (s) => s.resources.gold >= n;

function ownProvince(s) {
  const list = s.provinces.filter((p) => !p.lost && (!p.owner || p.owner === 'player'));
  return list.length ? list[Math.floor(Math.random() * list.length)].id : null;
}

export const BANDIT_EVENTS = [
  {
    id: 'z_zbojnici_cesta',
    scenarios: ALL, cooldown: 20, minTurn: 3,
    image: img('lapkove_ve_hvozdu'),
    title: 'Zbojníci na cestě',
    text: 'Cesta vede úvozem mezi buky. Najednou padne přes cestu strom a z houští vystoupí pět chlapů se sekerami. Ten největší se usměje: „Mýto, {R:pane|paní}. Nebo si vezmeme všechno — i boty.“',
    choices: [
      {
        label: 'Tasit zbraň a bránit se',
        combat: 'zbojnici',
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.4, traitKey: 'strength', traitScale: 0.05,
        onSuccess: { effects: { prestige: 4, gold: 3 }, traitGain: 'strength', chronicle: '{ruler.name} se zbojníkům {R:postavil|postavila} a tlupa se rozprchla do lesa. Jejich měšce zůstaly na cestě.' },
        onFailure: { effects: { gold: -3, prestige: -2 }, chronicle: 'Zbojníci byli silnější. Vzali měšec, koně i plášť a nechali {R:ho|ji} ležet v úvozu.' },
      },
      {
        label: 'Zaplatit mýto',
        requires: gold(3),
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -3 },
        chronicle: 'Zbojníci dostali, co chtěli, a s úklonou uvolnili cestu. Příště budou chtít víc.',
      },
      {
        label: 'Pokusit se je umluvit',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.3, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { prestige: 2 }, traitGain: 'eloquence', chronicle: 'Pár slov o šibenici a o dobrém jídle v kraji — a zbojníci odešli s prázdnýma rukama, ale s dobrou náladou.' },
        onFailure: { effects: { gold: -4 }, chronicle: 'Zbojníci se smáli tak dlouho, až je to přestalo bavit. Pak vzali všechno.' },
      },
      {
        label: 'Utéct do lesa',
        hintType: 'trait', hintKey: 'patience',
        isRoll: true, baseChance: 0.35, traitKey: 'patience', traitScale: 0.04,
        onSuccess: { chronicle: 'Les byl hustý a zbojníci líní. Cesta domů trvala o den déle, ale měšec zůstal.' },
        onFailure: { effects: { gold: -3 }, injury: 'pohmozdeni', chronicle: 'Zbojníci byli rychlejší. Do vsi se {R:vrátil|vrátila} bez měšce a s modřinami.' },
      },
    ],
  },

  {
    id: 'z_hejtman',
    scenarios: REALM, cooldown: 24, minTurn: 8,
    image: img('zastava_lesa'),
    target: ownProvince,
    title: 'Zbojnický hejtman',
    text: 'V kraji {province.name} řádí zbojnický hejtman. Vypaluje dvory, věší výběrčí a lidé o něm zpívají písně. Teď poslal vzkaz: ať si to s ním vrchnost rozdá sama, muž proti muži, na mýtině u starého dubu.',
    choices: [
      {
        label: 'Přijmout výzvu',
        combat: 'hejtman',
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.25, traitKey: 'strength', traitScale: 0.05,
        onSuccess: { effects: { prestige: 8 }, provinceEffects: { target: { loyalty: 8, unrest: -10 } }, traitGain: 'strength', chronicle: 'Hejtman padl na mýtině u starého dubu. Jeho tlupa se rozutekla a písně o něm zpívají už jen ženy, potichu.' },
        onFailure: { effects: { prestige: -5 }, provinceEffects: { target: { unrest: 8 } }, chronicle: 'Hejtman zvítězil a nechal vrchnost odejít — aby to všichni viděli. V kraji teď zpívají o něm ještě hlasitěji.' },
      },
      {
        label: 'Poslat na ně vojsko',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.45, resourceKey: 'army', resourceScale: 0.5,
        onSuccess: { provinceEffects: { target: { unrest: -8 } }, chronicle: 'Vojsko vyčistilo lesy. Hejtman utekl za hranice, jeho muži visí podél cesty.' },
        onFailure: { effects: { army: -6 }, provinceEffects: { target: { unrest: 6 } }, chronicle: 'Zbojníci znali les lépe. Vojsko se vrátilo prořídlé a hejtman se smál.' },
      },
      {
        label: 'Vypsat odměnu na jeho hlavu',
        requires: gold(8),
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -8 },
        provinceEffects: { target: { unrest: -4 } },
        chronicle: 'Za hejtmanovu hlavu je vypsána odměna. Do půl roku ji přinesl vlastní švagr.',
      },
    ],
  },

  {
    id: 'z_prepadeni_noc',
    scenarios: ALL, cooldown: 24, minTurn: 5,
    image: img('pohranicni_najezd'),
    title: 'Noční přepadení',
    text: 'Uprostřed noci se rozštěkali psi. Ve dvoře jsou cizí muži s pochodněmi a někdo už páčí vrata od sýpky. Než se kdo vzbudí, bude po všem.',
    choices: [
      {
        label: 'Popadnout zbraň a vyběhnout',
        combat: 'zbojnici',
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.4, traitKey: 'strength', traitScale: 0.05,
        onSuccess: { effects: { prestige: 5 }, traitGain: 'strength', chronicle: '{ruler.name} {R:vyběhl|vyběhla} do tmy se zbraní v ruce a lupiči utekli i bez kořisti. Ráno se o tom mluvilo v celém kraji.' },
        onFailure: { effects: { food: -5, gold: -2 }, chronicle: 'Lupiči byli silnější. Odnesli zásoby i truhlu a nechali za sebou rozbitá vrata.' },
      },
      {
        label: 'Zabarikádovat se a čekat',
        hintType: 'trait', hintKey: 'patience',
        effects: { food: -4 },
        chronicle: 'Dveře vydržely. Sýpka ne. Ráno zbyly ve dvoře jen stopy a rozsypané obilí.',
      },
      {
        label: 'Vzbudit všechny a bránit se společně',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.5, resourceKey: 'army', resourceScale: 0.5,
        onSuccess: { effects: { prestige: 3 }, chronicle: 'Celý dům se vzbudil a s cepy, vidlemi a meči vyhnal lupiče ze dvora.' },
        onFailure: { effects: { army: -2, food: -3 }, chronicle: 'Lupiči se nedali zastrašit. Než utekli, padlo několik dobrých lidí.' },
      },
    ],
  },
];
