// Generiert den WAGAMAMA-Datenblock in index.html aus data/wagamama-raw.json: node wagamama-update.js
// Workflow: User liefert Screenshots in 5er-Batches → Items in data/wagamama-raw.json ergänzen → dieses Skript laufen lassen.
// Kategorien entstehen automatisch aus den cat-Feldern der Items (Reihenfolge: erstes Vorkommen).
const fs = require("fs");

const raw = JSON.parse(fs.readFileSync(__dirname + "/data/wagamama-raw.json", "utf8"));

const slug = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

const catNames = [];
for (const it of raw.items) if (!catNames.includes(it.cat)) catNames.push(it.cat);
const cats = catNames.map(name => ({ id: slug(name), name, on: true }));

const num = v => { const f = parseFloat(v); return isNaN(f) ? 0 : Math.round(f * 100) / 100; };
const usedIds = new Set();
const items = raw.items.map(it => {
  let id = slug(it.name);
  while (usedIds.has(id)) id += "_2";
  usedIds.add(id);
  return {
    id, name: it.name.trim(), cat: slug(it.cat),
    kcal: num(it.kcal), fat: num(it.fat), sat: num(it.sat), carbs: num(it.carbs),
    sugars: num(it.sugars), fibre: num(it.fibre), protein: num(it.protein), salt: num(it.salt),
  };
});

const q = JSON.stringify;
const lines = [];
lines.push("// __WAGAMAMA_DATA_START__ (generiert via: node wagamama-update.js aus data/wagamama-raw.json — nicht von Hand editieren)");
lines.push("// Quelle: wagamama.com Produkt-Popups (Screenshots vom User, Batch-Workflow) · Stand " + raw._meta.updated + " · " + items.length + " Items");
lines.push("const WAGA = {");
lines.push("  cats: [");
for (const c of cats) lines.push(`    { id:${q(c.id)},name:${q(c.name)},on:${c.on} },`);
lines.push("  ],");
lines.push("  items: [");
for (const x of items)
  lines.push(`    { id:${q(x.id)},name:${q(x.name)},cat:${q(x.cat)},kcal:${x.kcal},fat:${x.fat},sat:${x.sat},carbs:${x.carbs},sugars:${x.sugars},fibre:${x.fibre},protein:${x.protein},salt:${x.salt} },`);
lines.push("  ],");
lines.push("};");
lines.push("// __WAGAMAMA_DATA_END__");
const block = lines.join("\n");

const file = __dirname + "/index.html";
const html = fs.readFileSync(file, "utf8");
const re = /\/\/ __WAGAMAMA_DATA_START__[\s\S]*?\/\/ __WAGAMAMA_DATA_END__/;
if (!re.test(html)) { console.error("WAGAMAMA-Marker in index.html nicht gefunden"); process.exit(1); }
fs.writeFileSync(file, html.replace(re, block), "utf8");

console.log(cats.length + " Kategorien, " + items.length + " Items -> index.html (WAGAMAMA-Block)");
for (const c of cats) console.log(`  ${c.name}: ${items.filter(x => x.cat === c.id).length}`);
