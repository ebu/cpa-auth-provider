"use strict";

var db = require('../../../models');
var oauthToken = require('../../../lib/oauth2-token');

var INCORRECT_LOGIN_OR_PASS = 'The user name or password is incorrect';

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
				done(INCORRECT_LOGIN_OR_PASS);
				return;
			}

			user.verifyPassword(password).then(function (isMatch) {
					if (isMatch) {
						return provideTokens(client, user, done);
					} else {
						return done(INCORRECT_LOGIN_OR_PASS);
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
