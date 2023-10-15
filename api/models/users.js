const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  username: String,
  password: String,
  nama: String,
  umur: Number,
  roles: [String],
  boundedFleets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fleet', // Reference to the 'Fleet' model for bounded fleets
  }],
  active: Boolean,
});

module.exports = mongoose.model('User', userSchema);
