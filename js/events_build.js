// Events about the towns and the farm the player builds (see build.js).
// Each one picks a settlement as its target ('town:<id>'), so the text can say
// {town.name} / {town.loc} / {town.Loc} and provinceEffects 'target' hit the
// settlement's province. Branch extra `town` (applyTownEffects in build.js):
//   destroy: 'random' | <key>, start: <key>, hurry: n, levelUp: true

import { ownTowns, hasBuilding, readyBuildings, workingBuildings, currentProject, isFarm } from './build.js';

const REALM = ['panovnik', 'slechtic'];
const img = (id) => `assets/events/${id}.jpg`;
const BORDER = ['sokoli-hvozd', 'zelezny-hreben', 'pobrezni-mark'];
const PROVINCE_OF = {
  capital: 'capital', brod: 'brodna', port: 'pobrezni-mark', abbey: 'pobrezni-mark', mine: 'zelezny-hreben',
  lodge: 'sokoli-hvozd', lipnice: 'brodna', dubovice: 'capital', zareci: 'capital',
};

/** A random own settlement (not the farm) that passes a test, as an event target. */
function townTarget(s, test) {
  const list = ownTowns(s, (id, town) => !isFarm(id) && test(id, town));
  return list.length ? `town:${list[Math.floor(Math.random() * list.length)]}` : null;
}

const ctxTown = (s) => s.eventContext && s.eventContext.town;
const here = (key, builtOnly = false) => (s) => hasBuilding(s, ctxTown(s), key, builtOnly);
const farm = (s) => (s.towns && s.towns.grunt ? s.towns.grunt : null);
const farmBuilt = (s) => (farm(s) ? workingBuildings(farm(s)).length : 0);
const gold = (n) => (s) => s.resources.gold >= n;

