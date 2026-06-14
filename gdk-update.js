// Generiert den GDK-Datenblock in index.html aus data/gdk-raw.json: node gdk-update.js
// Workflow: User liefert Daten als Copy-Paste-Batches -> Items in data/gdk-raw.json ergänzen -> dieses Skript.
// sauce:true wird durchgereicht (Schalter "No Sauce"); Kategorie rice_bowls ist Ziel von "No rice bowl".
const fs = require("fs");

const raw = JSON.parse(fs.readFileSync(__dirname + "/data/gdk-raw.json", "utf8"));

const slug = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
const DEFAULT_OFF = new Set(["juniors"]); // Kids-Menü standardmäßig aus (wie Nando's Nandinos)
const CAT_NAMES = { kebabs: "Kebabs", wraps: "Wraps", burritos: "Burritos", quesadillas: "Quesadillas",
  rice_bowls: "Rice Bowls", boxes: "Boxes", sides: "Sides", juniors: "Juniors (Kids)" };

const catIds = [];
for (const it of raw.items) { const c = slug(it.cat); if (!catIds.includes(c)) catIds.push(c); }
const cats = catIds.map(id => ({ id, name: CAT_NAMES[id] || id, on: !DEFAULT_OFF.has(id) }));

const num = v => { const f = parseFloat(v); return isNaN(f) ? 0 : Math.round(f * 100) / 100; };
const usedIds = new Set();
const items = raw.items.map(it => {
  let id = slug(it.name);
  while (usedIds.has(id)) id += "_2";
  usedIds.add(id);
  return {
    id, name: it.name.trim(), cat: slug(it.cat), sauce: !!it.sauce,
    kcal: num(it.kcal), fat: num(it.fat), sat: num(it.sat), carbs: num(it.carbs),
    sugars: num(it.sugars), fibre: num(it.fibre), protein: num(it.protein), salt: num(it.salt),
  };
});

const q = JSON.stringify;
const lines = [];
lines.push("// __GDK_DATA_START__ (generiert via: node gdk-update.js aus data/gdk-raw.json — nicht von Hand editieren)");
lines.push("// Quelle: GDK offizielle Nährwerttabelle (Copy-Paste vom User) · Stand " + raw._meta.updated + " · " + items.length + " Items · " + items.filter(x => x.sauce).length + " mit Sauce");
lines.push("const GDK = {");
lines.push("  cats: [");
for (const c of cats) lines.push(`    { id:${q(c.id)},name:${q(c.name)},on:${c.on} },`);
lines.push("  ],");
lines.push("  items: [");
for (const x of items)
  lines.push(`    { id:${q(x.id)},name:${q(x.name)},cat:${q(x.cat)}${x.sauce ? ",sauce:true" : ""},kcal:${x.kcal},fat:${x.fat},sat:${x.sat},carbs:${x.carbs},sugars:${x.sugars},fibre:${x.fibre},protein:${x.protein},salt:${x.salt} },`);
lines.push("  ],");
lines.push("};");
lines.push("// __GDK_DATA_END__");
const block = lines.join("\n");

const file = __dirname + "/index.html";
const html = fs.readFileSync(file, "utf8");
const re = /\/\/ __GDK_DATA_START__[\s\S]*?\/\/ __GDK_DATA_END__/;
if (!re.test(html)) { console.error("GDK-Marker in index.html nicht gefunden"); process.exit(1); }
fs.writeFileSync(file, html.replace(re, block), "utf8");

console.log(cats.length + " Kategorien, " + items.length + " Items (" + items.filter(x => x.sauce).length + " mit Sauce) -> index.html (GDK-Block)");
for (const c of cats) console.log(`  ${c.on ? "[an] " : "[aus]"} ${c.name}: ${items.filter(x => x.cat === c.id).length} (Sauce: ${items.filter(x => x.cat === c.id && x.sauce).length})`);
