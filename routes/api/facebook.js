"use strict";

var db = require('../../models');
var config = require('../../config');
var jwtHelper = require('../../lib/jwt-helper');
var request = require('request');
var jwt = require('jwt-simple');
var cors = require('../../lib/cors');

module.exports = function (app, options) {
    app.post('/api/facebook/signup', cors, function (req, res) {
        var facebookAccessToken = req.body.fbToken;
        if (facebookAccessToken && facebookAccessToken.length > 0) {
            // Get back user object from Facebook
            verifyFacebookUserAccessToken(facebookAccessToken, function (err, user) {
                if (user) {
                    // If the user already exists and his account is not validated
                    // i.e.: there is a user in the database with the same id and this user email is not validated
                    db.User.find({
                        where: {
                            email: user.email
                        }
                    }).then(function (userInDb) {
                        if (!userInDb || userInDb.verified) {
                            performFacebookLogin(user, facebookAccessToken, function (error, response) {
                                if (response) {
                                    res.status(200).json(response);
                                } else {
                                    res.status(500).json({error: error.message});
                                }
                            });
                        } else {
                            res.status(500).json({error: req.__("LOGIN_INVALID_EMAIL_BECAUSE_NOT_VALIDATED_FB")});
                        }
                    });


                } else {
                    res.status(500).json({error: err.message});
                }

            });
        }
        else {
            // 400 BAD REQUEST
            console.log('error', 'Bad login request from ' +
                req.connection.remoteAddress + '. Reason: facebook access token and application name are required.');
            res.status(400);
        }
    });
};

function verifyFacebookUserAccessToken(token, done) {
    var path = 'https://graph.facebook.com/me?fields=id,name,email&access_token=' + token;
    request(path, function (error, response, body) {
        var data = JSON.parse(body);
        if (!error && response && response.statusCode && response.statusCode === 200) {
            var user = {
                provider_uid: "fb:" + data.id,
                display_name: data.name,
                email: data.email
            };
            done(null, user);
        } else {
            console.log(data.error);
            done({code: response.statusCode, message: data.error.message}, null);
        }
    });
}

function buildResponse(user) {
    var token = jwtHelper.generate(user.id, 10 * 60 * 60);
    return {
        success: true,
        user: user,
        token: token
    };
}

function performFacebookLogin(profile, fbAccessToken, done) {
    if (profile && fbAccessToken) {
        db.User.findOne({where: {provider_uid: profile.provider_uid}}).then(function (me) {
            if (me) {
                me.logLogin().then(function (user) {
                    return done(null, buildResponse(user));
                }, function (error) {
                    return done(error, null);
                });
            } else {
                db.User.findOrCreate({
                    where: {
                        provider_uid: profile.provider_uid,
                        display_name: profile.name,
                        email: profile.email
                    }
                }).spread(function (me) {
                    me.logLogin().then(function (user) {
                        return done(null, buildResponse(user));
                    }, function (error) {
                        return done(error, null);
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