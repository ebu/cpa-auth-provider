"use strict";

var db = require('../../models/index');
var config = require('../../config');
var requestHelper = require('../../lib/request-helper');
var oAuthProviderHelper = require('../../lib/oAuth-provider-helper');

var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth20');

var callbackHelper = require('../../lib/callback-helper');

function findOrCreateExternalUser(email, googleData) {
    return new Promise(function (resolve, reject) {
        db.User.find(
            {
                where: {
                    email: email
                }
            }
        ).then(
            function (user) {
                if (!user) {
                    return db.User.findOrCreate(
                        {
                            where: {
                                email: email
                            },
                            defaults: googleData
                        }
                    ).spread(
                        function (user) {

                            db.OAuthProvider.findOne({
                                where: {
                                    name: oAuthProviderHelper.GOOGLE,
                                    user_id: user.id
                                }
                            }).then(function (provider) {
                                if (!provider) {
                                    provider = db.OAuthProvider.build({
                                        name: oAuthProviderHelper.GOOGLE,
                                        uid: googleData.provider_uid,
                                        user_id: user.id
                                    });
                                    provider.save().then(function () {
                                        return resolve(user);
                                    });
                                } else {
                                    return resolve(user);
                                }
                            });
                        }
                    ).catch(reject);
                } else {
                    db.OAuthProvider.findOne({
                        where: {
                            name: oAuthProviderHelper.GOOGLE,
                            user_id: user.id
                        }
                    }).then(function (provider) {
                        if (!provider) {
                            provider = db.OAuthProvider.build({
                                name: oAuthProviderHelper.GOOGLE,
                                uid: googleData.provider_uid,
                                user_id: user.id
                            });
                            provider.save();
                        }
                    });
                }
                if (!user.verified) {
                    return resolve(false);
                }
                if (user.display_name) {
                    return user.updateAttributes({
                            display_name: googleData.display_name,
                            verified: true
                        }
                    ).then(resolve, reject);
                } else {
                    return user.updateAttributes({
                        verified: true
                    }).then(resolve, reject);
                }
            },
            reject
        );
    });
}

passport.use(new GoogleStrategy({
        clientID: config.identity_providers.google.client_id,
        clientSecret: config.identity_providers.google.client_secret,
        callbackURL: callbackHelper.getURL('/auth/google/callback')
    },
    function (accessToken, refreshToken, profile, done) {
        var email = '';
        if (profile.emails !== undefined) {
            email = profile.emails[0].value;
        }

        if (email === '') {
            return done(new Error('NO_EMAIL', null));
        }

        var providerUid = 'google:' + profile.id;

        return findOrCreateExternalUser(
            email,
            {
                provider_uid: providerUid,
                display_name: profile.displayName,
                verified: true
            }
        ).then(
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
    app.get('/auth/google', passport.authenticate('google', {scope: ['profile', 'email']}));

    app.get('/auth/google/callback', passport.authenticate('google', {failureRedirect: '/auth?error=LOGIN_INVALID_EMAIL_BECAUSE_NOT_VALIDATED'}), function (req, res) {

        var redirectUri = req.session.auth_origin;
        delete req.session.auth_origin;

        if (redirectUri) {
            return res.redirect(redirectUri);
        }

        requestHelper.redirect(res, '/');
    });
};
