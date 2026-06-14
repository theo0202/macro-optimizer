// Generiert den NANDOS-Datenblock in index.html aus data/nandos-raw.json: node nandos-update.js
// Kompletter Refresh: node nandos-crawl.js && node nandos-update.js
// Regeln: Drinks-Section komplett raus (User-Vorgabe) · Nandinos "Dessert OR Drink" raus (Kids-Bundle)
//         · Items ohne Nährwerte raus (z.B. Sharing Platters ohne kcal-Angabe)
//         · Mehrere Portionsgrößen (size REGULAR/LARGE) werden zu eigenen Items
//         · sauce:true für Subsections "Dips" + "Bottles" sowie "PERi-PERi Drizzle" (Schalter "No sauces")
const fs = require("fs");

const raw = JSON.parse(fs.readFileSync(__dirname + "/data/nandos-raw.json", "utf8"));

const slug = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
const norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, " ").trim();
const SKIP_SECTIONS = new Set(["drinks"]);
const SKIP_SUBSECTIONS = new Set(["Dessert OR Drink"]);
const DEFAULT_OFF = new Set(["nandinos_kids"]);
// Schalter "No wings / chicken livers": diese Items bekommen wings:true (alle Wings + Extra Saucy + Roulette + Livers).
// "3 Chicken Wings" trifft PERi-PERi Chicken UND Nandinos. XL Wing Platter NICHT geflaggt (über Platter-Schalter abdeckbar).
const WINGS_NAMES = new Set([
  "10 Chicken Wings", "5 Chicken Wings", "3 Chicken Wings", "Wing Roulette",
  "10 Extra Saucy Wings", "5 Extra Saucy Wings", "3 Extra Saucy Wings",
  "Chicken Livers & Rustic Portuguese Roll",
].map(norm));
const cap = s => s ? s.charAt(0) + s.slice(1).toLowerCase() : s;

const mg = v => (v == null ? 0 : Math.round(v / 10) / 100); // mg -> g, 2 Dezimalstellen
const usedIds = new Set();
const items = [];
const skipped = [];

for (const s of raw.sections) {
  const cat = slug(s.name);
  if (SKIP_SECTIONS.has(cat)) continue;
  for (const it of s.items) {
    if (SKIP_SUBSECTIONS.has(it.subsection)) { skipped.push(it.name + " (Kids Dessert/Drink)"); continue; }
    const facts = it.factsForPortionSizes.filter(f => f.energyKcal != null);
    if (!facts.length) { skipped.push(it.name + " (keine Nährwerte)"); continue; }
    const isSauce = it.subsection === "Dips" || it.subsection === "Bottles" || it.name === "PERi-PERi Drizzle";
    const isWings = WINGS_NAMES.has(norm(it.name));            // Schalter "No wings / chicken livers"
    const isCorn = norm(it.name).startsWith("corn on the cob"); // Schalter "No Corn on the Cob"
    facts.forEach((f, fi) => {
      const suffix = facts.length > 1 ? " (" + cap(f.size || "Portion " + (fi + 1)) + ")" : "";
      let id = slug(it.name + suffix);
      while (usedIds.has(id)) id += "_2";
      usedIds.add(id);
      items.push({
        id, name: it.name + suffix, cat, sauce: isSauce, wings: isWings, corn: isCorn,
        kcal: f.energyKcal || 0, fat: mg(f.fatMg), sat: mg(f.saturatesMg), carbs: mg(f.totalCarbsMg),
        sugars: mg(f.sugarsMg), fibre: mg(f.fibreMg), protein: mg(f.proteinMg), salt: mg(f.saltMg),
      });
    });
  }
}

// Kategorien: nur Sections, die nach dem Filtern noch Items haben; Reihenfolge wie im Menü
const cats = raw.sections
  .filter(s => !SKIP_SECTIONS.has(slug(s.name)) && items.some(x => x.cat === slug(s.name)))
  .map(s => ({ id: slug(s.name), name: s.name, on: !DEFAULT_OFF.has(slug(s.name)) }));
const catOrder = new Map(cats.map((c, i) => [c.id, i]));
items.sort((a, b) => (catOrder.get(a.cat) - catOrder.get(b.cat)) || a.name.localeCompare(b.name));

const q = JSON.stringify;
const lines = [];
lines.push("// __NANDOS_DATA_START__ (generiert via: node nandos-crawl.js && node nandos-update.js — nicht von Hand editieren)");
lines.push("// Quelle: api.nandos.services/menu-v2 · Stand " + raw._meta.crawled + " · " + items.length + " Items · Drinks & Kids-Dessert/Drink sind bewusst NICHT enthalten");
lines.push("const NANDOS = {");
lines.push("  cats: [");
for (const c of cats) lines.push(`    { id:${q(c.id)},name:${q(c.name)},on:${c.on} },`);
lines.push("  ],");
lines.push("  items: [");
for (const x of items)
  lines.push(`    { id:${q(x.id)},name:${q(x.name)},cat:${q(x.cat)}${x.sauce ? ",sauce:true" : ""}${x.wings ? ",wings:true" : ""}${x.corn ? ",corn:true" : ""},kcal:${x.kcal},fat:${x.fat},sat:${x.sat},carbs:${x.carbs},sugars:${x.sugars},fibre:${x.fibre},protein:${x.protein},salt:${x.salt} },`);
lines.push("  ],");
lines.push("};");
lines.push("// __NANDOS_DATA_END__");
const block = lines.join("\n");

const file = __dirname + "/index.html";
const html = fs.readFileSync(file, "utf8");
const re = /\/\/ __NANDOS_DATA_START__[\s\S]*?\/\/ __NANDOS_DATA_END__/;
if (!re.test(html)) { console.error("NANDOS-Marker in index.html nicht gefunden"); process.exit(1); }
fs.writeFileSync(file, html.replace(re, block), "utf8");

console.log(cats.length + " Kategorien, " + items.length + " Items (" + items.filter(x => x.sauce).length + " als Sauce geflaggt) -> index.html (NANDOS-Block)");
console.log("Wings/Livers (wings:true, " + items.filter(x => x.wings).length + "): " + items.filter(x => x.wings).map(x => x.name).join(" | "));
console.log("Corn (corn:true, " + items.filter(x => x.corn).length + "): " + items.filter(x => x.corn).map(x => x.name).join(" | "));
for (const c of cats) console.log(`  ${c.on ? "[an] " : "[aus]"} ${c.name}: ${items.filter(x => x.cat === c.id).length}`);
console.log("Übersprungen (" + skipped.length + "): " + skipped.join(" | "));
