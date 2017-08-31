"use strict";

var db = require('../../models');
var config = require('../../config');
var requestHelper = require('../../lib/request-helper');
var callbackHelper = require('../../lib/callback-helper');
var oAuthProviderHelper = require('../../lib/oAuth-provider-helper');

var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;

function findOrCreateExternalUser(email, fbData) {
    console.log("defaults", fbData);
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
                            defaults: fbData
                        }
                    ).spread(
                        function (user) {
                            db.OAuthProvider.findOne({
                                where: {
                                    name: oAuthProviderHelper.FB,
                                    user_id: user.id
                                }
                            }).then(function (provider) {
                                if (!provider) {
                                    provider = db.OAuthProvider.build({
                                        name: oAuthProviderHelper.FB,
                                        uid: fbData.provider_uid,
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
                            name: oAuthProviderHelper.FB,
                            user_id: user.id
                        }
                    }).then(function (provider) {
                        if (!provider) {
                            provider = db.OAuthProvider.build({
                                name: oAuthProviderHelper.FB,
                                uid: fbData.provider_uid,
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
                            display_name: fbData.display_name,
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

passport.use(new FacebookStrategy({
        clientID: config.identity_providers.facebook.client_id,
        clientSecret: config.identity_providers.facebook.client_secret,
        callbackURL: callbackHelper.getURL('/auth/facebook/callback'),
        profileFields: ['id', 'emails', 'displayName']
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

        var providerUid = 'fb:' + profile.id;

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
    app.get('/auth/facebook', passport.authenticate('facebook', {scope: ['email']}));

    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {failureRedirect: '/auth?error=LOGIN_INVALID_EMAIL_BECAUSE_NOT_VALIDATED'}),
        function (req, res) {

            var redirectUri = req.session.auth_origin;
            delete req.session.auth_origin;

            if (redirectUri) {
                return res.redirect(redirectUri);
            }
            // Successful authentication, redirect home.
            requestHelper.redirect(res, '/');

        });
};
