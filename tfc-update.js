// Generiert den TFC-Datenblock (The Fitness Chef) in index.html aus data/tfc-raw.json: node tfc-update.js
// Workflow: User liefert Nährwerte als Copy-Paste -> data/tfc-raw.json -> dieses Skript.
// Besonderheit: Dishes kommen in 3 Größen (size wl/ml/wg) -> je eigenes Item, Name bekommt das Größen-Suffix.
//   Der à-la-carte-Optimizer (AC-Alias) wählt automatisch die passende Größe fürs Makroziel.
// Sodium ist in der Quelle in mg -> hier salt(g) = sodium(mg) * 2.5 / 1000 (UK-Konvention).
const fs = require("fs");

const raw = JSON.parse(fs.readFileSync(__dirname + "/data/tfc-raw.json", "utf8"));

const slug = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
const num = v => { const f = parseFloat(v); return isNaN(f) ? 0 : Math.round(f * 100) / 100; };

const SIZE_LABEL = { wl: "Weight Loss", ml: "Maintain/Lean", wg: "Weight Gain" };
const CAT_NAMES = { meat_dishes: "Meat Dishes", fish_dishes: "Fish Dishes", pasta_dishes: "Pasta", sides: "Sides" };

// Kategorien in Reihenfolge des ersten Auftretens
const catIds = [];
for (const it of raw.items) if (!catIds.includes(it.cat)) catIds.push(it.cat);
const cats = catIds.map(id => ({ id, name: CAT_NAMES[id] || id, on: true }));

const usedIds = new Set();
const items = raw.items.map(it => {
  const name = it.size ? `${it.name.trim()} (${SIZE_LABEL[it.size]})` : it.name.trim();
  let id = slug(name);
  while (usedIds.has(id)) id += "_2";
  usedIds.add(id);
  const salt = it.sodium != null ? Math.round((it.sodium * 2.5 / 1000) * 100) / 100 : 0;
  // Fisch-Flag (Schalter "No fish"): ganze fish_dishes-Kategorie ODER Name enthält salmon/tuna (z.B. Pasta)
  const fish = it.cat === "fish_dishes" || /salmon|tuna/i.test(name);
  return {
    id, name, cat: it.cat, size: it.size || null, fish,
    kcal: num(it.kcal), fat: num(it.fat), sat: num(it.sat), carbs: num(it.carbs),
    sugars: num(it.sugars), fibre: num(it.fibre), protein: num(it.protein), salt,
  };
});

const q = JSON.stringify;
const lines = [];
lines.push("// __TFC_DATA_START__ (generiert via: node tfc-update.js aus data/tfc-raw.json — nicht von Hand editieren)");
lines.push("// Quelle: The Fitness Chef offizielle Produktseiten (Copy-Paste vom User) · Stand " + raw._meta.updated +
  " · " + items.length + " Items · Dishes in 3 Größen (size wl/ml/wg), Optimizer wählt die passende · salt aus sodium(mg)*2.5/1000");
lines.push("const TFC = {");
lines.push("  cats: [");
for (const c of cats) lines.push(`    { id:${q(c.id)},name:${q(c.name)},on:${c.on} },`);
lines.push("  ],");
lines.push("  items: [");
for (const x of items)
  lines.push(`    { id:${q(x.id)},name:${q(x.name)},cat:${q(x.cat)}${x.size ? `,size:${q(x.size)}` : ""}${x.fish ? ",fish:true" : ""},kcal:${x.kcal},fat:${x.fat},sat:${x.sat},carbs:${x.carbs},sugars:${x.sugars},fibre:${x.fibre},protein:${x.protein},salt:${x.salt} },`);
lines.push("  ],");
lines.push("};");
lines.push("// __TFC_DATA_END__");
const block = lines.join("\n");

const file = __dirname + "/index.html";
const html = fs.readFileSync(file, "utf8");
const re = /\/\/ __TFC_DATA_START__[\s\S]*?\/\/ __TFC_DATA_END__/;
if (!re.test(html)) { console.error("TFC-Marker in index.html nicht gefunden — erst Platzhalter einsetzen"); process.exit(1); }
fs.writeFileSync(file, html.replace(re, block), "utf8");

console.log(items.length + " Items -> index.html (TFC-Block)");
for (const c of cats) {
  const g = items.filter(x => x.cat === c.id);
  console.log(`  ${c.name}: ${g.length}` + (g.some(x => x.size) ? ` (${g.filter(x=>x.size==="wl").length}× wl / ${g.filter(x=>x.size==="ml").length}× ml / ${g.filter(x=>x.size==="wg").length}× wg)` : ""));
}
