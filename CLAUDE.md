# Macro Optimizer (Subway UK + Farmer J + Itsu + Pret + Nando's + Urban Greens + Wagamama + GDK + Atis + TFC + Chopstix + Pepe's + Five Guys + Pizza Express + Wasabi + Leon)

## Projektübersicht
Standalone PWA (single HTML file) zur Optimierung von Restaurant-Bestellungen basierend auf Makro-Zielen. Zielplattform: iPhone Home Screen via "Add to Home Screen" in Safari (live auf GitHub Pages, siehe Deployment). Restaurants: **Subway UK**, **Farmer J** (London), **Itsu** (UK), **Pret A Manger** (UK), **Nando's** (UK), **Urban Greens** (London), **Wagamama** (UK), **German Doner Kebab / GDK** (UK), **Atis** (atisfood.com, London) **The Fitness Chef / TFC** (UK, Meal-Prep), **Chopstix Noodle Bar** (UK, Build-a-Box), **Pepe's Piri Piri** (UK) **Five Guys** (UK, Build-Your-Own Burger/Sandwich + Fries) **Pizza Express** (UK, à la carte aus der offiziellen Nährwert-PDF) **Wasabi** (UK, à la carte; Sushi/Bento/Salads/Soup, per-100g→Portion skaliert) und **Leon** (UK, à la carte; All-Day-Menü von leon.co), umschaltbar per Tabs im UI. Weitere Restaurants sollen folgen. Zusätzlich gibt es zwei restaurantsübergreifende Tabs (ganz vorne in der Tab-Zeile): **„Accurate restaurants"** (nur die 12 Restaurants mit verlässlichen Daten: Subway, Farmer J, Itsu, Pret, Nando's, Urban Greens, Wagamama, Atis, Fitness Chef, Pepe's, Pizza Express, Wasabi — Leon ist (noch) nicht in der Accurate-Liste) und rechts daneben **„All restaurants"** (alle 16). Beide berechnen restaurantsübergreifend die besten Bestellungen.

## Deployment / Sync
Live auf **GitHub Pages**: https://theo0202.github.io/macro-optimizer/ (Repo `theo0202/macro-optimizer`). Nach JEDER getesteten Änderung an index.html: `git push` (GitHub CLI unter `C:\Program Files\GitHub CLI\gh.exe`, nicht im PATH) → Theodors iPhone-Home-Screen-App zeigt die neue Version nach ~1 Min + Neustart der App. Die App ist self-contained (alles in index.html, CDN für React/Fonts).

## Sprache
- **UI-Strings sind ENGLISCH** (User teilt das Tool mit nicht-deutschsprachigen Freunden) — alle sichtbaren Texte (Buttons, Labels, Bestellanleitung, Footer) auf Englisch halten. Code-KOMMENTARE bleiben Deutsch (nur für Dev). Antworten an den User + diese CLAUDE.md weiterhin Deutsch.

## Tech Stack
- Single `index.html` file (PWA)
- React 18 via CDN (UMD build, kein Build-Step)
- Vanilla `createElement` calls (kein JSX, kein Bundler)
- Inline Styles, kein CSS Framework
- Fonts: DM Sans + DM Mono via Google Fonts CDN
- Tesseract.js v5 via CDN (`<script defer>`) für client-seitige OCR (Screenshot-Import) — kein Backend, kein API-Key

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
- `node atis-update.js` generiert den ATIS-Block aus `data/atis-raw.json` (KEIN Crawler — User liefert Screenshots; Skript mappt Screenshot- → Deliveroo-Namen)
- `node tfc-update.js` generiert den TFC-Block aus `data/tfc-raw.json` (KEIN Crawler — User liefert Copy-Paste; Skript komponiert Größen-Namen + rechnet sodium→salt)
- `node pepes-update.js` generiert den PEPES-Block aus `data/pepes-raw.json` (KEIN Crawler — User liefert offizielle Nährwerttabelle als Copy-Paste; Skript setzt fibre=0 + schreibt cats/flavours/items). Validierung: `node verify-pepes.js`
- `node fiveguys-update.js` generiert den FIVEGUYS-Block aus `data/fiveguys-raw.json` (KEIN Crawler — User liefert die offizielle Five-Guys-Nährwerttabelle, die KOMPONENTEN-basiert ist). Das Skript **komponiert** Burger aus Komponenten (Patty/Bun/Cheese/Bacon), generiert Cajun-Fries (= Fries + Cajun Seasoning) und schreibt mains/fries/toppings. Validierung: `node verify-fiveguys.js`
- `py -3 pizzaexpress-extract.py "<pfad>.pdf"` extrahiert die Pizza-Express-Naehrwerte aus der offiziellen PDF (pdfplumber; per-Portion-Makros, Mojibake-Bereinigung, Merge umbrochener Namen) → `data/pizzaexpress-raw.json`. Dann `node pizzaexpress-update.js` → PIZZAEXPRESS-Block (Marker `__PIZZAEXPRESS_DATA_START__`/`__PIZZAEXPRESS_DATA_END__`). KEIN Crawler — die PDF ist die Quelle
- `py -3 wasabi-extract.py "<pfad>.pdf"` extrahiert die Wasabi-Naehrwerte (pdfplumber **`extract_tables()`** + Header-Spalten-Mapping). WICHTIG: Wasabis Tabelle ist **per 100g** (ausser kcal, die per Portion steht) → per-Portion-Makros = per-100g × Portion/100. KEINE Ballaststoff-Spalte → fibre=0. Dann `node wasabi-update.js` → WASABI-Block (Marker `__WASABI_DATA_START__`/`__WASABI_DATA_END__`). KEIN Crawler
- `node leon-crawl.js && node leon-update.js` aktualisiert die Leon-Daten. Leon ist Next.js — ALLE Menü-Items inkl. Nährwerten stecken im `__NEXT_DATA__` (`props.initialReduxState.data.menuItems`) jeder Seite; ein Fetch der All-Day-Menüseite reicht. `leon-crawl.js` → `data/leon-raw.json`: **Deliveroo-Prune** via `DELIVEROO_KEEP` (nur auf der Deliveroo-Karte bestellbare Produkte, leon.co-Name→Deliveroo-Anzeigename, Größen per kcal verifiziert) + 3 Kids-Meals (`KIDS_ADD`, menuType kids); **Gesamtfett = max(Fat-Feld, sat+mono+poly)** (Leons Fat-Feld teils kaputt); in sich kaputte Items (kcal≠Makros) ausgeschlossen. `_meta.missing` warnt, falls ein Keep-Eintrag nicht mehr in der Quelle steht. `leon-update.js` → LEON-Block (Marker `__LEON_DATA_START__`/`__LEON_DATA_END__`)
- Preview-Server: `.claude/launch.json` → "macro-optimizer" (py -3 -m http.server 8321)

