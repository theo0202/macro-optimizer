// Crawlt leon.co (All-Day-Menü) → data/leon-raw.json: node leon-crawl.js
// Leon ist eine Next.js-Seite; ALLE Menü-Items inkl. Nährwerten stecken im __NEXT_DATA__
// (props.initialReduxState.data.menuItems) JEDER Seite. Ein Fetch der All-Day-Menüseite reicht.
// Nährwerte als nutritionInfo:[{name,unit,amount}] → gemappt auf kcal/fat/sat/carbs/sugars/fibre/protein/salt.
// Umfang: nur menuType "all-day"; Kategorie "Sauces" ausgeschlossen (User-Vorgabe).
const fs = require("fs");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
const URL = "https://leon.co/menu/all-day/";

const num = v => { const f = parseFloat(v); return isNaN(f) ? 0 : Math.round(f * 100) / 100; };
// nutritionInfo-Name → unser Feld
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
  // Leons "Fat"-Feld ist bei einigen Items fehlerhaft zu niedrig (teils < gesättigtem Fett!).
  // Gesamtfett = max(Fat-Feld, sat+mono+poly) — bei korrekten Items sind beide gleich, bei kaputten korrigiert es.
  o.fat = num(Math.max(fatField, o.sat + mono + poly));
  return o;
}

(async () => {
  const r = await fetch(URL, { headers: { "User-Agent": UA } });
  if (!r.ok) { console.error("Fetch fehlgeschlagen:", r.status); process.exit(1); }
  const html = await r.text();
  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) { console.error("__NEXT_DATA__ nicht gefunden"); process.exit(1); }
  const data = JSON.parse(m[1]).props.initialReduxState.data;
  const allDay = data.menuItems.filter(it => it.menuType && it.menuType.slug && it.menuType.slug.current === "all-day");

  const EXCLUDE_SUB = new Set(["sauces"]); // User: Sauces ignorieren
  const KIDS_SUB = new Set(["kids-all-day"]); // Kids-Kategorie default AUS (Projekt-Konvention)

  const cats = [];     // Reihenfolge = erstes Vorkommen
  const items = [];
  const dropped = [];
  for (const it of allDay) {
    const sub = it.submenuType || {};
    const subId = sub.slug || "other";
    const subName = (sub.name || "Other").trim();
    if (EXCLUDE_SUB.has(subId)) continue;
    const mac = macros(it.nutritionInfo);
    // Plausibilität: kcal muss ungefähr zu 4·C+4·P+9·F passen. Items, deren Leon-Daten in sich kaputt sind
    // (kcal nicht aus den Makros rekonstruierbar, selbst nach Fett-Korrektur) → ausschließen statt falsch einspeisen.
    const est = 4 * mac.carbs + 4 * mac.protein + 9 * mac.fat;
    const off = Math.abs(mac.kcal - est);
    if (!mac.kcal || (off > 60 && off / Math.max(mac.kcal, 1) > 0.25)) {
      dropped.push(it.name + " [" + subName + "] kcal " + mac.kcal + " vs Makros ~" + est.toFixed(0));
      continue;
    }
    if (!cats.find(c => c.id === subId)) cats.push({ id: subId, name: subName, on: !KIDS_SUB.has(subId) });
    items.push({ slug: it.slug, name: (it.name || "").trim(), cat: subId, ...mac });
  }

  const out = {
    _meta: {
      source: "leon.co/menu/all-day/ (__NEXT_DATA__ initialReduxState.data.menuItems) · Stand " + new Date().toISOString().slice(0, 10),
      note: "Nur menuType all-day; Kategorie Sauces ausgeschlossen. nutritionInfo→8 Makros (Energy/Protein/Carbohydrate/Carbs of which sugar/Fat/Saturated fat/Salt/Fibre). Gesamtfett=max(Fat-Feld, sat+mono+poly) wegen fehlerhaftem Fat-Feld bei manchen Items. Mono/Poly/GI/Portionsgewicht sonst ignoriert. Items mit in sich kaputten Leon-Daten (kcal≠Makros) ausgeschlossen.",
      crawler: "node leon-crawl.js",
      dropped,
    },
    cats, items,
  };
  fs.writeFileSync(__dirname + "/data/leon-raw.json", JSON.stringify(out, null, 1), "utf8");
  console.log(items.length + " Items, " + cats.length + " Kategorien -> data/leon-raw.json");
  for (const c of cats) console.log("  " + c.name + (c.on ? "" : " (default AUS)") + ": " + items.filter(x => x.cat === c.id).length);
  if (dropped.length) console.log("\nAUSGESCHLOSSEN (kaputte Leon-Daten, " + dropped.length + "):\n  " + dropped.join("\n  "));
})().catch(e => { console.error("ERR", e.message); process.exit(1); });
