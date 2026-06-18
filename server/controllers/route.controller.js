import ngeohash  from 'ngeohash';
import dijkstra  from '../dsa/dijkstra.js';
import LRUCache  from '../dsa/lruCache.js';
import { cityGraph, getSurgeMultiplier } from '../dsa/geohash.js';
import redis     from '../config/redis.js';

/*
  Route-level LRU cache
  ─────────────────────
  capacity : 200 routes in memory
  Each entry: { path, distanceKm, etaMinutes, fareEstimate }

  When the same pickup→destination pair is requested again,
  Dijkstra is skipped entirely — O(1) cache lookup instead.

  This is a module-level singleton — shared across all requests.
*/
const routeCache = new LRUCache(200);

// POST /api/route
// Body: { pickup: { lat, lng }, destination: { lat, lng } }
export const computeRoute = async (req, res) => {
  try {
    const { pickup, destination } = req.body;

    // Validate input
    if (!pickup?.lat || !pickup?.lng || !destination?.lat || !destination?.lng) {
      return res.status(400).json({
        success: false,
        message: 'pickup and destination must have lat and lng',
      });
    }

    // ── Step 1: Encode pickup + destination to geohash ────────────
    // precision 6 = ~1km² cell — good balance for routing granularity
    const fromHash = ngeohash.encode(pickup.lat,      pickup.lng,      6);
    const toHash   = ngeohash.encode(destination.lat, destination.lng, 6);

    // Build cache key from the two geohashes
    const cacheKey = `${fromHash}:${toHash}`;

    // ── Step 2: Check LRU cache first ─────────────────────────────
    const cached = routeCache.get(cacheKey);
    if (cached) {
      console.log(`Cache HIT: ${cacheKey}`);
      return res.json({
        success:   true,
        route:     cached,
        fromCache: true,
        cacheSize: routeCache.getSize(),
      });
    }

    console.log(`Cache MISS: ${cacheKey} — running Dijkstra`);

    // ── Step 3: Run Dijkstra on the city road graph ───────────────
    const result = dijkstra(cityGraph, fromHash, toHash);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: `No route found between ${fromHash} and ${toHash}. Nodes may not be in the city graph yet.`,
        tip: 'Add more nodes to cityGraph in dsa/geohash.js',
      });
    }

    // ── Step 4: Calculate ETA and fare ───────────────────────────
    const AVG_SPEED_KMH = 25;   // city avg speed (traffic considered)
    const BASE_FARE     = 30;   // ₹30 base fare
    const PER_KM_RATE   = 12;   // ₹12 per km
    const PER_MIN_RATE  = 1.5;  // ₹1.5 per minute

    const etaMinutes = Math.ceil((result.distance / AVG_SPEED_KMH) * 60);

    // Check surge: count active drivers in pickup geohash cell
    const driversInZone = await redis.zcount('driver:locations', '-inf', '+inf');
    const surge         = getSurgeMultiplier(driversInZone);

    const fareEstimate  = Math.round(
      (BASE_FARE + result.distance * PER_KM_RATE + etaMinutes * PER_MIN_RATE) * surge
    );

    const route = {
      fromHash,
      toHash,
      path:        result.path,
      distanceKm:  result.distance,
      etaMinutes,
      fareEstimate,
      surgeMultiplier: surge,
      pickup:      { lat: pickup.lat,      lng: pickup.lng },
      destination: { lat: destination.lat, lng: destination.lng },
    };

    // ── Step 5: Store in LRU cache ────────────────────────────────
    routeCache.set(cacheKey, route);
    console.log(`Cached route: ${cacheKey} | dist: ${result.distance}km | ETA: ${etaMinutes}min`);

    res.json({
      success:   true,
      route,
      fromCache: false,
      cacheSize: routeCache.getSize(),
    });

  } catch (err) {
    console.error('computeRoute error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};