import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema(
  {
    riderId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },

    status: {
      type: String,
      enum: ['requested', 'accepted', 'ongoing', 'completed', 'cancelled'],
      default: 'requested',
    },

    pickup: {
      address: String,
      lat:     Number,
      lng:     Number,
    },
    destination: {
      address: String,
      lat:     Number,
      lng:     Number,
    },

    route: {
      path:        { type: Array,  default: [] },  // array of {lat,lng} waypoints
      distanceKm:  { type: Number, default: 0 },
      etaMinutes:  { type: Number, default: 0 },
    },

    fare:       { type: Number, default: 0 },
    riderRating:  { type: Number, default: null },
    driverRating: { type: Number, default: null },

    startedAt:   { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Trip = mongoose.model('Trip', tripSchema);
export default Trip;