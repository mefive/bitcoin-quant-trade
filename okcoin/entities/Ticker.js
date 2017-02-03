import Entity from './Entity';

class Ticker extends Entity {
  constructor(data) {
    super({
      buy: 0,
      high: 0,
      last: 0,
      low: 0,
      sell: 0,
      vol: 0
    });

    this.update(data);
  }
}

export default Ticker;
