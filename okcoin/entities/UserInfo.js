const _ = require('lodash');

const OrderModel = require('../models/Order');
const Order = require('./Order');

const defaultData = {
  asset: {
    net: 0,
    total: 0
  },
  free: {
    btc: 0,
    cny: 0,
    ltc: 0
  },
  freezed: {
    btc: 0,
    cny: 0,
    ltc: 0
  },
  name: '',
  uid: 0,
  simulate: false,
  backTesting: false
};

class UserInfo {
  constructor(data = {}, Model) {
    this.data = _.defaultsDeep(data, UserInfo.defaultData);
    this.Model = Model;

    if (this.data.backTesting) {
      this.orders = [];
      this.data.asset.total = 10000;
      this.data.free.cny = 10000;
    }
  }

  update(data = {}) {
    this.data = _.defaultsDeep(data, this.data);
  }

  async save() {
    if (this.data.backTesting) {
      return;
    }

    const { uid } = this.data;
    if (!uid) {
      await (new this.Model(this.data)).save();
    }
    else {
      await this.Model.update({ uid }, { $set: this.data });
    }
  }

  async buyAll(price) {
    const { data } = this;

    const cash = data.free.cny;
    const btc = data.free.btc;

    let amount = _.round(_.divide(cash, price), 10);

    if (amount < 0.01) {
      throw {
        type: 'trade',
        message: 'money not enough to buy'
      };

      return;
    }

    // 手续费 0.2%
    amount = _.subtract(amount, _.multiply(amount, 0.002));

    if (this.data.simulate) {
      this.update({
        free: {
          cny: 0,
          btc: _.add(amount, btc)
        },
        asset: {
          total: _.round(_.multiply(price, _.add(amount, btc)), 2)
        }
      });

      await this.save();

      await this.createOrder(price, amount);
    }
  }

  async sellAll(price) {
    const { data } = this;

    const amount = data.free.btc;
    const cash = data.free.cny;

    if (amount < 0.01) {
      throw {
        type: 'trade',
        message: 'btc not enough to sell'
      };

      return;
    }

    let money = _.round(_.multiply(price, amount), 2);

    // 手续费 0.2%
    money = _.round(_.subtract(money, _.multiply(money, 0.002)), 2);

    if (this.data.simulate) {
      this.update({
        free: {
          cny: _.round(_.add(cash, money), 2),
          btc: 0
        },
        asset: {
          total: _.round(_.add(cash, money), 2)
        }
      });

      await this.save();

      await this.createOrder(price, -amount);
    }
  }

  async createOrder(price, amount) {
    const user = this.data;

    const { name, uid } = user;

    if (user.backTesting) {
      this.orders.push(new Order({
        name, uid, price, amount, ts: +(new Date())
      }));
    }
    else {
      const order = new OrderModel({
        name, uid, price, amount, ts: +(new Date())
      });

      await order.save();
    }
  }
}

UserInfo.defaultData = defaultData;

module.exports = UserInfo;
