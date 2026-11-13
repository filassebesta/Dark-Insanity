# Herní test celé kampaně — seznam chyb

Tři testeři hráli hru ve skutečném prohlížeči (Chromium). Stupeň **král** (9 kronik,
~196 období, ženy i muži napříč generacemi) a stupeň **šlechtic** (hráno za ženu,
~260 událostí, tři cesty ke koruně) jsou dohrané. Test **sedláka** se přerušil
(limit využití) a doběhne později.

Ani jedna chyba JavaScriptu. Stav: ✅ opraveno · ⏳ čeká.

## Kritické a vysoké

| # | Stav | Kde | Chyba |
|---|---|---|---|
| K1 | ✅ | nástupnictví | Nový manžel/manželka se losuje bez ohledu na pohlaví nového vládce (král s manželem, královna s manželkou, která „rodí“). |
| K2 | ✅ | ekonomika krále | Království se zhroutí bez varování: hlad tiše zvedá nepokoje a stabilita spadne na nulu bez jakékoli krize. |
| V1 | ✅ | nástupnictví | Nástup nové generace nemá vlastní událost, jen řádek v souhrnu období. |
| V2 | ✅ | nástupnictví | Sourozenci (mladší děti) po nástupu zmizí a nový vládce má odnikud manžela a dvouleté dítě. |
| V3 | ✅ | texty | Texty o královně / vládkyni / šlechtičně v mužském rodě („Vládce rozsoudil“, „král“ u královny, „vládce osobně“, „maršál“ u maršálky). |
| V4 | ✅ | texty | Jména se neskloňují („objal Eliška“, „Za Eliška přišel“, „Vzít si Jindřich“, „Na křtinách Ctibor“). |
| V5 | ✅ | jméno rodu | Jméno rodu v chybném pádě („z rodu Vršovci“, „Rod Dvořákovi“) — formulář sám radí množné číslo. |
| V6 | ✅ | rada | „Já bych šelšla tudy.“ (chybný token v radě). |
| V7 | ✅ | povstání | „Sesazený král … odešl v kutně“; „u první brody“. |
| V8 | ✅ | boj o trůn | Nemohoucí král dál jedná (bitvy, návštěvy, úřady) během regentství. |
| V9 | ✅ | dobyté země | Dobyté Marky dál „vyhlašují válku“, posílají uprchlíky a vyslance. |
| V10 | ✅ | ozvěna | „Král za hranicemi“ o sesazené královně v mužském rodě. |
| V11 | ✅ | tažení | Slíbená koruna nepadne, protože protivník během tažení zesílí. |
| V12 | ✅ | tažení | Válečné události se opakují a texty nesedí k postupu („vítězství na dosah“ při 30 %); po 100 % přijde ještě událost. |
| V13 | ✅ | události | „Narození dítěte“ (`krest_ditete`) ohlásí dítě, které neexistuje. |
| V14 | ✅ | události | „Šeptání o tvrdé ruce“ připomíná trest, který se nestal; příznak přežívá do další generace. |

## Střední

| # | Stav | Kde | Chyba |
|---|---|---|---|
| S1 | ✅ | Výnos roku | V létě začíná „Jaro otevírá cesty“; po „Letos nic neměnit“ se ptá znovu. |
| S2 | ✅ | Výnos roku | Výsledek neukazuje zisk/ztrátu zlata. |
| S3 | ✅ | cizí země | Tituly cizích vládců si odporují (markrabě × král/královna, císař × císařovna). |
| S4 | ✅ | Účet z Marek | Malé písmeno na začátku věty, „král nikomu nic nedluží“ u královny. |
| S5 | ✅ | dobytí | „králem i v Východních markách“; dobytí koruny nemá vlastní kartu. |
| S6 | ✅ | Síň slávy, konce | Chybí úspěchy za cizí korunu a císaře; konce vykají a nejsou osobní. |
| S7 | ✅ | boj o trůn | Náhodná smrt krále předběhne příběh; pád z koně se opakuje u každého krále; regentství nemá účinek. |
| S8 | ✅ | šlechtic | Opakované události (Zkouška věrnosti 3×, Mlýn 3×, Rytíři u brány 2×); „Pozvání do tmy“ i když už ve spiknutí jsi. |
| S9 | ✅ | obchod | Zakázky královského dvora trestají bez varování a i během vzpoury; „2 vozy nedorazilo“. |
| S10 | ✅ | rodina | Sňatek od dohazovače zapsán jako „sňatek z lásky“; věno se neukáže. |
| S11 | ✅ | rozhovory | „Stříbrná spona ho potěšil“, „5 zlato“, „1 mužů“, „2 let“, „Prosby byly vyslyšeny“. |
| S12 | ✅ | UI | Oznámení Síně slávy překrývají text karty. |
| S13 | ✅ | válka | Velké vojsko hladoví, rady přesto doporučují další zbrojení. |
| S14 | ✅ | Síň předků | Jako „hlavní činy“ se ukazují bezvýznamné volby. |
| S15 | ✅ | různé | Vládce v poli řeší věci na dvoře; 2 trvalá zranění z jednoho souboje; „Ráno nevstalo dvacet mužů“ při 22 mužích. |
| S16 | ⏳ | obrázky | Karty kapitol ukazují muže i u královny — prompty připraveny (dávka K5 v `docs/obrazky-kariera.md`), hra je zapojí sama. |

