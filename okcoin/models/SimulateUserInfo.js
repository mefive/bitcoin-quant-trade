const mongoose = require('mongoose');

module.exports = mongoose.model('SimulateUserInfo', new mongoose.Schema({
  asset: {
    total: {
      type: Number,
      default: 10000      
    }
  },
  free: {
    btc: {
      type: Number,
      default: 0
    },
    cny: {
      type: Number,
      default: 10000
    }
  },
  freezed: {
    btc: {
      type: Number,
      default: 0
    },
    cny: {
      type: Number,
      default: 0
    }
  },
  name: String,
  uid: String
}));
