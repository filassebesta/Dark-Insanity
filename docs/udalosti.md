# Insanity Kingdom — přehled událostí

Vygenerováno z `js/events*.js`. Jména v hranatých závorkách hra doplní podle aktuálního stavu.

Scénář **Panovník**: 82 událostí · Scénář **Šlechtic**: 32 událostí · Scénář **Sedlák**: 33 událostí (+ 3 krize, 2 ozvěny) · Krize: 7 · Ozvěny rozhodnutí: 17 · Povahy rádců a výchova: 5 · Obchod: 6 · Stavby: 16 (12 království, 4 grunt) · Zranění: 3 · Ambice: 1 (nabídka cílů) · Válka: 10 · Zbojníci: 3 · Velké rody a vazalové: 17 (11 pro Šlechtice, 15 pro Panovníka). Volby označené ⚔ se bojují po kolech s k6, ostatní riskantní volby se hází k%.

## Scénář Panovník

### 1. Spor dvou sedláků  `soud_o_mez`

> Před trůnem stojí dva sedláci, oba tvrdí, že mez mezi jejich poli je jinde, než říká ten druhý. Dvůr čeká na tvůj rozsudek.

1. Rozsoudit podle starých zápisů
2. Rozhodnout losem, ať se nehádají
3. Potrestat oba za obtěžování dvora

### 2. Posel k vazalovi  `posel_k_vazalovi`

> Vzdálený vazal otálí se složením přísahy věrnosti. Vysíláš k němu posla s dopisem — jakou cestou má jet?

1. Lesní stezka (45 % přepadení bandity)
2. Horský průsmyk (25 % sesuv a únava)
3. Obchodní cesta (10 % zdržení a mýto)

### 3. Rváči v krčmě  `rvaci_v_krcme`

> Skupina opilých žoldnéřů rozbíjí krčmu v hlavním městě a odmítá poslechnout stráže. Čekají na tvé rozhodnutí.

1. Vymlátit je vlastní rukou *(riskantní volba)*
2. Nechat to na stráže
3. Domluvit jim *(riskantní volba)*

### 4. Šeptání o tvrdé ruce  `sepot_o_tvrde_ruce`

> Mezi poddanými se šíří pověsti o tom, jak nemilosrdně jsi potrestal oba sedláky ze sporu o mez. Někteří tě za to chválí jako spravedlivého, jiní se bojí přijít se stížností.

1. Nechat pověsti být
2. Veřejně to vysvětlit lidu *(riskantní volba)*

### 5. Dožínky  `doziny`

> Sedláci žádají o svolení uspořádat dožínkovou slavnost na oslavu úrody. Kněz varuje, že jde spíš o staré pohanské zvyky než o vděk bohu.

1. Povolit slavnost
2. Zakázat a nařídit mši
3. Nechat ať se lid poradí s knězem *(riskantní volba)*

### 6. Varování kancléře  `varovani_kancelere`

> Kancléř(ka) [chancellor] varuje, že sýpky nejsou tak plné, jak by měly být, a přichází tvrdá zima.

1. Nakoupit obilí ze zahraničí
2. Snížit dávky pro posádky
3. Spolehnout se na zásoby

### 7. Zpráva špehmistra  `zprava_spehmistra`

> Špehmistr(yně) [spymaster] přichází s neklidnou zprávou: mezi šlechtici prý koluje řeč o spiknutí proti tvé vládě.

1. Nechat spiklence potajmu sledovat *(riskantní volba)*
2. Zatknout podezřelé rovnou
3. Nevěřit fámám

### 8. Vojenská přehlídka  `vojenska_prehlidka`

> Maršál(ka) [marshal] navrhuje uspořádat velkou přehlídku vojska, ať poddaní vidí sílu koruny.

1. Uspořádat nákladnou přehlídku
2. Skromná přehlídka
3. Odmítnout, šetřit na horší časy

### 9. Rada u soukromého slyšení  `rada_manzela`

> [spouse] žádá o slyšení mimo dvůr, s radou ohledně vedení království.

1. Vyslechnout a zvážit radu *(riskantní volba)*
2. Zdvořile odmítnout

### 10. Nájezd na hranici  `pohranicni_najezd`

> Jezdci z Východních marek přepadli osady na okraji Sokolího hvozdu. Pálí stodoly, odvádějí dobytek a mizí v lesích dřív, než dorazí stráž.

1. Vytáhnout s vojskem a pronásledovat je *(riskantní volba)*
2. Opevnit hranici a posílit posádky
3. Zaplatit markrabímu, ať své lidi zkrotí

### 11. Válka s Marcemi  `valka_s_markami`

> Markrabí z Východních marek vyhlásil válku. Jeho vojsko překročilo hranici a táhne Sokolím hvozdem k srdci království. Maršál(ka) [marshal] čeká na rozkaz.

1. Svolat korouhve a postavit se mu v poli *(riskantní volba)*
2. Vyjednat mír dřív, než teče krev *(riskantní volba)*
3. Stáhnout se do hradů a čekat

### 12. Vzpoura  `vzpoura_v_provincii`

> Provincie [provincie] povstala. Lid vyhnal královské výběrčí, na návsích hoří ohně a vůdci povstání žádají, aby k nim vládce přijel osobně.

1. Potlačit vzpouru vojskem *(riskantní volba)*
2. Vyjet za povstalci a vyjednávat *(riskantní volba)*
3. Ustoupit: snížit daně a dát amnestii

### 13. Lapkové ve hvozdu  `lapkove_ve_hvozdu`

> Kupci si stěžují, že na lesních cestách Sokolího hvozdu řádí banda lapků. Dvě karavany zmizely beze stopy a obchod s Východem vázne.

1. Vyslat jízdní oddíl *(riskantní volba)*
2. Najmout myslivce ze Sokolova *(riskantní volba)*
3. Ať si kupci najmou vlastní stráž

### 14. Hladomor  `hladomor`

> Kancléřovo varování se naplnilo. Sýpky zejí prázdnotou, v Brodné umírají staří a děti a před hradem stojí zástup hladových.

1. Otevřít královské zásoby
2. Nakoupit obilí za každou cenu
3. Nechat to na vůli Boží

### 15. Dýka ve tmě  `atentat`

> Špehmistr měl pravdu. V noci se do ložnice vplížil najatý vrah a jeho dýka se zaleskla ve světle svíce.

1. Bránit se holýma rukama *(riskantní volba)*
2. Křičet o pomoc a utéct chodbou

### 16. Soud se spiklenci  `soud_se_spiklenci`

> Spiklenci stojí v okovech před trůnem. Jsou mezi nimi i dva páni z mocných rodů. Šlechta napjatě čeká, jak vládce rozhodne.

1. Popravit všechny na náměstí
2. Udělit milost výměnou za přísahu *(riskantní volba)*
3. Vyhnat je ze země a zabavit majetek

### 17. Zával v dole  `zaval_v_dole`

> V Železné Huti se zřítila štola. Pod zemí zůstalo dvacet horníků a jejich ženy obléhají brány dolu. Správce dolu chce těžbu obnovit co nejdřív.

1. Zastavit těžbu a zachraňovat horníky
2. Pokračovat v těžbě jinou štolou
3. Vyšetřit, kdo šetřil na výdřevě *(riskantní volba)*

### 18. Mor v přístavu  `mor_v_pristavu`

> Z lodi z jihu vynesli námořníci horečku. V přístavní čtvrti Pobřežní marky leží desítky nemocných a opat z kláštera na útesu nabízí pomoc mnichů.

1. Uzavřít přístav a čtvrť
2. Povolat mnichy z kláštera *(riskantní volba)*
3. Nechat přístav otevřený, obchod musí běžet *(riskantní volba)*

### 19. Kupci z jihu  `kupci_z_jihu`

> Do Přístavu Mark připluli bohatí kupci z jihu. Nabízejí koření, hedvábí a zlato — výměnou za výsadu obchodovat bez cla.

1. Udělit výsadu
2. Smlouvat o lepší podmínky *(riskantní volba)*
3. Odmítnout, cizinci nemají výsady

### 20. Bohatá úroda  `bohata_uroda`

> V Brodné se letos urodilo jako nikdy. Stodoly praskají ve švech a kancléř(ka) [chancellor] se ptá, co s přebytkem.

1. Uložit do královských sýpek
2. Prodat obilí kupcům
3. Snížit dávky sedlákům

### 21. Krutá zima  `kruta_zima`

> Zima přišla brzy a tvrdě. Řeka zamrzla, cesty zapadly sněhem a v chudších čtvrtích umírají lidé zimou.

1. Rozdat dříví a teplé jídlo
2. Otevřít kostely jako útulky
3. Každý se musí postarat sám

### 22. Výchova dědice  `vychova_dedice`

> Dědic [heir] dorůstá a dvůr se přou, kdo by ho měl vychovávat. Na budoucím vládci záleží víc než na čemkoli jiném.

1. Svěřit ho maršálovi, ať se naučí boji
2. Svěřit ho kancléři, ať pozná správu země
3. Poslat ho do kláštera na útesu

### 23. Dědic dospěl  `dedic_dospel`

> Dědic [heir] dovršil šestnácti let. Je čas rozhodnout o jeho budoucnosti — a tím i o budoucnosti rodu [rod].

1. Domluvit sňatek se sousedním rodem
2. Svěřit dědici velení posádky na hranici *(riskantní volba)*
3. Ponechat ho u dvora po svém boku

### 24. Smrt rádce  `smrt_radce`

> Starý/á [rádce] [target] zemřel(a) ve věku [target] let. Dvůr truchlí — a zároveň už se šeptá, kdo usedne na uprázdněné místo.

1. Jmenovat zkušeného šlechtice
2. Povýšit mladého a oddaného služebníka

### 25. Nespokojený rádce  `nespokojeny_radce`

> [target], tvůj/tvoje [rádce], už neskrývá nespokojenost. Na dvoře se ví, že se schází s lidmi, kteří koruně nepřejí.

1. Uplatit ho zlatem a pozemky
2. Promluvit s ním mezi čtyřma očima *(riskantní volba)*
3. Zbavit ho úřadu

### 26. Biskupův desátek  `biskupuv_desatek`

> Biskup žádá, aby koruna odváděla církvi desátek i z výnosů dolů a přístavu. Hrozí, že jinak kněží z kazatelen připomenou lidu, kdo dává korunám požehnání.

1. Zaplatit desátek
2. Odmítnout — koruna nepodléhá biskupovi
3. Vyjednat polovinu *(riskantní volba)*

### 27. Turnaj  `turnaj`

> Šlechtici žádají o velký turnaj pod hradem. Rytíři z celé země i ze ciziny by se utkali o čest a přízeň dvora.

1. Uspořádat turnaj a sám vjet do klání *(riskantní volba)*
2. Uspořádat turnaj jen jako hostitel
3. Odmítnout, takové hry jsou plýtvání

### 28. Vyslanec z Marek  `cizi_vyslanec`

> Do síně vstoupil vyslanec markrabího v černém sametu. Nabízí věčný mír a spojenectví — pokud se rod [rod] spojí s markrabího rodem sňatkem.

1. Přijmout nabídku spojenectví
2. Odmítnout, koruna se nespojuje s nepřítelem
3. Protahovat jednání a získat čas *(riskantní volba)*

### 29. Horečka  `nemoc_vladce`

> Vládce [ruler] ulehl s horečkou. Dvorní lékař krouží nad lůžkem s pijavicemi, opat posílá mnichy a kupec z jihu nabízí lék z dalekých zemí.

1. Zkusit lék kupce z jihu *(riskantní volba)*
2. Svěřit se modlitbám mnichů *(riskantní volba)*
3. Odpočívat a nic neuspěchat

### 30. Dvorní šašek  `dvorni_blazen`

> Dvorní šašek při hostině zesměšnil hraběte z Brodné tak, že se smála celá síň. Hrabě rudý vzteky žádá, aby byl šašek potrestán.

1. Šaška zachránit, smích na dvoře je třeba
2. Vyhnat šaška ode dvora
3. Ať se šašek hraběti omluví veršem *(riskantní volba)*

### 31. Spor rádců  `spor_radcu`

> Kancléř(ka) [chancellor] a maršál(ka) [marshal] se před celou radou hádají. Jeden chce šetřit pokladnu, druhý žádá peníze na nové vojsko.

1. Dát za pravdu kancléřství
2. Dát za pravdu maršálovi
3. Najít kompromis a usmířit je *(riskantní volba)*

### 32. Dluhy dědice  `dedic_v_dluzich`

> Dědic [heir] prohrál v kostkách s kupci z přístavu víc, než by měl. Věřitelé stojí u brány a dvůr čeká, jak vládce zachrání čest rodu.

1. Dluh tiše zaplatit
2. Ať dědic dluh odpracuje u kancléře
3. Věřitele vyhnat — koruna nikomu nedluží

### 33. Narození dítěte  `krest_ditete`

> V hradní komnatě se narodilo zdravé dítě. Celý hrad je vzhůru, kněží chystají křest a šlechta posílá dary. Jak oslavit nový přírůstek rodu [rod]?

1. Velká slavnost pro celé město
2. Skromný křest v hradní kapli

### 34. Malíř u dvora  `portret_vladce`

> Do hradu přijel slavný malíř z ciziny. Nabízí, že vládce zvěční na portrétu, který bude viset v síni ještě sto let po jeho smrti.

1. Okázalý portrét v hermelínu a zlatě
2. Prostý portrét, jak vládce opravdu vypadá
3. Poslat malíře pryč

### 35. Dvojí hra  `zrada_spehmistra`

> Zachycený dopis ukazuje, že [target], tvůj/tvoje [rádce], prodává tajemství koruny markrabímu. Nikdo jiný o dopisu zatím neví.

1. Postavit zrádce před soud
2. Využít ho a krmit Marky lží *(riskantní volba)*

### 36. Prosba starého učitele  `prosba_ucitele`

> Starý učitel, který vládce kdysi učil číst, klečí v síni. Jeho syn byl chycen při krádeži v královské zbrojnici a čeká ho šibenice.

