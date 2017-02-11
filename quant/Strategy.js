import pick from 'lodash/pick';
import ubique from 'ubique';
import moment from 'moment';

class Strategy {
  constructor(user) {
    // 是否是模拟账户
    this.user = user;
  }

  async run(data, price) {
    const { length } = data;

    // 当前均值
    const mean7 = this.mean7 = ubique.mean(data.slice(-7));
    const mean30 = this.mean30 = ubique.mean(data.slice(-30));

    // 上一个均值
    const lastMean7 = this.lastMean7 = ubique.mean(data.slice(length - 8, length - 1));
    const lastMean30 = this.lastMean30 = ubique.mean(data.slice(length - 31, length - 1));

    // 5 下击穿 10 ，买
    if (lastMean7 < lastMean30 && mean7 >= mean30) {
      await this.buy(price);
      // await this.sell(price);
    }
    // 5 上击穿 10，卖
    else if (lastMean7 > lastMean30 && mean7 <= mean30) {
      await this.sell(price);
      // await this.buy(price);
    }
    else {
      this.logInfo('ON ORDER', price);
      // await this.sell(price);
      // await this.buy(price);
    }
  }

  async buy(price) {
    this.logInfo('BUY', price);
    await this.user.buyAll(price);
  }

  async sell(price) {
    this.logInfo('SELL', price);
    await this.user.sellAll(price)
  }

  logInfo(trade, price) {
    console.log('=======');
    if (this.user) {
      console.log(this.user.data.free, this.user.data.asset);
    }

    console.log(trade, price);

    console.log(moment().format('YYYY-MM-DD hh:mm:ss'));

    console.log('current');
    console.log(this.mean7, this.mean30);

    console.log('');

    console.log('last');
    console.log(this.lastMean7, this.lastMean30);

    console.log('');

    console.log('=======\r\n');
  }
}

export default Strategy;
