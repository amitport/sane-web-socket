'use strict';

var debug = require('debug')('sane-web-socket:client');
var Promise = require('bluebird');
var ioClientFactory = require('socket.io-client');

function SaneWebSocketClient(address) {
  this.address = address;
}

SaneWebSocketClient.prototype.getSocket = function() {
  if (this.hasOwnProperty('socket') && this._socket.connected) {
    return Promise.resolve(this._socket);
  }
  if (this.connectingPromise) {
    return this.connectingPromise;
  }

  var self = this;
  return this.connectingPromise = new Promise(function(resolve, reject) {
    self._socket = ioClientFactory(self.address, {forceNew: true, "transports": ["websocket"], autoConnect: false});

    self._socket.on('error', function(error) {
      debug('socket-error: ' + error);
    });
    self._socket.on('disconnect', function(reason) {
      debug('socket-disconnect: ' + reason);
    });

    function onManagerConnectError(error) {
      delete self.connectingPromise;
      reject(error);
    }
    self._socket.io.once('connect_error', onManagerConnectError);

    function onSocketConnectError(error) {
      delete self.connectingPromise;
      reject(Error(error));

      self._socket.disconnect();
    }
    self._socket.once('error', onSocketConnectError);

    self._socket.once('connect', function() {
      debug('socket-connect: ' + self.address);

      self._socket.io.off('connect_error', onManagerConnectError);
      self._socket.off('error', onSocketConnectError);

      delete self.connectingPromise;
      resolve(self._socket);
    });

    self._socket.connect();
  });
};

SaneWebSocketClient.prototype.on = function (msgId, handler) {
  return this.getSocket().then(function(socket) {
    socket.on(msgId, handler);
  });
};

SaneWebSocketClient.prototype.send = function (msgId, msg) {
  return this.getSocket().then(function(socket) {
    debug('socket-send: ' + msgId + " - " + msg);
    return new Promise(function (resolve, reject) {
      socket.emit(msgId, msg, function(err, ack) {
        if (err != null) {
          reject(err);
        } else {
          resolve(ack);
        }
      });
    });
  });
};

module.exports = SaneWebSocketClient;
