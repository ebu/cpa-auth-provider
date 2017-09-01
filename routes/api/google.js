"use strict";

var db = require('../../models');
var config = require('../../config');
var jwt = require('jwt-simple');
var jwtHelper = require('../../lib/jwt-helper');
var oAuthProviderHelper = require('../../lib/oAuth-provider-helper');
var cors = require('../../lib/cors');

var GoogleAuth = require('google-auth-library');
var auth = new GoogleAuth();
var client = new auth.OAuth2(config.identity_providers.google.client_id, '', '');

module.exports = function (app, options) {
    app.post('/api/google/signup', cors, function (req, res) {

        var googleIdToken = req.body.idToken;

        if (googleIdToken && googleIdToken.length > 0) {
            verifyGoogleIdToken(googleIdToken, function (error, user) {
                if (!error && user) {
                    // If the user already exists and his account is not validated
                    // i.e.: there is a user in the database with the same id and this user email is not validated
                    db.User.find({
                        where: {
                            email: user.email
                        }
                    }).then(function (userInDb) {
                        if (userInDb && !userInDb.verified) {
                            res.status(500).json({error: req.__("LOGIN_INVALID_EMAIL_BECAUSE_NOT_VALIDATED_GOOGLE")});
                        } else {
                            performGoogleLogin(user, function (error, response) {
                                if (response) {
                                    res.status(200).json(response);
                                } else {
                                    res.status(500).json({error: error.message});
                                }
                            });
                        }
                    });
                } else {
                    res.status(500).json({error: error.message});
                }
            });
        } else {
            res.status(500).json({error: 'Missing google IDtoken to connect with Google account'});
        }
    });
};

function verifyGoogleIdToken(token, done) {
    client.verifyIdToken(token, config.identity_providers.google.client_id, function (e, login) {
        var payload = login.getPayload();
        var data = payload;

        if (data) {
            var user = {
                provider_uid: "google:" + data.sub,
                display_name: data.name,
                email: data.email
            };
            return done(null, user);
        }
        return done({message: 'No user with this google id were found'}, null);
    });
}

function performGoogleLogin(googleProfile, done) {

    if (googleProfile) {
        db.User.findOne({where: {provider_uid: googleProfile.provider_uid}}).then(function (me) {
            if (me) {
                me.logLogin().then(function (user) {
                    return done(null, buildResponse(user));
                }, function (error) {
                    return done(error, null);
                });
            } else {
                db.User.findOrCreate({
                    where: {
                        provider_uid: googleProfile.provider_uid,
                        // display_name: profile.name,
                        email: googleProfile.email
                    }
                }).spread(function (me) {
                    me.updateAttributes({display_name: googleProfile.display_name, verified:true}).then(function () {
                        me.logLogin().then(function (user) {
                            var provider = db.OAuthProvider.build({
                                where: {
                                    name: oAuthProviderHelper.GOOGLE,
                                    uid: googleProfile.provider_uid,
                                    user_id: user.id
                                }
                            });
                            provider.save().then(function () {
                                return done(null, buildResponse(user));
                            });
                        }, function (error) {
                            return done(error, null);
                        });
                    });
                }).catch(function (err) {
                    return done(err, null);
                });
            }

        }, function (error) {
            return done(error, null);
        });
    }
}

function buildResponse(user) {
    var token = jwtHelper.generate(user.id, 10 * 60 * 60);
    return {
        success: true,
        user: user,
        token: token
    };
}