// The empire: a king who wears foreign crowns (realms.js) has to govern them (empire.js).
//
//   risa_sprava       the yearly decree for every held realm (forced, free; engine.js processEmpire raises it in autumn)
//   risa_snem         imperial diet: the vassal lords argue (both crowns, tier 6)
//   risa_mistodrzici  a governor grows too powerful
//   risa_pretendent   a claimant of the conquered dynasty appears  → risa_spiknuti, risa_vyroci (pardon)
//   risa_neduh        plague in the Marches or famine in the Wastes
//   risa_karavany     tribute caravans arrive
//   risa_mistokral    the heir as viceroy of a held crown
//   risa_vyroci       anniversary of the coronation (tier 6)
//   risa_jih          envoys of the Southern Empire react to the rise (once; flags risa_jih_pritel / risa_jih_nepritel)
//   risa_spiknuti     a plot of the conquered lords (fed by a claimant at large, risa_jih_nepritel, a bold governor)
//   risa_viry         religious dispute between the faiths of the realms
//   risa_vrchol       the empire at its peak (8 loyal quiet years): close the chronicle in glory or rule on
//   risa_rozpad       a held crown is lost to a revolt
// Events about one realm name it in `target` ('realm:<key>', engine.js setTargetContext); the texts then use
// {emp.gen} {emp.loc} {emp.lord} … (empire.js empireTokens). Branch extras: empire: { decreed, ambition, viceroy,
// pretender, pardon }, realm: { focus | held | <key>: { attitude, power } }.
// Choice labels carry no numbers; what a choice does shows in the result.

import { heldKeys, realmRec, pickHeld, nextUndecreed, empireYears } from './empire.js';

const PAN = 'panovnik';
const img = (id) => `assets/events/${id}.jpg`;

const some = (s) => heldKeys(s).length >= 1;
const both = (s) => heldKeys(s).length >= 2 && s.ruler.statusTier >= 6;
const tgt = (key) => (key ? `realm:${key}` : null);
const gold = (n) => (s) => s.resources.gold >= n;
const spyLoyal = (s) => (s.spymaster && s.spymaster.loyalty >= 60 ? 0.08 : 0);

/** How much trouble a held realm brews: low loyalty, a bold lord, a claimant at large, southern gold. */
const trouble = (s, k) => (100 - s.realms[k].attitude) / 10 + realmRec(s, k).ambition / 10 + (realmRec(s, k).pretender === 1 ? 4 : 0) + (s.flags.risa_jih_nepritel ? 2 : 0);
const plotting = (s, k) => s.realms[k].attitude < 55 || realmRec(s, k).ambition >= 55 || realmRec(s, k).pretender === 1 || !!s.flags.risa_jih_nepritel;

