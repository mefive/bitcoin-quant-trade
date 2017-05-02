const isPlainObject = require('lodash/isPlainObject');
const isArray = require('lodash/isArray');
const defaultsDeep = require('lodash/defaultsDeep');

class Entity {
  constructor(data = {}) {
    Object.keys(data).forEach(
      key =>
        this.set(key, data[key])
    );
  }

  update(data) {
    Object.keys(data).forEach(
      key => {
        if (key in this) {
          this.set(key, data[key]);
        }
      }
    );
  }

  set(key, value) {
    if (isPlainObject(value)) {
      this[key] = { ...value };
    }
    else if (isArray(value)) {
      this[key] = [...value];
    }
    else {
      this[key] = value;
    }
  }
}

module.exports = Entity;
