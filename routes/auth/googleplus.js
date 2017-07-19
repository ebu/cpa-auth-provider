"use strict";

var db = require('../../models/index');
var config = require('../../config');
var requestHelper = require('../../lib/request-helper');

var passport = require('passport');
var GooglePlusStrategy = require('passport-google-plus');

passport.use(new GooglePlusStrategy({
        clientId: config.identity_providers.googleplus.client_id,
        clientSecret: config.identity_providers.googleplus.client_secret
    },
    function (accessToken, refreshToken, profile, done) {
        var photo_url = (profile.photos.length > 0) ? profile.photos[0].value : null;
        db.User.findOrCreate({
            where: {
                provider_uid: "fb:" + profile.id,
                display_name: profile.displayName,
                photo_url: photo_url
            }
        }).spread(function (user) {
            user.logLogin().then(function () {
            }, function () {
            });
            return done(null, user);
        }).catch(function (err) {
            done(err, null);
        });
    }
));

// passport.use(new GooglePlusStrategy({
//         clientId: 'YOUR_CLIENT_ID',
//         clientSecret: 'YOUR_CLIENT_SECRET'
//     },
//     function(tokens, profile, done) {
//         // Create or update user, call done() when complete...
//         done(null, profile, tokens);
//     }
// ));

module.exports = function (app, options) {
    app.get('/auth/googleplus', passport.authenticate('facebook'));

    app.get('/auth/googleplus/callback', passport.authenticate('facebook', {
        failureRedirect: '/?error=login_failed'
    }), function (req, res, next) {

        var redirectUri = req.session.auth_origin;
        delete req.session.auth_origin;

        if (redirectUri) {
            return res.redirect(redirectUri);
        }

        requestHelper.redirect(res, '/');
    });
};
