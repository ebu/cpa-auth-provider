"use strict";

var db = require('../../models');
var config = require('../../config');
var requestHelper = require('../../lib/request-helper');
var jwtHelpers = require('../../lib/jwt-helper');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var recaptcha = require('express-recaptcha');

var jwt = require('jwt-simple');
var JwtStrategy = require('passport-jwt').Strategy;
var cors = require('../../lib/cors');

var emailHelper = require('../../lib/email-helper');
var authHelper = require('../../lib/auth-helper');
var permissionName = require('../../lib/permission-name');

var codeHelper = require('../../lib/code-helper');

var i18n = require('i18n');

// Google reCAPTCHA
recaptcha.init(config.recaptcha.site_key, config.recaptcha.secret_key);

var opts = {};
opts.secretOrKey = config.jwtSecret;
passport.use(new JwtStrategy(opts, function (jwt_payload, done) {
    if (!jwt_payload) {
        done(null, false);
        return;
    }
    db.User.findOne({where: {id: jwt_payload.id}})
        .then(function (user) {
            if (user) {
                done(null, user);
            } else {
                done(null, false);
            }
        });
}));


module.exports = function (app, options) {
    app.post('/api/local/signup', cors, recaptcha.middleware.verify, function (req, res) {
        
        if (req.recaptcha.error) {
            res.json({success: false, msg: req.__('API_SIGNUP_SOMETHING_WRONG_RECAPTCHA')});
            return;
        }

        if (!req.body.email || !req.body.password) {
            res.json({success: false, msg: req.__('API_SIGNUP_PLEASE_PASS_EMAIL_AND_PWD')});
        } else {
            db.User.findOne({where: {email: req.body.email}})
                .then(function (user) {
                    if (user) {
                        return res.status(400).json({success: false, msg: req.__('API_SIGNUP_EMAIL_ALREADY_EXISTS')});
                    } else {
                        db.sequelize.sync().then(function () {
                            db.Permission.findOne({where: {label: permissionName.USER_PERMISSION}}).then(function (permission) {
                                var userParams = {
                                    email: req.body.email
                                };
                                if (permission) {
                                    userParams.permission_id = permission.id;
                                }
                                var user = db.User.create(userParams).then(function (user) {
                                    return user.setPassword(req.body.password);
                                }).then(function () {
                                    res.json({success: true, msg: req.__('API_SIGNUP_SUCCESS')});
                                }).catch(function (err) {
                                    console.log("ERROR", err);
                                    res.status(500).json({success: false, msg: req.__('API_ERROR') + err});
                                });
                            });
                        });
                    }
                }, function (error) {
                    res.status(500).json({success: false, msg: req.__('API_ERROR') + error});
                });
        }
    });

    app.post('/api/local/password/recover', cors, recaptcha.middleware.verify, function (req, res) {

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

            db.User.findOne({where: {email: req.body.email}})
                .then(function (user) {
                    if (user) {
                        codeHelper.generatePasswordRecoveryCode(user).then(function (code) {
                            emailHelper.send(
                                config.mail.from,
                                user.email,
                                "password-recovery-email",
                                {log: false},
                                {
                                    forceLink: config.mail.host + config.urlPrefix + '/password/edit?email=' + encodeURIComponent(user.email) + '&code=' + encodeURIComponent(code),
                                    host: config.mail.host,
                                    mail: user.email,
                                    code: code
                                },
                                (user.UserProfile && user.UserProfile.language) ? user.UserProfile.language : req.getLocale()
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

    app.post('/api/local/authenticate', cors, function (req, res) {
        db.User.findOne({where: {email: req.body.email}})
            .then(function (user) {
                    if (!user) {
                        res.status(401).json({success: false, msg: req.__('API_INCORRECT_LOGIN_OR_PASS')});
                        return;
                    }

                    user.verifyPassword(req.body.password).then(function (isMatch) {
                            if (isMatch) {
                                user.logLogin().then(function () {
                                }, function () {
                                });
                                // if user is found and password is right create a token
                                var token = jwt.encode(user, config.jwtSecret);
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
        var token = jwtHelpers.getToken(req.headers);
        if (token) {
            var decoded = jwt.decode(token, config.jwtSecret);
            db.User.findOne({
                where: {
                    id: decoded.id
                }
            }).then(function (user) {
                if (!user) {
                    return res.status(403).send({success: false, msg: req.__('API_INCORRECT_LOGIN_OR_PASS')});
                } else {

                    db.UserProfile.findOrCreate({
                        where: {user_id: decoded.id}
                    }).spread(function (user_profile) {
                        res.json({
                            success: true,
                            user: {
                                email: user.email,
                                display_name: user_profile.getDisplayName(user, req.query.policy),
                                admin: user.admin
                            },
                            token: 'JWT ' + token
                        });
                    });

                }
            });
        } else {
            return res.status(403).send({success: false, msg: req.__('API_INFO_NO_TOKEN')});
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
                    user.email,
                    "validation-email",
                    {log: false},
                    {
                        confirmLink: config.mail.host + '/email_verify?email=' + encodeURIComponent(user.email) + '&code=' + encodeURIComponent(code),
                        host: config.mail.host,
                        mail: encodeURIComponent(user.email),
                        code: encodeURIComponent(user.verificationCode)
                    },
                    (user.UserProfile && user.UserProfile.language) ? user.UserProfile.language : req.getLocale()
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

