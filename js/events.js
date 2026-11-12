// Panovník (King) scenario — first playable content slice. Šlechtic and
// Sedlák get their own event pools once their scenarios are written.
//
// Event shape:
//   { id, type: 'choice'|'route', title, text, requires?, oneTime?,
//     choices: [...] }               // type 'choice'
//     routeOptions: [...] }          // type 'route'
//
// Choice shape (non-roll):
//   { label, hintType, hintKey, effects, hiddenEffects?, traitGain?, chronicle }
// Choice shape (roll, trait-based success %):
//   { label, hintType:'trait', hintKey, isRoll:true, baseChance, traitKey,
//     traitScale, onSuccess:{effects,hiddenEffects?,traitGain?,chronicle},
//     onFailure:{effects,hiddenEffects?,traitGain?,chronicle} }
// Route option shape:
//   { terrainKey, onSafe:{effects,hiddenEffects?,chronicle}, onDanger:{...} }
//
// Scheduling (all optional): oneTime, cooldown (turns, default 10), weight
// (default 1), minTurn, seasons ([0..3] = jaro, léto, podzim, zima),
// requires(state), target(state) -> province id or court role, music ('battle').
// Branch extras: provinceEffects { <id>|'target'|'*': {loyalty, unrest, wealth,
// garrison, lost} }, courtEffects { <role>|'target': {loyalty} },
// replaceCourt {loyalty, minAge, maxAge}; roll choices may add resourceKey and
// resourceScale so e.g. the size of the army changes the odds of a battle.

import { MORE_EVENTS } from './events_more.js';
import { NOBLE_EVENTS, NOBLE_QUIET_EVENT } from './events_noble.js';
import { CRISIS_EVENTS, ECHO_EVENTS, attachEchoHooks } from './events_echoes.js';
import { COURT_EVENTS } from './events_court.js';
import { TRADE_EVENTS } from './events_trade.js';
import { BUILD_EVENTS } from './events_build.js';
import { INJURY_EVENTS } from './events_injury.js';
import { AMBITION_EVENTS } from './events_ambition.js';
import { WAR_EVENTS } from './events_war.js';
import { BANDIT_EVENTS } from './events_bandits.js';
import { CAREER_EVENTS } from './events_career.js';
import { PEASANT_EVENTS, PEASANT_CRISES, PEASANT_ECHOES, PEASANT_QUIET_EVENT } from './events_peasant.js';

