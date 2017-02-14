import defaultsDeep from 'lodash/defaultsDeep';

class Order {
  static defaultData = {
    name: '',
		uid: '',
		price: 0,
		amount: 0,
		ts: 0
  }

  constructor(data) {
    this.data = defaultsDeep(data, Ticker.defaultData);
  }
}

export default Order;
