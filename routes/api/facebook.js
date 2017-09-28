"use strict";

var db = require('../../models');
var oAuthProviderHelper = require('../../lib/oAuth-provider-helper');
var request = require('request');
var cors = require('../../lib/cors');

module.exports = function (app, options) {
    app.post('/api/facebook/signup', cors, function (req, res) {
        var facebookAccessToken = req.body.fbToken;
        if (facebookAccessToken && facebookAccessToken.length > 0) {
            // Get back user object from Facebook
            verifyFacebookUserAccessToken(facebookAccessToken, function (err, fbProfile) {
                if (fbProfile) {
                    // If the user already exists and his account is not validated
                    // i.e.: there is a user in the database with the same id and this user email is not validated
                    db.User.find({
                        where: {
                            email: fbProfile.email
                        }
                    }).then(function (userInDb) {
                        if (userInDb && !userInDb.verified) {
                            res.status(400).json({error: req.__("LOGIN_INVALID_EMAIL_BECAUSE_NOT_VALIDATED_FB")});
                        } else {
                            oAuthProviderHelper.performLogin(fbProfile, oAuthProviderHelper.FB, function (error, response) {

                                if (response) {
                                    res.status(200).json(response);
                                } else {
                                    res.status(500).json({error: error.message});
                                }
                            });
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
    var path = 'https://graph.facebook.com/me?fields=id,email,name&access_token=' + token;
    request(path, function (error, response, body) {
        var data = JSON.parse(body);
        if (!error && response && response.statusCode && response.statusCode === 200) {
            var fbProfile = {
                provider_uid: "fb:" + data.id,
                display_name: data.name,
                email: data.email
            };
            done(null, fbProfile);
        } else {
            done({code: response.statusCode, message: data.error.message}, null);
        }
    });
}

