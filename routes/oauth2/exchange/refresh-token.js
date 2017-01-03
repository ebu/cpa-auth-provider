"use strict";

var oauthTokenHelper = require('../../../lib/oauth2-token');
var TokenError = require('oauth2orize').TokenError;
var logger = require('../../../lib/logger');

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
				if (logger && typeof(logger.error) == 'function') {
					logger.error('[OAuth2][issueToken]', error);
				}
				return done(new TokenError(oauthTokenHelper.ERRORS.BAD_REQUEST.message, oauthTokenHelper.ERRORS.BAD_REQUEST.code));
			}
		)
		.catch(
			function(error) {
				return done(error);
			}
		);
}

