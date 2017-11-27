"use strict";

var db = require('../../models');
var config = require('../../config');
var requestHelper = require('../../lib/request-helper');
var facebookHelper = require('../../lib/facebook-helper');
var callbackHelper = require('../../lib/callback-helper');
var oAuthProviderHelper = require('../../lib/oAuth-provider-helper');

var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;

// Fields to import: Email, First and Last Name, Gender, Birthdate
// birthday => This is a fixed format string, like MM/DD/YYYY. However, people can control who can see the year they were born separately from the month and day so this string can be only the year (YYYY) or the month + day (MM/DD)
// gender =>  male or female
var REQUESTED_FIELDS = ['id', 'email', 'displayName', 'first_name', 'last_name', 'gender', 'birthday'];
var REQUESTED_PERMISSIONS = ['email', 'user_birthday'];

passport.use(new FacebookStrategy({
        clientID: config.identity_providers.facebook.client_id,
        clientSecret: config.identity_providers.facebook.client_secret,
        callbackURL: callbackHelper.getURL('/auth/facebook/callback'),
        profileFields: REQUESTED_FIELDS

    },
    function (accessToken, refreshToken, profile, done) {
        var email = '';
        if (profile.emails !== undefined) {
            email = profile.emails[0].value;
        }

        if (email === '') {
            // how to react to such an error!?
            return done(new Error('NO_EMAIL', null));
        }

        var providerUid = facebookHelper.buildFBId(profile.id);

        return oAuthProviderHelper.findOrCreateExternalUser(oAuthProviderHelper.FB, email, providerUid, profile.displayName, profile.name.givenName, profile.name.familyName, profile.gender, facebookHelper.fbDateOfBirthToTimestamp(profile._json.birthday)).then(
            function (u) {
                if (u) {
                    u.logLogin();
                }
                return done(null, u);
            }
        ).catch(
            function (err) {
                done(err);
            }
        );
    }
));

module.exports = function (app, options) {
    app.get('/auth/facebook', passport.authenticate('facebook', {scope: REQUESTED_PERMISSIONS}));

    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {failureRedirect: config.urlPrefix + '/auth?error=LOGIN_INVALID_EMAIL_BECAUSE_NOT_VALIDATED_FB'}),
        function (req, res) {

            var redirectUri = req.session.auth_origin;
            delete req.session.auth_origin;

            req.session.save(
                function () {
                    if (redirectUri) {
                        return res.redirect(redirectUri);
                    }
                    // Successful authentication, redirect home.
                    requestHelper.redirect(res, '/');
                }
            );

        });
};

