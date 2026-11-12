# Obrázky pro kariéru od pluhu ke koruně — objednávka pro Gemini

Nové obrázky k jedné kronice (sedlák → šlechtic → král → císař), k povstání
proti králi a k dalším královstvím. Hra funguje i bez nich: scény si půjčují
podobné obrázky, mapa světa je kreslená, cizí panovníci nemají portrét a císař
nosí portrét krále. Po dodání se obrázky zapnou samy, stačí je dát pod
správným názvem do správné složky.

**Jak na to:** zkopíruj celý blok jedné dávky, pošli ho do Gemini a obrázky
stáhni. Nahraj je na GitHub do `assets/_incoming/` (názvy nemusí sedět,
roztřídím je podle obsahu a zpracuju).

| Stav | Dávka | Co | Kusů | Formát | Složka | Kde se zobrazí |
|---|---|---|---|---|---|---|
| ✅ | K1 | Scény kapitol a povstání | 7 | 1:1 | `assets/events/` | scény událostí |
| ✅ | K2 | Císař a císařovna | 4 | 4:5 | `assets/portraits/` | plaketa, Postava, Dvůr |
| ✅ | K3 | Cizí panovníci | 6 | 4:5 | `assets/portraits/` | mapa světa → klik na zemi |
| ✅ | K4 | Malovaná mapa světa | 1 | 3:2 | `assets/map/` | Mapa → Svět |

**Všech 18 obrázků je dodaných a zapojených** (originály v `assets/_source/gemini/kariera/`).
Šest scén mělo vložený tmavý pás mezi ~59 % a ~84 % výšky; opraveno jen v tom rozsahu.
Malovaná mapa má jiné rozložení, než popisoval prompt (hory a les patří k domácímu
království), hranice v `js/world.js` jsou obtažené podle ní.

---

## Dávka K1 — Scény kapitol a povstání (1:1, 7 ks)

```
Generate one separate image for each line below. Each line has a file name
and a description. Return every image as its own file named exactly as the
file name. Do not combine images into a grid or sprite sheet.

Format: aspect ratio 1:1, 2048 x 2048. Main subject in the centre and upper
part of the image, the lower third darker and calm (text is shown over it).

Style for every image: painted in the style of a dark-fantasy narrative RPG,
muted oil painting with visible loose brushwork and subtle canvas texture,
desaturated earthy palette of ochre, rust, olive green and dusty slate blue,
soft chiaroscuro lighting, late-medieval Central European (Bohemian)
setting of the 14th century, realistic proportions, similar in mood to
"The Life and Suffering of Sir Brante". Avoid: anime, cartoon, 3D render,
photography, oversaturated colours, airbrushed digital art, any text,
letters, watermark or signature.

Images:
kapitola_erb.jpg — A weathered former peasant in a new but plain noble tunic watching servants hang a freshly painted coat of arms above the gate of a small stone keep on a windswept sea cliff; a few soldiers and villagers look on, grey sea and gulls behind.
kapitola_koruna.jpg — A coronation in a dim Gothic cathedral: a bishop lowers a golden crown onto the head of a kneeling ruler with rough, work-worn hands; nobles in fur-trimmed robes watch from the shadows with guarded faces, candles and incense smoke.
w_povstani_vitezstvi.jpg — A muddy rebel lord in battered armour walks into a royal throne hall through a broken door; the deposed king stands alone beside the empty throne without guards, the crown lying on a cushion between them, courtiers backing away.
w_povstani_porazka.jpg — Dusk outside a small fortified keep: the last exhausted rebels bar the gate while the long torch-lit column of a royal army with banners winds up the road towards them.
ozvena_vyhnany_kral.jpg — An exiled king in a travel-stained cloak on horseback at a river ford on the border, foreign mercenaries with crossbows and pikes gathering behind him, a frontier watchtower on the far bank.
n_cizi_posel.jpg — Night in the hall of a keep: a cloaked rider without any coat of arms, still wet from the rain, holds out a heavy signet ring to a wary lord by the light of a single candle; a guard's hand rests on his sword hilt.
ozvena_dluh_markam.jpg — A foreign envoy with a tall banner and twenty armed riders waits in the courtyard of a royal castle; the envoy unrolls a parchment demand before the king on the steps, tense guards on the walls.
```

---

## Dávka K2 — Císař a císařovna (4:5, 4 ks)

