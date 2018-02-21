"use strict";

var db = require('../../models/index');
var logger = require('../../lib/logger');
var cors = require('cors');
var authHelper = require('../../lib/auth-helper');
var passport = require('passport');
var emailHelper = require('../../lib/email-helper');
var config = require('../../config');
var uuid = require('uuid');
var socialLoginHelper = require('../../lib/social-login-helper');

var STATES = {
    INVALID_TOKEN: 'INVALID_TOKEN',
    MISMATCHED_CLIENT_ID: 'MISMATCHED_CLIENT_ID',
    ALREADY_USED: 'ALREADY_USED',
    EMAIL_ALREADY_TAKEN: 'EMAIL_ALREADY_TAKEN',
    WRONG_PASSWORD: 'WRONG_PASSWORD',
    TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
};

const APPEND_MOVED = '?auth=account_moved';
const CHANGE_CONF = config.emailChange || {};
const VALIDITY_DURATION = CHANGE_CONF.validity || 24 * 60 * 60;
const DELETION_INTERVAL = CHANGE_CONF.deletionInterval || 8 * 60 * 60;
const REQUEST_LIMIT = CHANGE_CONF.requestLimit || 5;
let activeInterval = 0;
startCycle();


module.exports = routes;

function routes(router) {
    router.options('/email/change', cors());
    router.post('/email/change', cors(), function (req, res, next) {
            if (!!req.user) {
                return next();
            } else {
                return passport.authenticate('bearer', {session: false})(req, res, next);
            }
        },
        function (req, res) {
            var oldUser = req.user;
            var oldLocalLogin;
            var newUsername = req.body.new_email;
            var password = req.body.password;

            if (!oldUser) {
                logger.debug('[POST /email/change][FAIL][user_id ][from ][to', newUsername, ' where old user is ', oldUser, ']');
                return res.status(401).json({success: false, reason: 'Unauthorized'});
            }

            logger.debug('[POST /email/change][user_id', oldUser.id, '][from', oldUser.email, '][to', newUsername, ']');

            return db.LocalLogin.findOne({
                where: {
                    login: newUsername
                }
            }).then(function (localLogin) {
                    if (localLogin) {
                        throw new Error(STATES.EMAIL_ALREADY_TAKEN);
                    }
                    // At last check password
                    return db.LocalLogin.findOne({where: {user_id: oldUser.id}}).then(function (localLogin) {
                        oldLocalLogin = localLogin;
                        return localLogin.verifyPassword(password);
                    });
                }
            ).then(
                function (correct) {
                    if (!correct) {
                        throw new Error(STATES.WRONG_PASSWORD);
                    }
                    const validityDate = new Date(new Date().getTime() - VALIDITY_DURATION * 1000);
                    return db.UserEmailToken.count({where: {user_id: oldUser.id, created_at: {$gte: validityDate}}});
                }
            ).then(
                function (tokenCount) {
                    if (tokenCount >= REQUEST_LIMIT) {
                        throw new Error(STATES.TOO_MANY_REQUESTS);
                    }
                    logger.debug('[POST /email/change][SUCCESS][user_id', oldUser.id, '][from', oldLocalLogin.login, '][to', newUsername, ']');
                    triggerAccountChangeEmails(oldLocalLogin.login, oldUser, req.authInfo ? req.authInfo.client : null, newUsername).then(
                        function () {
                            logger.debug('[POST /email/change][EMAILS][SENT]');
                        },
                        function (e) {
                            logger.warn('[POST /email/change][EMAILS][ERROR][', e, ']');
                        }
                    );
                    return res.status(200).json({success: true});
                }
            ).catch(
                function (err) {
                    logger.warn('[POST /email/change][FAIL][user_id', oldUser.id, '][from',
                        oldUser.email, '][to', newUsername, '][err', err, ']');
                    var message = '';
                    for (var key in STATES) {
                        if (STATES.hasOwnProperty(key) && STATES[key] === err.message) {
                            message = req.__('CHANGE_EMAIL_API_' + err.message);
                            break;
                        }
                    }
                    var status = 400;
                    if (err.message === STATES.WRONG_PASSWORD) {
                        status = 403;
                    } else if (err.message === STATES.TOO_MANY_REQUESTS) {
                        status = 429;
                    }
                    return res.status(status).json({
                        success: false,
                        reason: err.message,
                        msg: message
                    });
                }
            );
        }
    );

    router.get(
        '/email/move/:token',
        function (req, res) {
            var localLogin, token;
            var oldEmail, newUsername;
            var redirect;
            db.UserEmailToken.findOne({
                where: {key: req.params.token},
                include: [db.User]
            }).then(
                function (token_) {
                    token = token_;
                    if (!token || !token.type.startsWith('MOV')) {
                        throw new Error(STATES.INVALID_TOKEN);
                    }
                    redirect = token.redirect_uri;
                    newUsername = token.type.substring('MOV$'.length);
                    if (!token.isAvailable()) {
                        var err = new Error(STATES.ALREADY_USED);
                        err.data = {success: newUsername === oldEmail};
                        throw err;
                    }
                    return db.LocalLogin.findOne({where: {user_id: token.user_id}});
                }
            ).then(
                function (ll) {
                    localLogin = ll;
                    oldEmail = localLogin.login;
                    return db.LocalLogin.findOne({where: {login: newUsername}});
                }
            ).then(
                function (takenLocalLogin) {
                    if (takenLocalLogin) {
                        throw new Error(STATES.EMAIL_ALREADY_TAKEN);
                    }
                    return db.LocalLogin.findOne({where: {login: newUsername}}).then(function (takenLogin) {
                        if (takenLogin) {
                            throw new Error(STATES.EMAIL_ALREADY_TAKEN);
                        }
                        return db.LocalLogin.findOne({
                            where: {user_id: token.user_id},
                            include: [db.User]
                        }).then(function (localLogin) {
                            return db.sequelize.transaction(function (transaction) {
                                return localLogin.updateAttributes({
                                    login: newUsername,
                                    verified: true
                                }, {transaction: transaction}).then(function () {
                                    return localLogin.User.updateAttributes({
                                        display_name: newUsername
                                    }, {transaction: transaction});
                                });
                            });
                        });
                    });
                }
            ).then(
                function () {
                    if (req.user && req.user.id === token.user_id) {
                        req.user.display_name = newUsername;
                    }
                    return token.consume();
                }
            ).then(
                function () {
                    return renderLandingPage(true, undefined);
                }
            ).catch(
                function (err) {
                    logger.error('[GET /email/move/:token][FAIL][old', oldEmail, '][new', newUsername, '][err', err, ']');
                    return renderLandingPage(err.data && err.data.success, err.message);
                }
            );

            function renderLandingPage(success, message) {
                res.render('./verify-mail-changed.ejs', {
                    success: success,
                    message: message,
                    redirect: redirect,
                    newMail: newUsername
                });
            }
        }
    );

    router.options('/email/moved/:token', cors());
    router.get(
        '/email/moved/:token',
        cors(),
        function (req, res) {
            var user, token, localLogin;
            var clientId, oldEmail, newUsername;
            db.UserEmailToken.findOne(
                {
                    where: {key: req.params.token},
                    include: [db.User, db.OAuth2Client]
                }
            ).then(
                function (token_) {
                    token = token_;
                    clientId = req.query.client_id;
                    if (!token || !token.type.startsWith('MOV')) {
                        throw new Error(STATES.INVALID_TOKEN);
                    }

                    if (token.OAuth2Client.client_id !== clientId) {
                        throw new Error(STATES.MISMATCHED_CLIENT_ID);
                    }

                    user = token.User;
                    return db.LocalLogin.findOne({where: {user_id: user.id}});
                }
            ).then(
                function (localLogin_) {
                    localLogin = localLogin_;
                    oldEmail = localLogin.login;
                    newUsername = token.type.split('$')[1];

                    if (!token.isAvailable()) {
                        var err = new Error(STATES.ALREADY_USED);
                        err.data = {success: oldEmail === newUsername};
                        throw err;
                    }


                    return db.LocalLogin.findOne({where: {login: newUsername}});
                }
            ).then(
                function (takenUser) {
                    if (takenUser) {
                        throw new Error(STATES.EMAIL_ALREADY_TAKEN);
                    }
                    return db.SocialLogin.findOne({where: {email: newUsername}});
                }
            ).then(
                function (socialLogin_) {
                    if (socialLogin_) {
                        throw new Error(STATES.EMAIL_ALREADY_TAKEN);
                    }
                    return localLogin.updateAttributes({
                        login: newUsername,
                        verified: true,
                    });
                }
            ).then(
                function () {
                    return token.consume();
                }
            ).then(
                function () {
                    return res.status(200).json({success: true});
                }
            ).catch(
                function (err) {
                    logger.error('[GET /email/moved/:token][FAIL][old', oldEmail, '][new', newUsername, '][user.id', user ? user.id : null, '][err', err, ']');
                    if (err.data && err.data.success) {
                        return res.status(200).json({success: true, reason: err.message});
                    } else {
                        return res.status(400).json({success: false, reason: err.message});
                    }
                }
            );
        }
    );
}

