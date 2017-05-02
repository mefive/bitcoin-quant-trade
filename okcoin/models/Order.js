const mongoose = require('mongoose');

module.exports = mongoose.model(
	'Order',
	new mongoose.Schema({
		name: String,
		uid: String,
		price: Number,
		amount: Number,
		ts: Number
	})
);
