# Insanity Kingdom — Vizuální prompty pro AI generování

Claude negeneruje obrázky, takže tenhle dokument je zadání pro externí obrázkové AI
(Midjourney, DALL·E, Stable Diffusion/Flux, Leonardo.ai...). Prompty zkopíruješ,
vygeneruješ, ořízneš a uložíš pod názvy souborů z manifestu na konci — kód se pak
bude odkazovat přímo na tyhle cesty.

**Většina promptů je psaná jako sprite sheet** — jeden prompt = jedno vygenerování =
víc hotových assetů po oříznutí. Cílem je co nejmíň jednotlivých generování.
Jen tři věci musí zůstat samostatné, protože se nedají smysluplně naskládat
vedle sebe do jednoho obrázku: `parchment_bg.png` (musí být bezešvě
dlaždicovatelný), `kingdom_map.png` (jedna velká kompozice) a
`resources_sheet.png`/`traits_sheet.png` (ty jsou grid sheety odjakživa).

## Jak na to

1. Prompty jsou psané anglicky — modely na ně reagují nejkonzistentněji.
2. Za text každého promptu vlož blok `{STYLE}` (viz níže).
3. Po vygenerování ořízni sheet na jednotlivé buňky/panely podle popisu u
   každého promptu a ulož podle manifestu v sekci 12.
4. Pokud nástroj podporuje seed / style reference (Midjourney `--seed`,
   `--sref`), použij stejný napříč všemi sheety — a v rámci jednoho sheetu
   je to navíc automatické, protože je to jedno vygenerování.

Pro Midjourney přidej na konec `--ar <poměr> --style raw --v 6`. Pro
DALL·E/SDXL/Flux funguje prompt beze změny, negativní část za `--no` patří
u SDXL/Flux do negative promptu.

---

## 1. {STYLE} — základní stylový blok (vlož do KAŽDÉHO promptu níže)

```
dark medieval chronicle illustration, renaissance copperplate engraving style,
intricate crosshatched ink linework in the tradition of Albrecht Dürer and
Gustave Doré, aged sepia parchment color palette with a single muted blood-red
accent, weathered antique paper texture, ornate gothic border details, dramatic
chiaroscuro lighting, hand-drawn woodcut aesthetic, monochrome ink with sepia
wash --no color photo, 3D render, cartoon, anime, flat cel-shading, modern
clothing, smooth digital art, text, watermark, signature
```

Červenou barvu drž jen na výrazných akcentech (koruny, krev, praporce). Zbytek
zůstává sépiová rytina.

## 1c. Bílé pozadí u malých ikon → skutečná průhlednost přes remove.bg

Malé ikony, které se v UI zobrazují volně vedle textu (zdroje, vlastnosti,
terén/mapa — sekce 7–9), NEMAJÍ "parchment background" v promptu, i když
zbytek stylu zůstává stejný. Důvod: i s pečlivým ořezem by kolem ikony
zůstal viditelný obdélník pergamenu jiného odstínu, než má UI.

Žádný obrázkový AI model neumí spolehlivě vygenerovat opravdu průhledné
PNG přímo (ani když si o to řekneš v promptu), takže **plain white
background** je jen mezikrok. Postup pro tyhle 3 sheety:

1. Vygeneruj podle promptu (bílé pozadí).
2. Nahraj celý sheet do **remove.bg** (nebo obdobného nástroje na
   odstranění pozadí) → stáhni PNG se skutečnou průhledností. Na čistě
   bílém/plochém pozadí to funguje spolehlivě a je to zdarma bez
   instalace.
3. Teprve tenhle výsledek ořízni na jednotlivé ikony.

Portrétů, rámu, divideru (sekce 2, 4–6) ani celoobrazovkových scén (sekce
10–12) se tohle netýká — ty se zobrazují jako celý obdélníkový obrázek
(v rámečku nebo přes celou kartu), takže pergamenové/atmosférické pozadí
kolem nich je žádoucí, ne na škodu.

## 1b. Scénářové nálady (modifikátor {STYLE} podle obtížnosti)

- **Panovník** (bohatší): `, warmer golden highlights, richer ink depth`
- **Šlechtic** (neutrální): beze změny, čistý {STYLE}
- **Sedlák** (syrovější): `, more desaturated palette, gritty muted earth
  tones, harsher rougher linework, colder shadows`

---

## 2. Pozadí a UI rámy

**`assets/ui/parchment_bg.png`** — 1:1, dlaždicovatelné (samostatně, nejde spojit)
```
seamless tileable texture of aged parchment / vellum paper, deep coffee-stain
blotches, cracked edges, subtle candle-burn marks, fine paper grain, no
illustration or text, {STYLE}
```

