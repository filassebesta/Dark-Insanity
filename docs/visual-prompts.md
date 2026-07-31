# Insanity Kingdom — Vizuální prompty pro AI generování

Claude negeneruje obrázky, takže tenhle dokument je zadání pro externí obrázkové AI
(Midjourney, DALL·E, Stable Diffusion/Flux, Leonardo.ai...). Prompty zkopíruješ,
vygeneruješ, ořízneš a uložíš pod názvy souborů z manifestu na konci — kód se pak
bude odkazovat přímo na tyhle cesty.

## Jak na to

1. Prompty jsou psané anglicky — modely na ně reagují nejkonzistentněji.
2. Za text každého promptu vlož blok `{STYLE}` (viz níže) — drží jednotný vizuální
   styl napříč všemi assety, navazuje na referenční main menu obrázek.
3. Pokud nástroj podporuje seed / style reference (Midjourney `--seed`, `--sref`),
   použij stejný napříč celou sadou.
4. **Portréty a scény generuj jednotlivě** — AI lépe udrží detail a podobnost.
   **Ikony a terén generuj jako grid sheet** — jsou jednodušší, AI je líp udrží
   oddělené v gridu. Proto jsou sekce 6 a 7 psané jako jeden prompt na celý sheet.
5. Po vygenerování ořízni jednotlivé dlaždice/varianty a ulož podle manifestu
   v sekci 10.

Pro Midjourney přidej na konec `--ar <poměr> --style raw --v 6` (raw = drží se
promptu, míň "midjourney" stylizace). Pro DALL·E/SDXL/Flux funguje prompt beze
změny, negativní část za `--no` patří u SDXL/Flux do negative promptu.

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

Červenou barvu drž jen na výrazných akcentech (koruny, krev, praporce) — podle
main menu referenčního obrázku. Zbytek zůstává sépiová rytina.

## 1b. Scénářové nálady (modifikátor {STYLE} podle obtížnosti)

Základní {STYLE} zůstává stejný pro všechny assety, ale u obsahu konkrétního
scénáře (Panovník/Šlechtic/Sedlák) přidej na konec navíc tohle:

- **Panovník** (bohatší): `, warmer golden highlights, richer ink depth`
- **Šlechtic** (neutrální): beze změny, čistý {STYLE}
- **Sedlák** (syrovější): `, more desaturated palette, gritty muted earth
  tones, harsher rougher linework, colder shadows`

---

## 2. UI rámy a pozadí

**`assets/ui/parchment_bg.png`** — 1:1, dlaždicovatelné
```
seamless tileable texture of aged parchment / vellum paper, deep coffee-stain
blotches, cracked edges, subtle candle-burn marks, fine paper grain, no
illustration or text, {STYLE}
```

**`assets/ui/frame_ornate.png`** — 4:5, prázdný střed
```
ornate gothic picture frame carved from dark wood inlaid with wrought iron
scrollwork, symmetrical filigree corners, empty flat center panel for content,
{STYLE}
```

**`assets/ui/divider_skull.png`** — 4:1
```
horizontal ornamental line divider, small human skull centerpiece flanked by
curling vine flourishes and crossed bones, thin engraved linework, {STYLE}
```

---

## 3. Výběr scénáře (Panovník / Šlechtic / Sedlák)

**`assets/scenario/king.png`** — 3:4 (lze případně ořezat z main menu obrázku)
```
a weary crowned king in ornate robes standing before his throne, hand resting
on the pommel of a sword, three-quarter view, noble but burdened bearing,
{STYLE}
```

**`assets/scenario/vassal.png`** — 3:4
```
a young minor noble in modest but fine armor and a house tabard, standing at
the gate of a small provincial keep, ambitious expression, one hand on a
sword hilt, {STYLE}
```

**`assets/scenario/peasant.png`** — 3:4
```
a barefoot peasant in ragged homespun clothes standing in a muddy field
before a distant burning village, holding a simple wooden pitchfork,
determined expression despite hardship, {STYLE}
```

