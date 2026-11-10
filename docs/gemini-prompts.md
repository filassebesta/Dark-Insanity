# Insanity Kingdom — prompty pro Gemini (obrázky)

Tenhle soubor je „objednávkový list“ obrázků. Každý prompt je hotový ke
zkopírování do Gemini (Gemini app → **Vytvořit obrázek**). U každého je:

- **Soubor** — přesný název, pod kterým obrázek nahraješ,
- **Rozlišení / poměr stran** — co napsat Gemini a v jaké velikosti ho hra použije,
- **Kde se zobrazí** — ať víš, proč má kompozice vypadat takhle,
- **Prompt** — text pro Gemini (anglicky, Gemini v angličtině drží styl spolehlivěji).

> Hlavní menu (`assets/ui/menu_background.png`) zůstává **původní rytina** —
> pro menu nic negeneruj.

> **Staré obrázky jsou smazané.** Všechno, co vzniklo ořezáním ze sprite
> sheetu a muselo se zvětšovat (scény událostí, portréty dvora, výchozí
> scéna, pozadí hradu, papírová textura), je pryč. Dokud nenahraješ nové,
> hra místo nich ukazuje tmavé malířské pozadí nebo zlaté iniciály jména.
> Papírovou texturu teď kreslí přímo kód, tu generovat nemusíš.

---

## 0. Jak na to (postup)

1. **Jeden obrázek = jeden prompt.** Gemini nedělá spolehlivě sprite sheety
   a mřížky, takže tady každá věc dostane vlastní generování.
2. **Poměr stran napiš do promptu** (už je tam). Pokud ti Gemini vrátí jiný
   poměr, napiš do stejného chatu: *„Same image, but in 1:1 aspect ratio.“*
3. **Konzistence postav:** u portrétů vládce nejdřív vygeneruj mladou verzi,
   pak ji **přilož jako obrázek** do dalšího promptu (stará verze) — v promptu
   je napsáno *„the same person as in the attached image“*.
4. **Stylová kotva:** k prvnímu promptu v každém chatu přilož jeden z nových
   portrétů vládce (`assets/portraits/ruler_king_male.jpg` nebo
   `ruler_king_female.jpg` — stáhneš je z GitHubu) a připiš *„Match the
   painting style of the attached image.“* Celá hra pak bude vypadat jednotně.
   U portrétů dvora (sekce 6) je tahle věta už v promptu.
5. **Žádný text v obrázku.** Pokud tam Gemini přesto napíše písmena,
   řekni mu: *„Remove all text and letters.“*
6. **Stáhni v plné velikosti** a nahraj na GitHub do složky
   **`assets/_incoming/`** (Add file → Upload files → do větve
   `claude/insanity-kingdom-html-game-dccy50`). Pojmenuj soubor podle
   řádku **Soubor**. Já pak obrázek oříznu, zmenším/zaostřím na cílové
   rozlišení, převedu na JPG a přesunu na správné místo.
   *(Když ho nahraješ rovnou na cílovou cestu, hra ho najde i bez mě — kód
   si soubory sám hledá a když chybí, použije výchozí obrázek.)*
7. Gemini neumí **průhledné pozadí** — tady ho ale nikde nepotřebuješ
   (ikony a mapa jsou kreslené kódem).

### Stylový blok — je už vložený v každém promptu

Pro jistotu ho tu máš i samostatně, kdybys chtěl psát vlastní prompty:

```
Painted in the style of a dark-fantasy narrative RPG: muted oil painting with
visible loose brushwork and subtle canvas texture, desaturated earthy palette
of ochre, rust, olive green and dusty slate blue, soft dramatic chiaroscuro
lighting, melancholic late-medieval Central European atmosphere, realistic
proportions, cinematic composition, similar in mood to "The Life and
Suffering of Sir Brante". Strong colour only on small accents (blood, crowns,
banners, candle flame). Avoid: anime, cartoon, 3D render, photography,
neon or oversaturated colours, smooth airbrushed digital art, any text,
letters, watermark or signature.
```

---

## 1. Přehled — co je hotové a co chybí

✅ = hotovo a ve hře · ❌ = chybí (pořadí = doporučená priorita)

| Stav | Soubor | Poměr | Cílové rozlišení | Kde se zobrazí | Prompt |
|---|---|---|---|---|---|
| ✅ | `ruler_king_male.jpg`, `ruler_king_female.jpg` | 4:5 | 1024 × 1280 | Postava, plaketa, Dvůr | 2.1, 2.2 |
| ✅ | `ruler_king_male_old.jpg`, `ruler_king_female_old.jpg` | 4:5 | 1024 × 1280 | Postava od 55 let | 2.3, 2.4 |
| ❌ | `scene_default.jpg` | 1:1 | 2048 × 2048 | Scéna, když událost nemá vlastní obrázek | 7.1 |
| ❌ | `backdrop.jpg` | 16:9 | 1920 × 1080 | Rozmazané pozadí: nová hra, výběr scénáře, načtení, možnosti | 7.2 |
| ❌ | `heir_male.jpg`, `heir_female.jpg` | 4:5 | 1024 × 1280 | Dvůr, Postava → Rodina | 6.1, 6.2 |
| ❌ | `spouse_male.jpg`, `spouse_female.jpg` | 4:5 | 1024 × 1280 | Dvůr, Postava → Rodina | 6.3, 6.4 |
| ❌ | `chancellor_male.jpg`, `chancellor_female.jpg` | 4:5 | 1024 × 1280 | Dvůr | 6.5, 6.6 |
| ❌ | `marshal_male.jpg`, `marshal_female.jpg` | 4:5 | 1024 × 1280 | Dvůr | 6.7, 6.8 |
| ❌ | `spymaster_male.jpg`, `spymaster_female.jpg` | 4:5 | 1024 × 1280 | Dvůr | 6.9, 6.10 |
| ✅ | 9 × `<id_eventu>.jpg` | 1:1 | 2048 × 2048 | Scéna konkrétní události | 3.1 – 3.9 |
| ✅ | `quiet_season.jpg` | 1:1 | 2048 × 2048 | Scéna „Klidné období“ | 3.10 |
| ✅ | `ending_death.jpg`, `ending_conquest.jpg`, `ending_collapse.jpg`, `ending_golden_age.jpg` | 16:9 | 1920 × 1080 | Konec hry | 5.1 – 5.4 |
| ✅ | `scenario_panovnik.jpg`, `scenario_sedlak.jpg` | 3:2 | 1200 × 800 | Karty výběru scénáře | 4.1, 4.3 |
| ❌ | `scenario_slechtic.jpg` | 3:2 | 1200 × 800 | Karta scénáře Šlechtic | 4.2 |
| ❌ | `kingdom_map.jpg` | 3:2 | 2400 × 1600 | Podklad interaktivní mapy | 9 |

