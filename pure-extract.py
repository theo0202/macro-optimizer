# -*- coding: utf-8 -*-
# Extrahiert die Deliveroo-bestellbaren Pure-Items aus data/Pure-AllMenuItems.csv -> data/pure-raw.json
#   py -3 pure-extract.py
# Quelle: offizielle Pure "All Menu Items"-CSV (volle 8 Makros per Portion + Allergene, alle Allergen-Spalten "Y" = frei).
# Nur die Deliveroo-Karte (User 12.07.2026). Match per Name (RENAME-Map Deliveroo->CSV) + kcal-Verifikation.
# Regeln: LIVE=Y bevorzugt (LIVE=N = eingestellte Rezeptur) -> dann kcal-naechster Kandidat.
#   Soups: PRIMARY=Regular / SECONDARY=Large -> Deliveroo verkauft Large -> SECONDARY-Block.
#   Salads mit Dressed/Undressed (PRIMARY/SECONDARY): BEIDE als Items ("(dressed)" / "(no dressing)") —
#   das Dressing kommt on the side, der Optimizer kann die passende Variante waehlen (wie TFC-Groessen).
# Flat White (Getraenk) bewusst NICHT aufgenommen — Drinks sind in allen Restaurants ausgeschlossen (Konvention).
import csv, json, re, unicodedata, os

HERE = os.path.dirname(os.path.abspath(__file__))
CSV = os.path.join(HERE, "data", "Pure-AllMenuItems.csv")
OUT = os.path.join(HERE, "data", "pure-raw.json")

def norm(s):
    s = unicodedata.normalize("NFKD", s or "")
    s = s.replace("’", "'").replace("‘", "'").replace("&", "and")
    s = re.sub(r"[^a-z0-9]+", " ", s.lower())
    return re.sub(r"\s+", " ", s).strip()

def fnum(v):
    if v is None: return None
    v = str(v).strip().replace(",", ".")
    if v in ("", "-", "--", "n/a", "N/A"): return None
    m = re.match(r"^<?\s*(-?\d+(\.\d+)?)", v)
    return float(m.group(1)) if m else None

# Deliveroo-Karte: (Anzeigename, Deliveroo-kcal, Kategorie, CSV-Name falls abweichend, Block "P"/"S")
# Block "S" = SECONDARY Nutritionals (Large bei Soups). Default "P".
MENU = [
    # Pure Bowls
    ("Chicken Shawarma Pure Bowl",             651, "pure_bowls", "Chicken Shawarma", "P"),
    ("High Protein Chilli & Cheese",           864, "pure_bowls", None, "P"),
    ("Protein Chicken & Mushroom",             597, "pure_bowls", None, "P"),
    ("Sweet Potato & Coconut Curry Pure Bowl", 637, "pure_bowls", "Sweet Potato & Coconut Curry", "P"),
    # Toasties
    ("Chicken Picante Wrap Toastie",           576, "toasties", "Chicken Picante", "P"),
    ("Chicken New Yorker Wrap Toastie",        519, "toasties", "Chicken New Yorker", "P"),
    # Soups (Deliveroo = Large -> SECONDARY-Block)
    ("British Chicken Soup Large",             185, "soups", "British Chicken", "S"),
    ("Thai Green Lentil Soup Large",           312, "soups", "Thai Green Lentil", "S"),
    # Wraps
    ("Hail Caesar",                            576, "wraps", None, "P"),
    ("So Cluckin Good",                        503, "wraps", "So Cluckin' Good", "P"),
    ("Lock, Stock & Hot Smoked Salmon",        427, "wraps", None, "P"),
    ("Falafalo Soldier",                       702, "wraps", None, "P"),
    # Salads (Dressed/Undressed-Varianten werden automatisch erzeugt, wo SECONDARY="Undressed")
    ("Prime Protein",                          437, "salads", None, "P"),
    ("Celebrity Skin",                         543, "salads", None, "P"),
    ("Salmon Lovin'",                          421, "salads", None, "P"),
    ("Rainbow Veg",                            372, "salads", None, "P"),
    ("Chicken Caesar",                         346, "salads", None, "P"),
    # Sandwiches
    ("Protein Chicken Salad",                  220, "sandwiches", None, "P"),
    ("Skipjack Tuna & Smoky Corn",             495, "sandwiches", None, "P"),
    ("Chickpea, Sriracha & Smashed Avo",       617, "sandwiches", None, "P"),
    # Pretzel Subs
    ("British Chargrilled Chicken",            360, "pretzel_subs", None, "P"),
    ("Salt Beef, Mustard & Pickles",           351, "pretzel_subs", None, "P"),
    ("Salmon & Cream Cheese",                  339, "pretzel_subs", None, "P"),
    # Birchers & Yoghurts
    ("Super Protein",                          616, "birchers", None, "P"),
    ("Raspberry & Peanut Butter Yoghurt",      358, "birchers", "Raspberry & Peanut Butter", "P"),
    ("Berry Overnight Oats",                   316, "birchers", None, "P"),
    ("Top Banana",                             331, "birchers", None, "P"),
    ("Fibre Starter",                          674, "birchers", None, "P"),
    ("Rise & Shine Bircher",                   319, "birchers", None, "P"),
    ("Go Nuts Bircher",                        459, "birchers", None, "P"),
    # Sides
    ("25 gr Protein - Chicken & Hummus",       317, "sides", "25g Protein Chicken & Hummus", "P"),
    ("20 gr Protein - Chicken & Harissa",      186, "sides", "20g Protein Chicken & Harissa", "P"),
    ("Sourdough Roll and Butter",              230, "sides", None, "P"),
    ("24 Carrot",                              234, "sides", None, "P"),
    # Snacks & Treats (Kategorie default AUS — Suesskram)
    ("Dark Chocolate & Hazelnut Cookie",       272, "snacks", None, "P"),
    ("Salted Caramel Brownie",                 270, "snacks", None, "P"),
    ("Super Fruit Salad",                      118, "snacks", None, "P"),
    ("Peanut Butter Choc Pot",                 216, "snacks", None, "P"),
    ("Oat & Cranberry Cookie",                 246, "snacks", None, "P"),
    # Pastries & Muffins (default AUS; Cinnamon Bun/Blueberry Muffin/Apple Bran stehen auf Deliveroo doppelt -> Primaerkategorie pastries)
    ("Cinnamon Bun",                           320, "pastries", None, "P"),
    ("Blueberry Muffin",                       405, "pastries", None, "P"),
    ("Apple, Bran & Cinnamon Muffin",          308, "pastries", None, "P"),
    ("Chocolate Croissant",                    409, "pastries", None, "P"),
    ("Vegan Almond Croissant",                 486, "pastries", None, "P"),
    ("Plain Croissant",                        348, "pastries", "Croissant", "P"),
]

