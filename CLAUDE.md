# Macro Optimizer (Subway UK + Farmer J + Itsu + Pret + Nando's + Urban Greens + Wagamama + GDK)

## Projektübersicht
Standalone PWA (single HTML file) zur Optimierung von Restaurant-Bestellungen basierend auf Makro-Zielen. Zielplattform: iPhone Home Screen via "Add to Home Screen" in Safari (live auf GitHub Pages, siehe Deployment). Restaurants: **Subway UK**, **Farmer J** (London), **Itsu** (UK), **Pret A Manger** (UK), **Nando's** (UK), **Urban Greens** (London), **Wagamama** (UK) und **German Doner Kebab / GDK** (UK), umschaltbar per Tabs im UI. Weitere Restaurants sollen folgen.

## Deployment / Sync
Live auf **GitHub Pages**: https://theo0202.github.io/macro-optimizer/ (Repo `theo0202/macro-optimizer`). Nach JEDER getesteten Änderung an index.html: `git push` (GitHub CLI unter `C:\Program Files\GitHub CLI\gh.exe`, nicht im PATH) → Theodors iPhone-Home-Screen-App zeigt die neue Version nach ~1 Min + Neustart der App. Die App ist self-contained (alles in index.html, CDN für React/Fonts).

## Tech Stack
- Single `index.html` file (PWA)
- React 18 via CDN (UMD build, kein Build-Step)
- Vanilla `createElement` calls (kein JSX, kein Bundler)
- Inline Styles, kein CSS Framework
- Fonts: DM Sans + DM Mono via Google Fonts CDN

## Dev-Umgebung (Windows)
- Python nur über `py -3` aufrufbar (kein `python` Alias), openpyxl installiert
- Node verfügbar → Logik-Tests: `node tests.js` (lädt das `<script>` aus index.html, testet sumN/optimize/optimizeFJ)
- `node export-farmerj.js` regeneriert `data/farmerj.json` aus index.html (nach jeder FJ-Datenänderung ausführen)
- `node export-urbangreens.js` regeneriert `data/urbangreens.json` aus index.html (UG-Daten sind handgepflegt aus PDF, kein Crawler)
- PDF-Extraktion: `py -3` mit pdfplumber + pypdf installiert (Poppler/pdftoppm fehlt → Read-Tool kann PDFs hier NICHT visuell rendern; Text/Tabellen via pdfplumber, eingebettete Screenshots via pypdf extrahieren und als Bild lesen)
- `node itsu-crawl.js && node itsu-update.js` aktualisiert die Itsu-Daten (Web-Crawl → index.html)
- `node pret-crawl.js && node pret-update.js` aktualisiert die Pret-Daten (Web-Crawl → index.html)
- `node nandos-crawl.js && node nandos-update.js` aktualisiert die Nando's-Daten (Web-Crawl → index.html)
- `node wagamama-update.js` generiert den WAGAMAMA-Block aus `data/wagamama-raw.json` (KEIN Crawler — User liefert Copy-Paste-Batches)
- `node gdk-update.js` generiert den GDK-Block aus `data/gdk-raw.json` (KEIN Crawler — User liefert offizielle Nährwerttabelle als Copy-Paste)
- Preview-Server: `.claude/launch.json` → "macro-optimizer" (py -3 -m http.server 8321)

## Datenquellen
- **Subway**: UK & ROI Nutritional Information January 2026 PDF (`data/UKIandROINutritionalInformationJan2026.pdf`)
  - Alle Nährwerte **per 6-inch Serving** (Footlong = ×2, excluding salads)
  - Component-level Daten von Seite 3 des PDFs
- **Farmer J**: Nährwerte von farmerj.com (Stand Juni 2026); Struktur & Order Rules aus `data/Farmer J _ Nutritional Info.xlsx` (Sheets: "Nutrition per Serving" + "Order Rule")
  - Alle Werte pro Serving, keine Größenvarianten
  - `data/farmerj.json` wird mit `node export-farmerj.js` aus dem FJ-Objekt in index.html regeneriert — index.html ist die Quelle der Wahrheit
  - ACHTUNG: Die Excel-Werte sind teils veraltet (z.B. Hummus 142→238 kcal, Salmon Bowl 883→717, Sets generell) — bei Daten-Updates farmerj.com als Referenz nehmen
- **Itsu**: itsu.com (Stand Juni 2026) — es gibt KEINE Gesamt-PDF; die Nährwerte stecken im `__NUXT__`-Payload jeder Produktseite
  - `node itsu-crawl.js` crawlt Menü- + Kategorie- + Produktseiten → `data/itsu-raw.json` (130 Items, 9 Kategorien, inkl. Allergene)
  - `node itsu-update.js` generiert daraus den ITSU-Block in index.html (zwischen `__ITSU_DATA_START__`/`__ITSU_DATA_END__`-Markern, nicht von Hand editieren)
  - Werte pro Serving; Menü ändert sich saisonal → bei Bedarf einfach Re-Crawl laufen lassen
