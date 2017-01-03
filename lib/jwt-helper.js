
var config = require('../config');
var jwt = require('jsonwebtoken');

module.exports = {
	getUserId: getUserId,
	generate: generate,
	decode: decode
};

function getUserId(token) {
	return decode(token).sub;
}

function decode(token) {
	return jwt.verify(token, config.jwtSecret);
}

function generate(userId, expires, extra) {
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

	return jwt.sign(token, config.jwtSecret, { expiresIn: expires / 1000 });
}