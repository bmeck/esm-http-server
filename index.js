#!/usr/bin/env node
'use strict';
const http = require('http');
const {URL} = require('url');
const instrument = require('./instrument.js');
const httpProvider = require('./provider/http_proxy');
let loader = new (require('./loaders/whatwg.js'))();
if (process.argv[2]) {
  loader = new (require(
    require.resolve(process.argv[2], {
      paths: [process.cwd()]
    })
  ))();
}
const MIMEType = require('whatwg-mimetype');
const isJSMIME = (content_type = 'application/octet-stream') => {
  const mimetype = new MIMEType(content_type);
  switch (mimetype.type) {
    case "text": {
      switch (mimetype.subtype) {
        case "ecmascript":
        case "javascript":
        case "javascript1.0":
        case "javascript1.1":
        case "javascript1.2":
        case "javascript1.3":
        case "javascript1.4":
        case "javascript1.5":
        case "jscript":
        case "livescript":
        case "x-ecmascript":
        case "x-javascript": {
          return true;
        }
        default: {
          return false;
        }
      }
    }
    case "application": {
      switch (mimetype.subtype) {
        case "ecmascript":
        case "javascript":
        case "x-ecmascript":
        case "x-javascript": {
          return true;
        }
        default: {
          return false;
        }
      }
    }
    default: {
      return false;
    }
  }
}
const {
  PORT = 8080,
  HTTP_PROXY
} = process.env;
let provider;
if (typeof HTTP_PROXY === 'string') {
  const base_proxy_url = new URL(HTTP_PROXY);
  if (base_proxy_url.auth ||
    base_proxy_url.search ||
    base_proxy_url.hash) {
    throw new Error('HTTP_PROXY cannot contain auth, search, or hash parameters.');
  }
  if (!/\/$/.test(base_proxy_url.pathname)) {
    base_proxy_url.pathname += '/';
  }
  console.error(`All incoming requests will be proxied to ${base_proxy_url}`);
  provider = require('./provider/http_proxy.js')(base_proxy_url);
} else {
  const base_file_url = new URL(`file://${process.cwd()}/`);
  provider = require('./provider/file.js')(base_file_url);
  console.error(`All incoming requests will be served from disk relative to ${base_file_url}`);
}
const server = http.createServer(async (req, res) => {
  console.error(`${req.method} ${req.url}`);
  if (req.url.startsWith('/serve/')) {
    req.url = `.${req.url.slice('/serve'.length)}`;
    try {
      const {
        statusCode,
        headers,
        buffer,
      } = await provider(req);
      if (!isJSMIME(headers['content-type'])) {
        res.writeHead(statusCode, headers);
        res.end(buffer);
        return;
      }
      const {
        code
      } = instrument(`${buffer}`, {
        __proto__: null,
        referrer: `/serve${req.url.slice(1)}`,
      });
      headers['content-length'] = code.length;
      res.writeHead(200, headers);
      res.end(code);
      return;
    } catch (e) {
      res.writeHead(400);
      res.end();
      return;
    }
  } else if (req.url.startsWith('/redirect?')) {
    const searchParams = new URL(`http://${req.headers.host}/${req.url}`).searchParams;
    let referrer = searchParams.get('referrer');
    const specifier = searchParams.get('specifier');
    const resolved_specifier = await loader.resolve(specifier, `http://${req.headers.host}${referrer}`);
    const resolved_specifier_json = JSON.stringify(`${resolved_specifier}`);
    let body = `export * from ${resolved_specifier_json};\n`;
    // we have to see if it has a default export...
    let statusCode,
      headers,
      buffer;
    if (resolved_specifier.protocol === 'http:') {
      ;({
        statusCode,
        headers,
        buffer,
      } = await httpProvider(resolved_specifier)({
        __proto__: null,
        url: `${resolved_specifier.pathname}`,
        method: 'GET',
        headers: {
          host: resolved_specifier.host
        },
      }));
    }
    if (isJSMIME(headers['content-type'])) {
      // export * doesn't use defaults...
      const {
        meta: {hasDefault}
      } = instrument(`${buffer}`);
      if (hasDefault) {
        body += `export {default} from ${resolved_specifier_json};\n`;
      }
    }
    res.writeHead(200, {
      __proto__: null,
      'content-type': 'text/javascript',
      'content-length': body.length,
    });
    res.end(body);
  } else {
    res.writeHead(400);
    res.end('All content is served under "/serve/"');
  }
});
server.listen(PORT, '127.0.0.1', () => {
  const server_url = new URL('http://127.0.0.1/serve/');
  const server_address = server.address();
  server_url.host = server_address.address;
  server_url.port = PORT;
  console.log(`Server is available at ${server_url}`);
});
