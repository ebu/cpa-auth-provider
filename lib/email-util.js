/**
 * simple assistant util to send specific emails for verification,
 * deletion, or password reset to users.
 */
"use strict";

var db = require('../models');
var uuid = require('node-uuid');
var sendEmail = require('./send-email');

module.exports = {
	sendVerifyEmail: sendVerifyEmail,
	sendForcePasswordEmail: sendForcePasswordEmail,
};

/**
 * send a verification email to a specified user
 * who needs to have the email feel set.
 * @param user
 * @param host
 * @param client
 * 		The product for which this user is registering. It is meant to allow
 * 		redirecting to a proper page. (optional)
 * @param sub
 * 		The submodule/branch to be used for the redirect url.
 */
function sendVerifyEmail(user, host, client, sub) {
	return new Promise(
		function (resolve, reject) {
			if (!user.email) {
				return reject(new Error('email field not set'));
			}

			db.sequelize.sync().then(function () {
				var baseUid = uuid.v4();
				var key = new Buffer(uuid.parse(baseUid)).toString('base64');

				db.UserEmailToken.create({
					key: key,
					type: 'REG',
					user_id: user.id,
					sub: sub,
					oauth2_client_id: client ? client.id : undefined
				}).then(
					function (verifyToken) {
						var confirmLink = host + '/email/verify/' + encodeURIComponent(key);
						var deleteLink = host + '/email/delete/' + encodeURIComponent(key);
						console.log('send email', confirmLink);
						sendEmail.sendConfirmEmail(user.email, confirmLink, deleteLink).then(resolve, reject);
					},
					function (err) {
						reject(err);
					}
				)
			})
		});
}

/**
 * send a password reset email to a specified user
 * who needs to have the email feel set.
 * @param user
 * @param host
 * @param client
 * 		The product for which this user is registering. It is meant to allow
 * 		redirecting to a proper page. (optional)
 * @param redirectUri
 * 		The actual redirection page.
 */
function sendForcePasswordEmail(user, host, client, redirectUri) {
	return new Promise(
		function (resolve, reject) {
			if (!user.email) {
				return reject(new Error('email field not set'));
			}
			if (!user.email_verified) {
				// TODO: needs to handle this differently!
				return reject(new Error('email not verified'));
			}

			db.sequelize.sync().then(function () {
				var baseUid = uuid.v4();
				var key = new Buffer(uuid.parse(baseUid)).toString('base64');

				db.UserEmailToken.create({
					key: key,
					type: 'PWD',
					user_id: user.id,
					redirect_uri: redirectUri,
					oauth2_client_id: client ? client.id : undefined
				}).then(
					function (token) {
						var forceLink = host + '/email/force/' + encodeURIComponent(key);
						if (redirectUri) {
							forceLink = redirectUri + '?auth=force-password&username=' + encodeURIComponent(user.email) + '&token=' + encodeURIComponent(key);
						}
						console.log('send password force email', forceLink);
						sendEmail.sendForcePasswordEmail(user.email, forceLink).then(resolve, reject);
					},
					function (err) {
						reject(err);
					}
				)
			})
		});
}

