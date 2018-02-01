"use strict";

var db = require('../../models');
var socialLoginHelper = require('../../lib/social-login-helper');
var request = require('request');
var cors = require('../../lib/cors');
var facebookHelper = require('../../lib/facebook-helper');

module.exports = function (app, options) {

    app.post('/oauth/facebook/signup', cors, function (req, res) {
        if (!req.body.client_id) {
            res.status(400).json({error: "Missing client id"});
        } else {
            facebookSignup(req, res);
        }
    });

    app.post('/api/facebook/signup', cors, function (req, res) {
        facebookSignup(req, res);
    });
};

function verifyFacebookUserAccessToken(token, done) {
    var path = 'https://graph.facebook.com/me?fields=id,email,name,first_name,last_name,gender,birthday&access_token=' + token;
    request(path, function (error, response, body) {
        var data = JSON.parse(body);
        if (!error && response && response.statusCode && response.statusCode === 200) {
            var remoteProfile = socialLoginHelper.buildRemoteProfile(facebookHelper.buildFBId(data.id), data.name, data.email, data.first_name, data.last_name, data.gender, facebookHelper.fbDateOfBirthToTimestamp(data.birthday));
            done(null, remoteProfile);
        } else {
            done({code: response.statusCode, message: data.error.message}, null);
        }
    });
}

function facebookSignup(req, res) {
    var facebookAccessToken = req.body.fbToken;
    if (facebookAccessToken && facebookAccessToken.length > 0) {
        // Get back user object from Facebook
        verifyFacebookUserAccessToken(facebookAccessToken, function (err, remoteProfile) {
            if (remoteProfile) {
                // If the user already exists and his account is not validated
                // i.e.: there is a user in the database with the same id and this user email is not validated
                db.LocalLogin.find({
                    where: {
                        login: remoteProfile.email
                    }
                }).then(function (localLoginInDb) {
                    if (localLoginInDb && !localLoginInDb.verified) {
                        res.status(400).json({error: req.__("LOGIN_INVALID_EMAIL_BECAUSE_NOT_VALIDATED_FB")});
                    } else {
                        socialLoginHelper.performLogin(remoteProfile, socialLoginHelper.FB, req.body.client_id, function (error, response) {

                            if (response) {
                                res.status(200).json(response);
                            } else {
                                res.status(500).json({error: error.message});
                            }
                        });
                    }
                });

            } else {
                res.status(401).json({error: "No valid facebook profile found"});
            }

        });
    }
    else {
        // 400 BAD REQUEST
        console.log('error', 'Bad login request from ' +
            req.connection.remoteAddress + '. Reason: facebook access token and application name are required.');
        res.status(400);
    }
}

