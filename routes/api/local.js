"use strict";

var db = require('../../models');
var config = require('../../config');
var requestHelper = require('../../lib/request-helper');
var jwtHelpers = require('../../lib/jwt-helper');
var logger = require('../../lib/logger');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var recaptcha = require('express-recaptcha');

var jwt = require('jwt-simple');
var JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;
var cors = require('../../lib/cors');
var generate = require('../../lib/generate');
var emailUtil = require('../../lib/email-util');

var emailHelper = require('../../lib/email-helper');
var authHelper = require('../../lib/auth-helper');
var permissionName = require('../../lib/permission-name');
var passwordHelper = require('../../lib/password-helper');
var userHelper = require('../../lib/user-helper');

var codeHelper = require('../../lib/code-helper');
var limiterHelper = require('../../lib/limiter-helper');


var i18n = require('i18n');

var opts = {};
opts.jwtFromRequest = ExtractJwt.fromExtractors(
    [
        ExtractJwt.fromAuthHeaderWithScheme('JWT'),
        ExtractJwt.fromAuthHeaderAsBearerToken()
    ]
);
opts.secretOrKey = config.jwtSecret;
// opts.issuer = "accounts.examplesoft.com";
// opts.audience = "yoursite.net";
passport.use(new JwtStrategy(opts, function (jwt_payload, done) {
    if (!jwt_payload) {
        done(null, false);
        return;
    }
    db.User.findOne({where: {id: jwt_payload.id}, include: [db.LocalLogin]})
        .then(function (user) {
            if (user) {
                done(null, user);
            } else {
                done(null, false);
            }
        });
}));

