import isPlainObject from 'lodash/isPlainObject';
import isArray from 'lodash/isArray';
import defaultsDeep from 'lodash/defaultsDeep';

class Entity {
  constructor(data = {}) {
    Object.keys(data).forEach(
      key =>
        this.set(key, data[key])
    );

    this.data = 
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

export default Entity;
