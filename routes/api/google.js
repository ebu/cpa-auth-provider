"use strict";

var db = require('../../models');
var socialLoginHelper = require('../../lib/social-login-helper');
var cors = require('../../lib/cors');
var googleHelper = require('../../lib/google-helper');

module.exports = function (app, options) {
    app.post('/api/google/signup', cors, function (req, res) {
            var googleIdToken = req.body.idToken;
            var remoteProfile;

            if (googleIdToken && googleIdToken.length > 0) {
                googleHelper.verifyGoogleIdToken(googleIdToken).then(
                    function (googleProfile) {
                        // If the googleProfile already exists and his account is not validated
                        // i.e.: there is a user in the database with the same id and this user email is not validated
                        remoteProfile = socialLoginHelper.buildRemoteProfile(googleHelper.buildGoogleId(googleProfile.provider_uid), googleProfile.display_name, googleProfile.email, googleProfile.givenName, googleProfile.familyName, googleProfile.gender, null);
                        return db.LocalLogin.findOne({
                            where: {
                                login: googleProfile.email
                            }
                        });
                    }
                ).then(
                    function (localLoginInDb) {
                        if (localLoginInDb && !localLoginInDb.verified) {
                            res.status(400).json({error: req.__("LOGIN_INVALID_EMAIL_BECAUSE_NOT_VALIDATED_GOOGLE")});
                        } else {
                            socialLoginHelper.performLogin(remoteProfile, socialLoginHelper.GOOGLE, req.body.client_id, function (error, response) {
                                if (response) {
                                    res.status(200).json(response);
                                } else {
                                    res.status(500).json({error: error.message});
                                }
                            });
                        }
                    }
                ).catch(
                    function (error) {
                        res.status(500).json({error: error.message});
                    }
                );
            }
            else {
                res.status(400).json({error: 'Missing google IDtoken to connect with Google account'});
            }
        }
    );
};