1. Udělit milost
2. Zákon platí pro všechny
3. Ať syn slouží v posádce na hranici

### 37. Žádost o hostinu  `hostina_slechty`

> Šlechtici se stěžují, že dvůr je smutný jako klášter. Žádají velkou hostinu, jakými byl dvůr předků proslulý.

1. Uspořádat hostinu, na jakou se nezapomíná
2. Skromná večeře v úzkém kruhu
3. Připomenout šlechtě, že doba je vážná

### 38. Vazal odmítá vojáky  `vazal_odmita_vojaky`

> Pán z Orlí Stráže měl podle přísahy poslat dvacet jezdců. Místo nich přišel dopis plný výmluv — a pod ním pečeť, která ani nebyla otištěna pořádně.

1. Přinutit ho silou *(riskantní volba)*
2. Přijmout místo vojáků zlato
3. Napsat mu dopis, jaký si zaslouží *(riskantní volba)*

### 39. Spor o dědictví  `spor_o_panstvi`

> Zemřel pán z Pobřežní marky a o jeho panství se přou dva bratranci. Starší má právo, mladší má schopnosti — a za oběma stojí půl provincie.

1. Rozhodnout pro staršího, podle práva
2. Rozhodnout pro schopnějšího
3. Rozdělit panství mezi oba *(riskantní volba)*

### 40. Šlechta odmítá daň  `slechta_odmita_dan`

> Kancléřství vyhlásilo novou daň z panství. Šlechtici se sjeli na hrad a jejich mluvčí prohlásil, že ani jeden groš nezaplatí, dokud se jich koruna nezeptá.

1. Trvat na dani
2. Daň zrušit
3. Svolat sněm a vyjednat poloviční daň *(riskantní volba)*

### 41. Rytíř bez pána  `potulny_rytir`

> U brány stojí rytíř v otlučené zbroji. Je to slavný Bořek z Hrádku, vítěz dvanácti turnajů, a hledá pána, kterému by sloužil.

1. Přijmout ho do služby
2. Poslat ho velet posádce ve hvozdu
3. Odmítnout, žoldnéřům se nevěří

### 42. Souboj na život a na smrt  `souboj_slechticu`

> Dva mladí šlechtici se pohádali kvůli dívce a žádají o souboj na život a na smrt. Podle starého práva jim ho vládce může povolit.

1. Povolit souboj
2. Souboj zakázat
3. Rozsoudit spor osobně *(riskantní volba)*

### 43. Krutý hrabě  `hrabe_utlacuje`

> Sedláci z Brodné prosí o pomoc. Jejich hrabě zdvojnásobil robotu, bere jim dobytek a jednoho z nich dal ubít jen proto, že mu nesmekl.

1. Hraběte potrestat
2. Věc vyšetřit *(riskantní volba)*
3. Nevměšovat se do věcí panství

### 44. Půjčka od kláštera  `zastava_lesa`

> Opat z kláštera na útesu nabízí koruně štědrou půjčku. Jako zástavu chce královské lesy v Sokolím hvozdu — jen na pár let, říká s úsměvem.

1. Půjčku přijmout
2. Odmítnout

### 45. Pretendent  `pretendent`

> V Pobřežní marce se objevil muž, který tvrdí, že je ztraceným synem předchozího krále a pravým dědicem trůnu. Shromažďuje kolem sebe nespokojence.

1. Veřejně ho usvědčit ze lži *(riskantní volba)*
2. Poslat vojáky a uvěznit ho
3. Koupit si ho zlatem a pozemky

### 46. Stávka cechů  `stavka_cechu`

> Cechy v hlavním městě zavřely dílny. Kováři, tkalci i pekaři žádají, aby koruna zakázala cizím řemeslníkům prodávat ve městě.

1. Vyhovět cechům
2. Rozehnat stávkující *(riskantní volba)*
3. Vyjednat nová pravidla trhu *(riskantní volba)*

### 47. Požár  `pozar_mesta`

> V noci vzplála dřevěná čtvrť pod hradem. Plameny skáčou ze střechy na střechu a lidé utíkají s tím, co unesou.

1. Poslat vojsko hasit
2. Postavit čtvrť znovu z kamene
3. Ať se měšťané postarají sami

### 48. Čarodějnice  `carodejnice`

> Vesničané z Brodné přivlekli k hradu starou bylinkářku. Obviňují ji, že očarovala dobytek a poslala na vesnici mor. Kněz žádá církevní soud.

1. Vydat ji církevnímu soudu
2. Propustit ji
3. Vyšetřit, co se dobytku doopravdy stalo *(riskantní volba)*

### 49. Zázrak u kláštera  `poutnik_zazrak`

> Poutník tvrdí, že u kláštera na útesu viděl plačící sochu svatého. Ke klášteru proudí davy poutníků a opat žádá o povolení stavět poutní kostel.

1. Podpořit pouť
2. Nechat zázrak prověřit *(riskantní volba)*
3. Pouť zakázat

### 50. Žebravý prorok  `zebravy_prorok`

> Na náměstí káže žebravý prorok. Hlásá, že rod [rod] vymře do sedmé zimy a že koruna je prokletá. Davy kolem něj rostou.

1. Nechat ho kázat
2. Uvěznit ho
3. Pozvat ho ke dvoru a promluvit si s ním *(riskantní volba)*

### 51. Velký trh v Brodě  `trh_v_brode`

> Na podzimní trh v Brodě se sjeli kupci z celé země. Kancléřství se ptá, jaké clo letos vybírat.

1. Snížit clo, ať trh roste
2. Zvýšit clo
3. Ponechat clo jako vždy

### 52. Most přes Brodnici  `most_pres_brodnici`

> Stavitelé navrhují postavit přes Brodnici kamenný most. Spojil by Brodnou s hlavním městem v každém ročním období — ale stál by majlant.

1. Postavit kamenný most
2. Postavit levnější dřevěný most
3. Most nestavět

### 53. Uprchlíci z Marek  `uprchlici`

> Na hranici stojí stovky uprchlíků z Marek, kde zuří hladomor a válka. Ženy, děti, starci — a mezi nimi možná i markrabího zvědové.

1. Přijmout je
2. Přijmout jen ty, kdo budou pracovat
3. Zavřít hranici

### 54. Lichvář  `lichvar`

> Bohatý lichvář z přístavu nabízí koruně půjčku. Peníze hned, splatit do tří let — s úrokem, o kterém se nemluví nahlas.

1. Půjčku přijmout
2. Odmítnout

### 55. Den splátky  `lichvar_splatka`

> Lichvář je zpátky. S úsměvem předkládá dlužní úpis — a částku, která je téměř dvojnásobkem půjčky.

1. Splatit celý dluh
2. Vyjednat odklad a nižší úrok *(riskantní volba)*
3. Lichváře vyhnat ze země

### 56. Katedrála  `katedrala`

> Biskup předkládá plány katedrály, jaká v celé zemi nemá obdoby. Stavba by trvala desítky let — a nesla by vládcovo jméno navěky.

1. Financovat stavbu
2. Přispět jen na základy
3. Odmítnout

### 57. Sekta v horách  `kacirska_sekta`

> Mezi horníky Železného Hřebene se šíří nová víra. Kazatelé hlásají, že kněží jsou zkažení a že Bůh mluví ke každému sám. Biskup žádá zásah.

1. Sektu vymýtit ohněm
2. Sektu tolerovat
3. Poslat do hor výmluvné kazatele *(riskantní volba)*

### 58. Relikvie  `relikvie`

> Kupec z jihu nabízí koruně relikvii: kost prstu svatého Václava v zlaté schránce. Cena je vysoká, ale biskup by ji vystavil v hlavním chrámu.

1. Relikvii koupit
2. Nechat pravost prověřit *(riskantní volba)*
3. Odmítnout

### 59. Opat žádá místo v radě  `opat_v_rade`

> Opat z kláštera na útesu žádá místo v královské radě. Prý aby koruna nezapomínala na Boha. Kancléř(ka) [chancellor] se tváří, jako by spolkl citron.

1. Přijmout opata do rady
2. Odmítnout

### 60. Zatmění slunce  `zatmeni`

> Za bílého dne zmizelo slunce. Lid v panice běží do kostelů, ptáci zmlkli a prorokové křičí, že nebesa soudí krále.

1. Vyjít mezi lid a promluvit *(riskantní volba)*
2. Nařídit mše ve všech kostelech
3. Ať dvorní hvězdář lidu vysvětlí, co se děje

### 61. Vzácný zajatec  `zajaty_syn_markrabiho`

> Hraniční hlídka zajala mladého muže, který se ukázal být synem markrabího. Teď sedí v hradní věži a celá země čeká, co s ním koruna udělá.

1. Žádat vysoké výkupné
2. Propustit ho bez výkupného
3. Držet ho jako rukojmí

### 62. Piráti u pobřeží  `pirati`

> U Šedého moře se objevily pirátské lodě. Přepadly dvě kupecké koráby a vyplenily rybářskou vesnici u kláštera.

1. Vyzbrojit lodě a vyplout proti nim *(riskantní volba)*
2. Opevnit přístav
3. Zaplatit pirátům, ať táhnou jinam

### 63. Dezertéři  `dezerteri`

> Skupina vojáků utekla z posádky na hranici a teď plení vesnice v Brodné. Prý jim nikdo nezaplatil žold.

1. Pochytat je a pověsit
2. Omilostnit je a vyplatit dlužný žold
3. Najmout je jako stráž karavan *(riskantní volba)*

### 64. Hlášení zvědů  `zvedove_v_horach`

> Zvědové hlásí, že za průsmykem v Železném Hřebeni táboří cizí vojsko. Nevědí čí, nevědí kolik — jen že dýmu z ohňů je víc, než by měli pastýři.

1. Posílit posádky v horách
2. Udeřit dřív než oni *(riskantní volba)*
3. Nevšímat si toho

### 65. Obléhání  `obleheni`

> Pod hradbami hlavního města stojí cizí vojsko. Obléhací stroje hrozí hradbám, studny jsou hlídané a zásoby se tenčí. Maršál(ka) [marshal] čeká na rozkaz.

1. Výpad z hradeb *(riskantní volba)*
2. Vydržet za hradbami *(riskantní volba)*
3. Vyjednat odchod obléhatelů

### 66. Žold  `zold`

> Vojáci se srotili před hradem. Žold jim chodí pozdě a v posledním měsíci vůbec. Maršál(ka) [marshal] varuje, že trpělivost vojska je u konce.

1. Vyplatit dlužný žold
2. Slíbit žold po sklizni *(riskantní volba)*
3. Potrestat vůdce srocení

### 67. Nové kuše  `nove_kuse`

> Zbrojíř z ciziny předvádí na nádvoří kuši, která prostřelí rytířskou zbroj na sto kroků. Nabízí vyzbrojit celé vojsko.

1. Koupit kuše pro celé vojsko
2. Koupit jen pro posádky na hranici
3. Odmítnout

### 68. Posunutý hraniční kámen  `hranicni_kamen`

> Sousední pán v noci posunul hraniční kámen o půl míle do královského lesa. Myslivci ze Sokolova to viděli na vlastní oči.

1. Vrátit kámen se zbraní v ruce *(riskantní volba)*
2. Vyjednat s ním
3. Nechat to být

### 69. Povodeň  `povoden`

> Jarní tání rozvodnilo Brodnici. Voda zaplavila pole v Brodné, strhla mlýny a ohrožuje trhové město.

1. Stavět hráze
2. Evakuovat lidi a zachránit zásoby
3. Počkat, až voda opadne

### 70. Sucho  `sucho`

> Od jara nezapršelo. Obilí v Brodné žloutne, studny vysychají a sedláci se modlí za déšť.

1. Kopat zavlažovací kanály z Brodnice
2. Uspořádat procesí za déšť *(riskantní volba)*
3. Nakoupit obilí do zásoby

### 71. Vlci  `vlci`

> Krutá zima vyhnala z hvozdu vlky. Smečka napadá ovce i lidi a v Sokolově už pohřbili dva pasáky.

1. Vyjet na hon osobně *(riskantní volba)*
2. Vypsat odměnu za každou vlčí hlavu
3. Ať se vesnice brání samy

### 72. Stříbrná žíla  `stribrna_zila`

> Horníci v Železné Huti narazili na žílu stříbra. Správce dolu chce těžit dnem i nocí, horníci žádají podíl na nálezu.

1. Těžit pro korunu dnem i nocí
2. Dát horníkům podíl

### 73. Kobylky  `kobylky`

> Od jihu se přihnal mrak kobylek. Kam dosednou, zůstane holá zem. Brodná přichází o úrodu před očima.

1. Zapálit ohně a zahánět je kouřem *(riskantní volba)*
2. Otevřít sýpky postiženým vesnicím
3. Modlit se za vysvobození

### 74. Spor o rybolov  `spor_rybaru`

> Rybáři z Pobřežní marky a mniši z kláštera na útesu se přou o lov ryb v zátoce. Obě strany mají staré listiny a obě tvrdí, že ta druhá je falešná.

1. Dát za pravdu rybářům
2. Dát za pravdu klášteru
3. Rozdělit zátoku podle dnů v týdnu *(riskantní volba)*

### 75. Zloděj v pokladně  `zlodej_v_pokladne`

> Z královské pokladny mizí peníze. Ne mnoho najednou, ale pravidelně. Kancléř(ka) [chancellor] tvrdí, že o ničem neví.

1. Tajně vyšetřit, kdo krade *(riskantní volba)*
2. Obvinit kancléřství z nedbalosti
3. Najmout nového pokladníka

### 76. Výročí vlády  `vyroci_vlady`

> Od nástupu vládce [ruler] na trůn uplynulo dalších pět let. Dvůr navrhuje oslavu, aby si lid připomněl, kdo mu vládne.

1. Velkolepá oslava
2. Vyhlásit amnestii a odpustit dluhy
3. Tichá mše za předky

### 77. Škola učenců  `skola_ucencu`

