"use strict";

var db = require('../../models');
var config = require('../../config');
var requestHelper = require('../../lib/request-helper');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var emailHelper = require('../../lib/email-helper');
var codeHelper = require('../../lib/code-helper');
var passwordHelper = require('../../lib/password-helper');
var oAuthProviderHelper = require('../../lib/oAuth-provider-helper');
var userHelper = require('../../lib/user-helper');

// Google reCAPTCHA
var recaptcha = require('express-recaptcha');
var i18n = require('i18n');

var localStrategyCallback = function (req, username, password, done) {
    var loginError = req.__('BACK_SIGNUP_INVALID_EMAIL_OR_PASSWORD');
    db.User.findOne({where: {email: username}})
        .then(function (user) {
                if (!user) {
                    doneWithError();
                } else {
                    oAuthProviderHelper.isExternalOAuthUserOnly(user).then(function (res) {
                        if (res) {
                            doneWithError();
                        }
                        else {
                            return user.verifyPassword(password).then(function (isMatch) {
                                    if (isMatch) {
                                        user.logLogin().then(function () {
                                        }, function () {
                                        });
                                        done(null, user);
                                    } else {
                                        doneWithError();
                                    }
                                },
                                function (err) {
                                    done(err);
                                });
                        }
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
                userHelper.createUser(username, password, requiredAttributes, optionnalAttributes).then(
                    function (user) {
                        done(null, user);
                    },
                    function (err) {
                        if (err.message === userHelper.EXCEPTIONS.PASSWORD_WEAK) {
                            doneWithError(req.__('BACK_SIGNUP_PASS_IS_NOT_STRONG_ENOUGH'), done);
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
                                (user.UserProfile && user.UserProfile.language) ? user.UserProfile.language : i18n.getLocale()
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
