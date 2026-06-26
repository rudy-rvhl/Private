/* ============================================================
   Tuscany Estates — 3D Property Explorer
   MapLibre GL JS + free terrain (no API key required)
   ============================================================ */

'use strict';

/* ---- Property type metadata (colours kept in sync with style.css) ---- */
const TYPE_META = {
  Villa:     { color: '#8e44ad', emoji: '🏛️', label: 'Villa' },
  Farmhouse: { color: '#c0392b', emoji: '🏡', label: 'Farmhouse / Casale' },
  Estate:    { color: '#16a085', emoji: '🍇', label: 'Estate / Tenuta' },
  Castle:    { color: '#34495e', emoji: '🏰', label: 'Castle / Castello' },
  Apartment: { color: '#2980b9', emoji: '🏢', label: 'Apartment' },
  Rustico:   { color: '#d35400', emoji: '🪵', label: 'Rustico' },
  Land:      { color: '#27ae60', emoji: '🌿', label: 'Land / Terreno' },
};

/* ---- Tile sources (all free, no API key) ---- */
const TERRAIN_TILES = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';
const SATELLITE_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const TOPO_TILES = [
  'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
  'https://b.tile.opentopomap.org/{z}/{x}/{y}.png',
  'https://c.tile.opentopomap.org/{z}/{x}/{y}.png',
];
const OSM_TILES = [
  'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
  'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
  'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
];

/* ---- Map style: raster bases + raster-dem terrain + hillshade ---- */
const STYLE = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    satellite: {
      type: 'raster', tileSize: 256, maxzoom: 19, tiles: [SATELLITE_TILES],
      attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
    },
    topo: {
      type: 'raster', tileSize: 256, maxzoom: 17, tiles: TOPO_TILES,
      attribution: '© OpenTopoMap (CC-BY-SA), © OpenStreetMap contributors',
    },
    osm: {
      type: 'raster', tileSize: 256, maxzoom: 19, tiles: OSM_TILES,
      attribution: '© OpenStreetMap contributors',
    },
    terrain: {
      type: 'raster-dem', tileSize: 256, maxzoom: 15, encoding: 'terrarium',
      tiles: [TERRAIN_TILES],
      attribution: 'Elevation: AWS Terrain Tiles / Mapzen',
    },
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#dfe7ef' } },
    { id: 'satellite', type: 'raster', source: 'satellite' },
    { id: 'topo', type: 'raster', source: 'topo', layout: { visibility: 'none' } },
    { id: 'osm', type: 'raster', source: 'osm', layout: { visibility: 'none' } },
    {
      id: 'hillshade', type: 'hillshade', source: 'terrain',
      layout: { visibility: 'none' },
      paint: { 'hillshade-exaggeration': 0.45, 'hillshade-shadow-color': '#3d3320' },
    },
  ],
  sky: {
    'sky-color': '#9ec9f0',
    'sky-horizon-blend': 0.5,
    'horizon-color': '#f3ede0',
    'horizon-fog-blend': 0.6,
    'fog-color': '#dfe7ef',
    'fog-ground-blend': 0.5,
  },
  terrain: { source: 'terrain', exaggeration: 1.5 },
};

/* ---- Map init ---- */
const map = new maplibregl.Map({
  container: 'map',
  style: STYLE,
  center: [11.5, 43.3],
  zoom: 8.5,
  pitch: 56,
  bearing: -18,
  maxPitch: 85,
  hash: false,
  attributionControl: { compact: true },
});
map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');
map.addControl(new maplibregl.FullscreenControl(), 'bottom-right');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

/* ---- State ---- */
const state = {
  markers: [],          // { id, marker, el }
  popup: null,
  selectedId: null,
  filters: {
    text: '',
    types: new Set(Object.keys(TYPE_META)), // all on by default
    vineyard: false,
    olive: false,
    pool: false,
    minLandHa: 0,
    minBeds: 0,
    maxPrice: Infinity,
  },
  sun: {
    enabled: false,
    hours: 13,                       // time of day (0–24)
    date: new Date('2026-06-21'),    // season (drives the sun's height)
  },
};