> Skupina učenců z ciziny žádá o povolení založit v hlavním městě školu. Učili by práva, počty a hvězdy — a kněží se mračí, že i věci, kterým rozumí jen Bůh.

1. Školu založit a financovat
2. Povolit, ale nepřispět
3. Zakázat

### 78. Nabídka sňatku  `cizi_princezna`

> Vzdálený král posílá posly s nabídkou: jeho dítě by se mohlo stát chotí dědice [heir]. Věno je štědré, ale ta země je daleko a její spory taky.

1. Přijmout nabídku
2. Zeptat se dědice, co chce
3. Odmítnout, rod potřebuje spojence blíž

### 79. Zmizelí myslivci  `zahada_v_lese`

> V hlubokém hvozdu za Sokolovem beze stopy zmizeli tři myslivci. Lidé mluví o lesních duších a nikdo se tam neodváží.

1. Vyslat oddíl, ať prohledá les *(riskantní volba)*
2. Poslat kněze, ať les vysvětí
3. Nechat to být

### 80. Kupecká gilda  `kupecka_gilda`

> Kupci z Přístavu Mark a Brodu chtějí založit gildu, která by sama určovala ceny a cla. Za to nabízejí koruně pravidelný příspěvek.

1. Gildu povolit
2. Povolit jen pod dohledem koruny *(riskantní volba)*
3. Zakázat

### 81. Poslední přání  `stary_rytir_umira`

> Starý rytíř, který bojoval po boku vládcova otce, umírá. Na smrtelném loži prosí, aby jeho syn mohl převzít jeho léno, ačkoli je to známý opilec a rváč.

1. Splnit poslední přání
2. Slíbit, ale léno dát jinému
3. Říct mu pravdu do očí

### 82. Ztracená listina  `ztracena_listina`

> V archivu se našla stará listina. Pokud je pravá, patří Železná Huť ve skutečnosti klášteru na útesu — a ne koruně.

1. Listinu tiše zničit
2. Nechat ji prověřit učenci *(riskantní volba)*
3. Vyjednat s opatem dohodu

### Klidné období (Panovník)

1. Zvelebit pole a cesty
2. Cvičit vojsko
3. Studovat listiny a kroniky
4. Objíždět provincie a naslouchat lidu

## Scénář Šlechtic

### 1. Povolávací list  `n_povolavaci_list`

> Královský posel přinesl list s pečetí krále [king]. Koruna táhne do pole a každý šlechtic má dodat muže podle velikosti svého panství.

1. Poslat muže do královského vojska
2. Vykoupit se štítným
3. Odmítnout — panství potřebuje své muže

### 2. Bitva pod královskou korouhví  `n_kralovska_bitva`

> Královské vojsko se střetlo s nepřítelem na rozbahněném poli. Tvá korouhev stojí na křídle a král sleduje boj z návrší.

1. Vést své muže osobně do první linie *(riskantní volba)*
2. Držet se v záloze a šetřit muže
3. Ukořistit nepřátelský tábor dřív než ostatní *(riskantní volba)*

### 3. Pozvání ke dvoru  `n_pozvani_ke_dvoru`

> Král [king] svolává šlechtu na svatodušní dvůr do Vlčího Údělu. Kdo nepřijede, jako by nebyl. Kdo přijede, musí se ukázat.

1. Přijet v plné nádheře *(riskantní volba)*
2. Přijet skromně a naslouchat
3. Omluvit se a zůstat na panství

### 4. Král na návštěvě  `n_kralova_navsteva`

> Král [king] se na cestě k moři zastaví na tvém panství. S ním přijede sto jezdců, dvůr, psi a sokoli — a všichni budou chtít jíst.

1. Uspořádat hostinu, na jakou se nezapomíná
2. Pohostit krále důstojně, ale skromně
3. Ukázat králi svou družinu na cvičišti *(riskantní volba)*

### 5. Královský výběrčí  `n_kraluv_vybirci`

> Královský výběrčí žádá mimořádnou berni na válku. Částka je vysoká a výběrčí se dívá po tvé pokladně, jako by ji už vážil.

1. Zaplatit celou berni
2. Zatajit část výnosů *(riskantní volba)*
3. Odmítnout — panství je vyčerpané

### 6. Obvinění u dvora  `n_obvineni_u_dvora`

> Rod [rod] obvinil tvůj rod před králem ze zpronevěry královské berně. Král si tě předvolává, aby ses hájil/hájila.

1. Obhájit se před králem *(riskantní volba)*
2. Udeřit zpátky tajemstvím, které o nich víš *(jen za určitých podmínek)*
3. Uplatit svědky

### 7. Úřad u dvora  `n_urad_u_dvora`

> Král [king] ti nabízí úřad nejvyššího komorníka. Přístup ke králi, ke královské pokladně — a nenávist všech, kdo o úřad stáli.

1. Přijmout úřad
2. Skromně odmítnout ve prospěch jiného rodu

### 8. Královská milost  `n_povyseni`

> Král [king] si předvolal [ruler] k trůnu. Za věrné služby chce rod [rod] povýšit mezi velmože země.

1. Přijmout s pokorou
2. Požádat i o další panství *(riskantní volba)*

### 9. Titul na prodej  `n_koupe_titulu`

> Královský pokladník naznačil, že pokladna je prázdná a že za dostatečný „dar“ by se našel titul velmože i pro rod, který o něj zatím nežádal.

1. Titul koupit
2. Odmítnout, titul se musí zasloužit

### 10. Král stůně  `n_nemoc_krale`

> Král [king] ulehl. Je mu [king] let a lékaři se tváří vážně. U dvora se začíná mluvit o tom, co bude dál — a kdo by mohl nosit korunu.

1. Navštívit krále a ujistit ho o věrnosti
2. Tiše začít shromažďovat příznivce
3. Poslat králi svého lékaře *(riskantní volba)*

### 11. Sňatek s korunou  `n_kralovsky_snatek`

> Královo dítě, princ/princezna [king], dospívá. Kdyby se tvůj dědic [heir] stal jeho chotí, krev rodu [rod] by jednou seděla na trůně.

1. Navrhnout sňatek králi *(riskantní volba)*
2. Nabídnout k sňatku i bohaté věno *(riskantní volba)* *(jen za určitých podmínek)*
3. Zatím vyčkat

### 12. Král je mrtev  `n_smrt_krale`

> Zvony Vlčího Údělu oznamují, že král [king] zemřel. Šlechta se sjíždí ke dvoru, koruna leží na polštáři v chrámu a všichni se dívají, kdo se k ní natáhne první.

1. Vznést nárok na trůn *(riskantní volba)* *(jen za určitých podmínek)*
2. Povstat se zbraní v ruce *(riskantní volba)* *(jen za určitých podmínek)*
3. Podpořit královského nástupce
4. Stát stranou a vyčkat

### 13. Noc dlouhých nožů  `n_prevrat`

> Spiknutí je připravené. Stráže na hradbách jsou podplacené, spojenci čekají na znamení a král [king] spí. Stačí jediný rozkaz.

1. Udeřit dnes v noci *(riskantní volba)*
2. Ještě vyčkat na lepší chvíli
3. Spiknutí rozpustit a zahladit stopy

### 14. Spor o mezníky  `n_spor_o_hranici`

> Lidé, kterým velí pán/paní [house] z rodu [rod], v noci posunuli hraniční kameny a zabrali tvým vsím louky u řeky.

1. Vytlačit je ozbrojenci *(riskantní volba)*
2. Žalovat u krále *(riskantní volba)*
3. Ustoupit a nechat jim louky

### 15. Nabídka spojenectví  `n_nabidka_spojenectvi`

> Pán/Paní [house] z rodu [rod] přijel/přijela s malým doprovodem a nabízí spojenectví. Spolu by vaše rody měly u dvora váhu, jakou žádný nemá sám.

1. Uzavřít spojenectví
2. Zdvořile odmítnout

### 16. Sňatek mezi rody  `n_snatkova_nabidka`

> Rod [rod] nabízí sňatek: tvůj dědic [heir] a jejich nejmladší potomek. Věno by bylo štědré a pouto mezi rody pevné.

1. Přijmout sňatek
2. Odmítnout — dědic je určen pro vyšší cíle

### 17. Ozbrojenci na tvé půdě  `n_najezd_rodu`

> Ozbrojenci rodu [rod] vpadli do tvých vsí, vypálili stodolu a odehnali dobytek. Tvrdí, že jen vymáhají starý dluh.

1. Vyjet proti nim s družinou *(riskantní volba)*
2. Stěžovat si u krále *(riskantní volba)*
3. Zaplatit „dluh“ a mít klid

### 18. Žádost o půjčku  `n_pujcka_rodu`

> Pán/Paní [house] z rodu [rod] se ocitl/ocitla v nesnázích a žádá o půjčku. Prý to vrátí do žní. Prý.

1. Půjčit bez úroku *(jen za určitých podmínek)*
2. Půjčit za zástavu pozemků *(riskantní volba)* *(jen za určitých podmínek)*
3. Odmítnout

### 19. Hostina u sousedů  `n_hostina_rodu`

> Rod [rod] zve na velkou hostinu na své sídlo. Bude tam půl šlechty země — a víno, které rozvazuje jazyky.

1. Jet a získat přízeň hostitelů *(riskantní volba)*
2. Jet a naslouchat opilým jazykům
3. Poslat omluvu

### 20. Pomluvy  `n_pomluvy`

> Po dvoře se šíří pomluvy, že tvůj rod pochází z koňských handlířů a že dědic [heir] není vlastní krve. Stopa vede k rodu [rod].

1. Odpovědět stejnou mincí *(riskantní volba)*
2. Umlčet je tajemstvím, které o nich víš *(jen za určitých podmínek)*
3. Mlčet a nechat pomluvy vyšumět

### 21. Dopis, který neměl být nalezen  `n_nalezeny_dopis`

> Kancléř(ka) [chancellor] přinesl zachycený dopis rodu [rod]. Je v něm dost na to, aby někdo přišel o hlavu.

1. Dopis si nechat pro pozdější chvíli
2. Předat dopis králi
3. Vrátit dopis tiše pisateli

### 22. Tajemství v truhle  `n_vydirani`

> V železné truhle rodu leží listina, která by mohla zničit rod [rod]. Špehmistr(yně) [spymaster] se ptá, zda nenastal čas ji použít.

1. Vydírat je o zlato
2. Přinutit je podpořit tvůj nárok
3. Listinu spálit — takové zbraně se nepoužívají

### 23. Pozvání do tmy  `n_spiklenci_zvou`

> Maskovaný posel předal pozvání na schůzku v opuštěné kapli. Nespokojení šlechtici hledají někoho, kdo by se postavil proti králi [king].

1. Přidat se ke spiklencům
2. Udat spiklence králi
3. Na schůzku nejít a mlčet

### 24. Velitel stráží  `n_podplatit_straze`

> Spiklenci potřebují velitele královské stráže. Je chamtivý, ale není hloupý — a ví, jak vysoko visí šibenice.

1. Uplatit ho zlatem *(jen za určitých podmínek)*
2. Přesvědčit ho, že je to správné *(riskantní volba)*
3. Najít jinou cestu

### 25. Jazyk, který se rozvázal  `n_spiklenec_zradil`

> Jeden ze spiklenců se v krčmě opil a mluvil. Zatím ho poslouchali jen sedláci, ale do rána to může vědět celý dvůr.

1. Umlčet ho dřív, než bude pozdě *(riskantní volba)*
2. Předejít mu a přiznat se králi
3. Zapírat a doufat *(riskantní volba)*

### 26. Zrádce mezi svými  `n_zradce_v_radach`

> [target], tvůj/tvoje [rádce], se tajně schází s lidmi krále. Pokud o něčem ví, může to rodu [rod] zlomit vaz.

1. Uplatit ho, aby mlčel
2. Zbavit ho služby
3. Krmit ho falešnými zprávami *(riskantní volba)*

### 27. Mlýn na potoce  `n_mlyn`

> Sedláci musí vozit obilí k mlýnu Bílé Brány a platit mlynářovi třetinu. Tvůj purkrabí navrhuje postavit vlastní mlýn na potoce pod tvrzí.

1. Postavit mlýn
2. Pronajmout stavbu mlynáři
3. Nestavět

### 28. Pytláci  `n_pytlaci`

> Hajní chytili v panském lese tři pytláky s jelenem. Jsou to hladoví otcové rodin z tvé vlastní vsi.

1. Pověsit je pro výstrahu
2. Uložit pokutu a robotu navíc
3. Propustit je a dát jim jelena

### 29. Kamenný hrad  `n_kamenny_hrad`

> Stará dřevěná tvrz se rozpadá. Stavitel z Vlčího Údělu přinesl plány kamenného hradu s věží, jaký by se nestyděl ani velmož.

1. Postavit kamenný hrad *(jen za určitých podmínek)*
2. Opravit tvrz a postavit palisádu
3. Nic nestavět

### 30. Robota  `n_robota`

> Sedláci z tvých vsí odmítají chodit na robotu. Tvrdí, že žně jsou krátké a že na panských polích nemají čas na svá vlastní.

1. Trvat na robotě
2. Ulevit jim od roboty
3. Vyjednat s rychtáři *(riskantní volba)*

### 31. Trhové právo  `n_trzni_pravo`

> Měšťané z přístavní vsi chtějí každý týden pořádat trh. Na trhové právo je ale potřeba královo svolení — a král ho nedává zadarmo.

1. Požádat krále o trhové právo *(riskantní volba)*
2. Pořádat trh i bez svolení

### 32. Neúroda  `n_spatna_uroda`

> Letní deště spálily obilí na stéblech. Sýpky na panství zůstanou poloprázdné a zima bude dlouhá.

1. Snížit sedlákům dávky
2. Nakoupit obilí od Bílé Brány
3. Trvat na plných dávkách

### Klidné období (Šlechtic)

1. Spravovat panství
2. Cvičit družinu
3. Psát dopisy ke dvoru
4. Studovat rodokmeny a staré listiny