Celkem chybí **14 obrázků**.

**Volitelné varianty pro královnu:** scény `rada_manzela`, `varovani_kancelere`
a `zprava_spehmistra` ukazují krále. Když nahraješ `<název>_female.jpg`
(např. `zprava_spehmistra_female.jpg`), hra ho použije, když vládne královna.
V Gemini stačí ke staré scéně napsat: *„Same image, but the ruler is a
crowned queen instead of a king.“* Gemini obvykle vrací kolem 1024 px na delší
straně — to nevadí, na cílové rozlišení to dotáhnu já. Důležitý je
**poměr stran a kompozice**.

---

## 2. Portrét vládce (avatar) — ✅ hotovo

**Kde se zobrazí:** obrazovka *Postava* (velký rám 4:5) a malé kulaté okénko
v plaketě dole na scéně (z obrázku se bere horní střed — **obličej musí být
v horní třetině**, ne úplně u okraje).
**Kompozice:** busta / po pás, postava mírně natočená, tmavé neutrální
pozadí (tmavě hnědá až černá), světlo z boku jako od okna nebo svíce.

### 2.1 `ruler_king_male.jpg` — Král (mladší, ~30 let)
Rozlišení: **4:5, cíl 1024 × 1280**

```
Portrait painting, aspect ratio 4:5. A late-medieval Central European king,
about 30 years old, shown from the chest up, slightly turned to the left and
looking at the viewer with a tired, watchful expression. Short dark beard,
shoulder-length brown hair, a simple heavy iron-and-gold crown, dark red
velvet robe with a worn ermine collar, a chain of office on his chest. Plain
dark umber background fading to black, warm side light from a window on the
left, deep shadows on the right half of the face. His face sits in the upper
third of the frame with some headroom above the crown.
Painted in the style of a dark-fantasy narrative RPG: muted oil painting with
visible loose brushwork and subtle canvas texture, desaturated earthy palette
of ochre, rust, olive green and dusty slate blue, soft dramatic chiaroscuro
lighting, melancholic late-medieval atmosphere, realistic proportions,
similar in mood to "The Life and Suffering of Sir Brante". Avoid: anime,
cartoon, 3D render, photography, oversaturated colours, airbrushed digital
art, any text, letters, watermark or signature.
```

### 2.2 `ruler_king_female.jpg` — Královna (mladší, ~30 let)
Rozlišení: **4:5, cíl 1024 × 1280**

```
Portrait painting, aspect ratio 4:5. A late-medieval Central European reigning
queen, about 30 years old, shown from the chest up, slightly turned to the
right and looking at the viewer with calm, guarded authority. Dark auburn
hair braided and pinned under a thin gold crown and a sheer white veil, deep
green velvet gown with a worn ermine mantle, a heavy signet ring visible on
a hand resting near her collar. Plain dark umber background fading to black,
warm candle light from the right, deep shadow on the left half of the face.
Her face sits in the upper third of the frame with some headroom above the
crown.
Painted in the style of a dark-fantasy narrative RPG: muted oil painting with
visible loose brushwork and subtle canvas texture, desaturated earthy palette
of ochre, rust, olive green and dusty slate blue, soft dramatic chiaroscuro
lighting, melancholic late-medieval atmosphere, realistic proportions,
similar in mood to "The Life and Suffering of Sir Brante". Avoid: anime,
cartoon, 3D render, photography, oversaturated colours, airbrushed digital
art, any text, letters, watermark or signature.
```

### 2.3 `ruler_king_male_old.jpg` — Král ve stáří (~60 let)
Rozlišení: **4:5, cíl 1024 × 1280** — **přilož vygenerovaný obrázek 2.1!**

```
Use the attached portrait as reference: the same man, the same crown, robe,
pose, background and lighting, but about 30 years older — around 60. Grey
thinning hair, long grey beard, deep wrinkles, sunken tired eyes, slightly
stooped shoulders, the ermine collar more worn. Keep the exact same painting
style, framing and aspect ratio 4:5. No text or letters.
```

### 2.4 `ruler_king_female_old.jpg` — Královna ve stáří (~60 let)
Rozlišení: **4:5, cíl 1024 × 1280** — **přilož vygenerovaný obrázek 2.2!**

```
Use the attached portrait as reference: the same woman, the same crown,
veil, gown, pose, background and lighting, but about 30 years older — around
60. Silver-grey hair under the veil, deep wrinkles, thinner face, sharp
tired eyes, the mantle more worn. Keep the exact same painting style,
framing and aspect ratio 4:5. No text or letters.
```

> Volitelně později (pro scénáře Šlechtic / Sedlák) stejným způsobem:
> `ruler_noble_male.jpg`, `ruler_minor_noble_…`, `ruler_freeman_…`,
> `ruler_peasant_…` (+ `_old`). Hra je už umí načíst.

---

## 3. Scény událostí

**Kde se zobrazí:** velký obraz vlevo na herní obrazovce (zhruba čtverec,
ořezává se na šířku i výšku podle okna).
**Kompozice pro všechny scény:**
- hlavní motiv ve **středu a horní polovině**,
- **spodní třetina tmavší a klidná** (přes ni je nadpis události a plaketa
  vládce),
