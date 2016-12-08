"use strict";

var db = require('../../../models');
var oauthToken = require('../../../lib/oauth2-token');

var USER_NOT_FOUND = { name: 'USER_NOT_FOUND', message: 'USER_NOT_FOUND' };
var WRONG_PASSWORD = { name: 'WRONG_PASSWORD', message: 'WRONG_PASSWORD' };

// Grant authorization by resource owner (user) and password credentials.
// The user is authenticated and checked for validity - this strategy should
// only be available to a select few, highly trusted clients!
// The application issues a token, which is bound to these values.

exports.token = function (client, username, password, scope, done) {
	// TODO confirm this particular client actually may use this validation strategy?!
	return confirmUser(client, username, password, scope, done);
};

function confirmUser(client, username, password, scope, done) {
	db.User.find(
		{where: {email: username}}
	).then(
		function (user) {
			if (!user) {
				done(USER_NOT_FOUND);
				return;
			}

			user.verifyPassword(password).then(function (isMatch) {
					if (isMatch) {
						return provideTokens(client, user, done);
					} else {
						return done(WRONG_PASSWORD);
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

function provideTokens(client, user, done) {
	try {
		var accessToken = oauthToken.generateAccessToken(client, user);
		var refreshToken = oauthToken.generateRefreshToken(client, user, undefined);
		var extras = oauthToken.generateTokenExtras(client, user);
		return done(null, accessToken, refreshToken, extras);
	} catch (e) {
		return done(e);
	}
}