---

## 4. Postavy / portréty (bust, 3/4 úhel)

**`assets/portraits/heir.png`** — 3:4
```
a young noble heir in fine but understated clothing, close bust portrait,
three-quarter angle, uncertain youthful expression, faint family resemblance
to nobility, {STYLE}
```

**`assets/portraits/spouse_queen.png`** — 3:4
```
a queen consort in an embroidered gown and modest jeweled circlet, close bust
portrait, calm composed expression, three-quarter angle, {STYLE}
```

**`assets/portraits/spouse_king.png`** — 3:4
```
a king consort in a fine doublet and modest circlet, close bust portrait,
calm composed expression, three-quarter angle, {STYLE}
```

**`assets/portraits/chancellor.png`** — 3:4
```
an elderly chancellor in long scholarly robes, holding a ledger and quill,
close bust portrait, shrewd calculating expression, thin spectacles, {STYLE}
```

**`assets/portraits/marshal.png`** — 3:4
```
a battle-scarred marshal in plate armor with a fur-lined cloak, close bust
portrait, stern hardened expression, a scar across one eyebrow, {STYLE}
```

**`assets/portraits/spymaster.png`** — 3:4
```
a hooded spymaster half in shadow, only part of the face visible, close bust
portrait, sly knowing half-smile, {STYLE}
```

*(Vládcův herní portrét — viz sekce 4b. `scenario/king.png` zůstává jen pro
obrazovku výběru scénáře, samostatně od hráčovy postupující postavy.)*

---

## 4b. Portrét vládce — 5 stupňů sociálního postavení + stárnutí

Vládcova vlastní postava (hráč) vizuálně roste podle dvou nezávislých os:

- **Status (5 pevných stupňů)** — vlastní ilustrace pro každý stupeň (níže).
- **Věk (plynulý)** — řeší se přes `aging_overlay.png` (šediny/vrásky),
  aplikovaný jako CSS blend vrstva přes aktuální stupňový portrét podle
  věku postavy. Žádné samostatné "mladá/stará" verze negenerujeme.

Generuj všech 5 stupňů v jedné sérii se stejným seedem / character
reference (Midjourney `--seed`, `--cref`), ať je jasně vidět postup JEDNÉ
postavy, ne 5 různých lidí.

**`assets/portraits/ruler_tier1_peasant.png`** — 2:3, pas nahoru
```
a gaunt peasant in ragged patched homespun clothes and worn leather wraps on
the feet, waist-up three-quarter view, calloused hands, weary but resolute
expression, {STYLE}
```

**`assets/portraits/ruler_tier2_freeman.png`** — 2:3, pas nahoru
```
a sturdy freeman in a simple but well-mended wool tunic and leather jerkin, a
plain iron dagger at the belt, waist-up three-quarter view, hardened
confident expression, {STYLE}
```

**`assets/portraits/ruler_tier3_minor_noble.png`** — 2:3, pas nahoru
```
a minor noble in a fitted doublet with a small embroidered house sigil
brooch, leather riding gloves, waist-up three-quarter view, calculating
ambitious expression, {STYLE}
```

**`assets/portraits/ruler_tier4_great_noble.png`** — 2:3, pas nahoru
```
a powerful vassal lord in fur-trimmed embroidered robes and a heavy gold
chain of office, a signet ring visible on one hand, waist-up three-quarter
view, commanding proud expression, {STYLE}
```

**`assets/portraits/ruler_tier5_king.png`** — 2:3, pas nahoru
```
a crowned king in ermine-trimmed royal robes holding a scepter, waist-up
three-quarter view, regal authoritative expression, {STYLE}
```