function triggerAccountChangeEmails(email, user, client, newUsername) {
    return new Promise(
        function (resolve, reject) {
            var redirectUri = client ? client.redirect_uri : undefined;
            const buffer = new Buffer(16);
            uuid.v4({}, buffer);
            var key = buffer.toString('base64');

            db.UserEmailToken.create({
                key: key,
                type: 'MOV$' + newUsername,
                user_id: user.id,
                redirect_uri: redirectUri,
                oauth2_client_id: client ? client.id : undefined
            }).then(
                function (verifyToken) {
                    let host = config.mail.host || '';
                    let confirmLink = host + '/email/move/' + encodeURIComponent(key);
                    if (redirectUri) {
                        confirmLink = redirectUri + APPEND_MOVED + '&username=' + encodeURIComponent(user.email) + '&token=' + encodeURIComponent(key);
                    }
                    logger.debug('send email', confirmLink);
                    return emailHelper.send(
                        config.mail.from,
                        newUsername,
                        "email-change-validation",
                        {},
                        {
                            oldEmail: email,
                            newEmail: newUsername,
                            confirmLink: confirmLink
                        }
                    );
                }
            ).then(
                function () {
                    db.LocalLogin.findOne({where: {user_id: user.id}}).then(function (localLogin) {
                        if (localLogin.verified) {
                            return emailHelper.send(
                                config.mail.from,
                                localLogin.login,
                                'email-change-information',
                                {},
                                {
                                    oldEmail: email,
                                    newEmail: newUsername
                                }
                            );
                        } else {
                            return new Promise(
                                function (resolve, reject) {
                                    return resolve();
                                }
                            );
                        }
                    });
                }
            ).then(
                function () {
                    resolve();
                }
            ).catch(
                reject
            );

        }
    );
}

function cycle() {
    if (DELETION_INTERVAL <= 0) {
        return;
    }

    try {
        const deletionDate = new Date(new Date().getTime() - VALIDITY_DURATION * 1000);
        db.UserEmailToken.destroy(
            {
                where: {
                    created_at: {
                        $lt: deletionDate
                    }
                }
            }
        ).then(
            count => {
                logger.debug('[EmailChange][DELETE/FAIL][count', count, ']');
            }
        ).catch(
            error => {
                logger.error('[EmailChange][DELETE/FAIL][error', error, ']');
            }
        )
        ;
    } catch (e) {
        logger.error('[EmailChange][DELETE/FAIL][error', e, ']');
    }

    activeInterval = setTimeout(
        cycle,
        DELETION_INTERVAL * 1000
    );
}

function startCycle() {
    if (activeInterval) {
        return;
    }
    cycle();
}