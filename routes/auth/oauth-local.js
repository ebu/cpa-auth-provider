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

    //TODO : needed
    // This is needed because when configuring a custom header JQuery automaticaly send options request to the server.
    // That following line avoid cross domain error like
    // XMLHttpRequest cannot load http://localhost.rts.ch:3000/api/local/info.
    // Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
    // Origin 'http://localhost.rts.ch:8090' is therefore not allowed access.
    app.options('/oauth2/session/cookie/request', cors);


    app.post('/oauth2/session/cookie/request', passport.authenticate('oauth-local', {
        failureRedirect: config.urlPrefix + 'tototototototo', //'/auth/local',
        failureFlash: true
    }), redirectOnSuccess);

    function redirectOnSuccess(req, res, next) {
        var redirectUri = req.session.auth_origin;
        delete req.session.auth_origin;

        if (redirectUri) {
            return res.redirect(redirectUri);
        }

        return requestHelper.redirect(res, '/');
    }
};
