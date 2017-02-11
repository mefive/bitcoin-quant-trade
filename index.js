import http from 'http';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import socketIo from 'socket.io';
import Stock from './okcoin/rest/Stock';
import co from 'co';
import sleep from 'sleep-promise';
import pick from 'lodash/pick';
import mongoose from 'mongoose';
import queryString from 'query-string';

import okcoinRouter from './okcoin/router';
import UserInfo from './okcoin/entities/UserInfo';

import User from './okcoin/models/User';
import SimulateUserInfo from './okcoin/models/SimulateUserInfo';
import Strategy from './quant/Strategy';

mongoose.Promise = global.Promise;

co(function* () {
  try {
    yield mongoose.connect('mongodb://localhost/okcoin');
    init();
  }
  catch (e) {
    console.log('mongodb connect error', e);
  }

});

function init() {
  const app = new Koa();

  app.use(bodyParser());

  app.use(function* (next) {
    try {
      yield next;
    }
    catch (e) {
      const { name, statusCode, errorCode, message } = e;

      const code = errorCode || statusCode || 500;

      this.body = { code, name, message };
    }
  });

  app
    .use(okcoinRouter.routes())
    .use(okcoinRouter.allowedMethods());

  const server = http.createServer(app.callback());

  const io = socketIo(server);

  const sockets = {};

  io.on('connection', socket => {
    const { uid } = socket.handshake.query;

    if (uid) {
      sockets[uid] = socket;

      socket.on('disconnect', () => {
        delete sockets[uid];
      });
    }
  });

  async function loop() {
    while(true) {
      try {
        const users = await User.find();

        if (users) {
          for (const user of users) {
            const { _id } = user;

            const stock = new Stock(user);

            const ticker = await stock.getTicker();

            let userInfo = {};

            if (!user.simulate) {
              userInfo = stock.getUserInfo();
            }
            else {
              userInfo = await SimulateUserInfo.findOne({ name: user.name });

              if (userInfo) {
                userInfo = new UserInfo(
                  {
                    ...userInfo.toObject(),
                    simulate: true
                  },
                  SimulateUserInfo
                );
              }
              else {
                await (new SimulateUserInfo({
                  name: user.name,
                  uid: user._id
                })).save();
              }
            }

            const kLine = await stock.getKLine();

            const strategy = new Strategy(userInfo);

            await strategy.run(kLine, ticker.data.last);
          }
        }
      }
      catch (e) {
        console.log(e);
      }

      await sleep(5000);
    }
  }

  loop();

  // co(function* () {
  //   while (true) {
  //     yield sleep(10000);

  //     try {
  //       const users = yield User.find();

  //       if (users) {
  //         for (const user of users) {
  //           const { _id } = user;

  //           const stock = new Stock(user);

  //           const ticker = yield stock.getTicker();

  //           let userInfo = {};

  //           if (!user.simulate) {
  //             userInfo = yield stock.getUserInfo();
  //           }
  //           else {
  //             userInfo = yield SimulateUserInfo.findOne({ name: user.name });

  //             userInfo = new UserInfo(userInfo);
  //           }

  //           const kLine = yield stock.getKLine();

  //           const strategy = new Strategy(userInfo);

  //           strategy.run(kLine, ticker.last);
            
  //           const socket = sockets[_id];

  //           if (socket) {
  //             socket.emit('ticker', { ticker, user: userInfo });
  //           }
  //         }
  //       }
  //     }
  //     catch (e) {
  //       console.log(pick(e, ['name', 'statusCode', 'errorCode', 'message']));
  //     }
  //   }
  // });

  server.listen(3000);
}
