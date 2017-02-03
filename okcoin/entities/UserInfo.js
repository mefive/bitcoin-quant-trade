import Entity from './Entity';

class UserInfo extends Entity {
  constructor(data) {
    super({
      asset: {
        net: 0,
        total: 0
      },
      free: {
        btc: 0,
        cny: 0,
        ltc: 0
      },
      freezed: {
        btc: 0,
        cny: 0,
        ltc: 0
      },
      name: '',
      uid: 0
    });

    this.update(data);
  }
}

export default UserInfo;