**`assets/ui/ui_elements_sheet.png`** — 3:2, dvě oddělené položky vedle sebe
```
a reference sheet with two separate decorative elements side by side, clearly
separated with empty space between them: on the left, an ornate gothic
picture frame carved from dark wood inlaid with wrought iron scrollwork,
with an empty flat center panel; on the right, a horizontal ornamental
divider with a small skull centerpiece flanked by curling vine flourishes
and crossed bones, {STYLE}
```
Ořež: levá polovina → `assets/ui/frame_ornate.png`, pravá polovina →
`assets/ui/divider_skull.png`

---

## 3. Blend vrstvy (stárnutí + nepokoje)

**`assets/ui/overlays_sheet.png`** — 2:1, izolováno na jednobarevném pozadí
(NENÍ pro klasické oříznutí do UI — jde o blend vrstvy jako u aging/unrest)
```
a reference sheet with two separate semi-transparent overlay textures side
by side, isolated on a plain solid white background intended to be removed
for a transparent PNG — no texture, no gradient, no shadow on the
background itself: on the left, fine grey hair strands with soft wrinkle
linework and faint age spots; on the right, dark ominous smoke and storm
clouds swirling upward — engraving crosshatch linework, subtle and
semi-transparent, {STYLE}
```
Ořež: levá polovina → `assets/ui/aging_overlay.png` (vykresluje se přes
portrét vládce podle věku), pravá polovina → `assets/map/unrest_overlay.png`
(vykresluje se přes provincii na mapě podle míry nepokojů)

---

## 4. Výběr scénáře (Panovník / Šlechtic / Sedlák)

**`assets/scenario/scenario_select_sheet.png`** — 3:1, tři postavy vedle sebe
```
a reference sheet with three separate full-figure character illustrations
arranged side by side, each clearly separated by empty space, same
engraving style and lighting throughout: (1) a weary crowned king in ornate
robes standing before his throne, hand on the pommel of a sword; (2) a
young minor noble in modest fine armor and a house tabard standing at the
gate of a small keep; (3) a barefoot peasant in ragged homespun clothes
standing in a muddy field before a distant burning village, holding a
wooden pitchfork, {STYLE}
```
Ořež zleva doprava → `scenario/king.png`, `scenario/vassal.png`,
`scenario/peasant.png`

---

## 5. Portrét vládce — 5 stupňů sociálního postavení + stárnutí

Vládcova vlastní postava roste podle dvou os: **status** (5 pevných stupňů,
vlastní ilustrace níže) a **věk** (plynulý, řeší se přes
`ui/aging_overlay.png` — viz sekce 3 — aplikovaný jako CSS blend vrstva přes
aktuální stupňový portrét). Žádné samostatné "mladá/stará" verze negenerujeme.

**`assets/portraits/ruler_tiers_sheet.png`** — 5:2, 5 panelů v řadě, STEJNÁ
postava v každém panelu (jedno vygenerování = automatická konzistence)
```
a character progression reference sheet showing the SAME person across 5
panels arranged in a horizontal row, identical facial features and
identity throughout, only clothing and bearing changing to show rising
social status, waist-up three-quarter view in each panel, clear gutters
between panels: panel 1 — a gaunt peasant in ragged patched homespun
clothes, calloused hands, weary but resolute; panel 2 — a sturdy freeman in
a mended wool tunic and leather jerkin with a plain iron dagger; panel 3 —
a minor noble in a fitted doublet with a small embroidered house sigil
brooch and riding gloves; panel 4 — a powerful vassal lord in fur-trimmed
embroidered robes with a heavy gold chain of office and signet ring; panel
5 — a crowned king in ermine-trimmed royal robes holding a scepter, {STYLE}
```
Ořež panely 1–5 → `portraits/ruler_tier1_peasant.png`,
`ruler_tier2_freeman.png`, `ruler_tier3_minor_noble.png`,
`ruler_tier4_great_noble.png`, `ruler_tier5_king.png`

---

## 6. Vedlejší postavy (dvůr)

**`assets/portraits/side_characters_sheet.png`** — 3:2, grid 3×2 (6 portrétů)
```
a character reference sheet with 6 distinct bust portraits arranged evenly
in a 3x2 grid, each in its own cell with clear spacing, three-quarter
angle, consistent engraving style and lighting across all: (1) a young
noble heir in fine but understated clothing, uncertain youthful
expression; (2) a queen consort in an embroidered gown and modest jeweled
circlet, calm composed expression; (3) a king consort in a fine doublet and
modest circlet, calm composed expression; (4) an elderly chancellor in
long scholarly robes holding a ledger and quill, shrewd expression, thin
spectacles; (5) a battle-scarred marshal in plate armor with a fur-lined
cloak, stern expression, a scar across one eyebrow; (6) a hooded spymaster
half in shadow, only part of the face visible, sly knowing half-smile,
{STYLE}
```
Ořež grid po řádcích, zleva doprava → `portraits/heir.png`,
`spouse_queen.png`, `spouse_king.png`, `chancellor.png`, `marshal.png`,
`spymaster.png`

