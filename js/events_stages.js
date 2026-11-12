// Stories of two stages that used to borrow the pool of the stage before them:
// the free man (sedlák, statusTier 2) who still lives in Lipnice but answers to
// nobody, and the great lord (šlechtic, statusTier 4) who sits among the old houses.
// Peasant resources are relabelled in data.js (gold = groše, army = čeleď,
// stability = grunt, favor = přízeň pána); a free man is the only peasant who can
// hire hands and buy food, so several of these stories let him do so.
// Echoes (f_ozvena_*, v_ozvena_*) stay within their stage: takeDueEcho drops them
// once the house has climbed higher.

const SED = 'sedlak';
const SLE = 'slechtic';
const img = (id) => `assets/events/${id}.jpg`;

const freeMan = (s) => s.ruler.statusTier === 2;
const greatLord = (s) => s.ruler.statusTier === 4;
// the court does not test, consult or honour a lord in open revolt
const kingAtHand = (s) => !!(s.king && s.king.alive) && !s.flags.rebellion;
const allies = (s) => (s.houses || []).filter((h) => h.ally).length;
const hostileHouse = (s) => {
  const h = (s.houses || []).filter((x) => x.attitude < 35).sort((a, b) => a.attitude - b.attitude)[0];
  return h ? h.id : null;
};
const closestHouse = (s) => {
  const h = (s.houses || []).filter((x) => x.attitude >= 45).sort((a, b) => b.attitude - a.attitude)[0];
  return h ? h.id : null;
};
const suitorHouse = (s) => {
  if (!s.heir || !s.heir.alive || s.heir.age < 14 || s.flags.heir_married || s.flags.royal_match) return null;
  const h = (s.houses || []).filter((x) => !x.married && x.attitude >= 35).sort((a, b) => b.power - a.power)[0];
  return h ? h.id : null;
};

