# Vývojový tým — jak spolu agenti pracují

Hru vyvíjí pět specializovaných agentů (`.claude/agents/`). Hlavní session je
**producent**: přijme zadání od uživatele, pouští agenty ve správném pořadí,
předává jim výstupy a na konci commituje. Agenti necommitují.

## Role a vlastnictví

| Agent | Role | Vlastní (smí měnit) | Hlavní nástroje |
|---|---|---|---|
| `creative-director` | kreativní manažer: vize, rozsah, priority, akceptační kritéria | `docs/tym/BACKLOG.md`, `docs/tym/briefy/*` (sekce Koncept), sekce 8 kánonu (spolu s lore) | Read/Grep, simulace (čísla), WebSearch (reference) |
| `lore-designer` | svět, postavy, texty událostí, jména, ozvěny | `docs/lore/KANON.md`, sekce Lore v briefu, **texty** v `js/events*.js` | Read/Grep, validátor, WebSearch (historické reálie) |
| `game-coder` | mechaniky, engine, UI logika, události v kódu, vyvážení | `js/*`, `index.html`, `tools/sim/*`, `tools/check/*`, `docs/udalosti.md`, sekce Implementace | Bash (node, simulace, validátor, smoke test), Edit |
| `graphic-designer` | vizuální styl, prompty pro obrázky, zpracování obrázků, CSS, ikony | `css/style.css`, `js/icons.js`, `assets/*`, `docs/gemini-prompts.md`, sekce Grafika | Python (Pillow), Playwright screenshoty, prohlížení obrázků, Canva (pokud je připojená) |
| `bug-checker` | kontrola kvality, hledání chyb, ověření akceptačních kritérií | jen sekce QA v briefu (kód **nemění**) | validátor, simulace, smoke test v prohlížeči, code review |

## Postup (pipeline) jedné funkce

```
uživatel ─▶ creative-director ─▶ lore-designer ─▶ game-coder ─┬─▶ bug-checker ─▶ commit
             (brief + kritéria)   (kánon, texty)   (kód)       │      │ FAIL
                                                 graphic-designer     ▼
                                                 (prompty, CSS)   game-coder / graphic-designer opraví
                                                                  (max. 2 kola, pak rozhodne uživatel)
```

1. **Koncept** — `creative-director` napíše brief `docs/tym/briefy/NNN-nazev.md` podle
   `_SABLONA.md`: proč, co hráč zažije, rozsah, seznam událostí/změn, měřitelná
   akceptační kritéria. Zařadí ho do `BACKLOG.md`.
2. **Lore** — `lore-designer` doplní do briefu sekci Lore (nová fakta, postavy,
   hotové texty událostí a voleb) a zapíše nová fakta do kánonu.
3. **Implementace** — `game-coder` postaví mechaniku a události podle briefu a textů
   z Lore, spustí validátor + simulace, doplní sekci Implementace.
   **Paralelně** `graphic-designer` připraví prompty / CSS / zpracuje obrázky a doplní sekci Grafika.
4. **QA** — `bug-checker` ověří vše proti akceptačním kritériím a zapíše verdikt
   `PASS` / `FAIL` se seznamem chyb (soubor:řádek, reprodukce, závažnost).
5. **Oprava** — při `FAIL` opraví vlastník souboru, `bug-checker` ověří znovu.
6. **Commit** — producent commitne (jeden commit na funkci), aktualizuje backlog a
   `docs/HANDOFF.md`, pokud se změnilo něco, co v něm je popsané.

Drobnosti (překlep, jednořádková oprava) jdou mimo pipeline rovnou ke `game-coder`
nebo k producentovi, ale `bug-checker` (aspoň validátor) běží vždy.

## Předávací pravidla (aby práce navazovala)

- **Brief je jediný sdílený pracovní dokument funkce.** Každý agent ho na začátku
  přečte celý a na konci do své sekce zapíše, co udělal, kde a co nechává dalším.
- Každý agent vrací producentovi krátké shrnutí: *co hotovo · změněné soubory ·
  co potřebuje další agent · otevřené otázky*.
- Nikdo nepřepisuje cizí sekce briefu ani cizí soubory; požadavek na změnu cizího
  souboru napíše do své sekce jako „Požadavek pro <agent>“.
- Fakta o světě platí jen z kánonu. Co v kánonu není, lore-designer nejdřív zapíše.
- Žádné id události, příznak (`flag`) ani obrázek nevzniká „na zkoušku“ — co je v
  briefu, je v kódu; co je v kódu, je v briefu.

## Kontroly kvality (spouští každý, kdo mění kód; bug-checker vždy)

```bash
node tools/check/validate.mjs            # statická kontrola obsahu (exit 1 = chyba)
node tools/check/validate.mjs --art      # + události bez vlastního obrázku
node tools/sim/sim.mjs                   # Panovník, 400 her (konce, chyby, frekvence událostí)
node tools/sim/sim_noble.mjs 400 1       # Šlechtic
node tools/sim/sim_peasant.mjs 400 0.5   # Sedlák
node tools/sim/sim_trade.mjs sedlak 200  # obchod
node tools/check/smoke.mjs 40 <scratch>  # skutečné UI v Chromiu, 3 scénáře × 40 kol, screenshoty mimo repo
```

**Definice hotového:** validátor 0 chyb · simulace bez `errors` a s koncovým
rozdělením v rozmezí z briefu · smoke test OK · kánon a `docs/udalosti.md`
aktuální · u nových událostí řádky v `docs/gemini-prompts.md`.
