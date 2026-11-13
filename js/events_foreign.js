// Storylines that come from the foreign realms (realms.js): chains of linked
// events, one step leading to the next through flags and a minimum delay, with
// earlier choices changing what later steps offer. Each stage of the career sees
// the world beyond the border from its own height:
//
//   Sedlák   zenon_*  a merchant from the Southern Empire and his sealed chest
//            sever_*  rumours of a northern raid, a stranger in the snow, the raid
//   Šlechtic racci_*  a border quarrel with the Eastern Marches over an islet, smuggling, a meeting
//            bjarn_*  a northern chief who seeks an ally against the great chief
//   Panovník jih_*    an embassy, a loan and its due date from the Southern Empire
//            trun_<realm>_*  a crown abroad changes hands and a claimant asks the king for help
//
// Flags carry over between stages: a peasant who kept Zénon's chest meets him again
// as the southern envoy (zenon_dluh), the sign a northern guest carved on the gate
// opens Bjarn's heart (sever_znameni), and old friends abroad (marky_pritel,
// bjarn_pritel, zenon_dluh) help a claimant to a foreign throne.
//
// Every step after the first is oneTime, waits a few seasons after the step before
// it (eventHistory) and carries a high weight so the story does not lose its thread.
// Stories about a realm stop once the king wears its crown or wars against it.

import { randInt, randomName } from './data.js';

const SED = 'sedlak';
const SLE = 'slechtic';
const PAN = 'panovnik';
const img = (id) => `assets/events/${id}.jpg`;

// a continuation should surface within a year or two: the pool of a peasant or a
// lord weighs ~20, the king's ~60
const NEXT_LOW = 5;
const NEXT_KING = 10;

const flag = (s, f) => !!(s.flags && s.flags[f]);
/** At least n seasons since the step `id` was played (false if it never was). */
const after = (s, id, n) => {
  const t = (s.eventHistory || {})[id];
  return t !== undefined && s.turn - t >= n;
};
const seen = (s, id) => (s.eventHistory || {})[id] !== undefined;
/** A realm still foreign (not under the player's crown) and not at war with the player. */
const abroad = (s, key) => !!(s.realms && s.realms[key] && s.realms[key].owner !== 'player') && !(s.war && s.war.target === key);
const kingAtHand = (s) => !!(s.king && s.king.alive) && !s.flags.rebellion;
const heirFree = (s, age = 12) => !!(s.heir && s.heir.alive && s.heir.age >= age) && !s.flags.heir_married && !s.flags.royal_match;
const gold = (n) => (s) => s.resources.gold >= n;

// ============================================================================
// SEDLÁK — the world seen from below
// ============================================================================

const ZENON = [
  {
    id: 'zenon_1',
    scenario: SED, oneTime: true, minTurn: 6, weight: 0.6, seasons: [0, 1, 2],
    image: img('kupci_z_jihu'),
    title: 'Kupec v blátě',
    text: 'Na rozbité cestě za Lipnicí uvázl v blátě vůz s plachtou barvy vína. Kupec v plášti s vyšívaným lemem se jmenuje Zénon a přijel až z Jižní říše, kde vládne {realm.south}. Kolo je napůl prasklé, jeho dva sluhové bezradně klejí cizí řečí a nad lesem se stahují mraky.',
    choices: [
      {
        label: 'Pomoct mu s kolem a nic za to nechtít',
        hintType: 'trait', hintKey: 'patience',
        effects: { prestige: 1 }, hiddenEffects: { setFlag: 'zenon_pritel' },
        chronicle: '{ruler.name} {R:pomohl|pomohla} cizímu kupci z jihu vyprostit vůz a spravit kolo. Zénon odjížděl s úklonou a se slibem, že na Lipnici nezapomene.',
      },
      {
        label: 'Pomoct, ale za pořádný groš',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 4 }, hiddenEffects: { setFlag: 'zenon_znamy' },
        chronicle: 'Kolo bylo spravené do soumraku a Zénon zaplatil bez smlouvání. Prý si poctivou práci za poctivé peníze pamatuje.',
      },
      {
        label: 'V noci mu z vozu ulehčit o balík',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.5, traitKey: 'intelligence', traitScale: 0.05,
        onSuccess: { effects: { gold: 7 }, hiddenEffects: { setFlag: 'zenon_okraden' }, chronicle: 'Ráno kupec odjel na spraveném voze a o jeden balík lehčí. V balíku byl pepř — a za pepř se v Brodě platí stříbrem.' },
        onFailure: { effects: { prestige: -3, favor: -2 }, chronicle: 'Sluha se v noci probudil a křičel tak, že vzbudil půl vsi. {ruler.name} {R:utekl|utekla} s prázdnýma rukama a Lipnice má o čem mluvit.' },
      },
      {
        label: 'Nechat ho být, cizí starosti nejsou tvoje',
        hintType: 'resource', hintKey: 'stability',
        effects: {},
        chronicle: 'Kupec z jihu zůstal na cestě sám. Kdo mu nakonec pomohl, se v Lipnici nikdo nedozvěděl.',
      },
    ],
  },
  {
    id: 'zenon_2b',
    scenario: SED, oneTime: true, weight: NEXT_LOW,
    requires: (s) => flag(s, 'zenon_okraden') && after(s, 'zenon_1', 3),
    image: img('p_krcma_drab'),
    title: 'Ztracený balík',
    text: 'Do Lipnice přijel jezdec v cizích barvách a s ním rychtář. Kupec Zénon z Jižní říše prý pohřešuje balík pepře a slíbil odměnu tomu, kdo zloděje ukáže. Rychtář chodí od chalupy k chalupě a u tvých vrat se zastavil o chvíli déle, než bylo nutné.',
    choices: [
      {
        label: 'Přiznat se a nabídnout náhradu',
        hintType: 'trait', hintKey: 'eloquence',
        effects: { gold: -6, prestige: -1 }, hiddenEffects: { clearFlag: 'zenon_okraden', setFlag: 'zenon_znamy' },
        chronicle: '{ruler.name} {R:vrátil|vrátila} pepř i s groši navrch. Jezdec se zasmál: kupec Zénon si prý poctivých zlodějů cení víc než poctivých lhářů.',
      },
      {
        label: 'Svést to na tuláky z cesty',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.5, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { faith: -2 }, hiddenEffects: { clearFlag: 'zenon_okraden' }, chronicle: 'Rychtář přikývl a jezdec odjel hledat tuláky. Pepř zůstal v komoře a svědomí v kapse.' },
        onFailure: { effects: { gold: -8, prestige: -4, favor: -4 }, hiddenEffects: { clearFlag: 'zenon_okraden' }, chronicle: 'Rychtář lži neuvěřil a pepř se našel pod slámou. Pokuta, ostuda a k tomu panský dráb, který si tě zapamatoval.' },
      },
      {
        label: 'Podplatit rychtáře',
        requires: gold(3),
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -3 }, hiddenEffects: { clearFlag: 'zenon_okraden' },
        chronicle: 'Rychtář dostal tři groše a u tvých vrat najednou nic zvláštního neviděl.',
      },
    ],
  },
  {
    id: 'zenon_2',
    scenario: SED, oneTime: true, weight: NEXT_LOW,
    requires: (s) => (flag(s, 'zenon_pritel') || flag(s, 'zenon_znamy')) && after(s, 'zenon_1', 4) && (!seen(s, 'zenon_2b') || after(s, 'zenon_2b', 3)),
    image: img('f_karavana'),
    title: 'Zapečetěná truhla',
    text: 'Zénon se vrátil. Tentokrát má vozy tři a na prstech víc prstenů než posledně. U tvého stolu postaví malou okovanou truhlu se zapečetěným zámkem: potřebuje ji na zimu nechat u někoho, komu věří, a nechce, aby o ní {L:věděl pán|věděla paní} nebo {L:jeho|její} výběrčí. Za službu nabízí stříbro a za mlčení ještě víc.',
    choices: [
      {
        label: 'Schovat truhlu a na nic se neptat',
        requires: (s) => flag(s, 'zenon_pritel'),
        hintType: 'trait', hintKey: 'patience',
        effects: { gold: 6 }, hiddenEffects: { setFlag: 'zenon_truhla' },
        chronicle: 'Okovaná truhla zmizela pod podlahou chléva. Zénon zaplatil předem a stisk jeho ruky byl pevný jako u bratra.',
      },
      {
        label: 'Schovat truhlu a na nic se neptat',
        requires: (s) => !flag(s, 'zenon_pritel'),
        hintType: 'trait', hintKey: 'patience',
        effects: { gold: 4 }, hiddenEffects: { setFlag: 'zenon_truhla' },
        chronicle: 'Okovaná truhla zmizela pod podlahou chléva. Zénon zaplatil, co slíbil, ani o groš víc — obchod je obchod.',
      },
      {
        label: 'Vzít ji, ale potají nahlédnout dovnitř',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.5, traitKey: 'intelligence', traitScale: 0.05,
        onSuccess: { effects: { gold: 4 }, hiddenEffects: { setFlag: ['zenon_truhla', 'zenon_vi'] }, chronicle: 'Pečeť šla nahřát a zase přitlačit. V truhle leželo jižní stříbro ražené s tváří, kterou tady nikdo nezná, a svazek dopisů. Nikdo kromě tebe to neví.' },
        onFailure: { effects: { gold: 4 }, hiddenEffects: { setFlag: ['zenon_truhla', 'zenon_pecet'] }, chronicle: 'Pečeť pod nožem praskla. Uvnitř se lesklo cizí stříbro — a teď je na první pohled vidět, že do truhly někdo sahal.' },
      },
      {
        label: 'Odmítnout, s cizím zbožím jsou jen potíže',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 1 },
        chronicle: 'Zénon pokrčil rameny, poděkoval za pivo a odjel hledat někoho odvážnějšího.',
      },
    ],
  },
  {
    id: 'zenon_3',
    scenario: SED, oneTime: true, weight: NEXT_LOW,
    requires: (s) => flag(s, 'zenon_truhla') && after(s, 'zenon_2', 3),
    image: img('s_drab'),
    title: 'Drábova prohlídka',
    text: '{lord.Title} {lord.name} se doslechl{L:|a}, že přes panství prošlo jižní stříbro bez cla, a {L:jeho|její} dráb teď obrací vsi naruby. Do tvého dvora vešel s pacholky a s holí v ruce a prohledává seník, sklep i chlév. Zénonova truhla leží pod prkny, sotva tři kroky od jeho bot.',
    choices: [
      {
        label: 'Ukázat drábovi, kde truhla leží',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 8, gold: 2 }, hiddenEffects: { setFlag: 'zenon_zrazen', clearFlag: 'zenon_truhla' },
        chronicle: 'Truhla odjela na panský dvůr a {ruler.name} {R:dostal|dostala} {L:od pána|od paní} pochvalu a pár grošů. Zénon se už do Lipnice nevrátil.',
      },
      {
        label: 'Zapírat a doufat',
        requires: (s) => !flag(s, 'zenon_pecet'),
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.45, traitKey: 'eloquence', traitScale: 0.05,
        chanceBonus: (s) => (flag(s, 'zenon_vi') ? 0.1 : 0), bonusLabel: 'Víš, co skrýváš',
        onSuccess: { effects: { gold: 10, prestige: 2 }, hiddenEffects: { setFlag: 'zenon_dluh', clearFlag: 'zenon_truhla' }, chronicle: 'Dráb odešel s prázdnou. Za měsíc přijel Zénon, vyzvedl truhlu s nedotčenou pečetí a nechal na stole měšec stříbra. Prý je teď tvým dlužníkem — a dluhy splácí vždycky.' },
        onFailure: { effects: { favor: -10, gold: -5 }, hiddenEffects: { clearFlag: 'zenon_truhla' }, chronicle: 'Dráb truhlu našel. Pokuta vzala poslední groše a {lord.title} {lord.name} si rod {dynastyName} zapsal{L:|a} mezi ty, kterým se nevěří.' },
      },
      {
        label: 'Zapírat a doufat',
        requires: (s) => flag(s, 'zenon_pecet'),
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.45, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { gold: 4 }, hiddenEffects: { clearFlag: 'zenon_truhla' }, chronicle: 'Dráb odešel s prázdnou. Zénon si pro truhlu přijel za měsíc, dlouho se díval na prasklou pečeť a pak beze slova nechal na stole pár mincí. Víc se neukázal.' },
        onFailure: { effects: { favor: -10, gold: -5 }, hiddenEffects: { clearFlag: 'zenon_truhla' }, chronicle: 'Dráb truhlu našel. Pokuta vzala poslední groše a {lord.title} {lord.name} si rod {dynastyName} zapsal{L:|a} mezi ty, kterým se nevěří.' },
      },
      {
        label: 'Podplatit drába',
        requires: (s) => s.resources.gold >= 5 && !flag(s, 'zenon_pecet'),
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 5 }, hiddenEffects: { setFlag: 'zenon_dluh', clearFlag: 'zenon_truhla' },
        chronicle: 'Dráb shrábl pět grošů a ve chlévě si všiml jen hnoje. Když si Zénon přijel pro truhlu, vrátil úplatek dvakrát a řekl, že takové přátele hledá i za mořem.',
      },
      {
        label: 'Podplatit drába',
        requires: (s) => s.resources.gold >= 5 && flag(s, 'zenon_pecet'),
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -5 }, hiddenEffects: { clearFlag: 'zenon_truhla' },
        chronicle: 'Dráb shrábl pět grošů a ve chlévě si všiml jen hnoje. Zénon si truhlu vyzvedl, uviděl prasklou pečeť a úplatek nevrátil.',
      },
    ],
  },
];

