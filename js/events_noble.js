// Šlechtic scenario — a minor noble with one estate climbs toward the throne.
// Same event shape as events.js, plus noble-only branch effects (see engine.js):
//   houseEffects { <houseId>|'target'|'*'|'allies': {attitude, power, ally, married} }
//   noble { plot, secrets, plotReset }   setTier   newKing   endGame
// Choices may carry requires(state) (shown only when it holds) and chanceBonus(state).

const S = 'slechtic';
const allies = (s) => s.houses.filter((h) => h.ally).length;
const hostileHouse = (s) => {
  const h = s.houses.filter((x) => x.attitude < 40).sort((a, b) => a.attitude - b.attitude)[0];
  return h ? h.id : null;
};
const friendlyHouse = (s) => {
  const h = s.houses.filter((x) => x.attitude >= 55 && !x.ally).sort((a, b) => b.attitude - a.attitude)[0];
  return h ? h.id : null;
};
const anyHouse = (s) => s.houses[Math.floor(Math.random() * s.houses.length)].id;
// a house broken in a private war loses its seat to the player (war.js): no feasts at home, no border stones
const landed = (s, h) => s.provinces.some((p) => p.owner === h.id);
const landedHouse = (s) => {
  const pool = s.houses.filter((h) => landed(s, h));
  return pool.length ? pool[Math.floor(Math.random() * pool.length)].id : null;
};
const hostileLandedHouse = (s) => {
  const h = s.houses.filter((x) => x.attitude < 40 && landed(s, x)).sort((a, b) => a.attitude - b.attitude)[0];
  return h ? h.id : null;
};
const targetLanded = (s) => {
  const h = s.houses.find((x) => x.id === s.eventContext?.house);
  return !!h && landed(s, h);
};

