// Kritischer Sanity-Check der OFFIZIELLEN Chopstix V19-Tabelle (April 2026), nur Box-relevante Items.
// Prüft: 1) kcal ~ 4*carb+4*protein+9*fat (US) bzw. +2*fibre (EU)  2) gesättigt <= Fett  3) Größen-Skalierung.
// Felder: [name, kcal, fat, sat, carb, sugar, fibre, protein, salt]
const rows = [
  // BASES (Taster/Small/Regular/Large) — Regular = 2er-Box, Large = 3er-Box
  ["Veg Chow Mein Taster", 123, 2.8, 0.3, 21.7, 0.1, 1.8, 3.7, 1.08],
  ["Veg Chow Mein Small", 246, 5.6, 0.6, 43.4, 0.2, 3.6, 7.4, 2.16],
  ["Veg Chow Mein Regular", 308, 7.0, 0.7, 54.3, 0.3, 4.5, 9.3, 2.70],
  ["Veg Chow Mein Large", 369, 8.4, 0.8, 65.1, 0.3, 5.4, 11.1, 3.24],
  ["Egg Fried Rice Taster", 186, 2.9, 0.4, 37.5, 0.2, 1.5, 3.2, 0.53],
  ["Egg Fried Rice Small", 372, 5.8, 0.8, 75.0, 0.4, 3.0, 6.4, 1.06],
  ["Egg Fried Rice Regular", 465, 7.3, 1.0, 93.8, 0.5, 3.8, 8.0, 1.33],
  ["Egg Fried Rice Large", 558, 8.7, 1.1, 112.5, 0.6, 4.5, 9.6, 1.59],
  ["Cauli Rice Taster", 23, 0.1, 0.1, 3.4, 2.0, 1.5, 1.4, 0.85],
  ["Cauli Rice Small", 46, 0.2, 0.1, 6.8, 4.0, 3.0, 2.8, 1.70],
  ["Cauli Rice Regular", 58, 0.3, 0.1, 8.5, 5.0, 3.8, 3.5, 2.13],
  ["Cauli Rice Large", 69, 0.3, 0.2, 10.2, 6.0, 4.5, 4.2, 2.55],
  // TOPPINGS (Small/Regular/Large/Pot) — in Box: Regular(=Large) pro Topping
  ["Sweet&Sour Small", 216, 8.3, 1.0, 23.8, 13.8, 2.6, 13.0, 1.60],
  ["Sweet&Sour Regular", 162, 6.2, 0.8, 17.9, 10.3, 1.9, 9.7, 1.20],
  ["Sweet&Sour Large", 162, 6.2, 0.8, 17.9, 10.3, 1.9, 9.7, 1.20],
  ["Caramel Drizzle Small", 253, 10.8, 1.7, 23.6, 9.2, 0.7, 15.7, 1.78],
  ["Caramel Drizzle Regular", 169, 7.2, 1.2, 15.8, 6.2, 0.5, 10.5, 1.18],
  ["Caramel Drizzle Large", 169, 7.2, 1.2, 15.8, 6.2, 0.5, 10.5, 1.18],
  ["Chinese Curry Small", 184, 9.0, 3.4, 8.8, 2.2, 2.7, 11.3, 1.89],
  ["Chinese Curry Regular", 133, 6.5, 2.5, 6.4, 1.6, 2.0, 8.1, 1.37],
  ["Chinese Curry Large", 133, 6.5, 2.5, 6.4, 1.6, 2.0, 8.1, 1.37],
  ["S&P Chicken Small", 208, 10.0, 1.0, 14.8, 1.9, 1.2, 15.4, 2.38],
  ["S&P Chicken Regular", 138, 6.6, 0.7, 9.8, 1.3, 0.8, 10.2, 1.58],
  ["S&P Chicken Large", 138, 6.6, 0.7, 9.8, 1.3, 0.8, 10.2, 1.58],
  ["S&P Potatoes Small", 150, 10.0, 1.5, 12.4, 2.6, 0.8, 2.1, 0.49],
  ["S&P Potatoes Regular", 100, 6.7, 1.0, 8.3, 1.8, 0.5, 1.4, 0.32],
  ["S&P Potatoes Large", 100, 6.7, 1.0, 8.3, 1.8, 0.5, 1.4, 0.32],
  ["Coconut Crave Small", 160, 10.0, 5.5, 5.4, 0.0, 2.0, 12.9, 1.50],
  ["Coconut Crave Regular", 113, 7.1, 3.9, 3.8, 0.0, 1.4, 9.1, 1.06],
  ["Coconut Crave Large", 113, 7.1, 3.9, 3.8, 0.0, 1.4, 9.1, 1.06],
  ["Firecracker Small", 373, 18.7, 2.1, 32.2, 14.9, 2.6, 20.3, 3.57],
  ["Firecracker Regular", 280, 14.0, 1.5, 24.1, 11.2, 1.9, 15.2, 2.68],
  ["Firecracker Large", 280, 14.0, 1.5, 24.1, 11.2, 1.9, 15.2, 2.68],
  ["No Beef Teriyaki Small", 101, 2.3, 0.3, 14.6, 3.6, 3.5, 7.3, 0.94],
  ["No Beef Teriyaki Regular", 67, 1.5, 0.2, 9.8, 2.4, 2.3, 4.9, 0.62],
  ["No Beef Teriyaki Large", 67, 1.5, 0.2, 9.8, 2.4, 2.3, 4.9, 0.62],
  ["Cherry Kiss Small", 299, 13.3, 1.4, 24.8, 9.3, 0.1, 20.3, 2.40],
  ["Cherry Kiss Regular", 224, 10.0, 1.0, 18.6, 7.0, 0.0, 15.2, 1.80],
  ["Cherry Kiss Large", 224, 10.0, 1.0, 18.6, 7.0, 0.0, 15.2, 1.80],
  ["Soy-Mazing Small", 232, 10.6, 1.2, 19.6, 4.9, 1.2, 15.4, 3.60],
  ["Soy-Mazing Regular", 154, 7.0, 0.8, 13.0, 3.3, 0.8, 10.2, 2.40],
  ["Soy-Mazing Large", 154, 7.0, 0.8, 13.0, 3.3, 0.8, 10.2, 2.40],
  ["Pumpkin Katsu (flat)", 215, 7.3, 3.4, 22.9, 2.9, 1.7, 3.2, 1.13],
  // Sauce (kein Box-Topping)
  ["Katsu Curry Sauce Small", 80, 0.8, 2.8, 5.4, 0.5, 0.7, 1.1, 0.78],
];

