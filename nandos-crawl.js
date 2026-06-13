// Crawlt das AKTUELLE Nando's-Menü über die offizielle Order-API: node nandos-crawl.js
// Warum nicht die Gatsby-page-data? Die ist ein verwaistes Build-Artefakt von Jan 2022 (Last-Modified-Header)!
// Die Order-App (nandos.co.uk/order) nutzt api.nandos.services/menu-v2 (GraphQL) mit einem öffentlichen
// Anonymous-Token aus dem JS-Bundle — beides wird hier zur Laufzeit frisch extrahiert (übersteht Token-Rotation).
// activeMealtime:false liefert auch zeitgebundene Sections (The Lunch Fix). Menü ist pro Restaurant.
const fs = require("fs");

const RESTAURANT = "liverpool-street-station"; // Referenz-Restaurant (Central London)
const MARKET = "UK";
const UA = { "User-Agent": "Mozilla/5.0 (personal nutrition tracker)" };

async function getText(url) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error("HTTP " + res.status + " für " + url);
  return res.text();
}

async function getApiConfig() {
  const html = await getText("https://www.nandos.co.uk/order/");
  const appChunk = (html.match(/src="(\/order\/_next\/static\/chunks\/pages\/_app-[^"]+\.js)"/) || [])[1];
  if (!appChunk) throw new Error("_app-Chunk nicht im /order/-HTML gefunden");
  const js = await getText("https://www.nandos.co.uk" + appChunk);
  const base = (js.match(/NEXT_PUBLIC_PLATFORM_API_BASE_URL:"([^"]+)"/) || [])[1];
  const token = (js.match(/NEXT_PUBLIC_PLATFORM_API_DEV_TOKEN:"([^"]+)"/) || [])[1];
  if (!base || !token) throw new Error("API-Base/Token nicht im Bundle gefunden");
  return { base, token };
}

const QUERY = `query Menu($id: ID!, $market: Market!) {
  menu(market: $market, restaurant: $id, activeMealtime: false) {
    sections {
      id displayName
      items {
        id slug displayName subsection
        priceList { kind displayName price { value currencyCode } }
        nutritionalInfo { factsForPortionSizes { size energyKcal fatMg saturatesMg totalCarbsMg sugarsMg fibreMg proteinMg saltMg } }
      }
    }
  }
}`;

(async () => {
  const { base, token } = await getApiConfig();
  console.log("API: " + base + " (Token: " + token.length + " Zeichen)");
  const res = await fetch(base + "/menu-v2/query", {
    method: "POST",
    headers: { ...UA, "Content-Type": "application/json", "Authorization": "Bearer " + token },
    body: JSON.stringify({ query: QUERY, variables: { id: RESTAURANT, market: MARKET } }),
  });
  if (!res.ok) throw new Error("menu-v2 HTTP " + res.status);
  const data = await res.json();
  if (data.errors) throw new Error("GraphQL: " + JSON.stringify(data.errors).slice(0, 400));

  const sections = data.data.menu.sections.map(s => ({
    id: s.id,
    name: s.displayName,
    items: s.items.map(p => ({
      slug: p.slug,
      name: p.displayName,
      subsection: p.subsection || null,
      priceList: (p.priceList || []).map(x => ({ name: x.displayName, kind: x.kind, pence: x.price ? x.price.value : null })),
      factsForPortionSizes: (p.nutritionalInfo && p.nutritionalInfo.factsForPortionSizes) || [],
    })),
  }));

  const out = {
    _meta: {
      source: "api.nandos.services/menu-v2 (GraphQL der Order-App), Restaurant: " + RESTAURANT + ", Markt: " + MARKET,
      crawled: new Date().toISOString().slice(0, 10),
      note: "Nährwerte in mg (fatMg etc.), energyKcal direkt; size = DEFAULT/REGULAR/LARGE. Re-Crawl: node nandos-crawl.js",
    },
    sections,
  };
  fs.writeFileSync(__dirname + "/data/nandos-raw.json", JSON.stringify(out, null, 2) + "\n", "utf8");

  let tot = 0;
  for (const s of sections) { tot += s.items.length; console.log("  - " + s.name + ": " + s.items.length); }
  console.log(tot + " Items (" + sections.length + " Sections) -> data/nandos-raw.json");
})();
