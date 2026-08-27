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

export const EVENTS = [
  {
    id: 'soud_o_mez',
    image: 'assets/events/scene_council.png',
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
    title: 'Rváči v krčmě',
    text: 'Skupina opilých žoldnéřů rozbíjí krčmu v hlavním městě a odmítá poslechnout stráže. Čekají na tvé rozhodnutí.',
    choices: [
      {
        label: 'Vymlátit je vlastní rukou',
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.45, traitKey: 'strength', traitScale: 0.05,
        onSuccess: { effects: { prestige: 8, army: 2 }, traitGain: 'strength', chronicle: 'Vládce sám srazil rváče k zemi. Zpráva o tom se šíří městem a vojáci si ho začínají víc vážit.' },
        onFailure: { effects: { prestige: -6, stability: -2 }, chronicle: 'Rváči kladli tvrdší odpor, než se čekalo. Vládce odchází pohmožděný a ne zrovna důstojně.' },
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
    image: 'assets/events/scene_plague.png',
    title: 'Varování kancléře',
    text: 'Kancléř {chancellor.name} varuje, že sýpky nejsou tak plné, jak by měly být, a přichází tvrdá zima.',
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
    image: 'assets/events/scene_ritual.png',
    title: 'Zpráva špehmistra',
    text: 'Špehmistr {spymaster.name} přichází s neklidnou zprávou: mezi šlechtici prý koluje řeč o spiknutí proti tvé vládě.',
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
    image: 'assets/events/scene_march.png',
    title: 'Vojenská přehlídka',
    text: 'Maršál {marshal.name} navrhuje uspořádat velkou přehlídku vojska, ať poddaní vidí sílu koruny.',
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
];
