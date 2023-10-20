const mongoose = require('mongoose');

const fleetLocationSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  fleetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fleet', // Reference to the 'Fleet' model for the associated fleet
    required: true,
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the 'User' model for drivers
    required: true,
    validate: {
      validator: async function(v) {
        const user = await mongoose.model('User').findById(v);
        return user && user.role === 'driver';
      },
      message: 'Driver ID must reference a user with role "driver"',
    },
  },
  location: {
    lat: { type: String, required: true },
    lon: { type: String, required: true },
  },
  expireTime: {
    type: Date,
    default: null,
  },
  timestamp: { type: String, required: true },
});

module.exports = mongoose.model('FleetLocation', fleetLocationSchema);
