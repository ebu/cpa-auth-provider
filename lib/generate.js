"use strict";

var crypto = require('crypto');
var uuid = require('uuid');


var randomString = function (payload) {
    var randomSalt = new Date().getTime() + Math.random() * Math.random();
    var md5engine = crypto.createHash('md5');

    return md5engine.update(payload.toString() + randomSalt.toString()).digest('hex');
};

// TODO: Probably need a list of stop words, to avoid possibility
// of offending the user
var upperCase = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // removed: 'I', 'O'
var lowerCase = "abcdefghijkmnpqrstuvwxyz"; // removed: 'l', 'o'
var digit = "0123456789";
var characterSet = upperCase + lowerCase;
var digitCharacterSet = digit + upperCase + lowerCase;

var userCodeLength = 8;
var clientIdLength = 16;


var code = function (charSet, length){
    var code = '';

    for (var i = 0; i < length; i++) {

        var index = (Math.random() * charSet.length) + 0;

        var digit = Math.floor(index);

        code += charSet[digit];
    }

    return code;
};

module.exports = {
    clientSecret: function (payload) {
        return randomString(payload);
    },

    userCode: function () {

        return code(characterSet, userCodeLength);

    },

    clientId: function () {

        return code(digitCharacterSet, clientIdLength);

    },

	accountId: function () {
		return uuid.v4();
	},


    authorizationCode: function () {
        return uuid.v4();
    },

    deviceCode: function () {
        return uuid.v4();
    },

    refreshToken: function () {
        return uuid.v4();
    },

    accessToken: function () {
        return randomString('');
    },

    cryptoCode: function (length) {
        var buf = crypto.randomBytes(length / 2);
        return buf.toString('hex');
    }
};
