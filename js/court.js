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

export function roleLabel(role, gender) {
  const pair = ROLE_LABELS[role];
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

/** Background story of a court member; stable for the same person (seeded by name and role). */
export function biography(c, role, dynastyName) {
  const pool = BIOS[role];
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