/* ---- Helpers ---- */
const euro = (n) => '€' + n.toLocaleString('en-GB');
function shortPrice(n) {
  if (n >= 1e6) return '€' + (n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 2).replace(/\.00$/, '') + 'M';
  if (n >= 1e3) return '€' + Math.round(n / 1e3) + 'k';
  return '€' + n;
}
function bearingToCompass(b) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(((b % 360) / 45)) % 8];
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
function fmtHour(h) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return String(hh).padStart(2, '0') + ':' + String(mm % 60).padStart(2, '0');
}

/* ---- Solar position (NOAA-style approximation) ----
   Returns the sun's altitude (degrees above horizon) and azimuth
   (degrees clockwise from north) for a date/time at a location.       */
function sunPosition(date, lat, lng, hours, tzOffset) {
  const rad = Math.PI / 180;
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 0);
  const dayMs = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - yearStart;
  const N = Math.floor(dayMs / 86400000);                       // day of year
  const decl = 23.45 * Math.sin(rad * 360 * (284 + N) / 365);   // declination
  const B = rad * 360 * (N - 81) / 364;
  const EoT = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B); // minutes
  const LSTM = 15 * tzOffset;                                   // local std time meridian
  const TC = 4 * (lng - LSTM) + EoT;                            // time correction (min)
  const LST = hours + TC / 60;                                  // local solar time
  const HRA = 15 * (LST - 12);                                  // hour angle (deg)
  const alt = Math.asin(
    Math.sin(lat * rad) * Math.sin(decl * rad) +
    Math.cos(lat * rad) * Math.cos(decl * rad) * Math.cos(HRA * rad)
  ) / rad;
  let cosAz = (Math.sin(decl * rad) - Math.sin(alt * rad) * Math.sin(lat * rad)) /
              (Math.cos(alt * rad) * Math.cos(lat * rad));
  cosAz = Math.max(-1, Math.min(1, cosAz));
  let az = Math.acos(cosAz) / rad;
  if (HRA > 0) az = 360 - az;                                   // afternoon -> west
  return { altitude: alt, azimuth: az, declination: decl };
}

// Sun for the Tuscany region at the current slider time/season.
function currentSun() {
  const d = state.sun.date;
  const tz = (d.getUTCMonth() >= 2 && d.getUTCMonth() <= 9) ? 2 : 1; // CEST / CET
  return sunPosition(d, 43.3, 11.3, state.sun.hours, tz);
}

// How strongly the sun lights a slope facing `aspectDeg` (its panorama side).
// >0.15 sunlit, <=0.15 shaded, <0 (altitude<=0) night.
function illumFactor(aspectDeg, sun) {
  if (sun.altitude <= 0) return -1;
  const rad = Math.PI / 180;
  const slope = 20 * rad; // representative Tuscan hillside
  return Math.sin(sun.altitude * rad) * Math.cos(slope) +
         Math.cos(sun.altitude * rad) * Math.sin(slope) * Math.cos((sun.azimuth - aspectDeg) * rad);
}
function sunStatus(f, sun) {
  if (sun.altitude <= 0) return { emoji: '🌙', text: 'In darkness (sun below horizon)' };
  if (f > 0.5)  return { emoji: '☀️', text: 'In full sun' };
  if (f > 0.15) return { emoji: '⛅', text: 'Partly sunlit' };
  return { emoji: '🌑', text: 'In shade' };
}

/* ---- Filtering ---- */
function passesFilters(p) {
  const f = state.filters;
  if (!f.types.has(p.type)) return false;
  if (f.vineyard && !p.vineyard) return false;
  if (f.olive && !p.olive) return false;
  if (f.pool && !p.pool) return false;
  if (p.landHa < f.minLandHa) return false;
  if (p.beds < f.minBeds) return false;
  if (p.price > f.maxPrice) return false;
  if (f.text) {
    const hay = (p.title + ' ' + p.town + ' ' + p.provinceName + ' ' + p.type).toLowerCase();
    if (!hay.includes(f.text.toLowerCase())) return false;
  }
  return true;
}

function getFiltered() {
  return window.PROPERTIES.filter(passesFilters);
}

