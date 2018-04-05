"use strict";

var db = require('../../models');
var config = require('../../config');
var passport = require('passport');
var cors = require('../../lib/cors');
var authHelper = require('../../lib/auth-helper');
var userHelper = require('../../lib/user-helper');

module.exports = function (app, options) {

    // This is needed because when configuring a custom header JQuery automaticaly send options request to the server.
    // That following line avoid cross domain error like
    // XMLHttpRequest cannot load http://localhost.rts.ch:3000/api/local/info.
    // Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
    // Origin 'http://localhost.rts.ch:8090' is therefore not allowed access.
    app.options('/api/local/profile', cors);

    app.get('/api/local/profile', cors, passport.authenticate('jwt', {session: false}), function (req, res) {
        var user = authHelper.getAuthenticatedUser(req);

        if (!user) {
            return res.status(401).send({success: false, msg: req.__('API_PROFILE_AUTH_FAIL')});
        } else {
            returnProfileAsJson(user, res, req);
        }
    });

    // This is needed because when configuring a custom header JQuery automaticaly send options request to the server.
    // That following line avoid cross domain error like
    // XMLHttpRequest cannot load http://localhost.rts.ch:3000/api/local/info.
    // Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
    // Origin 'http://localhost.rts.ch:8090' is therefore not allowed access.
    app.options('/api/session/profile', cors);

    app.get('/api/session/profile', cors, authHelper.authenticateFirst, function (req, res) {
        var user = authHelper.getAuthenticatedUser(req);

        if (!user) {
            return res.status(401).send({success: false, msg: req.__('API_PROFILE_AUTH_FAIL')});
        } else {
            returnProfileAsJson(user, res, req);
        }
    });

    app.put('/api/local/profile', cors, passport.authenticate('jwt', {session: false}), function (req, res) {
        // Data validation
        if (req.body.firstname) {
            req.checkBody('firstname', req.__('API_PROFILE_FIRSTNAME_INVALIDE')).matches(userHelper.NAME_REGEX);
        }
        if (req.body.lastname) {
            req.checkBody('lastname', req.__('API_PROFILE_LASTNAME_INVALIDE')).matches(userHelper.NAME_REGEX);
        }
        if (req.body.date_of_birth) {
            req.checkBody('date_of_birth', req.__('API_PROFILE_DATE_OF_BIRTH_INVALIDE')).isInt();
        }
        if (req.body.gender) {
            req.checkBody('gender', req.__('API_PROFILE_GENDER_INVALIDE')).isIn(['male', 'female', 'other']);
        }
        if (req.body.language) {
            req.checkBody('language', req.__('API_PROFILE_LANGUAGE_INVALIDE')).isAlpha();
        }

        req.getValidationResult().then(
            function (result) {
                if (!result.isEmpty()) {
                    result.useFirstErrorOnly();
                    // console.log('There have been validation errors: ' + util.inspect(result.array()));
                    res.status(400).json({
                        success: false,
                        msg: req.__('API_PROFILE_VALIDATION_ERRORS') + result.array({onlyFirstError: true})
                    });
                } else {
                    userHelper.updateProfile(authHelper.getAuthenticatedUser(req), req.body).then(
                        function (userProfile) {
                            res.cookie(config.i18n.cookie_name, userProfile.language, {
                                maxAge: config.i18n.cookie_duration,
                                httpOnly: true
                            });
                            res.json({success: true, msg: req.__('API_PROFILE_SUCCESS')});
                        },
                        function (err) {
                            if (err.message === userHelper.EXCEPTIONS.MISSING_FIELDS) {
                                return res.status(400).json({
                                    success: false,
                                    msg: req.__('API_SIGNUP_MISSING_FIELDS'),
                                    missingFields: err.data.missingFields
                                });
                            } else {
                                res.status(500).json({
                                    success: false,
                                    msg: req.__('API_PROFILE_FAIL') + err
                                });
                            }
                        }
                    );
                }
            }
        );
    });


    var requiredConfigQueryPath = '/api/local/profile/required-config';
    app.options(requiredConfigQueryPath, cors);
    app.get(
        requiredConfigQueryPath,
        cors,
        function (req, res) {
            var fields = userHelper.getRequiredFields();
            var asObject = !req.query.hasOwnProperty('array');
            var providers = [];
            for (var idp in config.identity_providers) {
                if (config.identity_providers[idp].enabled) {
                    providers.push(idp);
                }
            }
            if (asObject) {
                return res.status(200).json({fields: fields, providers: providers});
            } else {
                var list = [];
                for (var key in fields) {
                    if (fields.hasOwnProperty(key) && fields[key]) {
                        list.push(key);
                    }
                }
                return res.status(200).json(list);
            }
        }
    );
};

function returnProfileAsJson(user, res, req) {
    db.LocalLogin.findOne({where: {user_id: user.id}}).then(function (localLogin) {
        var email = localLogin.login;
        res.json({
            success: true,
            user_profile: {
                firstname: user.firstname,
                lastname: user.lastname,
                gender: user.gender,
                date_of_birth: user.date_of_birth ? parseInt(user.date_of_birth) : user.date_of_birth,
                language: user.language,
                email: email,
                display_name: user.getDisplayName(req.query.policy, email)
            }
        });
    });
}
