const defaultsDeep = require('lodash/defaultsDeep');

const defaultData = {
  buy: 0,
  high: 0,
  last: 0,
  low: 0,
  sell: 0,
  vol: 0 
};

class Ticker {
  constructor(data) {
    this.data = defaultsDeep(data, Ticker.defaultData);
  }
}

Ticker.defaultData = defaultData;

module.exports = Ticker;