/* ---- 3D property beacons (fill-extrusion that sits on the terrain) ---- */
function squarePolygon(lng, lat, sizeM) {
  const dLat = sizeM / 111320;
  const dLng = sizeM / (111320 * Math.cos(lat * Math.PI / 180));
  return [[
    [lng - dLng, lat - dLat], [lng + dLng, lat - dLat],
    [lng + dLng, lat + dLat], [lng - dLng, lat + dLat], [lng - dLng, lat - dLat],
  ]];
}
function beaconHeight(p) {
  const maxP = state.maxPrice || 8500000;
  return Math.round(130 + (p.price / maxP) * 200); // 130–330 m — a clear 3D presence
}
function propsToGeoJSON(list) {
  return {
    type: 'FeatureCollection',
    features: list.map((p) => ({
      type: 'Feature',
      properties: {
        id: p.id, color: TYPE_META[p.type].color,
        height: beaconHeight(p), selected: p.id === state.selectedId ? 1 : 0,
      },
      geometry: { type: 'Polygon', coordinates: squarePolygon(p.lng, p.lat, 24) },
    })),
  };
}
function updateBeacons(list) {
  const src = map.getSource && map.getSource('properties-3d');
  if (src && src.setData) src.setData(propsToGeoJSON(list || getFiltered()));
}

/* ---- Markers ---- */
function clearMarkers() {
  state.markers.forEach((m) => m.marker.remove());
  state.markers = [];
}

function makeMarkerEl(p) {
  const meta = TYPE_META[p.type];
  const el = document.createElement('div');
  el.className = 'marker';
  el.style.setProperty('--c', meta.color);
  el.dataset.id = p.id;
  el.innerHTML =
    `<div class="marker-price">${shortPrice(p.price)}</div>` +
    `<div class="marker-pin"><span>${meta.emoji}</span></div>` +
    `<div class="sun-badge"></div>`;
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    selectProperty(p.id, { fly: true });
  });
  return el;
}

function renderMarkers(list) {
  clearMarkers();
  list.forEach((p) => {
    const el = makeMarkerEl(p);
    // occludedOpacity:1 keeps pins fully visible even when behind a hill,
    // so every property stays readable on the 3D terrain.
    const marker = new maplibregl.Marker({ element: el, anchor: 'bottom', occludedOpacity: 1 })
      .setLngLat([p.lng, p.lat])
      .addTo(map);
    state.markers.push({ id: p.id, marker, el, aspect: p.viewBearing });
  });
  // keep selection highlight if still visible
  if (state.selectedId) {
    const found = state.markers.find((m) => m.id === state.selectedId);
    if (found) found.el.classList.add('selected');
  }
  updateSunOnMarkers();
}

/* ---- Sun / time-of-day lighting ---- */
function updateSunOnMarkers(sun) {
  sun = sun || currentSun();
  state.markers.forEach((m) => {
    m.el.classList.remove('sunlit', 'shaded', 'night');
    const badge = m.el.querySelector('.sun-badge');
    if (!state.sun.enabled) { if (badge) badge.textContent = ''; return; }
    const f = illumFactor(m.aspect, sun);
    let cls;
    if (sun.altitude <= 0) cls = 'night';
    else if (f > 0.15) cls = 'sunlit';
    else cls = 'shaded';
    m.el.classList.add(cls);
    if (badge) badge.textContent = sunStatus(f, sun).emoji;
  });
}

function updateSky(sun) {
  try {
    let sky = '#9ec9f0', horizon = '#f3ede0', fog = '#dfe7ef';
    if (sun.altitude <= 0)      { sky = '#0b1d3a'; horizon = '#27354f'; fog = '#1b2436'; } // night
    else if (sun.altitude < 12) { sky = '#7fb0e0'; horizon = '#ffcf99'; fog = '#efd7bf'; } // golden hour
    map.setSky({
      'sky-color': sky, 'sky-horizon-blend': 0.5,
      'horizon-color': horizon, 'horizon-fog-blend': 0.6,
      'fog-color': fog, 'fog-ground-blend': 0.5,
    });
  } catch (e) { /* sky API varies by version */ }
}
function restoreSky() {
  try {
    map.setSky({
      'sky-color': '#9ec9f0', 'sky-horizon-blend': 0.5,
      'horizon-color': '#f3ede0', 'horizon-fog-blend': 0.6,
      'fog-color': '#dfe7ef', 'fog-ground-blend': 0.5,
    });
  } catch (e) { /* ignore */ }
}