export const STAGE_EVENTS = [
  // ===================== THE FREE MAN =====================

  {
    id: 'f_celed',
    scenario: SED, cooldown: 12, weight: 2, seasons: [0, 2],
    requires: freeMan,
    image: img('doziny'),
    title: 'Lidé u studny',
    text: 'Na návsi u studny stojí lidé s uzlíky a ptají se po práci: dva bratři z vyhořelé vsi za hvozdem, vdova s dospívajícím synem a starý pasák, který prý rozumí dobytku líp než kdokoli v kraji. Poddaný si čeleď najímat nesmí. {ruler.name} je ale teď {R:svobodný hospodář|svobodná hospodářka} a kdo chce obdělat víc polí, potřebuje víc rukou. Ty ruce chtějí jíst — a dostat zaplaceno.',
    choices: [
      {
        label: 'Najmout je všechny za mzdu',
        requires: (s) => s.resources.gold >= 8,
        hintType: 'resource', hintKey: 'army',
        effects: { gold: -8, army: 5, food: -3 },
        chronicle: 'Na gruntu rodu {dynastyName} přibyla nová čeleď. Za stolem je těsno, ale pole se obdělají do posledního záhonu.',
      },
      {
        label: 'Vzít jen dva bratry',
        requires: (s) => s.resources.gold >= 4,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -4, army: 3 },
        chronicle: 'Bratři z vyhořelé vsi spí na seníku a pracují za tři. Vdova a pasák šli hledat štěstí jinam.',
      },
      {
        label: 'Nabídnout jim místo mzdy stravu a střechu',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.5, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { food: -5, army: 4 }, traitGain: 'eloquence', chronicle: 'Za teplou polévku a suchý kout zůstali všichni. Komora se prázdní rychleji, ale měšec zůstal plný.' },
        onFailure: { effects: { food: -3, army: 1, prestige: -2 }, chronicle: 'Zůstal jen starý pasák. Ostatní odešli a po vsi roznesli, že {ruler.name} je {R:skrblík|skrblice}.' },
      },
      {
        label: 'Poslat je dál',
        hintType: 'trait', hintKey: 'patience',
        effects: {},
        chronicle: 'Lidé s uzlíky odešli k další vsi. Na gruntu se bude dřít jen vlastníma rukama.',
      },
    ],
  },

  {
    id: 'f_farska_pole',
    scenario: SED, cooldown: 16, minTurn: 3,
    requires: freeMan,
    image: img('hranicni_kamen'),
    title: 'Farské lány',
    text: 'Farář z {village} drží za kostelem tři lány, které nemá kdo obdělat. Poddanému by je nepronajal — ten patří pánovi i s rukama. Svobodnému člověku ale nabízí nájem na tři roky: zaplatit předem a úrodu si nechat.',
    choices: [
      {
        label: 'Zaplatit nájem předem',
        requires: (s) => s.resources.gold >= 10,
        hintType: 'resource', hintKey: 'food',
        effects: { gold: -10, food: 8, stability: 4 },
        chronicle: 'Farář má své groše a grunt rodu {dynastyName} tři lány navíc. První úroda z nich už leží ve stodole.',
      },
      {
        label: 'Smlouvat o nižší nájem',
        requires: (s) => s.resources.gold >= 6,
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.45, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { gold: -6, food: 8, stability: 4 }, traitGain: 'eloquence', chronicle: 'Farář si povzdechl, že svobodní lidé smlouvají hůř než kupci, a slevil. Lány za kostelem obdělává rod {dynastyName}.' },
        onFailure: { effects: { prestige: -2 }, chronicle: 'Farář se urazil, že se s ním handrkuješ o boží půdu, a lány pronajal mlynáři.' },
      },
      {
        label: 'Splácet nájem prací čeledi na farském',
        hintType: 'resource', hintKey: 'army',
        effects: { army: -2, food: 5, stability: 2 },
        chronicle: 'Dva čeledíni teď slouží na faře místo grošů. Polovina úrody z farských lánů zůstává na gruntu.',
      },
      {
        label: 'Nechat lány ležet ladem',
        hintType: 'trait', hintKey: 'patience',
        effects: {},
        chronicle: 'Farské lány zarůstají plevelem. Farář si nakonec našel jiného nájemce.',
      },
    ],
  },

  {
    id: 'f_hlas_vsi',
    scenario: SED, cooldown: 16, minTurn: 4,
    requires: freeMan,
    image: img('s_rychtar_volba'),
    title: 'Hlas vsi',
    text: 'Večer se u tvých vrat sešli sousedé s čepicemi v rukou. {lord.Title} {lord.name} chce letos od každého gruntu o den roboty víc a k tomu nový poplatek za pastvu na panské louce. Poddaný, který by si stěžoval, skončí u drába. Ty už {L:pánovi|paní} nepatříš. „Promluv za nás,“ prosí. „Tebe vyslechne.“',
    choices: [
      {
        label: 'Jít na panský dvůr a mluvit za celou ves',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.4, traitKey: 'eloquence', traitScale: 0.05,
        chanceBonus: (s) => (s.resources.prestige - 40) / 300,
        onSuccess: { effects: { prestige: 8, favor: -3 }, traitGain: 'eloquence', chronicle: '{lord.Title} {lord.name} vyslechl{L:|a} svobodného souseda až do konce a poplatek za pastvu nakonec odvolal{L:|a}. V krčmě se na zdraví rodu {dynastyName} pilo do noci.' },
        onFailure: { effects: { favor: -8, prestige: 3 }, chronicle: '{lord.Title} {lord.name} tě nechal{L:|a} vyvést ze dvora. Ves ocenila, že ses za ni {R:postavil|postavila}. {L:Pán|Paní} si zapamatoval{L:|a} totéž.' },
      },
      {
        label: 'Domluvit se potichu s purkrabím',
        requires: (s) => s.resources.gold >= 4,
        hintType: 'trait', hintKey: 'intelligence',
        effects: { gold: -4, prestige: 4, favor: 2 },
        chronicle: 'Pár grošů v purkrabího dlani a slovo v pravou chvíli. Poplatek za pastvu se jaksi zapomněl vybírat a nikdo nemusel nic říkat nahlas.',
      },
      {
        label: 'Odmítnout, tohle už není tvoje starost',
        hintType: 'resource', hintKey: 'favor',
        effects: { prestige: -6, favor: 2 },
        chronicle: 'Sousedé odešli mlčky. Na návsi se teď říká, že svoboda dělá z lidí pány.',
      },
    ],
  },

  {
    id: 'f_myto_na_moste',
    scenario: SED, cooldown: 24, minTurn: 2,
    requires: freeMan,
    image: img('hrabe_utlacuje'),
    title: 'Mýto na mostě',
    text: '{lord.Title} {lord.name} ti nezapomněl{L:|a}, že ses {R:vymanil|vymanila} z poddanství. Kdo jednou odejde zpod panské ruky, ukazuje cestu ostatním. Na mostě přes potok, kudy vozíš obilí do mlýna, teď stojí panský pacholek a chce mýto — od tvého vozu, a jen od tvého.',
    choices: [
      {
        label: 'Platit a nedat najevo hněv',
        hintType: 'trait', hintKey: 'patience',
        effects: { gold: -5, favor: 3 },
        traitGain: 'patience',
        chronicle: 'Na mostě se platí každý týden. Pacholek se přitom usmívá a na panském dvoře prý taky.',
      },
      {
        label: 'Ukázat listinu o svobodě královskému sudímu v Brodné',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.45, traitKey: 'intelligence', traitScale: 0.05,
        onSuccess: { effects: { prestige: 6, favor: -4 }, traitGain: 'intelligence', chronicle: 'Sudí listinu přečetl a rozhodl: svobodný člověk platí mýto jako ostatní, ne víc. Pacholek z mostu zmizel a {lord.title} {lord.name} zuří.' },
        onFailure: { effects: { gold: -8, favor: -6 }, chronicle: 'Sudí je {L:pánův|paninin} švagr. Rozhodl, že mýto se vybírá po právu, a k tomu vyměřil poplatek za soud.' },
      },
      {
        label: 'Zanést na panský dvůr dar a připomenout staré služby',
        requires: (s) => s.resources.gold >= 8,
        hintType: 'resource', hintKey: 'favor',
        effects: { gold: -8, favor: 8 },
        chronicle: '{lord.Title} {lord.name} dar přijal{L:|a} a mýto na mostě zrušil{L:|a}. Pohled, kterým tě přitom změřil{L:|a}, zůstal stejný.',
      },
      {
        label: 'Vozit obilí oklikou přes brod',
        hintType: 'resource', hintKey: 'stability',
        effects: { food: -3, stability: -3 },
        chronicle: 'Oklika přes brod stojí den cesty a jeden promočený pytel. Panští pacholci se mohou dívat, jak voda teče.',
      },
    ],
  },

  {
    id: 'f_karavana',
    scenario: SED, cooldown: 14, minTurn: 3, seasons: [1, 2],
    requires: freeMan,
    image: img('trh_v_brode'),
    title: 'S kupeckou karavanou',
    text: 'Kupec z Brodné skládá karavanu na jarmark do Brodu a hledá společníky, kteří přiloží vůz a ruku k ochraně. Poddaný nesmí opustit panství bez dovolení, svobodný může jet, kam chce. Na jarmarku se za obilí platí stříbrem a za stříbro se tam dá koupit, co doma nikdo nemá — třeba levné obilí z jižních sýpek.',
    choices: [
      {
        label: 'Naložit obilí a jet s karavanou',
        requires: (s) => s.resources.food >= 12,
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.55, traitKey: 'intelligence', traitScale: 0.04,
        onSuccess: { effects: { food: -8, gold: 12, prestige: 2 }, traitGain: 'intelligence', chronicle: 'Obilí se v Brodě prodalo za dobrou cenu. {ruler.name} se {R:vrátil|vrátila} s plným měšcem a s hlavou plnou cen, cest a jmen.' },
        onFailure: { effects: { food: -8, gold: 3 }, chronicle: 'Překupníci srazili cenu, jak chtěli; kdo neumí smlouvat, platí. Domů se vrátil prázdný vůz a pár grošů.' },
      },
      {
        label: 'Koupit na jarmarku obilí na zimu',
        requires: (s) => s.resources.gold >= 6,
        hintType: 'resource', hintKey: 'food',
        effects: { gold: -6, food: 8 },
        chronicle: 'Na jarmarku bylo obilí z jižních sýpek za babku. Vůz se vrátil těžší, než odjel.',
      },
      {
        label: 'Poslat s karavanou dva čeledíny jako stráž',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.6, resourceKey: 'army', resourceScale: 0.3,
        onSuccess: { effects: { gold: 6 }, chronicle: 'Cesta byla klidná a kupec zaplatil za ochranu poctivě. Čeledíni se vrátili s groši a s historkami z města.' },
        onFailure: { effects: { army: -2, gold: 2 }, chronicle: 'Ve hvozdu karavanu přepadli lapkové. Kupec zaplatil, co slíbil, ale čeledíni se domů nevrátili.' },
      },
      {
        label: 'Zůstat doma',
        hintType: 'trait', hintKey: 'patience',
        effects: {},
        chronicle: 'Karavana odjela bez tebe. Grunt aspoň nezůstal bez hospodáře.',
      },
    ],
  },

  {
    id: 'f_uprchly_syn',
    scenario: SED, oneTime: true, minTurn: 4,
    requires: freeMan,
    image: img('uprchlici'),
    title: 'Klepání na okenici',
    text: 'Uprostřed noci zaklepal na okenici soused Matěj, poddaný jako kdysi ty. Jeho syn utekl z panské stáje, kde ho dráb zbil do krve, a teď ho hledají pacholci. „U svobodného hledat nebudou,“ šeptá Matěj. „Schovej ho, než přejde nejhorší.“ Za ukrývání uprchlého poddaného se ale platí, i když jsi {R:svobodný|svobodná}.',
    choices: [
      {
        label: 'Schovat ho na seníku a dát mu práci',
        hintType: 'trait', hintKey: 'patience',
        isRoll: true, baseChance: 0.5, traitKey: 'patience', traitScale: 0.05,
        onSuccess: { effects: { army: 2, prestige: 2 }, echo: { event: 'f_ozvena_uprchlik', after: [8, 14] }, chronicle: 'Chlapec přečkal hon pod senem a pak celou zimu pracoval na gruntu. Na jaře odešel do města — a na rozloučenou ti políbil ruku.' },
        onFailure: { effects: { favor: -10, gold: -5, prestige: 4 }, chronicle: 'Pacholci prohledali seník vidlemi. Chlapce odvedli zpátky do stáje a {lord.title} {lord.name} ti vyměřil{L:|a} pokutu. Ves ti od té doby smeká.' },
      },
      {
        label: 'Dát mu groše a poslat ho v noci do města',
        requires: (s) => s.resources.gold >= 4,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -4, prestige: 4 },
        echo: { event: 'f_ozvena_uprchlik', after: [8, 14] },
        chronicle: 'Chlapec odešel před svítáním s měšcem a se jménem formana v Brodné, který se nikoho nevyptává. Matěj ti druhý den v kostele mlčky stiskl ruku.',
      },
      {
        label: 'Odmítnout, tohle není tvůj boj',
        hintType: 'trait', hintKey: 'patience',
        effects: { prestige: -4 },
        chronicle: 'Okenice zůstala zavřená. Chlapce chytili za dva dny u brodu.',
      },
      {
        label: 'Dát vědět pánovým pacholkům',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 8, prestige: -8 },
        chronicle: 'Pacholci si pro chlapce přišli ještě té noci. {lord.Title} {lord.name} poslal{L:|a} poděkování; Matěj už s tebou nepromluví.',
      },
    ],
  },

  {
    id: 'f_kmotrovstvi',
    scenario: SED, oneTime: true, minTurn: 2,
    requires: freeMan,
    target: (s) => (s.spymaster && s.spymaster.alive !== false ? 'spymaster' : null),
    image: img('krest_ditete'),
    title: 'Kmotrovství',
    text: '{target.name}, {target.role} od návsi, dnes ráno zaklepal{T:|a} na tvé dveře v nedělních šatech. V rodině se narodilo dítě. Za kmotra se obvykle zve rychtář nebo mlynář — kdo stojí výš, ten dítěti otevře dveře do světa. Tentokrát ale prosí tebe: svobodný grunt mezi kmotry je pro dítě z krčmy víc, než kdy doufali.',
    choices: [
      {
        label: 'Přijmout a dát štědrý křestní dar',
        requires: (s) => s.resources.gold >= 6,
        hintType: 'resource', hintKey: 'prestige',
        effects: { gold: -6, prestige: 6 },
        courtEffects: { target: { loyalty: 10 } },
        echo: { event: 'f_ozvena_kmotr', after: [8, 14] },
        chronicle: 'Při křtu ses {R:postavil|postavila} vedle kmotrů a do peřinky vložil{R:|a} stříbrný groš. Celá ves viděla, s kým se rod {dynastyName} kmotří.',
      },
      {
        label: 'Přijmout skromně, jak se mezi sousedy sluší',
        hintType: 'trait', hintKey: 'eloquence',
        effects: { prestige: 3, gold: -1 },
        courtEffects: { target: { loyalty: 5 } },
        echo: { event: 'f_ozvena_kmotr', after: [8, 14] },
        chronicle: 'Kmotrovství bylo skromné a upřímné. V krčmě se teď za tebe pije bez placení — skoro.',
      },
      {
        label: 'Zdvořile odmítnout',
        hintType: 'trait', hintKey: 'patience',
        effects: { prestige: -3 },
        courtEffects: { target: { loyalty: -8 } },
        chronicle: 'Odmítnutí bylo zdvořilé, ale v krčmě se ti od té doby nalévá o něco pomaleji.',
      },
    ],
  },

  {
    id: 'f_obecni_les',
    scenario: SED, cooldown: 16, minTurn: 4, seasons: [2, 3],
    requires: freeMan,
    image: img('zastava_lesa'),
    title: 'Dříví z obecního lesa',
    text: 'Svobodní hospodáři odjakživa berou dříví z obecního lesa nad vsí. Nový panský hajný ale tvrdí, že les patří {L:pánovi|paní} a že svobodní mají práva jen do té doby, dokud jim je {lord.title} {lord.name} nechá. Tvůj vůz s dřívím zabavil u cesty a sekeru si odnesl na panský dvůr. Zima je za dveřmi.',
    choices: [
      {
        label: 'Předložit listinu o svobodě i se starými právy',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.45, traitKey: 'intelligence', traitScale: 0.05,
        onSuccess: { effects: { stability: 5, prestige: 4 }, traitGain: 'intelligence', chronicle: 'Farář přečetl listinu nahlas před hajným i před půlkou vsi: právo na dříví stojí černé na bílém. Vůz se vrátil, sekera taky.' },
        onFailure: { effects: { stability: -3, favor: -5 }, chronicle: 'Hajný listinu ani nevzal do ruky. „Číst neumím,“ řekl, „a {lord.title} to číst nebude.“ Dříví i sekera zůstaly na panském.' },
      },
      {
        label: 'Zaplatit lesné a mít pokoj',
        requires: (s) => s.resources.gold >= 5,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -5, stability: 3 },
        chronicle: 'Hajný shrábl groše a vůz s dřívím pustil. Lesné se teď bude platit každý rok, právo neprávo.',
      },
      {
        label: 'Jet do lesa s čeledí a sekerami',
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.5, traitKey: 'strength', traitScale: 0.04, resourceKey: 'army', resourceScale: 0.3,
        onSuccess: { effects: { stability: 6, prestige: 3, favor: -5 }, traitGain: 'strength', chronicle: 'Hajný se díval, jak tvoje čeleď kácí, a neodvážil se ceknout. Dříví je doma a v lese zase platí staré právo.' },
        onFailure: { effects: { army: -2, gold: -4, favor: -10 }, chronicle: 'Hajný přivedl pacholky. Dva čeledíni skončili v panské šatlavě. Pustili je, až když jsi {R:zaplatil|zaplatila}, a oba pak raději odešli sloužit jinam.' },
      },
      {
        label: 'Ustoupit a topit, čím se dá',
        hintType: 'trait', hintKey: 'patience',
        effects: { stability: -4 },
        chronicle: 'Letos se na gruntu topí slámou a starými plaňkami. Hajný slaví vítězství, o kterém ví celá ves.',
      },
    ],
  },

  // ---------- echoes of the free man ----------

  {
    id: 'f_ozvena_uprchlik',
    scenario: SED, forced: true, echo: true,
    requires: freeMan,
    image: img('kupecka_gilda'),
    title: 'Návrat z města',
    text: 'Na zápraží stojí urostlý chlap v kabátci z dobrého sukna. Trvá chvíli, než v něm poznáš syna souseda Matěje, který tenkrát utekl z panské stáje. V Brodné se vyučil formanem, má vlastní vůz a s sebou dva kamarády, kteří hledají práci. „Dlužím ti víc než groše,“ říká.',
    choices: [
      {
        label: 'Vzít jeho kamarády na grunt',
        hintType: 'resource', hintKey: 'army',
        effects: { army: 4, gold: -3 },
        chronicle: 'Dva formanští pomocníci zůstali na gruntu jako čeleď. Pracují, jako by spláceli cizí dluh.',
      },
      {
        label: 'Přijmout splátku v groších',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 8 },
        chronicle: 'Matějův syn vysypal na stůl víc grošů, než jsi mu kdy {R:dal|dala}. Dluh je splacen i s úrokem.',
      },
      {
        label: 'Domluvit se, že bude vozit tvé obilí do města',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.55, traitKey: 'intelligence', traitScale: 0.04,
        onSuccess: { effects: { gold: 6, prestige: 2 }, traitGain: 'intelligence', chronicle: 'Formanský vůz teď jezdí z gruntu do Brodné každý měsíc. Obilí se prodává za městskou cenu, ne za vesnickou.' },
        onFailure: { effects: { food: -4, gold: -2 }, chronicle: 'Na první cestě se vůz převrhl v brodu. Matějův syn se omlouval, ale obilí odplavala voda.' },
      },
    ],
  },

  {
    id: 'f_ozvena_kmotr',
    scenario: SED, forced: true, echo: true,
    requires: (s) => freeMan(s) && !!s.spymaster && s.spymaster.alive !== false,
    image: img('pozar_mesta'),
    title: 'Kmotrovská povinnost',
    text: 'Krčmu od návsi v noci zachvátil požár. {target.name} zachránil{T:|a} děti a holé životy, sklep a výčep lehly popelem. Podle starého zvyku má kmotr pomoci, když rodina kmotřence padne na dno — a celá ves se teď dívá k tvému gruntu.',
    choices: [
      {
        label: 'Vzít dvě starší děti na grunt do služby',
        hintType: 'resource', hintKey: 'army',
        effects: { army: 3, food: -4, prestige: 4 },
        courtEffects: { target: { loyalty: 8 } },
        chronicle: 'Dvě děti z vyhořelé krčmy teď slouží na gruntu. Pracují za jídlo a střechu a ves říká, že {R:kmotra|kmotru} si rodina vybrala dobře.',
      },
      {
        label: 'Dát peníze na nový krov',
        requires: (s) => s.resources.gold >= 6,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -6, prestige: 5 },
        courtEffects: { target: { loyalty: 12 } },
        chronicle: 'Na krčmě je nový krov a nad dveřmi visí věnec. První pivo se točilo na zdraví {R:kmotra|kmotry} z gruntu.',
      },
      {
        label: 'Poslat pytel mouky a víc nic',
        hintType: 'resource', hintKey: 'food',
        effects: { food: -3, prestige: -2 },
        courtEffects: { target: { loyalty: -4 } },
        chronicle: 'Pytel mouky byl vděčně přijat. Čekalo se víc a řeklo se míň.',
      },
    ],
  },

  // ===================== THE GREAT LORD =====================

  {
    id: 'v_korunni_rada',
    scenario: SLE, oneTime: true, weight: 2, minTurn: 2,
    requires: (s) => greatLord(s) && kingAtHand(s) && s.resources.favor >= 45,
    image: img('n_urad_u_dvora'),
    title: 'Místo v korunní radě',
    text: '{king.Title} {king.name} svolává korunní radu a mezi starými jmény, která u stolu sedí odjakživa, je poprvé i rod {dynastyName}. Místo v radě znamená slyšet o válce dřív než ostatní a mít slovo při každém úřadu a každé berni — a nést vinu za každé špatné rozhodnutí, které se v radě udělá. Páni ostatních rodů ti už teď uhýbají pohledem.',
    choices: [
      {
        label: 'Zasednout a stát vždy za korunou',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 10, prestige: 4 },
        houseEffects: { '*': { attitude: -4 } },
        hiddenEffects: { setFlag: 'v_rada' },
        echo: { event: 'v_ozvena_rada', after: [6, 12] },
        chronicle: '{ruler.name} {R:usedl|usedla} v korunní radě po pravici {K:krále|královny}. Kdo chce něco od dvora, ví teď, za kým jít — a kdo to nemá rád, ví, koho nenávidět.',
      },
      {
        label: 'Zasednout a tiše si skládat vlastní stranu',
        hintType: 'trait', hintKey: 'intelligence',
        effects: { legitimacy: 6, favor: 3 },
        noble: { secrets: 1 },
        hiddenEffects: { setFlag: 'v_rada' },
        echo: { event: 'v_ozvena_rada', after: [6, 12] },
        chronicle: 'V radě se mluví nahlas a domlouvá potichu. Rod {dynastyName} poslouchá obojí a pamatuje si, kdo s kým hlasuje.',
      },
      {
        label: 'Odmítnout s díky, panství potřebuje své pány doma',
        hintType: 'trait', hintKey: 'patience',
        effects: { favor: -5, prestige: 2 },
        provinceEffects: { own: { loyalty: 4 } },
        chronicle: 'Místo v radě dostal jiný rod. {king.Title} {king.name} odmítnutí přijal{K:|a} chladně; na panství to lidé ocenili.',
      },
    ],
  },

  {
    id: 'v_snatkovy_trh',
    scenario: SLE, cooldown: 16, minTurn: 2,
    requires: (s) => greatLord(s),
    target: suitorHouse,
    image: img('hostina_slechty'),
    title: 'Dohazovači na tvrzi',
    text: 'Od doby, kdy rod {dynastyName} patří mezi velmože, se na tvrz sjíždějí dohazovači. {heir.name} je teď partie, o kterou stojí i staré rody, a nejvíc nabízí {house.headTitle} {house.head} z rodu {house.gen}: věno, spojenectví a místo u stolu, kde se rozhoduje o zemi. Jiní by na takovou nabídku čekali celý život.',
    choices: [
      {
        label: 'Přijmout nabídku a zpečetit spojenectví',
        hintType: 'resource', hintKey: 'legitimacy',
        effects: { gold: 10, legitimacy: 6 },
        houseEffects: { target: { married: true, ally: true, attitude: 15 } },
        chronicle: '{heir.name} byl{D:|a} zasnouben{D:|a} s potomkem rodu {house.gen}. Dva velké rody teď sedí u jednoho stolu.',
      },
      {
        label: 'Nechat rody přebíjet a vzít nejvyšší věno',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.45, traitKey: 'intelligence', traitScale: 0.05,
        onSuccess: { effects: { gold: 20, legitimacy: 3 }, houseEffects: { target: { married: true, attitude: 5 } }, traitGain: 'intelligence', chronicle: 'Dohazovači se předháněli celý měsíc. Rod {house.gen} nakonec složil věno, o kterém se bude mluvit ještě za vnuků.' },
        onFailure: { effects: { prestige: -4 }, houseEffects: { '*': { attitude: -6 } }, chronicle: 'Rody se urazily, že se s nimi kupčí jako na trhu. Dohazovači odjeli a s nimi i nabídky.' },
      },
      {
        label: 'Dědic počká na lepší partii',
        hintType: 'trait', hintKey: 'patience',
        effects: { prestige: 2 },
        houseEffects: { target: { attitude: -8 } },
        chronicle: 'Dohazovač rodu {house.gen} odjel s nepořízenou a urážku si odvezl s sebou. {heir.name} zatím zůstává bez zásnub.',
      },
    ],
  },

  {
    id: 'v_rytiri_u_brany',
    scenario: SLE, cooldown: 16, minTurn: 2,
    requires: (s) => greatLord(s) && !!(s.king && s.king.alive),
    image: img('potulny_rytir'),
    title: 'Rytíři u brány',
    text: 'Na nádvoří tvrze klečí pět rytířů bez pána: synové zchudlých zemanů, vysloužilci z královských válek a jeden dokonce v rezavé zbroji po dědovi. Chtějí složit lenní slib rodu {dynastyName} — meč a věrnost za kus půdy a místo u stolu. Velmož, který má vlastní muže, má váhu. {king.Title} {king.name} ale nerad{K:|a} vidí velmože, kteří mají víc mečů, než potřebují.',
    choices: [
      {
        label: 'Přijmout všech pět a dát jim léna',
        requires: (s) => s.resources.gold >= 12,
        hintType: 'resource', hintKey: 'army',
        effects: { army: 8, gold: -12, favor: -5 },
        echo: { event: 'v_ozvena_rytir', after: [8, 16] },
        chronicle: 'Pět rytířů složilo slib pod erbem rodu {dynastyName}. Korouhev je silnější — a u dvora se to počítá.',
      },
      {
        label: 'Vyzkoušet je na kolbišti a vzít jen nejlepší',
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.5, traitKey: 'strength', traitScale: 0.04,
        onSuccess: { effects: { army: 5, prestige: 3, gold: -6 }, traitGain: 'strength', echo: { event: 'v_ozvena_rytir', after: [8, 16] }, chronicle: '{ruler.name} se s každým z nich utkal{R:|a} osobně. Tři obstáli a složili slib, dva odjeli s modřinami a s úctou.' },
        onFailure: { effects: { army: 2, prestige: -3, gold: -4 }, chronicle: 'Rytíř v rezavé zbroji srazil {R:pána|paní} tvrze do písku. Slib složil jen on; ostatní se smáli celou cestu ze dvora.' },
      },
      {
        label: 'Poslat je ke dvoru, koruna potřebuje muže víc',
        requires: kingAtHand,
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 6, prestige: -2 },
        chronicle: 'Rytíři odjeli do Vlčího Údělu s doporučujícím listem. {king.Title} {king.name} si toho všiml{K:|a}.',
      },
      {
        label: 'Odmítnout',
        hintType: 'trait', hintKey: 'patience',
        effects: { prestige: -2 },
        chronicle: 'Rytíři odjeli hledat jiného pána. Možná ho najdou u rodu, který tě nemá rád.',
      },
    ],
  },

  {
    id: 'v_opovedny_list',
    scenario: SLE, cooldown: 18, minTurn: 3,
    requires: (s) => greatLord(s),
    target: hostileHouse,
    image: img('n_najezd_rodu'),
    title: 'Opovědný list',
    text: 'Posel rodu {house.gen} přibil na bránu tvrze opovědný list. {house.HeadTitle} {house.head} v něm rodu {dynastyName} vypovídá mír: od příštího úplňku budou {H:jeho|její} muži pálit, brát a zajímat, dokud nedostane zpět, co {H:mu|jí} podle {H:něj|ní} patří. Mezi drobnou šlechtou by to byla rvačka o louku. Mezi velmoži je to válka, kterou bude sledovat celá země.',
    choices: [
      {
        label: 'Vyrazit proti nim dřív, než vyjedou',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.45, traitKey: 'strength', traitScale: 0.03, resourceKey: 'army', resourceScale: 0.5,
        onSuccess: { effects: { army: -4, prestige: 8 }, houseEffects: { target: { power: -10, attitude: -6 } }, traitGain: 'strength', music: 'battle', echo: { event: 'v_ozvena_svar', after: [10, 18] }, chronicle: 'Družina rodu {dynastyName} vpadla do jejich tábora dřív, než stihli osedlat. Opovědný list putoval zpátky na sídlo rodu {house.gen}, připíchnutý na kopí.' },
        onFailure: { effects: { army: -10, prestige: -5, gold: -6 }, houseEffects: { target: { power: 4 } }, provinceEffects: { own: { wealth: -6, unrest: 6 } }, music: 'battle', chronicle: 'Výpad narazil na připravená kopí. Nepřítel teď pálí vsi rodu {dynastyName} a nikdo ho nezastaví.' },
      },
      {
        label: 'Povolat spojence pod korouhve',
        requires: (s) => allies(s) >= 1,
        hintType: 'resource', hintKey: 'legitimacy',
        effects: { army: -2, prestige: 4 },
        houseEffects: { target: { power: -6, attitude: 6 }, allies: { attitude: -3 } },
        chronicle: 'U brodu se pod korouhvemi spojenců sešlo tolik mužů, že rod {house.gen} vzal opověď zpátky dřív, než padla první rána. Spojenci si za tu službu jednou řeknou.',
      },
      {
        label: 'Předložit spor koruně',
        requires: kingAtHand,
        hintType: 'resource', hintKey: 'favor',
        isRoll: true, baseChance: 0.4, resourceKey: 'favor', resourceScale: 0.5,
        onSuccess: { effects: { gold: 8, favor: -2 }, houseEffects: { target: { power: -6, attitude: -4 } }, chronicle: '{king.Title} {king.name} zakázal{K:|a} svár pod trestem ztráty lén a rodu {house.gen} vyměřil{K:|a} pokutu. Opovědný list visí v síni tvrze jako trofej.' },
        onFailure: { effects: { favor: -4, prestige: -4 }, provinceEffects: { own: { wealth: -5 } }, chronicle: 'Koruna se do sporu dvou velmožů plést nechtěla. Rod {house.gen} vyjel a tvé vsi platí za královské mlčení.' },
      },
      {
        label: 'Nabídnout smír a odškodné',
        requires: (s) => s.resources.gold >= 15,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -15, prestige: -3 },
        houseEffects: { target: { attitude: 15 } },
        chronicle: 'Rod {dynastyName} zaplatil, co rod {house.gen} žádal. Opověď byla vzata zpět, úsměšky u dvora ne.',
      },
    ],
  },

  {
    id: 'v_turnaj',
    scenario: SLE, cooldown: 20, minTurn: 2, seasons: [0, 1],
    requires: (s) => greatLord(s),
    image: img('turnaj'),
    title: 'Turnaj pod tvrzí',
    text: 'Velmož, který pořádá turnaj, ukazuje celé zemi, že si to může dovolit. Pod tvrzí rodu {dynastyName} by se sjeli rytíři ze všech tří velkých rodů, z královského dvora i ze ciziny, a s nimi kupci, kejklíři a půlka pobřeží. Zbývá rozhodnout, kolik to bude stát — a jestli se na kolbišti ukáže i {R:pán|paní} domu.',
    choices: [
      {
        label: 'Uspořádat okázalý turnaj pro celou šlechtu',
        requires: (s) => s.resources.gold >= 18,
        hintType: 'resource', hintKey: 'prestige',
        effects: { gold: -18, prestige: 8, favor: 4 },
        houseEffects: { '*': { attitude: 5 } },
        chronicle: 'Turnaj pod tvrzí trval týden. Na kolbišti se lámala kopí, v síni se uzavíraly sňatky i dluhy a celá země mluvila o rodu {dynastyName}.',
      },
      {
        label: 'Vjet do klání osobně',
        combat: 'rytir', // fought out in rounds (combat.js)
        requires: (s) => s.resources.gold >= 12,
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.35, traitKey: 'strength', traitScale: 0.06,
        onSuccess: { effects: { gold: -12, prestige: 10, legitimacy: 4 }, traitGain: 'strength', chronicle: 'Dřevec {R:pána|paní} tvrze shodil z koně tři soupeře, mezi nimi i rytíře z královské družiny. Po turnaji se o rodu {dynastyName} zpívalo v každé krčmě na pobřeží.' },
        onFailure: { effects: { gold: -12, prestige: -4 }, injury: { pool: ['pohmozdeni', 'zlomenina', 'jizva'], chance: 0.6 }, chronicle: 'Hned v prvním klání skončil{R:|a} hostitel{R:|ka} v písku. Hosté se zdvořile dívali jinam.' },
      },
      {
        label: 'Skromný turnaj jen pro vlastní rytíře',
        hintType: 'resource', hintKey: 'army',
        effects: { gold: -6, army: 3, prestige: 2 },
        chronicle: 'Na kolbišti se utkali jen rytíři z vlastní korouhve. Hostů bylo málo, ale muži se naučili víc než za rok cvičení.',
      },
      {
        label: 'Odmítnout, peníze patří do hradeb',
        hintType: 'resource', hintKey: 'gold',
        effects: { prestige: -3 },
        chronicle: 'Turnaj se nekonal. Mladí rytíři hledají slávu u jiných rodů.',
      },
    ],
  },

  {
    id: 'v_zkouska_vernosti',
    scenario: SLE, cooldown: 24, minTurn: 4,
    requires: (s) => greatLord(s) && kingAtHand(s),
    target: closestHouse,
    image: img('n_obvineni_u_dvora'),
    title: 'Zkouška věrnosti',
    text: 'Královský posel přivezl list s pečetí, kterou nikdo nesmí odmítnout. {king.Title} {king.name} obviňuje rod {house.gen} ze zrady a přikazuje: {house.headTitle} {house.head} má být zajat{H:|a} a do měsíce dopraven{H:|a} v okovech do Vlčího Údělu — a to právě rodem {dynastyName}, protože {H:ho|ji} zná nejlíp. U dvora se šeptá, že důkazy nejsou žádné. Že jde o zkoušku, kdo poslechne.',
    choices: [
      {
        label: 'Poslechnout rozkaz',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 12, prestige: -4, legitimacy: -3 },
        houseEffects: { target: { attitude: -30, ally: false, power: -8 } },
        chronicle: '{house.HeadTitle} {house.head} odjel{H:|a} do Vlčího Údělu v okovech, které {H:mu|jí} nasadil rod {dynastyName}. {king.Title} {king.name} je spokojen{K:|a}. Ostatní rody si zapamatovaly, kolik stojí přátelství rodu {dynastyName}.',
      },
      {
        label: 'Varovat je tajně a zajmout jen prázdné sídlo',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.45, traitKey: 'intelligence', traitScale: 0.05,
        onSuccess: { effects: { favor: 2 }, houseEffects: { target: { attitude: 15 } }, noble: { secrets: 1 }, traitGain: 'intelligence', chronicle: '{house.HeadTitle} {house.head} uprchl{H:|a} za hranice den před příjezdem družiny. Rod {dynastyName} vykonal rozkaz do písmene — a rod {house.gen} mu dluží život.' },
        onFailure: { effects: { favor: -12, legitimacy: -4 }, houseEffects: { target: { attitude: 10 } }, chronicle: 'Varovný dopis zachytili královi lidé. {king.Title} {king.name} teď ví, komu rod {dynastyName} věří víc než koruně.' },
      },
      {
        label: 'Postavit se za obviněné před korunou',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.35, traitKey: 'eloquence', traitScale: 0.05, resourceKey: 'favor', resourceScale: 0.4,
        onSuccess: { effects: { favor: -3, prestige: 6, legitimacy: 4 }, houseEffects: { target: { attitude: 18 }, '*': { attitude: 3 } }, traitGain: 'eloquence', chronicle: 'Rod {dynastyName} se před celou radou zaručil za čest rodu {house.gen}. {king.Title} {king.name} obvinění stáhl{K:|a} a šlechta poprvé uviděla velmože, který se nebojí koruně odporovat.' },
        onFailure: { effects: { favor: -12, prestige: -3 }, houseEffects: { target: { attitude: 8 } }, chronicle: '{king.Title} {king.name} vyslechl{K:|a} obhajobu mlčky a pak se zeptal{K:|a}, zda rod {dynastyName} také stojí na straně zrádců. Na takovou otázku se u dvora neodpovídá.' },
      },
      {
        label: 'Odmítnout rozkaz',
        hintType: 'trait', hintKey: 'strength',
        effects: { favor: -10, prestige: 3 },
        houseEffects: { target: { attitude: 12 } },
        chronicle: 'Rod {dynastyName} poslal posla zpátky s prázdnýma rukama a se vzkazem, že velmož není biřic. Koruna to slyšela.',
      },
    ],
  },

  {
    id: 'v_jizni_vyslanec',
    scenario: SLE, cooldown: 28, minTurn: 4,
    requires: (s) => greatLord(s) && kingAtHand(s) && !!(s.realms && s.realms.south && !s.realms.south.owner),
    image: img('cizi_vyslanec'),
    title: 'Galéra s purpurovými plachtami',
    text: 'Do přístavu pod tvrzí připlula galéra s purpurovými plachtami. Vyslanec, kterého posílá {realm.south} z Jižní říše, vystoupil na břeh s dary — hedvábím, kořením a skříňkou, ve které cinká zlato. Prý jen zdraví velmože, o kterém se mluví až za mořem. Mezi řečí se ale vyptává na královské loďstvo, na zdraví {K:krále|královny} a na to, kdo by po {K:něm|ní} mohl vládnout.',
    choices: [
      {
        label: 'Přijmout dary a mluvit jen o počasí',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.5, traitKey: 'intelligence', traitScale: 0.05,
        onSuccess: { effects: { gold: 12, prestige: 3 }, realm: { south: { attitude: 6 } }, traitGain: 'intelligence', chronicle: 'Vyslanec odplul s pěknými slovy a bez jediné užitečné zprávy. Skříňka se zlatem zůstala na tvrzi.' },
        onFailure: { effects: { gold: 12, favor: -8 }, chronicle: 'Každé slovo bylo pečlivě zváženo, a přesto se u dvora rozneslo, že rod {dynastyName} hostil cizího zvěda. Zlato zůstalo, důvěra koruny odplula.' },
      },
      {
        label: 'Prodat mu, co chce vědět',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 20, legitimacy: 3 },
        realm: { south: { attitude: 12 } },
        echo: { event: 'v_ozvena_vyslanec', after: [6, 12] },
        chronicle: 'Vyslanec se dozvěděl o loďstvu všechno, co rod {dynastyName} věděl. Skříňka se zlatem zůstala na tvrzi a galéra odplula k jihu.',
      },
      {
        label: 'Doprovodit vyslance ke dvoru',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 10 },
        realm: { south: { attitude: -12 } },
        chronicle: 'Vyslanec byl s poctami, ale pod dohledem dopraven do Vlčího Údělu. {king.Title} {king.name} poděkoval{K:|a} za věrnost; za mořem si zapamatovali jméno, které jim zavřelo dveře.',
      },
    ],
  },

  {
    id: 'v_biskupova_prizen',
    scenario: SLE, cooldown: 18, minTurn: 2,
    requires: (s) => greatLord(s) && !!(s.king && s.king.alive),
    image: img('katedrala'),
    title: 'Biskupova přízeň',
    text: 'Biskup z Vlčího Údělu staví nový chór katedrály a hledá velmože, kteří by se jím chtěli proslavit. Kdo dá na stavbu, tomu kapitula vyhradí místo v kryptě a kazatelé jeho jméno na kazatelnách. Biskup má navíc ucho {K:krále|královny} i prostého lidu — a hlas při každé korunovaci.',
    choices: [
      {
        label: 'Zaplatit kapli s erbem rodu',
        requires: (s) => s.resources.gold >= 15,
        hintType: 'resource', hintKey: 'faith',
        effects: { gold: -15, faith: 6, legitimacy: 5 },
        chronicle: 'V novém chóru katedrály se klene kaple s erbem rodu {dynastyName}. Biskup ji vysvětil sám a při každé mši se modlí za její dárce.',
      },
      {
        label: 'Prosadit vlastního kaplana do kapituly',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.4, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { legitimacy: 6, faith: 2 }, noble: { secrets: 1 }, traitGain: 'eloquence', chronicle: 'Kaplan rodu {dynastyName} usedl v kapitule. Co se šeptá v síních Vlčího Údělu, se teď dozví i tvrz u moře.' },
        onFailure: { effects: { favor: -5, faith: -3 }, chronicle: 'Kapitula kandidáta odmítla a biskup si u dvora stěžoval, že velmoži kupčí s církevními úřady.' },
      },
      {
        label: 'Podpořit biskupa ve sporu s korunou o desátky',
        requires: kingAtHand,
        hintType: 'resource', hintKey: 'legitimacy',
        effects: { favor: -8, faith: 5, legitimacy: 6 },
        chronicle: 'Rod {dynastyName} se v radě postavil za biskupa. {king.Title} {king.name} se mračí, kazatelé po celé zemi chválí zbožného velmože.',
      },
      {
        label: 'Poslat skromný dar',
        hintType: 'trait', hintKey: 'patience',
        effects: { gold: -4, faith: 2 },
        chronicle: 'Biskup dar přijal s požehnáním, které stálo přesně tolik, kolik dar.',
      },
    ],
  },

  // ---------- echoes of the great lord ----------

  {
    id: 'v_ozvena_rada',
    scenario: SLE, forced: true, echo: true,
    requires: (s) => greatLord(s) && kingAtHand(s),
    image: img('nespokojeny_radce'),
    title: 'Hlasování v radě',
    text: 'Korunní rada se přela do noci. {king.Title} {king.name} chce novou válečnou berni ze všech panství a ostatní velmoži už dali najevo, že jsou proti. Hlasy jsou vyrovnané a všichni se dívají na rod {dynastyName}. Jedno slovo rozhodne, kdo bude zítra platit — a koho bude koruna příště poslouchat.',
    choices: [
      {
        label: 'Hlasovat s korunou',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 10, gold: -8 },
        houseEffects: { '*': { attitude: -6 } },
        chronicle: 'Berně prošla jediným hlasem — hlasem rodu {dynastyName}. Panství platí jako ostatní a ostatní rody to dávají najevo.',
      },
      {
        label: 'Hlasovat s velmoži proti berni',
        hintType: 'resource', hintKey: 'legitimacy',
        effects: { favor: -10, legitimacy: 5 },
        houseEffects: { '*': { attitude: 8 } },
        chronicle: 'Berně padla. {king.Title} {king.name} odešel{K:|a} od stolu bez pozdravu a velmoži si s rodem {dynastyName} poprvé připili jako s rovným.',
      },
      {
        label: 'Navrhnout berni jen z královských měst',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.4, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { favor: 5, legitimacy: 4, prestige: 4 }, traitGain: 'eloquence', chronicle: 'Návrh přijaly obě strany: koruna dostane peníze a panství zůstanou ušetřena. U dvora se o rodu {dynastyName} poprvé mluví jako o rozumném hlasu.' },
        onFailure: { effects: { favor: -6, prestige: -3 }, houseEffects: { '*': { attitude: -3 } }, chronicle: 'Smír se nelíbil nikomu. Koruna v něm slyšela vzdor, velmoži zradu.' },
      },
    ],
  },

  {
    id: 'v_ozvena_rytir',
    scenario: SLE, forced: true, echo: true,
    requires: (s) => greatLord(s),
    image: img('rvaci_v_krcme'),
    title: 'Rytíř z tvé korouhve',
    text: 'Rytíř Bořek, jeden z těch, kdo ti kdysi složili lenní slib na nádvoří, se v krčmě pohádal s mužem jiného rodu a zabil ho. Rodina zabitého žádá jeho hlavu. Ostatní vazalové mlčí a čekají, jestli velmož ochrání svého člověka — a celý dvůr čeká s nimi.',
    choices: [
      {
        label: 'Vydat ho spravedlnosti',
        hintType: 'resource', hintKey: 'favor',
        effects: { prestige: -4, army: -2, favor: 4 },
        houseEffects: { '*': { attitude: 4 } },
        chronicle: 'Rytíř Bořek byl vydán a souzen. Ostatní vazalové od té doby mluví tišeji — a přísahají méně ochotně.',
      },
      {
        label: 'Ochránit ho, kdo přísahal rodu, toho rod nevydá',
        hintType: 'trait', hintKey: 'strength',
        effects: { prestige: 5, favor: -6 },
        houseEffects: { '*': { attitude: -6 } },
        courtEffects: { marshal: { loyalty: 6 } },
        chronicle: 'Bořek zůstal na tvrzi pod ochranou erbu. Vazalové vědí, že {R:jejich pán|jejich paní} za ně stojí; ostatní rody vědí totéž.',
      },
      {
        label: 'Zaplatit rodině zabitého pokrevní pokutu',
        requires: (s) => s.resources.gold >= 12,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -12, prestige: 2 },
        chronicle: 'Rodina zabitého přijala stříbro místo krve. Bořek odešel na pouť a vrátil se pokornější.',
      },
    ],
  },

  {
    id: 'v_ozvena_svar',
    scenario: SLE, forced: true, echo: true,
    requires: (s) => greatLord(s) && !!(s.eventContext && s.eventContext.house),
    image: img('n_hostina_rodu'),
    title: 'Smírčí hostina',
    text: 'Rod {house.gen} nezapomněl na noc, kdy jeho tábor hořel. {house.HeadTitle} {house.head} teď posílá vzkaz: válčit už nebude, zve na smírčí hostinu. A každý u dvora ví, jak takové hostiny mezi velmoži končívají.',
    choices: [
      {
        label: 'Přijet s početnou družinou',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.55, traitKey: 'intelligence', traitScale: 0.03, resourceKey: 'army', resourceScale: 0.4,
        onSuccess: { effects: { prestige: 6 }, houseEffects: { target: { attitude: 12 } }, chronicle: 'Hostina proběhla bez jediného tasení meče — u dveří stála družina rodu {dynastyName} a všichni ji viděli. Na konci si oba rody připily na smír.' },
        onFailure: { effects: { army: -6, prestige: -4 }, houseEffects: { target: { attitude: -6 } }, injury: { pool: ['rana', 'jizva', 'pohmozdeni'], chance: 0.4 }, music: 'battle', chronicle: 'Při třetím přípitku zhasly pochodně. Družina se probila ven, ale ne celá.' },
      },
      {
        label: 'Poslat místo sebe dar a omluvu',
        requires: (s) => s.resources.gold >= 10,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -10 },
        houseEffects: { target: { attitude: 8 } },
        chronicle: 'Do síně rodu {house.gen} dorazil stříbrný pohár místo hosta. Smír zatím stojí jen na pergamenu — ale pergamen nekrvácí.',
      },
      {
        label: 'Odmítnout pozvání',
        hintType: 'trait', hintKey: 'patience',
        effects: { prestige: -2 },
        houseEffects: { target: { attitude: -10 } },
        chronicle: 'Pozvání se vrátilo nepřečtené. Nenávist mezi rody tím jen zesílila.',
      },
    ],
  },

  {
    id: 'v_ozvena_vyslanec',
    scenario: SLE, forced: true, echo: true,
    requires: (s) => greatLord(s) && kingAtHand(s),
    image: img('pirati'),
    title: 'Lodě u Šedých skal',
    text: 'Královské loďstvo narazilo u Šedých skal na jižní galéry, které věděly, kudy a kdy poplují. Tři lodě šly ke dnu. Ve Vlčím Údělu se hledá, kdo s vyslancem z jihu mluvil — a stopa vede do přístavu pod tvou tvrzí.',
    choices: [
      {
        label: 'Svést vinu jinam listinou z truhly',
        requires: (s) => s.noble && s.noble.secrets > 0,
        hintType: 'trait', hintKey: 'intelligence',
        effects: { favor: 4 },
        noble: { secrets: -1 },
        houseEffects: { '*': { attitude: -4 } },
        chronicle: 'Listina z železné truhly ukázala jinam. Vyšetřovatelé odjeli s jiným jménem a rod {dynastyName} s čistým štítem — aspoň navenek.',
      },
      {
        label: 'Podplatit královského vyšetřovatele',
        requires: (s) => s.resources.gold >= 15,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -15 },
        chronicle: 'Vyšetřovatel našel v přístavu jen rybáře a sůl. Kdo platí, ten nic neviděl.',
      },
      {
        label: 'Zapírat před radou',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.4, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { prestige: 2 }, traitGain: 'eloquence', chronicle: 'Rod {dynastyName} se hájil tak klidně, že podezření padlo na přístavní písaře. Vyšetřovatelé odjeli s jejich jmény.' },
        onFailure: { effects: { favor: -12, legitimacy: -6, gold: -10 }, chronicle: '{king.Title} {king.name} obhajobě nevěřil{K:|a}. Rod {dynastyName} zaplatil za tři potopené lodě zlatem i jménem.' },
      },
    ],
  },
];
