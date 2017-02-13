import KoaRouter from 'koa-router';
import queryString from 'query-string';

import User from '../models/User';
import SimulateUserInfo from '../models/SimulateUserInfo';

import Stock from '../rest/Stock';

const router = new KoaRouter();

router
  // 检查登录
  .get('/api/user', async (ctx, next) => {
    const uid = ctx.cookies.get('uid');

    if (uid) {
      let user = await User.findById(uid);

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
      let user = await User.findById(uid);

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

    let user = await User.findOne({ name });

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

    let user = await User.findOne({ name });

    if (user) {
      ctx.body = {
        code: 1002,
        message: 'has user in db'
      }
    }
    else {
      user = new User({ name, password, apiKey, secretKey, simulate });

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
  });

export default router;
