// Generiert den PHO-Block in index.html aus data/pho-raw.json: node pho-update.js
// Quelle: Pho Nutritional Guidelines 2026 (hand-transkribiert, kein Crawler — Layout zu unregelmaessig, wie GDK/TFC).
// À-la-carte (AC-Familie wie Itsu/Wasabi): cats + items. 7 Makros in der Quelle (KEIN Salt -> salt=0).
const fs = require("fs");
const raw = JSON.parse(fs.readFileSync(__dirname + "/data/pho-raw.json", "utf8"));
const slug = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
const num = v => { const f = parseFloat(v); return isNaN(f) ? 0 : Math.round(f * 100) / 100; };
const used = new Set();
const mkId = nm => { let id = slug(nm) || "item"; while (used.has(id)) id += "_2"; used.add(id); return id; };
const macStr = x => `kcal:${x.kcal},fat:${x.fat},sat:${x.sat},carbs:${x.carbs},sugars:${x.sugars},fibre:${x.fibre},protein:${x.protein},salt:0`;
const q = JSON.stringify;

// Quelle-Felder: kcal, protein, carbs, fat, sat, fibre, sugar -> App-Felder (sugars=sugar, salt=0)
const items = raw.items.map(it => ({
  id: mkId(it.name), name: it.name.trim(), cat: it.cat, sauce: !!it.sauce,
  kcal: num(it.kcal), fat: num(it.fat), sat: num(it.sat), carbs: num(it.carbs),
  sugars: num(it.sugar), fibre: num(it.fibre), protein: num(it.protein),
}));

const lines = [];
lines.push("// __PHO_DATA_START__ (generiert via: node pho-update.js aus data/pho-raw.json — nicht von Hand editieren)");
lines.push("// Quelle: Pho Nutritional Guidelines 2026 (31/01/2026) · " + items.length + " Items · 7 Makros, KEIN Salt (salt=0) · hand-transkribiert. À la carte (AC-Alias).");
lines.push("const PHO = {");
lines.push("  cats: [");
for (const c of raw.cats) lines.push(`    { id:${q(c.id)},name:${q(c.name)},on:${c.on !== false} },`);
lines.push("  ],");
lines.push("  items: [");
for (const x of items) lines.push(`    { id:${q(x.id)},name:${q(x.name)},cat:${q(x.cat)}${x.sauce ? ",sauce:true" : ""},${macStr(x)} },`);
lines.push("  ],");
lines.push("};");
lines.push("// __PHO_DATA_END__");
const block = lines.join("\n");

const file = __dirname + "/index.html";
const html = fs.readFileSync(file, "utf8");
const re = /\/\/ __PHO_DATA_START__[\s\S]*?\/\/ __PHO_DATA_END__/;
if (!re.test(html)) { console.error("PHO-Marker in index.html nicht gefunden — erst Platzhalter einsetzen"); process.exit(1); }
fs.writeFileSync(file, html.replace(re, block), "utf8");

console.log(items.length + " Items -> index.html (PHO-Block)");
for (const c of raw.cats) console.log(`  ${c.name}: ${items.filter(x => x.cat === c.id).length}`);
