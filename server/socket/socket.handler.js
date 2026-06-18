import redis    from '../config/redis.js';
import Driver   from '../models/Driver.js';
import Trip     from '../models/Trip.js';
import ngeohash from 'ngeohash';

/*
  SOCKET ROOMS EXPLAINED
  ══════════════════════
  We use TWO types of rooms:

  1. user:{userId}  — personal room, joined on connect
     → Used to notify a specific user (driver gets ride request,
       rider gets acceptance notification)

  2. trip:{tripId}  — shared room, joined when trip is active
     → Used to broadcast live location to both rider + driver
     → Only people in this room receive location updates

  WHY ROOMS INSTEAD OF DIRECT EMIT?
  If we stored socket IDs and emitted directly, we'd break
  whenever a user reconnects (new socket ID). Rooms are
  persistent by userId — reconnecting re-joins the same room.
*/

export const initSocket = (io) => {

  // ── Auth middleware ──────────────────────────────────────────────
  io.use((socket, next) => {
    const userId = socket.handshake.auth?.userId;
    if (!userId) return next(new Error('Auth required'));
    socket.userId = userId;
    next();
  });

  io.on('connection', (socket) => {
    console.log(`✅ Connected: ${socket.id} | user: ${socket.userId}`);

    // ── Join personal room on connect ────────────────────────────
    // Every user joins user:{their_id} — enables targeted notifications
    socket.join(`user:${socket.userId}`);
    console.log(`Joined personal room: user:${socket.userId}`);

    // ── EVENT: driver:updateLocation ─────────────────────────────
    // Fired by useDriverLocation hook every 3 seconds
    socket.on('driver:updateLocation', async ({ lat, lng }) => {
      try {
        const geohash = ngeohash.encode(lat, lng, 6);

        // Update Redis geo set
        await redis.geoadd('driver:locations', lng, lat, socket.userId);

        // Persist to MongoDB
        await Driver.findOneAndUpdate(
          { userId: socket.userId },
          {
            'location.lat':     lat,
            'location.lng':     lng,
            'location.geohash': geohash,
          }
        );

        // If in active trip — broadcast location to trip room
        const driver = await Driver.findOne({ userId: socket.userId }).select('_id');
        if (driver) {
          const activeTrip = await Trip.findOne({
            driverId: driver._id,
            status:   { $in: ['accepted', 'ongoing'] },
          }).select('_id riderId');

          if (activeTrip) {
            // Broadcast to trip room — rider's map updates
            io.to(`trip:${activeTrip._id}`).emit('driver:locationUpdate', {
              lat, lng, geohash,
              timestamp: Date.now(),
            });
          }
        }
      } catch (err) {
        console.error('driver:updateLocation error:', err.message);
      }
    });

    // ── EVENT: driver:goOffline ──────────────────────────────────
    socket.on('driver:goOffline', async () => {
      try {
        await redis.zrem('driver:locations', socket.userId);
        await Driver.findOneAndUpdate(
          { userId: socket.userId },
          { isAvailable: false }
        );
        console.log(`Driver ${socket.userId} went offline`);
      } catch (err) {
        console.error('driver:goOffline error:', err.message);
      }
    });

    // ── EVENT: trip:join ─────────────────────────────────────────
    // Called by BOTH rider and driver after trip is accepted
    // Enables live location broadcast to both parties
    socket.on('trip:join', ({ tripId }) => {
      socket.join(`trip:${tripId}`);
      console.log(`${socket.userId} joined trip room: trip:${tripId}`);
      // Confirm to client
      socket.emit('trip:joined', { tripId });
    });

    // ── EVENT: trip:leave ────────────────────────────────────────
    socket.on('trip:leave', ({ tripId }) => {
      socket.leave(`trip:${tripId}`);
      console.log(`${socket.userId} left trip room: trip:${tripId}`);
    });

    // ── EVENT: trip:driverAccepted ───────────────────────────────
    // Driver emits this after accepting — rider gets notified
    socket.on('trip:driverAccepted', ({ tripId, driverInfo }) => {
      io.to(`trip:${tripId}`).emit('trip:accepted', { driverInfo });
    });

    // ── EVENT: trip:driverStarted ────────────────────────────────
    socket.on('trip:driverStarted', ({ tripId }) => {
      io.to(`trip:${tripId}`).emit('trip:started', {
        startedAt: Date.now(),
      });
    });

    // ── EVENT: trip:driverCompleted ──────────────────────────────
    socket.on('trip:driverCompleted', ({ tripId, fare }) => {
      io.to(`trip:${tripId}`).emit('trip:completed', { fare });
    });

    // ── EVENT: ping ──────────────────────────────────────────────
    // Heartbeat — client sends ping every 25s to keep connection alive
    socket.on('ping', () => socket.emit('pong'));

    // ── Disconnect cleanup ───────────────────────────────────────
    socket.on('disconnect', async (reason) => {
      try {
        await redis.zrem('driver:locations', socket.userId);
        console.log(`❌ Disconnected: ${socket.id} | reason: ${reason}`);
      } catch (err) {
        console.error('Disconnect cleanup error:', err.message);
      }
    });
  });
};