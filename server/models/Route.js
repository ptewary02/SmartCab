import mongoose from 'mongoose';

// Stores computed routes — used by LRU cache to persist popular paths
const routeSchema = new mongoose.Schema(
  {
    fromHash: { type: String, required: true }, // geohash of pickup
    toHash:   { type: String, required: true }, // geohash of destination
    path:         { type: Array,  default: [] },
    distanceKm:   { type: Number, required: true },
    etaMinutes:   { type: Number, required: true },
    usageCount:   { type: Number, default: 1 },
  },
  { timestamps: true }
);

routeSchema.index({ fromHash: 1, toHash: 1 }, { unique: true });

const Route = mongoose.model('Route', routeSchema);
export default Route;