## Krize (oba scénáře)

Přijdou samy, když některý zdroj klesne téměř na nulu. Stejná krize se může vrátit nejdřív po třech letech.

### 1. Prázdná pokladna  `krize_pokladna`

> Truhly v pokladnici zejí prázdnotou. [chancellor.Title] [chancellor.name] rozkládá ruce: na žold není, na dluhy není, na zítřek není. Vojáci si už šeptají a věřitelé buší na bránu.

1. Zabavit stříbro z kostelů
2. Zvýšit dávky poddaným
3. Propustit část vojska
4. Prosit krále o odklad dávek

### 2. Hladové bouře  `krize_hlad`

> Sýpky jsou vymetené do posledního zrnka. V ulicích se lidé bijí o chleba a dav s prázdnými mísami a holemi se valí k bráně hradu.

1. Koupit obilí za každou cenu
2. Zabavit zásoby kupcům a klášterům
3. Rozehnat dav vojskem
4. Vyjít k lidu a sdílet s ním vlastní stůl

### 3. Bezbranní  `krize_vojsko`

> Korouhve visí na prázdných kopích. Zbylo jen pár starých strážných a zvědové hlásí, že za hranicí si toho už všimli.

1. Najmout žoldnéře
2. Povolat sedláky ke zbrani
3. Spolehnout se na hradby a štěstí

### 4. Prázdné kostely  `krize_vira`

> Kostely zejí prázdnotou a na návsích káže potulný kazatel, že rod [dynastyName] je Bohem zavržený. Lidé mu naslouchají a kněží se bojí vyjít ze sakristie.

1. Postavit nový chrám
2. Poslat proti němu učené kněze
3. Kazatele zatknout

### 5. Terč posměchu  `krize_posmech`

> Po krčmách i šlechtických síních se zpívá posměšná píseň o rodu [dynastyName]. Kdo se dřív bál, teď se směje, a kdo se směje, ten neposlechne.

1. Uspořádat velkolepé slavnosti
2. Vyzvat autora písně na souboj
3. Nechat je zpívat

### 6. Trůn se otřásá  `krize_uchvatitel`

> Na sněmu zazněla otázka, kterou se dřív nikdo neodvážil vyslovit nahlas: má [ruler.name] vůbec právo nosit korunu? Páni si to šeptají a čekají, kdo se ozve první.

1. Nechat se znovu korunovat v katedrále
2. Svolat sněm a žádat přísahu věrnosti
3. Umlčet pochybovače

### 7. Poslední varování  `krize_nemilost`

> Královský herold přivezl list s pečetí, která se neodmítá. [king.name] píše krátce: ještě jedno provinění a panství rodu [dynastyName] připadne koruně. U dvora se prý už dělí o tvé louky.

1. Odjet ke dvoru a pokořit se
2. Poslat králi bohatý dar
3. Požádat spojence o přímluvu
4. Odpovědět hrdě

## Ozvěny rozhodnutí

Vrátí se po letech, když hráč dříve zvolil uvedenou možnost.

### 1. Splacená přísaha  `ozvena_omilostneny`

*Spouští: `soud_se_spiklenci` → „Udělit milost výměnou za přísahu“ (při úspěchu) · za 2,5–5 let*

> U brány čeká muž, kterého koruna kdysi omilostnila na soudu se spiklenci. Prošedivěl, ale přísahu nezapomněl: přináší jména lidí, kteří chystají vraždu. Za svou věrnost žádá jediné, místo u dvora.

1. Odměnit ho místem u dvora
2. Jména prověřit a pak se rozhodnout
3. Kdo zradil jednou, zradí znovu

### 2. Hrdina od brodu  `ozvena_syn_ucitele`

*Spouští: `prosba_ucitele` → „Ať syn slouží v posádce na hranici“ · za 2–4 let*

> Z hranice přišla zpráva o hrdinském činu. Syn starého učitele, kterého koruna kdysi místo žaláře poslala do posádky, ubránil s hrstkou mužů brod před nájezdníky. Vojáci ho nosí na ramenou a žádají pro něj rytířský pás.

1. Pasovat ho na rytíře
2. Jmenovat ho velitelem posádky
3. Odměnit ho jen zlatem

### 3. Děti hladu  `ozvena_deti_hladu`

*Spouští: `hladomor` → „Nechat to na vůli Boží“ · za 3–5 let*

> Ve hvozdech řádí banda, které lidé říkají Děti hladu. Jsou to sirotci z hladomoru, kdy koruna nechala lid na vůli Boží. Vyrostli, zatvrdli a teď berou to, co jim tehdy nikdo nedal.

1. Vyslat vojsko a bandu vyhladit
2. Nabídnout jim milost a půdu
3. Vypsat odměnu za jejich hlavy

### 4. Dluh cti  `ozvena_markrabi`

*Spouští: `zajaty_syn_markrabiho` → „Propustit ho bez výkupného“ · za 2,5–4,5 let*

> Z Marek přijel posel s nečekanou zprávou. Mladý zajatec, kterého koruna kdysi propustila bez výkupného, se stal markrabím. Píše, že dluh cti nezapomněl, a nabízí mír na deset let.

1. Přijmout mír
2. Žádat raději spojenectví a vojáky
3. Odmítnout, Marky jsou nepřítel

### 5. Píseň o krvavém dni  `ozvena_masakr`

*Spouští: `vzpoura_v_provincii` → „Potlačit vzpouru vojskem“ (při úspěchu) · za 2,5–4,5 let*

> V kraji [province.name] se zpívá píseň o dni, kdy koruna potlačila vzpouru mečem. Děti padlých dospěly a jejich hněv nezestárl. Na zdech kostelů se objevují nápisy proti koruně.

1. Postavit kapli za padlé a vyhlásit smír
2. Nápisy smýt a pisatele potrestat
3. Poslat do kraje výmluvného vyslance

### 6. Návrat z kláštera  `ozvena_klaster_dedic`

*Spouští: `vychova_dedice` → „Poslat ho do kláštera na útesu“ · za 2–3,5 let*

> [heir.name] se vrací z kláštera na útesu. Mluví latinsky, zná zákony i hvězdy. Opat v dopise připomíná, že taková výchova si zaslouží vděčnost, konkrétně pozemky u Brodnice.

1. Darovat klášteru pozemky
2. Poděkovat, ale nic nedat
3. Jmenovat dědice do královské rady

### 7. Obvyklá platba  `ozvena_pirati`

*Spouští: `pirati` → „Zaplatit pirátům, ať táhnou jinam“ · za 1,5–3 let*

> Piráti jsou zpátky. Tentokrát nečekají na vyjednávání, přišli si pro „obvyklou platbu“. Kdo zaplatí jednou, platí navždy, smějí se v přístavních krčmách.

1. Zaplatit znovu
2. Vyplout proti nim
3. Opevnit přístav

### 8. Dluh se splácí  `ozvena_bylinkarka`

*Spouští: `carodejnice` → „Propustit ji“ · za 1,5–3,5 let*

> Na dvoře propukla horečka a ranhojiči si nevědí rady. Pak se u brány objevila žena, kterou koruna kdysi odmítla vydat církevnímu soudu. Nese byliny a říká, že dluh se splácí.

1. Pustit ji k nemocným
2. Svěřit nemocné kněžím
3. Vzít ji do služby jako dvorní ranhojičku

### 9. Vydejte nám je  `ozvena_uprchlici`

*Spouští: `uprchlici` → „Přijmout je“ · za 2–4 let*

> Vesnice uprchlíků z Marek vzkvétá. Pole jsou zoraná, řemeslníci pracují a daně se platí. Teď ale přijel vyslanec z Marek a žádá jejich vydání, prý jsou to markraběcí nevolníci.

1. Odmítnout, jsou to teď naši lidé
2. Vydat je
3. Vyplatit markrabímu odstupné

### 10. První učenci  `ozvena_ucenci`

*Spouští: `skola_ucencu` → „Školu založit a financovat“ · za 2,5–4,5 let*

> Z královské školy vyšli první učenci. Jeden předkládá návrh na nové mlýny na Brodnici, druhý chce zmapovat rudné žíly v horách a třetí tvrdí, že umí léčit dobytčí mor.

1. Podpořit mlýny
2. Podpořit mapování hor
3. Vzít do služeb koruny všechny tři

### 11. Zlomený slib  `ozvena_zlomeny_slib`

*Spouští: `stary_rytir_umira` → „Slíbit, ale léno dát jinému“ · za 2–3,5 let*

> Syn starého rytíře se dozvěděl, že slib daný jeho otci na smrtelné posteli byl lež. Vyzval nového lenního pána na souboj a celý kraj stojí na jeho straně.

1. Vrátit synovi léno
2. Povolit souboj, ať rozhodne Bůh
3. Syna uvěznit pro vzpouru

### 12. Most se zřítil  `ozvena_most`

*Spouští: `most_pres_brodnici` → „Postavit levnější dřevěný most“ · za 2–3,5 let*

> Dřevěný most přes Brodnici, postavený co nejlevněji, se zřítil pod kupeckou karavanou. Utopilo se pět vozků a s nimi zboží za stovky zlatých. Kupci žádají náhradu.

1. Zaplatit náhradu a postavit most z kamene
2. Opravit dřevěný most
3. Odmítnout, řeka je vůle Boží

### 13. Stará laskavost  `ozvena_n_pytlaci`

*Spouští: `n_pytlaci` → „Propustit je a dát jim jelena“ · za 1,5–3 let*

> Bývalí pytláci, které rod [dynastyName] kdysi propustil i s jelenem, přiběhli za svítání. V lesích na hranici panství táboří ozbrojenci, kteří nevypadají jako lovci. Pytláci znají každou stezku a nabízejí, že k nim družinu dovedou.

1. Vést družinu jejich stezkami
2. Přijmout je do služby jako myslivce
3. Varovat sousední rody

### 14. Vděčnost sousedů  `ozvena_n_vdecny_rod`

*Spouští: `n_pujcka_rodu` → „Půjčit bez úroku“ · za 1,5–3 let*

> [house.HeadTitle] [house.head] z rodu [house.name] nezapomněl na půjčku bez úroku, kterou rod kdysi v nouzi dostal. U královského dvora teď jeho lidé mluví o rodu [dynastyName] jen v dobrém a na tvrz dorazil dar.

1. Přijmout dar
2. Požádat je raději o přímluvu u krále
3. Navrhnout spojenectví

### 15. Bedýnka bez erbu  `ozvena_n_pisatel`

*Spouští: `n_nalezeny_dopis` → „Vrátit dopis tiše pisateli“ · za 1,5–3 let*

> Do tvrze dorazila bedýnka bez erbu. Leží v ní list od pisatele dopisu, který rod [dynastyName] kdysi tiše vrátil, místo aby ho zneužil. Stojí v něm jen: „Dluh splácím tím nejcennějším, co mám.“ Pod tím jsou jména, data a částky.

1. Ponechat si tajemství
2. Předat listinu králi jako důkaz věrnosti
3. Spálit ji, dluh je splacen

### 16. Krev za krev  `ozvena_n_pomsta`

*Spouští: `n_spiklenci_zvou` → „Udat spiklence králi“ · za 2–3,5 let*

> Spiklenci, které rod [dynastyName] kdysi udal králi, skončili na popravišti. Jejich příbuzní ale ne. [spymaster.Title] [spymaster.name] přináší zprávu: najatý vrah už je na cestě.

1. Nastražit na něj past
2. Zdvojit stráže a nevycházet
3. Požádat krále o ochranu

### 17. Cepy pod hradbami  `ozvena_n_rychtar`

*Spouští: `n_robota` → „Trvat na robotě“ · za 2–3,5 let*

> Rychtář, který kdysi prosil o úlevu od roboty, už neprosí. Svolal sedláky ze všech vesnic panství a s cepy a vidlemi stojí pod hradbami tvrze. Chtějí zpět staré právo, nebo hlavu výběrčího.

1. Ulevit jim od roboty
2. Rozehnat je družinou
3. Vydat jim výběrčího

## Scénář Sedlák

Poddaný na gruntu ve vsi Lipnice. Cíl: svoboda (svobodník) a pak erb (drobný šlechtic), poté hra pokračuje jako Šlechtic.

### 1. Robota  `s_robota`

> Panský dráb obchází ves s holí v ruce. Na panském poli se žne a [lord.title] [lord.name] chce tři dny roboty navíc. Tvé vlastní obilí přitom stojí na poli a čeká.

1. Jít a odvést poctivou práci
2. Poslat místo sebe čeleď
3. Vymluvit se na nemoc

### 2. Dráb si přišel  `s_drab`

> Panský dráb stojí na zápraží a tvrdí, že dávky jsou letos vyšší. Na listině nic takového není, ale on číst umí a ty ne. Aspoň si to myslí.

1. Zaplatit, ať je pokoj
2. Trvat na tom, co stojí v listině
3. Vyhodit ho ze dvora

### 3. Pán projíždí vsí  `s_pan_navsteva`

> [lord.Title] [lord.name] projíždí s družinou vsí Lipnice a zastavil se právě u tvého gruntu. Koně jsou žízniví, družina hladová a pánův pohled zkoumá tvou stodolu.

1. Pohostit družinu tím nejlepším
2. Schovat dobrou úrodu a ukázat bídu
3. Postěžovat si na drába

### 4. Panský hon  `s_pansky_hon`

> Panský hon se řítí přes tvé pole. Psi, koně a pánovi hosté dupou v obilí, které mělo živit tvou rodinu přes zimu.

1. Protestovat u pána
2. Mlčet a sbírat, co zbylo
3. Nabídnout se jako honec za groš

### 5. Jelen v panském lese  `s_pytlactvi`

> Zásoby docházejí a v panském lese se pase jelen. Stačí jedna noc, jedna smyčka a nikdo se to nedozví. Za pytláctví se ale věší.

1. Jít v noci do lesa
2. Požádat pána o obilí na dluh
3. Utáhnout opasky

### 6. Sedláci se bouří  `s_povstani`

