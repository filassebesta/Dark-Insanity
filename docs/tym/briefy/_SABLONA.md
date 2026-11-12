# NNN — Název funkce

**Stav:** koncept · lore · implementace · QA · hotovo
**Scénář(e):** panovnik / slechtic / sedlak
**Priorita:** P1 / P2 / P3

---

## 1. Koncept *(creative-director)*

**Proč:** jaký problém hry to řeší / co hráči chybí (opřít o data ze simulací nebo HANDOFF).

**Zážitek hráče:** 2–4 věty, co hráč zažije a cítí.

**Rozsah:**
- V rozsahu: …
- Mimo rozsah: …

**Návaznost:** na které existující události, příznaky, ozvěny, mechaniky to navazuje.

**Seznam práce:**
| # | Co | Typ (událost / mechanika / UI / obrázek) | id / soubor | Vlastník |
|---|---|---|---|---|

**Akceptační kritéria (měřitelná):**
- [ ] `node tools/check/validate.mjs` = 0 chyb
- [ ] smoke test OK
- [ ] simulace: … (např. Sedlák ambice 0,5: šlechtický stav 40–55 %, errors 0)
- [ ] nová událost `x` se v 400 hrách objeví aspoň …×
- [ ] …

**Rizika / otázky pro uživatele:**

---

## 2. Lore *(lore-designer)*

**Nová fakta do kánonu:** (už zapsaná v `docs/lore/KANON.md`)

**Postavy:**

**Texty** — pro každou událost: `id`, `title`, `text`, volby (`label` → kronika úspěch/neúspěch), požadované rodové tvary.

---

## 3. Implementace *(game-coder)*

**Změněné soubory:**

**Nová pole / příznaky / ozvěny:**

**Výsledky kontrol:** validátor, simulace (čísla před/po), smoke test.

**Požadavky pro ostatní:**

---

## 4. Grafika *(graphic-designer)*

**Obrázky:** soubor · poměr · rozlišení · prompt (sekce v `docs/gemini-prompts.md`) · stav ✅/❌

**CSS / UI / ikony:**

---

## 5. QA *(bug-checker)*

**Verdikt:** PASS / FAIL (kolo 1)

| # | Závažnost | Kde (soubor:řádek) | Co je špatně | Reprodukce | Vlastník |
|---|---|---|---|---|---|

**Ověřená kritéria:**
