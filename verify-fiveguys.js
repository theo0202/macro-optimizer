// Sanity-Check der Five-Guys-Daten: komponiert Burger/Hot Dogs aus den Komponenten (wie fiveguys-update.js)
// und prueft kcal ~ 4*carb + 4*protein + 9*fat sowie gesaettigt <= Fett fuer alle finalen Items. node verify-fiveguys.js
const raw = require("./data/fiveguys-raw.json");
const KEYS = ["kcal", "fat", "sat", "carbs", "sugars", "fibre", "protein", "salt"];
const R2 = v => Math.round(v * 100) / 100;
const C = raw.components;
const compose = parts => { const o = {}; for (const k of KEYS) o[k] = 0; for (const { comp, n } of parts) for (const k of KEYS) o[k] += (comp[k] || 0) * n; for (const k of KEYS) o[k] = R2(o[k]); return o; };

const items = [];
for (const b of raw.burgers) items.push({ name: b.name, _t: "burger", ...compose([{ comp: C.patty, n: b.patties }, { comp: C.burger_bun, n: 1 }, { comp: C.cheese, n: b.cheese }, { comp: C.bacon, n: b.bacon }]) });
for (const s of raw.sandwiches) items.push({ ...s, _t: "sandwich" });
for (const f of raw.fries_base) items.push({ ...f, _t: "fries" });
for (const f of raw.fries_base) items.push({ name: f.name.replace(/Fries/, "Cajun Fries"), _t: "cajun", ...compose([{ comp: f, n: 1 }, { comp: raw.cajun_seasoning, n: 1 }]) });
for (const l of raw.loaded) items.push({ ...l, _t: "loaded" });
for (const t of raw.toppings) items.push({ ...t, _t: "topping" });

console.log("=== kcal-Plausibilitaet (est = 4*carb + 4*protein + 9*fat) ===");
let flags = 0;
for (const r of items) {
  const est = 4 * r.carbs + 4 * r.protein + 9 * r.fat;
  const d = r.kcal - est;
  if (Math.abs(d) > 25 && Math.abs(d) / Math.max(r.kcal, 1) > 0.12) { flags++; console.log(`  ! ${r.name} [${r._t}]: angegeben ${r.kcal}, aus Makros ~${est.toFixed(0)} (delta ${d > 0 ? "+" : ""}${d.toFixed(0)})`); }
}
if (!flags) console.log("  alle innerhalb Toleranz");

console.log("\n=== gesaettigt > Gesamtfett ===");
let sf = 0;
for (const r of items) if (r.sat > r.fat + 1e-9) { sf++; console.log(`  ! ${r.name}: Fett ${r.fat}, gesaettigt ${r.sat}`); }
if (!sf) console.log("  keine");

console.log("\n=== Uebersicht ===");
const byT = {}; for (const i of items) byT[i._t] = (byT[i._t] || 0) + 1;
console.log("  " + Object.entries(byT).map(([k, v]) => k + ":" + v).join(", "));
console.log("  Mains (burger+sandwich): " + items.filter(i => ["burger", "sandwich"].includes(i._t)).length);
console.log("  Fries (fries+cajun+loaded): " + items.filter(i => ["fries", "cajun", "loaded"].includes(i._t)).length);
console.log("  Toppings: " + items.filter(i => i._t === "topping").length);
