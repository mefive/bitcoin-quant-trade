import KoaRouter from 'koa-router';
import queryString from 'query-string';

import User from '../models/User';
import SimulateUserInfo from '../models/SimulateUserInfo';

import Stock from '../rest/Stock';

const router = new KoaRouter();

router
  .get('/api/user', function* (next) {
    const params = queryString.parse(this.request.querystring);

    const { name } = params;

    let user = yield User.findOne({ name });

    if (user) {
      user = user.toObject();

      this.body = {
        code: 0,
        data: {
          ...user,
          uid: user._id
        }
      }
    }
    else {
      this.body = {
        code: 404,
        data: 'no user'
      }
    }
  })

  .get('/api/currentUser', function* (next) {
    const uid = this.cookies.get('uid');

    yield next;

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

        return;
      }
    }

    this.body = {
      code: 404,
      message: 'no user'
    };
  })

  .get('/api/userinfo', function* (next) {
    const uid = this.cookies.get('uid');

    yield next;

    if (uid) {
      let user = yield User.findById(uid);

      user = user.toObject();

      if (user) {
        const stock = new Stock(user);

        const data = yield stock.getUserInfo();

        this.body = {
          code: 0,
          data: {
            ...user,
            uid: user._id
          }
        };
      }
    }

    this.body = {
      code: 404,
      message: 'no user'
    };
  })

  .get('/api/login', function* (next) {
    const params = queryString.parse(this.request.querystring);

    yield next;

    const { name, apiKey, secretKey, simulate } = params;

    if (simulate) {
      let simulateUserInfo = yield SimulateUserInfo.findOne({ name });

      if (!simulateUserInfo) {
        simulateUserInfo = new SimulateUserInfo({ name });
        yield simulateUserInfo.save();
      }
    }

    let user = yield User.findOne({ name });

    if (user) {
      yield user.update({ simulate });

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
    else if (!apiKey || !secretKey) {
      this.body = {
        code: 400,
        message: 'need apiKey and secretKey'
      };
    }
    else {
      user = new User({ name, apiKey, secretKey, simulate });

      const stock = new Stock(user);

      let data;

      if (!simulate) {
        try {
          data = yield stock.getUserInfo();
        }
        catch (e) {
          this.body = {
            code: 404,
            message: 'no user'
          };

          return;
        }
      }

      user = yield user.save();

      user = user.toObject();

      this.cookies.set('uid', user._id);

      this.body = {
        code: 0,
        user: {
          ...user,
          uid: user._id
        }
      };
    }
  })

  .get('/api/logout', function* (next) {
    const uid = this.cookies.get('uid');
    const expires = new Date();
    expires.setYear(1990);

    if (uid) {
      this.cookies.set('uid', uid, { expires });
    }

    this.body = {
      code: 0
    };
  });

export default router;
