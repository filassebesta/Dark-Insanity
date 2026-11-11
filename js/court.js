// Court members: background lore and the record of decisions that touched them.
// Text tokens {male|female} pick the grammatical gender of the character.

const BIOS = {
  chancellor: {
    origin: [
      'Pochází z rodu drobných zemanů z Brodné a do úřadu se vypracoval{|a} jako písař královské komory.',
      'Je {nejmladším synem|nejmladší dcerou} starého rodu z Pobřežní marky. Místo meče dostal{|a} do ruky pero a nikdy toho nelitoval{|a}.',
      'Vyrůstal{|a} v klášteře na útesu, kde se naučil{|a} číst, počítat a hlavně mlčet.',
      'Kdysi vedl{|a} účty bohatých kupců v Přístavu Mark. Koruna {ho|ji} koupila za cenu, kterou by žádný kupec nezaplatil.',
    ],
    nature: [
      'Umí spočítat každý groš a nikomu nevěří na slovo, ani vlastním písařům.',
      'Je opatrn{ý|á} až k zoufalství a raději deset let čeká, než by riskoval{|a} jediný zlaťák.',
      'Má slabost pro staré listiny a dobré víno, v tomto pořadí.',
      'Mluví tiše a pomalu, takže {ho|ji} celý dvůr poslouchá se zatajeným dechem.',
    ],
  },
  marshal: {
    origin: [
      'Sloužil{|a} jako žoldnéř ve třech válkách a ve dvou z nich na straně, která prohrála.',
      'Je {synem|dcerou} kováře ze Železné Huti. Do šlechtického stavu {ho|ji} povýšila bitva, ne krev.',
      'Pochází z hraničního rodu ze Sokolího hvozdu, kde se meč nosí dřív, než se dítě naučí mluvit.',
      'Velel{|a} posádce na Orlí Stráži, dokud se vazal nezačal dívat jinam.',
    ],
    nature: [
      'Vojáci by za {ním|ní} šli do pekla, šlechtici {ho|ji} nesnášejí, protože se neumí klanět.',
      'Je drsn{ý|á} a přímočar{ý|á}. Intriky dvora považuje za zbabělost v hedvábí.',
      'Nosí jizvu přes tvář a o tom, kde k ní přišel{|a}, vypráví pokaždé jinak.',
      'Věří víc dobře nabroušené čepeli než slovům kancléřů.',
    ],
  },
  spymaster: {
    origin: [
      'Nikdo přesně neví, odkud pochází. Podle všeho se tak {sám|sama} rozhodl{|a}.',
      'Kdysi byl{|a} kapsářem v přístavních uličkách. Pak {ho|ji} chytili a místo šibenice dostal{|a} nabídku.',
      'Je levobočkem mocného rodu, který se k {němu|ní} nikdy veřejně nepřiznal.',
      'Léta žil{|a} na dvoře v Marcích a naučil{|a} se tam, že tajemství je cennější než zlato.',
    ],
    nature: [
      'Usmívá se, i když nese zprávu o zradě. Hlavně tehdy.',
      'Zná jméno každého podkoního, každé pradleny a každého, kdo komu dluží.',
      'Nikdy nesedí zády ke dveřím a nikdy nepije z poháru, který {mu|jí} nalil někdo jiný.',
      'Mluví jen tehdy, když to něco stojí, a vždy ví kolik.',
    ],
  },
  heir: {
    origin: [
      'Narodil{|a} se za bouřlivé noci a porodní bába tvrdila, že je to znamení.',
      'Je nadějí rodu {dynasty} a celý dvůr ví, že na {něm|ní} jednou bude záležet všechno.',
      'Vyrůstá mezi zdmi hradu Vlčí Úděl a svět za hradbami zná jen z vyprávění.',
    ],
    nature: [
      'Je zvídav{ý|á} a ptá se na věci, na které by se ptát neměl{|a}.',
      'Je tich{ý|á} a pozorn{ý|á}, víc poslouchá, než mluví.',
      'Je divok{ý|á} a neposedn{ý|á}, učitelé si na {něj|ni} stěžují každý týden.',
      'Je vážn{ý|á} nad svůj věk, jako by už cítil{|a} tíhu koruny.',
    ],
  },
  spouse: {
    origin: [
      'Pochází ze sousedního rodu a sňatek měl zpečetit dávný mír. Láska přišla později, nebo vůbec.',
      'Je {synem|dcerou} bohatého pána z Pobřežní marky a do manželství přinesl{|a} věno, které zachránilo pokladnu.',
      'Vyrůstal{|a} na dvoře v Marcích a dodnes mluví s lehkým cizím přízvukem.',
    ],
    nature: [
      'Je chytřejší, než si dvůr myslí, a dává si pozor, aby to tak zůstalo.',
      'Má vlastní ambice a vlastní spojence a nikdy na ně nezapomíná.',
      'Je laskav{ý|á} k služebnictvu a nemilosrdn{ý|á} ke každému, kdo ohrozí rod.',
      'Umí naslouchat a umí mlčet, což je na dvoře vzácnější než zlato.',
    ],
  },
};

