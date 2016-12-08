/* globals module */
"use strict";

var jwtHelper = require('./jwt-helper');
var db = require('../models');
var config = require('../config');


var ERRORS = {
	INVALID_REFRESH_TOKEN: { message: 'INVALID_REFRESH_TOKEN' },
	EXPIRED_REFRESH_TOKEN: { message: 'EXPIRED_REFRESH_TOKEN'},
	REQUEST_LIMIT_REACHED: { message: 'REQUEST_LIMIT_REACHED'},
	CLIENT_ID_MISMATCH: { message: 'CLIENT_ID_MISMATCH' },
	SCOPES_MISMATCH: { message: 'SCOPES_MISMATCH' },
	USER_NOT_FOUND: { message: 'USER_NOT_FOUND' }
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
	var duration = OPTIONS.access_token_duration || 10 * 60 * 60 * 1000;
	var extras = {
		typ: 'access',
		cli: client ? client.id : 0,
		vfy: isUserVerified(user) ? '1' : '0'
	};
	return jwtHelper.generate(user.id, duration, extras);
}

function generateTokenExtras(client, user) {
	var duration = Math.floor((OPTIONS.access_token_duration || 10 * 60 * 60 * 1000) / 1000);
	return { 'expires_in': duration };
}

function isUserVerified(user) {
	// TODO check if user is actually verified!
	return true;
}

function generateRefreshToken(client, user, scope) {
	if (!OPTIONS.refresh_tokens_enabled) {
		return undefined;
	}
	var duration = OPTIONS.refresh_token_duration || 365 * 24 * 60 * 60 * 1000;
	var token = jwtHelper.generate(user.id, duration, {cli: client ? client.id : 0, sco: scope, typ: 'refresh'});

	return token;
}

function validateRefreshToken(token, clientId, scope) {
	return new Promise(
		function (resolve, reject) {
			var data = jwtHelper.decode(token);

			if (data.exp - Date.now() < -1 * 60 * 1000) {
				return reject(ERRORS.EXPIRED_REFRESH_TOKEN);
			}

			if (data.cli != clientId) {
				return reject(ERRORS.CLIENT_ID_MISMATCH);
			}

			if (data.sco != scope) {
				return reject(ERRORS.SCOPES_MISMATCH);
			}

			if (data.typ != 'refresh') {
				return reject(ERRORS.INVALID_REFRESH_TOKEN);
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
						return reject(ERRORS.USER_NOT_FOUND);
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
