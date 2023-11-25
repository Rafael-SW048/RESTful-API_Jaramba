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
  },
  location: {
    lat: { type: String, required: true },
    lon: { type: String, required: true },
  },
  timestamp: { type: String, required: true },
});

module.exports = mongoose.model('FleetLocation', fleetLocationSchema);
