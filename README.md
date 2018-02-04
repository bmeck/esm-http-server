# ESM HTTP Server

A server that can intelligently handle ESM specifiers.

## CLI

```sh
# serve from fs
PORT=8080 esm-http-server

# serve as proxy
PORT=8081 HTTP_PROXY=http://localhost:8080/serve/ esm-http-server
```

## Usage

All files will be served under the `/serve/` prefix, so a `index.html` file at the root of the location providing content would be available at `/serve/index.html`.

## Using a loader

By default specifiers follow the [WHATWG module resolution algorithm](https://html.spec.whatwg.org/multipage/webappapis.html#resolve-a-module-specifier).

```sh
PORT=8080 esm-http-server loader.js
```

You can inspect the shape of the [default loader](./loaders/whatwg.js) to see what a custom one needs to provide.

## Limitations

Since the server only intercepts [JS MIME types](https://html.spec.whatwg.org/multipage/scripting.html#javascript-mime-type), if you serve non-module JS under a different MIME it will not be intercepted.