console.log("=== kcal-Plausibilität (US = 4C+4P+9F; EU = +2*fibre); Flag bei >12% UND >20 kcal ===");
let flags = 0;
for (const [name, kcal, fat, sat, carb, sugar, fibre, protein] of rows) {
  const est = 4*carb + 4*protein + 9*fat, estEU = est + 2*fibre;
  const d = Math.min(Math.abs(kcal-est), Math.abs(kcal-estEU));
  if (d > 20 && d/kcal > 0.12) { flags++; console.log(`  ⚠ ${name}: angegeben ${kcal}, US ~${est.toFixed(0)} / EU ~${estEU.toFixed(0)}  (Δ ${(kcal-est).toFixed(0)})`); }
}
if (!flags) console.log("  alle innerhalb Toleranz");

console.log("\n=== gesättigt > Gesamtfett ===");
let sf = 0;
for (const [name, kcal, fat, sat] of rows) if (sat > fat) { sf++; console.log(`  ⚠ ${name}: Fett ${fat}, gesättigt ${sat}`); }
if (!sf) console.log("  keine");

console.log("\n=== Größen-Skalierung Bases (Regular/Small, Large/Small) ===");
for (const base of ["Veg Chow Mein", "Egg Fried Rice", "Cauli Rice"]) {
  const s = rows.find(r => r[0] === base + " Small")[1];
  const r = rows.find(r => r[0] === base + " Regular")[1];
  const l = rows.find(r => r[0] === base + " Large")[1];
  console.log(`  ${base}: Small ${s} | Regular ${r} (×${(r/s).toFixed(2)}) | Large ${l} (×${(l/s).toFixed(2)})`);
}

console.log("\n=== Toppings: Regular == Large? (für Box-Modell wichtig) ===");
let neq = 0;
for (const t of ["Sweet&Sour","Caramel Drizzle","Chinese Curry","S&P Chicken","S&P Potatoes","Coconut Crave","Firecracker","No Beef Teriyaki","Cherry Kiss","Soy-Mazing"]) {
  const r = rows.find(x => x[0] === t + " Regular"), l = rows.find(x => x[0] === t + " Large");
  if (!r || !l) { console.log(`  ?? ${t}: fehlt`); continue; }
  if (r[1] !== l[1]) { neq++; console.log(`  ⚠ ${t}: Regular ${r[1]} != Large ${l[1]}`); }
}
console.log(neq ? "" : "  alle Regular == Large ✓");
