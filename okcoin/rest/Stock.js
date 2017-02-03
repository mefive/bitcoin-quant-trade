import RestRequest from './RestRequest';
import Ticker from '../entities/Ticker';
import UserInfo from '../entities/UserInfo';

const TICKER = 'ticker.do';
const USER_INFO = 'userinfo.do';

class Stock {
  constructor(user) {
    this.user = user;

    const { apiKey, secretKey } = user;

    this.restRequest = new RestRequest(
      apiKey,
      secretKey,
      'https://www.okcoin.cn/api/v1'
    );
  }

  *getTicker() {
    const data = yield* this.restRequest.get(
      TICKER,
       { symbol: 'btc_cny', }
    );

    return new Ticker(data.ticker);
  }

  *getUserInfo() {
    const data = yield* this.restRequest.post(
      USER_INFO,
      { 'api_key': this.user.apiKey }
    );

    return new UserInfo({
      ...data.info.funds,
      name: this.user.name,
      uid: this.user._id
    });
  }
}

export default Stock;
