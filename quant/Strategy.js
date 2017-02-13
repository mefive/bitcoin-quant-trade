import _ from 'lodash';
import ubique from 'ubique';
import moment from 'moment';

function getMean(data = [], points = 0, offset = 0) {
  if (offset === 0) {
    return _.round(
      _.mean(data.slice(-points)),
      2
    );
  }
  else {
    const { length } = data;

    return _.round(
      _.mean(data.slice(length - (points - offset), length - 1)),
      2
    );
  }
}

class Strategy {
  constructor(user) {
    // 是否是模拟账户
    this.user = user;
  }

  async run(data, price, lastOrder) {
    const { length } = data;

    // 当前均值
    const meanFast = this.meanFast = getMean(data, 7);
    const meanSlow = this.meanSlow = getMean(data, 30);

    // 上一个均值
    const lastMeanFast = this.lastMeanFast = getMean(data, 7, -1)
    const lastMeanSlow = this.lastMeanSlow = getMean(data, 30, -1);

    // 止损
    if (lastOrder && price < _.round(_.multiply(lastOrder.price, 0.9), 2)) {
      await this.sell(price);
      console.log('sell by cut loss');
      return;
    }

    // 快 下击穿 慢 ，买
    if (lastMeanFast < lastMeanSlow && meanFast >= meanSlow) {
      // await this.buy(price);
      await this.sell(price);
    }
    // 快 上击穿 慢，卖
    else if (lastMeanFast > lastMeanSlow && meanFast <= meanSlow) {
      // await this.sell(price);
      await this.buy(price);
    }
    else {
      // this.logInfo('ON ORDER', price);
      // await this.sell(price);
      // await this.buy(price);
    }
  }

  async buy(price) {
    try {
      await this.user.buyAll(price);
      this.logInfo('BUY', price);
    }
    catch (e) {
      console.log(e);
    }
  }

  async sell(price) {
    try {
      await this.user.sellAll(price);
      this.logInfo('SELL', price);
    }
    catch (e) {
      console.log(e);
    }
  }

  logInfo(trade, price) {
    console.log('=======');
    if (this.user) {
      console.log(this.user.data.free, this.user.data.asset);
    }

    console.log(trade, price);

    console.log(moment().format('YYYY-MM-DD hh:mm:ss'));

    console.log('current');
    console.log(this.meanFast, this.meanSlow);

    console.log('');

    console.log('last');
    console.log(this.lastMeanFast, this.lastMeanSlow);

    console.log('');

    console.log('=======\r\n');
  }
}

export default Strategy;
