# Extrahiert die Pizza-Express-Naehrwerte aus der offiziellen PDF -> data/pizzaexpress-raw.json
# Quelle: "PEX Nutritional Menu - June 26.pdf" (England/Wales/Scotland). Per-Portion-Makros (erste 9 Zahlen je Zeile:
# kcal, KJ, Fat, Saturates, Carbs, Sugars, Fibre, Protein, Salt) -> wir nehmen kcal/fat/sat/carbs/sugars/fibre/protein/salt.
# Aufruf: py -3 pizzaexpress-extract.py "<pfad zur pdf>"
import sys, re, json
import pdfplumber

import os
PDF = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "PizzaExpress-Nutritional-June2026.pdf")
# Seite -> (Kategorie-ID, Kategorie-Name)
PAGE_CAT = {
    3: ("doughballs", "Dough Balls"), 4: ("starters", "Starters"),
    5: ("sides", "Sides"),
    6: ("classic", "Pizzas - Classic"), 7: ("classic", "Pizzas - Classic"),
    8: ("romana", "Pizzas - Romana"), 9: ("romana", "Pizzas - Romana"),
    10: ("large_classic", "Pizzas - Large Classic"),
    11: ("leggera_alforno", "Leggera & Al Forno"),
    12: ("salads", "Salads"),
    15: ("desserts", "Desserts"),
}
NUM = re.compile(r"^-?\d+(?:\.\d+)?$")
SKIP = ("PER PORTION", "PER 100g", "Energy", "(kcal)", "(g)", "(KJ)")

def clean(name):
    name = "".join(c if ord(c) < 128 else "-" for c in name)  # Mojibake/Non-ASCII -> '-'
    name = name.replace("Ni-oise", "Nicoise")
    name = re.sub(r"\s+", " ", name).strip()
    return name

def parse_page(page, cat):
    items = []
    pending = ""  # umbrochene Namens-Zeile (Zahlen erst in der naechsten Zeile)
    for line in (page.extract_text() or "").split("\n"):
        s = line.strip()
        if not s or any(k in s for k in SKIP):
            pending = ""
            continue
        toks = s.split()
        # trailing run of numeric tokens
        run = []
        i = len(toks) - 1
        while i >= 0 and NUM.match(toks[i]):
            run.insert(0, float(toks[i])); i -= 1
        namepart = " ".join(toks[:i+1])
        if len(run) < 9:
            # reine Namens-Zeile -> als Praefix fuer die naechste Datenzeile merken
            pending = (pending + " " + s).strip() if pending else s
            continue
        name = clean((pending + " " + namepart).strip() if pending else namepart)
        pending = ""
        if not name:
            continue
        # per portion = erste 9: [kcal, KJ, fat, sat, carbs, sugars, fibre, protein, salt]
        pp = run[:9]
        item = {"name": name, "cat": cat,
                "kcal": pp[0], "fat": pp[2], "sat": pp[3], "carbs": pp[4],
                "sugars": pp[5], "fibre": pp[6], "protein": pp[7], "salt": pp[8],
                "_n": len(run)}
        items.append(item)
    return items

pdf = pdfplumber.open(PDF)
items, report = [], []
for pg, (cid, cname) in PAGE_CAT.items():
    rows = parse_page(pdf.pages[pg-1], cid)
    items += rows
    odd = [r["name"] for r in rows if r["_n"] != 18]
    report.append(f"P{pg} {cid}: {len(rows)} rows" + (f"  ! non-18-num: {odd}" if odd else ""))

# kcal-Plausibilitaet (est = 4*carb + 4*protein + 9*fat); Ballaststoffe ~2 kcal/g ignoriert -> grosszuegige Toleranz
flags = []
for r in items:
    est = 4*r["carbs"] + 4*r["protein"] + 9*r["fat"]
    if abs(r["kcal"] - est) > 60 and abs(r["kcal"]-est)/max(r["kcal"],1) > 0.15:
        flags.append(f'{r["name"]} [{r["cat"]}]: kcal {r["kcal"]} vs ~{est:.0f}')

cats_seen = []
for cid, cname in PAGE_CAT.values():
    if cid not in [c[0] for c in cats_seen]:
        cats_seen.append((cid, cname))
out = {"_meta": {"source": "PEX Nutritional Menu - June 26.pdf (England/Wales/Scotland) - per-portion macros",
                 "extractor": "py -3 pizzaexpress-extract.py"},
       "cats": [{"id": c, "name": n, "on": True} for c, n in cats_seen],
       "items": [{k: v for k, v in r.items() if k != "_n"} for r in items]}

import os
dst = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "pizzaexpress-raw.json")
with open(dst, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)

print("\n".join(report))
print("\nTotal items:", len(items))
print("\nkcal-Plausibilitaet Flags (" + str(len(flags)) + "):")
print("\n".join(flags) if flags else "  alle plausibel")
print("\n-> data/pizzaexpress-raw.json")