*(Tyto postavy mají jeden statický portrét po celou dobu hry, bez
stárnutí/změny statusu — jen vládce má vlastní systém z sekce 5.)*

---

## 7. Mapa království

**`assets/map/kingdom_map.png`** — 16:10 (samostatně, jde o jednu velkou
kompozici)
```
hand-drawn antique cartography map of a small medieval kingdom seen from
above, five distinct provinces divided by hand-inked borders, a mix of
dense forests, mountain ranges, and winding trade roads connecting them, a
walled capital city marked at the center, a compass rose in one corner,
{STYLE}
```

**`assets/map/map_icons_sheet.png`** — grid, 7 ikon
```
a clean icon set of 7 small medieval map symbols arranged evenly in a grid,
isolated on a plain solid white background intended to be removed for a
transparent PNG — no texture, no gradient, no shadow on the background
itself, each icon in its own cell with consistent linework and even
spacing: a dense forest cluster, a jagged mountain peak,
a winding trade road with a merchant cart, a river crossing with a stone
bridge, a walled capital castle, a small village with a wooden palisade,
and a single blank heraldic shield template ready for a coat of arms,
{STYLE}
```
Ořež → `map/terrain_forest.png`, `terrain_mountain.png`,
`terrain_traderoute.png`, `terrain_river.png`, `terrain_capital.png`,
`terrain_village.png`, `shield_blank.png`
*(Až budou provincie pojmenované, dá se do štítu domalovat/vygenerovat erb
každé zvlášť — teď je to placeholder pro všech 5.)*

---

## 8. Ikony zdrojů (7)

**`assets/icons/resources_sheet.png`** — grid 4×2 (jedno pole prázdné)
```
a clean icon set of 7 small medieval heraldic icons arranged evenly in a
grid, isolated on a plain solid white background intended to be removed
for a transparent PNG — no texture, no gradient, no shadow on the
background itself, each in its own cell with consistent spacing and
linework: an overflowing pile of gold coins (Gold), a tied sheaf of
wheat (Food), two crossed swords behind a helmet (Army), a solid stone
pillar (Stability), a royal signet ring with a crown (Legitimacy), a chalice
topped with a small cross (Faith), a laurel wreath encircling a star
(Prestige) — simple, iconic, clearly separated, {STYLE}
```

---

## 9. Ikony vlastností (4)

**`assets/icons/traits_sheet.png`** — grid 2×2
```
a clean icon set of 4 small medieval icons arranged evenly in a 2x2 grid,
isolated on a plain solid white background intended to be removed for a
transparent PNG — no texture, no gradient, no shadow on the background
itself, each in its own cell: an armored clenched fist
(Strength), a herald's trumpet wrapped in a flowing scroll ribbon
(Eloquence), an owl perched atop a stack of books (Intelligence), an
hourglass entwined with a thorny vine (Patience) — simple, iconic, clearly
separated, consistent linework, {STYLE}
```
*(Přesýpací hodiny u Trpělivosti záměrně navazují na kostlivce s přesýpacími
hodinami z main menu.)*

---

## 10. Scény pro eventy — sheet A (dvorní/výpravné)

**`assets/events/events_sheet_a.png`** — grid 2×2, 4 scény
```
a reference sheet of 4 wide illustrated scenes arranged in a 2x2 grid, each
scene clearly separated, consistent engraving style and lighting
throughout: (1) a gothic throne room during a royal audience, a petitioner
kneeling before the throne, courtiers watching from shadows, tall
stained-glass windows; (2) a war council, armored commanders leaning over a
map table in a candlelit war tent; (3) a crowded medieval market square
lined with wooden stalls, merchants and townsfolk bartering, a cathedral
spire in the background; (4) a grand medieval feast hall, a long banquet
table filled with food and goblets, nobles seated in fine dress, musicians
in a corner, {STYLE}
```
Ořež grid → `events/scene_throne_audience.png`, `scene_war_council.png`,
`scene_market.png`, `scene_feast.png`

## 11. Scény pro eventy — sheet B

