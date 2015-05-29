#  [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]

> Provides sane defaults and API around socket.io core.


## Install

```sh
$ npm install --save sane-web-socket
```


## Usage

### Server
```js
var SaneWebSocketServer = require('sane-web-socket/server');
```

### Client

Require and pass through any commonjs-browser bridge, such as [browserify](http://browserify.org/):
 
```js
var SaneWebSocketClient = require('sane-web-socket/client');
```

Or, create standalone browser bundle:

```sh
# creates sane-web-socket-client.js
$ npm run browser
```

## License

AGPL © [Amit Portnoy](https://github.com/amitport)


[npm-image]: https://badge.fury.io/js/sane-web-socket.svg
[npm-url]: https://npmjs.org/package/sane-web-socket
[travis-image]: https://travis-ci.org/amitport/sane-web-socket.svg?branch=master
[travis-url]: https://travis-ci.org/amitport/sane-web-socket
[daviddm-image]: https://david-dm.org/amitport/sane-web-socket.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/amitport/sane-web-socket
