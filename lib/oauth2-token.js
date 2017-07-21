/* globals module */
"use strict";

var jwtHelper = require('./jwt-helper');
var db = require('../models');
var config = require('../config');
var TokenError = require('oauth2orize').TokenError;


var ERRORS = {
	BAD_REQUEST: { message: 'BAD_REQUEST', code: 'invalid_request' },
	INVALID_REFRESH_TOKEN: { message: 'INVALID_REFRESH_TOKEN', code: 'invalid_request' },
	EXPIRED_REFRESH_TOKEN: { message: 'EXPIRED_REFRESH_TOKEN', code: 'invalid_request'},
	REQUEST_LIMIT_REACHED: { message: 'REQUEST_LIMIT_REACHED', code: 'invalid_request'},
	CLIENT_ID_MISMATCH: { message: 'CLIENT_ID_MISMATCH', code: 'invalid_request' },
	SCOPES_MISMATCH: { message: 'SCOPES_MISMATCH', code: 'invalid_request' },
	USER_UNAVAILABLE: { message: 'USER_UNAVAILABLE', code: 'invalid_request' },
	WRONG_PASSWORD: { message: 'WRONG_PASSWORD', code: 'invalid_request' },
	USER_NOT_FOUND: { message: 'USER_NOT_FOUND', code: 'invalid_request' }
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
function generateAccessToken(client, user, override_duration) {
	var duration = OPTIONS.access_token_duration || 10 * 60 * 60 * 1000;
	if (override_duration < duration) duration = override_duration;
	var extras = {
		typ: 'access',
		cli: client ? client.client_id : 0,
		vfy: isUserVerified(user) ? '1' : '0'
	};
	return jwtHelper.generate(user.id, duration, extras, client ? client.client_secret : undefined);
}

function generateTokenExtras(client, user, override_duration) {
	var duration = Math.floor((OPTIONS.access_token_duration || 10 * 60 * 60 * 1000) / 1000);
    if (override_duration < duration) duration = override_duration;
	return { 'expires_in': duration };
}

function isUserVerified(user) {
	return user ? user.email_verified : false;
}

function generateRefreshToken(client, user, scope, override_duration) {
	if (!OPTIONS.refresh_tokens_enabled) {
		return undefined;
	}
	var duration = OPTIONS.refresh_token_duration || 365 * 24 * 60 * 60 * 1000;
    if (override_duration < duration) duration = override_duration;
	var token = jwtHelper.generate(
		user.id,
		duration,
		{cli: client ? client.client_id : 0, sco: scope, typ: 'refresh'},
		client ? client.client_secret : undefined
	);

	return token;
}

function validateRefreshToken(token, client, scope) {
	return new Promise(
		function (resolve, reject) {
			var data;
			try {
				data = jwtHelper.decode(token, client ? client.client_secret : undefined);
			} catch(e) {
				return reject(new TokenError(ERRORS.INVALID_REFRESH_TOKEN.message, ERRORS.INVALID_REFRESH_TOKEN.code));
			}

			// if (data.exp - Date.now() < -1 * 60 * 1000) {
			// 	return reject(new TokenError(ERRORS.EXPIRED_REFRESH_TOKEN.message, ERRORS.EXPIRED_REFRESH_TOKEN.code));
			// }

			if (data.cli != (client ? client.client_id : 0)) {
				console.log('[validateRefreshToken][client_id][expected', client ? client.client_id : 0, '][found', data.cli, ']');
				return reject(new TokenError(ERRORS.CLIENT_ID_MISMATCH.message, ERRORS.CLIENT_ID_MISMATCH.code));
			}

			if (data.sco != scope) {
				return reject(new TokenError(ERRORS.SCOPES_MISMATCH.message, ERRORS.SCOPES_MISMATCH.code));
			}

			if (data.typ != 'refresh') {
				return reject(new TokenError(ERRORS.INVALID_REFRESH_TOKEN.message, ERRORS.INVALID_REFRESH_TOKEN.code));
			}

			var userId = data.sub;
			checkUser(userId).then(
				function(user) {
					return resolve(user);
				},
				function(error) {
					return reject(error);
				}
			).catch(
				function(error) {
					return reject(error);
				}
			);
		}
	);
}

function checkUser(userId) {
	return new Promise(
		function (resolve, reject) {
			db.User.find(
				{where: {id: userId}}
			).then(
				function (user) {
					if (!user) {
						return reject(new TokenError(ERRORS.USER_NOT_FOUND.message, ERRORS.USER_NOT_FOUND.code));
					}

					return resolve(user);
				},
				function (error) {
					return reject(error);
				}
			);
		}
	);
}
