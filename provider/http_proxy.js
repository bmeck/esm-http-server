'use strict';
const http = require('http');
const {URL} = require('url');
const concat = require('concat-stream');
module.exports = base_proxy_url => async req => {
  const destination = new URL(`${req.url}`, base_proxy_url);
  if (!destination.pathname.startsWith(base_proxy_url.pathname)) {
    throw Error('invalid path');
  }
  destination.hostname = base_proxy_url.hostname;
  destination.port = base_proxy_url.port;
  return await {
    __proto__: null,
    then: (f, r) => {
      const params = {
        host: destination.hostname,
        path: destination.pathname,
        port: destination.port,
        method: req.method,
        headers: req.headers,
      };
      http.request(params).on('response', proxy_res => {
        const statusCode = proxy_res.statusCode;
        const headers = proxy_res.headers;
        proxy_res.on('error', r);
        proxy_res.pipe(concat(buffer => {
          f({
            __proto__: null,
            statusCode,
            headers,
            buffer,
          });
        }));
      }).on('error', r).end();
    }
  }
};
