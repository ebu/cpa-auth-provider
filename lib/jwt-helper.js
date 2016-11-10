
var config = require('../config');
var jwt = require('jwt-simple');

var getUserId = function getUserId(token) {
	return decode(token).sub;
}

var decode = function (token) {
	return jwt.decode(token, config.jwtSecret);
}

var getToken = function (headers) {
	if (headers && headers.authorization) {
		var parted = headers.authorization.split(' ');
		if (parted.length === 2) {
			return parted[1];
		} else {
			return null;
		}
	} else {
		return null;
	}
};

var generate = function (userId, expires, extra) {
	var token = {
		iss: config.jwt.issuer,
		aud: config.jwt.audience,
		exp: expires,
		sub: userId
	};

	if (extra) {
		for (var key in extra) {
			if (extra.hasOwnProperty(key)) {
				if (token.hasOwnProperty(key)) {
					throw new Error('Cannot use ' + key + ' in extra. Claimed by default value.');
				} else {
					token[key] = extra[key];
				}
			}
		}
	}

	return jwt.encode(token, config.jwtSecret);
}

module.exports = {
	getUserId: getUserId,
	generate: generate,
	decode: decode,
	getToken:getToken
};