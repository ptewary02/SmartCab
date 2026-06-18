import express from 'express';
import { computeRoute } from '../controllers/route.controller.js';
import { protect }      from '../middleware/auth.middleware.js';

const router = express.Router();

// POST /api/route  { pickup: {lat,lng}, destination: {lat,lng} }
router.post('/', protect, computeRoute);

export default router;

/*
  POST /api/route
  ───────────────
  Body: {
    pickup:      { lat: Number, lng: Number },
    destination: { lat: Number, lng: Number }
  }

  Response: {
    success: true,
    route: {
      path:            [geohash, geohash, ...],
      distanceKm:      Number,
      etaMinutes:      Number,
      fareEstimate:    Number,   // in ₹
      surgeMultiplier: Number,
      fromHash:        String,
      toHash:          String,
    },
    fromCache: Boolean,
    cacheSize: Number
  }
*/
