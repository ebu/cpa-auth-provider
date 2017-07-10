"use strict";

var db = require('../../models');
var config = require('../../config');
var requestHelper = require('../../lib/request-helper');

var passport = require('passport');
var TwitterStrategy = require('passport-twitter');

passport.use(new TwitterStrategy({
        consumerKey: config.identity_providers.twitter.consumer_key,
        consumerSecret: config.identity_providers.twitter.consumer_secret,
        callbackURL: config.identity_providers.twitter.callback_url
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

// passport.use(new TwitterStrategy({
//         consumerKey: TWITTER_CONSUMER_KEY,
//         consumerSecret: TWITTER_CONSUMER_SECRET,
//         callbackURL: "http://127.0.0.1:3000/auth/twitter/callback"
//     },
//     function(token, tokenSecret, profile, cb) {
//         User.findOrCreate({ twitterId: profile.id }, function (err, user) {
//             return cb(err, user);
//         });
//     }
// ));

module.exports = function (app, options) {
    app.get('/auth/facebook', passport.authenticate('facebook'));

    app.get('/auth/facebook/callback', passport.authenticate('facebook', {
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
