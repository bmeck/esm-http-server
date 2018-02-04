'use strict';
const readFile = require('util').promisify(require('fs').readFile);
const {URL} = require('url');
const mime = require('mime');
module.exports = base_file_url => async req => {
  const destination = new URL(`${req.url}`, base_file_url);
  // escaped past root, reset to root
  if (!destination.pathname.startsWith(base_file_url.pathname)) {
    throw Error('invalid path');
  }
  const buffer = await readFile(destination);
  const ext = /[^/]\.([\s\S]*)$/.exec(destination.pathname);
  const type = ext ?
    mime.getType(ext[1]) :
    'application/octet-stream';
  return {
    __proto__: null,
    statusCode: 200,
    headers: {
      __proto__: null,
      'content-type': type,
      'content-length': buffer.length
    },
    buffer,
  };
};
