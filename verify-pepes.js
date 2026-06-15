// Sanity-Check der Pepe's-Rohdaten: kcal ~ 4*carb + 4*protein + 9*fat (Pepe's hat KEINE Ballaststoffe);
// gesättigt <= Fett. Flag bei kcal-Abweichung > 12% UND > 25 kcal.
const raw = require("./data/pepes-raw.json");
const rows = [...raw.flavours.map(f => ({ ...f, _t: "flavour" })), ...raw.items.map(i => ({ ...i, _t: "item" }))];

console.log("=== kcal-Plausibilität (est = 4*carb + 4*protein + 9*fat) ===");
let flags = 0;
for (const r of rows) {
  const est = 4 * r.carbs + 4 * r.protein + 9 * r.fat;
  const d = r.kcal - est;
  if (Math.abs(d) > 25 && Math.abs(d) / r.kcal > 0.12) {
    flags++;
    console.log(`  ⚠ ${r.name} [${r._t}]: angegeben ${r.kcal}, aus Makros ~${est.toFixed(0)} (Δ${d > 0 ? "+" : ""}${d.toFixed(0)})`);
  }
}
if (!flags) console.log("  alle innerhalb Toleranz");

console.log("\n=== gesättigt > Gesamtfett ===");
let sf = 0;
for (const r of rows) if (r.sat > r.fat) { sf++; console.log(`  ⚠ ${r.name}: Fett ${r.fat}, gesättigt ${r.sat}`); }
if (!sf) console.log("  keine");

console.log("\n=== Übersicht ===");
const cats = {};
for (const i of raw.items) cats[i.cat] = (cats[i.cat] || 0) + 1;
console.log("  Items: " + raw.items.length + " (" + Object.entries(cats).map(([k, v]) => k + ":" + v).join(", ") + ")");
console.log("  davon mit Flavour (flavourMl>0): " + raw.items.filter(i => i.flavourMl > 0).length);
console.log("  Saucen (sauce:true): " + raw.items.filter(i => i.sauce).length);
console.log("  Flavours: " + raw.flavours.length);
