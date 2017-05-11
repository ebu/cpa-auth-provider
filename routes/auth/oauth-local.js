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
    // This is needed because when configuring a custom header JQuery automatically send options request to the server.
    // That following line avoid cross domain error like
    // XMLHttpRequest cannot load http://localhost.rts.ch:3000/api/local/info.
    // Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
    // Origin 'http://localhost.rts.ch:8090' is therefore not allowed access.
    app.options('/oauth2/session/cookie/request', cors);


    app.post('/oauth2/session/cookie/request', cors, passport.authenticate('oauth-local', {session: true}),
        function (req, res) {
            // Set to true if you need the website to include cookies in the requests sent
            // to the API (e.g. in case you use sessions)
            res.setHeader('Access-Control-Allow-Credentials', true);

            // test if we have a request origin
            if(req.get('origin')) {
                // Might not be needed... But needed sometime...
                res.setHeader('Access-Control-Allow-Origin', req.get('origin'));
            }

            res.json({
                id: req.user.id,
                email: req.user.email}
            );
        });

    // This is needed because when configuring a custom header JQuery automaticaly send options request to the server.
    // That following line avoid cross domain error like
    // XMLHttpRequest cannot load http://localhost.rts.ch:3000/api/local/info.
    // Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
    // Origin 'http://localhost.rts.ch:8090' is therefore not allowed access.
    app.options('/user/profile/display_name', cors);

    app.get('/user/profile/display_name', cors, function (req, res, next) {
        if (!req.user) {
            // Return 200 to avoid error in browser console
            res.status(200);
        } else {
            db.User.findOne({
                where: {
                    id: req.user.id
                }
            }).then(function (user) {
                if (!user) {
                    // Return 200 to avoid error in browser console
                    res.status(200);
                } else {
                    db.UserProfile.findOrCreate({
                        where: {
                            user_id: req.user.id
                        }
                    }).spread(function (profile) {
                        var data = {
                            display_name: profile.getDisplayName(user, req.query.policy)
                        };
                        // Set to true if you need the website to include cookies in the requests sent
                        // to the API (e.g. in case you use sessions)
                        res.setHeader('Access-Control-Allow-Credentials', true);

                        console.log("req.get('origin')", req.get('origin'));

                        if (req.get('origin')) {
                            // Might not be needed... But needed sometime...
                            res.setHeader('Access-Control-Allow-Origin', req.get('origin'));
                        }
                        res.json(data);

                    });
                }
            }, function (err) {
                next(err);
            });
        }

    });


};
