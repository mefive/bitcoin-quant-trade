import defaultsDeep from 'lodash/defaultsDeep';

class Ticker {
  static defaultData = {
    buy: 0,
    high: 0,
    last: 0,
    low: 0,
    sell: 0,
    vol: 0
  }

  constructor(data) {
    this.data = defaultsDeep(data, Ticker.defaultData);
  }
}

export default Ticker;
