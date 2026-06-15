// Generiert den ATIS-Datenblock in index.html aus data/atis-raw.json: node atis-update.js
// Workflow: User liefert Nährwerte als Screenshots -> data/atis-raw.json (Roh-Transkription) -> dieses Skript.
// atis-raw.json ist die Quelle der Wahrheit (Screenshot-Werte). Deliveroo-Anzeigenamen weichen teils ab
// (RENAME-Map unten) -> der generierte Block + die Bestellanleitung nutzen die Deliveroo-Namen.
// Bases + Dressings gibt es REGULAR und LARGE (portion-Feld) -> getrennte Arrays (bases/basesL, sauces/saucesL).
// doublePlate:true (4 Carb-Bases + 4 Mixed Salads) wird durchgereicht: Power Plate zählt sie ×2 (Optimizer).
const fs = require("fs");

const raw = JSON.parse(fs.readFileSync(__dirname + "/data/atis-raw.json", "utf8"));

const slug = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

// Screenshot-Name -> aktueller Deliveroo-Anzeigename (Werte identisch, per kcal gegengeprüft)
const RENAME = {
  "Sesame Spicy Cauliflower": "Sesame Gochujang Cauliflower",
  "Shredded Carrot": "Shredded Carrots",
  "Broccoli": "Roasted Broccoli",
  "Edamame + Peas": "Edamame + Pea Medley",
  "Pink Slaw": "Pink & White Slaw",
  "Roasted Greens": "Zero Waste Greens",
  "Pickled Chillies": "Pickled Red Chilli",
  "Spring Onion + Coriander": "Spring Onion and Coriander",
  "Pickled Red Onions": "Pickled Red Onion",
  "Avocado Half": "Avocado",
  "Miso Ginger Sweet Potato": "Miso Ginger Sweet Potato Wedges",
  "Blanco Niño Chipotle Tortilla": "Blanco Niño Chipotle Tortillas",
};

const num = v => { const f = parseFloat(v); return isNaN(f) ? 0 : Math.round(f * 100) / 100; };

// Roh-Item -> normalisiertes Item (Deliveroo-Name, eindeutige id pro Ziel-Array)
function mk(it, usedIds) {
  const name = (RENAME[it.name] || it.name).trim();
  let id = slug(name);
  while (usedIds.has(id)) id += "_2";
  usedIds.add(id);
  const o = { id, name };
  if (it.carb) o.carb = true;
  if (it.doublePlate) o.doublePlate = true;
  if (it.seasonal) o.seasonal = true;
  for (const k of ["kcal", "fat", "sat", "carbs", "sugars", "fibre", "protein", "salt"]) o[k] = num(it[k]);
  return o;
}

// Items in Ziel-Arrays gruppieren (eigene id-Namespaces je Array)
const groups = {
  bases: [], basesL: [], mixed: [], ingredients: [], proteins: [],
  sauces: [], saucesL: [], crunches: [], addons: [],
};
const ns = {}; // pro Array eigene usedIds
for (const key of Object.keys(groups)) ns[key] = new Set();

for (const it of raw.items) {
  let key;
  if (it.section === "bases") key = it.portion === "large" ? "basesL" : "bases";
  else if (it.section === "mixed_salads") key = "mixed";
  else if (it.section === "ingredients") key = "ingredients";
  else if (it.section === "proteins") key = "proteins";
  else if (it.section === "crunches") key = "crunches";
  else if (it.section === "addons") key = "addons";
  else if (it.section === "sauces") key = "sauces";          // die 3 reinen Saucen -> in die Merged-Sauce-Liste
  else if (it.section === "dressings") key = it.portion === "large" ? "saucesL" : "sauces"; // Dressings (regular) -> Merged-Sauce-Liste
  else { console.error("Unbekannte Section: " + it.section); process.exit(1); }
  groups[key].push(mk(it, ns[key]));
}

const q = JSON.stringify;
const emit = x => {
  const flags = (x.carb ? ",carb:true" : "") + (x.doublePlate ? ",doublePlate:true" : "") + (x.seasonal ? ",seasonal:true" : "");
  return `    { id:${q(x.id)},name:${q(x.name)}${flags},kcal:${x.kcal},fat:${x.fat},sat:${x.sat},carbs:${x.carbs},sugars:${x.sugars},fibre:${x.fibre},protein:${x.protein},salt:${x.salt} },`;
};

const ARR_ORDER = ["bases", "basesL", "mixed", "ingredients", "proteins", "sauces", "saucesL", "crunches", "addons"];
const ARR_NOTE = {
  bases: "Bases REGULAR (Greens + Carbs, ein Auswahlschritt 'Choose up to 2'). carb+doublePlate = Carb-Base (Power Plate ×2)",
  basesL: "Bases LARGE (nur Greens) — aktuell ungenutzt, reserviert für Bowl/Größenvariante",
  mixed: "Mixed Salads (Power Plate: Pflicht 1; doublePlate ×2)",
  ingredients: "Ingredients (Power Plate: 1-2)",
  proteins: "Proteins (Power Plate: optional 0-3, bezahlt)",
  sauces: "Choose-a-Sauce-Liste REGULAR: 3 Saucen + 15 Dressings (Power Plate: Pflicht 1 oder 'I Don't Want A Dressing')",
  saucesL: "Dressings LARGE — aktuell ungenutzt, reserviert für Bowl/Größenvariante",
  crunches: "Crunches (Power Plate: Pflicht 1 oder 'I Don't Want A Crunch')",
  addons: "Add-ons (Power Plate: optional 0-3, bezahlt)",
};

const lines = [];
lines.push("// __ATIS_DATA_START__ (generiert via: node atis-update.js aus data/atis-raw.json — nicht von Hand editieren)");
lines.push("// Quelle: Atis (atisfood.com) offizielle Nährwerttabelle (Screenshots vom User) · Stand " + raw._meta.updated +
  " · " + raw.items.length + " Roh-Items");
lines.push("const ATIS = {");
for (const key of ARR_ORDER) {
  lines.push("  // " + ARR_NOTE[key]);
  lines.push("  " + key + ": [");
  for (const x of groups[key]) lines.push(emit(x));
  lines.push("  ],");
}
lines.push("};");
lines.push("// __ATIS_DATA_END__");
const block = lines.join("\n");

const file = __dirname + "/index.html";
const html = fs.readFileSync(file, "utf8");
const re = /\/\/ __ATIS_DATA_START__[\s\S]*?\/\/ __ATIS_DATA_END__/;
if (!re.test(html)) { console.error("ATIS-Marker in index.html nicht gefunden — erst Platzhalter einsetzen"); process.exit(1); }
fs.writeFileSync(file, html.replace(re, block), "utf8");

const tot = ARR_ORDER.reduce((a, k) => a + groups[k].length, 0);
console.log(tot + " Items -> index.html (ATIS-Block)");
for (const key of ARR_ORDER) {
  const g = groups[key];
  console.log(`  ${key}: ${g.length}` +
    (g.some(x => x.doublePlate) ? ` (doublePlate: ${g.filter(x => x.doublePlate).length})` : "") +
    (g.some(x => x.seasonal) ? ` (seasonal: ${g.filter(x => x.seasonal).length})` : ""));
}