export const BUILD_EVENTS = [
  // ---------- the realm ----------
  {
    id: 't_pozar',
    scenarios: REALM, cooldown: 24, weight: 0.6, minTurn: 6,
    image: img('pozar_mesta'),
    target: (s) => townTarget(s, (id, t) => readyBuildings(t).length >= 3),
    title: 'Oheň nad střechami',
    text: '{town.Loc} hoří. Oheň vyskočil z pekárny u cesty a vítr ho žene přes doškové střechy. Lidé běhají s vědry, ale plameny jsou rychlejší než oni.',
    choices: [
      {
        label: 'Poslat vojáky hasit',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.55, resourceKey: 'army', resourceScale: 0.5,
        onSuccess: { effects: { army: -1, prestige: 2 }, provinceEffects: { target: { loyalty: 4 } }, chronicle: 'Vojáci {town.loc} vytvořili řetěz s vědry a oheň udusili dřív, než přeskočil na další střechy. Lidé jim ještě týden nosili pivo.' },
        onFailure: { effects: { army: -2 }, town: { destroy: 'random' }, provinceEffects: { target: { wealth: -3 } }, chronicle: 'Vojáci přišli pozdě. Než oheň uhasili, lehla popelem jedna z velkých staveb {town.loc}.' },
      },
      {
        label: 'Strhnout domy v cestě ohni',
        hintType: 'trait', hintKey: 'strength',
        traitGain: 'strength',
        provinceEffects: { target: { wealth: -4, unrest: 4 } },
        chronicle: 'Na rozkaz vládce strhli háky celou řadu chalup, aby oheň neměl kudy jít. Velké stavby {town.loc} zůstaly stát, ale chudí přišli o střechu nad hlavou.',
      },
      {
        label: 'Svolat lid k modlitbě o déšť',
        hintType: 'resource', hintKey: 'faith',
        isRoll: true, baseChance: 0.3, resourceKey: 'faith', resourceScale: 0.3,
        chanceBonus: (s) => (hasBuilding(s, ctxTown(s), 'kostel') ? 0.2 : 0),
        onSuccess: { effects: { faith: 4 }, chronicle: 'Zvony {town.loc} zvonily a k večeru se spustil liják. O zázraku se mluví dodnes.' },
        onFailure: { effects: { faith: -2 }, town: { destroy: 'random' }, provinceEffects: { target: { unrest: 6 } }, chronicle: 'Nebe zůstalo jasné. Zatímco lidé klečeli, oheň spolkl jednu ze staveb {town.loc}.' },
      },
    ],
  },

  {
    id: 't_nakaza',
    scenarios: REALM, cooldown: 24, weight: 0.6, minTurn: 8,
    image: img('mor_v_pristavu'),
    target: (s) => townTarget(s, (id, t) => t.level >= 2),
    title: 'Horečka v ulicích',
    text: '{town.Loc} se lidé začali probouzet s horečkou a skvrnami na krku. Lazebníci krčí rameny a kněží zvoní umíráčkem čím dál častěji.',
    choices: [
      {
        label: 'Otevřít špitál nemocným',
        requires: here('spital'),
        hintType: 'resource', hintKey: 'faith',
        effects: { gold: -3, faith: 2 },
        provinceEffects: { target: { loyalty: 6 } },
        chronicle: 'Špitál {town.loc} přijal každého, kdo zaklepal. Nemoc přešla rychleji, než se čekalo, a kraj si to zapamatoval.',
      },
      {
        label: 'Zavřít cesty a nikoho nepouštět',
        hintType: 'trait', hintKey: 'patience',
        effects: { stability: -1 },
        provinceEffects: { target: { wealth: -5, unrest: 4 } },
        chronicle: 'Cesty {town.loc} hlídaly šest neděl stráže a nikdo nesměl dovnitř ani ven. Nemoc nepřešla dál, ale obchod umřel spolu s nemocnými.',
      },
      {
        label: 'Nechat to na lazebnících',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.45, traitKey: 'intelligence', traitScale: 0.02,
        onSuccess: { chronicle: 'Horečka {town.loc} sama od sebe ustoupila. Lazebníci si to připsali k dobru.' },
        onFailure: { effects: { army: -3 }, provinceEffects: { target: { unrest: 10, loyalty: -6 } }, chronicle: 'Nákaza se {town.loc} nezastavila a rozlezla se po celém kraji. Hřbitovy nestačily a lidé se ptali, kde byla vrchnost.' },
      },
    ],
  },

  {
    id: 't_cech_vysady',
    scenarios: REALM, cooldown: 28, weight: 0.8,
    image: img('stavka_cechu'),
    target: (s) => townTarget(s, (id) => hasBuilding(s, id, 'cech', true)),
    title: 'Cech žádá výsady',
    text: 'Cechmistři {town.loc} přišli v nejlepších šatech a s pečetí na listině. Chtějí, aby nikdo mimo cech nesměl ve městě prodávat sukno — a aby jim to vládce potvrdil navždy.',
    choices: [
      {
        label: 'Udělit cechu výsady',
        hintType: 'trait', hintKey: 'eloquence',
        effects: { gold: -5, prestige: 2 },
        provinceEffects: { target: { wealth: 6, loyalty: 4 } },
        chronicle: 'Cech {town.loc} dostal výsady s vládcovou pečetí. Řemeslníci pijí na jeho zdraví, venkovští tkalci proklínají jeho jméno.',
      },
      {
        label: 'Odmítnout — trh má být svobodný',
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.45, traitKey: 'strength', traitScale: 0.04,
        onSuccess: { effects: { stability: 2 }, chronicle: 'Cechmistři odešli s nepořízenou a po čase se smířili. Trh {town.loc} zůstal otevřený všem.' },
        onFailure: { town: { destroy: 'cech' }, provinceEffects: { target: { unrest: 6 } }, chronicle: 'Uražení mistři {town.loc} cech rozpustili a odešli i s tovaryši do ciziny. Cechovní dům zeje prázdnotou.' },
      },
      {
        label: 'Výsady prodat za zlato',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 10 },
        provinceEffects: { target: { unrest: 5 } },
        chronicle: 'Cech {town.loc} si výsady koupil. Pokladna se plní, ale v ulicích se šeptá, že vládce prodá cokoli.',
      },
    ],
  },

  {
    id: 't_stavitel',
    scenarios: REALM, cooldown: 20, minTurn: 4,
    image: img('n_kamenny_hrad'),
    target: (s) => townTarget(s, (id, t) => { const p = currentProject(t); return p && p.done - s.turn >= 2; }),
    title: 'Mistr stavitel',
    text: 'Na staveniště {town.loc} přišel cizí mistr s olovnicí za pasem. Prohlédl lešení, plivl a řekl, že tohle by se svými lidmi postavil za polovinu času. Za odpovídající cenu, pochopitelně.',
    choices: [
      {
        label: 'Najmout ho na tuhle stavbu',
        requires: gold(6),
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -6 },
        town: { hurry: 2 },
        chronicle: 'Cizí mistr převzal stavbu {town.loc} a zedníci se pod ním naučili pracovat dvakrát rychleji.',
      },
      {
        label: 'Nabídnout mu stálou službu',
        requires: (s) => s.resources.gold >= 15 && !s.flags.mistr_stavitel,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -15, prestige: 2 },
        hiddenEffects: { setFlag: 'mistr_stavitel' },
        chronicle: 'Cizí mistr stavitel zůstal v zemi natrvalo. Vycvičil novou stavební huť a od té doby se staví o jedno místo víc najednou.',
      },
      {
        label: 'Poslat ho dál',
        hintType: 'trait', hintKey: 'patience',
        chronicle: 'Cizí mistr odešel dál po cestě. Domácí zedníci {town.loc} si oddechli a pracují svým tempem.',
      },
    ],
  },

  {
    id: 't_zold',
    scenarios: REALM, cooldown: 24, weight: 0.6,
    image: img('zold'),
    target: (s) => townTarget(s, (id) => hasBuilding(s, id, 'kasarna', true)),
    title: 'Kasárna bez žoldu',
    text: 'Posádka kasáren {town.loc} dva měsíce neviděla ani groš. Vojáci sedí na nádvoří, místo cvičení hrají v kostky o vlastní zbraně a velitel posílá posla, že dlouho je už neudrží.',
    choices: [
      {
        label: 'Vyplatit žold',
        requires: gold(8),
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -8, army: 1 },
        chronicle: 'Posádka {town.loc} dostala žold v zapečetěných truhlách. Vojáci znovu cvičí a o vládci se v kasárnách mluví dobře.',
      },
      {
        label: 'Slíbit žold po žních',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.45, traitKey: 'eloquence', traitScale: 0.04,
        onSuccess: { effects: { stability: 1 }, chronicle: 'Vládcovo slovo vojákům {town.loc} stačilo. Vydrželi až do žní.' },
        onFailure: { effects: { army: -4 }, provinceEffects: { target: { unrest: 6 } }, chronicle: 'Slibům nikdo nevěřil. Polovina posádky {town.loc} se jedné noci vytratila i se zbraněmi.' },
      },
      {
        label: 'Rozpustit posádku',
        hintType: 'trait', hintKey: 'strength',
        effects: { army: -3, gold: 4 },
        town: { destroy: 'kasarna' },
        chronicle: 'Kasárna {town.loc} byla vyklizena a prodána na sklady. Vojáci se rozešli domů, někteří i se zbraněmi.',
      },
    ],
  },

  {
    id: 't_najezd',
    scenarios: REALM, cooldown: 24, weight: 0.6, minTurn: 8, music: 'battle',
    image: img('pohranicni_najezd'),
    target: (s) => townTarget(s, (id, t) => BORDER.includes(PROVINCE_OF[id]) && readyBuildings(t).length >= 2),
    title: 'Lupiči před branou',
    text: 'Za úsvitu se z lesa vynořila tlupa lupičů na koních. Míří k branám, protože {town.loc} je co brát: plné sklady, kostelní stříbro a všechno, co se dá odvézt nebo zapálit.',
    choices: [
      {
        label: 'Zavřít brány a bránit hradby',
        requires: here('hradby'),
        hintType: 'resource', hintKey: 'army',
        effects: { prestige: 3 },
        provinceEffects: { target: { loyalty: 4 } },
        chronicle: 'Brány {town.loc} se zavřely a lupiči se rozbili o hradby jako vlna o skálu. Kdo hradby postavil, dobře udělal.',
      },
      {
        label: 'Vyjet proti nim',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.45, resourceKey: 'army', resourceScale: 0.5,
        onSuccess: { effects: { prestige: 3, army: -1 }, music: 'battle', chronicle: 'Jezdci rozprášili lupiče dřív, než {town.loc} stačili cokoli zapálit.' },
        onFailure: { effects: { army: -4 }, town: { destroy: 'random' }, music: 'battle', chronicle: 'Lupiči byli silnější. {town.Loc} plenili do večera a jednu ze staveb nechali v plamenech.' },
      },
      {
        label: 'Vyplatit je',
        requires: gold(8),
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -8 },
        provinceEffects: { target: { unrest: 3 } },
        chronicle: 'Lupiči dostali měšec a odjeli. Nikdo nepochybuje, že se vrátí.',
      },
    ],
  },

  {
    id: 't_mestska_prava',
    scenarios: REALM, cooldown: 24, weight: 1, minTurn: 6,
    image: img('n_trzni_pravo'),
    target: (s) => townTarget(s, (id, t) => t.level >= 2 && t.level <= 3 && !currentProject(t) && readyBuildings(t).length >= t.level + 1),
    title: 'Obyvatelé chtějí víc',
    text: 'Konšelé {town.loc} přinesli prosbu: sídlo vyrostlo, lidí přibylo a chtějí práva, jaká mají větší místa — vlastní trh, soud a pečeť. Jsou ochotni za ně leccos nabídnout.',
    choices: [
      {
        label: 'Udělit práva jako dar',
        hintType: 'trait', hintKey: 'eloquence',
        effects: { prestige: 2 },
        town: { levelUp: true },
        provinceEffects: { target: { loyalty: 5 } },
        chronicle: 'Nová práva {town.loc} byla udělena jako dar. Na náměstí se slavilo do rána.',
      },
      {
        label: 'Práva prodat za zlato',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 10 },
        town: { levelUp: true },
        provinceEffects: { target: { loyalty: -3 } },
        chronicle: 'Práva {town.loc} byla prodána za tučný měšec. Konšelé platili se zaťatými zuby.',
      },
      {
        label: 'Odmítnout',
        hintType: 'trait', hintKey: 'strength',
        provinceEffects: { target: { unrest: 6, loyalty: -4 } },
        chronicle: 'Prosba konšelů {town.loc} byla odmítnuta. Vrátili se domů a v hospodách se mluví o nevděku vrchnosti.',
      },
    ],
  },

  {
    id: 't_pout',
    scenarios: REALM, cooldown: 20, weight: 0.6,
    image: img('poutnik_zazrak'),
    target: (s) => townTarget(s, (id) => hasBuilding(s, id, 'kostel', true) || hasBuilding(s, id, 'katedrala')),
    title: 'Poutníci',
    text: 'Ke kostelu {town.loc} se sjíždějí poutníci. Prý tam slepá stařena po mši prohlédla. Cesty jsou plné lidí s holemi a mušlemi na kloboucích — a všichni mají hlad i měšec.',
    choices: [
      {
        label: 'Vybírat od poutníků mýto',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 6, faith: -2 },
        chronicle: 'Kdo chtěl ke kostelu {town.loc}, platil u brány. Pokladna se plnila, kázání byla čím dál ostřejší.',
      },
      {
        label: 'Pohostit poutníky',
        hintType: 'resource', hintKey: 'faith',
        effects: { food: -4, faith: 4, prestige: 2 },
        chronicle: 'Poutníci dostali {town.loc} chléb a nocleh zdarma. Zvěst o štědré vrchnosti donesli do daleka.',
      },
    ],
  },

  {
    id: 't_mlynar',
    scenarios: REALM, cooldown: 24, weight: 0.6,
    image: img('n_mlyn'),
    target: (s) => townTarget(s, (id) => hasBuilding(s, id, 'mlyn', true)),
    title: 'Mlynář šidí',
    text: 'Sedláci, kteří melou {town.loc}, si stěžují: mlynář prý bere víc, než mu patří, a mouku vrací lehčí, než přivezli obilí. Mlynář přísahá na svou mlýnskou váhu.',
    choices: [
      {
        label: 'Potrestat mlynáře',
        hintType: 'trait', hintKey: 'strength',
        effects: { stability: 1 },
        provinceEffects: { target: { loyalty: 4 } },
        chronicle: 'Mlynář {town.loc} byl potrestán na pranýři. Sedláci odcházeli spokojení, mouky je ale o nic víc.',
      },
      {
        label: 'Nechat ho, mele dobře',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 3 },
        provinceEffects: { target: { loyalty: -4 } },
        chronicle: 'Mlynář {town.loc} si nechal váhu i podíl a vrchnosti poslal dar. Sedláci si své myslí.',
      },
      {
        label: 'Postavit obecní váhu',
        requires: gold(4),
        hintType: 'trait', hintKey: 'intelligence',
        effects: { gold: -4 },
        traitGain: 'intelligence',
        provinceEffects: { target: { loyalty: 3 } },
        chronicle: 'U mlýna {town.loc} stojí obecní váha pod dohledem konšela. Spory skončily a mlynář se naučil počítat poctivě.',
      },
    ],
  },

  {
    id: 't_skola_zak',
    scenarios: REALM, cooldown: 28, weight: 0.6,
    image: img('skola_ucencu'),
    target: (s) => townTarget(s, (id) => hasBuilding(s, id, 'skola')),
    title: 'Nejlepší žák',
    text: 'Opat z klášterní školy {town.loc} přivádí chlapce v obnošené kutně. Syn uhlíře, ale čte latinsky, počítá rychleji než písaři a pamatuje si každé slovo. Opat se ptá, co s ním.',
    choices: [
      {
        label: 'Vzít ho do kanceláře',
        hintType: 'trait', hintKey: 'intelligence',
        effects: { prestige: 2 },
        traitGain: 'intelligence',
        chronicle: 'Uhlířův syn ze školy {town.loc} psal vládci listiny. Brzy je i sám opravoval.',
      },
      {
        label: 'Poslat ho studovat do ciziny',
        requires: gold(8),
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -8, prestige: 5 },
        chronicle: 'Žák ze školy {town.loc} odjel studovat do ciziny na vládcovy náklady. Píše, že o jeho zemi tam už slyšeli.',
      },
      {
        label: 'Ať zůstane u mnichů',
        hintType: 'resource', hintKey: 'faith',
        effects: { faith: 3 },
        chronicle: 'Chlapec zůstal v klášterní škole {town.loc}. Jednou z něj bude opat, říkají mniši.',
      },
    ],
  },

  {
    id: 't_sveceni',
    scenarios: REALM, oneTime: true, weight: 2,
    image: img('katedrala'),
    target: (s) => townTarget(s, (id) => hasBuilding(s, id, 'katedrala', true)),
    title: 'Svěcení katedrály',
    text: 'Poslední kámen je osazen. Katedrála {town.loc} se tyčí nad krajinou a biskup čeká, jak velkolepé má být svěcení. Přijedou hosté z ciziny i z nejzapadlejších vsí.',
    choices: [
      {
        label: 'Velkolepé svěcení',
        requires: gold(10),
        hintType: 'resource', hintKey: 'prestige',
        effects: { gold: -10, prestige: 4, faith: 3 },
        chronicle: 'Svěcení katedrály {town.loc} trvalo tři dny. Zvony bylo slyšet až za hranicí a jméno vládce se zapsalo nad hlavní portál.',
      },
      {
        label: 'Skromná mše',
        hintType: 'resource', hintKey: 'faith',
        effects: { faith: 2 },
        chronicle: 'Katedrálu {town.loc} posvětili skromně, jak se na dům Boží sluší. Prostí lidé to ocenili víc než páni.',
      },
    ],
  },

  {
    id: 't_jarmark',
    scenarios: REALM, cooldown: 16, weight: 0.6, seasons: [2],
    image: img('trh_v_brode'),
    target: (s) => townTarget(s, (id) => hasBuilding(s, id, 'trziste', true)),
    title: 'Podzimní jarmark',
    text: 'Nové tržiště {town.loc} je plné. Kupci z celé země rozkládají zboží, kejklíři polykají oheň a rychtář se ptá, kolik má letos vybírat tržného.',
    choices: [
      {
        label: 'Vybrat plné tržné',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 6 },
        chronicle: 'Jarmark {town.loc} vynesl pokladně pěkný měšec tržného.',
      },
      {
        label: 'Odpustit tržné, ať se sjedou kupci',
        hintType: 'trait', hintKey: 'patience',
        effects: { prestige: 1 },
        provinceEffects: { target: { wealth: 5 } },
        chronicle: 'Kdo letos prodával {town.loc}, neplatil nic. Příští rok se kupců sjede dvakrát tolik.',
      },
    ],
  },

  // ---------- the farm (Sedlák) ----------
  {
    id: 't_s_roj',
    scenario: 'sedlak', cooldown: 12, seasons: [0, 1],
    image: img('bohata_uroda'),
    requires: (s) => hasBuilding(s, 'grunt', 'vcelin'),
    title: 'Roj na lípě',
    text: 'Z včelína vyrojily včely a usadily se vysoko v koruně lípy na návsi. Sousedé už mají připravené koše — kdo roj sundá, toho je.',
    choices: [
      {
        label: 'Vylézt pro roj',
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.5, traitKey: 'strength', traitScale: 0.04,
        onSuccess: { effects: { gold: 3, prestige: 1 }, chronicle: 'Roj byl zpátky ve včelíně dřív, než sousedé stačili sehnat žebřík. Med bude.' },
        onFailure: { effects: { army: -1, stability: -2 }, chronicle: 'Větev praskla. Roj si odnesl soused a hospodář týden kulhal.' },
      },
      {
        label: 'Nechat ho letět',
        hintType: 'trait', hintKey: 'patience',
        chronicle: 'Roj si odnesl soused. Včely se zase vrátí, říká stará selka.',
      },
    ],
  },

  {
    id: 't_s_dobytek',
    scenario: 'sedlak', cooldown: 14,
    image: img('s_spatna_uroda'),
    requires: (s) => hasBuilding(s, 'grunt', 'chlev', true),
    title: 'Nemoc v chlévě',
    text: 'Kráva v chlévě nežere a stojí se svěšenou hlavou. Jestli je to mor dobytka, do týdne bude chlév prázdný.',
    choices: [
      {
        label: 'Zabít nemocný kus',
        hintType: 'resource', hintKey: 'food',
        effects: { food: -3, stability: 1 },
        chronicle: 'Nemocná kráva skončila v jámě za humny. Ostatní dobytek zůstal zdravý.',
      },
      {
        label: 'Zavolat kováře, který léčí dobytek',
        requires: gold(3),
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -3 },
        chronicle: 'Kovář z Brodu pustil krávě žilou a nalil do ní hořký odvar. Do týdne zase žrala.',
      },
      {
        label: 'Počkat, ono to přejde',
        hintType: 'trait', hintKey: 'patience',
        isRoll: true, baseChance: 0.5,
        onSuccess: { chronicle: 'Kráva se z toho vylízala sama. Štěstí přeje trpělivým.' },
        onFailure: { effects: { food: -8, stability: -3 }, chronicle: 'Nemoc prošla celým chlévem. Zůstal jen prázdný žlab.' },
      },
    ],
  },

  {
    id: 't_s_zavist',
    scenario: 'sedlak', cooldown: 16, minTurn: 6,
    image: img('pozar_mesta'),
    requires: (s) => farmBuilt(s) >= 2,
    title: 'Závist sousedů',
    text: 'Grunt se rozrůstá a ve vsi se o tom mluví. U studny je slyšet, že si hospodář myslí, že je víc než ostatní. A že by stačila jedna jiskra.',
    choices: [
      {
        label: 'Uspořádat hody pro celou ves',
        hintType: 'resource', hintKey: 'food',
        effects: { food: -5, prestige: 5 },
        chronicle: 'Na gruntu se jedlo a pilo do noci. Kdo včera pomlouval, dnes chválí.',
      },
      {
        label: 'Nevšímat si řečí',
        hintType: 'trait', hintKey: 'patience',
        isRoll: true, baseChance: 0.5, traitKey: 'patience', traitScale: 0.03,
        onSuccess: { effects: { prestige: 1 }, chronicle: 'Řeči utichly samy. Ves si zvykla, že se někomu daří.' },
        onFailure: { effects: { prestige: -2 }, town: { at: 'grunt', destroy: 'random' }, chronicle: 'Jedné noci zachytla od neznámé jiskry jedna ze staveb na gruntu. Pachatele nikdo neviděl.' },
      },
      {
        label: 'Postěžovat si rychtáři',
        hintType: 'resource', hintKey: 'stability',
        effects: { prestige: -2, stability: 1 },
        chronicle: 'Rychtář vzal stížnost na vědomí a na návsi pohrozil pomlouvačům. Ves si zapamatovala, kdo běžel žalovat.',
      },
    ],
  },

  {
    id: 't_s_pan_podil',
    scenario: 'sedlak', cooldown: 20, minTurn: 4,
    image: img('s_pan_navsteva'),
    requires: (s) => s.ruler.statusTier < 2 && farmBuilt(s) >= 2,
    title: 'Pán si všiml',
    text: '{lord.Title} {lord.name} projížděl kolem gruntu a zastavil koně. Nové stavby si prohlížel dlouho. Druhý den přišel drábův vzkaz: poddaný, který tolik staví, může i víc odvádět.',
    choices: [
      {
        label: 'Dát pánovi, co chce',
        requires: gold(4),
        hintType: 'resource', hintKey: 'favor',
        effects: { gold: -4, favor: 5 },
        chronicle: 'Pánovi byl odveden podíl navíc. Na panském dvoře teď o gruntu mluví jako o vzorném.',
      },
      {
        label: 'Odmítnout — co jsem postavil, je moje',
        hintType: 'trait', hintKey: 'strength',
        effects: { favor: -6, prestige: 3 },
        chronicle: 'Hospodář drábovi odvětil, že co si postavil vlastníma rukama, z toho odvádět nebude. Ves to obdivuje, pán ne.',
      },
      {
        label: 'Tvrdit, že stavby jsou staré',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.4, traitKey: 'intelligence', traitScale: 0.04,
        onSuccess: { chronicle: 'Dráb uvěřil, že stavby stojí odjakživa. Nebo uvěřit chtěl.' },
        onFailure: { effects: { favor: -8, gold: -2 }, chronicle: 'Lež praskla hned. Pán si nechal zaplatit pokutu a zapamatoval si jméno lháře.' },
      },
    ],
  },
];
