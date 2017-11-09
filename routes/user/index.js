"use strict";

var config = require('../../config');
var db = require('../../models');
var authHelper = require('../../lib/auth-helper');
var passwordHelper = require('../../lib/password-helper');
var oAuthProviderHelper = require('../../lib/oAuth-provider-helper');
var i18n = require('i18n');

// Google reCAPTCHA
var recaptcha = require('express-recaptcha');

var routes = function (router) {

    router.get('/user/devices', authHelper.authenticateFirst, function (req, res, next) {
        db.Client
            .findAll({
                where: {user_id: req.user.id},
                include: [
                    db.User,
                    {model: db.AccessToken, include: [db.Domain]},
                    {model: db.PairingCode, include: [db.Domain]}
                ],
                order: [['id']]
            })
            .then(function (clients) {
                return res.render('./user/devices.ejs', {devices: clients});
            }, function (err) {
                next(err);
            });
    });

    router.get('/user/profile', recaptcha.middleware.render, authHelper.authenticateFirst, function (req, res, next) {
        db.User.findOne({
            where: {
                id: req.user.id
            }
        }).then(function (user) {
            if (!user) {
                return res.status(401).send({msg: req.__('BACK_PROFILE_AUTH_FAIL')});
            } else {
                db.UserProfile.findOrCreate({
                    where: {
                        user_id: req.user.id
                    }
                }).spread(function (profile) {
                    oAuthProviderHelper.getOAuthProviders(user).then(function (providers) {

                        var data = {
                            profile: {
                                firstname: profile.firstname,
                                lastname: profile.lastname,
                                gender: profile.gender,
                                language: profile.language,
                                date_of_birth: profile.date_of_birth ? parseInt(profile.date_of_birth) : profile.date_of_birth,
                                email: user.email,
                                display_name: profile.getDisplayName(user, req.query.policy),
                                verified: user.verified,
                                hasPassword: !!user.password,
                                facebook: providers.indexOf(oAuthProviderHelper.FB) > -1,
                                google: providers.indexOf(oAuthProviderHelper.GOOGLE) > -1
                            },
                            captcha: req.recaptcha
                        };

                        res.render('./user/profile.ejs', data);
                    });


                });
            }
        }, function (err) {
            next(err);
        });
    });

    router.post('/user/:user_id/password', authHelper.ensureAuthenticated, function (req, res) {
        req.checkBody('previous_password', req.__('BACK_CHANGE_PWD_PREV_PASS_EMPTY')).notEmpty();
        req.checkBody('password', req.__('BACK_CHANGE_PWD_NEW_PASS_EMPTY')).notEmpty();
        req.checkBody('confirm_password', req.__('BACK_CHANGE_PWD_CONFIRM_PASS_EMPTY')).notEmpty();
        req.checkBody('password', req.__('BACK_CHANGE_PWD_PASS_DONT_MATCH')).equals(req.body.confirm_password);

        req.getValidationResult().then(function (result) {
            if (!result.isEmpty()) {
                res.status(400).json({errors: result.array()});
            } else {
                if (!passwordHelper.isStrong(req.body.password)) {
                    res.status(400).json({
                        errors: [{msg: passwordHelper.getWeaknessesMsg(req.body.password, req)}],
                        password_strength_errors: passwordHelper.getWeaknesses(req.body.password, req)
                    });
                } else {
                    db.User.findOne({
                        where: {
                            id: req.user.id
                        }
                    }).then(function (user) {
                        if (!user) {
                            return res.status(401).send({errors: [{msg: req.__('BACK_USER_NOT_FOUND')}]});
                        } else {
                            user.verifyPassword(req.body.previous_password).then(function (isMatch) {
                                // if user is found and password is right change password
                                if (isMatch) {
                                    user.setPassword(req.body.password).then(
                                        function () {
                                            res.json({msg: req.__('BACK_SUCESS_PASS_CHANGED')});
                                        },
                                        function (err) {
                                            res.status(500).json({errors: [err]});
                                        }
                                    );
                                } else {
                                    res.status(401).json({errors: [{msg: req.__('BACK_INCORRECT_PREVIOUS_PASS')}]});
                                }
                            });
                        }
                    });
                }
            }
        });
    });

    router.post('/user/:user_id/password/create', authHelper.ensureAuthenticated, function (req, res) {
        req.checkBody('password', req.__('BACK_CHANGE_PWD_NEW_PASS_EMPTY')).notEmpty();
        req.checkBody('confirm_password', req.__('BACK_CHANGE_PWD_CONFIRM_PASS_EMPTY')).notEmpty();
        req.checkBody('password', req.__('BACK_CHANGE_PWD_PASS_DONT_MATCH')).equals(req.body.confirm_password);

        req.getValidationResult().then(function (result) {
            if (!result.isEmpty()) {
                res.status(400).json({errors: result.array()});
            } else {
                if (!passwordHelper.isStrong(req.body.password)) {
                    return res.status(400).json({
                        errors: [{msg: passwordHelper.getWeaknessesMsg(req.body.password, req)}],
                        password_strength_errors: passwordHelper.getWeaknesses(req.body.password, req)
                    });
                }
                db.User.findOne({
                    where: {
                        id: req.user.id
                    }
                }).then(function (user) {
                    if (!user) {
                        return res.status(401).send({errors: [{msg: req.__('BACK_USER_NOT_FOUND')}]});
                    } else {
                        user.setPassword(req.body.password).then(
                            function () {
                                res.json({msg: req.__('BACK_SUCESS_PASS_CREATED')});
                            },
                            function (err) {
                                res.status(500).json({errors: [err]});
                            }
                        );
                    }
                });
            }
        });
    });


};

module.exports = routes;
