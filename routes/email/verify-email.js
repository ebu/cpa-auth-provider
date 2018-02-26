"use strict";

var db = require('../../models/index');
var logger = require('../../lib/logger');
var cors = require('cors');
const monitor = require('../../lib/monitor');

var APPEND_VERIFY = '?auth=account_created';
var APPEND_DELETE = '?auth=account_removed';

module.exports = routes;

function routes(router) {

    router.options('/email/confirm/:key', cors());
    router.get(
        '/email/confirm/:key',
        cors(),
        function (req, res, next) {
            getTokenAndClient(req.params.key).then(
                function (data) {
                    var verifyToken = data;
                    var client = data.OAuth2Client;
                    var user = data.User;

                    var clientId = req.query.client_id;

                    if (client.client_id != clientId) {
                        return res.status(400).json({success: false, reason: 'MISMATCHED_CLIENT_ID'});
                    }

                    if (!verifyToken.isAvailable()) {
                        if (user.verified) {
                            return res.status(200).json({success: true, reason: 'ALREADY_USED'});
                        } else {
                            return res.status(400).json({success: false, reason: 'ALREADY_USED'});
                        }
                    }

                    if (user.LocalLogin.verified) {
                        res.status(200).json({success: true, reason: 'NO_CHANGE'});
                        return deleteToken(verifyToken);
                    }

                    return user.LocalLogin.updateAttributes({verified: true}).then(
                        function () {
                            monitor.counter.inc(monitor.METRICS.ACCOUNT_VERIFIED, 1);
                            res.status(200).json({success: true, reason: 'CONFIRMED'});
                            return deleteToken(verifyToken);
                        }
                    ).catch(
                        function (err) {
                            logger.error('[/email/confirm/][FAIL][key', req.params.key, '][err', err, ']');
                            return res.status(500).json({success: false, reason: 'INTERNAL'});
                        }
                    );
                },
                function (err) {
                    logger.error('[/email/confirm/][FAIL][key', req.params.key, '][err', err, ']');
                    res.status(400).json({success: false, reason: 'BAD_REQUEST'});
                }
            );
        }
    );

    router.get(
        '/email/verify/:key',
        function (req, res, next) {
            getTokenAndClient(req.params.key).then(
                function (data) {
                    var verifyToken = data;
                    var client = data.OAuth2Client;
                    var user = data.User;

                    var wasVerified = user.LocalLogin.verified;
                    if (!verifyToken.isAvailable()) {
                        return res.status(400).json('ALREADY USED');
                    }

                    var redirect_url = getEmailRedirectUrl(verifyToken, client);
                    return user.LocalLogin.updateAttributes({verified: true}).then(
                        function () {
                            if (redirect_url) {
                                logger.debug('[email verify][REDIRECT][url', redirect_url, ']');
                                res.redirect(redirect_url + APPEND_VERIFY + '&username=' + encodeURIComponent(user.email) + (wasVerified ? '&changed=false' : ''));
                                return deleteToken(verifyToken);//req.params.key);
                            } else {
                                res.render('./email/verify.ejs', {
                                    user: user,
                                    was_verified: wasVerified,
                                    forward_address: 'https://www.br.de/mediathek'
                                });
                                return deleteToken(verifyToken);//req.params.key);
                            }
                        },
                        function (err) {
                            logger.error('[email verify][RENDER][user_id', verifyToken.user_id, '][error', err, ']');
                        }
                    );
                },
                function (err) {
                    return next(err);
                }
            );
        }
    );

    router.get(
        '/email/delete/:key',
        function (req, res, next) {
            getTokenAndClient(req.params.key).then(
                function (data) {
                    var verifyToken = data;
                    var client = data.OAuth2Client;
                    var user = data.User;

                    var redirect_url = getEmailRedirectUrl(verifyToken, client);
                    if (redirect_url) {
                        res.redirect(redirect_url + APPEND_DELETE + '&username=' + encodeURIComponent(user.email));
                    } else {
                        res.render('./email/delete.ejs', {
                            user: user,
                            forward_address: 'https://www.br.de/mediathek'
                        });
                    }
                    deleteUser(user).then(
                        function () {
                            deleteToken(verifyToken);
                        },
                        function () {
                        }
                    );
                },
                next
            );
        }
    );
}

/** extract and generate proper url for a redirect */
function getEmailRedirectUrl(verifyToken, client) {
    if (client) {
        return client.email_redirect_uri;
    } else {
        return undefined;
    }
}

/** retrieve the token for the key */
function getTokenAndClient(key) {
    return new Promise(
        function (resolve, reject) {
            let verifyToken;
            db.UserEmailToken.find({where: {key: key}, include: [db.User, db.OAuth2Client]}).then(
                function (verifyToken_) {
                    verifyToken = verifyToken_;
                    if (!verifyToken || verifyToken.type !== 'REG') {
                        return reject(new Error('INVALID_TOKEN'));
                    }
                    return db.LocalLogin.find({where: {user_id: verifyToken.User.id}});
                }
            ).then(
                ll => {
                    verifyToken.User.LocalLogin = ll;
                    resolve(verifyToken);
                }
            ).catch(reject);
        }
    );
}

function getUser(user_id) {
    return new Promise(
        function (resolve, reject) {
            db.User.find({where: {id: user_id}}).then(
                function (user) {
                    if (!user) {
                        return reject(new Error('user does not exist'));
                    } else {
                        return resolve(user);
                    }
                },
                reject
            );
        }
    );
}

/** remove user-verify-token */
function deleteToken(verifyToken) {//key) {
    verifyToken.consume().then(
        function () {
            logger.debug('[verify token consume][SUCCESS][key', verifyToken.key, '][user_id', verifyToken.user_id, ']');
        },
        function (e) {
            logger.error('[verify token consume][FAIL][key', verifyToken.key, '][user_id', verifyToken.user_id, '][error', e, ']');
        }
    );
}

/** destroys an user */
function deleteUser(user) {
    return new Promise(
        function (resolve, reject) {
            user.destroy().then(
                function () {
                    logger.debug('[user delete][SUCCESS][id', user.id, '][email', user.email, ']');
                    return resolve();
                },
                function (e) {
                    logger.error('[user delete][FAIL][id', user.id, '][error', e, ']');
                    return reject();
                }
            );
        }
    );
}