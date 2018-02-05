/**
 * simple assistant util to send specific emails for verification,
 * deletion, or password reset to users.
 */
"use strict";

var db = require('../models');
var uuid = require('node-uuid');
var emailHelper = require('./email-helper');
var config = require('../config');

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
 *        The product for which this user is registering. It is meant to allow
 *        redirecting to a proper page. (optional)
 * @param redirectUri
 *        A redirection (which will be checked)
 */
function sendVerifyEmail(user, host, client, redirectUri) {
	return new Promise(
		function (resolve, reject) {
			if (!user.email) {
				return reject(new Error('email field not set'));
			}

			var baseUid = uuid.v4();
			var key = new Buffer(uuid.parse(baseUid)).toString('base64');

			db.UserEmailToken.create({
				key: key,
				type: 'REG',
				user_id: user.id,
				redirect_uri: redirectUri,
				oauth2_client_id: client ? client.id : undefined
			}).then(
				function (verifyToken) {
					var confirmLink = host + '/email/verify/' + encodeURIComponent(key);
					var deleteLink = host + '/email/delete/' + encodeURIComponent(key);
					if (redirectUri) {
						confirmLink = redirectUri + '?auth=account_created&username=' + encodeURIComponent(user.email) + '&token=' + encodeURIComponent(key);
					}
					console.log('send email', confirmLink);
					return emailHelper.send(
						config.mail.from,
						user.email,
						"validation-email",
						{log: false},
						{
							confirmLink: confirmLink,
							deleteLink: deleteLink,
							mail: user.email,
                            host: config.mail.host,
                            code: encodeURIComponent(key),
						},
                        (user.UserProfile && user.UserProfile.language) ? user.UserProfile.language : config.mail.local
					);
				}
			).then(
				resolve
			).catch(
				function (err) {
					reject(err);
				}
			);
		});
}

/**
 * send a password reset email to a specified user
 * who needs to have the email feel set.
 * @param user
 * @param host
 * @param client
 *        The product for which this user is registering. It is meant to allow
 *        redirecting to a proper page. (optional)
 * @param redirectUri
 *        The actual redirection page.
 */
function sendForcePasswordEmail(user, host, client, redirectUri) {
	return new Promise(
		function (resolve, reject) {
			if (!user.email) {
				return reject(new Error('email field not set'));
			}

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

                    return emailHelper.send(
                        config.mail.from,
                        user.email,
                        "password-recovery-email",
                        {log: false},
                        {
                            forceLink: forceLink,
                            host: config.mail.host,
                            mail: user.email,
                            code: key
                        },
                        (user.UserProfile && user.UserProfile.language) ? user.UserProfile.language : config.mail.local
                    );
				}
			).then(
				resolve
			).catch(
				reject
			);
		});
}