- okraje obrazu mohou být neostré / tmavé — kus se může oříznout.

Rozlišení u všech: **1:1, cíl 2048 × 2048**.

### 3.1 `soud_o_mez.jpg` — Spor dvou sedláků

```
Square painting, aspect ratio 1:1. Interior of a cold stone throne hall in a
late-medieval castle. Two poor peasants in patched wool tunics stand before
an empty wooden throne on a low dais, one pointing angrily at the other, the
other clutching his cap and a crude wooden boundary stake. Courtiers and a
scribe watch from the shadows along the walls. Pale daylight falls from a
high narrow window onto the two men. The lower third of the image is dark
stone floor in shadow, calm and uncluttered.
Painted in the style of a dark-fantasy narrative RPG: muted oil painting with
visible loose brushwork and subtle canvas texture, desaturated earthy palette
of ochre, rust, olive green and dusty slate blue, soft dramatic chiaroscuro
lighting, melancholic late-medieval Central European atmosphere, realistic
proportions, cinematic composition, similar in mood to "The Life and
Suffering of Sir Brante". Avoid: anime, cartoon, 3D render, photography,
oversaturated colours, airbrushed digital art, any text, letters, watermark
or signature.
```

### 3.2 `posel_k_vazalovi.jpg` — Posel k vazalovi

```
Square painting, aspect ratio 1:1. A lone royal messenger on a dark horse at
a crossroads at dawn, holding a sealed letter with a red wax seal. Three paths
lead away: one into a dark dense forest on the right, one up toward misty
grey mountains in the background, one along a wide trade road with a distant
wagon on the left. A weathered wooden signpost without any writing. Cold
morning mist, low sun behind clouds. The lower third is a dark muddy road in
shadow, calm and uncluttered.
Painted in the style of a dark-fantasy narrative RPG: muted oil painting with
visible loose brushwork and subtle canvas texture, desaturated earthy palette
of ochre, rust, olive green and dusty slate blue, soft dramatic chiaroscuro
lighting, melancholic late-medieval Central European atmosphere, realistic
proportions, cinematic composition, similar in mood to "The Life and
Suffering of Sir Brante". Avoid: anime, cartoon, 3D render, photography,
oversaturated colours, airbrushed digital art, any text, letters, watermark
or signature.
```

### 3.3 `rvaci_v_krcme.jpg` — Rváči v krčmě

```
Square painting, aspect ratio 1:1. The interior of a smoky low-ceilinged
medieval tavern at night. Three drunk mercenaries in battered leather and
mail armour overturn a table, one raising a clay jug as if to throw it,
spilled ale and broken stools on the floor. Two city guards with spears and
lanterns hesitate at the door. Frightened tavern keeper behind the counter.
Warm orange firelight from a hearth against cold blue shadows. The lower
third is a dark wooden floor in shadow, calm and uncluttered.
Painted in the style of a dark-fantasy narrative RPG: muted oil painting with
visible loose brushwork and subtle canvas texture, desaturated earthy palette
of ochre, rust, olive green and dusty slate blue, soft dramatic chiaroscuro
lighting, melancholic late-medieval Central European atmosphere, realistic
proportions, cinematic composition, similar in mood to "The Life and
Suffering of Sir Brante". Avoid: anime, cartoon, 3D render, photography,
oversaturated colours, airbrushed digital art, any text, letters, watermark
or signature.
```

### 3.4 `sepot_o_tvrde_ruce.jpg` — Šeptání o tvrdé ruce

```
Square painting, aspect ratio 1:1. A muddy medieval village square at dusk.
Small groups of peasants whisper to each other, glancing nervously toward a
distant castle on a hill. A pillory with empty shackles stands in the middle
of the square. A woman pulls a child closer; an old man shakes his head.
Grey overcast sky, smoke from chimneys, a few warm lit windows. The lower
third is dark trampled mud in shadow, calm and uncluttered.
Painted in the style of a dark-fantasy narrative RPG: muted oil painting with
visible loose brushwork and subtle canvas texture, desaturated earthy palette
of ochre, rust, olive green and dusty slate blue, soft dramatic chiaroscuro
lighting, melancholic late-medieval Central European atmosphere, realistic
proportions, cinematic composition, similar in mood to "The Life and
Suffering of Sir Brante". Avoid: anime, cartoon, 3D render, photography,
oversaturated colours, airbrushed digital art, any text, letters, watermark
or signature.
```

### 3.5 `doziny.jpg` — Dožínky

```
Square painting, aspect ratio 1:1. A harvest festival at the edge of a golden
wheat field at sunset. Peasants dance in a circle around a large straw figure
crowned with a wreath of wheat and wildflowers, a bonfire burning beside it,
ribbons and old pagan symbols carved on a wooden pole. In the foreground on
the left, a stern priest in a dark robe watches with disapproval. Warm golden
evening light, long shadows. The lower third is dark stubble field in
shadow, calm and uncluttered.
Painted in the style of a dark-fantasy narrative RPG: muted oil painting with
visible loose brushwork and subtle canvas texture, desaturated earthy palette
of ochre, rust, olive green and dusty slate blue, soft dramatic chiaroscuro
lighting, melancholic late-medieval Central European atmosphere, realistic
proportions, cinematic composition, similar in mood to "The Life and
Suffering of Sir Brante". Avoid: anime, cartoon, 3D render, photography,
oversaturated colours, airbrushed digital art, any text, letters, watermark
or signature.
```

### 3.6 `varovani_kancelere.jpg` — Varování kancléře