> V okolních vsích se sedláci bouří proti robotě. Vůdce povstání čeká v krčmě u [spymaster.name] a hledá muže, kteří se nebojí. Kdo se přidá, může vyhrát svobodu. Nebo provaz.

1. Přidat se k povstání
2. Zůstat stranou
3. Udat vůdce pánovi

### 7. Nový rychtář  `s_rychtar_volba`

> Starý rychtář už nevidí ani na listinu, natož na sousedy. Ves volí nového a několik hlasů padlo i na tebe. Rychtář má od pána groš a od vsi starosti.

1. Ucházet se o úřad
2. Podpořit souseda

### 8. Trh v Brodné  `s_trh`

> V Brodné je velký trh. Kupci z jihu, kováři, dobytkáři i šejdíři. S trochou štěstí se tu dá vydělat. S trochou smůly přijít o všechno.

1. Prodat tele
2. Koupit nový pluh
3. Smlouvat o lepší kus dobytka

### 9. Krupobití  `s_krupobiti`

> Z černého mraku se sypaly kroupy velké jako holubí vejce. Obilí leží rozmlácené v blátě a do žní daleko.

1. Rychle zasít znovu
2. Prosit pána o odpuštění dávek
3. Uspořádat procesí za dobrou úrodu

### 10. Slabé žně  `s_spatna_uroda`

> Letošní žně jsou slabé. Sýpka se plní pomalu a zima bude dlouhá. Čeleď se ptá, jestli přes zimu dostane najíst.

1. Propustit část čeledi
2. Prodat krávu
3. Vydržet a šetřit

### 11. Hoří stodola  `s_pozar_stodoly`

> V noci chytila stodola. Jestli od lucerny, od blesku, nebo od souseda Hrubého, se kterým se léta přeš o mez, nikdo neví.

1. Postavit ji znovu se sousedy
2. Postavit ji sám bez cizí pomoci
3. Obvinit souseda Hrubého

### 12. Vlci u ovčína  `s_vlci`

> Za mrazivých nocí chodí vlci až k ovčínu. Dvě ovce už chybí a psi se bojí vyjít ven.

1. Počkat na ně s kopím
2. Nastražit oka a jámy
3. Zavřít stádo a čekat na jaro

### 13. Mor v kraji  `s_mor`

> Z Brodné přišla zpráva, kterou nikdo nechtěl slyšet: mor. Ve vedlejší vsi už zvoní umíráček každý den.

1. Zavřít grunt a nikoho nepouštět
2. Utéct s rodinou do lesa
3. Pomáhat nemocným ve vsi

### 14. Mlynář šidí  `s_mlynar`

> Z pytle obilí se vrátilo míň mouky, než by mělo. Mlynář krčí rameny: mlýn prý ztrácí. Jenže jen tvoje obilí.

1. Postavit se mu na mlýnici
2. Vozit obilí do jiného mlýna
3. Mlčet

### 15. Cizí osivo  `s_kramar`

> Potulný kramář nabízí osivo z jihu. Prý roste dvakrát rychleji a snese sucho i mráz. Prý.

1. Koupit a zkusit to
2. Poslat ho dál

### 16. Hrnec v brázdě  `s_poklad`

> Pluh zavadil o něco tvrdého. V brázdě leží rozbitý hliněný hrnec a v něm stříbrné mince s tváří krále, kterého nikdo nepamatuje. Všechno, co je v zemi, patří pánovi.

1. Nechat si ho a mlčet
2. Odevzdat ho pánovi
3. Darovat ho kostelu

### 17. Peníze na dluh  `s_lichvar`

> Lichvář z Brodné nabízí půjčku. Dvacet grošů hned, splatit za dva roky. O úroku se mluví potichu.

1. Půjčku vzít
2. Odmítnout

### 18. Lichvář je zpátky  `s_lichvar_splatka`

> Lichvář stojí na zápraží s knihou pod paží. Dvacet grošů se za dva roky proměnilo ve třicet.

1. Splatit všechno
2. Vyjednat odklad
3. Dát mu do zástavy pole

### 19. Horečka  `s_nemoc_ditete`

> [heir.name] leží v horečce a nepoznává ani vlastní mámu. Do rána se rozhodne. Pomoc je drahá, a ta nejlevnější je kořenářka za lesem.

1. Poslat pro kořenářku
2. Pozvat faráře k modlitbám
3. Přivést ranhojiče z Brodné

### 20. Čemu se bude učit  `s_vychova`

> [heir.name] dorůstá. [marshal.Title] [marshal.name] nabízí učení v kovárně, farář místo v klášterní škole a doma je práce pro dva.

1. Do učení v kovárně
2. Do klášterní školy
3. Nechat doma na gruntu

### 21. Svatba ve vsi  `s_svatba`

> Sousedova dcera se vdává a celá ves je pozvaná. Kdo vystrojí hostinu nebo přinese bohatý dar, o tom se bude mluvit do příštích žní.

1. Nabídnout dvůr a stoly na hostinu
2. Přinést pěkný dar
3. Zůstat doma u práce

### 22. Mez se posunula  `s_spor_o_mez`

> Soused Hrubý přeoral mez o dobré tři brázdy. Tvrdí, že tam vždycky byla. Kámen, který ji značil, se nějak ztratil.

1. Jít za rychtářem
2. Vyřídit si to s Hrubým po svém
3. Ustoupit, pro pár brázd se nehádat

### 23. Pomluva  `s_carodejnictvi`

> Sousedce pošla kráva a ves si šeptá, že [spouse.name] byl večer u jejího chléva. Farář se ptá, kdo v rodě [dynastyName] umí zaříkávat.

1. Postavit se pomluvě před celou vsí
2. Zaplatit faráři za mši a svěcenou vodu
3. Nechat to na faráři

### 24. Večer v krčmě  `s_krcma`

> V krčmě se pije, hraje v kostky a mluví. [spymaster.Title] [spymaster.name] ti nalévá a mrkne: kdo si dnes připlatí, ten zítra něco ví.

1. Zaplatit pár piv a poslouchat
2. Zahrát si v kostky
3. Jít domů včas

### 25. Nový zvon  `s_zvon`

> Starý zvon na kostelíku praskl. Farář obchází ves a vybírá na nový. Kdo přispěje nejvíc, toho jméno bude vyryto na okraji zvonu.

1. Přispět štědře
2. Odpracovat to při stavbě
3. Nedat nic

### 26. Desátek  `s_desatek`

> Farář přišel pro desátek. Každý desátý snop patří kostelu, tak to bylo vždycky. Letos je ale snopů málo a farář tlustý.

1. Zaplatit celý desátek
2. Vyjednat polovinu
3. Odmítnout

### 27. Odvod  `s_odvod`

> Král [king.name] táhne do války a [lord.title] [lord.name] musí dodat muže. Z každého gruntu jednoho. Kdo půjde, může se vrátit s kořistí, se slávou, nebo vůbec.

1. Jít osobně
2. Poslat čeledína
3. Vykoupit se

### 28. Bitva  `s_bitva`

> Pod korouhví krále stojíš v první řadě sedláků s kopím v ruce. Naproti se řadí jezdci v železe. Rytíři za vašimi zády čekají, kdo uteče první.

1. Vrhnout se do první řady
2. Vrhnout se do první řady
3. Držet se vzadu a přežít
4. Plenit nepřátelský tábor

### 29. Výkup z poddanství  `s_vykup`

> V truhle pod postelí leží víc grošů, než kdy rod [dynastyName] měl. Za ně se dá koupit to nejcennější: svoboda. [lord.Title] [lord.name] je ochoten jednat.

1. Zaplatit pánovi plnou cenu
2. Smlouvat o cenu
3. Ještě počkat

### 30. Pole na prodej  `s_pole`

> Sousední grunt zůstal bez hospodáře a pole jdou na prodej. Svobodný člověk smí kupovat půdu. Poddaný o tom může jen snít.

1. Koupit pole
2. Nechat to být

### 31. Zemanský statek  `s_zemansky_statek`

> Starý zeman z Pobřežní marky zemřel bez dědiců a jeho tvrz je na prodej i s právem erbu. Kdo ji koupí a dostane královo potvrzení, bude šlechtic. Peníze máš. Královská kancelář ale sedlákům nerada věří.

1. Koupit tvrz a žádat o erb
2. Ještě ne

### 32. Rytířský pás  `s_pasovani`

> Královský maršál si pamatuje svobodného sedláka z bitvy. Na králův pokyn tě zve ke dvoru: kdo bojuje jako rytíř, může jím být. Za pás se ale platí věrnou službou koruně.

1. Pokleknout a přijmout pás
2. Odmítnout, grunt je víc než meč

### 33. Všední dny  `s_klidne_obdobi`

> Nic zvláštního se neděje. Dráb nechodí, nebe je klidné a práce na gruntu je pořád dost. Čemu se [ruler.name] letos věnuje?

1. Pracovat na poli od tmy do tmy
2. Opravit stavení a ohrady
3. Chodit mezi sousedy
4. Naučit se počítat od rychtáře

### Krize a ozvěny sedláka

### 1. Prázdná komora  `krize_s_hlad`

> V komoře nezbyl ani pytel mouky. Děti pláčou hlady a čeleď se dívá ke dveřím.

1. Porazit krávu
2. Prosit pána o obilí
3. Propustit čeleď

### 2. Ani groš  `krize_s_bida`

> Měšec je prázdný a do pánovy pokladny se platí v grošech, ne v pláči.

1. Prodat dobytek
2. Najmout se na panský dvůr za mzdu
3. Půjčit si od rychtáře

### 3. Hrozba vyhnání  `krize_s_nemilost`

> Dráb přinesl vzkaz: [lord.title] [lord.name] má rodu [dynastyName] dost. Ještě jedna stížnost a grunt dostane jiný hospodář.

1. Jít na panský dvůr a prosit
2. Přinést pánovi dar
3. Odvést robotu navíc

### 4. Kdo viděl hrnec  `ozvena_s_poklad`

> Krčmářův syn tenkrát pásl husy u tvého pole a viděl, co jsi vyoral. Teď chce podíl. Jinak to řekne drábovi.

1. Zaplatit mu za mlčení
2. Zapírat
3. Přiznat se pánovi

### 5. Jidáš z Lipnice  `ozvena_s_udavac`

> Ves nezapomněla, kdo udal vůdce povstání. Na vratech je namalovaný provaz, v kostele si nikdo nesedne vedle tebe a dnes ráno ležel na prahu mrtvý pes.

1. Uspořádat hostinu pro celou ves
2. Požádat pána o ochranu
3. Snést to

## Povahy rádců a výchova dědice

Události podle povahy rádců běží ve všech scénářích, výchova dědice je u šlechtice.

### 1. Ruka v truhle  `q_chamtivost`

> Z truhly s penězi rodu [dynastyName] mizí víc, než by se dalo svést na myši. Stopy vedou k jedinému člověku: [target.role] [target.name]. Prý si to jen půjčil.

1. Odpustit a dát najevo, že víš
2. Zabavit ukradené i s úroky
3. Zbavit úřadu

### 2. Zaslouží si víc  `q_ctizadost`

> [target.role] [target.name] žádá odměnu za léta služby: půdu, čest a místo, kde ho uvidí každý. A nenápadně dává najevo, že jinde by si ho vážili víc.

1. Vyhovět a štědře odměnit
2. Odmítnout
3. Slíbit odměnu později

### 3. Odvážný plán  `q_odvaha`

> [target.role] [target.name] navrhuje udeřit na lapky ve hvozdu dřív, než udeří oni. Plán je odvážný až drzý a [target.name] se už nemůže dočkat.

1. Svolit
2. Zakázat to

### 4. Věrné srdce  `q_oddanost`

> [target.role] [target.name] přišel v noci s lucernou. Zaslechl rozhovor, který neměl slyšet: někdo z vlastních lidí donáší cizím. Jméno prozradí, ale prosí o milost pro jeho rodinu.

1. Udělit milost rodině
2. Potrestat celou rodinu

### 5. Kde se bude dědic učit  `n_vychova_dedice`

> [heir.name] dorůstá a rod [dynastyName] musí rozhodnout, kde se bude dědic učit. Může jít jako panoš ke královskému dvoru, učit se u purkrabího správě panství, nebo vyrůst v družině mezi meči.

1. Poslat dědice ke královskému dvoru
2. Učit se správě panství
3. Vycvičit dědice v družině

## Obchod (všechny scénáře)

Přepadení karavany a pirátů přijde samo, když se náklad cestou dostane do nesnází. Ostatní události se objeví, až začneš obchodovat.

### 1. Přepadená karavana  `o_prepadeni`

> Karavanu s nákladem [cargo.load] cestou [cargo.to] zastavili [cargo.danger]. Vozky drží v šachu a chtějí výkupné: [cargo.ransom], jinak si vezmou všechno. [cargo.escort]

1. Zaplatit výkupné
2. Poslat ozbrojence
3. Odepsat náklad

### 2. Piráti na obzoru  `o_pirati`

> Loď s nákladem [cargo.load] plující [cargo.to] dostihly pirátské plachty. Kapitán posílá rychlý člun: piráti chtějí [cargo.ransom] za volnou plavbu, jinak loď přepadnou. [cargo.escort]

1. Zaplatit pirátům
2. Bránit loď
3. Zkusit jim uplout

### 3. Kupec s plným měšcem  `o_cizi_kupec`

> Do Brodu dorazil cizí kupec a ptá se po [cargo.good]. Slyšel, že ho máš ve skladu: [cargo.load]. Nabízí [cargo.offer] za všechno najednou, a hned.

1. Prodat
2. Smlouvat o víc
3. Neprodávat

### 4. Nové clo  `o_clo`

> Markrabata z Východních marek zvedla clo na všechno zboží, které přijíždí přes hvozd. Kupci skřípou zuby a ceny v markách padají.

1. Smířit se s tím
2. Vyjednat výjimku
3. Obrátit obchod jinam

### 5. Hlad za horami  `o_hlad_na_severu`

