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

(0, eval)(m[1] + "\n;globalThis.__t = { D, FJ, ITSU, PRET, NANDOS, UG, WAGA, GDK, STD_SALAD, sumN, optimize, optimizeFJ, optimizeItsu, optimizePret, optimizeNandos, optimizeUG, optimizeWaga, optimizeGDK, sortResults };");
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

// Schalter "only sushi": nur Kategorie sushi_poke
const riSushi = T.optimizeItsu(t4, "macros", {}, allCats, 2, false, true, false);
check("Itsu 'only sushi': nur sushi_poke-Kategorie", riSushi.every(r => r.items.every(x => x.cat === "sushi_poke")), true);
check("Itsu 'only sushi': liefert Ergebnisse", riSushi.length > 0, true);
// "only sushi" enthält Sashimi-Item grundsätzlich (über alle Kombis)
check("Itsu 'only sushi': Sashimi erlaubt", riSushi.some(r => r.items.some(x => /sashimi/i.test(x.name))), true);

// Schalter "only sushi w/o sashimi": sushi_poke minus Sashimi
const riNoSashimi = T.optimizeItsu(t4, "macros", {}, allCats, 2, false, false, true);
check("Itsu 'w/o sashimi': nur sushi_poke", riNoSashimi.every(r => r.items.every(x => x.cat === "sushi_poke")), true);
check("Itsu 'w/o sashimi': kein Sashimi", riNoSashimi.every(r => r.items.every(x => !/sashimi/i.test(x.name))), true);
check("Itsu Sashimi-Item existiert", !!T.ITSU.items.find(x => /sashimi/i.test(x.name)), true);

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
// User-Ausschlüsse: alle einzelnen Wings + Extra Saucy + Roulette + Chicken Livers (beide "3 Chicken Wings" weg)
const nandosExcluded = ["10 Chicken Wings", "5 Chicken Wings", "3 Chicken Wings", "Wing Roulette",
  "10 Extra Saucy Wings", "5 Extra Saucy Wings", "3 Extra Saucy Wings", "Chicken Livers & Rustic Portuguese Roll"];
check("Nando's User-Ausschlüsse alle weg (8 Namen)", nandosExcluded.every(n => !T.NANDOS.items.find(x => x.name === n)), true);
check("Nando's XL Wing Platter bleibt (nicht ausgeschlossen)", !!T.NANDOS.items.find(x => x.id === "xl_wing_platter"), true);

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
check("GDK Items (60, Burrito Mix entfernt)", T.GDK.items.length, 60);
check("GDK Doner Burrito Mix entfernt (Datenfehler)", !T.GDK.items.find(x => x.id === "doner_burrito_mix"), true);
check("GDK Kategorien (7)", T.GDK.cats.length, 7);
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

console.log(failures ? `\n${failures} Test(s) fehlgeschlagen` : "\nAlle Tests bestanden");
process.exit(failures ? 1 : 0);
