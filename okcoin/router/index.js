import KoaRouter from 'koa-router';
import queryString from 'query-string';

import UserModel from '../models/User';
import SimulateUserInfo from '../models/SimulateUserInfo';
import UserInfo from '../entities/UserInfo';

import Stock from '../rest/Stock';

import Strategy from '../../quant/Strategy';

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
          data: {
            ...user,
            uid: user._id
          }
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
            data: {
              ...user,
              uid: user._id
            }
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
          data: {
            ...user,
            uid: user._id
          }
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

    const stock = new Stock({
      apiKey: 'fake',
      secretKey: 'fake'
    });

    const kline = await stock.getKLine({ size: 2000 });

    ctx.body = {
      code: 0,
      data: kline
    };

    await next();
  });

export default router;