- **Pret**: pret.co.uk/en-GB/pret-delivers/menu (Stand Juni 2026) — ALLE Produkte samt Nährwerten (perServing + per100g), Preisen und Allergenen stecken im `__NEXT_DATA__` der EINEN Menüseite (kein Einzelseiten-Crawl nötig)
  - `node pret-crawl.js` → `data/pret-raw.json` (178 Produkte, 19 Kategorien)
  - `node pret-update.js` → PRET-Block in index.html (Marker `__PRET_DATA_START__`/`__PRET_DATA_END__`); filtert Bundles + Catering-Platters raus (140 Items, 13 Kategorien) und setzt die `rel`-Whitelist (67 Items)
  - Die rel-Whitelist ("only relevant items, no bullshit") ist in pret-update.js gepflegt: 5 komplette Kategorien (Sandwiches, Baguettes, Wraps and flatbreads, Salads and protein pots, Little Pret Stars) + Einzel-Items (4 Rye Rolls, Super Fruit, Fruit Salad, Bircher Muesli, Blueberry Balance Bowl, Five Berry Bowl, The Big Apple Bowl)
- **Nando's**: `api.nandos.services/menu-v2` (GraphQL der Order-App) — ACHTUNG: NICHT die Gatsby-page-data von nandos.co.uk/food/menu nehmen, das ist ein verwaistes Build-Artefakt von **Januar 2022** (Last-Modified-Header prüfen!)
  - `node nandos-crawl.js` → `data/nandos-raw.json`: extrahiert Anonymous-Token + API-Base live aus dem Order-JS-Bundle (übersteht Token-Rotation), fragt das Menü des Referenz-Restaurants `liverpool-street-station` ab; `activeMealtime:false` liefert auch zeitgebundene Sections (The Lunch Fix); Nährwerte in **mg**, `size`-Feld pro Portionsgröße
  - `node nandos-update.js` → NANDOS-Block in index.html (Marker `__NANDOS_DATA_START__`/`__NANDOS_DATA_END__`): mg→g, **Drinks-Section komplett raus** (User-Vorgabe), Nandinos-"Dessert OR Drink" raus, Items ohne Nährwerte raus (z.B. "Dare to share") → 112 Items, 11 Kategorien
  - Mehrere Portionsgrößen (size REGULAR/LARGE) → 2 Items ("Spicy Rice (Regular)" / "(Large)")
  - `sauce:true` kommt aus den Subsections **"Dips" + "Bottles"** plus "PERi-PERi Drizzle" (Schalter "No sauces")
  - Pro-Restaurant-Menü → keine Regional-Duplikate mehr; Bastes (Spice Level) ändern die Nährwerte NICHT
- **Urban Greens**: "Allergen guide 2026" PDF (`data/UrbanGreens-AllergenMatrix.pdf`), gegengeprüft mit `data/UrbanGreens_Nutrition.xlsx` (User-Excel, identisch bis auf Sriracha-Lime-Protein: Excel 5, PDF 1 → PDF gilt) — KEIN Crawler, Daten handgepflegt im UG-Objekt in index.html
  - ACHTUNG: Nur kcal/Protein/Fat/Carbs verfügbar (kein sat/sugars/fibre/salt → stehen auf 0; UG-Panel blendet Fibre/Salt-Bars aus)
  - **Fertige Salads sind laut PDF-Fußnote OHNE Dressing** (Trays inkl. allem)
  - Deliveroo-Namen ≠ Guide-Namen: Red Rice [Cold]=Camargue Red Rice, Spiced Grains [Warm]=UG Spiced Grains, Chicken=Chicken Breast, Sesame Soy Broccoli=Broccoli - Sesame Soy, Ginger Pickled Carrots=Pickled Carrots, Kimchi=UG Kimchi, Avocado Half=Avocado, Shaved Parmesan=Parmesan, UG Hummus Scoop=Hummus, Sunflower and Pumpkin Seeds=Pumpkin + Sunflower Seeds
  - **AUSGESCHLOSSEN mangels Makros im Guide**: Piri Piri Chicken (148 kcal), Piri Piri Shrimp (94), Lemon & Herb Chicken (209), Red Rice [Warm] (218), Piri Piri Caesar Dressing (268) — bei Daten-Nachschub in UG.prots/carbs/dress ergänzen
  - **User-Ausschlüsse (NIEMALS vorschlagen)**: Coriander, Mint, Parsley (Toppings — "hasse ich"), Olive Oil (Dressing)
  - **Exakt abgeleitet** (keine Schätzung): Avocado Whole = 2× Avocado (230/4/30/18)
  - **FERTIGE SALADS & TRAYS SIND KOMPLETT ENTFERNT** (User-Entscheidung 12.06.2026: "wir machen immer BYO") — NICHT wieder einbauen ohne explizite User-Anweisung. Hintergrund: Guide-Werte der Fertig-Salads waren ohne Dressing/Green Base (Dressing nur für 4 von 9 bekannt), Tray-Werte nicht in Basis+Protein zerlegbar, Deliveroo-Anzeigen inkonsistent (z.B. Sinaloa-Header 647 vs. Guide 764–826; Chicken 118 vs. 103; Cabbage Mix 58 vs. 72). Die Fertig-Werte stehen weiterhin in `data/UrbanGreens-AllergenMatrix.pdf` + `data/UrbanGreens_Nutrition.xlsx`, falls doch mal gebraucht
  - Verifiziertes Wissen (falls Fertig-Gerichte je zurückkommen): Deliveroo-Salad-Header = Guide-Wert + fixes Dressing (Seoul Mate 551 = 342+209 Gochujang Miso; Thai Crunch 602 = 429+173 Thai Peanut); Green Base ist Pflichtwahl obendrauf; Trays haben Pflicht-Protein-Wahl mit 8 Optionen, offizielle Werte nur für 3 Kombos
  - Deliveroo-Flow dokumentiert in `data/UrbanGreens-Deliveroo-Screenshots.pdf` + im Chat-Verlauf; Deliveroo-kcal weichen bei einigen Items leicht vom Guide ab (z.B. Sesame Soy Broccoli 32/47, Pickled Cabbage 29/36 vs. 33) → Guide-Werte gelten
