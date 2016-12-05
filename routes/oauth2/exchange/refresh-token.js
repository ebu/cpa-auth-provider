"use strict";

var refreshTokenHelper = require('../../../lib/oauth2-refresh-token');
var jwtHelper = require('../../../lib/jwt-helper');

exports.issueToken = issueToken;
exports.makeToken = makeToken;

function makeToken(client, userId, scope) {
	return refreshTokenHelper.generateRefreshToken(userId, client ? client.id : 0, scope);
}

function issueToken(client, token, scope, done) {
	refreshTokenHelper.validateRefreshToken(token, client ? client.id : 0, scope)
		.then(
			function(user) {
				if (user) {
					return provideAccessToken(client, user, done);
				}
			},
			function(error) {
				return done(error);
			}
		)
		.catch(
			function(error) {
				return done(error);
			}
		);
}

/**
 * provides an access token for user/client combination
 *
 * @param client
 * @param user
 * @param done function(err, token)
 */
function provideAccessToken(client, user, done) {
	try {
		var duration = 10 * 60 * 60 * 1000;
		var token = jwtHelper.generate(user.id, duration, {cli: client ? client.id : 0});
		return done(null, token);
	} catch(e) {
		return done(e);
	}
}