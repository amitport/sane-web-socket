'use strict';

var
  assert = require('assert'),
  http = require('http'),
  SaneWebSocketServer = require('../server'),
  ioClientFactory = require('socket.io-client');

describe('SaneWebSocketServer', function () {
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

  it("can receive message and return acks", function (done) {
    this.timeout(2000);

    ws.on('test', function (connection, msg) {
      assert.strictEqual(msg, 'A');
      return 'B';
    });

    var c = ioClientFactory('http://localhost:9000', {forceNew: true, "transports": ["websocket"]});
    c.emit('test', 'A', function(err, ack) {
      assert.strictEqual(ack, 'B');
      done();
    });
  });

  it("can receive message throw errors", function (done) {
    this.timeout(2000);

    ws.on('test', function (connection, msg) {
      assert.strictEqual(msg, 'A');
      throw Error('B');
    });

    var c = ioClientFactory('http://localhost:9000', {forceNew: true, "transports": ["websocket"]});
    c.emit('test', 'A', function(err) {
      assert.strictEqual(err, 'B');
      done();
    });
  });

  it("connection object persist between messages", function (done) {
    this.timeout(2000);

    ws.on('test1', function (connection) {
      connection.test = 'A';
    });

    ws.on('test2', function (connection) {
      assert.strictEqual(connection.test, 'A');
      done();
    });

    var c = ioClientFactory('http://localhost:9000', {forceNew: true, "transports": ["websocket"]});
    c.emit('test1');
    c.emit('test2');
  });

  it("connection object can be used to pub-sub", function (done) {
    this.timeout(2000);

    ws.on('subscribe', function (connection) {
      connection.subscribe('channel');
    });

    ws.on('publish', function (connection, msg) {
      connection.publish('channel', 'test', msg);
    });

    ws.on('publishExcludeSelf', function (connection) {
      connection.publishExcludeSelf('channel', 'test2', 'msgExcludeSelf');
    });

    var c1 = ioClientFactory('http://localhost:9000', {forceNew: true, "transports": ["websocket"]});
    var c2 = ioClientFactory('http://localhost:9000', {forceNew: true, "transports": ["websocket"]});
    var counter = 0;
    c1.on('test', function(msg) {
      assert.strictEqual(msg, 'msg');
      counter++;
      assert(counter <= 2);
      if (counter === 2) {
        c2.emit('publishExcludeSelf');
      }
    });
    c2.on('test', function(msg) {
      assert.strictEqual(msg, 'msg');
      counter++;
      assert(counter <= 2);
      if (counter === 2) {
        c2.emit('publishExcludeSelf');
      }
    });

    c1.on('test2', function(msg) {
      assert.strictEqual(msg, 'msgExcludeSelf');
      setTimeout(function() {// give the message a chance to (erroneously) reach client2
        done();
      }, 500);
    });
    c2.on('test2', function() {
      assert.fail('this message should have excluded self');
    });

    c1.emit('subscribe');
    c2.emit('subscribe');

    c2.emit('publish', 'msg');
  });
});
