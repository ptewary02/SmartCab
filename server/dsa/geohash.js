import ngeohash from 'ngeohash';

/*
  GEOHASH UTILITIES
  ──────────────────
  Used by:
  - socket.handler.js  → encode driver location → Redis GEOADD
  - route.controller   → encode pickup/dest → LRU cache key
  - driver.controller  → GEORADIUS nearby lookup
*/

export const encode = (lat, lng, precision = 6) =>
  ngeohash.encode(lat, lng, precision);

export const decode = (hash) => {
  const { latitude, longitude } = ngeohash.decode(hash);
  return { lat: latitude, lng: longitude };
};

export const getBounds = (hash) => {
  const b = ngeohash.decode_bbox(hash);
  return { minlat: b[0], minlon: b[1], maxlat: b[2], maxlon: b[3] };
};

export const getNeighbours = (hash) =>
  [hash, ...ngeohash.neighbors(hash)];

// Surge pricing based on driver density in a geohash cell
export const getSurgeMultiplier = (driversInCell) => {
  if (driversInCell >= 15) return 1.0;
  if (driversInCell >= 8)  return 1.2;
  if (driversInCell >= 4)  return 1.5;
  if (driversInCell >= 2)  return 1.8;
  return 2.5;
};

/*
  CITY ROAD GRAPH — Gorakhpur, UP (mock data)
  ════════════════════════════════════════════
  Nodes  = geohash cells (6-char precision, ~1km² each)
  Edges  = [ neighbourHash, distanceKm ]

  Real node names mapped to Gorakhpur landmarks:
    tug21p → Gorakhpur Railway Station area  (your driver's location!)
    tug21r → Medical College Chowk
    tug21q → Ghanta Ghar (Clock Tower)
    tug216 → Rapti Nagar
    tug20z → Rustampur
    tug21n → Golghar
    tug21j → Bus Stand (Kachheri)
    tug21m → Padri Bazar
    tug21k → Taramandal
    tug218 → Basharatpur

  In production replace with OpenStreetMap road data.
  See: https://www.openstreetmap.org
*/
export const cityGraph = {
  'tug21p': [['tug21r', 1.4], ['tug21q', 2.1], ['tug21n', 1.8], ['tug21t', 2.5]],
  'tug21r': [['tug21p', 1.4], ['tug216', 2.3], ['tug21q', 1.1]],
  'tug21q': [['tug21p', 2.1], ['tug21r', 1.1], ['tug20z', 3.2], ['tug21n', 1.5]],
  'tug216': [['tug21r', 2.3], ['tug20z', 1.8], ['tug21j', 4.1]],
  'tug20z': [['tug21q', 3.2], ['tug216', 1.8], ['tug21n', 2.0]],
  'tug21n': [['tug21p', 1.8], ['tug21q', 1.5], ['tug20z', 2.0], ['tug21j', 2.8], ['tug21t', 1.9]],
  'tug21j': [['tug216', 4.1], ['tug21n', 2.8], ['tug21m', 1.2], ['tug21k', 3.5], ['tug21t', 2.2]],
  'tug21m': [['tug21j', 1.2], ['tug21k', 2.1], ['tug218', 1.9]],
  'tug21k': [['tug21j', 3.5], ['tug21m', 2.1], ['tug218', 1.3]],
  'tug218': [['tug21m', 1.9], ['tug21k', 1.3], ['tug21n', 3.1]],
  'tug21t': [['tug21p', 2.5], ['tug21n', 1.9], ['tug21j', 2.2]],  
};