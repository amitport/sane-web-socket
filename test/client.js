'use strict';

var
  assert = require('assert'),
  http = require('http'),
  SaneWebSocketServer = require('../server'),
  SaneWebSocketClient = require('../client');

describe('SaneWebSocketClient', function () {
  var ws;
  beforeEach(function () {
    var srv = http.createServer(function(req, res){
      res.writeHead(404);
      res.end();
    });

    ws = new SaneWebSocketServer();
    return ws.start(srv, 9000);
  });

  afterEach(function () {
    return ws.stop();
  });


  it("SaneWebSocketClient can get socket", function () {
    return new SaneWebSocketClient('http://localhost:9000').getSocket();
  });

  it("SaneWebSocketClient can receive message and return acks", function () {
    ws.on('test', function (connection, msg) {
      assert.strictEqual(msg, 'A');
      return 'B';
    });

    return new SaneWebSocketClient('http://localhost:9000').send('test', 'A').then(function(ack) {
      assert.strictEqual(ack, 'B');
    });
  });

  it("SaneWebSocketClient can receive message and receive errors", function () {
    ws.on('test', function (connection, msg) {
      assert.strictEqual(msg, 'A');
      throw Error('E');
    });

    return new SaneWebSocketClient('http://localhost:9000').send('test', 'A').catch(function(err) {
      assert.strictEqual(err, 'E');
    });
  });
});
