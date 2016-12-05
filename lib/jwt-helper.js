/* globals module */
var config = require('../config');
var jwt = require('jwt-simple');

module.exports = {
	getUserId: getUserId,
	generate: generate,
	decode: decode
};

function getUserId(token) {
	return decode(token).sub;
}

function decode(token) {
	return jwt.decode(token, config.jwtSecret);
}

function generate(userId, duration, extra) {
	var expires = Date.now() + duration;
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