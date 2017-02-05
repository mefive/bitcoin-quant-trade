import KoaRouter from 'koa-router';
import queryString from 'query-string';

import User from '../models/User';
import SimulateUserInfo from '../models/SimulateUserInfo';

import Stock from '../rest/Stock';

const router = new KoaRouter();

router
  // 检查登录
  .get('/api/user', function* (next) {
    const uid = this.cookies.get('uid');

    if (uid) {
      let user = yield User.findById(uid);

      user = user.toObject();

      if (user) {
        this.body = {
          code: 0,
          data: {
            ...user,
            uid: user._id
          }
        };
      }
      else {
        this.body = {
          code: 404,
          message: 'no user in db'
        };
      }
    }
    else {
      this.body = {
        code: 403,
        message: 'no auth'
      };
    }

    yield next;
  })

  // 获取 user 账务信息
  .get('/api/userinfo', function* () {
    const uid = this.cookies.get('uid');

    if (uid) {
      let user = yield User.findById(uid);

      user = user.toObject();

      if (user) {
        const stock = new Stock(user);

        try {
          const data = yield stock.getUserInfo();

          this.body = {
            code: 0,
            data: {
              ...user,
              uid: user._id
            }
          };
        }
        catch (e) {
          this.body = {
            code: 404,
            message: 'no user in okcoin'
          };
        }
      }
      else {
        this.body = {
          code: 404,
          message: 'no user in db'
        };
      }
    }
    else {
      this.body = {
        code: 403,
        message: 'no auth'
      };
    }

    yield next;
  })

  // 登录
  .get('/api/login', function* (next) {
    const params = this.request.query;

    const { name, password } = params;

    let user = yield User.findOne({ name, password });

    if (user) {
      user = user.toObject();

      this.cookies.set('uid', user._id);

      this.body = {
        code: 0,
        data: {
          ...user,
          uid: user._id
        }
      };
    }
    else {
      this.body = {
        code: 404,
        message: 'no user in db'
      }
    }

    yield next;
  })

  // 注册
  .post('/api/user', function* (next) {
    const params = this.request.body;

    const { name, password, apiKey, secretKey, simulate } = params;

    let user = yield User.findOne({ name });

    if (user) {
      this.body = {
        code: 500,
        message: 'has user in db'
      }
    }
    else {
      user = new User({ name, password, apiKey, secretKey, simulate });

      const stock = new Stock(user);

      try {
        const userinfo = yield stock.getUserInfo();
      }
      catch (e) {
        this.body = {
          code: 1001,
          message: 'no user in okcoin'
        };

        yield next;

        return;
      }

      yield user.save();

      if (simulate) {
        const simulateUserInfo
          = new SimulateUserInfo({ name, uid: user._id });

        yield simulateUserInfo.save();
      }

      this.body = {
        code: 0
      };
    }

    yield next;
  });

export default router;
