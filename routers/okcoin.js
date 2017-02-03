import KoaRouter from 'koa-router';
import queryString from 'query-string';

import User from '../okcoin/models/User';
import Stock from '../okcoin/rest/Stock';

const router = new KoaRouter();

router
  .get('/api/userinfo', function* (next) {
    const uid = this.cookies.get('uid');

    if (uid) {
      const user = yield User.findById(uid);

      if (user) {
        const stock = new Stock(user);

        const data = yield stock.getUserInfo();

        yield next;

        this.body = {
          code: 0,
          data
        };
      }

      return;
    }

    this.body = {
      code: 404,
      message: 'no user'
    };
  })

  .get('/api/login', function* (next) {
    const params = queryString.parse(this.request.querystring);

    const { name } = params;

    const user = yield User.findOne({ name });

    yield next;

    this.cookies.set('uid', user._id);

    this.body = user;
  })

  .get('/api/logout', function* (next) {
    const uid = this.cookies.get('uid');
    const expires = new Date();
    expires.setYear(1990);

    if (uid) {
      this.cookies.set('uid', uid, { expires });
    }

    this.body = { uid };
  });

export default router;
