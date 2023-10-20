const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  username: { type: String, required: true },
  password: { type: String, required: true },
  nama: { type: String, required: true },
  umur: { type: Number, required: true },
  roles: [{ type: String, required: true }],
  boundedFleets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fleet', // Reference to the 'Fleet' model for bounded fleets
  }],
  active: { type: Boolean, required: true, default: false },

});

module.exports = mongoose.model('User', userSchema);
