# Extrahiert die Wasabi-Naehrwerte aus WAS_Nutritional_Guide -> data/wasabi-raw.json
# Wasabis Tabelle ist PER 100g (ausser kcal, die per Portion steht). Per-Portion-Makros = per-100g x portion/100.
# Robust ueber pdfplumber.extract_tables() + Header-Spalten-Mapping (Spaltenzahl variiert je Seite). KEINE Ballaststoffe -> fibre=0.
# Aufruf: py -3 wasabi-extract.py "<pfad>.pdf"
import sys, re, json, os
import pdfplumber

PDF = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "Wasabi-Nutritional-Guide.pdf")
PAGE_CAT = {}
for p in range(4, 9): PAGE_CAT[p] = ("sushi", "Sushi")
for p in range(9, 12): PAGE_CAT[p] = ("salads", "Salads")
PAGE_CAT[12] = ("cold_sides", "Cold Sides")
PAGE_CAT[13] = ("soup", "Soup")
# Bento: Seite 14 BEWUSST ausgelassen — sie ist eine redundante "standard+large"-Tabelle (20 Spalten) mit
# LEEREM Sat-Fat-Header (-> sat=0) und listet exakt dieselben 13 Gerichte wie die sauberen Einzelportions-
# Tabellen auf S.19/20 (dort korrektes Sat-Fat + 2 zusaetzliche Gerichte). S.15-20 decken alle Bento ab.
for p in range(15, 21): PAGE_CAT[p] = ("bento", "Bento")
for p in range(21, 23): PAGE_CAT[p] = ("breakfast", "Breakfast")
for p in range(23, 25): PAGE_CAT[p] = ("sides", "Sides")
for p in range(28, 30): PAGE_CAT[p] = ("sauces", "Sauces & Dressings")
# 25-27 = hot beverages (Getraenke) -> ausgeschlossen

NUM = re.compile(r"^-?\d+(?:\.\d+)?$")
def n(x):
    x = (x or "").strip().replace(",", "")
    return float(x) if NUM.match(x) else None
def clean(s):
    s = "".join(c if ord(c) < 128 else " " for c in (s or ""))
    return re.sub(r"\s+", " ", s).strip()

def col_map(hdr):
    H = [clean(h).lower() for h in hdr]
    def find(pred, first=True):
        idxs = [i for i, h in enumerate(H) if pred(h)]
        return (idxs[0] if idxs else None) if first else idxs
    m = {
        "kcal100": find(lambda h: "kcal" in h and "100g" in h),
        "kcalport": find(lambda h: "kcal" in h and ("port" in h or "pack" in h)),
        "protein": find(lambda h: "protein" in h),
        "carb": find(lambda h: "carboh" in h),
        "sugar": find(lambda h: "sugar" in h),
        "sat": find(lambda h: "sat fat" in h or ("sat" in h and "fat" in h)),
        "salt": find(lambda h: "salt" in h),
        "portion": find(lambda h: "portion size" in h),
    }
    m["fat"] = find(lambda h: "fat" in h and "sat" not in h)
    return m

