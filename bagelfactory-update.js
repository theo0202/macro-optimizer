// Generiert den BAGELFACTORY-Block in index.html aus data/bagelfactory-raw.json: node bagelfactory-update.js
// Quelle: offizielle "Full Ingredient List"-PDF (bagelfactory-extract.py). NUR fertige Menue-Bagels + Sweets
// (per-portion; Werte gelten fuer den Plain Bun). A-la-carte (AC-Familie wie Itsu/Pret/Leon): cats + items, volle 8 Makros.
const fs = require("fs");
const raw = JSON.parse(fs.readFileSync(__dirname + "/data/bagelfactory-raw.json", "utf8"));
const slug = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
const num = v => { const f = parseFloat(v); return isNaN(f) ? 0 : Math.round(f * 100) / 100; };
const used = new Set();
const mkId = nm => { let id = slug(nm) || "item"; while (used.has(id)) id += "_2"; used.add(id); return id; };
const macStr = x => `kcal:${x.kcal},fat:${x.fat},sat:${x.sat},carbs:${x.carbs},sugars:${x.sugars},fibre:${x.fibre},protein:${x.protein},salt:${x.salt}`;
const q = JSON.stringify;

const items = raw.items.map(it => ({
  id: mkId(it.name), name: it.name.trim(), cat: it.cat, bunSwap: !!it.bunSwap,
  kcal: num(it.kcal), fat: num(it.fat), sat: num(it.sat), carbs: num(it.carbs),
  sugars: num(it.sugars), fibre: num(it.fibre), protein: num(it.protein), salt: num(it.salt),
}));
const buns = (raw.buns || []).map(b => ({
  id: b.id, name: b.name.trim(), plain: !!b.plain,
  kcal: num(b.kcal), fat: num(b.fat), sat: num(b.sat), carbs: num(b.carbs),
  sugars: num(b.sugars), fibre: num(b.fibre), protein: num(b.protein), salt: num(b.salt),
}));

const lines = [];
lines.push("// __BAGELFACTORY_DATA_START__ (generiert via: node bagelfactory-update.js aus data/bagelfactory-raw.json — nicht von Hand editieren)");
lines.push("// Quelle: Bagel Factory 'Full Ingredient List' PDF (Issue 20, 13/04/2026) · " + items.length + " Items + " + buns.length + " Buns · per-portion.");
lines.push("// Bagels = Werte fuer den Plain Bun; bunSwap:true-Items koennen umgerechnet werden = Bagel - Plain Bun + gewaehlter Bun.");
lines.push("// EXTRAS/SAUCES (Fillings) der PDF sind per-100g ohne Portionsgroessen -> Fillings/BYO nicht abbildbar.");
lines.push("const BAGELFACTORY = {");
lines.push("  cats: [");
for (const c of raw.cats) lines.push(`    { id:${q(c.id)},name:${q(c.name)},on:${c.on !== false} },`);
lines.push("  ],");
lines.push("  buns: [");
for (const b of buns) lines.push(`    { id:${q(b.id)},name:${q(b.name)},plain:${b.plain},${macStr(b)} },`);
lines.push("  ],");
lines.push("  items: [");
for (const x of items) lines.push(`    { id:${q(x.id)},name:${q(x.name)},cat:${q(x.cat)}${x.bunSwap ? ",bunSwap:true" : ""},${macStr(x)} },`);
lines.push("  ],");
lines.push("};");
lines.push("// __BAGELFACTORY_DATA_END__");
const block = lines.join("\n");

const file = __dirname + "/index.html";
const html = fs.readFileSync(file, "utf8");
const re = /\/\/ __BAGELFACTORY_DATA_START__[\s\S]*?\/\/ __BAGELFACTORY_DATA_END__/;
if (!re.test(html)) { console.error("BAGELFACTORY-Marker in index.html nicht gefunden — erst Platzhalter einsetzen"); process.exit(1); }
fs.writeFileSync(file, html.replace(re, block), "utf8");

console.log(items.length + " Items -> index.html (BAGELFACTORY-Block)");
for (const c of raw.cats) console.log(`  ${c.name}: ${items.filter(x => x.cat === c.id).length}`);
