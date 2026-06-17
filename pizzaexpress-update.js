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

// ── Deliveroo-Prune (User 17.06.2026: "voll auf Deliveroo-Liste"): nur auf der Deliveroo-Bestellseite
// bestellbare Produkte behalten. Quelle = vom User gepastete komplette Deliveroo-Karte. Die PDF (raw) bleibt
// die volle Quelle der Wahrheit; gefiltert wird nur bei der Generierung. Begruendung je Kategorie:
//  - Pizzen (Classic/Romana/Large): jedes Deliveroo-Rezept ist auf allen 3 Basen + GF/Vegan bestellbar -> alle
//    behalten AUSSER "Padana" + "Garlic Prawn" (stehen nicht auf Deliveroo). "Double American Cheese" existiert
//    in der PDF nur als (Dine Out) -> behalten (Rezept ist bestellbar).
//  - Dough Balls: "(Dine Out)"-Dubletten + "Al Forno" raus (Al Forno nicht auf Deliveroo).
//  - Sides: "(Dine Out)"-Dubletten raus.
//  - Leggera & Al Forno: nur die 5 Pasta-Gerichte (Lasagna/Cannelloni/Pollo Pesto/Peperonata/Prawn Puttanesca);
//    die Leggera-PIZZEN (Pomodoro etc.) gibt es auf Deliveroo nicht.
//  - Starters: explizite Deliveroo-Liste. Calamari/Mozzarella Sticks/Squad Sharer matchen exakt die (Dine Out)-
//    kcal von Deliveroo (675~678, 552, 1320) -> diese Variante behalten; "Sharing Trio (Dine Out)" -> "Squad Sharer".
//  - Salads: "with GF Dough Balls"-Varianten (kein Deliveroo-Salad-Option) + "Warm Roasted Veg & Chicken Bowl" raus;
//    Basis + "with dough sticks" bleiben (beide Deliveroo-bestellbar, fertige Kombi-Eintraege, kein Build-Your-Own).
//  - Desserts: die 8 Deliveroo-Desserts; deren kcal matchen exakt die (Dine Out)-PDF-Werte -> diese behalten.
// "(Dine Out)" wird aus den Anzeigenamen entfernt (Deliveroo nennt sie ohne).
const stripDineOut = n => n.replace(/\s*\(\s*dine out\s*\)/ig, "").replace(/\s{2,}/g, " ").trim();
const normPizza = n => stripDineOut(n).toLowerCase().replace(/["'""]/g, "")
  .replace(/\bgf\b/g, "").replace(/\bvegan\b/g, "").replace(/\bpiccante\b/g, "").replace(/\s+/g, " ").trim();
const DROP_PIZZA = new Set(["padana", "garlic prawn"]); // nicht auf Deliveroo
const KEEP_LEGGERA = new Set(["Lasagna Classica", "Cannelloni", "Pollo Pesto Penne", "Pollo Pesto Fusilli GF",
  "Peperonata Penne", "Peperonata Fusilli GF", "Prawn Puttanesca"]);
const KEEP_STARTERS = new Set(["Garlic Bread with Mozzarella", "Garlic Bread with Mozzarella Sharer",
  "Garlic Bread with Vegan Mozzarella Alternative", "Garlic Bread with Vegan Mozzarella Alternative Sharer",
  "Bruschetta Originale", "Lemon & Herbs Chicken Wings", "Triple Chilli Chicken Wings",
  "Calamari (Dine Out)", "Mozzarella Sticks (Dine Out)", "Buttermilk Chicken Goujons", "Caprese Salad",
  "Sharing Trio (Dine Out)"]);
const KEEP_DESSERTS = new Set(["Tiramisu", "Biscoff Cheesecake (Dine Out)", "Stem Ginger Cake (Dine Out)",
  "Lemon & Raspberry Cheesecake (Dine Out)", "Baked Vanilla Cheesecake (Dine Out)",
  "Honeycomb & Caramel Cream Slice (Dine Out)", "Double Chocolate Brownie Bites (Dine Out)",
  "White Chocolate Blondie Bites (Dine Out)"]);
const RENAME = { "Sharing Trio (Dine Out)": "Squad Sharer" };

function pruneKeep(it) {
  const n = it.name, cat = it.cat, isDineOut = /\(\s*dine out\s*\)/i.test(n);
  if (cat === "classic" || cat === "romana" || cat === "large_classic") return !DROP_PIZZA.has(normPizza(n));
  if (cat === "doughballs") return !isDineOut && !/al forno/i.test(n);
  if (cat === "sides") return !isDineOut;
  if (cat === "leggera_alforno") return KEEP_LEGGERA.has(n);
  if (cat === "starters") return KEEP_STARTERS.has(n);
  if (cat === "desserts") return KEEP_DESSERTS.has(n);
  if (cat === "salads") return !/with gf dough balls/i.test(n) && !/warm roasted veg/i.test(n);
  return true;
}

const droppedNames = raw.items.filter(it => !pruneKeep(it)).map(it => `${it.cat}: ${it.name}`);
const items = raw.items.filter(pruneKeep).map(it => {
  const name = (RENAME[it.name] !== undefined ? RENAME[it.name] : stripDineOut(it.name)).trim();
  return {
    id: mkId(name), name, cat: it.cat,
    kcal: num(it.kcal), fat: num(it.fat), sat: num(it.sat), carbs: num(it.carbs),
    sugars: num(it.sugars), fibre: num(it.fibre), protein: num(it.protein), salt: num(it.salt),
  };
});

// Kategorien, die per Default AUS sind (User-Wunsch 16.06.2026: Desserts ausschliessen — Items bleiben, Chip nur default off)
const DEFAULT_OFF = new Set(["desserts"]);

const lines = [];
lines.push("// __PIZZAEXPRESS_DATA_START__ (generiert via: node pizzaexpress-update.js aus data/pizzaexpress-raw.json — nicht von Hand editieren)");
lines.push("// Quelle: offizielle PizzaExpress-Naehrwert-PDF (England/Wales/Scotland) · Juni 2026 · " + items.length +
  " Items · per-Portion, volle 8 Makros. À la carte (AC-Alias). GF/Vegan/Dine-Out-Varianten sind eigene Items.");
lines.push("const PIZZAEXPRESS = {");
lines.push("  cats: [");
for (const c of raw.cats) lines.push(`    { id:${q(c.id)},name:${q(c.name)},on:${c.on !== false && !DEFAULT_OFF.has(c.id)} },`);
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

console.log(items.length + " Items -> index.html (PIZZAEXPRESS-Block) | " + droppedNames.length + " nicht-Deliveroo geprunt (von " + raw.items.length + ")");
for (const c of raw.cats) console.log(`  ${c.name}: ${items.filter(x => x.cat === c.id).length}`);
