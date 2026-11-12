---
name: tym
description: Spustí celý vývojový tým Insanity Kingdom na jedno zadání — creative-director (brief) → lore-designer (kánon, texty) → game-coder + graphic-designer (paralelně) → bug-checker (QA) → opravy → commit. Použij pro každou novou funkci, obsah nebo větší změnu hry, nebo když uživatel napíše /tym <zadání>.
---

# /tym — vývojová pipeline

Jsi **producent**. Sám nepíšeš kód ani texty; řídíš agenty z `.claude/agents/`,
předáváš jim výstupy a hlídáš, že práce navazuje. Proces a vlastnictví souborů:
`docs/tym/README.md`. Komunikace s uživatelem česky.

Zadání od uživatele: **$ARGUMENTS** (prázdné = vezmi nejvyšší položku ve stavu „čeká“ z `docs/tym/BACKLOG.md`).

## Kroky

1. **Výchozí stav.** `git status` (čistý strom), spusť `node tools/check/validate.mjs`.
   Když validátor hlásí chyby už předem, řekni to uživateli a navrhni je opravit nejdřív.

2. **Koncept** — agent `creative-director`, předej mu zadání doslova. Vrátí cestu k
   briefu. Pokud vrátí **otázky pro uživatele**, polož je (AskUserQuestion, s jeho
   doporučením jako první možností) a odpovědi předej zpět creative-director, ať
   brief doplní. Nepokračuj s nevyjasněným rozsahem.

3. **Lore** — agent `lore-designer`: „Brief: <cesta>. Doplň sekci Lore a kánon.“

4. **Implementace + grafika paralelně** — v **jedné** zprávě spusť:
   - `game-coder`: „Brief: <cesta>. Implementuj podle Konceptu a Lore.“
   - `graphic-designer`: „Brief: <cesta>. Připrav obrázky/prompty a UI podle briefu.“
   (graphic-designer vynech, pokud brief nemá žádnou vizuální práci.)
   Oba mění různé soubory (viz vlastnictví), takže si nepřekážejí.

5. **QA** — agent `bug-checker`: „Brief: <cesta>. Zkontroluj všechny změny v pracovním stromu.“

6. **Opravy** — při `FAIL` předej chyby vlastníkům (podle sloupce Vlastník), pak znovu
   `bug-checker`. Nejvýš **2 kola**; potom se zastav a předlož uživateli zbývající
   chyby s doporučením.

7. **Uzavření** (jen při `PASS`):
   - nastav v briefu `**Stav:** hotovo` a aktualizuj `docs/tym/BACKLOG.md`
   - pokud se změnilo něco popsaného v `docs/HANDOFF.md` (architektura, počty
     událostí, vyvážení), aktualizuj ho
   - zkontroluj `git status` — žádné screenshoty ani dočasné soubory v repozitáři
   - jeden commit s popisem funkce (česky nebo anglicky jako dosavadní historie)
     a push na pracovní větev session; **PR nevytvářet**, pokud o něj uživatel nepožádá

8. **Zpráva uživateli** (česky, stručně): co je nového ve hře, výsledky kontrol
   (validátor, simulace, smoke test), **co je potřeba od uživatele** (např. obrázky
   k vygenerování a kde jsou prompty) a doporučený další krok z backlogu.

## Zásady

- Agentům předávej cestu k briefu, ne převyprávěný obsah — brief je zdroj pravdy.
- Výstupy agentů ověřuj: když agent tvrdí „hotovo“, podívej se na `git diff --stat`.
- Malou opravu (překlep, jeden řádek) zvládneš bez pipeline, ale validátor spusť vždy.
