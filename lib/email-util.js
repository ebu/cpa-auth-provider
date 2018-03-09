/**
 * simple assistant util to send specific emails for verification,
 * deletion, or password reset to users.
 */
"use strict";

var db = require('../models');
var uuid = require('uuid');
var emailHelper = require('./email-helper');
var config = require('../config');
const logger = require('./logger');

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
            if (!user.LocalLogin || !user.LocalLogin.login) {
                return reject(new Error('email field not set'));
            }

            const buffer = new Buffer(16);
            uuid.v4({}, buffer);
            var key = buffer.toString('base64');

            db.UserEmailToken.create({
                key: key,
                type: 'REG',
                user_id: user.id,
                redirect_uri: redirectUri,
                oauth2_client_id: client ? client.id : undefined
            }).then(
                function () {
                    var confirmLink = host + '/email/verify/' + encodeURIComponent(key);
                    var deleteLink = host + '/email/delete/' + encodeURIComponent(key);
                    let username = user.LocalLogin.login;
                    if (redirectUri) {
                        confirmLink = redirectUri + '?auth=account_created&username=' + encodeURIComponent(username) + '&token=' + encodeURIComponent(key);
                    }
                    logger.debug('send email', confirmLink);
                    return emailHelper.send(
                        config.mail.from,
                        user.LocalLogin.login,
                        "validation-email",
                        {log: false},
                        {
                            confirmLink: confirmLink,
                            deleteLink: deleteLink,
                            mail: user.LocalLogin.login,
                            host: config.mail.host,
                            code: encodeURIComponent(key),
                        },
                        user.language ? user.language : config.mail.local
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
            // if (!user.email) {
            // 	return reject(new Error('email field not set'));
            // }
            if (!user.LocalLogin || !user.LocalLogin.login) {
                return reject(new Error('email field not set'));
            }

            const buffer = new Buffer(16);
            uuid.v4({}, buffer);
            var key = buffer.toString('base64');

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
                        forceLink = redirectUri + '?auth=force-password&username=' + encodeURIComponent(user.LocalLogin.login) + '&token=' + encodeURIComponent(key);
                    }
                    logger.debug('send password force email', forceLink);

                    return emailHelper.send(
                        config.mail.from,
                        user.LocalLogin.login,
                        "password-recovery-email",
                        {log: false},
                        {
                            forceLink: forceLink,
                            host: config.mail.host,
                            mail: user.LocalLogin.login,
                            code: key
                        },
                        user.language || config.mail.local
                    );
                }
            ).then(
                resolve
            ).catch(
                reject
            );
        });
}