```
Square painting, aspect ratio 1:1. Inside a half-empty castle granary in late
autumn. An elderly chancellor in a dark fur-trimmed robe holds a lantern and
an open ledger, pointing at the few remaining grain sacks. Empty wooden bins,
a thin cat, frost on the small window, snow beginning to fall outside. Cold
blue light from the window, warm lantern glow on the chancellor's worried
face. The lower third is a dark stone floor with scattered grain in shadow,
calm and uncluttered.
Painted in the style of a dark-fantasy narrative RPG: muted oil painting with
visible loose brushwork and subtle canvas texture, desaturated earthy palette
of ochre, rust, olive green and dusty slate blue, soft dramatic chiaroscuro
lighting, melancholic late-medieval Central European atmosphere, realistic
proportions, cinematic composition, similar in mood to "The Life and
Suffering of Sir Brante". Avoid: anime, cartoon, 3D render, photography,
oversaturated colours, airbrushed digital art, any text, letters, watermark
or signature.
```

### 3.7 `zprava_spehmistra.jpg` — Zpráva špehmistra

```
Square painting, aspect ratio 1:1. A narrow dark castle corridor at night.
A spymaster in a hooded charcoal cloak leans close and hands over a small
folded note sealed with black wax. Behind him, through a half-open door, a
group of noblemen whisper around a candle-lit table. Single candle light,
deep black shadows, a faint glint of a hidden dagger at the spymaster's belt.
The lower third is dark flagstone floor in shadow, calm and uncluttered.
Painted in the style of a dark-fantasy narrative RPG: muted oil painting with
visible loose brushwork and subtle canvas texture, desaturated earthy palette
of ochre, rust, olive green and dusty slate blue, soft dramatic chiaroscuro
lighting, melancholic late-medieval Central European atmosphere, realistic
proportions, cinematic composition, similar in mood to "The Life and
Suffering of Sir Brante". Avoid: anime, cartoon, 3D render, photography,
oversaturated colours, airbrushed digital art, any text, letters, watermark
or signature.
```

### 3.8 `vojenska_prehlidka.jpg` — Vojenská přehlídka

```
Square painting, aspect ratio 1:1. A military parade on a muddy field below
castle walls. Rows of foot soldiers with spears and round shields, knights on
horseback with dark red banners without any symbols or letters, a grizzled
marshal in plate armour riding at the front. Crowds of peasants watch from
the sides. Overcast sky with a break of pale sunlight on the banners. The
lower third is dark trampled ground in shadow, calm and uncluttered.
Painted in the style of a dark-fantasy narrative RPG: muted oil painting with
visible loose brushwork and subtle canvas texture, desaturated earthy palette
of ochre, rust, olive green and dusty slate blue, soft dramatic chiaroscuro
lighting, melancholic late-medieval Central European atmosphere, realistic
proportions, cinematic composition, similar in mood to "The Life and
Suffering of Sir Brante". Avoid: anime, cartoon, 3D render, photography,
oversaturated colours, airbrushed digital art, any text, letters, watermark
or signature.
```

### 3.9 `rada_manzela.jpg` — Rada u soukromého slyšení

```
Square painting, aspect ratio 1:1. A private chamber in a castle tower in the
evening. A richly dressed noble spouse sits by a fireplace, leaning forward
to speak earnestly, one hand resting on a small table with a chess board
mid-game and two goblets of wine. An empty carved chair faces them, as if
waiting for the ruler. Warm firelight, tapestries in shadow, a narrow window
with a dark blue night sky. The lower third is a dark rug and floor in
shadow, calm and uncluttered.
Painted in the style of a dark-fantasy narrative RPG: muted oil painting with
visible loose brushwork and subtle canvas texture, desaturated earthy palette
of ochre, rust, olive green and dusty slate blue, soft dramatic chiaroscuro
lighting, melancholic late-medieval Central European atmosphere, realistic
proportions, cinematic composition, similar in mood to "The Life and
Suffering of Sir Brante". Avoid: anime, cartoon, 3D render, photography,
oversaturated colours, airbrushed digital art, any text, letters, watermark
or signature.
```

### 3.10 `quiet_season.jpg` — Klidné období

```
Square painting, aspect ratio 1:1. A peaceful late-medieval landscape: a
small walled town with a castle on a low hill, patchwork fields, a slow river
with a wooden bridge, a farmer with an ox cart on the road, smoke rising
lazily from chimneys. Soft hazy afternoon light, a few birds in a pale sky.
Calm, quiet, slightly melancholic mood. The lower third is a dark grassy
meadow in shadow, calm and uncluttered.
Painted in the style of a dark-fantasy narrative RPG: muted oil painting with
visible loose brushwork and subtle canvas texture, desaturated earthy palette
of ochre, rust, olive green and dusty slate blue, soft dramatic chiaroscuro
lighting, melancholic late-medieval Central European atmosphere, realistic
proportions, cinematic composition, similar in mood to "The Life and
Suffering of Sir Brante". Avoid: anime, cartoon, 3D render, photography,
oversaturated colours, airbrushed digital art, any text, letters, watermark
or signature.
```

---

## 4. Karty výběru scénáře

**Kde se zobrazí:** horní obrázek na kartě scénáře (široký pruh asi
300 × 170 px, při najetí myší se lehce přiblíží). Motiv musí být čitelný
i v malém — **jeden jasný předmět nebo postava uprostřed**.
Rozlišení u všech: **3:2, cíl 1200 × 800**.

### 4.1 `scenario_panovnik.jpg` — Panovník

```
Wide painting, aspect ratio 3:2. A heavy royal crown resting on a red velvet
cushion on a dark wooden throne, a sceptre leaning beside it, a high castle
window behind with pale light falling on the crown. Everything else in deep
shadow. Simple, iconic, readable even as a small thumbnail.
Painted in the style of a dark-fantasy narrative RPG: muted oil painting with
visible loose brushwork and subtle canvas texture, desaturated earthy palette
of ochre, rust, olive green and dusty slate blue, soft dramatic chiaroscuro
lighting, melancholic late-medieval atmosphere, similar in mood to "The Life
and Suffering of Sir Brante". Avoid: anime, cartoon, 3D render, photography,
oversaturated colours, any text, letters, watermark or signature.
```

### 4.2 `scenario_slechtic.jpg` — Šlechtic

