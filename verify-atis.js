// Sanity-Check der Atis-Rohdaten: kcal ~ 4*protein + 4*carbs + 9*fat (+ Toleranz für Fibre/Rundung/Alkohol)
const raw = require("./data/atis-raw.json");
const items = raw.items;

const bySection = {};
for (const it of items) {
  const key = it.section + (it.portion ? " (" + it.portion + ")" : "");
  bySection[key] = (bySection[key] || 0) + 1;
}
console.log("=== Items pro Section (gesamt " + items.length + ") ===");
for (const [k, v] of Object.entries(bySection)) console.log(`  ${k}: ${v}`);

console.log("\n=== kcal-Plausibilität (Abweichung > 25% UND > 25 kcal) ===");
let flags = 0;
for (const it of items) {
  const est = 4 * it.protein + 4 * it.carbs + 9 * it.fat;
  const diff = it.kcal - est;
  const pct = it.kcal > 0 ? Math.abs(diff) / it.kcal : 0;
  if (Math.abs(diff) > 25 && pct > 0.25) {
    flags++;
    console.log(`  ⚠ ${it.name} [${it.section}${it.portion ? "/" + it.portion : ""}]: angegeben ${it.kcal}, aus Makros ~${est} (Δ${diff > 0 ? "+" : ""}${diff})`);
  }
}
if (!flags) console.log("  keine groben Abweichungen");

console.log("\n=== Doppelte Namen (Regular+Large erwartet bei bases/dressings) ===");
const names = {};
for (const it of items) names[it.name] = (names[it.name] || 0) + 1;
console.log("  " + Object.entries(names).filter(([, c]) => c > 1).map(([n, c]) => `${n}×${c}`).join(", "));
console.log("\nSeasonal-Items (saisonal): " + items.filter(x => x.seasonal).length + " / " + items.length);
