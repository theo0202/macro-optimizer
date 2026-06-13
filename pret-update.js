// Generiert den PRET-Datenblock in index.html aus data/pret-raw.json: node pret-update.js
// Kompletter Refresh: node pret-crawl.js && node pret-update.js
const fs = require("fs");

const raw = JSON.parse(fs.readFileSync(__dirname + "/data/pret-raw.json", "utf8"));

const slug = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
const norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, " ").trim();

// Kategorien, die in die App kommen (Bundles + Catering-Platters bleiben draußen)
const APP_CATS = ["Bakery", "Breakfast baguettes", "Sandwiches", "Baguettes", "Wraps and flatbreads",
  "Rye rolls", "Salads and protein pots", "Little Pret Stars", "Fruit", "Sweet pots",
  "Sweet treats", "Snacks", "Cold drinks"];
const DEFAULT_ON = new Set(["sandwiches", "baguettes", "wraps_and_flatbreads", "rye_rolls",
  "salads_and_protein_pots", "little_pret_stars", "fruit", "sweet_pots"]);
const DRINK_CATS = new Set(["cold_drinks"]); // Getränke: in der App IMMER vom Optimizer ausgeschlossen

// Schalter "only relevant items, no bullshit": diese Kategorien komplett ...
const REL_CATS = new Set(["sandwiches", "baguettes", "wraps_and_flatbreads", "salads_and_protein_pots", "little_pret_stars"]);
// ... plus diese Einzel-Items aus Rye rolls / Fruit / Sweet pots
const REL_NAMES = new Set([
  "Falafel, Avo & Slaw Rye Roll", "New Yorker Rye Roll", "Scandi Style Salmon Rye Roll", "Scottish Smoked Salmon & Dill Rye Roll",
  "Super Fruit", "Fruit Salad",
  "Bircher Muesli", "Blueberry Balance Bowl", "Five Berry Bowl", "The Big Apple Bowl",
].map(norm));

const cats = APP_CATS.map(name => ({ id: slug(name), name, on: DEFAULT_ON.has(slug(name)), drink: DRINK_CATS.has(slug(name)) }));
const catOrder = new Map(cats.map((c, i) => [c.id, i]));
const appCatSet = new Set(APP_CATS);

const num = v => { const f = parseFloat(v); return isNaN(f) ? 0 : Math.round(f * 100) / 100; };
const usedIds = new Set();
const matchedNames = new Set();

const items = raw.items
  .filter(it => it.kcal != null && it.categories.some(c => appCatSet.has(c)))
  .map(it => {
    const catName = it.categories.find(c => appCatSet.has(c));
    let id = slug(it.name);
    while (usedIds.has(id)) id += "_2";
    usedIds.add(id);
    const cat = slug(catName);
    const rel = REL_CATS.has(cat) || REL_NAMES.has(norm(it.name));
    if (REL_NAMES.has(norm(it.name))) matchedNames.add(norm(it.name));
    return {
      id, name: it.name, cat, rel,
      kcal: num(it.kcal), fat: num(it.fat), sat: num(it.sat), carbs: num(it.carbs),
      sugars: num(it.sugars), fibre: num(it.fibre), protein: num(it.protein), salt: num(it.salt),
    };
  })
  .sort((a, b) => (catOrder.get(a.cat) - catOrder.get(b.cat)) || a.name.localeCompare(b.name));

const q = JSON.stringify;
const lines = [];
lines.push("// __PRET_DATA_START__ (generiert via: node pret-crawl.js && node pret-update.js — nicht von Hand editieren)");
lines.push("// Quelle: pret.co.uk Delivery-Menü · Stand " + raw._meta.crawled + " · " + items.length + " Items · rel = 'only relevant items, no bullshit'-Whitelist");
lines.push("const PRET = {");
lines.push("  cats: [");
for (const c of cats) lines.push(`    { id:${q(c.id)},name:${q(c.name)},on:${c.on}${c.drink ? ",drink:true" : ""} },`);
lines.push("  ],");
lines.push("  items: [");
for (const x of items)
  lines.push(`    { id:${q(x.id)},name:${q(x.name)},cat:${q(x.cat)}${x.rel ? ",rel:true" : ""},kcal:${x.kcal},fat:${x.fat},sat:${x.sat},carbs:${x.carbs},sugars:${x.sugars},fibre:${x.fibre},protein:${x.protein},salt:${x.salt} },`);
lines.push("  ],");
lines.push("};");
lines.push("// __PRET_DATA_END__");
const block = lines.join("\n");

const file = __dirname + "/index.html";
const html = fs.readFileSync(file, "utf8");
const re = /\/\/ __PRET_DATA_START__[\s\S]*?\/\/ __PRET_DATA_END__/;
if (!re.test(html)) { console.error("PRET-Marker in index.html nicht gefunden"); process.exit(1); }
fs.writeFileSync(file, html.replace(re, block), "utf8");

console.log(cats.length + " Kategorien, " + items.length + " Items (" + items.filter(x => x.rel).length + " relevant) -> index.html (PRET-Block)");
for (const c of cats) {
  const sub = items.filter(x => x.cat === c.id);
  console.log(`  ${c.on ? "[an] " : "[aus]"}${c.drink ? "[drink]" : ""} ${c.name}: ${sub.length} (davon relevant: ${sub.filter(x => x.rel).length})`);
}
const unmatched = [...REL_NAMES].filter(n => !matchedNames.has(n));
if (unmatched.length) console.log("WARNUNG — Whitelist-Namen ohne Treffer: " + unmatched.join(" | "));
