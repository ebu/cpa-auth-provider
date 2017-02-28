"use strict";

var db = require('../../models');
var config = require('../../config');
var requestHelper = require('../../lib/request-helper');


var bcrypt = require('bcrypt');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var recaptcha = require('express-recaptcha');
var util = require('util');

var emailHelper = require('../../lib/email-helper');
var codeHelper = require('../../lib/code-helper');
var permissionName = require('../../lib/permission-name');

var localStrategyCallback = function (req, username, password, done) {
    var loginError = 'Wrong email or password.';
    db.User.findOne({where: {email: username}})
        .then(function (user) {
                if (!user) {
                    done(null, false, req.flash('loginMessage', loginError));
                    return;
                }

                user.verifyPassword(password).then(function (isMatch) {
                        if (isMatch) {
                            user.logLogin().then(function() {}, function() {});
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

    req.checkBody('email', 'Invalid email').isEmail();
    req.getValidationResult().then(function (result) {
        if (!result.isEmpty()) {
            done(null, false, req.flash('signupMessage', 'Invalid email'));
            return;
        } else {
            if (req.recaptcha.error) {
                done(null, false, req.flash('signupMessage', 'Something went wrong with the reCAPTCHA'));
                return;
            }
            db.User.findOne({where: {email: req.body.email}})
                .then(function (user) {
                    if (user) {
                        done(null, false, req.flash('signupMessage', 'That email is already taken'));
                    } else {
                        db.sequelize.sync().then(function () {
                            db.Permission.findOne({where: {label: permissionName.USER_PERMISSION}}).then(function (permission) {
                                var userParams = {
                                    email: req.body.email
                                };
                                if (permission) {
                                    userParams.permission_id = permission.id;
                                }
                                var user;
                                db.User.create(userParams).then(function (_user) {
                                    user = _user;
                                    return user.setPassword(req.body.password);
                                }).then(function () {
                                    return codeHelper.getOrGenereateEmailVerificationCode(user);
                                }).then(function (code) {
                                    // Async
                                    user.logLogin().then(function() {}, function() {});
                                    console.log("dqdssqfsqdfdsf");
                                    emailHelper.send(
                                        config.mail.from,
                                        user.email,
                                        "validation-email",
                                        {log: true},
                                        {
                                            confirmLink: req.headers.origin + '/email_verify?email=' + encodeURIComponent(user.email) + '&code=' + encodeURIComponent(code),
                                            host: config.mail.host,
                                            mail: encodeURIComponent(user.email),
                                            code: encodeURIComponent(code)
                                        },
                                        config.mail.locale
                                    );
                                }).then(function () {
                                    return done(null, user);
                                }).catch(
                                    function (err) {
                                        done(err);
                                    }
                                );
                            });
                        });
                    }
                }, function (error) {
                    done(error);
                });
        }
    });


};

var localStrategyConf = {
    // by default, local strategy uses username and password, we will override with email
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true // allows us to pass back the entire request to the callback
};

// Google reCAPTCHA
recaptcha.init(config.recaptcha.site_key, config.recaptcha.secret_key);

passport.use('local', new LocalStrategy(localStrategyConf, localStrategyCallback));

passport.use('local-signup', new LocalStrategy(localStrategyConf, localSignupStrategyCallback));

module.exports = function (app, options) {

    app.get('/auth/local', function (req, res) {
        res.render('login.ejs', {message: req.flash('loginMessage')});
    });

    app.get('/signup', function (req, res) {
        res.render('signup.ejs', {email: req.query.email, message: req.flash('signupMessage')});
    });

    app.get('/password/recovery', function (req, res) {
        res.render('password-recovery.ejs', {});
    });

    app.get('/password/edit', function (req, res) {
        res.render('password-edit.ejs', {email: req.query.email, code: req.query.code});
    });

    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

    app.get('/email_verify', function (req, res) {
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
                    return res.status(400).json({msg: 'User not found.'});
                }
            }, function (error) {
                done(error);
            });
    });

    app.post('/login', passport.authenticate('local', {
        failureRedirect: '/auth/local',
        failureFlash: true
    }), redirectOnSuccess);

    app.post('/signup', recaptcha.middleware.verify, function (req, res, next) {

        if (req.recaptcha.error) {
            return res.status(400).json({msg: 'reCaptcha is empty or wrong. '});
        }

        passport.authenticate('local-signup', function (err, user, info) {
            if (err) {
                return next(err);
            }
            // Redirect if it fails
            if (!user) {
                return res.redirect('/signup?email=' + req.body.email);
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
            return res.status(400).json({msg: 'reCaptcha is empty or wrong. '});
        }

        req.checkBody('email', 'Email is empty or invalid').isEmail();

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
                                {log: true},
                                {
                                    forceLink: config.mail.host + '/password/edit?email=' + encodeURIComponent(user.email) + '&code=' + encodeURIComponent(code),
                                    host: config.mail.host,
                                    mail: user.email,
                                    code: code
                                },
                                config.mail.local
                            ).then(
                                function () {
                                },
                                function (err) {
                                }
                            );
                            return res.status(200).send();
                        });
                    } else {
                        return res.status(400).json({msg: 'User not found.'});
                    }
                }, function (error) {
                    next(error);
                });
        });

    });

    app.post('/password/update', function (req, res, next) {

        req.checkBody('password', 'New Password is empty').notEmpty();
        req.checkBody('confirm-password', 'Confirm password is empty').notEmpty();
        req.checkBody('confirm-password', 'Passwords do not match').equals(req.body.password);

        req.getValidationResult().then(function (result) {
            if (!result.isEmpty()) {
                res.status(400).json({errors: result.array()});
                return;
            }
            db.User.findOne({where: {email: req.body.email}})
                .then(function (user) {
                    if (user) {
                        return codeHelper.recoverPassword(user, req.body.code, req.body.password).then(function (sucess) {
                            if (sucess) {
                                return res.status(200).send();
                            } else {
                                return res.status(400).json({msg: 'Wrong recovery code.'});
                            }
                            ;
                        });
                    }
                    else {
                        return res.status(400).json({msg: 'User not found.'});
                    }
                }, function (error) {
                    done(error);
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
