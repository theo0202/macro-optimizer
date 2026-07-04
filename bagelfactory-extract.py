# Extrahiert die Bagel-Factory-Naehrwerte aus der offiziellen "Full Ingredient List"-PDF (Issue 20, 13/04/2026):
#   py -3 bagelfactory-extract.py "C:\pfad\zur\Full-Ingredient-List.pdf"
# -> data/bagelfactory-raw.json
#
# WICHTIG (Datenlage, 04.07.2026):
# - Nur die FERTIGEN Menue-Bagels (Spread/Breakfast/Veggie/Seafood/Deli/Mini) + Sweets haben "Per portion (Xg)"-
#   Werte -> nur die sind aufnehmbar. Die EXTRAS- (BYO-Proteine/-Salate) und SAUCES-Sektionen sind NUR per 100g
#   ohne Portionsgewichte -> Build-Your-Own + Customizing der Menue-Bagels sind NICHT abbildbar (keine Schaetzwerte!).
# - Fussnote "**Refer to a bagel prepared with a plain bun": die Werte der fertigen Bagels gelten fuer den PLAIN Bun.
# - Ausgeschlossen: BAGEL BUNS (nackte Buns, keine Menue-Items), EXTRAS, SAUCES, HOT/COLD DRINKS, EXTRAS FOR DRINKS.
import pdfplumber, re, json, sys, unicodedata

PDF = sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\theod\Downloads\Full-Ingredient-List.pdf"
OUT = "data/bagelfactory-raw.json"

# Sektionen -> App-Kategorie (None = Sektion ueberspringen)
SECTIONS = {
    "BAGEL BUNS": None,
    "SPREAD BAGELS": ("spread", "Spread Bagels"),
    "BREAKFAST BAGELS": ("breakfast", "Breakfast Bagels"),
    "VEGGIE BAGELS": ("veggie", "Veggie Bagels"),
    "SEAFOOD BAGELS": ("seafood", "Seafood Bagels"),
    "DELI BAGELS": ("deli", "Deli Bagels"),
    "MINI BAGELS": ("mini", "Mini Bagels"),
    "SWEETS": ("sweets", "Sweet Treats"),
    "HOT DRINKS": None,
    "COLD DRINKS": None,
    "EXTRAS FOR DRINKS": None,
    "EXTRAS": None,
    "SAUCES": None,
}
MACROS = [  # (Zeilen-Prefix, Feld)
    ("Energy (Kcal)", "kcal"), ("Energy (Kj)", None), ("Fat", "fat"),
    ("of which Saturates", "sat"), ("Carbohydrates", "carbs"),
    ("of which Sugars", "sugars"), ("Fibre", "fibre"), ("Protein", "protein"), ("Salt", "salt"),
]

def deacc(s):  # Mojibake/Umlaute -> ASCII-freundlich ("Jalape�o" kommt als U+FFFD)
    s = s.replace("�", "n").replace("Jalapeno", "Jalapeno")
    return unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()

def num(s):
    m = re.search(r"(-?\d+(?:\.\d+)?)", s.replace(",", ""))
    return float(m.group(1)) if m else None

lines = []
with pdfplumber.open(PDF) as pdf:
    for page in pdf.pages:
        t = page.extract_text() or ""
        page_lines = t.split("\n")
        for ln in page_lines:
            s = ln.strip()
            if not s: continue
            if s.startswith("ISSUE ") and "DATE" in s: continue
            if s.startswith("* Received frozen"): break  # Footer beginnt hier -> Rest der Seite verwerfen
            lines.append(s)

items, cur_cat, i = [], None, 0
expect_title = False   # nach Sektions-Header / abgeschlossenem Eintrag kommt als naechstes ein Titel
pending_title = None
while i < len(lines):
    s = lines[i]
    if s in SECTIONS:
        cur_cat = SECTIONS[s]
        expect_title = True
        pending_title = None
        i += 1; continue
    if cur_cat and expect_title:
        pending_title = s
        expect_title = False
        i += 1; continue
    if cur_cat and s.startswith("Per portion") and pending_title:
        # es folgt: "Nutrition Facts[**]", "(Xg)", dann die Makro-Zeilen
        j = i + 1
        portion = None
        vals = {}
        order = 0
        while j < len(lines) and order < len(MACROS):
            t = lines[j]
            if t in SECTIONS: break
            if portion is None:
                m = re.match(r"^\((\d+(?:\.\d+)?)\s*g\)$", t)
                if m: portion = float(m.group(1)); j += 1; continue
                if t.startswith("Nutrition Facts"): j += 1; continue
            prefix, field = MACROS[order]
            if t.startswith(prefix):
                if field: vals[field] = num(t[len(prefix):])
                order += 1
            j += 1
        # Titel bereinigen: Flags (V, VG, H) + Sternchen am Ende entfernen
        raw = deacc(pending_title)
        flags = ""
        m = re.match(r"^(.*?)\*?\s*((?:V|VG|H)(?:\s*,\s*(?:V|VG|H))*)$", raw)
        if m and m.group(2): raw, flags = m.group(1), m.group(2)
        name = re.sub(r"\*+$", "", raw).strip().rstrip(",").strip()
        if len(vals) == 8 and portion and all(v is not None for v in vals.values()):
            items.append({
                "name": name, "cat": cur_cat[0], "portionG": portion,
                "kcal": vals["kcal"], "fat": vals["fat"], "sat": vals["sat"],
                "carbs": vals["carbs"], "sugars": vals["sugars"], "fibre": vals["fibre"],
                "protein": vals["protein"], "salt": vals["salt"],
                "veggie": "V" in flags.replace("VG", ""), "vegan": "VG" in flags,
            })
        else:
            print(f"!! unvollstaendig: {name} (portion={portion}, macros={len(vals)})")
        pending_title = None
        expect_title = True
        i = j; continue
    i += 1

