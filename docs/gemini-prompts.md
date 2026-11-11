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

✅ = hotovo a ve hře · ❌ = chybí

> ❌ **Chybí: všechno ze sekce 14** (scénář Sedlák: 8 portrétů sedláka, 10 portrétů rodiny a vsi, 3 konce; volitelně 38 scén sedláka a 5 scén rádců).

| Stav | Soubor | Poměr | Cílové rozlišení | Kde se zobrazí | Prompt |
|---|---|---|---|---|---|
| ✅ | `ruler_king_male.jpg`, `ruler_king_female.jpg` | 4:5 | 1024 × 1280 | Postava, plaketa, Dvůr | 2.1, 2.2 |
| ✅ | `ruler_king_male_old.jpg`, `ruler_king_female_old.jpg` | 4:5 | 1024 × 1280 | Postava od 55 let | 2.3, 2.4 |
| ✅ | `scene_default.jpg` | 1:1 | 2048 × 2048 | Scéna, když událost nemá vlastní obrázek | 7.1 |
| ✅ | `backdrop.jpg` | 16:9 | 1920 × 1080 | Rozmazané pozadí: nová hra, výběr scénáře, načtení, možnosti | 7.2 |
| ✅ | `heir_male.jpg`, `heir_female.jpg` | 4:5 | 1024 × 1280 | Dvůr, Postava → Rodina | 6.1, 6.2 |
| ✅ | `spouse_male.jpg`, `spouse_female.jpg` | 4:5 | 1024 × 1280 | Dvůr, Postava → Rodina | 6.3, 6.4 |
| ✅ | `chancellor_male.jpg`, `chancellor_female.jpg` | 4:5 | 1024 × 1280 | Dvůr | 6.5, 6.6 |
| ✅ | `marshal_male.jpg`, `marshal_female.jpg` | 4:5 | 1024 × 1280 | Dvůr | 6.7, 6.8 |
| ✅ | `spymaster_male.jpg`, `spymaster_female.jpg` | 4:5 | 1024 × 1280 | Dvůr | 6.9, 6.10 |
| ✅ | 9 × `<id_eventu>.jpg` | 1:1 | 2048 × 2048 | Scéna konkrétní události | 3.1 – 3.9 |
| ✅ | `quiet_season.jpg` | 1:1 | 2048 × 2048 | Scéna „Klidné období“ | 3.10 |
| ✅ | `ending_death.jpg`, `ending_conquest.jpg`, `ending_collapse.jpg`, `ending_golden_age.jpg` | 16:9 | 1920 × 1080 | Konec hry | 5.1 – 5.4 |
| ✅ | `scenario_panovnik.jpg`, `scenario_sedlak.jpg` | 3:2 | 1200 × 800 | Karty výběru scénáře | 4.1, 4.3 |
| ✅ | `scenario_slechtic.jpg` | 3:2 | 1200 × 800 | Karta scénáře Šlechtic | 4.2 |
| ✅ | `kingdom_map.jpg` | 3:2 | 2400 × 1600 | Podklad interaktivní mapy | 9 |
| ✅ | `pohranicni_najezd.jpg` | 1:1 | 2048 × 2048 | Nájezd na hranici | 10 |
| ✅ | `valka_s_markami.jpg` | 1:1 | 2048 × 2048 | Válka s Marcemi | 10 |
| ✅ | `vzpoura_v_provincii.jpg` | 1:1 | 2048 × 2048 | Vzpoura | 10 |
| ✅ | `lapkove_ve_hvozdu.jpg` | 1:1 | 2048 × 2048 | Lapkové ve hvozdu | 10 |
| ✅ | `hladomor.jpg` | 1:1 | 2048 × 2048 | Hladomor | 10 |
| ✅ | `atentat.jpg` | 1:1 | 2048 × 2048 | Dýka ve tmě | 10 |
| ✅ | `soud_se_spiklenci.jpg` | 1:1 | 2048 × 2048 | Soud se spiklenci | 10 |
| ✅ | `zaval_v_dole.jpg` | 1:1 | 2048 × 2048 | Zával v dole | 10 |
| ✅ | `mor_v_pristavu.jpg` | 1:1 | 2048 × 2048 | Mor v přístavu | 10 |
| ✅ | `kupci_z_jihu.jpg` | 1:1 | 2048 × 2048 | Kupci z jihu | 10 |
| ✅ | `bohata_uroda.jpg` | 1:1 | 2048 × 2048 | Bohatá úroda | 10 |
| ✅ | `kruta_zima.jpg` | 1:1 | 2048 × 2048 | Krutá zima | 10 |
| ✅ | `vychova_dedice.jpg` | 1:1 | 2048 × 2048 | Výchova dědice | 10 |
| ✅ | `dedic_dospel.jpg` | 1:1 | 2048 × 2048 | Dědic dospěl | 10 |
| ✅ | `smrt_radce.jpg` | 1:1 | 2048 × 2048 | Smrt rádce | 10 |
| ✅ | `nespokojeny_radce.jpg` | 1:1 | 2048 × 2048 | Nespokojený rádce | 10 |
| ✅ | `biskupuv_desatek.jpg` | 1:1 | 2048 × 2048 | Biskupův desátek | 10 |
| ✅ | `turnaj.jpg` | 1:1 | 2048 × 2048 | Turnaj | 10 |
| ✅ | `cizi_vyslanec.jpg` | 1:1 | 2048 × 2048 | Vyslanec z Marek | 11 |
| ✅ | `nemoc_vladce.jpg` | 1:1 | 2048 × 2048 | Horečka | 11 |
| ✅ | `dvorni_blazen.jpg` | 1:1 | 2048 × 2048 | Dvorní šašek | 11 |
| ✅ | `spor_radcu.jpg` | 1:1 | 2048 × 2048 | Spor rádců | 11 |
| ✅ | `dedic_v_dluzich.jpg` | 1:1 | 2048 × 2048 | Dluhy dědice | 11 |
| ✅ | `krest_ditete.jpg` | 1:1 | 2048 × 2048 | Narození dítěte | 11 |
| ✅ | `portret_vladce.jpg` | 1:1 | 2048 × 2048 | Malíř u dvora | 11 |
| ✅ | `zrada_spehmistra.jpg` | 1:1 | 2048 × 2048 | Dvojí hra | 11 |
| ✅ | `prosba_ucitele.jpg` | 1:1 | 2048 × 2048 | Prosba starého učitele | 11 |
| ✅ | `hostina_slechty.jpg` | 1:1 | 2048 × 2048 | Žádost o hostinu | 11 |
| ✅ | `vazal_odmita_vojaky.jpg` | 1:1 | 2048 × 2048 | Vazal odmítá vojáky | 11 |
| ✅ | `spor_o_panstvi.jpg` | 1:1 | 2048 × 2048 | Spor o dědictví | 11 |
| ✅ | `slechta_odmita_dan.jpg` | 1:1 | 2048 × 2048 | Šlechta odmítá daň | 11 |
| ✅ | `potulny_rytir.jpg` | 1:1 | 2048 × 2048 | Rytíř bez pána | 11 |
| ✅ | `souboj_slechticu.jpg` | 1:1 | 2048 × 2048 | Souboj na život a na smrt | 11 |
| ✅ | `hrabe_utlacuje.jpg` | 1:1 | 2048 × 2048 | Krutý hrabě | 11 |
| ✅ | `zastava_lesa.jpg` | 1:1 | 2048 × 2048 | Půjčka od kláštera | 11 |
| ✅ | `pretendent.jpg` | 1:1 | 2048 × 2048 | Pretendent | 11 |
| ✅ | `stavka_cechu.jpg` | 1:1 | 2048 × 2048 | Stávka cechů | 11 |
| ✅ | `pozar_mesta.jpg` | 1:1 | 2048 × 2048 | Požár | 11 |
| ✅ | `carodejnice.jpg` | 1:1 | 2048 × 2048 | Čarodějnice | 11 |
| ✅ | `poutnik_zazrak.jpg` | 1:1 | 2048 × 2048 | Zázrak u kláštera | 11 |
| ✅ | `zebravy_prorok.jpg` | 1:1 | 2048 × 2048 | Žebravý prorok | 11 |
| ✅ | `trh_v_brode.jpg` | 1:1 | 2048 × 2048 | Velký trh v Brodě | 11 |
| ✅ | `most_pres_brodnici.jpg` | 1:1 | 2048 × 2048 | Most přes Brodnici | 11 |
| ✅ | `uprchlici.jpg` | 1:1 | 2048 × 2048 | Uprchlíci z Marek | 11 |
| ✅ | `lichvar.jpg` | 1:1 | 2048 × 2048 | Lichvář | 11 |
| ✅ | `lichvar_splatka.jpg` | 1:1 | 2048 × 2048 | Den splátky | 11 |
| ✅ | `katedrala.jpg` | 1:1 | 2048 × 2048 | Katedrála | 11 |
| ✅ | `kacirska_sekta.jpg` | 1:1 | 2048 × 2048 | Sekta v horách | 11 |
| ✅ | `relikvie.jpg` | 1:1 | 2048 × 2048 | Relikvie | 11 |
| ✅ | `opat_v_rade.jpg` | 1:1 | 2048 × 2048 | Opat žádá místo v radě | 11 |
| ✅ | `zatmeni.jpg` | 1:1 | 2048 × 2048 | Zatmění slunce | 11 |
| ✅ | `zajaty_syn_markrabiho.jpg` | 1:1 | 2048 × 2048 | Vzácný zajatec | 11 |
| ✅ | `pirati.jpg` | 1:1 | 2048 × 2048 | Piráti u pobřeží | 11 |
| ✅ | `dezerteri.jpg` | 1:1 | 2048 × 2048 | Dezertéři | 11 |
| ✅ | `zvedove_v_horach.jpg` | 1:1 | 2048 × 2048 | Hlášení zvědů | 11 |
| ✅ | `obleheni.jpg` | 1:1 | 2048 × 2048 | Obléhání | 11 |
| ✅ | `zold.jpg` | 1:1 | 2048 × 2048 | Žold | 11 |
| ✅ | `nove_kuse.jpg` | 1:1 | 2048 × 2048 | Nové kuše | 11 |
| ✅ | `hranicni_kamen.jpg` | 1:1 | 2048 × 2048 | Posunutý hraniční kámen | 11 |
| ✅ | `povoden.jpg` | 1:1 | 2048 × 2048 | Povodeň | 11 |
| ✅ | `sucho.jpg` | 1:1 | 2048 × 2048 | Sucho | 11 |
| ✅ | `vlci.jpg` | 1:1 | 2048 × 2048 | Vlci | 11 |
| ✅ | `stribrna_zila.jpg` | 1:1 | 2048 × 2048 | Stříbrná žíla | 11 |
| ✅ | `kobylky.jpg` | 1:1 | 2048 × 2048 | Kobylky | 11 |
| ✅ | `spor_rybaru.jpg` | 1:1 | 2048 × 2048 | Spor o rybolov | 11 |
| ✅ | `zlodej_v_pokladne.jpg` | 1:1 | 2048 × 2048 | Zloděj v pokladně | 11 |
| ✅ | `vyroci_vlady.jpg` | 1:1 | 2048 × 2048 | Výročí vlády | 11 |
| ✅ | `skola_ucencu.jpg` | 1:1 | 2048 × 2048 | Škola učenců | 11 |
| ✅ | `cizi_princezna.jpg` | 1:1 | 2048 × 2048 | Nabídka sňatku | 11 |
| ✅ | `zahada_v_lese.jpg` | 1:1 | 2048 × 2048 | Zmizelí myslivci | 11 |
| ✅ | `kupecka_gilda.jpg` | 1:1 | 2048 × 2048 | Kupecká gilda | 11 |
| ✅ | `stary_rytir_umira.jpg` | 1:1 | 2048 × 2048 | Poslední přání | 11 |
| ✅ | `ztracena_listina.jpg` | 1:1 | 2048 × 2048 | Ztracená listina | 11 |

