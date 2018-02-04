'use strict';
const URL = require('url').URL;
module.exports = class {
  constructor(parent) {
    this.parent = parent;
  }
  async resolve(specifier, referrer) {
    try {
      const result = await this.parent.resolve(specifier, referrer);
      console.error(`Loader resolving ${specifier} from ${referrer} resulted in ${result}`);
      return result;
    } catch (e) {
      console.error(`Loader resolving ${specifier} from ${referrer} had an error: ${e}`);
      throw e;
    }
  }
};