const SEVER = [
  {
    id: 'sever_1',
    scenario: SED, oneTime: true, minTurn: 4, weight: 0.6, seasons: [2, 3],
    requires: (s) => abroad(s, 'north'),
    image: img('zvedove_v_horach'),
    title: 'Zvěsti z hor',
    text: 'Do krčmy v Lipnici dorazil vozka, který vozí sůl přes Železný hřeben. Vypráví, že severní nájezdníci sestoupili z hor a vypálili dvě vsi pod průsmykem. Prý je posílá {N:sám|sama} {realm.north} — nebo jim aspoň nebrání. Sousedé mlčí nad pivem a každý počítá, kolik má v komoře.',
    choices: [
      {
        label: 'Zakopat část obilí v lese',
        hintType: 'resource', hintKey: 'food',
        effects: { food: -3 }, hiddenEffects: { setFlag: ['sever_zvest', 'sever_skrys'] },
        chronicle: 'Za noci {ruler.name} {R:odnesl|odnesla} pytle obilí do jámy pod starým dubem. Kdo neví kde, nenajde.',
      },
      {
        label: 'Svolat sousedy a zpevnit ohradu',
        hintType: 'resource', hintKey: 'army',
        effects: { gold: -2, stability: 2 }, hiddenEffects: { setFlag: ['sever_zvest', 'sever_hradba'] },
        chronicle: 'Lipničtí zatloukli kolem návsi kůly a u zvonice drží hlídku. Smějí se tomu, ale spí klidněji.',
      },
      {
        label: 'Zajít to oznámit {L:pánovi|paní}',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 3 }, hiddenEffects: { setFlag: ['sever_zvest', 'sever_pan'] },
        chronicle: '{lord.Title} {lord.name} zprávu vyslechl{L:|a} a slíbil{L:|a} poslat na hřeben pár ozbrojenců. Sliby panstva jsou ale jako jarní led.',
      },
      {
        label: 'Mávnout rukou, hory jsou daleko',
        hintType: 'trait', hintKey: 'patience',
        effects: {}, hiddenEffects: { setFlag: 'sever_zvest' },
        chronicle: '„Na severu se pálí vsi každou zimu,“ {R:řekl|řekla} {ruler.name} a {R:objednal|objednala} si další pivo.',
      },
    ],
  },
  {
    id: 'sever_2',
    scenario: SED, oneTime: true, weight: NEXT_LOW, seasons: [3, 0],
    requires: (s) => flag(s, 'sever_zvest') && after(s, 'sever_1', 2),
    image: img('kruta_zima'),
    title: 'Cizinec ve sněhu',
    text: 'Za humny {R:jsi našel|jsi našla} v závěji muže ve vlčí kožešině. Má rozseknuté rameno, vlasy spletené do copů a na krku amulet z medvědího zubu — Severan. Když otevře oči, sáhne po noži, který už nemá. Cizí řečí opakuje jediné slovo a ukazuje k horám.',
    choices: [
      {
        label: 'Odnést ho do chalupy a ošetřit',
        hintType: 'resource', hintKey: 'faith',
        effects: { food: -3, faith: 3 }, hiddenEffects: { setFlag: 'sever_host' },
        chronicle: 'Severan ležel u pece celý měsíc. Když odcházel, vyřezal nožem do veřejí vrat podivné znamení a beze slova zmizel v lesích.',
      },
      {
        label: 'Svázat ho a odvést panskému drábovi',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 5, gold: 2 }, hiddenEffects: { setFlag: 'sever_vydan' },
        chronicle: 'Severana odvezli na panský dvůr v řetězech. Za zajatce z hor {L:dal pán|dala paní} odměnu — a ves si šeptá, že nájezdníci si pro své chodí.',
      },
      {
        label: 'Dát mu chleba a poslat ho pryč',
        hintType: 'trait', hintKey: 'patience',
        effects: { food: -1 },
        chronicle: 'Cizinec vzal chleba, kývl a odklopýtal do bílé tmy. Jestli došel domů, nikdo neví.',
      },
    ],
  },
  {
    id: 'sever_3',
    scenario: SED, oneTime: true, weight: NEXT_LOW, music: 'battle',
    requires: (s) => flag(s, 'sever_zvest') && after(s, 'sever_2', 2),
    image: img('pohranicni_najezd'),
    title: 'Nájezdníci ze severu',
    text: 'Za svítání se rozezněl zvon. Z lesa vyjela tlupa jezdců v kožešinách — hrstka, která se po nájezdu na hřeben zatoulala hluboko do země a teď hledá, co odvézt domů. Míří přímo k Lipnici a tvůj dvůr stojí na kraji vsi jako první.',
    choices: [
      {
        label: 'Postavit se ve vratech se sekerou',
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.4, traitKey: 'strength', traitScale: 0.05,
        chanceBonus: (s) => (flag(s, 'sever_hradba') ? 0.15 : 0) + (flag(s, 'sever_pan') ? 0.1 : 0), bonusLabel: 'Připravená ves',
        onSuccess: { effects: { prestige: 5 }, hiddenEffects: { setFlag: 'sever_ubraneno' }, chronicle: 'Nájezdníci narazili na sekery a na zvon, který nepřestal bít. Odtáhli s prázdnou a v Lipnici se o tom bude vyprávět ještě vnukům.' },
        onFailure: { effects: { food: -10, army: -2, stability: -5 }, chronicle: 'Jezdci přeskočili ohradu dřív, než se ves stačila sejít. Odvezli obilí, dobytek i dva čeledíny a za sebou nechali kouř.' },
      },
      {
        label: 'Utéct s rodinou do lesa ke skrýši',
        requires: (s) => flag(s, 'sever_skrys'),
        hintType: 'trait', hintKey: 'patience',
        effects: { stability: -4, food: 4 },
        chronicle: 'Dvůr byl vyrabován, ale obilí pod starým dubem nikdo nenašel. Do jara bylo co jíst.',
      },
      {
        label: 'Ukázat jim znamení na vratech',
        requires: (s) => flag(s, 'sever_host'),
        hintType: 'trait', hintKey: 'eloquence',
        effects: { prestige: 3 }, hiddenEffects: { setFlag: 'sever_znameni' },
        chronicle: 'Vůdce tlupy uviděl znamení vyřezané na veřejích, dlouho se díval do tvé tváře a pak obrátil koně. Tvůj dvůr minuli. Od té doby se v Lipnici říká, že rod {dynastyName} má přátele až za horami.',
      },
      {
        label: 'Dát jim, co chtějí, a zachránit dvůr',
        hintType: 'resource', hintKey: 'food',
        effects: { food: -8 },
        chronicle: 'Nájezdníci si naložili obilí a slaninu a odjeli. Chalupa zůstala stát a nikdo nepřišel o život — tentokrát.',
      },
    ],
  },
];

// ============================================================================
// ŠLECHTIC — envoys, smugglers, border quarrels and a chief from the north
// ============================================================================

