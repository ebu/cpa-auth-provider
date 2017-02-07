"use strict";

var db = require('../../../models');
var oauthTokenHelper = require('../../../lib/oauth2-token');
var logger = require('../../../lib/logger');

var jwtHelper = require('../../../lib/jwt-helper');

var INCORRECT_LOGIN_OR_PASS = 'The user name or password is incorrect';

// Grant authorization by resource owner (user) and password credentials.
// The user is authenticated and checked for validity - this strategy should
// only be available to a select few, highly trusted clients!
// The application issues a token, which is bound to these values.

exports.token = function (client, username, password, scope, done) {
	// resource owner password does not have a client, so no checking for valid client!
	return confirmUser(client, username, password, scope, done);
};

function confirmUser(client, username, password, scope, done) {
	db.User.findOne(
		{ where: { email: username} }
	).then(
		function (user) {
			if (!user) {
				done(INCORRECT_LOGIN_OR_PASS);
				return;
			}

			user.verifyPassword(password).then(function (isMatch) {
					if (isMatch) {
						provideAccessToken(client, user, scope, done);
					} else {
						done(INCORRECT_LOGIN_OR_PASS);
					}
				},
				function (err) {
					done(err);
				});
		},
		function (error) {
			done(error);
		}
	);
}

/**
 * provides an access token for user/client combination
 *
 * @param client
 * @param user
 * @param scope
 * @param done function(err, token)
 */
function provideAccessToken(client, user, scope, done) {
	try {
		var accessToken, refreshToken;

		oauthTokenHelper.generateAccessToken(client, user).then(
			function (_accessToken) {
				accessToken = _accessToken;
				return oauthTokenHelper.generateRefreshToken(client, user, scope);
			}
		).then(
			function (_refreshToken) {
				refreshToken = _refreshToken;
				return oauthTokenHelper.generateTokenExtras(client, user);
			}
		).then(
			function (_extras) {
				return done(null, accessToken, refreshToken, _extras);
			}
		).catch(
			function (err) {
				logger.debug('[OAuth2][ResourceOwner][FAIL][err', err, ']');
			}
		);
	} catch (e) {
		return done(e);
	}
}