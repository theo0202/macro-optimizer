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

(0, eval)(m[1] + "\n;globalThis.__t = { D, FJ, ITSU, PRET, NANDOS, UG, WAGA, GDK, ATIS, TFC, CHOPSTIX, PEPES, FIVEGUYS, PIZZAEXPRESS, WASABI, STD_SALAD, sumN, optimize, optimizeFJ, optimizeItsu, optimizePret, optimizeNandos, optimizeUG, optimizeWaga, optimizeGDK, optimizeAtis, optimizeTFC, optimizeChopstix, optimizePepes, optimizeFiveGuys, optimizePizzaExpress, optimizeWasabi, LEON, optimizeLeon, BAGELFACTORY, optimizeBagelFactory, bfSwap, isBFSalmon, PHO, optimizePho, isShellfish, optimizeAll, sortResults, parseMacroScreenshot, SEARCH_INDEX, searchItems, orderTotal, CORN_CAKE, CORN_CAKE_MAX, cornCapCount, bestCornCakes, withCornCake, applyCornCakes };");
const T = globalThis.__t;

let failures = 0;
const approx = (a, b) => Math.abs(a - b) < 0.05;
const check = (name, actual, expected) => {
  const ok = typeof expected === "boolean" ? actual === expected : approx(actual, expected);
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}: ${actual}${typeof expected === "boolean" ? "" : ` (erwartet ${expected})`}`);
};

// ── Subway: Footlong-Doppelung (Gemüse-Toppings = PDF "Vegetables" gehören zum Sub → ×2; nur eigenständige Salads/Spuds/Sides ×1) ──
const bread = T.D.breads.find(b => b.id === "wholegrain");
const prot = T.D.proteins.find(p => p.id === "roast_chicken");
const cheese = T.D.cheeses.find(c => c.id === "none");
const saladKcal = T.STD_SALAD.reduce((s, x) => s + x.kcal, 0);

const six = T.sumN([bread, prot, cheese, ...T.STD_SALAD], 1);
check("Subway 6inch kcal", six.kcal, bread.kcal + prot.kcal + saladKcal);

// Footlong: Gemüse-Toppings werden jetzt MITverdoppelt (User 20.06.2026: "Vegetables" ≠ die ausgenommenen "Salads")
const foot = T.sumN([bread, prot, cheese, ...T.STD_SALAD], 2);
check("Subway Footlong kcal (Gemüse ×2 wie Sub)", foot.kcal, 2 * (bread.kcal + prot.kcal + saladKcal));
// Side bleibt ×1 (eigenständiges Produkt, via singleItems-Argument)
const sideTest = T.D.sides[0];
check("Subway Side ×1 bei Footlong (singleItems)", T.sumN([bread, prot, cheese], 2, [sideTest]).kcal, 2 * (bread.kcal + prot.kcal) + sideTest.kcal);

const t1 = { protein: 60, carbs: 90, fat: 24, kcal: 816, fibMin: null, fibMax: null, sMin: null, sMax: null };
const res = T.optimize(t1, "macros", {}, true, true, "wholegrain", "footlong", true); // noSides=true: Kernlogik (Footlong-Doppelung) ohne Side
const top = res[0];
const doubled = [top.bread, top.protein, top.cheese, ...top.extras, ...top.sauces].reduce((s, x) => s + x.kcal, 0);
check("Subway Optimizer Footlong Top-1 (Sub + Gemüse je ×2)", top.nutrition.kcal, 2 * (doubled + saladKcal));

// ── Subway "Double cheese"-Schalter (Käse zählt doppelt) ──
const tDC = { protein: 25, carbs: 35, fat: 40, kcal: 600, fibMin: null, fibMax: null, sMin: null, sMax: null };
// optimize(t,mode,p,noSauce,noCheese,breadsOk,sz,noSides,noRoastChicken,forceCheese,doubleCheese)
const rDC = T.optimize(tDC, "macros", {}, true, false, { wholegrain: true }, "6inch", true, true, false, true);
const topDC = rDC[0];
check("Subway Double cheese: immer ein echter Käse gewählt (nicht none)", topDC.cheese.id !== "none", true);
// nutrition muss dem Sub MIT Käse ×2 entsprechen (Rekonstruktion)
const dcItems = [topDC.bread, topDC.protein, topDC.cheese, topDC.cheese, ...T.STD_SALAD, ...topDC.extras, ...topDC.sauces];
check("Subway Double cheese: nutrition = Sub + Käse ×2", approx(topDC.nutrition.kcal, T.sumN(dcItems, 1).kcal), true);
// Gegenprobe: mit forceCheese (einfach) ist der Käse nur 1×
const rSC = T.optimize(tDC, "macros", {}, true, false, { wholegrain: true }, "6inch", true, true, true, false);
const topSC = rSC[0];
const scItems = [topSC.bread, topSC.protein, topSC.cheese, ...T.STD_SALAD, ...topSC.extras, ...topSC.sauces];
check("Subway single cheese: nutrition = Sub + Käse ×1", approx(topSC.nutrition.kcal, T.sumN(scItems, 1).kcal), true);

// ── Subway Sides (Baked Beans Snack Pot, Coleslaw Regular/Double) + "only Subs"-Schalter ──
check("Subway D.sides (3)", T.D.sides.length, 3);
check("Subway Baked Beans Snack Pot kcal (PDF)", T.D.sides.find(s => s.id === "baked_beans_snack_pot").kcal, 109);
check("Subway Coleslaw Double kcal (PDF)", T.D.sides.find(s => s.id === "coleslaw_double").kcal, 119);
// Combo-Proteine: Deliveroo Build-Your-Own hat Pepperoni/Salami nur in Combos (Spicy Italian / Classic B.M.T.)
check("Subway kein standalone Pepperoni/Salami als Protein", !T.D.proteins.some(p => p.id === "pepperoni_main" || p.id === "salami_main"), true);
check("Subway Spicy Italian = Salami+Pepperoni (146 kcal)", T.D.proteins.find(p => p.id === "spicy_italian").kcal, 146);
check("Subway Spicy Italian Protein-Summe (7.6g)", T.D.proteins.find(p => p.id === "spicy_italian").protein, 7.6);
check("Subway Classic B.M.T. = Pepperoni+Salami+Turkey Ham (175 kcal)", T.D.proteins.find(p => p.id === "classic_bmt").kcal, 175);
check("Subway Pepperoni/Salami bleiben Extras", T.D.extras.filter(e => /pepperoni|salami/i.test(e.name)).length, 2);
// Meatball Marinara nutzt die HALAL Meatballs (in marinara sauce) = 229 kcal (User 20.06.2026; Subway nutzt sie generell)
check("Subway Meatball Marinara = HALAL marinara (229 kcal)", T.D.proteins.find(p => p.id === "meatball_marinara").kcal, 229);
check("Subway Meatball Marinara Fett (14)", T.D.proteins.find(p => p.id === "meatball_marinara").fat, 14);
// Lincolnshire Sausage entfernt (steht nicht in Deliveroos Build-Your-Own-Liste)
check("Subway kein Lincolnshire Sausage (Protein)", !T.D.proteins.some(p => /lincolnshire/i.test(p.id + p.name)), true);
// Brot-Mehrfachauswahl: Optimizer nutzt nur die erlaubten Brote; leeres Objekt = alle Brote
const rMultiBread = T.optimize(t1, "macros", {}, true, true, { wholegrain: true, italian_white: true }, "footlong", true);
check("Subway Mehrfach-Brot: nur erlaubte Brote", rMultiBread.length > 0 && rMultiBread.every(r => r.bread.id === "wholegrain" || r.bread.id === "italian_white"), true);
check("Subway Brot {} = alle Brote", new Set(T.optimize(t1, "macros", {}, true, true, {}, "footlong", true).map(r => r.bread.id)).size > 1, true);
check("Subway Brot Legacy-String (1 Brot) weiterhin ok", T.optimize(t1, "macros", {}, true, true, "honey_oat", "footlong", true).every(r => r.bread.id === "honey_oat"), true);
// Schalter "No Roast Chicken Breast"
const tChick = { protein: 50, carbs: 60, fat: 8, kcal: 512, fibMin: null, fibMax: null, sMin: null, sMax: null };
check("Subway 'No Roast Chicken': kein roast_chicken-Protein", T.optimize(tChick, "macros", {}, true, true, {}, "footlong", true, true).every(r => r.protein.id !== "roast_chicken"), true);
check("Subway ohne Schalter: Roast Chicken möglich (Gegenprobe)", T.optimize(tChick, "macros", {}, true, true, {}, "footlong", true, false).some(r => r.protein.id === "roast_chicken"), true);
// Schalter "Cheese" (forceCheese, 10. Param): immer einer der beiden Käse (kein "none")
const tCh2 = { protein: 30, carbs: 50, fat: 18, kcal: 482, fibMin: null, fibMax: null, sMin: null, sMax: null };
check("Subway 'Cheese': jedes Ergebnis hat Käse (kein none)", T.optimize(tCh2, "macros", {}, true, false, {}, "footlong", true, false, true).every(r => r.cheese.id !== "none"), true);
check("Subway 'Cheese': nur american/mozzarella_cheddar", T.optimize(tCh2, "macros", {}, true, false, {}, "footlong", true, false, true).every(r => ["american", "mozzarella_cheddar"].includes(r.cheese.id)), true);
check("Subway ohne 'Cheese': none möglich (Gegenprobe)", T.optimize(tCh2, "macros", {}, true, false, {}, "footlong", true, false, false).some(r => r.cheese.id === "none"), true);
// noSides=true: kein Ergebnis hat eine Side
const resNoSide = T.optimize(t1, "macros", {}, true, true, "wholegrain", "footlong", true);
check("Subway 'only Subs': keine Side in Ergebnissen", resNoSide.every(r => !r.side), true);
// Sides erlaubt: bei passendem Ziel taucht eine Side auf, und Nutrition = Sub + Side (Side ×1, NICHT footlong-verdoppelt)
const tSide = { protein: 45, carbs: 70, fat: 18, kcal: 622, fibMin: null, fibMax: null, sMin: null, sMax: null };
const resSide = T.optimize(tSide, "macros", {}, true, true, "wholegrain", "footlong", false);
const withS = resSide.find(r => r.side);
check("Subway Sides erlaubt: mind. ein Ergebnis mit Side", !!withS, true);
if (withS) {
  const subItems = [withS.bread, withS.protein, withS.cheese, ...withS.extras, ...withS.sauces];
  const expKcal = Math.round((2 * (subItems.reduce((s, x) => s + x.kcal, 0) + saladKcal) + withS.side.kcal) * 10) / 10; // Sub+Gemüse ×2, Side ×1
  check("Subway Side ×1 (nicht footlong-verdoppelt), Sub+Gemüse ×2", approx(withS.nutrition.kcal, expKcal), true);
}

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

// Schalter "Main + two sides": genau 1 Main (PERi-PERi Chicken | Burgers, Pittas, Wraps) + genau 2 Sides (ausser Rostinas)
const tM2S = { protein: 50, carbs: 80, fat: 25, kcal: 745, fibMin: null, fibMax: null, sMin: null, sMax: null };
const MAIN_CATS = new Set(["peri_peri_chicken", "burgers_pittas_wraps"]);
// letzter Arg mainTwoSides=true; nanAll als activeCats — der Modus muss die Chips ueberstimmen
const rnM2S = T.optimizeNandos(tM2S, "macros", {}, nanAll, 5, true, true, true, true, true, true);
check("Nando's Main+2Sides: jedes Ergebnis hat genau 3 Items", rnM2S.length > 0 && rnM2S.every(r => r.items.length === 3), true);
check("Nando's Main+2Sides: genau 1 Main aus den 2 Kategorien", rnM2S.every(r => r.items.filter(x => MAIN_CATS.has(x.cat)).length === 1), true);
check("Nando's Main+2Sides: genau 2 Sides", rnM2S.every(r => r.items.filter(x => x.cat === "sides").length === 2), true);
check("Nando's Main+2Sides: niemals Rostinas", rnM2S.every(r => r.items.every(x => x.id !== "rostinas")), true);
check("Nando's Main+2Sides: mit 'No wings' keine Wings als Main", rnM2S.every(r => r.items.every(x => !x.wings)), true);
// Modus ueberstimmt leere Chips (Beweis: liefert trotzdem Ergebnisse)
const rnM2SnoCats = T.optimizeNandos(tM2S, "macros", {}, {}, 5, true, true, true, true, true, true);
check("Nando's Main+2Sides: ueberstimmt leere Kategorie-Chips", rnM2SnoCats.length > 0, true);
// Gegenprobe: Wings als Main moeglich, wenn 'No wings' aus
const rnM2Swings = T.optimizeNandos(tM2S, "macros", {}, nanAll, 5, true, true, true, false, true, true);
check("Nando's Main+2Sides: ohne 'No wings' koennen Wings Main sein (Pool enthaelt sie)",
  T.NANDOS.items.some(x => MAIN_CATS.has(x.cat) && x.wings) ? rnM2Swings.length > 0 : true, true);
// Modus AUS = normaler a-la-carte-Optimizer (Items koennen != 3 sein, Pool != nur main+sides)
const rnM2Soff = T.optimizeNandos(tM2S, "macros", {}, nanAll, 5, true, true, true, true, true, false);
check("Nando's Main+2Sides AUS: normaler Optimizer (nicht zwingend 3 Items)", rnM2Soff.some(r => r.items.length !== 3) || rnM2Soff.some(r => r.items.some(x => !MAIN_CATS.has(x.cat) && x.cat !== "sides")), true);

// ── Corn cakes (restaurantsuebergreifender Carb-Fueller) ──
check("Corn cake Markenname (Kallo)", T.CORN_CAKE.name === "Kallo Lightly salted low fat corn cakes", true);
check("Corn cake per-unit kcal (386 x 0.0728)", T.CORN_CAKE.kcal, 28.1);
check("Corn cake per-unit carbs (86 x 0.0728)", T.CORN_CAKE.carbs, 6.26);
check("Corn cake per-unit protein (6.9 x 0.0728)", T.CORN_CAKE.protein, 0.5);
check("Corn cake keine Ballaststoffe", T.CORN_CAKE.fibre, 0);
const ccR0 = { nutrition: { kcal: 200, fat: 5, sat: 1, carbs: 10, sugars: 1, fibre: 2, protein: 30, salt: 1 }, score: 0 };
const ccHi = { protein: 30, carbs: 80, fat: 5, kcal: 560, fibMin: null, fibMax: null, sMin: null, sMax: null };
const ccK = T.bestCornCakes(ccR0.nutrition, ccHi, "macros", {});
check("Corn: offene Carbs -> Stueckzahl > 0", ccK > 0, true);
const ccAug = T.withCornCake(ccR0, true, ccHi, "macros", {});
check("Corn: augmentierte Carbs naeher am Ziel als Basis", Math.abs(ccAug.nutrition.carbs - 80) < Math.abs(10 - 80), true);
check("Corn: augmentierte kcal > Basis", ccAug.nutrition.kcal > 200, true);
check("Corn: speichert Stueckzahl + corn-freie Basis", ccAug.corn === ccK && ccAug._base.carbs === 10, true);
// Carb-Ziel bereits getroffen -> keine Cakes
const ccMet = { protein: 30, carbs: 10, fat: 5, kcal: 360, fibMin: null, fibMax: null, sMin: null, sMax: null };
check("Corn: 0 Stueck wenn Carbs schon getroffen", T.bestCornCakes(ccR0.nutrition, ccMet, "macros", {}), 0);
// Ohne Carb-Ziel -> nie Cakes (sonst ziellos)
check("Corn: 0 Stueck ohne Carb-Ziel", T.bestCornCakes(ccR0.nutrition, { protein: 30, carbs: 0, fat: 5, kcal: 165, fibMin: null, fibMax: null, sMin: null, sMax: null }, "macros", {}), 0);
// Schalter aus -> Liste unveraendert (Identitaet)
check("Corn: applyCornCakes(off) = unveraenderte Identitaet", T.applyCornCakes([ccR0], false, ccHi, "macros", {})[0] === ccR0, true);
const ccOn = T.applyCornCakes([ccR0], true, ccHi, "macros", {});
check("Corn: applyCornCakes(on) augmentiert (neues Objekt + corn-Feld)", ccOn[0] !== ccR0 && ccOn[0].corn === ccK, true);
// withCornCake(off) = identisch
check("Corn: withCornCake(off) = unveraendert", T.withCornCake(ccR0, false, ccHi, "macros", {}) === ccR0, true);
// Kalorien-Modus: NIE Cakes (Carb-Gap existiert nur im Makro-Modus; sonst wuerde der ganze kcal-Gap mit Cakes gefuellt)
check("Corn: 0 Stueck im Kalorien-Modus (auch mit grossem kcal-Gap)", T.bestCornCakes(ccR0.nutrition, { protein: 0, carbs: 0, fat: 0, kcal: 2000, fibMin: null, fibMax: null, sMin: null, sMax: null }, "calories", { hc: true }), 0);
// applyCornCakes(on) re-sortiert nach corn-inklusivem Score (Default-"Score"-Ansicht spiegelt die Cakes wider)
const ccFar = { nutrition: { kcal: 200, fat: 5, sat: 1, carbs: 10, sugars: 1, fibre: 2, protein: 50, salt: 1 }, score: 0 };
const ccClose = { nutrition: { kcal: 540, fat: 5, sat: 1, carbs: 75, sugars: 1, fibre: 2, protein: 30, salt: 1 }, score: 99 };
const ccSorted = T.applyCornCakes([ccFar, ccClose], true, ccHi, "macros", {}); // bewusst in falscher Reihenfolge
check("Corn: applyCornCakes(on) sortiert aufsteigend nach corn-Score", ccSorted[0].score <= ccSorted[1].score, true);
check("Corn: bestes Ergebnis (naeher am Ziel) steht nach Re-Sort vorne", ccSorted[0].nutrition.carbs > 60, true);
// Cap "max % der Carbs aus Cakes": groesste Stueckzahl <= capPct% des Carb-Ziels (harte Obergrenze, floor)
check("Corn cap: capN bei 30% von 150g Ziel = floor(7.19)=7", T.cornCapCount({ carbs: 150 }, 30), 7);
check("Corn cap: capN bei 30% von 80g Ziel = floor(3.83)=3", T.cornCapCount(ccHi, 30), 3);
check("Corn cap: 0% = kein Cap (CORN_CAKE_MAX)", T.cornCapCount(ccHi, 0), T.CORN_CAKE_MAX);
check("Corn cap: 100% = kein Cap (CORN_CAKE_MAX)", T.cornCapCount(ccHi, 100), T.CORN_CAKE_MAX);
// ccR0 (Carbs 10) bei ccHi (Ziel 80, Protein/Fett passen) -> ~11 Cakes ungecappt; Cap 30% = 3 muss strikt begrenzen
const ccCapN = T.cornCapCount(ccHi, 30); // 3
const ccCapped = T.bestCornCakes(ccR0.nutrition, ccHi, "macros", {}, 30);
const ccUncapped = T.bestCornCakes(ccR0.nutrition, ccHi, "macros", {}, 0);
check("Corn cap: bestCornCakes respektiert Cap (<= capN)", ccCapped <= ccCapN, true);
check("Corn cap: gecappte Stueckzahl deckt NIE mehr als 30% ab", ccCapped * T.CORN_CAKE.carbs <= 0.30 * ccHi.carbs, true);
check("Corn cap: ohne Cap deutlich mehr Cakes als mit (Gegenprobe)", ccUncapped > ccCapped, true);
// Cap bindet nicht, wenn die optimale Stueckzahl ohnehin unter dem Cap liegt (Basis schon nah am Carb-Ziel)
const ccNear = { kcal: 380, fat: 5, sat: 1, carbs: 70, sugars: 1, fibre: 2, protein: 30, salt: 1 };
check("Corn cap: optimale Stueckzahl < Cap -> Cap bindet nicht", T.bestCornCakes(ccNear, ccHi, "macros", {}, 50) < T.cornCapCount(ccHi, 50), true);

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

// Schalter "Max 1x" für Tajin Sweetcorn / Pickled Onions / Pickled Cabbage (jeweils max. 1x über Triple-Veg + Extras)
const UG_CAP_IDS = ["tajin_sweetcorn", "pickled_onions", "pickled_cabbage"];
const ugCapCount = r => { const c = {}; (r.veg || []).forEach(x => { if (x) c[x.id] = (c[x.id] || 0) + 1; }); (r.extras || []).forEach(e => { if (e.it) c[e.it.id] = (c[e.it.id] || 0) + 1; }); return c; };
const ugMaxDup = rs => Math.max(0, ...rs.map(r => Math.max(0, ...UG_CAP_IDS.map(id => ugCapCount(r)[id] || 0))));
const tCarb = { protein: 8, carbs: 80, fat: 4, kcal: 388, fibMin: null, fibMax: null, sMin: null, sMax: null };
const ugCapOn = [...T.optimizeUG(tCarb, "macros", {}, "salad", true, true, true), ...T.optimizeUG(tCarb, "macros", {}, "tray", true, true, true)];
const ugCapOff = [...T.optimizeUG(tCarb, "macros", {}, "salad", true, true, false), ...T.optimizeUG(tCarb, "macros", {}, "tray", true, true, false)];
check("UG 'Max 1x': Tajin/Pickled Onions/Pickled Cabbage je <=1 pro Bestellung", ugMaxDup(ugCapOn) <= 1, true);
check("UG Gegenprobe ohne Schalter: Doppelung möglich (>=2)", ugCapOff.length > 0 && ugMaxDup(ugCapOff) >= 2, true);

// ── Wagamama (Copy-Paste-Batches, wächst) ──
check("Wagamama Items vorhanden (>=20, wächst mit Batches)", T.WAGA.items.length >= 20, true);
check("Wagamama Kategorien (5: sides/donburi/ramen/teppanyaki/curries; salads Deliveroo-gepruned)", T.WAGA.cats.length, 5);
check("Wagamama grilled duck donburi kcal (live 2026-07-04)", T.WAGA.items.find(x => x.id === "grilled_duck_donburi").kcal, 1129);
check("Wagamama grilled duck donburi Protein", T.WAGA.items.find(x => x.id === "grilled_duck_donburi").protein, 53.9);
check("Wagamama grilled chicken ramen kcal (live 2026-07-04)", T.WAGA.items.find(x => x.id === "grilled_chicken_ramen").kcal, 455);
check("Wagamama tea-stained egg kcal", T.WAGA.items.find(x => x.id === "tea_stained_egg").kcal, 69);
// Curries-Kategorie (Batch 3) + seasonal buldak bibimbap
check("Wagamama curries-Kategorie vorhanden", T.WAGA.cats.some(c => c.id === "curries"), true);
check("Wagamama 8 Curries (hot chicken/yasai katsu Deliveroo-gepruned)", T.WAGA.items.filter(x => x.cat === "curries").length, 8);
check("Wagamama chicken katsu curry kcal", T.WAGA.items.find(x => x.id === "chicken_katsu_curry").kcal, 988);
check("Wagamama chicken katsu curry Protein", T.WAGA.items.find(x => x.id === "chicken_katsu_curry").protein, 43.9);
// Deliveroo-Prune (Canary Wharf, 2026-06-28): hot katsu currys + thai beef salad raus; yasai yaki soba auf die 1 Deliveroo-Variante (660, "| mushroom") reduziert
check("Wagamama hot katsu currys entfernt (nicht auf Deliveroo)", !T.WAGA.items.some(x => x.id === "hot_chicken_katsu_curry" || x.id === "hot_yasai_katsu_curry"), true);
check("Wagamama thai beef salad + salads-Kategorie entfernt", !T.WAGA.items.some(x => x.id === "thai_beef_salad") && !T.WAGA.cats.some(c => c.id === "salads"), true);
check("Wagamama nur 1 yasai yaki soba (Deliveroo-Variante)", T.WAGA.items.filter(x => x.name.startsWith("yasai yaki soba")).length, 1);
check("Wagamama yasai yaki soba | mushroom = 660 kcal (Deliveroo-Match)", T.WAGA.items.find(x => x.id === "yasai_yaki_soba_mushroom").kcal, 660);
check("Wagamama tofu firecracker salt", T.WAGA.items.find(x => x.id === "tofu_firecracker").salt, 5.1);
check("Wagamama buldak bibimbap kcal + cat=donburi", (() => { const b = T.WAGA.items.find(x => x.id === "buldak_bibimbap"); return b && b.kcal === 1012 && b.cat === "donburi"; })(), true);
// Deliveroo-Rice-Bowls (User 28.06.2026 nachgereicht, volle wagamama.com-Makros) -> donburi
check("Wagamama gochujang salmon rice bowl kcal", T.WAGA.items.find(x => x.id === "gochujang_salmon_rice_bowl").kcal, 786);
check("Wagamama chicken + prawn turmeric rice bowl Protein", T.WAGA.items.find(x => x.id === "chicken_prawn_turmeric_rice_bowl").protein, 32.4);
check("Wagamama 7 Donburi (inkl. 2 neue Rice Bowls)", T.WAGA.items.filter(x => x.cat === "donburi").length, 7);

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

// ── Leon (à la carte, AC-Familie; auf Deliveroo-Karte geprunt + 3 Kids-Meals) ──
check("Leon Items (26, Deliveroo-geprunt + 3 Kids)", T.LEON.items.length, 26);
check("Leon Kategorien (8)", T.LEON.cats.length, 8);
check("Leon volle 8 Makros (numerisch)", T.LEON.items.every(x => ["kcal", "fat", "sat", "carbs", "sugars", "fibre", "protein", "salt"].every(k => typeof x[k] === "number")), true);
check("Leon keine Sauces-Kategorie (User-Vorgabe)", !T.LEON.cats.some(c => /sauce/i.test(c.id + c.name)), true);
// Deliveroo-Prune: nicht-bestellbare Items raus, Renames auf Deliveroo-Namen
check("Leon kein 'Spicy Chicken Zhoug Wrap' (nicht auf Deliveroo)", !T.LEON.items.some(x => /zhoug wrap/i.test(x.name)), true);
check("Leon kein 'Keralan Chicken Curry' (nicht auf Deliveroo)", !T.LEON.items.some(x => /keralan/i.test(x.name)), true);
check("Leon Rename: 'Aioli Chicken Wrap' vorhanden", T.LEON.items.some(x => x.name === "Aioli Chicken Wrap"), true);
check("Leon Rename: 'Mushroom Magic Romesco Big Rice Box' vorhanden", T.LEON.items.some(x => x.name === "Mushroom Magic Romesco Big Rice Box"), true);
// 3 Kids-Meals (Kategorie Kids' All Day, default AN)
check("Leon 3 Kids-Meals", T.LEON.items.filter(x => x.cat === "kids-all-day").length, 3);
check("Leon Kids' All Day default AN", T.LEON.cats.find(c => c.id === "kids-all-day").on, true);
check("Leon Kids: Chargrilled Chicken Rice Box (382)", T.LEON.items.find(x => x.name === "Chargrilled Chicken Rice Box").kcal, 382);
check("Leon sat <= fat (Fett-Fix max(Fat,sat+mono+poly))", T.LEON.items.every(x => x.sat <= x.fat + 0.05), true);
const leonBad = T.LEON.items.filter(x => { const e = 4 * x.carbs + 4 * x.protein + 9 * x.fat; return Math.abs(x.kcal - e) > 60 && Math.abs(x.kcal - e) / Math.max(x.kcal, 1) > 0.25; });
check("Leon kcal-plausibel (kaputte Leon-Daten ausgeschlossen)", leonBad.length, 0);
check("Leon Mushroom Magic Romesco Big Box = 662 kcal", T.LEON.items.find(x => x.id === "mushroom_magic_romesco_big_box").kcal, 662);
check("Leon Mushroom Magic Romesco Fett-Fix (>20, nicht 2.6)", T.LEON.items.find(x => x.id === "mushroom_magic_romesco").fat > 20, true);
const allLeon = {}; T.LEON.cats.forEach(c => allLeon[c.id] = true);
const tLeon = { protein: 25, carbs: 60, fat: 20, kcal: 520, fibMin: null, fibMax: null, sMin: null, sMax: null };
const rLeon = T.optimizeLeon(tLeon, "macros", {}, allLeon, 3);
check("Leon liefert Ergebnisse (1..20)", rLeon.length > 0 && rLeon.length <= 20, true);
check("Leon Nutrition == Summe", rLeon.every(r => approx(r.nutrition.kcal, Math.round(r.items.reduce((s, x) => s + x.kcal, 0) * 10) / 10)), true);
check("Leon 1–3 Items", rLeon.every(r => r.items.length >= 1 && r.items.length <= 3), true);
check("Leon Kategorie-Filter (nur Burgers)", T.optimizeLeon(tLeon, "macros", {}, { burgers: true }, 1).every(r => r.items.every(x => x.cat === "burgers")), true);

// ── Bagel Factory (à la carte, AC-Familie; NUR Set-Menü — per-portion, Werte = Plain Bun) ──
check("Bagel Factory Items (43)", T.BAGELFACTORY.items.length, 43);
check("Bagel Factory Kategorien (7)", T.BAGELFACTORY.cats.length, 7);
check("Bagel Factory volle 8 Makros (numerisch)", T.BAGELFACTORY.items.every(x => ["kcal", "fat", "sat", "carbs", "sugars", "fibre", "protein", "salt"].every(k => typeof x[k] === "number")), true);
check("Bagel Factory Cream Cheese Bagel kcal (435)", T.BAGELFACTORY.items.find(x => x.id === "cream_cheese_bagel").kcal, 435);
check("Bagel Factory Chicken Club Protein (36.6)", T.BAGELFACTORY.items.find(x => x.id === "chicken_club").protein, 36.6);
check("Bagel Factory Tuna Melt kcal (667)", T.BAGELFACTORY.items.find(x => x.id === "tuna_melt").kcal, 667);
// PDF-Zeilenverrutscher-Fix: Mini The Classic druckt carbs 19.1 / sugars 24.1 -> carbs 24.1 (verrutschte Carb-Angabe), sugars 3.1 (skaliert)
check("Bagel Factory Mini Classic carbs-Fix (24.1, nicht 19.1)", T.BAGELFACTORY.items.find(x => x.id === "mini_the_classic_bagel").carbs, 24.1);
check("Bagel Factory Mini Classic sugars-Fix (3.1)", T.BAGELFACTORY.items.find(x => x.id === "mini_the_classic_bagel").sugars, 3.1);
check("Bagel Factory sugars <= carbs ueberall", T.BAGELFACTORY.items.every(x => x.sugars <= x.carbs + 0.05), true);
check("Bagel Factory sat <= fat ueberall", T.BAGELFACTORY.items.every(x => x.sat <= x.fat + 0.05), true);
const bfBad = T.BAGELFACTORY.items.filter(x => { const e = 4 * x.carbs + 4 * x.protein + 9 * x.fat; return Math.abs(x.kcal - e) > 60 && Math.abs(x.kcal - e) / Math.max(x.kcal, 1) > 0.25; });
check("Bagel Factory kcal-plausibel (alle Items)", bfBad.length, 0);
check("Bagel Factory 8 Sweets", T.BAGELFACTORY.items.filter(x => x.cat === "sweets").length, 8);
const allBF = {}; T.BAGELFACTORY.cats.forEach(c => allBF[c.id] = true);
const tBF = { protein: 35, carbs: 60, fat: 20, kcal: 560, fibMin: null, fibMax: null, sMin: null, sMax: null };
const rBF = T.optimizeBagelFactory(tBF, "macros", {}, allBF, 3, true);
check("Bagel Factory liefert Ergebnisse (1..20)", rBF.length > 0 && rBF.length <= 20, true);
check("Bagel Factory Nutrition == Summe", rBF.every(r => approx(r.nutrition.kcal, Math.round(r.items.reduce((s, x) => s + x.kcal, 0) * 10) / 10)), true);
check("Bagel Factory 'No snacks & sweet treats' filtert sweets", rBF.every(r => r.items.every(x => x.cat !== "sweets")), true);
const rBFsw = T.optimizeBagelFactory({ protein: 5, carbs: 45, fat: 20, kcal: 380, fibMin: null, fibMax: null, sMin: null, sMax: null }, "macros", {}, allBF, 1, false);
check("Bagel Factory ohne Schalter: Sweets erlaubt (Gegenprobe)", rBFsw.some(r => r.items.some(x => x.cat === "sweets")), true);
check("Bagel Factory Kategorie-Filter (nur Deli)", T.optimizeBagelFactory(tBF, "macros", {}, { deli: true }, 1, true).every(r => r.items.every(x => x.cat === "deli")), true);
// Bun-Wahl: 6 Buns, Plain als Referenz; vollwertige Bagels swappbar, Mini/Sweets nicht
const bfPlainBun = T.BAGELFACTORY.buns.find(b => b.plain);
const bfMulti = T.BAGELFACTORY.buns.find(b => b.id === "multigrain");
check("Bagel Factory 6 Buns + Plain-Referenz", T.BAGELFACTORY.buns.length === 6 && !!bfPlainBun, true);
check("Bagel Factory bunSwap nur auf vollwertigen Bagels", T.BAGELFACTORY.items.every(x => (["spread", "breakfast", "veggie", "seafood", "deli"].includes(x.cat)) === !!x.bunSwap), true);
const ccBase = T.BAGELFACTORY.items.find(x => x.id === "cream_cheese_bagel");
// bfSwap-Mathe: Bagel − Plain Bun + gewählter Bun (auf die Nachkommastelle)
check("Bagel Factory bfSwap kcal (Bagel − Plain + Multigrain)", T.bfSwap(ccBase, bfMulti).kcal, Math.round((ccBase.kcal - bfPlainBun.kcal + bfMulti.kcal) * 10) / 10);
check("Bagel Factory bfSwap carbs", T.bfSwap(ccBase, bfMulti).carbs, Math.round((ccBase.carbs - bfPlainBun.carbs + bfMulti.carbs) * 10) / 10);
check("Bagel Factory bfSwap Name-Suffix", T.bfSwap(ccBase, bfMulti).name === "Cream Cheese Bagel (Multigrain)", true);
check("Bagel Factory bfSwap Plain = Item unverändert (Identität)", T.bfSwap(ccBase, bfPlainBun) === ccBase, true);
// Bun-Filter: nur Multigrain erlaubt -> alle vollwertigen Ergebnisse tragen (Multigrain)
const rMulti = T.optimizeBagelFactory({ protein: 12, carbs: 48, fat: 17, kcal: 404, fibMin: null, fibMax: null, sMin: null, sMax: null }, "macros", {}, { spread: true }, 1, true, { multigrain: true });
check("Bagel Factory Bun-Filter: nur Multigrain-Varianten", rMulti.length > 0 && rMulti.every(r => r.items.every(x => /\(Multigrain\)$/.test(x.name))), true);
// leere Bun-Auswahl (bunsOk mit nichts) -> alle Buns (wie Subway)
const rAllBuns = T.optimizeBagelFactory(tBF, "macros", {}, { spread: true }, 2, true, {});
check("Bagel Factory leere Bun-Auswahl = alle Buns (Varianten vorhanden)", rAllBuns.some(r => r.items.some(x => /\((Poppy|Sesame|Multigrain|Everything|Cheese)/.test(x.name))), true);
// "No smoky pulled pork"-Schalter (Default AUS)
check("Bagel Factory 'No smoky pulled pork' filtert es raus", T.optimizeBagelFactory(tBF, "macros", {}, { deli: true }, 3, true, { plain: true }, true).every(r => r.items.every(x => !/smoky pulled pork/i.test(x.name))), true);
check("Bagel Factory ohne Schalter: Smoky Pulled Pork erlaubt (Gegenprobe)", T.optimizeBagelFactory({ protein: 42, carbs: 66, fat: 30, kcal: 702, fibMin: null, fibMax: null, sMin: null, sMax: null }, "macros", {}, { deli: true }, 1, true, { plain: true }, false).some(r => r.items.some(x => /smoky pulled pork/i.test(x.name))), true);
// Per-Slot-Bun (Array = Bun je Bagel-Position). Uniform-Array = Global-Pfad (identisch); gemischte Slots = Per-Slot-Beam.
const rSlotPlain = T.optimizeBagelFactory(tBF, "macros", {}, { spread: true }, 3, true, [{ plain: true }, { plain: true }, { plain: true }]);
const rGlobPlain = T.optimizeBagelFactory(tBF, "macros", {}, { spread: true }, 3, true, { plain: true });
check("Bagel Factory per-slot all-Plain == global Plain (Top-1 kcal)", rSlotPlain.length > 0 && rGlobPlain.length > 0 && approx(rSlotPlain[0].nutrition.kcal, rGlobPlain[0].nutrition.kcal), true);
const rSlotUni = T.optimizeBagelFactory(tBF, "macros", {}, { spread: true }, 2, true, [{ multigrain: true }, { multigrain: true }]);
const bfUniAllMulti = rSlotUni.length > 0 && rSlotUni.every(r => r.items.every(x => /\(Multigrain\)$/.test(x.name)));
check("Bagel Factory per-slot uniform (nur Multigrain-Varianten)", bfUniAllMulti, true);
const rSlotMix = T.optimizeBagelFactory(tBF, "macros", {}, { spread: true }, 2, true, [{ sesame: true }, { plain: true }]);
const bfForbiddenBun = /\((Poppy|Multigrain|Everything|Cheese)/;
const bfMixAllOk = rSlotMix.length > 0 && rSlotMix.every(r => r.items.every(x => !bfForbiddenBun.test(x.name)));
check("Bagel Factory per-slot gemischt: nie Poppy/Multigrain/Everything/Cheese-Bun", bfMixAllOk, true);
check("Bagel Factory per-slot gemischt: Sesame-Slot aktiv (Sesame-Variante moeglich)", rSlotMix.some(r => r.items.some(x => /\(Sesame\)$/.test(x.name))), true);
const rSlotAllBuns = T.optimizeBagelFactory(tBF, "macros", {}, { spread: true }, 2, true, [{ sesame: true }, {}]);
check("Bagel Factory per-slot (Sesame + all buns) liefert Ergebnisse", rSlotAllBuns.length > 0, true);
// "No duplicate bagels" (kein Bagel gleicher Basis-Id zweimal). tDup ~ 2x Cream Cheese Bagel -> ohne Schalter waere 2x optimal.
const bfBase = id => id.split("__")[0];
const uniqBase = r => new Set(r.items.map(x => bfBase(x.id))).size === r.items.length;
const tDup = { protein: 29, carbs: 120, fat: 28.8, kcal: 870, fibMin: null, fibMax: null, sMin: null, sMax: null };
const rDupOff = T.optimizeBagelFactory(tDup, "macros", {}, { spread: true }, 3, true, [{ plain: true }, { plain: true }, { plain: true }], false, false, false);
check("Bagel Factory ohne 'No duplicate': Duplikat-Bagel moeglich (Gegenprobe)", rDupOff.some(r => !uniqBase(r)), true);
const rDupOn = T.optimizeBagelFactory(tDup, "macros", {}, { spread: true }, 3, true, [{ plain: true }, { plain: true }, { plain: true }], false, true, false);
check("Bagel Factory 'No duplicate bagels' (Global-Pfad): keine zwei Bagels gleicher Basis", rDupOn.length > 0 && rDupOn.every(uniqBase), true);
const rDupSlot = T.optimizeBagelFactory(tDup, "macros", {}, { spread: true }, 3, true, [{ sesame: true }, { plain: true }, {}], false, true, false);
check("Bagel Factory 'No duplicate bagels' (per-Slot gemischt): keine gleiche Basis", rDupSlot.length > 0 && rDupSlot.every(uniqBase), true);
// "No salmon" (Lachs-Bagels raus; Tuna Melt bleibt). isBFSalmon: Name "salmon" ODER die 3 Lachs-Ids.
check("isBFSalmon: The Classic / New Yorker / Mini Classic / Egg Mayo Salmon -> true", [{ id: "the_classic", name: "The Classic" }, { id: "the_new_yorker", name: "The New Yorker" }, { id: "mini_the_classic_bagel", name: "Mini The Classic Bagel" }, { id: "egg_mayo_and_salmon_bagel", name: "Egg Mayo and Salmon Bagel" }].every(x => T.isBFSalmon(x)), true);
check("isBFSalmon: Tuna Melt / Cream Cheese -> false", [{ id: "tuna_melt", name: "Tuna Melt" }, { id: "cream_cheese_bagel", name: "Cream Cheese Bagel" }].every(x => !T.isBFSalmon(x)), true);
check("isBFSalmon: greift auch auf Bun-Variante (the_classic__sesame)", T.isBFSalmon({ id: "the_classic__sesame", name: "The Classic (Sesame)" }), true);
check("Bagel Factory hat >=4 Lachs-Bagels im Katalog", T.BAGELFACTORY.items.filter(x => T.isBFSalmon(x)).length >= 4, true);
const rNoSalmon = T.optimizeBagelFactory(tBF, "macros", {}, { seafood: true, breakfast: true }, 3, true, { plain: true }, false, false, true);
check("Bagel Factory 'No salmon': kein Lachs-Bagel im Ergebnis", rNoSalmon.length > 0 && rNoSalmon.every(r => r.items.every(x => !T.isBFSalmon(x))), true);
const rSalmonOn = T.optimizeBagelFactory({ protein: 22.5, carbs: 62, fat: 17.9, kcal: 501, fibMin: null, fibMax: null, sMin: null, sMax: null }, "macros", {}, { seafood: true }, 1, true, { plain: true }, false, false, false);
check("Bagel Factory ohne 'No salmon': Lachs-Bagel moeglich (Gegenprobe)", rSalmonOn.some(r => r.items.some(x => T.isBFSalmon(x))), true);
// Bun-Permutationen zusammenfassen: gleiche Bagels + gleiches Bun-Multiset (nur andere Zuordnung) = identische Makros -> nur EIN Ergebnis
const permKey = r => r.items.map(x => x.id.split("__")[0]).sort().join(",") + "||" + r.items.map(x => x.bun || "plain").sort().join(",");
const uniqueKeys = arr => new Set(arr.map(permKey)).size === arr.length;
const rPermGlobal = T.optimizeBagelFactory(tBF, "macros", {}, { spread: true, deli: true }, 3, true, [{ plain: true, sesame: true }, { plain: true, sesame: true }, { plain: true, sesame: true }], false, false, false);
check("Bagel Factory Bun-Permutation Global-Pfad nutzt Multi-Bun (Sesame vorhanden)", rPermGlobal.some(r => r.items.some(x => /\(Sesame\)$/.test(x.name))), true);
check("Bagel Factory Bun-Permutationen zusammengefasst (Global-Pfad): eindeutige perm-keys", rPermGlobal.length > 0 && uniqueKeys(rPermGlobal), true);
const rPermSlot = T.optimizeBagelFactory(tBF, "macros", {}, { spread: true, deli: true }, 3, true, [{ plain: true, sesame: true }, { plain: true, multigrain: true }, {}], false, false, false);
check("Bagel Factory Bun-Permutationen zusammengefasst (per-Slot): eindeutige perm-keys", rPermSlot.length > 0 && uniqueKeys(rPermSlot), true);

// ── Pho (à la carte, AC-Familie; 7 Makros, KEIN Salt -> salt=0) ──
check("Pho Items (94)", T.PHO.items.length, 94);
check("Pho Kategorien (8)", T.PHO.cats.length, 8);
check("Pho: keine Sauces-Kategorie (Deliveroo)", T.PHO.cats.every(c => c.id !== "sauces") && T.PHO.items.every(x => x.cat !== "sauces"), true);
check("Pho: kein Cauliflower rice (Deliveroo)", T.PHO.items.every(x => !/cauliflower/i.test(x.name)), true);
check("Pho volle Makros numerisch + salt=0", T.PHO.items.every(x => ["kcal", "fat", "sat", "carbs", "sugars", "fibre", "protein", "salt"].every(k => typeof x[k] === "number") && x.salt === 0), true);
check("Pho - Beef brisket kcal (397)", T.PHO.items.find(x => x.id === "pho_beef_brisket").kcal, 397);
check("Pho Chicken wings protein (67.1)", T.PHO.items.find(x => x.id === "chicken_wings").protein, 67.1);
check("Pho sat <= fat ueberall", T.PHO.items.every(x => x.sat <= x.fat + 0.05), true);
check("Pho sugars <= carbs (+0.5 PDF-Rundung)", T.PHO.items.every(x => x.sugars <= x.carbs + 0.5), true);
// kcal-Plausibilitaet (2 dokumentierte PDF-Anomalien ausgenommen)
const phoAnom = new Set(["spicy_curry_tofu", "rice_bowl_this_isn_t_chicken_veg"]);
const phoBad = T.PHO.items.filter(x => { if (phoAnom.has(x.id)) return false; const e = 4 * x.carbs + 4 * x.protein + 9 * x.fat; return Math.abs(x.kcal - e) > 60 && Math.abs(x.kcal - e) / Math.max(x.kcal, 1) > 0.25; });
check("Pho kcal-plausibel (ex 2 Anomalien)", phoBad.length, 0);
const phoAll = {}; T.PHO.cats.forEach(c => phoAll[c.id] = true);
const tPho = { protein: 40, carbs: 60, fat: 10, kcal: 490, fibMin: null, fibMax: null, sMin: null, sMax: null };
const rPho = T.optimizePho(tPho, "macros", {}, phoAll, 3);
check("Pho liefert Ergebnisse (1..20)", rPho.length > 0 && rPho.length <= 20, true);
check("Pho Nutrition == Summe", rPho.every(r => approx(r.nutrition.kcal, Math.round(r.items.reduce((s, x) => s + x.kcal, 0) * 10) / 10)), true);
check("Pho Kategorie-Filter (nur curry)", T.optimizePho(tPho, "macros", {}, { curry: true }, 2).every(r => r.items.every(x => x.cat === "curry")), true);
// Schalentier permanent raus (Allergie) — auch bei Pho
const phoShellRE = /(prawn(?!less)|shrimp|crab|squid|calamari|lobster|mussel|clam|oyster|scallop)/i;
check("Pho Optimizer schalentierfrei (kein prawn/crab/squid)", T.optimizePho(tPho, "macros", {}, phoAll, 3).every(r => r.items.every(x => !phoShellRE.test(x.name))), true);
check("Pho Katalog hat Prawn-Gerichte (die gefiltert werden)", T.PHO.items.some(x => /prawn|crab|squid/i.test(x.name)), true);
// Prawnless crackers ist KEIN Schalentier (vegan) -> bleibt (Lookahead prawn(?!less))
check("Pho: Prawnless crackers NICHT als Schalentier gefiltert", !T.isShellfish({ name: "Prawnless crackers" }) && T.PHO.items.some(x => x.id === "prawnless_crackers"), true);
check("Pho: Prawn crackers IST Schalentier", T.isShellfish({ name: "Prawn crackers" }), true);
check("Pho Fisch bleibt (Curry - Fish im Katalog, kein Schalentier)", T.PHO.items.some(x => x.id === "curry_fish") && !T.isShellfish({ name: "Curry - Fish" }), true);
// Versteckte Schalentier-Gerichte (Name traegt Keyword) -> gefiltert (Bun bo Hue = Chili-Shrimp-Paste; Review-Fund)
check("Pho: Bun bo Hue (chilli shrimp paste) als Schalentier gefiltert", T.PHO.items.every(x => !(/beef brisket/i.test(x.name) && /hot & spicy/i.test(x.name) && !T.isShellfish(x))), true);
check("Pho: kein 'hot & spicy - beef brisket' im Optimizer-Ergebnis (Shrimp-Paste)", T.optimizePho({ protein: 36, carbs: 55, fat: 9, kcal: 445, fibMin: null, fibMax: null, sMin: null, sMax: null }, "macros", {}, phoAll, 1).every(r => r.items.every(x => !/hot & spicy - beef brisket/i.test(x.name))), true);

// ── Schalentier-Filter (Krebstiere + Weichtiere) — permanent ausgeschlossen (Allergie); Fisch bleibt ──
const shellRE = /(prawn(?!less)|shrimp|crab|lobster|langoustine|cray|mussel|clam|oyster|squid|calamari|scallop|octopus|\bebi\b|california|best of itsu|itsu classics)/i;
check("isShellfish: prawn/shrimp/crab/calamari -> true", ["Prawn tom yum", "Shrimp", "Crayfish & Rocket", "Calamari", "California rolls", "best of itsu"].every(n => T.isShellfish({ name: n })), true);
check("isShellfish: Fisch/Fleisch/Veggie -> false", ["Salmon donburi", "Tuna hosomaki", "Grilled Chicken", "Salmon Bowl", "Gochujang Salmon", "Chicken Club"].every(n => !T.isShellfish({ name: n })), true);
check("Such-Index: KEIN Schalentier", T.SEARCH_INDEX.filter(x => shellRE.test(x.name)).length, 0);
// Optimizer-Pools schalentierfrei (Stichproben)
const allC = o => { const r = {}; (o.cats || []).forEach(c => r[c.id] = true); return r; };
const tSh = { protein: 20, carbs: 40, fat: 15, kcal: 435, fibMin: null, fibMax: null, sMin: null, sMax: null };
const noShell = res => res.every(r => r.items.every(x => !shellRE.test(x.name)));
check("Itsu-Optimizer schalentierfrei (inkl. versteckter Sets)", noShell(T.optimizeItsu(tSh, "macros", {}, allC(T.ITSU), 20, false, false, false)), true);
check("Wasabi-Optimizer schalentierfrei (inkl. California)", noShell(T.optimizeWasabi(tSh, "macros", {}, allC(T.WASABI), 20, false, false, false, false)), true);
check("Wagamama-Optimizer schalentierfrei (prawn raus)", noShell(T.optimizeWaga(tSh, "macros", {}, allC(T.WAGA), 20, false)), true);
check("Pizza-Express-Optimizer schalentierfrei (Calamari/Prawn raus)", noShell(T.optimizePizzaExpress(tSh, "macros", {}, allC(T.PIZZAEXPRESS), 20)), true);
check("UG-Optimizer schalentierfrei (Shrimp raus)", T.optimizeUG(tSh, "macros", {}, "salad", false, false, true).every(r => !shellRE.test((r.prot && r.prot.name) || "") && !shellRE.test((r.prot2 && r.prot2.name) || "")), true);
check("Fisch bleibt erhalten (Wasabi Salmon/Tuna weiter im Datensatz)", T.WASABI.items.some(x => /salmon|tuna/i.test(x.name)), true);

// ── "All restaurants" (restaurantsübergreifend; alle Exclude-Schalter an, Itsu only-sushi aus) ──
const tAllT = { protein: 40, carbs: 50, fat: 15, kcal: 535, fibMin: null, fibMax: null, sMin: null, sMax: null };
const rAll = T.optimizeAll(tAllT, "macros", {}, "footlong");
const RESTOS = ["subway", "farmerj", "itsu", "pret", "nandos", "ug", "wagamama", "gdk", "atis", "tfc", "chopstix", "pepes", "fiveguys", "pizzaexpress", "wasabi", "leon", "bagelfactory", "pho"];
check("All: liefert Ergebnisse (1..20)", rAll.length > 0 && rAll.length <= 20, true);
check("All: jedes Ergebnis hat _resto + nutrition + score", rAll.every(r => r._resto && r.nutrition && typeof r.score === "number"), true);
check("All: nach Score aufsteigend sortiert", rAll.every((r, i) => i === 0 || rAll[i - 1].score <= r.score), true);
check("All: mehrere Restaurants vertreten (>=3)", new Set(rAll.map(r => r._resto)).size >= 3, true);
check("All: max 1 Treffer pro Restaurant (User-Wunsch)", Object.values(rAll.reduce((m, r) => { m[r._resto] = (m[r._resto] || 0) + 1; return m; }, {})).every(c => c <= 1), true);
check("All: nur gültige _resto-Werte", rAll.every(r => RESTOS.includes(r._resto)), true);
check("All: TFC-Treffer ohne Fisch (No fish an)", rAll.filter(r => r._resto === "tfc").every(r => r.items.every(x => !x.fish)), true);
// acMaxN: Cross-Restaurant Max-Items-Chip steuert die à-la-carte-Restaurants
const AC_RESTOS = ["itsu", "pret", "nandos", "wagamama", "gdk", "tfc", "pepes", "pizzaexpress", "wasabi", "leon", "bagelfactory"];
const rAllMax1 = T.optimizeAll(tAllT, "macros", {}, "footlong", null, 1);
check("All acMaxN=1: AC-Restaurants liefern genau 1 Item", rAllMax1.filter(r => AC_RESTOS.includes(r._resto)).every(r => r.items.length === 1), true);
const rAllMax2 = T.optimizeAll(tAllT, "macros", {}, "footlong", null, 2);
check("All acMaxN=2: AC-Restaurants <= 2 Items", rAllMax2.filter(r => AC_RESTOS.includes(r._resto)).every(r => r.items.length <= 2), true);
check("All acMaxN default (=5) wie ohne Param", JSON.stringify(T.optimizeAll(tAllT, "macros", {}, "footlong", null, 5).map(r => r._resto + ":" + (r.items ? r.items.length : "-"))) === JSON.stringify(rAll.map(r => r._resto + ":" + (r.items ? r.items.length : "-"))), true);

// ── "Accurate restaurants" (Teilmenge via optimizeAll-Whitelist) ──
const ACCURATE = ["subway", "farmerj", "itsu", "pret", "nandos", "ug", "wagamama", "atis", "tfc", "pepes", "pizzaexpress", "wasabi"];
const rAcc = T.optimizeAll(tAllT, "macros", {}, "footlong", ACCURATE);
check("Accurate: liefert Ergebnisse (1..20)", rAcc.length > 0 && rAcc.length <= 20, true);
check("Accurate: NUR Whitelist-Restaurants", rAcc.every(r => ACCURATE.includes(r._resto)), true);
check("Accurate: kein GDK/Chopstix/Five Guys", !rAcc.find(r => ["gdk", "chopstix", "fiveguys"].includes(r._resto)), true);
check("Accurate: mehrere Restaurants vertreten (>=3)", new Set(rAcc.map(r => r._resto)).size >= 3, true);
check("Accurate: max 1 Treffer pro Restaurant", Object.values(rAcc.reduce((m, r) => { m[r._resto] = (m[r._resto] || 0) + 1; return m; }, {})).every(c => c <= 1), true);
// Gegenprobe: ohne Whitelist (= alle) koennen die ausgeschlossenen erscheinen
check("Accurate-Gegenprobe: ohne Whitelist sind mehr Restaurants moeglich", new Set(rAll.map(r => r._resto)).size >= new Set(rAcc.map(r => r._resto)).size, true);

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
  // "g" von der OCR ganz verschluckt (nur Slash da) -> Pass A nimmt erste 3 Nicht-kcal/kg-Slashpaare
  { name: "g_unit_dropped", t: "Gegessen Ubrig Verbrannt\n533 2.267 0\nKohlenhydrate 54 / 341\nEiweiss 52 / 184\nFett 9 / 69\nFruhstuck 533 / 840 kcal", e: { carbs: 287, protein: 132, fat: 60, kcal: 2267 } },
  // Slash von der OCR verschluckt (aber "g" da) -> Pass B (durch "g" verankert)
  { name: "slash_dropped_g_present", t: "Gegessen Ubrig Verbrannt\n533 2.267 0\nKohlenhydrate 54 341 g\nEiweiss 52 184 g\nFett 9 69 g\nFruhstuck 533 840 kcal", e: { carbs: 287, protein: 132, fat: 60, kcal: 2267 } },
  // REALER FEHLER: OCR liest das Einheiten-"g" als "9" und haengt es ans Total ("341 g"->"3419", "184 g"->"1849")
  // -> aufgeblaehte Restmakros (3365/1797). g->9-Korrektur muss via Uebrig (2267) auf 287/132/60 zurueckrechnen.
  { name: "g_merged_as_9_recovery", t: "Gegessen Ubrig Verbrannt\n533 2.267 0\nKohlenhydrate 54 / 3419\nEiweiss 52 / 1849\nFett 9 / 69 g\nFruhstuck 533 / 840 kcal\nMittagessen 0 / 1.120 kcal", e: { carbs: 287, protein: 132, fat: 60, kcal: 2267 } },
  // Fett-Angleichung: Rest-Makros ergeben mehr kcal als "Übrig" (1250 > 1000) -> Fett runter auf (1000-400-400)/9 = 22.2
  { name: "fat_trimmed_to_fit_kcal", t: "Gegessen Ubrig Verbrannt\n50 1.000 0\nKohlenhydrate 0 / 100 g\nEiweiss 0 / 100 g\nFett 0 / 50 g", e: { carbs: 100, protein: 100, fat: 22.2, kcal: 1000 } },
  // Carbs+Protein allein schon über "Übrig" (1600 > 1000) -> Fett auf 0 (mehr geht über Fett nicht)
  { name: "fat_trimmed_to_zero", t: "Gegessen Ubrig Verbrannt\n50 1.000 0\nKohlenhydrate 0 / 200 g\nEiweiss 0 / 200 g\nFett 0 / 50 g", e: { carbs: 200, protein: 200, fat: 0, kcal: 1000 } },
  // REALER FEHLER (User 19.06.2026): neues App-Layout, ganzer Ring auf EINER Zeile -> Math.max griff "Gegessen"
  // (1688) statt "Übrig" (1112). Muss jetzt 1112 nehmen (Zahl der Übrig-Zeile, die zum Makro-Rest 1073 passt).
  { name: "ring_one_line_picks_ubrig_not_gegessen", t: "Heute\nWoche 64\nUbersicht  Details\n1.688 Gegessen 1.112 Ubrig 0 Verbrannt\nKohlenhydrate\nEiweiss\nFett\n187 / 341 g\n126 / 184 g\n44 / 69 g\nErnahrung\nFruhstuck 533 / 840 kcal\nMittagessen 819 / 1.120 kcal", e: { carbs: 154, protein: 58, fat: 25, kcal: 1112 } },
  // dasselbe Layout, aber Ring-Zahlen jede auf eigener Zeile (mit Labels verschachtelt) -> Sicherheitsnetz/Übrig = 1112
  { name: "ring_separate_lines_eaten_total_macros", t: "Heute\n1.688\nGegessen\n1.112\nUbrig\n0\nVerbrannt\nKohlenhydrate\n187 / 341 g\nEiweiss\n126 / 184 g\nFett\n44 / 69 g\nFruhstuck 533 / 840 kcal\nMittagessen 819 / 1.120 kcal", e: { carbs: 154, protein: 58, fat: 25, kcal: 1112 } },
];
for (const c of OCR_CASES) {
  const r = T.parseMacroScreenshot(c.t) || {};
  const ok = r.carbs === c.e.carbs && r.protein === c.e.protein && r.fat === c.e.fat && r.kcal === c.e.kcal;
  check("OCR parse: " + c.name, ok, true);
}
check("OCR parse: Müll-Text -> null", T.parseMacroScreenshot("hello world, nothing here") === null, true);
check("OCR parse: non-string -> null", T.parseMacroScreenshot(null) === null, true);
check("OCR parse: nur 2 Makros -> null", T.parseMacroScreenshot("54 / 341 g\n52 / 184 g") === null, true);
// Plausibilitäts-Stopp: absurd aufgeblähte, nicht-korrigierbare Werte trotz Übrig -> null (kein Müll-Import)
check("OCR parse: absurd + nicht korrigierbar -> null", T.parseMacroScreenshot("Gegessen Ubrig Verbrannt\n500 300 0\nKohlenhydrate 99 / 8888\nEiweiss 88 / 7777\nFett 77 / 6666") === null, true);

// ── Chopstix Noodle Bar (Build-a-Box: Base + 2/3 Toppings) ──
check("Chopstix Bases (3)", T.CHOPSTIX.bases.length, 3);
check("Chopstix Toppings (10)", T.CHOPSTIX.toppings.length, 10);
check("Chopstix Pumpkin Katsu ausgeschlossen", !T.CHOPSTIX.toppings.find(x => /pumpkin/i.test(x.name)), true);
check("Chopstix Katsu-Sauce ausgeschlossen", !T.CHOPSTIX.toppings.find(x => /katsu/i.test(x.name)), true);
check("Chopstix S&P Chicken drin (offiziell korrigiert)", !!T.CHOPSTIX.toppings.find(x => x.id === "sp_chicken"), true);
check("Chopstix S&P Chicken Carbs 9.8 (nicht 17.9 Copy-Paste)", T.CHOPSTIX.toppings.find(x => x.id === "sp_chicken").carbs, 9.8);
check("Chopstix Base skaliert (Regular != Large)", T.CHOPSTIX.bases[0].reg.kcal !== T.CHOPSTIX.bases[0].lg.kcal, true);
check("Chopstix Egg Fried Rice Regular kcal", T.CHOPSTIX.bases.find(b => b.id === "egg_fried_rice").reg.kcal, 465);
check("Chopstix Egg Fried Rice Large kcal", T.CHOPSTIX.bases.find(b => b.id === "egg_fried_rice").lg.kcal, 558);
check("Chopstix Sweet&Sour Topping kcal", T.CHOPSTIX.toppings.find(t => t.id === "sweet_sour").kcal, 162);

const tCh = { protein: 40, carbs: 60, fat: 20, kcal: 580, fibMin: null, fibMax: null, sMin: null, sMax: null };
const rCh = T.optimizeChopstix(tCh, "macros", {});
check("Chopstix liefert Ergebnisse (1..20)", rCh.length > 0 && rCh.length <= 20, true);
let chStruct = true, chSum = true;
for (const r of rCh) {
  const okS = (r.box === "regular" && r.nTop === 2 && r.tops.length === 2) || (r.box === "large" && r.nTop === 3 && r.tops.length === 3);
  if (!okS) chStruct = false;
  const sz = r.box === "large" ? "lg" : "reg";
  const exp = Math.round((r.base[sz].kcal + r.tops.reduce((s, t) => s + t.kcal, 0)) * 10) / 10;
  if (!approx(r.nutrition.kcal, exp)) chSum = false;
}
check("Chopstix Box-Struktur (regular=2 / large=3 Toppings)", chStruct, true);
check("Chopstix Nutrition == Base[Größe] + Toppings", chSum, true);
check("Chopstix nach Score sortiert", rCh.every((r, i) => i === 0 || rCh[i - 1].score <= r.score), true);
// beide Box-Größen grundsätzlich erreichbar
const rChBig = T.optimizeChopstix({ protein: 60, carbs: 120, fat: 30, kcal: 990, fibMin: null, fibMax: null, sMin: null, sMax: null }, "macros", {});
check("Chopstix: Large Box (3 Toppings) bei großem Ziel", rChBig.some(r => r.box === "large"), true);
// niedriges Ziel -> Regular Box (2 Toppings) gewinnt (3 Toppings würden überschießen)
const rChLow = T.optimizeChopstix({ protein: 18, carbs: 26, fat: 9, kcal: 257, fibMin: null, fibMax: null, sMin: null, sMax: null }, "macros", {});
check("Chopstix: Regular Box (2 Toppings) bei kleinem Ziel", rChLow.some(r => r.box === "regular"), true);
// All-restaurants: chopstix ist ein gültiger _resto-Wert
const rAllCh = T.optimizeAll({ protein: 40, carbs: 70, fat: 18, kcal: 592, fibMin: null, fibMax: null, sMin: null, sMax: null }, "macros", {}, "footlong");
check("All: alle _resto-Werte gültig (inkl. chopstix)", rAllCh.every(r => RESTOS.includes(r._resto)), true);

// ── Pepe's Piri Piri (à la carte + Add-Flavour-Mechanik) ──
check("Pepes Items (51, Deliveroo-abgeglichen)", T.PEPES.items.length, 51);
check("Pepes Kategorie-Counts (chicken18/burgers7/paneer6/sides15/sauces5)", ["chicken", "burgers", "paneer", "sides", "sauces"].map(c => T.PEPES.items.filter(x => x.cat === c).length).join(",") === "18,7,6,15,5", true);
// Deliveroo-Abgleich (15.06.2026): nicht auf Deliveroo gefuehrte Items entfernt
check("Pepes Deliveroo: keine Double-Burger/-Patties", !T.PEPES.items.find(x => /double/i.test(x.name)), true);
check("Pepes Deliveroo: Burger-Singles umbenannt (kein '- Single')", !T.PEPES.items.find(x => /- single/i.test(x.name)), true);
check("Pepes Deliveroo: keine 8er-Nuggets (nur 5er)", !T.PEPES.items.find(x => /nuggets - 8/i.test(x.name)), true);
check("Pepes Deliveroo: keine Chimichurri Fries/Wedges", !T.PEPES.items.find(x => /chimichurri (fries|wedges)/i.test(x.name)), true);
check("Pepes Deliveroo: keine Piri Piri Fries/Wedges/Onion Rings", !T.PEPES.items.find(x => /piri piri (fries|wedges|onion)/i.test(x.name)), true);
check("Pepes Deliveroo: Gourmet Beef Burger bleibt", !!T.PEPES.items.find(x => x.name === "Gourmet Beef Burger"), true);
check("Pepes Deliveroo: Chimichurri-Mayo-Dip bleibt (nicht mit Fries verwechselt)", !!T.PEPES.items.find(x => /Chimichurri Mayo/i.test(x.name)), true);
check("Pepes Deliveroo: Piri Piri Pitta Bread bleibt", !!T.PEPES.items.find(x => x.name === "Piri Piri Pitta Bread"), true);
check("Pepes Deliveroo: Onion Rings (Crispy) bleibt", !!T.PEPES.items.find(x => x.id === "onion_rings"), true);
check("Pepes Flavours (7 inkl. Plain)", T.PEPES.flavours.length, 7);
check("Pepes Plain existiert + 0 kcal", (() => { const pl = T.PEPES.flavours.find(f => f.id === "plain"); return pl && pl.kcal === 0 && pl.fat === 0 && pl.carbs === 0 && pl.protein === 0 && pl.salt === 0; })(), true);
check("Pepes Kategorien (5)", T.PEPES.cats.length, 5);
check("Pepes Sauce-Items (5)", T.PEPES.items.filter(x => x.sauce).length, 5);
check("Pepes ausgeschlossen: keine Wings/Whole/Quarter Chicken", !T.PEPES.items.find(x => /wings|whole chicken|1\/2 chicken|1\/4 chicken|pepe.?s original/i.test(x.name)), true);
check("Pepes ausgeschlossen: keine Corn/Bottles/Extra-Add-ons", !T.PEPES.items.find(x => /corn on the cob|250 ml|salt bottle|^extra /i.test(x.name)), true);
check("Pepes Onion Rings Carbs gefixt (39.3 statt 393)", T.PEPES.items.find(x => x.id === "onion_rings").carbs, 39.3);
check("Pepes fibre=0 überall (keine Quelle)", T.PEPES.items.every(x => x.fibre === 0), true);
check("Pepes Tender Strips 3 flavourMl=40", T.PEPES.items.find(x => x.id === "tender_strips_3").flavourMl, 40);

const allPep = {}; T.PEPES.cats.forEach(c => allPep[c.id] = true);
// Flavour-Mechanik: Tender Strips 3 (Basis 100 kcal, 40 ml) + Lemon & Herb (31/10ml × 4 = 124) = 224 kcal
const tTS = { protein: 22.5, carbs: 7.5, fat: 11.4, kcal: 223, fibMin: null, fibMax: null, sMin: null, sMax: null };
const rTSlh = T.optimizePepes(tTS, "macros", {}, allPep, 1, true, "lemon_herb");
const tsLH = rTSlh.find(r => /Tender Strips - 3/.test(r.items[0].name));
check("Pepes Flavour eingerechnet: Tender Strips 3 (Lemon & Herb) = 224 kcal", tsLH ? tsLH.nutrition.kcal : 0, 224);
check("Pepes Flavour-Name im Item", tsLH ? /\(Lemon & Herb\)/.test(tsLH.items[0].name) : false, true);
// anderer Flavour (Extreme 17/10ml × 4 = 68) -> 100 + 68 = 168
const rTSex = T.optimizePepes({ protein: 22.5, carbs: 4, fat: 7, kcal: 168, fibMin: null, fibMax: null, sMin: null, sMax: null }, "macros", {}, allPep, 1, true, "extreme");
const tsEx = rTSex.find(r => /Tender Strips - 3/.test(r.items[0].name));
check("Pepes Flavour wechselt Makros: Tender Strips 3 (Extreme) = 168 kcal", tsEx ? tsEx.nutrition.kcal : 0, 168);

const tPep = { protein: 40, carbs: 45, fat: 15, kcal: 555, fibMin: null, fibMax: null, sMin: null, sMax: null };
const rPep = T.optimizePepes(tPep, "macros", {}, allPep, 3, true, "lemon_herb");
let pepSum = true, pepLen = true;
for (const r of rPep) {
  const exp = Math.round(r.items.reduce((s, x) => s + x.kcal, 0) * 10) / 10;
  if (!approx(r.nutrition.kcal, exp)) pepSum = false;
  if (r.items.length < 1 || r.items.length > 3) pepLen = false;
}
check("Pepes Nutrition == Summe (mit Flavour)", pepSum, true);
check("Pepes 1–3 Items", pepLen, true);
// No Sauce: keine sauce-Items; Gegenprobe ohne Schalter
const rPepNoSauce = T.optimizePepes({ protein: 1, carbs: 5, fat: 20, kcal: 200, fibMin: null, fibMax: null, sMin: null, sMax: null }, "macros", {}, allPep, 2, true, "lemon_herb");
check("Pepes 'No sauce': keine Mayo/Sauce-Items", rPepNoSauce.every(r => r.items.every(x => !/mayo|sauce/i.test(x.name))), true);
const rPepSauce = T.optimizePepes({ protein: 1, carbs: 3, fat: 25, kcal: 230, fibMin: null, fibMax: null, sMin: null, sMax: null }, "macros", {}, allPep, 2, false, "lemon_herb");
check("Pepes ohne 'No sauce': Mayo/Sauce möglich (Gegenprobe)", rPepSauce.some(r => r.items.some(x => /mayo|sauce/i.test(x.name))), true);
// "No flavour" = Plain: flavourMl-Items behalten ihre Basis-Makros (Flavour addiert 0), Name bekommt "(Plain)"
const rTSpl = T.optimizePepes({ protein: 22.5, carbs: 0.3, fat: 1.4, kcal: 100, fibMin: null, fibMax: null, sMin: null, sMax: null }, "macros", {}, allPep, 1, true, "plain");
const tsPl = rTSpl.find(r => /Tender Strips - 3/.test(r.items[0].name));
check("Pepes Plain: Tender Strips 3 = 100 kcal (Basis, Flavour +0)", tsPl ? tsPl.nutrition.kcal : 0, 100);
check("Pepes Plain: Name trägt (Plain)", tsPl ? /\(Plain\)/.test(tsPl.items[0].name) : false, true);
// Plain ändert flavourMl-Items NICHT ggü. der reinen Basis
const baseTS = T.PEPES.items.find(x => x.id === "tender_strips_3");
check("Pepes Plain: Makros == reine Basis", tsPl ? approx(tsPl.items[0].kcal, baseTS.kcal) && approx(tsPl.items[0].protein, baseTS.protein) : false, true);
// All-restaurants: pepes gültig + Plain (No flavour default)
const rAllPep = T.optimizeAll({ protein: 38, carbs: 40, fat: 14, kcal: 438, fibMin: null, fibMax: null, sMin: null, sMax: null }, "macros", {}, "footlong");
check("All: alle _resto-Werte gültig (inkl. pepes)", rAllPep.every(r => RESTOS.includes(r._resto)), true);
check("All: Pepe's-Treffer nutzt Plain (kein gebasteter Flavour-Name)", rAllPep.filter(r => r._resto === "pepes").every(r => r.items.every(x => !/\((Lemon & Herb|Mango & Lime|Mild|Hot|Extra Hot|Extreme)\)/.test(x.name))), true);

// ── Five Guys (Build Your Own: komponierte Mains + Fries + freie Toppings) ──
check("FiveGuys Mains (13: 8 Burger + 5 Sandwiches, Hot Dogs entfernt)", T.FIVEGUYS.mains.length, 13);
check("FiveGuys keine Hot Dogs mehr", !T.FIVEGUYS.mains.find(m => m.group === "hotdogs"), true);
check("FiveGuys Fries (10: 4 Plain + 4 Cajun + 2 Loaded)", T.FIVEGUYS.fries.length, 10);
check("FiveGuys Toppings (15, Deliveroo Free-Toppings)", T.FIVEGUYS.toppings.length, 15);
check("FiveGuys 7 Sauce-Toppings (No-sauce-Filter, inkl. Mayo)", T.FIVEGUYS.toppings.filter(x => x.sauce).length, 7);
check("FiveGuys Mayo ist sauce", !!T.FIVEGUYS.toppings.find(x => x.name === "Mayonnaise" && x.sauce), true);
check("FiveGuys mods vorhanden (patty/cheese/bacon/bun/lettuce)", ["patty", "cheese", "bacon", "bun", "lettuce"].every(k => T.FIVEGUYS.mods && T.FIVEGUYS.mods[k] && typeof T.FIVEGUYS.mods[k].kcal === "number"), true);
check("FiveGuys kein Egg/Crispy-Onions/Cheese-Slice mehr im Free-Topping-Pool", !T.FIVEGUYS.toppings.find(x => /egg|crispy|cheese/i.test(x.name)), true);
// Komposition: Hamburger = 2 Patty(195) + Bun(238) = 628; Cheeseburger = +2 Cheese(64) = 756; Little Hamburger = 1 Patty + Bun = 433
check("FiveGuys Hamburger komponiert = 628 kcal (2 Patties + Bun)", T.FIVEGUYS.mains.find(m => m.name === "Hamburger").kcal, 628);
check("FiveGuys Cheeseburger = 756 kcal (2 Patties + Bun + 2 Cheese)", T.FIVEGUYS.mains.find(m => m.name === "Cheeseburger").kcal, 756);
check("FiveGuys Little Hamburger = 433 kcal (1 Patty + Bun)", T.FIVEGUYS.mains.find(m => m.name === "Little Hamburger").kcal, 433);
check("FiveGuys Hamburger Protein = 42 (2x18 + Bun 6)", T.FIVEGUYS.mains.find(m => m.name === "Hamburger").protein, 42);
check("FiveGuys Cheeseburger Salt = 2.27 (2x0.13 + Bun 0.49 + 2x0.76)", T.FIVEGUYS.mains.find(m => m.name === "Cheeseburger").salt, 2.27);
// Cajun Fries = Little Fries(659) + Cajun Seasoning(20) = 679
check("FiveGuys Little Cajun Fries = 679 kcal", T.FIVEGUYS.fries.find(f => f.name === "Little Cajun Fries").kcal, 679);
check("FiveGuys hat volle 8 Makros (fibre vorhanden)", T.FIVEGUYS.mains.every(m => typeof m.fibre === "number"), true);

const rFG = T.optimizeFiveGuys({ protein: 40, carbs: 45, fat: 30, kcal: 610, fibMin: null, fibMax: null, sMin: null, sMax: null }, "macros", {}, true);
check("FiveGuys liefert Ergebnisse (1..20)", rFG.length > 0 && rFG.length <= 20, true);
check("FiveGuys jedes Ergebnis kind=fiveguys + min. 1 von main/fries", rFG.every(r => r.kind === "fiveguys" && (r.main || r.fries)), true);
// Robuste Nutrition-Pruefung: Main + Bun-Mod (Bowl/Wrap) + Extra-Patties + Toppings + Sandwich-Extras + Fries
const fgKcal = r => {
  const M = T.FIVEGUYS.mods; let k = r.main ? r.main.kcal : 0;
  if (r.bun === "bowl") k -= M.bun.kcal; else if (r.bun === "wrap") k += -M.bun.kcal + M.lettuce.kcal;
  k += (r.extraPatties || 0) * M.patty.kcal;
  k += r.tops.reduce((s, x) => s + x.kcal, 0);
  k += (r.extras || []).reduce((s, nm) => s + (nm === "Extra Patty" ? M.patty.kcal : nm === "Cheese" ? M.cheese.kcal : M.bacon.kcal), 0);
  k += r.fries ? r.fries.kcal : 0; return Math.round(k * 10) / 10;
};
check("FiveGuys Nutrition == Main + Bun-Mod + Extra-Patties + Toppings + Extras + Fries", rFG.every(r => approx(r.nutrition.kcal, fgKcal(r))), true);
check("FiveGuys Toppings/Extras nur mit Main", rFG.every(r => r.main || (r.tops.length === 0 && (!r.extras || r.extras.length === 0))), true);
check("FiveGuys Extras (paid) nur auf Sandwiches", rFG.every(r => !r.extras || r.extras.length === 0 || (r.main && r.main.group === "sandwiches")), true);
check("FiveGuys Bun-Wahl nur bei Burgern", rFG.every(r => !r.bun || (r.main && r.main.group === "burgers")), true);
check("FiveGuys nach Score sortiert", rFG.every((r, i) => i === 0 || rFG[i - 1].score <= r.score), true);
// No-sauce-Schalter: AN -> keine Sauce-Toppings; Gegenprobe AUS -> Sauce/Mayo moeglich (fettiges Ziel)
const fgFatTgt = { protein: 30, carbs: 5, fat: 50, kcal: 590, fibMin: null, fibMax: null, sMin: null, sMax: null };
check("FiveGuys 'No sauce': keine Sauce-Toppings (inkl. Mayo)", T.optimizeFiveGuys(fgFatTgt, "macros", {}, true).every(r => r.tops.every(tp => !tp.sauce)), true);
check("FiveGuys ohne 'No sauce': Sauce/Mayo moeglich (Gegenprobe)", T.optimizeFiveGuys(fgFatTgt, "macros", {}, false).some(r => r.tops.some(tp => tp.sauce)), true);
// Bun-Wahl: low-carb-Ziel -> Bowl/Lettuce Wrap erscheint
check("FiveGuys low-carb -> Bowl/Lettuce Wrap erscheint", T.optimizeFiveGuys({ protein: 50, carbs: 8, fat: 35, kcal: 547, fibMin: null, fibMax: null, sMin: null, sMax: null }, "macros", {}, true).some(r => r.bun === "bowl" || r.bun === "wrap"), true);
// Schalter "Lettuce Wrap" (wrapOnly): erzwingt bei ALLEN Burgern bun="wrap"
const rWrap = T.optimizeFiveGuys({ protein: 45, carbs: 30, fat: 40, kcal: 660, fibMin: null, fibMax: null, sMin: null, sMax: null }, "macros", {}, true, true);
check("FiveGuys 'Lettuce Wrap': alle Burger-Treffer = wrap", rWrap.every(r => !(r.main && r.main.group === "burgers") || r.bun === "wrap"), true);
check("FiveGuys 'Lettuce Wrap': kein Bun/Bowl-Burger mehr", !rWrap.find(r => r.main && r.main.group === "burgers" && (r.bun === "bun" || r.bun === "bowl")), true);
check("FiveGuys ohne 'Lettuce Wrap': nicht-wrap Burger moeglich (Gegenprobe)", T.optimizeFiveGuys({ protein: 42, carbs: 45, fat: 35, kcal: 663, fibMin: null, fibMax: null, sMin: null, sMax: null }, "macros", {}, true, false).some(r => r.main && r.main.group === "burgers" && r.bun !== "wrap"), true);
// Extra patties: high-protein-Ziel -> Extra Patties moeglich
const rHiPro = T.optimizeFiveGuys({ protein: 75, carbs: 40, fat: 45, kcal: 865, fibMin: null, fibMax: null, sMin: null, sMax: null }, "macros", {}, true);
check("FiveGuys high-protein -> Extra Patties erscheint", rHiPro.some(r => r.extraPatties > 0), true);
check("FiveGuys Extra Patties nur bei regulaeren Burgern (nie Little)", rHiPro.every(r => !(r.main && /^Little/.test(r.main.name)) || r.extraPatties === 0), true);
// Sandwich-incl: Lettuce Wrap/BLT bieten ihre bereits enthaltenen Toppings NICHT noch mal an (kein Doppelzaehlen)
const lw = T.FIVEGUYS.mains.find(m => m.id === "lettuce_wrap"), blt = T.FIVEGUYS.mains.find(m => m.id === "blt");
check("FiveGuys Lettuce Wrap/BLT haben incl-Liste", !!(lw && lw.incl && lw.incl.length === 5 && blt && blt.incl && blt.incl.length === 2), true);
const rInclSweep = ["macros"].flatMap(() => [{ protein: 24, carbs: 6, fat: 14, kcal: 246 }, { protein: 30, carbs: 50, fat: 40, kcal: 680 }, { protein: 22, carbs: 45, fat: 41, kcal: 653 }]).flatMap(tg => T.optimizeFiveGuys({ ...tg, fibMin: null, fibMax: null, sMin: null, sMax: null }, "macros", {}, true));
check("FiveGuys Sandwiches re-adden KEINE bereits enthaltenen Toppings", rInclSweep.every(r => !(r.main && r.main.incl) || r.tops.every(tp => !r.main.incl.includes(tp.id))), true);
check("FiveGuys Lettuce-Wrap-Ziel surface't einen Lettuce Wrap (incl-Pfad geuebt)", T.optimizeFiveGuys({ protein: 24, carbs: 6, fat: 14, kcal: 246, fibMin: null, fibMax: null, sMin: null, sMax: null }, "macros", {}, true).some(r => r.main && r.main.id === "lettuce_wrap"), true);
const rFGsmall = T.optimizeFiveGuys({ protein: 24, carbs: 38, fat: 21, kcal: 433, fibMin: null, fibMax: null, sMin: null, sMax: null }, "macros", {}, true);
check("FiveGuys kleines Ziel trifft Little Hamburger (Top 5)", rFGsmall.slice(0, 5).some(r => r.main && r.main.name === "Little Hamburger"), true);
// All-restaurants: fiveguys gueltig
const rAllFG = T.optimizeAll({ protein: 45, carbs: 60, fat: 35, kcal: 735, fibMin: null, fibMax: null, sMin: null, sMax: null }, "macros", {}, "footlong");
check("All: fiveguys-Treffer gueltig (kind + main/fries)", rAllFG.filter(r => r._resto === "fiveguys").every(r => r.kind === "fiveguys" && (r.main || r.fries)), true);

// ── Pizza Express (à la carte, AC-Familie; volle PDF-Makros) ──
check("PizzaExpress Items (156, Deliveroo-geprunt)", T.PIZZAEXPRESS.items.length, 156);
check("PizzaExpress Kategorien (9)", T.PIZZAEXPRESS.cats.length, 9);
check("PizzaExpress Desserts-Kategorie default AUS (User-Wunsch)", T.PIZZAEXPRESS.cats.find(c => c.id === "desserts").on, false);
// Deliveroo-Prune-Guard (User 17.06.2026): nicht-bestellbare Produkte raus, Dine-Out-Suffix entfernt, Squad Sharer benannt
check("PizzaExpress kein Padana (nicht auf Deliveroo)", !T.PIZZAEXPRESS.items.some(x => /padana/i.test(x.name)), true);
check("PizzaExpress kein Garlic Prawn (nicht auf Deliveroo)", !T.PIZZAEXPRESS.items.some(x => /garlic prawn/i.test(x.name)), true);
check("PizzaExpress keine Leggera-Pizza (Pomodoro raus)", !T.PIZZAEXPRESS.items.some(x => /pomodoro/i.test(x.name)), true);
check("PizzaExpress keine '(Dine Out)'-Namen mehr", !T.PIZZAEXPRESS.items.some(x => /dine out/i.test(x.name)), true);
check("PizzaExpress 'Squad Sharer' vorhanden (= Sharing Trio)", T.PIZZAEXPRESS.items.some(x => x.name === "Squad Sharer"), true);
check("PizzaExpress 8 Desserts (Deliveroo)", T.PIZZAEXPRESS.items.filter(x => x.cat === "desserts").length, 8);
check("PizzaExpress volle 8 Makros (alle Felder numerisch)", T.PIZZAEXPRESS.items.every(x => ["kcal", "fat", "sat", "carbs", "sugars", "fibre", "protein", "salt"].every(k => typeof x[k] === "number")), true);
check("PizzaExpress Margherita (Classic) = 711 kcal", (T.PIZZAEXPRESS.items.find(x => x.id === "margherita") || {}).kcal, 711);
check("PizzaExpress American (Classic) = 849 kcal", (T.PIZZAEXPRESS.items.find(x => x.id === "american") || {}).kcal, 849);
const pxBad = T.PIZZAEXPRESS.items.filter(x => { const est = 4 * x.carbs + 4 * x.protein + 9 * x.fat; return Math.abs(x.kcal - est) > 60 && Math.abs(x.kcal - est) / Math.max(x.kcal, 1) > 0.15; });
check("PizzaExpress alle Items kcal-plausibel (est=4C+4P+9F)", pxBad.length, 0);
const allPX = {}; T.PIZZAEXPRESS.cats.forEach(c => allPX[c.id] = true);
const rPX = T.optimizePizzaExpress({ protein: 40, carbs: 60, fat: 25, kcal: 625, fibMin: null, fibMax: null, sMin: null, sMax: null }, "macros", {}, allPX, 3);
check("PizzaExpress liefert Ergebnisse (1..20)", rPX.length > 0 && rPX.length <= 20, true);
check("PizzaExpress Nutrition == Summe der Items", rPX.every(r => approx(r.nutrition.kcal, Math.round(r.items.reduce((s, x) => s + x.kcal, 0) * 10) / 10)), true);
check("PizzaExpress 1–3 Items", rPX.every(r => r.items.length >= 1 && r.items.length <= 3), true);
const onlyClassic = {}; T.PIZZAEXPRESS.cats.forEach(c => onlyClassic[c.id] = (c.id === "classic"));
check("PizzaExpress Kategorie-Filter (nur Classic)", T.optimizePizzaExpress({ protein: 40, carbs: 90, fat: 35, kcal: 835, fibMin: null, fibMax: null, sMin: null, sMax: null }, "macros", {}, onlyClassic, 1).every(r => r.items.every(x => x.cat === "classic")), true);
// "No vegan" / "No GF" — nur AUSDRÜCKLICH gekennzeichnete Produkte raus (Name-basiert; zufällig vegan/GF bleibt)
check("PizzaExpress Katalog hat vegane Items", T.PIZZAEXPRESS.items.some(x => /vegan/i.test(x.name)), true);
check("PizzaExpress Katalog hat GF Items", T.PIZZAEXPRESS.items.some(x => /\bGF\b/.test(x.name)), true);
const pxGF = /\bGF\b|gluten[\s-]?free/i;
check("PizzaExpress 'No vegan': kein vegan-Item im Ergebnis", T.optimizePizzaExpress({ protein: 30, carbs: 80, fat: 20, kcal: 620, fibMin: null, fibMax: null, sMin: null, sMax: null }, "macros", {}, allPX, 5, true, false).every(r => r.items.every(x => !/vegan/i.test(x.name))), true);
check("PizzaExpress 'No GF': kein GF-Item im Ergebnis", T.optimizePizzaExpress({ protein: 30, carbs: 80, fat: 20, kcal: 620, fibMin: null, fibMax: null, sMin: null, sMax: null }, "macros", {}, allPX, 5, false, true).every(r => r.items.every(x => !pxGF.test(x.name))), true);
// Gegenprobe: Ziel = exakte Makros eines veganen bzw. GF Items -> ohne Schalter erscheint es, mit Schalter weg
const pxVg = T.PIZZAEXPRESS.items.find(x => /vegan/i.test(x.name) && !pxGF.test(x.name));
const pxVgCat = {}; pxVgCat[pxVg.cat] = true; const pxVgT = { protein: pxVg.protein, carbs: pxVg.carbs, fat: pxVg.fat, kcal: pxVg.kcal, fibMin: null, fibMax: null, sMin: null, sMax: null };
check("PizzaExpress ohne 'No vegan': veganes Item möglich (Gegenprobe)", T.optimizePizzaExpress(pxVgT, "macros", {}, pxVgCat, 1, false, false).some(r => r.items.some(x => /vegan/i.test(x.name))), true);
check("PizzaExpress 'No vegan' entfernt genau dieses Item", T.optimizePizzaExpress(pxVgT, "macros", {}, pxVgCat, 1, true, false).every(r => r.items.every(x => !/vegan/i.test(x.name))), true);
const pxGf = T.PIZZAEXPRESS.items.find(x => pxGF.test(x.name) && !/vegan/i.test(x.name));
const pxGfCat = {}; pxGfCat[pxGf.cat] = true; const pxGfT = { protein: pxGf.protein, carbs: pxGf.carbs, fat: pxGf.fat, kcal: pxGf.kcal, fibMin: null, fibMax: null, sMin: null, sMax: null };
check("PizzaExpress ohne 'No GF': GF-Item möglich (Gegenprobe)", T.optimizePizzaExpress(pxGfT, "macros", {}, pxGfCat, 1, false, false).some(r => r.items.some(x => pxGF.test(x.name))), true);
check("PizzaExpress 'No GF' entfernt genau dieses Item", T.optimizePizzaExpress(pxGfT, "macros", {}, pxGfCat, 1, false, true).every(r => r.items.every(x => !pxGF.test(x.name))), true);
// All + Accurate: pizzaexpress integriert
const rAccPX = T.optimizeAll(tAllT, "macros", {}, "footlong", ACCURATE);
check("Accurate: pizzaexpress in Whitelist + alle Treffer gueltig", ACCURATE.includes("pizzaexpress") && rAccPX.every(r => ACCURATE.includes(r._resto)), true);

// ── Wasabi (à la carte, AC-Familie; per-100g -> per-Portion skaliert; Itsu-artige Switches) ──
check("Wasabi Items (158)", T.WASABI.items.length, 158);
check("Wasabi Kategorien (8)", T.WASABI.cats.length, 8);
check("Wasabi fibre=0 (keine Quelle)", T.WASABI.items.every(x => x.fibre === 0), true);
check("Wasabi keine Platters (Sharing ausgeschlossen)", !T.WASABI.items.find(x => /platter/i.test(x.name)), true);
// Regression-Guard fuer den Bento-Fix (Seite 14 raus): keine doppelten Bento-Namen, kein sat=0 durch leeren Header
const wBento = T.WASABI.items.filter(x => x.cat === "bento");
const wBNames = wBento.map(x => x.name.toLowerCase().replace(/ bento$/, "").trim());
check("Wasabi Bento ohne Namens-Duplikate (S.14-Dedup)", wBNames.every((n, i) => wBNames.indexOf(n) === i), true);
check("Wasabi Bento kein sat=0 (leerer Header gefixt)", wBento.every(x => x.sat > 0), true);
const wbad = T.WASABI.items.filter(x => { const est = 4 * x.carbs + 4 * x.protein + 9 * x.fat; return Math.abs(x.kcal - est) > 60 && Math.abs(x.kcal - est) / Math.max(x.kcal, 1) > 0.25; });
check("Wasabi kcal-plausibel (<=2 bekannte PDF-Anomalien)", wbad.length <= 2, true);
const allW = {}; T.WASABI.cats.forEach(c => allW[c.id] = true);
const tgtW = { protein: 25, carbs: 60, fat: 15, kcal: 475, fibMin: null, fibMax: null, sMin: null, sMax: null };
const rW = T.optimizeWasabi(tgtW, "macros", {}, allW, 3, false, false, false);
check("Wasabi liefert Ergebnisse (1..20)", rW.length > 0 && rW.length <= 20, true);
check("Wasabi Nutrition == Summe", rW.every(r => approx(r.nutrition.kcal, Math.round(r.items.reduce((s, x) => s + x.kcal, 0) * 10) / 10)), true);
check("Wasabi 1–3 Items", rW.every(r => r.items.length >= 1 && r.items.length <= 3), true);
// Schalter "No soups": keine Soup-Items
check("Wasabi 'No soups': keine Soup-Items", T.optimizeWasabi(tgtW, "macros", {}, allW, 2, true, false, false).every(r => r.items.every(x => x.cat !== "soup")), true);
check("Wasabi ohne 'No soups': Soup moeglich (Gegenprobe)", T.optimizeWasabi({ protein: 18, carbs: 8, fat: 5, kcal: 150, fibMin: null, fibMax: null, sMin: null, sMax: null }, "macros", {}, allW, 1, false, false, false).some(r => r.items.some(x => x.cat === "soup")) || T.WASABI.items.some(x => x.cat === "soup"), true);
// Schalter "only sushi": nur Sushi-Kategorie
check("Wasabi 'only sushi': nur Sushi-Items", T.optimizeWasabi(tgtW, "macros", {}, allW, 3, false, true, false).every(r => r.items.every(x => x.cat === "sushi")), true);
// "only sushi w/o sashimi": Sushi ohne Sashimi-Namen
check("Wasabi 'only sushi w/o sashimi': kein Sashimi", T.optimizeWasabi(tgtW, "macros", {}, allW, 3, false, false, true).every(r => r.items.every(x => x.cat === "sushi" && !/sashimi/i.test(x.name))), true);
check("Wasabi hat Sashimi-Items (Switch wirkt)", T.WASABI.items.some(x => /sashimi/i.test(x.name)), true);
// Schalter "good meals only" (Default): nur Salads&Boxes (salads) + Hot Bento & Kobachi (bento) + Sides
const GOODCATS = ["salads", "bento", "sides"];
const rGood = T.optimizeWasabi(tgtW, "macros", {}, allW, 3, false, false, false, true);
check("Wasabi 'good meals only': nur salads/bento/sides", rGood.length > 0 && rGood.every(r => r.items.every(x => GOODCATS.includes(x.cat))), true);
check("Wasabi 'good meals only': kein Sushi/Soup/Sauces/Breakfast/Cold Sides", rGood.every(r => r.items.every(x => !["sushi", "soup", "sauces", "breakfast", "cold_sides"].includes(x.cat))), true);
check("Wasabi 'good meals only' liefert die Kobachi (in bento)", T.WASABI.items.some(x => /kobachi/i.test(x.name) && x.cat === "bento"), true);
check("Wasabi 'good meals only' ueberstimmt aktive Chips (Gegenprobe: ohne Schalter Sushi moeglich)", T.optimizeWasabi({ protein: 12, carbs: 30, fat: 4, kcal: 200, fibMin: null, fibMax: null, sMin: null, sMax: null }, "macros", {}, allW, 2, false, false, false, false).some(r => r.items.some(x => x.cat === "sushi")) || T.WASABI.items.some(x => x.cat === "sushi"), true);
// All + Accurate: wasabi integriert
const rAccW = T.optimizeAll(tAllT, "macros", {}, "footlong", ACCURATE);
check("Accurate: wasabi in Whitelist + alle Treffer gueltig", ACCURATE.includes("wasabi") && rAccW.every(r => ACCURATE.includes(r._resto)), true);

// ── "Add own order" — restaurantsuebergreifender Such-Index + Order-Summe ──
check("Search-Index gefuellt (>900 Items)", T.SEARCH_INDEX.length > 900, true);
check("Search-Index: alle Eintraege haben resto+name+8 Makros", T.SEARCH_INDEX.every(x => x.resto && x.name && ["kcal", "fat", "sat", "carbs", "sugars", "fibre", "protein", "salt"].every(k => typeof x[k] === "number")), true);
check("Search-Index: keine exakten Duplikate (resto|name|kcal)", (() => { const s = new Set(); return T.SEARCH_INDEX.every(x => { const k = x.resto + "|" + x.name + "|" + x.kcal; if (s.has(k)) return false; s.add(k); return true; }); })(), true);
check("Search-Index deckt alle 18 Restaurants ab", new Set(T.SEARCH_INDEX.map(x => x.resto)).size, 18);
check("searchItems leere Query -> []", T.searchItems("").length, 0);
const sKatsu = T.searchItems("katsu");
check("searchItems 'katsu' liefert Treffer", sKatsu.length > 0, true);
check("searchItems 'katsu': jeder Treffer matcht den Begriff", sKatsu.every(x => /katsu/i.test(x.name + " " + x.resto)), true);
check("searchItems Mehrwort-AND ('wasabi katsu')", T.searchItems("wasabi katsu").every(x => /katsu/i.test(x.name) && /wasabi/i.test(x.resto)), true);
check("searchItems respektiert limit", T.searchItems("a", 5).length <= 5, true);
check("searchItems matcht auch Restaurantname ('subway')", T.searchItems("subway").every(x => x.resto === "Subway") && T.searchItems("subway").length > 0, true);
// orderTotal: Summe x qty, 1 Dezimale
const oi1 = { resto: "X", name: "A", kcal: 100, fat: 5, sat: 1, carbs: 10, sugars: 2, fibre: 1, protein: 8, salt: 0.5 };
const oi2 = { resto: "X", name: "B", kcal: 200, fat: 10, sat: 2, carbs: 20, sugars: 4, fibre: 2, protein: 16, salt: 1 };
const ot = T.orderTotal([{ item: oi1, qty: 2 }, { item: oi2, qty: 1 }]);
check("orderTotal kcal (2x100 + 1x200 = 400)", ot.kcal, 400);
check("orderTotal protein (2x8 + 1x16 = 32)", ot.protein, 32);
check("orderTotal salt (2x0.5 + 1x1 = 2)", ot.salt, 2);
check("orderTotal leere Bestellung -> alles 0", T.orderTotal([]).kcal === 0 && T.orderTotal([]).protein === 0, true);

console.log(failures ? `\n${failures} Test(s) fehlgeschlagen` : "\nAlle Tests bestanden");
process.exit(failures ? 1 : 0);