const RACCI = [
  {
    id: 'racci_1',
    scenario: SLE, oneTime: true, weight: 0.5,
    requires: (s) => abroad(s, 'east'),
    image: img('spor_rybaru'),
    title: 'Racčí ostrov',
    text: 'Správce přístavu přinesl zlou zprávu: na Racčím ostrově, kde tvoji rybáři odjakživa suší sítě, stojí nové chýše a nad nimi vlaje prapor Východních marek. Postavili je lidé markraběte Dětřicha, jednoho z mocných pánů země, kde vládne {realm.east}. Tvým rybářům vzkázali, že ostrov patří Markám a ryby kolem něj taky.',
    choices: [
      {
        label: 'Vyslat ozbrojence a chýše spálit',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.55, resourceKey: 'army', resourceScale: 0.3,
        onSuccess: { effects: { prestige: 4, army: -1 }, realm: { east: { attitude: -8 } }, hiddenEffects: { setFlag: ['racci', 'racci_sila'] }, chronicle: 'Za úsvitu přistály u ostrova tři čluny s ozbrojenci. Chýše shořely, prapor Marek skončil v moři a markští rybáři odveslovali domů.' },
        onFailure: { effects: { army: -4, prestige: -3 }, realm: { east: { attitude: -8 } }, hiddenEffects: { setFlag: ['racci', 'racci_sila'] }, chronicle: 'Markrabětovi lidé čekali s kušemi. Čluny se vrátily s raněnými a ostrov zůstal pod cizím praporem.' },
      },
      {
        label: 'Napsat markraběti a navrhnout jednání',
        hintType: 'trait', hintKey: 'eloquence',
        effects: { prestige: -1 }, realm: { east: { attitude: 4 } }, hiddenEffects: { setFlag: ['racci', 'racci_jednani'] },
        chronicle: 'Dopis s pečetí rodu {dynastyName} odplul do Marek. Odpověď byla zdvořilá a nic neslibovala, ale další chýše zatím nikdo nestaví.',
      },
      {
        label: 'Stěžovat si u královského dvora',
        requires: kingAtHand,
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 2 }, hiddenEffects: { setFlag: ['racci', 'racci_kral'] },
        chronicle: 'Stížnost doputovala do Vlčího Údělu. {king.Title} {king.name} slíbil{K:|a} věc probrat s vyslanci Marek — až na ni přijde řada.',
      },
      {
        label: 'Nechat ostrov ostrovem',
        hintType: 'trait', hintKey: 'patience',
        effects: { prestige: -2 }, hiddenEffects: { setFlag: ['racci', 'racci_ustup'] },
        chronicle: 'Rybáři z panství teď suší sítě o míli dál. Na tvrzi se o Racčím ostrově raději nemluví.',
      },
    ],
  },
  {
    id: 'racci_2',
    scenario: SLE, oneTime: true, weight: NEXT_LOW,
    requires: (s) => flag(s, 'racci') && after(s, 'racci_1', 4) && abroad(s, 'east'),
    image: img('pirati'),
    title: 'Pašeráci v zátoce',
    text: 'Racčí ostrov našel nové využití. V noci u něj přistávají čluny z Marek naložené solí a železem, které pak potichu mizí v tvém přístavu — bez cla, o které přichází královská pokladna. Na tvrz přišel muž s markským přízvukem a měšcem u pasu: markrabě Dětřich prý nabízí podíl, když se tvoji strážní budou dívat jinam.',
    choices: [
      {
        label: 'Přijmout podíl a dívat se jinam',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 12 }, realm: { east: { attitude: 4 } }, hiddenEffects: { setFlag: 'racci_podil' },
        chronicle: 'Měšec zůstal na stole a strážní v přístavu se naučili dívat na moře jen ve dne.',
      },
      {
        label: 'Zabavit čluny i se zbožím',
        hintType: 'resource', hintKey: 'army',
        effects: { gold: 8, favor: 3 }, realm: { east: { attitude: -6 } }, hiddenEffects: { setFlag: 'racci_zabaveno' },
        chronicle: 'Strážní počkali na noc a zabavili dva čluny i se solí. Sůl se prodala v Brodu, pašeráci skončili v kobce a markrabě Dětřich zuří.',
      },
      {
        label: 'Udat pašeráky královským výběrčím',
        requires: kingAtHand,
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 6, gold: -2 }, realm: { east: { attitude: -4 } }, hiddenEffects: { setFlag: 'racci_udal' },
        chronicle: 'Královští výběrčí obsadili přístav a celou zimu prohledávali každý člun. Pašování ustalo — a s ním i obchod, ze kterého žila půlka přístavu.',
      },
    ],
  },
  {
    id: 'racci_3',
    scenario: SLE, oneTime: true, weight: NEXT_LOW,
    requires: (s) => flag(s, 'racci') && after(s, 'racci_2', 4) && abroad(s, 'east'),
    image: img('hranicni_kamen'),
    title: 'Schůzka na ostrově',
    text: 'Markrabě Dětřich vzkázal, že chce spor o Racčí ostrov skončit tváří v tvář. Sešli jste se na ostrově mezi sítěmi a racky, každý s hrstkou mužů. Dětřich je statný a prošedivělý, mluví přímo a ruku drží blízko jílce. Prý ho posílá i {realm.east}: v Markách se nechtějí kvůli kusu skály hádat s rodem, o kterém se mluví až ve Vlčím Údělu.',
    choices: [
      {
        label: 'Rozdělit ostrov i loviště napůl',
        hintType: 'trait', hintKey: 'patience',
        effects: { prestige: 1, stability: 2 }, realm: { east: { attitude: 8 } }, hiddenEffects: { setFlag: 'racci_mir' },
        chronicle: 'Na ostrově vztyčili hraniční kámen. Severní pláž patří Markám, jižní rybářům rodu {dynastyName} a ryby si moře rozdělí samo.',
      },
      {
        label: 'Navrhnout zasnoubení dědice s markrabětovým dítětem',
        requires: (s) => heirFree(s, 12),
        hintType: 'resource', hintKey: 'legitimacy',
        effects: { prestige: 4, legitimacy: 3, gold: 8 }, realm: { east: { attitude: 12 } }, hiddenEffects: { setFlag: ['racci_mir', 'heir_married'] },
        chronicle: '{heir.name} byl{D:|a} zasnouben{D:|a} s dítětem markraběte Dětřicha. Racčí ostrov dostanou novomanželé jako svatební dar a spor je u konce.',
      },
      {
        label: 'Připomenout mu pašování a chtít víc',
        requires: (s) => flag(s, 'racci_podil'),
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.5, traitKey: 'intelligence', traitScale: 0.05,
        onSuccess: { effects: { gold: 15 }, realm: { east: { attitude: -2 } }, hiddenEffects: { setFlag: 'racci_mir' }, chronicle: 'Dětřich zbledl a pak se rozesmál. Ostrov zůstane jeho, ale podíl z pašování se zdvojnásobil — dokud se nikdo neptá.' },
        onFailure: { effects: { prestige: -3 }, realm: { east: { attitude: -8 } }, chronicle: 'Dětřich se vydírat nenechal. Odplul se slovy, že o pašování ví v Markách každý — a brzy se to dozví i ve Vlčím Údělu.' },
      },
      {
        label: 'Vyzvat markraběte na souboj o ostrov',
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.45, traitKey: 'strength', traitScale: 0.05,
        onSuccess: { effects: { prestige: 8 }, realm: { east: { attitude: -5 } }, hiddenEffects: { setFlag: 'racci_vitez' }, chronicle: 'Meče se zkřížily na písku mezi sítěmi. Dětřich padl na kolena a uznal ostrov za tvůj. V Markách se o rodu {dynastyName} od té doby mluví s respektem — a se zlostí.' },
        onFailure: { effects: { prestige: -5 }, realm: { east: { attitude: -3 } }, chronicle: 'Dětřich byl rychlejší. Ostrov zůstal Markám a rod {dynastyName} si z písku odnesl jen jizvy.' },
      },
    ],
  },
  {
    id: 'racci_4a',
    scenario: SLE, oneTime: true, weight: NEXT_LOW,
    requires: (s) => flag(s, 'racci_podil') && after(s, 'racci_3', 4) && kingAtHand(s),
    image: img('n_kraluv_vybirci'),
    title: 'Výběrčí v přístavu',
    text: 'Do přístavu dorazili královští výběrčí s písařem, který umí počítat lépe než tví strážní. Z knih vyčetli, kolik soli a železa z Marek prošlo bez cla, a ptají se, kdo za to dostal zaplaceno. {king.Title} {king.name} chce odpověď do konce měsíce.',
    choices: [
      {
        label: 'Doplatit clo z vlastní pokladny',
        requires: gold(20),
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -20, favor: 2 }, hiddenEffects: { clearFlag: 'racci_podil' },
        chronicle: 'Rod {dynastyName} zaplatil celé clo i s úrokem. Výběrčí odjeli spokojeni a v přístavu se zase platí podle práva.',
      },
      {
        label: 'Přiznat vinu a prosit o milost',
        requires: (s) => s.resources.gold < 20,
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: -8, prestige: -3 }, hiddenEffects: { clearFlag: 'racci_podil' },
        chronicle: 'Rod {dynastyName} přiznal, co se v přístavu dělo, a prosil o milost. Pokladna zůstala, ale u dvora se teď na jeho erb dívají přes prsty.',
      },
      {
        label: 'Svést vinu na markraběte Dětřicha',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.5, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { favor: 3 }, realm: { east: { attitude: -12 } }, hiddenEffects: { clearFlag: 'racci_podil' }, chronicle: 'Písař zapsal, že pašeráky posílal markrabě Dětřich a strážní byli podplaceni bez vědomí pána. {king.Title} poslal{K:|a} do Marek ostrý dopis.' },
        onFailure: { effects: { favor: -12, legitimacy: -4, gold: -10 }, hiddenEffects: { clearFlag: 'racci_podil' }, chronicle: 'Markský pašerák, kterého si výběrčí podali, mluvil dřív, než ho kdokoli stačil umlčet. Rod {dynastyName} zaplatil pokutu a u dvora se o něm mluví jako o rodu pašeráků.' },
      },
      {
        label: 'Podplatit písaře',
        requires: gold(10),
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.6, traitKey: 'intelligence', traitScale: 0.04,
        onSuccess: { effects: { gold: -10 }, hiddenEffects: { clearFlag: 'racci_podil' }, chronicle: 'Písař našel v knihách chybu ve sčítání. Výběrčí odjeli a malou pokutu zaplatil správce přístavu.' },
        onFailure: { effects: { gold: -10, favor: -15 }, hiddenEffects: { clearFlag: 'racci_podil' }, chronicle: 'Písař úplatek přijal a pak ho ukázal výběrčím. Tohle {king.title} {king.name} jen tak neodpustí.' },
      },
    ],
  },
  {
    id: 'racci_4b',
    scenario: SLE, oneTime: true, weight: NEXT_LOW,
    requires: (s) => flag(s, 'racci_mir') && !flag(s, 'racci_podil') && after(s, 'racci_3', 4) && abroad(s, 'east'),
    image: img('cizi_vyslanec'),
    title: 'Dar z Marek',
    text: 'Z Marek připlula loď se zeleným praporem. Markrabě Dětřich posílá sud markského vína, ostrý meč z hvozdských hutí a zprávu: o rodu {dynastyName} vyprávěl na dvoře, kde vládne {realm.east}, a {realm.east.title} prý chce vědět, jaký je to rod, který umí jednat i bez meče.',
    choices: [
      {
        label: 'Poslat na markský dvůr dar a pozdrav',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -6, prestige: 3 }, realm: { east: { attitude: 10 } }, hiddenEffects: { setFlag: 'marky_pritel' },
        chronicle: 'Do Marek odplul sokol v pozlacené kleci. Na markském dvoře teď znají jméno rodu {dynastyName} — a vyslovují ho s úctou.',
      },
      {
        label: 'Pozvat markraběte na hon',
        hintType: 'trait', hintKey: 'eloquence',
        effects: { prestige: 2, gold: -3 }, realm: { east: { attitude: 6 } }, hiddenEffects: { setFlag: 'marky_pritel' },
        chronicle: 'Dětřich přijel na hon se psy a s historkami z markského dvora. Odjel jako přítel — a s tím, co zaslechl o Vlčím Údělu.',
      },
      {
        label: 'Dar přijmout a nic víc',
        hintType: 'trait', hintKey: 'patience',
        effects: { prestige: 1 },
        chronicle: 'Víno se vypilo, meč visí v síni. Přátelství s Markami je dobrá věc, ale nikdo nemusí vědět, jak dobrá.',
      },
    ],
  },
];

