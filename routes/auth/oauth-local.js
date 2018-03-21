"use strict";

var db = require('../../models');
var config = require('../../config');
var requestHelper = require('../../lib/request-helper');

var passport = require('passport');
var i18n = require('i18n');
var jwtHelper = require('../../lib/jwt-helper');
var cors = require('../../lib/cors');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var userHelper = require('../../lib/user-helper');
var recaptcha = require('express-recaptcha');

var localoAuthStrategyCallback = function (req, username, password, done) {

    var accessToken = req.body.token;

    var userId = jwtHelper.getUserId(accessToken);
    if (userId) {
        db.User.findOne({where: {id: userId}}).then(
            function (user) {
                if (!user) {
                    return done(null, false);
                }
                // TODO: Define scope
                var info = {scope: '*'};
                done(null, user, info);
            }
        ).catch(done);
    } else {
        var clientId = jwtHelper.decode(accessToken).cli;
        db.OAuth2Client.findOne({where: {id: clientId}}).then(
            function (client) {
                if (!client) {
                    return done(null, false);
                }
                // TODO: Define scope
                var info = {scope: '*'};
                done(null, client, info);
            }
        ).catch(done);
    }

};


var localStrategyConf = {
    // by default, local strategy uses username and password, we will override with email
    usernameField: 'token',
    passwordField: 'token',
    passReqToCallback: true // allows us to pass back the entire request to the callback
};

passport.use('oauth-local', new LocalStrategy(localStrategyConf, localoAuthStrategyCallback));

module.exports = function (app, options) {

    // This is needed because when configuring a custom header JQuery automatically send options request to the server.
    // That following line avoid cross domain error like
    // XMLHttpRequest cannot load http://localhost.rts.ch:3000/api/local/info.
    // Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
    // Origin 'http://localhost.rts.ch:8090' is therefore not allowed access.
    app.options('/oauth2/session/cookie/request', cors);


    app.post('/oauth2/session/cookie/request', cors, passport.authenticate('oauth-local', {session: true}),
        function (req, res, next) {
            getUserInfos(req, res, next);
        });

    // This is needed because when configuring a custom header JQuery automaticaly send options request to the server.
    // That following line avoid cross domain error like
    // XMLHttpRequest cannot load http://localhost.rts.ch:3000/api/local/info.
    // Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
    // Origin 'http://localhost.rts.ch:8090' is therefore not allowed access.
    app.options('/user/profile/menu', cors);

    app.get('/user/profile/menu', cors, function (req, res, next) {
        if (!req.user) {
            // Return 200 to avoid error in browser console
            res.json({connected: false});
        } else {
            returnMenuInfos(req.user, req, res);
        }
    });

    // This is needed because when configuring a custom header JQuery automaticaly send options request to the server.
    // That following line avoid cross domain error like
    // XMLHttpRequest cannot load http://localhost.rts.ch:3000/api/local/info.
    // Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
    // Origin 'http://localhost.rts.ch:8090' is therefore not allowed access.
    app.options('/api/logout', cors);

    app.get('/api/logout', cors, function (req, res, next) {
        req.logout();
        res.json({connected: false});
    });

    function returnMenuInfos(user, req, res) {
        if (!user) {
            // Return 204 Success No Content
            res.status(204).json({connected: false});
        } else {
            var language = "en";
            if (req.query && req.query.lang && (req.query.lang === "fr" || req.query.lang === "en" || req.query.lang === "de")) {
                language = req.query.lang;
            }
            var email = "";
            if (user && user.LocalLogin && user.LocalLogin.login) {
                email = user.LocalLogin.login;
            }
            var data = {
                user_id: user.id,
                display_name: user.getDisplayName("FIRSTNAME_LASTNAME", email),
                required_fields: userHelper.getRequiredFields(),
                menu: getMenu(req, language)
            };
            if (!data.display_name) {
                // User just have a social login
                db.SocialLogin.findOne({
                    where: {
                        user_id: user.id
                    }
                }).then(function (socialLogin) {
                    if (socialLogin) {
                        data.display_name = socialLogin.email;
                    }
                    res.json(data);
                });
            } else {
                res.json(data);
            }
        }
    }

    function getUserInfos(req, res, next) {
        db.User.findOne({
            where: {
                id: req.user.id
            }, include: [db.LocalLogin]
        }).then(function (user) {
            returnMenuInfos(user, req, res);
        }, function (err) {
            next(err);
        });
    }

    function getMenu(req, lang) {
        var menu = [
            {
                label: req.__({phrase: 'BACK_API_MENU_LABEL_DEVICES', locale: lang}),
                url: req.protocol + '://' + req.get('host') + "/user/devices?defaultLanguage=" + lang,
                directLink: true
            },
            {
                label: req.__({phrase: 'BACK_API_MENU_LABEL_SETTINGS', locale: lang}),
                url: req.protocol + '://' + req.get('host') + "/user/profile?defaultLanguage=" + lang,
                directLink: true
            }
        ];
        return menu;
    }

};