**Všechny scény událostí jsou hotové a ve hře**, včetně variant s královnou.

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

> ✅ **Hotovo:** malovaná mapa je ve hře (`assets/map/kingdom_map.jpg`).
> Gemini ji nenamaloval přesně podle předlohy, proto jsou souřadnice
> provincií, míst a cest v `js/map.js` obkreslené přímo z obrázku. Když budeš
> mapu někdy generovat znovu, souřadnice bude potřeba upravit.

**Co s mapou udělám já:** obrázek vložím jako spodní vrstvu mapy ve hře.
Současné kreslené stromy, hory a pole skryju a hranice provincií udělám
průhledné. Najetí myší provincii zvýrazní, kliknutí ukáže detail. Zoom, posun,
vrstvy (věrnost, nepokoje, posádky, cesty), ikony míst a volba cesty
k vazalovi zůstanou stejné jako teď.

---

## 10. Scény nových událostí (18 ks)

Rozlišení u všech: **1:1, cíl 2048 × 2048**. Kompozice jako v sekci 3:
hlavní motiv uprostřed a nahoře, **spodní třetina tmavší a klidná**.
Ke každému promptu přidej na konec stylový blok z úvodu tohoto souboru
(nebo přilož `assets/events/scene_default.jpg` a napiš *„Match the
painting style of the attached image.“*).

Formát promptu:

```
Square painting, aspect ratio 1:1. <POPIS ZE SEZNAMU NÍŽE> The lower third
is dark and calm. <STYLOVÝ BLOK>
```

