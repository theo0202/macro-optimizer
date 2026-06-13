// Generiert den ITSU-Datenblock in index.html aus data/itsu-raw.json: node itsu-update.js
// Kompletter Refresh: node itsu-crawl.js && node itsu-update.js
const fs = require("fs");

const raw = JSON.parse(fs.readFileSync(__dirname + "/data/itsu-raw.json", "utf8"));

const slug = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
const DEFAULT_ON = new Set(["healthy_soups", "gyoza_bao", "rice_bowls", "hot_noodles", "sushi_poke"]);
const DRINK_CATS = new Set(["cold_drinks", "hot_iced_drinks"]); // Getränke: in der App IMMER vom Optimizer ausgeschlossen

const cats = raw.categories.map(c => {
  const name = c.trim();
  return { id: slug(name), name, on: DEFAULT_ON.has(slug(name)), drink: DRINK_CATS.has(slug(name)) };
});
const catOrder = new Map(cats.map((c, i) => [c.id, i]));

const num = v => { const f = parseFloat(v); return isNaN(f) ? 0 : Math.round(f * 100) / 100; };
const usedIds = new Set();

const items = raw.items.map(it => {
  let id = slug(it.url.split("/").filter(Boolean).pop());
  while (usedIds.has(id)) id += "_2";
  usedIds.add(id);
  return {
    id, name: it.name.trim(), cat: slug(it.categories[0].trim()),
    kcal: num(it.calories), fat: num(it.fat), sat: num(it.fat_saturated),
    carbs: num(it.carbs), sugars: num(it.sugars), fibre: num(it.fibre),
    protein: num(it.protein), salt: num(it.salt),
  };
}).sort((a, b) => (catOrder.get(a.cat) - catOrder.get(b.cat)) || a.name.localeCompare(b.name));

const q = JSON.stringify;
const lines = [];
lines.push("// __ITSU_DATA_START__ (generiert via: node itsu-crawl.js && node itsu-update.js — nicht von Hand editieren)");
lines.push("// Quelle: itsu.com · Stand " + raw._meta.crawled + " · " + items.length + " Items");
lines.push("const ITSU = {");
lines.push("  cats: [");
for (const c of cats) lines.push(`    { id:${q(c.id)},name:${q(c.name)},on:${c.on}${c.drink ? ",drink:true" : ""} },`);
lines.push("  ],");
lines.push("  items: [");
for (const x of items)
  lines.push(`    { id:${q(x.id)},name:${q(x.name)},cat:${q(x.cat)},kcal:${x.kcal},fat:${x.fat},sat:${x.sat},carbs:${x.carbs},sugars:${x.sugars},fibre:${x.fibre},protein:${x.protein},salt:${x.salt} },`);
lines.push("  ],");
lines.push("};");
lines.push("// __ITSU_DATA_END__");
const block = lines.join("\n");

const file = __dirname + "/index.html";
const html = fs.readFileSync(file, "utf8");
const re = /\/\/ __ITSU_DATA_START__[\s\S]*?\/\/ __ITSU_DATA_END__/;
if (!re.test(html)) { console.error("ITSU-Marker in index.html nicht gefunden"); process.exit(1); }
fs.writeFileSync(file, html.replace(re, block), "utf8");

console.log(cats.length + " Kategorien, " + items.length + " Items -> index.html (ITSU-Block)");
for (const c of cats) console.log(`  ${c.on ? "[an] " : "[aus]"} ${c.name}: ${items.filter(x => x.cat === c.id).length}`);
