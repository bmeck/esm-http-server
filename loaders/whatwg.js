'use strict';
const URL = require('url').URL;
module.exports = class {
  async resolve(specifier, referrer) {
    console.error(`WHAWTWG Loader resolving ${specifier} against ${referrer}`);
    try {
      return new URL(specifier);
    } catch (e) {
      if (
        specifier.startsWith('/') ||
        specifier.startsWith('./') ||
        specifier.startsWith('../')
      ) {
        return new URL(specifier, referrer);
      }
      // change the bare name
      throw new Error('no bare names allowed');
    }
  }
};
