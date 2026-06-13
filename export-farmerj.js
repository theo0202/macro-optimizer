// Regeneriert data/farmerj.json aus dem FJ-Objekt in index.html: node export-farmerj.js
// (index.html ist die Quelle der Wahrheit für die App-Daten)
const fs = require("fs");
const html = fs.readFileSync(__dirname + "/index.html", "utf8");
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.error("inline <script> nicht gefunden"); process.exit(1); }

global.React = { useState: () => [null, () => {}], useMemo: (f) => f, createElement: () => null };
global.ReactDOM = { render: () => {} };
global.document = { getElementById: () => null };
(0, eval)(m[1] + "\n;globalThis.__t = { FJ };");
const FJ = globalThis.__t.FJ;

const item = (x, category, categoryDeliveroo) => ({
  id: x.id, name: x.name, category, categoryDeliveroo,
  kcal: x.kcal, fat: x.fat, sat: x.sat, carbs: x.carbs,
  sugars: x.sugars, fibre: x.fibre, protein: x.protein, salt: x.salt,
});
const setCat = g => (g === "Fieldtray" ? "Set Fieldtrays" : g === "Fieldbowl" ? "Set Fieldbowls" : "The Salad, Solo");

const items = [
  ...FJ.mains.map(x => item(x, "Mains", "Mains")),
  ...FJ.bases.map(x => item(x, "Bases", "Bases")),
  ...FJ.sides.map(x => item(x, x.group === "Warm Side" ? "Warm Sides" : "Salads", "Sides")),
  ...FJ.sdt.filter(x => x.group === "Sauce").map(x => item(x, "Sauces", "Sauce, Dip or Topping")),
  ...FJ.toppings.map(x => item(x, "Toppings & Extras", "Topping")),
  ...FJ.sdt.filter(x => x.group === "Extra").map(x => item(x, "Toppings & Extras", "Sauce, Dip or Topping")),
  ...FJ.sets.map(x => item(x, setCat(x.group), setCat(x.group))),
];

const out = {
  _meta: {
    source: "farmerj.com Nutritional Info (Stand Juni 2026); Struktur & Order Rules aus 'Farmer J _ Nutritional Info.xlsx'",
    note: "Alle Werte pro Serving. Custom Fieldtray = 1 Main + 1 Base + 2 Sides (frei); Toppings unbegrenzt (bezahlt); 'Sauce, Dip or Topping' max 1 (bezahlt).",
    generated: "node export-farmerj.js (aus index.html FJ-Objekt)",
  },
  order_rules: [
    { quantity: 1, pricing: "Free", categoryDeliveroo: "Mains" },
    { quantity: 1, pricing: "Free", categoryDeliveroo: "Bases" },
    { quantity: 2, pricing: "Free", categoryDeliveroo: "Sides" },
    { quantity: "as much as you want", pricing: "Additional Payment Needed", categoryDeliveroo: "Topping" },
    { quantity: 1, pricing: "Additional Payment Needed", categoryDeliveroo: "Sauce, Dip or Topping" },
  ],
  items,
};

fs.writeFileSync(__dirname + "/data/farmerj.json", JSON.stringify(out, null, 2) + "\n", "utf8");
console.log(items.length + " Items -> data/farmerj.json");
