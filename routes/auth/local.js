"use strict";

var db = require('../../models');
var config = require('../../config');
var requestHelper = require('../../lib/request-helper');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var util = require('util');

var emailHelper = require('../../lib/email-helper');
var codeHelper = require('../../lib/code-helper');
var permissionName = require('../../lib/permission-name');
var passwordHelper = require('../../lib/password-helper');

var userHelper = require('../../lib/user-helper');

var i18n = require('i18n');

// Google reCAPTCHA
var recaptcha = require('express-recaptcha');


var localStrategyCallback = function (req, username, password, done) {
    var loginError = req.__('BACK_SIGNUP_INVALID_EMAIL_OR_PASSWORD');
    db.User.findOne({where: {email: username}})
        .then(function (user) {
                if (!user) {
                    done(null, false, req.flash('loginMessage', loginError));
                    return;
                }

                if (user.isFacebookUser && !user.password) {
                    done(null, false, req.flash('loginMessage', loginError));
                    return;
                }

                user.verifyPassword(password).then(function (isMatch) {
                        if (isMatch) {
                            user.logLogin().then(function () {
                            }, function () {
                            });
                            done(null, user);
                        } else {
                            done(null, false, req.flash('loginMessage', loginError));
                        }
                    },
                    function (err) {
                        done(err);
                    });
            },
            function (error) {
                done(error);
            });
};

var localSignupStrategyCallback = function (req, username, password, done) {
    var attributes = {};

    var profilesConfig = config.userProfiles || {};
    var fields = profilesConfig.requiredFields || [];
    var required = {'gender': fields.indexOf('gender') >= 0, 'birthdate': fields.indexOf('birthdate') >= 0};
    for (var i = 0; i < fields.length; ++i) {
        var fieldName = fields[i].toLowerCase().trim();
        if (required.hasOwnProperty(fieldName)) {
            required[fieldName] = true;
        }
    }

    req.checkBody('email', req.__('BACK_SIGNUP_INVALID_EMAIL')).isEmail();
    req.checkBody('confirm_password', req.__('BACK_CHANGE_PWD_CONFIRM_PASS_EMPTY')).notEmpty();
    req.checkBody('password', req.__('BACK_CHANGE_PWD_PASS_DONT_MATCH')).equals(req.body.confirm_password);

    if (required.gender) {
        req.checkBody('gender', req.__('BACK_SIGNUP_GENDER_FAIL')).notEmpty().isIn(['male', 'female']);
        attributes.gender = req.body.gender;
    }
    if (required.birthdate) {
        req.checkBody('birthdate', req.__('BACK_SIGNUP_BIRTHDATE_FAIL')).notEmpty().matches(/\d\d\/\d\d\/\d\d\d\d/);
        var date = new Date(req.body.birthdate);
        attributes.birthdate = date.getTime();
    }

    req.getValidationResult().then(function (result) {
            if (!result.isEmpty()) {
                done(null, false, req.flash('signupMessage', result.array()[0].msg));
            } else {
                if (req.recaptcha.error) {
                    done(null, false, req.flash('signupMessage', req.__('BACK_SIGNUP_PB_RECAPTCHA')));
                    return;
                }

                attributes.language = req.getLocale();
                userHelper.createUser(username, password, attributes).then(
                    function (user) {
                        done(null, user);
                    },
                    function (err) {
                        if (err.message === userHelper.EXCEPTIONS.PASSWORD_WEAK) {
                            done(null, false, req.flash('signupMessage', req.__('BACK_SIGNUP_PASS_IS_NOT_STRONG_ENOUGH')));
                        } else if (err.message === userHelper.EXCEPTIONS.EMAIL_TAKEN) {
                            done(null, false, req.flash('signupMessage', req.__('BACK_SIGNUP_EMAIL_TAKEN')));
                        } else if (err.message === userHelper.EXCEPTIONS.MISSING_FIELDS) {
                            // TODO properly log the missing fields ?
                            done(null, false, req.flash('signupMessage', req.__('BACK_SIGNUP_MISSING_FIELDS')));
                        } else if (err.message === userHelper.EXCEPTIONS.UNKNOWN_GENDER) {
                            done(null, false, req.flash('signupMessage', req.__('BACK_SIGNUP_MISSING_FIELDS')));
                        } else if (err.message === userHelper.EXCEPTIONS.MALFORMED_DATE_OF_BIRTH) {
                            done(null, false, req.flash('signupMessage', req.__('BACK_SIGNUP_MISSING_FIELDS')));
                        } else {
                            done(err);
                        }
                    }
                );
            }
        }
    );
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
        if (req.flash('loginMessage').length > 0) {
            message = req.flash('loginMessage');
        }
        res.render('login.ejs', {message: message});
    });

    app.get('/signup', recaptcha.middleware.render, function (req, res) {
        var profilesConfig = config.userProfiles || {};
        var fields = profilesConfig.requiredFields || [];
        var required = {'gender': fields.indexOf('gender') >= 0, 'birthdate': fields.indexOf('birthdate') >= 0};
        res.render(
            'signup.ejs',
            {
                email: req.query.email,
                captcha: req.recaptcha,
                requiredFields: required,
                message: req.flash('signupMessage')
            }
        );
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
        db.User.findOne({where: {email: req.query.email}})
            .then(function (user) {
                if (user) {
                    codeHelper.verifyEmail(user, req.query.code).then(function (success) {
                            if (success) {
                                res.render('./verify-mail.ejs', {verified: user.verified, userId: user.id});
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

    app.post('/signup', recaptcha.middleware.verify, function (req, res, next) {

        passport.authenticate('local-signup', function (err, user, info) {

            if (req.recaptcha.error) {
                return requestHelper.redirect(res, '/signup?error=recaptcha');
            }
            if (err) {
                return next(err);
            }
            // Redirect if it fails
            if (!user) {
                return requestHelper.redirect(res, '/signup?email=' + req.body.email);
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

    app.post('/password/code', recaptcha.middleware.verify, function (req, res, next) {

        if (req.recaptcha.error) {
            return res.status(400).json({msg: req.__('BACK_SIGNUP_PWD_CODE_RECAPTCHA_EMPTY_OR_WRONG')});
        }

        req.checkBody('email', req.__('BACK_SIGNUP_EMAIL_EMPTY_OR_INVALID')).isEmail();

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
            if (!passwordHelper.isStrong(req.body.password)) {
                res.status(400).json({
                    msg: passwordHelper.getWeaknessesMsg(req.body.password, req),
                    password_strength_errors: passwordHelper.getWeaknesses(req.body.password, req)
                });
                return;
            }
            db.User.findOne({where: {email: req.body.email}})
                .then(function (user) {
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
        });

    });

    function redirectOnSuccess(req, res, next) {
        var redirectUri = req.session.auth_origin;
        delete req.session.auth_origin;

        if (redirectUri) {
            return res.redirect(redirectUri);
        }

        return requestHelper.redirect(res, '/');
    }


};