// Recompute everything that depends on the sun slider.
function applySun() {
  const sun = currentSun();

  // readout (always)
  const r = document.getElementById('sun-readout');
  if (r) {
    r.textContent = sun.altitude <= 0
      ? `${fmtHour(state.sun.hours)} · night`
      : `${fmtHour(state.sun.hours)} · ${bearingToCompass(sun.azimuth)} ${Math.round(sun.altitude)}°`;
  }

  // map lighting (only when the sun study is enabled)
  if (state.sun.enabled) {
    map.setLayoutProperty('hillshade', 'visibility', 'visible');
    map.setPaintProperty('hillshade', 'hillshade-illumination-anchor', 'map');
    map.setPaintProperty('hillshade', 'hillshade-illumination-direction',
      Math.round(sun.altitude > 0 ? sun.azimuth : 315));
    // lower sun -> longer, stronger shadows
    const ex = sun.altitude > 0 ? Math.min(0.95, 0.3 + (1 - sun.altitude / 90) * 0.65) : 0.12;
    map.setPaintProperty('hillshade', 'hillshade-exaggeration', ex);
    updateSky(sun);
  }

  updateSunOnMarkers(sun);
}

/* ---- Popup ---- */
function buildPopupHTML(p) {
  const meta = TYPE_META[p.type];
  const spec = (k, v) => `<div class="k">${k}</div><div class="v">${v}</div>`;
  const grid = [
    spec('Price', `<span style="color:var(--accent)">${euro(p.price)}</span>`),
    p.buildingM2 ? spec('Building', `${p.buildingM2} m²`) : '',
    spec('Land', `${p.landHa} ha`),
    p.beds ? spec('Bedrooms', p.beds) : '',
    p.baths ? spec('Bathrooms', p.baths) : '',
    spec('Elevation', `${p.elevation} m`),
  ].join('');

  const feats = [
    `<span class="feat ${p.vineyard ? 'on' : ''}">${p.vineyard ? '🍇 Vineyard ' + p.vineyardHa + ' ha' : '🍇 No vineyard'}</span>`,
    `<span class="feat ${p.olive ? 'on' : ''}">${p.olive ? '🫒 ' + p.oliveCount + ' olive trees' : '🫒 No olives'}</span>`,
    `<span class="feat ${p.pool ? 'on' : ''}">${p.pool ? '🏊 Pool' : '🏊 No pool'}</span>`,
  ].join('');

  let sunLine = '';
  if (state.sun.enabled) {
    const sun = currentSun();
    const st = sunStatus(illumFactor(p.viewBearing, sun), sun);
    const where = sun.altitude > 0
      ? `sun ${bearingToCompass(sun.azimuth)} ${Math.round(sun.altitude)}° high`
      : 'sun is down';
    sunLine = `<div class="pop-view pop-sun">${st.emoji} <b>At ${fmtHour(state.sun.hours)}:</b> ${st.text} — ${where}.</div>`;
  }

  return `
    <div class="pop" style="--c:${meta.color}">
      <div class="pop-head">
        <div class="pop-type">${meta.emoji} ${escapeHtml(meta.label)}</div>
        <div class="pop-title">${escapeHtml(p.title)}</div>
        <div class="pop-loc">📍 ${escapeHtml(p.town)} · ${escapeHtml(p.provinceName)}, Tuscany</div>
      </div>
      <div class="pop-body">
        <div class="pop-grid">${grid}</div>
        <div class="pop-feats">${feats}</div>
        <div class="pop-view">🔭 <b>View ${bearingToCompass(p.viewBearing)}:</b> ${escapeHtml(p.viewDesc)}</div>
        ${sunLine}
        <div class="pop-actions">
          <button class="view-btn" onclick="window.seeView('${p.id}')">🔭 See the view</button>
          <a class="listing-btn" href="${escapeHtml(p.listingUrl)}" target="_blank" rel="noopener">View listing ↗</a>
        </div>
      </div>
    </div>`;
}