const ROLE_LABELS = {
  chancellor: ['Kancléř', 'Kancléřka'],
  marshal: ['Maršál', 'Maršálka'],
  spymaster: ['Špehmistr', 'Špehmistryně'],
  heir: ['Dědic', 'Dědička'],
  spouse: ['Manžel', 'Manželka'],
};

// a noble's household has a steward, a captain and a confidant instead of royal offices
const NOBLE_ROLE_LABELS = {
  chancellor: ['Purkrabí', 'Purkrabí'],
  marshal: ['Hejtman', 'Hejtmanka'],
  spymaster: ['Důvěrník', 'Důvěrnice'],
};

// a peasant's council is the village: the reeve, the smith and the innkeeper
const PEASANT_ROLE_LABELS = {
  chancellor: ['Rychtář', 'Rychtářka'],
  marshal: ['Kovář', 'Kovářka'],
  spymaster: ['Krčmář', 'Krčmářka'],
};

export function roleLabel(role, gender, scenario) {
  const pair = (scenario === 'slechtic' && NOBLE_ROLE_LABELS[role])
    || (scenario === 'sedlak' && PEASANT_ROLE_LABELS[role]) || ROLE_LABELS[role];
  return pair ? pair[gender === 'female' ? 1 : 0] : '';
}

function gendered(text, gender) {
  return text.replace(/\{([^|{}]*)\|([^|{}]*)\}/g, (m, male, female) => (gender === 'female' ? female : male));
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

const PEASANT_BIOS = {
  chancellor: {
    origin: [
      'Rychtářem je ve vsi Lipnice už patnáct let a zná každou mez i každý dluh.',
      'Je {synem|dcerou} bývalého rychtáře a úřad zdědil{|a} spolu s pečetidlem a hádkami sousedů.',
      'Kdysi sloužil{|a} jako písař na panském dvoře, umí číst a dává to znát.',
    ],
    nature: [
      'Je spravedliv{ý|á}, ale nikdy ne zadarmo.',
      'S pánem mluví uctivě a se sousedy přísně. Někdy je to obráceně, když nikdo neposlouchá.',
      'Všechno si zapisuje. Hlavně to, kdo komu co slíbil.',
    ],
  },
  marshal: {
    origin: [
      'Kovárna u potoka patří {jeho|její} rodině odnepaměti.',
      'Přišel{|a} do vsi jako tovaryš a zůstal{|a}, protože nikdo jiný neuměl okovat koně.',
      'Sloužil{|a} kdysi v panské zbrojnici a umí víc než jen podkovy.',
    ],
    nature: [
      'Má ruce jako lopaty a srdce na dlani.',
      'Mluví málo a hlasitě. Když praští do kovadliny, ves ztichne.',
      'Kdyby přišlo na nejhorší, ves by šla za {ním|ní}.',
    ],
  },
  spymaster: {
    origin: [
      'Krčma na návsi je {jeho|její} a s ní i všechno, co se v ní kdy řeklo.',
      'Je {synem|dcerou} formana a o světě za vsí ví víc než celá ves dohromady.',
      'Do Lipnice se přiženil{|a} a od první svatby nalévá pivo i drby.',
    ],
    nature: [
      'Pamatuje si, kdo kolik vypil a kdo co při tom řekl.',
      'Usmívá se na všechny a nevěří nikomu.',
      'Za korbel piva ti prozradí cizí tajemství. Za dva i tvoje.',
    ],
  },
  heir: {
    origin: [
      'Narodil{|a} se v době žní přímo na poli, jak to u sedláků chodí.',
      'Je nadějí rodu {dynasty}, který chce jednou přestat být poddaný.',
      'Vyrůstá mezi chlévem a polem a o hradech zná jen pohádky.',
    ],
    nature: [
      'Je zvídav{ý|á} a ptá se na věci, na které by se dítě ze vsi ptát nemělo.',
      'Je tich{ý|á} a pracovit{ý|á}, za pluhem vydrží do tmy.',
      'Je divok{ý|á} a neposedn{ý|á}, sousedé si na {něj|ni} stěžují každý týden.',
    ],
  },
  spouse: {
    origin: [
      'Pochází ze sousední vsi a přinesl{|a} věno: krávu, truhlu a dobré jméno.',
      'Je {synem|dcerou} mlynáře a ví, kolik váží pytel mouky i lidské slovo.',
      'Vyrůstal{|a} na samotě u lesa a nebojí se ničeho kromě pána.',
    ],
    nature: [
      'Je chytřejší, než si ves myslí, a dává si pozor, aby to tak zůstalo.',
      'Pracuje od tmy do tmy a nikdy si nestěžuje. Skoro nikdy.',
      'Je laskav{ý|á} k čeledi a nemilosrdn{ý|á} ke každému, kdo ohrozí rod.',
    ],
  },
};

/** Background story of a court member; stable for the same person (seeded by name and role). */
export function biography(c, role, dynastyName, scenario) {
  const pool = (scenario === 'sedlak' && PEASANT_BIOS[role]) || BIOS[role];
  if (!pool) return '';
  const h = hash(`${c.name}|${role}`);
  const origin = pool.origin[h % pool.origin.length];
  const nature = pool.nature[(h >>> 8) % pool.nature.length];
  return gendered(`${origin} ${nature}`, c.gender).replace('{dynasty}', dynastyName);
}

export function loyaltyLabel(loyalty, gender) {
  const f = gender === 'female';
  if (loyalty >= 80) return f ? 'Oddaná' : 'Oddaný';
  if (loyalty >= 60) return f ? 'Věrná' : 'Věrný';
  if (loyalty >= 40) return f ? 'Nejistá' : 'Nejistý';
  if (loyalty >= 25) return f ? 'Nespokojená' : 'Nespokojený';
  return 'Na pokraji zrady';
}

export const COURT_ROLES = ['heir', 'spouse', 'chancellor', 'marshal', 'spymaster'];

// ---------- personalities ----------
// Every adviser (and the spouse) has one quirk. Yearly effects live in engine.js
// (applyQuirks), the bias in council advice in council.js.

export const QUIRKS = {
  oddany: {
    label: ['Oddaný', 'Oddaná'],
    text: 'Věrnost {mu|jí} jde od srdce. V radě nikdy nelže a {jeho|její} věrnost každý rok sama trochu roste.',
  },
  ctizadostivy: {
    label: ['Ctižádostivý', 'Ctižádostivá'],
    text: 'Chce víc, než má. Když rod nemá slávu (prestiž pod 40), {jeho|její} věrnost každý rok klesá a v radě myslí hlavně na sebe.',
  },
  chamtivy: {
    label: ['Chamtivý', 'Chamtivá'],
    text: 'Lepí se {mu|jí} ruce. Každý rok zmizí z pokladny trocha zlata a v radě doporučuje to, co vynáší.',
  },
  schopny: {
    label: ['Schopný', 'Schopná'],
    text: 'Ve svém oboru nemá sobě rovného. {ROLE}',
  },
  opatrny: {
    label: ['Opatrný', 'Opatrná'],
    text: 'Nesnáší riziko. V radě vždy sáhne po jistější cestě, i když vynese méně.',
  },
  odvazny: {
    label: ['Odvážný', 'Odvážná'],
    text: 'Riskuje rád. V radě sází na odvahu a štěstí, a někdy to vyjde.',
  },
  zbozny: {
    label: ['Zbožný', 'Zbožná'],
    text: 'Církev {mu|jí} naslouchá. Každý rok díky {němu|ní} trochu vzroste víra.',
  },
};

// what a capable member adds in their own field
export const CAPABLE_BONUS = {
  chancellor: '+1 zlata každé období.',
  marshal: 'Lepší šance v každém střetu, kde rozhoduje vojsko.',
  spymaster: 'Lepší šance, kde rozhoduje inteligence.',
  spouse: 'Lepší šance, kde rozhoduje výřečnost.',
};

export const QUIRK_ROLES = ['chancellor', 'marshal', 'spymaster', 'spouse'];

export function randomQuirk() {
  const keys = Object.keys(QUIRKS);
  return keys[Math.floor(Math.random() * keys.length)];
}

export function quirkLabel(c) {
  const q = c && QUIRKS[c.quirk];
  return q ? q.label[c.gender === 'female' ? 1 : 0] : '';
}

export function quirkText(c, role) {
  const q = c && QUIRKS[c.quirk];
  if (!q) return '';
  return gendered(q.text, c.gender).replace('{ROLE}', CAPABLE_BONUS[role] || '');
}
