// Frischt die Naehrwerte der bereits kuratierten Wagamama-Items in data/wagamama-raw.json gegen wagamama.com auf:
//   node wagamama-refresh.js            (zeigt Diffs + schreibt data/wagamama-raw.json)
//   node wagamama-refresh.js --dry      (nur Diffs anzeigen, nichts schreiben)
// Danach: node wagamama-update.js  (regeneriert den WAGAMAMA-Block in index.html)
//
// Quelle: https://www.wagamama.com/menu?category=big-plates — die Seite ist eine Nuxt-3-App; das GANZE Menue
// (142 Gerichte) inkl. per-Serving-Naehrwerten steckt im <script id="__NUXT_DATA__"> als devalue-Payload
// (flacher Array mit Index-Referenzen). Ein Fetch reicht (die category ist nur ein Client-Filter).
// WICHTIG: Dieses Skript aendert NUR die 8 Makros vorhandener Items (Name-Match, case-insensitiv) — es prunt/
// benennt/ergaenzt NICHTS (das bleibt die manuelle Deliveroo-Kuratierung). Allergene werden NICHT angefasst.
// Sonderfall: unser Deliveroo-Name "yasai yaki soba | mushroom" traegt bewusst die rice-noodle-Basis (660);
// live heisst diese Variante "yasai yaki soba | rice noodles" (live "| mushroom" = 768 ist ein anderes Gericht).
const fs = require("fs");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
const DRY = process.argv.includes("--dry");
const F = ["kcal", "fat", "sat", "carbs", "sugars", "fibre", "protein", "salt"];
// Naehrwert-Desc (aus dem Payload) -> unser Feld. per-Serving-Spalte ("PerServ").
const NMAP = { "energy (kcal)": "kcal", "protein (g)": "protein", "carb (g)": "carbs", "of which sugars (g)": "sugars", "fat (g)": "fat", "sat fat (g)": "sat", "salt (g)": "salt", "fibre (g)": "fibre" };
// Deliveroo-Name -> Live-Name (Sonderfaelle)
const OVERRIDE = { "yasai yaki soba | mushroom": "yasai yaki soba | rice noodles" };

// devalue-Unflatten (Nuxt 3): flacher Array, Zahlen sind Index-Referenzen; Nuxt-Wrapper (Reactive/Ref/...) werden entpackt.
function unflatten(values) {
  const hydrated = new Array(values.length), done = new Array(values.length).fill(false);
  function h(index) {
    if (index === -1) return undefined; if (index === -2) return null; if (index === -3) return NaN;
    if (index === -4) return Infinity; if (index === -5) return -Infinity; if (index === -6) return -0;
    if (typeof index !== "number") return index;
    if (done[index]) return hydrated[index];
    const v = values[index];
    if (!v || typeof v !== "object") { done[index] = true; hydrated[index] = v; return v; }
    if (Array.isArray(v)) {
      if (typeof v[0] === "string") {
        const type = v[0];
        if (["Reactive", "Ref", "ShallowRef", "ShallowReactive", "EmptyRef", "EmptyShallowRef", "NuxtError", "Island"].includes(type)) { done[index] = true; const rr = h(v[1]); hydrated[index] = rr; return rr; }
        if (type === "Set") { const s = new Set(); done[index] = true; hydrated[index] = s; for (let i = 1; i < v.length; i++) s.add(h(v[i])); return s; }
        if (type === "Map") { const mp = new Map(); done[index] = true; hydrated[index] = mp; for (let i = 1; i < v.length; i += 2) mp.set(h(v[i]), h(v[i + 1])); return mp; }
        const arr = []; done[index] = true; hydrated[index] = arr; for (let i = 1; i < v.length; i++) arr.push(h(v[i])); return arr;
      } else { const arr = []; done[index] = true; hydrated[index] = arr; for (const i of v) arr.push(h(i)); return arr; }
    } else { const o = {}; done[index] = true; hydrated[index] = o; for (const k in v) o[k] = h(v[k]); return o; }
  }
  return h(0);
}
const num = s => { const f = parseFloat(String(s).replace(/,/g, "")); return isNaN(f) ? null : f; };
const norm = s => s.toLowerCase().replace(/\(may contain[^)]*\)/g, "").replace(/\s+/g, " ").trim();

