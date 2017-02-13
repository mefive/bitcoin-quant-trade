import _ from 'lodash';

import Order from '../models/Order';

class UserInfo {
  static defaultData = {
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
    simulate: false
  }

  constructor(data = {}, Model) {
    this.data = _.defaultsDeep(data, UserInfo.defaultData);
    this.Model = Model;
  }

  update(data = {}) {
    this.data = _.defaultsDeep(data, this.data);
  }

  async save() {
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

    const amount = _.round(_.divide(cash, price), 10);

    if (amount < 0.01) {
      throw 'money not enough to buy';
      return;
    }

    if (this.data.simulate) {
      this.update({
        free: {
          cny: 0,
          btc: _.add(amount, btc)
        },
        asset: {
          total: _.multiply(price, _.add(amount, btc))
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

    console.log('amount', amount)

    if (amount < 0.01) {
      throw 'btc not enough to sell';
      return;
    }

    if (this.data.simulate) {
      this.update({
        free: {
          cny: _.round(_.add(cash, _.multiply(price, amount)), 2),
          btc: 0
        },
        asset: {
          total: _.round(_.add(cash, _.multiply(price, amount)), 2)
        }
      });

      await this.save();

      await this.createOrder(price, -amount);
    }
  }

  async createOrder(price, amount) {
    const user = this.data;

    const { name, uid } = user;

    const order = new Order({
      name, uid, price, amount, ts: +(new Date())
    });

    await order.save();
  }
}

export default UserInfo;
