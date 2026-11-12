# Insanity Kingdom

Česká textová rozhodovací středověká strategie v prohlížeči (styl *The Life and
Suffering of Sir Brante*). Čisté HTML + CSS + ES moduly, žádný build.
Tři navazující scénáře: Sedlák → Šlechtic → Panovník.

- **Úplný popis hry, architektury a historie:** `docs/HANDOFF.md` — přečti před prací.
- **Kánon světa:** `docs/lore/KANON.md`
- **Vývojový tým a proces:** `docs/tym/README.md`, backlog `docs/tym/BACKLOG.md`

## Vývojový tým (agenti v `.claude/agents/`)

| Agent | Kdy |
|---|---|
| `creative-director` | první krok každé nové funkce: brief, rozsah, akceptační kritéria, priority |
| `lore-designer` | svět, postavy, texty událostí a kronik, ozvěny, kánon |
| `game-coder` | mechaniky, engine, události v kódu, vyvážení, opravy |
| `graphic-designer` | prompty pro obrázky, zpracování obrázků, CSS/UI, ikony |
| `bug-checker` | QA po každé implementaci a před každým commitem (kód nemění) |

Novou funkci nebo obsah dělej přes pipeline **`/tym <zadání>`** (skill v
`.claude/skills/tym/`). Hlavní session je producent: řídí agenty, commituje.

## Kontroly (před každým commitem)

```bash
node tools/check/validate.mjs             # statická kontrola obsahu, musí být errors: 0
node tools/sim/sim.mjs                    # simulace (také sim_noble.mjs 400 1, sim_peasant.mjs 400 0.5)
node tools/check/smoke.mjs 40 <scratch>   # hra ve skutečném Chromiu, 3 scénáře
python3 -m http.server 8123               # ruční hraní: http://localhost:8123/
```

## Pravidla uživatele (neporušovat)

- Komunikace **česky**, stručně; po práci říct, co se změnilo a co je potřeba od uživatele.
- Důsledky voleb jsou **skryté** (žádné náhledy efektů ani růstu vlastností).
- Hlavní menu = **původní rytina**, neměnit; žádné červené zvýraznění klikacích míst.
- Hudba: hlavní téma celou hru, bitevní jen při bojích.
- Obrázky zapracovat hned, jak přijdou; třídit podle obsahu, ne podle názvu.
- Prompty pro obrázky dávkově a samostatné (uživatel je posílá do AI bez přístupu k repozitáři).
- Screenshoty a dočasné soubory **nikdy do repozitáře**.
- PR nevytvářet, pokud o to uživatel výslovně nepožádá.
