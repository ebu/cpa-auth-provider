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
						).catch(
							function(err) {
								return done(err);
							}
						);
					} catch (e) {
						return done(e);
					}
				} else {
					return done(new TokenError(oauthTokenHelper.ERRORS.USER_NOT_FOUND.message, oauthTokenHelper.ERRORS.USER_NOT_FOUND.code));
				}
			},
			function (error) {
				logger.error('[OAuth2][issueToken]', error);
				// return done(new TokenError(oauthTokenHelper.ERRORS.BAD_REQUEST.message, oauthTokenHelper.ERRORS.BAD_REQUEST.code));
				return done(error);
			}
		)
		.catch(
			function (error) {
				logger.error('[OAuth2][issueToken][err', error, ']');
				return done(error);
			}
		);
}