| Soubor | Událost | Popis pro Gemini |
|---|---|---|
| `pohranicni_najezd.jpg` | Nájezd na hranici | Horsemen raiders setting fire to a wooden barn at the edge of a dark pine forest at dusk, villagers fleeing with a cow, smoke and embers in the air. |
| `valka_s_markami.jpg` | Válka s Marcemi | Two medieval armies clashing on a muddy field at the edge of a dark forest, spears and banners without symbols, a grizzled marshal on horseback in the foreground, smoke and grey sky. |
| `vzpoura_v_provincii.jpg` | Vzpoura | Angry peasants with torches, pitchforks and scythes gathered in a muddy village square at night, a tax collector's cart overturned and burning. |
| `lapkove_ve_hvozdu.jpg` | Lapkové ve hvozdu | Hooded bandits with bows ambushing a merchant cart on a narrow road through a dark pine forest, fallen crates, a frightened horse. |
| `hladomor.jpg` | Hladomor | A crowd of starving, ragged villagers in winter waiting before a castle gate, empty baskets, thin children, grey snowy light. |
| `atentat.jpg` | Dýka ve tmě | A dark royal bedchamber at night, a hooded assassin raising a dagger in the candlelight beside a canopy bed, the ruler starting awake. |
| `soud_se_spiklenci.jpg` | Soud se spiklenci | Chained noblemen kneeling before an empty throne in a cold stone hall, guards with halberds, courtiers watching from the shadows. |
| `zaval_v_dole.jpg` | Zával v dole | The collapsed entrance of a mountain mine, miners digging through rubble by lantern light, wives waiting with shawls in the cold. |
| `mor_v_pristavu.jpg` | Mor v přístavu | A plague-stricken harbour quarter, sick sailors lying on the quay, a monk in a dark habit tending them, ships with furled sails in the mist. |
| `kupci_z_jihu.jpg` | Kupci z jihu | Richly dressed southern merchants unloading spices, silk and chests of gold from a ship onto a stone quay, curious townsfolk watching. |
| `bohata_uroda.jpg` | Bohatá úroda | Overflowing barns and golden wheat sheaves at harvest time, peasants loading heavy carts, warm late-afternoon light over the fields. |
| `kruta_zima.jpg` | Krutá zima | A frozen river and snowed-in village in a harsh winter, people carrying firewood through deep snow, smoke from a few chimneys, pale cold light. |
| `vychova_dedice.jpg` | Výchova dědice | A young noble heir practising with a wooden sword in a castle courtyard under the eye of a grizzled marshal, an old chancellor with books watching from an arcade. |
| `dedic_dospel.jpg` | Dědic dospěl | A sixteen-year-old heir in fine clothes standing before the throne hall at a coming-of-age ceremony, courtiers and a bishop in attendance, banners overhead. |
| `smrt_radce.jpg` | Smrt rádce | An old royal adviser lying in state on a bier in a small chapel, candles, a chain of office laid on the chest, mourners in dark clothes. |
| `nespokojeny_radce.jpg` | Nespokojený rádce | A royal adviser whispering with two shadowy noblemen in a dim castle corridor, glancing over the shoulder, a half-open door with light behind. |
| `biskupuv_desatek.jpg` | Biskupův desátek | A stern bishop in rich vestments presenting a parchment demand in a throne hall, priests behind him, a chest of coins on the floor. |
| `turnaj.jpg` | Turnaj | A medieval tournament below castle walls, two knights charging with lances, colourful but muted pennants, crowds on wooden stands, dust in the air. |

---

## 11. Scény druhé sady událostí (55 ks)

Stejný postup jako v sekci 10: **1:1, cíl 2048 × 2048**, motiv uprostřed
a nahoře, **spodní třetina tmavší a klidná**. Na konec každého promptu
přidej stylový blok z úvodu, nebo přilož `assets/events/scene_default.jpg`
s větou *„Match the painting style of the attached image.“*

Formát promptu:

```
Square painting, aspect ratio 1:1. <POPIS ZE SEZNAMU NÍŽE> The lower third
is dark and calm. <STYLOVÝ BLOK>
```

