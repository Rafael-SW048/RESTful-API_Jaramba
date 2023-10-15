const mongoose = require('mongoose');

const fleetSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  licencePlate: String,
  type: String,
  route: {
    start: String,
    finish: String,
  },
  routeNumber: Number,
  active: Boolean,
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the 'User' model for drivers
  },
});

module.exports = mongoose.model('Fleet', fleetSchema);