```
Wide painting, aspect ratio 3:2. A nobleman's gauntleted hand pressing a
signet ring into red sealing wax on a letter, on a wooden desk with a
candle, a dagger and a folded map. A modest manor hall in shadow behind.
Simple, iconic, readable even as a small thumbnail.
Painted in the style of a dark-fantasy narrative RPG: muted oil painting with
visible loose brushwork and subtle canvas texture, desaturated earthy palette
of ochre, rust, olive green and dusty slate blue, soft dramatic chiaroscuro
lighting, melancholic late-medieval atmosphere, similar in mood to "The Life
and Suffering of Sir Brante". Avoid: anime, cartoon, 3D render, photography,
oversaturated colours, any text, letters, watermark or signature.
```

### 4.3 `scenario_sedlak.jpg` — Sedlák

```
Wide painting, aspect ratio 3:2. A weary peasant in a patched wool tunic
standing in a muddy field at dusk, leaning on a wooden pitchfork, a poor
thatched hut behind him and a distant castle silhouette on the horizon.
Simple, iconic, readable even as a small thumbnail.
Painted in the style of a dark-fantasy narrative RPG: muted oil painting with
visible loose brushwork and subtle canvas texture, desaturated earthy palette
of ochre, rust, olive green and dusty slate blue, soft dramatic chiaroscuro
lighting, melancholic late-medieval atmosphere, similar in mood to "The Life
and Suffering of Sir Brante". Avoid: anime, cartoon, 3D render, photography,
oversaturated colours, any text, letters, watermark or signature.
```

---

## 5. Konce hry

**Kde se zobrazí:** celoobrazovkové pozadí obrazovky „Konec kroniky“.
Hra ho **rozmaže a silně ztmaví** a doprostřed napíše text — takže
detaily nejsou důležité, rozhoduje **silueta, světlo a nálada**. Střed
obrazu ať je spíš klidný (je přes něj text).
Rozlišení u všech: **16:9, cíl 1920 × 1080**.

### 5.1 `ending_death.jpg` — Smrt (vládce zemřel bez možnosti pokračovat)

```
Wide cinematic painting, aspect ratio 16:9. A royal funeral bier in a dark
cathedral nave: a body covered with a dark red cloth, a crown resting on top,
tall candles on both sides, mourners in black hoods kneeling in the distance.
A single beam of cold light from a high window. The center of the image is
calm and dark.
Painted in the style of a dark-fantasy narrative RPG: muted oil painting with
visible loose brushwork and subtle canvas texture, desaturated earthy palette
of ochre, rust, olive green and dusty slate blue, soft dramatic chiaroscuro
lighting, melancholic late-medieval atmosphere, similar in mood to "The Life
and Suffering of Sir Brante". Avoid: anime, cartoon, 3D render, photography,
oversaturated colours, any text, letters, watermark or signature.
```

### 5.2 `ending_conquest.jpg` — Dobytí

```
Wide cinematic painting, aspect ratio 16:9. A castle burning at night after a
siege: broken gates, smoke rising into a red-black sky, foreign soldiers'
silhouettes on the walls, a torn dark red banner lying in the mud in the
foreground. The center of the image is dominated by smoke and glow, calm
enough for text.
Painted in the style of a dark-fantasy narrative RPG: muted oil painting with
visible loose brushwork and subtle canvas texture, desaturated earthy palette
of ochre, rust, olive green and dusty slate blue, soft dramatic chiaroscuro
lighting, melancholic late-medieval atmosphere, similar in mood to "The Life
and Suffering of Sir Brante". Avoid: anime, cartoon, 3D render, photography,
oversaturated colours, any text, letters, watermark or signature.
```

### 5.3 `ending_collapse.jpg` — Kolaps (vzpoura, rozpad říše)

```
Wide cinematic painting, aspect ratio 16:9. An empty throne hall in ruin after
a rebellion: the throne overturned, tapestries torn, a broken crown on the
floor among scattered papers, rain falling through a collapsed part of the
roof, grey dawn light. No people. The center of the image is calm and empty.
Painted in the style of a dark-fantasy narrative RPG: muted oil painting with
visible loose brushwork and subtle canvas texture, desaturated earthy palette
of ochre, rust, olive green and dusty slate blue, soft dramatic chiaroscuro
lighting, melancholic late-medieval atmosphere, similar in mood to "The Life
and Suffering of Sir Brante". Avoid: anime, cartoon, 3D render, photography,
oversaturated colours, any text, letters, watermark or signature.
```

### 5.4 `ending_golden_age.jpg` — Zlatý věk

```
Wide cinematic painting, aspect ratio 16:9. A prosperous kingdom at golden
hour seen from a castle balcony: a thriving town with market stalls, ripe
fields to the horizon, a river with trading boats, banners fluttering on the
towers, a cathedral under construction with wooden scaffolding. Warm golden
light, but still painterly and a little melancholic. The center of the image
is open sky, calm enough for text.
Painted in the style of a dark-fantasy narrative RPG: muted oil painting with
visible loose brushwork and subtle canvas texture, desaturated earthy palette
of ochre, rust, olive green and dusty slate blue, soft dramatic chiaroscuro
lighting, melancholic late-medieval atmosphere, similar in mood to "The Life
and Suffering of Sir Brante". Avoid: anime, cartoon, 3D render, photography,
oversaturated colours, any text, letters, watermark or signature.
```

---

## 6. Dvůr — portréty rádců a rodiny

**Kde se zobrazí:** panel *Dvůr* (kulaté okénko 72 px) a v obrazovce
*Postava* v části *Rodina* (kulaté okénko 48 px). Z obrázku se bere výřez
**obličeje** — ať je obličej **uprostřed v horní třetině** a dobře nasvícený.
Každá postava má mužskou i ženskou verzi, protože hra pohlaví losuje.
**Postup:** ke každému promptu přilož jeden z hotových portrétů vládce, ať
mají všichni stejný styl a pozadí.

### 6.1 `heir_male.jpg` — Dědic (chlapec)
Rozlišení: **4:5, cíl 1024 × 1280** — přilož `ruler_king_male.jpg` nebo `ruler_king_female.jpg` jako stylovou kotvu

