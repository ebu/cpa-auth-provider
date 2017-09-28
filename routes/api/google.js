"use strict";

var db = require('../../models');
var config = require('../../config');
var jwt = require('jwt-simple');
var jwtHelper = require('../../lib/jwt-helper');
var oAuthProviderHelper = require('../../lib/oAuth-provider-helper');
var cors = require('../../lib/cors');

var googleHelper = require('../../lib/google-helper')

module.exports = function (app, options) {
    app.post('/api/google/signup', cors, function (req, res) {

        var googleIdToken = req.body.idToken;

        if (googleIdToken && googleIdToken.length > 0) {
            try {
                var user = googleHelper.verifyGoogleIdToken(googleIdToken);
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

            } catch (error) {
                res.status(500).json({error: error.message});
            }
            // });
        } else {
            res.status(500).json({error: 'Missing google IDtoken to connect with Google account'});
        }
    });
};


function performGoogleLogin(googleProfile, done) {
    if (googleProfile) {
        db.OAuthProvider.findOne({where: {uid: googleProfile.provider_uid}}).then(function (googleProvider) {
            if (!googleProvider) {
                db.User.findOrCreate({
                    where: {
                        email: googleProfile.email
                    }, defaults: {
                        verified: true,
                        display_name: googleProfile.display_name
                    }
                }).spread(function (me) {
                    me.updateAttributes({display_name: googleProfile.display_name, verified: true}).then(function () {
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
            } else {
                db.User.findOne({where: {email: googleProfile.email}}).then(function (user) {
                    user.logLogin().then(function () {
                        return done(null, buildResponse(user));
                    }, function (error) {
                        return done(error, null);
                    });
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