const BJARN = [
  {
    id: 'bjarn_1',
    scenario: SLE, oneTime: true, weight: 0.7, seasons: [3, 0],
    requires: (s) => abroad(s, 'north'),
    image: img('n_nabidka_spojenectvi'),
    title: 'Host z hor',
    text: 'Přes zasněžené průsmyky přijel na tvrz muž v medvědí kožešině a s ním dvanáct válečníků. Jmenuje se Bjarn a je náčelníkem kmene od Bílé řeky. {realm.north.Ruler} prý chce, aby se {N:mu|jí} poklonily všechny kmeny, a kdo nepoklekne, tomu hoří osady. Bjarn nežádá milost — hledá spojence na jih od hor, železo pro své muže a trh pro své kožešiny.',
    choices: [
      {
        label: 'Uzavřít s Bjarnem spojenectví',
        hintType: 'resource', hintKey: 'army',
        effects: { gold: -6, prestige: 3 }, realm: { north: { attitude: -6 } }, hiddenEffects: { setFlag: ['bjarn', 'bjarn_spojenec'] },
        chronicle: 'Bjarn a {ruler.name} si podali ruce nad ohněm. Na sever odjely vozy železa — a s nimi slib, který se v horách bere vážně.',
      },
      {
        label: 'Jen obchodovat, nic víc',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 6 }, hiddenEffects: { setFlag: ['bjarn', 'bjarn_obchod'] },
        chronicle: 'Kožešiny za železo, železo za kožešiny. Bjarn odjel s plnými vozy a bez slibů a na tvrzi zůstalo stříbro.',
      },
      {
        label: 'Dát vědět {N:velkému náčelníkovi|velké náčelnici}, kdo tu byl',
        hintType: 'trait', hintKey: 'intelligence',
        effects: { prestige: -1, gold: 4 }, realm: { north: { attitude: 10 } }, hiddenEffects: { setFlag: ['bjarn', 'bjarn_zrazen'] },
        chronicle: 'Bjarn odjel s prázdnou a za ním letěl posel s jeho jménem. Ze severu přišlo poděkování a měšec stříbra. Jestli Bjarn dojel domů, se na tvrzi neví.',
      },
      {
        label: 'Ukázat mu severské znamení z vrat v Lipnici',
        requires: (s) => flag(s, 'sever_znameni'),
        hintType: 'trait', hintKey: 'eloquence',
        effects: { prestige: 4 }, realm: { north: { attitude: -4 } }, hiddenEffects: { setFlag: ['bjarn', 'bjarn_spojenec', 'bjarn_pobratim'] },
        chronicle: 'Bjarn znamení poznal: vyřezal ho jeho bratr, kterého kdysi rod {dynastyName} vytáhl v Lipnici ze sněhu. Před celou síní tě objal a nazval pobratimem. Takové spojenectví se nekupuje železem.',
      },
    ],
  },
  {
    id: 'bjarn_2',
    scenario: SLE, oneTime: true, weight: NEXT_LOW,
    requires: (s) => (flag(s, 'bjarn_spojenec') || flag(s, 'bjarn_obchod')) && after(s, 'bjarn_1', 4) && abroad(s, 'north'),
    image: img('zvedove_v_horach'),
    title: 'Válka v horách',
    text: 'Z hor dorazil Bjarnův syn, promrzlý a s krví na rukávu. {realm.north.Ruler} táhne na Bílou řeku s celým vojskem kmenů a Bjarn se brání v posledním opevněném táboře. Posílá prosbu o pomoc: muže, zbraně, cokoli — a připomíná, že kdo drží průsmyky, ten drží i cestu na jih.',
    choices: [
      {
        label: 'Poslat do hor ozbrojence',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.5, resourceKey: 'army', resourceScale: 0.3,
        chanceBonus: (s) => (flag(s, 'bjarn_pobratim') ? 0.1 : 0), bonusLabel: 'Pobratimství',
        onSuccess: { effects: { army: -5, prestige: 5 }, realm: { north: { attitude: -10, power: -10 } }, hiddenEffects: { setFlag: 'bjarn_vitez' }, music: 'battle', chronicle: 'Tvoji muži udeřili na vojsko kmenů z boku, když to nikdo nečekal. Tábor u Bílé řeky vydržel a {realm.north} se stáhl{N:|a} za hory s polovinou válečníků.' },
        onFailure: { effects: { army: -8 }, realm: { north: { attitude: -12 } }, hiddenEffects: { setFlag: 'bjarn_padl' }, music: 'battle', chronicle: 'Pomoc přišla pozdě. Tábor u Bílé řeky hořel a z tvých mužů se domů vrátila sotva polovina.' },
      },
      {
        label: 'Poslat zbraně a stříbro',
        requires: gold(10),
        hintType: 'resource', hintKey: 'gold',
        isRoll: true, baseChance: 0.4,
        chanceBonus: (s) => (flag(s, 'bjarn_pobratim') ? 0.1 : 0), bonusLabel: 'Pobratimství',
        onSuccess: { effects: { gold: -10 }, realm: { north: { attitude: -6, power: -6 } }, hiddenEffects: { setFlag: 'bjarn_vitez' }, chronicle: 'Bjarnovi muži dostali sekery z hřebenských hutí a stříbro na žoldnéře. Tábor u Bílé řeky vydržel celou zimu, až to vojsko kmenů vzdalo.' },
        onFailure: { effects: { gold: -10 }, realm: { north: { attitude: -4 } }, hiddenEffects: { setFlag: 'bjarn_padl' }, chronicle: 'Stříbro a sekery dorazily k Bílé řece, ale Bjarn už neměl komu je rozdat.' },
      },
      {
        label: 'Odmítnout, tohle není tvoje válka',
        hintType: 'trait', hintKey: 'patience',
        effects: { prestige: -2 }, realm: { north: { attitude: 4 } }, hiddenEffects: { setFlag: 'bjarn_padl' },
        chronicle: 'Bjarnův syn odjel bez odpovědi, kterou chtěl slyšet. Na jaře se z hor doneslo, že tábor u Bílé řeky padl.',
      },
    ],
  },
  {
    id: 'bjarn_3a',
    scenario: SLE, oneTime: true, weight: NEXT_LOW,
    requires: (s) => flag(s, 'bjarn_vitez') && after(s, 'bjarn_2', 4),
    image: img('n_hostina_rodu'),
    title: 'Pán průsmyků',
    text: 'Bjarn přijel podruhé, tentokrát jako vítěz. Drží průsmyky nad Bílou řekou a kmeny, které dřív klečely před {N:velkým náčelníkem|velkou náčelnicí}, teď poslouchají jeho. Do síně nechal vnést stoh kožešin a postavil před tebe svého nejmladšího syna: ať vyrůstá na tvé tvrzi jako záruka, že sever na jih nezapomene.',
    choices: [
      {
        label: 'Přijmout chlapce a vychovat ho jako vlastního',
        hintType: 'trait', hintKey: 'patience',
        effects: { prestige: 4, stability: 2 }, hiddenEffects: { setFlag: 'bjarn_pritel' },
        chronicle: 'Bjarnův syn se na tvrzi učí číst a jezdit v sedle po jižansku. Dokud žije u rodu {dynastyName}, průsmyky zůstanou otevřené.',
      },
      {
        label: 'Chtít místo rukojmího válečníky',
        hintType: 'resource', hintKey: 'army',
        effects: { army: 6 }, hiddenEffects: { setFlag: 'bjarn_pritel' },
        chronicle: 'Bjarn se zasmál a nechal na tvrzi hrstku svých nejlepších sekerníků. Prý u tebe přečkají zimu a v boji se nezaleknou ničeho.',
      },
      {
        label: 'Chtít podíl z obchodu s kožešinami',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 14 }, hiddenEffects: { setFlag: 'bjarn_pritel' },
        chronicle: 'Kožešiny z průsmyků teď jdou na jih přes tvé sklady. Bjarn obchoduje poctivě a stříbro teče oběma směry.',
      },
    ],
  },
  {
    id: 'bjarn_3b',
    scenario: SLE, oneTime: true, weight: NEXT_LOW,
    requires: (s) => flag(s, 'bjarn_padl') && after(s, 'bjarn_2', 3),
    image: img('uprchlici'),
    title: 'Lidé od Bílé řeky',
    text: 'Na hranici tvého panství se objevily desítky lidí v cárech kožešin: ženy, děti a pár zjizvených válečníků. Jsou to poslední z Bjarnova kmene. Bjarn padl u Bílé řeky a {realm.north} vypsal{N:|a} odměnu za každého, kdo přežil. Prosí o kus země, na kterém by mohli zůstat.',
    choices: [
      {
        label: 'Usadit je v lesích na panství',
        hintType: 'resource', hintKey: 'faith',
        effects: { food: -6, faith: 3, army: 3 }, realm: { north: { attitude: -6 } },
        chronicle: 'Bjarnovi lidé vymýtili kus lesa a postavili si dlouhé domy. Za pár let z nich budou nejlepší myslivci v kraji.',
      },
      {
        label: 'Vzít do družiny jen válečníky',
        hintType: 'resource', hintKey: 'army',
        effects: { army: 5, faith: -2 }, realm: { north: { attitude: -3 } },
        chronicle: 'Zjizvení válečníci přísahali věrnost rodu {dynastyName}. Ženy a děti šly dál na jih a nikdo se neptal kam.',
      },
      {
        label: 'Vydat je {N:velkému náčelníkovi|velké náčelnici}',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 8, faith: -6, prestige: -2 }, realm: { north: { attitude: 12 } },
        chronicle: 'Bjarnovi lidé odešli v poutech na sever. Odměna dorazila včas a byla štědrá. Kněz na tvrzi o tom kázal celou zimu.',
      },
    ],
  },
  {
    id: 'bjarn_3c',
    scenario: SLE, oneTime: true, weight: NEXT_LOW,
    requires: (s) => flag(s, 'bjarn_zrazen') && after(s, 'bjarn_1', 4) && abroad(s, 'north'),
    image: img('n_cizi_posel'),
    title: 'Dar ze severu',
    text: 'Ze severu přijeli tři jezdci s darem: kožešinou bílého medvěda a stříbrnou přezkou se znamením kmene od Bílé řeky. {realm.north.Ruler} vzkazuje, že Bjarn už nikoho o spojenectví prosit nebude a že rod {dynastyName} si dobře vybral, komu poslat zprávu. Severský dvůr prý na přátele nezapomíná.',
    choices: [
      {
        label: 'Poslat na sever dar za dar',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -5, prestige: 2 }, realm: { north: { attitude: 8 } },
        chronicle: 'Na sever odjel vůz s vínem a kovanými přilbami. {realm.north.Ruler} prý pil{N:|a} na zdraví rodu {dynastyName}.',
      },
      {
        label: 'Přezku hodit do moře',
        hintType: 'resource', hintKey: 'faith',
        effects: { faith: 3, prestige: -1 },
        chronicle: 'Medvědí kožešina zůstala, přezka skončila ve vlnách. Některé dary se nosit nedají.',
      },
      {
        label: 'Pověsit kožešinu v síni na odiv',
        hintType: 'resource', hintKey: 'prestige',
        effects: { prestige: 4 }, realm: { north: { attitude: 3 } },
        chronicle: 'Bílá medvědí kožešina visí v síni nad krbem. Hosté se na ni dívají s obdivem a nikdo se neptá, za co přišla.',
      },
    ],
  },
];

