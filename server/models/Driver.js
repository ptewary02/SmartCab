import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    vehicleType:  { type: String, enum: ['bike', 'auto', 'mini', 'sedan', 'suv'], default: 'mini' },
    licensePlate: { type: String, required: true, uppercase: true },
    isAvailable:  { type: Boolean, default: false },
    isVerified:   { type: Boolean, default: false },

    // Live location — updated via Socket.io every 3s
    location: {
      lat:     { type: Number, default: 0 },
      lng:     { type: Number, default: 0 },
      geohash: { type: String, default: '' },
    },

    totalTrips:    { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    rating:        { type: Number, default: 5.0 },
  },
  { timestamps: true }
);

// Index on geohash for fast nearby lookups
driverSchema.index({ 'location.geohash': 1 });
driverSchema.index({ isAvailable: 1 });

const Driver = mongoose.model('Driver', driverSchema);
export default Driver;