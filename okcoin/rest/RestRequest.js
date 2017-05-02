const requestPromise = require('request-promise');
const md5 = require('md5');
const queryString = require('query-string');

class RestRequest {
  constructor(apiKey, secretKey, prefix) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.prefix = prefix;
  }

  handleException(data) {
    const errorCode = data['error_code'];

    if (errorCode) {
      throw({ name: 'server error', errorCode });
    }
  }

  async get(api, params) {
    const data = await requestPromise({
      method: 'GET',
      uri: `${this.prefix}/${api}`,
      qs: params,
      json: true
    });

    this.handleException(data);

    return data;
  }

  async post(api, params) {
    const data = await requestPromise({
      method: 'POST',
      uri: `${this.prefix}/${api}`,
      form: Object.assign(
        {},
        params,
        {
          sign: md5(
            `${queryString.stringify(params)}&secret_key=${this.secretKey}`
          ).toUpperCase()
        }
      ),
      json: true
    });

    this.handleException(data);

    return data;
  }
}

module.exports = RestRequest;