> Ze Severních pustin přicházejí zprávy o hladu. Kdo tam teď doveze obilí, dostane zaplaceno stříbrem. Nebo vděčností, pokud ho daruje.

1. Využít toho a prodávat draze
2. Poslat obilí jako dar
3. Nevšímat si toho

### 6. Vlastní loď  `o_lod`

> Loďař z Přístavu Mark nabízí postavit pevnou loď s vysokými boky, jakou piráti neradi napadají. Bude to stát hodně dřeva, hodně zlata a celý rok.

1. Loď postavit
2. Spokojit se s pronajatými loděmi

## Stavby ve městech a na gruntu

Přijdou jen tehdy, když v sídle stojí příslušná stavba. `[ve městě]` hra nahradí konkrétním sídlem (v Brodu, ve Vlčím Údělu…).

### 1. Oheň nad střechami  `t_pozar`

> [Ve městě] hoří. Oheň vyskočil z pekárny u cesty a vítr ho žene přes doškové střechy. Lidé běhají s vědry, ale plameny jsou rychlejší než oni.

1. Poslat vojáky hasit *(riskantní volba)*
2. Strhnout domy v cestě ohni
3. Svolat lid k modlitbě o déšť *(riskantní volba)*

### 2. Horečka v ulicích  `t_nakaza`

> [Ve městě] se lidé začali probouzet s horečkou a skvrnami na krku. Lazebníci krčí rameny a kněží zvoní umíráčkem čím dál častěji.

1. Otevřít špitál nemocným *(jen někdy)*
2. Zavřít cesty a nikoho nepouštět
3. Nechat to na lazebnících *(riskantní volba)*

### 3. Cech žádá výsady  `t_cech_vysady`

> Cechmistři [ve městě] přišli v nejlepších šatech a s pečetí na listině. Chtějí, aby nikdo mimo cech nesměl ve městě prodávat sukno — a aby jim to vládce potvrdil navždy.

1. Udělit cechu výsady
2. Odmítnout — trh má být svobodný *(riskantní volba)*
3. Výsady prodat za zlato

### 4. Mistr stavitel  `t_stavitel`

> Na staveniště [ve městě] přišel cizí mistr s olovnicí za pasem. Prohlédl lešení, plivl a řekl, že tohle by se svými lidmi postavil za polovinu času. Za odpovídající cenu, pochopitelně.

1. Najmout ho na tuhle stavbu *(jen někdy)*
2. Nabídnout mu stálou službu *(jen někdy)*
3. Poslat ho dál

### 5. Kasárna bez žoldu  `t_zold`

> Posádka kasáren [ve městě] dva měsíce neviděla ani groš. Vojáci sedí na nádvoří, místo cvičení hrají v kostky o vlastní zbraně a velitel posílá posla, že dlouho je už neudrží.

1. Vyplatit žold *(jen někdy)*
2. Slíbit žold po žních *(riskantní volba)*
3. Rozpustit posádku

### 6. Lupiči před branou  `t_najezd`

> Za úsvitu se z lesa vynořila tlupa lupičů na koních. Míří k branám, protože [ve městě] je co brát: plné sklady, kostelní stříbro a všechno, co se dá odvézt nebo zapálit.

1. Zavřít brány a bránit hradby *(jen někdy)*
2. Vyjet proti nim *(riskantní volba)*
3. Vyplatit je *(jen někdy)*

### 7. Obyvatelé chtějí víc  `t_mestska_prava`

> Konšelé [ve městě] přinesli prosbu: sídlo vyrostlo, lidí přibylo a chtějí práva, jaká mají větší místa — vlastní trh, soud a pečeť. Jsou ochotni za ně leccos nabídnout.

1. Udělit práva jako dar
2. Práva prodat za zlato
3. Odmítnout

### 8. Poutníci  `t_pout`

> Ke kostelu [ve městě] se sjíždějí poutníci. Prý tam slepá stařena po mši prohlédla. Cesty jsou plné lidí s holemi a mušlemi na kloboucích — a všichni mají hlad i měšec.

1. Vybírat od poutníků mýto
2. Pohostit poutníky

### 9. Mlynář šidí  `t_mlynar`

> Sedláci, kteří melou [ve městě], si stěžují: mlynář prý bere víc, než mu patří, a mouku vrací lehčí, než přivezli obilí. Mlynář přísahá na svou mlýnskou váhu.

1. Potrestat mlynáře
2. Nechat ho, mele dobře
3. Postavit obecní váhu *(jen někdy)*

### 10. Nejlepší žák  `t_skola_zak`

> Opat z klášterní školy [ve městě] přivádí chlapce v obnošené kutně. Syn uhlíře, ale čte latinsky, počítá rychleji než písaři a pamatuje si každé slovo. Opat se ptá, co s ním.

1. Vzít ho do kanceláře
2. Poslat ho studovat do ciziny *(jen někdy)*
3. Ať zůstane u mnichů

### 11. Svěcení katedrály  `t_sveceni`

> Poslední kámen je osazen. Katedrála [ve městě] se tyčí nad krajinou a biskup čeká, jak velkolepé má být svěcení. Přijedou hosté z ciziny i z nejzapadlejších vsí.

1. Velkolepé svěcení *(jen někdy)*
2. Skromná mše

### 12. Podzimní jarmark  `t_jarmark`

> Nové tržiště [ve městě] je plné. Kupci z celé země rozkládají zboží, kejklíři polykají oheň a rychtář se ptá, kolik má letos vybírat tržného.

1. Vybrat plné tržné
2. Odpustit tržné, ať se sjedou kupci

### 13. Roj na lípě  `t_s_roj` *(Sedlák)*

> Z včelína vyrojily včely a usadily se vysoko v koruně lípy na návsi. Sousedé už mají připravené koše — kdo roj sundá, toho je.

1. Vylézt pro roj *(riskantní volba)*
2. Nechat ho letět

### 14. Nemoc v chlévě  `t_s_dobytek` *(Sedlák)*

> Kráva v chlévě nežere a stojí se svěšenou hlavou. Jestli je to mor dobytka, do týdne bude chlév prázdný.

1. Zabít nemocný kus
2. Zavolat kováře, který léčí dobytek *(jen někdy)*
3. Počkat, ono to přejde *(riskantní volba)*

### 15. Závist sousedů  `t_s_zavist` *(Sedlák)*

> Grunt se rozrůstá a ve vsi se o tom mluví. U studny je slyšet, že si hospodář myslí, že je víc než ostatní. A že by stačila jedna jiskra.

1. Uspořádat hody pro celou ves
2. Nevšímat si řečí *(riskantní volba)*
3. Postěžovat si rychtáři

### 16. Pán si všiml  `t_s_pan_podil` *(Sedlák)*

> [Pán] [jméno pána] projížděl kolem gruntu a zastavil koně. Nové stavby si prohlížel dlouho. Druhý den přišel drábův vzkaz: poddaný, který tolik staví, může i víc odvádět.

1. Dát pánovi, co chce *(jen někdy)*
2. Odmítnout — co jsem postavil, je moje
3. Tvrdit, že stavby jsou staré *(riskantní volba)*

## Zranění vládce

Přijdou, jen když je vládce zraněný (`js/events_injury.js`). Zranění samotná vznikají v soubojích, při honu, v turnaji, v bitvě v první linii, při atentátu a obecně s pravděpodobností 30 % po každém neúspěšném hodu na sílu.

### 1. Rána, která se nehojí  `z_ranhojic`

> Obvazy se každé ráno mění a každé ráno jsou krvavější. [Zranění] pálí a v noci přichází horečka. U dveří čekají dva: učený lékař s kufříkem nástrojů a stará bylinkářka z lesa.

1. Zaplatit učeného lékaře *(jen někdy)*
2. Poslat pro ranhojiče z Brodu *(jen někdy)*
3. Svěřit se bylinkářce *(riskantní volba)*
4. Modlit se a vydržet *(riskantní volba)*

### 2. Řemeslník s nabídkou  `z_nahrada`

> [Řezbář] se uklonil a rozbalil plátno. Slyšel prý, jak [vládce] přišel o [nohu], a přináší [dřevěnou nohu], změřenou na míru. Nebude to jako dřív, ale bude to lepší než teď.

1. Nechat si ji udělat *(jen někdy)*
2. Zaplatit, kolik dům dá *(jen někdy)*
3. Odmítnout a naučit se žít bez ní

### 3. Smích za zády  `z_posmech`

> Na hostině si šašek přivázal ke koleni násadu od koštěte, přes oko pásku a začal se potácet mezi stoly. Hosté se dusí smíchem — a pak jeden po druhém zmlknou a dívají se k čelu stolu, kde sedí [vládce].

1. Dát ho zbičovat
2. Smát se s nimi *(riskantní volba)*
3. Přejít to mlčením

## Ambice

### 1. Čeho chceš dosáhnout  `ambice`

> Je čas se zastavit a rozhodnout, kam dál. Dny plynou jeden za druhým a kdo nemá cíl, toho nesou. [vládce] ví, že na všechno síly nestačí — a že lidé si pamatují ty, kdo něco slíbili a dokázali.

Nabídne tři ze 19 cílů podle scénáře (`js/ambitions.js`) a volbu „Žít ze dne na den a nic nesvazovat slibem“. Nezabírá období: po ní hned přijde běžná událost.

## Válečná tažení

Přijdou jen během tažení, které hráč vypraví na mapě (záložka Válka, `js/war.js`): jedna událost za každé období v poli, na konci triumf nebo porážka.

### 1. Bitva v poli  `w_bitva`

> Za úsvitu stojí na protějším návrší [nepřítel]. [velitel] objíždí řady a [počet] mužů čeká na rozkaz. Jedna bitva může rozhodnout celé tažení — nebo ho ukončit.

1. Udeřit čelně *(riskantní volba)*
2. Obejít je lesem a vpadnout do boku *(riskantní volba)*
3. Opevnit tábor a čekat, až zaútočí oni

### 2. Pod hradbami  `w_obleh`

> Poslední pevnost [v cíli tažení] stojí. Za hradbami se drží [nepřítel] a podle zběhů jim dochází voda. Tesaři se ptají, jestli mají stavět žebříky, nebo kopat.

1. Vzít hradby útokem *(riskantní volba)*
2. Vyhladovět je
3. Podkopat hradby *(riskantní volba)*

### 3. Úplavice v táboře  `w_nemoc`

> V táboře se šíří úplavice. Ráno nevstalo dvacet mužů, večer jich bylo čtyřicet. Kdo ještě stojí, dívá se směrem k domovu.

1. Spálit nakažené stany
2. Poslat nemocné domů
3. Nechat ranhojiče pracovat *(riskantní volba)*

### 4. Dezertéři  `w_dezerce`

> Stráže chytily šest mužů, kteří v noci utíkali z tábora. Prý mají doma hladové děti a pole bez rukou. Celé vojsko čeká, co s nimi bude.

1. Pověsit je před nastoupeným vojskem
2. Přidat vojsku žold *(jen někdy)*
3. Nechat je jít

### 5. Posel s bílou korouhví  `w_mir`

> Z nepřátelského tábora přijel posel s bílou korouhví. Nepřítel nabízí výkupné a mír dřív, než tažení dojde do konce. Muži by šli rádi domů, ale vítězství je na dosah.

1. Přijmout výkupné a mír
2. Bojovat dál
3. Žádat dvojnásobek *(riskantní volba)*

### 6. Hladové vojsko  `w_zasoby`

> Vozy se zásobami nedorazily a vojáci jedí řemení. Kolem tábora jsou vsi s plnými stodolami — a kus cesty za zády domov.

1. Plenit okolní vsi
2. Poslat vozy ze sýpek *(jen někdy)*
3. Stáhnout vojsko domů

### 7. Hrdina z řad pěšáků  `w_hrdina`

> Mladý pěšák sám zastavil nepřátelský výpad a vynesl z boje raněného praporečníka. Celé vojsko o něm mluví. Možná je to právě to, co muži potřebují.

1. Pasovat ho na rytíře před celým vojskem
2. Dát mu měšec zlata *(jen někdy)*
3. Poslat ho v čele příštího útoku *(riskantní volba)*

### 8. Zvěd s mapou  `w_zved`

> Do tábora přišel muž, který tvrdí, že zná tajnou cestu nepříteli do týlu. Mapu ukáže, ale ne zadarmo. Může to být zlato — nebo past.

1. Zaplatit mu *(jen někdy)*
2. Vyslechnout ho na mučidlech *(riskantní volba)*
3. Poslat ho pryč, může to být past

### 9. Vítězné vojsko se vrací  `w_triumf`

> Vojsko se vrací z tažení ([cíl]). Prapory jsou potrhané, ale vlají vysoko, a za vojskem se táhnou vozy s kořistí. Lidé lemují cestu a čekají, co vrchnost udělá.

1. Uspořádat triumfální průvod *(jen někdy)*
2. Rozdělit kořist mezi vojáky
3. Poslat muže hned na pole

### 10. Po porážce  `w_porazka`

> Z tažení ([cíl]) se vrací jen zbytek vojska. Vdovy stojí u brány a hledají známé tváře. Někdo musí za porážku odpovídat — nebo ji aspoň unést.

1. Postarat se o vdovy a sirotky *(jen někdy)*
2. Najít viníka mezi veliteli
3. Unést to mlčky

## Zbojníci

Volby se ⚔ se bojují po kolech (`js/combat.js`).

### 1. Zbojníci na cestě  `z_zbojnici_cesta`

> Cesta vede úvozem mezi buky. Najednou padne přes cestu strom a z houští vystoupí pět chlapů se sekerami. Ten největší se usměje: „Mýto, pane. Nebo si vezmeme všechno — i boty.“

1. Tasit zbraň a bránit se ⚔ *(souboj: Zbojníci)*
2. Zaplatit mýto *(jen někdy)*
3. Pokusit se je umluvit *(riskantní volba)*
4. Utéct do lesa *(riskantní volba)*

### 2. Zbojnický hejtman  `z_hejtman` *(Panovník, Šlechtic)*