function openPopup(p) {
  if (state.popup) state.popup.remove();
  // no fixed anchor -> MapLibre auto-flips it to stay on-screen; CSS caps the
  // body height so a tall card can never run off the bottom of the map.
  state.popup = new maplibregl.Popup({ offset: 18, closeButton: true, maxWidth: '300px' })
    .setLngLat([p.lng, p.lat])
    .setHTML(buildPopupHTML(p))
    .addTo(map);
  state.popup.on('close', () => { state.popup = null; });
}

/* ---- Selection + camera ---- */
function highlight(id) {
  state.markers.forEach((m) => m.el.classList.toggle('selected', m.id === id));
  state.selectedId = id;
  updateBeacons(); // recolour the selected 3D beacon
}

function selectProperty(id, { fly = false } = {}) {
  const p = window.PROPERTIES.find((x) => x.id === id);
  if (!p) return;
  highlight(id);
  if (fly) {
    map.flyTo({
      center: [p.lng, p.lat],
      zoom: 13.4,
      pitch: 62,
      bearing: p.viewBearing - 180, // look from behind toward the view direction
      // push the point into the lower-centre so the pop-up opens upward into
      // free space instead of being clipped at the bottom edge.
      offset: [0, 110],
      duration: 1800,
      essential: true,
    });
  }
  openPopup(p);
}

/* "See the view": place the camera near the property looking out over the
   landscape in its best panoramic direction — terrain makes the view real. */
window.seeView = function (id) {
  const p = window.PROPERTIES.find((x) => x.id === id);
  if (!p) return;
  // nudge the centre a little in the view direction so the property sits in the
  // foreground and the camera looks out over the valley/hills.
  const rad = (p.viewBearing * Math.PI) / 180;
  const d = 0.0042; // ~ a few hundred metres
  const center = [p.lng + d * Math.sin(rad), p.lat + d * Math.cos(rad)];
  map.flyTo({
    center,
    zoom: 14.4,
    pitch: 80,
    bearing: p.viewBearing,
    duration: 2400,
    essential: true,
  });
  toast(`🔭 Looking ${bearingToCompass(p.viewBearing)} from “${p.title}” — ${p.viewDesc}`);
};

/* ---- Sidebar property list ---- */
function renderList(list) {
  const wrap = document.getElementById('plist');
  document.getElementById('count-shown').textContent = list.length;
  document.getElementById('count-total').textContent = window.PROPERTIES.length;
  if (!list.length) {
    wrap.innerHTML = `<div class="note">No properties match these filters. Try widening them.</div>`;
    return;
  }
  // sort by price desc for a pleasant browse
  const sorted = [...list].sort((a, b) => b.price - a.price);
  wrap.innerHTML = sorted.map((p) => {
    const meta = TYPE_META[p.type];
    const tags = [];
    if (p.vineyard) tags.push('🍇 vineyard');
    if (p.olive) tags.push('🫒 olives');
    if (p.pool) tags.push('🏊 pool');
    if (p.landHa) tags.push(p.landHa + ' ha');
    if (p.beds) tags.push(p.beds + ' bd');
    return `
      <div class="pcard" data-id="${p.id}" style="--c:${meta.color}">
        <div class="badge">${meta.emoji}</div>
        <div>
          <div class="pc-title">${escapeHtml(p.title)}</div>
          <div class="pc-sub">${escapeHtml(p.town)} · ${escapeHtml(p.provinceName)}</div>
          <div class="pc-price">${euro(p.price)}</div>
          <div class="pc-tags">${tags.map((t) => `<span class="pc-tag">${t}</span>`).join('')}</div>
        </div>
      </div>`;
  }).join('');

  wrap.querySelectorAll('.pcard').forEach((card) => {
    card.addEventListener('click', () => {
      selectProperty(card.dataset.id, { fly: true });
      if (window.innerWidth <= 820) closeSidebar();
    });
  });
}

/* ---- Apply everything ---- */
function apply() {
  const list = getFiltered();
  renderMarkers(list);
  renderList(list);
  updateBeacons(list);
}

/* ---- Toast ---- */
let toastTimer = null;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 4200);
}

/* ============================================================
   Build the sidebar controls
   ============================================================ */
