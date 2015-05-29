'use strict';

var debug = require('debug')('sane-web-socket:server');
var Promise = require('bluebird');
var ioFactory = require('socket.io');

function Connection(socket) {
  this.socket = socket;
}

Connection.prototype.write = function (msgId, msg) {
  this.socket.emit(msgId, msg);
};

Connection.prototype.subscribe = function (channelId) {
  this.socket.join(channelId);
};

Connection.prototype.subscribeExclusively = function (channelId) {
  // TODO
  throw Error(channelId + ' subscribe failed (not implemented)');
};

Connection.prototype.publish = function (channelId, msgId, msg) {
  this.socket.server.sockets.in(channelId).emit(msgId, msg);
};

Connection.prototype.publishExcludeSelf = function (channelId, msgId, msg) {
  this.socket.broadcast.to(channelId).emit(msgId, msg);
};

function SaneWebSocketServer() {
  this.msgHandlers = {};
}

SaneWebSocketServer.prototype.on = function (msgId, fn, thisObj) {
  var promiseFn = Promise.method(fn);
  this.msgHandlers[msgId] = {
    fn: function (connection, msg, cb) {
      var res = promiseFn.call(this, connection, msg).then(function (res) {
        return res;
      }, function (err) {
        debug(err);
        return Promise.reject(err.message);
      });
      return (cb != null) ? res.asCallback(cb) : res;
    },
    thisObj: thisObj
  };
};

SaneWebSocketServer.prototype.start = function (httpServer, port) {
  if (this.hasOwnProperty('httpServer')) {
    throw Error('SaneWebSocketServer can only be started once');
  }
  this.httpServer = httpServer;

  var self = this;

  return new Promise(function(resolve, reject) {
    var errorHandler = function (err) {
      debug('Got an error while opening WS http server');

      reject(err);
    };
    httpServer.once('error', errorHandler);
    httpServer.listen(port, function () {
      debug('WS http server opened on port ' + port);

      self.io = ioFactory(this, {"transports": ["websocket"]});

      self.io.on('connection', function(socket){
        var connection = new Connection(socket);

        Object.keys(self.msgHandlers).forEach(function (msgId) {
          var msgHandler = self.msgHandlers[msgId];
          socket.on(msgId, msgHandler.fn.bind(msgHandler.thisObj, connection));
        });
      });

      httpServer.removeListener('error', errorHandler);
      resolve(self);
    });
  });
};

SaneWebSocketServer.prototype.stop = function () {
  if (!this.hasOwnProperty('httpServer')) {
    throw Error('SaneWebSocketServer cannot be stopped before being started');
  }

  var self = this;

  return new Promise(function(resolve, reject) {
    var closeHandler, errorHandler;
    errorHandler = function (err) {
      debug('Got an error while closing WS http server');

      self.httpServer.removeListener('close', closeHandler);
      reject(err);
    };
    closeHandler = function () {
      debug('WS http server closed');

      self.httpServer.removeListener('error', errorHandler);
      resolve(self);
    };
    self.httpServer.once('error', errorHandler);
    self.httpServer.once('close', closeHandler);

    self.io.close();
  });
};

module.exports = SaneWebSocketServer;
