import mongoose from 'mongoose';

const schema = {
  name: 'string',
  apiKey: 'string',
  secretKey: 'string'
};

export default mongoose.model('User', schema);