## Nízké

Iniciála splývá s jednopísmennou předložkou („Vtáboře“); drobná gramatika („dvě kupecké koráby“,
„Ctibor 1 let“); dvě matoucí volby „vládnout dál“; opakovaná jména postav; přídomky nesedí
s průběhem vlády; „Pokračovat“ neobnoví rozehranou událost; nápadník se bez varování ožení jinam;
neaktuální šance u volby po vyslání vojska; po korunovaci změna příjmu bez vysvětlení.

✅ Opraveno z nízkých: iniciála u jednopísmenné předložky, opakovaná jména v rodině (manžel/ka a dítě
nového vládce mají vždy jiné jméno než sourozenci a rádci), svatební zápis v kronice (dříve „provdala za Zbyněk“),
věk dětí „1 rok / 3 roky“ místo „1 let“, „Pokračovat“ vrátí rozehranou událost (hra se ukládá i s otevřenou
kartou), nápadník/nápadnice rok předem varuje, než se ožení/vdá jinam.

## Test sedláka (2. kolo, 7 kronik)

Žádná chyba JavaScriptu. Opraveno: rod paní/hráčky v textech (ochotna, sytá a spokojená, spolehlivou,
panin švagr, utekla jí…), nápadnice, která se „vdala jinam“, se už nevrací (jména se pamatují a jmen je
víc), povinné zakázky jen na zboží, které se dá sehnat, příčina smrti na konci hry, přídomek u sedláka
„za život“ a až po 5 letech, prolog bez rozporu s ročním obdobím, „Po žních“ i v zimě, vlci jen v zimě,
méně opakování (Mez, Zvon jen jednou, Věrné srdce, Večer u ohně), vesnické texty v radě a rozhovorech,
„Kronika rodu“, „Vlastnosti hospodáře“, nováček v radě nemluví o letech služby, žádost o ruku sedí
s textem, rozhovor o dítěti u ženy, groše ve správném tvaru, „Přízeň vrchnosti“, plaketa „Rychtář“.
Zbývá: „Pobřežní Mark“ se v textech jmenuje různě; Brod × Brodná × Brodnice na mapě.

## Test šlechtice a krále (3. kolo, ~900 karet)

Jedna chyba JavaScriptu: rozhovor „Nabídnout poměr“ padal (popisek tématu byl funkce), takže milenky, levobočci
a žárlivost byly nedosažitelné — opraveno a ověřeno v prohlížeči.
Opraveno: „odešela“ → „odešla“ (všechna slovesa na -šel), syrový token v ozvěně, levoboček pro vládkyni
(matka/otec) a jako dědic (syn/dcera, ne bratr/sestra), „vedlejší větev“ na plaketě, „dětí máme dost“
bezdětnému páru, ~35 míst s napevno „vládce/vládcův/vládci“ u královny, dědička v textech o dědici
(`{D:…}`), dítě na trůnu (bez manžela/manželky a bez námluv do 16 let), korunu se rozpadne (`{domain.nom}`),
rádce s ženským rodem (`{Q:}`, `{V:}`, `{Y:}`), šlechtic je „Pán/Paní“ v souhrnech a na Dvoře, žebříček
postavení podle pohlaví, Síň předků bez nabídky ambice a s „rok N“, vdovy od 24 let, varování před
nepokoji (stabilita < 28) a dřívější krize, důsledky u cizích zemí se ukazují (vztah / síla), obrázek hejtmana,
„snoubenci“, „Dvorní lékaři“, popisek náklonnosti a věrnosti, nápadnice bez „povahy rádce“.
Zbývá: císařství nemá vlastní obsah (jen dvě karty), výnos roku se opakuje ročně (~17 % karet), nápadnice
panovníka a muži pro vládkyni mají záložní portrét (dávka R6), vládkyně v poli řeší dvorské karty.

### Doplnění po 3. kole

Dále opraveno: kraj se jmenuje všude „Pobřežní marka“, konec „Rod vymřel“ (ne „Kolaps“), konec popravou zmiňuje rodinu
a text neúspěšného povstání nesedí s koncem, mimořádná daň se nenabízí při stabilitě ≤ 15, vlajky `regent` a
`rebellion` mizí po korunovaci, vedlejší větev ohlásí cenu v oznámení při nástupu, text výnosu roku se mění
každý rok, vládce v poli nepořádá další dvorské karty (čarodějnice, relikvie, prorok…), epiteton „Starý“ až po
3 letech vlády, tribut severu a „druhý rok“ ve vězení opraveny.
Zbývá: císařství bez obsahu, portréty R6, regentství při dítěti na trůnu, obrázky u narození levobočka a nástupnictví.
