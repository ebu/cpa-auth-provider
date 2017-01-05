
var config = require('../config');
var jwt = require('jsonwebtoken');

module.exports = {
	getUserId: getUserId,
	generate: generate,
	read: read,
	decode: decode
};

/** access the data, without verifying */
function read(token) {
	return jwt.decode(token);
}

function getUserId(token, secret) {
	return decode(token, secret).sub;
}

function decode(token, secret) {
	secret = secret || config.jwtSecret;
	return jwt.verify(token, secret);
}

function generate(userId, expires, extra, secret) {
	secret = secret || config.jwtSecret;
	var token = {
		iss: config.jwt.issuer,
		aud: config.jwt.audience,
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

	return jwt.sign(token, secret, { expiresIn: expires / 1000 });
}