// Crawlt itsu.com und sammelt alle Produkt-Nährwerte: node itsu-crawl.js
// Quelle: __NUXT__-Payload der Kategorie- und Produktseiten (Strapi-CMS-Daten, kein HTML-Parsing).
// Output: data/itsu-raw.json (Rohdaten; Integration in die App erfolgt separat)
const fs = require("fs");
const BASE = "https://www.itsu.com";
const DELAY_MS = 150;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getNuxt(url, attempt = 1) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (personal nutrition tracker)" } });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const html = await res.text();
    const i = html.indexOf("window.__NUXT__=");
    if (i < 0) throw new Error("__NUXT__ fehlt");
    const j = html.indexOf("</script>", i);
    const expr = html.slice(i + "window.__NUXT__=".length, j).replace(/;\s*$/, "");
    return (0, eval)(expr);
  } catch (e) {
    if (attempt < 3) { await sleep(800 * attempt); return getNuxt(url, attempt + 1); }
    throw new Error(url + " -> " + e.message);
  }
}

function findNodes(obj, pred, out = [], seen = new Set()) {
  if (!obj || typeof obj !== "object" || seen.has(obj)) return out;
  seen.add(obj);
  if (pred(obj)) out.push(obj);
  for (const v of Object.values(obj)) findNodes(v, pred, out, seen);
  return out;
}

(async () => {
  // 1) Kategorien von der Menü-Hauptseite
  const menu = await getNuxt(BASE + "/menu/");
  const sections = findNodes(menu, o => o.asyncData && Array.isArray(o.asyncData.categories));
  const categories = sections[0].asyncData.categories.map(c => ({ name: c.text, to: c.to }));
  console.log("Kategorien:", categories.map(c => c.name).join(" | "));

  // 2) Pro Kategorie: Produktliste (name + URL)
  const productMap = new Map(); // url -> { name, categories: [] }
  for (const cat of categories) {
    await sleep(DELAY_MS);
    const page = await getNuxt(BASE + cat.to);
    const secs = findNodes(page, o => o.asyncData && Array.isArray(o.asyncData.products));
    const prods = secs.flatMap(s => s.asyncData.products);
    for (const p of prods) {
      if (!p.to) continue;
      if (!productMap.has(p.to)) productMap.set(p.to, { name: p.name, categories: [] });
      const entry = productMap.get(p.to);
      if (!entry.categories.includes(cat.name)) entry.categories.push(cat.name);
    }
    console.log(cat.name + ": " + prods.length + " Produkte");
  }
  console.log("Gesamt (unique URLs): " + productMap.size);

  // 3) Pro Produkt: volle Nährwerte von der Produktseite
  const items = [], skipped = [];
  let done = 0;
  for (const [url, info] of productMap) {
    await sleep(DELAY_MS);
    done++;
    try {
      const page = await getNuxt(BASE + url);
      const nodes = findNodes(page, o => o.calories !== undefined && o.fat !== undefined && o.protein !== undefined);
      if (!nodes.length) { skipped.push({ url, name: info.name, reason: "keine Nährwerte" }); continue; }
      const n = nodes[0];
      items.push({
        name: info.name,
        url,
        categories: info.categories,
        calories: n.calories, fat: n.fat, fat_saturated: n.fat_saturated,
        carbs: n.carbs, sugars: n.sugars, fibre: n.fibre, protein: n.protein, salt: n.salt,
        allergens: (n.allergens || []).map(a => a.name),
        may_contain: (n.may_contain || []).map(a => a.name),
      });
      if (done % 20 === 0) console.log(done + "/" + productMap.size + " ...");
    } catch (e) {
      skipped.push({ url, name: info.name, reason: e.message });
    }
  }

  const out = {
    _meta: {
      source: "itsu.com (__NUXT__-Daten der Produktseiten)",
      crawled: new Date().toISOString().slice(0, 10),
      note: "Rohdaten, Werte pro Serving als Strings wie auf der Website. Re-Crawl: node itsu-crawl.js",
    },
    categories: categories.map(c => c.name),
    items,
    skipped,
  };
  fs.writeFileSync(__dirname + "/data/itsu-raw.json", JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log("\n" + items.length + " Items -> data/itsu-raw.json");
  if (skipped.length) {
    console.log("Übersprungen (" + skipped.length + "):");
    for (const s of skipped) console.log("  - " + s.name + " (" + s.url + "): " + s.reason);
  }
})();
