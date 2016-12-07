"use strict";

var oauthTokenHelper = require('../../../lib/oauth2-token');

exports.issueToken = issueToken;

function issueToken(client, token, scope, done) {
	oauthTokenHelper.validateRefreshToken(token, client ? client.id : 0, scope)
		.then(
			function(user) {
				if (user) {
					try {
						var accessToken = oauthTokenHelper.generateAccessToken(client, user);
						var refreshToken = oauthTokenHelper.generateRefreshToken(client, user, scope);
						var extras = oauthTokenHelper.generateTokenExtras(client, user);
						return done(null, accessToken, refreshToken, extras);
					} catch(e) {
						return done(e);
					}
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

