import mongoose from 'mongoose';

export default mongoose.model('SimulateUserInfo', new mongoose.Schema({
  asset: {
    total: {
      type: Number,
      default: 1000      
    }
  },
  free: {
    btc: {
      type: Number,
      default: 0
    },
    cny: {
      type: Number,
      default: 1000
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
