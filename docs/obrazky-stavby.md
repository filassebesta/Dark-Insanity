# Malované budovy — stav a objednávka

Každá budova má kreslenou vektorovou ikonu (`js/town.js`, `ICONS`). Malovaný obrázek `assets/buildings/<klíč>.jpg`
ji nahradí na parcele, v nabídce staveb i v detailu, jakmile je klíč v `BUILDING_ART` (`js/town.js`). Hotové obrázky
se zpracují skriptem pro ořez (viz historie: ořez kolem budovy, poměr 1,4 : 1, 560 × 400 bodů); originály jsou
v `assets/_source/gemini/`.

| Stav | Klíč | Budova |
|---|---|---|
| ✅ | stodola, mlynek, chlev, staj, chlivek, kolna, vcelin, sad, kaplicka | grunt (9 z 12) |
| ✅ | kostel | město |
| ⏳ | celednik, dilna, rybnik | grunt |
| ⏳ | trziste, mlyn, krcma, sypka, kovarna, kasarna, hradby, spital, radnice, sklad, cech, skola, katedrala, lodenice, sachta, lovci | města (16) |

Poznámka k Gemini: názvy souborů občas zamíchá a jednou vrátí náhledovou sestavu s šachovnicí místo budovy; zpracování
vždy přejmenuje podle obsahu.

## Dávka B2b — tři chybějící budovy gruntu

```
Please paint 3 separate images, one for each line below, all in this one
response: create them one after another without stopping, without asking
for confirmation and without waiting for me between them. Return every
image as its own file named exactly as the file name. No grid or collage,
no contact sheet.

Format: square, 1:1, 2048 x 2048. A single building or farm feature,
centred, seen from a slightly raised three-quarter angle, with generous
empty margin on all sides so it can be cropped small. A soft olive-green
painted ground under it with a gentle shadow and a plain, evenly lit muted
parchment-coloured background. Readable silhouette at a very small size:
simple bold shapes, a clear roof, one or two clear details. No people, no
text.

Style for every image: a muted historical oil painting with visible loose
brushwork and subtle canvas texture, earthy palette of ochre, rust, olive
green and dusty slate blue, 14th-century Central European setting, calm
mood. No text, letters, watermark or signature.

Images:
celednik.jpg — A long low farmhands' house of timber with a thatched roof, several small shuttered windows and a woodpile.
dilna.jpg — A timber workshop with open shutters, a workbench, a saw and tools on the wall, wood shavings outside.
rybnik.jpg — A farm fishpond with a wooden sluice gate and an earthen dam, reeds, ducks and a small fishing net on a pole.
```

## Dávka B1 — městské budovy (16 ks, bez kostela)

```
Please paint 16 separate images, one for each line below, all in this one
response: create them one after another without stopping, without asking
for confirmation and without waiting for me between them. Return every
image as its own file named exactly as the file name. No grid or collage,
no contact sheet.

Format: square, 1:1, 2048 x 2048. A single building, centred, seen from a
slightly raised three-quarter angle, with generous empty margin on all sides
so it can be cropped small. A soft olive-green painted ground under it with a
gentle shadow and a plain, evenly lit muted parchment-coloured background.
Readable silhouette at a very small size: simple bold shapes, a clear roof,
one or two clear details. No people, no text.

Style for every image: a muted historical oil painting with visible loose
brushwork and subtle canvas texture, earthy palette of ochre, rust, olive
green and dusty slate blue, 14th-century Central European setting, calm
mood. No text, letters, watermark or signature.

Images:
trziste.jpg — A market square with three striped market stalls with awnings, crates and baskets of goods.
mlyn.jpg — A wooden watermill beside a stream with a large water wheel and a stone foundation.
krcma.jpg — A two-storey timber inn with a hanging wooden sign, a lit window and a barrel by the door.
sypka.jpg — A tall granary on stone posts with a steep thatched roof and a ladder, sacks of grain at the door.
kovarna.jpg — A stone smithy with a glowing forge opening, an anvil outside and a thin column of smoke.
kasarna.jpg — Stone barracks with a flat battlemented roof, a banner and a weapon rack by the door.
hradby.jpg — A short stretch of stone town wall with a gate tower and a wooden drawbridge.
spital.jpg — A low timber and stone hospital hall with a small cross over the door and herb beds beside it.
radnice.jpg — A town hall with a stepped gable, a small clock tower and an arcade at the front.
sklad.jpg — A long low stone warehouse with big double wooden doors, stacked crates and barrels outside.
cech.jpg — A tall narrow guild house with a decorated gable and a hanging guild emblem, bolts of cloth in the window.
skola.jpg — A monastery school: a stone cloister building with arched windows and a small bell tower.
katedrala.jpg — A grand Gothic cathedral with twin towers, a rose window and flying buttresses.
lodenice.jpg — A shipyard on a shore: an unfinished wooden ship on stocks, a crane and stacked planks.
sachta.jpg — A mine entrance in a rocky hillside with timber supports, an ore cart on rails and a spoil heap.
lovci.jpg — A hunting lodge: a log cabin in a pine forest with antlers over the door and furs drying on a rack.
```