| Soubor | Událost | Popis pro Gemini |
|---|---|---|
| `cizi_vyslanec.jpg` | Vyslanec z Marek | A foreign envoy in black velvet bowing before a throne in a stone hall, holding a sealed marriage contract, courtiers watching suspiciously. |
| `nemoc_vladce.jpg` | Horečka | A feverish king lying in a canopy bed by candlelight, a physician with leeches, a monk praying and a southern merchant holding a small vial. |
| `dvorni_blazen.jpg` | Dvorní šašek | A court jester in motley mocking a red-faced count at a long feast table, nobles laughing, candles and goblets. |
| `spor_radcu.jpg` | Spor rádců | An old chancellor with a ledger and a grizzled marshal in armour arguing across a council table, the ruler sitting between them. |
| `dedic_v_dluzich.jpg` | Dluhy dědice | A young noble heir at a tavern table with dice and empty purses, grim merchants standing over him in a smoky room. |
| `krest_ditete.jpg` | Narození dítěte | A newborn baby being baptised at a stone font in a candlelit castle chapel, the noble family and a priest around it. |
| `portret_vladce.jpg` | Malíř u dvora | A painter at an easel painting a crowned ruler sitting stiffly on a throne in a sunlit hall, apprentices mixing pigments. |
| `zrada_spehmistra.jpg` | Dvojí hra | A hooded spymaster secretly handing a sealed letter to a foreign rider at night behind the castle stables, a lantern half covered. |
| `prosba_ucitele.jpg` | Prosba starého učitele | An old grey-bearded teacher kneeling and pleading before a throne, a chained young man behind him between two guards. |
| `hostina_slechty.jpg` | Žádost o hostinu | A great medieval feast in a torch-lit hall, roasted deer, wine, musicians and dancing nobles at long tables. |
| `vazal_odmita_vojaky.jpg` | Vazal odmítá vojáky | A royal messenger reading a refusal letter at the gate of a lonely hill castle, the vassal watching smugly from the battlements. |
| `spor_o_panstvi.jpg` | Spor o dědictví | Two noble cousins arguing over a map of an estate on a table before the throne, each with armed retainers behind him. |
| `slechta_odmita_dan.jpg` | Šlechta odmítá daň | A crowd of angry noblemen in furs gathered in a throne hall, their spokesman throwing a tax decree to the floor. |
| `potulny_rytir.jpg` | Rytíř bez pána | A famous wandering knight in battered armour standing at a castle gate with his horse, helmet under his arm, rain falling. |
| `souboj_slechticu.jpg` | Souboj na život a na smrt | Two young noblemen fighting a sword duel at dawn on a misty meadow, seconds and a few courtiers watching. |
| `hrabe_utlacuje.jpg` | Krutý hrabě | Ragged peasants kneeling and begging before a throne, one showing bruises, a cruel count in rich clothes standing aside with contempt. |
| `zastava_lesa.jpg` | Půjčka od kláštera | A smiling abbot offering a chest of coins to the ruler in a cloister, a map of a forest spread on the table between them. |
| `pretendent.jpg` | Pretendent | A charismatic young man in a worn cloak preaching to a crowd on a seaside village square, claiming a crown he holds up in his hand. |
| `stavka_cechu.jpg` | Stávka cechů | Closed workshops in a medieval town street, guild craftsmen with tools standing in protest with banners without letters. |
| `pozar_mesta.jpg` | Požár | A wooden town quarter burning at night below a castle, people fleeing and soldiers passing buckets of water in a chain. |
| `carodejnice.jpg` | Čarodějnice | An old herbalist woman dragged by angry villagers before the castle gate, a priest pointing at her, a pale crowd behind. |
| `poutnik_zazrak.jpg` | Zázrak u kláštera | Pilgrims kneeling before a weeping stone statue of a saint in a cliff-top monastery, candles and offerings, sea mist behind. |
| `zebravy_prorok.jpg` | Žebravý prorok | A ragged prophet with wild eyes preaching doom from the steps of a fountain on a town square, a growing crowd listening. |
| `trh_v_brode.jpg` | Velký trh v Brodě | A busy autumn market in a river town, stalls of grain and cloth, merchants and carts crossing a wooden bridge. |
| `most_pres_brodnici.jpg` | Most přes Brodnici | Masons building a new stone bridge across a wide river, wooden scaffolding and cranes, carts waiting on the bank. |
| `uprchlici.jpg` | Uprchlíci z Marek | Hundreds of refugees with bundles and children waiting at a border palisade at the edge of a dark forest, guards blocking the road. |
| `lichvar.jpg` | Lichvář | A wealthy moneylender with rings on his fingers counting gold coins on a table by candlelight, a contract and a quill ready. |
| `lichvar_splatka.jpg` | Den splátky | The moneylender presenting a long debt contract to the ruler in a dim treasury, nearly empty chests behind them. |
| `katedrala.jpg` | Katedrála | A bishop unrolling plans of a vast cathedral before the ruler, masons laying the first foundation stones in the background. |
| `kacirska_sekta.jpg` | Sekta v horách | Miners gathered at night around a fire in a mountain village listening to a wild-haired preacher, rocky peaks behind. |
| `relikvie.jpg` | Relikvie | A southern merchant opening a golden reliquary on a velvet cloth before the ruler and a bishop, candlelight on the gold. |
| `opat_v_rade.jpg` | Opat žádá místo v radě | An abbot in a black habit standing at the royal council table, the chancellor scowling beside him. |
| `zatmeni.jpg` | Zatmění slunce | A solar eclipse darkening the sky over a medieval town, terrified people running to a church, birds scattering. |
| `zajaty_syn_markrabiho.jpg` | Vzácný zajatec | A proud young nobleman prisoner sitting in a castle tower room, guards at the door, a window with a view of the forest. |
| `pirati.jpg` | Piráti u pobřeží | Pirate ships with dark sails attacking a fishing village and merchant ships near a rocky coast, smoke rising. |
| `dezerteri.jpg` | Dezertéři | Ragged deserting soldiers plundering a farmstead, carrying sacks and chickens, a farmer's family hiding by the fence. |
| `zvedove_v_horach.jpg` | Hlášení zvědů | Two scouts lying on a rocky ridge looking down at many campfires of a foreign army in a mountain valley at dusk. |
| `obleheni.jpg` | Obléhání | A besieged city with siege engines and an enemy camp below its walls, defenders on the battlements, smoke and catapult stones. |
| `zold.jpg` | Žold | Angry soldiers gathered before a castle gate demanding pay, a grizzled marshal trying to calm them. |
| `nove_kuse.jpg` | Nové kuše | A foreign armourer demonstrating a heavy crossbow in a castle courtyard, a pierced breastplate on a target post. |
| `hranicni_kamen.jpg` | Posunutý hraniční kámen | Forest hunters pointing at a moved boundary stone in a forest clearing, fresh earth around it, dawn mist. |
| `povoden.jpg` | Povodeň | A flooded river overflowing fields and a mill, villagers stacking sacks into a dam, rain and grey sky. |
| `sucho.jpg` | Sucho | Cracked dry fields and yellow withered wheat under a hot pale sky, peasants carrying water buckets from a shrinking river. |
| `vlci.jpg` | Vlci | A pack of wolves in a snowy forest at the edge of a village, a hunter with a spear and hounds facing them. |
| `stribrna_zila.jpg` | Stříbrná žíla | Miners in a lantern-lit tunnel discovering a glittering vein of silver in the rock, faces lit with excitement. |
| `kobylky.jpg` | Kobylky | A dark swarm of locusts descending on golden wheat fields, peasants lighting smoky fires to drive them away. |
| `spor_rybaru.jpg` | Spor o rybolov | Fishermen and monks arguing on a rocky beach beside boats and nets, a cliff-top monastery above the bay. |
| `zlodej_v_pokladne.jpg` | Zloděj v pokladně | A shadowy figure taking coins from a royal treasury chest by candlelight, ledgers and keys on a table. |
| `vyroci_vlady.jpg` | Výročí vlády | A royal jubilee celebration on a town square, banners, musicians and crowds cheering the ruler on a balcony. |
| `skola_ucencu.jpg` | Škola učenců | Foreign scholars teaching young students in a stone room full of books, maps and an astronomical instrument. |
| `cizi_princezna.jpg` | Nabídka sňatku | Foreign envoys presenting a painted miniature portrait and a marriage proposal to the young heir in a throne hall. |
| `zahada_v_lese.jpg` | Zmizelí myslivci | A deep dark forest with mist between the trees, a hunter's abandoned bow and lantern lying on the moss. |
| `kupecka_gilda.jpg` | Kupecká gilda | Rich merchants in fur-trimmed robes signing a charter around a table in a guild hall, scales and sacks of coin. |
| `stary_rytir_umira.jpg` | Poslední přání | An old knight on his deathbed in a simple room, his sword on the blanket, the ruler sitting beside him holding his hand. |
| `ztracena_listina.jpg` | Ztracená listina | An archivist and the ruler examining an ancient sealed charter by candlelight in a dusty archive full of scrolls. |

---

## 12. Scénář Šlechtic

Nový scénář: hráč začíná jako drobný šlechtic s jedinou tvrzí na pobřeží
(Pobřežní Mark) a cílem je trůn. Všechno níže je **volitelné** — hra bez
obrázků funguje (ukáže výchozí scénu a iniciály).

### 12.1 Portréty šlechtice (avatar)

Hra si je načte podle postavení: drobný šlechtic (`minor_noble`) a významný
šlechtic (`noble`). **Bez koruny** — korunu dostane až po získání trůnu.

### `ruler_minor_noble_male.jpg` — Drobný šlechtic
Rozlišení: **4:5, cíl 1024 × 1280** — přilož `ruler_king_male.jpg` jako stylovou kotvu

```
Portrait painting, aspect ratio 4:5. A young late-medieval minor nobleman of about 26, lord of a small coastal fort. Short dark hair, light stubble, determined hungry eyes, a plain dark wool doublet with a modest fur collar, a simple sword belt, no crown, no jewels except a small signet ring. Shown from the chest up, slightly
turned, plain dark umber background fading to black, warm side light. The face
sits in the upper third of the frame, centred, with a little headroom. Match
the painting style, lighting and framing of the attached portrait.
Painted in the style of a dark-fantasy narrative RPG: muted oil painting with
visible loose brushwork and subtle canvas texture, desaturated earthy palette,
soft dramatic chiaroscuro, realistic proportions, similar in mood to "The
Life and Suffering of Sir Brante". Avoid: anime, cartoon, 3D render,
photography, oversaturated colours, any text, letters, watermark or signature.
```

### `ruler_minor_noble_female.jpg` — Drobná šlechtična
Rozlišení: **4:5, cíl 1024 × 1280** — přilož `ruler_king_male.jpg` jako stylovou kotvu

```
Portrait painting, aspect ratio 4:5. A young late-medieval minor noblewoman of about 26, lady of a small coastal fort. Dark braided hair under a simple linen coif, determined clever eyes, a plain dark green wool gown with a modest fur trim, no crown, a small signet ring. Shown from the chest up, slightly
turned, plain dark umber background fading to black, warm side light. The face
sits in the upper third of the frame, centred, with a little headroom. Match
the painting style, lighting and framing of the attached portrait.
Painted in the style of a dark-fantasy narrative RPG: muted oil painting with
visible loose brushwork and subtle canvas texture, desaturated earthy palette,
soft dramatic chiaroscuro, realistic proportions, similar in mood to "The
Life and Suffering of Sir Brante". Avoid: anime, cartoon, 3D render,
photography, oversaturated colours, any text, letters, watermark or signature.
```

