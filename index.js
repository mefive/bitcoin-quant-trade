import http from 'http';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import socketIo from 'socket.io';
import Stock from './okcoin/rest/Stock';
import sleep from 'sleep-promise';
import mongoose from 'mongoose';

import okcoinRouter from './okcoin/router';
import UserInfo from './okcoin/entities/UserInfo';
import User from './okcoin/models/User';
import Order from './okcoin/models/Order';
import SimulateUserInfo from './okcoin/models/SimulateUserInfo';
import Strategy from './quant/Strategy';

mongoose.Promise = global.Promise;
const sockets = {};

async function connectDB() {
  try {
    await mongoose.connect('mongodb://localhost/okcoin');
  }
  catch (e) {
    console.log('mongodb connect error', e);
  }
}

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

              continue;
            }
          }

          const kLine = await stock.getKLine();

          const strategy = new Strategy(userInfo);

          const lastOrder = (await Order.find({ uid: _id }).sort({ ts: -1 }))[0]//[0];

          await strategy.run(kLine, ticker.data.last, lastOrder);

          const socket = sockets[_id];

          if (socket) {
            socket.emit('ticker', { ticker, user: userInfo });
          }
        }
      }
    }
    catch (e) {
      console.log(e);
    }

    await sleep(10000);
  }
}

function init() {
  const app = new Koa();

  app.use(bodyParser());

  app.use(async (ctx, next) => {
    try {
      await next();
    }
    catch (e) {
      const { name, statusCode, errorCode, message } = e;

      const code = errorCode || statusCode || 500;

      ctx.body = { code, name, message };
    }
  });

  app
    .use(okcoinRouter.routes())
    .use(okcoinRouter.allowedMethods());

  const server = http.createServer(app.callback());

  const io = socketIo(server);


  io.on('connection', socket => {
    const { uid } = socket.handshake.query;

    if (uid) {
      sockets[uid] = socket;

      socket.on('disconnect', () => {
        delete sockets[uid];
      });
    }
  });

  loop();

  server.listen(3000, () => console.log('listening on 3000'));
}

async function main() {
  await connectDB();
  init();
}

main()
  .catch(console.log.bind(console));
