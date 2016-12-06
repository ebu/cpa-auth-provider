/* globals module */
"use strict";

var jwtHelper = require('./jwt-helper');
var db = require('../models');
var config = require('../config');


module.exports = {
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
	try {
		var duration = OPTIONS.access_token_duration || 10 * 60 * 60 * 1000;
		var extras = {
			typ: 'access',
			cli: client ? client.id : 0,
			sco: isUserVerified(user) ? '*' : 'limited'
		};
		return jwtHelper.generate(user.id, duration, extras);
	} catch(e) {
		return done(e);
	}
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
				return reject('expired');
			}

			if (data.cli != clientId) {
				return reject('client id mismatch');
			}

			if (data.sco != scope) {
				return reject('scopes do not match');
			}

			if (data.typ != 'refresh') {
				return reject('not a valid token');
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
						return reject('user not found');
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
