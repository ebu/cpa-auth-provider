"use strict";
var db = require('../../models/index');
var rtsConfig = require('../../config.js').identity_providers.openam;
var passport = require('passport');
var OpenAMStrategy = require('passport-openam').Strategy;
passport.use(new OpenAMStrategy(
    {
        openAmBaseUrl: rtsConfig.service_url,
        callbackUrl: rtsConfig.callback_url,
        issuer: 'passport-openam'
    },
    function (token, profile, done) {
        process.nextTick(function () {
            db.User.findOrCreate({
                where: {
                    provider_uid: 'rts:' + profile.id,
                    display_name: profile.displayName
                }
            }).spread(function (user) {
                return done(null, user);
            }).error(function (err) {
                done(err, null);
            });
        });
    }));
module.exports = function (app, options) {
    app.get('/auth/openam', passport.authenticate('openam'));
    app.get('/auth/openam/callback', passport.authenticate('openam', {
        failureRedirect: '/?error=login_failed'
    }), function (req, res, next) {
        var redirectUri = req.session.auth_origin;
        delete req.session.auth_origin;
        if (redirectUri) {
            return res.redirect(redirectUri);
        }
        res.redirect('/');
    });
    app.get('/auth/openam/logout', function (req, res) {
        req.logout();
        res.redirect('https://sso.rts.ch/sso/UI/Logout');
    });
};