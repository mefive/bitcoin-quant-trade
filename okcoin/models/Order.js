import mongoose from 'mongoose';

export default mongoose.model(
	'Order',
	new mongoose.Schema({
		name: String,
		uid: String,
		price: Number,
		amount: Number,
		ts: Number
	})
);
