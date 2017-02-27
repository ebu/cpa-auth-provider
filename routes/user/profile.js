"use strict";

var config = require('../../config');
var db = require('../../models/index');
var authHelper = require('../../lib/auth-helper');
var util = require('util');
var xssFilters = require('xss-filters');
var emailHelper = require('../../lib/email-helper');
var recaptcha = require('express-recaptcha');
var codeHelper = require('../../lib/code-helper');


var routes = function (router) {
    router.put('/user/profile/', authHelper.ensureAuthenticated, function (req, res) {
        var userId = authHelper.getAuthenticatedUser(req).id;
        req.checkBody('firstname', '"Firstname" is empty or invalid').notEmpty().isString();
        req.checkBody('lastname', '"Lastname" is empty or invalid').notEmpty().isString();
        req.checkBody('birthdate', '"Birthdate" is empty or invalid').notEmpty().isInt();
        req.checkBody('gender', '"Sex" is empty or is invalid').notEmpty().isHuman();
        req.checkBody('language', '"language" is empty or is invalid').notEmpty().isString();

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
                                res.cookie(config.i18n.cookie_name,  user_profile.language, {maxAge: config.i18n.cookie_duration, httpOnly: true});
                                res.json({msg: 'Successfully updated user_profile.'});
                            },
                            function (err) {
                                res.status(500).json({msg: 'Cannot update user_profile. Err:' + err});
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
            return res.status(403).send({success: false, msg: "not authenticated"});
        } else {
            codeHelper.getOrGenereateEmailVerificationCode(user).then(function(code){
                emailHelper.send(
                    config.mail.from,
					user.email,
                    "validation-email",
                    {log:true},
                    {confirmLink: req.headers.origin + '/email_verify?email=' + encodeURIComponent(user.email) + '&code=' + encodeURIComponent(code), host:config.mail.host, mail:encodeURIComponent(user.email), code:encodeURIComponent(code)},
                    config.mail.local
                ).then(
                    function() {},
                    function() {}
                );
            });
            return res.status(204).send();
        }
    });


};

module.exports = routes;
