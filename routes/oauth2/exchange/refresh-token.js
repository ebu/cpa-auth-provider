"use strict";

var oauthTokenHelper = require('../../../lib/oauth2-token');
var TokenError = require('oauth2orize').TokenError;
var logger = require('../../../lib/logger');

exports.issueToken = issueToken;

function issueToken(client, token, scope, done) {
	oauthTokenHelper.validateRefreshToken(token, client ? client.id : 0, scope)
		.then(
			function (user) {
				if (user) {
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
						);
					} catch (e) {
						return done(e);
					}
				}
			},
			function (error) {
				logger.error('[OAuth2][issueToken]', error);
				return done(new TokenError(oauthTokenHelper.ERRORS.BAD_REQUEST.message, oauthTokenHelper.ERRORS.BAD_REQUEST.code));
			}
		)
		.catch(
			function (error) {
				logger.error('[OAuth2][issueToken][err', error, ']');
				return done(error);
			}
		);
}

