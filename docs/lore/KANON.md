# Kánon světa — Insanity Kingdom

Jediný zdroj pravdy o světě hry. **Vlastník: `lore-designer`.** Ostatní agenti ho
čtou, ale nemění; když potřebují nový fakt, požádají o něj v briefu.
Všechno tady je už **ve hře** (vytaženo z kódu) — nové fakty se sem zapisují ve
stejném commitu, ve kterém vstoupí do hry. Co ve hře zatím není, patří do
sekce **Otevřené otázky**.

Zdroj v kódu je uveden v závorce, ať se dá kánon s kódem rychle porovnat.

---

## 1. Tón a žánr

- Temná, melancholická pozdně středověká **střední Evropa** (české reálie, česká jména), bez magie, která by fungovala „doopravdy“: zázraky, kletby a čarodějnice existují jen jako **víra lidí**, nikdy jako jistý fakt.
- Vzor: *The Life and Suffering of Sir Brante* — každé rozhodnutí něco stojí, dobrá volba často bolí, svět si pamatuje.
- Humor jen suchý a krátký (šašek, sedlácká mazanost), nikdy parodie.
- Násilí se popisuje střídmě, následky víc než detail.

## 2. Království

Jméno království se ve hře **neuvádí** (otevřená otázka). Hlavní město a královský hrad: **Vlčí Úděl**.

### Provincie (`js/data.js` PROVINCE_TEMPLATES, `js/trade.js` PROVINCE_GOOD)

| id | Název | Zboží | Charakter |
|---|---|---|---|
| `capital` | Vlčí Úděl (hlavní město) | sukno | sídlo koruny a dvora, Královská cesta |
| `brodna` | Brodná | obilí | obilnice země, řeka **Brodnice**, město **Brod** s podzimním trhem se zrnem; ves **Lipnice** |
| `zelezny-hreben` | Železný Hřeben | železo | hory, doly a hutě (**Železná Huť**), kovárny zbrojí vojsko |
| `sokoli-hvozd` | Sokolí Hvozd | kožešiny | hluboký hvozd, osada **Sokolov**, strážní věž **Mýtnice**, lapkové; hranice s Marcemi |
| `pobrezni-mark` | Pobřežní Mark | sůl a ryby | jediný **Přístav Mark**, neklidné přístavní čtvrti, **Klášter na útesu** (opat) |

Mimo království: **Orlí Stráž** — hrad vzdáleného vazala za severovýchodní hranicí, vedou k němu tři cesty (les, hory, obchodní cesta).

### Místa na mapě (`js/map.js`)
Hrad Vlčí Úděl · Brod · Přístav Mark · Železná Huť · Sokolov · Mýtnice · Klášter na útesu · Orlí Stráž.

## 3. Cizí země (`js/trade.js` MARKETS)

| Země | Povaha | Obchod |
|---|---|---|
| **Východní marky** (markrabata, „Marky“) | bojovní sousedé za Sokolím hvozdem, občasné války a nájezdy | platí za železo a sukno, obilí mají vlastní |
| **Jižní říše** | bohatá říše za mořem | kupuje kožešiny a železo, prodává víno |
| **Severní pustiny** | chladná země za horami, cesta přes průsmyk zabíjí | obilí tam má cenu stříbra |

Víno se v království nevyrábí, jen dováží.

## 4. Šlechtické rody (`js/data.js` NOBLE_HOUSES)

| id | Rod | Sídlo | Povaha |
|---|---|---|---|
| `brana` | **páni z Bílé Brány** | Brodná | nejbohatší, půjčují králi, „za úsměvem nůž“; pod nimi leží Lipnice (vrchnost sedláka) |
| `rudi` | **Rudí páni z Hřebene** | Železný Hřeben | válečníci z hor, krátká trpělivost |
| `sokolove` | **Sokolové** | Sokolí Hvozd | hrdí strážci hranice s Marcemi, věrní a prchliví |

Hráčův rod ve scénáři Šlechtic sedí na tvrzi v **Pobřežní marce**.

## 5. Společnost

- **Žebříček postavení** (`STATUS_TIERS`): Sedlák/Selka → Svobodník/Svobodnice → Drobný šlechtic/Drobná šlechtična → Významný šlechtic/Významná šlechtična → Král/Královna.
- **Dvůr panovníka:** dědic, choť, kancléř, maršálek, špehmistr (tituly se ve šlechtickém a sedláckém scénáři mění, viz `js/court.js`).
- **Ves:** rychtář, kovář, krčmář, panský dráb, robota a dávky pánovi.
- **Církev:** biskup (desátek, vliv na dvůr), opat Kláštera na útesu (víra pobřeží), kněží, poutníci, kacíři, „čarodějnice“. Víra je zdroj (`faith`), ne magie.
- **Zdroje podle scénáře** (`RESOURCE_DEFS`): zlato/groše, jídlo/zásoby, vojsko/čeleď, stabilita/grunt, legitimita/nárok na trůn, víra, prestiž/pověst, přízeň krále/pána.

## 6. Jména (`js/data.js`)

- Mužská: Bořivoj, Vratislav, Jaromír, Přemysl, Zbyněk, Ctibor, Slavomír, Miloš, Oldřich, Jindřich, Kunrát, Smil.
- Ženská: Ludmila, Božena, Vlasta, Drahomíra, Milada, Kazimíra, Radka, Anežka.
- Nová jména volit staročeská / středověká (Bohuslav, Hynek, Dobroslava, Eliška…), nikdy moderní ani fantasy.

## 7. Pravidla psaní textů (závazná pro všechny události)

1. **Text události:** 2. osoba, přítomný čas, 2–4 věty, konkrétní obraz na začátku („Panský dráb stojí na zápraží…“). Končí napětím nebo otázkou, ne shrnutím.
2. **Volba (`label`):** infinitiv, max. ~45 znaků, **bez čísel a bez prozrazení důsledku** (důsledky jsou skryté — pravidlo projektu).
3. **Kronika (`chronicle`):** 1–2 věty, minulý čas; u Panovníka často 3. osoba („Vládce…“), u Sedláka 2. osoba („Dráb tě viděl…“). Má pointu, ne výčet efektů.
4. **Rod:** všude, kde se mluví o hráči nebo postavě, používat rodové tvary `{R:muž|žena}`, `{H:…}`, `{T:…}`, `{D:…}`, `{L:…}`, `{M:…}` a tokeny jako `{lord.title}`, `{chancellor.Title}`. Seznam platných tokenů hlídá `tools/check/validate.mjs`.
5. Žádná anglická slova, žádné moderní obraty („ok“, „stres“, „projekt“).
6. Svět si pamatuje: kde to dává smysl, navázat na dřívější volbu přes příznak (`hiddenEffects.setFlag`) nebo ozvěnu (`ECHO_HOOKS`).

## 8. Otevřené otázky (rozhoduje `creative-director` + `lore-designer`)

- Jméno království a jméno vládnoucí dynastie před hráčem.
- Historie: kdo založil Vlčí Úděl, poslední válka s Marcemi, proč je Orlí Stráž „vzdálený vazal“.
- Náboženství: jméno biskupství, světci, svátky (dožínky existují).
- Kultura Východních marek a Jižní říše (jména, zvyky) — zatím jen obchodní popis.