export const NOBLE_EVENTS = [
  // ===================== THE KING AND HIS COURT =====================

  {
    id: 'n_povolavaci_list',
    scenario: S,
    cooldown: 9,
    minTurn: 2,
    title: 'Povolávací list',
    text: 'Královský posel přinesl list s královskou pečetí. Koruna táhne do pole a každý šlechtic má dodat muže podle velikosti svého panství.',
    choices: [
      {
        label: 'Poslat muže do královského vojska',
        hintType: 'resource', hintKey: 'army',
        effects: { army: -8, favor: 10, prestige: 3 },
        chronicle: 'Korouhev rodu {dynastyName} odtáhla pod královskou korouhev. {king.Title} si zapsal{K:|a}, kdo přišel první.',
      },
      {
        label: 'Vykoupit se štítným',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -14, favor: 3 },
        chronicle: 'Rod zaplatil štítné místo mužů. {king.Title} peníze vzal{K:|a}, ale pohrdavě.',
      },
      {
        label: 'Odmítnout — panství potřebuje své muže',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: -15, prestige: 2 },
        provinceEffects: { own: { loyalty: 5 } },
        chronicle: 'Rod odmítl poslat muže. U dvora se o tom mluví šeptem a s oblibou.',
      },
    ],
  },

  {
    id: 'n_kralovska_bitva',
    scenario: S,
    music: 'battle',
    cooldown: 12,
    minTurn: 4,
    title: 'Bitva pod královskou korouhví',
    text: 'Královské vojsko se střetlo s nepřítelem na rozbahněném poli. Tvá korouhev stojí na křídle a {king.title} sleduje boj z návrší.',
    choices: [
      {
        label: 'Vést své muže osobně do první linie',
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.4, traitKey: 'strength', traitScale: 0.04, resourceKey: 'army', resourceScale: 0.5,
        onSuccess: { effects: { army: -5, prestige: 10, favor: 12, legitimacy: 5 }, traitGain: 'strength', chronicle: 'Korouhev rodu {dynastyName} prolomila nepřátelské křídlo. Po bitvě {king.title} před celým vojskem objal{K:|a} {R:vítěze|vítězku} dne.' },
        onFailure: { effects: { army: -12, prestige: -4 }, injury: { pool: ['rana', 'ruka', 'noha', 'oko', 'jizva', 'zlomenina'], chance: 0.6 }, chronicle: 'Útok narazil na kopí. Polovina mužů se domů nevrátila a {king.title} si všiml{K:|a} jen toho, kdo couvl.' },
      },
      {
        label: 'Držet se v záloze a šetřit muže',
        hintType: 'trait', hintKey: 'patience',
        effects: { army: -2, favor: -4 },
        chronicle: 'Korouhev rodu zůstala v záloze. Muži přežili, sláva připadla jiným.',
      },
      {
        label: 'Ukořistit nepřátelský tábor dřív než ostatní',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.45, traitKey: 'intelligence', traitScale: 0.04,
        onSuccess: { effects: { gold: 18, favor: -2 }, traitGain: 'intelligence', chronicle: 'Zatímco jiní bojovali, muži rodu vyplenili nepřátelský tábor. Truhly jsou plné, čest trochu méně.' },
        onFailure: { effects: { favor: -10, prestige: -5 }, houseEffects: { '*': { attitude: -4 } }, chronicle: 'Rabování bylo prozrazeno. {king.Title} zuří a ostatní rody se smějí.' },
      },
    ],
  },

  {
    id: 'n_pozvani_ke_dvoru',
    scenario: S,
    cooldown: 8,
    title: 'Pozvání ke dvoru',
    text: '{king.Title} {king.name} svolává šlechtu na svatodušní dvůr do Vlčího Údělu. Kdo nepřijede, jako by nebyl. Kdo přijede, musí se ukázat.',
    choices: [
      {
        label: 'Přijet v plné nádheře',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.5, traitKey: 'eloquence', traitScale: 0.04,
        onSuccess: { effects: { gold: -10, favor: 10, prestige: 5 }, traitGain: 'eloquence', chronicle: '{ruler.name} {R:zazářil|zazářila} u dvora. {king.Title} u hostiny zvedl{K:|a} pohár směrem k rodu {dynastyName}.' },
        onFailure: { effects: { gold: -10, prestige: -3 }, chronicle: 'Nádhera rodu u dvora vyzněla spíš směšně. Velmoži se usmívali za rukou.' },
      },
      {
        label: 'Přijet skromně a naslouchat',
        hintType: 'trait', hintKey: 'intelligence',
        effects: { gold: -4, favor: 3 },
        noble: { secrets: 1 },
        chronicle: 'U dvora se nejvíc dozví ten, kdo mlčí. Rod odjíždí s něčím cennějším než přízní.',
      },
      {
        label: 'Omluvit se a zůstat na panství',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: -7 },
        provinceEffects: { own: { unrest: -4 } },
        chronicle: 'Rod zůstal doma. Na panství je klid, u dvora se na jméno rodu zapomíná.',
      },
    ],
  },

  {
    id: 'n_kralova_navsteva',
    scenario: S,
    cooldown: 16,
    minTurn: 4,
    title: '{K:Král|Královna} na návštěvě',
    text: '{king.Title} {king.name} se na cestě k moři zastaví na tvém panství. S ním přijede sto jezdců, dvůr, psi a sokoli — a všichni budou chtít jíst.',
    choices: [
      {
        label: 'Uspořádat hostinu, na jakou se nezapomíná',
        hintType: 'resource', hintKey: 'favor',
        effects: { gold: -18, food: -10, favor: 14, prestige: 6 },
        chronicle: 'Hostina trvala tři dny. {king.Title} odjížděl{K:|a} {K:spokojený|spokojená} a jméno rodu {dynastyName} si zapamatoval{K:|a}.',
      },
      {
        label: 'Pohostit {K:krále|královnu} důstojně, ale skromně',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -6, food: -4, favor: 4 },
        chronicle: '{king.Title} byl{K:|a} {K:pohoštěn|pohoštěna}, jak se sluší. Nic víc, nic míň.',
      },
      {
        label: 'Ukázat {K:králi|královně} svou družinu na cvičišti',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.5, resourceKey: 'army', resourceScale: 0.5,
        onSuccess: { effects: { favor: 8, prestige: 6, gold: -4 }, chronicle: '{king.Title} obdivoval{K:|a} kázeň družiny rodu. „Takové muže bych {K:chtěl|chtěla} mít u sebe,“ řekl{K:|a} nahlas.' },
        onFailure: { effects: { favor: -6, prestige: -3, gold: -4 }, chronicle: 'Družina se před {K:králem|královnou} zamotala do vlastních kopí. Dvořané se smáli až do večera.' },
      },
    ],
  },

  {
    id: 'n_kraluv_vybirci',
    scenario: S,
    cooldown: 10,
    title: 'Královský výběrčí',
    text: 'Královský výběrčí žádá mimořádnou berni na válku. Částka je vysoká a výběrčí se dívá po tvé pokladně, jako by ji už vážil.',
    choices: [
      {
        label: 'Zaplatit celou berni',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -15, favor: 6 },
        chronicle: 'Berně byla zaplacena do posledního groše. Výběrčí odjel spokojen, pokladna zeje prázdnotou.',
      },
      {
        label: 'Zatajit část výnosů',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.5, traitKey: 'intelligence', traitScale: 0.05,
        onSuccess: { effects: { gold: -5, favor: 2 }, traitGain: 'intelligence', chronicle: 'Výběrčí odvezl jen třetinu a myslel si, že víc není.' },
        onFailure: { effects: { gold: -18, favor: -12 }, chronicle: 'Výběrčí podvod odhalil. Rod zaplatil berni i pokutu a u dvora má jméno podvodníka.' },
      },
      {
        label: 'Odmítnout — panství je vyčerpané',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: -12 },
        provinceEffects: { own: { loyalty: 8 } },
        chronicle: 'Rod berni odmítl. Sedláci to ocenili, {king.title} méně.',
      },
    ],
  },

  {
    id: 'n_obvineni_u_dvora',
    scenario: S,
    cooldown: 10,
    target: hostileHouse,
    title: 'Obvinění u dvora',
    text: 'Rod {house.gen} obvinil tvůj rod před {K:králem|královnou} ze zpronevěry královské berně. {king.Title} si tě předvolává, aby ses {R:hájil|hájila}.',
    choices: [
      {
        label: 'Obhájit se před {K:králem|královnou}',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.45, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { favor: 6, prestige: 4 }, houseEffects: { target: { attitude: -8, power: -6 } }, traitGain: 'eloquence', chronicle: 'Obhajoba byla tak přesvědčivá, že se obvinění obrátilo proti žalobcům.' },
        onFailure: { effects: { favor: -12, gold: -8 }, chronicle: '{king.Title} obhajobě neuvěřil{K:|a}. Rod zaplatil pokutu a ztratil kus důvěry koruny.' },
      },
      {
        label: 'Udeřit zpátky tajemstvím, které o nich víš',
        requires: (s) => s.noble.secrets > 0,
        hintType: 'trait', hintKey: 'intelligence',
        effects: { favor: 4 },
        noble: { secrets: -1 },
        houseEffects: { target: { power: -14, attitude: -15 } },
        chronicle: 'Rod předložil {K:králi|královně} listinu, která žalobce umlčela. Teď jsou to oni, kdo se musí hájit.',
      },
      {
        label: 'Uplatit svědky',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -16 },
        chronicle: 'Svědci si najednou na nic nepamatovali. Obvinění padlo, peníze taky.',
      },
    ],
  },

  {
    id: 'n_urad_u_dvora',
    scenario: S,
    cooldown: 30,
    requires: (s) => s.resources.favor >= 60,
    title: 'Úřad u dvora',
    text: '{king.Title} {king.name} ti nabízí úřad nejvyššího komorníka. Přístup ke {K:králi|královně}, ke královské pokladně — a nenávist všech, kdo o úřad stáli.',
    choices: [
      {
        label: 'Přijmout úřad',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 8, gold: 10, prestige: 6, legitimacy: 6 },
        houseEffects: { '*': { attitude: -8 } },
        chronicle: '{ruler.name} se {R:stal nejvyšším komorníkem|stala nejvyšší komornicí}. Ostatní rody se usmívají a brousí nože.',
      },
      {
        label: 'Skromně odmítnout ve prospěch jiného rodu',
        hintType: 'trait', hintKey: 'patience',
        effects: { favor: 2 },
        houseEffects: { '*': { attitude: 6 } },
        traitGain: 'patience',
        chronicle: 'Rod úřad odmítl. Šlechta tu skromnost ocenila víc, než by ocenila úřad.',
      },
    ],
  },

  {
    id: 'n_povyseni',
    scenario: S,
    oneTime: true,
    weight: 4,
    requires: (s) => s.ruler.statusTier === 3 && s.resources.favor >= 62 && s.resources.prestige >= 40,
    title: 'Královská milost',
    text: '{king.Title} {king.name} si tě předvolal{K:|a} k trůnu. Za věrné služby chce rod {dynastyName} povýšit mezi velmože země.',
    choices: [
      {
        label: 'Přijmout s pokorou',
        hintType: 'resource', hintKey: 'prestige',
        setTier: 4,
        effects: { legitimacy: 10, prestige: 6, army: 6 },
        provinceEffects: { own: { wealth: 12, garrison: 10 } },
        chronicle: 'Rod {dynastyName} byl povýšen mezi velmože. K panství přibyly nové vsi a právo vlastní korouhve.',
      },
      {
        label: 'Požádat i o další panství',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.45, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { setTier: 4, effects: { legitimacy: 12, prestige: 8, gold: 20, army: 6 }, provinceEffects: { own: { wealth: 18, garrison: 10 } }, traitGain: 'eloquence', chronicle: '{king.Title} se zasmál{K:|a} smělosti a přidal{K:|a} ještě lesy na severu. Rod {dynastyName} je mezi velmoži.' },
        onFailure: { setTier: 4, effects: { legitimacy: 8, favor: -10 }, provinceEffects: { own: { wealth: 8 } }, chronicle: 'Rod byl povýšen, ale žádost o víc {K:krále|královnu} urazila. Dvůr si zapamatoval chamtivost.' },
      },
    ],
  },

  {
    id: 'n_koupe_titulu',
    scenario: S,
    oneTime: true,
    minTurn: 8,
    requires: (s) => s.ruler.statusTier === 3 && s.resources.gold >= 55,
    title: 'Titul na prodej',
    text: 'Královský pokladník naznačil, že pokladna je prázdná a že za dostatečný „dar“ by se našel titul velmože i pro rod, který o něj zatím nežádal.',
    choices: [
      {
        label: 'Titul koupit',
        hintType: 'resource', hintKey: 'gold',
        setTier: 4,
        effects: { gold: -45, legitimacy: 6, prestige: -3 },
        houseEffects: { '*': { attitude: -5 } },
        chronicle: 'Rod {dynastyName} je mezi velmoži. Staré rody šeptají, že titul voní stříbrem.',
      },
      {
        label: 'Odmítnout, titul se musí zasloužit',
        hintType: 'resource', hintKey: 'prestige',
        effects: { prestige: 3 },
        chronicle: 'Rod odmítl koupený titul. Pokladník pokrčil rameny.',
      },
    ],
  },

  {
    id: 'n_nemoc_krale',
    scenario: S,
    cooldown: 20,
    requires: (s) => s.king.alive && s.king.age >= 60,
    title: '{K:Král stůně|Královna stůně}',
    text: '{king.Title} {king.name} ulehl{K:|a}. Je mu {king.age} let a lékaři se tváří vážně. U dvora se začíná mluvit o tom, co bude dál — a kdo by mohl nosit korunu.',
    choices: [
      {
        label: 'Navštívit {K:krále|královnu} a ujistit {K:ho|ji} o věrnosti',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 9, gold: -4 },
        chronicle: '{king.Title} byl{K:|a} návštěvou {K:dojat|dojata}. Ve slabé chvíli si lidé pamatují, kdo přišel.',
      },
      {
        label: 'Tiše začít shromažďovat příznivce',
        hintType: 'trait', hintKey: 'intelligence',
        effects: { legitimacy: 6, favor: -3 },
        noble: { plot: 1 },
        chronicle: 'Zatímco {king.title} stonal{K:|a}, rod {dynastyName} psal dopisy. Ne všechny byly o {K:jeho|jejím} zdraví.',
      },
      {
        label: 'Poslat {K:králi|královně} svého lékaře',
        hintType: 'resource', hintKey: 'gold',
        isRoll: true, baseChance: 0.55,
        onSuccess: { effects: { gold: -8, favor: 14 }, chronicle: 'Lékař rodu {K:krále|královnu} postavil na nohy. {king.Title} to rodu {dynastyName} nezapomene.' },
        onFailure: { effects: { gold: -8, favor: -6 }, chronicle: '{K:Králi|Královně} se po lécích přitížilo. Lékař rodu byl vyhnán od dvora s podezřením.' },
      },
    ],
  },

  // ===================== THE THRONE =====================

  {
    id: 'n_kralovsky_snatek',
    scenario: S,
    cooldown: 16,
    requires: (s) => s.ruler.statusTier >= 4 && s.resources.favor >= 55 && s.heir.alive && s.heir.age >= 10
      && s.king.alive && s.king.heir && s.king.heir.alive && !s.flags.royal_match && !s.flags.heir_married,
    title: 'Sňatek s korunou',
    text: 'Královo dítě, {king.heirTitle} {king.heirName}, dospívá. Kdyby se tvůj dědic {heir.name} stal jeho chotí, krev rodu {dynastyName} by jednou seděla na trůně.',
    choices: [
      {
        label: 'Navrhnout sňatek {K:králi|královně}',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.25, traitKey: 'eloquence', traitScale: 0.04, resourceKey: 'favor', resourceScale: 0.6,
        onSuccess: { effects: { legitimacy: 25, prestige: 8, favor: 4 }, hiddenEffects: { setFlag: ['royal_match', 'heir_married'] }, houseEffects: { '*': { attitude: -6 } }, chronicle: '{king.Title} svolil{K:|a}. Dědic rodu {dynastyName} byl zasnouben s {K:královým|královniným} dítětem. Ostatní rody zbledly.' },
        onFailure: { effects: { favor: -6, prestige: -3 }, chronicle: '{king.Title} nabídku odmítl{K:|a} s úsměvem, který bolel víc než slova.' },
      },
      {
        label: 'Nabídnout k sňatku i bohaté věno',
        requires: (s) => s.resources.gold >= 30,
        hintType: 'resource', hintKey: 'gold',
        isRoll: true, baseChance: 0.45, resourceKey: 'favor', resourceScale: 0.6,
        onSuccess: { effects: { gold: -30, legitimacy: 25, prestige: 8 }, hiddenEffects: { setFlag: ['royal_match', 'heir_married'] }, houseEffects: { '*': { attitude: -6 } }, chronicle: 'Věno přesvědčilo prázdnou královskou pokladnu. Zásnuby byly zpečetěny.' },
        onFailure: { effects: { gold: -10, favor: -4 }, chronicle: '{king.Title} věno nepřijal{K:|a}. Zálohu na dary už ale rod zpátky nedostal.' },
      },
      {
        label: 'Zatím vyčkat',
        hintType: 'trait', hintKey: 'patience',
        effects: {},
        chronicle: 'Rod zatím mlčí. Na trůn se nespěchá.',
      },
    ],
  },

  {
    id: 'n_smrt_krale',
    scenario: S,
    forced: true,
    music: 'battle',
    title: '{K:Král je mrtev|Královna je mrtvá}',
    text: 'Zvony Vlčího Údělu oznamují, že {king.title} {king.name} zemřel{K:|a}. Šlechta se sjíždí ke dvoru, koruna leží na polštáři v chrámu a všichni se dívají, kdo se k ní natáhne první.',
    choices: [
      {
        label: 'Vznést nárok na trůn',
        requires: (s) => s.ruler.statusTier >= 4 || s.flags.royal_match,
        hintType: 'resource', hintKey: 'legitimacy',
        isRoll: true, baseChance: -0.17, traitKey: 'eloquence', traitScale: 0.02, resourceKey: 'legitimacy', resourceScale: 0.8,
        chanceBonus: (s) => allies(s) * 0.08 + (s.flags.royal_match ? 0.25 : 0) + (s.flags.regent ? 0.15 : 0)
          + (!s.king.heir || !s.king.heir.alive || s.king.heir.age < 16 ? 0.1 : 0) + (s.resources.favor - 50) / 400,
        onSuccess: { endGame: 'crowned', chronicle: 'Šlechta se sklonila. Koruna dosedla na hlavu z rodu {dynastyName}.' },
        onFailure: { newKing: true, effects: { favor: -30, legitimacy: -15, prestige: -6 }, houseEffects: { '*': { attitude: -6 } }, chronicle: 'Šlechta za nárokem rodu nestála. Nový panovník si dobře zapamatoval, kdo se natáhl po jeho koruně.' },
      },
      {
        label: 'Povstat se zbraní v ruce',
        requires: (s) => s.noble.plot >= 2,
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: -0.1, traitKey: 'strength', traitScale: 0.03, resourceKey: 'army', resourceScale: 0.7,
        chanceBonus: (s) => allies(s) * 0.07 + s.noble.plot * 0.04,
        onSuccess: { endGame: 'crowned', chronicle: 'Spiklenci otevřeli brány a vojsko rodu {dynastyName} vtáhlo do Vlčího Údělu. Koruna má nového nositele.' },
        onFailure: { endGame: 'executed', chronicle: 'Povstání bylo potlačeno dřív, než začalo.' },
      },
      {
        label: 'Podpořit královského nástupce',
        hintType: 'resource', hintKey: 'favor',
        newKing: true,
        effects: { favor: 15, legitimacy: -3 },
        chronicle: 'Rod {dynastyName} se první poklonil novému panovníkovi. Taková věrnost se odměňuje.',
      },
      {
        label: 'Stát stranou a vyčkat',
        hintType: 'trait', hintKey: 'patience',
        newKing: true,
        effects: {},
        chronicle: 'Rod nepromluvil ani pro, ani proti. Nový panovník usedl na trůn.',
      },
    ],
  },

  {
    id: 'n_prevrat',
    scenario: S,
    music: 'battle',
    weight: 4,
    cooldown: 6,
    requires: (s) => s.noble.plot >= 3 && s.king.alive,
    title: 'Noc dlouhých nožů',
    text: 'Spiknutí je připravené. Stráže na hradbách jsou podplacené, spojenci čekají na znamení a {king.title} {king.name} spí. Stačí jediný rozkaz.',
    choices: [
      {
        label: 'Udeřit dnes v noci',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.0, traitKey: 'strength', traitScale: 0.03, resourceKey: 'army', resourceScale: 0.7,
        requires: (s) => !s.flags.prevrat_selhal, // the first failure is a flight, the second the scaffold
        chanceBonus: (s) => allies(s) * 0.07 + (s.resources.legitimacy - 40) / 250,
        onSuccess: { endGame: 'crowned', chronicle: 'Do rána bylo po všem. Sesazen{K:ý král|á královna} {king.name} je v žaláři a koruna připadla rodu {dynastyName}.' },
        onFailure: { effects: { favor: -15, legitimacy: -10, army: -10, prestige: -6 }, noble: { plotReset: true }, hiddenEffects: { setFlag: 'prevrat_selhal' }, chronicle: 'Někdo spiklence zradil. Stráže čekaly s tasenými meči, ale {ruler.name} {R:unikl|unikla} tajnou chodbou. Spiklenci visí na hradbách a jméno rodu {dynastyName} se u dvora vyslovuje šeptem.' },
      },
      {
        label: 'Udeřit dnes v noci',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.0, traitKey: 'strength', traitScale: 0.03, resourceKey: 'army', resourceScale: 0.7,
        requires: (s) => !!s.flags.prevrat_selhal,
        chanceBonus: (s) => allies(s) * 0.07 + (s.resources.legitimacy - 40) / 250,
        onSuccess: { endGame: 'crowned', chronicle: 'Do rána bylo po všem. Sesazen{K:ý král|á královna} {king.name} je v žaláři a koruna připadla rodu {dynastyName}.' },
        onFailure: { endGame: 'executed', chronicle: 'Někdo spiklence zradil. Stráže čekaly s tasenými meči.' },
      },
      {
        label: 'Ještě vyčkat na lepší chvíli',
        hintType: 'trait', hintKey: 'patience',
        effects: {},
        chronicle: 'Rozkaz nepadl. Spiklenci čekají — a čekání je nebezpečné.',
      },
      {
        label: 'Spiknutí rozpustit a zahladit stopy',
        hintType: 'resource', hintKey: 'favor',
        noble: { plotReset: true },
        effects: { gold: -10, favor: 3 },
        chronicle: 'Dopisy shořely, spiklenci se rozjeli domů. Jako by se nic nestalo.',
      },
    ],
  },

  // ===================== RIVAL HOUSES =====================

  {
    id: 'n_spor_o_hranici',
    scenario: S,
    cooldown: 10,
    target: landedHouse,
    title: 'Spor o mezníky',
    text: 'Lidé, kterým velí {house.headTitle} {house.head} z rodu {house.gen}, v noci posunuli hraniční kameny a zabrali tvým vsím louky u řeky.',
    choices: [
      {
        label: 'Vytlačit je ozbrojenci',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.5, resourceKey: 'army', resourceScale: 0.5,
        onSuccess: { effects: { prestige: 5, army: -2 }, houseEffects: { target: { attitude: -10 } }, chronicle: 'Louky jsou zase tvoje. Sousedé se stáhli a vzkázali, že nezapomenou.' },
        onFailure: { effects: { army: -6, prestige: -4 }, provinceEffects: { own: { loyalty: -5 } }, houseEffects: { target: { attitude: -6 } }, chronicle: 'Šarvátka u řeky skončila porážkou. Sousedé si louky nechali.' },
      },
      {
        label: 'Žalovat u {K:krále|královny}',
        hintType: 'resource', hintKey: 'favor',
        isRoll: true, baseChance: 0.35, resourceKey: 'favor', resourceScale: 0.7,
        onSuccess: { effects: { favor: 2 }, houseEffects: { target: { power: -6, attitude: -5 } }, chronicle: '{king.Title} rozhodl{K:|a} ve prospěch rodu {dynastyName}. Sousedé museli kameny vrátit a zaplatit škodu.' },
        onFailure: { effects: { favor: -4 }, chronicle: '{king.Title} nechtěl{K:|a} ztrácet čas spory o louky a dal{K:|a} za pravdu silnějšímu.' },
      },
      {
        label: 'Ustoupit a nechat jim louky',
        hintType: 'trait', hintKey: 'patience',
        effects: { prestige: -4 },
        houseEffects: { target: { attitude: 10 } },
        chronicle: 'Rod ustoupil. Sousedé jsou spokojení, vlastní sedláci méně.',
      },
    ],
  },

  {
    id: 'n_nabidka_spojenectvi',
    scenario: S,
    cooldown: 10,
    target: friendlyHouse,
    title: 'Nabídka spojenectví',
    text: '{house.HeadTitle} {house.head} z rodu {house.gen} {H:přijel|přijela} s malým doprovodem a nabízí spojenectví. Spolu by vaše rody měly u dvora váhu, jakou žádný nemá sám.',
    choices: [
      {
        label: 'Uzavřít spojenectví',
        hintType: 'resource', hintKey: 'legitimacy',
        effects: { legitimacy: 6, prestige: 3 },
        houseEffects: { target: { ally: true, attitude: 10 } },
        chronicle: 'Rody si podaly ruce. Kdo napadne jeden, napadne oba.',
      },
      {
        label: 'Zdvořile odmítnout',
        hintType: 'trait', hintKey: 'patience',
        effects: {},
        houseEffects: { target: { attitude: -6 } },
        chronicle: 'Nabídka byla odmítnuta. Host odjel s úsměvem, který nedosáhl až k očím.',
      },
    ],
  },

  {
    id: 'n_snatkova_nabidka',
    scenario: S,
    cooldown: 14,
    target: (s) => {
      const h = s.houses.filter((x) => !x.married && x.attitude >= 45).sort((a, b) => b.attitude - a.attitude)[0];
      return h && s.heir.alive && s.heir.age >= 12 && !s.flags.royal_match && !s.flags.heir_married ? h.id : null;
    },
    title: 'Sňatek mezi rody',
    text: 'Rod {house.gen} nabízí sňatek: tvůj dědic {heir.name} a jejich nejmladší potomek. Věno by bylo štědré a pouto mezi rody pevné.',
    choices: [
      {
        label: 'Přijmout sňatek',
        hintType: 'resource', hintKey: 'legitimacy',
        effects: { gold: 12, legitimacy: 5 },
        houseEffects: { target: { married: true, ally: true, attitude: 20 } },
        courtEffects: { heir: { loyalty: -4 } },
        chronicle: 'Zásnuby byly zpečetěny. Dva rody se staly jednou krví.',
      },
      {
        label: 'Odmítnout — dědic je určen pro vyšší cíle',
        hintType: 'resource', hintKey: 'prestige',
        effects: { prestige: 2 },
        houseEffects: { target: { attitude: -12 } },
        chronicle: 'Rod nabídku odmítl. Sousedé to vzali jako urážku.',
      },
    ],
  },

  {
    id: 'n_najezd_rodu',
    scenario: S,
    music: 'battle',
    cooldown: 10,
    target: hostileLandedHouse,
    title: 'Ozbrojenci na tvé půdě',
    text: 'Ozbrojenci rodu {house.gen} vpadli do tvých vsí, vypálili stodolu a odehnali dobytek. Tvrdí, že jen vymáhají starý dluh.',
    choices: [
      {
        label: 'Vyjet proti nim s družinou',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.45, traitKey: 'strength', traitScale: 0.03, resourceKey: 'army', resourceScale: 0.6,
        onSuccess: { effects: { prestige: 7, army: -3 }, houseEffects: { target: { power: -6 } }, provinceEffects: { own: { loyalty: 6 } }, traitGain: 'strength', chronicle: 'Družina rodu dostihla nájezdníky u brodu. Dobytek se vrátil domů, nájezdníci ne.' },
        onFailure: { effects: { army: -8 }, provinceEffects: { own: { unrest: 10, wealth: -5 } }, chronicle: 'Nájezdníci byli silnější. Vsi hoří a sedláci se ptají, kdo je ochrání.' },
      },
      {
        label: 'Stěžovat si u {K:krále|královny}',
        hintType: 'resource', hintKey: 'favor',
        isRoll: true, baseChance: 0.35, resourceKey: 'favor', resourceScale: 0.6,
        onSuccess: { effects: { gold: 10 }, houseEffects: { target: { power: -8, attitude: -5 } }, chronicle: '{king.Title} nařídil{K:|a} náhradu škody. Sousedé platí se skřípěním zubů.' },
        onFailure: { effects: { favor: -3 }, provinceEffects: { own: { unrest: 6 } }, chronicle: '{king.Title} se do sporu nechtěl{K:|a} plést. Škoda zůstala na rodu.' },
      },
      {
        label: 'Zaplatit „dluh“ a mít klid',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -12, prestige: -4 },
        houseEffects: { target: { attitude: 8 } },
        chronicle: 'Rod zaplatil. Nájezdy ustaly, úcta sousedů taky.',
      },
    ],
  },

  {
    id: 'n_pujcka_rodu',
    scenario: S,
    cooldown: 12,
    target: anyHouse,
    title: 'Žádost o půjčku',
    text: '{house.HeadTitle} {house.head} z rodu {house.gen} se {H:ocitl|ocitla} v nesnázích a žádá o půjčku. Prý to vrátí do žní. Prý.',
    choices: [
      {
        label: 'Půjčit bez úroku',
        requires: (s) => s.resources.gold >= 20,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -20 },
        houseEffects: { target: { attitude: 18 } },
        chronicle: 'Rod půjčil a nechtěl nic navíc. Sousedé si to budou pamatovat.',
      },
      {
        label: 'Půjčit za zástavu pozemků',
        requires: (s) => s.resources.gold >= 20 && targetLanded(s), // a house without a seat has nothing to pledge
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.55, traitKey: 'intelligence', traitScale: 0.04,
        onSuccess: { effects: { gold: -20 }, provinceEffects: { own: { wealth: 10 } }, houseEffects: { target: { attitude: -4, power: -5 } }, traitGain: 'intelligence', chronicle: 'Dluh nebyl splacen a zastavené louky připadly rodu {dynastyName}. Peníze jsou pryč, půda zůstane.' },
        onFailure: { effects: { gold: -20 }, houseEffects: { target: { attitude: -8 } }, chronicle: 'Dlužník zástavu zpochybnil u soudu a vyhrál. Peníze jsou pryč.' },
      },
      {
        label: 'Odmítnout',
        hintType: 'resource', hintKey: 'gold',
        effects: {},
        houseEffects: { target: { attitude: -8 } },
        chronicle: 'Rod odmítl půjčit. Sousedé hledají věřitele jinde.',
      },
    ],
  },

  {
    id: 'n_hostina_rodu',
    scenario: S,
    cooldown: 10,
    target: landedHouse,
    title: 'Hostina u sousedů',
    text: 'Rod {house.gen} zve na velkou hostinu na své sídlo. Bude tam půl šlechty země — a víno, které rozvazuje jazyky.',
    choices: [
      {
        label: 'Jet a získat přízeň hostitelů',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.55, traitKey: 'eloquence', traitScale: 0.04,
        onSuccess: { effects: { gold: -5, prestige: 3 }, houseEffects: { target: { attitude: 12 } }, traitGain: 'eloquence', chronicle: '{ruler.name} {R:byl|byla} hvězdou hostiny. Hostitelé se loučili jako s přítelem.' },
        onFailure: { effects: { gold: -5, prestige: -3 }, houseEffects: { target: { attitude: -4 } }, chronicle: 'Slovo dalo slovo a hostina skončila hádkou.' },
      },
      {
        label: 'Jet a naslouchat opilým jazykům',
        hintType: 'trait', hintKey: 'intelligence',
        effects: { gold: -5 },
        noble: { secrets: 1 },
        chronicle: 'Zatímco ostatní pili, {ruler.name} {R:poslouchal|poslouchala}. Jedno tajemství stojí víc než sud vína.',
      },
      {
        label: 'Poslat omluvu',
        hintType: 'resource', hintKey: 'gold',
        effects: {},
        houseEffects: { target: { attitude: -4 } },
        chronicle: 'Rod na hostinu nepřijel. Hostitelé si toho všimli.',
      },
    ],
  },

  {
    id: 'n_pomluvy',
    scenario: S,
    cooldown: 10,
    target: hostileHouse,
    requires: (s) => s.heir.alive,
    title: 'Pomluvy',
    text: 'Po dvoře se šíří pomluvy, že rod {dynastyName} přišel k erbu podvodem a že dědic {heir.name} není vlastní krve. Stopa vede k rodu {house.gen}.',
    choices: [
      {
        label: 'Odpovědět stejnou mincí',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.5, traitKey: 'eloquence', traitScale: 0.04,
        onSuccess: { effects: { prestige: 4 }, houseEffects: { target: { attitude: -10, power: -5 } }, chronicle: 'Odpověď byla tak vtipná a jedovatá, že se dvůr smál jinému rodu.' },
        onFailure: { effects: { prestige: -5, legitimacy: -3 }, houseEffects: { target: { attitude: -8 } }, chronicle: 'Odpověď zněla jako přiznání. Pomluvy jen zesílily.' },
      },
      {
        label: 'Umlčet je tajemstvím, které o nich víš',
        requires: (s) => s.noble.secrets > 0,
        hintType: 'trait', hintKey: 'intelligence',
        effects: { prestige: 2 },
        noble: { secrets: -1 },
        houseEffects: { target: { attitude: -6 } },
        chronicle: 'Stačil jediný dopis a pomluvy utichly. Oba rody vědí proč.',
      },
      {
        label: 'Mlčet a nechat pomluvy vyšumět',
        hintType: 'trait', hintKey: 'patience',
        effects: { legitimacy: -3 },
        traitGain: 'patience',
        chronicle: 'Rod mlčel. Pomluvy časem vyšuměly, ale něco v lidech zůstalo.',
      },
    ],
  },

  // ===================== INTRIGUE =====================

  {
    id: 'n_nalezeny_dopis',
    scenario: S,
    cooldown: 10,
    target: anyHouse,
    title: 'Dopis, který neměl být nalezen',
    text: '{chancellor.Title} {chancellor.name} přinesl zachycený dopis rodu {house.gen}. Je v něm dost na to, aby někdo přišel o hlavu.',
    choices: [
      {
        label: 'Dopis si nechat pro pozdější chvíli',
        hintType: 'trait', hintKey: 'intelligence',
        effects: {},
        noble: { secrets: 1 },
        chronicle: 'Dopis zmizel v železné truhle rodu. Někdy se bude hodit.',
      },
      {
        label: 'Předat dopis {K:králi|královně}',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 10 },
        houseEffects: { target: { attitude: -15, power: -10 } },
        chronicle: '{king.Title} si dopis přečetl{K:|a} dvakrát. Rod {house.gen} upadl v nemilost a rod {dynastyName} v milost.',
      },
      {
        label: 'Vrátit dopis tiše pisateli',
        hintType: 'trait', hintKey: 'patience',
        effects: {},
        houseEffects: { target: { attitude: 15 } },
        chronicle: 'Dopis se vrátil pisateli i s pečetí rodu {dynastyName}. Teď jsou rodu dlužni.',
      },
    ],
  },

  {
    id: 'n_vydirani',
    scenario: S,
    cooldown: 8,
    requires: (s) => s.noble.secrets >= 1,
    target: anyHouse,
    title: 'Tajemství v truhle',
    text: 'V železné truhle rodu leží listina, která by mohla zničit rod {house.name}. {spymaster.Title} {spymaster.name} se ptá, zda nenastal čas ji použít.',
    choices: [
      {
        label: 'Vydírat je o zlato',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 22 },
        noble: { secrets: -1 },
        houseEffects: { target: { attitude: -15 } },
        chronicle: 'Rod {house.gen} zaplatil za mlčení. Nenávist mají zdarma.',
      },
      {
        label: 'Přinutit je podpořit tvůj nárok',
        hintType: 'resource', hintKey: 'legitimacy',
        effects: { legitimacy: 8 },
        noble: { secrets: -1 },
        houseEffects: { target: { attitude: -5, ally: true } },
        chronicle: 'Rod {house.gen} se veřejně postavil za rod {dynastyName}. Neochotně, ale veřejně.',
      },
      {
        label: 'Listinu spálit — takové zbraně se nepoužívají',
        hintType: 'resource', hintKey: 'faith',
        effects: { faith: 3, prestige: 1 },
        noble: { secrets: -1 },
        chronicle: 'Listina shořela v krbu. Svědomí rodu je čistší, truhla prázdnější.',
      },
    ],
  },

  {
    id: 'n_spiklenci_zvou',
    scenario: S,
    cooldown: 10,
    requires: (s) => s.noble.plot === 0 && s.king.alive, // an invitation goes to someone not yet in the plot
    title: 'Pozvání do tmy',
    text: 'Maskovaný posel předal pozvání na schůzku v opuštěné kapli. Nespokojení šlechtici hledají někoho, kdo by se postavil proti koruně.',
    choices: [
      {
        label: 'Přidat se ke spiklencům',
        hintType: 'trait', hintKey: 'strength',
        effects: { legitimacy: 5, favor: -3 },
        noble: { plot: 1 },
        chronicle: 'V opuštěné kapli si spiklenci podali ruce. Jedna z nich patřila rodu {dynastyName}.',
      },
      {
        label: 'Udat spiklence {K:králi|královně}',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 12, prestige: 3 },
        noble: { secrets: 1 },
        chronicle: 'Rod udal spiklence. {king.Title} je {K:vděčný|vděčná} a pár šlechticů skončilo ve věži.',
      },
      {
        label: 'Na schůzku nejít a mlčet',
        hintType: 'trait', hintKey: 'patience',
        effects: {},
        chronicle: 'Pozvání shořelo v krbu. Rod nic neviděl a nic neslyšel.',
      },
    ],
  },

  {
    id: 'n_podplatit_straze',
    scenario: S,
    cooldown: 8,
    requires: (s) => s.noble.plot >= 1 && s.noble.plot < 3,
    title: 'Velitel stráží',
    text: 'Spiklenci potřebují velitele královské stráže. Je chamtivý, ale není hloupý — a ví, jak vysoko visí šibenice.',
    choices: [
      {
        label: 'Uplatit ho zlatem',
        requires: (s) => s.resources.gold >= 20,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -20 },
        noble: { plot: 1 },
        chronicle: 'Velitel stráží přijal zlato. Brány Vlčího Údělu se jednou otevřou ve správnou hodinu.',
      },
      {
        label: 'Přesvědčit ho, že je to správné',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.4, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { noble: { plot: 1 }, traitGain: 'eloquence', chronicle: 'Velitel stráží se přidal z přesvědčení. Takový muž nezradí.' },
        onFailure: { effects: { favor: -15 }, noble: { plot: -1 }, chronicle: 'Velitel stráží šel rovnou za {K:králem|královnou}. Spiknutí se otřásá v základech.' },
      },
      {
        label: 'Najít jinou cestu',
        hintType: 'trait', hintKey: 'patience',
        effects: {},
        chronicle: 'Velitel stráží zůstal stranou. Spiklenci hledají jinou cestu do hradu.',
      },
    ],
  },

  {
    id: 'n_spiklenec_zradil',
    scenario: S,
    weight: 2,
    cooldown: 10,
    requires: (s) => s.noble.plot >= 1,
    title: 'Jazyk, který se rozvázal',
    text: 'Jeden ze spiklenců se v krčmě opil a mluvil. Zatím ho poslouchali jen sedláci, ale do rána to může vědět celý dvůr.',
    choices: [
      {
        label: 'Umlčet ho dřív, než bude pozdě',
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.55, traitKey: 'strength', traitScale: 0.03,
        onSuccess: { effects: { faith: -3 }, chronicle: 'Spiklenec už nikdy nepromluví. Spiknutí žije dál.' },
        onFailure: { effects: { favor: -20 }, noble: { plotReset: true }, noInjury: true, chronicle: 'Pokus o umlčení se nezdařil a spiklenec utekl ke {K:králi|královně}. Spiknutí je rozprášeno a {king.title} má podezření.' },
      },
      {
        label: 'Předejít mu a přiznat se {K:králi|královně}',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 6, legitimacy: -10 },
        noble: { plotReset: true, secrets: 1 },
        chronicle: 'Rod předstoupil před {K:krále|královnu} jako ten, kdo spiknutí „odhalil“. Ostatní spiklenci skončili ve věži.',
      },
      {
        label: 'Zapírat a doufat',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.45, traitKey: 'eloquence', traitScale: 0.04,
        onSuccess: { chronicle: 'Opilcovy řeči nikdo nebral vážně. Spiknutí přežilo.' },
        onFailure: { effects: { favor: -12 }, noble: { plot: -1 }, chronicle: '{king.Title} poslal{K:|a} vyšetřovatele. Ti nic nedokázali, ale podezření zůstalo.' },
      },
    ],
  },

  {
    id: 'n_zradce_v_radach',
    scenario: S,
    cooldown: 10,
    target: (s) => ['chancellor', 'marshal', 'spymaster'].find((r) => s[r].alive !== false && s[r].loyalty <= 35) || null,
    title: 'Zrádce mezi svými',
    text: '{target.name}, {target.your} {target.role}, se tajně schází s lidmi {K:krále|královny}. Pokud o něčem ví, může to rodu {dynastyName} zlomit vaz.',
    choices: [
      {
        label: 'Uplatit ho, aby mlčel',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -15 },
        courtEffects: { target: { loyalty: 25 } },
        chronicle: 'Zlato spravilo, co pokazilo přehlížení. Na čas.',
      },
      {
        label: 'Zbavit ho služby',
        hintType: 'trait', hintKey: 'strength',
        effects: { favor: -4 },
        replaceCourt: { loyalty: 65, minAge: 30, maxAge: 50 },
        chronicle: 'Zrádce byl vyhnán z panství. Jestli {K:králi|královně} něco řekl, to se teprve ukáže.',
      },
      {
        label: 'Krmit ho falešnými zprávami',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.45, traitKey: 'intelligence', traitScale: 0.05,
        onSuccess: { effects: { favor: 5 }, noble: { secrets: 1 }, traitGain: 'intelligence', chronicle: '{king.Title} teď věří, že rod {dynastyName} je {K:mu|jí} oddaný až za hrob. Díky zrádci.' },
        onFailure: { effects: { favor: -10 }, chronicle: 'Zrádce lež prohlédl a donesl {K:králi|královně} pravdu.' },
      },
    ],
  },

  // ===================== THE ESTATE =====================

  {
    id: 'n_mlyn',
    oneTime: true, // once the mill stands, it stands
    scenario: S,
    cooldown: 20,
    title: 'Mlýn na potoce',
    text: 'Sedláci musí vozit obilí k mlýnu Bílé Brány a platit mlynářovi třetinu. Tvůj purkrabí navrhuje postavit vlastní mlýn na potoce pod tvrzí.',
    choices: [
      {
        label: 'Postavit mlýn',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -12, food: 4 },
        provinceEffects: { own: { wealth: 8, loyalty: 4 } },
        houseEffects: { brana: { attitude: -5 } },
        chronicle: 'Pod tvrzí klape nový mlýn. Bílá Brána přišla o třetinu z obilí celého pobřeží.',
      },
      {
        label: 'Pronajmout stavbu mlynáři',
        hintType: 'trait', hintKey: 'intelligence',
        effects: { gold: 4 },
        provinceEffects: { own: { wealth: 3 } },
        chronicle: 'Mlynář postavil mlýn za své a platí nájem. Rod nemusí hnout prstem.',
      },
      {
        label: 'Nestavět',
        hintType: 'resource', hintKey: 'gold',
        effects: {},
        chronicle: 'Sedláci dál vozí obilí k sousedům.',
      },
    ],
  },

  {
    id: 'n_pytlaci',
    scenario: S,
    cooldown: 10,
    title: 'Pytláci',
    text: 'Hajní chytili v panském lese tři pytláky s jelenem. Jsou to hladoví otcové rodin z tvé vlastní vsi.',
    choices: [
      {
        label: 'Pověsit je pro výstrahu',
        hintType: 'trait', hintKey: 'strength',
        effects: { stability: 3 },
        provinceEffects: { own: { unrest: 8, loyalty: -6 } },
        chronicle: 'Tři těla visí na lípě u cesty. V panském lese je klid. Ve vsi taky — zlý klid.',
      },
      {
        label: 'Uložit pokutu a robotu navíc',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 3 },
        provinceEffects: { own: { unrest: 2 } },
        chronicle: 'Pytláci si odpracují jelena na panských polích.',
      },
      {
        label: 'Propustit je a dát jim jelena',
        hintType: 'trait', hintKey: 'patience',
        effects: { prestige: -2 },
        provinceEffects: { own: { loyalty: 8, unrest: -5 } },
        chronicle: 'Vesnice slavila. O milosrdném pánovi se mluví až v Brodě.',
      },
    ],
  },

  {
    id: 'n_kamenny_hrad',
    scenario: S,
    cooldown: 40,
    requires: (s) => s.resources.gold >= 25,
    title: 'Kamenný hrad',
    text: 'Stará dřevěná tvrz se rozpadá. Stavitel z Vlčího Údělu přinesl plány kamenného hradu s věží, jaký by se nestyděl ani velmož.',
    choices: [
      {
        label: 'Postavit kamenný hrad',
        requires: (s) => s.resources.gold >= 35,
        hintType: 'resource', hintKey: 'prestige',
        effects: { gold: -35, prestige: 8, legitimacy: 3 },
        provinceEffects: { own: { garrison: 20, unrest: -5 } },
        chronicle: 'Nad pobřežím vyrostl kamenný hrad. Rod {dynastyName} už nesedí ve dřevě.',
      },
      {
        label: 'Opravit tvrz a postavit palisádu',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -10 },
        provinceEffects: { own: { garrison: 8 } },
        chronicle: 'Tvrz byla opravena a obehnána novou palisádou. Vydrží ještě pár let.',
      },
      {
        label: 'Nic nestavět',
        hintType: 'resource', hintKey: 'gold',
        effects: { prestige: -1 },
        chronicle: 'Tvrz dál vrže ve větru.',
      },
    ],
  },

  {
    id: 'n_robota',
    scenario: S,
    cooldown: 12,
    title: 'Robota',
    text: 'Sedláci z tvých vsí odmítají chodit na robotu. Tvrdí, že žně jsou krátké a že na panských polích nemají čas na svá vlastní.',
    choices: [
      {
        label: 'Trvat na robotě',
        hintType: 'trait', hintKey: 'strength',
        effects: { gold: 6, food: 4 },
        provinceEffects: { own: { unrest: 10, loyalty: -6 } },
        chronicle: 'Dráb přivedl sedláky na pole s holí. Úroda je sklizena, nálada ne.',
      },
      {
        label: 'Ulevit jim od roboty',
        hintType: 'resource', hintKey: 'stability',
        effects: { gold: -4, food: -3 },
        provinceEffects: { own: { loyalty: 10, unrest: -8 } },
        chronicle: 'Robota byla zkrácena. Sedláci sklidili svá pole a o pánovi mluví hezky.',
      },
      {
        label: 'Vyjednat s rychtáři',
        hintType: 'trait', hintKey: 'patience',
        isRoll: true, baseChance: 0.5, traitKey: 'patience', traitScale: 0.05,
        onSuccess: { effects: { gold: 3 }, provinceEffects: { own: { loyalty: 5, unrest: -4 } }, traitGain: 'patience', chronicle: 'Rychtáři a purkrabí našli dohodu. Robota se posunula až po žních.' },
        onFailure: { provinceEffects: { own: { unrest: 6 } }, chronicle: 'Vyjednávání se zadrhlo. Sedláci chodí na robotu pozdě a pracují pomalu.' },
      },
    ],
  },

  {
    id: 'n_trzni_pravo',
    scenario: S,
    cooldown: 30,
    title: 'Trhové právo',
    text: 'Měšťané z přístavní vsi chtějí každý týden pořádat trh. Na trhové právo je ale potřeba svolení koruny — a {king.title} ho nedává zadarmo.',
    choices: [
      {
        label: 'Požádat {K:krále|královnu} o trhové právo',
        hintType: 'resource', hintKey: 'favor',
        isRoll: true, baseChance: 0.35, resourceKey: 'favor', resourceScale: 0.8,
        onSuccess: { effects: { gold: -5 }, provinceEffects: { own: { wealth: 12, loyalty: 5 } }, chronicle: '{king.Title} pečetí stvrdil{K:|a} trhové právo. Do vsi se sjíždějí kupci z celého pobřeží.' },
        onFailure: { effects: { gold: -5, favor: -3 }, chronicle: '{king.Title} žádost odložil{K:|a}. Trh nebude.' },
      },
      {
        label: 'Pořádat trh i bez svolení',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 8, favor: -8 },
        provinceEffects: { own: { wealth: 8 } },
        chronicle: 'Trh se koná bez královské pečeti. Výdělky jsou dobré, dopisy od dvora méně.',
      },
    ],
  },

  {
    id: 'n_spatna_uroda',
    scenario: S,
    seasons: [2],
    cooldown: 10,
    title: 'Neúroda',
    text: 'Letní deště spálily obilí na stéblech. Sýpky na panství zůstanou poloprázdné a zima bude dlouhá.',
    choices: [
      {
        label: 'Snížit sedlákům dávky',
        hintType: 'resource', hintKey: 'stability',
        effects: { food: -6, gold: -4 },
        provinceEffects: { own: { loyalty: 8 } },
        chronicle: 'Rod snížil dávky. Panská kuchyně bude letos skromnější.',
      },
      {
        label: 'Nakoupit obilí od Bílé Brány',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -14, food: 10 },
        houseEffects: { brana: { attitude: 4, power: 3 } },
        chronicle: 'Bílá Brána prodala obilí — za cenu, jakou si mohla dovolit jen v neúrodě.',
      },
      {
        label: 'Trvat na plných dávkách',
        hintType: 'trait', hintKey: 'strength',
        effects: { food: 4 },
        provinceEffects: { own: { unrest: 14, loyalty: -8 } },
        chronicle: 'Dávky byly vybrány do zrnka. Ve vsích se letos umírá hladem.',
      },
    ],
  },
];

