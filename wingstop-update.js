// Generiert den WINGSTOP-Block in index.html aus data/wingstop-raw.json: node wingstop-update.js
// Quelle: Wingstop UK Nutrition (User-Copy-Paste, hand-transkribiert — kein Crawler, wie GDK/TFC/Pho).
// A-la-carte (AC-Familie wie Itsu/Pho): cats + items, volle 8 Makros ('--' -> 0). Kein Schalentier (Chicken/Corn/Fries).
const fs = require("fs");
const raw = JSON.parse(fs.readFileSync(__dirname + "/data/wingstop-raw.json", "utf8"));
const slug = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
const num = v => { const f = parseFloat(v); return isNaN(f) ? 0 : Math.round(f * 100) / 100; };
const used = new Set();
const mkId = nm => { let id = slug(nm) || "item"; while (used.has(id)) id += "_2"; used.add(id); return id; };
const macStr = x => `kcal:${x.kcal},fat:${x.fat},sat:${x.sat},carbs:${x.carbs},sugars:${x.sugars},fibre:${x.fibre},protein:${x.protein},salt:${x.salt}`;
const q = JSON.stringify;

const items = raw.items.map(it => ({
  id: mkId(it.name), name: it.name.trim(), cat: it.cat,
  kcal: num(it.kcal), fat: num(it.fat), sat: num(it.sat), carbs: num(it.carbs),
  sugars: num(it.sugars), fibre: num(it.fibre), protein: num(it.protein), salt: num(it.salt),
}));

const lines = [];
lines.push("// __WINGSTOP_DATA_START__ (generiert via: node wingstop-update.js aus data/wingstop-raw.json — nicht von Hand editieren)");
lines.push("// Quelle: Wingstop UK Nutrition (User-Copy-Paste) · " + items.length + " Items · volle 8 Makros ('--'->0). '0 Pieces Boneless' war Tippfehler -> 10 Pieces. À la carte (AC-Alias).");
lines.push("const WINGSTOP = {");
lines.push("  cats: [");
for (const c of raw.cats) lines.push(`    { id:${q(c.id)},name:${q(c.name)},on:${c.on !== false} },`);
lines.push("  ],");
lines.push("  items: [");
for (const x of items) lines.push(`    { id:${q(x.id)},name:${q(x.name)},cat:${q(x.cat)},${macStr(x)} },`);
lines.push("  ],");
lines.push("};");
lines.push("// __WINGSTOP_DATA_END__");
const block = lines.join("\n");

const file = __dirname + "/index.html";
const html = fs.readFileSync(file, "utf8");
const re = /\/\/ __WINGSTOP_DATA_START__[\s\S]*?\/\/ __WINGSTOP_DATA_END__/;
if (!re.test(html)) { console.error("WINGSTOP-Marker in index.html nicht gefunden — erst Platzhalter einsetzen"); process.exit(1); }
fs.writeFileSync(file, html.replace(re, block), "utf8");

console.log(items.length + " Items -> index.html (WINGSTOP-Block)");
for (const c of raw.cats) console.log(`  ${c.name}: ${items.filter(x => x.cat === c.id).length}`);