**`assets/ui/aging_overlay.png`** — 2:3, izolováno na jednobarevném pozadí
(NENÍ pro oříznutí — je to blend vrstva, drž ji na plném bílém/černém pozadí
pro čisté prolnutí)
```
a subtle semi-transparent overlay texture of fine grey hair strands, soft
wrinkle linework, and faint age spots, isolated on a plain flat background
for easy blending, engraving crosshatch linework, {STYLE}
```

---

## 5. Mapa království

**`assets/map/kingdom_map.png`** — 16:10
```
hand-drawn antique cartography map of a small medieval kingdom seen from
above, five distinct provinces divided by hand-inked borders, a mix of dense
forests, mountain ranges, and winding trade roads connecting them, a walled
capital city marked at the center, a compass rose in one corner, {STYLE}
```

**`assets/map/terrain_icons_sheet.png`** — 3:2, grid 3×2 (6 ikon)
```
a clean icon set of 6 small medieval map symbols arranged evenly in a 3x2
grid on a plain aged parchment background: a dense forest cluster, a jagged
mountain peak, a winding trade road with a merchant cart, a river crossing
with a stone bridge, a walled capital castle, a small village with a wooden
palisade — each icon simple, iconic, clearly separated with consistent
linework and even spacing, {STYLE}
```

**`assets/map/shield_blank.png`** — 1:1
```
a single blank heraldic shield template, plain unadorned surface ready for a
coat of arms, ornate engraved shield border, {STYLE}
```
*(Až budou provincie pojmenované, dá se do štítu domalovat/vygenerovat erb
každé zvlášť — teď je to placeholder pro všech 5.)*

**`assets/map/unrest_overlay.png`** — 1:1, izolováno na jednobarevném pozadí
(NENÍ pro oříznutí — blend vrstva jako `aging_overlay.png`, vykresluje se
přes provincii na mapě podle míry nepokojů, škáluj průhlednost/intenzitu
podle hodnoty nepokojů)
```
dark ominous smoke and storm clouds swirling upward, isolated on a plain
flat background for easy blending, engraving crosshatch linework, subtle and
semi-transparent, {STYLE}
```

---

## 6. Ikony zdrojů (7) — jeden sheet

**`assets/icons/resources_sheet.png`** — grid 4×2 (jedno pole prázdné)
```
a clean icon set of 7 small medieval heraldic icons arranged evenly in a grid
on a plain aged parchment background, each in its own cell with consistent
spacing and linework: an overflowing pile of gold coins (Gold), a tied sheaf
of wheat (Food), two crossed swords behind a helmet (Army), a solid stone
pillar (Stability), a royal signet ring with a crown (Legitimacy), a chalice
topped with a small cross (Faith), a laurel wreath encircling a star
(Prestige) — simple, iconic, clearly separated, {STYLE}
```

---

## 7. Ikony vlastností (4) — jeden sheet

**`assets/icons/traits_sheet.png`** — grid 2×2
```
a clean icon set of 4 small medieval icons arranged evenly in a 2x2 grid on a
plain aged parchment background, each in its own cell: an armored clenched
fist (Strength), a herald's trumpet wrapped in a flowing scroll ribbon
(Eloquence), an owl perched atop a stack of books (Intelligence), an
hourglass entwined with a thorny vine (Patience) — simple, iconic, clearly
separated, consistent linework, {STYLE}
```
*(Přesýpací hodiny u Trpělivosti záměrně navazují na kostlivce s přesýpacími
hodinami z main menu.)*

---

## 8. Scény pro eventy (dialogové ilustrace)

**`assets/events/scene_throne_audience.png`** — 16:9
```
wide interior view of a gothic throne room during a royal audience, a
petitioner kneeling before the throne, courtiers watching from the shadows,
tall stained-glass windows, {STYLE}
```

**`assets/events/scene_war_council.png`** — 16:9
```
a war council scene, armored commanders leaning over a map table inside a
candlelit war tent, visible tension in their postures, {STYLE}
```

