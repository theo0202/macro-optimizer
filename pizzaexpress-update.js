// Generiert den PIZZAEXPRESS-Block in index.html aus data/pizzaexpress-raw.json: node pizzaexpress-update.js
// Quelle: offizielle PizzaExpress-Naehrwert-PDF (England/Wales/Scotland, Juni 2026), extrahiert via pizzaexpress-extract.py.
// À-la-carte (AC-Familie wie Itsu/Pret/TFC): cats + items, volle 8 Makros per Portion. KEINE Build-Your-Own-Add-ons.
const fs = require("fs");
const raw = JSON.parse(fs.readFileSync(__dirname + "/data/pizzaexpress-raw.json", "utf8"));

const slug = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
const num = v => { const f = parseFloat(v); return isNaN(f) ? 0 : Math.round(f * 100) / 100; };
const used = new Set();
const mkId = n => { let id = slug(n) || "item"; while (used.has(id)) id += "_2"; used.add(id); return id; };
const macStr = x => `kcal:${x.kcal},fat:${x.fat},sat:${x.sat},carbs:${x.carbs},sugars:${x.sugars},fibre:${x.fibre},protein:${x.protein},salt:${x.salt}`;
const q = JSON.stringify;

const items = raw.items.map(it => ({
  id: mkId(it.name), name: it.name.trim(), cat: it.cat,
  kcal: num(it.kcal), fat: num(it.fat), sat: num(it.sat), carbs: num(it.carbs),
  sugars: num(it.sugars), fibre: num(it.fibre), protein: num(it.protein), salt: num(it.salt),
}));

const lines = [];
lines.push("// __PIZZAEXPRESS_DATA_START__ (generiert via: node pizzaexpress-update.js aus data/pizzaexpress-raw.json — nicht von Hand editieren)");
lines.push("// Quelle: offizielle PizzaExpress-Naehrwert-PDF (England/Wales/Scotland) · Juni 2026 · " + items.length +
  " Items · per-Portion, volle 8 Makros. À la carte (AC-Alias). GF/Vegan/Dine-Out-Varianten sind eigene Items.");
lines.push("const PIZZAEXPRESS = {");
lines.push("  cats: [");
for (const c of raw.cats) lines.push(`    { id:${q(c.id)},name:${q(c.name)},on:${c.on !== false} },`);
lines.push("  ],");
lines.push("  items: [");
for (const x of items) lines.push(`    { id:${q(x.id)},name:${q(x.name)},cat:${q(x.cat)},${macStr(x)} },`);
lines.push("  ],");
lines.push("};");
lines.push("// __PIZZAEXPRESS_DATA_END__");
const block = lines.join("\n");

const file = __dirname + "/index.html";
const html = fs.readFileSync(file, "utf8");
const re = /\/\/ __PIZZAEXPRESS_DATA_START__[\s\S]*?\/\/ __PIZZAEXPRESS_DATA_END__/;
if (!re.test(html)) { console.error("PIZZAEXPRESS-Marker in index.html nicht gefunden — erst Platzhalter einsetzen"); process.exit(1); }
fs.writeFileSync(file, html.replace(re, block), "utf8");

console.log(items.length + " Items -> index.html (PIZZAEXPRESS-Block)");
for (const c of raw.cats) console.log(`  ${c.name}: ${items.filter(x => x.cat === c.id).length}`);