export const EMPIRE_EVENTS = [
  // ---------- the yearly decree: one deliberate act for each crown ----------
  {
    id: 'risa_sprava',
    scenario: PAN, forced: true, free: true,
    target: (s) => tgt(nextUndecreed(s)),
    dropIf: (s) => !nextUndecreed(s),
    image: img('kapitola_cizi_koruna'),
    title: 'Správa dobytých zemí',
    text: 'Rok se chýlí ke konci a z dalekých zemí přicházejí účty. Z {emp.gen} {X:přijel|přijela} {emp.lordTitle} {emp.lord}, {X:kterému|které} koruna svěřila tamní hrady, a s {X:ním|ní} vozy s daněmi a svazek stížností. {emp.mood} Písař má připravený pergamen: jeden výnos pro tuto zem za rok — víc úředníci ani pokladna neunesou.',
    choices: [
      {
        label: 'Potvrdit tamní zákony a zvyky', hintType: 'trait', hintKey: 'patience',
        effects: { gold: -4, legitimacy: 2 }, realm: { focus: { attitude: 9, power: -2 } }, empire: { decreed: true, ambition: -4 },
        chronicle: 'Do {emp.gen} odjel výnos, který potvrzuje staré zákony a zvyky. Tamní páni ho přijali s úlevou.',
      },
      {
        label: 'Dosadit do hradů správce z hlavního města', hintType: 'trait', hintKey: 'strength',
        effects: { prestige: 3, gold: 3 }, realm: { focus: { attitude: -6, power: 10 } }, empire: { decreed: true, ambition: 6 },
        chronicle: 'Do hradů {emp.loc} nastoupili správci z Vlčího Údělu. Poslušnost přišla rychle, přátelství nepřišlo vůbec.',
      },
      {
        label: 'Vypsat v zemi nový odvod mužů', requires: (s) => s.resources.stability >= 25, hintType: 'resource', hintKey: 'army',
        effects: { army: 8 }, realm: { focus: { attitude: -9, power: -4 } }, empire: { decreed: true, ambition: 4 },
        chronicle: 'Z {emp.gen} odešli mladí muži pod korouhev. Pole teď obdělávají ženy a starci a nikdo se netváří vděčně.',
      },
      {
        label: 'Odměnit místní pány hostinou a dary', requires: gold(10), hintType: 'trait', hintKey: 'eloquence',
        effects: { gold: -10, prestige: 2 }, realm: { focus: { attitude: 12, power: 4 } }, empire: { decreed: true, ambition: -6 },
        chronicle: 'Místní páni hodovali na účet koruny. Kdo jednou seděl u jejího stolu, bouří se hůř.',
      },
      {
        label: 'Vybrat v zemi vyšší daň', hintType: 'resource', hintKey: 'gold',
        effects: { gold: 12 }, realm: { focus: { attitude: -8 } }, empire: { decreed: true, ambition: 3 },
        chronicle: 'Výběrčí z hlavního města prošli vesnicemi {emp.gen} od chalupy k chalupě. Pokladna se plní, nálada klesá.',
      },
      {
        label: 'Poslat do země obilí ze sýpek hlavního města', requires: (s) => s.resources.food >= 30, hintType: 'resource', hintKey: 'food',
        effects: { food: -12, faith: 1 }, realm: { focus: { attitude: 8 } }, empire: { decreed: true, ambition: -2 },
        chronicle: 'Ze sýpek hlavního města odjely do {emp.gen} vozy s obilím. Kde se rozdávalo, tam si vzpomenou.',
      },
      {
        label: 'Letos nic neměnit', hintType: 'trait', hintKey: 'patience',
        effects: {}, realm: { focus: { attitude: -3, power: -2 } }, empire: { decreed: true },
        chronicle: 'Pergamen zůstal čistý. {emp.LordTitle} {emp.lord} odjel{X:|a} s prázdnýma rukama a s dojmem, že koruna se o {emp.name} nezajímá.',
      },
    ],
  },

  // ---------- the empire's life ----------
  {
    id: 'risa_snem',
    scenario: PAN, cooldown: 28, weight: 5, seasons: [0, 1],
    requires: both,
    image: img('v_korunni_rada'),
    title: 'Císařský sněm',
    text: 'Do hlavního města se sjeli vládcové všech tří zemí: {elord.east.title} {elord.east} z Východních marek, {elord.north.title} {elord.north} ze Severních pustin a velmoži z Vlčího Údělu. Sněm sotva začal a už se hádají. Marky chtějí, aby hlídku na hranici s Jižní říší platila celá říše. Kmeny žádají, aby se jim v zimě prominuly dávky. A velmoži z domova se ptají, proč mají platit za země, které si nekoupili. Všichni se dívají na tebe.',
    choices: [
      {
        label: 'Podpořit Marky: hranice bude věcí celé říše', hintType: 'resource', hintKey: 'army',
        effects: { gold: -12, army: 4, prestige: 2 }, realm: { east: { attitude: 12 }, north: { attitude: -6 } },
        chronicle: 'Sněm rozhodl, že hranici s jihem platí celá říše. {elord.east} {U:odjel|odjela} spokojen{U:|a}, {elord.north} s kamennou tváří.',
      },
      {
        label: 'Prominout horským kmenům zimní dávky', hintType: 'resource', hintKey: 'gold',
        effects: { gold: -6 }, realm: { north: { attitude: 12 }, east: { attitude: -4 } },
        chronicle: 'Kmenům byly zimní dávky prominuty. {elord.north} se poprvé na sněmu usmál{W:|a}; v Markách si toho všimli.',
      },
      {
        label: 'Přimět všechny strany k dohodě', hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.4, traitKey: 'eloquence', traitScale: 0.05, resourceKey: 'legitimacy', resourceScale: 0.002,
        onSuccess: { effects: { prestige: 5, legitimacy: 3, stability: 2 }, realm: { held: { attitude: 6 } }, chronicle: 'Do tří dnů se našel kompromis, který podepsali všichni. Sněm skončil hostinou a kronikáři si zapsali, že se říše poprvé dohodla sama.' },
        onFailure: { effects: { stability: -3, prestige: -2 }, realm: { held: { attitude: -6 } }, chronicle: 'Sněm se rozešel bez dohody a s urážkami. {elord.east} i {elord.north} odjeli domů s pocitem, že koruna je neslyší.' },
      },
      {
        label: 'Zakázat spory a rozhodnout všechno {R:sám|sama}', hintType: 'trait', hintKey: 'strength',
        effects: { prestige: 4, stability: 2, legitimacy: -2 }, realm: { held: { attitude: -5, power: 6 } },
        chronicle: '{ruler.name} sněm přerušil{R:|a} a o všem rozhodl{R:|a} {R:sám|sama}. Nikdo nenamítal nahlas.',
      },
    ],
  },

  {
    id: 'risa_mistodrzici',
    scenario: PAN, cooldown: 24, weight: 4,
    target: (s) => tgt(pickHeld(s, 'strong', (r) => r.power >= 35)),
    image: img('n_zradce_v_radach'),
    title: 'Správce roste přes hlavu',
    text: '{emp.Loc} se mluví o jediném: {emp.lordTitle} {emp.lord}, {X:kterému|které} jsi svěřil{R:|a} tamní hrady, se v poslední době chová spíš jako {X:král|královna} než jako správce. Daně vybírá na vlastní pečeť, kastelány jmenuje {X:sám|sama} a vojáci v hradech přísahají už jen {X:jemu|jí}. Zatím posílá do Vlčího Údělu, co má, a poslušné dopisy — jenže kdo drží hrady, nepotřebuje ničí svolení.',
    choices: [
      {
        label: 'Odvolat správce a dosadit někoho poslušnějšího', hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.4, traitKey: 'strength', traitScale: 0.05, resourceKey: 'army', resourceScale: 0.003, noInjury: true,
        onSuccess: { effects: { prestige: 2 }, realm: { focus: { attitude: -3, power: -18 } }, empire: { ambition: -15 }, chronicle: 'Nový správce přijel se dvaceti jezdci a {emp.lord} {X:odešel|odešla} bez protestu. Hrady {emp.gen} jsou zase koruny.' },
        onFailure: { effects: { army: -4, stability: -2 }, realm: { focus: { attitude: -12, power: 2 } }, empire: { ambition: 10 }, chronicle: '{emp.lord} se odvolání vzepřel{X:|a}. Posel se vrátil bez odpovědi a hrady {emp.gen} zůstaly zavřené.' },
      },
      {
        label: 'Svázat si {X:ho|ji} titulem a zlatým řetězem', requires: gold(8), hintType: 'resource', hintKey: 'gold',
        effects: { gold: -8, prestige: -1 }, realm: { focus: { attitude: 6 } }, empire: { ambition: -10 },
        chronicle: '{emp.lord} dostal{X:|a} nový titul a zlatý řetěz. Kdo nosí řetěz od koruny, těžko jí vyhlašuje válku.',
      },
      {
        label: 'Nechat být, dokud posílá daně', hintType: 'trait', hintKey: 'patience',
        effects: { gold: 4 }, realm: { focus: { attitude: 2, power: 6 } }, empire: { ambition: 10 },
        chronicle: 'Dopis z Vlčího Údělu zněl vlídně a nic nežádal. {emp.lord} ho přečetl{X:|a} s úsměvem a hrady zůstaly v {X:jeho|jejích} rukou.',
      },
      {
        label: 'Žádat {X:jeho|její} děti na vychování ke dvoru', hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.5, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { prestige: 2 }, empire: { ambition: -12 }, chronicle: 'Děti místního správce odjely do Vlčího Údělu jako čestní hosté. Kdo má rodinu u dvora, loajalitu nezapomíná.' },
        onFailure: { effects: { prestige: -1 }, realm: { focus: { attitude: -8 } }, empire: { ambition: 6 }, chronicle: 'Žádost o děti byla přijata jako urážka. {emp.lord} ji vrátil{X:|a} s dopisem, který nebylo možné číst nahlas.' },
      },
    ],
  },

  {
    id: 'risa_pretendent',
    scenario: PAN, cooldown: 24, weight: 4,
    target: (s) => tgt(pickHeld(s, 'low', (r, rc) => rc.pretender === 0)),
    image: img('pretendent'),
    title: 'Dědic poražené dynastie',
    text: 'Z {emp.gen} přišla zpráva, kterou nikdo u dvora nechtěl slyšet. Po vsích pod horami chodí {pretender.name}, {Z:syn|dcera} posledního panovníka, který tam vládl před tebou, a tvrdí, že koruna té země náleží {Z:jemu|jí}. Staří páni {Z:mu|jí} tajně posílají koně a zlato, venkované {Z:ho|ji} skrývají ve stodolách. Dokud žije, bude mít každé povstání jméno i tvář.',
    choices: [
      {
        label: 'Poslat jezdce, ať {Z:ho|ji} zajmou a odvezou do věže', hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.45, traitKey: 'intelligence', traitScale: 0.05, chanceBonus: spyLoyal, bonusLabel: 'Věrný špehmistr',
        onSuccess: { effects: { prestige: 3 }, realm: { focus: { attitude: -4 } }, empire: { pretender: 2 }, chronicle: '{pretender.name} byl{Z:|a} zajat{Z:|a} v horském hostinci a odvezen{Z:|a} do věže. Venkované mlčí a nenávidí.' },
        onFailure: { effects: { army: -3 }, realm: { focus: { attitude: -8 } }, empire: { pretender: 1 }, chronicle: 'Jezdci přijeli pozdě: v hostinci našli jen vychladlou postel. {pretender.name} zmizel{Z:|a} v horách a legenda o {Z:něm|ní} roste.' },
      },
      {
        label: 'Pozvat {Z:ho|ji} ke dvoru a dát {Z:mu|jí} léno', hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.4, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { gold: -6, prestige: 2 }, realm: { focus: { attitude: 10 } }, empire: { pretender: 3 }, chronicle: '{pretender.name} přijal{Z:|a} léno a poklekl{Z:|a} před trůnem. Staří páni ztratili jméno, za které by se bouřili.' },
        onFailure: { effects: { prestige: -1 }, realm: { focus: { attitude: -6 } }, empire: { pretender: 1 }, chronicle: '{pretender.name} pozvání odmítl{Z:|a} s tím, že hostem se bývá jen v cizím domě. Křivdu si pamatují oba.' },
      },
      {
        label: 'Tiše {Z:ho|ji} nechat zmizet', hintType: 'resource', hintKey: 'faith',
        effects: { faith: -4, legitimacy: -3 }, realm: { focus: { attitude: -4 } }, empire: { pretender: 4 }, hiddenEffects: { setFlag: 'risa_pretendent_krev' },
        chronicle: 'Jednoho rána byl{Z:|a} {pretender.name} nalezen{Z:|a} mrtv{Z:ý|á} v hostinci. Nikdo nic neviděl a všichni vědí.',
      },
      {
        label: 'Nechat věc být, jsou to jen řeči', hintType: 'trait', hintKey: 'patience',
        effects: {}, realm: { focus: { attitude: -2 } }, empire: { pretender: 1 },
        chronicle: '{ruler.name} nad zprávou jen pokrčil{R:|a} rameny. {emp.Loc} se ale řeči nezastavily.',
      },
    ],
  },

  {
    id: 'risa_neduh',
    scenario: PAN, cooldown: 20, weight: 4,
    requires: some,
    target: (s) => tgt(pickHeld(s, 'year')),
    image: img('mor_v_pristavu'),
    title: 'Neštěstí v dalekém kraji',
    text: 'Zprávy z {emp.gen} jsou zlé. {emp.woe} {emp.LordTitle} {emp.lord} prosí o pomoc a poslové dodávají, že kdo pomůže, toho si tamní lidé budou pamatovat. A kdo nepomůže, také.',
    choices: [
      {
        label: 'Poslat obilí a ranhojiče z hlavního města', requires: (s) => s.resources.food >= 15 && s.resources.gold >= 6, hintType: 'resource', hintKey: 'food',
        effects: { food: -12, gold: -6, faith: 2 }, realm: { focus: { attitude: 14 } },
        chronicle: 'Z Vlčího Údělu vyrazily vozy s obilím a ranhojiči. {emp.Loc} se o koruně mluví jinak než loni.',
      },
      {
        label: 'Prominout tamní dávky, dokud neštěstí neodezní', hintType: 'resource', hintKey: 'gold',
        effects: { gold: -8 }, realm: { focus: { attitude: 10 } },
        chronicle: 'Výběrčí se z {emp.gen} vrátili s prázdnýma rukama a s rozkazem nic nežádat. Kdo vydržel, ten si to zapamatuje.',
      },
      {
        label: 'Zavřít hranice, aby se neštěstí nedostalo domů', hintType: 'trait', hintKey: 'patience',
        effects: { stability: 2, prestige: -2 }, realm: { focus: { attitude: -10, power: 4 } },
        chronicle: 'Na hranicích {emp.gen} stanuly stráže. Doma se nic nešířilo — a za strážemi nikdo nezapomněl, kdo je tam postavil.',
      },
      {
        label: 'Svolat učence a rozdělit zásoby podle jejich rad', hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.5, traitKey: 'intelligence', traitScale: 0.05,
        onSuccess: { effects: { prestige: 3, faith: 2 }, realm: { focus: { attitude: 10 } }, chronicle: 'Učenci rozdělili zásoby a odděleně ošetřovali nemocné. Neštěstí odeznělo dřív, než se čekalo.' },
        onFailure: { effects: { stability: -3, gold: -8 }, realm: { focus: { attitude: 2 } }, chronicle: 'Učenci se přeli o léčbu a zásoby se rozdělily špatně. Pomoc přišla pozdě a stála víc, než se slibovalo.' },
      },
    ],
  },

  {
    id: 'risa_karavany',
    scenario: PAN, cooldown: 12, weight: 4, seasons: [1, 2, 3],
    requires: some,
    target: (s) => tgt(pickHeld(s, 'year')),
    image: img('f_karavana'),
    title: 'Karavany z dobytých zemí',
    text: 'Po cestách z {emp.gen} se do Vlčího Údělu valí dlouhý průvod vozů. Vezou daně — pytle, sudy, kůže a stříbro — a s nimi {emp.lordTitle} {emp.lord}, {X:který|která} chce vidět, jak se zlato {X:jeho|její} země promění v lesk hlavního města. Cesta byla dlouhá a lupičů v horách je dost.',
    choices: [
      {
        label: 'Všechno do pokladny', hintType: 'resource', hintKey: 'gold',
        effects: { gold: 14 }, realm: { focus: { attitude: -3 } },
        chronicle: 'Vozy z {emp.gen} se vyprázdnily v královské pokladně. {emp.LordTitle} {emp.lord} odjel{X:|a} s poděkováním a bez odměny.',
      },
      {
        label: 'Vrátit část zemi na opravu cest a mostů', hintType: 'resource', hintKey: 'prestige',
        effects: { gold: 6, prestige: 1 }, realm: { focus: { attitude: 9 } },
        chronicle: 'Třetina daní se vrátila do {emp.gen} na cesty a mosty. Tamní lidé to nečekali a nezapomenou.',
      },
      {
        label: 'Rozdělit část chudině a nechat sloužit mši', hintType: 'resource', hintKey: 'faith',
        effects: { gold: 7, faith: 3, stability: 2 }, realm: { focus: { attitude: -1 } },
        chronicle: 'Z daní z {emp.gen} dostala chudina chléb a kostely mši. V hlavním městě se zpívalo o štědré koruně.',
      },
      {
        label: 'Poslat naproti vojáky, ať vozy ochrání', hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.55, traitKey: 'strength', traitScale: 0.03, resourceKey: 'army', resourceScale: 0.0035, noInjury: true,
        onSuccess: { effects: { gold: 14, prestige: 2 }, chronicle: 'Vojáci vyrazili vozům vstříc a lupiči se do průsmyku ani nevydali. Karavany dorazily do posledního sudu.' },
        onFailure: { effects: { gold: 4, army: -4 }, realm: { focus: { attitude: -5 } }, chronicle: 'V průsmyku vozy přepadla tlupa lapků. Vojáci zachránili, co šlo, a tamní lidé zaplatili za ztracené zboží podruhé.' },
      },
    ],
  },

  {
    id: 'risa_mistokral',
    scenario: PAN, cooldown: 36, seasons: [0, 1],
    weight: (s) => (s.ambition && s.ambition.key === 'risa_dedic' ? 18 : 3),
    requires: (s) => some(s) && !!s.heir && s.heir.alive !== false && !s.heir.none && s.heir.age >= 13 && !heldKeys(s).some((k) => realmRec(s, k).viceroy),
    target: (s) => tgt(pickHeld(s, 'low', (r, rc) => !rc.viceroy)),
    image: img('vychova_dedice'),
    title: 'Místokrál z rodu',
    text: 'Z {emp.gen} přišla prosba, jaká se nepíše často: tamní páni chtějí mít v zemi někoho z rodu, komu se dá přísahat. {heir.name}, {D:tvůj dědic|tvá dědička}, je už dost {D:starý|stará} a lidé {emp.loc} by uvítali místokrále s tvým jménem a tvou krví. Znamenalo by to ale odloučení na několik let — a nikdo neví, jaké přátele si {D:dědic|dědička} v cizí zemi najde.',
    choices: [
      {
        label: 'Poslat {D:dědice|dědičku} jako místokrále', hintType: 'trait', hintKey: 'eloquence',
        effects: { gold: -6, prestige: 2 }, realm: { focus: { attitude: 14 } }, empire: { viceroy: true, ambition: -8 }, heirTraits: { eloquence: 1 },
        chronicle: 'S družinou a s pečetí rodu odjel{D:|a} {heir.name} do {emp.gen}. Země má místokrále z rodu a poprvé za dlouho se tam přísahá s chutí.',
      },
      {
        label: 'Nejdřív se musí vládnout naučit doma', hintType: 'trait', hintKey: 'intelligence',
        effects: { stability: 2 }, realm: { focus: { attitude: -3 } }, heirTraits: { intelligence: 1 },
        chronicle: '{heir.name} zůstal{D:|a} u dvora a každý den sedí u rady. Z {emp.gen} dorazila zdvořilá, ale chladná odpověď.',
      },
      {
        label: 'Poslat spíš zkušeného kancléře', hintType: 'resource', hintKey: 'gold',
        effects: { gold: -3 }, realm: { focus: { attitude: 6 } }, courtEffects: { chancellor: { loyalty: 4 } },
        chronicle: 'Do {emp.gen} odjel{Q:|a} {chancellor.title} {chancellor.name} s plnou mocí. Není to krev rodu, ale zná zákony a nikoho nepohoršuje.',
      },
    ],
  },

  {
    id: 'risa_vyroci',
    scenario: PAN, cooldown: 24, weight: 4, seasons: [0, 1],
    requires: (s) => both(s) && empireYears(s) >= 3,
    image: img('vyroci_vlady'),
    title: 'Výročí korunovace',
    text: 'Je tomu {empire.yearsLabel}, co se rod {dynastyName} nechal korunovat třemi korunami. Hlavní město se chystá na slavnost a poslové z {empire.realmsGen} už jedou s dary i s prosbami. Dá se slavit hlučně, zbožně, nebo se dá sáhnout po milosti — a každé z toho si lidé v dalekých zemích zapamatují jinak.',
    choices: [
      {
        label: 'Velká hostina pro vládce všech zemí', requires: gold(14), hintType: 'resource', hintKey: 'prestige',
        effects: { gold: -14, prestige: 5, stability: 2 }, realm: { held: { attitude: 6 } },
        chronicle: 'Hostina trvala tři dny. U jednoho stolu seděli markrabata, náčelníci i velmoži a poprvé se nehádali.',
      },
      {
        label: 'Děkovná mše a průvod ke třem oltářům', hintType: 'resource', hintKey: 'faith',
        effects: { faith: 5, legitimacy: 3, gold: -4 },
        chronicle: 'Průvod prošel hlavním městem ke třem oltářům a biskup požehnal koruny. Lid klečel a zpíval.',
      },
      {
        label: 'Vyhlásit milost a propustit vězně', hintType: 'trait', hintKey: 'patience',
        effects: { legitimacy: 2, stability: -1 }, realm: { held: { attitude: 8 } }, empire: { pardon: true },
        chronicle: 'U příležitosti výročí byla vyhlášena milost. Věznice se otevřely a z dobytých zemí přišly dopisy plné díků.',
      },
      {
        label: 'Přehlídka vojska všech tří zemí', hintType: 'trait', hintKey: 'strength',
        effects: { prestige: 5, gold: -6 }, realm: { held: { attitude: -3, power: 3 } },
        chronicle: 'Vojska všech tří zemí prošla městem v jednom šiku. Vyslanci počítali kopí a psali domů.',
      },
    ],
  },

  {
    id: 'risa_jih',
    scenario: PAN, oneTime: true, cooldown: 99, weight: 5,
    requires: (s) => s.ruler.statusTier >= 6,
    image: img('v_jizni_vyslanec'),
    title: 'Poselstvo z Jižní říše',
    text: 'Do přístavu zakotvila galéra s purpurovou plachtou. Vyslanci Jižní říše přivezli dary a list psaný zlatým inkoustem: {realm.south} blahopřeje k císařské koruně a mezi řádky dává najevo, že na světě je místo jen pro jednoho císaře — a ten sídlí v Purpurovém městě. Vyslanci se tiše ptají, jak daleko míníš s dobýváním pokračovat.',
    choices: [
      {
        label: 'Přijmout dary a uznat se vzájemně za rovné', hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.45, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { prestige: 6 }, realm: { south: { attitude: 15 } }, hiddenEffects: { setFlag: 'risa_jih_pritel' }, chronicle: 'Vyslanci odjeli s odpovědí, kterou by si dvůr v Purpurovém městě vlastně nikdy nedovolil napsat sám: dva císaři, dva trůny, jeden svět. Dary byly přijaty.' },
        onFailure: { effects: { prestige: -2 }, realm: { south: { attitude: -8 } }, chronicle: 'Vyslanci vycítili váhání a odjeli dřív, než přišla odpověď. V Purpurovém městě se o novém císaři bude mluvit s úsměvem.' },
      },
      {
        label: 'Odmítnout dary: císař může být jen jeden', hintType: 'trait', hintKey: 'strength',
        effects: { prestige: 6 }, realm: { south: { attitude: -20 } }, hiddenEffects: { setFlag: 'risa_jih_nepritel' },
        chronicle: 'Dary zůstaly nerozbalené v přístavu a vyslanci odjeli za tmy. Jižní zlato teď půjde jinam — a jistě najde, kde se hodí.',
      },
      {
        label: 'Poslat vlastní dary a slíbit, že na jih nepůjdeš', hintType: 'trait', hintKey: 'patience',
        effects: { gold: -10, legitimacy: 2 }, realm: { south: { attitude: 10 } }, hiddenEffects: { setFlag: 'risa_jih_pritel' },
        chronicle: 'Do Purpurového města odplula loď s dary a se slibem, že hranice na jihu zůstane, kde je. Dvůr to nazval moudrostí, vojáci slabostí.',
      },
      {
        label: 'Vyslechnout vyslance a nic neslíbit', hintType: 'trait', hintKey: 'intelligence',
        effects: { prestige: 1 }, realm: { south: { attitude: 3 } },
        chronicle: 'Vyslanci byli pohoštěni, vyslechnuti a posláni zpět s úsměvem a bez odpovědi. Obě strany vědí, že tím nic nekončí.',
      },
    ],
  },

  {
    id: 'risa_spiknuti',
    scenario: PAN, cooldown: 20,
    weight: (s) => 2 + heldKeys(s).reduce((m, k) => Math.max(m, trouble(s, k)), 0) / 4,
    requires: (s) => some(s) && heldKeys(s).some((k) => plotting(s, k)),
    target: (s) => tgt(heldKeys(s).filter((k) => plotting(s, k)).sort((a, b) => trouble(s, b) - trouble(s, a))[0]),
    image: img('n_spiklenci_zvou'),
    title: 'Spiknutí dobytých pánů',
    text: '{spymaster.Title} {spymaster.name} {Y:položil|položila} na stůl dopis zachycený na cestě z {emp.gen}. Tamní páni se tajně scházejí v jednom z hradů a na meč přísahají, že vyženou z hradů tvé hejtmany. {emp.mood} {emp.plot} Čas hraje proti tobě.',
    choices: [
      {
        label: 'Dát spiklence předem zatknout', hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.45, traitKey: 'intelligence', traitScale: 0.05, chanceBonus: spyLoyal, bonusLabel: 'Věrný špehmistr',
        onSuccess: { effects: { prestige: 3 }, realm: { focus: { attitude: -2, power: 6 } }, empire: { ambition: -15 }, chronicle: 'Jezdci zatkli spiklence v noci před schůzkou. Dopisy shořely, přísahy zůstaly nevyřčeny a {emp.loc} je ticho.' },
        onFailure: { effects: { army: -6, stability: -3 }, realm: { focus: { attitude: -14 } }, empire: { ambition: 10 }, chronicle: 'Jezdci přijeli do prázdného hradu. Spiklenci se rozutekli a cestou rozšířili zprávu, že koruna je slabá a špehuje.' },
      },
      {
        label: 'Koupit si vůdce zlatem a slibem úřadu', requires: gold(16), hintType: 'resource', hintKey: 'gold',
        effects: { gold: -16 }, realm: { focus: { attitude: 4 } }, empire: { ambition: -12 },
        chronicle: 'Vůdce spiklenců přijal zlato a úřad u dvora. Ostatní se rozešli a každý v duchu počítá, kolik by dostal on.',
      },
      {
        label: 'Předvolat pány před sněm a postavit je před volbu', hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.4, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { prestige: 4 }, realm: { focus: { attitude: 8 } }, empire: { ambition: -8 }, chronicle: 'Před sněmem pánové z {emp.gen} poklekli a přísahu obnovili. Kdo se vzbouřit chtěl, ten se přestal bát hlasitě.' },
        onFailure: { effects: { prestige: -3 }, realm: { focus: { attitude: -10 } }, empire: { ambition: 8 }, chronicle: 'Pánové z {emp.gen} na sněm nepřijeli. Poslové se vrátili s hrubou odpovědí a s varováním, že příště půjdou ozbrojeni.' },
      },
      {
        label: 'Vyslat vojsko a zlomit hrady', requires: (s) => s.resources.army >= 25, hintType: 'resource', hintKey: 'army',
        effects: { army: -8, prestige: 2 }, realm: { focus: { attitude: -12, power: 16 } }, empire: { ambition: -20 },
        chronicle: 'Vojsko prošlo hrady {emp.gen} a zlomilo je jedno po druhém. Kdo se nevzdal, visí; kdo se vzdal, platí dvojnásobné daně.',
      },
    ],
  },

  {
    id: 'risa_viry',
    scenario: PAN, cooldown: 24, weight: 4,
    requires: some,
    target: (s) => tgt(pickHeld(s, 'year')),
    image: img('kacirska_sekta'),
    title: 'Spor o víru',
    text: 'Biskup z hlavního města přinesl na dvůr stížnost: {emp.loc} stále stojí svatyně, kde se lidé modlí po starém způsobu, a faráře z Vlčího Údělu si tamní obyvatelé skoro nevšímají. {emp.LordTitle} {emp.lord} k tomu řekl{X:|a}, že víru rozkazem změnit nelze — a že kdo to zkusí, najde pod každým kamenem sekeru.',
    choices: [
      {
        label: 'Podpořit biskupa a postavit tam kostely', hintType: 'resource', hintKey: 'faith',
        effects: { faith: 6, gold: -6 }, realm: { focus: { attitude: -10, power: 4 } }, empire: { ambition: 4 },
        chronicle: 'Do {emp.gen} odjeli stavitelé a faráři z hlavního města. Kostely rostou rychle a lidé se do nich přesto nehrnou.',
      },
      {
        label: 'Dovolit obě víry vedle sebe', hintType: 'trait', hintKey: 'patience',
        effects: { faith: -4, legitimacy: 1 }, realm: { focus: { attitude: 6 } },
        chronicle: 'Výnos dovolil starou i novou víru. Biskup odjel uražen, ale {emp.loc} se zase modlí a nebouří.',
      },
      {
        label: 'Svolat duchovní obou stran k jednomu stolu', hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.45, traitKey: 'intelligence', traitScale: 0.05,
        onSuccess: { effects: { faith: 3, prestige: 3 }, realm: { focus: { attitude: 8 } }, chronicle: 'Duchovní obou stran seděli tři dny u jednoho stolu a rozešli se se společným prohlášením. Žádná strana nevyhrála, žádná neprohrála.' },
        onFailure: { effects: { faith: -5, stability: -3 }, realm: { focus: { attitude: -8 } }, chronicle: 'Jednání skončilo hádkou a vyhazovem. Obě strany se rozešly s přesvědčením, že koruna drží s druhou.' },
      },
      {
        label: 'Nechat spor vyhnít', hintType: 'trait', hintKey: 'patience',
        effects: {}, realm: { focus: { attitude: -2 } },
        chronicle: '{ruler.name} se k sporu o víru nevyjádřil{R:|a}. Biskup i {emp.lordTitle} {emp.lord} teď každý po svém věří, že koruna je na jeho straně.',
      },
    ],
  },

  // ---------- the empire at its peak, and its fall ----------
  {
    id: 'risa_vrchol',
    scenario: PAN, forced: true,
    dropIf: (s) => !both(s),
    image: img('kapitola_cisar'),
    title: 'Říše na vrcholu',
    text: 'Osm let nevzplanulo v říši jediné povstání. Daně z {empire.realmsGen} chodí včas, markrabata, náčelníci i velmoži z Vlčího Údělu sedí na sněmu u jednoho stolu a kronikáři už mluví o době, kdy se tři země staly jednou. Je to vrchol, na kterém by se dalo s ctí skončit — nebo dál držet to, co bylo tak těžké sjednotit.',
    choices: [
      {
        label: 'Uzavřít kroniku na vrcholu říše', hintType: 'trait', hintKey: 'patience',
        hiddenEffects: { setFlag: 'risa_vrchol' }, endGame: 'empire_peak',
        chronicle: 'Kronika rodu {dynastyName} končí na vrcholu říše.',
      },
      {
        label: 'Vládnout dál a zajistit dědictví', hintType: 'trait', hintKey: 'intelligence',
        effects: { prestige: 6, stability: 3 }, hiddenEffects: { setFlag: 'risa_vrchol' },
        chronicle: '{ruler.name} se nespokojil{R:|a} s chválou kronikářů. Říše je jen tak silná, jak silné je to, co po {R:něm|ní} zůstane.',
      },
      {
        label: 'Vydat říšský zákoník pro všechny země', requires: gold(10), hintType: 'trait', hintKey: 'intelligence',
        effects: { gold: -10, legitimacy: 5, prestige: 3 }, realm: { held: { attitude: 5 } }, hiddenEffects: { setFlag: 'risa_vrchol' },
        chronicle: 'Zákoník říše byl přečten ve všech třech jazycích. Kdo ho nepochopil, tomu ho vysvětlili písaři — a kdo ho pochopil, ten si ho pamatuje.',
      },
    ],
  },
  {
    id: 'risa_rozpad',
    scenario: PAN, forced: true,
    dropIf: (s) => !(s.empire && s.empire.lost),
    markSeen: (s) => { if (s.empire) delete s.empire.lost; }, // the loss has been told
    image: img('vzpoura_v_provincii'),
    title: 'Rozpad říše',
    text: 'Posel dojel s rozbitým štítem a zlou zprávou: {lost.name} povstaly. Hrady padaly jeden po druhém, hejtmani z Vlčího Údělu utekli nebo skončili na šibenicích a v tamních kostelích se zvoní na počest nového vládce. Dvůr čeká, co uděláš — a v Jižní říši se budou usmívat.',
    choices: [
      {
        label: 'Shromáždit vojsko a vzít zemi zpět', hintType: 'trait', hintKey: 'strength',
        effects: { prestige: 2 }, ambition: 'cisarstvi',
        chronicle: '{ruler.name} {R:slíbil|slíbila}, že ztracená země bude zase patřit koruně. Kovárny pracují celou noc.',
      },
      {
        label: 'Smířit se se ztrátou a upevnit, co zbylo', hintType: 'trait', hintKey: 'patience',
        effects: { stability: 5, legitimacy: -3 }, realm: { held: { attitude: 6 } },
        chronicle: 'Dvůr přijal ztrátu mlčky. Co zbylo, se nyní hlídá dvojnásob pečlivě.',
      },
      {
        label: 'Zavřít kroniku: říše zanikla, jak vznikla', requires: (s) => heldKeys(s).length === 0, hintType: 'trait', hintKey: 'patience',
        endGame: 'empire_fall',
        chronicle: 'Kronika rodu {dynastyName} končí pádem říše.',
      },
    ],
  },
];
