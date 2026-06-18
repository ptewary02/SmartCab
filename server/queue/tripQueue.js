/*
  TRIP RETRY QUEUE — BullMQ
  ══════════════════════════
  DSA CONCEPT: Queue (FIFO)

  WHY A QUEUE HERE?
  ─────────────────
  When a rider requests a trip and no driver is available,
  we don't want to just return "no drivers" and give up.

  Instead:
  1. Add trip to a BullMQ queue with a 60s delay
  2. Worker picks it up after 60s
  3. Tries to match again — maybe a driver came online
  4. If matched → notify driver via socket
  5. If still no driver → retry up to 3 times, then cancel

  BullMQ is backed by Redis — same Redis instance we already have.
  It's a real FIFO queue with delay, retry, and backoff support.

  QUEUE vs ARRAY:
  Array.push/shift = O(1) but in-memory only — lost on restart
  BullMQ/Redis     = O(1) + persistent + distributed + delayed jobs
*/

import { Queue, Worker } from 'bullmq';
import Trip   from '../models/Trip.js';
import Driver from '../models/Driver.js';
import redis  from '../config/redis.js';
import MinHeap from '../dsa/minHeap.js';

// Parse Redis URL for BullMQ connection config
const getRedisConnection = () => {
  const url = process.env.REDIS_URL;
  if (!url) return { host: 'localhost', port: 6379 };

  try {
    const parsed = new URL(url);
    return {
      host:     parsed.hostname,
      port:     parseInt(parsed.port) || 6380,
      password: parsed.password || undefined,
      tls:      url.startsWith('rediss://') ? {} : undefined,
    };
  } catch {
    return { host: 'localhost', port: 6379 };
  }
};

const connection = getRedisConnection();

// ── Create the queue ─────────────────────────────────────────────
const tripQueue = new Queue('trip-matching', { connection });

// ── Add a trip to the retry queue ────────────────────────────────
export const addTripToQueue = async (tripId, pickup) => {
  await tripQueue.add(
    'retry-match',
    { tripId, pickup },
    {
      delay:    60_000,   // wait 60 seconds before retrying
      attempts: 3,        // max 3 total attempts
      backoff:  { type: 'exponential', delay: 30_000 }, // 30s, 60s, 120s
    }
  );
  console.log(`Trip ${tripId} added to retry queue`);
};

// ── Worker: processes queued trips ───────────────────────────────
let _io = null;
export const setQueueIO = (io) => { _io = io; };

const worker = new Worker(
  'trip-matching',
  async (job) => {
    const { tripId, pickup } = job.data;
    console.log(`Queue processing trip: ${tripId} | attempt: ${job.attemptsMade + 1}`);

    // Check trip is still in "requested" state
    const trip = await Trip.findById(tripId);
    if (!trip || trip.status !== 'requested') {
      console.log(`Trip ${tripId} no longer needs matching — skipping`);
      return;
    }

    // Try finding a driver again
    const geoResults = await redis.georadius(
      'driver:locations',
      pickup.lng, pickup.lat,
      8, 'km',
      'WITHDIST', 'ASC', 'COUNT', 10
    );

    if (!geoResults.length) {
      console.log(`Trip ${tripId} — still no drivers nearby`);
      // If this was the last attempt, cancel the trip
      if (job.attemptsMade >= 2) {
        trip.status = 'cancelled';
        await trip.save();
        if (_io) {
          _io.to(`user:${trip.riderId}`).emit('trip:noDriversAvailable', {
            tripId,
            message: 'No drivers available in your area. Please try again.',
          });
        }
      }
      throw new Error('No drivers found'); // triggers BullMQ retry
    }

    // Driver found — rank with heap and notify best one
    const distanceMap = {};
    geoResults.forEach(([userId, dist]) => {
      distanceMap[userId] = parseFloat(dist);
    });

    const drivers = await Driver.find({
      userId:      { $in: Object.keys(distanceMap) },
      isAvailable: true,
    }).populate('userId', 'name rating');

    if (!drivers.length) throw new Error('No available drivers');

    const heap = new MinHeap((a, b) => a.score - b.score);
    drivers.forEach((d) => {
      const dist  = distanceMap[d.userId._id.toString()] ?? 99;
      const score = 0.5 * dist + 0.3 * (5 / (d.userId.rating ?? 5));
      heap.insert({ driver: d, score });
    });

    const best = heap.extractMin()?.driver;
    if (!best) throw new Error('Heap extraction failed');

    if (_io) {
      _io.to(`user:${best.userId._id}`).emit('trip:newRequest', {
        tripId:    trip._id,
        pickup:    trip.pickup,
        destination: trip.destination,
        message:   'Retry match — new rider nearby!',
      });
    }

    console.log(`Trip ${tripId} → retry matched driver ${best.userId._id}`);
  },
  { connection }
);

worker.on('completed', (job) => console.log(`Queue job ${job.id} completed`));
worker.on('failed',    (job, err) => console.log(`Queue job ${job.id} failed: ${err.message}`));

export default tripQueue;