### `ruler_noble_male.jpg` — Významný šlechtic
Rozlišení: **4:5, cíl 1024 × 1280** — přilož `ruler_king_male.jpg` jako stylovou kotvu

```
Portrait painting, aspect ratio 4:5. A late-medieval great lord of about 35, risen high at the royal court. Neatly trimmed beard, proud ambitious gaze, a rich dark red velvet doublet with a heavy gold chain of office and a fur-lined mantle, no crown. Shown from the chest up, slightly
turned, plain dark umber background fading to black, warm side light. The face
sits in the upper third of the frame, centred, with a little headroom. Match
the painting style, lighting and framing of the attached portrait.
Painted in the style of a dark-fantasy narrative RPG: muted oil painting with
visible loose brushwork and subtle canvas texture, desaturated earthy palette,
soft dramatic chiaroscuro, realistic proportions, similar in mood to "The
Life and Suffering of Sir Brante". Avoid: anime, cartoon, 3D render,
photography, oversaturated colours, any text, letters, watermark or signature.
```

### `ruler_noble_female.jpg` — Významná šlechtična
Rozlišení: **4:5, cíl 1024 × 1280** — přilož `ruler_king_male.jpg` jako stylovou kotvu

```
Portrait painting, aspect ratio 4:5. A late-medieval great lady of about 35, risen high at the royal court. Hair pinned under a jewelled net, proud ambitious gaze, a rich wine-red velvet gown with a heavy gold chain and a fur-lined mantle, no crown. Shown from the chest up, slightly
turned, plain dark umber background fading to black, warm side light. The face
sits in the upper third of the frame, centred, with a little headroom. Match
the painting style, lighting and framing of the attached portrait.
Painted in the style of a dark-fantasy narrative RPG: muted oil painting with
visible loose brushwork and subtle canvas texture, desaturated earthy palette,
soft dramatic chiaroscuro, realistic proportions, similar in mood to "The
Life and Suffering of Sir Brante". Avoid: anime, cartoon, 3D render,
photography, oversaturated colours, any text, letters, watermark or signature.
```

> Stárnutí funguje jako u krále: `ruler_minor_noble_male_old.jpg` atd. —
> přilož mladou verzi a požádej o stejnou osobu o 30 let starší.

### 12.2 Konce scénáře Šlechtic (16:9, cíl 1920 × 1080)

| Soubor | Konec | Popis pro Gemini |
|---|---|---|
| `ending_crowned.jpg` | Korunovace | A coronation in a vast cathedral, a bishop lowering a crown onto the head of a kneeling noble, nobles and banners filling the nave, shafts of light. |
| `ending_executed.jpg` | Poprava | An empty executioner's block on a wooden scaffold in a misty town square at dawn, a silent crowd, a raven on the beam. |
| `ending_exile.jpg` | Vyhnanství | A noble family with a single cart leaving a small coastal fort at dawn, looking back, royal soldiers at the gate. |

Pro konce použij formát: *„Wide cinematic painting, aspect ratio 16:9. <POPIS>
The center of the image is calm enough for text.“* + stylový blok.

### 12.3 Scény událostí šlechtice (1:1, cíl 2048 × 2048)

Stejný formát jako v sekcích 10 a 11.

| Soubor | Událost | Popis pro Gemini |
|---|---|---|
| `n_povolavaci_list.jpg` | Povolávací list | A royal messenger on horseback handing a sealed summons to a young minor noble at the gate of a small wooden fort on the coast, soldiers gathering. |
| `n_kralovska_bitva.jpg` | Bitva pod královskou korouhví | A minor noble's small company charging on the flank of a large royal army on a muddy battlefield, the king watching from a hill. |
| `n_pozvani_ke_dvoru.jpg` | Pozvání ke dvoru | A grand royal court hall full of nobles in finery, a young minor noble bowing before an aged king on his throne. |
| `n_kralova_navsteva.jpg` | Král na návštěvě | An aged king and his retinue of riders with hounds and falcons arriving at a modest coastal wooden fort, the minor noble family bowing in the courtyard. |
| `n_kraluv_vybirci.jpg` | Královský výběrčí | A royal tax collector with armed guards weighing coins at a table in a modest hall, the minor noble watching grimly. |
| `n_obvineni_u_dvora.jpg` | Obvinění u dvora | A minor noble standing accused before the king's throne, a rival lord pointing an accusing finger, courtiers whispering. |
| `n_urad_u_dvora.jpg` | Úřad u dvora | The king placing a golden chain of office around the neck of a kneeling noble, jealous lords watching. |
| `n_povyseni.jpg` | Královská milost | A noble kneeling as the king touches his shoulder with a sword in a candlelit throne hall, granting a higher title. |
| `n_koupe_titulu.jpg` | Titul na prodej | A royal treasurer in fine robes accepting a heavy purse of gold from a noble in a dim treasury, a sealed charter on the table. |
| `n_nemoc_krale.jpg` | Král stůně | An aged king lying ill in a great canopy bed, physicians and courtiers whispering in the shadows, a crown on a cushion nearby. |
| `n_kralovsky_snatek.jpg` | Sňatek s korunou | A betrothal in a royal chapel: a young noble heir and a young royal joining hands before a bishop, the king and the noble family watching. |
| `n_smrt_krale.jpg` | Král je mrtev | A dead king lying in state in a cathedral, the crown resting on a cushion before the altar, nobles in dark cloaks eyeing it and each other. |
| `n_prevrat.jpg` | Noc dlouhých nožů | Armed conspirators with torches entering a royal castle through an opened gate at night, a bribed guard holding the door. |
| `n_spor_o_hranici.jpg` | Spor o mezníky | Peasants and armed retainers of two lords confronting each other over a moved boundary stone in a riverside meadow. |
| `n_nabidka_spojenectvi.jpg` | Nabídka spojenectví | Two noble lords clasping hands over a table with a map and a sealed treaty in a modest hall, their retainers watching. |
| `n_snatkova_nabidka.jpg` | Sňatek mezi rody | Two noble families meeting in a castle garden, a young heir and a young noble introduced shyly by their parents. |
| `n_najezd_rodu.jpg` | Ozbrojenci na tvé půdě | Armed riders of a rival lord burning a barn and driving off cattle from a coastal village at dusk. |
| `n_pujcka_rodu.jpg` | Žádost o půjčku | A worried rival lord asking a minor noble for a loan at a table with an open chest of coins and a quill. |
| `n_hostina_rodu.jpg` | Hostina u sousedů | A lavish feast in a rival lord's hall, drunken nobles laughing, one guest quietly listening in the corner. |
| `n_pomluvy.jpg` | Pomluvy | Courtiers whispering behind their hands in a castle gallery, glancing at a proud minor noble walking past. |
| `n_nalezeny_dopis.jpg` | Dopis, který neměl být nalezen | A steward handing an intercepted letter with a broken wax seal to a minor noble by candlelight. |
| `n_vydirani.jpg` | Tajemství v truhle | An iron chest open on a desk revealing hidden letters, a noble and a hooded confidant looking at them by candlelight. |
| `n_spiklenci_zvou.jpg` | Pozvání do tmy | Masked noblemen meeting secretly by candlelight in an abandoned ruined chapel at night. |
| `n_podplatit_straze.jpg` | Velitel stráží | A noble sliding a purse of gold across a table to a captain of the royal guard in a dark tavern corner. |
| `n_spiklenec_zradil.jpg` | Jazyk, který se rozvázal | A drunk conspirator talking too loudly in a crowded tavern, a hooded figure listening nearby. |
| `n_zradce_v_radach.jpg` | Zrádce mezi svými | A noble's steward secretly meeting a royal messenger behind the stables at night, glancing over his shoulder. |
| `n_mlyn.jpg` | Mlýn na potoce | Builders constructing a new wooden watermill on a stream below a small coastal fort, peasants carrying sacks of grain. |
| `n_pytlaci.jpg` | Pytláci | Gamekeepers dragging three poachers with a dead deer before a young noble in a forest clearing. |
| `n_kamenny_hrad.jpg` | Kamenný hrad | Masons building a stone tower and walls around an old wooden fort on a coastal hill, scaffolding and cranes. |
| `n_robota.jpg` | Robota | Peasants refusing to work in a lord's field at harvest, a bailiff with a stick shouting at them. |
| `n_trzni_pravo.jpg` | Trhové právo | Townsfolk setting up the first market stalls in a small coastal village square, merchants arriving by cart and boat. |
| `n_spatna_uroda.jpg` | Neúroda | Rain-ruined dark wheat fields under heavy grey clouds, peasants looking at the spoiled harvest in despair. |
| `n_klidne_obdobi.jpg` | Klidné období (šlechtic) | A peaceful coastal estate with a small wooden fort, fishing boats, fields and a village in calm evening light. |

