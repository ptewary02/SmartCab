import Trip   from '../models/Trip.js';
import Driver from '../models/Driver.js';
import User   from '../models/User.js';
import redis  from '../config/redis.js';
import MinHeap from '../dsa/minHeap.js';
import { calculateFare } from '../utils/fareCalculator.js';
import { addTripToQueue } from '../queue/tripQueue.js';

/*
  TRIP STATE MACHINE
  ══════════════════
  requested → accepted → ongoing → completed
       ↓           ↓        ↓
    cancelled  cancelled  cancelled

  Each state transition is a separate PATCH endpoint.
  The controller validates the current state before allowing
  a transition — prevents invalid state jumps.
*/

// Shared io instance — set once from index.js
let _io = null;
export const setIO = (io) => { _io = io; };

// ── Helper: find best available driver near pickup ────────────────
const findBestDriver = async (pickupLat, pickupLng, radiusKm = 8) => {
  // GEORADIUS from Redis — same as Week 2
  const geoResults = await redis.georadius(
    'driver:locations',
    pickupLng, pickupLat,
    radiusKm, 'km',
    'WITHDIST', 'ASC', 'COUNT', 10
  );

  if (!geoResults.length) return null;

  const distanceMap = {};
  geoResults.forEach(([userId, dist]) => {
    distanceMap[userId] = parseFloat(dist);
  });

  const drivers = await Driver.find({
    userId:      { $in: Object.keys(distanceMap) },
    isAvailable: true,
  }).populate('userId', 'name rating');

  if (!drivers.length) return null;

  // Min-heap ranking — same scoring as Week 2
  const heap = new MinHeap((a, b) => a.score - b.score);
  drivers.forEach((d) => {
    const dist   = distanceMap[d.userId._id.toString()] ?? 99;
    const rating = d.userId.rating ?? 5;
    const score  = 0.5 * dist + 0.3 * (5 / rating);
    heap.insert({ driver: d, score });
  });

  return heap.extractMin()?.driver || null;
};

