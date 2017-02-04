import http from 'http';
import Koa from 'koa';
import socketIo from 'socket.io';
import Stock from './okcoin/rest/Stock';
import co from 'co';
import sleep from 'co-sleep';
import pick from 'lodash/pick';
import mongoose from 'mongoose';
import queryString from 'query-string';

import okcoinRouter from './routers/okcoin';
import User from './okcoin/models/User';

mongoose.Promise = global.Promise;

co(function* () {
  yield mongoose.connect('mongodb://localhost/okcoin');

  init();
});

function init() {
  const app = new Koa();

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

  co(function* () {
    while (true) {
      yield sleep(3000);

      try {
        const users = yield User.find();

        for (const user of users) {
          const { _id } = user;

          const stock = new Stock(user);

          const [ticker, userInfo] = yield [
            stock.getTicker(),
            stock.getUserInfo()
          ];
          
          const socket = sockets[_id];

          if (socket) {
            console.log('emit', _id);
            socket.emit('ticker', { ticker, user: userInfo });
          }
        }
      }
      catch (e) {
        console.log(pick(e, ['name', 'statusCode', 'errorCode', 'message']));
      }
    }
  });

  server.listen(3000);
}
