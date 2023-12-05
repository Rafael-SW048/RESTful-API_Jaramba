const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, require: true, unique: true}, 
  name: { type: String, required: true },
  age: { type: Number, required: true },
  roles: [{ type: String, required: true }],
  boundedFleets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fleet', // Reference to the 'Fleet' model for bounded fleets
  }],
  active: { type: Boolean, required: true, default: false },
  refreshToken: {
    type: String,
    default: null,
  },
});

module.exports = mongoose.model('User', userSchema);
