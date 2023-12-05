const mongoose = require('mongoose');

const RevokedTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '14d'  // this will automatically remove the document after 14 days
  }
});

module.exports = mongoose.model('RevokedToken', RevokedTokenSchema);