/*
 * Tuscany Estates — sample property dataset
 * =========================================
 *
 * This is a curated, REALISTIC SAMPLE dataset. Each entry uses real Tuscan
 * locations and coordinates so the 3D map, terrain and views are accurate.
 * The figures (price, land, rooms, features) are representative, not live.
 *
 * In production you would replace this array with a live feed (agency API,
 * portal export, scraper output, a database query, ...). The app only relies
 * on the SCHEMA below, so any source that produces objects of this shape will
 * work without touching app.js.
 *
 * SCHEMA (one object per property):
 *   id          string   unique slug
 *   title       string   display name
 *   type        string   one of: Villa | Farmhouse | Estate | Castle | Apartment | Rustico | Land
 *   town        string   nearest town
 *   province    string   2-letter Tuscan province code (FI, SI, AR, LU, GR, LI, PI)
 *   lat, lng    number   WGS84 coordinates (decimal degrees)
 *   elevation   number   approx. ground elevation in metres
 *   price       number   asking price in EUR
 *   landHa      number   land size in hectares (0 = none)
 *   buildingM2  number   building size in m2 (0 = bare land)
 *   beds        number   bedrooms
 *   baths       number   bathrooms
 *   vineyard    bool     has a vineyard
 *   vineyardHa  number   vineyard hectares (0 if none)
 *   olive       bool     has an olive grove
 *   oliveCount  number   number of olive trees (0 if none)
 *   pool        bool     has a swimming pool
 *   viewBearing number   compass bearing (deg) of the best panoramic view
 *   viewDesc    string   short description of the outlook
 *   listingUrl  string   link to the listing (added below from province portal)
 *   provinceName string  full province name (added below)
 */

// Positional constructor keeps the table compact and readable.
// P(id, title, type, town, province, lat, lng, elevation, price,
//   landHa, buildingM2, beds, baths, vineyardHa, oliveCount, pool, viewBearing, viewDesc)
function P(id, title, type, town, province, lat, lng, elevation, price,
           landHa, buildingM2, beds, baths, vineyardHa, oliveCount, pool, viewBearing, viewDesc) {
  return {
    id, title, type, town, province, lat, lng, elevation, price,
    landHa, buildingM2, beds, baths,
    vineyard: vineyardHa > 0, vineyardHa,
    olive: oliveCount > 0, oliveCount,
    pool, viewBearing, viewDesc,
  };
}

