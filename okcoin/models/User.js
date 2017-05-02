const mongoose = require('mongoose');

module.exports = mongoose.model('User', new mongoose.Schema({
  name: String,
  password: String,
  apiKey: String,
  secretKey: String,
  simulate: {
    type: Boolean,
    default: false
  }
}));
