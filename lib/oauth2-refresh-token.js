/* globals module */
"use strict";

var jwtHelper = require('./jwt-helper');
var db = require('../models');


module.exports = {
	generateRefreshToken: generateRefreshToken,
	validateRefreshToken: validateRefreshToken
};

function generateRefreshToken(userId, clientId, scope) {
	var duration = 365 * 24 * 60 * 60 * 1000;
	var token = jwtHelper.generate(userId, duration, {cli: clientId, sco: scope});

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