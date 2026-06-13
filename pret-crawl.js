// Crawlt die Pret-Delivery-Menüseite (eine Seite = alle Produkte + Nährwerte): node pret-crawl.js
// Quelle: __NEXT_DATA__ von https://www.pret.co.uk/en-GB/pret-delivers/menu
// Output: data/pret-raw.json
const fs = require("fs");

async function getNextData(url) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (personal nutrition tracker)" } });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const html = await res.text();
  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new Error("__NEXT_DATA__ nicht gefunden");
  return JSON.parse(m[1]);
}

const NUTRI_KEYS = {
  kcal: "Energy (KCal)", fat: "Fat", sat: "Saturates", carbs: "Carbohydrates",
  sugars: "Sugars", fibre: "Dietary Fibre", protein: "Protein", salt: "Salt",
};

(async () => {
  const data = await getNextData("https://www.pret.co.uk/en-GB/pret-delivers/menu");
  const cats = data.props.pageProps.categories;

  const bySku = new Map();
  for (const c of cats) {
    const catName = c.categoryName.trim();
    for (const p of c.products || []) {
      const key = p.sku || p.id || p.name;
      if (!bySku.has(key)) {
        const nut = {};
        for (const [field, k] of Object.entries(NUTRI_KEYS)) {
          const row = (p.nutritions || []).find(n => n.key === k || n.label === k);
          nut[field] = row ? row.perServing : null;
        }
        bySku.set(key, {
          sku: p.sku, name: (p.name || "").trim(), categories: [],
          ...nut,
          averageWeightG: p.averageWeight || null,
          price: p.price && p.price.centAmount != null ? p.price.centAmount / 100 : null,
          vegetarian: !!p.suitableForVegetarians, vegan: !!p.suitableForVegans,
          allergens: (p.allergens || []).map(a => a.label),
        });
      }
      const entry = bySku.get(key);
      if (!entry.categories.includes(catName)) entry.categories.push(catName);
    }
  }

  const items = [...bySku.values()];
  const out = {
    _meta: {
      source: "pret.co.uk/en-GB/pret-delivers/menu (__NEXT_DATA__, alles auf einer Seite)",
      crawled: new Date().toISOString().slice(0, 10),
      note: "Nährwerte perServing als Strings wie auf der Website. Re-Crawl: node pret-crawl.js",
    },
    categories: cats.map(c => c.categoryName.trim()),
    items,
  };
  fs.writeFileSync(__dirname + "/data/pret-raw.json", JSON.stringify(out, null, 2) + "\n", "utf8");

  const noNut = items.filter(x => x.kcal == null);
  console.log(items.length + " Produkte (" + cats.length + " Kategorien) -> data/pret-raw.json");
  console.log("Ohne Nährwerte: " + noNut.length + (noNut.length ? " (" + noNut.slice(0, 8).map(x => x.name).join(", ") + "...)" : ""));
  for (const c of out.categories) console.log("  - " + c + ": " + items.filter(x => x.categories[0] === c).length);
})();