```
Portrait painting, aspect ratio 4:5. A noble boy of about 12, heir to the throne, serious and a little uneasy beyond his years. Short tousled brown hair, a thin silver circlet, a dark blue padded doublet with a small fur collar. Shown from the chest up,
slightly turned, plain dark umber background fading to black, warm side
light. The face sits in the upper third of the frame, centred, with a little
headroom.
Match the painting style, lighting, framing and dark background of the
attached portrait. Painted in the style of a dark-fantasy narrative RPG:
muted oil painting with visible loose brushwork and subtle canvas texture,
desaturated earthy palette, soft dramatic chiaroscuro, realistic proportions,
similar in mood to "The Life and Suffering of Sir Brante". Avoid: anime,
cartoon, 3D render, photography, oversaturated colours, airbrushed digital
art, any text, letters, watermark or signature.
```

### 6.2 `heir_female.jpg` — Dědička (dívka)
Rozlišení: **4:5, cíl 1024 × 1280** — přilož `ruler_king_male.jpg` nebo `ruler_king_female.jpg` jako stylovou kotvu

```
Portrait painting, aspect ratio 4:5. A noble girl of about 12, heir to the throne, composed and watchful beyond her years. Long braided light-brown hair, a thin silver circlet, a dark blue wool gown with a small fur collar. Shown from the chest up,
slightly turned, plain dark umber background fading to black, warm side
light. The face sits in the upper third of the frame, centred, with a little
headroom.
Match the painting style, lighting, framing and dark background of the
attached portrait. Painted in the style of a dark-fantasy narrative RPG:
muted oil painting with visible loose brushwork and subtle canvas texture,
desaturated earthy palette, soft dramatic chiaroscuro, realistic proportions,
similar in mood to "The Life and Suffering of Sir Brante". Avoid: anime,
cartoon, 3D render, photography, oversaturated colours, airbrushed digital
art, any text, letters, watermark or signature.
```

### 6.3 `spouse_male.jpg` — Manžel vládkyně (princ choť)
Rozlišení: **4:5, cíl 1024 × 1280** — přilož `ruler_king_male.jpg` nebo `ruler_king_female.jpg` jako stylovou kotvu

```
Portrait painting, aspect ratio 4:5. A late-medieval prince consort of about 32, husband of the reigning queen. Neatly trimmed dark beard, a thin gold circlet, a dark green velvet doublet with a fur-trimmed mantle, calm but ambitious eyes. Shown from the chest up,
slightly turned, plain dark umber background fading to black, warm side
light. The face sits in the upper third of the frame, centred, with a little
headroom.
Match the painting style, lighting, framing and dark background of the
attached portrait. Painted in the style of a dark-fantasy narrative RPG:
muted oil painting with visible loose brushwork and subtle canvas texture,
desaturated earthy palette, soft dramatic chiaroscuro, realistic proportions,
similar in mood to "The Life and Suffering of Sir Brante". Avoid: anime,
cartoon, 3D render, photography, oversaturated colours, airbrushed digital
art, any text, letters, watermark or signature.
```

### 6.4 `spouse_female.jpg` — Manželka vládce (královna choť)
Rozlišení: **4:5, cíl 1024 × 1280** — přilož `ruler_king_male.jpg` nebo `ruler_king_female.jpg` jako stylovou kotvu

```
Portrait painting, aspect ratio 4:5. A late-medieval queen consort of about 30, wife of the king. Dark hair pinned under a thin gold circlet and a short veil, a deep wine-red velvet gown with a fur collar, an intelligent, slightly guarded expression. Shown from the chest up,
slightly turned, plain dark umber background fading to black, warm side
light. The face sits in the upper third of the frame, centred, with a little
headroom.
Match the painting style, lighting, framing and dark background of the
attached portrait. Painted in the style of a dark-fantasy narrative RPG:
muted oil painting with visible loose brushwork and subtle canvas texture,
desaturated earthy palette, soft dramatic chiaroscuro, realistic proportions,
similar in mood to "The Life and Suffering of Sir Brante". Avoid: anime,
cartoon, 3D render, photography, oversaturated colours, airbrushed digital
art, any text, letters, watermark or signature.
```

### 6.5 `chancellor_male.jpg` — Kancléř
Rozlišení: **4:5, cíl 1024 × 1280** — přilož `ruler_king_male.jpg` nebo `ruler_king_female.jpg` jako stylovou kotvu

```
Portrait painting, aspect ratio 4:5. An elderly royal chancellor of about 58. Grey receding hair, clean-shaven, deep lines on the face, sharp tired eyes. A black fur-trimmed scholar's robe, a heavy silver chain of office, holding a closed ledger. Shown from the chest up,
slightly turned, plain dark umber background fading to black, warm side
light. The face sits in the upper third of the frame, centred, with a little
headroom.
Match the painting style, lighting, framing and dark background of the
attached portrait. Painted in the style of a dark-fantasy narrative RPG:
muted oil painting with visible loose brushwork and subtle canvas texture,
desaturated earthy palette, soft dramatic chiaroscuro, realistic proportions,
similar in mood to "The Life and Suffering of Sir Brante". Avoid: anime,
cartoon, 3D render, photography, oversaturated colours, airbrushed digital
art, any text, letters, watermark or signature.
```

### 6.6 `chancellor_female.jpg` — Kancléřka
Rozlišení: **4:5, cíl 1024 × 1280** — přilož `ruler_king_male.jpg` nebo `ruler_king_female.jpg` jako stylovou kotvu

```
Portrait painting, aspect ratio 4:5. An elderly royal chancelloress of about 55. Grey hair under a simple white linen wimple, sharp tired eyes, a black fur-trimmed robe, a heavy silver chain of office, holding a closed ledger. Shown from the chest up,
slightly turned, plain dark umber background fading to black, warm side
light. The face sits in the upper third of the frame, centred, with a little
headroom.
Match the painting style, lighting, framing and dark background of the
attached portrait. Painted in the style of a dark-fantasy narrative RPG:
muted oil painting with visible loose brushwork and subtle canvas texture,
desaturated earthy palette, soft dramatic chiaroscuro, realistic proportions,
similar in mood to "The Life and Suffering of Sir Brante". Avoid: anime,
cartoon, 3D render, photography, oversaturated colours, airbrushed digital
art, any text, letters, watermark or signature.
```

