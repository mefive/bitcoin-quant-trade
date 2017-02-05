import Entity from './Entity';
import * as constants from '../config/constants';

class Strategy extends Entity {
	constructor(data = {}) {
		super({
			type: constants.STRATEGY_FIX,
			usp: 0,
			ubp: -1,
			price: 0,
			prevPrice: 0
		});

		this.update(data);
	}

	set usp(price) {
		if (price >= this.ubp) {
			this.usp = price;
		}
		else {
			throw 'usp must larger than ubp';
		}
	}

	set ubp(price) {
		if (price <= this.usp) {
			this.ubp = price;
		}
		else {
			throw 'ubp must less than usp';
		}
	}
}

export default Strategy;