**`assets/events/scene_forest_ambush.png`** — 16:9
```
a narrow forest road at dusk, shadowy bandit figures emerging from dense
trees to ambush a small traveling party, sense of sudden danger, {STYLE}
```

**`assets/events/scene_market.png`** — 16:9
```
a crowded medieval market square lined with wooden stalls, merchants and
townsfolk bartering, a cathedral spire visible in the background, {STYLE}
```

**`assets/events/scene_cathedral.png`** — 16:9
```
interior of a grand gothic cathedral, a lone robed figure kneeling in prayer
before a candlelit altar, high vaulted ceiling, {STYLE}
```

**`assets/events/scene_dungeon.png`** — 16:9
```
a damp stone dungeon cell lit by a single torch, chains on the wall, a
shadowy prisoner figure, oppressive atmosphere, {STYLE}
```

**`assets/events/scene_feast.png`** — 16:9
```
a grand medieval feast hall, a long banquet table filled with food and
goblets, nobles seated in fine dress, musicians in a corner, {STYLE}
```

**`assets/events/scene_plague_village.png`** — 16:9
```
a stricken village street, shuttered houses marked with warning crosses, a
lone cloaked figure walking through drifting fog, sense of dread and
illness, {STYLE}
```

**`assets/events/scene_succession.png`** — 4:5 (ne 16:9 — jde o speciální
celoobrazovkovou scénu, ne běžnou dialogovou kartu)
```
a solemn candlelit cathedral coronation, a young heir kneeling as a bishop
lowers a crown onto their head, the old king's draped empty throne visible
in the shadows behind, mourning and renewal at once, {STYLE}
```
*(Speciální scéna pro přechod generace při přirozené smrti stářím — spouští
se jen při tomhle konkrétním přechodu, ne jako běžný náhodný event.)*

---

## 9. Konce hry (4)

**`assets/endings/ending_death.png`** — 4:5
```
a fallen crowned king lying at the foot of his own throne, a bloodied blade
nearby, candles guttering out around him, somber tragic composition, {STYLE}
```

**`assets/endings/ending_conquest.png`** — 4:5
```
an enemy army's foreign banners raised over a captured castle gate, the
kingdom's own broken banner lying trampled in the mud, {STYLE}
```

**`assets/endings/ending_collapse.png`** — 4:5
```
a crumbling throne room overtaken by cracks, dust, and encroaching vines, the
throne empty and abandoned, symbolizing a dynasty's end, {STYLE}
```

**`assets/endings/ending_golden_age.png`** — 4:5
```
a thriving kingdom viewed from a high balcony at golden sunrise, bountiful
fields, a bustling prosperous city, banners flying proudly, {STYLE}
```
*(Jediný obrázek v celé sadě, kde je OK přidat teplejší zlaté světlo místo
čisté sépie — je to jediný pozitivní konec hry.)*

---

## 10. Manifest složek (kam po oříznutí uložit)

```
assets/
  ui/
    parchment_bg.png
    frame_ornate.png
    divider_skull.png
    aging_overlay.png
  scenario/
    king.png
    vassal.png
    peasant.png
  portraits/
    ruler_tier1_peasant.png
    ruler_tier2_freeman.png
    ruler_tier3_minor_noble.png
    ruler_tier4_great_noble.png
    ruler_tier5_king.png
    heir.png
    spouse_queen.png
    spouse_king.png
    chancellor.png
    marshal.png
    spymaster.png
  map/
    kingdom_map.png
    terrain_icons_sheet.png
    shield_blank.png
    unrest_overlay.png
  icons/
    resources_sheet.png
    traits_sheet.png
  events/
    scene_throne_audience.png
    scene_war_council.png
    scene_forest_ambush.png
    scene_market.png
    scene_cathedral.png
    scene_dungeon.png
    scene_feast.png
    scene_plague_village.png
    scene_succession.png
  endings/
    ending_death.png
    ending_conquest.png
    ending_collapse.png
    ending_golden_age.png
```
