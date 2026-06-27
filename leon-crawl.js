// Crawlt leon.co → data/leon-raw.json: node leon-crawl.js
// Leon ist Next.js; ALLE Menü-Items inkl. Nährwerten stecken im __NEXT_DATA__ (props.initialReduxState.data.menuItems)
// JEDER Seite. Ein Fetch reicht (enthält alle menuTypes inkl. kids).
// UMFANG (User 20.06.2026): nur Produkte, die es auf der DELIVEROO-Bestellseite gibt → explizite Keep-Liste
// `DELIVEROO_KEEP` (leon.co-Name → Deliveroo-Anzeigename). leon.co-Namen weichen ab: "Big Box" vs "Big Rice Box",
// Wortreihenfolge ("Chicken Aioli" vs "Aioli Chicken"), Stückzahlen (Größen per kcal verifiziert). NICHTS von Deliveroo
// dazunehmen, was nicht in den leon.co-Daten steht. PLUS 3 Kids-Meals von leon.co/menu/kids (Kategorie "Kids' All Day", default AN).
// Nährwerte: nutritionInfo[{name,unit,amount}] → 8 Makros; Gesamtfett = max(Fat-Feld, sat+mono+poly) (Leons Fat-Feld
// ist bei manchen Items kaputt). In sich kaputte Items (kcal ≠ Makros) werden ausgeschlossen.
const fs = require("fs");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
const URL = "https://leon.co/menu/all-day/";

const num = v => { const f = parseFloat(v); return isNaN(f) ? 0 : Math.round(f * 100) / 100; };
const FIELD = {
  "Energy": "kcal", "Protein": "protein", "Carbohydrate": "carbs",
  "Carbs of which sugar": "sugars", "Fat": "fat", "Saturated fat": "sat",
  "Salt": "salt", "Fibre": "fibre",
};
function macros(nutritionInfo) {
  const o = { kcal: 0, fat: 0, sat: 0, carbs: 0, sugars: 0, fibre: 0, protein: 0, salt: 0 };
  let mono = 0, poly = 0, fatField = 0;
  for (const n of (nutritionInfo || [])) {
    if (typeof n.amount !== "number") continue;
    const f = FIELD[n.name];
    if (f) o[f] = num(n.amount);
    if (n.name === "Fat") fatField = num(n.amount);
    if (n.name === "Mono-unsaturated fat") mono = num(n.amount);
    if (n.name === "Poly-unsaturated fat") poly = num(n.amount);
  }
  o.fat = num(Math.max(fatField, o.sat + mono + poly)); // Fett-Fix: Leons Fat-Feld teils kaputt (truncated / mono+poly unpopuliert)
  return o;
}

// All-Day-Items auf der Deliveroo-Karte: leon.co-Name → Deliveroo-Anzeigename. Größen per kcal verifiziert.
const DELIVEROO_KEEP = {
  "Chicken & Chorizo Club Wrap": "Chicken & Chorizo Club Wrap",
  "Chicken Aioli Wrap": "Aioli Chicken Wrap",
  "Fish Finger Wrap": "The Fish Finger Wrap",
  "Grilled Halloumi Wrap": "Grilled Halloumi Wrap",
  "Crunchy Korean Chicken Wrap": "Crunchy Korean Chicken Wrap",
  "Chicken & Avocado Superfood Salad": "Chicken & Avocado Superfood Salad",
  "The Original Superfood Salad": "The Original Superfood Salad",
  "Aioli Chicken Big Box": "Aioli Chicken Big Rice Box",
  "Mushroom Magic Romesco Big Box": "Mushroom Magic Romesco Big Rice Box",
  "Mushroom Magic Aioli Big Box": "Mushroom Magic Aioli Big Rice Box",
  "Satay Chicken Big Box": "Satay Chicken Big Rice Box",
  "Salsa Verde Big Box": "Salsa Verde Chicken Big Rice Box",
  "Aioli Chicken": "Aioli Chicken Small Rice Box",
  "Satay Chicken": "Satay Chicken Small Rice Box",
  "Mushroom Magic Romesco": "Mushroom Magic Romesco Small Rice Box",
  "Brazilian Black Beans Small": "Brazilian Black Beans Small Rice Box",
  "Chargrilled Chicken Burger": "Chargrilled Chicken Burger",
  "LOVe Burger": "The LoVe Burger (VG)",
  "GFC - Crispy Chicken Nuggets": "GFC – Crispy Chicken Nuggets (5 pieces)",
  "GFC - Crispy Chicken Nuggets (10 pieces)": "GFC – Crispy Chicken Nuggets (10 pieces)",
  "Cheddar & Black Pepper Mac Bites": "Cheddar & Black Pepper Mac Bites (4 Pieces)",
  "Honey Sriracha GFC Chicken Nuggets": "Honey Sriracha GFC Chicken Nuggets (5 pieces)",
  "Baked Fries": "LEON Baked Fries",
};
// 3 Kids-Meals (menuType "kids", per Slug) → Anzeigename. Kategorie "Kids' All Day", default AN (User-Wunsch).
const KIDS_ADD = {
  "gfc-crispy-chicken-nuggets-baked-fries": "GFC – Crispy Chicken Nuggets & Baked Fries",
  "chargrilled-chicken-rice-box": "Chargrilled Chicken Rice Box",
  "brazilian-black-bean-with-rice": "Brazilian Black Beans with Rice",
};
const KIDS_CAT = { id: "kids-all-day", name: "Kids' All Day" };

