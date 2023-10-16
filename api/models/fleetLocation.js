const mongoose = require('mongoose');

const fleetLocationSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  fleetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fleet', // Reference to the 'Fleet' model for the associated fleet
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the 'User' model for drivers (if applicable)
  },
  location: {
    lat: String,
    lon: String,
  },
  expireAt: { type: Date, default: Date.now, index: { expires: '60s' } }, // Expires in 60 seconds
  timestamp: String,
});

module.exports = mongoose.model('FleetLocation', fleetLocationSchema);