# User-Ausschluss (12.07.2026): raus, weil CSV↔Deliveroo-kcal zu stark abweicht bzw. CSV in sich inkonsistent.
# Behalten wurden bewusst: Salads mit Dressing-Wahl (Deliveroo mittelt) + Wraps (handmade, Gewicht schwankt) +
# vernachlässigbare (<5%, inkl. Thai Green Lentil +4.5% + Super Fruit Salad kcal-exakt). Schlüssel = MENU-Anzeigename.
USER_EXCLUDE = {
    "Protein Chicken Salad",                 # CSV 532 vs Deliveroo 220 (+142%) — Deliveroo-Wert unmöglich fürs Sandwich
    "Salmon Lovin'",                         # Salat OHNE Dressed/Undressed-Split, CSV 364 vs Deliveroo 421 (-13.5%)
    "Sweet Potato & Coconut Curry Pure Bowl",# CSV 556 (LIVE) vs Deliveroo 637 (≈ alte 624er-Rezeptur) — echte Unsicherheit
    "British Chicken Soup Large",            # CSV Large 226 vs Deliveroo 185 (passt zu keiner CSV-Größe)
    "Apple, Bran & Cinnamon Muffin",         # kcal 308 ok, aber Makros ergeben nur ~226 (CSV intern inkonsistent)
}

CATS = [
    {"id": "pure_bowls",   "name": "Pure Bowls",          "on": True},
    {"id": "toasties",     "name": "Toasties",            "on": True},
    {"id": "soups",        "name": "Soups",               "on": True},
    {"id": "wraps",        "name": "Wraps",               "on": True},
    {"id": "salads",       "name": "Salads",              "on": True},
    {"id": "sandwiches",   "name": "Sandwiches",          "on": True},
    {"id": "pretzel_subs", "name": "Pretzel Subs",        "on": True},
    {"id": "birchers",     "name": "Birchers & Yoghurts", "on": True},
    {"id": "sides",        "name": "Sides",               "on": True},
    {"id": "snacks",       "name": "Snacks & Treats",     "on": False},
    {"id": "pastries",     "name": "Pastries & Muffins",  "on": False},
]

rows = []
with open(CSV, encoding="utf-8-sig", newline="") as f:
    for r in csv.DictReader(f):
        rows.append(r)

def col(r, key):
    for k in r:
        if k and norm(k) == norm(key): return r[k]
    return None

def macros(r, block):
    pre = "PRIMARY NUTRITIONALS - " if block == "P" else "SECONDARY NUTRITIONALS - "
    def g(c): return fnum(col(r, pre + c))
    return {
        "kcal": g("ENERGY (KCAL) - PORTION"), "fat": g("FAT (G) - PORTION"), "sat": g("SATURATES (G) - PORTION"),
        "carbs": g("CARBOHYDRATE (G) - PORTION"), "sugars": g("SUGARS (G) - PORTION"), "fibre": g("FIBRE (G) - PORTION"),
        "protein": g("PROTEIN (G) - PORTION"), "salt": g("SALT (G) - PORTION"),
    }

