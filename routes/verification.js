"use strict";

var db = require('../models');
var config = require('../config');
var authHelper = require('../lib/auth-helper');
var messages = require('../lib/messages');
var requestHelper = require('../lib/request-helper');
var urlHelper = require('../lib/url-helper');
var i18n = require('i18n');


var async = require('async');

var routes = function (router) {
    var renderVerificationPage = function (req, res, errorMessage) {
        db.PairingCode.findAll({
            where: {user_id: req.user.id, state: 'pending'},
            include: [db.User, db.Domain]
        })
            .then(function (pairingCodes) {
                if (pairingCodes.length > 0) {
                    res.render('verify-list.ejs', {'pairing_codes': pairingCodes});
                }
                else {
                    if (typeof errorMessage === 'string') {
                        res.status(400);
                        res.render('verify.ejs', {'user_code': req.body.user_code, 'error': errorMessage});
                    }
                    else {
                        res.render('verify.ejs', {'user_code': req.body.user_code, 'error': null});
                    }
                }
            }, function (err) {
                res.send(500);
            });
    };

    var renderVerificationInfo = function (res, message, status) {
        res.render('verify-info.ejs', {message: message, status: status});
    };

    router.get('/verify', authHelper.authenticateFirst, function (req, res, errorMessage) {
        var userCode = req.query.user_code;
        var redirectUri = req.query.redirect_uri;

        if (userCode && redirectUri) {
            db.PairingCode
                .findOne({where: {'user_code': userCode}, include: [db.Client, db.Domain]})
                .then(function (pairingCode) {
                    if (!pairingCode) {
                        renderVerificationPage(req, res, messages.INVALID_USERCODE);
                        return;
                    }

                    if (pairingCode.state === 'verified') {
                        res.status(400);
                        renderVerificationInfo(res, messages.OBSOLETE_USERCODE, 'warning');
                        return;
                    }

                    if (pairingCode.hasExpired()) {
                        res.status(400);
                        renderVerificationInfo(res, messages.EXPIRED_USERCODE, 'warning');
                        return;
                    }

                    var domain = (config.auto_provision_tokens) ? 'every domain' : pairingCode.Domain.name;
                    var templateVariables = {
                        'client_name': pairingCode.Client.name,
                        'user_code': userCode,
                        'redirect_uri': redirectUri,
                        'domain': domain
                    };

                    res.render('verify-prefilled-code.ejs', templateVariables);
                }, function (err) {
                    res.send(500);
                });
            return;
        }

        renderVerificationPage(req, res, errorMessage);
    });

    /**
     * User code verification and confirmation endpoint
     */

    /*
     Associate each pending pairing codes in formCodes with the userId and set the sate to
     verify if the value is yes. Otherwise, it is set to denied.
     */
    var validatePairingCodes = function (userId, formCodes, done) {
        async.each(formCodes, function (code, callback) {
                db.PairingCode.findOne({
                    where: {id: code.id, user_id: userId, state: 'pending'},
                    include: [db.User, db.Domain]
                }).then(function (pairingCode) {
                    if (!pairingCode) {
                        callback(new Error('PairingCode with id: ' + code.id + ' not found'));
                        return;
                    }

                    if (pairingCode.hasExpired()) {
                        // Don't update expired pairing code
                        callback();
                    }
                    else {
                        pairingCode.state = (code.value === 'yes') ? 'verified' : 'denied';
                        pairingCode.save(['state']).then(function () {
                            callback();
                        }, callback);
                    }
                }, function (err) {
                    callback(err);
                });
            },
            function (err) {
                done(err);
            });
    };

    /**
     * Set the state of a Pairing Code identified by userCode to denied. And it associates the user who denies the Pairing Code.
     * @param userCode
     * @param userId
     * @param done = function(err, errorMessage, result)
     *               err is the error object
     *               errorMessage is the message displayed to the user
     *               result is included when redirecting after an user_code prefilled process.
     */
    var denyUserCode = function (userCode, userId, done) {
        db.PairingCode
            .findOne({where: {'user_code': userCode}, include: [db.Client]})
            .then(function (pairingCode) {
                if (!pairingCode) {
                    done(null, messages.INVALID_USERCODE, 'cancelled');
                    return;
                }

                if (pairingCode.state === 'verified') {
                    done(null, messages.OBSOLETE_USERCODE, 'cancelled');
                    return;
                }

                if (pairingCode.hasExpired()) {
                    done(null, messages.EXPIRED_USERCODE, 'cancelled');
                    return;
                }

                // TODO: check transaction
                return pairingCode
                    .updateAttributes({user_id: userId, state: 'denied'})
                    .then(function () {
                        pairingCode.Client.user_id = userId;
                        pairingCode.Client.save();
                    })
                    .then(function () {
                            done(null, null, 'cancelled');
                        },
                        function (err) {
                            done(err);
                        });
            }, function (err) {
                done(err);
            });
    };

    /**
     * Associate a pairing code with a user. It sets the state to verified.
     * @param userCode
     * @param userId
     * @param done = function(err, errorMessage, result)
     *               err is the error object
     *               errorMessage is the message displayed to the user
     *               result is included when redirecting after an user_code prefilled process.
     */
    var associateUserCodeWithUser = function (userCode, userId, done) {
        db.PairingCode
            .findOne({where: {'user_code': userCode}, include: [db.Client]})
            .then(function (pairingCode) {
                if (!pairingCode) {
                    done(null, messages.INVALID_USERCODE, 'cancelled');
                    return;
                }

                if (pairingCode.state === 'verified') {
                    done(null, messages.OBSOLETE_USERCODE, 'cancelled');
                    return;
                }

                if (pairingCode.hasExpired()) {
                    done(null, messages.EXPIRED_USERCODE, 'cancelled');
                    return;
                }

                // TODO: check transaction
                return pairingCode
                    .updateAttributes({user_id: userId, state: 'verified'})
                    .then(function () {
                        pairingCode.Client.user_id = userId;
                        pairingCode.Client.save();
                    })
                    .then(function () {
                            done(null, null, 'success');
                        },
                        function (err) {
                            done(err);
                        });
            }, function (err) {
                done(err);
            });
    };

    /**
     * authorizeDomains
     * handles the process of authorizing domain when the automatic provisioning is not enabled.
     * The pairing code (without user_code) is used as a request to authorize the device to act on a specific domain.
     * @param req
     * @param res
     * @param next
     */
    var authorizeDomains = function (req, res, next) {
        // Extract fields starting with 'pairing_code_'
        var codes = [];
        for (var k in req.body) {
            if (k.indexOf('pairing_code_') === 0) {
                codes.push({'id': k.substr('pairing_code_'.length), 'value': req.body[k]});
            }
        }

        if (codes.length > 0) {
            validatePairingCodes(req.user.id, codes, function (err) {
                if (err) {
                    next(err);
                    return;
                }
                requestHelper.redirect(res, '/verify');
            });
            return;
        }

        res.sendInvalidRequest('Missing pairing_code_* to validate');
    };

    /**
     * verifyUserCode
     * handles the process of associating a user with a device.
     * In this case, the user enters manually the code into the field.
     *
     * @param req
     * @param res
     * @param next
     */
    var verifyUserCode = function (req, res, next) {
        var userCode = req.body.user_code;
        if (!userCode) {
            renderVerificationPage(req, res, messages.INVALID_USERCODE);
            return;
        }

        associateUserCodeWithUser(userCode, req.user.id, function (err, errorMessage, result) {
            if (err) {
                next(err);
                return;
            }

            if (errorMessage) {
                res.status(400);
                renderVerificationInfo(res, errorMessage, 'warning');
                return;
            }

            renderVerificationInfo(res, messages.SUCCESSFUL_PAIRING, 'success');
        });
    };

    router.post('/verify', authHelper.ensureAuthenticated, function (req, res, next) {
        if (!requestHelper.isContentType(req, 'application/x-www-form-urlencoded')) {
            res.sendInvalidRequest("Invalid content type: " + req.get('Content-Type'));
            return;
        }

        var verificationType = req.body.verification_type;

        switch (verificationType) {
            case 'domain_list': // Domain authorization (No automatic provisioning)
                authorizeDomains(req, res, next);
                return;

            case 'user_code':
                verifyUserCode(req, res, next);
                return;

            default:
                res.statusCode = 400;
                renderVerificationInfo(res, messages.UNKNOWN_VERIFICATION_TYPE, 'danger');
                return;
        }
    });

    /**
     * /verify/allow
     * Allow the association with a device without entering manually the code.
     * This case covers when the browser is running on the same device as the device/app being paired.
     *
     * @param req
     * @param res
     * @param next
     */
    router.post('/verify/allow', authHelper.ensureAuthenticated, function (req, res, next) {
        if (!requestHelper.isContentType(req, 'application/x-www-form-urlencoded')) {
            res.sendInvalidRequest("Invalid content type: " + req.get('Content-Type'));
            return;
        }

        var userCode = req.body.user_code;
        if (!userCode) {
            renderVerificationPage(req, res, messages.INVALID_USERCODE);
            return;
        }

        associateUserCodeWithUser(userCode, req.user.id, function (err, errorMessage, result) {
            var redirectUri = urlHelper.addQueryParameters(req.body.redirect_uri, {result: result});
            res.redirect(redirectUri);
        });
    });

    /**
     * /verify/deny
     * Deny the association with a device without entering manually the code.
     * This case covers when the browser is running on the same device as the device/app being paired.
     *
     * @param req
     * @param res
     * @param next
     */
    router.post('/verify/deny', authHelper.ensureAuthenticated, function (req, res, next) {
        if (!requestHelper.isContentType(req, 'application/x-www-form-urlencoded')) {
            res.sendInvalidRequest("Invalid content type: " + req.get('Content-Type'));
            return;
        }

        var userCode = req.body.user_code;
        if (!userCode) {
            renderVerificationPage(req, res, messages.INVALID_USERCODE);
            return;
        }

        denyUserCode(userCode, req.user.id, function (err, errorMessage, result) {
            var redirectUri = urlHelper.addQueryParameters(req.body.redirect_uri, {result: result});
            res.redirect(redirectUri);
        });
    });
};

module.exports = routes;