(async () => {
  const r = await fetch(URL, { headers: { "User-Agent": UA } });
  if (!r.ok) { console.error("Fetch fehlgeschlagen:", r.status); process.exit(1); }
  const html = await r.text();
  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) { console.error("__NEXT_DATA__ nicht gefunden"); process.exit(1); }
  const mi = JSON.parse(m[1]).props.initialReduxState.data.menuItems;
  const isType = (it, slug) => it.menuType && it.menuType.slug && it.menuType.slug.current === slug;

  const cats = [], items = [], dropped = [];
  const pushItem = (it, displayName, catId, catName) => {
    const mac = macros(it.nutritionInfo);
    const est = 4 * mac.carbs + 4 * mac.protein + 9 * mac.fat, off = Math.abs(mac.kcal - est);
    if (!mac.kcal || (off > 60 && off / Math.max(mac.kcal, 1) > 0.25)) {
      dropped.push(displayName + " kcal " + mac.kcal + " vs Makros ~" + est.toFixed(0)); return;
    }
    if (!cats.find(c => c.id === catId)) cats.push({ id: catId, name: catName, on: true });
    items.push({ slug: it.slug, name: displayName, cat: catId, ...mac });
  };

  // All-Day: nur Deliveroo-Keep (mit Rename auf Deliveroo-Namen)
  for (const it of mi.filter(x => isType(x, "all-day"))) {
    const dn = DELIVEROO_KEEP[(it.name || "").trim()];
    if (!dn) continue;
    const sub = it.submenuType || {};
    pushItem(it, dn, sub.slug || "other", (sub.name || "Other").trim());
  }
  // Kids: die 3 gewünschten Meals
  for (const it of mi.filter(x => isType(x, "kids"))) {
    const dn = KIDS_ADD[it.slug];
    if (dn) pushItem(it, dn, KIDS_CAT.id, KIDS_CAT.name);
  }

  // Coverage-Check: jeder Keep-/Kids-Eintrag muss in der Quelle gefunden worden sein
  const gotNames = new Set(items.map(x => x.name));
  const missing = [...Object.values(DELIVEROO_KEEP), ...Object.values(KIDS_ADD)].filter(n => !gotNames.has(n));

  const out = {
    _meta: {
      source: "leon.co (__NEXT_DATA__ menuItems) · Stand " + new Date().toISOString().slice(0, 10),
      note: "Nur auf der Deliveroo-Bestellseite vorhandene Produkte (DELIVEROO_KEEP, Renames auf Deliveroo-Namen, Größen per kcal verifiziert) + 3 Kids-Meals (leon.co/menu/kids, Kategorie Kids' All Day default AN). Gesamtfett=max(Fat,sat+mono+poly). In sich kaputte Items (kcal≠Makros) ausgeschlossen. Sauces/Drinks/Coffee/Cookies/Cakes nicht modelliert.",
      crawler: "node leon-crawl.js",
      dropped, missing,
    },
    cats, items,
  };
  fs.writeFileSync(__dirname + "/data/leon-raw.json", JSON.stringify(out, null, 1), "utf8");
  console.log(items.length + " Items, " + cats.length + " Kategorien -> data/leon-raw.json");
  for (const c of cats) console.log("  " + c.name + ": " + items.filter(x => x.cat === c.id).length);
  if (dropped.length) console.log("\nAUSGESCHLOSSEN (kaputte Daten):\n  " + dropped.join("\n  "));
  if (missing.length) console.log("\n⚠ KEEP-Einträge NICHT in Quelle gefunden:\n  " + missing.join("\n  "));
})().catch(e => { console.error("ERR", e.message); process.exit(1); });
