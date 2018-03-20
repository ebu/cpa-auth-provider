"use strict";

var db = require('../../models');
var config = require('../../config');
var requestHelper = require('../../lib/request-helper');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var emailHelper = require('../../lib/email-helper');
var codeHelper = require('../../lib/code-helper');
var passwordHelper = require('../../lib/password-helper');
var socialLoginHelper = require('../../lib/social-login-helper');
var userHelper = require('../../lib/user-helper');
var limiterHelper = require('../../lib/limiter-helper');

// Google reCAPTCHA
var recaptcha = require('express-recaptcha');
var i18n = require('i18n');

var localStrategyCallback = function (req, username, password, done) {
    var loginError = req.__('BACK_SIGNUP_INVALID_EMAIL_OR_PASSWORD');
    db.LocalLogin.findOne({where: {login: username}, include: {model: db.User}})
        .then(function (localLogin) {
                if (!localLogin) {
                    doneWithError();
                } else {
                    return localLogin.verifyPassword(password).then(function (isMatch) {
                            if (isMatch) {
                                localLogin.logLogin(localLogin.User);
                                done(null, localLogin.User);
                            } else {
                                doneWithError();
                            }
                        },
                        function (err) {
                            done(err);
                        });
                }
            },
            function (error) {
                done(error);
            });

    function doneWithError(e) {
        e = e || loginError;
        req.flash('loginMessage', e);
        req.session.save(function () {
            return done(null, false, e);
        });
    }
};

var localSignupStrategyCallback = function (req, username, password, done) {

    var optionnalAttributes = {};
    for (var element in userHelper.getRequiredFields()) {
        if (req.body[element] && !config.userProfiles.requiredFields.includes(element)) {
            optionnalAttributes[element] = req.body[element];
        }
    }

    var requiredAttributes = {};

    var required = userHelper.getRequiredFields();

    req.checkBody('email', req.__('BACK_SIGNUP_INVALID_EMAIL')).isEmail();
    req.checkBody('confirm_password', req.__('BACK_CHANGE_PWD_CONFIRM_PASS_EMPTY')).notEmpty();
    req.checkBody('password', req.__('BACK_CHANGE_PWD_PASS_DONT_MATCH')).equals(req.body.confirm_password);

    // general required copy
    for (var key in required) {
        if (required.hasOwnProperty(key) && required[key]) {
            requiredAttributes[key] = req.body[key];
        }
    }
    // specialized required copies
    if (required.gender) {
        req.checkBody('gender', req.__('BACK_SIGNUP_GENDER_FAIL')).notEmpty().isIn(['male', 'female', 'other']);
        requiredAttributes.gender = req.body.gender;
    }
    if (required.date_of_birth) {
        req.checkBody('date_of_birth', req.__('BACK_SIGNUP_DATE_OF_BIRTH_FAIL')).notEmpty().matches(/\d\d\/\d\d\/\d\d\d\d/);
        // date format is dd/mm/yyyy
        var parsed = /(\d\d)\/(\d\d)\/(\d\d\d\d)/.exec(req.body.date_of_birth);
        if (parsed) {
            var date = new Date(parsed[2] + '/' + parsed[1] + '/' + parsed[3]);
            requiredAttributes.date_of_birth = date.getTime();
        } else {
            requiredAttributes.date_of_birth = undefined;
        }
    }

    req.getValidationResult().then(function (result) {
            if (!result.isEmpty()) {
                result.useFirstErrorOnly();
                return doneWithError(result.array({onlyFirstError: true})[0].msg, done);
            } else {
                if (req.recaptcha.error) {
                    return doneWithError(req.__('BACK_SIGNUP_PB_RECAPTCHA'), done);
                }

                requiredAttributes.language = i18n.getLocale();
                userHelper.createLocalLogin(username, password, requiredAttributes, optionnalAttributes).then(
                    function (user) {
                        done(null, user);
                    },
                    function (err) {
                        if (err.message === userHelper.EXCEPTIONS.PASSWORD_WEAK) {
                            doneWithError(passwordHelper.getWeaknessesMsg(username, password, req), done);
                        } else if (err.message === userHelper.EXCEPTIONS.EMAIL_TAKEN) {
                            doneWithError(req.__('BACK_SIGNUP_EMAIL_TAKEN'), done);
                        } else if (err.message === userHelper.EXCEPTIONS.MISSING_FIELDS) {
                            // TODO properly log the missing fields ?
                            doneWithError(req.__('BACK_SIGNUP_MISSING_FIELDS'), done);
                        } else if (err.message === userHelper.EXCEPTIONS.UNKNOWN_GENDER) {
                            doneWithError(req.__('BACK_SIGNUP_MISSING_FIELDS'), done);
                        } else if (err.message === userHelper.EXCEPTIONS.MALFORMED_DATE_OF_BIRTH) {
                            doneWithError(req.__('BACK_SIGNUP_MISSING_FIELDS'), done);
                        } else {
                            done(err);
                        }
                    }
                );
            }
        }
    );

    function doneWithError(e, done) {
        req.flash('signupMessage', e);
        req.session.save(function () {
            done(null, false, e);
        });
    }
};