> V kraji [kraj] řádí zbojnický hejtman. Vypaluje dvory, věší výběrčí a lidé o něm zpívají písně. Teď poslal vzkaz: ať si to s ním vrchnost rozdá sama, muž proti muži, na mýtině u starého dubu.

1. Přijmout výzvu ⚔ *(souboj: Zbojnický hejtman)*
2. Poslat na ně vojsko *(riskantní volba)*
3. Vypsat odměnu na jeho hlavu *(jen někdy)*

### 3. Noční přepadení  `z_prepadeni_noc`

> Uprostřed noci se rozštěkali psi. Ve dvoře jsou cizí muži s pochodněmi a někdo už páčí vrata od sýpky. Než se kdo vzbudí, bude po všem.

1. Popadnout zbraň a vyběhnout ⚔ *(souboj: Zbojníci)*
2. Zabarikádovat se a čekat
3. Vzbudit všechny a bránit se společně *(riskantní volba)*

## Svobodník a významný šlechtic

Události jen pro dva stupně, které dřív žily z cizí zásoby: **svobodníka** (Sedlák, `statusTier` 2) a **významného šlechtice** (Šlechtic, `statusTier` 4). Soubor `js/events_stages.js`. Ozvěny přicházejí jen v témže stupni.

### Svobodník

#### 1. Lidé u studny  `f_celed`

> Na návsi u studny stojí lidé s uzlíky a ptají se po práci: dva bratři z vyhořelé vsi za hvozdem, vdova s dospívajícím synem a starý pasák, který prý rozumí dobytku líp než kdokoli v kraji. Poddaný si čeleď najímat nesmí. [vládce] je ale teď svobodný hospodář/svobodná hospodářka a kdo chce obdělat víc polí, potřebuje víc rukou. Ty ruce chtějí jíst — a dostat zaplaceno.

1. Najmout je všechny za mzdu *(jen někdy)*
2. Vzít jen dva bratry *(jen někdy)*
3. Nabídnout jim místo mzdy stravu a střechu *(riskantní volba)*
4. Poslat je dál

#### 2. Farské lány  `f_farska_pole`

> Farář z Lipnice drží za kostelem tři lány, které nemá kdo obdělat. Poddanému by je nepronajal — ten patří pánovi i s rukama. Svobodnému člověku ale nabízí nájem na tři roky: zaplatit předem a úrodu si nechat.

1. Zaplatit nájem předem *(jen někdy)*
2. Smlouvat o nižší nájem *(riskantní volba)* *(jen někdy)*
3. Splácet nájem prací čeledi na farském
4. Nechat lány ležet ladem

#### 3. Hlas vsi  `f_hlas_vsi`

> Večer se u tvých vrat sešli sousedé s čepicemi v rukou. Pán/Paní [pán] chce letos od každého gruntu o den roboty víc a k tomu nový poplatek za pastvu na panské louce. Poddaný, který by si stěžoval, skončí u drába. Ty už pánovi/paní nepatříš. „Promluv za nás,“ prosí. „Tebe vyslechne.“

1. Jít na panský dvůr a mluvit za celou ves *(riskantní volba)*
2. Domluvit se potichu s purkrabím *(jen někdy)*
3. Odmítnout, tohle už není tvoje starost

#### 4. Mýto na mostě  `f_myto_na_moste`

> Pán/Paní [pán] ti nezapomněl/nezapomněla, že ses vymanil/vymanila z poddanství. Kdo jednou odejde zpod panské ruky, ukazuje cestu ostatním. Na mostě přes potok, kudy vozíš obilí do mlýna, teď stojí panský pacholek a chce mýto — od tvého vozu, a jen od tvého.

1. Platit a nedat najevo hněv
2. Ukázat listinu o svobodě královskému sudímu v Brodné *(riskantní volba)*
3. Zanést na panský dvůr dar a připomenout staré služby *(jen někdy)*
4. Vozit obilí oklikou přes brod

#### 5. S kupeckou karavanou  `f_karavana`

> Kupec z Brodné skládá karavanu na jarmark do Brodu a hledá společníky, kteří přiloží vůz a ruku k ochraně. Poddaný nesmí opustit panství bez dovolení, svobodný může jet, kam chce. Na jarmarku se za obilí platí stříbrem a za stříbro se tam dá koupit, co doma nikdo nemá — třeba levné obilí z jižních sýpek.

1. Naložit obilí a jet s karavanou *(riskantní volba)* *(jen někdy)*
2. Koupit na jarmarku obilí na zimu *(jen někdy)*
3. Poslat s karavanou dva čeledíny jako stráž *(riskantní volba)*
4. Zůstat doma

#### 6. Klepání na okenici  `f_uprchly_syn`

> Uprostřed noci zaklepal na okenici soused Matěj, poddaný jako kdysi ty. Jeho syn utekl z panské stáje, kde ho dráb zbil do krve, a teď ho hledají pacholci. „U svobodného hledat nebudou,“ šeptá Matěj. „Schovej ho, než přejde nejhorší.“ Za ukrývání uprchlého poddaného se ale platí, i když jsi svobodný/svobodná.

1. Schovat ho na seníku a dát mu práci *(riskantní volba)*
2. Dát mu groše a poslat ho v noci do města *(jen někdy)*
3. Odmítnout, tohle není tvůj boj
4. Dát vědět pánovým pacholkům

#### 7. Kmotrovství  `f_kmotrovstvi`

> [krčmář], krčmář od návsi, dnes ráno zaklepal/zaklepala na tvé dveře v nedělních šatech. V rodině se narodilo dítě. Za kmotra se obvykle zve rychtář nebo mlynář — kdo stojí výš, ten dítěti otevře dveře do světa. Tentokrát ale prosí tebe: svobodný grunt mezi kmotry je pro dítě z krčmy víc, než kdy doufali.

1. Přijmout a dát štědrý křestní dar *(jen někdy)*
2. Přijmout skromně, jak se mezi sousedy sluší
3. Zdvořile odmítnout

#### 8. Dříví z obecního lesa  `f_obecni_les`

> Svobodní hospodáři odjakživa berou dříví z obecního lesa nad vsí. Nový panský hajný ale tvrdí, že les patří pánovi/paní a že svobodní mají práva jen do té doby, dokud jim je pán/paní [pán] nechá. Tvůj vůz s dřívím zabavil u cesty a sekeru si odnesl na panský dvůr. Zima je za dveřmi.

1. Předložit listinu o svobodě i se starými právy *(riskantní volba)*
2. Zaplatit lesné a mít pokoj *(jen někdy)*
3. Jet do lesa s čeledí a sekerami *(riskantní volba)*
4. Ustoupit a topit, čím se dá

#### 9. Návrat z města  `f_ozvena_uprchlik` *(ozvěna)*

> Na zápraží stojí urostlý chlap v kabátci z dobrého sukna. Trvá chvíli, než v něm poznáš syna souseda Matěje, který tenkrát utekl z panské stáje. V Brodné se vyučil formanem, má vlastní vůz a s sebou dva kamarády, kteří hledají práci. „Dlužím ti víc než groše,“ říká.

1. Vzít jeho kamarády na grunt
2. Přijmout splátku v groších
3. Domluvit se, že bude vozit tvé obilí do města *(riskantní volba)*

#### 10. Kmotrovská povinnost  `f_ozvena_kmotr` *(ozvěna)*

> Krčmu od návsi v noci zachvátil požár. [krčmář] zachránil/zachránila děti a holé životy, sklep a výčep lehly popelem. Podle starého zvyku má kmotr pomoci, když rodina kmotřence padne na dno — a celá ves se teď dívá k tvému gruntu.

1. Vzít dvě starší děti na grunt do služby
2. Dát peníze na nový krov *(jen někdy)*
3. Poslat pytel mouky a víc nic

### Významný šlechtic

#### 1. Místo v korunní radě  `v_korunni_rada`

> Král/Královna [panovník] svolává korunní radu a mezi starými jmény, která u stolu sedí odjakživa, je poprvé i rod [rod]. Místo v radě znamená slyšet o válce dřív než ostatní a mít slovo při každém úřadu a každé berni — a nést vinu za každé špatné rozhodnutí, které se v radě udělá. Páni ostatních rodů ti už teď uhýbají pohledem.

1. Zasednout a stát vždy za korunou
2. Zasednout a tiše si skládat vlastní stranu
3. Odmítnout s díky, panství potřebuje své pány doma

#### 2. Dohazovači na tvrzi  `v_snatkovy_trh`

> Od doby, kdy rod [rod] patří mezi velmože, se na tvrz sjíždějí dohazovači. [dědic] je teď partie, o kterou stojí i staré rody, a nejvíc nabízí pán/paní [hlava rodu] z rodu [rod]: věno, spojenectví a místo u stolu, kde se rozhoduje o zemi. Jiní by na takovou nabídku čekali celý život.

1. Přijmout nabídku a zpečetit spojenectví
2. Nechat rody přebíjet a vzít nejvyšší věno *(riskantní volba)*
3. Dědic počká na lepší partii

#### 3. Rytíři u brány  `v_rytiri_u_brany`

> Na nádvoří tvrze klečí pět rytířů bez pána: synové zchudlých zemanů, vysloužilci z královských válek a jeden dokonce v rezavé zbroji po dědovi. Chtějí složit lenní slib rodu [rod] — meč a věrnost za kus půdy a místo u stolu. Velmož, který má vlastní muže, má váhu. Král/Královna [panovník] ale nerad/nerada vidí velmože, kteří mají víc mečů, než potřebují.

1. Přijmout všech pět a dát jim léna *(jen někdy)*
2. Vyzkoušet je na kolbišti a vzít jen nejlepší *(riskantní volba)*
3. Poslat je ke dvoru, koruna potřebuje muže víc *(jen někdy)*
4. Odmítnout

#### 4. Opovědný list  `v_opovedny_list`

> Posel rodu [rod] přibil na bránu tvrze opovědný list. Pán/Paní [hlava rodu] v něm rodu [rod] vypovídá mír: od příštího úplňku budou jeho/její muži pálit, brát a zajímat, dokud nedostane zpět, co mu/jí podle něj/ní patří. Mezi drobnou šlechtou by to byla rvačka o louku. Mezi velmoži je to válka, kterou bude sledovat celá země.

1. Vyrazit proti nim dřív, než vyjedou *(riskantní volba)*
2. Povolat spojence pod korouhve *(jen někdy)*
3. Předložit spor koruně *(riskantní volba)* *(jen někdy)*
4. Nabídnout smír a odškodné *(jen někdy)*

#### 5. Turnaj pod tvrzí  `v_turnaj`

> Velmož, který pořádá turnaj, ukazuje celé zemi, že si to může dovolit. Pod tvrzí rodu [rod] by se sjeli rytíři ze všech tří velkých rodů, z královského dvora i ze ciziny, a s nimi kupci, kejklíři a půlka pobřeží. Zbývá rozhodnout, kolik to bude stát — a jestli se na kolbišti ukáže i pán/paní domu.

1. Uspořádat okázalý turnaj pro celou šlechtu *(jen někdy)*
2. Vjet do klání osobně ⚔ *(souboj: Rytíř v plné zbroji)* *(jen někdy)*
3. Skromný turnaj jen pro vlastní rytíře
4. Odmítnout, peníze patří do hradeb

#### 6. Zkouška věrnosti  `v_zkouska_vernosti`

> Královský posel přivezl list s pečetí, kterou nikdo nesmí odmítnout. Král/Královna [panovník] obviňuje rod [rod] ze zrady a přikazuje: pán/paní [hlava rodu] má být zajat/zajata a do měsíce dopraven/dopravena v okovech do Vlčího Údělu — a to právě rodem [rod], protože ho/ji zná nejlíp. U dvora se šeptá, že důkazy nejsou žádné. Že jde o zkoušku, kdo poslechne.

1. Poslechnout rozkaz
2. Varovat je tajně a zajmout jen prázdné sídlo *(riskantní volba)*
3. Postavit se za obviněné před korunou *(riskantní volba)*
4. Odmítnout rozkaz

#### 7. Galéra s purpurovými plachtami  `v_jizni_vyslanec`

> Do přístavu pod tvrzí připlula galéra s purpurovými plachtami. Vyslanec, kterého posílá [císař] z Jižní říše, vystoupil na břeh s dary — hedvábím, kořením a skříňkou, ve které cinká zlato. Prý jen zdraví velmože, o kterém se mluví až za mořem. Mezi řečí se ale vyptává na královské loďstvo, na zdraví krále/královny a na to, kdo by po něm/ní mohl vládnout.

1. Přijmout dary a mluvit jen o počasí *(riskantní volba)*
2. Prodat mu, co chce vědět
3. Doprovodit vyslance ke dvoru

#### 8. Biskupova přízeň  `v_biskupova_prizen`

> Biskup z Vlčího Údělu staví nový chór katedrály a hledá velmože, kteří by se jím chtěli proslavit. Kdo dá na stavbu, tomu kapitula vyhradí místo v kryptě a kazatelé jeho jméno na kazatelnách. Biskup má navíc ucho krále/královny i prostého lidu — a hlas při každé korunovaci.

1. Zaplatit kapli s erbem rodu *(jen někdy)*
2. Prosadit vlastního kaplana do kapituly *(riskantní volba)*
3. Podpořit biskupa ve sporu s korunou o desátky *(jen někdy)*
4. Poslat skromný dar

#### 9. Hlasování v radě  `v_ozvena_rada` *(ozvěna)*

> Korunní rada se přela do noci. Král/Královna [panovník] chce novou válečnou berni ze všech panství a ostatní velmoži už dali najevo, že jsou proti. Hlasy jsou vyrovnané a všichni se dívají na rod [rod]. Jedno slovo rozhodne, kdo bude zítra platit — a koho bude koruna příště poslouchat.

1. Hlasovat s korunou
2. Hlasovat s velmoži proti berni
3. Navrhnout berni jen z královských měst *(riskantní volba)*

#### 10. Rytíř z tvé korouhve  `v_ozvena_rytir` *(ozvěna)*

