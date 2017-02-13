import RestRequest from './RestRequest';
import Ticker from '../entities/Ticker';
import UserInfo from '../entities/UserInfo';

const TICKER = 'ticker.do';
const USER_INFO = 'userinfo.do';
const K_LINE = 'kline.do';

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

  async getTicker() {
    const data = await this.restRequest.get(
      TICKER,
       { symbol: 'btc_cny', }
    );

    const { ticker } = data;

    for (const key in ticker) {
      ticker[key] = +ticker[key];
    }

    return new Ticker(ticker);
  }

  async getKLine(type = '5min', start) {
    let since;

    if (start) {
      since = +start;
    }

    const data = await this.restRequest.get(
      K_LINE,
      { symbol: 'btc_cny', type, since, size: 50 }
    );

    return data.map(k => k[4]);
  }

  async getUserInfo() {
    const data = await this.restRequest.post(
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
