import mongoose from 'mongoose';

export default mongoose.model('SimulateUserInfo', new mongoose.Schema({
  asset: {
    total: {
      type: Number,
      default: 100      
    }
  },
  free: {
    btc: {
      type: Number,
      default: 0
    },
    cny: {
      type: Number,
      default: 100
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
