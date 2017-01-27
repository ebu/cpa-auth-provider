"use strict";

var jwtHelper = require('./jwt-helper');
var db = require('../models');
var config = require('../config');
var TokenError = require('oauth2orize').TokenError;
var generate = require('./generate');


var ERRORS = {
	BAD_REQUEST: {message: 'BAD_REQUEST', code: 'invalid_request'},
	INVALID_REFRESH_TOKEN: {message: 'INVALID_REFRESH_TOKEN', code: 'invalid_request'},
	EXPIRED_REFRESH_TOKEN: {message: 'EXPIRED_REFRESH_TOKEN', code: 'invalid_request'},
	REQUEST_LIMIT_REACHED: {message: 'REQUEST_LIMIT_REACHED', code: 'invalid_request'},
	CLIENT_ID_MISMATCH: {message: 'CLIENT_ID_MISMATCH', code: 'invalid_request'},
	SCOPES_MISMATCH: {message: 'SCOPES_MISMATCH', code: 'invalid_request'},
	USER_UNAVAILABLE: {message: 'USER_UNAVAILABLE', code: 'invalid_request'},
	WRONG_PASSWORD: {message: 'WRONG_PASSWORD', code: 'invalid_request'},
	USER_NOT_FOUND: {message: 'USER_NOT_FOUND', code: 'invalid_request'}
};

module.exports = {
	ERRORS: ERRORS,
	generateTokenExtras: generateTokenExtras,
	generateAccessToken: generateAccessToken,
	generateRefreshToken: generateRefreshToken,
	validateRefreshToken: validateRefreshToken
};


var OPTIONS = config.oauth2 || {};

/**
 * provides an access token for user/client combination
 *
 * @param client
 * @param user
 */
function generateAccessToken(client, user) {
	return new Promise(
		function (resolve, reject) {
			var duration = OPTIONS.access_token_duration || 10 * 60 * 60 * 1000;
			var extras = {
				typ: 'access',
				cli: client ? client.id : 0,
				vfy: isUserVerified(user) ? '1' : '0'
			};
			return resolve(jwtHelper.generate(user.id, duration, extras));
		});
}

function generateTokenExtras(client, user) {
	return new Promise(
		function (resolve, reject) {
			var duration = Math.floor((OPTIONS.access_token_duration || 10 * 60 * 60 * 1000) / 1000);
			return resolve({'expires_in': duration});
		});
}

function isUserVerified(user) {
	// TODO check if user is actually verified!
	return true;
}

function generateRefreshToken(client, user, scope) {
	return new Promise(
		function (resolve, reject) {
			if (!OPTIONS.refresh_tokens_enabled) {
				return resolve(undefined);
			}
			var duration = OPTIONS.refresh_token_duration || 365 * 24 * 60 * 60 * 1000;
			var expirationDate = new Date(Date.now() + duration);

			db.OAuth2RefreshToken.create(
				{
					key: generate.refreshToken(),
					expires_at: expirationDate,
					consumed: false,
					oauth2_client_id: client ? client.id : 0,
					user_id: user.id,
					scope: scope
				}
			).then(
				function (token) {
					return resolve(token.key);
				}
			).catch(
				reject
			);
		});
}

function validateRefreshToken(token, clientId, scope) {
	return new Promise(
		function (resolve, reject) {
			db.OAuth2RefreshToken.find(
				{
					where: {key: token},
					include: [db.OAuth2Client, db.User]
				}
			).then(
				function (oauth2Token) {
					if (clientId != 0 && oauth2Token.oAuth2Client.id != clientId) {
						return reject(new TokenError(ERRORS.CLIENT_ID_MISMATCH.message, ERRORS.CLIENT_ID_MISMATCH.code));
					}
					if (!oauth2Token.user) {
						return reject(new TokenError(ERRORS.USER_NOT_FOUND.message, ERRORS.USER_NOT_FOUND.code));
					}
					if (oauth2Token.expires_at - Date.now < -1 * 60 * 1000) {
						return reject(new TokenError(ERRORS.EXPIRED_REFRESH_TOKEN.message, ERRORS.EXPIRED_REFRESH_TOKEN.code));
					}
					if (oauth2Token.scope && oauth2Token.scope != scope) {
						return reject(new TokenError(ERRORS.SCOPES_MISMATCH.message, ERRORS.SCOPES_MISMATCH.code));
					}

					return resolve(oauth2Token.user);
				}
			).catch(
				function (err) {
					return reject(new TokenError(ERRORS.INVALID_REFRESH_TOKEN.message, ERRORS.INVALID_REFRESH_TOKEN.code));
				}
			);
		}
	);
}