- **Wagamama**: wagamama.com Produkt-Popups ("allergens + nutritional information", per-Serving-Spalte) — KEIN Crawler, **User liefert die Daten als Copy-Paste-Batches im Chat**
  - Workflow: neue Items in `data/wagamama-raw.json` ergänzen (Name, cat, 8 Makros; Sodium weglassen, Salt reicht) → `node wagamama-update.js` → WAGAMAMA-Block in index.html (Marker `__WAGAMAMA_DATA_START__`/`__WAGAMAMA_DATA_END__`)
  - Kategorien sind selbst zugeordnet (donburi, ramen, teppanyaki = alle soba/udon-Gerichte, salads, sides) und entstehen automatisch aus den `cat`-Feldern
  - Stand Juni 2026: 21 Items aus 2 Batches; weitere folgen
- **German Doner Kebab (GDK)**: offizielle Nährwerttabelle (per-Serving-Spalte) — KEIN Crawler, **User liefert Copy-Paste**
  - Workflow: Items in `data/gdk-raw.json` (Name, cat, `sauce:true` wenn Sauce drin, 8 Makros) → `node gdk-update.js` → GDK-Block (Marker `__GDK_DATA_START__`/`__GDK_DATA_END__`)
  - 61 Items, 7 Kategorien (kebabs, wraps, burritos, quesadillas, rice_bowls, boxes, juniors); Juniors standardmäßig AUS (Kids-Menü, wie Nando's Nandinos)
  - `sauce:true` = Item enthält Sauce: alle "WITH SAUCE"-Varianten, plain Quesadilla (vs. "Doner Quesadilla … WITHOUT SAUCE"), alle Ketchup-Juniors. Schalter "No Sauce" filtert diese
  - "EXTRA HOT"-Junior-Varianten weggelassen (makro-identisch zur Curry-Version)
  - **DONER BURRITO MIX entfernt** (User-Entscheidung 12.06.2026): fat=12.4 war ein Tippfehler im GDK-Sheet (1175 kcal mit 12g Fett unmöglich, ~69 erwartet). Falls korrekter Wert nachkommt → wieder in gdk-raw.json aufnehmen
  - **EXCLUDE-Listen in den Update-Skripten**: itsu-update.js `EXCLUDE_NAMES` ("edamame" — plain Beilage, "chocolate edamame" bleibt), pret-update.js `EXCLUDE_NAMES` ("Apple", "Banana") — überleben Re-Crawls

## Daten-Architektur
- Alle Nährwertdaten als JS-Objekte direkt in der HTML eingebettet
- **Subway**: `D.breads[]`, `D.proteins[]`, `D.cheeses[]`, `D.extras[]`, `D.salads[]`, `D.sauces[]`, `D.seasonings[]`
- **Farmer J**: `FJ.mains[]`, `FJ.bases[]`, `FJ.sides[]` (Warm Sides + Salads, `group`-Feld), `FJ.toppings[]`, `FJ.sdt[]` ("Sauce, Dip or Topping"-Kategorie: 4 Saucen + Egg/Avo/Hummus/Baba Ghanoush), `FJ.sets[]` (Set Fieldtrays/Fieldbowls/Solo-Salate als fertige Alternativen)
- **Itsu**: `ITSU.cats[]` (id, name, `on` = Default-Filter, `drink:true` = nie im Optimizer) + `ITSU.items[]` (flache Liste, `cat`-Feld = Primärkategorie)
- **Pret**: `PRET.cats[]` (gleiches Schema wie Itsu) + `PRET.items[]` (zusätzlich `rel:true` = Whitelist für "only relevant items, no bullshit")
- **Nando's**: `NANDOS.cats[]` + `NANDOS.items[]` (gleiches Schema; Drinks existieren im Block gar nicht)
- **Wagamama**: `WAGA.cats[]` + `WAGA.items[]` (gleiches Schema wie Itsu/Pret/Nando's)
- **GDK**: `GDK.cats[]` + `GDK.items[]` (gleiches Schema; Items zusätzlich `sauce:true`-Flag für "No Sauce"-Schalter)
- **Urban Greens**: `UG.pre[]` (18 fertige Salads/Trays, `group`-Feld) + BYO-Komponenten `UG.greens[]`, `UG.carbs[]`, `UG.prots[]`, `UG.veg[]`, `UG.tops[]`, `UG.dress[]`, `UG.scoops[]` — Items nur mit kcal/protein/fat/carbs
- Jedes Item hat: `id, name, kcal, fat, sat, carbs, sugars, fibre, protein, salt` (Subway zusätzlich `servingG`)
- Zusätzlich vollständige Subway-Produktdaten (`subs_6inch`, `toasties`, `saver_subs`, `wraps`, `salad_meals`, `spuds`, `sides`, `cookies`) in `data/subway-optimizer.jsx` — NICHT in der HTML-PWA, für zukünftige Features

## Bestellablauf Subway (Deliveroo UK)
1. **Protein** (ein Protein wählen)
2. **Größe** (6 Inch / Footlong)
3. **Bread** (ein Brot wählen)
4. **Cheese** (optional, max 1)
5. **Extras** (beliebig viele): Double Meat, Double Cheese, Turkey Rashers, Pepperoni, Hash Browns, Chicken Strips, Turkey Ham, Poached Egg, Salami, Breaded Chicken, Smashed Falafel, Philly-Style Steak, Chicken Tikka
6. **Salad** (beliebig viele, je max 1×): Lettuce, Tomatoes, Cucumber, Pickles, Peppers, Olives, Red Onions, Jalapeños, Sweetcorn
7. **Sauce** (max 2): Sweet Chilli, Chipotle Southwest, Sweet Onion, Honey Mustard, Ketchup, X-Spy Chipotle, Garlic & Herb, Teriyaki, Lite Mayo, BBQ Sauce
8. **Seasonings** (beliebig viele, je max 1×): Sea Salt, Mixed Peppercorns, Crispy Onions

## Bestellablauf Farmer J (Deliveroo, laut Order-Rule-Sheet)
- **Custom Fieldtray**: 1× Main + 1× Base + 2× Sides — alles frei (im Preis enthalten)
- **Toppings**: beliebig viele, kostenpflichtig (Pickled Red Onion, Sesame Cucumber + Wakame, Pickled Cucumber)
- **"Sauce, Dip or Topping"**: max 1, kostenpflichtig (Saucen + Free Range Egg, Avo, Hummus, Baba Ghanoush)
- Alternativ fertige **Set Fieldtrays / Set Fieldbowls / Solo-Salate** (feste Nährwerte, nicht konfigurierbar)

## Bestellablauf Itsu (Deliveroo, à la carte)
- Keine Konfiguration pro Gericht — Items in den Warenkorb (Max-Items-Chip: 1/2/3/5/∞, Default 3), Duplikate möglich (z.B. 2× Gyoza)
- Kategorien (Item-Anzahl): healthy soups (8), gyoza & bao (3), rice'bowls (16), hot noodles (7), sushi & poké (16), desserts & snacks (24), breakfast (11), cold drinks (19), hot & iced drinks (26)
- **Getränke (cold drinks, hot & iced drinks) sind IMMER ausgeschlossen** — `drink:true` in ITSU.cats, keine Chips dafür, Optimizer filtert sie hart raus
- Im Optimizer standardmäßig aktiv: die 5 Food-Kategorien (soups, gyoza & bao, rice'bowls, hot noodles, sushi & poké); Desserts/Breakfast per Chip zuschaltbar
- **Schalter "No soups, desserts, snacks etc."**: schließt zusätzlich healthy soups, hot noodles UND desserts & snacks aus (überstimmt die Chips) — für "richtige Mahlzeiten only" (rice'bowls, sushi & poké, gyoza & bao)

## Bestellablauf Pret (Deliveroo, à la carte)
- Wie Itsu: 1–3 Items in den Warenkorb, Duplikate möglich; gleicher À-la-carte-Optimizer (`alaCarteCombos`)
- App-Kategorien (13): Bakery, Breakfast baguettes, Sandwiches (12), Baguettes (19), Wraps and flatbreads (10), Rye rolls (6), Salads and protein pots (13), Little Pret Stars (3), Fruit (5), Sweet pots (7), Sweet treats, Snacks, Cold drinks — Bundles + Catering-Platters sind gar nicht erst in der App
- **Cold drinks sind IMMER ausgeschlossen** (drink:true, kein Chip)
- **Schalter "only relevant items, no bullshit"**: nur die 67 Whitelist-Items (rel:true), überstimmt die Chips
- **Schalter "Salads and protein pots only"**: nur die 13 Salads/Protein Pots — hat Vorrang vor allem anderen
- Standard-Chips an: Sandwiches, Baguettes, Wraps, Rye rolls, Salads & protein pots, Little Pret Stars, Fruit, Sweet pots; aus: Bakery, Breakfast baguettes, Sweet treats, Snacks

## Bestellablauf Nando's (à la carte)
- Wie Itsu/Pret: 1–3 Items, Duplikate möglich, gemeinsamer Optimizer (`alaCarteCombos`)
- Kategorien (11): The Lunch Fix (3), Starters (7), PERi-PERi Chicken (13), Burgers Pittas Wraps (10), Salads & Bowls (3), Sharing Platters (5), Veggie (5), Nandinos/Kids (5), Sides (27, inkl. Regular/Large-Varianten), Dips & Extras (26), Desserts (8)
- **Drinks sind gar nicht erst in den App-Daten** (User-Vorgabe "von Anfang an weglassen")
- **Schalter "No desserts, Lunch Fix & platters"**: schließt Desserts + The Lunch Fix + Sharing Platters aus (`NANDOS_SWITCH_CATS`)
- **Schalter "No sauces"**: schließt alle 14 `sauce:true`-Items aus — die komplette "Dips"-Subsection (PERinaise, Garlic PERinaise, PERi-Chicken Gravy, Chilli Jam, PERi-Honey, Mayonnaise), die "Bottles"-Subsection (6 Flaschensaucen + PERi-PERi Salt) und PERi-PERi Drizzle. NICHT geflaggt: essbare Extras wie Halloumi, Grilled Pineapple, Brote
- **Schalter "No grilled pineapple"**: schließt das Einzel-Item "Grilled Pineapple" (id `grilled_pineapple`) aus — Parameter `noPineapple` in optimizeNandos
- Standard-Chips: alle an außer Nandinos (Kids)
- Dips & Extras-Kategorie = Add-ons (Grilled Chicken Breast, Halloumi, 1/2 Avocado, Brote, Dips) — als Pool-Items nützlich für Makro-Feintuning

## Bestellablauf Wagamama (à la carte)
- Wie Itsu/Pret/Nando's: 1–3 Items, Duplikate möglich, gemeinsamer Optimizer (`alaCarteCombos`)
- Kategorien (Stand Juni 2026, wachsen mit Batches): sides (2), donburi (4), ramen (4), teppanyaki (10), salads (1)
- **Schalter "No Ramen"**: schließt die komplette ramen-Kategorie aus (tantanmen beef brisket, grilled chicken, chilli chicken, kare burosu — und automatisch alle künftig ergänzten Ramen)
- Standard-Chips: alle an

## Bestellablauf German Doner Kebab / GDK (à la carte)
- Wie Itsu/Pret/Nando's/Wagamama: 1–∞ Items, Duplikate möglich, gemeinsamer Optimizer (`alaCarteCombos`)
- Kategorien (60 Items): Kebabs (12), Wraps (12), Burritos (3), Quesadillas (6), Rice Bowls (4), Boxes (12), Juniors/Kids (11) — "Doner Burrito Mix" wegen Datenfehler (fat=12.4) entfernt
- **Schalter "No Sauce"**: schließt alle 26 `sauce:true`-Items aus (alle "with sauce"-Varianten, plain Quesadillas, Ketchup-Juniors) → die "no sauce"/"without sauce"-Varianten bleiben
- **Schalter "No rice bowl"**: schließt die Kategorie rice_bowls aus
- Standard-Chips: alle an außer Juniors (Kids); beide Schalter aus

## Bestellablauf Urban Greens (Deliveroo)
Zwei Modi (Umschalt-Buttons): **"BYO Salad"** und **"BYO Tray"** — fertige Gerichte gibt es in der App NICHT (User-Entscheidung, siehe Datenquellen).
(Getrennte Modi statt gemischter Ergebnisse: Salads dominieren Trays im Score fast immer, weil sie mehr Freiheitsgrade haben.)

BYO-**Salad**-Schritte (genau wie Deliveroo):
1. Green Base: Leafy Greens / Cabbage Mix / keine
2. Carb Base: Quinoa / Red Rice [Cold] / Sesame Glass Noodles / Spiced Grains [Warm] / keine
3. Protein: 9 Optionen (Chicken, Pulled Beef Brisket, Cajun-Spiced Tempeh, Shrimp, Hot Smoked Salmon, Honey Dijon Chicken [Warm], Pulled Chilli Brisket [Warm], Harissa Chickpeas [Warm], Avocado Whole) / keins
4. Add Extra Protein?: 0–1 (gleiche Liste OHNE Avocado Whole, `noExtra`-Flag)
5. Choose 3 Veg or Pickles: GENAU 3 aus 14
6. Any Extra Veg or Pickles?: beliebig — Pool = Leafy Greens + die 14 Veg OHNE Cucumber (`noExtra`-Flag, so auf Deliveroo)
7. Choose 2 Toppings: GENAU 2 aus 6 (Coriander/Mint/Parsley = User-Ausschluss) — **Schalter 'No "2 Toppings" / Nuts etc.'** (intern `noNuts`) erzwingt 0 und schließt Toppings auch als Extras aus
8. Choose a Dressing: 0–1 aus 6 (optional; Olive Oil = User-Ausschluss) — **Schalter "No Dressing"** erzwingt 0 (auch Extra-Dressings)
9. Any Extra Dressing?: beliebig (Optimizer: über Extras-Stufe)
10. Any extra Scoops, Premiums or Toppings?: beliebig (9 Scoops/Premiums + 6 Toppings)

BYO-**Tray**-Schritte: KEINE Green Base, KEIN Standard-Dressing —
1. Carb Base (wie Salad) · 2. Protein (wie Salad) · 3. Extra Protein? · 4. GENAU 3 Veg · 5. Extra Veg? ·
6. **Choose a Scoop or Premium Add On: PFLICHT, genau 1 aus 9** · 7. GENAU 2 Toppings · 8. Any Extra Dressing? · 9. Extra Scoops etc.
- Optimizer probiert in den "Any ...?"-Stufen bis 2 Extras (nur bei Score-Verbesserung)

## Permanente Ausschlüsse Subway (NIEMALS vorschlagen)
- **Vegan CheeZe** — komplett aus Daten entfernt
- **Bacon (Streaky)** — komplett aus Proteins entfernt
- **Tuna Mayo** — komplett aus Proteins entfernt
- **Geschätzte Werte** — keine Items mit unverifizierten Nährwerten:
  - HP Brown Sauce (nicht im PDF)
  - Yogurt Mint & Garlic Sauce (nicht im PDF)
  - Shawarma Spiced Chicken (nicht im PDF)

## Schalter-Defaults: ALLE Exclude-Schalter starten AN (User-Wunsch 12.06.2026)
Alle Filter-/Exclude-Checkboxen sind beim App-Start **aktiviert**, damit der User sie nicht jedes Mal neu anschalten muss: Subway "Kein Käse"+"Keine Sauce", Farmer J "Nur Gratis-Items", Itsu "No soups, desserts, snacks etc.", Pret "only relevant items, no bullshit", Nando's "No desserts/Lunch Fix/platters"+"No sauces"+"No grilled pineapple", Wagamama "No Ramen", GDK "No Sauce"+"No rice bowl", Urban Greens 'No "2 Toppings" / Nuts etc.'+"No Dressing".
**EINZIGE Ausnahme: Pret "Salads and protein pots only" startet AUS** — würde sonst "only relevant items" überstimmen und alles außer den 13 Salads verstecken (zu eng als Default). Beim Hinzufügen neuer Schalter: per Default AN, außer der Schalter ist ein enger Spezialmodus.

## Standard-Defaults (beim App-Start)
- **Restaurant**: Subway
- **Brot**: Wholegrain (locked, kann aber gewechselt werden)
- **Käse**: Kein Käse (Checkbox aktiv)
- **Sauce**: Keine Sauce (Checkbox aktiv)
- **Salad**: Standard-Salad automatisch vorausgewählt bei Ergebnis-Auswahl
- **Standard-Salad**: Lettuce, Tomatoes, Cucumber, Pickles, Peppers, Red Onions (alles AUSSER Jalapeños, Sweetcorn, Olives)
- **Makro-Präferenzen** (Kalorien-Modus): High Protein + Low Fat vorausgewählt
- **Farmer J**: "Nur Gratis-Items" aktiv (keine bezahlten Toppings/Saucen in Vorschlägen)
- **Itsu**: nur Food-Kategorien aktiv, max. 3 Items pro Bestellung, Schalter "No soups, desserts, snacks etc." AN, Getränke immer ignoriert
- **Pret**: 8 Food-Kategorien aktiv, max. 3 Items, "only relevant items" AN / "Salads and protein pots only" AUS, Getränke immer ignoriert
- **Nando's**: alle Kategorien aktiv außer Nandinos (Kids), max. 3 Items, alle 3 Schalter AN, Drinks nicht in den Daten
- **Wagamama**: alle Kategorien aktiv, max. 3 Items, "No Ramen" AN
- **GDK**: alle Kategorien aktiv außer Juniors (Kids), max. 3 Items, "No Sauce" + "No rice bowl" AN
- **Urban Greens**: Modus "BYO Salad", 'No "2 Toppings" / Nuts etc.' + "No Dressing" AN

## Standard-Salad in Berechnungen (Subway)
Die Standard-Salad Items (Lettuce, Tomatoes, Cucumber, Pickles, Peppers, Red Onions) sind:
- Im Optimizer IMMER in der Basisberechnung inkludiert
- Bei Ergebnis-Auswahl automatisch vorausgewählt im Detail-Panel
- User kann sie manuell an-/abwählen, Werte aktualisieren live
- Definiert als Konstante `STD_SALAD_IDS` und `STD_SALAD`

## UI-Reihenfolge
Ziele zuerst, Restaurant danach — beim Restaurantwechsel bleiben alle Eingaben erhalten:
1. Modus-Tabs (Makros eingeben / Kalorien + Präferenzen)
2. Eingabekarte (P/C/F bzw. kcal + Präferenz-Chips)
3. Fibre/Salt-Constraints (aufklappbar)
4. Restaurant-Tabs (Subway / Farmer J / Itsu / Pret / Nando's / Urban Greens / Wagamama / GDK)
5. Restaurant-spezifisch: Größe + Brot + Käse/Sauce-Checkboxen (Subway), "Nur Gratis-Items" (Farmer J), Kategorien + Max-Items + Schalter (Itsu, Pret, Nando's, Wagamama, GDK), 2 Modus-Buttons (BYO Salad / BYO Tray) + 'No "2 Toppings" / Nuts etc.'/"No Dressing" (Urban Greens)
6. Top Ergebnisse (mit **"Sort by"-Chips**: Score / Kalorien / Protein / Carbs / Fat — sortiert die Top-20-Kandidaten nach |Ist−Ziel| der gewählten Dimension; Protein/Carbs/Fat nur im Makro-Modus sichtbar, Default Score; gilt für ALLE Restaurants, `sortResults`) → Detail-Panel
7. Farmer J zusätzlich: "Alle Sets & Salate durchsuchen" (aufklappbarer Set-Browser unter den Ergebnissen)

## Zwei Modi (gelten für beide Restaurants)
### 1. Makros eingeben
- User gibt Protein (g), Carbs (g), Fat (g) ein
- Kalorien werden automatisch berechnet (P×4 + C×4 + F×9)
- Optimizer gewichtet: Protein ×3, Carbs ×2, Fat ×2

### 2. Kalorien + Präferenzen
- User gibt Kalorienziel ein
- Wählt Makro-Präferenzen als Toggles: High/Low Protein, High/Low Carb, High/Low Fat
- Gegensätzliche Paare schließen sich aus (High Protein deaktiviert Low Protein)

## Optionale Constraints
- Fibre Min/Max (g), Salt Min/Max (g)
- Aufklappbar unter "Fibre / Salt ▾"

## Optimizer-Algorithmen
### Subway (`optimize`)
1. Enumeriert alle Kombinationen: Bread × Protein × Cheese (gefiltert nach Locks/Ausschlüssen)
2. Basis inkludiert immer Standard-Salad
3. Probiert 0-2 Extras (gefiltert auf Score-Verbesserung)
4. Probiert 0-1 Sauces (wenn Sauce erlaubt und Base-Score < 3)
5. Scoring: gewichtete Abweichung von Ziel-Makros
6. Sortiert nach Score, gibt Top 20 zurück, zeigt Top 8 an

### Farmer J (`optimizeFJ`)
1. Enumeriert Main × Base × (0–2 Sides aus allen 9)
2. Wenn "Nur Gratis-Items" aus: probiert je 1 Topping bzw. 1 Sauce/Dip/Topping (Score-Verbesserung nötig)
3. Set Fieldtrays/Fieldbowls/Solo-Salate laufen als Einzel-Kandidaten mit
4. Gleiche Score-Funktion, Top 20/Top 8 wie Subway

### À la carte: Itsu (`optimizeItsu`), Pret (`optimizePret`), Nando's (`optimizeNandos`), Wagamama (`optimizeWaga`) und GDK (`optimizeGDK`)
Alle nutzen den gemeinsamen Kern `alaCarteCombos`:
1. Enumeriert alle Singles und Paare (Duplikate erlaubt, i<=j)
2. Triples per Beam-Suche: nur Erweiterungen der besten 80 Paare (dedupliziert) — bleibt auch mit großem Pool flott
3. **Max-Items-Chips: 1 / 2 / 3 / 5 / ∞** (Default 3). Ab Stufe 4 erweitert eine Beam-Suche die besten 80 Kombos so lange um je 1 Item, wie sich der Score verbessert (über dem Ziel stirbt die Suche natürlich aus) — bis zum gewählten Limit bzw. bei ∞ bis zum harten Sicherheitslimit von 12 Items. Größter Pool (Nando's, Tagesziel, ∞): ~260ms
4. Gleiche Score-Funktion, Top 20/Top 8

Pool-Bildung:
- **Itsu**: aktive Chips MINUS Getränke (immer) MINUS soups/noodles/desserts (Schalter, siehe `ITSU_LIGHT_CATS`)
- **Pret**: Getränke immer raus; dann Vorrang: "Salads and protein pots only" > "only relevant items, no bullshit" (rel-Whitelist) > Chips
- **Nando's**: aktive Chips MINUS Desserts/Sharing Platters (Schalter, `NANDOS_SWITCH_CATS`) MINUS Saucen (Schalter "No sauces", `sauce:true`); Drinks sind nicht in den Daten
- **Wagamama**: aktive Chips MINUS ramen-Kategorie (Schalter "No Ramen")
- **GDK**: aktive Chips MINUS sauce:true-Items (Schalter "No Sauce") MINUS rice_bowls (Schalter "No rice bowl")

UI-Rendering: Itsu, Pret, Nando's, Wagamama & GDK teilen sich Ergebnis-Karten und Detail-Panel über den `AC`-Alias in App()

### Urban Greens (`optimizeUG`)
- Modus "pre": 18 fertige Trays/Salads als Einzel-Kandidaten (wie FJ-Sets)
- Modus "salad"/"tray": Beam-Suche über den jeweiligen Deliveroo-Flow — Stufen: Backbone×alle 364 Veg-Triples → (Tray: ×9 Pflicht-Scoops) → ×36 Topping-Paare → (Salad: ×7 Dressings +ohne) → optional Extra-Protein → optional bis 2 Extras (Extra-Veg/Scoops/Toppings/Extra-Dressings); nach jeder Stufe bleiben die besten ~400–800 (heuristisch, nicht garantiert optimal)
- Performance: läuft komplett auf vorberechneten kcal/P/F/C-Summen statt sumN (~40–80ms); `resultsUG`-Memo rechnet nur wenn der UG-Tab aktiv ist
- UG nutzt NICHT den AC-Alias (eigene Result-Form mit kind/green/carb/prot/veg/scoop/tops/dress/extras) — eigene Karte + eigenes Panel

## Detail-Panel (nach Ergebnis-Auswahl)
- Macro-Bars mit Live-Vergleich zu Zielen (beide Restaurants)
- **Subway**: Extras (inkl. Double Meat/Cheese), Salad togglen ("✦ Mein Standard"), Saucen (max 2), Seasonings
- **Farmer J**: Toppings togglen, Sauce/Dip/Topping togglen (max 1, UI erzwingt das); bei Sets keine Add-ons
- **Farmer J Set-Browser**: alle 13 Sets gruppiert (Set Fieldtrays / Set Fieldbowls / The Salad, Solo), Klick wählt das Set aus und öffnet das Detail-Panel
- **Itsu & Pret & Nando's** (gemeinsames À-la-carte-Panel): Item-Aufschlüsselung (kcal + Protein je Item), keine Add-ons; Bestellanleitung = Stückliste mit Mengen (z.B. "2× chicken gyoza")
- **Urban Greens**: Komponenten-Aufschlüsselung nach Gruppen + Bestellanleitung (Salad: 11 Schritte, Tray: 10, fertig: 2); KEINE Fibre/Salt-Bars (keine Daten); fertige Salads tragen den Hinweis "Werte ohne Dressing"
- **Bestellanleitung (Deliveroo)**: nummerierte Schritt-für-Schritt-Liste, aktualisiert sich live

## Footlong-Logik (Subway) — GEFIXT
- Footlong: alle Component-Nährwerte ×2, **AUSSER Salads** (×1), gemäß PDF-Fußnote
- Implementiert über `sumN(items, mult, singleItems)`: `items` werden mit `mult` skaliert, `singleItems` (Salads) immer ×1
- Der frühere Bug (Salads wurden mitverdoppelt) ist behoben; `node tests.js` sichert das ab

## Design
- Dark Mode (#0d0d0d Background)
- Subway Green (#009743) als Akzentfarbe; Farmer-J-Header in Olivgrün (#8a9a2b→#5c671d)
- Fonts: DM Sans (UI), DM Mono (Zahlen/Labels)
- iPhone-optimiert: safe-area-inset, touch-optimierte Buttons
- PWA-fähig: apple-mobile-web-app-capable, Vollbild-Modus

## Dateistruktur
```
Essen bestellen Claude Tool/
├── index.html               ← Die PWA (alles-in-einem, alle Restaurants)
├── CLAUDE.md                ← Diese Datei
├── tests.js                 ← Logik-Tests (node tests.js)
├── export-farmerj.js        ← Regeneriert data/farmerj.json aus index.html
├── itsu-crawl.js            ← Crawlt itsu.com → data/itsu-raw.json
├── itsu-update.js           ← Generiert ITSU-Block in index.html aus data/itsu-raw.json
├── pret-crawl.js            ← Crawlt pret.co.uk Delivery-Menü → data/pret-raw.json
├── pret-update.js           ← Generiert PRET-Block in index.html (inkl. rel-Whitelist)
├── nandos-crawl.js          ← Holt Nando's-Menü über api.nandos.services (menu-v2 GraphQL) → data/nandos-raw.json
├── nandos-update.js         ← Generiert NANDOS-Block in index.html (mg→g, Filter-Regeln)
├── export-urbangreens.js    ← Regeneriert data/urbangreens.json aus index.html
├── wagamama-update.js       ← Generiert WAGAMAMA-Block in index.html aus data/wagamama-raw.json
├── gdk-update.js            ← Generiert GDK-Block in index.html aus data/gdk-raw.json
├── .claude/launch.json      ← Preview-Server-Konfiguration
└── data/
    ├── urbangreens.json     ← Urban-Greens-Daten + Order Rules als JSON
    ├── UrbanGreens-AllergenMatrix.pdf ← Original "Allergen guide 2026" (Nährwerte, nur kcal/P/F/C)
    ├── UrbanGreens_Nutrition.xlsx ← User-Excel mit denselben Werten (Kontrollreferenz)
    ├── UrbanGreens-Deliveroo-Screenshots.pdf ← Deliveroo-BYO-Salad-Flow (Referenz)
    ├── nutrition.json       ← Subway-Nährwertdaten als JSON
    ├── farmerj.json         ← Farmer-J-Daten + Order Rules als JSON
    ├── itsu-raw.json        ← Itsu-Rohdaten vom Crawl (inkl. Allergene, URLs)
    ├── pret-raw.json        ← Pret-Rohdaten vom Crawl (inkl. Preise, Allergene, Veggie-Flags)
    ├── nandos-raw.json      ← Nando's-Rohdaten von der Order-API (inkl. Drinks, Preise, Subsections)
    ├── wagamama-raw.json    ← Wagamama-Daten aus User-Copy-Paste-Batches (inkl. Allergene, Veggie-Flags)
    ├── gdk-raw.json         ← GDK-Daten aus User-Copy-Paste (offizielle Nährwerttabelle, sauce-Flags)
    ├── subway-optimizer.jsx ← React-Komponente mit vollständigen Subway-Daten (inkl. Toasties, Wraps, etc.)
    ├── Farmer J _ Nutritional Info.xlsx ← Original-Erfassung Farmer J
    └── UKIandROINutritionalInformationJan2026.pdf ← Original-PDF Subway
```

## Neues Restaurant hinzufügen (Muster)
1. Daten erfassen: Excel/PDF → JSON extrahieren, ODER Website crawlen (siehe itsu-crawl.js — bei Nuxt/Next-Seiten steckt oft alles im `__NUXT__`/`__NEXT_DATA__`-Payload). ACHTUNG: Frische der Quelle prüfen (Last-Modified-Header, Stichproben gegen die Live-Seite) — statische Build-JSONs können uralt sein (Nando's-Lektion); dann lieber die API der Order-App anzapfen (siehe nandos-crawl.js)
2. Datenobjekt in `index.html` einbetten (gleiche Feldnamen: kcal, fat, sat, carbs, sugars, fibre, protein, salt)
3. Eigene `optimizeXY`-Funktion nach dem Bestellmodell des Restaurants (nutzt `sumN` + `score`)
4. `resto`-State erweitern, Tab + bedingte UI-Blöcke (Ergebnisliste, Detail-Panel, Bestellanleitung)
5. Tests in `tests.js` ergänzen, `node tests.js` ausführen

## Zukünftige Features (noch nicht gebaut)
- Urban Greens: `dressId` für 5 Fertig-Salads nachtragen (Beef Saigon, Salmon Avocado, Shrimp Habanero, Urban Caesar ×2 — User liefert Deliveroo-Beschreibungen), dann sind sie automatisch wieder im Optimizer
- Urban Greens: Makros für die ausgeschlossenen Deliveroo-Items besorgen (Piri Piri Chicken/Shrimp, Lemon & Herb Chicken, Red Rice [Warm], Piri Piri Caesar Dressing) und ergänzen
- Subway: Wraps, Toasties, Salads, Spuds als weitere Kategorien (Daten in subway-optimizer.jsx vorhanden)
- Sides und Cookies in Gesamtberechnung einbeziehen
- Favoritenspeicherung (localStorage)
- Mehrere Mahlzeiten pro Tag tracken
