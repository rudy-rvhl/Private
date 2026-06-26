# 🍇 Tuscany Estates — 3D Property Explorer

An interactive **3D terrain map of Tuscany** that plots properties for sale on the
real landscape, lets you *see the view* each property has over the hills and
valleys, and filters listings by type, features, land size, bedrooms and price.

No build step, no API keys, no server required — **just open `index.html`.**

![type](https://img.shields.io/badge/stack-MapLibre%20GL%20JS-blue) ![terrain](https://img.shields.io/badge/terrain-AWS%20DEM%20(free)-green) ![keys](https://img.shields.io/badge/API%20keys-none-success)

---

## What it does

- **Accurate 3D relief.** Real elevation from a global Digital Elevation Model
  (AWS Terrain Tiles) is draped under satellite imagery, so Tuscany's hills —
  Chianti ridgelines, the Val d'Orcia, Monte Amiata, the Apuan Alps — appear
  with their true inclines. An adjustable *relief exaggeration* and an optional
  *hillshade* layer make the topography even easier to read.
- **Properties on the map, in 3D.** Each listing is both a colour-coded price
  pin *and* a 3D extruded beacon that stands on the terrain (coloured by type),
  so properties read as objects in the landscape. Pins stay fully visible even
  when they're behind a hill. Click a pin or a beacon for a full info card.
- **See the view.** Every property has a *🔭 See the view* button. The camera
  flies to the property, tilts to eye level, and faces its best panoramic
  direction — so you literally see the landscape and outlook that property has.
- **The listing link.** Each pop-up has a *View listing ↗* button that opens the
  property's listing in a new tab.
- **☀️ Sun & shadows.** Enable the *Sun & shadows* study and drag the **time‑of‑day
  slider** to move the sun across the sky. The terrain's shaded relief is lit from
  the sun's real azimuth/altitude for the chosen hour, and every property pin is
  flagged **☀️ in sun / ⛅ partly / 🌑 in shade / 🌙 night** based on which way its
  hillside faces — so you can see, e.g., which estates keep the evening sun on the
  terrace. A *Season* selector changes the sun's path (summer rides high, winter
  stays low). The pop-up also reports each property's sun status at that hour.
- **Live filters** in the left sidebar:
  - Property **type** (Villa, Farmhouse/Casale, Estate/Tenuta, Castle, Apartment, Rustico, Land)
  - **Vineyard**, **olive grove**, **swimming pool**
  - Minimum **land size** (hectares)
  - Maximum **price**
  - Minimum **bedrooms**
  - Free-text **search** (town / area / name)
  - A scrollable, clickable **property list** that flies you to each estate
- **Base layers:** Satellite · Topographic (contour lines + shaded relief) · Streets.

---

## Run it

```bash
# Option A — simplest: just open the file
open index.html            # macOS
xdg-open index.html        # Linux
start index.html           # Windows

# Option B — serve locally (recommended; avoids any file:// quirks)
python3 -m http.server 8000
# then visit http://localhost:8000
```

> Requires an internet connection at runtime: the MapLibre library, the
> satellite/terrain/topographic tiles and the elevation data are all loaded
> from free public sources (listed under *Data sources* below).

### Controls

| Action | How |
| --- | --- |
| Pan | drag |
| Zoom | scroll / pinch / `+` `−` |
| **Tilt & rotate (3D)** | right-button drag, or `Ctrl`/`⌘` + drag, or the compass |
| See a property's view | click a pin → **🔭 See the view** |
| Open the listing | click a pin → **View listing ↗** |
| Move the sun by hour | enable **☀️ Sun & shadows**, drag the time slider |
| Toggle 3D / relief / exaggeration | top-right panel |
| Reset camera | **⤢ Reset view** |

---

## Plugging in real listings (going production)

The map renders whatever is in `window.PROPERTIES` (defined in
[`js/data.js`](js/data.js)). The shipped dataset is a **curated sample** of 36
estates at *real Tuscan coordinates* — so the terrain, positions and views are
genuine — with representative prices/features. Each sample's *View listing* link
opens current for-sale inventory for that property's province on a major portal.

To make it show **your** live inventory, replace the `PROPERTIES` array with data
from any source (agency API, portal CSV/feed export, scraper, database) — as long
as each object matches this contract:

```js
{
  id:         "unique-slug",      // string, unique
  title:      "Chianti Hilltop Villa",
  type:       "Villa",            // Villa|Farmhouse|Estate|Castle|Apartment|Rustico|Land
  town:       "Greve in Chianti",
  province:   "FI",               // FI SI AR LU GR LI PI
  lat: 43.585, lng: 11.316,       // WGS84 — drives map position & view
  elevation:  380,                // metres (shown in the card)
  price:      2450000,            // EUR
  landHa:     8.5,                // hectares (0 = none)
  buildingM2: 520,                // m² (0 = bare land)
  beds: 6, baths: 5,
  vineyard: true,  vineyardHa: 3.2,
  olive:    true,  oliveCount: 450,
  pool:     true,
  viewBearing: 200,               // compass deg of the best panorama
  viewDesc:    "South-facing views over Chianti vineyards…",
  listingUrl:  "https://your-portal.example/listing/12345"  // ← the real listing
}
```

Nothing in `app.js` is hard-coded to the sample data — swap the array and
everything (markers, filters, list, pop-ups, the *See the view* camera) just
works. If you fetch from an API at runtime instead of a static file, populate
`window.PROPERTIES` before the map's `load` event, or call the exported
`apply()` again after loading.

A couple of fields are worth getting right because they power signature features:
`lat`/`lng` (position on the real terrain) and `viewBearing` (the direction the
*See the view* camera faces — point it at the valley/sea/landmark the property
overlooks).

---

## How the 3D terrain works

MapLibre GL JS reads a **raster-DEM** source (elevation encoded as RGB pixels)
and turns it into a real 3D mesh, then drapes the chosen base imagery over it:

```js
sources.terrain = {
  type: 'raster-dem',
  tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
  encoding: 'terrarium',
};
map.setTerrain({ source: 'terrain', exaggeration: 1.5 });
```

The same DEM also feeds the optional `hillshade` layer for shaded relief.

---

## Data sources (all free, no key)

| Purpose | Source | Licence |
| --- | --- | --- |
| Map engine | [MapLibre GL JS](https://maplibre.org) | BSD-3 |
| Elevation (3D terrain + hillshade) | [AWS Terrain Tiles](https://registry.opendata.aws/terrain-tiles/) (Terrarium) | Open data |
| Satellite imagery | Esri World Imagery | Esri terms |
| Topographic | [OpenTopoMap](https://opentopomap.org) | CC-BY-SA |
| Streets | [OpenStreetMap](https://www.openstreetmap.org) | ODbL |

> The OpenStreetMap / OpenTopoMap tile servers are fine for personal and demo
> use. For production traffic, use your own tile provider (MapTiler, Mapbox,
> Esri with a key, or a self-hosted stack) and keep the attributions.

---

## Project structure

```
index.html        Page shell: sidebar, map controls, legend
css/style.css     Styling (light "Tuscan" theme, responsive)
js/data.js        The PROPERTIES dataset (replace this for live data)
js/app.js         Map setup, terrain, markers, pop-ups, filters, camera
```

---

## Notes & limitations

- **Sample listings.** Prices and feature counts are illustrative; the locations
  are real. Wire a live feed as described above for production use.
- **Property positions** are at the nearest town's coordinates, not surveyed
  parcel centroids — accurate to the hillside, not to the doorstep.
- **`viewBearing`** is a curated best-guess of each estate's finest outlook.
- Runtime needs network access for tiles; everything else is static and offline-friendly.