const PROPERTIES = [
  // ---- Chianti ----
  P('chianti-greve-villa', 'Chianti Hilltop Villa', 'Villa', 'Greve in Chianti', 'FI', 43.585, 11.316, 380, 2450000, 8.5, 520, 6, 5, 3.2, 450, true, 200, 'Sweeping south-facing views over Chianti vineyards and cypress ridgelines.'),
  P('panzano-casale', 'Panzano Conca d’Oro Farmhouse', 'Farmhouse', 'Panzano in Chianti', 'FI', 43.546, 11.310, 430, 1690000, 12, 410, 5, 4, 2.0, 600, true, 230, 'Panoramic views across the Conca d’Oro, the heart of Chianti Classico.'),
  P('radda-rustico', 'Radda Stone Rustico', 'Rustico', 'Radda in Chianti', 'SI', 43.482, 11.376, 530, 640000, 3.4, 220, 3, 2, 0, 180, false, 250, 'Quiet forest and vineyard views toward the Pesa valley.'),
  P('castellina-tenuta', 'Castellina Wine Estate', 'Estate', 'Castellina in Chianti', 'SI', 43.469, 11.285, 460, 5900000, 45, 1200, 12, 10, 18, 2500, true, 210, 'Working Chianti Classico estate with near 360° hill views.'),
  P('gaiole-castello', 'Gaiole Borgo Castle', 'Castle', 'Gaiole in Chianti', 'SI', 43.467, 11.434, 410, 8500000, 60, 2400, 18, 14, 22, 1800, true, 180, 'Medieval borgo castle commanding the Monti del Chianti.'),
  P('gaiole-land', 'Gaiole Vineyard Land Plot', 'Land', 'Gaiole in Chianti', 'SI', 43.450, 11.420, 400, 850000, 12, 0, 0, 0, 5, 600, false, 210, 'Planted Chianti Classico vineyard land with mature olive grove.'),
  P('castelnuovo-tenuta', 'Castelnuovo Berardenga Estate', 'Estate', 'Castelnuovo Berardenga', 'SI', 43.347, 11.505, 350, 5200000, 40, 1100, 11, 9, 15, 2000, true, 220, 'Grand Chianti Classico estate in the gentle hills south of Siena.'),

  // ---- Val d'Orcia & Montalcino/Montepulciano ----
  P('montalcino-brunello', 'Montalcino Brunello Estate', 'Estate', 'Montalcino', 'SI', 43.058, 11.489, 520, 6200000, 30, 900, 9, 7, 12, 900, true, 220, 'Iconic views to Monte Amiata across Brunello vineyards.'),
  P('pienza-casale', 'Pienza Val d’Orcia Farmhouse', 'Farmhouse', 'Pienza', 'SI', 43.077, 11.679, 450, 1950000, 15, 480, 6, 5, 1.5, 700, true, 150, 'The postcard Val d’Orcia: rolling clay hills and lone cypresses.'),
  P('montepulciano-villa', 'Montepulciano Vineyard Villa', 'Villa', 'Montepulciano', 'SI', 43.092, 11.781, 560, 2300000, 9, 540, 6, 5, 4, 400, true, 240, 'Vino Nobile vines with long views to the Val di Chiana.'),
  P('sanquirico-casale', 'San Quirico d’Orcia Country House', 'Farmhouse', 'San Quirico d’Orcia', 'SI', 43.060, 11.605, 420, 1250000, 6, 360, 5, 3, 0, 350, true, 200, 'In the heart of the Val d’Orcia UNESCO landscape.'),
  P('bagnovignoni-rustico', 'Bagno Vignoni Rustico', 'Rustico', 'Castiglione d’Orcia', 'SI', 43.029, 11.617, 350, 520000, 2.1, 180, 3, 2, 0, 120, false, 190, 'Views toward the thermal valley and the Rocca d’Orcia.'),

  // ---- Florence hills ----
  P('fiesole-villa', 'Fiesole Hillside Villa over Florence', 'Villa', 'Fiesole', 'FI', 43.807, 11.292, 295, 4800000, 2.5, 700, 7, 6, 0, 300, true, 220, 'Panoramic views over Florence and the Arno valley.'),
  P('impruneta-oliveto', 'Impruneta Olive Farm', 'Farmhouse', 'Impruneta', 'FI', 43.683, 11.255, 300, 1150000, 7, 380, 5, 4, 0, 800, true, 200, 'Classic olive-clad hills of the Chianti Fiorentino.'),
  P('sancasciano-villa', 'San Casciano Wine Villa', 'Villa', 'San Casciano in Val di Pesa', 'FI', 43.658, 11.186, 290, 1780000, 11, 500, 6, 5, 3, 500, true, 210, 'Pesa valley vineyards just minutes from Florence.'),

  // ---- Siena, San Gimignano, Val d'Elsa ----
  P('siena-apartment', 'Siena Historic Centre Apartment', 'Apartment', 'Siena', 'SI', 43.318, 11.331, 322, 480000, 0, 120, 2, 2, 0, 0, false, 180, 'Top-floor apartment with rooftop views toward the Duomo.'),
  P('monteriggioni-villa', 'Monteriggioni Walled-View Villa', 'Villa', 'Monteriggioni', 'SI', 43.391, 11.223, 274, 1950000, 6, 520, 6, 4, 2, 500, true, 160, 'Vineyard views to the famous medieval crown of towers.'),
  P('sangimignano-tenuta', 'San Gimignano Tower-View Estate', 'Estate', 'San Gimignano', 'SI', 43.468, 11.043, 324, 3400000, 20, 850, 8, 7, 6, 1200, true, 100, 'Vernaccia vineyards looking across to the medieval towers.'),
  P('casole-tenuta', 'Casole d’Elsa Hilltop Estate', 'Estate', 'Casole d’Elsa', 'SI', 43.339, 11.029, 417, 4100000, 28, 950, 9, 8, 5, 1400, true, 230, 'Endless views over the wooded hills of the Val d’Elsa.'),

  // ---- Pisa / Volterra ----
  P('volterra-casale', 'Volterra Panoramic Farmhouse', 'Farmhouse', 'Volterra', 'PI', 43.402, 10.860, 530, 890000, 14, 420, 5, 3, 0, 400, false, 250, 'Sweeping views over the Cecina valley and the crete.'),
  P('montaione-villa', 'Montaione Golf-Country Villa', 'Villa', 'Montaione', 'FI', 43.553, 10.917, 342, 1650000, 3, 480, 5, 4, 0, 300, true, 220, 'Wooded hills near Castelfalfi with wide valley views.'),

  // ---- Arezzo / Cortona / Valtiberina ----
  P('cortona-villa', 'Cortona Hilltop Villa', 'Villa', 'Cortona', 'AR', 43.275, 11.985, 494, 2650000, 5, 560, 6, 5, 1, 600, true, 270, 'Vast views over the Val di Chiana and Lake Trasimeno.'),
  P('arezzo-apartment', 'Arezzo Borgo Apartment', 'Apartment', 'Arezzo', 'AR', 43.463, 11.879, 296, 320000, 0, 140, 3, 2, 0, 0, true, 200, 'Restored apartment in a hill borgo with valley views and shared pool.'),
  P('anghiari-casale', 'Anghiari Tiber-Valley Farmhouse', 'Farmhouse', 'Anghiari', 'AR', 43.541, 12.058, 429, 560000, 7, 350, 4, 3, 0, 500, false, 240, 'Tiber valley views on the Tuscany–Umbria border.'),

  // ---- Lucca / Garfagnana / Versilia hinterland ----
  P('lucca-villa', 'Lucca Country Villa', 'Villa', 'Lucca', 'LU', 43.843, 10.502, 60, 3100000, 4, 780, 8, 6, 0, 350, true, 180, 'Elegant villa in the green hills ringing the walls of Lucca.'),
  P('barga-casale', 'Barga Garfagnana Farmhouse', 'Farmhouse', 'Barga', 'LU', 44.074, 10.483, 410, 690000, 4, 340, 5, 3, 0, 200, false, 300, 'Apuan Alps and Serchio valley mountain views.'),

  // ---- Maremma & coast ----
  P('scansano-tenuta', 'Scansano Morellino Estate', 'Estate', 'Scansano', 'GR', 42.690, 11.333, 280, 2900000, 35, 700, 7, 6, 10, 1500, true, 230, 'Morellino vineyards rolling toward the Maremma coast.'),
  P('capalbio-casale', 'Capalbio Coastal Country House', 'Farmhouse', 'Capalbio', 'GR', 42.454, 11.420, 180, 2200000, 10, 450, 5, 4, 0, 700, true, 250, 'Maremma countryside with sea glimpses to the Argentario.'),
  P('magliano-rustico', 'Magliano in Toscana Rustico', 'Rustico', 'Magliano in Toscana', 'GR', 42.598, 11.291, 128, 620000, 6, 260, 3, 2, 1, 800, false, 250, 'Olive groves and vines near the medieval walls.'),
  P('castiglione-pescaia-villa', 'Castiglione della Pescaia Sea-View Villa', 'Villa', 'Castiglione della Pescaia', 'GR', 42.762, 10.876, 90, 3600000, 2, 600, 6, 5, 0, 250, true, 270, 'Panoramic Tyrrhenian sea views over the Maremma coast.'),
  P('pitigliano-rustico', 'Pitigliano Tufa Rustico', 'Rustico', 'Pitigliano', 'GR', 42.635, 11.668, 313, 430000, 1.8, 200, 3, 2, 0, 150, false, 200, 'Dramatic views of the tufa cliff town.'),
  P('sorano-castello', 'Sorano Tufa Fortress Estate', 'Castle', 'Sorano', 'GR', 42.681, 11.713, 379, 1300000, 12, 600, 6, 3, 0, 400, false, 200, 'Tufa-stone fortress with views over the Lente gorge.'),

  // ---- Livorno coast / wine roads ----
  P('bolgheri-land', 'Bolgheri Vineyard Land', 'Land', 'Bolgheri', 'LI', 43.226, 10.602, 90, 1400000, 8, 0, 0, 0, 8, 0, false, 260, 'Prime planting land on the celebrated Bolgheri wine road.'),
  P('suvereto-casale', 'Suvereto Stone Farmhouse', 'Farmhouse', 'Suvereto', 'LI', 43.078, 10.677, 130, 780000, 5, 300, 4, 3, 1.2, 400, true, 240, 'Val di Cornia vines and olives a short drive from the coast.'),

  // ---- More Florence-side wine country ----
  P('certaldo-casale', 'Certaldo Vineyard Farmhouse', 'Farmhouse', 'Certaldo', 'FI', 43.547, 11.041, 130, 1050000, 9, 390, 5, 4, 3, 600, true, 210, 'Chianti and Vernaccia country between Florence and Siena.'),
  P('vinci-villa', 'Vinci Olive-Hills Villa', 'Villa', 'Vinci', 'FI', 43.783, 10.925, 97, 1480000, 6, 460, 5, 4, 0, 900, true, 200, 'Leonardo’s hills: terraced olive groves and Montalbano views.'),
];

