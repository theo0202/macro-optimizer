// Regeneriert data/urbangreens.json aus dem UG-Objekt in index.html: node export-urbangreens.js
// (index.html ist die Quelle der Wahrheit; Original: data/UrbanGreens-AllergenMatrix.pdf)
const fs = require("fs");
const html = fs.readFileSync(__dirname + "/index.html", "utf8");
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.error("inline <script> nicht gefunden"); process.exit(1); }

global.React = { useState: () => [null, () => {}], useMemo: (f) => f, createElement: () => null };
global.ReactDOM = { render: () => {} };
global.document = { getElementById: () => null };
(0, eval)(m[1] + "\n;globalThis.__t = { UG };");
const UG = globalThis.__t.UG;

const out = {
  _meta: {
    source: "Urban Greens 'Allergen guide 2026' PDF (data/UrbanGreens-AllergenMatrix.pdf), gegengeprüft mit data/UrbanGreens_Nutrition.xlsx; Deliveroo-Flow: data/UrbanGreens-Deliveroo-Screenshots.pdf",
    note: "NUR kcal/protein/fat/carbs verfügbar. NUR Build Your Own — fertige Salads & Trays bewusst entfernt (User-Entscheidung 12.06.2026, Werte standen ohne Dressing/Green Base bzw. waren nicht zerlegbar; Originalwerte siehe PDF/Excel).",
    generated: "node export-urbangreens.js (aus index.html UG-Objekt)",
  },
  order_rules_salad: [
    { step: 1, name: "Choose a Green Base", quantity: "1 oder keine", options: "greens" },
    { step: 2, name: "Choose a Carb Base", quantity: "1 oder keine", options: "carbs" },
    { step: 3, name: "Choose a Protein", quantity: "1 oder keins", options: "prots" },
    { step: 4, name: "Add Extra Protein?", quantity: "0-1", options: "prots ohne Avocado Whole (noExtra)" },
    { step: 5, name: "Choose 3 Veg or Pickles", quantity: "genau 3", options: "veg" },
    { step: 6, name: "Any Extra Veg or Pickles?", quantity: "beliebig", options: "Leafy Greens + veg ohne Cucumber (noExtra)" },
    { step: 7, name: "Choose 2 Toppings", quantity: "genau 2 (0 bei 'No nuts')", options: "tops" },
    { step: 8, name: "Choose a Dressing", quantity: "0-1 (optional; 0 bei 'No Dressing')", options: "dress" },
    { step: 9, name: "Any Extra Dressing?", quantity: "beliebig", options: "dress" },
    { step: 10, name: "Any extra Scoops, Premiums or Toppings?", quantity: "beliebig", options: "scoops + tops" },
  ],
  order_rules_tray: [
    { step: 1, name: "Choose a Carb Base", quantity: "1 oder keine", options: "carbs" },
    { step: 2, name: "Choose a Protein", quantity: "1 oder keins", options: "prots" },
    { step: 3, name: "Add Extra Protein?", quantity: "0-1", options: "prots ohne Avocado Whole (noExtra)" },
    { step: 4, name: "Choose 3 Veg or Pickles", quantity: "genau 3", options: "veg" },
    { step: 5, name: "Any Extra Veg or Pickles?", quantity: "beliebig", options: "Leafy Greens + veg ohne Cucumber (noExtra)" },
    { step: 6, name: "Choose a Scoop or Premium Add On", quantity: "PFLICHT, genau 1", options: "scoops" },
    { step: 7, name: "Choose 2 Toppings", quantity: "genau 2 (0 bei 'No nuts')", options: "tops" },
    { step: 8, name: "Any Extra Dressing?", quantity: "beliebig", options: "dress" },
    { step: 9, name: "Any extra Scoops, Premiums or Toppings?", quantity: "beliebig", options: "scoops + tops" },
  ],
  ...UG,
};

fs.writeFileSync(__dirname + "/data/urbangreens.json", JSON.stringify(out, null, 2) + "\n", "utf8");
console.log(Object.keys(UG).map(k => k + ":" + UG[k].length).join(" | ") + " -> data/urbangreens.json");