## Datenquellen
- **Subway**: UK & ROI Nutritional Information January 2026 PDF (`data/UKIandROINutritionalInformationJan2026.pdf`)
  - Alle Nährwerte **per 6-inch Serving** (Footlong = ×2, inkl. Gemüse-Toppings „Vegetables"; nur eigenständige Sides/standalone-Salads ×1 — siehe Footlong-Logik)
  - Component-level Daten von Seite 3 des PDFs
  - **Sides** (`D.sides`: Baked Beans Snack Pot, Coleslaw Regular, Coleslaw Double) aus der neueren **UKI June 2026 PDF** (Seite 2, „Sides") — eigenständige Beilagen, werden ×1 gerechnet (kein Footlong-×2). Sanity-Check 19.06.2026 bestätigte die übrigen Komponenten weitgehend unverändert ggü. Jan 2026 (Breaded Chicken + Falafel fehlen in June → entfernt)
  - **Meatball Marinara** (`meatball_marinara`) nutzt bewusst die **HALAL Meatballs (in marinara sauce)** = 229 kcal (137 g; F14/sat5.9/C13/sug6.7/fib2.7/P14/Salz1), NICHT die Pork-&-Beef-Variante (193 kcal). User 20.06.2026: Subway nutzt die Halal-Meatballs generell, egal ob Halal-Filiale oder nicht
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
  - Kategorien sind selbst zugeordnet (donburi, ramen, teppanyaki = alle soba/udon-Gerichte, sides) und entstehen automatisch aus den `cat`-Feldern
  - Stand Juni 2026: 3 Batches; weitere folgen. Batch 3: neue Kategorie **curries** (chicken/yasai katsu curry, prawn/chicken/tofu raisukaree, prawn/chicken/tofu firecracker) + seasonal **buldak bibimbap** (in donburi). Die 3 Firecracker haben hohen Zucker (~35 g) → kcal liegt ~4-5% über 4C+4P+9F (Atwater-Näherung, echte Werte)
  - **Deliveroo-Prune (User 28.06.2026): 32 → 27 Items**, nur noch auf der Deliveroo-Karte (Referenz: Canary Wharf) bestellbare Gerichte. Raus: **thai beef salad** (keine Salads auf Deliveroo → Kategorie `salads` komplett weg), **hot chicken katsu curry** + **hot yasai katsu curry** (Deliveroo führt nur die nicht-scharfen Katsu-Currys; „extra hot katsu sauce" gibt es nur als separates Extra), **yasai yaki soba | udon** (638) + **yasai yaki soba | mushroom** (768). Deliveroo bietet nur **EINE** yasai yaki soba (660 kcal, rice-noodle-Basis, Anzeigename „| mushroom"): der behaltene 660er-Eintrag (früher „| rice noodles", exakter kcal-Match) wurde auf den Deliveroo-Namen **„yasai yaki soba | mushroom"** umbenannt. kcal-Diffs Deliveroo↔wagamama.com bleiben bei den behaltenen Items (wagamama.com-Werte gelten, volle Makros). Verifiziert: 2 unabhängige Audits + `node tests.js` + Live-Preview. **Danach (User 28.06.2026) +2 Deliveroo-Rice-Bowls mit vollen wagamama.com-Makros aufgenommen → 29 Items**: **gochujang salmon rice bowl** (786) + **chicken + prawn turmeric rice bowl** (677), beide cat `donburi`. **Auf Deliveroo, aber (mangels voller Makros) NICHT aufgenommen**: bao buns, gyoza, neue gochujang/buldak-Sides (buldak fire wings, gochujang tamarind pork/corn ribs, spicy smashed cucumber), hot honey fried chicken, chilli squid, ebi katsu, bang bang cauliflower, edamame, koko prawn crackers, gochujang pork belly ramen; das „yaki udon"-Einzelitem entspricht dem behaltenen „chicken + prawn yaki udon"
- **German Doner Kebab (GDK)**: offizielle Nährwerttabelle (per-Serving-Spalte) — KEIN Crawler, **User liefert Copy-Paste**
  - Workflow: Items in `data/gdk-raw.json` (Name, cat, `sauce:true` wenn Sauce drin, 8 Makros) → `node gdk-update.js` → GDK-Block (Marker `__GDK_DATA_START__`/`__GDK_DATA_END__`)
  - 69 Items, 8 Kategorien (kebabs, wraps, burritos, quesadillas, rice_bowls, boxes, sides, juniors); Juniors standardmäßig AUS (Kids-Menü, wie Nando's Nandinos). Sides (9 Items: Fries/Flaming/Doner-Seasoned je Regular+Large, Chilli Cheese Bites, Hash Brown Bites ±Doner Seasoned) per Copy-Paste-Batch nachgeliefert
  - `sauce:true` = Item enthält Sauce: alle "WITH SAUCE"-Varianten, plain Quesadilla (vs. "Doner Quesadilla … WITHOUT SAUCE"), alle Ketchup-Juniors. Schalter "No Sauce" filtert diese
  - "EXTRA HOT"-Junior-Varianten weggelassen (makro-identisch zur Curry-Version)
  - **DONER BURRITO MIX entfernt** (User-Entscheidung 12.06.2026): fat=12.4 war ein Tippfehler im GDK-Sheet (1175 kcal mit 12g Fett unmöglich, ~69 erwartet). Falls korrekter Wert nachkommt → wieder in gdk-raw.json aufnehmen
  - **EXCLUDE-Listen in den Update-Skripten** (harte Ausschlüsse, überleben Re-Crawls): itsu-update.js `EXCLUDE_NAMES` ("edamame" — plain Beilage, "chocolate edamame" bleibt), pret-update.js `EXCLUDE_NAMES` ("Apple", "Banana"). Nando's Wings/Livers sind KEIN harter Ausschluss mehr, sondern `wings:true`-Flag (`WINGS_NAMES` in nandos-update.js) + Schalter "No wings / chicken livers"
- **Atis** (atisfood.com, London): offizielle Nährwerttabelle (per-Serving) — KEIN Crawler, **User liefert Screenshots**; Roh-Transkription in `data/atis-raw.json` (Quelle der Wahrheit)
  - Workflow: Items in `data/atis-raw.json` (Name, section, portion, Flags `carb`/`doublePlate`/`seasonal`, 8 Makros) → `node atis-update.js` → ATIS-Block (Marker `__ATIS_DATA_START__`/`__ATIS_DATA_END__`)
  - 86 Roh-Items; Bases + Dressings je REGULAR und LARGE (portion-Feld). atis-update.js gruppiert in Arrays (bases/basesL, mixed, ingredients, proteins, sauces/saucesL, crunches, addons) und mappt Screenshot-Namen → aktuelle Deliveroo-Namen (`RENAME`-Map: z.B. Sesame Spicy→Gochujang Cauliflower, Broccoli→Roasted Broccoli, Avocado Half→Avocado, Miso Ginger…→…Wedges)
  - **doublePlate:true** = unterstrichene Items (4 Carb-Bases: Wholegrain Rice/Harissa Grains/Herb Quinoa/Roast New Potatoes + alle 4 Mixed Salads): in der Power Plate ×2 ("UNDERLINED ITEMS HAVE DOUBLE PORTION IN PLATES", vom User bestätigt). Greens + Proteins sind NICHT unterstrichen → einfach
  - **kcal-Diffs Deliveroo↔Tabelle** bei 3 Items (Blackened Chicken 204/260, Miso Ginger Sweet Potato 145/220, Herb Quinoa 129/118): die Nährwerttabelle gilt (volle Makros + intern konsistent mit P/F/C); Deliveroo-Werte sind vermutlich andere Portion/Rundung
  - LARGE-Bases/Dressings (`basesL`/`saucesL`) aktuell UNGENUTZT — reserviert für den Bowl-Modus/Größenvariante
  - Atis hat volle 8 Makros (inkl. sat/sugars/fibre/salt) → Fibre/Salt-Constraints funktionieren (anders als UG)
- **The Fitness Chef (TFC)** (UK Meal-Prep): offizielle Produktseiten (per-Serving) — KEIN Crawler, **User liefert Copy-Paste**; Roh in `data/tfc-raw.json`
  - Workflow: Items in `data/tfc-raw.json` (Name, cat, `size` wl/ml/wg bei Dishes, 7 Makros + `sodium` in mg) → `node tfc-update.js` → TFC-Block (Marker `__TFC_DATA_START__`/`__TFC_DATA_END__`)
  - **Dishes in 3 Größen** (Weight Loss / Maintain-Lean / Weight Gain) — je eigenes Item mit Größen-Suffix im Namen ("Chicken Supreme (Weight Loss)"); der Optimizer wählt automatisch die passende Größe. Sides ohne Größe
  - **Sodium → Salt**: Quelle gibt Sodium in **mg** → tfc-update.js rechnet `salt(g) = sodium(mg) × 2.5 / 1000` (UK-Konvention)
  - 45 Items: Meat Dishes (6 Gerichte × 3), Fish Dishes (3 × 3), **Pasta (4 × 3)**, Sides (6). Volle 8 Makros → Fibre/Salt-Constraints funktionieren
  - **`fish:true`-Flag** (auto in tfc-update.js: cat fish_dishes ODER Name enthält salmon/tuna) auf 15 Items (9 fish_dishes + Salmon-Pasta + Tuna-Pasta) → Schalter „No fish" filtert `x.fish`
  - **„Wholemeal pasta turkey minced meat" AUSGELASSEN** (User-Daten unmöglich: Protein 110/160/220 g, Fett 36-73 g bei 360-631 kcal — Spalten-/Dezimalfehler). Bei korrigierten Werten in tfc-raw.json ergänzen
  - **Salmon-Pasta-Sodium** (4.06/4.23/4.45, Quelle mit „g"-Suffix) ggü. den anderen Pasta (175-549) auffällig niedrig → wörtlich übernommen (Salt ~0.01 g), vermutlich Datenfehler (siehe `_meta.anomalies`)
- **Chopstix Noodle Bar** (UK): offizielle Nährwerttabelle **V19 (April 2026)** — KEIN Crawler, **User liefert die Tabelle als Text** (PDF konnte das Read-Tool mangels Poppler nicht rendern). Daten handgepflegt im CHOPSTIX-Objekt in index.html, volle 8 Makros
  - Build-a-Box: 1 Base + N Toppings. Box-Größen: 2 Toppings = Regular, 3 Toppings = Large (Komponentengröße). Bases skalieren Small:Regular:Large = 1:1.25:1.5; Toppings Regular == Large (offiziell identisch) → ein Wert pro Topping
  - **AUSGESCHLOSSEN** (Datenprüfung + User): Pumpkin Katsu (kcal 215 vs. Makros ~170, einziger flacher Wert), Katsu Curry Sauce (gesättigt > Fett — kaputt in V19), 4-Topping/X-Large-Box (keine X-Large-Spalte in V19), Dips + Getränke. **Lektion**: Theodors erster Copy-Paste hatte bei Salt&Pepper Chicken die Carbs/Zucker aus Sweet&Sour kopiert (kcal passte nicht) — die offizielle V19 hat es korrekt (Carbs 14,8 g) → ein erneuter offizieller Abzug schlägt eine fehlerhafte Erst-Transkription
  - Validierung der Werte: `node verify-chopstix.js`
- **Pepe's Piri Piri** (UK): offizielle Nährwerttabelle (per-Serving) — KEIN Crawler, **User liefert Copy-Paste**; Roh in `data/pepes-raw.json` (Quelle der Wahrheit). `node pepes-update.js` → PEPES-Block (Marker `__PEPES_DATA_START__`/`__PEPES_DATA_END__`)
  - **KEINE Ballaststoff-Spalte in der Quelle → `fibre:0` überall** (Fibre-Constraint/-Bar bleibt damit faktisch leer, wie bei UG). Sonst volle Makros (kcal/fat/sat/carbs/sugars/protein/salt)
  - **Add-Flavour-Mechanik**: Items mit `flavourMl>0` (29 Items, z.B. die Chicken Strips mit 40 ml) tragen eine **Pflicht-Basting-Flavour**. 7 Flavours (**Plain** = 0 kcal/0 Makros, Lemon & Herb, Mango & Lime, Mild, Hot, Extra Hot, Extreme), Werte **per 10 ml** in `PEPES.flavours[]` (Plain steht an erster Stelle → auch der sichere Fallback in optimizePepes). Der Optimizer addiert `flavour × flavourMl/10` zur Item-Basis (Beispiel: Tender Strips 3 = Basis 100 kcal + Lemon&Herb 31×4 = 224 kcal; mit Plain bleibt es bei 100) und hängt den Flavour-Namen an. Flavour ist ein **globaler Selektor** (ein Chip für die ganze Bestellung), Default Lemon & Herb. **Schalter "No flavour"** (Default AN) erzwingt Plain und blendet die Flavour-Chips aus; Plain ist KEIN eigener Chip (nur über den Schalter erreichbar)
  - **`sauce:true`** auf den 5 Mayo-/Dip-Saucen (Schalter "No sauce")
  - **AUSGESCHLOSSEN** (User-Vorgabe 15.06.2026): Pepe Wings, Half/Whole/Quarter Chicken (Knochen → im Office schlecht essbar/trackbar), alle Sauce-/Salt-Bottles (250 ml), Dark Chocolate Dip, Corn on the Cob. Außerdem die "Extra …"-Add-ons (nur kcal, keine vollen Makros). **Onion Rings Carbs 393→39.3 korrigiert** (offensichtlicher Tippfehler: 393 g Carbs unmöglich)
  - **Deliveroo-Abgleich (15.06.2026)**: alle Items, die es auf der Deliveroo-Karte nicht gibt, entfernt → 67→51 Items. Raus: alle **Double-Burger/-Patties** (Deliveroo führt keine Doubles), **Chicken Nuggets 8er** (Deliveroo nur 5er = 268 kcal), **Chimichurri Fries** (L/R) + **Chimichurri Wedges**, **Piri Piri Fries** (L/R) + **Piri Piri Onion Rings** + **Piri Piri Wedges**. Die 7 Burger-Singles wurden in die Deliveroo-Namen umbenannt (Suffix "- Single" entfernt, da ohne Double sinnlos). **Chicken/Paneer Harissa Honey Melt** stehen zwar auf Deliveroo, sind aber NICHT aufgenommen (Deliveroo nennt nur Gesamt-kcal, keine vollen Makros → kein Schätzwert)
- **Five Guys** (UK): offizielle Naehrwerttabelle (2 Screenshots, FGJUK 20260324) — **KOMPONENTEN-basiert** (Five Guys ist Build-Your-Own, daher publizieren sie pro Komponente). KEIN Crawler. Roh in `data/fiveguys-raw.json`, `node fiveguys-update.js` → FIVEGUYS-Block (Marker `__FIVEGUYS_DATA_START__`/`__FIVEGUYS_DATA_END__`), volle 8 Makros
  - **Komposition** (Annahmen im `_meta.composition_assumptions`, von Five-Guys-Standard abgeleitet): Hamburger = 2 Patties + Bun, Little = 1 Patty + Bun; **Cheese = 1 Scheibe pro Patty** (Cheeseburger 2, Little Cheeseburger 1); **Bacon = 1 Portion** (= die „Bacon"-Spalte ~2 Streifen); **Cheese Dog = 1 Cheese-Scheibe** (Annahme, da nur Komponenten geliefert — bei besserer Quelle anpassen). Cajun Fries = Fries + 1 Cajun Seasoning. Das Generator-Skript rechnet die Summen (keine handgetippten Produktwerte)
  - 13 Mains (8 Burger komponiert + 5 Sandwiches/Lettuce Wrap fertig — **Hot Dogs auf User-Wunsch 16.06.2026 entfernt**, inkl. der nur dafür genutzten Komponenten hot_dog + hotdog_bun), 10 Fries (Mini/Little/Regular/Large je Plain + Cajun + 2 Loaded), **15 freie Toppings** (= Deliveroos Burger/Sandwich-Free-Topping-Liste)
  - **Deliveroo-Customizing (16.06.2026)**: Burger haben auf Deliveroo eine **Bun-Wahl** (Bun / Bowl −Bun / Lettuce Wrap −Bun+Lettuce) + **Extra Patties** (0/1/2 × Patty); Sandwiches haben **paid extras** (Add Extra Patty/Cheese/Bacon). Diese Deltas rechnet `optimizeFiveGuys` zur Laufzeit aus dem **`mods`-Block** (patty/cheese/bacon/bun/lettuce, vom Generator erzeugt). Schalter **„No sauce"** (Default AN) filtert die `sauce:true`-Toppings (Mayo, Ketchup, Mustard, BBQ, Hot, HP, Relish — Mayo zählt als Sauce)
  - **Topping-Pool = Deliveroos 15** (Mayo/Relish/Fresh Onions/Lettuce/Pickles/Tomatoes/Grilled Onions/Grilled Mushrooms/Ketchup/Mustard/Jalapeno/Green Peppers/HP/BBQ/Hot Sauce). NICHT in Deliveroos Free-Toppings → entfernt: **Grilled Cheese Slice** (= „Add Cheese", paid extra), **Crispy Fried Onions**, **Fried Egg** (im offiziellen Nährwert-PDF gelistet, aber nicht als Free-Topping bestellbar)
  - **Deliveroo-vs-Komponenten-kcal-Konflikt** (siehe `_meta.deliveroo_kcal_note`): Deliveroo zeigt z.B. **Bacon Cheeseburger 904 kcal**, die Komponenten-Summe ergibt **834**; gleichzeitig sagt dieselbe Deliveroo-Seite „Add Bacon +78" (1 Portion) — die 904 sind also NICHT aus den Komponenten reproduzierbar. Wir nutzen die offizielle, in sich konsistente Komponenten-Tabelle (volle Makros); Deliveroo-Anzeige kann ~70 kcal höher sein. Falls Deliveroo-genaue kcal gewünscht: User müsste die Deliveroo-Produkt-kcal je Burger liefern
  - **AUSGESCHLOSSEN**: Bulk Peanuts (nur per-100g, keine Portion), Getraenke (nicht in den Screenshots), die Diced-Loaded-Fries-Sub-Toppings (Loaded Fries sind als fertige Produkte drin)
  - **Noch nicht voll gegen die Deliveroo-Karte abgeglichen**: „Mini Fries" ist evtl. keine Deliveroo-Groesse; bei Bedarf wie bei Pepe's mit der Deliveroo-Karte prunen
- **Pizza Express** (UK): offizielle Nährwert-PDF „PEX Nutritional Menu - June 26" (England/Wales/Scotland), 24 Seiten, per-Portion + per-100g. KEIN Crawler. `py -3 pizzaexpress-extract.py` (pdfplumber) parst die Food-Seiten (Dough Balls/Starters/Sides/Pizzas Classic+Romana+Large/Leggera & Al Forno/Salads/Desserts) → `data/pizzaexpress-raw.json`; `node pizzaexpress-update.js` → PIZZAEXPRESS-Block. Volle 8 Makros (per Portion: kcal/fat/sat/carbs/sugars/fibre/protein/salt = die ersten 9 Spalten ohne KJ)
  - **À-la-carte-Modell** (User-Entscheidung 16.06.2026): ganzes Food-Menü als Einzel-Items (AC-Familie), KEINE Build-Your-Own-Add-ons. Die Deliveroo-Customizing-Fenster (Crust/Extra-Toppings/Cheese/Dips) sind NICHT modelliert, weil die Deliveroo-Toppings/Dips nur kcal haben (keine vollen Makros) und nicht zur PDF passen (z.B. Deliveroo „Pepperoni 241" vs PDF „Pepperoni 101"). **Crust-Wahl = die Gluten-Free- bzw. Vegan-Zeilen** sind je eigene Items (PDF hat sie). „Garlic Crust"/„Plant Cheese"-Deltas nicht modelliert (keine sauberen Daten)
  - Die PDF-Extraktion liefert 229 Roh-Items (inkl. GF/Vegan/„(Dine Out)"-Varianten). Extraktor: Mojibake→ASCII, Merge umbrochener Namen, kcal-Plausibilitäts-Check (4C+4P+9F). **`data/pizzaexpress-raw.json` bleibt die volle Quelle** — der Prune passiert erst in `pizzaexpress-update.js`
  - **Deliveroo-Prune (User-Entscheidung 17.06.2026 „voll auf Deliveroo-Liste"): 229 → 156 Items.** Nur auf der Deliveroo-Bestellseite bestellbare Produkte. Regeln in `pizzaexpress-update.js` (`pruneKeep`): Pizzen = alle Rezepte auf Classic/Romana/Large + GF/Vegan AUSSER **Padana** + **Garlic Prawn** (nicht auf Deliveroo); „Double American Cheese" existiert in der PDF nur als (Dine Out) → behalten. Dough Balls/Sides = „(Dine Out)"-Dubletten raus, Dough Balls „Al Forno" raus. Leggera & Al Forno = nur die 5 Pasta (Lasagna/Cannelloni/Pollo Pesto/Peperonata/Prawn Puttanesca), die **Leggera-Pizzen** (Pomodoro etc.) gibt es auf Deliveroo nicht. Starters = explizite Deliveroo-Liste. Salads = „with GF Dough Balls"-Varianten + „Warm Roasted Veg & Chicken Bowl" raus (Basis + „with dough sticks" bleiben). Desserts = die 8 Deliveroo-Desserts
  - **Deliveroo nutzt teils die „(Dine Out)"-Portion**: bei Calamari (675≈678), Mozzarella Sticks (552), Squad Sharer (1320 = „Sharing Trio (Dine Out)") und **allen Desserts** (Biscoff 913, Brownie Bites 988, Blondie Bites 874, Lemon&Rasp 330, Vanilla 466, Honeycomb 479, Stem Ginger 509) matchen die Deliveroo-kcal exakt die (Dine Out)-PDF-Werte → diese Variante behalten. „(Dine Out)" wird aus den Anzeigenamen entfernt; „Sharing Trio" → „Squad Sharer" (Deliveroo-Name)
  - **Salad-Add-ons + „No Dips"-Schalter NICHT gebaut** (User-Entscheidung 17.06.2026 „bei à la carte bleiben"): Deliveroo-Dips/Extra-Toppings (Dough Sticks, Chicken/Goat's Cheese/Olives/Tuna) haben nur kcal (keine vollen Makros) und passen nicht zur PDF → kein Build-Your-Own. Die fertigen „… with dough sticks"-Salads decken die Dough-Sticks-Option ab
  - Ausgeschlossen: Drinks, Hot Drinks (gar nicht in den Daten — „alle Getränke ignorieren"), Piccolo (Kids), Breakfast (nur Airport), Extra Toppings + Dips, sowie der gesamte Deliveroo-Prune (Padana/Garlic Prawn/Leggera-Pizzen/Sorbets/Gelato/Dolcetti/Affogato/Cajun Prawns/Meatballs etc.)
- **Wasabi** (UK): offizielles `WAS_Nutritional_Guide` PDF (Version 32). KEIN Crawler. `py -3 wasabi-extract.py` (pdfplumber `extract_tables()`, Header-Spalten-Mapping) → `data/wasabi-raw.json`; `node wasabi-update.js` → WASABI-Block. À la carte (AC-Familie)
  - **Tabelle ist PER 100g** (ausser kcal = per Portion in eigener Spalte) → Makros werden mit `portion/100` skaliert. Fehlt die per-Portion-kcal-Spalte (cold sides/sides), wird kcal = kcal100 × portion/100 abgeleitet. **KEINE Ballaststoffe → fibre=0** (wie UG/Pepe's)
  - 158 Items, 8 Kategorien: Sushi (34), Salads (19), Cold Sides (4), Soup (6), Bento (54), Breakfast (10), Sides (18), Sauces & Dressings (13)
  - **AUSGESCHLOSSEN**: Getränke (hot beverages, S.25-27), **Sharing-Platters** (Matsuri/Tsudoi — per-pack-kcal ≠ per-serving-Portion), eine **Porridge-Zeile mit Protein=1388** (PDF-Glitch, über Plausibilitäts-Filter per-100g-Makro>80 gedroppt)
  - **Bento-Seite 14 BEWUSST ausgelassen** (`range(15,21)` in wasabi-extract.py): S.14 ist eine redundante „standard+large"-Tabelle (20 Spalten) mit **leerem Sat-Fat-Header** (→ sat=0 für alle 13 Gerichte) und listet exakt dieselben 13 Bento wie die sauberen Einzelportions-Tabellen auf **S.19/20** (dort korrektes Sat-Fat + 2 zusätzliche Gerichte: Beef/Chicken biang biang kobachi). Früher führte das zu doppelt gezählten Bento (67 statt 54) + 13× falschem sat=0 — verifiziert + behoben. **Tripwire-Guard** in wasabi-extract.py warnt jetzt, falls je wieder eine Daten-Tabelle eine Pflicht-Makrospalte nicht mappt (leerer Header)
  - **Anomalie**: „Tofu curry yakisoba bento" — kcal stimmt (= kcal100×Portion), aber die per-100g-Makros der PDF unterzählen die kcal um ~30% (PDF-eigene Inkonsistenz) → kcal korrekt, Makros wie publiziert (1 kcal-Flag in der Extraktion)
- **Leon** (UK): leon.co/menu/all-day/ — Next.js, ALLE Menü-Items inkl. Nährwerten im `__NEXT_DATA__` (`props.initialReduxState.data.menuItems`). `node leon-crawl.js` → `data/leon-raw.json`; `node leon-update.js` → LEON-Block. À la carte (AC-Familie). Volle 8 Makros aus `nutritionInfo[{name,unit,amount}]`
  - **Umfang (Deliveroo-Prune, User 20.06.2026)**: nur Produkte, die es auf der **Deliveroo-Bestellseite** gibt. Aus dem all-day-Menü via expliziter Keep-Liste `DELIVEROO_KEEP` in leon-crawl.js (leon.co-Name → **Deliveroo-Anzeigename** — Namen weichen ab: „Big Box"→„Big Rice Box", Wortreihenfolge „Chicken Aioli"→„Aioli Chicken", Größen per kcal verifiziert: GFC 451=5pc, 903=10pc, Mac 323=4pc, Honey Sriracha 521=5pc, Baked Fries 242, Satay/Aioli 690/714=Small Rice Box). **NICHTS von Deliveroo dazunehmen, was nicht in den leon.co-Daten steht.** Drinks/Coffee/Cookies/Cakes/Sauces nicht modelliert. **PLUS 3 Kids-Meals** von leon.co/menu/kids (Kategorie „Kids' All Day", **default AN**): GFC Crispy Chicken Nuggets & Baked Fries (523), Chargrilled Chicken Rice Box (382), Brazilian Black Beans with Rice (415)
  - Ergebnis: **26 Items, 8 Kategorien** (Wraps 5/Rice Boxes 9/Superfood Salads 2/Burgers 2/Sides 3/Nuggets 1/Fries 1/Kids' All Day 3)
  - **Auf Deliveroo, aber NICHT aufgenommen**: „LEON Slaw - Large" (133 — meine all-day-Daten haben nur die 117er Größe, nicht die Deliveroo-Large) + „Salsa Verde & Aioli Chicken Mezze" (309 — Leons Nährwerte dafür sind in sich kaputt, kcal≠Makros). „Little LEON Kids Meal Deal" (Deliveroo-Bundle, 0 kcal) — stattdessen die 3 einzelnen Kids-Meals von leon.co
  - **Fett-Fix**: Leons „Fat"-Feld ist bei manchen Items fehlerhaft. Zwei Fehlertypen: (a) **truncated** (z.B. „Mushroom Magic Romesco" Fat=2.6, aber sat=3.9 → unmöglich; echtes Fett = sat+mono+poly = 26.1), (b) **mono/poly unpopuliert (=0)** → dann ist das Fat-Feld korrekt und größer als sat. Lösung: **Gesamtfett = max(Fat-Feld, sat+mono+poly)** deckt beide ab. Nur ~4 Items werden durch Rundung minimal (≤2.6 g) verändert
  - **AUSGESCHLOSSEN** (in sich kaputte Leon-Daten, kcal nicht aus Makros rekonstruierbar — Plausibilitätsfilter |kcal−(4C+4P+9F)|>60 & >25%): **Salsa Verde and Aioli Chicken Mezze Pot** (309 kcal vs Makros ~130) + **Vegan Harissa Chick'n Wrap** (412 vs ~519). `_meta.dropped` in leon-raw.json
  - Mono/Poly-Fett, Glycemic Index, Portionsgewicht werden nicht gespeichert. **Leon (noch) NICHT in der Accurate-Liste** (bei Bedarf aufnehmbar — Daten sind offiziell + voll, nur der Fat-Feld-Fix ist eine Eigenheit)

## Daten-Architektur
- Alle Nährwertdaten als JS-Objekte direkt in der HTML eingebettet
- **Subway**: `D.breads[]`, `D.proteins[]`, `D.cheeses[]`, `D.extras[]`, `D.salads[]`, `D.sauces[]`, `D.seasonings[]`, `D.sides[]` (Baked Beans Snack Pot, Coleslaw Regular/Double — eigenständige Beilagen, ×1)
- **Farmer J**: `FJ.mains[]`, `FJ.bases[]`, `FJ.sides[]` (Warm Sides + Salads, `group`-Feld), `FJ.toppings[]`, `FJ.sdt[]` ("Sauce, Dip or Topping"-Kategorie: 4 Saucen + Egg/Avo/Hummus/Baba Ghanoush), `FJ.sets[]` (Set Fieldtrays/Fieldbowls/Solo-Salate als fertige Alternativen)
- **Itsu**: `ITSU.cats[]` (id, name, `on` = Default-Filter, `drink:true` = nie im Optimizer) + `ITSU.items[]` (flache Liste, `cat`-Feld = Primärkategorie)
- **Pret**: `PRET.cats[]` (gleiches Schema wie Itsu) + `PRET.items[]` (zusätzlich `rel:true` = Whitelist für "only relevant items, no bullshit")
- **Nando's**: `NANDOS.cats[]` + `NANDOS.items[]` (gleiches Schema; Drinks existieren im Block gar nicht)
- **Wagamama**: `WAGA.cats[]` + `WAGA.items[]` (gleiches Schema wie Itsu/Pret/Nando's)
- **GDK**: `GDK.cats[]` + `GDK.items[]` (gleiches Schema; Items zusätzlich `sauce:true`-Flag für "No Sauce"-Schalter)
- **Urban Greens**: `UG.pre[]` (18 fertige Salads/Trays, `group`-Feld) + BYO-Komponenten `UG.greens[]`, `UG.carbs[]`, `UG.prots[]`, `UG.veg[]`, `UG.tops[]`, `UG.dress[]`, `UG.scoops[]` — Items nur mit kcal/protein/fat/carbs
- **Atis**: BYO-Komponenten `ATIS.bases[]`, `ATIS.basesL[]`, `ATIS.mixed[]`, `ATIS.ingredients[]`, `ATIS.proteins[]`, `ATIS.sauces[]`, `ATIS.saucesL[]`, `ATIS.crunches[]`, `ATIS.addons[]` (volle 8 Makros; Flags `carb`/`doublePlate`/`seasonal`)
- **The Fitness Chef**: `TFC.cats[]` + `TFC.items[]` (AC-Schema wie Itsu/Pret; Dishes zusätzlich `size`-Feld wl/ml/wg, Sides ohne)
- **Chopstix**: `CHOPSTIX.bases[]` (je `reg`/`lg`-Größe mit 8 Makros) + `CHOPSTIX.toppings[]` (ein 8-Makro-Wert pro Topping, Regular=Large)
- **Pepe's**: `PEPES.cats[]` + `PEPES.items[]` (AC-Schema; Items zusätzlich `sauce:true` für "No sauce" und `flavourMl` für die Add-Flavour-Mechanik; `fibre:0` immer) + `PEPES.flavours[]` (7 Basting-Flavours inkl. Plain=0, Werte per 10 ml)
- **Five Guys**: `FIVEGUYS.mains[]` (komponierte Burger + fertige Sandwiches, je mit `group` burgers/sandwiches; Sandwiches mit pre-included Toppings tragen `incl`=Topping-IDs; Hot Dogs entfernt) + `FIVEGUYS.fries[]` (Plain/Cajun/Loaded) + `FIVEGUYS.toppings[]` (15 freie Toppings, `sauce:true` auf den 7 Saucen) + `FIVEGUYS.mods[]` (patty/cheese/bacon/bun/lettuce — Komponenten für Bun-Wahl/Extra-Patties/Sandwich-Extras zur Optimizer-Laufzeit) — alle mit vollen 8 Makros
- **Pizza Express**: `PIZZAEXPRESS.cats[]` + `PIZZAEXPRESS.items[]` (AC-Schema wie Itsu/Pret; 156 Items nach Deliveroo-Prune, volle 8 Makros per Portion; GF/Vegan-Varianten als eigene Items) — kein Build-Your-Own
- **Wasabi**: `WASABI.cats[]` + `WASABI.items[]` (AC-Schema; 158 Items, volle Makros AUSSER `fibre:0`; per-100g→Portion skaliert). Switches via `optimizeWasabi(...,noSoup,onlySushi,noSashimi,goodMeals)` (`WASABI_SOUP_CAT`/`WASABI_SUSHI_CAT`/`WASABI_GOODMEAL_CATS=["salads","bento","sides"]`)
- **Leon**: `LEON.cats[]` + `LEON.items[]` (AC-Schema; 26 Items, 8 Kategorien nach Deliveroo-Prune + 3 Kids-Meals, volle 8 Makros; Gesamtfett=max(Fat,sat+mono+poly)). `optimizeLeon(t,mode,p,activeCats,maxN)` — nur Kategorie-Chips + Max-Items (keine Schalter)
- Jedes Item hat: `id, name, kcal, fat, sat, carbs, sugars, fibre, protein, salt` (Subway zusätzlich `servingG`)
- Zusätzlich vollständige Subway-Produktdaten (`subs_6inch`, `toasties`, `saver_subs`, `wraps`, `salad_meals`, `spuds`, `sides`, `cookies`) in `data/subway-optimizer.jsx` — NICHT in der HTML-PWA, für zukünftige Features

## Bestellablauf Subway (Deliveroo UK)
1. **Protein** (ein Protein wählen) — die Proteine entsprechen **Deliveroos Build-Your-Own-Subs**. **Pepperoni und Salami gibt es dort NICHT als Einzel-Protein**, nur in den Combo-Subs: **Spicy Italian** (= Salami + Pepperoni) und **Classic B.M.T.** (= Pepperoni + Salami + Turkey Ham). Diese Combos sind als eigene Proteine modelliert, Makros = **Summe der Komponenten** (User-Entscheidung 20.06.2026; 3+3 bzw. 3+3+3 Scheiben — kann ggü. Deliveroos Combo leicht unterzählen, aber verifizierte Komponentenwerte). Pepperoni/Salami bleiben als **Extra** wählbar
2. **Größe** (6 Inch / Footlong)
3. **Bread** (ein oder mehrere erlaubte Brote wählen — Optimizer nimmt je Ergebnis das best-passende; „All breads" = alle)
4. **Cheese** (optional, max 1) — Schalter **„No cheese"** (kein Käse) und **„Cheese (always add one)"** (erzwingt immer einen der beiden Käse, kein „none"); die beiden schließen sich gegenseitig aus (einer an → der andere aus). Beide default AUS → Optimizer wählt Käse frei
5. **Extras** (beliebig viele): Double Meat, Double Cheese, Turkey Rashers, Pepperoni, Hash Browns, Chicken Strips, Turkey Ham, Poached Egg, Salami, Philly-Style Steak, Chicken Tikka
6. **Salad** (beliebig viele, je max 1×): Lettuce, Tomatoes, Cucumber, Pickles, Peppers, Olives, Red Onions, Jalapeños, Sweetcorn
7. **Sauce** (max 2): Sweet Chilli, Chipotle Southwest, Sweet Onion, Honey Mustard, Ketchup, X-Spy Chipotle, Garlic & Herb, Teriyaki, Lite Mayo, BBQ Sauce
8. **Seasonings** (beliebig viele, je max 1×): Sea Salt, Mixed Peppercorns, Crispy Onions
9. **Side** (optional, max 1 — eigenständiges Produkt, NICHT footlong-verdoppelt): Baked Beans Snack Pot, Coleslaw Regular, Coleslaw Double (Werte aus UKI June 2026 PDF, Seite 2). Der Optimizer fügt 0–1 Side hinzu (nur wenn sie den Score verbessert). **Schalter „only Subs (no sides)"** (Default AUS — „only X"-Modus) schaltet die Sides komplett aus. Side wird im Subway-`optimize` über das `singleItems`-Argument von `sumN` ×1 gerechnet (footlong verdoppelt nur den Sub). In „All/Accurate" läuft Subway subs-only (Sides nur im Subway-Tab)

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
- **Schalter "only sushi"**: Pool = Kategorie sushi & poké (`ITSU_SUSHI_CAT="sushi_poke"`) OHNE die 4 Poké-Bowls (Name deakzentuiert enthält "poke"), aber inkl. Sashimi; überstimmt Chips
- **Schalter "only sushi w/o sashimi"**: dasselbe zusätzlich ohne Sashimi (Name enthält "sashimi", aktuell nur "tuna & salmon sashimi"); strenger, impliziert "only sushi". Beide standardmäßig AUS (enge Spezialmodi)

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
- **Schalter "No wings / chicken livers"**: schließt alle 10 `wings:true`-Items aus (10/5/3 Chicken Wings + 10/5/3 Extra Saucy Wings + Wing Roulette + Chicken Livers + XL Wing Platter; "3 Chicken Wings" trifft PERi-PERi UND Nandinos). XL Wing Platter ist zusätzlich über den Platter-Schalter abdeckbar. Geflaggt in nandos-update.js (`WINGS_NAMES`) — überlebt Re-Crawls. (Früher harter Ausschluss, jetzt Schalter — User-Wunsch 12.06.2026)
- **Schalter "No Corn on the Cob"**: schließt die 2 `corn:true`-Items aus (Corn on the Cob Regular/Large) — Name beginnt mit "Corn on the Cob"
- **Schalter "Main + two sides"** (restriktiver „nur X"-Modus, **Default AUS**, `nanMainTwoSides`/`mainTwoSides`): überstimmt Chips + Max-Items komplett und baut Kombos aus **genau 1 Hauptgericht** (Kategorie **PERi-PERi Chicken** ODER **Burgers, Pittas, Wraps**) **+ genau 2 Sides**. Sides = alle `cat:"sides"` **AUSSER Rostinas** (User-Vorgabe; Duplikate erlaubt → z.B. „2× Chips (Regular)"). Mains respektieren den „No wings"-Schalter (Default AN), sonst tauchen 10/5/3 Wings als „Main" auf. Eigene Funktion `nandosMainTwoSides` (Voll-Enumeration mains × Side-Paare i≤j, Top-20; Result-Form `{items,nutrition,score}` wie `alaCarteCombos` → AC-Karte/Panel/Bestellanleitung unverändert). UI-Hinweis unter dem Schalter: gute Option, um unter dem **£23-HSBC-Limit** zu bleiben. Gilt NUR im Nando's-Tab (in All/Accurate läuft Nando's normal, `mainTwoSides` undefined)
- Standard-Chips: alle an außer Nandinos (Kids); „Main + two sides" default AUS
- Dips & Extras-Kategorie = Add-ons (Grilled Chicken Breast, Halloumi, 1/2 Avocado, Brote, Dips) — als Pool-Items nützlich für Makro-Feintuning

## Bestellablauf Wagamama (à la carte)
- Wie Itsu/Pret/Nando's: 1–3 Items, Duplikate möglich, gemeinsamer Optimizer (`alaCarteCombos`)
- Kategorien (Stand 28.06.2026, 29 Items): sides (2), donburi (7, inkl. gochujang salmon + chicken+prawn turmeric rice bowl), ramen (4), teppanyaki (8), curries (8) — `salads` entfiel mit dem Deliveroo-Prune (thai beef salad raus)
- **Schalter "No Ramen"**: schließt die komplette ramen-Kategorie aus (tantanmen beef brisket, grilled chicken, chilli chicken, kare burosu — und automatisch alle künftig ergänzten Ramen)
- Standard-Chips: alle an

## Bestellablauf German Doner Kebab / GDK (à la carte)
- Wie Itsu/Pret/Nando's/Wagamama: 1–∞ Items, Duplikate möglich, gemeinsamer Optimizer (`alaCarteCombos`)
- Kategorien (69 Items): Kebabs (12), Wraps (12), Burritos (3), Quesadillas (6), Rice Bowls (4), Boxes (12), Sides (9: Fries/Flaming/Doner Seasoned je Reg+Large, Chilli Cheese Bites, Hash Brown Bites ±Doner Seasoned), Juniors/Kids (11) — "Doner Burrito Mix" wegen Datenfehler (fat=12.4) entfernt
- **Schalter "No Sauce"**: schließt alle 26 `sauce:true`-Items aus (alle "with sauce"-Varianten, plain Quesadillas, Ketchup-Juniors) → die "no sauce"/"without sauce"-Varianten bleiben
- **Schalter "No rice bowl"**: schließt die Kategorie rice_bowls aus
- Standard-Chips: alle an außer Juniors (Kids); beide Schalter aus

## Bestellablauf Atis (Deliveroo) — Build Your Own
Zwei Modi: **"Build Your Own Bowl"** und **"Build Your Own Power Plate"**. AKTUELL implementiert: **nur Power Plate** (`atisMode "plate"`) — Bowl-Flow steht noch aus (Daten liegen vor, `optimizeAtis` gibt für `"bowl"` vorerst `[]` zurück; `atisMode`-State + `basesL`/`saucesL` bereits vorbereitet). Eigener BYO-Optimizer (Beam-Suche, wie UG), NICHT der AC-Alias.

**Power Plate** (Schritte = Deliveroo-Reihenfolge):
1. Choose Up to Two Bases: PFLICHT 1–2 aus 7 (Greens + Carbs in EINEM Schritt; Kale + Cabbage Mix aktuell NICHT im Flow → ausgeschlossen)
2. Choose a Mixed Salad: PFLICHT genau 1 aus 4
3. Choose Up to Two Ingredients: PFLICHT 1–2 aus 16
4. Any Add-ons?: 0–3 (bezahlt; "The Dusty Knuckle Focaccia" aktuell nicht im Flow → ausgeschlossen)
5. Choose a Sauce: PFLICHT genau 1 ODER "I Don't Want A Dressing" — MERGED-Liste aus 3 Saucen + Dressings + Kombi "Olive Oil + Balsamic Vinegar" (im Flow nur als Paar wählbar); Pesto/Lemon Oregano + einzelnes Olive Oil/Balsamic Vinegar nicht im Flow → ausgeschlossen
6. Choose a Crunch: PFLICHT genau 1 ODER "I Don't Want A Crunch" (7 Optionen)
7. Any Proteins?: 0–3 (bezahlt)
- **Doppelportion**: unterstrichene Items (4 Carb-Bases + 4 Mixed Salads, `doublePlate:true`) zählen in der Plate ×2 (bestätigt — Atis serviert sie doppelt). Bestellanleitung zeigt Klarnamen (1× tappen, Atis serviert doppelt); Komponenten-Aufschlüsselung + Karte zeigen **„(double portion)"** + verdoppeltes kcal. **WICHTIG (User 19.06.2026)**: NICHT als „×2" anzeigen — das las sich wie „2× auswählen" (User-Verwirrung: „Wholegrain Rice ×2" wirkte wie eine 3. Base neben einer anderen). Logik/Makros unverändert, nur Wording → „(double portion)"
- **Schalter "No sauce"** (intern `aNoSauce`): erzwingt Schritt 5 = "I Don't Want A Dressing"
- **Schalter "No crunch"** (intern `aNoCrunch`): erzwingt Schritt 6 = "I Don't Want A Crunch"
- Pool-Ausschlüsse (= aktueller Deliveroo-Flow) als `ATIS_BASE_EXCLUDE`/`ATIS_SAUCE_EXCLUDE`/`ATIS_ADDON_EXCLUDE` in index.html gepflegt; bei Flow-Änderung dort anpassen. Items bleiben im ATIS-Katalog, werden nur aus dem Pool gefiltert

## Bestellablauf The Fitness Chef (à la carte)
- Wie Itsu/Pret/Nando's/Wagamama/GDK: 1–∞ Items, Duplikate möglich, gemeinsamer Optimizer (`alaCarteCombos`, AC-Alias)
- Kategorien (4): Meat Dishes (18), Fish Dishes (9), Pasta (12), Sides (6)
- **Dishes in 3 Größen** (Weight Loss / Maintain-Lean / Weight Gain) als eigene Items (`size` wl/ml/wg, Größe im Namen) — der Optimizer wählt die zum Makroziel passende Größe automatisch (z.B. kleines Ziel → Weight Loss). Sides haben keine Größe
- **Schalter "No fish"**: filtert alle `fish:true`-Items (9 fish_dishes + Salmon-Pasta + Tuna-Pasta; Default AN). Sonst nur Kategorie-Chips + Max-Items. Ein Größen-Filter (nur wl/ml/wg zulassen) wäre über das `size`-Feld leicht nachrüstbar, falls gewünscht
- Standard-Chips: alle an

## Bestellablauf Chopstix Noodle Bar (Build-a-Box)
- Eigener BYO-Optimizer (`optimizeChopstix`, wie UG/Atis — NICHT AC-Alias). 1 Base + N Toppings, Duplikate erlaubt.
- **Box-Größen**: 2 Toppings = "Regular Box" (Komponenten in Größe Regular), 3 Toppings = "Large Box" (Größe Large). Der Optimizer rechnet BEIDE Größen und mischt die Ergebnisse (jede Karte zeigt den Box-Typ). 4-Topping/X-Large fehlt in V19 (keine X-Large-Spalte) → ausgelassen
- **Bases** (3): Vegetable Chow Mein, Egg Fried Rice, Cauli Rice — skalieren Small:Regular:Large = 1:1.25:1.5; in der Box Regular (2er) bzw. Large (3er)
- **Toppings** (10): Sweet&Sour, Caramel Drizzle, Chinese Curry, Salt&Pepper Chicken, Salt&Pepper Potatoes, Spicy Coconut Crave, Firecracker, No Beef Teriyaki, Cherry Kiss, Soy-Mazing. Pro Topping EIN Wert (Regular == Large laut V19)
- **AUSGESCHLOSSEN** (Datenprüfung + User-Entscheidung): Pumpkin Katsu (kcal 215 vs. Makros ~170, einziger flacher Wert ohne Größen), Katsu Curry Sauce (gesättigt > Fett, kaputt), Dips + Getränke, 4-Topping/X-Large-Box (keine X-Large-Daten in V19). Salt & Pepper Chicken war im ersten User-Paste falsch (Carbs/Zucker aus Sweet&Sour kopiert), in der offiziellen V19 korrekt (Carbs 14,8/9,8 g) → drin. Validierung: `node verify-chopstix.js`
- Keine Schalter; Box-Nährwerte = Base[Größe] + Summe der Topping-Werte

## Bestellablauf Pepe's Piri Piri (à la carte)
- Wie Itsu/Pret/Nando's/Wagamama/GDK/TFC: 1–∞ Items, Duplikate möglich, gemeinsamer Optimizer (`alaCarteCombos`, AC-Alias)
- Kategorien (5): Chicken (18), Burgers (7), Paneer (veg) (6), Sides (15), Sauces (5) — 51 Items (Stand 15.06.2026 gegen die Deliveroo-Karte abgeglichen)
- **Flavour-Chip** (Pflicht-Auswahl, global): einer von 6 Bastings (Lemon & Herb / Mango & Lime / Mild / Hot / Extra Hot / Extreme), Default Lemon & Herb. Wird auf ALLE `flavourMl>0`-Items angewandt (`flavour-per-10ml × flavourMl/10` additiv) — der gewählte Flavour-Name erscheint im Item-Namen ("Tender Strips - 3 (Lemon & Herb)"). Die Chips sind nur sichtbar, wenn "No flavour" AUS ist
- **Schalter "No flavour"** (Default AN): erzwingt **Plain** (0 kcal/0 Makros — im Pepe's-Menü eine echte Flavour-Wahloption) und blendet die Flavour-Chips aus; der Item-Name bekommt dann "(Plain)". Plain ist nur über diesen Schalter wählbar, nicht als eigener Chip
- **Schalter "No sauce"**: filtert alle 5 `sauce:true`-Mayo/Dips. Sonst nur Kategorie-Chips + Max-Items
- Standard-Chips: alle an

## Bestellablauf Five Guys (Build Your Own)
- Eigener BYO-Optimizer (`optimizeFiveGuys`, wie UG/Atis/Chopstix — NICHT AC-Alias). Five Guys ist komponenten-basiert → Burger werden aus Komponenten komponiert (siehe Datenquellen)
- Ein Ergebnis = **1 Main** (Burger / Sandwich) optional + **1 Fries** optional (mindestens eines von beiden) + **freie Toppings** auf dem Main
- **Mains** (13): 8 Burger (Hamburger / Cheeseburger / Bacon Burger / Bacon Cheeseburger je Regular = 2 Patties + Little = 1 Patty), 5 Sandwiches (Veggie, Cheese Veggie, Grilled Cheese, BLT, Lettuce Wrap). **Hot Dogs auf User-Wunsch entfernt**
- **Burger-Customizing** (Deliveroo): **Bun-Wahl** (Bun / Bowl = −Bun / Lettuce Wrap = −Bun + Lettuce, Pflicht, alle 8 Burger) + **Extra Patties** (0/1/2 — laut Deliveroo-Fenstern NUR bei den 4 regulären Burgern, NICHT bei den 4 „Little"-Burgern). Der Optimizer enumeriert je regulärem Burger 3 Bun × 3 Patty-Stufen, je Little-Burger 3 Bun × 1
- **Sandwich-Customizing** (Deliveroo): **paid extras** Add Extra Patty (+195) / Add Cheese (+64) / Add Bacon (+78) — der Optimizer fügt sie greedy hinzu (nur Sandwiches). Sandwiches mit bereits enthaltenen Standard-Toppings (`incl`: **Lettuce Wrap** = Tomatoes/Pickles/Grilled Onions/Green Peppers/Grilled Mushrooms; **BLT** = Lettuce/Tomatoes) bieten genau diese NICHT nochmal als freies Topping an (kein Doppelzählen). Veggie/Cheese-Veggie-Sandwich ungetaggt (Deliveroo-Fenster fehlt)
- **Fries** (10): Mini/Little/Regular/Large je Five-Guys-Style (Plain) + Cajun-Style (= Plain + Cajun Seasoning) + Loaded Fries + Loaded Cajun Fries
- **Toppings** (15, alle frei = Deliveroos Liste): Lettuce, Tomatoes, Grilled/Fresh Onions, Grilled Mushrooms, Pickles, Green/Jalapeno Peppers, Mayonnaise, Ketchup, Mustard, BBQ/Hot/HP Sauce, Relish. **Schalter „No sauce"** (Default AN) filtert die 7 Saucen (Mayo, Ketchup, Mustard, BBQ, Hot, HP, Relish — Mayo zählt als Sauce)
- **Schalter „Lettuce Wrap"** (`wrapOnly`, Default **AUS** — restriktiver „nur X"-Modus): erzwingt bei ALLEN Burgern die Lettuce-Wrap-Bun-Option (Low-Carb; im Optimizer nur noch `buns=["wrap"]` statt Bun/Bowl/Wrap). Betrifft nur Burger; Sandwiches/Fries unberührt. In „All restaurants" NICHT erzwungen
- Toppings/Extras wählt der Optimizer greedy (nur Score-verbessernde, max 6, je ≤1×) und nur auf einen Main

## Bestellablauf Pizza Express (à la carte)
- Wie Itsu/Pret/Nando's/TFC/Pepe's: 1–∞ Items, Duplikate möglich, gemeinsamer Optimizer (`alaCarteCombos`, AC-Alias)
- 9 Kategorien (156 Items nach Deliveroo-Prune): Dough Balls (14), Starters (12), Sides (7), Pizzas - Classic (40), Pizzas - Romana (40), Pizzas - Large Classic (20), Leggera & Al Forno (7, nur Pasta), Salads (8), Desserts (8)
- **Kein Build-Your-Own** (User-Entscheidung): die Deliveroo-Pizza-Customizing-Fenster (Crust/Extra-Toppings/Cheese-Wahl/Dips) sind NICHT modelliert. **Crust-Wahl = das passende Item wählen** (Gluten-Free / Vegan sind eigene Zeilen in der PDF). Extra-Toppings + Dips weggelassen (Deliveroo nur kcal, passt nicht zur PDF). Auch der „No Dips"-Schalter + Salad-Add-ons wurden bewusst NICHT gebaut (User 17.06.2026, „bei à la carte bleiben")
- **Deliveroo-Prune** (User 17.06.2026): nur bestellbare Produkte, 229→156 (Details + Regeln siehe Datenquellen-Block). Padana/Garlic Prawn/Leggera-Pizzen/Dine-Out-Dubletten/Sorbets etc. raus
- Standard-Chips: alle Kategorien an **außer Desserts** (default AUS); Max-Items 5. Keine Schalter
- Optimizer-Pool = aktive Kategorie-Chips (`optimizePizzaExpress` filtert nur nach `activeCats`)

## Bestellablauf Wasabi (à la carte)
- Wie Itsu/Pret: 1–∞ Items, Duplikate möglich, gemeinsamer Optimizer (`alaCarteCombos`, AC-Alias)
- 8 Kategorien (158 Items): Sushi (34), Salads (19), Cold Sides (4), Soup (6), Bento (54), Breakfast (10), Sides (18), Sauces & Dressings (13)
- **4 Schalter**: **„No sushi or soups & w/o sauces (good meals only)"** (`goodMeals`, **Default AN — der einzige aktive Schalter**): Pool = nur `WASABI_GOODMEAL_CATS` = **Salads & Boxes (`salads`) + Hot Bento & Kobachi (`bento`) + Sides (`sides`)** → kein Sushi/Soup/Cold Sides/Breakfast/Sauces. „Kobachi" (Beef/Chicken biang biang kobachi) liegt in `bento`. Überstimmt die Kategorie-Chips (wie die „only sushi"-Modi). Außerdem **„No soups"** (schließt Soup-Kategorie aus), **„only sushi"** (nur Sushi, überstimmt Chips), **„only sushi w/o sashimi"** (Sushi ohne „sashimi"-Items) — diese 3 **default AUS**
- Priorität in `optimizeWasabi`: `onlySushi`/`noSashimi` (Sushi-Modus) > `goodMeals` (salads/bento/sides) > Chips minus Soup (wenn `noSoup`)
- Getränke (hot beverages) sind gar nicht in den Daten. Standard-Chips: alle Kategorien an

## Bestellablauf Urban Greens (Deliveroo)
Zwei Modi (Umschalt-Buttons): **"BYO Salad"** und **"BYO Tray"** — fertige Gerichte gibt es in der App NICHT (User-Entscheidung, siehe Datenquellen).
(Getrennte Modi statt gemischter Ergebnisse: Salads dominieren Trays im Score fast immer, weil sie mehr Freiheitsgrade haben.)

BYO-**Salad**-Schritte (genau wie Deliveroo):
1. Green Base: Leafy Greens / Cabbage Mix / keine
2. Carb Base: Quinoa / Red Rice [Cold] / Sesame Glass Noodles / Spiced Grains [Warm] / keine
3. Protein: 9 Optionen (Chicken, Pulled Beef Brisket, Cajun-Spiced Tempeh, Shrimp, Hot Smoked Salmon, Honey Dijon Chicken [Warm], Pulled Chilli Brisket [Warm], Harissa Chickpeas [Warm], Avocado Whole) / keins
4. Add Extra Protein?: 0–1 (gleiche Liste OHNE Avocado Whole, `noExtra`-Flag)
5. Choose 3 Veg or Pickles: GENAU 3 aus 14
6. Any Extra Veg or Pickles?: beliebig — Pool = Leafy Greens + die 14 Veg OHNE Cucumber (`noExtra`-Flag, so auf Deliveroo). **Schalter "Max 1× ..."** (intern `capPickles`, Default AN): cappt **Tajin Sweetcorn / Pickled Onions / Pickled Cabbage** auf je max. 1× pro Bestellung (Triple-Veg + Extras zusammen) — sonst kann der Optimizer sie bis 3× stapeln (Triple 1× + Extra-Paar [X,X]). Nur diese 3 Items gecappt; andere Veg-Duplikate (z.B. Edamame) bleiben erlaubt. Greift in `addExtras` (Triples sind i<j<k, also dort dup-frei)
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
- **Ham** (Schweineschinken-Protein, id `ham`) — komplett aus Proteins entfernt (User 19.06.2026: gibt es bei Deliveroo nicht). NICHT zu verwechseln mit **„Turkey Ham"** (Extra, bleibt drin)
- **Breaded Chicken** (Protein `breaded_chicken` + Extra `breaded_chicken_extra`) — entfernt (User 19.06.2026): fehlt komplett in der Nährwert-PDF „UKI June 2026" (weder Komponente noch fertiger Sub) → offenbar vom Menü
- **Falafel** (Protein „Falafel Bites" `falafel` + Extra „Smashed Falafel" `smashed_falafel`) — entfernt (User 19.06.2026): fehlt ebenfalls komplett in der June-2026-PDF → offenbar vom Menü
- **Pepperoni & Salami als Einzel-Protein** (`pepperoni_main`/`salami_main`) — entfernt (User 20.06.2026): auf Deliveroos Build-Your-Own gibt es sie nicht als eigenständigen Sub, nur in den Combos. Stattdessen `spicy_italian` (Salami+Pepperoni) + `classic_bmt` (Pepperoni+Salami+Turkey Ham) als Proteine. Pepperoni/Salami bleiben als **Extra** (`pepperoni_extra`/`salami_extra`)
- **Lincolnshire Sausage** (`lincolnshire_sausage`) — entfernt (User 20.06.2026): steht nicht in Deliveroos Build-Your-Own-Protein-Liste
- **Geschätzte Werte** — keine Items mit unverifizierten Nährwerten:
  - HP Brown Sauce (nicht im PDF)
  - Yogurt Mint & Garlic Sauce (nicht im PDF)
  - Shawarma Spiced Chicken (nicht im PDF)

## Schalter-Defaults: ALLE Exclude-Schalter starten AN (User-Wunsch 12.06.2026)
Alle Filter-/Exclude-Checkboxen sind beim App-Start **aktiviert**, damit der User sie nicht jedes Mal neu anschalten muss: Subway "Keine Sauce"+"No Roast Chicken Breast" ("No cheese" startet AUS — User 20.06.2026, Käse standardmäßig erlaubt), Farmer J "Nur Gratis-Items", Itsu "No soups, desserts, snacks etc.", Pret "only relevant items, no bullshit", Nando's "No desserts/Lunch Fix/platters"+"No sauces"+"No grilled pineapple"+"No wings / chicken livers"+"No Corn on the Cob", Wagamama "No Ramen", GDK "No Sauce"+"No rice bowl", Urban Greens 'No "2 Toppings" / Nuts etc.'+"No Dressing"+"Max 1× Tajin/Pickled Onions/Pickled Cabbage", Atis "No sauce"+"No crunch", The Fitness Chef "No fish", Pepe's "No sauce"+"No flavour", Five Guys "No sauce", Wasabi "No sushi or soups & w/o sauces (good meals only)" (der einzige aktive Wasabi-Schalter; "No soups" startet hier AUS, weil "good meals only" Soup ohnehin ausschließt). Pizza Express hat keine Schalter, aber die Desserts-Kategorie startet AUS.
Auch Pret "Salads and protein pots only" startet AN (User-Wunsch 12.06.2026 — Pret defaultet damit auf nur Salads & protein pots, was "only relevant items" überstimmt). Beim Hinzufügen neuer Schalter: per Default AN.
**Ausnahme**: Der **restaurantsübergreifende** Schalter „**Top up carbs with corn cakes**" (`cornCakes`, unter Fibre/Salt) startet **AUS** (User 30.06.2026 — opt-in). Sein verschachtelter Cap „Max % of carbs from corn cakes" (`cornCap`) startet auf **No limit** (0). Siehe Abschnitt „Corn Cakes".
**Ausnahme — enge "only X"-Spezialmodi starten AUS**: Itsu "only sushi" + "only sushi w/o sashimi", Wasabi "only sushi" + "only sushi w/o sashimi" (würden sonst auf nur Sushi reduzieren), Five Guys "Lettuce Wrap" (erzwingt sonst bei allen Burgern den Lettuce-Wrap), Subway "only Subs (no sides)" (würde sonst die gerade erst hinzugefügten Sides verstecken) und Nando's "Main + two sides" (würde sonst alles auf 1 Main + 2 Sides reduzieren). Solche Positiv-/Restriktiv-Modi (nicht Exclude-Filter) default AUS.
**Max-Items-Default ist 5** (alle à-la-carte-Restaurants), nicht 3.

## Standard-Defaults (beim App-Start)
- **Restaurant**: Subway
- **Größe**: Footlong (User-Wunsch 12.06.2026; 6 Inch wählbar)
- **Brot**: Wholegrain vorausgewählt — **Mehrfachauswahl** möglich (mehrere erlaubte Brote angeben, Optimizer wählt je Ergebnis das beste; „All breads" = alle erlaubt)
- **Käse**: Käse erlaubt — Checkboxen „No cheese" + „Cheese (always add one)" beide **default AUS** (Optimizer wählt frei); die beiden schließen sich gegenseitig aus
- **Sauce**: Keine Sauce (Checkbox aktiv)
- **No Roast Chicken Breast**: AN (Exclude-Schalter, Default AN per Konvention — schließt das `roast_chicken`-Protein aus; gilt auch in All/Accurate)
- **Sides**: „only Subs (no sides)" **AUS** (Sides werden berücksichtigt; „only X"-Modus, daher default aus)
- **Salad**: Standard-Salad automatisch vorausgewählt bei Ergebnis-Auswahl
- **Standard-Salad**: Lettuce, Tomatoes, Cucumber, Pickles, Peppers, Red Onions (alles AUSSER Jalapeños, Sweetcorn, Olives)
- **Makro-Präferenzen** (Kalorien-Modus): High Protein + Low Fat vorausgewählt
- **Farmer J**: "Nur Gratis-Items" aktiv (keine bezahlten Toppings/Saucen in Vorschlägen)
- **Itsu**: nur Food-Kategorien aktiv, max. 5 Items pro Bestellung, Schalter "No soups, desserts, snacks etc." AN, Getränke immer ignoriert
- **Pret**: 8 Food-Kategorien aktiv, max. 5 Items, "only relevant items" AN + "Salads and protein pots only" AN (= nur Salads/Protein Pots), Getränke immer ignoriert
- **Nando's**: alle Kategorien aktiv außer Nandinos (Kids), max. 5 Items, die 5 Exclude-Schalter AN (No desserts/Lunch Fix/platters, No sauces, No grilled pineapple, No wings/chicken livers, No Corn on the Cob), „Main + two sides" AUS (restriktiver Modus); Drinks nicht in den Daten
- **Wagamama**: alle Kategorien aktiv, max. 5 Items, "No Ramen" AN
- **GDK**: alle Kategorien aktiv außer Juniors (Kids), max. 5 Items, "No Sauce" + "No rice bowl" AN
- **Urban Greens**: Modus "BYO Salad", 'No "2 Toppings" / Nuts etc.' + "No Dressing" + "Max 1× Tajin/Pickled Onions/Pickled Cabbage" AN
- **Atis**: Modus Power Plate (einziger implementierter Modus), "No sauce" + "No crunch" AN
- **The Fitness Chef**: alle Kategorien aktiv, max. 5 Items, "No fish" AN; die Größe (Weight Loss/Maintain-Lean/Weight Gain) wählt der Optimizer automatisch
- **Pepe's**: alle Kategorien aktiv, max. 5 Items, "No sauce" + "No flavour" AN (No flavour = Plain, 0 Makros; die Flavour-Chips erscheinen + wirken erst, wenn "No flavour" aus ist — Default-Chip dann Lemon & Herb)
- **Five Guys**: Build Your Own, „No sauce" AN, „Lettuce Wrap" AUS — der Optimizer wählt 1 Main (Burger/Sandwich) + Bun-Wahl + Extra Patties (Burger) + optional 1 Fries + freie Toppings (+ paid extras bei Sandwiches) automatisch
- **Pizza Express**: alle Kategorien aktiv **außer Desserts** (User-Wunsch: Desserts default AUS, in `pizzaexpress-update.js` `DEFAULT_OFF`), max. 5 Items; à la carte (keine Schalter); volle PDF-Makros. Dips & Drinks sind gar nicht im Modell
- **Wasabi**: alle Kategorien aktiv, max. 5 Items, **„No sushi or soups & w/o sauces (good meals only)" AN (einziger aktiver Schalter)**, „No soups" + „only sushi" + „only sushi w/o sashimi" AUS; Getränke nicht in den Daten
- **Leon**: alle 8 Kategorien aktiv (inkl. „Kids' All Day" — default AN, User-Wunsch), max. 5 Items; à la carte (keine Schalter); volle 8 Makros. Auf Deliveroo-Karte geprunt; Sauces/Drinks nicht im Modell

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
4. Restaurant-Tabs (**➕ Add own order** / **Accurate restaurants** / **All restaurants** / Subway / Farmer J / Itsu / Pret / Nando's / Urban Greens / Wagamama / GDK / Atis / Fitness Chef / Chopstix / Pepe's / Five Guys / Pizza Express / Wasabi / Leon)
5. Restaurant-spezifisch: Größe + Brot + Käse/Sauce-Checkboxen (Subway), "Nur Gratis-Items" (Farmer J), Kategorien + Max-Items + Schalter (Itsu, Pret, Nando's, Wagamama, GDK), Kategorien + Max-Items + "No fish" (The Fitness Chef), 2 Modus-Buttons (BYO Salad / BYO Tray) + 'No "2 Toppings" / Nuts etc.'/"No Dressing"/"Max 1× Tajin/Pickled Onions/Pickled Cabbage" (Urban Greens), "No sauce" + "No crunch" (Atis, Power Plate)
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

## Screenshot-Import (OCR) — Ziele aus einem Makro-Tracker übernehmen
Button **"Import from screenshot"** (unter den Modus-Tabs, in beiden Modi sichtbar): User lädt einen Screenshot seiner Tracker-App (z.B. YAZIO) hoch → client-seitige OCR liest die **"Übersicht"** und trägt automatisch ein:
- **Verbleibende Makros** = Total − Gegessen je Balken → Carbs/Protein/Fat-Felder (Beispiel: 341−54=287, 184−52=132, 69−9=60)
- **Verbleibende Kalorien** = der angezeigte **"Übrig"**-Wert → Kalorienfeld (Beispiel: 2267; NICHT berechnet, der echte Anzeigewert)
- Alles UNTER der Übersicht (Frühstück/Mittagessen … in kcal) wird IGNORIERT — Makro-Balken enden auf "g", Meal-Rows auf "kcal"
- **OCR**: Tesseract.js v5 via CDN (`tesseract.js@5.1.1`, `<script defer>`), Sprache "deu", on-device (kein Backend/API-Key). Erster Lauf lädt das Modell (~6 MB, danach IndexedDB-Cache → offline nutzbar). Bild wird vor der OCR aufbereitet: große Screenshots runter (≤2600px, iOS-Speicher), **kleine hoch (~2400px)** — die Makro-Balken-Schrift ist winzig, größere Glyphen = deutlich bessere OCR. `data.text` wird zeilenweise geparst (keine Bounding-Boxes nötig)
- **`parseMacroScreenshot(text)`** — rein, in index.html, von tests.js mit 17 Fällen + 3 Negativfällen abgesichert. Makro-Paare (C/P/F = erste 3 in Lesereihenfolge, remaining = M−N, clamp ≥0):
  - **Pass A**: "N <sep> M <unit>" (sep = `/ | I l ) ]`, \s matcht \n) → nimmt die ersten 3 Paare, deren Unit NICHT kcal/kj/kg ist. **Robust gegen fehlendes/verlesenes "g"** (frühere Version verlangte striktes Trailing-"g" und scheiterte am echten Screenshot); Meal-Rows (kcal) + Gewicht (kg) werden über die Unit ausgeschlossen
  - **Pass B** (Fallback, falls der Slash ganz verschluckt wurde): "N <leerraum> M g" — durch das "g" verankert
  - **"g→9"-Korrektur** (echter Fehler von Theodors YAZIO-Screenshot): die OCR liest das Einheiten-"g" als "9" und hängt es ans Total ("341 g"→"3419") → aufgeblähte Restmakros (3365/1797 statt 287/132). Wenn ein angezeigter Übrig-Wert vorliegt UND die Rest-kcal >6000 sind, wird jedes Total mit/ohne Trailing-9 durchprobiert und die Kombi genommen, deren Rest-kcal dem Übrig am nächsten liegt. Greift NUR bei aufgeblähten Werten → saubere/Ring-Split-Fälle unberührt
  - **Plausibilitäts-Stopp**: wenn die Rest-Makros trotzdem absurd zum Übrig passen (>×3+1500) → `null` (kein Müll-Import, Diagnose-Text wird gezeigt)
  - **Fett-Angleichung** (User-Wunsch): ergeben die Rest-Makros zusammen MEHR kcal als "Übrig" (Rundung/Ballaststoffe/App-Inkonsistenz), wird Fett so weit gesenkt (≥0), dass `4·C + 4·P + 9·F = Übrig` aufgeht (Fett = `(Übrig − 4·C − 4·P)/9`, 1 Dezimale). Greift nur bei echtem Übrig-Wert und nur wenn die Makro-kcal das Übrig übersteigen — sonst bleiben die Werte unverändert
  - "Übrig"-kcal über Positionslogik (Top-Zahlen Gegessen/Übrig/Verbrannt → Index 1) PLUS **Sicherheitsnetz**: zerfällt der Ring (533/2.267/0) in getrennte OCR-Zeilen → nimm die Top-Zahl, die dem berechneten Rest (C·4+P·4+F·9) am nächsten liegt. Fallback wenn Übrig unlesbar: berechneter Rest, `kcalComputed:true`
  - **Ring auf EINER Zeile** (neueres App-Layout, „1.688 Gegessen 1.112 Übrig 0 Verbrannt"): die „Übrig"-Zeile darf NICHT per `Math.max` ausgewertet werden (das greift „Gegessen" 1688 statt „Übrig" 1112) — stattdessen die Zahl der Zeile nehmen, die dem Makro-Rest am nächsten liegt (Übrig ist makro-konsistent). Nur bei kaputtem Rest (g→9-Fall, >6000) Fallback auf `Math.max`. Gefixt 19.06.2026 (User-Report), 2 Tests `ring_one_line_*`/`ring_separate_lines_*`
- Toleriert OCR-Rauschen: Slash als `| I l ) ]` (oder ganz fehlend → Pass B), "Übrig"→"Ubrig/Obrig/brig", fehlende "0", Tausenderpunkt (2.267→2267), Paar über Zeilenumbruch, fehlendes "g"
- Ergebnis landet in den normalen (editierbaren) Ziel-Feldern + kurze Import-Zusammenfassung. **Bei Fehlschlag** zeigt die Meldung den erkannten OCR-Text (Diagnose) und `console.log("[OCR text]…")`. Browser-Wrapper `ocrMacroScreenshot(file)` (→ `{text, parsed}`) + `downscaleImage` ebenfalls in index.html (nur `parseMacroScreenshot` ist getestet, da rein)

## Optimizer-Algorithmen
### Subway (`optimize`)
1. Enumeriert alle Kombinationen: Bread × Protein × Cheese (gefiltert nach Locks/Ausschlüssen)
2. Basis inkludiert immer Standard-Salad
3. Probiert 0-2 Extras (gefiltert auf Score-Verbesserung)
4. Probiert 0-1 Sauces (wenn Sauce erlaubt und Base-Score < 3)
5. Scoring: gewichtete Abweichung von Ziel-Makros
6. Sortiert nach Score; dann (außer `noSides`) die besten 40 Subs um 0–1 Side erweitert (Side ×1, nicht footlong-verdoppelt; nur wenn Score-verbessernd), neu sortiert. Top 20 zurück, zeigt Top 8 an
7. `optimize(t,mode,p,noSauce,noCheese,breadsOk,sz,noSides,noRoastChicken,forceCheese)` — `noSides` = Schalter „only Subs"; `noRoastChicken` = Schalter „No Roast Chicken Breast" (filtert das `roast_chicken`-Protein); `forceCheese` = Schalter „Cheese" (Käse-Pool nur american/mozzarella_cheddar, kein „none"). Käse-Logik: noCheese → none; sonst forceCheese → die 2 Käse; sonst alle. „No cheese" + „Cheese" schließen sich im UI gegenseitig aus. **`breadsOk`** = Brot-Auswahl: `null`/leeres Objekt = alle Brote, `{id:true,…}` = nur diese erlaubten Brote (Optimizer wählt je Ergebnis das beste daraus), String = genau ein Brot (Legacy). In „All/Accurate" wird `null` (alle Brote) übergeben + `noRoastChicken=true`

### Farmer J (`optimizeFJ`)
1. Enumeriert Main × Base × (0–2 Sides aus allen 9)
2. Wenn "Nur Gratis-Items" aus: probiert je 1 Topping bzw. 1 Sauce/Dip/Topping (Score-Verbesserung nötig)
3. Set Fieldtrays/Fieldbowls/Solo-Salate laufen als Einzel-Kandidaten mit
4. Gleiche Score-Funktion, Top 20/Top 8 wie Subway

### À la carte: Itsu (`optimizeItsu`), Pret (`optimizePret`), Nando's (`optimizeNandos`), Wagamama (`optimizeWaga`), GDK (`optimizeGDK`), The Fitness Chef (`optimizeTFC`), Pepe's (`optimizePepes`), Pizza Express (`optimizePizzaExpress`), Wasabi (`optimizeWasabi`) und Leon (`optimizeLeon`)
Alle nutzen den gemeinsamen Kern `alaCarteCombos`:
1. Enumeriert alle Singles und Paare (Duplikate erlaubt, i<=j)
2. Triples per Beam-Suche: nur Erweiterungen der besten 80 Paare (dedupliziert) — bleibt auch mit großem Pool flott
3. **Max-Items-Chips: 1 / 2 / 3 / 5 / ∞** (Default 3). Ab Stufe 4 erweitert eine Beam-Suche die besten 80 Kombos so lange um je 1 Item, wie sich der Score verbessert (über dem Ziel stirbt die Suche natürlich aus) — bis zum gewählten Limit bzw. bei ∞ bis zum harten Sicherheitslimit von 12 Items. Größter Pool (Nando's, Tagesziel, ∞): ~260ms
4. Gleiche Score-Funktion, Top 20/Top 8

Pool-Bildung:
- **Itsu**: "only sushi"/"w/o sashimi" → nur sushi_poke (ggf. ohne Sashimi), überstimmt alles; sonst aktive Chips MINUS Getränke (immer) MINUS soups/noodles/desserts (Schalter, `ITSU_LIGHT_CATS`)
- **Pret**: Getränke immer raus; dann Vorrang: "Salads and protein pots only" > "only relevant items, no bullshit" (rel-Whitelist) > Chips
- **Nando's**: bei „Main + two sides" → eigener Zweig `nandosMainTwoSides` (1 Main aus PERi-PERi Chicken/Burgers,Pittas,Wraps × 2 Sides ausser Rostinas, Wings je nach „No wings"), überstimmt alles. Sonst: aktive Chips MINUS Desserts/Lunch Fix/Sharing Platters (`NANDOS_SWITCH_CATS`) MINUS Saucen (`sauce:true`) MINUS Grilled Pineapple MINUS Wings/Livers (`wings:true`) MINUS Corn (`corn:true`) — je nach Schalter; Drinks sind nicht in den Daten
- **Wagamama**: aktive Chips MINUS ramen-Kategorie (Schalter "No Ramen")
- **GDK**: aktive Chips MINUS sauce:true-Items (Schalter "No Sauce") MINUS rice_bowls (Schalter "No rice bowl")
- **TFC**: aktive Kategorie-Chips MINUS `fish:true`-Items (Schalter "No fish"). Dishes liegen in 3 Größen als eigene Items → der Optimizer wählt die passende Größe automatisch
- **Pepe's**: aktive Kategorie-Chips MINUS `sauce:true`-Items (Schalter "No sauce"). VOR `alaCarteCombos` wird der effektive Flavour (bei "No flavour" → Plain, sonst der gewählte) in jedes `flavourMl>0`-Item eingerechnet (Makros + Name) → der Optimizer sieht fertige, geflavourte Items; mit Plain (0 Makros) behalten sie ihre Basiswerte
- **Pizza Express**: aktive Kategorie-Chips (kein Filter-Schalter). 156 Items (Deliveroo-geprunt), volle 8 Makros aus der PDF
- **Wasabi**: `goodMeals` (Default) → nur `WASABI_GOODMEAL_CATS` (salads/bento/sides); sonst `onlySushi`/`noSashimi` → nur Sushi; sonst aktive Chips MINUS Soup (Schalter „No soups"). Priorität: onlySushi/noSashimi > goodMeals > Chips

UI-Rendering: Itsu, Pret, Nando's, Wagamama, GDK, The Fitness Chef & Pepe's teilen sich Ergebnis-Karten und Detail-Panel über den `AC`-Alias in App()

### Urban Greens (`optimizeUG`)
- Modus "pre": 18 fertige Trays/Salads als Einzel-Kandidaten (wie FJ-Sets)
- Modus "salad"/"tray": Beam-Suche über den jeweiligen Deliveroo-Flow — Stufen: Backbone×alle 364 Veg-Triples → (Tray: ×9 Pflicht-Scoops) → ×36 Topping-Paare → (Salad: ×7 Dressings +ohne) → optional Extra-Protein → optional bis 2 Extras (Extra-Veg/Scoops/Toppings/Extra-Dressings); nach jeder Stufe bleiben die besten ~400–800 (heuristisch, nicht garantiert optimal)
- Performance: läuft komplett auf vorberechneten kcal/P/F/C-Summen statt sumN (~40–80ms); `resultsUG`-Memo rechnet nur wenn der UG-Tab aktiv ist
- UG nutzt NICHT den AC-Alias (eigene Result-Form mit kind/green/carb/prot/veg/scoop/tops/dress/extras) — eigene Karte + eigenes Panel

### Atis (`optimizeAtis`)
- Eigener BYO-Optimizer (wie UG, NICHT AC-Alias). Signatur: `optimizeAtis(t, mode, p, atisMode, noCrunch, noSauce)`
- Aktuell nur `atisMode "plate"` (Power Plate); `"bowl"` → `[]` (Flow ausstehend)
- Beam-Suche: Backbone (Bases 1–2 × Mixed 1 × Ingredients 1–2; beste 2000) → Proteins 0–2 voll-enumeriert (beste 800) → Sauce 0/1 (beste 600, außer `noSauce`) → Crunch 0/1 (beste 500, außer `noCrunch`) → Extras-Stufe (Add-ons + 3. Protein, nur bei Score-Verbesserung)
- Voll auf vorberechneten 8-Makro-Summen (`eff`: doublePlate-Items ×2 in der Plate); `resultsAtis`-Memo rechnet nur bei aktivem Atis-Tab
- Eigene Result-Form (`kind/bases/mixed/ing/prots/sauce/crunch/addons`) → eigene Karte + eigenes Panel

### Chopstix Noodle Bar (`optimizeChopstix`)
- Eigener BYO-Box-Optimizer (wie UG/Atis). Voll-Enumeration: 3 Bases × [55 Topping-Paare (Regular Box) + 220 Topping-Triples (Large Box)] = 825 Kombos, Duplikate erlaubt
- Box = Base[`reg`|`lg`] + Summe der Topping-Werte. 2 Toppings → Regular Box (base.reg), 3 → Large Box (base.lg); beide Größen gemischt + nach Score sortiert (Top 20). `resultsChopstix`-Memo nur bei aktivem Chopstix-Tab
- Eigene Result-Form (`kind/box/nTop/base/tops`) → eigene Karte + eigenes Panel

### Five Guys (`optimizeFiveGuys`)
- Eigener BYO-Optimizer (wie UG/Atis/Chopstix, NICHT AC-Alias). Signatur `optimizeFiveGuys(t, mode, p, noSauce, wrapOnly)` (`wrapOnly` = Schalter „Lettuce Wrap"). Five Guys ist komponenten-basiert → der FIVEGUYS-Block hat **komponierte** Mains (`mains[]`: 8 Burger + 5 Sandwiches mit `group`; Hot Dogs entfernt), `fries[]`, `toppings[]` (15 freie, `sauce:true` auf 7) und `mods` (patty/cheese/bacon/bun/lettuce)
- Konfigurierte Mains zur Laufzeit: Burger × **Bun-Wahl** (Bun / Bowl = −Bun / Lettuce Wrap = −Bun+Lettuce) × **Extra Patties** (regulär 0/1/2, Little 0) = 48 Burger-Varianten (4 regulär ×3×3 + 4 Little ×3×1); Sandwiches einfach; + „Fries only". Bun-Abzug/Patties via `mods` (sumN summiert auch negative Beiträge). „No sauce" filtert `sauce:true`-Toppings (inkl. Mayo)
- Greedy-Schritt pro (Main × Fries): freie Toppings + (bei Sandwiches) paid extras (Patty/Cheese/Bacon), nur Score-verbessernd, max 6, je ≤1×. Toppings, die im Sandwich-Listenwert schon enthalten sind (Main-Feld `incl`, Topping-IDs), werden für diesen Main aus dem Pool gefiltert → kein Doppelzählen
- Ein Ergebnis = 0/1 Main × 0/1 Fries (mind. eines) + freie Toppings auf dem Main (greedy: bestes Score-verbesserndes Topping bis keine Verbesserung, max 6, jedes ≤1×). Voll-Enumeration der ~198 Main×Fries-Kombos + Topping-Greedy, Top 20
- Eigene Result-Form (`kind/main/fries/tops`) → eigene Karte + eigenes Panel. `resultsFiveGuys`-Memo nur bei aktivem Five-Guys-Tab. Volle 8 Makros. Keine Schalter (v1)

### „All restaurants" + „Accurate restaurants" (`optimizeAll`)
- `optimizeAll(t, mode, p, subSize, only, acMaxN)` — `only` = optionale Restaurant-Whitelist (Array von `_resto`-Keys). Ohne `only` = **All restaurants** (alle 16); mit `only = ACCURATE_RESTOS` = **Accurate restaurants** (`["subway","farmerj","itsu","pret","nandos","ug","wagamama","atis","tfc","pepes","pizzaexpress","wasabi"]` — ohne GDK/Chopstix/Five Guys, da Komposition/Anomalien; Leon (noch) nicht drin; Nando's/Pizza Express/Wasabi drin, da Live-Order-API bzw. offizielle PDFs mit vollen Makros). Pro Restaurant ein `if(ok(rt))`-Guard
- **`acMaxN`** (Default 5) = max items pro à-la-carte-Bestellung im Cross-Restaurant-Mix, steuerbar über den **„Max. items per order"-Chip (1/2/3/5/∞)** auf dem All-/Accurate-Tab (State `maxAll`, Default 5). Gilt für die AC-Restaurants (Itsu/Pret/Nando's/Wagamama/GDK/TFC/Pepe's/Pizza Express/Wasabi/Leon); Subway/FJ/UG/Atis/Chopstix/Five Guys bauen unabhängig EINE komponierte Bestellung
- Zwei Tabs ganz vorne: `"accurate"` (links) + `"all"`; beide teilen die Cross-Restaurant-Karte/`selectAcross`. `resultsAccurate`-Memo rechnet nur im `"accurate"`-Tab
- Ruft JEDEN (erlaubten) Restaurant-Optimizer mit ALLEN Exclude-Schaltern AN auf (Itsu only-sushi/w-o-sashimi AUS — User-Vorgabe), Default-Kategorien, à-la-carte max 5, Subway-Brot frei + aktuelle Größe, UG beide Modi (salad+tray) + capPickles, Atis Power Plate, TFC No fish, Chopstix Build-a-Box (2+3 Toppings), Pepe's No sauce + No flavour (Plain), Five Guys Build Your Own (Main + Bun-Wahl + Extra Patties + Fries + Toppings, No sauce), Wasabi „good meals only" (Salads&Boxes/Bento/Kobachi/Sides)
- Jedes Ergebnis bekommt `_resto`; gemerged, nach Score sortiert, **max. 1 Treffer pro Restaurant** (User-Wunsch 15.06.2026 — nur die jeweils beste Bestellung je Restaurant), Top 20 → Top 8 angezeigt
- Karte zeigt Restaurant-Badge + Order-Zusammenfassung (`summarizeAcross`, dispatch nach `_resto`) + Makros. **Klick → `selectAcross`**: wechselt zum jeweiligen Restaurant-Tab + setzt dessen Selektion → das bestehende, restaurant-spezifische Detail-Panel + Bestellanleitung öffnet sich (verifiziert für UG/AC/Subway)
- Läuft nur wenn der „all"-Tab aktiv ist (`resultsAll`-Memo). Im „all"-Modus werden keine restaurant-spezifischen Config-Blöcke gezeigt

## „Add own order" — restaurantsübergreifende Suche + eigener Tracker (`resto==="search"`)
Eigener Tab **„➕ Add own order"** (ganz links in der Tab-Zeile) zum **nachträglichen Tracken** eines spontan gekauften Gerichts — KEIN Optimizer, sondern Suche + manueller Warenkorb.
- **`SEARCH_INDEX`** (Modul-Level, `buildSearchIndex()`): flache, durchsuchbare Liste ALLER Food-Items/Komponenten mit echten 8 Makros aus allen 15 Restaurants (~1100 Einträge nach Dedup). Sammelt `.items` der AC-Restaurants + alle Komponenten-Arrays von Subway/FJ/UG/Atis/Five Guys + Chopstix-Toppings + Chopstix-Bases (zu „… (Regular)"/„… (Large)" expandiert). **Bewusst ausgelassen**: Pepe's `flavours` (per-10 ml), Five-Guys-`mods` (Bun/Patty-Deltas, teils negativ), Atis `basesL`/`saucesL` (ungenutzte Large-Dubletten). Dedup per `resto|name|kcal`. Jeder Eintrag: `{resto (Anzeigename), name, kcal, fat, sat, carbs, sugars, fibre, protein, salt}`
- **`searchItems(query, limit=60)`** (rein, getestet): Substring-Suche, alle Leerzeichen-getrennten Begriffe müssen in `name + resto` vorkommen (Mehrwort-AND, z.B. „wasabi katsu"), Treffer nach kürzestem Namen sortiert (= bester Match zuerst)
- **`orderTotal(entries)`** (rein, getestet): summiert `item × qty` über `[{item, qty}]` → 8 Makros, 1 Dezimale (wie `sumN`)
- **State in App**: `searchQ`, `myOrder` (`[{item, qty}]`), `moResults` (Memo aus searchItems), `moTotal` (Memo aus orderTotal). **`myOrder` ist in `localStorage` (`mo_own_order`) persistiert** (via `useEffect`) → überlebt App-Neustart. Handler: `addToOrder` (gleiches `resto|name|kcal` → qty++), `changeQty(i,±1)` (min 1), `removeFromOrder(i)`, `clearOrder`
- **UI** (gerendert wenn `resto==="search"`, statt Optimizer-Ergebnisliste): Suchfeld → Trefferliste (Restaurant-Badge + Makros + „+ Add") → „My order"-Warenkorb (Items mit −/+/✕-Steppern) → „Order total"-Karte mit `MacroBar`s gegen die aktuellen Ziele (wie das Detail-Panel). Die Ziel-Eingabekarte oben bleibt sichtbar (Vergleich gegen Tagesrest). Header-Gradient Slate (#475569→#1e293b), Label „ADD OWN ORDER · TRACK"
- **Wichtig**: `AC` ist für `resto==="search"` `null` → Ergebnisliste + „Top results"-Header sind mit `resto!=="search" &&` geguardet (sonst `AC.res`-Crash). Neue restaurant-spezifische Render-Blöcke ebenfalls so guarden

## Corn Cakes — restaurantsübergreifender Carb-Füller (Schalter „Top up carbs with corn cakes")
„**Kallo Lightly salted low fat corn cakes**" (Reiswaffel-artig, fast reine Carb-Quelle) können als ganzzahliger Zusatz zu JEDER Restaurant-Bestellung berücksichtigt werden, um offene Carbs zu füllen. Globaler Schalter direkt unter Fibre/Salt (immer sichtbar, restaurant-unabhängig), **Default AUS** (User 30.06.2026 — opt-in; selbstbegrenzend → 0 Stück, wenn Cakes den Score nicht verbessern).
- **Nährwerte**: per 100 g = 386 kcal / Fat 1.2 / sat 0.3 / Carbs 86.0 / sugars 0.3 / Protein 6.9 / Salt 0.2, **keine Ballaststoffe**. **1 Stück = 7.28 g** → per-Stück = per-100g × 0.0728 = **`CORN_CAKE`** `{name:"Kallo …", kcal:28.1, fat:0.09, sat:0.02, carbs:6.26, sugars:0.02, fibre:0, protein:0.5, salt:0.01}` (Modul-Level)
- **Cap „Max % of carbs from corn cakes"** (`cornCap`, **Default 0 = No limit**, nur sichtbar wenn Schalter AN + Makro-Modus): begrenzt, wie viel Prozent des **Carb-Ziels** durch Cakes abgedeckt werden dürfen — verhindert „Mini-Restaurant-Bestellung + fast nur Cakes". UI: Chips **No limit / 20% / 30% / 40% / 50%** + freies %-Eingabefeld (beliebige Zahl). **`cornCapCount(t,capPct)`** = `Math.floor(capPct/100 × t.carbs / CORN_CAKE.carbs)` (harte Obergrenze: nie über capPct, „nächstmögliche" = nächstkleinere ganze Stückzahl ≤ capPct); 0/≥100 = kein Cap. Eine Live-Feedback-Zeile zeigt „≈ at most N cakes (Xg) … at or below capPct% of your Yg carb target"
- **`bestCornCakes(n,t,mode,p,capPct)`** (Modul-Level, getestet): scannt 0..`min(CORN_CAKE_MAX=40, cornCapCount(t,capPct))` und gibt die ganzzahlige Stückzahl zurück, die `score` gegen das Ziel **minimiert**. **NUR im Makro-Modus mit Carb-Ziel** (`mode!=="macros"||!(t.carbs>0)` → 0): Corn Cakes füllen einen CARB-Gap, den es nur im Makro-Modus gibt. **Im Kalorien-Modus immer 0** — sonst würden sie den ganzen kcal-Gap mit reiner Carb-Quelle füllen und bis zum 40er-Cap eskalieren (Review-Fix). Über-Ziel-Carbs → 0; offene Carbs → füllt bis ans Ziel (begrenzt durch den Cap)
- **`withCornCake(r,on,t,mode,p,capPct)`** / **`applyCornCakes(arr,on,t,mode,p,capPct)`**: augmentiert ein Ergebnis um die optimale Stückzahl — neue `nutrition` (inkl. Cakes, für Karten + Ranking), `.corn` (Stückzahl), `._base` (corn-freie nutrition für Live-Recompute) + neuer `score`. `applyCornCakes(on)` **re-sortiert nach dem corn-inklusiven `score`** (sonst zeigt die Default-„Score"-Sortierung die PRE-corn-Optimizer-Reihenfolge; die Top-20-Begrenzung der Optimizer bleibt). `on=false` → Array/Objekt **unverändert** (Identität bleibt)
- **EIN Choke-Point**: `activeResults`-Memo wrappt die aktive Ergebnisliste (`activeRaw`) einmal mit `applyCornCakes(…,cornCap)` → ALLE Karten (alle Restaurants inkl. All/Accurate) zeigen automatisch die kombinierten Makros + ein **Karten-Badge** „+N× corn cakes" (`cornLbl(r)`); Ranking/Sortierung berücksichtigt die Cakes. Memoisiert → stabile Objekt-Identität (Selektion-Markierung `sel===r` bleibt heil). Der Schalter ist im „Add own order"-Tracker (`resto==="search"`) **ausgeblendet** (`resto!=="search"&&`, dort kein Optimizer → wirkungslos)
- **Detail-Panels rechnen LIVE**: Helper **`cornTot(base)`** (Component-Scope) berechnet die Stückzahl live aus `cornCakes`-Schalter + aktuellem `targets` + `cornCap` → reagiert sofort auf Ziel-/Cap-Änderung/Toggle (kein Stale-Panel). Pro Panel ein `cc*`-Konstrukt (`ccSub`/`ccFJ`/`ccAC`/`ccUG`/`ccAt`/`ccCh`/`ccFG`); `base` = corn-freie nutrition (`selTotal`/`selFTotal` sind corn-frei; sonst `sel._base||sel.nutrition`). Alle MacroBars nutzen `cc*.total`, die Order-Guides bekommen via **`cornStep(cc)`** einen Schritt „Supplement: N× …", die Komponenten-Breakdowns eine Corn-Zeile
- **Gilt für ALLE 16 Restaurants + All/Accurate** (im Cross-Restaurant-Mix werden die Cakes nach dem per-Restaurant-Best-Pick auf die Anzeige augmentiert; `selectAcross` reicht das augmentierte Objekt inkl. `._base`/`.corn` an das jeweilige Panel weiter). Der „Add own order"-Tracker (`resto==="search"`) ist NICHT betroffen (kein Optimizer → `activeRaw=[]`)
- Tests in `tests.js` (21 Checks): Kallo-Name, per-Stück-Makros, offene Carbs → >0, über-Ziel/ohne-Ziel/Kalorien-Modus → 0, Augmentierung speichert `corn`+`_base`, `applyCornCakes(off)` = Identität, `applyCornCakes(on)` re-sortiert nach corn-Score, **Cap**: `cornCapCount`-Mathe (floor), Cap begrenzt strikt (`≤ capPct%`), ungecappt > gecappt, Cap bindet nicht wenn Optimum darunter

## Detail-Panel (nach Ergebnis-Auswahl)
- Macro-Bars mit Live-Vergleich zu Zielen (beide Restaurants)
- **Subway**: Extras (inkl. Double Meat/Cheese), Salad togglen ("✦ Mein Standard"), Saucen (max 2), Seasonings
- **Farmer J**: Toppings togglen, Sauce/Dip/Topping togglen (max 1, UI erzwingt das); bei Sets keine Add-ons
- **Farmer J Set-Browser**: alle 13 Sets gruppiert (Set Fieldtrays / Set Fieldbowls / The Salad, Solo), Klick wählt das Set aus und öffnet das Detail-Panel
- **À-la-carte-Familie (Itsu / Pret / Nando's / Wagamama / GDK / The Fitness Chef / Pepe's / Pizza Express)** (gemeinsames Panel über AC-Alias): Item-Aufschlüsselung (kcal + Protein je Item), keine Add-ons; Bestellanleitung = Stückliste mit Mengen (z.B. "2× chicken gyoza", "1× Chicken Supreme (Weight Loss)", "1× Tender Strips - 3 (Lemon & Herb)")
- **Urban Greens**: Komponenten-Aufschlüsselung nach Gruppen + Bestellanleitung (Salad: 11 Schritte, Tray: 10, fertig: 2); KEINE Fibre/Salt-Bars (keine Daten); fertige Salads tragen den Hinweis "Werte ohne Dressing"
- **Chopstix** (eigenes Panel, Build-a-Box): Komponenten (Base in Box-Größe + Toppings mit kcal) + Bestellanleitung (Box-Typ → Base → Toppings mit Mengen); volle Makro-Bars
- **Atis** (eigenes Panel, Power Plate): Komponenten-Aufschlüsselung nach Gruppen (doublePlate-Items mit "×2" + verdoppeltem kcal) + Hinweis "×2 = double portion" + Bestellanleitung (8 Schritte); volle Makro-Bars
- **Five Guys** (eigenes Panel, Build Your Own): Komponenten (Main + Bun-Wahl [Bowl/Wrap mit −kcal] + Extra Patties + Sandwich-Extras + freie Toppings + Fries, je mit kcal) + Bestellanleitung (Burger: Burger → Bun or Bunless → Extra Patties → Toppings → Fries; Sandwich: + Extras); volle Makro-Bars
- **Bestellanleitung (Deliveroo)**: nummerierte Schritt-für-Schritt-Liste, aktualisiert sich live

## Footlong-Logik (Subway) — GEFIXT
- Footlong: alle Component-Nährwerte ×2 — **inkl. der Gemüse-Toppings** (Lettuce/Tomatoes/Cucumber/Pickles/Peppers/Olives/Red Onions/Jalapeños/Sweetcorn = PDF-Kategorie **„Vegetables"**, sie gehören zum Sub und werden mitverdoppelt). **Nur eigenständige Beilagen sind ×1**: die `D.sides` (Baked Beans/Coleslaw) und — falls je modelliert — die ausgenommenen **standalone Salads + Spuds** der PDF-Fußnote „Double values for footlong … excluding Spuds and Salads". **WICHTIG (User 20.06.2026)**: „Salads" in der Fußnote = die Salat-MAHLZEITEN, die Subway unabhängig vom Sandwich verkauft, NICHT die Gemüse-Toppings. Früher wurden die Std-Salad-Toppings fälschlich ×1 gelassen → behoben, jetzt ×m
- Implementiert über `sumN(items, mult, singleItems)`: `items` (Brot + Protein + Käse + Gemüse-Toppings + Extras + Saucen) werden mit `mult` skaliert; `singleItems` jetzt **nur noch die Side** (×1). In `optimize()` liegt `STD_SALAD` direkt in `base=[b,pr,c,...STD_SALAD]` (also ×m); in `selTotal` werden gewählte `D.salads` in `items` gepusht (×m), nur `sideItem` bleibt singleItem
- `node tests.js` sichert ab: „Subway Footlong kcal (Gemüse ×2 wie Sub)", „Subway Side ×1 bei Footlong (singleItems)", „Subway Optimizer Footlong Top-1 (Sub + Gemüse je ×2)"
- **Detail-Panel-Chips zeigen den footlong-korrekten kcal-Wert** (User 20.06.2026): Extras + Seasonings zeigen bei Footlong `kcal×2` in der Klammer (z.B. „Poached Egg (+124)"), da sie verdoppelt werden; Double Meat/Cheese taten das schon. Side-Chips zeigen ×1 (Sides werden nicht verdoppelt). Salad-Chips zeigen keinen kcal-Wert, werden in der Berechnung aber jetzt mitverdoppelt

## Design
- Dark Mode (#0d0d0d Background)
- Subway Green (#009743) als Akzentfarbe; Farmer-J-Header in Olivgrün (#8a9a2b→#5c671d); Atis-Header in Teal-Emerald (#1fae8c→#0c6b54), TFC-Header in Indigo (#4f46e5→#312e81), Chopstix-Header in Orange (#f97316→#9a3412), Pepe's-Header in Gold→Rot (#f2b705→#c1121f), Five-Guys-Header in Rot (#d52b1e→#a01913), „All restaurants"-Header in Violett (#7c3aed→#4c1d95), „Accurate restaurants"-Header in Blau (#0284c7→#0c4a6e), Pizza-Express-Header in Dunkel-Teal (#14564d→#082d28), Wasabi-Header in Wasabi-Grün (#8bc34a→#33691e), Leon-Header in Orange (#f6a01a→#c2410c). Restaurant-Header-Gradients sind alle in der `resto`-Ternary in App() gepflegt
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
├── atis-update.js           ← Generiert ATIS-Block in index.html aus data/atis-raw.json (Screenshot→Deliveroo-Namen)
├── verify-atis.js           ← Sanity-Check der Atis-Rohdaten (Item-Counts + kcal-Plausibilität)
├── verify-chopstix.js       ← Sanity-Check der Chopstix V19-Werte (kcal↔Makros, gesättigt≤Fett, Größen-Skalierung)
├── pepes-update.js          ← Generiert PEPES-Block in index.html aus data/pepes-raw.json (fibre=0, cats/flavours/items)
├── verify-pepes.js          ← Sanity-Check der Pepe's-Werte (kcal↔Makros ohne Ballaststoffe, gesättigt≤Fett, Item-Counts)
├── fiveguys-update.js       ← Generiert FIVEGUYS-Block (komponiert Burger aus Komponenten + Cajun-Fries) aus data/fiveguys-raw.json
├── verify-fiveguys.js       ← Sanity-Check der Five-Guys-Komposition (kcal↔Makros, gesättigt≤Fett, Counts)
├── pizzaexpress-extract.py  ← Extrahiert Pizza-Express-Daten aus der offiziellen PDF (pdfplumber) → data/pizzaexpress-raw.json
├── pizzaexpress-update.js   ← Generiert PIZZAEXPRESS-Block in index.html aus data/pizzaexpress-raw.json (à la carte)
├── wasabi-extract.py        ← Extrahiert Wasabi-Daten aus dem PDF (pdfplumber extract_tables, per-100g→Portion) → data/wasabi-raw.json
├── wasabi-update.js         ← Generiert WASABI-Block in index.html aus data/wasabi-raw.json (à la carte, fibre=0)
├── leon-crawl.js            ← Crawlt leon.co (__NEXT_DATA__) → data/leon-raw.json (Deliveroo-Prune DELIVEROO_KEEP + 3 Kids-Meals, Fett-Fix max(Fat,sat+mono+poly), kaputte Items raus)
├── leon-update.js           ← Generiert LEON-Block in index.html aus data/leon-raw.json (à la carte)
├── tfc-update.js            ← Generiert TFC-Block in index.html aus data/tfc-raw.json (Größen-Namen + sodium→salt)
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
    ├── atis-raw.json        ← Atis-Daten aus User-Screenshots (86 Items, portion/carb/doublePlate/seasonal-Flags) — Quelle der Wahrheit
    ├── tfc-raw.json         ← The-Fitness-Chef-Daten aus User-Copy-Paste (33 Items, size wl/ml/wg, sodium in mg)
    ├── pepes-raw.json       ← Pepe's-Piri-Piri-Daten aus User-Copy-Paste (51 Items, Deliveroo-abgeglichen, + 7 Flavours inkl. Plain, sauce/flavourMl-Flags, keine Ballaststoffe)
    ├── fiveguys-raw.json    ← Five-Guys-Daten: Komponenten (Patty/Bun/Cheese/Bacon) + Kompositionsregeln (Burger) + Sandwiches/Fries/Loaded/Toppings (offizielle Nährwerttabelle, per-component; Hot Dogs entfernt)
    ├── pizzaexpress-raw.json ← Pizza-Express-Daten aus der offiziellen PDF (pizzaexpress-extract.py): 229 Roh-Items (volle PDF, Quelle der Wahrheit), 9 Kategorien, volle 8 Makros; Deliveroo-Prune (→156) erst in pizzaexpress-update.js
    ├── wasabi-raw.json       ← Wasabi-Daten aus dem PDF (wasabi-extract.py): 158 Items, 8 Kategorien, per-Portion (aus per-100g skaliert), fibre=0; Bento-Seite 14 ausgelassen (redundant + leerer sat-Header)
    ├── leon-raw.json         ← Leon-Daten (leon-crawl.js aus leon.co __NEXT_DATA__): 26 Items, 8 Kategorien (auf Deliveroo-Karte geprunt + 3 Kids-Meals), volle 8 Makros; Fett-Fix, _meta.dropped/missing
    ├── Wasabi-Nutritional-Guide.pdf ← Original Wasabi Nutritional Guide (Quelle für wasabi-extract.py)
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
- **Atis Bowl-Modus**: "Build Your Own Bowl" bauen, sobald der User den Deliveroo-Flow liefert. Infrastruktur steht: `atisMode`-State, `optimizeAtis(...,"bowl",...)`-Zweig (gibt aktuell `[]`), `basesL`/`saucesL` (Large-Portionen) reserviert. Bowl = vermutlich einfache Portionen (kein `doublePlate`-×2); Schritt-Anzahl/Pflichtfelder vom User bestätigen lassen. Dann Modus-Umschalt-Buttons (wie UG BYO Salad/Tray) ergänzen
- Urban Greens: `dressId` für 5 Fertig-Salads nachtragen (Beef Saigon, Salmon Avocado, Shrimp Habanero, Urban Caesar ×2 — User liefert Deliveroo-Beschreibungen), dann sind sie automatisch wieder im Optimizer
- Urban Greens: Makros für die ausgeschlossenen Deliveroo-Items besorgen (Piri Piri Chicken/Shrimp, Lemon & Herb Chicken, Red Rice [Warm], Piri Piri Caesar Dressing) und ergänzen
- Subway: Wraps, Toasties, Salads, Spuds als weitere Kategorien (Daten in subway-optimizer.jsx vorhanden)
- Sides und Cookies in Gesamtberechnung einbeziehen
- Favoritenspeicherung (localStorage) — teilweise da: „Add own order" speichert den Warenkorb in localStorage (`mo_own_order`)
- Mehrere Mahlzeiten pro Tag tracken — „Add own order" deckt das Nachtragen einer einzelnen Bestellung ab; echtes Tages-Tracking (mehrere Mahlzeiten, Reset, Historie) wäre der nächste Schritt