var localStrategyConf = {
    // by default, local strategy uses username and password, we will override with email
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true // allows us to pass back the entire request to the callback
};

passport.use('local', new LocalStrategy(localStrategyConf, localStrategyCallback));

passport.use('local-signup', new LocalStrategy(localStrategyConf, localSignupStrategyCallback));

module.exports = function (app, options) {

    app.get('/auth/local', function (req, res) {
        var message = {};
        if (req.query && req.query.error) {
            message = req.__(req.query.error);
        }
        var loginMessage = req.flash('loginMessage');
        if (loginMessage && loginMessage.length > 0) {
            message = loginMessage;
        }
        res.render('login.ejs', {message: message});
    });
    app.get('/auth/custom', recaptcha.middleware.render, function (req, res) {
        var required = userHelper.getRequiredFields();
        var profileAttributes = {
            captcha: req.recaptcha,
            requiredFields: required,
            message: req.flash('signupMessage'),
            auth_origin: req.session.auth_origin,
            client_id: req.query.client_id
        };

        db.OAuth2Client.findOne({where: {client_id: req.query.client_id}}).then(function (client) {
            if (client && client.use_template) {
                res.render('broadcaster/' + client.use_template + '/custom-login-signup.ejs', profileAttributes);
            } else {
                // No client found or no dedicated login window => redirect to login '/auth/local'
                res.render('login.ejs', {message: ''});
            }
        });

    });

    app.get('/signup', recaptcha.middleware.render, function (req, res) {
        var required = userHelper.getRequiredFields();
        var profileAttributes = {
            email: req.query.email ? decodeURIComponent(req.query.email) : '',
            captcha: req.recaptcha,
            requiredFields: required,
            message: req.flash('signupMessage')
        };
        for (var key in required) {
            if (required.hasOwnProperty(key) && required[key]) {
                profileAttributes[key] = req.query[key] ? decodeURIComponent(req.query[key]) : '';
            }
        }
        res.render('signup.ejs', profileAttributes);
    });

    app.get('/password/recovery', recaptcha.middleware.render, function (req, res) {
        res.render('password-recovery.ejs', {captcha: req.recaptcha});
    });

    app.get('/password/edit', function (req, res) {
        res.render('password-edit.ejs', {email: req.query.email, code: req.query.code});
    });

    app.get('/logout', function (req, res) {
        req.logout();
        requestHelper.redirect(res, '/');
    });

    app.get('/email_verify', function (req, res, next) {
        db.LocalLogin.findOne({where: {login: req.query.email}})
            .then(function (localLogin) {
                if (localLogin) {
                    codeHelper.verifyEmail(localLogin, req.query.code).then(function (success) {
                            if (success) {
                                res.render('./verify-mail.ejs', {
                                    verified: localLogin.verified,
                                    userId: localLogin.user_id
                                });
                            } else {
                                res.render('./verify-mail.ejs', {verified: false});
                            }
                        }
                    );
                } else {
                    return res.status(400).json({msg: req.__('BACK_SIGNUP_EMAIL_VERIFY_USER_NOT_FOUND')});
                }
            }, function (error) {
                next(error);
            });
    });

    app.post('/login', passport.authenticate('local', {
        failureRedirect: config.urlPrefix + '/auth/local',
        failureFlash: true
    }), redirectOnSuccess);

    app.post('/signup', limiterHelper.verify, function (req, res, next) {

        passport.authenticate('local-signup', function (err, user, info) {

            if (req.recaptcha.error) {
                return requestHelper.redirect(res, '/signup?error=recaptcha');
            }
            if (err) {
                return next(err);
            }
            // Redirect if it fails
            if (!user) {
                var params = ['email=' + encodeURIComponent(req.body.email)];
                if (config.userProfiles && config.userProfiles.requiredFields) {
                    for (var i = 0; i < config.userProfiles.requiredFields.length; ++i) {
                        var element = config.userProfiles.requiredFields[i];
                        params.push(element + "=" + encodeURIComponent(req.body[element]));
                    }
                }
                return requestHelper.redirect(res, '/signup?' + params.join('&'));
            }
            req.logIn(user, function (err) {
                if (err) {
                    return next(err);
                }
                // Redirect if it succeeds
                return redirectOnSuccess(req, res, next);
            });
        })(req, res, next);
    });

    app.post('/password/code', limiterHelper.verify, function (req, res, next) {

        if (req.recaptcha.error) {
            return res.status(400).json({msg: req.__('BACK_SIGNUP_PWD_CODE_RECAPTCHA_EMPTY_OR_WRONG')});
        }

        req.checkBody('email', req.__('BACK_SIGNUP_EMAIL_EMPTY_OR_INVALID')).isEmail();

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
                        return res.status(400).json({msg: req.__('BACK_SIGNUP_USER_NOT_FOUND')});
                    }
                }, function (error) {
                    next(error);
                });
        });

    });

    app.post('/password/update', function (req, res, next) {

        req.checkBody('password', req.__('BACK_PWD_UPDATE_PWD_EMPTY')).notEmpty();
        req.checkBody('confirm-password', req.__('BACK_PWD_UPDATE_CONF_PWD_EMPTY')).notEmpty();
        req.checkBody('confirm-password', req.__('BACK_PWD_UPDATE_PWD_DONT_MATCH_EMPTY')).equals(req.body.password);

        req.getValidationResult().then(function (result) {
            if (!result.isEmpty()) {
                res.status(400).json({errors: result.array()});
                return;
            }
            if (!passwordHelper.isStrong(req.body.email, req.body.password)) {
                res.status(400).json({
                    errors: [{msg: passwordHelper.getWeaknessesMsg(req.body.email, req.body.password, req)}],
                    password_strength_errors: passwordHelper.getWeaknesses(req.body.email, req.body.password, req)
                });
                return;
            } else {
                db.LocalLogin.findOne({where: {login: req.body.email}, include: [db.User]})
                    .then(function (localLogin) {
                        var user = localLogin.User;
                        if (user) {
                            return codeHelper.recoverPassword(user, req.body.code, req.body.password).then(function (success) {
                                if (success) {
                                    return res.status(200).send();
                                } else {
                                    return res.status(400).json({msg: req.__('BACK_PWD_WRONG_RECOVERY_CODE')});
                                }
                            });
                        }
                        else {
                            return res.status(400).json({msg: req.__('BACK_PWD_UPDATE_USER_NOT_FOUND')});
                        }
                    }, function (error) {
                        next(error);
                    });
            }
        });

    });

    function redirectOnSuccess(req, res, next) {
        var redirectUri = req.session.auth_origin;
        delete req.session.auth_origin;

        if (req.session.callback_url){
            redirectUri = req.session.callback_url;
            delete req.session.callback_url;
        }

        req.session.save(
            function () {
                if (redirectUri) {
                    return res.redirect(redirectUri);
                }

                return requestHelper.redirect(res, '/');
            }
        );
    }


};