const BASE_EVENTS = [
  {
    id: 'soud_o_mez',
    title: 'Spor dvou sedláků',
    text: 'Před trůnem stojí dva sedláci, oba tvrdí, že mez mezi jejich poli je jinde, než říká ten druhý. Dvůr čeká na tvůj rozsudek.',
    choices: [
      {
        label: 'Rozsoudit podle starých zápisů',
        hintType: 'trait', hintKey: 'intelligence',
        effects: { legitimacy: 3, stability: 2 },
        traitGain: 'intelligence',
        chronicle: 'Vládce rozsoudil spor podle starých pozemkových zápisů. Oba sedláci odešli spokojeni se spravedlností, i když ne s výsledkem.',
      },
      {
        label: 'Rozhodnout losem, ať se nehádají',
        hintType: 'resource', hintKey: 'stability',
        effects: { stability: -2, legitimacy: -1 },
        chronicle: 'Vládce nechal rozhodnout los. Spravedlnosti bylo učiněno zadost jen náhodou a dvůr si o tom leccos pošeptal.',
      },
      {
        label: 'Potrestat oba za obtěžování dvora',
        hintType: 'trait', hintKey: 'strength',
        effects: { stability: 1, legitimacy: -3 },
        hiddenEffects: { setFlag: 'harsh_ruler' },
        chronicle: 'Vládce dal oba sedláky zbičovat za to, že otravují dvůr maličkostmi. Spor je u konce, ale šeptem se o tom mluví ještě dlouho.',
      },
    ],
  },

  {
    id: 'posel_k_vazalovi',
    type: 'route',
    title: 'Posel k vazalovi',
    text: 'Vzdálený vazal otálí se složením přísahy věrnosti. Vysíláš k němu posla s dopisem — jakou cestou má jet?',
    routeOptions: [
      {
        terrainKey: 'forest',
        onSafe: { effects: { legitimacy: 4 }, chronicle: 'Posel dorazil lesní stezkou bez úhony a vazal nakonec přísahu složil.' },
        onDanger: { effects: { gold: -15, legitimacy: -2 }, chronicle: 'Posla v lese přepadli bandité. Dopis i dary jsou pryč a vazal se jen posmívá.' },
      },
      {
        terrainKey: 'mountain',
        onSafe: { effects: { legitimacy: 3 }, chronicle: 'Posel překonal horský průsmyk a přísahu doručil bez potíží.' },
        onDanger: { effects: { army: -5 }, chronicle: 'Posla zdržel sesuv v horách, doprovod se zranil. Zpráva dorazila pozdě a vazal váhá dál.' },
      },
      {
        terrainKey: 'traderoute',
        onSafe: { effects: { legitimacy: 3, gold: -5 }, chronicle: 'Posel projel po obchodní cestě, zaplatil mýto a dorazil bezpečně i včas.' },
        onDanger: { effects: { gold: -10 }, chronicle: 'Na obchodní cestě posla dlouho zdrželi výběrčí mýta, ale nakonec dorazil.' },
      },
    ],
  },

  {
    id: 'rvaci_v_krcme',
    music: 'battle',
    title: 'Rváči v krčmě',
    text: 'Skupina opilých žoldnéřů rozbíjí krčmu v hlavním městě a odmítá poslechnout stráže. Čekají na tvé rozhodnutí.',
    choices: [
      {
        label: 'Vymlátit je vlastní rukou',
        combat: 'rvaci', // fought out in rounds (combat.js)
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.45, traitKey: 'strength', traitScale: 0.05,
        onSuccess: { effects: { prestige: 8, army: 2 }, traitGain: 'strength', chronicle: 'Vládce sám srazil rváče k zemi. Zpráva o tom se šíří městem a vojáci si ho začínají víc vážit.' },
        onFailure: { effects: { prestige: -6, stability: -2 }, injury: 'pohmozdeni', chronicle: 'Rváči kladli tvrdší odpor, než se čekalo. Vládce odchází pohmožděný a ne zrovna důstojně.' },
      },
      {
        label: 'Nechat to na stráže',
        hintType: 'resource', hintKey: 'army',
        effects: { stability: 2, army: -1 },
        chronicle: 'Stráže rváče nakonec spoutaly. Nic dramatického, ale pořádek je obnoven.',
      },
      {
        label: 'Domluvit jim',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.4, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { prestige: 5, faith: 1 }, traitGain: 'eloquence', chronicle: 'Vládcova slova rváče překvapivě uklidnila. Krčmář platí první rundu na jeho počest.' },
        onFailure: { effects: { prestige: -4 }, chronicle: 'Rváči se vládci vysmáli a pokračovali dál, dokud je nezpacifikovaly stráže.' },
      },
    ],
  },

  {
    id: 'sepot_o_tvrde_ruce',
    oneTime: true,
    weight: 3,
    title: 'Šeptání o tvrdé ruce',
    requires: (state) => state.flags.harsh_ruler && !state.flags.harsh_ruler_resolved,
    text: 'Mezi poddanými se šíří pověsti o tom, jak nemilosrdně jsi potrestal oba sedláky ze sporu o mez. Někteří tě za to chválí jako spravedlivého, jiní se bojí přijít se stížností.',
    choices: [
      {
        label: 'Nechat pověsti být',
        hintType: 'resource', hintKey: 'legitimacy',
        effects: { legitimacy: 1 },
        hiddenEffects: { setFlag: 'harsh_ruler_resolved' },
        chronicle: 'Vládce pověsti nechal být. Strach z tvrdé ruky bude ještě dlouho držet klid na dvoře.',
      },
      {
        label: 'Veřejně to vysvětlit lidu',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.5, traitKey: 'eloquence', traitScale: 0.04,
        onSuccess: { effects: { legitimacy: 6, faith: 2 }, traitGain: 'eloquence', hiddenEffects: { setFlag: 'harsh_ruler_resolved' }, chronicle: 'Vládcovo veřejné slovo lid přesvědčilo, že trest byl spravedlivý, ne krutý.' },
        onFailure: { effects: { legitimacy: -2 }, hiddenEffects: { setFlag: 'harsh_ruler_resolved' }, chronicle: 'Vysvětlení znělo spíš jako výmluva. Šepot na dvoře jen zesílil.' },
      },
    ],
  },

  {
    id: 'doziny',
    title: 'Dožínky',
    text: 'Sedláci žádají o svolení uspořádat dožínkovou slavnost na oslavu úrody. Kněz varuje, že jde spíš o staré pohanské zvyky než o vděk bohu.',
    choices: [
      {
        label: 'Povolit slavnost',
        hintType: 'resource', hintKey: 'faith',
        effects: { faith: -3, stability: 4, food: -5 },
        chronicle: 'Slavnost se konala po staru, s tancem a ohni na polích. Lid je spokojený, kněz mlčky nesouhlasí.',
      },
      {
        label: 'Zakázat a nařídit mši',
        hintType: 'resource', hintKey: 'faith',
        effects: { faith: 5, stability: -3 },
        chronicle: 'Místo slavnosti se konala mše. Kněz je spokojen, sedláci si tiše reptají u polí.',
      },
      {
        label: 'Nechat ať se lid poradí s knězem',
        hintType: 'trait', hintKey: 'patience',
        isRoll: true, baseChance: 0.5, traitKey: 'patience', traitScale: 0.04,
        onSuccess: { effects: { faith: 2, stability: 2 }, traitGain: 'patience', chronicle: 'Lid a kněz našli kompromis sami — slavnost s požehnáním na začátku. Všichni jsou spokojeni.' },
        onFailure: { effects: { stability: -2 }, chronicle: 'Dohoda se nepovedla, slavnost i mše se konaly odděleně a napjatě vedle sebe.' },
      },
    ],
  },

  {
    id: 'varovani_kancelere',
    title: 'Varování kancléře',
    text: '{chancellor.Title} {chancellor.name} varuje, že sýpky nejsou tak plné, jak by měly být, a přichází tvrdá zima.',
    choices: [
      {
        label: 'Nakoupit obilí ze zahraničí',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -20, food: 15 },
        chronicle: 'Kancléř zařídil nákup obilí od sousedů. Sýpky jsou plnější, pokladna o něco lehčí.',
      },
      {
        label: 'Snížit dávky pro posádky',
        hintType: 'resource', hintKey: 'army',
        effects: { food: 10, army: -5 },
        chronicle: 'Vojsko dostává menší dávky. Reptají, ale sýpky vydrží déle.',
      },
      {
        label: 'Spolehnout se na zásoby',
        hintType: 'resource', hintKey: 'food',
        effects: {},
        hiddenEffects: { setFlag: 'ignored_famine_warning' },
        chronicle: 'Vládce kancléřovo varování odbyl mávnutím ruky. Uvidí se, zda mělo být bráno vážněji.',
      },
    ],
  },

  {
    id: 'zprava_spehmistra',
    title: 'Zpráva špehmistra',
    text: '{spymaster.Title} {spymaster.name} přichází s neklidnou zprávou: mezi šlechtici prý koluje řeč o spiknutí proti tvé vládě.',
    choices: [
      {
        label: 'Nechat spiklence potajmu sledovat',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.5, traitKey: 'intelligence', traitScale: 0.05,
        onSuccess: { effects: { stability: 3, legitimacy: 2 }, traitGain: 'intelligence', hiddenEffects: { setFlag: 'plot_uncovered' }, chronicle: 'Špehové vypátrali jádro spiknutí dřív, než k něčemu došlo. Viníci teď mlčky čekají na svůj osud.' },
        onFailure: { effects: { stability: -4 }, chronicle: 'Sledování k ničemu nevedlo, spiklenci jsou opatrnější než kdy dřív a nepokoj na dvoře roste.' },
      },
      {
        label: 'Zatknout podezřelé rovnou',
        hintType: 'resource', hintKey: 'stability',
        effects: { stability: -2, legitimacy: -2, army: 1 },
        chronicle: 'Zatýkání bez důkazů popudilo šlechtu. Skuteční spiklenci možná unikli, nespokojenost rozhodně ne.',
      },
      {
        label: 'Nevěřit fámám',
        hintType: 'resource', hintKey: 'stability',
        effects: {},
        hiddenEffects: { setFlag: 'ignored_plot_warning' },
        chronicle: 'Vládce zprávu odbyl jako klevety dvořanů. Špehmistr odchází s pochybnostmi.',
      },
    ],
  },

  {
    id: 'vojenska_prehlidka',
    title: 'Vojenská přehlídka',
    text: '{marshal.Title} {marshal.name} navrhuje uspořádat velkou přehlídku vojska, ať poddaní vidí sílu koruny.',
    choices: [
      {
        label: 'Uspořádat nákladnou přehlídku',
        hintType: 'resource', hintKey: 'prestige',
        effects: { gold: -15, prestige: 8, legitimacy: 3 },
        chronicle: 'Přehlídka byla velkolepá — prapory, koně, lesknoucí se zbroj. Lid dlouho mluví o síle koruny.',
      },
      {
        label: 'Skromná přehlídka',
        hintType: 'resource', hintKey: 'prestige',
        effects: { gold: -5, prestige: 3 },
        chronicle: 'Přehlídka byla skromná, ale důstojná. Nikdo si nestěžuje, nikdo taky nežasne.',
      },
      {
        label: 'Odmítnout, šetřit na horší časy',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 5, prestige: -3 },
        chronicle: 'Vládce přehlídku odmítl. Pokladna je bohatší, maršál zklamaný.',
      },
    ],
  },

  {
    id: 'rada_manzela',
    requires: (state) => state.spouse.alive,
    title: 'Rada u soukromého slyšení',
    text: '{spouse.name} žádá o slyšení mimo dvůr, s radou ohledně vedení království.',
    choices: [
      {
        label: 'Vyslechnout a zvážit radu',
        hintType: 'trait', hintKey: 'patience',
        isRoll: true, baseChance: 0.55, traitKey: 'patience', traitScale: 0.03,
        onSuccess: { effects: { stability: 3, legitimacy: 2 }, traitGain: 'patience', chronicle: 'Rada se ukázala moudřejší, než vládce čekal. Rozhodnutí podle ní přineslo klid na dvoře.' },
        onFailure: { effects: {}, chronicle: 'Rada zněla dobře, ale k ničemu konkrétnímu nevedla.' },
      },
      {
        label: 'Zdvořile odmítnout',
        hintType: 'resource', hintKey: 'legitimacy',
        effects: { legitimacy: 1 },
        chronicle: 'Vládce poděkoval a rozhodl se spolehnout na vlastní úsudek.',
      },
    ],
  },

  // ---------- war and violence ----------

  {
    id: 'pohranicni_najezd',
    music: 'battle',
    cooldown: 8,
    title: 'Nájezd na hranici',
    text: 'Jezdci z Východních marek přepadli osady na okraji Sokolího hvozdu. Pálí stodoly, odvádějí dobytek a mizí v lesích dřív, než dorazí stráž.',
    choices: [
      {
        label: 'Vytáhnout s vojskem a pronásledovat je',
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.4, traitKey: 'strength', traitScale: 0.04, resourceKey: 'army', resourceScale: 0.4,
        onSuccess: { effects: { army: -4, prestige: 8 }, provinceEffects: { 'sokoli-hvozd': { unrest: -10, loyalty: 8 } }, traitGain: 'strength', chronicle: 'Královské vojsko dostihlo nájezdníky u brodu a rozprášilo je. Hvozd vítá vládce jako ochránce.' },
        onFailure: { effects: { army: -10, prestige: -5 }, provinceEffects: { 'sokoli-hvozd': { unrest: 12, loyalty: -8 } }, chronicle: 'Nájezdníci vlákali vojsko do lesní zálohy. Mnoho mužů se nevrátilo a hvozd hoří dál.' },
      },
      {
        label: 'Opevnit hranici a posílit posádky',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -15 },
        provinceEffects: { 'sokoli-hvozd': { garrison: 15, unrest: 4 } },
        chronicle: 'Na okraji hvozdu vyrostly palisády a strážní věže. Tentokrát nájezdníci odtáhli s kořistí, příště to budou mít těžší.',
      },
      {
        label: 'Zaplatit markrabímu, ať své lidi zkrotí',
        hintType: 'resource', hintKey: 'prestige',
        effects: { gold: -20, prestige: -6 },
        chronicle: 'Vládce poslal markrabímu měšec stříbra. Nájezdy ustaly — a v Marcích se smějí, jak snadno se koruna dá koupit.',
      },
    ],
  },

  {
    id: 'valka_s_markami',
    music: 'battle',
    minTurn: 12,
    cooldown: 28,
    weight: 0.7,
    title: 'Válka s Marcemi',
    text: 'Markrabí z Východních marek vyhlásil válku. Jeho vojsko překročilo hranici a táhne Sokolím hvozdem k srdci království. {marshal.Title} {marshal.name} čeká na rozkaz.',
    choices: [
      {
        label: 'Svolat korouhve a postavit se mu v poli',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.35, traitKey: 'strength', traitScale: 0.03, resourceKey: 'army', resourceScale: 0.7,
        onSuccess: { effects: { army: -12, prestige: 15, legitimacy: 6 }, provinceEffects: { 'sokoli-hvozd': { loyalty: 10, unrest: -10 } }, courtEffects: { marshal: { loyalty: 8 } }, traitGain: 'strength', chronicle: 'V bitvě na okraji hvozdu se markrabího vojsko rozpadlo. O vítězství koruny budou zpívat ještě vnuci.' },
        onFailure: { effects: { army: -20, prestige: -10, stability: -6 }, provinceEffects: { 'sokoli-hvozd': { lost: true } }, chronicle: 'Bitva skončila porážkou. Markrabí si odvedl Sokolí hvozd jako válečnou kořist a jeho prapory teď vlají nad Sokolovem.' },
      },
      {
        label: 'Vyjednat mír dřív, než teče krev',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.4, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { gold: -15, legitimacy: 3 }, traitGain: 'eloquence', chronicle: 'Vládce přesvědčil markrabího, že válka by stála víc, než přinese. Mír byl zpečetěn za mírné odškodné.' },
        onFailure: { effects: { gold: -30, prestige: -10 }, provinceEffects: { 'sokoli-hvozd': { loyalty: -15, unrest: 15 } }, chronicle: 'Markrabí přijal výkupné a přesto vyplenil půl hvozdu. Lid tam proklíná slabou korunu.' },
      },
      {
        label: 'Stáhnout se do hradů a čekat',
        hintType: 'trait', hintKey: 'patience',
        effects: { food: -15, stability: -4 },
        provinceEffects: { 'sokoli-hvozd': { unrest: 25, loyalty: -20, wealth: -15 } },
        chronicle: 'Vojsko zůstalo za hradbami. Markrabí plenil celé léto, pak s kořistí odtáhl. Hvozd to koruně jen tak neodpustí.',
      },
    ],
  },

  {
    id: 'vzpoura_v_provincii',
    music: 'battle',
    weight: 3,
    cooldown: 4,
    target: (state) => {
      const rebels = state.provinces.filter((p) => !p.lost && p.unrest >= 75).sort((a, b) => b.unrest - a.unrest);
      return rebels.length ? rebels[0].id : null;
    },
    title: 'Vzpoura',
    text: 'Provincie {province.name} povstala. Lid vyhnal královské výběrčí, na návsích hoří ohně a vůdci povstání žádají, aby k nim vládce přijel osobně.',
    choices: [
      {
        label: 'Potlačit vzpouru vojskem',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.45, traitKey: 'strength', traitScale: 0.03, resourceKey: 'army', resourceScale: 0.6,
        onSuccess: { effects: { army: -6, stability: 3 }, provinceEffects: { target: { unrest: -35, loyalty: -10 } }, chronicle: 'Vojsko vzpouru zadusilo. V provincii {province.name} je klid — klid hřbitova.' },
        onFailure: { effects: { army: -12, stability: -10, legitimacy: -6 }, provinceEffects: { target: { lost: true } }, chronicle: 'Povstalci vojsko porazili a vyhlásili se svobodnými. Provincie {province.name} se od koruny odtrhla.' },
      },
      {
        label: 'Vyjet za povstalci a vyjednávat',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.45, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { gold: -10, legitimacy: 4 }, provinceEffects: { target: { unrest: -30, loyalty: 10 } }, traitGain: 'eloquence', chronicle: 'Vládce předstoupil před povstalce bez brnění. Vyslechl je a slíbil nápravu. Ohně na návsích zhasly.' },
        onFailure: { effects: { prestige: -8, legitimacy: -4 }, provinceEffects: { target: { unrest: 10 } }, chronicle: 'Vyjednávání se zvrtlo v potupu. Vládce musel z provincie {province.name} ujet pod ochranou stráží.' },
      },
      {
        label: 'Ustoupit: snížit daně a dát amnestii',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -20, prestige: -4 },
        provinceEffects: { target: { unrest: -25, loyalty: 8, wealth: -5 } },
        chronicle: 'Koruna ustoupila. Daně v provincii {province.name} klesly a povstalci dostali milost. Šlechta to nese nelibě.',
      },
    ],
  },

  {
    id: 'lapkove_ve_hvozdu',
    music: 'battle',
    cooldown: 9,
    title: 'Lapkové ve hvozdu',
    text: 'Kupci si stěžují, že na lesních cestách Sokolího hvozdu řádí banda lapků. Dvě karavany zmizely beze stopy a obchod s Východem vázne.',
    choices: [
      {
        label: 'Vyslat jízdní oddíl',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.5, resourceKey: 'army', resourceScale: 0.5,
        onSuccess: { effects: { army: -3, gold: 8, prestige: 3 }, provinceEffects: { 'sokoli-hvozd': { unrest: -8 } }, chronicle: 'Jezdci vypálili lapkům doupě a vrátili kupcům část zboží. Cesty jsou zase průjezdné.' },
        onFailure: { effects: { army: -7 }, provinceEffects: { 'sokoli-hvozd': { unrest: 6 } }, chronicle: 'Lapkové znali les lépe než vojáci. Oddíl se vrátil s prázdnou a s raněnými.' },
      },
      {
        label: 'Najmout myslivce ze Sokolova',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.45, traitKey: 'intelligence', traitScale: 0.05,
        onSuccess: { effects: { gold: -8 }, provinceEffects: { 'sokoli-hvozd': { unrest: -10, loyalty: 6 } }, traitGain: 'intelligence', chronicle: 'Myslivci vystopovali lapky až do jejich úkrytu. Stálo to pár stříbrných, ale bez jediné ztráty.' },
        onFailure: { effects: { gold: -8 }, chronicle: 'Myslivci si vzali zálohu a lapky „nenašli“. Kdo ví, na čí straně vlastně stojí.' },
      },
      {
        label: 'Ať si kupci najmou vlastní stráž',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -4, prestige: -2 },
        provinceEffects: { 'sokoli-hvozd': { unrest: 8, wealth: -6 } },
        chronicle: 'Koruna nechala kupce, ať si poradí sami. Ceny zboží z Východu rostou a hvozd je nebezpečnější než dřív.',
      },
    ],
  },

  // ---------- consequences of earlier decisions ----------

  {
    id: 'hladomor',
    weight: 4,
    oneTime: true,
    seasons: [3, 0],
    requires: (state) => state.flags.ignored_famine_warning || state.resources.food <= 12,
    title: 'Hladomor',
    text: 'Kancléřovo varování se naplnilo. Sýpky zejí prázdnotou, v Brodné umírají staří a děti a před hradem stojí zástup hladových.',
    choices: [
      {
        label: 'Otevřít královské zásoby',
        hintType: 'resource', hintKey: 'food',
        effects: { food: -15, stability: 4, legitimacy: 4 },
        hiddenEffects: { clearFlag: 'ignored_famine_warning' },
        provinceEffects: { brodna: { loyalty: 10, unrest: -10 } },
        chronicle: 'Vládce otevřel královské sýpky. Dvůr bude jíst skromněji, ale lid to nezapomene.',
      },
      {
        label: 'Nakoupit obilí za každou cenu',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -30, food: 15 },
        hiddenEffects: { clearFlag: 'ignored_famine_warning' },
        chronicle: 'Kupci si za obilí řekli trojnásobek. Pokladna krvácí, ale hlad polevil.',
      },
      {
        label: 'Nechat to na vůli Boží',
        hintType: 'resource', hintKey: 'faith',
        effects: { stability: -10, legitimacy: -8, faith: 3 },
        hiddenEffects: { clearFlag: 'ignored_famine_warning' },
        provinceEffects: { brodna: { unrest: 25, loyalty: -15 }, capital: { unrest: 12 } },
        chronicle: 'Koruna nehnula prstem. Kněží se modlili, lid umíral. Hněv z té zimy bude doutnat léta.',
      },
    ],
  },

  {
    id: 'atentat',
    music: 'battle',
    weight: 4,
    oneTime: true,
    minTurn: 4,
    requires: (state) => state.flags.ignored_plot_warning,
    title: 'Dýka ve tmě',
    text: 'Špehmistr měl pravdu. V noci se do ložnice vplížil najatý vrah a jeho dýka se zaleskla ve světle svíce.',
    choices: [
      {
        label: 'Bránit se holýma rukama',
        combat: 'vrah', // fought out in rounds (combat.js)
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.45, traitKey: 'strength', traitScale: 0.05,
        onSuccess: { effects: { prestige: 10, stability: 3 }, hiddenEffects: { clearFlag: 'ignored_plot_warning', setFlag: 'plot_uncovered' }, traitGain: 'strength', chronicle: 'Vládce vraha přemohl a ten před smrtí vyzradil jména svých pánů. Spiknutí je odhaleno.' },
        onFailure: { effects: { stability: -8, legitimacy: -6, prestige: -4 }, hiddenEffects: { clearFlag: 'ignored_plot_warning' }, injury: 'rana', chronicle: 'Vládce přežil jen díky stráži, která přiběhla na poslední chvíli. Rána se hojí pomalu a spiklenci unikli.' },
      },
      {
        label: 'Křičet o pomoc a utéct chodbou',
        hintType: 'trait', hintKey: 'intelligence',
        effects: { prestige: -5, stability: -3 },
        hiddenEffects: { clearFlag: 'ignored_plot_warning' },
        courtEffects: { spymaster: { loyalty: -10 } },
        chronicle: 'Vládce unikl tajnou chodbou. Vrah zmizel a dvůr si šeptá, že koruna utíká před vlastním stínem.',
      },
    ],
  },

  {
    id: 'soud_se_spiklenci',
    weight: 4,
    oneTime: true,
    requires: (state) => state.flags.plot_uncovered,
    title: 'Soud se spiklenci',
    text: 'Spiklenci stojí v okovech před trůnem. Jsou mezi nimi i dva páni z mocných rodů. Šlechta napjatě čeká, jak vládce rozhodne.',
    choices: [
      {
        label: 'Popravit všechny na náměstí',
        hintType: 'trait', hintKey: 'strength',
        effects: { stability: 5, legitimacy: -3, prestige: 6 },
        hiddenEffects: { clearFlag: 'plot_uncovered', setFlag: 'harsh_ruler' },
        chronicle: 'Kat měl dlouhý den. Žádný šlechtic se už neodváží šeptat o spiknutí — ale ani o věrnosti.',
      },
      {
        label: 'Udělit milost výměnou za přísahu',
        hintType: 'trait', hintKey: 'patience',
        isRoll: true, baseChance: 0.5, traitKey: 'patience', traitScale: 0.04,
        onSuccess: { effects: { legitimacy: 8, stability: 3 }, hiddenEffects: { clearFlag: 'plot_uncovered' }, traitGain: 'patience', chronicle: 'Omilostnění páni padli na kolena a přísahali věrnost. Vládcova velkorysost se stala pověstnou.' },
        onFailure: { effects: { stability: -6 }, hiddenEffects: { clearFlag: 'plot_uncovered', setFlag: 'ignored_plot_warning' }, chronicle: 'Milost spiklence nezměnila. Jen se naučili být opatrnější.' },
      },
      {
        label: 'Vyhnat je ze země a zabavit majetek',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 25, legitimacy: 2, prestige: 2 },
        hiddenEffects: { clearFlag: 'plot_uncovered' },
        chronicle: 'Spiklenci odešli do vyhnanství s tím, co měli na sobě. Jejich statky obohatily královskou pokladnu.',
      },
    ],
  },

  // ---------- provinces ----------

  {
    id: 'zaval_v_dole',
    cooldown: 12,
    title: 'Zával v dole',
    text: 'V Železné Huti se zřítila štola. Pod zemí zůstalo dvacet horníků a jejich ženy obléhají brány dolu. Správce dolu chce těžbu obnovit co nejdřív.',
    choices: [
      {
        label: 'Zastavit těžbu a zachraňovat horníky',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -12, faith: 2 },
        provinceEffects: { 'zelezny-hreben': { loyalty: 12, unrest: -10 } },
        chronicle: 'Záchranáři kopali tři dny a noci. Většinu horníků dostali živé. Hřeben na to nezapomene.',
      },
      {
        label: 'Pokračovat v těžbě jinou štolou',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 10, army: 2 },
        provinceEffects: { 'zelezny-hreben': { unrest: 18, loyalty: -12 } },
        chronicle: 'Ruda tekla dál a kovárny nestály ani den. Pod horou ale zůstali mrtví a nad horou nenávist.',
      },
      {
        label: 'Vyšetřit, kdo šetřil na výdřevě',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.5, traitKey: 'intelligence', traitScale: 0.05,
        onSuccess: { effects: { gold: 8, legitimacy: 3 }, provinceEffects: { 'zelezny-hreben': { loyalty: 8, unrest: -6 } }, traitGain: 'intelligence', chronicle: 'Ukázalo se, že správce kradl peníze na výdřevu. Jeho majetek odškodnil vdovy a horníci provolávají slávu.' },
        onFailure: { effects: { gold: -5 }, provinceEffects: { 'zelezny-hreben': { unrest: 8 } }, chronicle: 'Vyšetřování se utopilo v úplatcích a vzájemném obviňování. Horníci se cítí podvedeni.' },
      },
    ],
  },

  {
    id: 'mor_v_pristavu',
    cooldown: 16,
    minTurn: 3,
    title: 'Mor v přístavu',
    text: 'Z lodi z jihu vynesli námořníci horečku. V přístavní čtvrti Pobřežní marky leží desítky nemocných a opat z kláštera na útesu nabízí pomoc mnichů.',
    choices: [
      {
        label: 'Uzavřít přístav a čtvrť',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -15, stability: 2 },
        provinceEffects: { 'pobrezni-mark': { unrest: 12, wealth: -8 } },
        chronicle: 'Přístav byl uzavřen a čtvrť obehnána strážemi. Nákaza se nerozšířila, obchod ano — jinam.',
      },
      {
        label: 'Povolat mnichy z kláštera',
        hintType: 'resource', hintKey: 'faith',
        isRoll: true, baseChance: 0.45, resourceKey: 'faith', resourceScale: 0.5,
        onSuccess: { effects: { faith: 6, stability: 3 }, provinceEffects: { 'pobrezni-mark': { loyalty: 8 } }, chronicle: 'Mniši ošetřovali nemocné dnem i nocí. Mor ustoupil a lid věří, že to byl zázrak.' },
        onFailure: { effects: { faith: -4, food: -8, stability: -6 }, provinceEffects: { 'pobrezni-mark': { unrest: 15 } }, chronicle: 'Mniši umírali spolu s nemocnými. Nákaza se dostala až do vnitrozemí.' },
      },
      {
        label: 'Nechat přístav otevřený, obchod musí běžet',
        hintType: 'resource', hintKey: 'gold',
        isRoll: true, baseChance: 0.4,
        onSuccess: { effects: { gold: 10 }, chronicle: 'Horečka sama odezněla a lodě kotvily dál. Vládce měl štěstí.' },
        onFailure: { effects: { gold: -5, food: -10, stability: -8 }, provinceEffects: { 'pobrezni-mark': { unrest: 20, loyalty: -10 }, capital: { unrest: 8 } }, chronicle: 'Mor se rozlezl po celém pobřeží a dorazil až do hlavního města. Zvony umíráčku nezmlkly celý měsíc.' },
      },
    ],
  },

  {
    id: 'kupci_z_jihu',
    cooldown: 12,
    title: 'Kupci z jihu',
    text: 'Do Přístavu Mark připluli bohatí kupci z jihu. Nabízejí koření, hedvábí a zlato — výměnou za výsadu obchodovat bez cla.',
    choices: [
      {
        label: 'Udělit výsadu',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 15, faith: -2 },
        provinceEffects: { 'pobrezni-mark': { wealth: 12, loyalty: 6 } },
        chronicle: 'Kupci dostali výsadu. Přístav bohatne, jen kněží brblají nad cizími zvyky v přístavních krčmách.',
      },
      {
        label: 'Smlouvat o lepší podmínky',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.45, traitKey: 'intelligence', traitScale: 0.05,
        onSuccess: { effects: { gold: 25 }, provinceEffects: { 'pobrezni-mark': { wealth: 8 } }, traitGain: 'intelligence', chronicle: 'Vládce vyjednal poloviční clo a k tomu dar pro pokladnu. Kupci odcházejí s úsměvem i tak.' },
        onFailure: { effects: { prestige: -3 }, chronicle: 'Kupci se urazili a odpluli do sousední země. Přístav přišel o dobrý obchod.' },
      },
      {
        label: 'Odmítnout, cizinci nemají výsady',
        hintType: 'resource', hintKey: 'prestige',
        effects: { prestige: 2, faith: 2 },
        provinceEffects: { 'pobrezni-mark': { loyalty: -5 } },
        chronicle: 'Vládce kupce odmítl. Kněží chválí, přístavní měšťané počítají ušlé zisky.',
      },
    ],
  },

  {
    id: 'bohata_uroda',
    seasons: [1, 2],
    cooldown: 8,
    title: 'Bohatá úroda',
    text: 'V Brodné se letos urodilo jako nikdy. Stodoly praskají ve švech a {chancellor.title} {chancellor.name} se ptá, co s přebytkem.',
    choices: [
      {
        label: 'Uložit do královských sýpek',
        hintType: 'resource', hintKey: 'food',
        effects: { food: 18 },
        chronicle: 'Přebytek zmizel v královských sýpkách. Až přijde hladový rok, bude z čeho brát.',
      },
      {
        label: 'Prodat obilí kupcům',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 18, food: 4 },
        provinceEffects: { brodna: { wealth: 6 } },
        chronicle: 'Obilí odjelo po řece k cizím trhům. Do pokladny přiteklo stříbro.',
      },
      {
        label: 'Snížit dávky sedlákům',
        hintType: 'resource', hintKey: 'stability',
        effects: { food: 6, stability: 4, legitimacy: 3 },
        provinceEffects: { brodna: { loyalty: 10, unrest: -8 } },
        chronicle: 'Sedláci si letos nechali víc ze své úrody. V Brodné se zpívá na vládcovu počest.',
      },
    ],
  },

  {
    id: 'kruta_zima',
    seasons: [3],
    cooldown: 8,
    title: 'Krutá zima',
    text: 'Zima přišla brzy a tvrdě. Řeka zamrzla, cesty zapadly sněhem a v chudších čtvrtích umírají lidé zimou.',
    choices: [
      {
        label: 'Rozdat dříví a teplé jídlo',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -10, food: -6, stability: 4, legitimacy: 2 },
        chronicle: 'Z hradu vyjížděly vozy s dřívím a kotle s polévkou. Zima byla krutá, ale lid ví, že na něj koruna myslí.',
      },
      {
        label: 'Otevřít kostely jako útulky',
        hintType: 'resource', hintKey: 'faith',
        effects: { faith: 4, gold: -4, stability: 2 },
        chronicle: 'Kostely se na zimu staly útulky. Kněží kázali o milosrdenství a lid poslouchal pozorněji než jindy.',
      },
      {
        label: 'Každý se musí postarat sám',
        hintType: 'resource', hintKey: 'stability',
        effects: { stability: -5 },
        provinceEffects: { '*': { unrest: 5 } },
        chronicle: 'Koruna nechala lid napospas zimě. Na jaře bylo na hřbitovech víc hrobů než obvykle.',
      },
    ],
  },

  // ---------- court and family ----------

  {
    id: 'vychova_dedice',
    cooldown: 16,
    requires: (state) => state.heir.alive && state.heir.age < 16,
    title: 'Výchova dědice',
    text: 'Dědic {heir.name} dorůstá a dvůr se přou, kdo by ho měl vychovávat. Na budoucím vládci záleží víc než na čemkoli jiném.',
    choices: [
      {
        label: 'Svěřit ho maršálovi, ať se naučí boji',
        hintType: 'resource', hintKey: 'army',
        effects: { prestige: 3, army: 2 },
        courtEffects: { heir: { loyalty: 5 }, marshal: { loyalty: 8 } },
        heirTraits: { strength: 2 },
        chronicle: 'Dědic tráví dny na cvičišti s maršálem. Ruce má od meče samé mozoly a vojáci ho mají rádi.',
      },
      {
        label: 'Svěřit ho kancléři, ať pozná správu země',
        hintType: 'trait', hintKey: 'intelligence',
        effects: { legitimacy: 3, gold: 3 },
        courtEffects: { heir: { loyalty: 5 }, chancellor: { loyalty: 8 } },
        heirTraits: { intelligence: 2 },
        chronicle: 'Dědic sedí s kancléřem nad listinami a účty. Ví, kolik stojí pytel obilí i válka.',
      },
      {
        label: 'Poslat ho do kláštera na útesu',
        hintType: 'resource', hintKey: 'faith',
        effects: { faith: 6 },
        courtEffects: { heir: { loyalty: -5 } },
        heirTraits: { patience: 1, eloquence: 1 },
        chronicle: 'Dědic odešel k mnichům na útes. Naučí se číst, psát a modlit se — a možná i pokoře.',
      },
    ],
  },

  {
    id: 'dedic_dospel',
    weight: 2,
    requires: (state) => state.heir.alive && state.heir.age >= 16 && !state.flags[`heir_adult_${state.heir.name}`],
    markSeen: (state) => { state.flags[`heir_adult_${state.heir.name}`] = true; }, // once per heir
    title: 'Dědic dospěl',
    text: 'Dědic {heir.name} dovršil šestnácti let. Je čas rozhodnout o jeho budoucnosti — a tím i o budoucnosti rodu {dynastyName}.',
    choices: [
      {
        label: 'Domluvit sňatek se sousedním rodem',
        hintType: 'resource', hintKey: 'legitimacy',
        effects: { legitimacy: 8, prestige: 4, gold: 12 },
        courtEffects: { heir: { loyalty: -4 } },
        hiddenEffects: { setFlag: 'heir_married' },
        heirTraits: { eloquence: 1 },
        chronicle: 'Dědic byl zasnouben s potomkem mocného sousedního rodu. Věno naplnilo pokladnu a spojenectví posílilo trůn.',
      },
      {
        label: 'Svěřit dědici velení posádky na hranici',
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.55, resourceKey: 'army', resourceScale: 0.3,
        onSuccess: { effects: { prestige: 8, army: 3 }, courtEffects: { heir: { loyalty: 12 } }, provinceEffects: { 'sokoli-hvozd': { garrison: 10 } }, heirTraits: { strength: 2 }, chronicle: 'Dědic se na hranici osvědčil. Vojáci za ním půjdou, až jednou usedne na trůn.' },
        onFailure: { effects: { prestige: -5 }, courtEffects: { heir: { loyalty: -6 } }, chronicle: 'Velení bylo nad dědicovy síly. Vrátil se ke dvoru zahanbený a zatrpklý.' },
      },
      {
        label: 'Ponechat ho u dvora po svém boku',
        hintType: 'trait', hintKey: 'patience',
        effects: { stability: 2 },
        courtEffects: { heir: { loyalty: 8 } },
        heirTraits: { intelligence: 1, patience: 1 },
        chronicle: 'Dědic zůstal u dvora a učí se vládnout přímo od svého rodiče.',
      },
    ],
  },

  {
    id: 'smrt_radce',
    weight: 3,
    cooldown: 4,
    target: (state) => ['chancellor', 'marshal', 'spymaster'].find((r) => state[r].alive !== false && state[r].age >= 66) || null,
    title: 'Smrt rádce',
    text: '{target.Old} {target.role} {target.name} {target.died} ve věku {target.age} let. Dvůr truchlí — a zároveň už se šeptá, kdo usedne na uprázdněné místo.',
    choices: [
      {
        label: 'Jmenovat zkušeného šlechtice',
        hintType: 'resource', hintKey: 'legitimacy',
        effects: { legitimacy: 3 },
        replaceCourt: { loyalty: 55, minAge: 45, maxAge: 58 },
        chronicle: 'Na uprázdněné místo usedl zkušený šlechtic. Šlechta je spokojená, jeho věrnost se teprve ukáže.',
      },
      {
        label: 'Povýšit mladého a oddaného služebníka',
        hintType: 'resource', hintKey: 'prestige',
        effects: { prestige: -3 },
        replaceCourt: { loyalty: 78, minAge: 26, maxAge: 36 },
        chronicle: 'Vládce povýšil mladého muže z nižšího rodu. Šlechta se mračí, ale nový rádce by za korunu dal život.',
      },
    ],
  },

  {
    id: 'nespokojeny_radce',
    weight: 2,
    cooldown: 8,
    target: (state) => ['chancellor', 'marshal', 'spymaster'].find((r) => state[r].alive !== false && state[r].loyalty <= 32) || null,
    title: 'Nespokojený rádce',
    text: '{target.name}, {target.your} {target.role}, už neskrývá nespokojenost. Na dvoře se ví, že se schází s lidmi, kteří koruně nepřejí.',
    choices: [
      {
        label: 'Uplatit ho zlatem a pozemky',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -18 },
        courtEffects: { target: { loyalty: 25 } },
        chronicle: 'Zlato a nové panství spravily, co pokazily roky přehlížení. Na čas.',
      },
      {
        label: 'Promluvit s ním mezi čtyřma očima',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.45, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { stability: 2 }, courtEffects: { target: { loyalty: 30 } }, traitGain: 'eloquence', chronicle: 'Rozhovor trval do noci. Rádce odcházel s pocitem, že ho vládce konečně slyší.' },
        onFailure: { effects: { stability: -3 }, courtEffects: { target: { loyalty: -10 } }, hiddenEffects: { setFlag: 'ignored_plot_warning' }, chronicle: 'Rozhovor skončil hádkou. Rádce odešel bledý vzteky a jeho přátelé začali být podezřele tiší.' },
      },
      {
        label: 'Zbavit ho úřadu',
        hintType: 'trait', hintKey: 'strength',
        effects: { stability: -2, prestige: 2 },
        replaceCourt: { loyalty: 65, minAge: 35, maxAge: 52 },
        chronicle: 'Nespokojený rádce byl zbaven úřadu a poslán na venkov. Jeho nástupce ví, co se stane neloajálním.',
      },
    ],
  },

  // ---------- church and prestige ----------

  {
    id: 'biskupuv_desatek',
    cooldown: 12,
    title: 'Biskupův desátek',
    text: 'Biskup žádá, aby koruna odváděla církvi desátek i z výnosů dolů a přístavu. Hrozí, že jinak kněží z kazatelen připomenou lidu, kdo dává korunám požehnání.',
    choices: [
      {
        label: 'Zaplatit desátek',
        hintType: 'resource', hintKey: 'faith',
        effects: { gold: -15, faith: 8, legitimacy: 2 },
        chronicle: 'Koruna zaplatila. Biskup žehná z kazatelny vládcovu zbožnost.',
      },
      {
        label: 'Odmítnout — koruna nepodléhá biskupovi',
        hintType: 'resource', hintKey: 'prestige',
        effects: { faith: -8, prestige: 4, legitimacy: -3 },
        chronicle: 'Vládce biskupa odbyl. Kazatelny zahřměly, ale zlato zůstalo v pokladně.',
      },
      {
        label: 'Vyjednat polovinu',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.5, traitKey: 'eloquence', traitScale: 0.04,
        onSuccess: { effects: { gold: -7, faith: 4 }, traitGain: 'eloquence', chronicle: 'Biskup se spokojil s polovinou a nazval to moudrým kompromisem.' },
        onFailure: { effects: { gold: -10, faith: -3 }, chronicle: 'Smlouvání biskupa urazilo. Zaplatila se většina a vztahy jsou chladnější než předtím.' },
      },
    ],
  },

  {
    id: 'turnaj',
    cooldown: 12,
    seasons: [0, 1],
    title: 'Turnaj',
    text: 'Šlechtici žádají o velký turnaj pod hradem. Rytíři z celé země i ze ciziny by se utkali o čest a přízeň dvora.',
    choices: [
      {
        label: 'Uspořádat turnaj a sám vjet do klání',
        combat: 'rytir', // fought out in rounds (combat.js)
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.35, traitKey: 'strength', traitScale: 0.06,
        onSuccess: { effects: { gold: -15, prestige: 14, legitimacy: 3 }, traitGain: 'strength', chronicle: 'Vládce shodil z koně tři soupeře a turnaj vyhrál. O jeho síle se zpívá v každé krčmě.' },
        onFailure: { effects: { gold: -15, prestige: -6, stability: -2 }, injury: { pool: ['pohmozdeni', 'zlomenina', 'oko', 'jizva', 'kulhani'], chance: 0.75 }, chronicle: 'Vládce byl hned v prvním klání shozen do prachu a zvedli ho až zbrojnoši. Šlechta se smála do rukávů.' },
      },
      {
        label: 'Uspořádat turnaj jen jako hostitel',
        hintType: 'resource', hintKey: 'prestige',
        effects: { gold: -15, prestige: 7 },
        chronicle: 'Turnaj byl velkolepý. Hosté odjeli plni dojmů a s respektem ke koruně.',
      },
      {
        label: 'Odmítnout, takové hry jsou plýtvání',
        hintType: 'resource', hintKey: 'gold',
        effects: { prestige: -3 },
        chronicle: 'Turnaj se nekonal. Šlechtici odjeli zklamaní a mladí rytíři hledají slávu jinde.',
      },
    ],
  },
];

