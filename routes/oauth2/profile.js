"use strict";

var passport = require('passport');
var cors = require('cors');
var logger = require('../../lib/logger');
var db = require('../../models');


var user_info = [
    passport.authenticate('bearer', {session: false}),
    function (req, res) {
        logger.debug('[OAuth2][Info][user_id', req.user.id, ']');
        var localLogin;
        db.LocalLogin.findOne({where: {user_id: req.user.id}}).then(function (ll) {
            localLogin = ll;
            db.SocialLogin.findOne({where: {$and: [{user_id: req.user.id}, {email: {$ne: null}}, {email: {$ne: ''}}]}}).then(function (socialLogin) {

                var mail = "";
                if (localLogin) {
                    mail = localLogin.login;
                } else if (socialLogin && socialLogin.email) {
                    mail = socialLogin.email;
                }
                res.json({
                    user: {
                        id: req.user.id,
                        name: req.user.getDisplayName("FIRSTNAME_LASTNAME", mail)
                    },
                    scope: req.authInfo.scope
                });
            });
        });
    }];

var user_id = [
    passport.authenticate('bearer', {session: false}),
    function (req, res) {
        logger.debug('[OAuth2][Info][user_id', req.user.id, ']');
        res.json({
            id: req.user.id,
            scope: req.authInfo.scope
        });
    }];


var user_profile = [
    passport.authenticate('bearer', {session: false}),
    function (req, res) {
        logger.debug('[OAuth2][Profile][user_id', req.user.id, ']');
        if (req.user.LocalLogin) {
            res.json({
                user: {
                    id: req.user.id,
                    email: req.user.LocalLogin ? req.user.LocalLogin.login : null,
                    email_verified: req.user.LocalLogin ? req.user.LocalLogin.verified : null,
                    display_name: req.user.display_name,
                    name: req.user.display_name || (req.user.LocalLogin ? req.user.LocalLogin.login : ''),
                    firstname: req.user.firstname,
                    lastname: req.user.lastname,
                    gender: req.user.gender,
                    date_of_birth: req.user.date_of_birth,
                },
                scope: req.authInfo.scope
            });
        } else {
            db.SocialLogin.findOne({where: {user_id: req.user.id}}).then(function (socialLogin) {
                res.json({
                    user: {
                        id: req.user.id,
                        email: socialLogin.email,
                        email_verified: true,
                        display_name: socialLogin.display_name ? socialLogin.display_name : socialLogin.email,
                        name: socialLogin.display_name ? socialLogin.display_name : socialLogin.email,
                        firstname: socialLogin.firstname,
                        lastname: socialLogin.lastname,
                        gender: socialLogin.gender,
                        date_of_birth: socialLogin.date_of_birth,
                    },
                    scope: req.authInfo.scope
                });
            });
        }
    }];


module.exports = function (router) {

    // TODO move this to a standalone server as Profile Manager
    // TODO configure the restriction of origins on the CORS preflight call
    var cors_headers = cors({origin: true, methods: ['GET']});
    router.options('/oauth2/user_info', cors_headers);
    router.options('/oauth2/user_id', cors_headers);
    router.options('/oauth2/user_profile', cors_headers);

    router.get('/oauth2/user_info', cors_headers, user_info);
    router.get('/oauth2/user_id', cors_headers, user_id);
    router.get('/oauth2/user_profile', cors_headers, user_profile);
};