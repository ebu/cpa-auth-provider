"use strict";

var db = require('../../models');
var oAuthProviderHelper = require('../../lib/oAuth-provider-helper');
var cors = require('../../lib/cors');

var googleHelper = require('../../lib/google-helper')

module.exports = function (app, options) {
    app.post('/api/google/signup', cors, function (req, res) {

        var googleIdToken = req.body.idToken;

        if (googleIdToken && googleIdToken.length > 0) {
            try {
                var googleProfile = googleHelper.verifyGoogleIdToken(googleIdToken);
                // If the googleProfile already exists and his account is not validated
                // i.e.: there is a user in the database with the same id and this user email is not validated
                db.User.find({
                    where: {
                        email: googleProfile.email
                    }
                }).then(function (userInDb) {
                    if (userInDb && !userInDb.verified) {
                        res.status(500).json({error: req.__("LOGIN_INVALID_EMAIL_BECAUSE_NOT_VALIDATED_GOOGLE")});
                    } else {
                        oAuthProviderHelper.performLogin(googleProfile, oAuthProviderHelper.GOOGLE, function (error, response) {
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