export const EVENTS = attachEchoHooks([...BASE_EVENTS, ...MORE_EVENTS, ...NOBLE_EVENTS, ...COURT_EVENTS, ...TRADE_EVENTS, ...BUILD_EVENTS, ...INJURY_EVENTS, ...AMBITION_EVENTS, ...WAR_EVENTS, ...BANDIT_EVENTS, ...PEASANT_EVENTS, ...CRISIS_EVENTS, ...PEASANT_CRISES, ...ECHO_EVENTS, ...PEASANT_ECHOES, ...CAREER_EVENTS]);

// Picked when no other event is due (or now and then by chance): a calm season
// still lets the ruler spend it on something.
export const QUIET_EVENT = {
  id: 'quiet_season',
  title: 'Klidné období',
  text: 'Království si tuto sezónu oddechlo od velkých rozhodnutí. Pole dozrávají, kupci přicházejí a odcházejí. Jak vládce využije klidný čas?',
  choices: [
    {
      label: 'Zvelebit pole a cesty',
      hintType: 'resource', hintKey: 'food',
      effects: { gold: -8, food: 6 },
      provinceEffects: { '*': { wealth: 3 } },
      chronicle: 'Klidné období vládce využil ke stavbě cest a mostů a k vysoušení bažin.',
    },
    {
      label: 'Cvičit vojsko',
      hintType: 'resource', hintKey: 'army',
      effects: { gold: -6, army: 6 },
      chronicle: 'Na cvičištích se celou sezónu ozývalo řinčení zbraní.',
    },
    {
      label: 'Studovat listiny a kroniky',
      hintType: 'trait', hintKey: 'intelligence',
      effects: { legitimacy: 1 },
      traitGain: 'intelligence',
      chronicle: 'Vládce trávil večery nad starými listinami a kronikami předků.',
    },
    {
      label: 'Objíždět provincie a naslouchat lidu',
      hintType: 'trait', hintKey: 'patience',
      effects: { gold: -4, stability: 2 },
      provinceEffects: { '*': { unrest: -4 } },
      traitGain: 'patience',
      chronicle: 'Vládce objel provincie a vyslechl stížnosti prostých lidí.',
    },
  ],
};

export const QUIET_EVENTS = { panovnik: QUIET_EVENT, slechtic: NOBLE_QUIET_EVENT, sedlak: PEASANT_QUIET_EVENT };