// --- Attach listing links + province names ---------------------------------
// Sample listings point at the relevant province "for sale" page on a major
// Italian portal, so every link lands on real, current Tuscan inventory.
// In production, set p.listingUrl to each property's own listing URL instead.
const PROVINCE_PORTAL = {
  FI: { name: 'Florence',  url: 'https://www.immobiliare.it/vendita-case/firenze-provincia/'  },
  SI: { name: 'Siena',     url: 'https://www.immobiliare.it/vendita-case/siena-provincia/'    },
  AR: { name: 'Arezzo',    url: 'https://www.immobiliare.it/vendita-case/arezzo-provincia/'   },
  LU: { name: 'Lucca',     url: 'https://www.immobiliare.it/vendita-case/lucca-provincia/'    },
  GR: { name: 'Grosseto',  url: 'https://www.immobiliare.it/vendita-case/grosseto-provincia/' },
  LI: { name: 'Livorno',   url: 'https://www.immobiliare.it/vendita-case/livorno-provincia/'  },
  PI: { name: 'Pisa',      url: 'https://www.immobiliare.it/vendita-case/pisa-provincia/'     },
};

PROPERTIES.forEach((p) => {
  const portal = PROVINCE_PORTAL[p.province] || { name: p.province, url: '#' };
  p.provinceName = portal.name;
  p.listingUrl = portal.url;
});

// Expose for app.js (and make it explicit this is the data contract).
window.PROPERTIES = PROPERTIES;
