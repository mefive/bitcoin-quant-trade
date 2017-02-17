import _ from 'lodash';
import ubique from 'ubique';
import moment from 'moment';
import 'technicalindicators';

// 检查收益是否高于手续费
function checkCost(price, lastPrice) {
  return _.subtract(price, _.multiply(lastPrice, 0.002))
    > lastPrice;
}

class Strategy {
  constructor(
    user,
    {
      opposite = false, // 是否反向操作,
      log = false
    } = {}
  ) {
    this.user = user;
    this.opposite = opposite;
    this.log = log;
  }

  async run({ fastSMALine, slowSMALine, price, lastOrder }) {
    // const { length } = data;

    // 计算移动平均线
    // const meanFastList = SMA.calculate({ period: this.fastPeriod, values: data });
    // const meanSlowList = SMA.calculate({ period: this.slowPeriod, values: data });

    // 当前均线值
    const meanFast = this.meanFast = fastSMALine.slice(-1)[0];
    const meanSlow = this.meanSlow = slowSMALine.slice(-1)[0];

    // 上一个均线值
    const lastMeanFast = this.lastMeanFast = fastSMALine.slice(-2)[0];
    const lastMeanSlow = this.lastMeanSlow = slowSMALine.slice(-2)[0];

    // 止损
    if (lastOrder && price < _.round(_.multiply(lastOrder.price, 0.8), 2)) {
      await this.sell(price, 'sell by cut loss');
      return;
    }

    // 快均线 下击穿 慢均线 ，买
    if (lastMeanFast < lastMeanSlow && meanFast >= meanSlow) {
      if (this.opposite) {
        if (lastOrder && checkCost(price, lastOrder.price)) {
          await this.sell(price);
        }
      }
      else {
        await this.buy(price);
      }
    }
    // 快均线 上击穿 慢均线，卖
    else if (lastMeanFast > lastMeanSlow && meanFast <= meanSlow) {
      if (this.opposite) {
        await this.buy(price);
      }
      else {
        if (lastOrder && checkCost(price, lastOrder.price)) {
          await this.sell(price);
        }
      }
    }
    else {
      this.logInfo('ON ORDER', price);
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
      if (this.log) {
        console.log(e);
      }
    }
  }

  async sell(price, by) {
    try {
      await this.user.sellAll(price);
      this.logInfo('SELL', price);
      if (this.log && by) {
        console.log(by);
      }
    }
    catch (e) {
      if (this.log) {
        console.log(e);
      }
    }
  }

  logInfo(trade, price) {
    if (!this.log) {
      return;
    }

    console.log('=====================');
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

    console.log('=====================\r\n');
  }
}

export default Strategy;
