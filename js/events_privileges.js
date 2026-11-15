// Privileges and offices (privileges.js): how a peasant or a free man comes by the right to a mill,
// an inn, the hunt, a toll, a council seat or freedom from labour service, and what holding one
// brings with it: disputes to judge, rivals, brawls, poachers, and a lord who may take it back.
// Offers are gated by rank, reputation and what the farm has, and by canOffer (at most three
// privileges at a time, not two within a year and a half). Ids start with pv_ (a decision worth
// remembering in the Hall of Ancestors, unlike the prologue's p_ cards).
// The village reeve is the old s_rychtar_volba in events_peasant.js; it grants the first entry too.

import { hasPrivilege, canOffer, PRIVILEGES, grantedByLord } from './privileges.js';

const S = 'sedlak';
const img = (id) => `assets/events/${id}.jpg`;

const freeMan = (s) => s.ruler.statusTier === 2;
const holds = (key) => (s) => hasPrivilege(s, key);

export const PRIVILEGE_EVENTS = [
  // ===================== OFFERS =====================

  {
    id: 'pv_mlyn_nabidka',
    scenario: S, cooldown: 20, minTurn: 6, weight: 1.2,
    requires: (s) => canOffer(s, 'mlyn') && PRIVILEGES.mlyn.needs(s) && s.resources.favor >= 30,
    image: img('n_mlyn'),
    title: 'Mlýn na potoce',
    text: 'Na potoce za humny klape tvůj mlýnek a po vsi se šeptá, že v něm mele i cizí obilí. {lord.Title} {lord.name} má vlastní mlýn u panského dvora. Mlynář Hrdlička tam bere z každého pytle míru a {L:pán nerad vidí|paní nerada vidí}, jak se {L:mu|jí} míra ztrácí. Purkrabí vzkázal, že kdo mele na cizí účet bez práva, platí pokutu. Právo se ale dá i získat.',
    choices: [
      {
        label: 'Požádat {L:pána|paní} o mlýnské právo',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.42, traitKey: 'eloquence', traitScale: 0.04,
        chanceBonus: (s) => (s.resources.favor - 40) / 200,
        onSuccess: { effects: { gold: -6, favor: -2 }, grantPrivilege: 'mlyn', traitGain: 'eloquence', chronicle: '{lord.Title} {lord.name} podepsal{L:|a} listinu: smíš mlít pro celou ves a brát si mírku, panskému dvoru se ale ročně odvádí činže. Mlynář Hrdlička od té doby chodí kolem tvého potoka po špičkách.' },
        onFailure: { effects: { gold: -3, favor: -3 }, chronicle: 'Purkrabí listinu nepodepsal: prý je v kraji mlýnů dost. Aspoň pokutu jsi nedostal{R:|a}, ale poplatek za audienci zaplatit musel{R:|a}.' },
      },
      {
        label: 'Slíbit {L:pánovi|paní} každý rok pytel nejlepší mouky',
        requires: (s) => s.resources.gold >= 3,
        hintType: 'resource', hintKey: 'favor',
        effects: { gold: -3, favor: 3 },
        grantPrivilege: 'mlyn',
        echo: { event: 'pv_mlyn_dluh', after: [8, 14] },
        chronicle: '{L:Pán|Paní} slib kývnutím přijal{L:|a} a purkrabí ho zapsal. Mlýnské právo je tvé, ale ten pytel mouky je dluh, který se bude každý rok vracet.',
      },
      {
        label: 'Mlít dál tiše a nikomu nic neříkat',
        hintType: 'trait', hintKey: 'patience',
        isRoll: true, baseChance: 0.5, traitKey: 'patience', traitScale: 0.05,
        onSuccess: { effects: { food: 3, gold: 2 }, traitGain: 'patience', chronicle: 'Sousedé nosí pytle po setmění a mlynář Hrdlička dělá, že nevidí. Mlýnek klape dál, jenom bez práva.' },
        onFailure: { effects: { gold: -5, favor: -5 }, chronicle: 'Hrdlička to nevydržel a práskl purkrabímu. Pokuta byla vyšší než všechna mírka dohromady.' },
      },
      {
        label: 'Nechat to být',
        hintType: 'trait', hintKey: 'patience',
        effects: {},
        chronicle: 'Mlýnek zůstal mlýnkem pro vlastní potřebu. Hrdlička se nahlas smál.',
      },
    ],
  },

  {
    id: 'pv_hospoda_nabidka',
    scenario: S, cooldown: 20, minTurn: 8, weight: 1.2,
    requires: (s) => freeMan(s) && canOffer(s, 'hospoda') && s.resources.prestige >= 30,
    image: img('rvaci_v_krcme'),
    title: 'Právo čepovat',
    text: 'V krčmě už se nikdo nevejde a {spymaster.title} {spymaster.name} nestačí nalévat. {lord.Title} {lord.name} prodává právo vařit pivo a čepovat ho hostům. Patří k panství a kdo ho nemá, ten smí nanejvýš pít. Svobodný hospodář s ječmenem, se sklepem a s dobrým jménem o ně může požádat. Platí se za ně groši a starostmi: víc hostů znamená víc zisku a taky víc rvaček.',
    choices: [
      {
        label: 'Koupit hospodské právo od {L:pána|paní}',
        requires: (s) => s.resources.gold >= 12,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -12, favor: 2 },
        grantPrivilege: 'hospoda',
        chronicle: 'Listina s pečetí leží v truhle. Na štítu nad vraty rodu {dynastyName} teď visí věnec z chmele.',
      },
      {
        label: 'Domluvit se s {Y:krčmářem|krčmářkou} na společném šenku',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.5, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { gold: -5 }, courtEffects: { spymaster: { loyalty: 10 } }, grantPrivilege: 'hospoda', traitGain: 'eloquence', chronicle: '{spymaster.Title} {spymaster.name} zůstává u výčepu a ty ve sklepě. Pivo se vaří z tvého sladu a každý ví, komu poděkovat.' },
        onFailure: { effects: { gold: -3, prestige: -2 }, courtEffects: { spymaster: { loyalty: -8 } }, chronicle: '{spymaster.Title} {spymaster.name} se urazil{Y:|a}, že mu chceš vzít kus chleba. Rozhovor skončil u dveří a nikdo se nedohodl.' },
      },
      {
        label: 'Převzít šenk a krčmáře vyštvat',
        requires: (s) => s.resources.gold >= 8,
        hintType: 'resource', hintKey: 'prestige',
        effects: { gold: -8, prestige: -3, favor: 2 },
        courtEffects: { spymaster: { loyalty: -30 } },
        grantPrivilege: 'hospoda',
        chronicle: 'Právo máš a {spymaster.title} {spymaster.name} ho nemá. Na návsi se mluví o tom, že kdo si v Lipnici stoupne do cesty rodu {dynastyName}, vaří pivo pro jiné.',
      },
      {
        label: 'Nechat to být',
        hintType: 'trait', hintKey: 'patience',
        effects: {},
        chronicle: 'Pivo se dál vaří v cizím kotli. Tobě zbývá jen ho pít.',
      },
    ],
  },

  {
    id: 'pv_lov_nabidka',
    scenario: S, cooldown: 20, minTurn: 8, weight: 1.2,
    requires: (s) => freeMan(s) && canOffer(s, 'lov') && (s.resources.favor >= 45 || s.resources.faith >= 55),
    image: img('s_pytlactvi'),
    title: 'Zajíc, bažant a kapr',
    text: 'Panský les je plný zvěře a panské rybníky plné kaprů, jenže kdo tam bez práva sáhne po luku nebo po síti, přijde o ruku nebo o grunt. Hajný se v Lipnici zastavuje čím dál častěji a pozorně se dívá na tvůj stůl. A klášter na útesu prý hledá hospodáře, který by za modlitbu a dar pečoval o opatovy rybníky pod lesem.',
    choices: [
      {
        label: 'Požádat {L:pána|paní} o právo lovu drobné zvěře a rybolovu',
        requires: (s) => s.resources.favor >= 45,
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.45, traitKey: 'eloquence', traitScale: 0.04,
        chanceBonus: (s) => (s.resources.favor - 50) / 200,
        onSuccess: { effects: { gold: -4, favor: -2 }, grantPrivilege: 'lov', traitGain: 'eloquence', chronicle: '{lord.Title} {lord.name} dovolil{L:|a} zajíce, ptáky a ryby, jelena ne. Hajný listinu přečetl dvakrát a nic proti ní neměl, i když by rád.' },
        onFailure: { effects: { favor: -3, prestige: -1 }, chronicle: '{L:Pán řekl|Paní řekla}, že kdo chce zvěř, ať si ji koupí na trhu. Hajný se na tebe díval jako na pytláka, kterého ještě nechytil.' },
      },
      {
        label: 'Přijmout nabídku opata a starat se o klášterní rybníky',
        requires: (s) => s.resources.faith >= 55 && s.resources.gold >= 3,
        hintType: 'resource', hintKey: 'faith',
        effects: { gold: -3, faith: 3 },
        hiddenEffects: { setFlag: 'p_opat_lov' },
        grantPrivilege: 'lov',
        chronicle: 'Opat tě požehnal u oltáře a písař zapsal: rybolov v rybnících pod lesem patří hospodáři z Lipnice, dokud se bude modlit a platit. {L:Pán|Paní} o tom prý nic neví.',
      },
      {
        label: 'Hajnému podstrčit pytel obilí a lovit bez práva',
        hintType: 'trait', hintKey: 'patience',
        isRoll: true, baseChance: 0.5, traitKey: 'patience', traitScale: 0.05,
        onSuccess: { effects: { food: -2, stability: 1 }, chronicle: 'Hajný pytel vzal, rybník neviděl a v lese ztratil sluch. Na stole je zajíc a v hlavě klid.' },
        onFailure: { effects: { gold: -6, favor: -5, prestige: -3 }, chronicle: 'Hajný pytel vzal a pak tě stejně přistihl. Pokuta, ostuda a mlčení u sousedů.' },
      },
      {
        label: 'Nechat to být',
        hintType: 'trait', hintKey: 'patience',
        effects: {},
        chronicle: 'Zajíci běhají lesem dál. Na tvém stole zůstává dobytek a obilí.',
      },
    ],
  },

  {
    id: 'pv_myto_nabidka',
    scenario: S, cooldown: 20, minTurn: 10, weight: 1.2,
    requires: (s) => freeMan(s) && canOffer(s, 'myto') && s.resources.prestige >= 40,
    image: img('f_myto_na_moste'),
    title: 'Trh a most',
    text: 'Přes potok vede most a od mostu míří cesta na náves, kde se v neděli schází půl okolí. Mýto tu dosud bral panský pacholek Čech a {L:pánovi|paní} z něj odvedl míň, než si nechal. Z Brodné přijel královský písař, který hledá hospodáře ochotného platit ročně za právo trhu a mýta. Víc vozů, víc zboží, víc nepřátel. A pacholek Čech už teď hledí na tvůj dvůr, jako by ho chtěl zapálit.',
    choices: [
      {
        label: 'Koupit tržní právo a mýto za hotové',
        requires: (s) => s.resources.gold >= 14,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -14, favor: -1 },
        grantPrivilege: 'myto',
        chronicle: 'Písař nalepil na rychtářův štít novou listinu: trh na návsi a mýto na mostě patří od teď rodu {dynastyName}. Pacholek Čech na rozloučenou plivl do prachu.',
      },
      {
        label: 'Slíbit {L:pánovi|paní} třetinu z mýta',
        requires: (s) => s.resources.gold >= 4,
        hintType: 'resource', hintKey: 'favor',
        effects: { gold: -4, favor: 4 },
        grantPrivilege: 'myto',
        echo: { event: 'pv_myto_dluh', after: [8, 14] },
        chronicle: 'Písař listinu nalepil a {lord.title} {lord.name} dostal{L:|a} slib na třetinu výnosu. Mýto na mostě je tvé, ale účty se budou vést pečlivě. {L:Pán|Paní} je umí číst líp než ty.',
      },
      {
        label: 'Dokázat písaři, že pacholek Čech krade',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.4, traitKey: 'intelligence', traitScale: 0.05,
        onSuccess: { effects: { gold: -6, prestige: 3 }, grantPrivilege: 'myto', traitGain: 'intelligence', chronicle: 'Účty pacholka Čecha nesouhlasily ani na groš. Písař ho vyhnal z mostu a mýto předal tobě. Čech si to dobře pamatuje.' },
        onFailure: { effects: { prestige: -3, favor: -3 }, chronicle: 'Pacholek Čech měl účty lépe vedené, než čekalo. Písař tě napomenul, že žaloby bez důkazů se platí.' },
      },
      {
        label: 'Nechat to být',
        hintType: 'trait', hintKey: 'patience',
        effects: {},
        chronicle: 'Most zůstal mostem a trh trhem pod cizí ruku.',
      },
    ],
  },

  {
    id: 'pv_robota_nabidka',
    scenario: S, cooldown: 20, minTurn: 4, weight: 1.2,
    requires: (s) => s.ruler.statusTier === 1 && canOffer(s, 'robota') && s.resources.favor >= 45,
    image: img('s_robota'),
    title: 'Místo roboty groše',
    text: 'Purkrabí zastavil u tvého plotu s listinou v ruce. {lord.Title} {lord.name} potřebuje letos víc grošů než rukou: kdo zaplatí, nemusí na panské pole. „Je to výsada,“ říká purkrabí, „a výsadu dává {L:pán|paní} jen těm, na koho se může spolehnout.“ Sousedé, kteří se nadále budou dřít na panském, se na tebe dívají zkoumavě přes plot.',
    choices: [
      {
        label: 'Vyplatit se z roboty',
        requires: (s) => s.resources.gold >= 6,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -6, favor: -2, prestige: -2 },
        grantPrivilege: 'robota',
        chronicle: 'Robotu nahradila pevná platba a rod {dynastyName} má víc času na vlastním poli. Sousedé, kteří dál dřou na panském, se dívají přes plot.',
      },
      {
        label: 'Smlouvat o nižší platbu',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.4, traitKey: 'eloquence', traitScale: 0.05,
        chanceBonus: (s) => (s.resources.favor - 45) / 200,
        onSuccess: { effects: { gold: -3, favor: -1 }, grantPrivilege: 'robota', traitGain: 'eloquence', chronicle: 'Purkrabí si povzdechl a škrtl polovinu. Robota je pryč a platba snesitelná.' },
        onFailure: { effects: { gold: -2, favor: -3, prestige: -1 }, chronicle: 'Purkrabí listinu srolovat a odjel. „Příště,“ řekl a v tom slově nebyla laskavost.' },
      },
      {
        label: 'Odmítnout, robota patří k vsi',
        hintType: 'resource', hintKey: 'prestige',
        effects: { prestige: 3, favor: -1 },
        chronicle: 'Zůstal{R:|a} jsi s ostatními na panském poli. Ves si toho všimla a nezapomene.',
      },
    ],
  },

  {
    id: 'pv_konsel_nabidka',
    scenario: S, cooldown: 24, minTurn: 14, weight: 1.2,
    requires: (s) => freeMan(s) && canOffer(s, 'konsel') && s.resources.prestige >= 50,
    image: img('f_hlas_vsi'),
    title: 'Volné křeslo v radě',
    text: 'V Brodné zemřel konšel Havlík a městská rada hledá nového. K volbě zvou i hospodáře z okolí, kteří mají grunt, jméno a dost grošů na hostinu pro radní. Brodští měšťané se na venkovského konšela dívají svrchu, ale pytel obilí z tvých lánů má v radě hlas i bez zlatého řetězu.',
    choices: [
      {
        label: 'Ucházet se o křeslo',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.35, traitKey: 'eloquence', traitScale: 0.05,
        chanceBonus: (s) => (s.resources.prestige - 50) / 150,
        onSuccess: { effects: { gold: -5, prestige: 4 }, grantPrivilege: 'konsel', traitGain: 'eloquence', chronicle: 'Rada tě zvolila sedmi hlasy proti šesti. {ruler.name} {R:usedl|usedla} za radní stůl v Brodné, mezi kupce a písaře, a hned při první schůzi poznal{R:|a}, jak se tam počítá.' },
        onFailure: { effects: { gold: -5, prestige: -2 }, chronicle: 'Křeslo dostal syn pekaře. Hostina radních byla zaplacená a hlasů se nedostalo.' },
      },
      {
        label: 'Pozvat radní na hostinu a hlasy si koupit',
        requires: (s) => s.resources.gold >= 10,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -10, prestige: -2 },
        grantPrivilege: 'konsel',
        echo: { event: 'pv_konsel_obvineni', after: [8, 14] },
        chronicle: 'Víno se lilo a ruce se zvedaly, jedna za druhou. {ruler.name} je konšelem v Brodné. Poražený kandidát byl vidět, jak u dveří něco šeptá písaři.',
      },
      {
        label: 'Podpořit pekařova syna',
        hintType: 'resource', hintKey: 'prestige',
        effects: { prestige: 2, favor: 1 },
        chronicle: 'Pekařův syn je konšelem a pamatuje si, kdo za ním stál. Chleba na tvém stole je od té doby vždycky čerstvý.',
      },
    ],
  },

  // ===================== HOLDING A PRIVILEGE =====================

  {
    id: 'pv_rychtar_spor',
    scenario: S, cooldown: 12, weight: 1.5, minTurn: 6,
    requires: holds('rychtar'),
    image: img('soud_o_mez'),
    title: 'Rychtářský soud',
    text: 'U tvého stolu stojí dva sousedé, Kolář a Tichý, a každý druhému upírá půl záhonu. Kolář je chudý a má pravdu. Tichý je bohatý a přišel s husou pod paží. Purkrabí sedí v koutě a mlčí, což je u něj nejhlasitější.',
    choices: [
      {
        label: 'Rozsoudit podle starých zápisů',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.5, traitKey: 'intelligence', traitScale: 0.05,
        onSuccess: { effects: { prestige: 6, favor: -2 }, traitGain: 'intelligence', chronicle: 'Staré zápisy dávají Koláři za pravdu. Tichý odešel bez husy i bez slova a ves ví, že rychtář nedá na bohatství.' },
        onFailure: { effects: { prestige: -3 }, chronicle: 'Zápisy byly stará pergamenová změť a oba sousedé odešli uražení. Rozsudek se bude dlouho přetřásat v krčmě.' },
      },
      {
        label: 'Vzít husu a dát za pravdu Tichému',
        hintType: 'resource', hintKey: 'gold',
        isRoll: true, baseChance: 0.6,
        onSuccess: { effects: { gold: 4, favor: 2 }, chronicle: 'Husa byla tučná a rozsudek rychlý. Kolář mlčí a Tichý má dluh, který nepřizná.' },
        onFailure: { effects: { prestige: -10 }, revokePrivilege: 'rychtar', chronicle: 'Kolář roznesl po vsi, kolik vážila husa. Při schůzi ves rychtáře sesadila a pečeť putovala k jinému. Tichý o rozsudku přestal mluvit.' },
      },
      {
        label: 'Poslat spor na panský soud',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 4, prestige: -3 },
        chronicle: 'Panský soud rozhodl za tři měsíce a oba sousedé platili. Ves ti to nezapomene a panský dvůr si to naopak zapamatuje s uspokojením.',
      },
    ],
  },

  {
    id: 'pv_mlynar',
    scenario: S, cooldown: 12, weight: 1.5, minTurn: 8,
    requires: (s) => holds('mlyn')(s),
    image: img('n_mlyn'),
    title: 'Mlynář z panského dvora',
    text: 'Na tvém dvoře stojí mlynář Hrdlička, rudý v obličeji a s čepicí zmačkanou v pěsti. Od té doby, co se mele u tebe, mu na panském mlýně zbývá míra pro slepice. „Vezmeš mi kus chleba,“ říká, „ale já si ho vezmu zpátky.“ Je to mlynář, takže umí mlít slovy stejně jako obilím.',
    choices: [
      {
        label: 'Vyplatit ho, ať mlčí',
        requires: (s) => s.resources.gold >= 5,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -5, prestige: 2 },
        chronicle: 'Hrdlička přepočítal groše dvakrát a odešel nezvykle tichý. Slepice na panském dvoře budou hladovět dál.',
      },
      {
        label: 'Nabídnout mu místo ve svém mlýně',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.5, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { gold: 2, prestige: 3, army: 1 }, traitGain: 'eloquence', chronicle: 'Hrdlička se do mlýna naučil nastavit kameny líp než ty. Mele rychleji, vždycky počítá a nikdy se nesměje.' },
        onFailure: { effects: { gold: -3, prestige: -2 }, chronicle: 'Hrdlička se do mlýna nastěhoval a za měsíc o něm věděl víc než ty. Hlásí všechno na panský dvůr.' },
      },
      {
        label: 'Stát si za svým právem před celou vsí',
        hintType: 'resource', hintKey: 'prestige',
        isRoll: true, baseChance: 0.5, resourceKey: 'prestige', resourceScale: 0.3,
        onSuccess: { effects: { prestige: 4 }, chronicle: 'Listinu jsi {R:přečetl|přečetla} před celou vsí. Hrdlička zrudl a ves ti kývla na souhlas.' },
        onFailure: { effects: { gold: -4, favor: -4 }, chronicle: 'Hrdlička má za sebou purkrabího. Listina platí, ale poplatek za nepokoj se platit musí.' },
      },
      {
        label: 'Potají mu spustit stavidlo',
        hintType: 'trait', hintKey: 'patience',
        isRoll: true, baseChance: 0.4, traitKey: 'patience', traitScale: 0.05,
        onSuccess: { effects: { gold: 4, prestige: -3 }, chronicle: 'Panské kolo stálo celý týden. Voda uteče, koho nachytá, a ty ses zatím tvářil{R:|a} nevinně.' },
        onFailure: { effects: { favor: -10 }, revokePrivilege: 'mlyn', chronicle: 'Hrdlička tě viděl u stavidla a pospíšil si s tím k purkrabímu. {lord.Title} {lord.name} listinu o mlýně přeškrtl{L:|a} jediným tahem.' },
      },
    ],
  },

  {
    id: 'pv_hospoda_rvacka',
    scenario: S, cooldown: 10, weight: 1.5, minTurn: 8,
    requires: holds('hospoda'),
    music: 'battle',
    image: img('rvaci_v_krcme'),
    title: 'Rvačka ve výčepu',
    text: 'Formani z Brodné a pasáci z hor si v tvém výčepu vyřizují staré účty. Stoly lítají a džbány taky, čepník se schovává za sudem a zpoza dveří kouká zvědavá ves. Purkrabí vzkázal už předem: kdyby tu někdo zahynul, hospodské právo je pryč.',
    choices: [
      {
        label: 'Rozehnat rváče vlastníma rukama',
        combat: 'rvaci',
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.4, traitKey: 'strength', traitScale: 0.05,
        onSuccess: { effects: { prestige: 6 }, traitGain: 'strength', chronicle: 'Dva formani leželi pod lavicí a pasáci si třeli žebra. {ruler.name} {R:postavil|postavila} sudy zpátky a čepuje dál. Ves tě v noci znovu uslyšela zpívat.' },
        onFailure: { effects: { gold: -4, prestige: -3 }, injury: 'pohmozdeni', chronicle: 'Rváči tě odstrčili jako kus nábytku. Ráno bylo v hospodě víc střepů než hostů a ty jsi {R:odešel|odešla} s monoklem.' },
      },
      {
        label: 'Zavolat dráby',
        hintType: 'resource', hintKey: 'favor',
        effects: { gold: -2, favor: 2, prestige: -2 },
        chronicle: 'Dráb rozhodil rváče jako kuřata a v hospodě je ticho. Ves o tom ještě týden šeptá, že se rychtář bojí o sudy.',
      },
      {
        label: 'Nechat je vyřvat',
        hintType: 'trait', hintKey: 'patience',
        isRoll: true, baseChance: 0.5, traitKey: 'patience', traitScale: 0.05,
        onSuccess: { effects: { gold: 3 }, chronicle: 'Rváči se po hodině unavili a škodu zaplatili dvojnásobně, protože se styděli. Pivo se leje dál.' },
        onFailure: { effects: { prestige: -4 }, revokePrivilege: 'hospoda', chronicle: 'Z rány se stal mrtvý pasák pod stolem. Purkrabí hospodské právo druhý den zapečetil a čepník to odnesl nejhůř.' },
      },
    ],
  },

  {
    id: 'pv_pytlak',
    scenario: S, cooldown: 12, weight: 1.5, minTurn: 8,
    requires: holds('lov'),
    image: img('s_pytlactvi'),
    title: 'Pytlák v lese',
    text: 'Hajný přivedl za límec pytláka, tvého souseda Vondru, který ulovil srnu. Vondra má šest dětí a prázdnou spíž. Hajný chce pokutu a tebe jako svědka. Ty máš právo lovu a víš, jak snadno se hranice mezi tím, co je dovoleno, a tím, co není, přehodí.',
    choices: [
      {
        label: 'Zaplatit za Vondru pokutu',
        requires: (s) => s.resources.gold >= 5,
        hintType: 'resource', hintKey: 'prestige',
        effects: { gold: -5, prestige: 5 },
        chronicle: 'Vondra pokutu splácí prací na tvém poli a jeho děti ti nosí první jahody. Hajný si dělá poznámky.',
      },
      {
        label: 'Vydat ho hajnému',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 4, prestige: -5 },
        chronicle: 'Vondra šel pod pranýř a ves pochopila, na čí straně stojí rodina {dynastyName}. Hajný se poprvé ukláněl.',
      },
      {
        label: 'Říct, že srnu zastřelil z tvého lovu',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.45, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { prestige: 4, favor: -1 }, traitGain: 'eloquence', chronicle: 'Hajný se zamračil, ale nedokázal nic. Vondra sedí večer v tvé světnici nad kusem srnčího a mlčí vděčně.' },
        onFailure: { effects: { favor: -6 }, revokePrivilege: 'lov', chronicle: 'Hajný poznal lež podle stopy v blátě. {lord.Title} {lord.name} ti právo lovu odebral{L:|a} a Vondra dostal pranýř za dva.' },
      },
    ],
  },

  {
    id: 'pv_myto_vybirci',
    scenario: S, cooldown: 12, weight: 1.5, minTurn: 12,
    requires: holds('myto'),
    image: img('f_myto_na_moste'),
    title: 'Panský vůz na mostě',
    text: 'Na mostě stojí dva vozy proti sobě: kupcův se solí a panský se senem pro koně. Pacholek tvrdí, že panské vozy mýto neplatí. Písař z Brodné tvrdí, že mýto platí každý, a že poslední, kdo to zkoušel, skončil v řece. Kupec čeká. Hlavně čeká, co uděláš ty.',
    choices: [
      {
        label: 'Vybrat mýto i od panského vozu',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.4, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { gold: 3, prestige: 4, favor: -3 }, traitGain: 'eloquence', chronicle: 'Panský pacholek zaplatil, skřípal zuby a hledal oporu u písaře. Nenašel ji. Ves to ví a {L:pán|paní} to ví taky.' },
        onFailure: { effects: { favor: -8 }, revokePrivilege: 'myto', chronicle: '{lord.Title} {lord.name} listinu o mýtu zrušil{L:|a} jedním tahem pera: panské vozy platit nebudou nikdy a nikdo jiný taky. Písař jen pokrčil rameny.' },
      },
      {
        label: 'Pustit panský vůz zadarmo',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 3, gold: -1 },
        chronicle: 'Panský vůz projel bez zastavení a pacholek se na rozloučenou usmál. To je u něj vzácnější než groš.',
      },
      {
        label: 'Přenechat spor písaři z Brodné',
        hintType: 'trait', hintKey: 'patience',
        effects: { prestige: -2 },
        chronicle: 'Písař to vyřešil za dvě hodiny a za dva groše. Ten, kdo má mýto, se ale od vozů vyhýbá, a kupci to poznali.',
      },
    ],
  },

  {
    id: 'pv_konsel_rada',
    scenario: S, cooldown: 12, weight: 1.5, minTurn: 16,
    requires: holds('konsel'),
    image: img('f_hlas_vsi'),
    title: 'Hlasování v radě',
    text: 'Městská rada v Brodné hlasuje o nové hradbě, kterou by platili všichni a z níž by zbohatli jen kupci u dolní brány. Konšel Lhotský tě pod stolem kopne do holeně: hlasuj s námi a dostaneš dobrou zakázku. Hlas venkovského konšela je totiž v radě vzácný a všichni to vědí.',
    choices: [
      {
        label: 'Hlasovat s kupci',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 4, prestige: -1 },
        chronicle: 'Hradba byla schválena jedním hlasem, tvým. Kupci u dolní brány ti poslali sud vína. Chudší měšťané si zapamatovali, jak jsi hlasoval{R:|a}.',
      },
      {
        label: 'Hlasovat proti jejich zisku',
        hintType: 'resource', hintKey: 'prestige',
        effects: { prestige: 4, favor: -2 },
        chronicle: 'Hradba padla o jeden hlas a Lhotský na tebe celý večer zlobně hleděl. Chudí měšťané ti od té doby smekají.',
      },
      {
        label: 'Zdržet se hlasování',
        hintType: 'trait', hintKey: 'patience',
        effects: {},
        traitGain: 'patience',
        chronicle: 'Rada rozhodla beze tebe. Nikdo se nezlobil a nikdo nepoděkoval.',
      },
    ],
  },

  // ===================== ECHOES AND LOSS =====================

  {
    id: 'pv_mlyn_dluh',
    scenario: S, forced: true, echo: true,
    requires: holds('mlyn'),
    image: img('n_mlyn'),
    title: '{lord.Title} chce svůj pytel',
    text: 'Purkrabí zase přijíždí s vozíkem. Mlýnské právo ti nikdo nevzal, ale {lord.title} {lord.name} chce slíbený pytel mouky, a letos prý ne obyčejné, ale bílé, na hostinu. Když jsi slib dával{R:|a}, o hostinách se nemluvilo.',
    choices: [
      {
        label: 'Dát bílou mouku a mlčet',
        hintType: 'resource', hintKey: 'favor',
        effects: { food: -4, favor: 6 },
        chronicle: 'Bílá mouka odjela na panský dvůr. Purkrabí se při odjezdu poprvé usmál, a to rodu {dynastyName} vydrží do příštího podzimu.',
      },
      {
        label: 'Dát obyčejnou mouku a vysvětlit, že slib byl na obyčejnou',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.5, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { food: -2, prestige: 3, favor: -2 }, traitGain: 'eloquence', chronicle: 'Purkrabí pytel prohlédl, přečetl svůj zápis a nenašel v něm slovo o bílé mouce. Odjel kyselý a dnes se o tom v kraji mluví.' },
        onFailure: { effects: { favor: -8 }, revokePrivilege: 'mlyn', chronicle: 'Purkrabí pytel nechal na dvoře ležet. {lord.Title} {lord.name} na mlýnské právo zapomněl{L:|a} stejně rychle, jako na slib.' },
      },
    ],
  },

  {
    id: 'pv_myto_dluh',
    scenario: S, forced: true, echo: true,
    requires: holds('myto'),
    image: img('f_myto_na_moste'),
    title: 'Účty z mostu',
    text: 'Purkrabí rozložil na tvém stole účty z mýta a ukazuje prstem do sloupců. „Třetina,“ říká, „a ty jsi odvedl{R:|a} míň.“ Počítal{R:|a} jsi, kolik se utratilo na opravu mostu, ale purkrabí takové položky z účtů škrtá a {L:pán|paní} ještě víc.',
    choices: [
      {
        label: 'Doplatit rozdíl a mlčet',
        requires: (s) => s.resources.gold >= 4,
        hintType: 'resource', hintKey: 'favor',
        effects: { gold: -4, favor: 5 },
        chronicle: 'Rozdíl odešel na panský dvůr a purkrabí škrtl poslední řádek. Most se opravuje dál z tvého.',
      },
      {
        label: 'Trvat na tom, že oprava mostu patří do účtů',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.5, traitKey: 'intelligence', traitScale: 0.05,
        onSuccess: { effects: { prestige: 3, favor: -1 }, traitGain: 'intelligence', chronicle: 'Purkrabí se prohrabával účty hodinu a nakonec uznal, že dřevo se musí platit. Mýto zůstává tvé.' },
        onFailure: { effects: { favor: -8, gold: -4 }, revokePrivilege: 'myto', chronicle: '{lord.Title} {lord.name} tvůj účet {L:neuznal|neuznala} a tržní právo odvolal{L:|a} s poznámkou, že hospodář s takovými účty nemá co dělat s cizím mýtem.' },
      },
    ],
  },

  {
    id: 'pv_konsel_obvineni',
    scenario: S, forced: true, echo: true,
    requires: holds('konsel'),
    image: img('f_hlas_vsi'),
    title: 'Řeči o hostině',
    text: 'V Brodné se po trzích šeptá, že hlasy při volbě konšela nebyly zadarmo. Poražený kandidát se to nedozvěděl sám: podal žalobu u městského soudu a svědci prý mají dobrou paměť. Radní se na tebe dívají jako na hostitele, který zapomněl, že víno je důkaz.',
    choices: [
      {
        label: 'Zaplatit, aby žaloba zmizela',
        requires: (s) => s.resources.gold >= 8,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -8, prestige: -1 },
        chronicle: 'Písař žalobu někam založil a poražený kandidát odjel k příbuzným. Křeslo zůstává tvé a ty víš, že nikdy nebylo zadarmo.',
      },
      {
        label: 'Obhajovat se před radou',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.45, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { prestige: 4 }, traitGain: 'eloquence', chronicle: 'Rada vyslechla žalobu, vyslechla tebe a hlasovala. Hlasů pro tebe bylo víc a žalobce odešel s pokutou za křivé obvinění.' },
        onFailure: { effects: { prestige: -8 }, revokePrivilege: 'konsel', chronicle: 'Svědkové byli příliš dobře naučení. Rada tě zbavila křesla a písař to zapsal do knihy, kde se nic nemaže.' },
      },
      {
        label: 'Vzdát se křesla a zachránit si jméno',
        hintType: 'resource', hintKey: 'prestige',
        effects: { prestige: -2 },
        revokePrivilege: 'konsel',
        chronicle: 'Křeslo zůstalo prázdné a žaloba se zrušila. V Brodné se říká, že {ruler.name} {R:odešel|odešla} včas, což je to nejlepší, co se o konšelovi dá říct.',
      },
    ],
  },

  {
    id: 'pv_odebrani',
    scenario: S, forced: true,
    image: img('hrabe_utlacuje'),
    title: '{lord.Title} chce své právo zpět',
    text: '{lord.Title} {lord.name} už dlouho nemá z tvého domu radost. Purkrabí přijel na koni, nesesedl a oznámil, že {privilege.what} se přezkoumává a bude odebráno, pokud se věci nezlepší. {L:Pán|Paní} prý čeká, co nabídneš. Dobré slovo se teď cení výš než pytel obilí.',
    choices: [
      {
        label: 'Zaplatit {L:pánovi|paní}, ať si to rozmyslí',
        requires: (s) => s.resources.gold >= 8,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -8, favor: 10 },
        keepPrivilege: '$loss',
        chronicle: 'Pytel s groši odjel na panský dvůr a purkrabí odtud přivezl zprávu: {privilege.what} zůstává. Nikdo nenapsal, na jak dlouho.',
      },
      {
        label: 'Pokorně prosit u panského stolu',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.4, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { favor: 6 }, keepPrivilege: '$loss', traitGain: 'eloquence', chronicle: '{lord.Title} {lord.name} nechal{L:|a} tě klečet jen chvíli. Právo zůstává, ale pohled, který ho doprovodil, byl chladný.' },
        onFailure: { effects: { prestige: -3 }, revokePrivilege: '$loss', chronicle: 'Panský dvůr zůstal hluchý. Před celou vsí ti purkrabí odebral {privilege.what} a odjel, aniž se ohlédl.' },
      },
      {
        label: 'Vzdát se práva dřív, než ho {L:pán|paní} vezme',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 4 },
        revokePrivilege: '$loss',
        chronicle: 'Právo se vrátilo {L:pánovi|paní} dobrovolně a {L:pán|paní} to ocenil{L:|a} krátkým kývnutím. Víc za to nedostaneš.',
      },
    ],
  },

  {
    id: 'pv_vic_ne',
    scenario: S, cooldown: 24, weight: 1.5, minTurn: 10,
    requires: (s) => grantedByLord(s) >= 3 && s.resources.prestige >= 40,
    image: img('s_pan_navsteva'),
    title: 'Víc už ne',
    text: 'Purkrabí tě zastavil před kostelem. „Tři práva, {R:hospodáři|hospodyně}, a dost,“ řekl suše. „{lord.Title} nechce, aby se říkalo, že Lipnice patří jednomu domu. Kdyby ses chtěl{R:|a} ucházet o další, musíš nějaké vrátit.“ Říkal to přátelsky. Taky tak, jak se říkají varování.',
    choices: [
      ...['mlyn', 'hospoda', 'lov', 'myto', 'robota', 'konsel'].map((k) => ({
        label: `Vrátit {L:pánovi|paní} ${PRIVILEGES[k].what}`,
        requires: (s) => hasPrivilege(s, k),
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 6 },
        revokePrivilege: k,
        chronicle: `Rod {dynastyName} vrátil ${PRIVILEGES[k].what} dobrovolně. {lord.Title} {lord.name} to ocenil{L:|a} a purkrabí škrtl řádek v knize.`,
      })),
      {
        label: 'Nechat všechno, jak je',
        hintType: 'trait', hintKey: 'patience',
        effects: { prestige: 1 },
        chronicle: 'Tři práva ti stačí a na čtvrté se nikdo neptal. Říkáš to nahlas, aby to bylo slyšet.',
      },
    ],
  },
];
