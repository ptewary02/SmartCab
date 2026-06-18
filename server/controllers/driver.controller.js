// import Driver from '../models/Driver.js';
// import redis   from '../config/redis.js';
// import ngeohash from 'ngeohash';
// import MinHeap  from '../dsa/minHeap.js';

// // POST /api/drivers
// export const createDriverProfile = async (req, res) => {
//   try {
//     const exists = await Driver.findOne({ userId: req.user._id });
//     if (exists) return res.status(400).json({ success: false, message: 'Driver profile already exists' });

//     const { licensePlate, vehicleType } = req.body;
//     const driver = await Driver.create({ userId: req.user._id, licensePlate, vehicleType });
//     res.status(201).json({ success: true, driver });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // GET /api/drivers/me
// export const getDriverProfile = async (req, res) => {
//   try {
//     const driver = await Driver.findOne({ userId: req.user._id }).populate('userId', 'name email phone rating');
//     if (!driver) return res.status(404).json({ success: false, message: 'Driver profile not found' });
//     res.json({ success: true, driver });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // PATCH /api/drivers/toggle
// export const toggleAvailability = async (req, res) => {
//   try {
//     const driver = await Driver.findOne({ userId: req.user._id });
//     driver.isAvailable = !driver.isAvailable;
//     await driver.save();
//     res.json({ success: true, isAvailable: driver.isAvailable });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // GET /api/drivers/nearby?lat=&lng=&radius=5
// export const getNearbyDrivers = async (req, res) => {
//   try {
//     const { lat, lng, radius = 5 } = req.query;
//     if (!lat || !lng) return res.status(400).json({ success: false, message: 'lat and lng are required' });

//     // Redis GEORADIUS — returns driver IDs within radius km
//     const results = await redis.georadius(
//       'driver:locations', lng, lat, radius, 'km',
//       'WITHCOORD', 'WITHDIST', 'ASC', 'COUNT', 20
//     );

//     if (!results.length) return res.json({ success: true, drivers: [] });

//     const driverIds = results.map((r) => r[0]);
//     const distances = Object.fromEntries(results.map((r) => [r[0], parseFloat(r[1])]));

//     const drivers = await Driver.find({
//       userId: { $in: driverIds },
//       isAvailable: true,
//     }).populate('userId', 'name rating');

//     // Rank with min-heap: score = 0.5*dist + 0.3*(1/rating) + 0.2*waitFactor
//     const heap = new MinHeap((a, b) => a.score - b.score);
//     drivers.forEach((d) => {
//       const dist   = distances[d.userId._id.toString()] || 99;
//       const rating = d.userId.rating || 5;
//       const score  = 0.5 * dist + 0.3 * (1 / rating);
//       heap.insert({ driver: d, score });
//     });

//     const ranked = [];
//     while (!heap.isEmpty()) ranked.push(heap.extractMin().driver);

//     res.json({ success: true, drivers: ranked });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


import Driver   from '../models/Driver.js';
import redis    from '../config/redis.js';
import MinHeap  from '../dsa/minHeap.js';

// POST /api/drivers — create driver profile
export const createDriverProfile = async (req, res) => {
  try {
    const exists = await Driver.findOne({ userId: req.user._id });
    if (exists)
      return res.status(400).json({ success: false, message: 'Profile already exists' });

    const { licensePlate, vehicleType } = req.body;
    const driver = await Driver.create({
      userId: req.user._id,
      licensePlate,
      vehicleType: vehicleType || 'mini',
    });
    res.status(201).json({ success: true, driver });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/drivers/me
export const getDriverProfile = async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user._id })
      .populate('userId', 'name email phone rating');
    if (!driver)
      return res.status(404).json({ success: false, message: 'Driver not found' });
    res.json({ success: true, driver });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/drivers/toggle — online / offline toggle
export const toggleAvailability = async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver)
      return res.status(404).json({ success: false, message: 'Driver not found' });

    driver.isAvailable = !driver.isAvailable;
    await driver.save();

    // If going offline, remove from Redis geo set immediately
    if (!driver.isAvailable) {
      await redis.zrem('driver:locations', req.user._id.toString());
    }

    res.json({ success: true, isAvailable: driver.isAvailable });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/drivers/nearby?lat=28.61&lng=77.20&radius=5
// STEP 3 + 4: GEORADIUS lookup → min-heap ranking
export const getNearbyDrivers = async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query;

    if (!lat || !lng)
      return res.status(400).json({ success: false, message: 'lat and lng required' });

    // ── STEP 3: Redis GEORADIUS ────────────────────────────────────
    // Returns: [ [userId, distanceKm, [lng, lat]], ... ]
    const geoResults = await redis.georadius(
      'driver:locations',
      parseFloat(lng),
      parseFloat(lat),
      parseFloat(radius),
      'km',
      'WITHCOORD',
      'WITHDIST',
      'ASC',
      'COUNT', 20
    );

    if (!geoResults.length)
      return res.json({ success: true, drivers: [], count: 0 });

    // Build a distance map: { userId: distKm }
    const distanceMap = {};
    geoResults.forEach(([userId, dist]) => {
      distanceMap[userId] = parseFloat(dist);
    });

    const userIds = Object.keys(distanceMap);

    // Fetch driver documents for those IDs
    const drivers = await Driver.find({
      userId:      { $in: userIds },
      isAvailable: true,
    }).populate('userId', 'name rating avatar');

    // ── STEP 4: Min-Heap ranking ───────────────────────────────────
    // Score formula: lower = better match
    //   50% distance weight
    //   30% inverse rating (lower rating = higher penalty)
    //   20% random wait jitter (replace with real queue depth later)
    const heap = new MinHeap((a, b) => a.score - b.score);

    drivers.forEach((d) => {
      const dist   = distanceMap[d.userId._id.toString()] ?? 99;
      const rating = d.userId.rating ?? 5;
      const score  = 0.5 * dist + 0.3 * (5 / rating) + 0.2 * Math.random();
      heap.insert({ driver: d, score: parseFloat(score.toFixed(3)), distKm: dist });
    });

    // Extract in ranked order (best first)
    const ranked = [];
    while (!heap.isEmpty()) {
      const { driver, score, distKm } = heap.extractMin();
      ranked.push({
        driverId:    driver._id,
        userId:      driver.userId._id,
        name:        driver.userId.name,
        rating:      driver.userId.rating,
        vehicleType: driver.vehicleType,
        distKm,
        score,
        location:    driver.location,
      });
    }

    res.json({ success: true, drivers: ranked, count: ranked.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};