// ── POST /api/trips ───────────────────────────────────────────────
// Rider requests a ride
export const requestTrip = async (req, res) => {
  try {
    const { pickup, destination } = req.body;

    if (!pickup?.lat || !pickup?.lng || !destination?.lat || !destination?.lng) {
      return res.status(400).json({
        success: false,
        message: 'pickup and destination with lat/lng are required',
      });
    }

    // Create trip in DB with status "requested"
    const trip = await Trip.create({
      riderId: req.user._id,
      pickup,
      destination,
      status: 'requested',
    });

    // Find best nearby driver immediately
    const bestDriver = await findBestDriver(pickup.lat, pickup.lng);

    if (bestDriver) {
      // Notify the best driver via socket
      if (_io) {
        _io.to(`user:${bestDriver.userId._id}`).emit('trip:newRequest', {
          tripId:      trip._id,
          pickup:      trip.pickup,
          destination: trip.destination,
          riderName:   req.user.name,
        });
      }
      console.log(`Trip ${trip._id} → notified driver ${bestDriver.userId._id}`);
    } else {
      // No driver available — add to retry queue
      await addTripToQueue(trip._id.toString(), pickup);
      console.log(`Trip ${trip._id} → no drivers, added to queue`);
    }

    res.status(201).json({ success: true, trip });
  } catch (err) {
    console.error('requestTrip error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/trips/:id/accept ───────────────────────────────────
// Driver accepts the trip
export const acceptTrip = async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user._id })
      .populate('userId', 'name rating');

    if (!driver)
      return res.status(404).json({ success: false, message: 'Driver profile not found' });

    const trip = await Trip.findById(req.params.id);
    if (!trip)
      return res.status(404).json({ success: false, message: 'Trip not found' });
    if (trip.status !== 'requested')
      return res.status(400).json({ success: false, message: 'Trip is no longer available' });

    // Transition: requested → accepted
    trip.driverId = driver._id;
    trip.status   = 'accepted';
    await trip.save();

    // Mark driver as unavailable
    driver.isAvailable = false;
    await driver.save();

    // Notify rider via socket
    if (_io) {
      _io.to(`user:${trip.riderId}`).emit('trip:accepted', {
        tripId: trip._id,
        driver: {
          name:        driver.userId.name,
          rating:      driver.userId.rating,
          vehicleType: driver.vehicleType,
          location:    driver.location,
        },
      });
    }

    res.json({ success: true, trip });
  } catch (err) {
    console.error('acceptTrip error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/trips/:id/start ────────────────────────────────────
// Driver picks up the rider — trip begins
export const startTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip)
      return res.status(404).json({ success: false, message: 'Trip not found' });
    if (trip.status !== 'accepted')
      return res.status(400).json({ success: false, message: 'Trip must be accepted before starting' });

    // Transition: accepted → ongoing
    trip.status    = 'ongoing';
    trip.startedAt = new Date();
    await trip.save();

    // Notify rider
    if (_io) {
      _io.to(`user:${trip.riderId}`).emit('trip:started', {
        tripId:    trip._id,
        startedAt: trip.startedAt,
      });
    }

    res.json({ success: true, trip });
  } catch (err) {
    console.error('startTrip error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/trips/:id/complete ────────────────────────────────
// Driver marks trip as complete
export const completeTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).populate('driverId');
    if (!trip)
      return res.status(404).json({ success: false, message: 'Trip not found' });
    if (trip.status !== 'ongoing')
      return res.status(400).json({ success: false, message: 'Trip is not ongoing' });

    // Calculate final fare from route data
    const fare = calculateFare(
      trip.route?.distanceKm || 3,
      trip.route?.etaMinutes || 10
    );

    // Transition: ongoing → completed
    trip.status      = 'completed';
    trip.completedAt = new Date();
    trip.fare        = fare;
    await trip.save();

    // Update driver stats + make available again
    const driver = await Driver.findById(trip.driverId);
    if (driver) {
      driver.isAvailable   = true;
      driver.totalTrips    += 1;
      driver.totalEarnings += fare;
      await driver.save();

      // Remove from Redis geo (will re-add when next location update comes)
      await redis.zrem('driver:locations', driver.userId.toString());
    }

    // Notify both rider and driver
    if (_io) {
      _io.to(`user:${trip.riderId}`).emit('trip:completed', {
        tripId: trip._id,
        fare,
      });
    }

    res.json({ success: true, trip, fare });
  } catch (err) {
    console.error('completeTrip error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/trips/:id/cancel ──────────────────────────────────
export const cancelTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip)
      return res.status(404).json({ success: false, message: 'Trip not found' });
    if (['completed', 'cancelled'].includes(trip.status))
      return res.status(400).json({ success: false, message: 'Cannot cancel this trip' });

    const prevStatus = trip.status;
    trip.status = 'cancelled';
    await trip.save();

    // Free up driver if they had accepted
    if (trip.driverId && prevStatus === 'accepted') {
      await Driver.findByIdAndUpdate(trip.driverId, { isAvailable: true });
    }

    // Notify the other party
    if (_io) {
      const cancelledBy = req.user.role;
      if (cancelledBy === 'rider' && trip.driverId) {
        _io.to(`user:${trip.driverId}`).emit('trip:cancelled', {
          tripId: trip._id, by: 'rider',
        });
      } else {
        _io.to(`user:${trip.riderId}`).emit('trip:cancelled', {
          tripId: trip._id, by: 'driver',
        });
      }
    }

    res.json({ success: true, trip });
  } catch (err) {
    console.error('cancelTrip error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/trips/:id/rate ────────────────────────────────────
export const rateTrip = async (req, res) => {
  try {
    const { rating, ratingFor } = req.body; // ratingFor: 'driver' | 'rider'

    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });

    const trip = await Trip.findById(req.params.id);
    if (!trip || trip.status !== 'completed')
      return res.status(400).json({ success: false, message: 'Can only rate completed trips' });

    if (ratingFor === 'driver') {
      trip.driverRating = rating;
      const driver = await Driver.findById(trip.driverId);
      if (driver) {
        // Rolling average
        driver.rating = parseFloat(
          ((driver.rating * driver.totalTrips + rating) / (driver.totalTrips + 1)).toFixed(2)
        );
        await driver.save();
      }
    } else {
      trip.riderRating = rating;
      const rider = await User.findById(trip.riderId);
      if (rider) {
        rider.rating = parseFloat(((rider.rating + rating) / 2).toFixed(2));
        await rider.save();
      }
    }

    await trip.save();
    res.json({ success: true, trip });
  } catch (err) {
    console.error('rateTrip error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/trips/mine ──────────────────────────────────────────
export const getMyTrips = async (req, res) => {
  try {
    const filter = req.user.role === 'rider'
      ? { riderId:  req.user._id }
      : { driverId: req.user._id };

    const trips = await Trip.find(filter)
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('riderId',  'name rating')
      .populate('driverId', 'vehicleType licensePlate');

    res.json({ success: true, trips, count: trips.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};