> Rytíř Bořek, jeden z těch, kdo ti kdysi složili lenní slib na nádvoří, se v krčmě pohádal s mužem jiného rodu a zabil ho. Rodina zabitého žádá jeho hlavu. Ostatní vazalové mlčí a čekají, jestli velmož ochrání svého člověka — a celý dvůr čeká s nimi.

1. Vydat ho spravedlnosti
2. Ochránit ho, kdo přísahal rodu, toho rod nevydá
3. Zaplatit rodině zabitého pokrevní pokutu *(jen někdy)*

#### 11. Smírčí hostina  `v_ozvena_svar` *(ozvěna)*

> Rod [rod] nezapomněl na noc, kdy jeho tábor hořel. Pán/Paní [hlava rodu] teď posílá vzkaz: válčit už nebude, zve na smírčí hostinu. A každý u dvora ví, jak takové hostiny mezi velmoži končívají.

1. Přijet s početnou družinou *(riskantní volba)*
2. Poslat místo sebe dar a omluvu *(jen někdy)*
3. Odmítnout pozvání

#### 12. Lodě u Šedých skal  `v_ozvena_vyslanec` *(ozvěna)*

> Královské loďstvo narazilo u Šedých skal na jižní galéry, které věděly, kudy a kdy poplují. Tři lodě šly ke dnu. Ve Vlčím Údělu se hledá, kdo s vyslancem z jihu mluvil — a stopa vede do přístavu pod tvou tvrzí.

1. Svést vinu jinam listinou z truhly *(jen někdy)*
2. Podplatit královského vyšetřovatele *(jen někdy)*
3. Zapírat před radou *(riskantní volba)*

## Velké rody a vazalové

Události ze souboru `js/events_houses.js` o rodech mezi sebou, o pěti novějších rodech (Jelenové z Doubravy, páni z Kamenného Kříže, Říční páni z Přívozu, Jezdci z Pustého Pole, páni z Právova) a o vztahu koruny k vazalům. Události o dvou rodech (`h_spor_o_hranici`, `h_svatba_rodu`, `h_rodova_valka`, `h_v_rody_pred_korunou`) vybírají dvojici podle vztahu mezi rody (`house.rel`). Za titulkem je scénář, v němž událost přichází.

### 1. Spor o hraniční potok  `h_spor_o_hranici` *(Šlechtic)*

> Rod [rod] a rod [druhý rod] se přou o hraniční potok a o louky na jeho březích. Včera se tam střetly dvě družiny, dnes už padly první rány a oba rody posílají posly k tobě. Pán/Paní [hlava rodu] žádá, abys potvrdil jeho právo. Pán/Paní [hlava druhého rodu] žádá úplně totéž.

1. Svolat oba rody k jednomu stolu *(riskantní volba)*
2. Podpořit rod [rod]
3. Podpořit rod [druhý rod]
4. Dolít oleje do ohně a dívat se z povzdálí *(riskantní volba)*

### 2. Svatba dvou rodů  `h_svatba_rodu` *(Šlechtic + Panovník)*

> Rod [rod] a rod [druhý rod] se po letech smluv a výhrůžek chystají k sňatku. Nevěsta už má věno, ženich koně, hostina je objednaná na tři dny a pozvání dorazilo i k tobě. Všichni vědí, že tahle svatba není jen o lásce: z obou rodů bude jedna strana a kdo u ní nebude stát, bude proti ní.

1. Přijet s dary a požehnat svatbě *(jen někdy)*
2. Poslat jen posla s pozdravem
3. Využít svatby k vlastním jednáním *(riskantní volba)*

### 3. Krev na hranici rodů  `h_rodova_valka` *(Šlechtic + Panovník)*

> Mezi rodem [rod] a rodem [druhý rod] došlo ke krveprolití. Kdo přežil, tvrdí, že druhá strana začala. Vypálená stodola, zabitý pacholek, ukradený dobytek, a teď už i dva mrtví rytíři. Pán/Paní [hlava rodu] i pán/paní [hlava druhého rodu] žádají o pomoc. Píší zdvořile a každý o jiném viníkovi, jak se to na urozené sluší.

1. Poslat muže na pomoc rodu [rod] *(jen někdy)*
2. Vyhlásit příměří a postavit na hranici stráže *(jen někdy)*
3. Nechat je vykrvácet

### 4. Rod se vzbouřil proti králi  `h_rod_proti_koruna` *(Šlechtic)*

> Rod [rod] odmítl poslat berni i muže a zavřel brány svého sídla [sídlo rodu]. [king.Title] [king.name] svolává šlechtu a pozvedá korouhev. Pán/Paní [hlava rodu] posílá posla i k tobě: „Postav se při nás, nebo budeš příště na řadě sám.“ Za zdmi se hlídky střídají každou hodinu, v krčmách se vsází, kdo to vyhraje, a dvůr se dívá na tebe.

1. Přidat se ke vzbouřencům
2. Postavit se na stranu koruny *(jen někdy)*
3. Zprostředkovat smír mezi králem a rodem *(riskantní volba)*
4. Zůstat stranou a prodávat obilí oběma táborům *(jen někdy)*

### 5. Stará hlava rodu  `h_nova_hlava` *(Šlechtic + Panovník)*

> Pán/Paní [hlava rodu] z rodu [rod] je starý a nemocný. Lékaři kroutí hlavami a v sídle [sídlo rodu] se šeptá, kdo ho nahradí: starší syn, který je rozvážný a šetrný, nebo mladší, který se rád hádá a ještě radši bojuje. Oba už rozeslali posly k sousedům. Kdo tuhle chvíli dobře využije, získá rodu přítele nebo nepřítele na celé generace.

1. Poslat poselstvo s dary a účastí *(jen někdy)*
2. Tajně podpořit rozvážného staršího syna *(riskantní volba)*
3. Nevměšovat se

### 6. Hájenky v hvozdu  `h_les_hajenky` *(Šlechtic + Panovník)*

> Pán/Paní [hlava rodu] z rodu [rod] posílá posla z Doubravy: v hvozdu je dřevo, které zbaví sýpky hniloby a postaví stodoly pro půl kraje, a rod je ochoten ho prodat. Chce za to dvě věci: právo honu na tvých pozemcích a slib, že tvoji lidé nebudou v jejich lese klást oka na zvěř. Lesníci rodu se na tvé poddané dívají s nedůvěrou, a to oboustranně.

1. Přistoupit na dohodu o dřevě a honu *(jen někdy)*
2. Pozvat rod na velký hon *(riskantní volba)*
3. Odmítnout. Les patří tomu, kdo ho kácí

### 7. Opat z Kamenného Kříže  `h_kriz_desatek` *(Šlechtic + Panovník)*

> Opat kláštera na panství rodu [rod] přijel osobně. Kostel prý hnije, odpustky se prodávají špatně a víra v kraji chladne. Žádá, abys podepsal listinu o nových desátcích: každý desátý snop klášteru a každý desátý pytel chudým. Pán/Paní [hlava rodu] z rodu [rod] stojí vedle opata a mlčí tak, jak se mlčí, když se čeká na správnou odpověď.

1. Podepsat a požádat o požehnání
2. Smlouvat o menším desátku *(riskantní volba)*
3. Odmítnout. Poddaní už platí dost

### 8. Mýto na řece  `h_ricane_myto` *(Šlechtic + Panovník)*

> Říční páni z Přívozu zvýšili mýto na přívozech i pod věží. Každý vůz, který přejede Brodnici, platí o třetinu víc, kupci nadávají a na trhu v Brodu se prodává hůř. Pán/Paní [hlava rodu] z rodu [rod] tvrdí, že řeku je třeba hlídat, že stráže se musí platit a že mýto nikdy nebylo tak nízké jako teď. U věže vždy najdeš dva lidi: jednoho, který se hádá, a druhého, který platí.

1. Vyjednat dělené mýto *(riskantní volba)*
2. Zaplatit si výjimku pro vlastní vozy *(jen někdy)*
3. Postavit vlastní brod níž po proudu *(jen někdy)*

### 9. Koně z Pustého Pole  `h_pustopolci_kone` *(Šlechtic + Panovník)*

> Jezdci z Pustého Pole přihnali k tvým ohradám stádo hřebců, jaké se v zemi dávno neviděly: šedých, vraných i plavých, jako by je stepní vítr nakreslil. Pán/Paní [hlava rodu] z rodu [rod] nabízí prodej. Chce ale víc než zlato: pár mladých chlapců z tvé družiny, aby se u nich naučili jezdit po jejich způsobu. Prý je to otázka vzájemné důvěry. Prý.

1. Koupit stádo za hotové *(jen někdy)*
2. Poslat jim chlapce na výcvik
3. Odmítnout. Cizí koně patří na cizí pole

### 10. Listina starého práva  `h_soudci_listina` *(Šlechtic + Panovník)*

> Písaři z Právova našli ve zdech soudního dvora listinu, která tvrdí, že při sporech má platit právo starší než kterýkoli dnešní titul. Pán/Paní [hlava rodu] z rodu [rod] nabízí, že soud zapíše tvůj rod do listiny jako ten, kdo právo drží zákonně. „Samozřejmě,“ dodává, „právo není zadarmo. Ani listina.“

1. Zaplatit písařům za rozsudek *(jen někdy)*
2. Nechat listinu ověřit u soudu *(riskantní volba)*
3. Listinu zabavit a soud zakázat

### 11. Turnaj rodů  `h_turnaj_rodu` *(Šlechtic + Panovník)*

> Rod [rod] pořádá na svém sídle [sídlo rodu] velký turnaj. Přijedou rytíři z půl země a pán/paní [hlava rodu] vzkazuje, že místo v čestné lóži je pro tebe připravené. Kdo se turnaje zúčastní, ukáže se. Kdo nepřijede, ukáže se také.

1. Přijet a sám se utkat v klání *(riskantní volba)*
2. Sedět v lóži a vsadit na favorita *(jen někdy)*
3. Omluvit se a poslat dar

### 12. Rod, který příliš zesílil  `h_v_mocny_rod` *(Panovník)*

> Zprávy se ke dvoru sbíhají šeptem: rod [rod] drží víc zbrojných než koruna dokáže zaplatit. Pán/Paní [hlava rodu] se na sněmu usmívá a nikdy neřekne nic, co by šlo vyložit jako hrozbu. [chancellor.Title] [chancellor.name] ten klid nesnáší: „Kdo nic nežádá,“ praví, „ten buď nic nechce, nebo chce všechno.“

1. Zkrotit rod právem: zabavit část lén *(riskantní volba)*
2. Udělit rodu nové léno a přízeň *(jen někdy)*
3. Svolat sněm a rozdělit jeho půdu mezi jiné *(riskantní volba)*
4. Nechat být. Zatím

### 13. Rod vypověděl poslušnost  `h_v_vzpoura_rodu` *(Panovník, vynucená)*

> Sídlo [sídlo rodu] zavřelo brány a z věže se dívá cizí korouhev. Rod [rod] vypověděl poslušnost. Pán/Paní [hlava rodu] posílá herolda s listinou stížností: koruna prý nectí staré právo, zapomíná na věrné, prý je čas vyměnit toho, kdo sedí na trůně. V krajích se zvedá prach. Lidé nevědí, komu přísahat, a [marshal.title] [marshal.name] žádá rozkaz.

1. Vytáhnout proti rodu *(riskantní volba)*
2. Jednat s rodem a splnit část požadavků *(jen někdy)*
3. Svolat věrné rody *(jen někdy)*

### 14. Žádost o léno  `h_v_zadost_o_leno` *(Panovník)*

> Pán/Paní [hlava rodu] z rodu [rod] klečí před trůnem s listinou v ruce. Rod koruně sloužil věrně a jeho synové padli pod královskou korouhví. Žádá o pusté léno u hranice, které leží ladem od posledního moru. „Není to dar,“ říká, „je to odměna. A pojistka, aby koruna věděla, kde stojím.“

1. Léno udělit a přijmout slib věrnosti
2. Léno prodat za zlato
3. Odmítnout. Půda patří koruně

### 15. Rod nabízí sňatek s korunou  `h_v_snatek_koruny` *(Panovník)*

> Rod [rod] nabízí sňatek: dědic/dědička [heir.name] a nejmladší potomek rodu. Věno by bylo štědré, pouto mezi korunou a rodem pevné a nikdo by se pak nedivil, že pán/paní [hlava rodu] sedí na sněmu po pravici. Dvůr se dělí: jedni to vítají, druzí vědí, co taková svatba znamená, a kdo bude po ní silnější.

1. Přijmout a oslavit svatbu
2. Poděkovat a odmítnout

### 16. Hotovost se opozdila  `h_v_hotovost_opozdena` *(Panovník)*

> Koruna svolala hotovost a rod [rod] poslal sotva polovinu mužů. Druhou polovinu omluvil: sklizeň, mor mezi dobytkem, rozbité cesty. Pán/Paní [hlava rodu] píše se vznešenou zdvořilostí a bez jediné pravdy. [marshal.Title] [marshal.name] ukazuje na mapu a říká: „Tohle je ten rod, který by měl být první.“

1. Uložit rodu pokutu
2. Přimhouřit oko
3. Poslat komisaře, ať muže spočítá *(riskantní volba)*

### 17. Rody před trůnem  `h_v_rody_pred_korunou` *(Panovník)*

> Rod [rod] a rod [druhý rod] předstoupily před trůn se svým sporem. Jde o dluh, o louku, o dávný zápis na hraniční kámen, o urážku na hostině, a jak to bývá, o všechno najednou. Pán/Paní [hlava rodu] mluví hlasitě, pán/paní [hlava druhého rodu] ještě hlasitěji. Dvůr čeká a každý ví, že rozsudek nikdo nezapomene.

1. Rozhodnout ve prospěch rodu [rod]
2. Rozhodnout ve prospěch rodu [druhý rod]
3. Nařídit smír pod hrozbou pokuty *(riskantní volba)*
4. Nechat rozhodnout božím soudem
