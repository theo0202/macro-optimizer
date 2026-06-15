// Generiert den PEPES-Block (Pepe's Piri Piri) in index.html aus data/pepes-raw.json: node pepes-update.js
// Pepe's hat KEINE Ballaststoff-Spalte -> fibre=0 überall. Flavour-Modell: Items mit flavourMl>0 bekommen eine
// Pflicht-Flavour (global gewählt); deren Makros = per-10ml-Wert × flavourMl/10, im Optimizer additiv zur Basis.
const fs = require("fs");
const raw = JSON.parse(fs.readFileSync(__dirname + "/data/pepes-raw.json", "utf8"));

const slug = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
const num = v => { const f = parseFloat(v); return isNaN(f) ? 0 : Math.round(f * 100) / 100; };
const CAT_NAMES = { chicken: "Chicken", burgers: "Burgers", paneer: "Paneer (veg)", sides: "Sides", sauces: "Sauces" };

// Kategorien in Reihenfolge des ersten Auftretens
const catIds = [];
for (const it of raw.items) if (!catIds.includes(it.cat)) catIds.push(it.cat);
const cats = catIds.map(id => ({ id, name: CAT_NAMES[id] || id, on: true }));

const usedIds = new Set();
const mkItem = it => {
  let id = slug(it.name); while (usedIds.has(id)) id += "_2"; usedIds.add(id);
  const o = { id, name: it.name.trim(), cat: it.cat };
  if (it.sauce) o.sauce = true;
  if (it.flavourMl) o.flavourMl = it.flavourMl;
  o.kcal = num(it.kcal); o.fat = num(it.fat); o.sat = num(it.sat); o.carbs = num(it.carbs);
  o.sugars = num(it.sugars); o.fibre = 0; o.protein = num(it.protein); o.salt = num(it.salt);
  return o;
};
const mkFlav = f => ({ id: f.id, name: f.name, kcal: num(f.kcal), fat: num(f.fat), sat: num(f.sat),
  carbs: num(f.carbs), sugars: num(f.sugars), fibre: 0, protein: num(f.protein), salt: num(f.salt) });

const items = raw.items.map(mkItem);
const flavs = raw.flavours.map(mkFlav);

const q = JSON.stringify;
const flagStr = x => (x.sauce ? ",sauce:true" : "") + (x.flavourMl ? `,flavourMl:${x.flavourMl}` : "");
const macStr = x => `kcal:${x.kcal},fat:${x.fat},sat:${x.sat},carbs:${x.carbs},sugars:${x.sugars},fibre:${x.fibre},protein:${x.protein},salt:${x.salt}`;

const lines = [];
lines.push("// __PEPES_DATA_START__ (generiert via: node pepes-update.js aus data/pepes-raw.json — nicht von Hand editieren)");
lines.push("// Quelle: Pepe's Piri Piri offizielle Nährwertangaben (Copy-Paste) · Stand " + raw._meta.updated +
  " · " + items.length + " Items · KEINE Ballaststoffe (fibre=0)");
lines.push("// Flavour-Modell: flavourMl>0 = Pflicht-Flavour; Optimizer addiert flavour-per-10ml × flavourMl/10. Ausgeschlossen: Wings/ganze Hähnchen/Bottles/Salt/Choc/Corn/Extra-Add-ons.");
lines.push("const PEPES = {");
lines.push("  cats: [");
for (const c of cats) lines.push(`    { id:${q(c.id)},name:${q(c.name)},on:${c.on} },`);
lines.push("  ],");
lines.push("  // Add-Flavour-Optionen (Pflicht bei flavourMl>0). Werte per 10 ml.");
lines.push("  flavours: [");
for (const f of flavs) lines.push(`    { id:${q(f.id)},name:${q(f.name)},${macStr(f)} },`);
lines.push("  ],");
lines.push("  items: [");
for (const x of items) lines.push(`    { id:${q(x.id)},name:${q(x.name)},cat:${q(x.cat)}${flagStr(x)},${macStr(x)} },`);
lines.push("  ],");
lines.push("};");
lines.push("// __PEPES_DATA_END__");
const block = lines.join("\n");

const file = __dirname + "/index.html";
const html = fs.readFileSync(file, "utf8");
const re = /\/\/ __PEPES_DATA_START__[\s\S]*?\/\/ __PEPES_DATA_END__/;
if (!re.test(html)) { console.error("PEPES-Marker in index.html nicht gefunden — erst Platzhalter einsetzen"); process.exit(1); }
fs.writeFileSync(file, html.replace(re, block), "utf8");

console.log(items.length + " Items + " + flavs.length + " Flavours -> index.html (PEPES-Block)");
for (const c of cats) console.log(`  ${c.name}: ${items.filter(x => x.cat === c.id).length} (Flavour: ${items.filter(x => x.cat === c.id && x.flavourMl).length})`);
