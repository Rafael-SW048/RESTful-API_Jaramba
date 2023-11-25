const mongoose = require('mongoose');

const fleetSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    default: mongoose.Types.ObjectId,
  },
  licencePlate: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  route: {
    start: {
      type: String,
      required: true,
    },
    finish: {
      type: String,
      required: true,
    },
  },
  routeNumber: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    validate: {
      validator: async function(v) {
        const fleet = this.parent();
        const driver = await mongoose.model('User').findOne({ _id: v, role: 'driver', active: true });
        return !!driver && fleet.active;
      },
      message: 'Driver ID must reference a user role "driver", an active driver, and the fleet must be active',
    },
  },
});

module.exports = mongoose.model('Fleet', fleetSchema);