module.exports = function (app, options) {
    app.post('/api/local/signup', cors, limiterHelper.verify, function (req, res) {

        if (req.recaptcha.error) {
            res.status(400).json({success: false, msg: req.__('API_SIGNUP_SOMETHING_WRONG_RECAPTCHA')});
            return;
        }

        if (!req.body.email || !req.body.password) {
            res.status(400).json({success: false, msg: req.__('API_SIGNUP_PLEASE_PASS_EMAIL_AND_PWD')});
        } else {
            var username = req.body.email;
            var password = req.body.password;
            var requiredAttributes = {};
            config.userProfiles.requiredFields.forEach(
                function (element) {
                    if (req.body[element]) {
                        requiredAttributes[element] = req.body[element];
                    }
                }
            );
            var optionnalAttributes = {};
            for (var element in userHelper.getRequiredFields()) {
                if (req.body[element] && !config.userProfiles.requiredFields.includes(element)) {
                    optionnalAttributes[element] = req.body[element];
                }
            }

            userHelper.createLocalLogin(username, password, requiredAttributes, optionnalAttributes).then(
                function (user) {
                    res.json({success: true, msg: req.__('API_SIGNUP_SUCCESS')});
                },
                function (err) {
                    if (err.message === userHelper.EXCEPTIONS.EMAIL_TAKEN) {
                        return res.status(400).json({success: false, msg: req.__('API_SIGNUP_EMAIL_ALREADY_EXISTS')});
                    } else if (err.message === userHelper.EXCEPTIONS.PASSWORD_WEAK) {
                        return res.status(400).json({
                            success: false,
                            msg: req.__('API_SIGNUP_PASS_IS_NOT_STRONG_ENOUGH'),
                            password_strength_errors: passwordHelper.getWeaknesses(username, req.body.password, req),
                            errors: [{msg: passwordHelper.getWeaknessesMsg(username, req.body.password, req)}]
                        });
                    } else if (err.message === userHelper.EXCEPTIONS.MISSING_FIELDS) {
                        logger.debug('[POST /api/local/signup][email', username, '][ERR', err, ']');
                        return res.status(400).json({
                            success: false,
                            msg: req.__('API_SIGNUP_MISSING_FIELDS'),
                            missingFields: err.data ? err.data.missingFields : undefined
                        });
                    } else if (err.message === userHelper.EXCEPTIONS.UNKNOWN_GENDER) {
                        return res.status(400).json({
                            success: false,
                            msg: req.__('API_SIGNUP_MISSING_FIELDS')
                        });
                    } else if (err.message === userHelper.EXCEPTIONS.MALFORMED_DATE_OF_BIRTH) {
                        return res.status(400).json({
                            success: false,
                            msg: req.__('API_SIGNUP_MISSING_FIELDS')
                        });
                    } else {
                        logger.error('[POST /api/local/signup][email', username, '][ERR', err, ']');
                        res.status(500).json({success: false, msg: req.__('API_ERROR') + err});
                    }
                }
            );
        }
    });

    app.post('/api/local/password/recover', cors, limiterHelper.verify, function (req, res) {

        if (req.recaptcha.error) {
            res.status(400).json({msg: req.__('API_PASSWORD_RECOVER_SOMETHING_WRONG_RECAPTCHA')});
            return;
        }

        req.checkBody('email', req.__('API_PASSWORD_RECOVER_PLEASE_PASS_EMAIL')).isEmail();

        req.getValidationResult().then(function (result) {
            if (!result.isEmpty()) {
                res.status(400).json({errors: result.array()});
                return;
            }

            db.LocalLogin.findOne({where: {login: req.body.email}, include: [db.User]})
                .then(function (localLogin) {
                    if (localLogin) {
                        codeHelper.generatePasswordRecoveryCode(localLogin.user_id).then(function (code) {
                            emailHelper.send(
                                config.mail.from,
                                localLogin.login,
                                "password-recovery-email",
                                {log: false},
                                {
                                    forceLink: config.mail.host + config.urlPrefix + '/password/edit?email=' + encodeURIComponent(localLogin.login) + '&code=' + encodeURIComponent(code),
                                    host: config.mail.host,
                                    mail: localLogin.login,
                                    code: code
                                },
                                localLogin.User.language ? localLogin.User.language : i18n.getLocale()
                            ).then(
                                function () {
                                },
                                function (err) {
                                }
                            );
                            return res.status(200).send();
                        });
                    } else {
                        return res.status(400).json({msg: req.__('API_PASSWORD_RECOVER_USER_NOT_FOUND')});
                    }
                }, function (error) {
                    res.status(500).json({success: false, msg: req.__('API_ERROR') + error});
                });
        });
    });

    app.post('/api/local/authenticate/cookie', cors,
      passport.authenticate('local', { session: true }),
      function(req,res) {
        // returned value is not relevant
        res.sendStatus(204);
      }
    );

    app.post('/api/local/authenticate/jwt', cors, function (req, res) {
        db.LocalLogin.findOne({where: {login: req.body.email}, include: [db.User]})
            .then(function (localLogin) {
                    if (!localLogin || !req.body.password) {
                        res.status(401).json({success: false, msg: req.__('API_INCORRECT_LOGIN_OR_PASS')});
                        return;
                    }

                    localLogin.verifyPassword(req.body.password).then(function (isMatch) {
                            if (isMatch) {
                                localLogin.logLogin(localLogin.User).then(function () {
                                }, function () {
                                });
                                // if user is found and password is right create a token
                                var token = jwt.encode(localLogin.User, config.jwtSecret);
                                // return the information including token as JSON
                                res.json({success: true, token: 'JWT ' + token});
                            } else {
                                res.status(401).json({success: false, msg: req.__('API_INCORRECT_LOGIN_OR_PASS')});
                                return;
                            }
                        },
                        function (err) {
                            res.status(500).json({success: false, msg: req.__('API_ERROR') + err});
                        });
                },
                function (error) {
                    res.status(500).json({success: false, msg: req.__('API_ERROR') + error});
                });
    });

    // This is needed because when configuring a custom header JQuery automaticaly send options request to the server.
    // That following line avoid cross domain error like
    // XMLHttpRequest cannot load http://localhost.rts.ch:3000/api/local/info.
    // Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
    // Origin 'http://localhost.rts.ch:8090' is therefore not allowed access.
    app.options('/api/local/info', cors);

    app.get('/api/local/info', cors, passport.authenticate('jwt', {session: false}), function (req, res) {
        var user = req.user;
        if (!user) {
            return res.status(403).send({success: false, msg: req.__('API_INCORRECT_LOGIN_OR_PASS')});
        } else {
            var data = {};
            if (user.LocalLogin) {
                data.email = user.LocalLogin.login;
                data.display_name = user.getDisplayName(req.query.policy, user.LocalLogin.login);
            } else {
                data.display_name = user.getDisplayName(req.query.policy, '');
            }
            res.json({
                success: true,
                user: data,
            });
        }
    });

    app.get('/api/local/request_verification_email', cors, passport.authenticate('jwt', {session: false}), function (req, res) {

        var user = authHelper.getAuthenticatedUser(req);

        if (!user) {
            return res.status(403).send({success: false, msg: req.__('API_VERIF_MAIL_NOT_AUTH')});
        } else {
            return codeHelper.getOrGenereateEmailVerificationCode(user).then(function (code) {

                emailHelper.send(
                    config.mail.from,
                    user.LocalLogin ? user.LocalLogin.login : '',
                    "validation-email",
                    {log: false},
                    {
                        confirmLink: config.mail.host + '/email_verify?email=' + encodeURIComponent(user.LocalLogin ? user.LocalLogin.login : '') + '&code=' + encodeURIComponent(code),
                        host: config.mail.host,
                        mail: encodeURIComponent(user.LocalLogin ? user.LocalLogin.login : ''),
                        code: encodeURIComponent(user.verificationCode)
                    },
                    user.language ? user.language : config.mail.local
                ).then(
                    function () {
                    },
                    function (err) {
                    }
                );
                return res.status(204).send({success: true, msg: req.__('API_VERIF_MAIL_SENT')});
            });
        }
    });
};