---

## 13. Krize a ozvěny (volitelné, 1:1, cíl 2048 × 2048)

Tyto události už ve hře fungují a zatím si půjčují obrázek z příbuzné scény (viz sloupec „Teď používá“).
Vlastní obrázek není nutný. Když ho ale vygeneruješ a pojmenuješ podle sloupce Soubor, hra ho sama použije místo půjčeného.

Stejný styl i formát jako v sekcích 10 až 12. Generuj dávkově, po pěti až deseti obrázcích.

**Krize**: přijdou samy, když dojde zlato, jídlo, vojsko, víra, prestiž, legitimita nebo králova přízeň.

| Soubor | Událost | Teď používá | Popis pro Gemini |
|---|---|---|---|
| `krize_pokladna.jpg` | Prázdná pokladna | `zlodej_v_pokladne` | An empty royal treasury vault, open chests with nothing inside, a despairing chancellor holding up an empty ledger, soldiers grumbling at the door. |
| `krize_hlad.jpg` | Hladové bouře | `hladomor` | A starving crowd with empty bowls and clubs surging toward a castle gate at dusk, guards bracing behind the portcullis. |
| `krize_vojsko.jpg` | Bezbranní | `dezerteri` | Empty castle walls with only a few old guards, banners hanging on bare spears, enemy riders watching from a distant hill. |
| `krize_vira.jpg` | Prázdné kostely | `kacirska_sekta` | A ragged wandering preacher shouting to a crowd on a village green while the church behind stands empty with its doors open. |
| `krize_posmech.jpg` | Terč posměchu | `dvorni_blazen` | Drunken nobles and peasants in a smoky tavern laughing at a minstrel singing a mocking song, a crude caricature of a crowned figure on the wall. |
| `krize_uchvatitel.jpg` | Trůn se otřásá | `pretendent` | A tense assembly of lords in a great hall, some standing with arms crossed, one pointing at an empty throne, whispers and suspicion. |
| `krize_nemilost.jpg` | Poslední varování | `n_obvineni_u_dvora` | A royal herald in tabard reading a stern sealed letter aloud in the courtyard of a modest coastal fort, the noble household listening in dread. |

**Ozvěny**: vrátí se roky po určitém rozhodnutí.

| Soubor | Událost | Teď používá | Popis pro Gemini |
|---|---|---|---|
| `ozvena_omilostneny.jpg` | Splacená přísaha | `soud_se_spiklenci` | A grey-haired former conspirator kneeling at a castle gate, offering a folded list of names to a guard captain at dawn. |
| `ozvena_syn_ucitele.jpg` | Hrdina od brodu | `prosba_ucitele` | Cheering soldiers carrying a young wounded hero on their shoulders after defending a river ford, broken enemy shields in the water. |
| `ozvena_deti_hladu.jpg` | Děti hladu | `hladomor` | A band of gaunt young outlaws in ragged cloaks ambushing a cart in a dark forest, their faces hard and hungry. |
| `ozvena_markrabi.jpg` | Dluh cti | `zajaty_syn_markrabiho` | A foreign envoy in rich furs presenting a sealed peace treaty in a throne hall, the seal bearing a march-lord's eagle. |
| `ozvena_masakr.jpg` | Píseň o krvavém dni | `vzpoura_v_provincii` | Angry painted words smeared on a village church wall at night, a few villagers with candles standing silently before graves. |
| `ozvena_klaster_dedic.jpg` | Návrat z kláštera | `vychova_dedice` | A young scholar in plain monastic travel clothes returning through a castle gate with books, an abbot's letter in hand. |
| `ozvena_pirati.jpg` | Obvyklá platba | `pirati` | Grinning pirates on a dock holding out an open chest for tribute, their black-sailed ship moored behind them in a harbour. |
| `ozvena_bylinkarka.jpg` | Dluh se splácí | `carodejnice` | A herb woman with a basket of dried herbs tending a feverish child in a candlelit castle chamber, a suspicious priest in the doorway. |
| `ozvena_uprchlici.jpg` | Vydejte nám je | `uprchlici` | A thriving village of former refugees with new houses and fields, a foreign envoy on horseback demanding their return. |
| `ozvena_ucenci.jpg` | První učenci | `skola_ucencu` | Three young scholars presenting drawings of a watermill, a mountain map and a herbal to a ruler in a sunlit study. |
| `ozvena_zlomeny_slib.jpg` | Zlomený slib | `stary_rytir_umira` | A young knight in his late father's armour throwing down a gauntlet before a lord in a manor courtyard, villagers behind him. |
| `ozvena_most.jpg` | Most se zřítil | `most_pres_brodnici` | A collapsed wooden bridge over a swollen river, a merchant wagon half sunk, people pulling survivors from the water. |
| `ozvena_n_pytlaci.jpg` | Stará laskavost | `n_pytlaci` | Former poachers in hunter's clothes leading armed retainers along a hidden forest path at dawn toward distant campfires. |
| `ozvena_n_vdecny_rod.jpg` | Vděčnost sousedů | `n_pujcka_rodu` | A wagon with a gift chest pulled by four horses arriving at a small coastal fort, a rival lord's banner on the wagon. |
| `ozvena_n_pisatel.jpg` | Bedýnka bez erbu | `n_nalezeny_dopis` | A plain unmarked wooden box opened on a table by candlelight, revealing a letter and lists of names and sums. |
| `ozvena_n_pomsta.jpg` | Krev za krev | `n_spiklenci_zvou` | A hooded assassin with a dagger climbing the wall of a fort at night, a confidant watching from a shadowed window. |
| `ozvena_n_rychtar.jpg` | Cepy pod hradbami | `n_robota` | Angry peasants with flails and pitchforks led by a village reeve gathered beneath the walls of a small fort at dusk. |