**`assets/events/events_sheet_b.png`** — grid 2×2, 4 scény
```
a reference sheet of 4 wide illustrated scenes arranged in a 2x2 grid, each
scene clearly separated, consistent engraving style and lighting
throughout: (1) a narrow forest road at dusk, shadowy bandit figures
emerging from dense trees to ambush a small traveling party; (2) a damp
stone dungeon cell lit by a single torch, chains on the wall, a shadowy
prisoner figure; (3) a stricken village street, shuttered houses marked
with warning crosses, a lone cloaked figure walking through drifting fog;
(4) interior of a grand gothic cathedral, a lone robed figure kneeling in
prayer before a candlelit altar, high vaulted ceiling, {STYLE}
```
Ořež grid → `events/scene_forest_ambush.png`, `scene_dungeon.png`,
`scene_plague_village.png`, `scene_cathedral.png`

---

## 12. Velké okamžiky — 4 konce hry + přechod generace

**`assets/endings/major_moments_sheet.png`** — grid, 5 panelů, každý 4:5
```
a reference sheet of 5 tall dramatic full-scene illustrations arranged
evenly in a grid, each clearly separated, consistent engraving style
throughout: (1) a fallen crowned king lying at the foot of his own throne,
a bloodied blade nearby, candles guttering out, somber tragic composition;
(2) enemy foreign banners raised over a captured castle gate, the
kingdom's own broken banner trampled in the mud; (3) a crumbling throne
room overtaken by cracks, dust, and encroaching vines, the throne empty
and abandoned; (4) a thriving kingdom viewed from a high balcony at golden
sunrise, bountiful fields, a bustling prosperous city, banners flying
proudly — warmer golden light, the only warm panel in the set; (5) a
solemn candlelit cathedral coronation, a young heir kneeling as a bishop
lowers a crown onto their head, the old king's draped empty throne visible
in the shadows behind, {STYLE}
```
Ořež → `endings/ending_death.png`, `ending_conquest.png`,
`ending_collapse.png`, `ending_golden_age.png`, `events/scene_succession.png`
*(Poslední panel — korunovace — se spouští jen při přechodu generace při
přirozené smrti stářím, ne jako běžný náhodný event.)*

---

## 13. Manifest složek (kam po oříznutí uložit)

13 vygenerování níže pokrývá všechny assety z celého dokumentu.

```
assets/
  ui/
    parchment_bg.png            ← samostatné generování
    ui_elements_sheet.png        ← ořež na frame_ornate.png + divider_skull.png
    frame_ornate.png
    divider_skull.png
    overlays_sheet.png            ← ořež na aging_overlay.png + (map/)unrest_overlay.png
    aging_overlay.png
  scenario/
    scenario_select_sheet.png     ← ořež na king.png + vassal.png + peasant.png
    king.png
    vassal.png
    peasant.png
  portraits/
    ruler_tiers_sheet.png         ← ořež na ruler_tier1..5
    ruler_tier1_peasant.png
    ruler_tier2_freeman.png
    ruler_tier3_minor_noble.png
    ruler_tier4_great_noble.png
    ruler_tier5_king.png
    side_characters_sheet.png     ← ořež na heir/spouse_queen/spouse_king/chancellor/marshal/spymaster
    heir.png
    spouse_queen.png
    spouse_king.png
    chancellor.png
    marshal.png
    spymaster.png
  map/
    kingdom_map.png                ← samostatné generování
    map_icons_sheet.png            ← ořež na terrain_*.png + shield_blank.png
    terrain_forest.png
    terrain_mountain.png
    terrain_traderoute.png
    terrain_river.png
    terrain_capital.png
    terrain_village.png
    shield_blank.png
    unrest_overlay.png              ← z overlays_sheet.png (viz ui/)
  icons/
    resources_sheet.png            ← už sheet, ořež na 7 jednotlivých ikon dle potřeby v kódu
    traits_sheet.png                ← už sheet, ořež na 4 jednotlivé ikony dle potřeby v kódu
  events/
    events_sheet_a.png              ← ořež na scene_throne_audience/war_council/market/feast
    scene_throne_audience.png
    scene_war_council.png
    scene_market.png
    scene_feast.png
    events_sheet_b.png              ← ořež na scene_forest_ambush/dungeon/plague_village/cathedral
    scene_forest_ambush.png
    scene_dungeon.png
    scene_plague_village.png
    scene_cathedral.png
    scene_succession.png            ← z major_moments_sheet.png (viz endings/)
  endings/
    major_moments_sheet.png         ← ořež na ending_death/conquest/collapse/golden_age + succession
    ending_death.png
    ending_conquest.png
    ending_collapse.png
    ending_golden_age.png
```
