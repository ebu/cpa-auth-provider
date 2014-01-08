"use strict";

var crypto = require('crypto');
var generate = {};


var randomString = function(payload) {

  var randomSalt = new Date().getTime() + Math.random() * Math.random();
  var md5engine = crypto.createHash('md5');

  return md5engine.update(payload.toString() + randomSalt.toString()).digest('hex');

};

generate.clientSecret = function(payload) {
  return randomString(payload);
};

generate.userCode = function() {
  return randomString('').substr(0, 5);
};

generate.deviceCode = function() {
  return generate.clientSecret('');
};

generate.accessToken = function() {
  return 'token:' + randomString('');
};


module.exports = generate;