// ============================================================================
// PANOVNÍK — diplomacy with the Southern Empire
// ============================================================================

const jihStart = (s) => (s.eventHistory || {}).jih_1 ?? (s.eventHistory || {}).jih_1z;
const afterJih = (s, n) => jihStart(s) !== undefined && s.turn - jihStart(s) >= n;

const JIH = [
  {
    id: 'jih_1',
    scenario: PAN, oneTime: true, minTurn: 6, weight: 1,
    requires: (s) => !flag(s, 'zenon_dluh') && !flag(s, 'jih') && abroad(s, 'south'),
    image: img('kupci_z_jihu'),
    title: 'Purpurové plachty',
    text: 'Do přístavu připlula galéra s purpurovými plachtami a vyslanec z Jižní říše se nechal donést do Vlčího Údělu v nosítkách. {realm.south.Ruler} nabízí smlouvu: jižní lodě budou kotvit v Přístavu Mark a platit nižší clo, jižní kupci dostanou v přístavu vlastní čtvrť s vlastním soudem — a koruna podíl z každého nákladu, který projde.',
    choices: [
      {
        label: 'Podepsat smlouvu',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 10, prestige: 1 }, realm: { south: { attitude: 10 } }, provinceEffects: { 'pobrezni-mark': { wealth: 6 } },
        hiddenEffects: { setFlag: ['jih', 'jih_smlouva'] },
        chronicle: 'Smlouva s Jižní říší byla zpečetěna purpurovým voskem. Přístav Mark se plní cizími plachtami a pokladna cizím stříbrem.',
      },
      {
        label: 'Smlouvat o lepší podmínky',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.45, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { gold: 16, prestige: 3 }, realm: { south: { attitude: 6 } }, provinceEffects: { 'pobrezni-mark': { wealth: 6 } }, hiddenEffects: { setFlag: ['jih', 'jih_smlouva'] }, traitGain: 'eloquence', chronicle: 'Vyslanec se třikrát urazil a třikrát se vrátil. Nakonec podepsal podmínky, které by {S:jeho císař|jeho císařovna} nejspíš neschválil{S:|a} — ale to už byla jeho starost.' },
        onFailure: { effects: { prestige: -2 }, realm: { south: { attitude: -8 } }, hiddenEffects: { setFlag: ['jih', 'jih_odmitnuto'] }, chronicle: 'Vyslanec smlouvání nevydržel. Odplul se slovy, že na jihu se o cenách nehádá — tam se buď podepisuje, nebo ne.' },
      },
      {
        label: 'Odmítnout, přístav nebude cizí',
        hintType: 'resource', hintKey: 'prestige',
        effects: { prestige: 4, stability: 1 }, realm: { south: { attitude: -10 } }, hiddenEffects: { setFlag: ['jih', 'jih_odmitnuto'] },
        chronicle: 'Vyslanec odplul s nepořízenou. V přístavu se tleská, kupci v Brodu pláčou nad ztraceným obchodem.',
      },
    ],
  },
  {
    id: 'jih_1z',
    scenario: PAN, oneTime: true, minTurn: 6, weight: 1.5,
    requires: (s) => flag(s, 'zenon_dluh') && !flag(s, 'jih') && abroad(s, 'south'),
    image: img('kupci_z_jihu'),
    title: 'Starý známý z jihu',
    text: 'Do přístavu připlula galéra s purpurovými plachtami. Z nosítek vystoupil prošedivělý muž v hedvábí a usmál se, jako by se znali celý život. Je to Zénon — kupec, kterému kdysi rod {dynastyName} v Lipnici ukryl truhlu před drábem. Dnes je rádcem, kterému naslouchá {S:sám|sama} {realm.south}, a přiváží smlouvu: nižší clo, vlastní kupeckou čtvrť v Přístavu Mark a koruně podíl z každého nákladu.',
    choices: [
      {
        label: 'Podepsat smlouvu se starým přítelem',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 18, prestige: 3 }, realm: { south: { attitude: 15 } }, provinceEffects: { 'pobrezni-mark': { wealth: 8 } },
        hiddenEffects: { setFlag: ['jih', 'jih_smlouva'] },
        chronicle: 'Zénon podepsal smlouvu, jakou by {R:žádnému jinému králi|žádné jiné královně} nedal. Starý dluh z Lipnice je splacen — i s úrokem.',
      },
      {
        label: 'Požádat Zénona o radu, jak to chodí na jihu',
        hintType: 'trait', hintKey: 'intelligence',
        effects: { gold: 8 }, realm: { south: { attitude: 8 } }, traitGain: 'intelligence',
        hiddenEffects: { setFlag: ['jih', 'jih_smlouva', 'jih_zenon_rada'] },
        chronicle: 'Zénon mluvil do noci: o {S:císaři|císařovně}, o bankéřích z Purpurového města a o tom, komu se na jihu nikdy nepůjčuje. Smlouva se podepsala ráno.',
      },
      {
        label: 'Odmítnout i starého přítele',
        hintType: 'resource', hintKey: 'prestige',
        effects: { prestige: 3 }, realm: { south: { attitude: -6 } }, hiddenEffects: { setFlag: ['jih', 'jih_odmitnuto'] },
        chronicle: 'Zénon odmítnutí přijal s úsměvem. „Panovníci mají své důvody,“ řekl, „a kupci svou paměť.“',
      },
    ],
  },
  {
    id: 'jih_2',
    scenario: PAN, oneTime: true, weight: NEXT_KING,
    requires: (s) => flag(s, 'jih') && afterJih(s, 4) && abroad(s, 'south'),
    image: img('lichvar'),
    title: 'Bankéři z Purpurového města',
    text: 'Na dvůr přijeli dva bankéři z Purpurového města v černém hedvábí, s písařem a s truhlou, kterou nesli čtyři muži. Nabízejí koruně půjčku: plnou truhlu zlata hned, splatnou do tří let. Úrok jmenují tiše a s úsměvem. Za nimi stojí {realm.south} a {S:jeho|její} pokladna, která prý ještě nikdy nezapomněla na jediný dluh.',
    choices: [
      {
        label: 'Půjčku přijmout',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 35 }, hiddenEffects: { setFlag: 'jih_pujcka' },
        chronicle: 'Truhla zůstala ve Vlčím Údělu a písař zapsal do knihy jméno koruny. Splatné do tří let.',
      },
      {
        label: 'Vzít jen polovinu',
        hintType: 'trait', hintKey: 'patience',
        effects: { gold: 18 }, hiddenEffects: { setFlag: ['jih_pujcka', 'jih_pujcka_mala'] },
        chronicle: 'Bankéři vzali půlku zlata zpátky s výrazem, jako by jim někdo urazil matku. Dluh je menší, ale je.',
      },
      {
        label: 'Poděkovat a odmítnout',
        hintType: 'resource', hintKey: 'prestige',
        effects: { prestige: 1 }, realm: { south: { attitude: -2 } },
        chronicle: 'Bankéři se uklonili a odjeli. Kdo si nepůjčuje, nemusí splácet — ale ani nemá.',
      },
    ],
  },
  {
    id: 'jih_3a',
    scenario: PAN, oneTime: true, weight: NEXT_KING,
    requires: (s) => flag(s, 'jih_pujcka') && after(s, 'jih_2', 12),
    image: img('lichvar_splatka'),
    title: 'Den splatnosti',
    text: 'Tři roky uběhly jako voda. Bankéři z Purpurového města jsou zpátky, tentokrát s listinou zpečetěnou purpurovým voskem. Dluh koruny i s úrokem je splatný a {realm.south} vzkazuje, že trpělivost {S:jeho|její} pokladny má své meze. V přístavu kotví dvě jižní válečné galéry — prý jen na odpočinek.',
    choices: [
      {
        label: 'Splatit celý dluh',
        requires: (s) => s.resources.gold >= 48 && !flag(s, 'jih_pujcka_mala'),
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -48 }, realm: { south: { attitude: 6 } }, hiddenEffects: { clearFlag: 'jih_pujcka' },
        chronicle: 'Truhla se zlatem odplula na jih. Bankéři zapsali do knihy, že koruna platí včas, a to je na jihu víc než přátelství.',
      },
      {
        label: 'Splatit celý dluh',
        requires: (s) => s.resources.gold >= 25 && flag(s, 'jih_pujcka_mala'),
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -25 }, realm: { south: { attitude: 6 } }, hiddenEffects: { clearFlag: 'jih_pujcka' },
        chronicle: 'Truhla se zlatem odplula na jih. Bankéři zapsali do knihy, že koruna platí včas, a to je na jihu víc než přátelství.',
      },
      {
        label: 'Vyjednat odklad',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.45, traitKey: 'eloquence', traitScale: 0.05,
        chanceBonus: (s) => (flag(s, 'jih_smlouva') ? 0.1 : 0) + (flag(s, 'jih_zenon_rada') ? 0.1 : 0), bonusLabel: 'Přátelé na jihu',
        onSuccess: { effects: { gold: -15 }, realm: { south: { attitude: -2 } }, provinceEffects: { 'pobrezni-mark': { wealth: -4 } }, hiddenEffects: { clearFlag: 'jih_pujcka' }, chronicle: 'Bankéři svolili ke splátkám a část dluhu odpustili výměnou za nové výsady v přístavu. Galéry odplouvají.' },
        onFailure: { effects: { gold: -10, prestige: -3 }, realm: { south: { attitude: -10 } }, hiddenEffects: { clearFlag: 'jih_pujcka', setFlag: 'jih_dluznik' }, chronicle: 'Bankéři odklad odmítli a vzali si, co v pokladně našli. Zbytek dluhu teď vymáhá {realm.south}.' },
      },
      {
        label: 'Splácet clem z přístavu',
        hintType: 'resource', hintKey: 'stability',
        effects: { stability: -2 }, realm: { south: { attitude: 4 } }, provinceEffects: { 'pobrezni-mark': { wealth: -10, loyalty: -6 } },
        hiddenEffects: { clearFlag: 'jih_pujcka' },
        chronicle: 'Clo z Přístavu Mark teď poputuje na jih, dokud nebude dluh splacen. Přístavní kupci nadávají, galéry odplouvají.',
      },
      {
        label: 'Odmítnout platit',
        hintType: 'resource', hintKey: 'prestige',
        effects: { prestige: 3 }, realm: { south: { attitude: -25 } }, hiddenEffects: { clearFlag: 'jih_pujcka', setFlag: 'jih_dluznik' },
        chronicle: 'Bankéři odpluli s prázdnou a s výhrůžkami. V Purpurovém městě teď píšou jméno rodu {dynastyName} červeným inkoustem.',
      },
    ],
  },
  {
    id: 'jih_4',
    scenario: PAN, oneTime: true, weight: NEXT_KING, music: 'battle',
    requires: (s) => flag(s, 'jih_dluznik') && after(s, 'jih_3a', 4) && abroad(s, 'south'),
    image: img('pirati'),
    title: 'Galéry před přístavem',
    text: 'Za svítání stála před Přístavem Mark řada jižních válečných galér. Žádná bitva — jen zavřený přístav: žádná loď nevpluje a žádná nevypluje, dokud koruna nezaplatí. {realm.south.Ruler} vzkazuje, že {S:jeho|její} trpělivost skončila, a kupci v přístavu počítají, kolik týdnů vydrží.',
    choices: [
      {
        label: 'Zaplatit i s pokutou',
        requires: gold(40),
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -40 }, realm: { south: { attitude: 10 } }, hiddenEffects: { clearFlag: 'jih_dluznik' },
        chronicle: 'Truhla se zlatem odplula na palubě admirálské galéry. Přístav se otevřel a v Purpurovém městě přepsali jméno rodu {dynastyName} zpátky černým inkoustem.',
      },
      {
        label: 'Zapálit galéry v noci ohnivými čluny',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.4, resourceKey: 'army', resourceScale: 0.3,
        onSuccess: { effects: { prestige: 10, army: -3 }, realm: { south: { attitude: -15, power: -5 } }, hiddenEffects: { clearFlag: 'jih_dluznik' }, chronicle: 'Ohnivé čluny vpluly mezi galéry za bezměsíčné noci. Do rána hořely tři a zbytek odplul. Na jihu se o dluhu raději přestalo mluvit — prozatím.' },
        onFailure: { effects: { army: -6, prestige: -4 }, realm: { south: { attitude: -10 } }, provinceEffects: { 'pobrezni-mark': { wealth: -10, unrest: 10 } }, hiddenEffects: { clearFlag: 'jih_dluznik' }, chronicle: 'Galéry zahnaly ohnivé čluny šípy. Blokáda trvala až do zimy a přístav zchudl tak, že dluh splatil sám — svou bídou.' },
      },
      {
        label: 'Vydat jižním kupcům půl přístavu',
        hintType: 'resource', hintKey: 'stability',
        effects: { stability: -4, gold: 6 }, realm: { south: { attitude: 12 } }, provinceEffects: { 'pobrezni-mark': { loyalty: -10, wealth: 4 } },
        hiddenEffects: { clearFlag: 'jih_dluznik' },
        chronicle: 'Jižní kupci dostali v Přístavu Mark vlastní čtvrť, vlastní soud a vlastní stráž. Blokáda skončila, ale půlka přístavu teď mluví cizí řečí.',
      },
    ],
  },
  {
    id: 'jih_3b',
    scenario: PAN, oneTime: true, weight: NEXT_KING,
    requires: (s) => flag(s, 'jih_smlouva') && !flag(s, 'jih_pujcka') && !seen(s, 'jih_3a') && afterJih(s, 8)
      && !!(s.heir && s.heir.alive && s.heir.age >= 10 && s.heir.age <= 18) && abroad(s, 'south'),
    image: img('vychova_dedice'),
    title: 'Pozvání do Purpurového města',
    text: 'Z Jižní říše přišel dopis na purpurovém pergamenu. {realm.south.Ruler} zve na svůj dvůr {D:tvého dědice|tvou dědičku}: {heir.name} by se tam učil{D:|a} u nejlepších učenců za mořem, poznal{D:|a} zákony říše a {D:spřátelil se|spřátelila se} s dětmi jižních velmožů. Za pár let by se vrátil{D:|a} jako {D:muž, který|žena, která} zná svět.',
    choices: [
      {
        label: 'Poslat dědice na jih',
        hintType: 'trait', hintKey: 'intelligence',
        effects: { gold: -6 }, heirTraits: { intelligence: 1, eloquence: 1 }, courtEffects: { heir: { loyalty: -6 } }, realm: { south: { attitude: 12 } },
        chronicle: '{heir.name} odplul{D:|a} na purpurové galéře. Za tři roky se vrátil{D:|a} s cizím přízvukem, s truhlami knih a s přáteli, kteří jednou budou vládnout za mořem.',
      },
      {
        label: 'Poslat místo dědice učeného písaře',
        hintType: 'trait', hintKey: 'patience',
        effects: { gold: -3 }, realm: { south: { attitude: 3 } },
        chronicle: 'Na jih odplul písař z kanceláře s dopisem plným díků. Jižní dvůr zdvořilost ocenil — a pochopil.',
      },
      {
        label: 'Odmítnout, dědic patří domů',
        hintType: 'resource', hintKey: 'legitimacy',
        effects: { legitimacy: 2 }, courtEffects: { heir: { loyalty: 3 } }, realm: { south: { attitude: -4 } },
        chronicle: '{heir.name} zůstal{D:|a} doma. Jižní dvůr odpověď přijal chladně, ale lid se nemusí bát, že jednou bude vládnout někdo, kdo myslí cizí řečí.',
      },
    ],
  },
];

