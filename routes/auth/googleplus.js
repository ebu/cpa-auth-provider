"use strict";

var db = require('../../models/index');
var config = require('../../config');
var requestHelper = require('../../lib/request-helper');

var passport = require('passport');
var GooglePlusStrategy = require('passport-google-plus');

function findOrCreateExternalUser(email, defaults) {
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
                            defaults: defaults
                        }
                    ).spread(
                        function (user, created) {
                            return resolve(user);
                        }
                    ).catch(reject);
                }
                if (!user.verified) {
                    return resolve(false);
                }
                if(user.display_name) {
                    defaults.display_name = user.display_name;
                }
                return user.updateAttributes(
                    defaults
                ).then(resolve, reject);
            },
            reject
        );
    });
}

passport.use(new GooglePlusStrategy({
        clientId: config.identity_providers.googleplus.client_id,
        clientSecret: config.identity_providers.googleplus.client_secret
    },
    function (accessToken, refreshToken, profile, done) {
        var email = '';
        if (profile.emails !== undefined) {
            email = profile.emails[0].value;
        }

        if (email === '') {
            return done(new Error('NO_EMAIL', null));
        }

        var providerUid = 'gp:' + profile.id;

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
