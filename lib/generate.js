"use strict";

var crypto = require('crypto');
var generate = {};

generate.clientSecret = function(payload) {

  var randomSalt = new Date().getTime() + Math.random() * Math.random();
  var md5engine = crypto.createHash('md5');

  return md5engine.update(payload.toString() + randomSalt.toString()).digest('hex');

}

generate.accessToken = function(){

  var randomSalt = new Date().getTime() + Math.random() * Math.random();
  var md5engine = crypto.createHash('md5');

  return 'token:' + md5engine.update(randomSalt.toString()).digest('hex');

}


module.exports = generate;