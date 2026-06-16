// Generiert den FIVEGUYS-Block in index.html aus data/fiveguys-raw.json: node fiveguys-update.js
// Five Guys ist Build-Your-Own. Burger/Hot Dogs werden hier aus Komponenten (Patty/Bun/Cheese/Bacon/Hot Dog)
// komponiert; Sandwiches/Loaded Fries kommen fertig; Cajun-Fries = Fries + 1 Cajun Seasoning. Volle 8 Makros.
const fs = require("fs");
const raw = JSON.parse(fs.readFileSync(__dirname + "/data/fiveguys-raw.json", "utf8"));
const KEYS = ["kcal", "fat", "sat", "carbs", "sugars", "fibre", "protein", "salt"];

const slug = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
const R2 = v => Math.round(v * 100) / 100;
const C = raw.components;

// Summiert eine Liste {comp, n}-Paare zu 8 Makros
const compose = parts => {
  const o = {}; for (const k of KEYS) o[k] = 0;
  for (const { comp, n } of parts) for (const k of KEYS) o[k] += (comp[k] || 0) * n;
  for (const k of KEYS) o[k] = R2(o[k]);
  return o;
};
const macStr = x => KEYS.map(k => `${k}:${x[k]}`).join(",");

const usedIds = new Set();
const mkId = name => { let id = slug(name); while (usedIds.has(id)) id += "_2"; usedIds.add(id); return id; };

// ── Mains: Burger (komponiert) + Hot Dogs (komponiert) + Sandwiches (fertig) ──
const mains = [];
for (const b of raw.burgers) {
  const m = compose([{ comp: C.patty, n: b.patties }, { comp: C.burger_bun, n: 1 },
    { comp: C.cheese, n: b.cheese }, { comp: C.bacon, n: b.bacon }]);
  mains.push({ id: mkId(b.name), name: b.name, group: "burgers", ...m });
}
// Hot Dogs auf User-Wunsch entfernt (16.06.2026)
for (const s of raw.sandwiches) {
  const o = { id: mkId(s.name), name: s.name, group: "sandwiches" };
  if (s.incl) o.incl = s.incl.map(slug); // bereits enthaltene Toppings (Topping-IDs) -> aus dem Greedy-Pool ausschliessen
  for (const k of KEYS) o[k] = R2(s[k] || 0);
  mains.push(o);
}

// ── Fries: Plain + Cajun (Plain + Cajun Seasoning) + Loaded (fertig) ──
const fries = [];
for (const f of raw.fries_base) {
  const plain = { id: mkId(f.name), name: f.name }; for (const k of KEYS) plain[k] = R2(f[k] || 0);
  fries.push(plain);
  const cn = f.name.replace(/Fries/, "Cajun Fries");
  const cm = compose([{ comp: f, n: 1 }, { comp: raw.cajun_seasoning, n: 1 }]);
  fries.push({ id: mkId(cn), name: cn, ...cm });
}
for (const l of raw.loaded) {
  const o = { id: mkId(l.name), name: l.name }; for (const k of KEYS) o[k] = R2(l[k] || 0);
  fries.push(o);
}

// ── Toppings (fertig; sauce-Flag fuer "No sauce") ──
const toppings = raw.toppings.map(t => {
  const o = { id: mkId(t.name), name: t.name }; if (t.sauce) o.sauce = true; for (const k of KEYS) o[k] = R2(t[k] || 0); return o;
});

// ── mods: Komponenten fuer Bun-Wahl (Bowl/Wrap = -Bun [+Lettuce]), Extra Patties + Sandwich-Extras (Patty/Cheese/Bacon) ──
const lettuceRaw = raw.toppings.find(t => t.name === "Lettuce");
const modOf = c => { const o = {}; for (const k of KEYS) o[k] = R2(c[k] || 0); return o; };
const mods = { patty: modOf(C.patty), cheese: modOf(C.cheese), bacon: modOf(C.bacon), bun: modOf(C.burger_bun), lettuce: modOf(lettuceRaw) };
const modStr = m => `{ ${macStr(m)} }`;

const lines = [];
lines.push("// __FIVEGUYS_DATA_START__ (generiert via: node fiveguys-update.js aus data/fiveguys-raw.json — nicht von Hand editieren)");
lines.push("// Quelle: Five Guys UK Naehrwerttabelle (komponenten-basiert) · Stand " + raw._meta.updated +
  " · Burger/Dogs aus Komponenten komponiert (Hamburger=2 Patties, Cheese=1/Patty, Bacon=1 Portion; Cheese Dog=1 Cheese)");
lines.push("const FIVEGUYS = {");
lines.push("  // Mains: " + mains.length + " (Burger komponiert, Hot Dogs komponiert, Sandwiches fertig)");
lines.push("  mains: [");
for (const m of mains) lines.push(`    { id:${JSON.stringify(m.id)},name:${JSON.stringify(m.name)},group:${JSON.stringify(m.group)}${m.incl ? ",incl:" + JSON.stringify(m.incl) : ""},${macStr(m)} },`);
lines.push("  ],");
lines.push("  // Fries: Plain + Cajun (=Plain + Cajun Seasoning) + Loaded");
lines.push("  fries: [");
for (const f of fries) lines.push(`    { id:${JSON.stringify(f.id)},name:${JSON.stringify(f.name)},${macStr(f)} },`);
lines.push("  ],");
lines.push("  // Freie Toppings (Deliveroos 15; sauce:true wird vom 'No sauce'-Schalter gefiltert)");
lines.push("  toppings: [");
for (const t of toppings) lines.push(`    { id:${JSON.stringify(t.id)},name:${JSON.stringify(t.name)}${t.sauce ? ",sauce:true" : ""},${macStr(t)} },`);
lines.push("  ],");
lines.push("  // Komponenten fuer Burger-Bun-Wahl (Bowl/Wrap), Extra Patties + Sandwich-Extras (Patty/Cheese/Bacon)");
lines.push("  mods: {");
lines.push(`    patty: ${modStr(mods.patty)},`);
lines.push(`    cheese: ${modStr(mods.cheese)},`);
lines.push(`    bacon: ${modStr(mods.bacon)},`);
lines.push(`    bun: ${modStr(mods.bun)},`);
lines.push(`    lettuce: ${modStr(mods.lettuce)},`);
lines.push("  },");
lines.push("};");
lines.push("// __FIVEGUYS_DATA_END__");
const block = lines.join("\n");

const file = __dirname + "/index.html";
const html = fs.readFileSync(file, "utf8");
const re = /\/\/ __FIVEGUYS_DATA_START__[\s\S]*?\/\/ __FIVEGUYS_DATA_END__/;
if (!re.test(html)) { console.error("FIVEGUYS-Marker in index.html nicht gefunden — erst Platzhalter einsetzen"); process.exit(1); }
fs.writeFileSync(file, html.replace(re, block), "utf8");

console.log(mains.length + " Mains + " + fries.length + " Fries + " + toppings.length + " Toppings -> index.html (FIVEGUYS-Block)");
console.log("  Burger: " + mains.filter(m => m.group === "burgers").length + ", Sandwiches: " + mains.filter(m => m.group === "sandwiches").length);
for (const m of mains.filter(m => m.group === "burgers")) console.log(`    ${m.name}: ${m.kcal} kcal, P ${m.protein}, F ${m.fat}, C ${m.carbs}`);
