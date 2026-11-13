// The prologue: every new chronicle opens with three cards before the first
// season (state.js createNewGame queues them; all free, so they take no season).
// Who raised you sets the starting traits and an origin flag (p_fara, p_pytlak,
// p_kovar, p_krcma) that brings one story of its own later on; the first winter
// sets the starting purse; the lord's visit reveals his temper (engine.js
// LORD_NATURES), which shapes the autumn dues and how fast he forgets service.
// Branch extra: traits: { strength: 2, patience: -1 } moves several traits at once.

const S = 'sedlak';
const img = (id) => `assets/events/${id}.jpg`;

export const PROLOGUE = ['p_puvod', 'p_prvni_zima', 'p_pan'];

export const PROLOGUE_EVENTS = [
  {
    id: 'p_puvod',
    scenario: S, forced: true, free: true,
    image: img('prosba_ucitele'),
    title: 'Kdo z tebe udělal, kým jsi',
    text: 'Narodil{R:|a} ses v Lipnici do rodu, který nikdy neměl víc než ruce a kus cizí země. Otec zemřel loni na jaře a grunt teď připadl tobě. Než se chopíš pluhu, vzpomeň si, kdo tě vychoval — protože to, co ti dal, poneseš celý život.',
    choices: [
      {
        label: 'Farář, který mě po večerech učil číst',
        hintType: 'trait', hintKey: 'intelligence',
        traits: { intelligence: 2, strength: -1 }, effects: { faith: 5 }, hiddenEffects: { setFlag: 'p_fara' },
        chronicle: '{ruler.name} {R:vyrůstal|vyrůstala} na faře. Umí číst — v Lipnici vzácnost, které se jedni obdivují a druzí bojí.',
      },
      {
        label: 'Strýc pytlák, se kterým jsem chodil{R:|a} do panského lesa',
        hintType: 'trait', hintKey: 'strength',
        traits: { strength: 2, eloquence: -1 }, effects: { food: 4 }, hiddenEffects: { setFlag: 'p_pytlak' },
        chronicle: '{ruler.name} {R:vyrůstal|vyrůstala} se strýcem v lese. Zná každou stezku, každé oko na zajíce — a mlčet umí líp než mluvit.',
      },
      {
        label: 'Děd kovář a jeho výheň',
        hintType: 'trait', hintKey: 'patience',
        traits: { strength: 1, patience: 1 }, courtEffects: { marshal: { loyalty: 15 } }, hiddenEffects: { setFlag: 'p_kovar' },
        chronicle: '{ruler.name} {R:vyrůstal|vyrůstala} u výhně. Ve vsi na {R:vnuka|vnučku} starého mistra nikdo nedá dopustit.',
      },
      {
        label: 'Matka, která vedla krčmu u cesty',
        hintType: 'trait', hintKey: 'eloquence',
        traits: { eloquence: 2, patience: -1 }, effects: { gold: 3 }, courtEffects: { spymaster: { loyalty: 15 } }, hiddenEffects: { setFlag: 'p_krcma' },
        chronicle: '{ruler.name} {R:vyrůstal|vyrůstala} mezi džbány a povídačkami. Ví, co si lidé šeptají, a umí to využít.',
      },
    ],
  },
  {
    id: 'p_prvni_zima',
    scenario: S, forced: true, free: true,
    image: img('kruta_zima'),
    title: 'První rok',
    text: 'První rok na vlastním gruntu. Komora je poloprázdná, kobyla stará a do žní daleko. Sousedé jsou na tom podobně a panský les je plný zvěře, na kterou se nesmí sáhnout.',
    choices: [
      {
        label: 'Prodat starou kobylu',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 6, army: -2 },
        chronicle: 'Kobyla odešla s kupcem z Brodné. Na jaře bude pluh tahat čeleď, ale v truhle zvoní groše.',
      },
      {
        label: 'Vyprosit si na panském dvoře obilí na dluh',
        hintType: 'resource', hintKey: 'favor',
        effects: { food: 10, favor: -4 },
        chronicle: 'Panský šafář odměřil obilí a zapsal dluh. Vrchnost nezapomíná.',
      },
      {
        label: 'Lovit potají v panském lese',
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.5, traitKey: 'strength', traitScale: 0.05, noInjury: true,
        onSuccess: { effects: { food: 12 }, chronicle: 'Srnec v komoře, stopy zaváté sněhem. Zima bude snesitelnější.' },
        onFailure: { effects: { favor: -10, prestige: -2 }, chronicle: 'Hajný našel v sněhu stopy, které vedly až ke tvým vratům.' },
      },
      {
        label: 'Rozdělit se se sousedy, ať přežijeme spolu',
        hintType: 'resource', hintKey: 'prestige',
        effects: { food: -3, prestige: 6 },
        chronicle: 'Co bylo v komoře, dělilo se mezi tři chalupy. Na jaře na to sousedé nezapomněli.',
      },
    ],
  },
  {
    id: 'p_pan',
    scenario: S, forced: true, free: true,
    image: img('s_pan_navsteva'),
    title: 'Hold nových hospodářů',
    text: 'Do vsi přijíždí {lord.title} {lord.name} z Bílé Brány přijmout hold od nových hospodářů. Ve vsi se o {L:něm|ní} říká, že je {lord.nature}: {lord.natureText}. Hospodáři stojí v řadě s čepicemi v rukou a čekají, na koho padne {L:jeho|její} pohled.',
    choices: [
      {
        label: 'Pokleknout a slíbit poctivou službu',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 8 },
        chronicle: '{ruler.name} {R:poklekl|poklekla} a slíbil{R:|a} službu. {lord.Title} {lord.name} si {R:ho|ji} poznamenal{L:|a}.',
      },
      {
        label: 'Pozdravit zdvořile a nic víc',
        hintType: 'trait', hintKey: 'patience',
        effects: { prestige: 2 },
        chronicle: 'Pozdrav, úklona, nic víc. Ve vsi si všimli, že se {R:nový hospodář|nová hospodyně} neplazí.',
      },
      {
        label: 'Promluvit za celou ves o loňských dávkách',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.4, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { prestige: 6, favor: 3 }, traitGain: 'eloquence', chronicle: '{lord.Title} vyslechl{L:|a} {R:mladého hospodáře|mladou hospodyni} a slevil{L:|a}. Ves má {R:nového mluvčího|novou mluvčí}.' },
        onFailure: { effects: { favor: -8, prestige: 2 }, chronicle: '{lord.Title} {lord.name} se zamračil{L:|a}. Ves tě obdivuje, vrchnost si tě pamatuje.' },
      },
    ],
  },

  // ---------- one story for each upbringing ----------
  {
    id: 'p_fara_dopisy',
    scenario: S, oneTime: true, minTurn: 6, weight: 2,
    requires: (s) => !!s.flags.p_fara,
    image: img('prosba_ucitele'),
    title: 'Dopisy pro celou ves',
    text: 'Starý farář, který tě učil číst, zemřel a odkázal ti tři knihy. Od té doby chodí sousedé s dopisy, listinami a dlužními úpisy: kdo jiný jim je přečte? A jeden úpis, který přinesla vdova Dvořáková, říká něco jiného, než tvrdí panský šafář.',
    choices: [
      {
        label: 'Přečíst vdově, co v úpisu doopravdy stojí',
        hintType: 'trait', hintKey: 'intelligence',
        effects: { prestige: 6, favor: -5 },
        chronicle: 'Úpis říkal o polovinu méně, než šafář vybíral. Vdova dostala zpět svou kozu a šafář našel nového nepřítele.',
      },
      {
        label: 'Naučit číst i vlastní děti',
        requires: (s) => s.heir.alive,
        hintType: 'trait', hintKey: 'patience',
        heirTraits: { intelligence: 1 }, effects: { food: -2 },
        chronicle: 'Po večerech se u kamen hláskuje z farářových knih. {heir.name} čte pomalu, ale čte.',
      },
      {
        label: 'Prodat knihy kupci z Brodné',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 12, faith: -3 },
        chronicle: 'Knihy odjely s kupcem. Groše v truhle, prázdná polička nad kamny.',
      },
    ],
  },
  {
    id: 'p_pytlak_strycek',
    scenario: S, oneTime: true, minTurn: 6, weight: 2,
    requires: (s) => !!s.flags.p_pytlak,
    image: img('s_pytlactvi'),
    title: 'Strýc v okovech',
    text: 'Hajní přivedli do vsi strýce, který tě vychoval — s jelení kůží přes rameno a s rukama svázanýma za zády. Zítra ho povedou na panský dvůr. Strýc mlčí a dívá se na tebe; ví, že ty víš, kde má v lese další oka.',
    choices: [
      {
        label: 'Zaplatit za něj pokutu',
        requires: (s) => s.resources.gold >= 8,
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -8, prestige: 3 },
        chronicle: 'Pokuta byla zaplacena a strýc se vrátil domů. Do lesa prý už nepůjde. Nikdo tomu nevěří.',
      },
      {
        label: 'V noci ho osvobodit',
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.45, traitKey: 'strength', traitScale: 0.05,
        onSuccess: { effects: { prestige: 5, army: 2 }, chronicle: 'Ráno byla stodola, kde ho hlídali, prázdná. Strýc odešel do hor a nechal ti svá oka i svou psí smečku.' },
        onFailure: { effects: { favor: -12, prestige: -2 }, chronicle: 'Hajný se probudil dřív, než se provaz přetrhl. Teď jsou na panském dvoře dva pytláci.' },
      },
      {
        label: 'Zapřít ho',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 5, prestige: -5 },
        chronicle: '„Neznám ho,“ řekl{R:|a} {ruler.name}. Strýc se jen pousmál. Ves to slyšela.',
      },
    ],
  },
  {
    id: 'p_kovar_vyhen',
    scenario: S, oneTime: true, minTurn: 6, weight: 2,
    requires: (s) => !!s.flags.p_kovar,
    image: img('nove_kuse'),
    title: 'Dědovo kladivo',
    text: 'Děd kovář umřel ve spánku a odkázal ti své kladivo, kovadlinu a pár tajemství, která nikomu jinému neřekl. Celá ves čeká, co s tím vším uděláš.',
    choices: [
      {
        label: 'Postavit malou výheň na vlastním gruntu',
        requires: (s) => s.resources.gold >= 6,
        hintType: 'resource', hintKey: 'stability',
        effects: { gold: -6, stability: 6, army: 2 },
        chronicle: 'Na gruntu se rozhořela výheň. Nové radlice a podkovy ušetří víc, než stály.',
      },
      {
        label: 'Dát všechno dědovu učni',
        hintType: 'trait', hintKey: 'patience',
        effects: { prestige: 3 }, courtEffects: { marshal: { loyalty: 12 } },
        chronicle: 'Kovářský učeň dostal mistrovo nářadí. Rod {dynastyName} má ve vsi přítele na celý život.',
      },
      {
        label: 'Prodat nářadí v Brodné',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 10 }, courtEffects: { marshal: { loyalty: -8 } },
        chronicle: 'Kladivo i kovadlina odjely do Brodné. Učeň se na tebe od té doby nedívá.',
      },
    ],
  },
  {
    id: 'p_krcma_drab',
    scenario: S, oneTime: true, minTurn: 6, weight: 2,
    requires: (s) => !!s.flags.p_krcma,
    image: img('rvaci_v_krcme'),
    title: 'Co se šeptá u džbánu',
    text: 'Matčina krčma má nového krčmáře, ale staří štamgasti si k tobě pořád přisedají. Včera večer jeden z nich, opilý, vyklopil, že panský dráb si z dávek nechává každý desátý pytel. Takové věci se platí — tak či onak.',
    choices: [
      {
        label: 'Říct to vrchnosti',
        hintType: 'resource', hintKey: 'favor',
        effects: { favor: 10, prestige: -2 },
        chronicle: 'Dráb skončil v kládě a vrchnost si zapamatovala, kdo ho udal. Ve vsi se o udavačích nemluví hezky.',
      },
      {
        label: 'Promluvit si s drábem mezi čtyřma očima',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.5, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { gold: 8 }, traitGain: 'eloquence', chronicle: 'Dráb zbledl a od té doby se na tvém gruntu počítá pytle velmi pečlivě — a velmi málo.' },
        onFailure: { effects: { favor: -6, stability: -3 }, chronicle: 'Dráb se vysmál a ten podzim vybral na tvém gruntu dvakrát víc.' },
      },
      {
        label: 'Říct to celé vsi na návsi',
        hintType: 'resource', hintKey: 'prestige',
        effects: { prestige: 7, favor: -6 },
        chronicle: 'Ves se o drábových pytlích dozvěděla od tebe. Vrchnost se dozvěděla, kdo to roznesl.',
      },
    ],
  },
];