items, notes, errors, excluded = [], [], [], []
for name, dkcal, cat, csvname, block in MENU:
    if name in USER_EXCLUDE:
        excluded.append(name); continue
    n = norm(csvname or name)
    cands = [r for r in rows if norm(r.get("NAME", "")) == n]
    if not cands:
        errors.append(f"NOT FOUND: {name} (CSV-Name: {csvname or name})"); continue
    live = [r for r in cands if (r.get("LIVE?") or "").strip().upper() == "Y"]
    pool = live or cands
    if not live: notes.append(f"{name}: kein LIVE=Y — nutze LIVE=N-Zeile")
    # kcal-naechster Kandidat (filtert z.B. die kJ-in-kcal-Fehlzeile der Chickpea-Dublette 2584 raus)
    pool.sort(key=lambda r: abs((macros(r, block)["kcal"] or 1e9) - dkcal))
    r = pool[0]
    m = macros(r, block)
    # Kern-Makros (kcal/fat/carbs/protein) sind Pflicht; leere Neben-Makros (z.B. Salt beim Fruit Salad) -> 0 + Note
    if any(m[k] is None for k in ("kcal", "fat", "carbs", "protein")):
        errors.append(f"MISSING MACROS: {name} -> {m}"); continue
    for k in ("sat", "sugars", "fibre", "salt"):
        if m[k] is None:
            notes.append(f"{name}: {k} leer in CSV -> 0"); m[k] = 0.0
    # Atwater-Plausibilitaet (EU: 4C+4P+9F+2Fibre)
    atw = 4*m["carbs"] + 4*m["protein"] + 9*m["fat"] + 2*m["fibre"]
    if abs(m["kcal"] - atw) > max(0.15*m["kcal"], 30):
        notes.append(f"{name}: kcal {m['kcal']} vs Atwater {atw:.0f} (>15%)")
    diff = m["kcal"] - dkcal
    if abs(diff) > 15:
        notes.append(f"{name}: CSV {m['kcal']:.0f} kcal vs Deliveroo {dkcal} (diff {diff:+.0f}) — CSV (offiziell, LIVE) gilt")
    base = {"cat": cat, "deliveroo_kcal": dkcal, "csv_name": (r.get("NAME") or "").strip()}
    sec_head = (col(r, "SECONDARY NUTRITIONALS - HEADING") or "").strip()
    if block == "P" and sec_head.lower() == "undressed":
        mu = macros(r, "S")
        items.append({"name": name + " (dressed)", **base, **m})
        if all(v is not None for v in mu.values()):
            items.append({"name": name + " (no dressing)", **base, **mu})
        else:
            notes.append(f"{name}: Undressed-Block unvollstaendig — nur dressed aufgenommen")
    else:
        items.append({"name": name, **base, **m})

if errors:
    for e in errors: print("ERROR:", e)
    raise SystemExit(1)
# Tripwire: jeder USER_EXCLUDE-Name MUSS im MENU vorgekommen sein (sonst Tippfehler -> Item bleibt versehentlich drin)
menu_names = {row[0] for row in MENU}
missing_excl = [nm for nm in USER_EXCLUDE if nm not in menu_names]
if missing_excl:
    print("ERROR: USER_EXCLUDE-Name(n) nicht im MENU (Tippfehler?):", missing_excl); raise SystemExit(1)

raw = {
    "_meta": {
        "source": "Pure 'All Menu Items' CSV (offiziell, User 12.07.2026) — data/Pure-AllMenuItems.csv",
        "note": "Nur Deliveroo-Karte. LIVE=Y bevorzugt. Soups=SECONDARY (Large). Salads mit Dressed/Undressed als 2 Items. Volle 8 Makros per Portion. Alle Allergen-Spalten 'Y' (=frei) -> kein Schalentier.",
        "excluded": ["Flat White (Getraenk — Drinks-Konvention: immer raus; CSV 107 kcal vs Deliveroo 144)"],
        "user_excluded": sorted(excluded) + ["Grund: CSV<->Deliveroo-kcal zu stark abweichend bzw. CSV intern inkonsistent (User 12.07.2026). Behalten: Salads mit Dressing-Wahl, Wraps, vernachlaessigbare (<5%)."],
        "deliveroo_kcal_diffs": [n for n in notes if "Deliveroo" in n],
        "other_notes": [n for n in notes if "Deliveroo" not in n],
    },
    "cats": CATS,
    "items": items,
}
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(raw, f, indent=1, ensure_ascii=False)
print(f"{len(items)} Items -> data/pure-raw.json")
for c in CATS:
    print(f"  {c['name']}: {sum(1 for x in items if x['cat']==c['id'])}" + ("" if c["on"] else "  (default AUS)"))
if excluded:
    print(f"\nUser-Ausschluss ({len(excluded)}): " + ", ".join(sorted(excluded)))
if notes:
    print("\nNotes:")
    for n in notes: print("  -", n)