### 6.7 `marshal_male.jpg` — Maršál
Rozlišení: **4:5, cíl 1024 × 1280** — přilož `ruler_king_male.jpg` nebo `ruler_king_female.jpg` jako stylovou kotvu

```
Portrait painting, aspect ratio 4:5. A grizzled royal marshal of about 50. Short grey-streaked hair, a scar across one cheek, a weathered stern face. Dented steel plate gorget and pauldrons over a dark red gambeson, a heavy wool cloak. Shown from the chest up,
slightly turned, plain dark umber background fading to black, warm side
light. The face sits in the upper third of the frame, centred, with a little
headroom.
Match the painting style, lighting, framing and dark background of the
attached portrait. Painted in the style of a dark-fantasy narrative RPG:
muted oil painting with visible loose brushwork and subtle canvas texture,
desaturated earthy palette, soft dramatic chiaroscuro, realistic proportions,
similar in mood to "The Life and Suffering of Sir Brante". Avoid: anime,
cartoon, 3D render, photography, oversaturated colours, airbrushed digital
art, any text, letters, watermark or signature.
```

### 6.8 `marshal_female.jpg` — Maršálka
Rozlišení: **4:5, cíl 1024 × 1280** — přilož `ruler_king_male.jpg` nebo `ruler_king_female.jpg` jako stylovou kotvu

```
Portrait painting, aspect ratio 4:5. A battle-hardened royal marshal, a woman of about 45. Hair tied back tightly, a thin scar on the jaw, a weathered stern face. Dented steel plate gorget and pauldrons over a dark red gambeson, a heavy wool cloak. Shown from the chest up,
slightly turned, plain dark umber background fading to black, warm side
light. The face sits in the upper third of the frame, centred, with a little
headroom.
Match the painting style, lighting, framing and dark background of the
attached portrait. Painted in the style of a dark-fantasy narrative RPG:
muted oil painting with visible loose brushwork and subtle canvas texture,
desaturated earthy palette, soft dramatic chiaroscuro, realistic proportions,
similar in mood to "The Life and Suffering of Sir Brante". Avoid: anime,
cartoon, 3D render, photography, oversaturated colours, airbrushed digital
art, any text, letters, watermark or signature.
```

### 6.9 `spymaster_male.jpg` — Špehmistr
Rozlišení: **4:5, cíl 1024 × 1280** — přilož `ruler_king_male.jpg` nebo `ruler_king_female.jpg` jako stylovou kotvu

```
Portrait painting, aspect ratio 4:5. A royal spymaster of about 45. A charcoal hooded cloak pushed back slightly, a narrow clever face with a short dark beard, half of the face in deep shadow, a faint knowing smile, a black wax seal ring. Shown from the chest up,
slightly turned, plain dark umber background fading to black, warm side
light. The face sits in the upper third of the frame, centred, with a little
headroom.
Match the painting style, lighting, framing and dark background of the
attached portrait. Painted in the style of a dark-fantasy narrative RPG:
muted oil painting with visible loose brushwork and subtle canvas texture,
desaturated earthy palette, soft dramatic chiaroscuro, realistic proportions,
similar in mood to "The Life and Suffering of Sir Brante". Avoid: anime,
cartoon, 3D render, photography, oversaturated colours, airbrushed digital
art, any text, letters, watermark or signature.
```

### 6.10 `spymaster_female.jpg` — Špehmistryně
Rozlišení: **4:5, cíl 1024 × 1280** — přilož `ruler_king_male.jpg` nebo `ruler_king_female.jpg` jako stylovou kotvu

```
Portrait painting, aspect ratio 4:5. A royal spymistress of about 40. A charcoal hooded cloak with the hood half up, a narrow clever face, half in deep shadow, dark hair, a faint knowing smile, a black wax seal ring. Shown from the chest up,
slightly turned, plain dark umber background fading to black, warm side
light. The face sits in the upper third of the frame, centred, with a little
headroom.
Match the painting style, lighting, framing and dark background of the
attached portrait. Painted in the style of a dark-fantasy narrative RPG:
muted oil painting with visible loose brushwork and subtle canvas texture,
desaturated earthy palette, soft dramatic chiaroscuro, realistic proportions,
similar in mood to "The Life and Suffering of Sir Brante". Avoid: anime,
cartoon, 3D render, photography, oversaturated colours, airbrushed digital
art, any text, letters, watermark or signature.
```

---

## 7. Výchozí scéna a pozadí obrazovek

### 7.1 `scene_default.jpg` — Výchozí scéna
Rozlišení: **1:1, cíl 2048 × 2048**
**Kde se zobrazí:** vlevo na herní obrazovce u každé události, která ještě
nemá vlastní obrázek. Má být obecná a klidná — hlavní motiv nahoře, spodní
třetina tmavá (je přes ni nadpis a plaketa vládce).

```
Square painting, aspect ratio 1:1. A late-medieval stone castle on a rocky
hill above a misty valley at dusk, a few warm lit windows, dark banners on
the towers, crows circling, a winding road leading up to the gate. Heavy
grey clouds with a break of pale amber light behind the castle. The lower
third is a dark, calm hillside in shadow.
Painted in the style of a dark-fantasy narrative RPG: muted oil painting with
visible loose brushwork and subtle canvas texture, desaturated earthy palette
of ochre, rust, olive green and dusty slate blue, soft dramatic chiaroscuro
lighting, melancholic late-medieval Central European atmosphere, realistic
proportions, cinematic composition, similar in mood to "The Life and
Suffering of Sir Brante". Avoid: anime, cartoon, 3D render, photography,
oversaturated colours, airbrushed digital art, any text, letters, watermark
or signature.
```

