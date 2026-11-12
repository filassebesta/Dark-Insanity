# Analýza logiky hry — co dává smysl a co zbývá

Revize celé hry po spojení tří scénářů do jedné kroniky (sedlák → šlechtic →
král → císař). Zdroj: čtení kódu všech událostí, simulace tisíců her
(`tools/sim/sim_career.mjs`) a ruční hra v prohlížeči od nové hry.

## Co bylo opraveno

| Problém | Proč nedával smysl | Oprava |
|---|---|---|
| Výběr Panovník / Šlechtic / Sedlák | Tři oddělené hry, i když na sebe příběhem navazují | Jedna kronika, vždy od pluhu |
| Erb a koruna ukončily kroniku | Hráč musel přes obrazovku „Konec“, aby hrál dál | Kapitoly uvnitř hry (`promote`) |
| Kovář a krčmář z Lipnice se stali maršálem a špehmistrem | Sousedé z vesnice by na tvrz nešli | Na tvrzi slouží noví lidé |
| Starý král žil dál i po korunovaci hráče | Kronika hlásila „Zemřel král…“ za vlády hráče | Sesazený král opouští příběh (`formerKing`) |
| Ambice sedláka běžely i šlechtici, královská přízeň po korunovaci | Sedlák „šetří groše“ jako šlechtic, král ztrácí prestiž za přízeň, kterou nemá | Ambice končí s povýšením |
| Dospělý dědic „dovršil 16 let“ po korunovaci a dostal druhý sňatek | Událost hlídala jen příznak krále | Sňatek dědice je jeden napříč stupni |
| Rádci mimo královský dvůr nikdy neumírali | Po korunovaci zemřeli všichni sedmdesátníci naráz | Rádci stárnou a umírají ve všech stupních |
| Nový král nikdy neměl dědice | Královský sňatek a „slabý nástupce“ přestaly existovat | Noví králové mívají děti |
| Smrt vzdáleného krále měnila přízeň pána sedláka | Pán z Bílé Brány nezávisí na tom, kdo sedí na trůnu | Jen u šlechtice |
| Karta kapitoly mohla zmizet | Smrt krále ji přepsala | Fronta vynucených událostí |
| Panovnice „král“ | Texty měly natvrdo „Král {jméno}“ | Tokeny `{king.title}`, `{K:…}` |
| „z rodu páni z Bílé Brány“ | Chybný pád | `{house.gen}` |
| Grunt, dluh, karavany pánovi po povýšení | Zmizely bez vysvětlení nebo platily „přízeň“ králi | Grunt se prodá, dluh se splatí, zboží se vrátí do skladu |
| Nevolník dostával události o zahraničním obchodu | Do ciziny smí jen svobodný | Až od svobodníka |
| Mladý nástupce s 30letou manželkou a školákem | Domácnost ignorovala věk | Věk rodiny podle vládce |

## Co zbývá (drobnější nálezy z auditu)

1. **Dva rychtáři v Lipnici.** Když hráč vyhraje volbu rychtáře (`s_rychtar_volba`), rychtář z rady zůstává a události dál nabízejí „jít za rychtářem“.
2. **Události o povahách rádců u sedláka** (`events_court.js`): sedlák „zbaví úřadu“ kováře nebo krčmáře, kovář chce „půdu, čest a místo“.
3. **Svobodník a události nevolníka:** `s_povstani` slibuje svobodu někomu, kdo už je svobodný; hrozba vyhnání z gruntu platí i po výkupu.
4. **Pán je v některých textech vždy muž** (`t_s_pan_podil`, kroniky „Pán…“), i když 25 % pánů jsou ženy.
5. **Rozpory volba × text:** `n_pujcka_rodu` (zisk +8 po půjčce 20, kronika říká nesplaceno), `ozvena_n_pomsta` (popraviště × věž), `s_pozar_stodoly` (nápověda síla, hod inteligence).
6. **Texty pro rod „odjakživa urozený“:** „bojoval po boku vládcova otce“, „pochází z koňských handlířů“ — u rodu ze vsi to nesedí.
7. **Životopisy nových rádců šlechtice** se berou z královských (písař královské komory…). Chybí vlastní šlechtické.
8. **Rod, který přišel o sídlo**, se v textech dál chová jako by ho držel (hostina „na svém sídle“).
9. **Po zlomeném povstání** a milosti zůstává titul, ale cesta k trůnu je už jen přes smrt krále nebo nové spiknutí.

## Vyvážení (doporučení)

- **Začátek za sedláka (vyřešeno):** nebyl těžký, ale stál na roční „práci na gruntu“, kterou šlo zadat jen z mapy. Rozumný hráč, který ji neobjevil, krachoval ve 23 % her. Teď ji příběh nabídne po žních sám (`s_prace_na_gruntu`); krachy rozumného hráče klesly na ~2 %, napůl chybujícího z ~50 % na ~23 %.
- **Cesta ke koruně je dlouhá** (medián ~65 let, 2–3 generace). To je záměr kroniky rodu, ale povstání ji zkracuje pro odvážné.
- **Císař** je pro hráče, který válčí: bot, který neustále táhne na sousedy s plnou hotovostí, se jím stane zhruba v polovině her.
