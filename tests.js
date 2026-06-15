// Logik-Tests für index.html (ohne Browser): node tests.js
// 1) Footlong-Salad-Regel: Footlong verdoppelt alles AUSSER Salads
// 2) Farmer-J-Optimizer: Komponenten-Summen, Order-Rule-Constraints, freeOnly
const fs = require("fs");
const html = fs.readFileSync(__dirname + "/index.html", "utf8");
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.error("FAIL: inline <script> nicht gefunden"); process.exit(1); }

global.React = { useState: () => [null, () => {}], useMemo: (f) => f, createElement: () => null };
global.ReactDOM = { render: () => {} };
global.document = { getElementById: () => null };

(0, eval)(m[1] + "\n;globalThis.__t = { D, FJ, ITSU, PRET, NANDOS, UG, WAGA, GDK, ATIS, TFC, STD_SALAD, sumN, optimize, optimizeFJ, optimizeItsu, optimizePret, optimizeNandos, optimizeUG, optimizeWaga, optimizeGDK, optimizeAtis, optimizeTFC, optimizeAll, sortResults, parseMacroScreenshot };");
const T = globalThis.__t;

let failures = 0;
const approx = (a, b) => Math.abs(a - b) < 0.05;
const check = (name, actual, expected) => {
  const ok = typeof expected === "boolean" ? actual === expected : approx(actual, expected);
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}: ${actual}${typeof expected === "boolean" ? "" : ` (erwartet ${expected})`}`);
};

// ── Subway: Footlong-Salad-Regel ──
const bread = T.D.breads.find(b => b.id === "wholegrain");
const prot = T.D.proteins.find(p => p.id === "roast_chicken");
const cheese = T.D.cheeses.find(c => c.id === "none");
const saladKcal = T.STD_SALAD.reduce((s, x) => s + x.kcal, 0);

const six = T.sumN([bread, prot, cheese], 1, T.STD_SALAD);
check("Subway 6inch kcal", six.kcal, bread.kcal + prot.kcal + saladKcal);

const foot = T.sumN([bread, prot, cheese], 2, T.STD_SALAD);
check("Subway Footlong kcal (Salad ×1)", foot.kcal, 2 * (bread.kcal + prot.kcal) + saladKcal);

const t1 = { protein: 60, carbs: 90, fat: 24, kcal: 816, fibMin: null, fibMax: null, sMin: null, sMax: null };
const res = T.optimize(t1, "macros", {}, true, true, "wholegrain", "footlong");
const top = res[0];
const doubled = [top.bread, top.protein, top.cheese, ...top.extras, ...top.sauces].reduce((s, x) => s + x.kcal, 0);
check("Subway Optimizer Footlong Top-1", top.nutrition.kcal, 2 * doubled + saladKcal);

// ── Farmer J: Datenumfang ──
check("FJ Mains", T.FJ.mains.length, 5);
check("FJ Bases", T.FJ.bases.length, 4);
check("FJ Sides", T.FJ.sides.length, 9);
check("FJ Toppings", T.FJ.toppings.length, 3);
check("FJ Sauce/Dip/Topping", T.FJ.sdt.length, 8);
check("FJ Sets", T.FJ.sets.length, 13);

// ── Farmer J: Optimizer-Korrektheit ──
const t2 = { protein: 45, carbs: 60, fat: 25, kcal: 645, fibMin: null, fibMax: null, sMin: null, sMax: null };

// freeOnly: keine bezahlten Add-ons in den Ergebnissen
const free = T.optimizeFJ(t2, "macros", {}, true);
check("FJ freeOnly: keine Add-ons", free.every(r => r.tops.length === 0 && r.sdt.length === 0), true);

// Alle Ergebnisse: Nutrition == Summe der Komponenten, max 2 Sides, max 1 Sauce/Dip/Topping
const paid = T.optimizeFJ(t2, "macros", {}, false);
let sumOk = true, ruleOk = true;
for (const r of [...free, ...paid]) {
  const comps = r.set ? [r.set] : [r.main, r.fjBase, ...r.sides, ...r.tops, ...r.sdt];
  const exp = Math.round(comps.reduce((s, x) => s + x.kcal, 0) * 10) / 10;
  if (!approx(r.nutrition.kcal, exp)) sumOk = false;
  if (r.sides.length > 2 || r.sdt.length > 1) ruleOk = false;
}
check("FJ Nutrition == Komponenten-Summe (alle Ergebnisse)", sumOk, true);
check("FJ Order Rules (≤2 Sides, ≤1 Sauce/Dip/Topping)", ruleOk, true);

// Sets tauchen als Kandidaten auf (hohes Kalorienziel → Set sollte gut ranken)
const t3 = { protein: 49, carbs: 24, fat: 47, kcal: 715, fibMin: null, fibMax: null, sMin: null, sMax: null };
const setRes = T.optimizeFJ(t3, "macros", {}, true);
check("FJ Sets als Kandidaten enthalten", setRes.some(r => r.set), true);

// Spot-Checks: aktualisierte Werte von farmerj.com (Juni 2026), ersetzen ältere Excel-Werte
check("FJ Hummus kcal (Web-Update)", T.FJ.sdt.find(x => x.id === "chunky_butter_bean_hummus").kcal, 238);
check("FJ Sesame Cabbage kcal (Web-Update)", T.FJ.bases.find(x => x.id === "sesame_cabbage_april_2026").kcal, 134);
check("FJ The Med kcal (Web-Update)", T.FJ.sets.find(x => x.id === "the_med_april_2026").kcal, 945);
check("FJ Salmon Bowl kcal (Web-Update)", T.FJ.sets.find(x => x.id === "the_salmon_bowl_april_2026").kcal, 717);
check("FJ Kale Miso Slaw Side kcal (Web-Update)", T.FJ.sides.find(x => x.id === "kale_miso_slaw").kcal, 112);

// ── Itsu ──
check("Itsu Items vorhanden (>=100, re-crawl-stabil)", T.ITSU.items.length >= 100, true);
check("Itsu Kategorien", T.ITSU.cats.length, 9);
check("Itsu Thai salmon curry kcal", T.ITSU.items.find(x => x.id.includes("salmon_thai_rice_bowl")).kcal, 736);
check("Itsu edamame entfernt (User-Ausschluss)", !T.ITSU.items.find(x => x.name === "edamame"), true);
check("Itsu chocolate edamame bleibt", !!T.ITSU.items.find(x => x.name === "chocolate edamame"), true);

const itsuCatsDefault = {};
T.ITSU.cats.forEach(c => itsuCatsDefault[c.id] = c.on);
const t4 = { protein: 40, carbs: 70, fat: 20, kcal: 620, fibMin: null, fibMax: null, sMin: null, sMax: null };

// Alle Ergebnisse: Summen korrekt, 1–3 Items, nur aktive Kategorien
const ri3 = T.optimizeItsu(t4, "macros", {}, itsuCatsDefault, 3, false);
let iSumOk = true, iLenOk = true, iCatOk = true;
for (const r of ri3) {
  const exp = Math.round(r.items.reduce((s, x) => s + x.kcal, 0) * 10) / 10;
  if (!approx(r.nutrition.kcal, exp)) iSumOk = false;
  if (r.items.length < 1 || r.items.length > 3) iLenOk = false;
  if (!r.items.every(x => itsuCatsDefault[x.cat])) iCatOk = false;
}
check("Itsu Nutrition == Summe (alle Ergebnisse)", iSumOk, true);
check("Itsu 1–3 Items", iLenOk, true);
check("Itsu nur aktive Kategorien", iCatOk, true);

// maxItems=1 → nur Einzel-Items
const ri1 = T.optimizeItsu(t4, "macros", {}, itsuCatsDefault, 1, false);
check("Itsu maxItems=1", ri1.every(r => r.items.length === 1), true);

// Duplikate erlaubt: Ziel = exakt 2× Thai salmon curry → Doppel muss in Top 20 sein
const ts = T.ITSU.items.find(x => x.id.includes("salmon_thai_rice_bowl"));
const t5 = { protein: 2 * ts.protein, carbs: 2 * ts.carbs, fat: 2 * ts.fat, kcal: 2 * ts.kcal, fibMin: null, fibMax: null, sMin: null, sMax: null };
const ri2 = T.optimizeItsu(t5, "macros", {}, itsuCatsDefault, 2, false);
check("Itsu Duplikate (2× gleiches Item) möglich", ri2.some(r => r.items.length === 2 && r.items[0].id === r.items[1].id), true);

// Getränke sind IMMER ausgeschlossen — selbst wenn alle Kategorie-Chips aktiv sind
const allCats = {};
T.ITSU.cats.forEach(c => allCats[c.id] = true);
const drinkIds = new Set(T.ITSU.cats.filter(c => c.drink).map(c => c.id));
check("Itsu Drink-Kategorien geflaggt", drinkIds.size, 2);
const t6 = { protein: 1, carbs: 1, fat: 1, kcal: 17, fibMin: null, fibMax: null, sMin: null, sMax: null };
const riAll = T.optimizeItsu(t6, "macros", {}, allCats, 2, false);
check("Itsu Getränke nie in Ergebnissen", riAll.every(r => r.items.every(x => !drinkIds.has(x.cat))), true);

// Schalter "No soups, desserts, snacks etc." → keine soups/noodles/desserts mehr
const lightExcl = new Set(["healthy_soups", "hot_noodles", "desserts_snacks"]);
const riNS = T.optimizeItsu(t4, "macros", {}, allCats, 3, true);
check("Itsu Schalter filtert soups/noodles/desserts", riNS.every(r => r.items.every(x => !lightExcl.has(x.cat))), true);
check("Itsu Schalter: trotzdem Ergebnisse", riNS.length > 0, true);

// Schalter "only sushi": nur sushi_poke, OHNE Poké-Bowls (aber Sashimi erlaubt)
const riSushi = T.optimizeItsu(t4, "macros", {}, allCats, 2, false, true, false);
check("Itsu 'only sushi': nur sushi_poke-Kategorie", riSushi.every(r => r.items.every(x => x.cat === "sushi_poke")), true);
check("Itsu 'only sushi': liefert Ergebnisse", riSushi.length > 0, true);
check("Itsu 'only sushi': KEINE Poké-Bowls", riSushi.every(r => r.items.every(x => !/poké|poke/i.test(x.name))), true);
check("Itsu 'only sushi': Sashimi erlaubt", riSushi.some(r => r.items.some(x => /sashimi/i.test(x.name))), true);

// Schalter "only sushi w/o sashimi": sushi_poke minus Poké minus Sashimi
const riNoSashimi = T.optimizeItsu(t4, "macros", {}, allCats, 2, false, false, true);
check("Itsu 'w/o sashimi': nur sushi_poke", riNoSashimi.every(r => r.items.every(x => x.cat === "sushi_poke")), true);
check("Itsu 'w/o sashimi': kein Sashimi", riNoSashimi.every(r => r.items.every(x => !/sashimi/i.test(x.name))), true);
check("Itsu 'w/o sashimi': keine Poké-Bowls", riNoSashimi.every(r => r.items.every(x => !/poké|poke/i.test(x.name))), true);
check("Itsu Sashimi-Item existiert", !!T.ITSU.items.find(x => /sashimi/i.test(x.name)), true);
check("Itsu Poké-Bowls existieren grundsätzlich", T.ITSU.items.filter(x => /poké|poke/i.test(x.name)).length >= 3, true);

// ── Pret ──
check("Pret Items vorhanden (>=120, re-crawl-stabil)", T.PRET.items.length >= 120, true);
check("Pret Kategorien", T.PRET.cats.length, 13);
check("Pret Chicken Salad kcal", T.PRET.items.find(x => x.id === "chicken_salad").kcal, 529);
check("Pret relevante Items (Whitelist)", T.PRET.items.filter(x => x.rel).length, 67);
check("Pret Apple + Banana entfernt (User-Ausschluss)", !T.PRET.items.find(x => x.name === "Apple" || x.name === "Banana"), true);
check("Pret The Big Apple Bowl bleibt (nicht versehentlich gematcht)", !!T.PRET.items.find(x => x.id === "the_big_apple_bowl"), true);

const pretAll = {};
T.PRET.cats.forEach(c => pretAll[c.id] = true);
const pretDrinks = new Set(T.PRET.cats.filter(c => c.drink).map(c => c.id));
const t7 = { protein: 40, carbs: 60, fat: 20, kcal: 580, fibMin: null, fibMax: null, sMin: null, sMax: null };

// Summen + Getränke-Ausschluss (alle Kategorien aktiv, Mini-Ziel macht Drinks attraktiv)
const rp = T.optimizePret(t7, "macros", {}, pretAll, 3, false, false);
let pSumOk = true;
for (const r of rp) {
  const exp = Math.round(r.items.reduce((s, x) => s + x.kcal, 0) * 10) / 10;
  if (!approx(r.nutrition.kcal, exp)) pSumOk = false;
}
check("Pret Nutrition == Summe (alle Ergebnisse)", pSumOk, true);
const rpTiny = T.optimizePret({ protein: 1, carbs: 1, fat: 1, kcal: 17, fibMin: null, fibMax: null, sMin: null, sMax: null }, "macros", {}, pretAll, 2, false, false);
check("Pret Getränke nie in Ergebnissen", rpTiny.every(r => r.items.every(x => !pretDrinks.has(x.cat))), true);

// Schalter 1: "only relevant items, no bullshit" → nur rel-Items (überstimmt Chips)
const rpRel = T.optimizePret(t7, "macros", {}, pretAll, 3, true, false);
check("Pret 'only relevant items': nur Whitelist", rpRel.every(r => r.items.every(x => x.rel)), true);

// Schalter 2: "Salads and protein pots only" → nur diese Kategorie, hat Vorrang vor Schalter 1
const rpSal = T.optimizePret(t7, "macros", {}, pretAll, 3, true, true);
check("Pret 'Salads only': nur salads_and_protein_pots", rpSal.every(r => r.items.every(x => x.cat === "salads_and_protein_pots")), true);
check("Pret 'Salads only': liefert Ergebnisse", rpSal.length > 0, true);

// ── Nando's ──
check("Nando's Items vorhanden (>=100, re-crawl-stabil)", T.NANDOS.items.length >= 100, true);
check("Nando's Kategorien", T.NANDOS.cats.length, 11);
check("Nando's The Lunch Fix in den Daten", !!T.NANDOS.cats.find(c => c.id === "the_lunch_fix"), true);
check("Nando's Sol Bowl kcal (aktuelles Menü)", T.NANDOS.items.find(x => x.id === "sol_bowl").kcal, 583);
check("Nando's Chicken Butterfly kcal", T.NANDOS.items.find(x => x.id === "chicken_butterfly").kcal, 332);
check("Nando's Chicken Butterfly Protein (mg->g)", T.NANDOS.items.find(x => x.id === "chicken_butterfly").protein, 59.4);
check("Nando's Sides-Portionssplit (Spicy Rice Large)", T.NANDOS.items.find(x => x.id === "spicy_rice_large").kcal, 492);
check("Nando's: keine Drinks in den Daten", T.NANDOS.cats.every(c => c.id !== "drinks") && T.NANDOS.items.every(x => x.cat !== "drinks"), true);
check("Nando's: 2022-Altlast 'Mixed Leaf Salad' weg", T.NANDOS.items.every(x => !x.id.startsWith("mixed_leaf")), true);
// Wings/Livers sind jetzt in den Daten, aber wings:true geflaggt (Schalter "No wings / chicken livers")
check("Nando's Wings/Livers geflaggt (10 Items, inkl. XL Wing Platter)", T.NANDOS.items.filter(x => x.wings).length, 10);
check("Nando's Corn geflaggt (2 Items)", T.NANDOS.items.filter(x => x.corn).length, 2);
check("Nando's XL Wing Platter jetzt als wings geflaggt", !!T.NANDOS.items.find(x => x.id === "xl_wing_platter").wings, true);

const nanAll = {};
T.NANDOS.cats.forEach(c => nanAll[c.id] = true);
const t8 = { protein: 60, carbs: 50, fat: 15, kcal: 575, fibMin: null, fibMax: null, sMin: null, sMax: null };

const rn = T.optimizeNandos(t8, "macros", {}, nanAll, 3, false, false);
let nSumOk = true, nLenOk = true;
for (const r of rn) {
  const exp = Math.round(r.items.reduce((s, x) => s + x.kcal, 0) * 10) / 10;
  if (!approx(r.nutrition.kcal, exp)) nSumOk = false;
  if (r.items.length < 1 || r.items.length > 3) nLenOk = false;
}
check("Nando's Nutrition == Summe (alle Ergebnisse)", nSumOk, true);
check("Nando's 1–3 Items", nLenOk, true);

// Schalter "No desserts, Lunch Fix & platters" → keine Desserts/Lunch Fix/Sharing Platters mehr
const nanExcl = new Set(["desserts", "the_lunch_fix", "sharing_platters"]);
const rnSwitch = T.optimizeNandos(t8, "macros", {}, nanAll, 3, true, false);
check("Nando's Schalter filtert Desserts, Lunch Fix & Platters", rnSwitch.every(r => r.items.every(x => !nanExcl.has(x.cat))), true);
check("Nando's Schalter: trotzdem Ergebnisse", rnSwitch.length > 0, true);

// Schalter "No sauces" → keine sauce:true-Items (Dips + Bottles + Drizzle)
check("Nando's Saucen geflaggt (14)", T.NANDOS.items.filter(x => x.sauce).length, 14);
check("Nando's Gravy ist Sauce", !!T.NANDOS.items.find(x => x.id === "peri_chicken_gravy").sauce, true);
check("Nando's PERi-Honey ist Sauce", !!T.NANDOS.items.find(x => x.id === "peri_honey").sauce, true);
check("Nando's Drizzle ist Sauce", !!T.NANDOS.items.find(x => x.id === "peri_peri_drizzle").sauce, true);
check("Nando's Halloumi ist KEINE Sauce", !T.NANDOS.items.find(x => x.id === "grilled_halloumi_cheese").sauce, true);
const t9 = { protein: 5, carbs: 8, fat: 12, kcal: 160, fibMin: null, fibMax: null, sMin: null, sMax: null }; // klein → Saucen wären attraktiv
const rnNoSauce = T.optimizeNandos(t9, "macros", {}, nanAll, 2, false, true);
check("Nando's 'No sauces' filtert Saucen", rnNoSauce.every(r => r.items.every(x => !x.sauce)), true);
const rnWithSauce = T.optimizeNandos(t9, "macros", {}, nanAll, 2, false, false);
check("Nando's ohne Schalter: Saucen erlaubt (Gegenprobe)", rnWithSauce.some(r => r.items.some(x => x.sauce)), true);

// Schalter "No grilled pineapple": Grilled Pineapple nie in Ergebnissen
check("Nando's Grilled Pineapple existiert", !!T.NANDOS.items.find(x => x.id === "grilled_pineapple"), true);
const tPine = { protein: 4, carbs: 9, fat: 4, kcal: 88, fibMin: null, fibMax: null, sMin: null, sMax: null }; // nah an Pineapple (37 kcal) → würde sonst auftauchen
const rnPine = T.optimizeNandos(tPine, "macros", {}, nanAll, 2, false, false, true);
check("Nando's 'No grilled pineapple' filtert es raus", rnPine.every(r => r.items.every(x => x.id !== "grilled_pineapple")), true);
const rnNoPineOff = T.optimizeNandos(tPine, "macros", {}, nanAll, 2, false, false, false);
check("Nando's ohne Schalter: Pineapple erlaubt (Gegenprobe)", rnNoPineOff.some(r => r.items.some(x => x.id === "grilled_pineapple")), true);

// Schalter "No wings / chicken livers": wings:true raus / an gelassen
const tWing = { protein: 100, carbs: 5, fat: 40, kcal: 780, fibMin: null, fibMax: null, sMin: null, sMax: null }; // nah an Wings (high protein)
const rnNoWings = T.optimizeNandos(tWing, "macros", {}, nanAll, 2, false, false, false, true, false);
check("Nando's 'No wings': keine wings:true-Items", rnNoWings.every(r => r.items.every(x => !x.wings)), true);
const rnWingsOff = T.optimizeNandos(tWing, "macros", {}, nanAll, 2, false, false, false, false, false);
check("Nando's ohne Schalter: Wings erlaubt (Gegenprobe)", rnWingsOff.some(r => r.items.some(x => x.wings)), true);

// Schalter "No Corn on the Cob": corn:true raus / an gelassen
const tCorn = { protein: 5, carbs: 25, fat: 9, kcal: 200, fibMin: null, fibMax: null, sMin: null, sMax: null };
const rnNoCorn = T.optimizeNandos(tCorn, "macros", {}, nanAll, 2, false, false, false, false, true);
check("Nando's 'No Corn': keine corn:true-Items", rnNoCorn.every(r => r.items.every(x => !x.corn)), true);
const rnCornOff = T.optimizeNandos(tCorn, "macros", {}, nanAll, 2, false, false, false, false, false);
check("Nando's ohne Schalter: Corn erlaubt (Gegenprobe)", rnCornOff.some(r => r.items.some(x => x.corn)), true);

// ── Urban Greens (NUR Build Your Own — fertige Gerichte bewusst entfernt) ──
check("UG: keine fertigen Gerichte mehr (nur BYO)", T.UG.pre === undefined, true);
check("UG Komponenten (greens/carbs/prots/veg/tops/dress/scoops)",
  [T.UG.greens.length, T.UG.carbs.length, T.UG.prots.length, T.UG.veg.length, T.UG.tops.length, T.UG.dress.length, T.UG.scoops.length].join(",") === "2,4,9,14,6,6,9", true);
check("UG Chicken kcal (Guide)", T.UG.prots.find(x => x.id === "chicken").kcal, 103);
check("UG Quinoa kcal (Guide)", T.UG.carbs.find(x => x.id === "quinoa").kcal, 161);
check("UG Avocado Whole = 2x Avocado (abgeleitet)", T.UG.prots.find(x => x.id === "avocado_whole").kcal === 230 && T.UG.prots.find(x => x.id === "avocado_whole").fat === 30, true);
check("UG ausgeschlossene Items fehlen (keine Makros)", !T.UG.prots.find(x => /piri|lemon_herb/.test(x.id)) && !T.UG.carbs.find(x => x.id === "red_rice_warm"), true);
check("UG User-Ausschlüsse fehlen (Coriander/Mint/Parsley/Olive Oil)",
  !T.UG.tops.find(x => /coriander|mint|parsley/.test(x.id)) && !T.UG.dress.find(x => x.id === "olive_oil"), true);

const t10 = { protein: 45, carbs: 50, fat: 20, kcal: 560, fibMin: null, fibMax: null, sMin: null, sMax: null };

// Modus "salad" und "tray": Struktur-Regeln + Summen
const ub = T.optimizeUG(t10, "macros", {}, "salad", false, false);
const ut = T.optimizeUG(t10, "macros", {}, "tray", false, false);
let uVeg3 = true, uTops2 = true, uSum = true, uXtra = true;
for (const r of [...ub, ...ut]) {
  if (r.veg.length !== 3) uVeg3 = false;
  if (r.tops.length !== 2) uTops2 = false;
  if (r.extras.length > 2) uXtra = false;
  const comps = [r.green, r.carb, r.prot, ...r.veg, r.scoop, r.prot2, ...r.tops, r.dress, ...r.extras.map(e => e.it)].filter(Boolean);
  const exp = Math.round(comps.reduce((s, x) => s + x.kcal, 0) * 10) / 10;
  if (!approx(r.nutrition.kcal, exp)) uSum = false;
}
check("UG byo: genau 3 Veg/Pickles", uVeg3, true);
check("UG byo: genau 2 Toppings (ohne No-nuts)", uTops2, true);
check("UG byo: max 2 Extras", uXtra, true);
check("UG byo: Nutrition == Komponenten-Summe", uSum, true);
check("UG Salad-Modus: nur Salads, kein Scoop", ub.length > 0 && ub.every(r => r.kind === "salad" && !r.scoop), true);
check("UG Tray-Modus: nur Trays, Pflicht-Scoop, keine Green Base, kein Standard-Dressing", ut.length > 0 && ut.every(r => r.kind === "tray" && !!r.scoop && !r.green && !r.dress), true);

// "No nuts": keine Toppings — auch nicht als Extras (beide Modi)
const un = [...T.optimizeUG(t10, "macros", {}, "salad", true, false), ...T.optimizeUG(t10, "macros", {}, "tray", true, false)];
const topIds = new Set(T.UG.tops.map(x => x.id));
check("UG 'No nuts': 0 Toppings", un.every(r => r.tops.length === 0), true);
check("UG 'No nuts': keine Topping-Extras", un.every(r => r.extras.every(e => !topIds.has(e.it.id))), true);

// "No Dressing": nie ein Dressing — auch nicht als Extra-Dressing (beide Modi)
const ud = [...T.optimizeUG(t10, "macros", {}, "salad", false, true), ...T.optimizeUG(t10, "macros", {}, "tray", false, true)];
check("UG 'No Dressing': kein Dressing", ud.every(r => !r.dress && r.extras.every(e => e.kind !== "dressing")), true);

// Extra-Veg-Pool: Cucumber ist auf Deliveroo NICHT als Extra wählbar
const ubX = [...ub, ...ut, ...un, ...ud];
check("UG Extras: nie Cucumber als Extra", ubX.every(r => r.extras.every(e => !(e.kind === "veg" && e.it.id === "cucumber"))), true);

// ── Wagamama (Copy-Paste-Batches, wächst) ──
check("Wagamama Items vorhanden (>=20, wächst mit Batches)", T.WAGA.items.length >= 20, true);
check("Wagamama Kategorien (5)", T.WAGA.cats.length, 5);
check("Wagamama grilled duck donburi kcal", T.WAGA.items.find(x => x.id === "grilled_duck_donburi").kcal, 1085);
check("Wagamama grilled duck donburi Protein", T.WAGA.items.find(x => x.id === "grilled_duck_donburi").protein, 53.9);
check("Wagamama grilled chicken ramen kcal", T.WAGA.items.find(x => x.id === "grilled_chicken_ramen").kcal, 490);
check("Wagamama tea-stained egg kcal", T.WAGA.items.find(x => x.id === "tea_stained_egg").kcal, 69);

const wagAll = {};
T.WAGA.cats.forEach(c => wagAll[c.id] = true);
const t11 = { protein: 45, carbs: 70, fat: 15, kcal: 595, fibMin: null, fibMax: null, sMin: null, sMax: null };

const rw = T.optimizeWaga(t11, "macros", {}, wagAll, 3, false);
let wSumOk = true, wLenOk = true;
for (const r of rw) {
  const exp = Math.round(r.items.reduce((s, x) => s + x.kcal, 0) * 10) / 10;
  if (!approx(r.nutrition.kcal, exp)) wSumOk = false;
  if (r.items.length < 1 || r.items.length > 3) wLenOk = false;
}
check("Wagamama Nutrition == Summe (alle Ergebnisse)", wSumOk, true);
check("Wagamama 1–3 Items", wLenOk, true);

// Schalter "No Ramen": die 4 Ramen (tantanmen/grilled chicken/chilli chicken/kare burosu) nie in Ergebnissen
const rwNR = T.optimizeWaga(t11, "macros", {}, wagAll, 3, true);
check("Wagamama 'No Ramen' filtert Ramen-Kategorie", rwNR.every(r => r.items.every(x => x.cat !== "ramen")), true);
const rwMit = T.optimizeWaga(t11, "macros", {}, wagAll, 2, false);
check("Wagamama ohne Schalter: Ramen erlaubt (Gegenprobe)", rwMit.some(r => r.items.some(x => x.cat === "ramen")), true);

// ── À la carte: ∞-Modus (maxN=Infinity) ──
const tBig = { protein: 130, carbs: 200, fat: 50, kcal: 1770, fibMin: null, fibMax: null, sMin: null, sMax: null };
const rInf = T.optimizeWaga(tBig, "macros", {}, wagAll, Infinity, false);
let infSumOk = true, infCapOk = true;
for (const r of rInf) {
  if (r.items.length > 12) infCapOk = false;
  const exp = Math.round(r.items.reduce((s, x) => s + x.kcal, 0) * 10) / 10;
  if (!approx(r.nutrition.kcal, exp)) infSumOk = false;
}
check("∞-Modus: Kombos mit 4+ Items möglich", rInf.some(r => r.items.length >= 4), true);
check("∞-Modus: Sicherheitsdeckel 12 Items", infCapOk, true);
check("∞-Modus: Nutrition == Summe", infSumOk, true);
const rCap3 = T.optimizeWaga(tBig, "macros", {}, wagAll, 3, false);
check("maxN=3 deckelt weiterhin bei 3", rCap3.every(r => r.items.length <= 3), true);
const rCap5 = T.optimizeWaga(tBig, "macros", {}, wagAll, 5, false);
check("maxN=5: deckelt bei 5", rCap5.every(r => r.items.length <= 5), true);
check("maxN=5: nutzt 4-5 Items wenn sinnvoll", rCap5.some(r => r.items.length >= 4), true);
const rInfItsu = T.optimizeItsu(tBig, "macros", {}, itsuCatsDefault, Infinity, false);
check("∞-Modus funktioniert auch bei Itsu (4+ Items)", rInfItsu.some(r => r.items.length >= 4), true);

// ── Sort by (Accuracy-Sortierung der Ergebnisse) ──
const srcRes = T.optimizeWaga(t11, "macros", {}, wagAll, 3, false);
const tgts = { kcal: t11.kcal, protein: t11.protein, carbs: t11.carbs, fat: t11.fat };
const monotone = (arr, key, tgt) => arr.every((r, i) => i === 0 || Math.abs(arr[i - 1].nutrition[key] - tgt) <= Math.abs(r.nutrition[key] - tgt));
check("sortResults 'score' = unverändert", T.sortResults(srcRes, "score", tgts) === srcRes, true);
check("sortResults kcal: aufsteigende |Ist−Ziel|", monotone(T.sortResults(srcRes, "kcal", tgts), "kcal", tgts.kcal), true);
check("sortResults protein: aufsteigende |Ist−Ziel|", monotone(T.sortResults(srcRes, "protein", tgts), "protein", tgts.protein), true);
check("sortResults fat: aufsteigende |Ist−Ziel|", monotone(T.sortResults(srcRes, "fat", tgts), "fat", tgts.fat), true);
check("sortResults mutiert Original nicht", srcRes[0].score <= srcRes[1].score, true);

// ── German Doner Kebab (GDK, à la carte, Copy-Paste-Daten) ──
check("GDK Items (69: 60 + 9 Sides)", T.GDK.items.length, 69);
check("GDK Doner Burrito Mix entfernt (Datenfehler)", !T.GDK.items.find(x => x.id === "doner_burrito_mix"), true);
check("GDK Sides-Kategorie (9 Items)", T.GDK.items.filter(x => x.cat === "sides").length, 9);
check("GDK Fries (Large) kcal", T.GDK.items.find(x => x.id === "fries_large").kcal, 342);
check("GDK Chilli Cheese Bites protein", T.GDK.items.find(x => x.id === "chilli_cheese_bites").protein, 10.5);
check("GDK Sides ohne Sauce-Flag", T.GDK.items.filter(x => x.cat === "sides").every(x => !x.sauce), true);
check("GDK Kategorien (8: + Sides)", T.GDK.cats.length, 8);
check("GDK OG Kebab Beef with sauce kcal", T.GDK.items.find(x => x.id === "og_kebab_beef_with_sauce").kcal, 994);
check("GDK OG Kebab Beef no sauce kcal", T.GDK.items.find(x => x.id === "og_kebab_beef_no_sauce").kcal, 744);
check("GDK Juniors-Kategorie standardmäßig aus", T.GDK.cats.find(c => c.id === "juniors").on, false);
check("GDK Rice Bowl Chicken Protein", T.GDK.items.find(x => x.id === "rice_bowl_chicken").protein, 47.5);

const gdkAll = {};
T.GDK.cats.forEach(c => gdkAll[c.id] = true);
const t12 = { protein: 50, carbs: 70, fat: 30, kcal: 750, fibMin: null, fibMax: null, sMin: null, sMax: null };

const rg = T.optimizeGDK(t12, "macros", {}, gdkAll, 3, false, false);
let gSumOk = true, gLenOk = true;
for (const r of rg) {
  const exp = Math.round(r.items.reduce((s, x) => s + x.kcal, 0) * 10) / 10;
  if (!approx(r.nutrition.kcal, exp)) gSumOk = false;
  if (r.items.length < 1 || r.items.length > 3) gLenOk = false;
}
check("GDK Nutrition == Summe (alle Ergebnisse)", gSumOk, true);
check("GDK 1–3 Items", gLenOk, true);

// Schalter "No Sauce": kein sauce:true-Item in den Ergebnissen
check("GDK Saucen-Items geflaggt (26)", T.GDK.items.filter(x => x.sauce).length, 26);
const rgNS = T.optimizeGDK(t12, "macros", {}, gdkAll, 3, true, false);
check("GDK 'No Sauce' filtert alle Sauce-Items", rgNS.every(r => r.items.every(x => !x.sauce)), true);
const rgWith = T.optimizeGDK(t12, "macros", {}, gdkAll, 2, false, false);
check("GDK ohne Schalter: Sauce erlaubt (Gegenprobe)", rgWith.some(r => r.items.some(x => x.sauce)), true);

// Schalter "No rice bowl": keine rice_bowls-Items
const rgNRB = T.optimizeGDK(t12, "macros", {}, gdkAll, 3, false, true);
check("GDK 'No rice bowl' filtert rice_bowls-Kategorie", rgNRB.every(r => r.items.every(x => x.cat !== "rice_bowls")), true);

// Beide Schalter kombiniert
const rgBoth = T.optimizeGDK(t12, "macros", {}, gdkAll, 3, true, true);
check("GDK beide Schalter: keine Sauce UND keine Rice Bowls", rgBoth.every(r => r.items.every(x => !x.sauce && x.cat !== "rice_bowls")), true);

// ── Atis (atisfood.com — Build Your Own Power Plate; Bowl-Flow folgt) ──
check("Atis bases (8: 4 greens + 4 carbs)", T.ATIS.bases.length, 8);
check("Atis basesL (4 large greens, reserviert)", T.ATIS.basesL.length, 4);
check("Atis mixed salads (4)", T.ATIS.mixed.length, 4);
check("Atis ingredients (16)", T.ATIS.ingredients.length, 16);
check("Atis proteins (8)", T.ATIS.proteins.length, 8);
check("Atis sauces (18: 3 Saucen + 15 Dressings)", T.ATIS.sauces.length, 18);
check("Atis saucesL (12 large Dressings, reserviert)", T.ATIS.saucesL.length, 12);
check("Atis crunches (7)", T.ATIS.crunches.length, 7);
check("Atis addons (9)", T.ATIS.addons.length, 9);
check("Atis doublePlate Bases (4 Carbs)", T.ATIS.bases.filter(x => x.doublePlate).length, 4);
check("Atis doublePlate Mixed (alle 4)", T.ATIS.mixed.every(x => x.doublePlate), true);
check("Atis Wholegrain Rice kcal", T.ATIS.bases.find(x => x.id === "wholegrain_rice").kcal, 67);
check("Atis Garlic Butter Steak Protein", T.ATIS.proteins.find(x => x.id === "garlic_butter_steak").protein, 42);
check("Atis Blackened Chicken kcal (Tabelle, nicht Deliveroo 204)", T.ATIS.proteins.find(x => x.id === "blackened_chicken").kcal, 260);
// Deliveroo-Renames angewendet
check("Atis Rename: Sesame Gochujang Cauliflower", !!T.ATIS.mixed.find(x => x.name === "Sesame Gochujang Cauliflower"), true);
check("Atis Rename: Roasted Broccoli", !!T.ATIS.ingredients.find(x => x.name === "Roasted Broccoli"), true);
check("Atis Rename: Avocado (Add-on)", !!T.ATIS.addons.find(x => x.name === "Avocado"), true);

const tA = { protein: 50, carbs: 60, fat: 25, kcal: 665, fibMin: null, fibMax: null, sMin: null, sMax: null };
const effA = it => (it.doublePlate ? 2 : 1) * it.kcal; // Power Plate: unterstrichene Items ×2

// Default (beide Schalter AN): Struktur-Regeln + Doppelportions-Summe
const ra = T.optimizeAtis(tA, "macros", {}, "plate", true, true);
let aSumOk = true, aStructOk = true;
for (const r of ra) {
  if (r.bases.length < 1 || r.bases.length > 2) aStructOk = false;
  if (!r.mixed) aStructOk = false;
  if (r.ing.length < 1 || r.ing.length > 2) aStructOk = false;
  if (r.prots.length > 3) aStructOk = false;
  const comps = [...r.bases, r.mixed, ...r.ing, ...r.prots, r.sauce, r.crunch, ...r.addons].filter(Boolean);
  const exp = Math.round(comps.reduce((s, x) => s + effA(x), 0) * 10) / 10;
  if (!approx(r.nutrition.kcal, exp)) aSumOk = false;
}
check("Atis Power Plate Struktur (1-2 Bases, 1 Mixed, 1-2 Ingr., ≤3 Prot.)", aStructOk, true);
check("Atis Nutrition == Summe MIT Doppelportion (×2 unterstrichen)", aSumOk, true);
check("Atis liefert Ergebnisse", ra.length > 0, true);
check("Atis Default-Schalter: nie Sauce/Crunch", ra.every(r => !r.sauce && !r.crunch), true);

// doublePlate wirklich ×2 (Ergebnis mit Wholegrain Rice trägt 134, nicht 67)
const withRice = ra.find(r => r.bases.some(b => b.id === "wholegrain_rice"));
if (withRice) check("Atis Wholegrain Rice zählt ×2 (134)", effA(withRice.bases.find(b => b.id === "wholegrain_rice")), 134);

// Hoch-Fett-Ziel macht Dressings + Crunches attraktiv → Gegenproben
const tFat = { protein: 40, carbs: 45, fat: 70, kcal: 970, fibMin: null, fibMax: null, sMin: null, sMax: null };
const raOff = T.optimizeAtis(tFat, "macros", {}, "plate", false, false);
check("Atis ohne Schalter: Sauce erscheint", raOff.some(r => r.sauce), true);
check("Atis ohne Schalter: Crunch erscheint", raOff.some(r => r.crunch), true);
// Summen auch im Schalter-aus-Modus korrekt (inkl. Sauce/Crunch/Add-ons)
let aSumOk2 = true;
for (const r of raOff) {
  const comps = [...r.bases, r.mixed, ...r.ing, ...r.prots, r.sauce, r.crunch, ...r.addons].filter(Boolean);
  const exp = Math.round(comps.reduce((s, x) => s + effA(x), 0) * 10) / 10;
  if (!approx(r.nutrition.kcal, exp)) aSumOk2 = false;
}
check("Atis Nutrition == Summe (Schalter aus, mit Sauce/Crunch)", aSumOk2, true);

// Nur "No sauce" (noSauce=true, noCrunch=false): keine Sauce, Crunch erlaubt
const raNoSauce = T.optimizeAtis(tFat, "macros", {}, "plate", false, true);
check("Atis 'No sauce': keine Sauce", raNoSauce.every(r => !r.sauce), true);
check("Atis 'No sauce': Crunch weiterhin möglich", raNoSauce.some(r => r.crunch), true);

// Nur "No crunch" (noCrunch=true, noSauce=false): kein Crunch, Sauce erlaubt
const raNoCrunch = T.optimizeAtis(tFat, "macros", {}, "plate", true, false);
check("Atis 'No crunch': kein Crunch", raNoCrunch.every(r => !r.crunch), true);
check("Atis 'No crunch': Sauce weiterhin möglich", raNoCrunch.some(r => r.sauce), true);

// Pool-Ausschlüsse (= aktueller Deliveroo-Power-Plate-Flow)
const raAll = [...ra, ...raOff, ...raNoSauce, ...raNoCrunch];
check("Atis: Kale + Cabbage Mix nie als Base", raAll.every(r => r.bases.every(b => b.id !== "kale_cabbage_mix")), true);
check("Atis: Focaccia nie als Add-on", raAll.every(r => r.addons.every(a => a.id !== "the_dusty_knuckle_focaccia")), true);
check("Atis: Pesto/Lemon Oregano/einzelnes Olive Oil nie als Sauce",
  raAll.every(r => !r.sauce || !["pesto_vinaigrette", "lemon_oregano_dressing", "the_olive_oil_guy_olive_oil", "balsamic_vinegar"].includes(r.sauce.id)), true);

// Bowl-Modus noch nicht implementiert (Daten vorhanden, Flow ausstehend)
check("Atis Bowl-Modus liefert (noch) keine Ergebnisse", T.optimizeAtis(tA, "macros", {}, "bowl", false, false).length, 0);

// ── The Fitness Chef (TFC, à la carte; Dishes in 3 Größen) ──
check("TFC Items (45: 39 Dishes + 6 Sides)", T.TFC.items.length, 45);
check("TFC Kategorien (4)", T.TFC.cats.length, 4);
check("TFC Meat Dishes (18)", T.TFC.items.filter(x => x.cat === "meat_dishes").length, 18);
check("TFC Fish Dishes (9)", T.TFC.items.filter(x => x.cat === "fish_dishes").length, 9);
check("TFC Pasta (12)", T.TFC.items.filter(x => x.cat === "pasta_dishes").length, 12);
check("TFC Sides (6)", T.TFC.items.filter(x => x.cat === "sides").length, 6);
check("TFC fish-Flag (15: 9 fish_dishes + 3 Salmon-Pasta + 3 Tuna-Pasta)", T.TFC.items.filter(x => x.fish).length, 15);
check("TFC Turkey-Pasta ausgelassen (kaputte Werte)", !T.TFC.items.find(x => /minced/i.test(x.name)), true);
check("TFC Pasta-Gericht vorhanden", !!T.TFC.items.find(x => x.id === "wholemeal_pasta_with_chicken_pesto_maintain_lean"), true);
check("TFC Salmon-Pasta ist fish", !!T.TFC.items.find(x => x.id === "wholemeal_pasta_with_salmon_weight_loss").fish, true);
check("TFC Tuna-Pasta ist fish", !!T.TFC.items.find(x => x.id === "wholemeal_pasta_with_tuna_weight_loss").fish, true);
check("TFC Beef-Pasta ist NICHT fish", !T.TFC.items.find(x => x.id === "wholemeal_pasta_beef_strips_weight_loss").fish, true);
check("TFC Größenvarianten (13× wl / 13× ml / 13× wg)",
  [T.TFC.items.filter(x => x.size === "wl").length, T.TFC.items.filter(x => x.size === "ml").length, T.TFC.items.filter(x => x.size === "wg").length].join(",") === "13,13,13", true);
check("TFC Sides haben keine size", T.TFC.items.filter(x => x.cat === "sides").every(x => !x.size), true);
check("TFC Name-Komposition (Größen-Suffix)", !!T.TFC.items.find(x => x.name === "Chicken Supreme (Weight Loss)"), true);
check("TFC Chicken Supreme (Maintain/Lean) kcal", T.TFC.items.find(x => x.id === "chicken_supreme_maintain_lean").kcal, 466.09);
check("TFC Chicken Supreme (Weight Gain) Protein", T.TFC.items.find(x => x.id === "chicken_supreme_weight_gain").protein, 68.52);
// Sodium(mg) -> salt(g) = sodium*2.5/1000
check("TFC salt aus sodium: Grilled Halloumi (850.04mg -> 2.13g)", T.TFC.items.find(x => x.id === "grilled_halloumi").salt, 2.13);
check("TFC salt aus sodium: Chicken Supreme WL (87.46mg -> 0.22g)", T.TFC.items.find(x => x.id === "chicken_supreme_weight_loss").salt, 0.22);

const tfcAll = {};
T.TFC.cats.forEach(c => tfcAll[c.id] = true);
const t13 = { protein: 45, carbs: 35, fat: 15, kcal: 455, fibMin: null, fibMax: null, sMin: null, sMax: null };
const rtfc = T.optimizeTFC(t13, "macros", {}, tfcAll, 3);
let tfcSumOk = true, tfcLenOk = true, tfcCatOk = true;
for (const r of rtfc) {
  const exp = Math.round(r.items.reduce((s, x) => s + x.kcal, 0) * 10) / 10;
  if (!approx(r.nutrition.kcal, exp)) tfcSumOk = false;
  if (r.items.length < 1 || r.items.length > 3) tfcLenOk = false;
  if (!r.items.every(x => tfcAll[x.cat])) tfcCatOk = false;
}
check("TFC Nutrition == Summe (alle Ergebnisse)", tfcSumOk, true);
check("TFC 1–3 Items", tfcLenOk, true);
check("TFC nur aktive Kategorien", tfcCatOk, true);

// Optimizer wählt die passende GRÖSSE: kleines Ziel → Weight Loss, großes Ziel → Weight Gain (maxN=1)
const tLo = { protein: 34.94, carbs: 28.11, fat: 10.39, kcal: 342, fibMin: null, fibMax: null, sMin: null, sMax: null }; // = Chicken Supreme WL
const tHi = { protein: 68.52, carbs: 47.95, fat: 14.31, kcal: 595, fibMin: null, fibMax: null, sMin: null, sMax: null }; // = Chicken Supreme WG
check("TFC wählt Weight Loss bei kleinem Ziel", T.optimizeTFC(tLo, "macros", {}, tfcAll, 1)[0].items[0].id === "chicken_supreme_weight_loss", true);
check("TFC wählt Weight Gain bei großem Ziel", T.optimizeTFC(tHi, "macros", {}, tfcAll, 1)[0].items[0].id === "chicken_supreme_weight_gain", true);
// Kategorie-Filter: nur Sides aktiv → nur Sides
const onlySides = { meat_dishes: false, fish_dishes: false, sides: true };
const rSides = T.optimizeTFC(t13, "macros", {}, onlySides, 3);
check("TFC Kategorie-Filter: nur Sides", rSides.length > 0 && rSides.every(r => r.items.every(x => x.cat === "sides")), true);

// Schalter "No fish": alle fish-Items raus / an gelassen (fettreiches Ziel macht Lachs attraktiv)
const tFish = { protein: 25, carbs: 19, fat: 27, kcal: 419, fibMin: null, fibMax: null, sMin: null, sMax: null };
const rFishOff = T.optimizeTFC(tFish, "macros", {}, tfcAll, 2, false);
check("TFC ohne 'No fish': Fisch erscheint (Gegenprobe)", rFishOff.some(r => r.items.some(x => x.fish)), true);
const rFishOn = T.optimizeTFC(tFish, "macros", {}, tfcAll, 2, true);
check("TFC 'No fish' filtert alle fish-Items (inkl. Salmon/Tuna-Pasta)", rFishOn.every(r => r.items.every(x => !x.fish)), true);
check("TFC 'No fish': trotzdem Ergebnisse", rFishOn.length > 0, true);

// ── "All restaurants" (restaurantsübergreifend; alle Exclude-Schalter an, Itsu only-sushi aus) ──
const tAllT = { protein: 40, carbs: 50, fat: 15, kcal: 535, fibMin: null, fibMax: null, sMin: null, sMax: null };
const rAll = T.optimizeAll(tAllT, "macros", {}, "footlong");
const RESTOS = ["subway", "farmerj", "itsu", "pret", "nandos", "ug", "wagamama", "gdk", "atis", "tfc"];
check("All: liefert Ergebnisse (1..20)", rAll.length > 0 && rAll.length <= 20, true);
check("All: jedes Ergebnis hat _resto + nutrition + score", rAll.every(r => r._resto && r.nutrition && typeof r.score === "number"), true);
check("All: nach Score aufsteigend sortiert", rAll.every((r, i) => i === 0 || rAll[i - 1].score <= r.score), true);
check("All: mehrere Restaurants vertreten (>=3)", new Set(rAll.map(r => r._resto)).size >= 3, true);
check("All: max 2 Treffer pro Restaurant (Vielfalt)", Object.values(rAll.reduce((m, r) => { m[r._resto] = (m[r._resto] || 0) + 1; return m; }, {})).every(c => c <= 2), true);
check("All: nur gültige _resto-Werte", rAll.every(r => RESTOS.includes(r._resto)), true);
check("All: TFC-Treffer ohne Fisch (No fish an)", rAll.filter(r => r._resto === "tfc").every(r => r.items.every(x => !x.fish)), true);

// ── Screenshot-Import-Parser (OCR-Text -> verbleibende Makros C/P/F + "Übrig"-kcal) ──
// Erwartet aus dem Beispiel: Carbs 341-54=287, Protein 184-52=132, Fat 69-9=60, kcal=Übrig 2267.
const OCR_CASES = [
  { name: "main_example", t: "Ubersicht\nGegessen        Ubrig        Verbrannt\n533            2.267            0\nKohlenhydrate   54 / 341 g\nEiweiss         52 / 184 g\nFett            9 / 69 g\n\nFruhstuck       533 / 840 kcal\nMittagessen     0 / 1.120 kcal\nAbendessen      0 / 0 kcal", e: { carbs: 287, protein: 132, fat: 60, kcal: 2267 } },
  { name: "missing_verbrannt_zero", t: "Ubersicht\nGegessen     Ubrig\n533         2.267\nKohlenhydrate 54 / 341 g\nEiweiss       52 / 184 g\nFett          9 / 69 g\nFruhstuck 533 / 840 kcal", e: { carbs: 287, protein: 132, fat: 60, kcal: 2267 } },
  { name: "thousands_dot_calories", t: "Gegessen   Ubrig    Verbrannt\n1.045     1.755     120\nKohlenhydrate 120 / 250 g\nEiweiss 80 / 150 g\nFett 30 / 70 g\nMittagessen 600 / 1.200 kcal", e: { carbs: 130, protein: 70, fat: 40, kcal: 1755 } },
  { name: "slash_as_pipe_I_paren", t: "Gegessen   Ubrig   Verbrannt\n533   2.267   0\nKohlenhydrate 54 | 341 g\nEiweiss 52 I 184 g\nFett 9 ) 69 g\nAbendessen 0 / 900 kcal", e: { carbs: 287, protein: 132, fat: 60, kcal: 2267 } },
  { name: "over_eaten_clamp_zero", t: "Gegessen   Ubrig   Verbrannt\n900   100   0\nKohlenhydrate 400 / 341 g\nEiweiss 200 / 184 g\nFett 80 / 69 g\nFruhstuck 900 / 840 kcal", e: { carbs: 0, protein: 0, fat: 0, kcal: 100 } },
  { name: "many_meal_rows_below", t: "Ubersicht\nGegessen   Ubrig   Verbrannt\n533   2.267   0\nKohlenhydrate 54 / 341 g\nEiweiss 52 / 184 g\nFett 9 / 69 g\nFruhstuck 533 / 840 kcal\nMittagessen 0 / 1.120 kcal\nAbendessen 0 / 700 kcal\nSnacks 0 / 300 kcal\nSport 0 / 0 kcal", e: { carbs: 287, protein: 132, fat: 60, kcal: 2267 } },
  { name: "jumbled_spacing", t: "Gegessen    Ubrig    Verbrannt\n533     2.267     0\nKohlenhydrate    54/341g\nEiweiss   52  /  184   g\nFett 9/ 69 g\nMittagessen  0/1.120 kcal", e: { carbs: 287, protein: 132, fat: 60, kcal: 2267 } },
  { name: "ubrig_misspelled_Obrig", t: "Gegessen   Obrig   Verbrannt\n533   2.267   0\nKohlenhydrate 54 / 341 g\nEiweiss 52 / 184 g\nFett 9 / 69 g\nFruhstuck 533 / 840 kcal", e: { carbs: 287, protein: 132, fat: 60, kcal: 2267 } },
  { name: "ubrig_dropped_U_brig", t: "Gegessen   brig   Verbrannt\n533   2.267   0\nKohlenhydrate 54 / 341 g\nEiweiss 52 / 184 g\nFett 9 / 69 g\nFruhstuck 533 / 840 kcal", e: { carbs: 287, protein: 132, fat: 60, kcal: 2267 } },
  { name: "macro_pair_split_across_lines", t: "Gegessen   Ubrig   Verbrannt\n533   2.267   0\nKohlenhydrate 54 /\n341 g\nEiweiss 52 /\n184 g\nFett 9 / 69 g\nFruhstuck 533 / 840 kcal", e: { carbs: 287, protein: 132, fat: 60, kcal: 2267 } },
  { name: "ubrig_unreadable_computed_fallback", t: "Gegessen   Verbrannt\nKohlenhydrate 54 / 341 g\nEiweiss 52 / 184 g\nFett 9 / 69 g\nFruhstuck 533 / 840 kcal", e: { carbs: 287, protein: 132, fat: 60, kcal: 2216 } },
  { name: "ubrig_same_line_stacked_labels", t: "Ubersicht\nGegessen 533\nUbrig 2.267\nVerbrannt 0\nKohlenhydrate 54 / 341 g\nEiweiss 52 / 184 g\nFett 9 / 69 g\nFruhstuck 533 / 840 kcal", e: { carbs: 287, protein: 132, fat: 60, kcal: 2267 } },
  { name: "real_umlauts_present", t: "Übersicht\nGegessen   Übrig   Verbrannt\n533   2.267   0\nKohlenhydrate 54 / 341 g\nEiweiß 52 / 184 g\nFett 9 / 69 g\nFrühstück 533 / 840 kcal\nMittagessen 0 / 1.120 kcal", e: { carbs: 287, protein: 132, fat: 60, kcal: 2267 } },
  { name: "kg_decoy_line_first", t: "Gegessen   Ubrig   Verbrannt\n533   2.267   0\nGewicht 80 / 75 kg\nKohlenhydrate 54 / 341 g\nEiweiss 52 / 184 g\nFett 9 / 69 g\nMittagessen 0 / 1.120 kcal", e: { carbs: 287, protein: 132, fat: 60, kcal: 2267 } },
  // eigener Fall: OCR zerlegt den Ring (533 / 2.267 / 0) in einzelne Zeilen -> Sicherheitsnetz muss 2267 finden (nicht 0)
  { name: "ring_numbers_split_lines", t: "Ubersicht\n533\n2.267\n0\nGegessen Ubrig Verbrannt\nKohlenhydrate 54 / 341 g\nEiweiss 52 / 184 g\nFett 9 / 69 g\nFruhstuck 533 / 840 kcal", e: { carbs: 287, protein: 132, fat: 60, kcal: 2267 } },
];
for (const c of OCR_CASES) {
  const r = T.parseMacroScreenshot(c.t) || {};
  const ok = r.carbs === c.e.carbs && r.protein === c.e.protein && r.fat === c.e.fat && r.kcal === c.e.kcal;
  check("OCR parse: " + c.name, ok, true);
}
check("OCR parse: Müll-Text -> null", T.parseMacroScreenshot("hello world, nothing here") === null, true);
check("OCR parse: non-string -> null", T.parseMacroScreenshot(null) === null, true);
check("OCR parse: nur 2 Makros -> null", T.parseMacroScreenshot("54 / 341 g\n52 / 184 g") === null, true);

console.log(failures ? `\n${failures} Test(s) fehlgeschlagen` : "\nAlle Tests bestanden");
process.exit(failures ? 1 : 0);