```
Generate one separate image for each line below. Each line has a file name
and a description. Return every image as its own file named exactly as the
file name. Do not combine images into a grid or sprite sheet.

Format: aspect ratio 4:5, 1024 x 1280. A waist-up portrait, the face in the
upper third, looking slightly past the viewer, plain dark background with a
soft warm glow behind the head.

Style for every image: painted in the style of a dark-fantasy narrative RPG,
muted oil painting with visible loose brushwork and subtle canvas texture,
desaturated earthy palette of ochre, rust, olive green and dusty slate blue,
soft chiaroscuro lighting, late-medieval Central European (Bohemian)
setting of the 14th century, realistic proportions, similar in mood to
"The Life and Suffering of Sir Brante". Avoid: anime, cartoon, 3D render,
photography, oversaturated colours, airbrushed digital art, any text,
letters, watermark or signature.

Images:
ruler_emperor_male.jpg — An emperor of about 40 who rose from common stock: a closed imperial crown with an arch over a weathered, broad face with a short beard, heavy ermine mantle over plain mail, a scarred hand resting on a sword pommel.
ruler_emperor_female.jpg — An empress of about 40 who rose from common stock: a closed imperial crown over braided dark hair, a calm hard gaze, heavy ermine mantle over a deep red gown, a strong hand holding a sceptre.
ruler_emperor_male_old.jpg — The same emperor at about 65: grey beard, deep lines, the closed crown and ermine mantle, tired but unbending eyes.
ruler_emperor_female_old.jpg — The same empress at about 65: grey braided hair under the closed crown, ermine mantle, a lined face that still commands the room.
```

---

## Dávka K3 — Cizí panovníci (4:5, 6 ks)

```
Generate one separate image for each line below. Each line has a file name
and a description. Return every image as its own file named exactly as the
file name. Do not combine images into a grid or sprite sheet.

Format: aspect ratio 4:5, 1024 x 1280. A waist-up portrait, the face in the
upper third, looking slightly past the viewer, plain dark background with a
soft warm glow behind the head.

Style for every image: painted in the style of a dark-fantasy narrative RPG,
muted oil painting with visible loose brushwork and subtle canvas texture,
desaturated earthy palette of ochre, rust, olive green and dusty slate blue,
soft chiaroscuro lighting, late-medieval Central European setting of the
14th century, realistic proportions, similar in mood to "The Life and
Suffering of Sir Brante". Avoid: anime, cartoon, 3D render, photography,
oversaturated colours, airbrushed digital art, any text, letters, watermark
or signature.

Images:
realm_east_male.jpg — The warrior king of the Eastern Marches: a lean, hard man of about 50 in dark steel armour with a simple iron circlet, a wolf-fur cloak, a long scar across the cheek.
realm_east_female.jpg — The warrior queen of the Eastern Marches: a woman of about 45 in dark steel armour with a simple iron circlet, a wolf-fur cloak, cropped grey-streaked hair, a steady soldier's gaze.
realm_north_male.jpg — The great chieftain of the Northern Wastes: a massive bearded man in layered furs and a bear-skin mantle, bone and amber ornaments, braided hair, frost on his beard.
realm_north_female.jpg — The great chieftainess of the Northern Wastes: a tall woman in layered furs and a white wolf-skin mantle, amber and bone ornaments in her braids, weathered pale face.
realm_south_male.jpg — The emperor of the Southern Empire across the sea: an elderly, smooth-faced man in layered silk and gold-embroidered brocade, a tall jewelled crown, rings on every finger, a cool merchant's smile.
realm_south_female.jpg — The empress of the Southern Empire across the sea: a woman of about 50 in layered silk and gold brocade, a tall jewelled crown and pearl strings, an unreadable, patient expression.
```

---

## Dávka K4 — Malovaná mapa světa (3:2, 1 ks)

Mapa musí držet rozložení zemí, protože přes ni hra kreslí klikací hranice.
Po dodání ji případně jemně dorovnám v kódu (`js/world.js`).

```
Generate one image named world_map.jpg.

Format: aspect ratio 3:2, 1896 x 1272 (landscape). A hand-painted
medieval fantasy map seen from directly above, drawn on aged parchment,
no text, no letters, no labels, no compass rose, no frame or border.

Layout (keep these positions exactly):
- The background is a calm grey-green sea.
- Centre-left (from about 17 % to 69 % of the width and from 22 % to 78 %
  of the height): a rounded kingdom of warm golden fields, small villages,
  a river running from the north mountains down to the south coast and a
  castle in its middle.
- Along the whole northern edge of that kingdom: a chain of snowy mountains.
  Above them, across the top of the map (from 15 % to 98 % of the width and
  from 3 % to 24 % of the height): cold grey tundra and pine forests of a
  northern tribal land with scattered yurt-like camps.
- Along the eastern edge of the kingdom: a dense dark forest strip. East of it
  (from 63 % to 99 % of the width and from 20 % to 83 % of the height):
  rugged brown hill country with fortified stone towers.
- Along the bottom of the map, across the sea (from 2 % to 75 % of the width,
  from 86 % to 100 % of the height): the coast of a rich southern land with
  terracotta port towns and ships.
- Open sea on the west side and between the kingdom and the southern coast.

Style: painted like the map of a dark-fantasy narrative RPG, muted oil
painting on parchment with visible brushwork, desaturated ochre, olive,
slate blue and rust colours, soft vignette at the edges. Avoid: text,
letters, labels, grid lines, 3D render, satellite photo, oversaturated
colours, watermark or signature.
```
