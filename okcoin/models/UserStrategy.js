import mongoose from 'mongoose';

export default mongoose.model(
	'UserStrategy',
	new mongoose.Schema({
		name: String,
		uid: String,
		strategies: Array
	})
);
