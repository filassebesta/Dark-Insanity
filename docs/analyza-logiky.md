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
| Dva rychtáři v Lipnici | Po vyhrané volbě (`s_rychtar_volba`) zůstal rychtář v radě a události posílaly hráče „za rychtářem“; po „Podpořit souseda“ zůstal starý rychtář | Starý rychtář vždy skládá úřad (`target` + `replaceCourt`); když vyhraje hráč, jeho místo v radě je **konšel/konšelka** (`roleLabel(…, flags)`, vlastní životopisy); volby „za rychtářem“ mají pro rychtáře vlastní variantu (mez, obecní truhla, klidné období, závist sousedů) |
| Povahy rádců u sedláka | Sedlák „zbavil úřadu“ kováře, kovář chtěl „půdu, čest a místo“, donašeč odešel „v poutech“ | Sedlák vyhlásí krádež na návsi, vyžene donašeče z gruntu; vesnická verze „Zaslouží si víc“ (`q_ctizadost_ves`: groše, přímluva u pána, místo na posvícení) |
| Svobodník a události nevolníka | `s_povstani` sliboval svobodu svobodnému; hrozba vyhnání po výkupu, kde stálo „Grunt zůstává“ | Povstání bojuje o konec roboty pro vsi; svobodník dostane vlastní krizi `krize_s_nemilost_svobodnik` (žaloba u zemského soudu) a konec „vyhnání“ to vypráví soudem, ne vyhozením. Čísla beze změny |
| Pán vždy muž | Natvrdo „Pán…“, „pánovi“, „pánův“ v textech sedláka (25 % pánů jsou ženy) | Tvary `{L:…\|…}` a `{lord.title}` v kronikách a textech, popisky voleb neutrálně („vrchnost“, „panský dvůr“), protože popisky se neinterpolují |
| Rozpory volba × text | `n_pujcka_rodu` +8 zlata, ač dluh nebyl splacen; `ozvena_n_pomsta` popraviště × věž; `s_pozar_stodoly` nápověda síla, hod inteligence | Půjčka 20 je pryč, louky dají víc bohatství (+10); ozvěna mluví o věži; nápověda inteligence |
| Texty pro „odjakživa urozený“ rod | „bojoval po boku vládcova otce“, „pochází z koňských handlířů“, předek „kterého by se nestyděl ani král“ | Neutrální znění; rod ze vsi (`origin === 'sedlak'`) si v klidném období nechá sepsat kroniku rodu místo hledání předků |
| Rádci šlechtice s královskými životopisy | „písař královské komory“ u purkrabího drobného šlechtice | `NOBLE_BIOS` pro purkrabího, hejtmana a důvěrníka |
| Rod bez sídla | Hostina „na svém sídle“, hraniční spor a nájezd rodu, jehož sídlo dobyl hráč | Tyto události cílí jen na rody, které sídlo drží; zástava pozemků jen u rodu s půdou |
| Cesta k trůnu po zlomeném povstání | Obava, že po milosti zbývá jen smrt krále nebo spiknutí | Ověřeno: milost i ubráněná tvrz nechávají titul 4, příznak vzpoury se maže a po 8 obdobích odpočinku je povstání (`crown`) znovu cílem tažení. Beze změny kódu |
| Drobnosti nalezené cestou | Věta začínala malým písmenem („hejtmanka…“), smír s povstalci psal „Král“ i královně | Token `{target.Role}`, ženský tvar pro královnu ve `war.js` |

## Co zbývá

- `s_vykup`, volba „Smlouvat o cenu“: kroniky „Pán nakonec slevil“ a „Pán se urazil“ jsou dál v mužském rodě. Řádek s úspěchem nese i cenu výkupu, kterou teď ladí jiná práce na ekonomice sedláka (a neúspěch je hned pod ním), takže se nechaly být, aby se změny nesrazily. Po sloučení stačí `{L:Pán nakonec slevil|Paní nakonec slevila}` a `{L:Pán se urazil|Paní se urazila}`.
- Název zdroje „Přízeň pána“ a ambice „V pánově přízni“ zůstávají: jmenují instituci (panství), ne konkrétní osobu.
- `docs/udalosti.md` je generovaný přehled a je už starší (chybí kariéra); nové a přejmenované volby se do něj promítnou při příštím přegenerování.

## Vyvážení (doporučení)

- **Začátek za sedláka (vyřešeno):** nebyl těžký, ale stál na roční „práci na gruntu“, kterou šlo zadat jen z mapy. Rozumný hráč, který ji neobjevil, krachoval ve 23 % her. Teď ji příběh nabídne po žních sám (`s_prace_na_gruntu`); krachy rozumného hráče klesly na ~2 %, napůl chybujícího z ~50 % na ~23 %.
- **Cesta ke koruně je dlouhá** (medián ~65 let, 2–3 generace). To je záměr kroniky rodu, ale povstání ji zkracuje pro odvážné.
- **Císař** je pro hráče, který válčí: bot, který neustále táhne na sousedy s plnou hotovostí, se jím stane zhruba v polovině her.
