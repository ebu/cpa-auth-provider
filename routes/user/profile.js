"use strict";

var config = require('../../config');
var authHelper = require('../../lib/auth-helper');
var emailHelper = require('../../lib/email-helper');
var recaptcha = require('express-recaptcha');
var codeHelper = require('../../lib/code-helper');
var socialLoginHelper = require('../../lib/social-login-helper');
var userHelper = require('../../lib/user-helper');
var logger = require('../../lib/logger');
var i18n = require('i18n');
var db = require('../../models/index');
var limiterHelper = require('../../lib/limiter-helper');


var routes = function (router) {
    router.put('/user/profile/', authHelper.ensureAuthenticated, function (req, res) {
        var userId = authHelper.getAuthenticatedUser(req).id;

        var requiredFields = userHelper.getRequiredFields();
        if (requiredFields.firstname) {
            req.checkBody('firstname', req.__('BACK_PROFILE_UPDATE_FIRSTNAME_EMPTY_OR_INVALID')).notEmpty().matches(userHelper.NAME_REGEX);
        } else if (req.body.firstname) {
            req.checkBody('firstname', req.__('BACK_PROFILE_UPDATE_FIRSTNAME_EMPTY_OR_INVALID')).matches(userHelper.NAME_REGEX);
        }
        if (requiredFields.lastname) {
            req.checkBody('lastname', req.__('BACK_PROFILE_UPDATE_LASTNAME_EMPTY_OR_INVALID')).notEmpty().matches(userHelper.NAME_REGEX);
        } else if (req.body.lastname) {
            req.checkBody('lastname', req.__('BACK_PROFILE_UPDATE_LASTNAME_EMPTY_OR_INVALID')).matches(userHelper.NAME_REGEX);
        }
        if (requiredFields.date_of_birth) {
            req.checkBody('date_of_birth', req.__('BACK_PROFILE_UPDATE_DATE_OF_BIRTH_EMPTY_OR_INVALID')).notEmpty().isInt();
        } else if (req.body.date_of_birth) {
            req.checkBody('date_of_birth', req.__('BACK_PROFILE_UPDATE_DATE_OF_BIRTH_EMPTY_OR_INVALID')).isInt();
        }
        if (requiredFields.gender) {
            req.checkBody('gender', req.__('BACK_PROFILE_UPDATE_GENDER_EMPTY_OR_INVALID')).notEmpty().isIn(['male', 'female', 'other']);
        } else if (req.body.gender) {
            req.checkBody('gender', req.__('BACK_PROFILE_UPDATE_GENDER_EMPTY_OR_INVALID')).isIn(['male', 'female', 'other']);
        }
        if (requiredFields.language) {
            req.checkBody('language', req.__('BACK_LANGUAGE_UPDATE_LANGUAGE_EMPTY_OR_INVALID')).notEmpty().isAlpha();
        } else if (req.body.language) {
            req.checkBody('language', req.__('BACK_LANGUAGE_UPDATE_LANGUAGE_EMPTY_OR_INVALID')).isAlpha();
        }

        req.getValidationResult().then(function (result) {
            if (!result.isEmpty()) {
                result.useFirstErrorOnly();
                res.status(400).json({errors: result.array({onlyFirstError: true})});
                return;
            }
            userHelper.updateProfile(authHelper.getAuthenticatedUser(req), req.body).then(
                function (user) {
                    res.cookie(config.i18n.cookie_name, user.language, {
                        maxAge: config.i18n.cookie_duration,
                        httpOnly: true
                    });
                    res.json({msg: req.__('BACK_PROFILE_UPDATE_SUCCESS')});
                },
                function (err) {
                    logger.error('[PUT /user/profile][ERROR', err, ']');
                    res.status(500).json({msg: req.__('BACK_PROFILE_UPDATE_FAIL') + err});
                }
            );
        });
    });

    router.post('/user/profile/request_verification_email', [authHelper.ensureAuthenticated, limiterHelper.verify], function (req, res) {
        if (req.recaptcha.error)
            return res.status(400).json({msg: 'reCaptcha is empty or wrong. '});

        var user = authHelper.getAuthenticatedUser(req);
        if (!user) {
            return res.status(403).send({success: false, msg: req.__('BACK_PROFILE_REQ_VERIF_MAIL')});
        } else {
            var email = req.user.LocalLogin ? req.user.LocalLogin.login : "";
            codeHelper.getOrGenereateEmailVerificationCode(user).then(function (code) {
                emailHelper.send(
                    config.mail.from,
                    email,
                    "validation-email",
                    {log: false},
                    {
                        confirmLink: config.mail.host + '/email_verify?email=' + encodeURIComponent(email) + '&code=' + encodeURIComponent(code),
                        host: config.mail.host,
                        mail: encodeURIComponent(email),
                        code: encodeURIComponent(code)
                    },
                    (user.language) ? user.language : i18n.getLocale()
                ).then(
                    function () {
                    },
                    function () {
                    }
                );
            });
            return res.status(204).send();
        }
    });

    router.post('/user', authHelper.ensureAuthenticated, function (req, res) {

        var user = authHelper.getAuthenticatedUser(req);

        //If facebook user then we do not check for account password as it can be empty
        socialLoginHelper.hasLocalLogin(user).then(function (hasLocal) {
            if (hasLocal) {
                var localLogin;
                return db.LocalLogin.findOne({where: {user_id: user.id}})
                    .then(function (ll) {
                        localLogin = ll;
                        return localLogin.verifyPassword(req.body.password);
                    })
                    .then(function (isMatch) {
                        if (isMatch) {
                            // Transactional part
                            return db.sequelize.transaction(function (transaction) {
                                return localLogin.destroy({
                                    where: {user_id: user.id},
                                    transaction: transaction
                                }).then(function () {
                                    return db.SocialLogin.destroy({
                                        where: {user_id: user.id},
                                        transaction: transaction
                                    });
                                }).then(function () {
                                    return user.destroy({
                                        where: {id: user.id},
                                        transaction: transaction
                                    });
                                });
                            });
                        } else {
                            if (req.body.password) {
                                throw new Error(req.__('PROFILE_API_DELETE_YOUR_ACCOUNT_WRONG_PASSWORD'));
                            } else {
                                throw new Error(req.__('PROFILE_API_DELETE_YOUR_ACCOUNT_MISSING_PASSWORD'));
                            }
                        }
                    }).then(function () {
                        return res.status(204).send();
                    });
            } else {
                return db.SocialLogin.destroy({where: {user_id: user.id}}).then(function () {
                    return user.destroy().then(function () {
                        return res.status(204).send();
                    });
                });

            }
        }).catch(function (e) {
            res.status(401).send({success: false, msg: e.message});
        });
    });

    router.get('/user/id', authHelper.ensureAuthenticated, function (req, res) {
        return res.json({id: authHelper.getAuthenticatedUser(req).id});
    });

};

module.exports = routes;