function buildSidebar() {
  // type chips
  const chipWrap = document.getElementById('type-chips');
  chipWrap.innerHTML = Object.entries(TYPE_META).map(([key, m]) =>
    `<span class="chip active" data-type="${key}" style="--c:${m.color}">
       <span class="dot"></span>${m.label.split(' / ')[0]}
     </span>`).join('');
  chipWrap.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const t = chip.dataset.type;
      if (state.filters.types.has(t)) { state.filters.types.delete(t); chip.classList.remove('active'); }
      else { state.filters.types.add(t); chip.classList.add('active'); }
      apply();
    });
  });

  // dynamic bounds from data
  const maxLand = Math.ceil(Math.max(...window.PROPERTIES.map((p) => p.landHa)));
  const maxPrice = Math.max(...window.PROPERTIES.map((p) => p.price));
  state.maxPrice = maxPrice; // used for 3D beacon heights

  const landSlider = document.getElementById('land-slider');
  landSlider.max = maxLand;
  landSlider.addEventListener('input', () => {
    state.filters.minLandHa = +landSlider.value;
    document.getElementById('land-val').textContent = landSlider.value + ' ha';
    apply();
  });

  const priceSlider = document.getElementById('price-slider');
  priceSlider.max = maxPrice;
  priceSlider.value = maxPrice;
  priceSlider.step = 50000;
  priceSlider.addEventListener('input', () => {
    state.filters.maxPrice = +priceSlider.value >= maxPrice ? Infinity : +priceSlider.value;
    document.getElementById('price-val').textContent =
      (+priceSlider.value >= maxPrice) ? 'Any' : ('≤ ' + shortPrice(+priceSlider.value));
    apply();
  });

  const bedsSelect = document.getElementById('beds-select');
  bedsSelect.addEventListener('change', () => {
    state.filters.minBeds = +bedsSelect.value;
    apply();
  });

  document.getElementById('search').addEventListener('input', (e) => {
    state.filters.text = e.target.value.trim();
    apply();
  });

  ['vineyard', 'olive', 'pool'].forEach((key) => {
    document.getElementById('feat-' + key).addEventListener('change', (e) => {
      state.filters[key] = e.target.checked;
      apply();
    });
  });

  document.getElementById('reset-btn').addEventListener('click', resetFilters);

  // legend
  document.getElementById('legend-items').innerHTML = Object.entries(TYPE_META).map(([, m]) =>
    `<div class="lg-item"><span class="lg-dot" style="background:${m.color}"></span>${m.label}</div>`).join('');
}

function resetFilters() {
  state.filters = {
    text: '', types: new Set(Object.keys(TYPE_META)),
    vineyard: false, olive: false, pool: false,
    minLandHa: 0, minBeds: 0, maxPrice: Infinity,
  };
  document.getElementById('search').value = '';
  document.querySelectorAll('#type-chips .chip').forEach((c) => c.classList.add('active'));
  ['vineyard', 'olive', 'pool'].forEach((k) => { document.getElementById('feat-' + k).checked = false; });
  const land = document.getElementById('land-slider'); land.value = 0; document.getElementById('land-val').textContent = '0 ha';
  const price = document.getElementById('price-slider'); price.value = price.max; document.getElementById('price-val').textContent = 'Any';
  document.getElementById('beds-select').value = '0';
  apply();
}

/* ============================================================
   Map controls: base layer, 3D terrain, relief, exaggeration
   ============================================================ */
