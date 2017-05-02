const KoaRouter = require('koa-router');
const queryString = require('query-string');
const _ = require('lodash');
require('technicalindicators');

const UserModel = require('../models/User');
const SimulateUserInfo = require('../models/SimulateUserInfo');
const UserInfo = require('../entities/UserInfo');

const Stock = require('../rest/Stock');

const Strategy = require('../../quant/Strategy');

const router = new KoaRouter();

router
  // 检查登录
  .get('/api/user', async (ctx, next) => {
    const uid = ctx.cookies.get('uid');

    if (uid) {
      let user = await UserModel.findById(uid);

      user = user.toObject();

      if (user) {
        ctx.body = {
          code: 0,
          data: Object.assign(
            {},
            user,
            {
              uid: user._id
            }
          )
        };
      }
      else {
        ctx.body = {
          code: 404,
          message: 'no user in db'
        };
      }
    }
    else {
      ctx.body = {
        code: 403,
        message: 'no auth'
      };
    }

    await next();
  })

  // 获取 user 账务信息
  .get('/api/userinfo', async (ctx, next) => {
    const uid = ctx.cookies.get('uid');

    if (uid) {
      let user = await UserModel.findById(uid);

      user = user.toObject();

      if (user) {
        const stock = new Stock(user);

        try {
          const data = await stock.getUserInfo();

          ctx.body = {
            code: 0,
            data: Object.assign(
              {},
              user,
              {
                uid: user._id
              }
            )
          };
        }
        catch (e) {
          ctx.body = {
            code: 404,
            message: 'no user in okcoin'
          };
        }
      }
      else {
        ctx.body = {
          code: 404,
          message: 'no user in db'
        };
      }
    }
    else {
      ctx.body = {
        code: 403,
        message: 'no auth'
      };
    }

    await next();
  })

  // 登录
  .get('/api/login', async (ctx, next) => {
    const params = ctx.request.query;

    const { name, password } = params;

    let user = await UserModel.findOne({ name });

    if (user) {
      if (user.password === password) {
        user = user.toObject();

        ctx.cookies.set('uid', user._id);

        ctx.body = {
          code: 0,
          data: Object.assign(
            {},
            user,
            { uid: user._id }
          )
        };
      }
      else {
        ctx.body = {
          code: 500,
          message: 'password unmatched'
        };
      }
    }
    else {
      ctx.body = {
        code: 404,
        message: 'no user in db'
      }
    }

    await next();
  })

  // 注册
  .post('/api/user', async (ctx, next) => {
    const params = ctx.request.body;

    const { name, password, apiKey, secretKey, simulate } = params;

    let user = await UserModel.findOne({ name });

    if (user) {
      ctx.body = {
        code: 1002,
        message: 'has user in db'
      }
    }
    else {
      user = new UserModel({ name, password, apiKey, secretKey, simulate });

      const stock = new Stock(user);

      try {
        const userinfo = await stock.getUserInfo();
      }
      catch (e) {
        ctx.body = {
          code: 1001,
          message: 'no user in okcoin'
        };

        await next();

        return;
      }

      await user.save();

      if (simulate) {
        const simulateUserInfo
          = new SimulateUserInfo({ name, uid: user._id });

        await simulateUserInfo.save();
      }

      ctx.body = {
        code: 0
      };
    }

    await next();
  })

  .get('/api/backTesting', async (ctx, next) => {
    const userInfo = new UserInfo({
      name: 'backTesting',
      backTesting: true,
      simulate: true
    });

    const fastPeriod = 10;
    const slowPeriod = 30;
    const type = '30min';
    const opposite = false;

    const strategy = new Strategy(userInfo, { fastPeriod, slowPeriod, opposite });

    const stock = new Stock({
      apiKey: 'fake',
      secretKey: 'fake'
    });

    const kLine = await stock.getKLine({ type, size: 2000 });
    
    const fastSMALine = global.SMA.calculate({ period: fastPeriod, values: kLine });
    const slowSMALine = global.SMA.calculate({ period: slowPeriod, values: kLine });

    const { length: slowLength } = slowSMALine;
    const fastOffset = fastSMALine.length - slowLength;
    const kLineOffset = kLine.length - slowLength;

    const originalTotal = userInfo.data.asset.total;
    console.log(`本金 ￥${originalTotal}`);

    for (let i = 1; i < slowLength; i++) {
      const { orders } = userInfo;
      const lastOrder = orders[orders.length - 1];

      const slowSMA = slowSMALine[i];
      const fastSMA = fastSMALine[i + fastOffset];
      const price = kLine[i + kLineOffset];

      const oldTotal = userInfo.data.asset.total;

      await strategy.run({
        slowSMALine: slowSMALine.slice(0, i),
        fastSMALine: fastSMALine.slice(fastOffset, i + fastOffset),
        price: kLine[i + kLineOffset],
        lastOrder: lastOrder && lastOrder.data
      });

      const { total } = userInfo.data.asset;

      if (oldTotal !== total) {
        const day = _.round((i - 1) * 30 / 60 / 24);
        // const day = i * 3;
        console.log(`第 ${day} 天，￥${_.round(total - oldTotal, 2)}`);
      }
    }

    const profit = _.divide(
      _.subtract(userInfo.data.asset.total, originalTotal),
      originalTotal
    );

    await next();

    console.log(`回测 ${type} , ${kLine.length} 个点`);
    console.log(`fastPeriod: ${fastPeriod}, slowPeriod: ${slowPeriod}${opposite ? ' , 反向' : ''}`);
    console.log(`收益 ￥${_.round(_.subtract(userInfo.data.asset.total, originalTotal))}，${profit * 100}%`);

    ctx.body = {
      code: 0,
      data: `收益 ${profit * 100}%`
    };
  });

module.exports = router;