### 7.2 `backdrop.jpg` — Pozadí vedlejších obrazovek
Rozlišení: **16:9, cíl 1920 × 1080**
**Kde se zobrazí:** za okny *Nová hra*, *Výběr scénáře*, *Načíst hru*,
*Možnosti* a jako náhradní pozadí konce hry. Hra ho **rozmaže a ztmaví**,
takže stačí jednoduchá kompozice se silnou siluetou a světlem.

```
Wide cinematic painting, aspect ratio 16:9. A panoramic view of a
late-medieval kingdom at dusk: a dark castle silhouette on a hill on the
left, a town with smoking chimneys below, a river winding through fields
toward distant mountains, a dramatic cloudy sky with warm amber light on the
horizon. The center of the image is calm and open.
Painted in the style of a dark-fantasy narrative RPG: muted oil painting with
visible loose brushwork and subtle canvas texture, desaturated earthy palette
of ochre, rust, olive green and dusty slate blue, soft dramatic chiaroscuro
lighting, melancholic late-medieval Central European atmosphere, realistic
proportions, cinematic composition, similar in mood to "The Life and
Suffering of Sir Brante". Avoid: anime, cartoon, 3D render, photography,
oversaturated colours, airbrushed digital art, any text, letters, watermark
or signature.
```

---

## 8. Kam to hra ukládá (pro kontrolu)

| Druh | Cesta ve hře | Když soubor chybí |
|------|--------------|-------------------|
| Portrét vládce | `assets/portraits/ruler_king_{male,female}.jpg` (+ `_old` od 55 let) | zlaté iniciály jména |
| Portrét dvora | `assets/portraits/{heir,spouse,chancellor,marshal,spymaster}_{male,female}.jpg` | zlaté iniciály jména |
| Scéna události | `assets/events/<id_eventu>.jpg` (u královny nejdřív `<id_eventu>_female.jpg`) | `scene_default.jpg` |
| Klidné období | `assets/events/quiet_season.jpg` | `scene_default.jpg` |
| Výchozí scéna | `assets/events/scene_default.jpg` | tmavé malířské pozadí |
| Pozadí obrazovek | `assets/ui/backdrop.jpg` | tmavé pozadí |
| Karta scénáře | `assets/ui/scenario_{panovnik,slechtic,sedlak}.jpg` | tmavá karta |
| Konec hry | `assets/endings/ending_{death,conquest,collapse,golden_age}.jpg` | `backdrop.jpg` |

Nahrávej ideálně do `assets/_incoming/` (nebo do `docs/` jako minule) —
já soubory zpracuji a přesunu.

---

## 9. Mapa království — `kingdom_map.jpg`

Rozlišení: **3:2, cíl 2400 × 1600** (Gemini vrátí menší, nevadí)
**Kde se zobrazí:** jako malovaný podklad interaktivní mapy. Všechno klikací
(hranice provincií, názvy, ikony míst, cesty k vazalovi, kouř nepokojů,
posádky, kompas) dál kreslí hra **přes obrázek**. Obrázek proto musí
**sedět na rozložení** a **nesmí v něm být žádný text, ikony ani kompas**.

**Postup:**
1. Stáhni z GitHubu předlohu **`docs/map_layout_guide.png`** (barevné
   plochy = provincie, modrá čára = řeka, hrady a města = značky).
2. V Gemini přilož **předlohu** a k ní jako stylovou kotvu jeden portrét
   vládce (`assets/portraits/ruler_king_male.jpg`).
3. Vlož prompt níže. Když Gemini posune pobřeží nebo řeku, napiš mu:
   *„Keep the coastline, river and region shapes exactly as in the layout
   image.“* Drobné posuny vyrovnám v kódu já.

```
Paint an illustrated fantasy kingdom map, aspect ratio 3:2, seen from above
like an old hand-painted map on aged parchment. Follow the FIRST attached
image exactly as the layout: keep the same coastline, the same river, the
same positions of the castles and towns and the same shapes of the five
regions. Use the second attached image only as the painting style reference.

Layout to follow:
- Grey-blue sea on the left side and along the whole bottom and bottom-right,
  painted with soft waves.
- Left region (coastal march): windswept grassy hills and cliffs along the
  sea, a small harbour town on the coast in the middle, a lonely stone abbey
  on a cliff further south.
- Top region (iron ridge): a band of rocky grey mountains with a mine
  entrance and spoil heaps in the middle.
- Right region (border forest): a dense dark pine and oak forest with a small
  hunters' village in its middle.
- Centre (crown land): fertile plains with a large royal stone castle in the
  exact centre, villages around it.
- Bottom region (grain lands): golden wheat fields and meadows, a market town
  where the river meets the road.
- A river flows from the mountains at the top down through the centre to the
  sea at the bottom.
- Dirt roads connect the royal castle with the harbour, the abbey and the
  market town. A watchtower stands in the mountain pass on the edge of the
  forest. A separate vassal castle stands alone in the far top-right corner
  outside the kingdom; beyond the kingdom the land is plain pale parchment.
- Region borders only as very faint natural transitions, no drawn borders.

Style: muted oil painting on parchment with visible brushwork, desaturated
earthy palette of ochre, olive green, rust and dusty slate blue, soft light
from the top-left, small detailed painted buildings and trees, slightly
weathered paper edges, similar in mood to "The Life and Suffering of Sir
Brante". Avoid: any text, letters, names, labels, numbers, compass rose,
legend, cartouche, frame, border lines, icons, grid, 3D render, photography,
oversaturated colours, cartoon style, watermark or signature.
```

**Co s mapou udělám já:** obrázek vložím jako spodní vrstvu mapy ve hře.
Současné kreslené stromy, hory a pole skryju a hranice provincií udělám
průhledné. Najetí myší provincii zvýrazní, kliknutí ukáže detail. Zoom, posun,
vrstvy (věrnost, nepokoje, posádky, cesty), ikony míst a volba cesty
k vazalovi zůstanou stejné jako teď.