function buildMapControls() {
  // base layer switch
  document.querySelectorAll('#layer-ctrl button').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#layer-ctrl button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const layer = btn.dataset.layer;
      ['satellite', 'topo', 'osm'].forEach((l) =>
        map.setLayoutProperty(l, 'visibility', l === layer ? 'visible' : 'none'));
    });
  });

  // 3D terrain toggle
  const terr = document.getElementById('terrain-toggle');
  terr.addEventListener('change', () => {
    map.setTerrain(terr.checked ? { source: 'terrain', exaggeration: +exag.value } : null);
    if (!terr.checked) map.easeTo({ pitch: 0, duration: 600 });
    else map.easeTo({ pitch: 62, duration: 600 });
  });

  // relief / hillshade toggle
  document.getElementById('relief-toggle').addEventListener('change', (e) => {
    map.setLayoutProperty('hillshade', 'visibility', e.target.checked ? 'visible' : 'none');
  });

  // exaggeration slider
  const exag = document.getElementById('exag-slider');
  exag.addEventListener('input', () => {
    document.getElementById('exag-val').textContent = (+exag.value).toFixed(1) + '×';
    if (terr.checked) map.setTerrain({ source: 'terrain', exaggeration: +exag.value });
  });

  // sun / time-of-day study
  const sunToggle = document.getElementById('sun-toggle');
  const sunSlider = document.getElementById('sun-slider');
  const seasonSel = document.getElementById('season-select');
  sunToggle.addEventListener('change', () => {
    state.sun.enabled = sunToggle.checked;
    if (state.sun.enabled) {
      applySun();
      toast('☀️ Sun study on — drag the time slider to move the sun across the day.');
    } else {
      // restore default hillshade + sky
      map.setPaintProperty('hillshade', 'hillshade-illumination-direction', 335);
      map.setPaintProperty('hillshade', 'hillshade-illumination-anchor', 'viewport');
      map.setPaintProperty('hillshade', 'hillshade-exaggeration', 0.45);
      map.setLayoutProperty('hillshade', 'visibility',
        document.getElementById('relief-toggle').checked ? 'visible' : 'none');
      restoreSky();
      updateSunOnMarkers();
    }
  });
  sunSlider.addEventListener('input', () => {
    state.sun.hours = +sunSlider.value;
    applySun();
  });
  seasonSel.addEventListener('change', () => {
    state.sun.date = new Date(seasonSel.value);
    applySun();
  });

  // reset view
  document.getElementById('reset-view').addEventListener('click', () => {
    map.flyTo({ center: [11.5, 43.3], zoom: 8.5, pitch: 56, bearing: -18, duration: 1500 });
  });
}

/* ---- Sidebar open/close (mobile) ---- */
function openSidebar() { document.getElementById('sidebar').classList.add('open'); }
function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); }

/* ============================================================
   Boot
   ============================================================ */
map.on('load', () => {
  // terrain is declared in the style; ensure it's active
  try { map.setTerrain({ source: 'terrain', exaggeration: 1.5 }); } catch (e) { /* older versions */ }

  // --- 3D property beacons: extruded prisms that sit on the terrain ---
  map.addSource('properties-3d', { type: 'geojson', data: propsToGeoJSON([]) });
  map.addLayer({
    id: 'property-3d',
    type: 'fill-extrusion',
    source: 'properties-3d',
    paint: {
      'fill-extrusion-color': [
        'case', ['==', ['get', 'selected'], 1], '#ffd24a', ['get', 'color'],
      ],
      'fill-extrusion-height': ['get', 'height'],
      'fill-extrusion-base': 0,
      'fill-extrusion-opacity': 0.92,
      'fill-extrusion-vertical-gradient': true,
    },
  });
  // clicking a 3D beacon behaves like clicking its pin
  map.on('click', 'property-3d', (e) => {
    if (e.features && e.features[0]) selectProperty(e.features[0].properties.id, { fly: true });
  });
  map.on('mouseenter', 'property-3d', () => { map.getCanvas().style.cursor = 'pointer'; });
  map.on('mouseleave', 'property-3d', () => { map.getCanvas().style.cursor = ''; });

  buildSidebar();
  buildMapControls();
  apply();
  applySun(); // initialise the time-of-day readout

  // hide loader once first tiles are in
  map.once('idle', () => {
    const l = document.getElementById('loading');
    l.style.opacity = '0';
    setTimeout(() => l.remove(), 400);
  });
  // safety: hide loader after 6s no matter what
  setTimeout(() => {
    const l = document.getElementById('loading');
    if (l) { l.style.opacity = '0'; setTimeout(() => l.remove(), 400); }
  }, 6000);

  toast('Tip: click a property pin to see details, the view and the listing.');
});

map.on('error', (e) => {
  // Tile/network errors shouldn't crash the app; log for debugging.
  if (e && e.error) console.warn('Map resource error:', e.error.message || e.error);
});

document.getElementById('sb-toggle').addEventListener('click', () => {
  const sb = document.getElementById('sidebar');
  sb.classList.toggle('open');
});