def parse_table(t, cat):
    if not t or len(t) < 2: return []
    hdr = t[0]
    m = col_map(hdr)
    if m["kcal100"] is None or m["protein"] is None or m["portion"] is None: return []
    # Tripwire: eine echte Daten-Tabelle, bei der eine Pflicht-Makrospalte nicht gemappt wurde
    # (z.B. leerer Header wie auf der ausgelassenen Bento-Seite 14) -> warnen statt still sat=0 zu schreiben
    miss = [k for k in ("fat", "sat", "carb", "sugar", "salt") if m[k] is None]
    if miss and len(t) >= 2:
        print(f"[WARN] {cat}: ungemappte Spalten {miss} auf einer Daten-Tabelle (leerer Header?) — Layout pruefen", file=sys.stderr)
    name_end = m["kcal100"]  # erste Zahlenspalte = per-100g-kcal; davor stehen die Namensspalten
    items = []
    for row in t[1:]:
        if name_end >= len(row): continue
        names = [clean(row[i]) for i in range(name_end) if i < len(row) and clean(row[i])]
        if not names: continue
        name = names[0] + (" (" + ", ".join(names[1:]) + ")" if len(names) > 1 else "")
        if "platter" in name.lower(): continue  # Sharing-Platters (per-pack-kcal != per-serving-Portion) -> raus
        # Plausibilitaet der ROH-per-100g-Werte (faengt PDF-Glitches wie Protein=1388 ab)
        p100 = n(row[m["protein"]]) if m["protein"] < len(row) else 0
        c100 = n(row[m["carb"]]) if m["carb"] < len(row) else 0
        f100 = n(row[m["fat"]]) if (m["fat"] is not None and m["fat"] < len(row)) else 0
        if (p100 or 0) > 80 or (c100 or 0) > 100 or (f100 or 0) > 80: continue
        port = n(row[m["portion"]]) if m["portion"] < len(row) else None
        if not port: continue
        sc = port / 100.0
        kcal = n(row[m["kcalport"]]) if (m["kcalport"] is not None and m["kcalport"] < len(row)) else None
        k100 = n(row[m["kcal100"]])
        if kcal is None and k100 is not None: kcal = round(k100 * sc)
        if kcal is None: continue
        def g(key):
            i = m[key]; v = n(row[i]) if (i is not None and i < len(row)) else None
            return round((v or 0) * sc, 2)
        items.append({"name": name, "cat": cat, "kcal": round(kcal, 2),
            "fat": g("fat"), "sat": g("sat"), "carbs": g("carb"), "sugars": g("sugar"),
            "fibre": 0.0, "protein": g("protein"), "salt": g("salt"), "_port": port})
    return items

pdf = pdfplumber.open(PDF)
items, report, seen = [], [], []
for pg, (cid, cname) in PAGE_CAT.items():
    rows = []
    for t in pdf.pages[pg-1].extract_tables():
        rows += parse_table(t, cid)
    items += rows
    report.append(f"P{pg} {cid}: {len(rows)}")
    if cid not in [c[0] for c in seen]: seen.append((cid, cname))

# Duplikat-Namen (z.B. gleicher Name auf 2 Seiten) zulassen; nur exakte Voll-Duplikate (Name+kcal) entfernen
uniq, key = [], set()
for it in items:
    k = (it["name"], it["kcal"], it["cat"])
    if k in key: continue
    key.add(k); uniq.append(it)
items = uniq

flags = []
for it in items:
    est = 4*it["carbs"] + 4*it["protein"] + 9*it["fat"]
    if abs(it["kcal"] - est) > 50 and abs(it["kcal"]-est)/max(it["kcal"], 1) > 0.20:
        flags.append(f'{it["name"]} [{it["cat"]}] kcal {it["kcal"]} vs ~{est:.0f} (port {it["_port"]})')

out = {"_meta": {"source": "WAS_Nutritional_Guide (Wasabi UK). Tabelle per-100g -> per-Portion skaliert (x portion/100); kcal per Portion direkt (sonst aus per-100g abgeleitet). KEINE Ballaststoffe -> fibre=0. Getraenke (hot beverages, S.25-27) ausgeschlossen.",
                 "extractor": "py -3 wasabi-extract.py"},
       "cats": [{"id": c, "name": nm, "on": True} for c, nm in seen],
       "items": [{k: v for k, v in it.items() if not k.startswith("_")} for it in items]}
with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "wasabi-raw.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)

print("\n".join(report))
print("\nTotal:", len(items), "| cats:", len(seen))
print("kcal flags (" + str(len(flags)) + "):"); print("\n".join(flags[:30]) if flags else "  alle plausibel")
print("sashimi:", [it["name"] for it in items if "sashimi" in it["name"].lower()])
print("soup items:", [it["name"] for it in items if it["cat"] == "soup"])
print("-> data/wasabi-raw.json")