export const NOBLE_QUIET_EVENT = {
  id: 'n_klidne_obdobi',
  scenario: S,
  title: 'Klidné období',
  text: 'Na panství je klid. Sedláci pracují na polích, od dvora nepřišel žádný posel. Jak {ruler.title} využije klidný čas?',
  choices: [
    {
      label: 'Spravovat panství',
      hintType: 'resource', hintKey: 'gold',
      effects: { gold: -4 },
      provinceEffects: { own: { wealth: 4, unrest: -3 } },
      chronicle: 'Purkrabí a {R:pán|paní} objeli všechny vsi a srovnali účty.',
    },
    {
      label: 'Cvičit družinu',
      hintType: 'resource', hintKey: 'army',
      effects: { gold: -5, army: 4 },
      chronicle: 'Družina celou sezónu cvičila na nádvoří tvrze.',
    },
    {
      label: 'Psát dopisy ke dvoru',
      hintType: 'trait', hintKey: 'eloquence',
      effects: { favor: 3 },
      traitGain: 'eloquence',
      chronicle: 'Ke dvoru odešla celá kupa dopisů plných lichotek a zpráv.',
    },
    {
      label: 'Studovat rodokmeny a staré listiny',
      requires: (s) => s.origin !== 'sedlak', // an old line has old parchments
      hintType: 'trait', hintKey: 'intelligence',
      effects: { legitimacy: 2 },
      traitGain: 'intelligence',
      chronicle: 'Ve starých listinách se našel předek, kterého by se nestyděl ani panovník.',
    },
    {
      label: 'Dát sepsat kroniku rodu',
      requires: (s) => s.origin === 'sedlak', // a house from the plough writes its own
      hintType: 'trait', hintKey: 'intelligence',
      effects: { legitimacy: 2 },
      traitGain: 'intelligence',
      chronicle: 'Písař sepsal kroniku rodu {dynastyName} od pluhu v Lipnici až po erb. Sousední páni se nad ní ušklíbají, ale číst ji chodí všichni.',
    },
  ],
};