// ============================================================================
// PANOVNÍK — a foreign crown changes hands (realms.js ageRealms sets realm.changed)
// ============================================================================

// what differs from realm to realm; the rest of the storyline is shared
const THRONES = {
  east: {
    border: 'sokoli-hvozd',
    friend: 'marky_pritel',
    images: ['pretendent', 'valka_s_markami', 'cizi_vyslanec', 'pohranicni_najezd', 'zajaty_syn_markrabiho'],
    titles: ['Markrabě bez koruny', 'Válka o markskou korunu', 'Vděčný král Marek', 'Hněv Marek', 'Host ve věži'],
    claim: 'Ve Východních markách se vyměnila koruna: na trůn usedl{E:|a} {realm.east}. Jenže ne všechna markrabata {E:nového krále|novou královnu} uznala. Markrabě {realm.east.claimant}, nejmocnější z nich, se prohlásil pravým králem, prohrál první bitvu a teď stojí ve tvé síni s hrstkou věrných. Za zlato nebo za meče slibuje věčné přátelství — a až bude vládnout, i něco víc.',
    newRuler: '{E:nového krále|novou královnu}',
    friendLabel: 'Podpořit ho a požádat o pomoc markraběte Dětřicha',
    friendChronicle: 'Markrabě Dětřich, starý přítel rodu {dynastyName}, přivedl nápadníkovi koruny svou družinu a tvoji muži táhnou s nimi. V Markách se ví, kdo za tím stojí.',
    war: 'Z Marek přicházejí zprávy každý týden. Markrabě {realm.east.claimant} oblehl hlavní hrad a {realm.east} se brání za hradbami s posledními věrnými. Rozhodne se to do zimy a posel, který přijel na tvůj dvůr, prosí o poslední pomoc.',
    won: 'Hradby padly a {realm.east} uprchl{E:|a} za moře. {realm.east.claimant} usedl na markský trůn a první dopis, který jako král napsal, poslal do Vlčího Údělu.',
    lost: '{realm.east.Ruler} rozprášil{E:|a} vzbouřená markrabata pod hradbami. Markrabě {realm.east.claimant} padl v boji a v Markách se ví, čí muži a čí zlato stáli za ním.',
    thanks: 'Z Marek přijelo poselstvo se zeleným praporem a za ním vozy. {realm.east.Ruler} — kdysi vyhnanec ve tvé síni, dnes král — vzkazuje, že na pomoc v nejhorší hodině nezapomene. Ať rod {dynastyName} řekne, co si přeje.',
    third: { label: 'Chtít, aby markský král přijal Marky z tvé ruky jako léno', ok: '{realm.east.Ruler} poklekl v trůnní síni Vlčího Údělu a přijal Marky z tvé ruky jako léno. Markrabata skřípou zuby — a jejich země slábne.', no: '{realm.east.Ruler} zbledl a odjel bez rozloučení. Vděk má své meze a tohle byla jedna z nich.' },
    revenge: '{realm.east.Ruler} nezapomněl{E:|a}, kdo stál za vzbouřenými markrabaty. Na hranici Sokolího hvozdu se objevily markské hlídky, mýtnice hoří a posel z Marek žádá náhradu za válku, kterou koruna Vlčího Údělu pomáhala rozdmýchat.',
    hostage: 'Markrabě {realm.east.claimant} žije ve tvé věži už druhý rok. {realm.east.Ruler} posílá vyslance s nabídkou: za jeho vydání zaplatí zlatem a uzavře s korunou smír. {realm.east.claimant} o tom ví — a večer co večer prosí, abys ho nevydal{R:|a}.',
  },
  north: {
    border: 'zelezny-hreben',
    friend: 'bjarn_pritel',
    images: ['zvedove_v_horach', 'n_kralovska_bitva', 'n_nabidka_spojenectvi', 'pohranicni_najezd', 'zajaty_syn_markrabiho'],
    titles: ['Náčelník bez sněmu', 'Válka kmenů', 'Vděčný velký náčelník', 'Hněv severu', 'Host ve věži'],
    claim: 'Na sněmu kmenů Severních pustin padla volba: {N:novým velkým náčelníkem je|novou velkou náčelnicí je} {realm.north.name}. Náčelník {realm.north.claimant} od Ledového jezera ale volbu neuznal a prohlásil se velkým náčelníkem sám. Teď přijel na tvůj dvůr s hrstkou válečníků a s nabídkou: pomoz mu k moci a sever bude navždy přítelem jihu.',
    newRuler: '{N:nového velkého náčelníka|novou velkou náčelnici}',
    friendLabel: 'Podpořit ho a poslat vzkaz Bjarnovi do průsmyků',
    friendChronicle: 'Bjarn, pán průsmyků a starý přítel rodu {dynastyName}, sestoupil se svými sekerníky k Ledovému jezeru a tvoji muži táhnou s ním.',
    war: 'Ze severu se valí kouř a zprávy. Náčelník {realm.north.claimant} sjednotil kmeny od Ledového jezera a táhne na sněmovní skálu, kde {realm.north} čeká s věrnými kmeny. Rozhodne se to v jediné bitvě a posel ze severu prosí o poslední pomoc.',
    won: 'U sněmovní skály se lámala kopí až do soumraku. {realm.north.Ruler} padl{N:|a} na kolena a novým velkým náčelníkem se stal {realm.north.claimant}. Jako první mu poslal dar dvůr ve Vlčím Údělu.',
    lost: '{realm.north.Ruler} rozdrtil{N:|a} vzbouřené kmeny u sněmovní skály. Náčelník {realm.north.claimant} zmizel ve sněhu a na severu se vypráví, čí zlato a čí muži mu pomáhali.',
    thanks: 'Ze severu přijelo poselstvo v kožešinách a za ním sáně plné darů. {realm.north.Ruler} — kdysi vyhnanec ve tvé síni, dnes pán kmenů — vzkazuje, že sever dluhy splácí. Ať rod {dynastyName} řekne, co si přeje.',
    third: { label: 'Chtít, aby kmeny platily tribut', ok: '{realm.north.Ruler} souhlasil. Kmeny posílají na jih kožešiny a stříbro a jejich síla se tenčí s každým vozem.', no: '{realm.north.Ruler} se zasmál tak, že se třásla síň. Tribut prý sever platí jen mečem — a odjel bez rozloučení.' },
    revenge: '{realm.north.Ruler} nezapomněl{N:|a}, kdo stál za vzbouřenými kmeny. Na Železném hřebeni hoří osady, severské tlupy přepadají povozy se solí a posel ze severu žádá náhradu za válku, kterou jih pomáhal rozdmýchat.',
    hostage: 'Náčelník {realm.north.claimant} žije ve tvé věži už druhý rok. {realm.north.Ruler} posílá vyslance s nabídkou: za jeho vydání zaplatí stříbrem a kožešinami a uzavře s korunou mír. {realm.north.claimant} o tom ví — a večer co večer prosí, abys ho nevydal{R:|a}.',
  },
  south: {
    border: 'pobrezni-mark',
    friend: 'zenon_dluh',
    images: ['pretendent', 'pirati', 'kupci_z_jihu', 'pirati', 'zajaty_syn_markrabiho'],
    titles: ['Purpur ve vyhnanství', 'Válka o purpur', 'Vděčný císař', 'Hněv Jižní říše', 'Host ve věži'],
    claim: 'V Jižní říši usedl{S:|a} na trůn {S:nový císař|nová císařovna} {realm.south.name}. Vojevůdce {realm.south.claimant}, kterému patří srdce legií, se s tím nesmířil: prohlásil se císařem, jenže v Purpurovém městě ho porazili a utekl přes moře. Teď stojí ve tvé síni v zaprášeném purpuru a slibuje, že až bude vládnout, nezapomene, kdo mu podal ruku.',
    newRuler: '{S:nového císaře|novou císařovnu}',
    friendLabel: 'Podpořit ho a napsat Zénonovi do Purpurového města',
    friendChronicle: 'Zénon, starý přítel rodu {dynastyName}, otevřel vzbouřenému vojevůdci brány svých skladů i dveře paláců. Tvoji muži se plaví na jih s ním.',
    war: 'Z jihu připlouvají lodě se zprávami. Vojevůdce {realm.south.claimant} se vylodil s legiemi před Purpurovým městem a {realm.south} se brání za jeho hradbami. Rozhodne se to do zimy a posel z jihu prosí o poslední pomoc.',
    won: 'Brány Purpurového města otevřela legie, která přeběhla. {realm.south.Ruler} skončil{S:|a} v klášteře na ostrově a na trůn usedl {realm.south.claimant}. Mezi prvními, komu jako císař psal, byl dvůr ve Vlčím Údělu.',
    lost: 'Legie se u hradeb Purpurového města obrátily proti svému vojevůdci. {realm.south.claimant} skončil na popravišti a {realm.south} dobře ví, čí lodě ho na jih přivezly.',
    thanks: 'Do přístavu připlula galéra s purpurovými plachtami a s ní dary, jaké Vlčí Úděl neviděl. {realm.south.Ruler} — kdysi uprchlík ve tvé síni, dnes císař — vzkazuje, že na pomoc v nejhorší hodině nezapomene. Ať rod {dynastyName} řekne, co si přeje.',
    third: { label: 'Chtít výsady pro své kupce v celé říši', ok: 'Kupci z Vlčího Údělu smějí obchodovat v každém přístavu říše bez cla. Přístav Mark zbohatl za jediný rok víc než za celé desetiletí.', no: '{realm.south.Ruler} odmítl s úsměvem. Výsady v říši prý nedostane ani vlastní bratr — a vděk se tím vyčerpal.' },
    revenge: '{realm.south.Ruler} nezapomněl{S:|a}, kdo přivezl vzbouřeného vojevůdce k hradbám. Před Přístavem Mark křižují jižní galéry, kupecké lodě nevyplouvají a posel z jihu žádá náhradu za válku, kterou koruna Vlčího Údělu pomáhala rozdmýchat.',
    hostage: 'Vojevůdce {realm.south.claimant} žije ve tvé věži už druhý rok. {realm.south.Ruler} posílá vyslance s nabídkou: za jeho vydání zaplatí zlatem a uzavře s korunou věčný mír. {realm.south.claimant} o tom ví — a večer co večer prosí, abys ho nevydal{R:|a}.',
  },
};

