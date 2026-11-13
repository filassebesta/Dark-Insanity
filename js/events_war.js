// War events (see war.js): raised by processWar as state.pendingEvent, one
// each season the army stands in the field, and a closing one after a won or
// lost campaign. Branch extra `war`: { progress, morale, power, won, wound, end }.
// Tokens: {war.target} {war.enemy} {war.loc} {war.leader} {war.men}.

import { warBonus } from './war.js';

const REALM = ['panovnik', 'slechtic'];
const img = (id) => `assets/events/${id}.jpg`;
const gold = (n) => (s) => s.resources.gold >= n;

export const WAR_EVENTS = [
  {
    id: 'w_bitva',
    scenarios: REALM, forced: true, music: 'battle',
    image: img('valka_s_markami'),
    title: 'Bitva v poli',
    text: 'Za úsvitu stojí na protějším návrší {war.enemy}. {war.leader} objíždí řady a {war.men} mužů čeká na rozkaz. Jedna bitva může rozhodnout celé tažení — nebo ho ukončit.',
    choices: [
      {
        label: 'Udeřit čelně',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.5, chanceBonus: warBonus, bonusLabel: 'Vojsko v poli', noInjury: true,
        onSuccess: { effects: { prestige: 2 }, war: { progress: 35, morale: 10, power: -2, won: true }, music: 'battle', chronicle: 'Útok prorazil nepřátelské řady a nepřítel prchl z bojiště. Do tábora se vojsko vracelo za zpěvu.' },
        onFailure: { war: { progress: -5, morale: -18, power: -6, wound: 0.35 }, music: 'battle', chronicle: 'Útok se zlomil o nepřátelské štíty. Na svahu zůstalo ležet mnoho dobrých mužů.' },
      },
      {
        label: 'Obejít je lesem a vpadnout do boku',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.3, traitKey: 'intelligence', traitScale: 0.03, chanceBonus: warBonus, bonusLabel: 'Vojsko v poli',
        onSuccess: { war: { progress: 45, morale: 12, power: -1, won: true }, traitGain: 'intelligence', music: 'battle', chronicle: 'Jízda se vynořila z lesa nepříteli v zádech. Bitva skončila dřív, než pořádně začala.' },
        onFailure: { war: { morale: -12, power: -4, wound: 0.2 }, music: 'battle', chronicle: 'Les byl hustší, než se zdálo. Oddíl zabloudil a přišel do bitvy pozdě a vyčerpaný.' },
      },
      {
        label: 'Opevnit tábor a čekat, až zaútočí oni',
        hintType: 'trait', hintKey: 'patience',
        war: { progress: 10, morale: -4 },
        chronicle: 'Vojsko se zakopalo za příkopy a koly. Nepřítel zaútočil, narazil a stáhl se. Nic se nerozhodlo, ale nikdo zbytečně nepadl.',
      },
    ],
  },

  {
    id: 'w_obleh',
    scenarios: REALM, forced: true, music: 'battle',
    image: img('obleheni'),
    title: 'Pod hradbami',
    text: 'Poslední pevnost {war.loc} stojí. Za hradbami se drží {war.enemy} a podle zběhů jim dochází voda. Tesaři se ptají, jestli mají stavět žebříky, nebo kopat.',
    choices: [
      {
        label: 'Vzít hradby útokem',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.4, chanceBonus: warBonus, bonusLabel: 'Vojsko v poli', noInjury: true,
        onSuccess: { effects: { prestige: 3 }, war: { progress: 45, morale: 10, power: -4, won: true }, music: 'battle', chronicle: 'Žebříky se opřely o hradby a první muži byli nahoře dřív, než obránci stačili shodit kameny. Pevnost padla.' },
        onFailure: { war: { progress: 5, morale: -15, power: -8, wound: 0.35 }, music: 'battle', chronicle: 'Útok na hradby skončil masakrem v příkopu. Obránci jásali až do noci.' },
      },
      {
        label: 'Vyhladovět je',
        hintType: 'trait', hintKey: 'patience',
        effects: { food: -4 },
        war: { progress: 20, morale: -6 },
        chronicle: 'Vojsko obklíčilo pevnost a čekalo. Z hradeb byl slyšet hlad a z tábora nuda.',
      },
      {
        label: 'Podkopat hradby',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.3, traitKey: 'intelligence', traitScale: 0.03, chanceBonus: warBonus, bonusLabel: 'Vojsko v poli',
        onSuccess: { war: { progress: 40, power: -1, won: true }, chronicle: 'Horníci vykopali štolu pod nárožní věží a zapálili trámy. Věž se zřítila i s kusem hradby.' },
        onFailure: { war: { morale: -8, power: -3 }, chronicle: 'Obránci podkop objevili a zaplavili ho vodou. Horníci se už nevrátili.' },
      },
    ],
  },

  {
    id: 'w_nemoc',
    scenarios: REALM, forced: true,
    image: img('mor_v_pristavu'),
    title: 'Úplavice v táboře',
    text: 'V táboře se šíří úplavice. Ráno nevstalo dvacet mužů, večer jich bylo čtyřicet. Kdo ještě stojí, dívá se směrem k domovu.',
    choices: [
      {
        label: 'Spálit nakažené stany',
        hintType: 'trait', hintKey: 'strength',
        war: { power: -2, morale: -5 },
        chronicle: 'Stany nemocných shořely i s tím, co v nich bylo. Nemoc se zastavila a vojáci mlčeli.',
      },
      {
        label: 'Poslat nemocné domů',
        hintType: 'trait', hintKey: 'patience',
        war: { power: -4, morale: 6 },
        chronicle: 'Vozy s nemocnými odjely domů. Zbytek vojska ví, že na něj vrchnost nezapomene.',
      },
      {
        label: 'Nechat ranhojiče pracovat',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.35, traitKey: 'intelligence', traitScale: 0.03,
        onSuccess: { war: { morale: 2 }, chronicle: 'Ranhojiči rozdělili tábor a vařili vodu. Za týden bylo po všem.' },
        onFailure: { war: { power: -6, morale: -12 }, chronicle: 'Ranhojiči nestačili. Hroby u tábora se táhly až k lesu.' },
      },
    ],
  },

  {
    id: 'w_dezerce',
    scenarios: REALM, forced: true,
    image: img('dezerteri'),
    title: 'Dezertéři',
    text: 'Stráže chytily šest mužů, kteří v noci utíkali z tábora. Prý mají doma hladové děti a pole bez rukou. Celé vojsko čeká, co s nimi bude.',
    choices: [
      {
        label: 'Pověsit je před nastoupeným vojskem',
        hintType: 'trait', hintKey: 'strength',
        war: { morale: 4, power: -1 },
        hiddenEffects: { setFlag: 'harsh_ruler' },
        chronicle: 'Šest těl viselo u brány tábora tři dny. Nikdo další už neutekl.',
      },
      {
        label: 'Přidat vojsku žold',
        requires: gold(6),
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -6 },
        war: { morale: 12 },
        chronicle: 'Dezertéři dostali výprask a celé vojsko přidaný žold. Kdo má plný měšec, neutíká.',
      },
      {
        label: 'Nechat je jít',
        hintType: 'trait', hintKey: 'patience',
        war: { power: -4, morale: -2 },
        chronicle: 'Dezertéry pustili domů. Ještě té noci se k nim přidali další.',
      },
    ],
  },

  {
    id: 'w_mir',
    scenarios: REALM, forced: true,
    image: img('cizi_vyslanec'),
    title: 'Posel s bílou korouhví',
    text: 'Z nepřátelského tábora přijel posel s bílou korouhví. Nepřítel nabízí výkupné a mír dřív, než tažení dojde do konce. Muži by šli rádi domů, ale vítězství je na dosah.',
    choices: [
      {
        label: 'Přijmout výkupné a mír',
        hintType: 'trait', hintKey: 'eloquence',
        war: { end: 'peace' },
        chronicle: 'Mír byl zpečetěn podáním ruky. Vojsko se vrací domů s měšcem výkupného.',
      },
      {
        label: 'Bojovat dál',
        hintType: 'trait', hintKey: 'strength',
        war: { progress: 5, morale: -4 },
        chronicle: 'Posel odjel s nepořízenou. Válka pokračuje.',
      },
      {
        label: 'Žádat dvojnásobek',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.2, traitKey: 'eloquence', traitScale: 0.04, chanceBonus: warBonus, bonusLabel: 'Vojsko v poli',
        onSuccess: { effects: { gold: 10 }, war: { end: 'peace' }, chronicle: 'Nepřítel zaplatil dvakrát tolik, jen aby měl pokoj. Vyjednávání se zapíše do kroniky.' },
        onFailure: { war: { morale: -6 }, chronicle: 'Posel se urazil a odjel. Nepřítel se rozhodl bránit do posledního muže.' },
      },
    ],
  },

  {
    id: 'w_zasoby',
    scenarios: REALM, forced: true,
    image: img('hladomor'),
    title: 'Hladové vojsko',
    text: 'Vozy se zásobami nedorazily a vojáci jedí řemení. Kolem tábora jsou vsi s plnými stodolami — a kus cesty za zády domov.',
    choices: [
      {
        label: 'Plenit okolní vsi',
        hintType: 'trait', hintKey: 'strength',
        effects: { food: 8, prestige: -2, faith: -2 },
        war: { morale: 8 },
        chronicle: 'Vojsko vyplenilo okolní vsi. Hlad zmizel, ale kněží o tom kážou ještě dnes.',
      },
      {
        label: 'Poslat vozy ze sýpek',
        requires: (s) => s.resources.food >= 8,
        hintType: 'resource', hintKey: 'food',
        effects: { food: -8 },
        war: { morale: 6 },
        chronicle: 'Ze sýpek vyjela kolona vozů. Doma se bude utahovat opasek, ale vojsko vydrží.',
      },
      {
        label: 'Stáhnout vojsko domů',
        hintType: 'trait', hintKey: 'patience',
        war: { end: 'retreat' },
        chronicle: 'Hlad rozhodl za {R:vládce|vládkyni}. Vojsko se stahuje domů.',
      },
    ],
  },

  {
    id: 'w_hrdina',
    scenarios: REALM, forced: true,
    image: img('potulny_rytir'),
    title: 'Hrdina z řad pěšáků',
    text: 'Mladý pěšák sám zastavil nepřátelský výpad a vynesl z boje raněného praporečníka. Celé vojsko o něm mluví. Možná je to právě to, co muži potřebují.',
    choices: [
      {
        label: 'Pasovat ho na rytíře před celým vojskem',
        hintType: 'resource', hintKey: 'prestige',
        effects: { prestige: 2 },
        war: { morale: 15 },
        chronicle: 'Před nastoupeným vojskem poklekl syn sedláka a vstal jako rytíř. Muži křičeli, až se třásl les.',
      },
      {
        label: 'Dát mu měšec zlata',
        requires: gold(4),
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -4 },
        war: { morale: 8 },
        chronicle: 'Hrdina dostal měšec zlata a jeho kumpáni pití na tři dny.',
      },
      {
        label: 'Poslat ho v čele příštího útoku',
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.5, chanceBonus: warBonus, bonusLabel: 'Vojsko v poli', noInjury: true,
        onSuccess: { war: { progress: 15, morale: 10, won: true }, chronicle: 'Hrdina vedl útok a muži šli za ním jako jeden. Nepřítel ustoupil o celé údolí.' },
        onFailure: { war: { morale: -8, power: -1 }, chronicle: 'Hrdina padl v prvním útoku. Jeho smrt vzala vojsku víc než jednoho muže.' },
      },
    ],
  },

  {
    id: 'w_zved',
    scenarios: REALM, forced: true,
    image: img('zprava_spehmistra'),
    title: 'Zvěd s mapou',
    text: 'Do tábora přišel muž, který tvrdí, že zná tajnou cestu nepříteli do týlu. Mapu ukáže, ale ne zadarmo. Může to být zlato — nebo past.',
    choices: [
      {
        label: 'Zaplatit mu',
        requires: gold(5),
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -5 },
        war: { progress: 15 },
        chronicle: 'Zvěd dostal zlato a vojsko cestu, o které nepřítel nevěděl.',
      },
      {
        label: 'Vyslechnout ho na mučidlech',
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.5, noInjury: true,
        onSuccess: { war: { progress: 15 }, hiddenEffects: { setFlag: 'harsh_ruler' }, chronicle: 'Zvěd na skřipci prozradil cestu zadarmo. A pak už nic dalšího.' },
        onFailure: { war: { morale: -4 }, hiddenEffects: { setFlag: 'harsh_ruler' }, chronicle: 'Zvěd na skřipci lhal, až se hory zelenaly. Cesta vedla do bažin.' },
      },
      {
        label: 'Poslat ho pryč, může to být past',
        hintType: 'trait', hintKey: 'intelligence',
        war: { morale: 2 },
        chronicle: 'Zvěd odešel. Kdo ví, co by mapa ukázala.',
      },
    ],
  },

  // ---------- after the campaign ----------
  {
    id: 'w_triumf',
    scenarios: REALM, forced: true,
    image: img('vojenska_prehlidka'),
    title: 'Vítězné vojsko se vrací',
    text: 'Vojsko se vrací z tažení {war.loc}. Prapory jsou potrhané, ale vlají vysoko, a za vojskem se táhnou vozy s kořistí. Lidé lemují cestu a čekají, co vrchnost udělá.',
    choices: [
      {
        label: 'Uspořádat triumfální průvod',
        requires: gold(6),
        hintType: 'resource', hintKey: 'prestige',
        effects: { gold: -6, prestige: 4, stability: 2 },
        chronicle: 'Vítězný průvod prošel až k hradu. Lidé házeli pod koně květiny a o vítězství se zpívá v každé krčmě.',
      },
      {
        label: 'Rozdělit kořist mezi vojáky',
        hintType: 'resource', hintKey: 'army',
        effects: { gold: -3, army: 3 },
        chronicle: 'Každý voják dostal podíl z kořisti. Do příští války se bude verbovat snadno.',
      },
      {
        label: 'Poslat muže hned na pole',
        hintType: 'resource', hintKey: 'food',
        effects: { food: 5 },
        chronicle: 'Žádné slavnosti. Muži odložili meče a vzali do rukou kosy — úroda nepočká.',
      },
    ],
  },

  {
    id: 'w_porazka',
    scenarios: REALM, forced: true,
    image: img('stary_rytir_umira'),
    title: 'Po porážce',
    text: 'Z tažení {war.loc} se vrací jen zbytek vojska. Vdovy stojí u brány a hledají známé tváře. Někdo musí za porážku odpovídat — nebo ji aspoň unést.',
    choices: [
      {
        label: 'Postarat se o vdovy a sirotky',
        requires: gold(4),
        hintType: 'resource', hintKey: 'stability',
        effects: { gold: -4, stability: 3, faith: 1 },
        chronicle: 'Vdovy padlých dostaly podporu z pokladny. Porážka bolí, ale nikdo neříká, že vrchnost zapomněla.',
      },
      {
        label: 'Najít viníka mezi veliteli',
        hintType: 'trait', hintKey: 'strength',
        effects: { prestige: 2 },
        courtEffects: { marshal: { loyalty: -12 } },
        chronicle: 'Vina padla na velitele. Maršál mlčel, ale pamatuje si to.',
      },
      {
        label: 'Unést to mlčky',
        hintType: 'trait', hintKey: 'patience',
        traitGain: 'patience',
        chronicle: 'Žádné výmluvy. Porážka se zapsala do kroniky tak, jak se stala.',
      },
    ],
  },
];