(async () => {
  const r = await fetch("https://www.wagamama.com/menu?category=big-plates", { headers: { "User-Agent": UA } });
  if (!r.ok) { console.error("Fetch fehlgeschlagen:", r.status); process.exit(1); }
  const html = await r.text();
  const m = html.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) { console.error("__NUXT_DATA__ nicht gefunden — Seitenstruktur geaendert?"); process.exit(1); }
  const root = unflatten(JSON.parse(m[1]));

  // alle Gerichte (Objekte mit Name + Nutrs) einsammeln -> live[norm(name)] = {8 Makros}
  const live = {}, seen = new Set();
  (function walk(o, d) {
    if (!o || typeof o !== "object" || d > 16 || seen.has(o)) return; seen.add(o);
    if (Array.isArray(o)) { for (const x of o) walk(x, d + 1); return; }
    if (o.Name && Array.isArray(o.Nutrs) && o.Nutrs.length) {
      const e = {}; for (const n of o.Nutrs) { const key = NMAP[(n.Desc || "").toLowerCase()]; if (key) e[key] = num(n.PerServ); }
      if (e.kcal != null) { const k = norm(o.Name); if (!live[k]) live[k] = e; }
    }
    for (const k in o) walk(o[k], d + 1);
  })(root, 0);
  console.log("Live-Gerichte extrahiert:", Object.keys(live).length);

  const raw = JSON.parse(fs.readFileSync(__dirname + "/data/wagamama-raw.json", "utf8"));
  let changed = 0; const missing = [];
  for (const it of raw.items) {
    const lv = live[norm(OVERRIDE[it.name] || it.name)];
    if (!lv) { missing.push(it.name); continue; }
    const diffs = [];
    for (const k of F) { if (lv[k] != null && Math.abs(it[k] - lv[k]) > 0.001) { diffs.push(`${k}:${it[k]}->${lv[k]}`); it[k] = lv[k]; } }
    if (diffs.length) { changed++; console.log("  " + it.name + "\n     " + diffs.join(" | ")); }
  }
  if (missing.length) console.log("\n⚠ NICHT live gefunden (Name geaendert?):\n  " + missing.join("\n  "));
  console.log("\n" + changed + " Items mit geaenderten Werten.");

  if (DRY) { console.log("(--dry: data/wagamama-raw.json NICHT geschrieben)"); return; }
  if (!changed) { console.log("Nichts zu schreiben."); return; }
  raw._meta.updated = new Date().toISOString().slice(0, 10);
  // Items im kompakten, gut lesbaren Stil neu serialisieren (Struktur wie bisher)
  const q = JSON.stringify;
  const out = ["{"];
  out.push('  "_meta": ' + JSON.stringify(raw._meta, null, 2).split("\n").map((l, i) => i === 0 ? l : "  " + l).join("\n") + ",");
  out.push('  "items": [');
  raw.items.forEach((it, idx) => {
    const extra = [];
    if ("veggie" in it) extra.push('"veggie": ' + it.veggie);
    if ("vegan" in it) extra.push('"vegan": ' + it.vegan);
    if ("allergens" in it) extra.push('"allergens": ' + q(it.allergens));
    out.push("    {");
    out.push('      "name": ' + q(it.name) + ', "cat": ' + q(it.cat) + ',');
    out.push("      " + F.map(k => '"' + k + '": ' + it[k]).join(", ") + ",");
    out.push("      " + extra.join(", "));
    out.push("    }" + (idx < raw.items.length - 1 ? "," : ""));
  });
  out.push("  ]", "}");
  fs.writeFileSync(__dirname + "/data/wagamama-raw.json", out.join("\n") + "\n");
  console.log("-> data/wagamama-raw.json geschrieben. Jetzt: node wagamama-update.js");
})().catch(e => { console.error("ERR", e.stack); process.exit(1); });
