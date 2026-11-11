// Panovník scenario — second event pack (50 events). Same shape as events.js.

export const MORE_EVENTS = [
  // ===================== COURT AND FAMILY =====================

  {
    id: 'cizi_vyslanec',
    title: 'Vyslanec z Marek',
    text: 'Do síně vstoupil vyslanec markrabího v černém sametu. Nabízí věčný mír a spojenectví — pokud se rod {dynastyName} spojí s markrabího rodem sňatkem.',
    choices: [
      {
        label: 'Přijmout nabídku spojenectví',
        hintType: 'resource', hintKey: 'legitimacy',
        effects: { legitimacy: 5, prestige: 4, faith: -2 },
        provinceEffects: { 'sokoli-hvozd': { unrest: -10 } },
        hiddenEffects: { setFlag: 'march_alliance' },
        chronicle: 'Spojenectví s Marcemi bylo zpečetěno. Na hranici je klid, i když kněží brblají nad cizím rodem.',
      },
      {
        label: 'Odmítnout, koruna se nespojuje s nepřítelem',
        hintType: 'resource', hintKey: 'prestige',
        effects: { prestige: 5 },
        provinceEffects: { 'sokoli-hvozd': { unrest: 6 } },
        chronicle: 'Vyslanec odjel s nepořízenou. Šlechta tleská hrdosti koruny, hraničáři se bojí, co přijde.',
      },
      {
        label: 'Protahovat jednání a získat čas',
        hintType: 'trait', hintKey: 'patience',
        isRoll: true, baseChance: 0.5, traitKey: 'patience', traitScale: 0.04,
        onSuccess: { effects: { gold: 10, legitimacy: 2 }, traitGain: 'patience', chronicle: 'Jednání se táhla celou zimu. Markrabí mezitím posílal dary, aby si koruna nerozmyslela, co ještě nerozhodla.' },
        onFailure: { effects: { prestige: -4 }, provinceEffects: { 'sokoli-hvozd': { unrest: 8 } }, chronicle: 'Markrabí prohlédl hru na čas a vyslance odvolal s urážkou.' },
      },
    ],
  },

  {
    id: 'nemoc_vladce',
    cooldown: 20,
    title: 'Horečka',
    text: 'Vládce {ruler.name} ulehl s horečkou. Dvorní lékař krouží nad lůžkem s pijavicemi, opat posílá mnichy a kupec z jihu nabízí lék z dalekých zemí.',
    choices: [
      {
        label: 'Zkusit lék kupce z jihu',
        hintType: 'resource', hintKey: 'gold',
        isRoll: true, baseChance: 0.6,
        onSuccess: { effects: { gold: -12, stability: 2 }, chronicle: 'Hořký lék z jihu zabral. Za tři dny vládce opět seděl na trůně.' },
        onFailure: { effects: { gold: -12, stability: -5, legitimacy: -3 }, chronicle: 'Lék byl jen obarvená voda. Vládce se z horečky dostával celý měsíc a dvůr už šeptal o nástupci.' },
      },
      {
        label: 'Svěřit se modlitbám mnichů',
        hintType: 'resource', hintKey: 'faith',
        isRoll: true, baseChance: 0.4, resourceKey: 'faith', resourceScale: 0.6,
        onSuccess: { effects: { faith: 6, legitimacy: 3 }, chronicle: 'Po třech nocích modliteb horečka ustoupila. Lid mluví o Boží přízni.' },
        onFailure: { effects: { stability: -6, faith: -3 }, chronicle: 'Modlitby nepomohly a vládce se léčil dlouho. Leckdo se začal ptát, zda nad rodem ještě drží Bůh ruku.' },
      },
      {
        label: 'Odpočívat a nic neuspěchat',
        hintType: 'trait', hintKey: 'patience',
        effects: { stability: -3, gold: -3 },
        traitGain: 'patience',
        chronicle: 'Vládce proležel dva týdny v tichu a v temnu. Země se zatím točila bez něj — a to se nelíbilo nikomu.',
      },
    ],
  },

  {
    id: 'dvorni_blazen',
    title: 'Dvorní šašek',
    text: 'Dvorní šašek při hostině zesměšnil hraběte z Brodné tak, že se smála celá síň. Hrabě rudý vzteky žádá, aby byl šašek potrestán.',
    choices: [
      {
        label: 'Šaška zachránit, smích na dvoře je třeba',
        hintType: 'resource', hintKey: 'stability',
        effects: { stability: 2, prestige: -2 },
        provinceEffects: { brodna: { loyalty: -5 } },
        chronicle: 'Šašek zůstal a hrabě odjel uražen. Dvůr se ještě týden smál jeho rudé tváři.',
      },
      {
        label: 'Vyhnat šaška ode dvora',
        hintType: 'resource', hintKey: 'prestige',
        effects: { prestige: 2, stability: -1 },
        provinceEffects: { brodna: { loyalty: 4 } },
        chronicle: 'Šašek byl vyhnán. Hrabě je spokojen a na hostinách je teď nápadně ticho.',
      },
      {
        label: 'Ať se šašek hraběti omluví veršem',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.5, traitKey: 'eloquence', traitScale: 0.04,
        onSuccess: { effects: { prestige: 4, stability: 2 }, traitGain: 'eloquence', chronicle: 'Šaškova omluva byla tak vtipná a lichotivá, že se nakonec smál i hrabě.' },
        onFailure: { effects: { prestige: -3 }, provinceEffects: { brodna: { loyalty: -6 } }, chronicle: 'Omluva vyzněla jako další posměch. Hrabě odjel a od té doby nepíše.' },
      },
    ],
  },

  {
    id: 'spor_radcu',
    title: 'Spor rádců',
    text: '{chancellor.Title} {chancellor.name} a {marshal.title} {marshal.name} se před celou radou hádají. Jeden chce šetřit pokladnu, druhý žádá peníze na nové vojsko.',
    choices: [
      {
        label: 'Dát za pravdu kancléřství',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 10, army: -3 },
        courtEffects: { chancellor: { loyalty: 10 }, marshal: { loyalty: -12 } },
        chronicle: 'Pokladna zůstala zavřená. Kancléřství jásá, na cvičišti se mračí.',
      },
      {
        label: 'Dát za pravdu maršálovi',
        hintType: 'resource', hintKey: 'army',
        effects: { gold: -12, army: 7 },
        courtEffects: { marshal: { loyalty: 10 }, chancellor: { loyalty: -12 } },
        chronicle: 'Vojsko dostalo nové meče a koně. Kancléřství přepočítává, kolik to stálo.',
      },
      {
        label: 'Najít kompromis a usmířit je',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.45, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { gold: -4, army: 3, stability: 2 }, courtEffects: { chancellor: { loyalty: 5 }, marshal: { loyalty: 5 } }, traitGain: 'eloquence', chronicle: 'Vládce našel řešení, se kterým mohli odejít oba se vztyčenou hlavou.' },
        onFailure: { effects: { stability: -3 }, courtEffects: { chancellor: { loyalty: -6 }, marshal: { loyalty: -6 } }, chronicle: 'Kompromis nepotěšil nikoho. Oba rádci teď spolu nemluví.' },
      },
    ],
  },

  {
    id: 'dedic_v_dluzich',
    cooldown: 24,
    requires: (state) => state.heir.alive && state.heir.age >= 15,
    title: 'Dluhy dědice',
    text: 'Dědic {heir.name} prohrál v kostkách s kupci z přístavu víc, než by měl. Věřitelé stojí u brány a dvůr čeká, jak vládce zachrání čest rodu.',
    choices: [
      {
        label: 'Dluh tiše zaplatit',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -18 },
        courtEffects: { heir: { loyalty: 6 } },
        chronicle: 'Dluh byl zaplacen a věřitelé umlčeni. Dědic slíbil, že už nikdy — jako vždycky.',
      },
      {
        label: 'Ať dědic dluh odpracuje u kancléře',
        hintType: 'trait', hintKey: 'patience',
        effects: { gold: -6, legitimacy: 2 },
        courtEffects: { heir: { loyalty: -5 }, chancellor: { loyalty: 4 } },
        chronicle: 'Dědic půl roku přepisoval účty v kancléřství. Kostky od té doby obchází obloukem.',
      },
      {
        label: 'Věřitele vyhnat — koruna nikomu nedluží',
        hintType: 'trait', hintKey: 'strength',
        effects: { prestige: -3, gold: 0 },
        provinceEffects: { 'pobrezni-mark': { loyalty: -8, wealth: -4 } },
        chronicle: 'Kupci byli vyhnáni od brány. V přístavu se teď říká, že slovo koruny nemá cenu.',
      },
    ],
  },

  {
    id: 'krest_ditete',
    scenarios: ['panovnik', 'slechtic'],
    weight: 4,
    cooldown: 4,
    // only after a real birth (family.js sets state.newborn)
    requires: (state) => state.newborn && state.turn - state.newborn.turn < 4,
    title: 'Narození dítěte',
    text: 'Rodu {dynastyName} se narodil{N:|a} {newborn.word} {newborn.name}. Celý dům je vzhůru, kněží chystají křest a sousedé posílají dary. Jak oslavit nový přírůstek?',
    choices: [
      {
        label: 'Velká slavnost pro všechny poddané',
        hintType: 'resource', hintKey: 'prestige',
        effects: { gold: -15, prestige: 6, legitimacy: 4, stability: 2 },
        courtEffects: { spouse: { loyalty: 6 } },
        chronicle: 'Slavilo se tři dny. Rod {dynastyName} je silnější o další krev a {newborn.name} o první dary.',
      },
      {
        label: 'Skromný křest v kapli',
        hintType: 'resource', hintKey: 'faith',
        effects: { faith: 4, legitimacy: 2 },
        chronicle: '{newborn.name} {N:byl pokřtěn|byla pokřtěna} v tichosti kaple. Kněz chválil skromnost rodu.',
      },
    ],
  },

  {
    id: 'portret_vladce',
    cooldown: 30,
    title: 'Malíř u dvora',
    text: 'Do hradu přijel slavný malíř z ciziny. Nabízí, že vládce zvěční na portrétu, který bude viset v síni ještě sto let po jeho smrti.',
    choices: [
      {
        label: 'Okázalý portrét v hermelínu a zlatě',
        hintType: 'resource', hintKey: 'prestige',
        effects: { gold: -12, prestige: 6 },
        chronicle: 'Portrét je okázalý a vládce na něm vypadá o hlavu vyšší. Hosté u něj stojí s úctou.',
      },
      {
        label: 'Prostý portrét, jak vládce opravdu vypadá',
        hintType: 'trait', hintKey: 'patience',
        effects: { gold: -5, legitimacy: 2 },
        traitGain: 'patience',
        chronicle: 'Malíř namaloval vládce bez příkras. Kdo se na obraz dívá, vidí unaveného člověka, který nese těžkou korunu.',
      },
      {
        label: 'Poslat malíře pryč',
        hintType: 'resource', hintKey: 'gold',
        effects: { prestige: -1 },
        chronicle: 'Malíř odjel k sousednímu dvoru, kde jeho štětec ocenili lépe.',
      },
    ],
  },

  {
    id: 'zrada_spehmistra',
    weight: 2,
    cooldown: 16,
    target: (state) => (state.spymaster.alive !== false && state.spymaster.loyalty <= 40 ? 'spymaster' : null),
    title: 'Dvojí hra',
    text: 'Zachycený dopis ukazuje, že {target.name}, {target.your} {target.role}, prodává tajemství koruny markrabímu. Nikdo jiný o dopisu zatím neví.',
    choices: [
      {
        label: 'Postavit zrádce před soud',
        hintType: 'trait', hintKey: 'strength',
        effects: { stability: 2, prestige: 3 },
        replaceCourt: { loyalty: 65, minAge: 30, maxAge: 48 },
        chronicle: 'Zrádce skončil v žaláři a na jeho místo usedl nový muž stínů.',
      },
      {
        label: 'Využít ho a krmit Marky lží',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.4, traitKey: 'intelligence', traitScale: 0.06,
        onSuccess: { effects: { prestige: 5, army: 3 }, provinceEffects: { 'sokoli-hvozd': { unrest: -8 } }, courtEffects: { target: { loyalty: 15 } }, traitGain: 'intelligence', chronicle: 'Markrabí měsíce jednal podle falešných zpráv. Zrádce, přistižený a omilostněný, teď slouží koruně dvojnásob horlivě.' },
        onFailure: { effects: { stability: -5, legitimacy: -4 }, courtEffects: { target: { loyalty: -10 } }, chronicle: 'Zrádce hru prohlédl a utekl do Marek i s polovinou tajemství koruny.' },
      },
    ],
  },

  {
    id: 'prosba_ucitele',
    title: 'Prosba starého učitele',
    text: 'Starý učitel, který vládce kdysi učil číst, klečí v síni. Jeho syn byl chycen při krádeži v královské zbrojnici a čeká ho šibenice.',
    choices: [
      {
        label: 'Udělit milost',
        hintType: 'trait', hintKey: 'patience',
        effects: { legitimacy: -3, faith: 3 },
        chronicle: 'Vládce syna omilostnil. Starý učitel plakal a šlechta si šeptala o slabosti.',
      },
      {
        label: 'Zákon platí pro všechny',
        hintType: 'resource', hintKey: 'legitimacy',
        effects: { legitimacy: 4, stability: 1, prestige: -1 },
        chronicle: 'Syn byl oběšen. Učitel odešel ode dvora a už se nikdy nevrátil.',
      },
      {
        label: 'Ať syn slouží v posádce na hranici',
        hintType: 'resource', hintKey: 'army',
        effects: { army: 1, legitimacy: 1 },
        chronicle: 'Zloděj dostal kopí místo provazu a odjel na hranici. Možná z něj ještě něco bude.',
      },
    ],
  },

  {
    id: 'hostina_slechty',
    seasons: [1, 2],
    cooldown: 12,
    title: 'Žádost o hostinu',
    text: 'Šlechtici se stěžují, že dvůr je smutný jako klášter. Žádají velkou hostinu, jakými byl dvůr předků proslulý.',
    choices: [
      {
        label: 'Uspořádat hostinu, na jakou se nezapomíná',
        hintType: 'resource', hintKey: 'prestige',
        effects: { gold: -15, food: -6, prestige: 7, stability: 2 },
        chronicle: 'Hostina trvala do rána. Pečení jeleni, víno z jihu a tanečnice — šlechta bude mluvit o vládcově štědrosti celý rok.',
      },
      {
        label: 'Skromná večeře v úzkém kruhu',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -4, prestige: 1 },
        chronicle: 'Večeře byla skromná, rozhovory upřímné. Ne každý ale přijel.',
      },
      {
        label: 'Připomenout šlechtě, že doba je vážná',
        hintType: 'trait', hintKey: 'strength',
        effects: { prestige: -3, legitimacy: 1 },
        chronicle: 'Vládce šlechtu odbyl. Doba je vážná, a šlechta teď taky.',
      },
    ],
  },

  // ===================== NOBILITY AND VASSALS =====================

  {
    id: 'vazal_odmita_vojaky',
    cooldown: 14,
    title: 'Vazal odmítá vojáky',
    text: 'Pán z Orlí Stráže měl podle přísahy poslat dvacet jezdců. Místo nich přišel dopis plný výmluv — a pod ním pečeť, která ani nebyla otištěna pořádně.',
    choices: [
      {
        label: 'Přinutit ho silou',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.45, resourceKey: 'army', resourceScale: 0.5,
        onSuccess: { effects: { army: 4, prestige: 6, legitimacy: 3 }, chronicle: 'Před branami Orlí Stráže stálo královské vojsko. Jezdci dorazili do týdne — dvakrát tolik, než bylo slíbeno.' },
        onFailure: { effects: { army: -6, prestige: -6 }, chronicle: 'Vazal zavřel brány a vysmál se z hradeb. Vojsko táhlo domů s nepořízenou.' },
      },
      {
        label: 'Přijmout místo vojáků zlato',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 15, prestige: -3 },
        chronicle: 'Vazal ochotně zaplatil, aby si nechal své muže doma. Koruna je bohatší a slabší zároveň.',
      },
      {
        label: 'Napsat mu dopis, jaký si zaslouží',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.45, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { army: 4, legitimacy: 2 }, traitGain: 'eloquence', chronicle: 'Vládcův dopis byl tak ostrý a zároveň tak zdvořilý, že vazal poslal jezdce i s omluvou.' },
        onFailure: { effects: { prestige: -2 }, chronicle: 'Vazal dopis ani neotevřel.' },
      },
    ],
  },

  {
    id: 'spor_o_panstvi',
    title: 'Spor o dědictví',
    text: 'Zemřel pán z Pobřežní marky a o jeho panství se přou dva bratranci. Starší má právo, mladší má schopnosti — a za oběma stojí půl provincie.',
    choices: [
      {
        label: 'Rozhodnout pro staršího, podle práva',
        hintType: 'resource', hintKey: 'legitimacy',
        effects: { legitimacy: 4 },
        provinceEffects: { 'pobrezni-mark': { loyalty: 3, wealth: -4 } },
        chronicle: 'Panství dostal starší bratranec. Právo bylo dodrženo, správa panství už méně.',
      },
      {
        label: 'Rozhodnout pro schopnějšího',
        hintType: 'trait', hintKey: 'intelligence',
        effects: { legitimacy: -3 },
        provinceEffects: { 'pobrezni-mark': { wealth: 8, loyalty: -3 } },
        traitGain: 'intelligence',
        chronicle: 'Panství dostal mladší a schopnější. Panství vzkvétá, ale staré rody vrtí hlavou.',
      },
      {
        label: 'Rozdělit panství mezi oba',
        hintType: 'trait', hintKey: 'patience',
        isRoll: true, baseChance: 0.5, traitKey: 'patience', traitScale: 0.04,
        onSuccess: { effects: { stability: 3 }, provinceEffects: { 'pobrezni-mark': { loyalty: 6 } }, chronicle: 'Oba bratranci odešli s polovinou a s pocitem, že vyhráli.' },
        onFailure: { effects: { stability: -4 }, provinceEffects: { 'pobrezni-mark': { unrest: 12 } }, chronicle: 'Rozdělení vyvolalo spory o každou louku. Bratranci po sobě posílají ozbrojence.' },
      },
    ],
  },

  {
    id: 'slechta_odmita_dan',
    minTurn: 4,
    cooldown: 14,
    title: 'Šlechta odmítá daň',
    text: 'Kancléřství vyhlásilo novou daň z panství. Šlechtici se sjeli na hrad a jejich mluvčí prohlásil, že ani jeden groš nezaplatí, dokud se jich koruna nezeptá.',
    choices: [
      {
        label: 'Trvat na dani',
        hintType: 'trait', hintKey: 'strength',
        effects: { gold: 18, stability: -6, legitimacy: -2 },
        chronicle: 'Daň byla vybrána do posledního groše. Šlechtici platili se zaťatými zuby a s dlouhou pamětí.',
      },
      {
        label: 'Daň zrušit',
        hintType: 'resource', hintKey: 'stability',
        effects: { stability: 3, prestige: -4 },
        chronicle: 'Koruna ustoupila. Šlechta slaví vítězství, pokladna ztrátu.',
      },
      {
        label: 'Svolat sněm a vyjednat poloviční daň',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.45, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { gold: 10, legitimacy: 4 }, traitGain: 'eloquence', chronicle: 'Sněm daň po dlouhém jednání schválil. Šlechta platí — a cítí se při tom důležitá.' },
        onFailure: { effects: { stability: -4, prestige: -3 }, chronicle: 'Sněm skončil křikem a odchodem poloviny pánů. Daň nebude.' },
      },
    ],
  },

  {
    id: 'potulny_rytir',
    cooldown: 14,
    title: 'Rytíř bez pána',
    text: 'U brány stojí rytíř v otlučené zbroji. Je to slavný Bořek z Hrádku, vítěz dvanácti turnajů, a hledá pána, kterému by sloužil.',
    choices: [
      {
        label: 'Přijmout ho do služby',
        hintType: 'resource', hintKey: 'army',
        effects: { gold: -10, army: 4, prestige: 4 },
        chronicle: 'Bořek z Hrádku přísahal koruně. Mladí panoši ho následují jako stín.',
      },
      {
        label: 'Poslat ho velet posádce ve hvozdu',
        hintType: 'resource', hintKey: 'army',
        effects: { gold: -8 },
        provinceEffects: { 'sokoli-hvozd': { garrison: 12, unrest: -6 } },
        chronicle: 'Rytíř odjel do Sokolova. Od té doby si lapkové dvakrát rozmyslí, než vyjdou z lesa.',
      },
      {
        label: 'Odmítnout, žoldnéřům se nevěří',
        hintType: 'resource', hintKey: 'gold',
        effects: { prestige: -1 },
        chronicle: 'Rytíř odjel k jinému pánovi. Snad ne k markrabímu.',
      },
    ],
  },

  {
    id: 'souboj_slechticu',
    music: 'battle',
    cooldown: 12,
    title: 'Souboj na život a na smrt',
    text: 'Dva mladí šlechtici se pohádali kvůli dívce a žádají o souboj na život a na smrt. Podle starého práva jim ho vládce může povolit.',
    choices: [
      {
        label: 'Povolit souboj',
        hintType: 'resource', hintKey: 'prestige',
        effects: { prestige: 3, stability: -3 },
        chronicle: 'Souboj se konal za svítání. Jeden šlechtic zemřel, druhý dívku stejně nedostal.',
      },
      {
        label: 'Souboj zakázat',
        hintType: 'resource', hintKey: 'legitimacy',
        effects: { legitimacy: 3, prestige: -2 },
        chronicle: 'Souboj byl zakázán. Oba šlechtici se nesmířili, ale aspoň žijí.',
      },
      {
        label: 'Rozsoudit spor osobně',
        hintType: 'trait', hintKey: 'patience',
        isRoll: true, baseChance: 0.5, traitKey: 'patience', traitScale: 0.04,
        onSuccess: { effects: { legitimacy: 3, stability: 2 }, traitGain: 'patience', chronicle: 'Vládce oba vyslechl a spor rozsoudil tak, že si nakonec podali ruce.' },
        onFailure: { effects: { stability: -3 }, chronicle: 'Rozsudek se nelíbil ani jednomu. Souboj se konal stejně — potají.' },
      },
    ],
  },

  {
    id: 'hrabe_utlacuje',
    cooldown: 14,
    title: 'Krutý hrabě',
    text: 'Sedláci z Brodné prosí o pomoc. Jejich hrabě zdvojnásobil robotu, bere jim dobytek a jednoho z nich dal ubít jen proto, že mu nesmekl.',
    choices: [
      {
        label: 'Hraběte potrestat',
        hintType: 'trait', hintKey: 'strength',
        effects: { legitimacy: 3, stability: -2 },
        provinceEffects: { brodna: { loyalty: 12, unrest: -10 } },
        chronicle: 'Hrabě přišel o polovinu panství. Sedláci z Brodné žehnají vládci, šlechta si šeptá o nebezpečném precedentu.',
      },
      {
        label: 'Věc vyšetřit',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.5, traitKey: 'intelligence', traitScale: 0.05,
        onSuccess: { effects: { legitimacy: 4 }, provinceEffects: { brodna: { loyalty: 8, unrest: -8 } }, traitGain: 'intelligence', chronicle: 'Vyšetřování odhalilo hraběcího správce jako skutečného viníka. Byl potrestán a hrabě se zastyděl.' },
        onFailure: { effects: { legitimacy: -2 }, provinceEffects: { brodna: { unrest: 8 } }, chronicle: 'Vyšetřování se táhlo, svědci se báli a nakonec nebylo nic dokázáno.' },
      },
      {
        label: 'Nevměšovat se do věcí panství',
        hintType: 'resource', hintKey: 'stability',
        effects: { stability: 1 },
        provinceEffects: { brodna: { unrest: 14, loyalty: -10 } },
        chronicle: 'Koruna se nevměšovala. V Brodné se začíná mluvit o tom, že spravedlnost si člověk musí vzít sám.',
      },
    ],
  },

  {
    id: 'zastava_lesa',
    cooldown: 20,
    title: 'Půjčka od kláštera',
    text: 'Opat z kláštera na útesu nabízí koruně štědrou půjčku. Jako zástavu chce královské lesy v Sokolím hvozdu — jen na pár let, říká s úsměvem.',
    choices: [
      {
        label: 'Půjčku přijmout',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 25, faith: 2 },
        provinceEffects: { 'sokoli-hvozd': { wealth: -8, loyalty: -4 } },
        chronicle: 'Pokladna se naplnila a mniši začali kácet královský les. Myslivci ze Sokolova se mračí.',
      },
      {
        label: 'Odmítnout',
        hintType: 'resource', hintKey: 'faith',
        effects: { faith: -2 },
        chronicle: 'Vládce opatovi poděkoval a les si ponechal. Opat se usmívá dál, ale chladněji.',
      },
    ],
  },

  {
    id: 'pretendent',
    music: 'battle',
    minTurn: 16,
    cooldown: 40,
    weight: 0.6,
    title: 'Pretendent',
    text: 'V Pobřežní marce se objevil muž, který tvrdí, že je ztraceným synem předchozího krále a pravým dědicem trůnu. Shromažďuje kolem sebe nespokojence.',
    choices: [
      {
        label: 'Veřejně ho usvědčit ze lži',
        hintType: 'resource', hintKey: 'legitimacy',
        isRoll: true, baseChance: 0.35, traitKey: 'eloquence', traitScale: 0.03, resourceKey: 'legitimacy', resourceScale: 0.6,
        onSuccess: { effects: { legitimacy: 6, prestige: 4 }, chronicle: 'Vládce předvedl svědky a listiny. Pretendent byl vysmán a jeho přívrženci se rozprchli.' },
        onFailure: { effects: { legitimacy: -10, stability: -5 }, provinceEffects: { 'pobrezni-mark': { unrest: 20, loyalty: -12 } }, chronicle: 'Lid uvěřil spíš pretendentovi než listinám. Pobřeží se bouří.' },
      },
      {
        label: 'Poslat vojáky a uvěznit ho',
        hintType: 'resource', hintKey: 'army',
        effects: { army: -3, legitimacy: -3, stability: 2 },
        provinceEffects: { 'pobrezni-mark': { unrest: 8 } },
        chronicle: 'Pretendent skončil v kobce. Mrtvého by ho lid uctíval, takhle aspoň mlčí.',
      },
      {
        label: 'Koupit si ho zlatem a pozemky',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -22 },
        chronicle: 'Pretendent přijal statek daleko od pobřeží a jeho nároky nějak vyprchaly.',
      },
    ],
  },

  // ===================== TOWNS AND PEOPLE =====================

  {
    id: 'stavka_cechu',
    cooldown: 12,
    title: 'Stávka cechů',
    text: 'Cechy v hlavním městě zavřely dílny. Kováři, tkalci i pekaři žádají, aby koruna zakázala cizím řemeslníkům prodávat ve městě.',
    choices: [
      {
        label: 'Vyhovět cechům',
        hintType: 'resource', hintKey: 'stability',
        effects: { stability: 3, gold: -6 },
        provinceEffects: { capital: { loyalty: 8, wealth: -4 } },
        chronicle: 'Cizí řemeslníci museli z města. Cechy jásají, ceny rostou.',
      },
      {
        label: 'Rozehnat stávkující',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.55, resourceKey: 'army', resourceScale: 0.4,
        onSuccess: { effects: { stability: 2, prestige: 2 }, provinceEffects: { capital: { loyalty: -6 } }, chronicle: 'Stráže dílny otevřely silou. Řemeslníci se vrátili k práci a k tichým kletbám.' },
        onFailure: { effects: { stability: -6 }, provinceEffects: { capital: { unrest: 15 } }, chronicle: 'Rozhánění se zvrhlo v pouliční bitku. Ve městě hoří dvě dílny a jedna strážnice.' },
      },
      {
        label: 'Vyjednat nová pravidla trhu',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.5, traitKey: 'intelligence', traitScale: 0.05,
        onSuccess: { effects: { gold: 6, stability: 3 }, provinceEffects: { capital: { wealth: 5 } }, traitGain: 'intelligence', chronicle: 'Nová tržní pravidla potěšila cechy i kupce. Do pokladny přibyl poplatek z každého stánku.' },
        onFailure: { effects: { stability: -2 }, provinceEffects: { capital: { unrest: 6 } }, chronicle: 'Pravidla byla tak složitá, že je nikdo nedodržoval.' },
      },
    ],
  },

  {
    id: 'pozar_mesta',
    cooldown: 16,
    title: 'Požár',
    text: 'V noci vzplála dřevěná čtvrť pod hradem. Plameny skáčou ze střechy na střechu a lidé utíkají s tím, co unesou.',
    choices: [
      {
        label: 'Poslat vojsko hasit',
        hintType: 'resource', hintKey: 'army',
        effects: { army: -3, stability: 3 },
        provinceEffects: { capital: { loyalty: 8, wealth: -4 } },
        chronicle: 'Vojáci tahali vodu až do rána. Čtvrť vyhořela jen napůl a lid viděl, že koruna pomohla.',
      },
      {
        label: 'Postavit čtvrť znovu z kamene',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -20, prestige: 3 },
        provinceEffects: { capital: { wealth: 6, loyalty: 6, unrest: -6 } },
        chronicle: 'Na spáleništi vyrostly kamenné domy. Příští požár už tak snadno nevzplane.',
      },
      {
        label: 'Ať se měšťané postarají sami',
        hintType: 'resource', hintKey: 'gold',
        effects: { stability: -4 },
        provinceEffects: { capital: { wealth: -10, unrest: 10 } },
        chronicle: 'Čtvrť lehla popelem. Lidé přespávají v kostelech a na koruně nenechají nit suchou.',
      },
    ],
  },

  {
    id: 'carodejnice',
    cooldown: 14,
    title: 'Čarodějnice',
    text: 'Vesničané z Brodné přivlekli k hradu starou bylinkářku. Obviňují ji, že očarovala dobytek a poslala na vesnici mor. Kněz žádá církevní soud.',
    choices: [
      {
        label: 'Vydat ji církevnímu soudu',
        hintType: 'resource', hintKey: 'faith',
        effects: { faith: 5, legitimacy: -2 },
        provinceEffects: { brodna: { unrest: -4 } },
        chronicle: 'Bylinkářka byla odsouzena a upálena. Vesničané se uklidnili. Dobytek umírá dál.',
      },
      {
        label: 'Propustit ji',
        hintType: 'resource', hintKey: 'legitimacy',
        effects: { faith: -5, legitimacy: 2 },
        provinceEffects: { brodna: { unrest: 6 } },
        chronicle: 'Bylinkářka byla propuštěna. Kněz kázal o vládci, který chrání ďáblovy služebníky.',
      },
      {
        label: 'Vyšetřit, co se dobytku doopravdy stalo',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.5, traitKey: 'intelligence', traitScale: 0.05,
        onSuccess: { effects: { legitimacy: 4, food: 4 }, traitGain: 'intelligence', chronicle: 'Ukázalo se, že dobytek pil z otrávené studny. Bylinkářka pomohla ostatní zvířata vyléčit.' },
        onFailure: { effects: { faith: -3 }, provinceEffects: { brodna: { unrest: 8 } }, chronicle: 'Vyšetřování nic nenašlo a lid si udělal vlastní soud.' },
      },
    ],
  },

  {
    id: 'poutnik_zazrak',
    cooldown: 20,
    title: 'Zázrak u kláštera',
    text: 'Poutník tvrdí, že u kláštera na útesu viděl plačící sochu svatého. Ke klášteru proudí davy poutníků a opat žádá o povolení stavět poutní kostel.',
    choices: [
      {
        label: 'Podpořit pouť',
        hintType: 'resource', hintKey: 'faith',
        effects: { faith: 6, gold: 6 },
        provinceEffects: { 'pobrezni-mark': { wealth: 6 } },
        chronicle: 'Pouť se rozrostla. Poutníci nesou peníze, kupci zboží a přístav bohatne.',
      },
      {
        label: 'Nechat zázrak prověřit',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.5, traitKey: 'intelligence', traitScale: 0.04,
        onSuccess: { effects: { legitimacy: 3, faith: -2 }, traitGain: 'intelligence', chronicle: 'Socha „plakala“ díky prasklině ve střeše. Opat zrudl, rozumnější lid se zasmál.' },
        onFailure: { effects: { faith: -5 }, chronicle: 'Prověřování urazilo opata i poutníky. O vládci se říká, že nevěří ani zázrakům.' },
      },
      {
        label: 'Pouť zakázat',
        hintType: 'resource', hintKey: 'stability',
        effects: { faith: -6, stability: 2 },
        chronicle: 'Pouť byla zakázána. Poutníci chodí dál, jen potají a s větší horlivostí.',
      },
    ],
  },

  {
    id: 'zebravy_prorok',
    cooldown: 16,
    title: 'Žebravý prorok',
    text: 'Na náměstí káže žebravý prorok. Hlásá, že rod {dynastyName} vymře do sedmé zimy a že koruna je prokletá. Davy kolem něj rostou.',
    choices: [
      {
        label: 'Nechat ho kázat',
        hintType: 'trait', hintKey: 'patience',
        effects: { legitimacy: -3 },
        traitGain: 'patience',
        chronicle: 'Prorok kázal do zimy, pak nastydl a zemřel. Proroctví se lid zatím nebojí.',
      },
      {
        label: 'Uvěznit ho',
        hintType: 'trait', hintKey: 'strength',
        effects: { stability: 2, faith: -2 },
        chronicle: 'Prorok skončil v kobce. Z věznice prý káže dál, krysám.',
      },
      {
        label: 'Pozvat ho ke dvoru a promluvit si s ním',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.45, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { legitimacy: 5, faith: 3 }, traitGain: 'eloquence', chronicle: 'Po rozhovoru s vládcem prorok své proroctví „přehodnotil“. Teď káže o rodu, který přežije věky.' },
        onFailure: { effects: { legitimacy: -5 }, chronicle: 'Prorok vládci řekl do očí, co si myslí. Celý dvůr to slyšel.' },
      },
    ],
  },

  {
    id: 'trh_v_brode',
    seasons: [2],
    cooldown: 8,
    title: 'Velký trh v Brodě',
    text: 'Na podzimní trh v Brodě se sjeli kupci z celé země. Kancléřství se ptá, jaké clo letos vybírat.',
    choices: [
      {
        label: 'Snížit clo, ať trh roste',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -4 },
        provinceEffects: { brodna: { wealth: 8, loyalty: 4 } },
        chronicle: 'S nízkým clem přijelo kupců jako nikdy. Brod bohatne, pokladna si počká.',
      },
      {
        label: 'Zvýšit clo',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 14 },
        provinceEffects: { brodna: { wealth: -5, loyalty: -5 } },
        chronicle: 'Vysoké clo naplnilo pokladnu. Příští rok ale přijede kupců méně.',
      },
      {
        label: 'Ponechat clo jako vždy',
        hintType: 'resource', hintKey: 'stability',
        effects: { gold: 6 },
        chronicle: 'Trh proběhl jako každý rok. Nikdo si nestěžoval, nikdo nejásal.',
      },
    ],
  },

  {
    id: 'most_pres_brodnici',
    cooldown: 40,
    title: 'Most přes Brodnici',
    text: 'Stavitelé navrhují postavit přes Brodnici kamenný most. Spojil by Brodnou s hlavním městem v každém ročním období — ale stál by majlant.',
    choices: [
      {
        label: 'Postavit kamenný most',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -25, prestige: 5 },
        provinceEffects: { brodna: { wealth: 10 }, capital: { wealth: 5 } },
        chronicle: 'Kamenný most nese vládcovo jméno. Vozy s obilím teď jezdí i za povodní.',
      },
      {
        label: 'Postavit levnější dřevěný most',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -8 },
        provinceEffects: { brodna: { wealth: 4 } },
        chronicle: 'Dřevěný most slouží. Do první velké vody.',
      },
      {
        label: 'Most nestavět',
        hintType: 'resource', hintKey: 'gold',
        effects: {},
        chronicle: 'Most zůstal na pergamenu. Brodnice se dál brodí jako za předků.',
      },
    ],
  },

  {
    id: 'uprchlici',
    cooldown: 18,
    title: 'Uprchlíci z Marek',
    text: 'Na hranici stojí stovky uprchlíků z Marek, kde zuří hladomor a válka. Ženy, děti, starci — a mezi nimi možná i markrabího zvědové.',
    choices: [
      {
        label: 'Přijmout je',
        hintType: 'resource', hintKey: 'faith',
        effects: { food: -10, faith: 4 },
        provinceEffects: { 'sokoli-hvozd': { wealth: 6, unrest: 4 } },
        chronicle: 'Uprchlíci se usadili na mýtinách hvozdu. Jedni pracují, druzí kradou, jak už to bývá.',
      },
      {
        label: 'Přijmout jen ty, kdo budou pracovat',
        hintType: 'trait', hintKey: 'intelligence',
        effects: { food: -4, gold: 4 },
        provinceEffects: { 'sokoli-hvozd': { wealth: 4 } },
        chronicle: 'Do království vešli jen kováři, tesaři a sedláci. Ostatní se vrátili do hladu.',
      },
      {
        label: 'Zavřít hranici',
        hintType: 'resource', hintKey: 'army',
        effects: { faith: -5, stability: 2 },
        chronicle: 'Hranice zůstala zavřená. Kněží kážou o milosrdenství, které koruna neznala.',
      },
    ],
  },

  {
    id: 'lichvar',
    cooldown: 30,
    requires: (state) => !state.flags.loan_taken,
    title: 'Lichvář',
    text: 'Bohatý lichvář z přístavu nabízí koruně půjčku. Peníze hned, splatit do tří let — s úrokem, o kterém se nemluví nahlas.',
    choices: [
      {
        label: 'Půjčku přijmout',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 30 },
        hiddenEffects: { setFlag: 'loan_taken' },
        chronicle: 'Pokladna se naplnila. Lichvář si zapsal den a hodinu.',
      },
      {
        label: 'Odmítnout',
        hintType: 'resource', hintKey: 'gold',
        effects: {},
        chronicle: 'Vládce lichvářovo zlato odmítl. Co se nepůjčí, nemusí se splácet.',
      },
    ],
  },

  {
    id: 'lichvar_splatka',
    weight: 3,
    cooldown: 12,
    minTurn: 10,
    requires: (state) => state.flags.loan_taken && (state.eventHistory || {}).lichvar !== undefined && state.turn - state.eventHistory.lichvar >= 10,
    title: 'Den splátky',
    text: 'Lichvář je zpátky. S úsměvem předkládá dlužní úpis — a částku, která je téměř dvojnásobkem půjčky.',
    choices: [
      {
        label: 'Splatit celý dluh',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -40, legitimacy: 2 },
        hiddenEffects: { clearFlag: 'loan_taken' },
        chronicle: 'Dluh byl splacen do posledního groše. Pokladna zeje prázdnotou, ale čest koruny je čistá.',
      },
      {
        label: 'Vyjednat odklad a nižší úrok',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.45, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { gold: -22 }, hiddenEffects: { clearFlag: 'loan_taken' }, traitGain: 'eloquence', chronicle: 'Lichvář se nakonec spokojil s rozumnou částkou. Prý z úcty ke koruně.' },
        onFailure: { effects: { gold: -45, prestige: -3 }, hiddenEffects: { clearFlag: 'loan_taken' }, chronicle: 'Vyjednávání lichváře rozzlobilo. Připočítal si poplatek za ztracený čas.' },
      },
      {
        label: 'Lichváře vyhnat ze země',
        hintType: 'trait', hintKey: 'strength',
        effects: { prestige: -5, legitimacy: -4 },
        hiddenEffects: { clearFlag: 'loan_taken' },
        provinceEffects: { 'pobrezni-mark': { wealth: -8, loyalty: -6 } },
        chronicle: 'Lichvář byl vyhnán i s úpisem. Žádný kupec už koruně nepůjčí ani groš.',
      },
    ],
  },

  // ===================== FAITH =====================

  {
    id: 'katedrala',
    cooldown: 40,
    title: 'Katedrála',
    text: 'Biskup předkládá plány katedrály, jaká v celé zemi nemá obdoby. Stavba by trvala desítky let — a nesla by vládcovo jméno navěky.',
    choices: [
      {
        label: 'Financovat stavbu',
        hintType: 'resource', hintKey: 'faith',
        effects: { gold: -30, faith: 10, prestige: 6, legitimacy: 3 },
        chronicle: 'Byl položen základní kámen katedrály. Kameníci z celé země se sjíždějí do hlavního města.',
      },
      {
        label: 'Přispět jen na základy',
        hintType: 'resource', hintKey: 'faith',
        effects: { gold: -10, faith: 4 },
        chronicle: 'Koruna zaplatila základy. Zbytek ať zaplatí Bůh a zbožní měšťané.',
      },
      {
        label: 'Odmítnout',
        hintType: 'resource', hintKey: 'gold',
        effects: { faith: -5 },
        chronicle: 'Plány katedrály skončily v biskupově truhle. Na kazatelnách je o něco chladněji.',
      },
    ],
  },

  {
    id: 'kacirska_sekta',
    cooldown: 20,
    title: 'Sekta v horách',
    text: 'Mezi horníky Železného Hřebene se šíří nová víra. Kazatelé hlásají, že kněží jsou zkažení a že Bůh mluví ke každému sám. Biskup žádá zásah.',
    choices: [
      {
        label: 'Sektu vymýtit ohněm',
        hintType: 'resource', hintKey: 'faith',
        effects: { faith: 6, stability: -3 },
        provinceEffects: { 'zelezny-hreben': { unrest: 18, loyalty: -12 } },
        chronicle: 'Hranice hořely v horských vesnicích. Biskup je spokojen, horníci mlčí — zatím.',
      },
      {
        label: 'Sektu tolerovat',
        hintType: 'trait', hintKey: 'patience',
        effects: { faith: -7 },
        provinceEffects: { 'zelezny-hreben': { loyalty: 8 } },
        chronicle: 'Koruna nechala horníky věřit po svém. Biskup zuří, v horách je klid.',
      },
      {
        label: 'Poslat do hor výmluvné kazatele',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.45, traitKey: 'eloquence', traitScale: 0.04,
        onSuccess: { effects: { faith: 5 }, provinceEffects: { 'zelezny-hreben': { unrest: -5 } }, chronicle: 'Kazatelé horníky přesvědčili slovem tam, kde by oheň jen rozdmýchal vzdor.' },
        onFailure: { effects: { faith: -3 }, provinceEffects: { 'zelezny-hreben': { unrest: 8 } }, chronicle: 'Horníci kazatele vyhnali kamením. Sekta sílí.' },
      },
    ],
  },

  {
    id: 'relikvie',
    cooldown: 24,
    title: 'Relikvie',
    text: 'Kupec z jihu nabízí koruně relikvii: kost prstu svatého Václava v zlaté schránce. Cena je vysoká, ale biskup by ji vystavil v hlavním chrámu.',
    choices: [
      {
        label: 'Relikvii koupit',
        hintType: 'resource', hintKey: 'faith',
        effects: { gold: -18, faith: 8, prestige: 3 },
        chronicle: 'Relikvie byla slavnostně uložena v chrámu. Poutníci přicházejí, aby se dotkli schránky.',
      },
      {
        label: 'Nechat pravost prověřit',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.5, traitKey: 'intelligence', traitScale: 0.05,
        onSuccess: { effects: { prestige: 3, legitimacy: 2 }, traitGain: 'intelligence', chronicle: 'Kost se ukázala být kozí. Kupec skončil v pranýři a vládce u lidu jako ten, koho nikdo neoklame.' },
        onFailure: { effects: { gold: -18, faith: 4 }, chronicle: 'Učenci pravost potvrdili. Kupec si za ověření řekl ještě něco navíc.' },
      },
      {
        label: 'Odmítnout',
        hintType: 'resource', hintKey: 'gold',
        effects: { faith: -1 },
        chronicle: 'Kupec odjel s relikvií k jinému dvoru, kde nebyli tak podezíraví.',
      },
    ],
  },

  {
    id: 'opat_v_rade',
    cooldown: 30,
    title: 'Opat žádá místo v radě',
    text: 'Opat z kláštera na útesu žádá místo v královské radě. Prý aby koruna nezapomínala na Boha. {chancellor.Title} {chancellor.name} se tváří, jako by spolkl citron.',
    choices: [
      {
        label: 'Přijmout opata do rady',
        hintType: 'resource', hintKey: 'faith',
        effects: { faith: 6, legitimacy: 2 },
        courtEffects: { chancellor: { loyalty: -10 } },
        chronicle: 'Opat zasedl v radě. Porady jsou delší, modlitby častější.',
      },
      {
        label: 'Odmítnout',
        hintType: 'resource', hintKey: 'faith',
        effects: { faith: -4 },
        courtEffects: { chancellor: { loyalty: 6 } },
        chronicle: 'Vládce opatovi poděkoval za nabídku. Kancléřství si oddychlo.',
      },
    ],
  },

  {
    id: 'zatmeni',
    cooldown: 40,
    title: 'Zatmění slunce',
    text: 'Za bílého dne zmizelo slunce. Lid v panice běží do kostelů, ptáci zmlkli a prorokové křičí, že nebesa soudí krále.',
    choices: [
      {
        label: 'Vyjít mezi lid a promluvit',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.5, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { legitimacy: 6, prestige: 4 }, traitGain: 'eloquence', chronicle: 'Když vládce domluvil, slunce se vrátilo. Lid to bude vyprávět jako zázrak.' },
        onFailure: { effects: { legitimacy: -4 }, chronicle: 'Vládcova slova zanikla v křiku davu. Slunce se vrátilo samo.' },
      },
      {
        label: 'Nařídit mše ve všech kostelech',
        hintType: 'resource', hintKey: 'faith',
        effects: { faith: 6, gold: -4 },
        chronicle: 'Zvony zněly po celé zemi. Když se slunce vrátilo, kněží měli plné kostely.',
      },
      {
        label: 'Ať dvorní hvězdář lidu vysvětlí, co se děje',
        hintType: 'trait', hintKey: 'intelligence',
        effects: { faith: -3, legitimacy: 2 },
        traitGain: 'intelligence',
        chronicle: 'Hvězdář kreslil na náměstí kruhy a koule. Polovina lidu nerozuměla, druhá polovina se přestala bát.',
      },
    ],
  },

  // ===================== WAR AND BORDERS =====================

  {
    id: 'zajaty_syn_markrabiho',
    minTurn: 8,
    cooldown: 40,
    title: 'Vzácný zajatec',
    text: 'Hraniční hlídka zajala mladého muže, který se ukázal být synem markrabího. Teď sedí v hradní věži a celá země čeká, co s ním koruna udělá.',
    choices: [
      {
        label: 'Žádat vysoké výkupné',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 30 },
        provinceEffects: { 'sokoli-hvozd': { unrest: 6 } },
        chronicle: 'Markrabí zaplatil do posledního groše. A nikdy to neodpustí.',
      },
      {
        label: 'Propustit ho bez výkupného',
        hintType: 'resource', hintKey: 'legitimacy',
        effects: { legitimacy: 4, prestige: 3 },
        provinceEffects: { 'sokoli-hvozd': { unrest: -10 } },
        hiddenEffects: { setFlag: 'march_alliance' },
        chronicle: 'Markrabího syn odjel domů s darem. V Marcích se o vládci mluví s úctou.',
      },
      {
        label: 'Držet ho jako rukojmí',
        hintType: 'trait', hintKey: 'patience',
        effects: { prestige: 4 },
        provinceEffects: { 'sokoli-hvozd': { unrest: -6 } },
        chronicle: 'Dokud je markrabího syn ve věži, nájezdy z Marek ustaly. Markrabí ale počítá dny.',
      },
    ],
  },

  {
    id: 'pirati',
    music: 'battle',
    cooldown: 12,
    title: 'Piráti u pobřeží',
    text: 'U Šedého moře se objevily pirátské lodě. Přepadly dvě kupecké koráby a vyplenily rybářskou vesnici u kláštera.',
    choices: [
      {
        label: 'Vyzbrojit lodě a vyplout proti nim',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.45, traitKey: 'strength', traitScale: 0.03, resourceKey: 'army', resourceScale: 0.4,
        onSuccess: { effects: { gold: 8, prestige: 6, army: -3 }, provinceEffects: { 'pobrezni-mark': { loyalty: 8, unrest: -8 } }, chronicle: 'Pirátské lodě hoří na mělčinách. Kořist putovala do královské pokladny.' },
        onFailure: { effects: { army: -8, gold: -10 }, provinceEffects: { 'pobrezni-mark': { unrest: 10 } }, chronicle: 'Piráti byli rychlejší a lepší. Dvě královské lodě leží na dně Šedého moře.' },
      },
      {
        label: 'Opevnit přístav',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -15 },
        provinceEffects: { 'pobrezni-mark': { garrison: 15, unrest: -4 } },
        chronicle: 'Na útesech vyrostly strážní věže a do přístavu se dá vjet jen mezi řetězy.',
      },
      {
        label: 'Zaplatit pirátům, ať táhnou jinam',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -12, prestige: -5 },
        chronicle: 'Piráti vzali zlato a odpluli. Možná se vrátí pro další.',
      },
    ],
  },

  {
    id: 'dezerteri',
    music: 'battle',
    cooldown: 12,
    title: 'Dezertéři',
    text: 'Skupina vojáků utekla z posádky na hranici a teď plení vesnice v Brodné. Prý jim nikdo nezaplatil žold.',
    choices: [
      {
        label: 'Pochytat je a pověsit',
        hintType: 'trait', hintKey: 'strength',
        effects: { army: -2, stability: 3, prestige: 2 },
        provinceEffects: { brodna: { unrest: -6 } },
        chronicle: 'Dezertéři viseli na stromech podél cesty. Ostatní vojáci pochopili.',
      },
      {
        label: 'Omilostnit je a vyplatit dlužný žold',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -10, army: 4 },
        courtEffects: { marshal: { loyalty: -5 } },
        chronicle: 'Dezertéři se vrátili do služby s plnými měšci. Maršál nesouhlasí, ale mlčí.',
      },
      {
        label: 'Najmout je jako stráž karavan',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.5, traitKey: 'intelligence', traitScale: 0.04,
        onSuccess: { effects: { gold: 6 }, provinceEffects: { 'sokoli-hvozd': { unrest: -5 } }, traitGain: 'intelligence', chronicle: 'Z dezertérů jsou teď nejlepší strážci karavan v zemi. Znají všechny triky lapků.' },
        onFailure: { effects: { gold: -6 }, provinceEffects: { brodna: { unrest: 8 } }, chronicle: 'Dezertéři vzali zálohu a s první karavanou zmizeli.' },
      },
    ],
  },

  {
    id: 'zvedove_v_horach',
    cooldown: 14,
    title: 'Hlášení zvědů',
    text: 'Zvědové hlásí, že za průsmykem v Železném Hřebeni táboří cizí vojsko. Nevědí čí, nevědí kolik — jen že dýmu z ohňů je víc, než by měli pastýři.',
    choices: [
      {
        label: 'Posílit posádky v horách',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -10 },
        provinceEffects: { 'zelezny-hreben': { garrison: 15 } },
        chronicle: 'Do průsmyků odtáhly nové posádky. Ať už je za horami kdokoli, cestu najde zavřenou.',
      },
      {
        label: 'Udeřit dřív než oni',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.45, traitKey: 'strength', traitScale: 0.03, resourceKey: 'army', resourceScale: 0.4,
        onSuccess: { effects: { army: -4, prestige: 8 }, chronicle: 'Překvapivý útok rozprášil tábor žoldnéřů, kteří se chystali plenit. Jejich zbraně teď nosí královští vojáci.' },
        onFailure: { effects: { army: -10 }, provinceEffects: { 'zelezny-hreben': { unrest: 10 } }, chronicle: 'Útok narazil na připravenou obranu. Vojsko se vrátilo prořídlé.' },
      },
      {
        label: 'Nevšímat si toho',
        hintType: 'trait', hintKey: 'patience',
        effects: {},
        provinceEffects: { 'zelezny-hreben': { unrest: 8 } },
        chronicle: 'Koruna hlášení odložila. Horníci si všimli, že je nikdo nechrání.',
      },
    ],
  },

  {
    id: 'obleheni',
    music: 'battle',
    minTurn: 20,
    cooldown: 40,
    weight: 0.6,
    title: 'Obléhání',
    text: 'Pod hradbami hlavního města stojí cizí vojsko. Obléhací stroje hrozí hradbám, studny jsou hlídané a zásoby se tenčí. {marshal.Title} {marshal.name} čeká na rozkaz.',
    choices: [
      {
        label: 'Výpad z hradeb',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.35, traitKey: 'strength', traitScale: 0.04, resourceKey: 'army', resourceScale: 0.7,
        onSuccess: { effects: { army: -10, prestige: 14, legitimacy: 6 }, courtEffects: { marshal: { loyalty: 8 } }, traitGain: 'strength', chronicle: 'Za úsvitu se otevřely brány a královská jízda vpadla do ležení. Obléhatelé utekli i se strachem v zádech.' },
        onFailure: { effects: { army: -18, food: -10, stability: -6 }, provinceEffects: { capital: { wealth: -12, unrest: 12 } }, chronicle: 'Výpad skončil masakrem. Obléhatelé nakonec odtáhli, ale ne kvůli statečnosti obránců.' },
      },
      {
        label: 'Vydržet za hradbami',
        hintType: 'trait', hintKey: 'patience',
        isRoll: true, baseChance: 0.4, traitKey: 'patience', traitScale: 0.04, resourceKey: 'food', resourceScale: 0.6,
        onSuccess: { effects: { food: -18, legitimacy: 4 }, traitGain: 'patience', chronicle: 'Město vydrželo. Obléhatelům došla trpělivost dřív než obráncům chléb.' },
        onFailure: { effects: { food: -25, stability: -8 }, provinceEffects: { capital: { unrest: 15, loyalty: -10 } }, chronicle: 'Hlad ve městě byl strašný. Obléhání skončilo, ale vzpomínka na něj ne.' },
      },
      {
        label: 'Vyjednat odchod obléhatelů',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -30, prestige: -8 },
        chronicle: 'Obléhatelé odtáhli s truhlou zlata. Koruna přežila a ponížení si pamatuje.',
      },
    ],
  },

  {
    id: 'zold',
    cooldown: 12,
    title: 'Žold',
    text: 'Vojáci se srotili před hradem. Žold jim chodí pozdě a v posledním měsíci vůbec. {marshal.Title} {marshal.name} varuje, že trpělivost vojska je u konce.',
    choices: [
      {
        label: 'Vyplatit dlužný žold',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -18, army: 2 },
        courtEffects: { marshal: { loyalty: 6 } },
        chronicle: 'Žold byl vyplacen. Krčmy pod hradem mají rušnou noc.',
      },
      {
        label: 'Slíbit žold po sklizni',
        hintType: 'trait', hintKey: 'eloquence',
        isRoll: true, baseChance: 0.5, traitKey: 'eloquence', traitScale: 0.05,
        onSuccess: { effects: { stability: 1 }, traitGain: 'eloquence', chronicle: 'Vládcovo slovo vojákům stačilo. Zatím.' },
        onFailure: { effects: { army: -8, stability: -4 }, chronicle: 'Vojáci slibům nevěřili. Třetina jich odešla sloužit jiným pánům.' },
      },
      {
        label: 'Potrestat vůdce srocení',
        hintType: 'trait', hintKey: 'strength',
        effects: { army: -6, stability: -2, prestige: 2 },
        courtEffects: { marshal: { loyalty: -8 } },
        chronicle: 'Vůdci srocení byli zbičováni. Vojsko poslouchá, ale v jeho očích je něco temného.',
      },
    ],
  },

  {
    id: 'nove_kuse',
    cooldown: 24,
    title: 'Nové kuše',
    text: 'Zbrojíř z ciziny předvádí na nádvoří kuši, která prostřelí rytířskou zbroj na sto kroků. Nabízí vyzbrojit celé vojsko.',
    choices: [
      {
        label: 'Koupit kuše pro celé vojsko',
        hintType: 'resource', hintKey: 'army',
        effects: { gold: -22, army: 9 },
        chronicle: 'Královské vojsko má nové kuše. Rytíři si stěžují, že je to zbraň zbabělců.',
      },
      {
        label: 'Koupit jen pro posádky na hranici',
        hintType: 'resource', hintKey: 'army',
        effects: { gold: -10, army: 3 },
        provinceEffects: { 'sokoli-hvozd': { garrison: 8 } },
        chronicle: 'Pohraniční posádky dostaly kuše. Nájezdníci z Marek to brzy poznali.',
      },
      {
        label: 'Odmítnout',
        hintType: 'resource', hintKey: 'gold',
        effects: {},
        chronicle: 'Zbrojíř odjel k markrabímu. Snad nebude tak úspěšný.',
      },
    ],
  },

  {
    id: 'hranicni_kamen',
    cooldown: 16,
    title: 'Posunutý hraniční kámen',
    text: 'Sousední pán v noci posunul hraniční kámen o půl míle do královského lesa. Myslivci ze Sokolova to viděli na vlastní oči.',
    choices: [
      {
        label: 'Vrátit kámen se zbraní v ruce',
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.55, resourceKey: 'army', resourceScale: 0.3,
        onSuccess: { effects: { prestige: 5 }, provinceEffects: { 'sokoli-hvozd': { loyalty: 6 } }, chronicle: 'Kámen stojí na svém místě a sousední pán ví, že koruna hlídá každou píď.' },
        onFailure: { effects: { army: -4, prestige: -3 }, chronicle: 'Šarvátka na hranici skončila nerozhodně. Kámen stojí tam, kde ho soused nechal.' },
      },
      {
        label: 'Vyjednat s ním',
        hintType: 'trait', hintKey: 'eloquence',
        effects: { legitimacy: 2 },
        traitGain: 'eloquence',
        chronicle: 'Po dlouhém jednání byl kámen vrácen o čtvrt míle. Kompromis, jak se říká.',
      },
      {
        label: 'Nechat to být',
        hintType: 'resource', hintKey: 'stability',
        effects: { prestige: -3 },
        provinceEffects: { 'sokoli-hvozd': { loyalty: -5 } },
        chronicle: 'Půl míle lesa patří sousedovi. Myslivci si myslí své.',
      },
    ],
  },

  // ===================== LAND AND NATURE =====================

  {
    id: 'povoden',
    seasons: [0],
    cooldown: 12,
    title: 'Povodeň',
    text: 'Jarní tání rozvodnilo Brodnici. Voda zaplavila pole v Brodné, strhla mlýny a ohrožuje trhové město.',
    choices: [
      {
        label: 'Stavět hráze',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -14 },
        provinceEffects: { brodna: { loyalty: 8, wealth: -2 } },
        chronicle: 'Na březích Brodnice vyrostly hráze z pytlů a kamení. Město zůstalo suché.',
      },
      {
        label: 'Evakuovat lidi a zachránit zásoby',
        hintType: 'resource', hintKey: 'food',
        effects: { food: -6, stability: 2 },
        provinceEffects: { brodna: { wealth: -8 } },
        chronicle: 'Lidé a obilí byli zachráněni. Domy a pole vzala voda.',
      },
      {
        label: 'Počkat, až voda opadne',
        hintType: 'trait', hintKey: 'patience',
        effects: { food: -10 },
        provinceEffects: { brodna: { wealth: -12, unrest: 10 } },
        chronicle: 'Voda opadla za týden. Zanechala po sobě bahno, hlad a hněv.',
      },
    ],
  },

  {
    id: 'sucho',
    seasons: [1],
    cooldown: 12,
    title: 'Sucho',
    text: 'Od jara nezapršelo. Obilí v Brodné žloutne, studny vysychají a sedláci se modlí za déšť.',
    choices: [
      {
        label: 'Kopat zavlažovací kanály z Brodnice',
        hintType: 'trait', hintKey: 'intelligence',
        effects: { gold: -12, food: 6 },
        provinceEffects: { brodna: { wealth: 4 } },
        traitGain: 'intelligence',
        chronicle: 'Kanály přivedly vodu z řeky na pole. Úroda je slabší, ale je.',
      },
      {
        label: 'Uspořádat procesí za déšť',
        hintType: 'resource', hintKey: 'faith',
        isRoll: true, baseChance: 0.35, resourceKey: 'faith', resourceScale: 0.5,
        onSuccess: { effects: { faith: 6, food: 4 }, chronicle: 'Třetí den po procesí začalo pršet. Kněží mají plné kostely.' },
        onFailure: { effects: { faith: -4, food: -10 }, chronicle: 'Procesí prošlo prachem a nebe zůstalo jasné. Úroda je ztracená.' },
      },
      {
        label: 'Nakoupit obilí do zásoby',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -15, food: 10 },
        chronicle: 'Kancléřství nakoupilo obilí, dokud bylo levné. Zima bude snesitelná.',
      },
    ],
  },

  {
    id: 'vlci',
    seasons: [3],
    cooldown: 12,
    title: 'Vlci',
    text: 'Krutá zima vyhnala z hvozdu vlky. Smečka napadá ovce i lidi a v Sokolově už pohřbili dva pasáky.',
    choices: [
      {
        label: 'Vyjet na hon osobně',
        hintType: 'trait', hintKey: 'strength',
        isRoll: true, baseChance: 0.45, traitKey: 'strength', traitScale: 0.05,
        onSuccess: { effects: { prestige: 6 }, provinceEffects: { 'sokoli-hvozd': { loyalty: 10 } }, traitGain: 'strength', chronicle: 'Vládce sám skolil vůdce smečky. Kožešina visí v síni a v Sokolově se o lovu zpívá.' },
        onFailure: { effects: { prestige: -4, stability: -2 }, chronicle: 'Hon skončil zraněným koněm a pokousaným psovodem. Vlci odešli, až když se oteplilo.' },
      },
      {
        label: 'Vypsat odměnu za každou vlčí hlavu',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -8 },
        provinceEffects: { 'sokoli-hvozd': { loyalty: 4, unrest: -4 } },
        chronicle: 'Myslivci si vydělali na celou zimu a smečka zmizela.',
      },
      {
        label: 'Ať se vesnice brání samy',
        hintType: 'resource', hintKey: 'stability',
        effects: {},
        provinceEffects: { 'sokoli-hvozd': { unrest: 8, wealth: -4 } },
        chronicle: 'Vesnice se bránily samy. Ne všechny uspěly.',
      },
    ],
  },

  {
    id: 'stribrna_zila',
    cooldown: 40,
    title: 'Stříbrná žíla',
    text: 'Horníci v Železné Huti narazili na žílu stříbra. Správce dolu chce těžit dnem i nocí, horníci žádají podíl na nálezu.',
    choices: [
      {
        label: 'Těžit pro korunu dnem i nocí',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 25 },
        provinceEffects: { 'zelezny-hreben': { unrest: 12, loyalty: -6 } },
        chronicle: 'Stříbro teče do pokladny. Horníci dřou ve dne v noci a nadávají.',
      },
      {
        label: 'Dát horníkům podíl',
        hintType: 'resource', hintKey: 'stability',
        effects: { gold: 12 },
        provinceEffects: { 'zelezny-hreben': { loyalty: 12, wealth: 8 } },
        chronicle: 'Horníci dostali desetinu nálezu. V Železném Hřebeni se nikdy tolik nezpívalo.',
      },
    ],
  },

  {
    id: 'kobylky',
    seasons: [1],
    cooldown: 20,
    title: 'Kobylky',
    text: 'Od jihu se přihnal mrak kobylek. Kam dosednou, zůstane holá zem. Brodná přichází o úrodu před očima.',
    choices: [
      {
        label: 'Zapálit ohně a zahánět je kouřem',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.45, traitKey: 'intelligence', traitScale: 0.05,
        onSuccess: { effects: { food: -4 }, traitGain: 'intelligence', chronicle: 'Kouřové ohně odehnaly mrak kobylek k sousedům. Brodná přišla jen o okraj polí.' },
        onFailure: { effects: { food: -14 }, provinceEffects: { brodna: { wealth: -6 } }, chronicle: 'Kobylky si kouře nevšímaly. Brodná je holá.' },
      },
      {
        label: 'Otevřít sýpky postiženým vesnicím',
        hintType: 'resource', hintKey: 'food',
        effects: { food: -12, legitimacy: 3 },
        provinceEffects: { brodna: { loyalty: 8 } },
        chronicle: 'Koruna nakrmila postižené vesnice ze svých zásob. Kobylky odešly, vděčnost zůstala.',
      },
      {
        label: 'Modlit se za vysvobození',
        hintType: 'resource', hintKey: 'faith',
        effects: { food: -14, faith: 3 },
        provinceEffects: { brodna: { unrest: 6 } },
        chronicle: 'Kobylky snědly, co chtěly, a odletěly. Kněží tvrdí, že bez modliteb by to bylo horší.',
      },
    ],
  },

  {
    id: 'spor_rybaru',
    cooldown: 16,
    title: 'Spor o rybolov',
    text: 'Rybáři z Pobřežní marky a mniši z kláštera na útesu se přou o lov ryb v zátoce. Obě strany mají staré listiny a obě tvrdí, že ta druhá je falešná.',
    choices: [
      {
        label: 'Dát za pravdu rybářům',
        hintType: 'resource', hintKey: 'stability',
        effects: { faith: -4 },
        provinceEffects: { 'pobrezni-mark': { loyalty: 8, wealth: 4 } },
        chronicle: 'Zátoka patří rybářům. Opat se urazil a v klášteře se teď postí víc než obvykle.',
      },
      {
        label: 'Dát za pravdu klášteru',
        hintType: 'resource', hintKey: 'faith',
        effects: { faith: 5 },
        provinceEffects: { 'pobrezni-mark': { loyalty: -6 } },
        chronicle: 'Zátoka patří klášteru. Rybáři loví potají a v noci.',
      },
      {
        label: 'Rozdělit zátoku podle dnů v týdnu',
        hintType: 'trait', hintKey: 'patience',
        isRoll: true, baseChance: 0.5, traitKey: 'patience', traitScale: 0.04,
        onSuccess: { effects: { stability: 2, faith: 2 }, provinceEffects: { 'pobrezni-mark': { loyalty: 4 } }, traitGain: 'patience', chronicle: 'Mniši loví v pondělí, středu a pátek, rybáři ve zbylé dny. V neděli odpočívají ryby.' },
        onFailure: { effects: { stability: -2 }, provinceEffects: { 'pobrezni-mark': { unrest: 6 } }, chronicle: 'Nikdo nevěděl, který den je čí. Na vodě došlo ke rvačce.' },
      },
    ],
  },

  {
    id: 'zlodej_v_pokladne',
    cooldown: 20,
    title: 'Zloděj v pokladně',
    text: 'Z královské pokladny mizí peníze. Ne mnoho najednou, ale pravidelně. {chancellor.Title} {chancellor.name} tvrdí, že o ničem neví.',
    choices: [
      {
        label: 'Tajně vyšetřit, kdo krade',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.45, traitKey: 'intelligence', traitScale: 0.06,
        onSuccess: { effects: { gold: 15, legitimacy: 2 }, traitGain: 'intelligence', chronicle: 'Zlodějem byl pokladník. Ukradené peníze se našly pod podlahou jeho domu.' },
        onFailure: { effects: { gold: -10 }, chronicle: 'Vyšetřování zloděje vyplašilo, ale nechytilo. Peníze jsou pryč.' },
      },
      {
        label: 'Obvinit kancléřství z nedbalosti',
        hintType: 'trait', hintKey: 'strength',
        effects: { gold: 4 },
        courtEffects: { chancellor: { loyalty: -15 } },
        chronicle: 'Kancléřství muselo ztrátu nahradit ze svého. Kancléř to vládci nezapomene.',
      },
      {
        label: 'Najmout nového pokladníka',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: -5 },
        chronicle: 'Pokladna dostala nového strážce. Peníze přestaly mizet. Starý pokladník odjel do ciziny s plnými truhlami.',
      },
    ],
  },

  {
    id: 'vyroci_vlady',
    weight: 2,
    requires: (state) => {
      const years = Math.floor((state.turn - (state.ruler.reignStartTurn || 0)) / 4);
      return years >= 5 && years % 5 === 0 && !state.flags[`jubilee_${state.ruler.name}_${years}`];
    },
    markSeen: (state) => {
      const years = Math.floor((state.turn - (state.ruler.reignStartTurn || 0)) / 4);
      state.flags[`jubilee_${state.ruler.name}_${years}`] = true;
    },
    title: 'Výročí vlády',
    text: 'Od nástupu vládce {ruler.name} na trůn uplynulo dalších pět let. Dvůr navrhuje oslavu, aby si lid připomněl, kdo mu vládne.',
    choices: [
      {
        label: 'Velkolepá oslava',
        hintType: 'resource', hintKey: 'prestige',
        effects: { gold: -15, prestige: 8, legitimacy: 4 },
        chronicle: 'Výročí vlády slavila celá země. Na náměstích tekla piva a víno.',
      },
      {
        label: 'Vyhlásit amnestii a odpustit dluhy',
        hintType: 'resource', hintKey: 'stability',
        effects: { gold: -8, stability: 5, legitimacy: 3 },
        provinceEffects: { '*': { unrest: -6 } },
        chronicle: 'Na výročí vlády se otevřely brány vězení a dlužníci si oddechli. Lid žehná vládci.',
      },
      {
        label: 'Tichá mše za předky',
        hintType: 'resource', hintKey: 'faith',
        effects: { faith: 4 },
        chronicle: 'Vládce strávil výročí v modlitbách za předky. Lid si ani nevšiml, že nějaké výročí bylo.',
      },
    ],
  },

  {
    id: 'skola_ucencu',
    cooldown: 40,
    title: 'Škola učenců',
    text: 'Skupina učenců z ciziny žádá o povolení založit v hlavním městě školu. Učili by práva, počty a hvězdy — a kněží se mračí, že i věci, kterým rozumí jen Bůh.',
    choices: [
      {
        label: 'Školu založit a financovat',
        hintType: 'trait', hintKey: 'intelligence',
        effects: { gold: -20, legitimacy: 4, faith: -3, prestige: 4 },
        traitGain: 'intelligence',
        chronicle: 'V hlavním městě vznikla škola. Za pár let z ní vyjdou písaři, právníci a možná i pár kacířů.',
      },
      {
        label: 'Povolit, ale nepřispět',
        hintType: 'resource', hintKey: 'gold',
        effects: { legitimacy: 1 },
        chronicle: 'Učenci dostali povolení a starý dům u hradeb. Studenti jsou chudí, ale horliví.',
      },
      {
        label: 'Zakázat',
        hintType: 'resource', hintKey: 'faith',
        effects: { faith: 4, prestige: -2 },
        chronicle: 'Učenci odjeli k sousedům. Kněží děkují vládci za ochranu pravé víry.',
      },
    ],
  },

  {
    id: 'cizi_princezna',
    cooldown: 30,
    requires: (state) => state.heir.alive && state.heir.age >= 14 && !state.heir.spouse,
    title: 'Nabídka sňatku',
    text: 'Vzdálený král posílá posly s nabídkou: jeho dítě by se mohlo stát chotí dědice {heir.name}. Věno je štědré, ale ta země je daleko a její spory taky.',
    choices: [
      {
        label: 'Přijmout nabídku',
        hintType: 'resource', hintKey: 'prestige',
        effects: { gold: 20, prestige: 6, legitimacy: 3 },
        courtEffects: { heir: { loyalty: -4 } },
        heirMarry: 'cizina',
        chronicle: 'Zásnuby byly zpečetěny. Věno dorazilo na dvanácti vozech a s ním i {heir.spouseName}.',
      },
      {
        label: 'Zeptat se dědice, co chce',
        hintType: 'trait', hintKey: 'patience',
        effects: { stability: 1 },
        courtEffects: { heir: { loyalty: 10 } },
        chronicle: '{heir.name} nabídku {D:odmítl a byl|odmítla a byla} za to vděčn{D:ý|á}. Poslové odjeli bez odpovědi, jakou chtěli.',
      },
      {
        label: 'Odmítnout, rod potřebuje spojence blíž',
        hintType: 'resource', hintKey: 'legitimacy',
        effects: { prestige: -2 },
        chronicle: 'Nabídka byla zdvořile odmítnuta. {heir.name} zatím zůstává {D:volný|volná}.',
      },
    ],
  },

  {
    id: 'zahada_v_lese',
    cooldown: 30,
    title: 'Zmizelí myslivci',
    text: 'V hlubokém hvozdu za Sokolovem beze stopy zmizeli tři myslivci. Lidé mluví o lesních duších a nikdo se tam neodváží.',
    choices: [
      {
        label: 'Vyslat oddíl, ať prohledá les',
        hintType: 'resource', hintKey: 'army',
        isRoll: true, baseChance: 0.5, resourceKey: 'army', resourceScale: 0.3,
        onSuccess: { effects: { prestige: 4, army: -2 }, provinceEffects: { 'sokoli-hvozd': { unrest: -6 } }, chronicle: 'Oddíl našel v lese tábor pašeráků z Marek, kteří myslivce drželi jako rukojmí. Všichni tři se vrátili domů.' },
        onFailure: { effects: { army: -4 }, provinceEffects: { 'sokoli-hvozd': { unrest: 8 } }, chronicle: 'Oddíl se vrátil s prázdnou a dva vojáci tvrdí, že v noci něco viděli mezi stromy.' },
      },
      {
        label: 'Poslat kněze, ať les vysvětí',
        hintType: 'resource', hintKey: 'faith',
        effects: { faith: 3, gold: -3 },
        provinceEffects: { 'sokoli-hvozd': { unrest: -3 } },
        chronicle: 'Kněz vysvětil les. Myslivci se nenašli, ale lidé se tolik nebojí.',
      },
      {
        label: 'Nechat to být',
        hintType: 'resource', hintKey: 'stability',
        effects: {},
        provinceEffects: { 'sokoli-hvozd': { unrest: 6, wealth: -4 } },
        chronicle: 'Do hlubokého lesa už nikdo nechodí. Dřevo i zvěř tam zůstávají.',
      },
    ],
  },

  {
    id: 'kupecka_gilda',
    cooldown: 24,
    title: 'Kupecká gilda',
    text: 'Kupci z Přístavu Mark a Brodu chtějí založit gildu, která by sama určovala ceny a cla. Za to nabízejí koruně pravidelný příspěvek.',
    choices: [
      {
        label: 'Gildu povolit',
        hintType: 'resource', hintKey: 'gold',
        effects: { gold: 12, stability: -2 },
        provinceEffects: { 'pobrezni-mark': { wealth: 6 }, brodna: { wealth: 4 } },
        hiddenEffects: { setFlag: 'merchant_guild' },
        chronicle: 'Gilda vznikla. Kupci bohatnou, ceny rostou a koruna dostává svůj podíl.',
      },
      {
        label: 'Povolit jen pod dohledem koruny',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.5, traitKey: 'intelligence', traitScale: 0.05,
        onSuccess: { effects: { gold: 8, legitimacy: 2 }, provinceEffects: { 'pobrezni-mark': { wealth: 4 } }, traitGain: 'intelligence', chronicle: 'Gilda vznikla s královským dozorcem v radě. Obchod roste a nikdo nekrade víc, než je zvykem.' },
        onFailure: { effects: { prestige: -3 }, chronicle: 'Kupci podmínky odmítli. Gilda nebude, obchod taky ne.' },
      },
      {
        label: 'Zakázat',
        hintType: 'resource', hintKey: 'stability',
        effects: { stability: 2 },
        provinceEffects: { 'pobrezni-mark': { loyalty: -5 } },
        chronicle: 'Gilda byla zakázána. Kupci se scházejí dál, jen se tomu neříká gilda.',
      },
    ],
  },

  {
    id: 'stary_rytir_umira',
    cooldown: 30,
    title: 'Poslední přání',
    text: 'Starý rytíř, který bojoval po boku vládcova otce, umírá. Na smrtelném loži prosí, aby jeho syn mohl převzít jeho léno, ačkoli je to známý opilec a rváč.',
    choices: [
      {
        label: 'Splnit poslední přání',
        hintType: 'resource', hintKey: 'legitimacy',
        effects: { legitimacy: 2, stability: -2 },
        provinceEffects: { brodna: { unrest: 5 } },
        chronicle: 'Rytíř zemřel klidně. Jeho syn se o léno stará po svém — v krčmě.',
      },
      {
        label: 'Slíbit, ale léno dát jinému',
        hintType: 'trait', hintKey: 'intelligence',
        effects: { legitimacy: -3, gold: 4 },
        chronicle: 'Rytíř zemřel s klidným srdcem. Léno dostal schopnější muž a slib zůstal nesplněn.',
      },
      {
        label: 'Říct mu pravdu do očí',
        hintType: 'trait', hintKey: 'strength',
        effects: { prestige: 2, faith: -2 },
        chronicle: 'Rytíř zemřel zklamaný, ale s respektem k vládci, který mu nelhal.',
      },
    ],
  },

  {
    id: 'ztracena_listina',
    cooldown: 40,
    title: 'Ztracená listina',
    text: 'V archivu se našla stará listina. Pokud je pravá, patří Železná Huť ve skutečnosti klášteru na útesu — a ne koruně.',
    choices: [
      {
        label: 'Listinu tiše zničit',
        hintType: 'trait', hintKey: 'strength',
        effects: { legitimacy: -2 },
        hiddenEffects: { setFlag: 'burned_charter' },
        chronicle: 'Listina shořela v krbu. O jejím obsahu ví jen vládce a archivář.',
      },
      {
        label: 'Nechat ji prověřit učenci',
        hintType: 'trait', hintKey: 'intelligence',
        isRoll: true, baseChance: 0.55, traitKey: 'intelligence', traitScale: 0.04,
        onSuccess: { effects: { legitimacy: 4 }, traitGain: 'intelligence', chronicle: 'Listina se ukázala jako padělek. Pravda posílila korunu a opat se tvářil překvapeně.' },
        onFailure: { effects: { faith: 6, gold: -15 }, provinceEffects: { 'zelezny-hreben': { wealth: -6 } }, chronicle: 'Listina byla pravá. Koruna musí klášteru odvádět podíl z dolu.' },
      },
      {
        label: 'Vyjednat s opatem dohodu',
        hintType: 'trait', hintKey: 'eloquence',
        effects: { faith: 3, gold: -6 },
        chronicle: 'Opat se spokojil s ročním darem a listinu vrátil do archivu. Navždy.',
      },
    ],
  },
];