---

## 14. Scénář Sedlák a nové mechaniky

Sedlák je ve hře hotový a hratelný. Dokud tyhle obrázky nenahraješ, portréty
ukazují zlaté iniciály a scény si půjčují obrázek z podobné události.

**Priorita:** 14.1 a 14.2 (portréty) a 14.3 (konce) jsou nejdůležitější, bez
nich je sedlák „bez tváře“. Scény 14.4 a 14.5 jsou vylepšení: hra už teď
ukazuje půjčené obrázky, takže nespěchají.

### 14.0 Dávkový prompt (pro AI bez přístupu k repozitáři)

Zkopíruj celý blok, pod něj vlož řádky z tabulky (název souboru + popis)
a pošli najednou. Ideálně 5 až 10 obrázků v jedné dávce.

```
Generate one separate image for each line below. Each line has a file name
and a description. Return every image as its own file named exactly as the
file name. Do not combine images into a grid or sprite sheet.

Format for files starting with "ruler_" or "s_" and ending in _male/_female
(portraits): aspect ratio 4:5, 1024 x 1280. Chest-up portrait, slightly
turned, plain dark umber background fading to black, warm side light, the
face in the upper third of the frame, centred, with a little headroom.

Format for files starting with "ending_": aspect ratio 16:9, 1920 x 1080,
wide cinematic painting, the centre of the image calm enough for text.

Format for all other files (event scenes): aspect ratio 1:1, 2048 x 2048,
main subject in the centre and upper part, the lower third darker and calm.

Style for every image: painted in the style of a dark-fantasy narrative RPG,
muted oil painting with visible loose brushwork and subtle canvas texture,
desaturated earthy palette of ochre, rust, olive green and dusty slate blue,
soft dramatic chiaroscuro lighting, melancholic late-medieval Central
European atmosphere, realistic proportions, similar in mood to "The Life and
Suffering of Sir Brante". Strong colour only on small accents. Avoid: anime,
cartoon, 3D render, photography, oversaturated colours, airbrushed digital
art, any text, letters, watermark or signature.

Images:
```

### 14.1 Portréty sedláka (avatar) — 4:5, cíl 1024 × 1280

Hra je bere podle postavení: poddaný sedlák (`peasant`), po výkupu nebo
hrdinství svobodník (`freeman`). Od 55 let se ukáže stará verze (`_old`).
U starých verzí přilož mladou a připiš *„the same person as in the attached
image, 30 years older“*.

| Soubor | Popis pro Gemini |
|---|---|
| `ruler_peasant_male.jpg` | A late-medieval Central European peasant man of about 22, a serf, sunburnt and lean, short unkempt brown hair, light stubble, stubborn hopeful eyes, a coarse undyed linen shirt and a patched brown wool tunic, a rope belt. |
| `ruler_peasant_female.jpg` | A late-medieval Central European peasant woman of about 22, a serf, sunburnt with strong hands, brown hair tied under a plain linen kerchief, stubborn hopeful eyes, a coarse undyed linen blouse and a patched brown wool dress. |
| `ruler_peasant_male_old.jpg` | The same peasant man about 60 years old, weathered deeply lined face, grey beard, bent shoulders, the same coarse wool clothes, worn but proud. |
| `ruler_peasant_female_old.jpg` | The same peasant woman about 60 years old, weathered deeply lined face, grey hair under a linen kerchief, the same coarse wool clothes, worn but proud. |
| `ruler_freeman_male.jpg` | A late-medieval free farmer of about 35, well fed and confident, trimmed beard, a good dark green wool coat with leather buttons, a leather belt with a small purse and a knife, the look of a man who owes no one. |
| `ruler_freeman_female.jpg` | A late-medieval free farmer's wife and head of the farm, about 35, confident and shrewd, hair in a neat white linen coif, a good dark green wool dress with a leather girdle and a small purse. |
| `ruler_freeman_male_old.jpg` | The same free farmer about 60, grey beard, lined face, the same good wool coat, a walking staff, calm authority. |
| `ruler_freeman_female_old.jpg` | The same free farmer woman about 60, grey hair under a linen coif, lined face, the same good wool dress, calm authority. |

### 14.2 Rodina a ves — 4:5, cíl 1024 × 1280

Místo kancléře, maršála a špehmistra má sedlák rychtáře, kováře a krčmáře.
Rodina (manžel/manželka, dědic) má vlastní selské portréty. Hra pohlaví losuje,
proto vždy obě verze.

| Soubor | Popis pro Gemini |
|---|---|
| `s_chancellor_male.jpg` | A village reeve (rychtář) of about 55, grey-bearded and stern, a dark brown wool coat, a wax tablet and a small wooden seal on a cord around his neck. |
| `s_chancellor_female.jpg` | A village reeve woman of about 55, stern and clever, grey hair under a dark linen coif, a dark brown wool dress, a small wooden seal on a cord around her neck. |
| `s_marshal_male.jpg` | A village blacksmith of about 40, broad-shouldered, soot on his face and forearms, a leather apron over a rough shirt, a heavy hammer resting on his shoulder. |
| `s_marshal_female.jpg` | A village blacksmith woman of about 40, strong and broad-shouldered, soot on her face and arms, hair tied back, a leather apron over a rough shirt, holding tongs. |
| `s_spymaster_male.jpg` | A village innkeeper of about 45, round-faced and sly, a knowing smile, a stained apron, holding a wooden tankard, a smoky tavern glow behind him. |
| `s_spymaster_female.jpg` | A village innkeeper woman of about 45, sharp-eyed and sly, a knowing smile, a stained apron, holding a jug of beer, a smoky tavern glow behind her. |
| `s_spouse_male.jpg` | A young peasant husband of about 25, honest tired face, short hair, a coarse wool tunic, a scythe handle visible at his shoulder. |
| `s_spouse_female.jpg` | A young peasant wife of about 22, gentle but tough, brown hair braided under a linen kerchief, a coarse wool dress, flour on her hands. |
| `s_heir_male.jpg` | A peasant boy of about 10, barefoot farm child with a dirty face, tousled hair, curious bright eyes, a patched linen shirt. |
| `s_heir_female.jpg` | A peasant girl of about 10, barefoot farm child with a dirty face, a messy braid, curious bright eyes, a patched linen dress. |

### 14.3 Konce scénáře Sedlák — 16:9, cíl 1920 × 1080

| Soubor | Konec | Popis pro Gemini |
|---|---|---|
| `ending_ennobled.jpg` | Erb a tvrz | A former peasant kneeling in plain clothes before a knight who touches his shoulder with a sword, a newly painted coat of arms on a shield leaning nearby, villagers watching from the edge of a castle courtyard. |
| `ending_expelled.jpg` | Vyhnání z gruntu | A peasant family with a small handcart and bundles walking away from their farm along a muddy road at dusk, a lord's bailiff watching from the gate. |
| `ending_ruined.jpg` | Zpustlý grunt | An abandoned peasant farmstead with a collapsed roof, overgrown fields and a broken plough, crows on the fence, grey autumn sky. |