/** The five steps of the storyline for one foreign crown. */
function throneChain(key) {
  const d = THRONES[key];
  const id = (n) => `trun_${key}_${n}`;
  const f = (n) => `trun_${key}_${n}`; // flags share the prefix
  const R = (attitude, power) => ({ [key]: power ? { attitude, power } : { attitude } });
  const tok = `{realm.${key}.claimant}`;
  const ruler = `{realm.${key}}`;
  const Ruler = `{realm.${key}.Ruler}`; // at the start of a sentence
  const G = { east: 'E', north: 'N', south: 'S' }[key];
  const won = (s) => flag(s, f('vitez'));
  const chance = (s) => (flag(s, f('vojsko')) ? 0.1 : 0) + (flag(s, f('pritel')) ? 0.15 : 0) - (s.realms[key].power > 70 ? 0.1 : 0);
  // the claimant who won is crowned in realms state right after the choice
  const crown = (s) => {
    const r = s.realms[key];
    if (won(s) && r.claimant && !r.claimant.crowned) {
      r.ruler = { name: r.claimant.name, gender: 'male', age: randInt(30, 48) };
      r.claimant.crowned = true;
    }
  };
  return [
    {
      id: id(1),
      scenario: PAN, oneTime: true, weight: 3,
      // only while the new ruler is fresh, and not while another claimant's story is still young
      requires: (s) => abroad(s, key) && s.realms[key].changed !== undefined && s.turn - s.realms[key].changed <= 8 && !s.war
        && !Object.keys(THRONES).some((k) => k !== key && seen(s, `trun_${k}_1`) && !after(s, `trun_${k}_1`, 24)),
      onPick: (s) => {
        let name = randomName('male');
        for (let i = 0; i < 5 && name === s.realms[key].ruler.name; i++) name = randomName('male');
        s.realms[key].claimant = { name };
      },
      image: img(d.images[0]),
      title: d.titles[0],
      text: d.claim,
      choices: [
        {
          label: 'Podpořit ho zlatem',
          requires: gold(15),
          hintType: 'resource', hintKey: 'gold',
          effects: { gold: -15 }, realm: R(-8), hiddenEffects: { setFlag: [f('start'), f('zlato')] },
          chronicle: `${tok} odjel s truhlou zlata a s nadějí. Tam, kde vládne ${ruler}, se o tom dozvěděli dřív, než dojel k hranici.`,
        },
        {
          label: 'Poslat s ním oddíl vojska',
          requires: (s) => s.resources.army >= 20 && !flag(s, d.friend),
          hintType: 'resource', hintKey: 'army',
          effects: { army: -8 }, realm: R(-10), hiddenEffects: { setFlag: [f('start'), f('vojsko')] },
          chronicle: `${tok} táhne domů a pod jeho korouhví jdou i tvoji muži. Od této chvíle je jeho válka i tvou válkou.`,
        },
        {
          label: d.friendLabel,
          requires: (s) => flag(s, d.friend) && s.resources.army >= 12,
          hintType: 'trait', hintKey: 'eloquence',
          effects: { army: -4, gold: -5 }, realm: R(-6), hiddenEffects: { setFlag: [f('start'), f('vojsko'), f('pritel')] },
          chronicle: d.friendChronicle,
        },
        {
          label: `Uznat ${d.newRuler} a nápadníka vykázat`,
          hintType: 'resource', hintKey: 'prestige',
          effects: { prestige: 1 }, realm: R(12), hiddenEffects: { setFlag: f('start') },
          chronicle: `${tok} odjel s nepořízenou. ${Ruler} poslal{${G}:|a} do Vlčího Údělu poděkování a dar.`,
        },
        {
          label: 'Nechat ho u dvora jako hosta',
          requires: (s) => !flag(s, d.friend) || s.resources.army < 12,
          hintType: 'trait', hintKey: 'intelligence',
          effects: { prestige: 1 }, realm: R(-3), hiddenEffects: { setFlag: [f('start'), f('host')] },
          chronicle: `${tok} dostal komnatu v hradní věži, stráž u dveří a čestné místo u stolu. Host je to vzácný — a drahý tomu, kdo by ho chtěl zpátky.`,
        },
      ],
    },
    {
      id: id(2),
      scenario: PAN, oneTime: true, weight: NEXT_KING, music: 'battle',
      requires: (s) => (flag(s, f('zlato')) || flag(s, f('vojsko'))) && !won(s) && after(s, id(1), 3) && abroad(s, key) && !!s.realms[key].claimant,
      image: img(d.images[1]),
      title: d.titles[1],
      text: d.war,
      choices: [
        {
          label: 'Poslat další muže a rozhodnout to',
          requires: (s) => s.resources.army >= 15,
          hintType: 'resource', hintKey: 'army',
          isRoll: true, baseChance: 0.5, resourceKey: 'army', resourceScale: 0.3, chanceBonus: chance, bonusLabel: 'Spojenci v poli',
          onSuccess: { effects: { army: -6, prestige: 6 }, realm: R(30, -10), hiddenEffects: { setFlag: f('vitez') }, chronicle: d.won },
          onFailure: { effects: { army: -8, prestige: -4 }, realm: R(-20, -5), hiddenEffects: { setFlag: f('porazka') }, chronicle: d.lost },
        },
        {
          label: 'Poslat zlato na žoldnéře',
          requires: gold(15),
          hintType: 'resource', hintKey: 'gold',
          isRoll: true, baseChance: 0.4, chanceBonus: chance, bonusLabel: 'Spojenci v poli',
          onSuccess: { effects: { gold: -15, prestige: 3 }, realm: R(25, -10), hiddenEffects: { setFlag: f('vitez') }, chronicle: d.won },
          onFailure: { effects: { gold: -15 }, realm: R(-15, -5), hiddenEffects: { setFlag: f('porazka') }, chronicle: d.lost },
        },
        {
          label: 'Nechat to na něm',
          hintType: 'trait', hintKey: 'patience',
          isRoll: true, baseChance: 0.3, chanceBonus: chance, bonusLabel: 'Spojenci v poli',
          onSuccess: { realm: R(15, -10), hiddenEffects: { setFlag: f('vitez') }, chronicle: d.won },
          onFailure: { realm: R(-12, -5), hiddenEffects: { setFlag: f('porazka') }, chronicle: d.lost },
        },
        {
          label: 'Stáhnout ruku a nabídnout smír',
          hintType: 'resource', hintKey: 'prestige',
          effects: { prestige: -3 }, realm: R(6), hiddenEffects: { clearFlag: [f('zlato'), f('vojsko')] },
          chronicle: `Koruna Vlčího Údělu stáhla ruku. ${tok} bojuje dál sám a ${ruler} přijal{${G}:|a} smír s nedůvěrou, ale přijal{${G}:|a}.`,
        },
      ],
      markSeen: crown,
    },
    {
      id: id('3a'),
      scenario: PAN, oneTime: true, weight: NEXT_KING,
      requires: (s) => won(s) && after(s, id(2), 4) && abroad(s, key) && !!s.realms[key].claimant && s.realms[key].ruler.name === s.realms[key].claimant.name,
      image: img(d.images[2]),
      title: d.titles[2],
      text: d.thanks,
      choices: [
        {
          label: 'Přát si zlato',
          hintType: 'resource', hintKey: 'gold',
          effects: { gold: 25 },
          chronicle: 'Vozy byly plné zlata. Vděk se dá zvážit — a tenhle vážil hodně.',
        },
        {
          label: 'Přát si věčné spojenectví',
          hintType: 'resource', hintKey: 'stability',
          effects: { prestige: 4, stability: 2 }, realm: R(15), hiddenEffects: { setFlag: `spojenec_${key}` },
          chronicle: `Spojenectví bylo zpečetěno přísahou před oltářem a svědky z obou dvorů. Dokud žije ${ruler}, mezi oběma zeměmi bude mír.`,
        },
        {
          label: d.third.label,
          hintType: 'trait', hintKey: 'eloquence',
          isRoll: true, baseChance: 0.4, traitKey: 'eloquence', traitScale: 0.04,
          chanceBonus: (s) => (s.realms[key].power < 45 ? 0.15 : 0), bonusLabel: 'Země vyčerpaná válkou',
          onSuccess: key === 'south'
            ? { effects: { gold: 10, prestige: 4 }, provinceEffects: { 'pobrezni-mark': { wealth: 10 } }, realm: R(-5), chronicle: d.third.ok }
            : { effects: { prestige: 10, gold: 6 }, realm: R(-10, -12), chronicle: d.third.ok },
          onFailure: { effects: { prestige: -3 }, realm: R(-20), chronicle: d.third.no },
        },
      ],
    },
    {
      id: id('3b'),
      scenario: PAN, oneTime: true, weight: NEXT_KING,
      requires: (s) => flag(s, f('porazka')) && after(s, id(2), 4) && abroad(s, key),
      image: img(d.images[3]),
      title: d.titles[3],
      text: d.revenge,
      choices: [
        {
          label: 'Zaplatit náhradu',
          requires: gold(20),
          hintType: 'resource', hintKey: 'gold',
          effects: { gold: -20 }, realm: R(15),
          chronicle: 'Truhla se zlatem odjela za hranici a hlídky se stáhly. Mír se dá koupit — tentokrát za cenu, kterou si koruna pamatuje.',
        },
        {
          label: 'Posílit hranici a nic neplatit',
          hintType: 'resource', hintKey: 'army',
          effects: { army: -3, gold: -5 }, realm: R(-5), provinceEffects: { [d.border]: { garrison: 15, unrest: 5 } },
          chronicle: 'Na hranici vyrostly nové strážnice a posádky zdvojnásobily hlídky. Náhrada nebude — a klid taky ne.',
        },
        {
          label: 'Vyslat smírčí poselstvo',
          hintType: 'trait', hintKey: 'eloquence',
          isRoll: true, baseChance: 0.45, traitKey: 'eloquence', traitScale: 0.05,
          onSuccess: { effects: { prestige: 1 }, realm: R(10), chronicle: 'Poselstvo se vrátilo se smírem a bez placení. Někdy stačí, když koruna umí ztratit tvář včas.' },
          onFailure: { realm: R(-10), provinceEffects: { [d.border]: { unrest: 10 } }, chronicle: 'Poselstvo vyhnali od dvora jako žebráky. Na hranici dál hoří strážnice.' },
        },
      ],
    },
    {
      id: id('3c'),
      scenario: PAN, oneTime: true, weight: NEXT_KING,
      requires: (s) => flag(s, f('host')) && after(s, id(1), 6) && abroad(s, key) && !!s.realms[key].claimant,
      image: img(d.images[4]),
      title: d.titles[4],
      text: d.hostage,
      choices: [
        {
          label: 'Vydat ho',
          hintType: 'resource', hintKey: 'gold',
          effects: { gold: 25, faith: -5, prestige: -2 }, realm: R(15), hiddenEffects: { clearFlag: f('host') },
          chronicle: `${tok} odjel za hranici v poutech. Zlato dorazilo, smír byl zpečetěn a co se s vězněm stalo, se ve Vlčím Údělu nikdy oficiálně nedozvěděli.`,
        },
        {
          label: 'Poslat ho do kláštera na útesu',
          hintType: 'resource', hintKey: 'faith',
          effects: { faith: 4 }, realm: R(5), hiddenEffects: { clearFlag: f('host') },
          chronicle: `${tok} přijal kutnu v klášteře na útesu. Nárok na trůn zůstal za branou spolu s jeho jménem.`,
        },
        {
          label: 'Pustit ho, ať to zkusí znovu',
          requires: gold(8),
          hintType: 'resource', hintKey: 'gold',
          effects: { gold: -8 }, realm: R(-10), hiddenEffects: { clearFlag: f('host'), setFlag: f('zlato') },
          chronicle: `${tok} odjel v noci s měšcem od koruny a s hrstkou věrných. Za hranicí už o tom vědí.`,
        },
        {
          label: 'Nechat všechno, jak je',
          hintType: 'trait', hintKey: 'patience',
          effects: {}, realm: R(-5),
          chronicle: 'Vyslanec odjel s nepořízenou. Host zůstává ve věži a s ním i otázka, co s ním jednou bude.',
        },
      ],
    },
  ];
}

export const FOREIGN_EVENTS = [
  ...ZENON, ...SEVER,
  ...RACCI, ...BJARN,
  ...JIH,
  ...throneChain('east'), ...throneChain('north'), ...throneChain('south'),
];
