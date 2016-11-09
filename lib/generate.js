"use strict";

var crypto = require('crypto');
var uuid   = require('node-uuid');

var randomString = function(payload) {
  var randomSalt = new Date().getTime() + Math.random() * Math.random();
  var md5engine = crypto.createHash('md5');

  return md5engine.update(payload.toString() + randomSalt.toString()).digest('hex');
};

// TODO: Probably need a list of stop words, to avoid possibility
// of offending the user
var upperCase    = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // removed: 'I', 'O'
var lowerCase    = "abcdefghijkmnpqrstuvwxyz"; // removed: 'l', 'o'
var characterSet = upperCase + lowerCase;

var characterSetLength   = characterSet.length;
var userCodeLength       = 8;
var numberOfCombinations = Math.pow(characterSetLength, userCodeLength);

module.exports = {
  clientSecret: function(payload) {
    return randomString(payload);
  },

  userCode: function() {
    var number = Math.random() * numberOfCombinations;

    var userCode = '';

    for (var i = 0; i < userCodeLength; i++) {
      var digit = number % characterSetLength;
      userCode += characterSet[digit];

      number = Math.floor(number / characterSetLength);
    }

    return userCode;
  },

  authorizationCode: function() {
    return uuid.v4();
  },

  deviceCode: function() {
    return uuid.v4();
  },

  accessToken: function() {
    return randomString('');
  }
};