### 14.4 Scény sedláka — 1:1, cíl 2048 × 2048

| Soubor | Událost | Popis pro Gemini |
|---|---|---|
| `s_robota.jpg` | Robota | Serfs reaping a lord's wheat field under the eye of a bailiff with a stick, their own small unharvested field visible in the distance. |
| `s_drab.jpg` | Dráb si přišel | A smug bailiff with a stick and a parchment standing at the door of a peasant cottage, demanding coins from a peasant family. |
| `s_pan_navsteva.jpg` | Pán projíždí vsí | A lord on horseback with a small retinue stopping in front of a peasant farmstead, the peasant family bowing in the muddy yard. |
| `s_pansky_hon.jpg` | Panský hon | A noble hunting party with hounds and horses galloping through a peasant's ripe wheat field, a peasant raising his hands in despair. |
| `s_pytlactvi.jpg` | Jelen v panském lese | A peasant setting a snare at night in a dark forest, a stag in the moonlit clearing beyond. |
| `s_povstani.jpg` | Sedláci se bouří | Peasants with flails, scythes and torches gathering secretly in a village tavern at night around a rebel leader. |
| `s_rychtar_volba.jpg` | Nový rychtář | Villagers gathered under a linden tree on the village green, raising hands to choose a new reeve, an old reeve holding a wooden seal. |
| `s_trh.jpg` | Trh v Brodné | A busy small-town market with cattle, carts and stalls of grain and iron tools, a peasant haggling over a cow. |
| `s_krupobiti.jpg` | Krupobití | A violent hailstorm over a wheat field, flattened grain in the mud, a peasant family watching helplessly from a doorway. |
| `s_spatna_uroda.jpg` | Slabé žně | A thin poor harvest on a small field, a few sheaves, a worried peasant family counting sacks in a half-empty barn. |
| `s_pozar_stodoly.jpg` | Hoří stodola | A wooden barn burning at night beside a peasant cottage, villagers with buckets forming a line, sparks in the sky. |
| `s_vlci.jpg` | Vlci u ovčína | Wolves circling a wooden sheep pen in a snowy night, a peasant with a lantern and a spear at the gate. |
| `s_mor.jpg` | Mor v kraji | A plague-stricken village, a cart with shrouded bodies, a priest with a bell, doors marked with chalk crosses. |
| `s_mlynar.jpg` | Mlynář šidí | A sly miller weighing a sack of flour inside a watermill, a suspicious peasant watching the scales. |
| `s_kramar.jpg` | Cizí osivo | A travelling peddler with a loaded mule showing a pouch of strange seeds to a peasant at a farm gate. |
| `s_poklad.jpg` | Hrnec v brázdě | A peasant kneeling in a freshly ploughed furrow, uncovering a broken clay pot full of old silver coins. |
| `s_lichvar.jpg` | Peníze na dluh | A moneylender in a fur-trimmed coat counting coins on a table for a nervous peasant, a ledger open beside him. |
| `s_lichvar_splatka.jpg` | Lichvář je zpátky | A moneylender with a ledger and two thugs at a peasant's door, the family's cow being led away. |
| `s_nemoc_ditete.jpg` | Horečka | A sick child in a straw bed in a dark cottage, a mother holding a candle, an old herb woman preparing a brew. |
| `s_vychova.jpg` | Čemu se bude učit | A peasant child standing between a blacksmith at an anvil and a monk holding a book, a farm in the background. |
| `s_svatba.jpg` | Svatba ve vsi | A village wedding feast in a farmyard, long tables, musicians with bagpipes and fiddles, dancing villagers. |
| `s_spor_o_mez.jpg` | Mez se posunula | Two peasants arguing over a field boundary marked by a missing stone, a ploughed strip between them. |
| `s_carodejnictvi.jpg` | Pomluva | Villagers whispering and pointing at a peasant woman by a dead cow in a barn, a priest approaching. |
| `s_krcma.jpg` | Večer v krčmě | A smoky village tavern, peasants drinking and playing dice at a rough table, an innkeeper leaning over to whisper. |
| `s_zvon.jpg` | Nový zvon | Villagers and a priest lifting a new bronze bell into a small wooden church tower with ropes. |
| `s_desatek.jpg` | Desátek | A fat village priest with a cart collecting sheaves of grain as tithe from a reluctant peasant family. |
| `s_odvod.jpg` | Odvod | A royal recruiter reading a levy order in a village square, young peasant men lining up with spears, mothers crying. |
| `s_bitva.jpg` | Bitva | Peasant levies with spears in the front line of a battle, armoured knights charging toward them, banners and smoke. |
| `s_vykup.jpg` | Výkup z poddanství | A peasant placing a heavy purse on a lord's table, the lord pressing his seal onto a parchment of freedom. |
| `s_pole.jpg` | Pole na prodej | A free farmer walking the boundary of a new field with a reeve, measuring with a rod, a deed in hand. |
| `s_zemansky_statek.jpg` | Zemanský statek | A small old stone manor house on the coast with a tower, a free farmer and a royal clerk looking at it. |
| `s_pasovani.jpg` | Rytířský pás | A royal marshal girding a kneeling commoner with a knight's belt and sword in a castle hall, nobles watching with suspicion. |
| `s_klidne_obdobi.jpg` | Všední dny | A peaceful farmstead in Lipnice village on a summer evening, a peasant family working in the field, a church tower in the distance. |
| `krize_s_hlad.jpg` | Prázdná komora | An empty pantry in a peasant cottage, a starving family around an empty pot, children with hollow cheeks. |
| `krize_s_bida.jpg` | Ani groš | A peasant turning out an empty purse on a bare table, a bailiff waiting at the door. |
| `krize_s_nemilost.jpg` | Hrozba vyhnání | A bailiff nailing a notice to the door of a peasant cottage, the family watching in fear. |
| `ozvena_s_poklad.jpg` | Kdo viděl hrnec | A sly boy whispering to a peasant at a fence, pointing at the threshold of a cottage. |
| `ozvena_s_udavac.jpg` | Jidáš z Lipnice | A painted rope on the door of a peasant cottage, villagers turning their backs in the village street. |

### 14.5 Scény rádců a výchovy — 1:1, cíl 2048 × 2048

Patří k novým povahám rádců (všechny scénáře) a k výchově dědice u šlechtice.

| Soubor | Událost | Popis pro Gemini |
|---|---|---|
| `q_chamtivost.jpg` | Ruka v truhle | A counsellor caught at night with his hand in an open treasure chest, a guard with a lantern in the doorway. |
| `q_ctizadost.jpg` | Zaslouží si víc | An ambitious counsellor in fine robes standing proudly before a seated ruler, gesturing at a map of lands he wants. |
| `q_odvaha.jpg` | Odvážný plán | A bold commander pointing at a forest on a war table map, eager soldiers behind him, candlelight. |
| `q_oddanost.jpg` | Věrné srdce | A loyal counsellor with a lantern whispering a warning to a ruler in a dark castle corridor at night. |
| `n_vychova_dedice.jpg` | Kde se bude dědic učit | A young noble heir in a castle courtyard between a knight with a practice sword and a steward with account books. |