# Bekannter PDF-Zeilen-Verrutscher (Issue 20, p19): "Mini The Classic Bagel" druckt "Carbohydrates 19.1g / of which
# Sugars 24.1g" (Zucker > Carbs unmoeglich). Beweis (Review 04.07.2026): der Mini ist eine exakte 80/208=0.3846-
# Skalierung des grossen "The Classic" in JEDEM anderen Makro (kcal 195, fat 6.9, sat 3.5, protein 8.7, fibre 1.7,
# salt 0.9). Skalierte Carbs = 62.0×0.3846 = 23.85 ≈ die "24.1" in der Zucker-Zeile; skalierte Sugars = 8.1×0.3846
# = 3.1. Zudem rekonstruiert nur carbs=24.1 die kcal exakt (4C+4P+9F = 193 ≈ 195; mit 19.1 nur 173, 11% Loch).
# -> die 24.1 ist die verrutschte CARB-Angabe: carbs=24.1 (PDF-Wert aus der Zucker-Zeile), sugars=3.1 (skaliert).
anomalies = []
for it in items:
    if it["name"] == "Mini The Classic Bagel" and it["sugars"] > it["carbs"]:
        anomalies.append(f'Mini The Classic Bagel: PDF-Zeilenverrutscher (carbs 19.1 / sugars 24.1 gedruckt) -> carbs=24.1 (Wert aus der Zucker-Zeile), sugars=3.1 (skaliert aus dem grossen The Classic)')
        it["carbs"] = it["sugars"]   # 24.1 = die in die Zucker-Zeile verrutschte Carb-Angabe
        it["sugars"] = 3.1           # skaliert: grosser The Classic 8.1 × 80/208

# Verifizierte (korrekte) scheinbare Anomalien, die NICHT "gefixt" werden duerfen (fuer kuenftige Audits):
verified_notes = [
    "Strawberry Jam Bagel: kcal 388 < 4C+4P+9F (432) ist KORREKT — die Jam ist 54% Sorbitol (Polyol, ~2.4 kcal/g, "
    "zaehlt als Carb aber NICHT als Zucker), daher kcal-Defizit ~44 und niedriger Zuckerwert trotz hoher Carbs.",
]

# Plausibilitaet: kcal vs 4C+4P+9F
flagged = []
for it in items:
    est = 4*it["carbs"] + 4*it["protein"] + 9*it["fat"]
    off = abs(it["kcal"] - est)
    if off > 60 and off / max(it["kcal"], 1) > 0.25:
        flagged.append(f'{it["name"]}: kcal {it["kcal"]} vs Makros ~{est:.0f}')

cats_seen = []
for it in items:
    if it["cat"] not in cats_seen: cats_seen.append(it["cat"])
cat_names = {v[0]: v[1] for v in SECTIONS.values() if v}

out = {
    "_meta": {
        "source": "Bagel Factory 'Full Ingredient List' PDF, Issue 20, 13/04/2026 (per-portion Werte)",
        "extractor": "py -3 bagelfactory-extract.py",
        "note": "Nur fertige Menue-Bagels + Sweets (per-portion). Fussnote der PDF: Werte gelten fuer den PLAIN Bun. EXTRAS/SAUCES sind nur per-100g ohne Portionsgroesse -> BYO + Customizing NICHT abbildbar. Drinks/Buns ausgelassen. Crisps/Popcorn stehen gar nicht in der PDF.",
        "kcal_flags": flagged,
        "anomalies": anomalies,
        "verified_notes": verified_notes,
    },
    "cats": [{"id": c, "name": cat_names[c], "on": True} for c in cats_seen],
    "items": items,
}
import os
os.makedirs("data", exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(out, f, indent=1, ensure_ascii=False)
print(f"{len(items)} Items, {len(cats_seen)} Kategorien -> {OUT}")
for c in cats_seen:
    print(f"  {cat_names[c]}: {sum(1 for x in items if x['cat']==c)}")
if flagged:
    print("kcal-Plausibilitaets-Flags:\n  " + "\n  ".join(flagged))
