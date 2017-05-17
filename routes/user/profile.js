"use strict";

var config = require('../../config');
var db = require('../../models/index');
var authHelper = require('../../lib/auth-helper');
var util = require('util');
var xssFilters = require('xss-filters');
var emailHelper = require('../../lib/email-helper');
var recaptcha = require('express-recaptcha');
var codeHelper = require('../../lib/code-helper');
var i18n = require('i18n');

var routes = function (router) {
    router.put('/user/profile/', authHelper.ensureAuthenticated, function (req, res) {
        var userId = authHelper.getAuthenticatedUser(req).id;
        req.checkBody('firstname', req.__('BACK_PROFILE_UPDATE_FIRSTNAME_EMPTY_OR_INVALID')).notEmpty().isAlpha();
        req.checkBody('lastname', req.__('BACK_PROFILE_UPDATE_LASTNAME_EMPTY_OR_INVALID')).notEmpty().isAlpha();
        req.checkBody('birthdate', req.__('BACK_PROFILE_UPDATE_BIRTHDATE_EMPTY_OR_INVALID')).notEmpty().isInt();
        req.checkBody('gender', req.__('BACK_PROFILE_UPDATE_GENDER_EMPTY_OR_INVALID')).notEmpty().isIn(['male'], ['female']);
        req.checkBody('language', req.__('BACK_LANGUAGE_UPDATE_LANGUAGE_EMPTY_OR_INVALID')).notEmpty().isAlpha();

        req.getValidationResult().then(function (result) {
            if (!result.isEmpty()) {
                res.status(400).json({errors: result.array()});
                return;
            }
            db.UserProfile.findOrCreate({
                where: {user_id: userId}
            }).spread(function (user_profile) {
                    user_profile.updateAttributes(
                        {
                            //use XSS filters to prevent users storing malicious data/code that could be interpreted then
                            firstname: xssFilters.inHTMLData(req.body.firstname),
                            lastname: xssFilters.inHTMLData(req.body.lastname),
                            gender: xssFilters.inHTMLData(req.body.gender),
                            birthdate: xssFilters.inHTMLData(req.body.birthdate),
                            language: xssFilters.inHTMLData(req.body.language)
                        })
                        .then(function (user_profile) {
                                res.cookie(config.i18n.cookie_name, user_profile.language, {
                                    maxAge: config.i18n.cookie_duration,
                                    httpOnly: true
                                });
                                res.json({msg: req.__('BACK_PROFILE_UPDATE_SUCCESS')});
                            },
                            function (err) {
                                res.status(500).json({msg: req.__('BACK_PROFILE_UPDATE_FAIL') + err});
                            });
                }
            );
        });
    });

    router.post('/user/profile/request_verification_email', [authHelper.ensureAuthenticated, recaptcha.middleware.verify], function (req, res) {
        if (req.recaptcha.error)
            return res.status(400).json({msg: 'reCaptcha is empty or wrong. '});

        var user = authHelper.getAuthenticatedUser(req);
        if (!user) {
            return res.status(403).send({success: false, msg: req.__('BACK_PROFILE_REQ_VERIF_MAIL')});
        } else {
            codeHelper.getOrGenereateEmailVerificationCode(user).then(function (code) {
                emailHelper.send(
                    config.mail.from,
                    user.email,
                    "validation-email",
                    {log: false},
                    {
                        confirmLink: config.mail.host + '/email_verify?email=' + encodeURIComponent(user.email) + '&code=' + encodeURIComponent(code),
                        host: config.mail.host,
                        mail: encodeURIComponent(user.email),
                        code: encodeURIComponent(code)
                    },
                    (user.UserProfile && user.UserProfile.language) ? user.UserProfile.language : req.getLocale()
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

    router.delete('/user/profile', [authHelper.ensureAuthenticated, recaptcha.middleware.verify], function (req, res) {

        var user = authHelper.getAuthenticatedUser(req);
        if (!user) {
            return res.status(403).send({success: false, msg: req.__('BACK_PROFILE_REQ_VERIF_MAIL')});
        } else {

        }
    });


};

module.exports = routes;
