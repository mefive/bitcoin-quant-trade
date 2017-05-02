const defaultsDeep = require('lodash/defaultsDeep');

const defaultData = {
  name: '',
  uid: '',
  price: 0,
  amount: 0,
  ts: 0
};

class Order {
  constructor(data) {
    this.data = defaultsDeep(data, Order.defaultData);
  }
}

Order.defaultData = defaultData;

module.exports = Order;
