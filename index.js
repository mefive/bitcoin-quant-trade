const http = require('http');
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const socketIo = require('socket.io');
const Stock = require('./okcoin/rest/Stock');
const sleep = require('sleep-promise');
const mongoose = require('mongoose');
require('technicalindicators');

const okcoinRouter = require('./okcoin/router');
const UserInfo = require('./okcoin/entities/UserInfo');
const User = require('./okcoin/models/User');
const Order = require('./okcoin/models/Order');
const SimulateUserInfo = require('./okcoin/models/SimulateUserInfo');
const Strategy = require('./quant/Strategy');

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
                Object.assign(
                  {},
                  userInfo.toObject(),
                  { simulate: true }
                ),
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

          const fastPeriod = 10;
          const slowPeriod = 30;
          const type = '30min';
          const opposite = false;

          const kLine = await stock.getKLine({
            type, size: 2000
          });

          const fastSMALine = global.SMA.calculate({ period: fastPeriod, values: kLine });
          const slowSMALine = global.SMA.calculate({ period: slowPeriod, values: kLine });

          const { length: slowLength } = slowSMALine;
          const fastOffset = fastSMALine.length - slowLength;
          const kLineOffset = kLine.length - slowLength;

          const strategy = new Strategy(
            userInfo,
            { fastPeriod, slowPeriod, opposite, log: true }
          );

          const lastOrder = (await Order.find({ uid: _id }).sort({ ts: -1 }))[0]//[0];

          await strategy.run({
            slowSMALine,
            fastSMALine,
            price: ticker.data.last,
            lastOrder: lastOrder && lastOrder.data
          });

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

    await sleep(60000);
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

      console.log(e);

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
