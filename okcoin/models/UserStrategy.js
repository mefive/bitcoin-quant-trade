const mongoose require('mongoose');

module.exports = mongoose.model(
	'UserStrategy',
	new mongoose.Schema({
		name: String,
		uid: String,
		strategies: Array
	})
);
