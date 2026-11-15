# Ikony záložek horní lišty (Postava, Mapa, Obchod, Válka, Dvůr/Rodina, Rody, Kronika)

Záložky jsou ikonová tlačítka (`js/tab_icons.js`). Nakreslená linková ikona se nahradí malovanou, jakmile je klíč v `TAB_ART`
a soubor `assets/ui/tab_<klíč>.webp` leží ve složce. Název záložky je vidět v bublině po najetí myší.

| Klíč | Záložka | Motiv | Stav |
|---|---|---|---|
| character | Postava | poprsí šlechtice v plášti se sponou | ✅ |
| map | Mapa | rozložená pergamenová mapa s kompasem | ✅ |
| trade | Obchod | vůz naložený pytli a měšec s mincemi | ✅ |
| war | Válka | zkřížený meč a sekera za štítem | ✅ |
| court | Dvůr | zlatá koruna na polštáři | ⏳ |
| family | Rodina (sedlák) | chalupa s kouřem z komína | ⏳ |
| houses | Rody / Vazalové | tři erbovní štíty zavěšené na trámu | ⏳ |
| chronicle | Kronika | otevřená kniha s brkem a kalamářem | ✅ (obraz s vlastním pozadím, použit jako zaoblená dlaždice) |

## Prompt (purpurové pozadí, vyklíčuje se skriptem)

```
Please paint 8 separate images, one for each line below, all in this one
response: create them one after another without stopping, without asking
for confirmation and without waiting for me between them. Return every
image as its own file named exactly as the file name. No grid or collage,
no contact sheet.

Format: square, 1:1, 1024 x 1024. A single icon object, centred, with
generous empty margin on all sides so it can be cropped and shrunk to about
48 pixels. Seen straight on or from a very slightly raised angle. Light
falls from the upper left with a warm golden rim light; the same lighting,
the same level of detail and the same visual weight in every image.

BACKGROUND, very important: the whole background is one perfectly flat,
uniform, solid magenta (#FF00FF) with no gradient, no vignette, no texture,
no shadow on it and no ground. The object stands alone on this flat
magenta, as a cut-out. The object has crisp, clean edges against the
magenta, no glow, no blur, no halo, and contains no magenta or pink at all.
Do not paint any cast shadow, floor or surface under it.

The icon must read clearly at a very small size: one bold, simple
silhouette, only two or three large shapes, no tiny details, no text. The
colours must be light and warm enough to be seen on a very dark brown
background: ochre, gold, parchment, rust red and dusty blue, with a thin
darker outline around the shape.

Style for every image: an illustrated medieval icon in the manner of a
muted oil painting with visible loose brushwork, 14th-century Central
European setting, calm mood. No text, letters, numbers, watermark or
signature.

Images:
tab_character.jpg — A bust of a medieval nobleman seen from the front: a head with short hair and a beard, shoulders in a heavy cloak held by a round gold clasp.
tab_map.jpg — A half-unrolled parchment map with curled edges, a simple coastline and river, a small compass rose and a red wax pin.
tab_trade.jpg — A small wooden merchant cart loaded with three round sacks and a barrel, seen from the side, beside a round leather coin purse with a few gold coins.
tab_war.jpg — A crossed sword and battle axe behind a kite-shaped heraldic shield with a plain cross, seen from the front.
tab_court.jpg — A gold crown with a few red and blue jewels resting on a small red velvet cushion with tassels.
tab_family.jpg — A small timber cottage with a thatched roof, a lit window and a thin curl of smoke from the chimney, with a tiny garden fence.
tab_houses.jpg — Three small heraldic shields in three different colours hanging side by side from a short wooden beam on cords, each with a simple bold charge (a tower, a stag's antlers, a hammer).
tab_chronicle.jpg — An open old book with a red ribbon bookmark, a white goose quill leaning against it and a small ink pot beside it.
```

## Zpracování

`python3 -I tools/images/make_icons_key.py` vyklíčuje obrázky z `assets/_source/gemini/ikony/<klíč>.jpg` do `assets/ui/tab_<klíč>.webp` (192 × 192) a klíč se přidá do `TAB_ART`. Režimy: `cut` (vyklíčování, ořez, čtverec), `frame` (malba na dřevěné desce: sundá se rám desky; Postava) a `tile` (malba s vlastním pozadím se ořízne na zaoblenou dlaždici; Kronika). Chybí ještě `court`, `family` a `houses`.

(původní popis níže)

Skript podobný `tools/images/make_cutouts_key.py` (klíčování purpurové, odstranění černého stínu a lemu) uloží ikony do
`assets/ui/tab_<klíč>.webp`; pak se klíče přidají do `TAB_ART` v `js/tab_icons.js`. Gemini občas zamíchá názvy souborů:
zpracování je přejmenuje podle obsahu.
