"use strict";

var db = require('../../models');
var config = require('../../config');
var passport = require('passport');
var cors = require('../../lib/cors');
var authHelper = require('../../lib/auth-helper');
var util = require('util');


var jwtHelpers = require('../../lib/jwt-helper');

module.exports = function (app, options) {

    // This is needed because when configuring a custom header JQuery automaticaly send options request to the server.
    // That following line avoid cross domain error like
    // XMLHttpRequest cannot load http://localhost.rts.ch:3000/api/local/info.
    // Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
    // Origin 'http://localhost.rts.ch:8090' is therefore not allowed access.
    app.options('/api/local/profile', cors);

    app.get('/api/local/profile', cors, passport.authenticate('jwt', {session: false}), function (req, res) {

        var user = authHelper.getAuthenticatedUser(req);

        if (!user) {
            return res.status(401).send({success: false, msg: 'Authentication failed. user profile not found.'});
        } else {
            db.UserProfile.findOrCreate({
                user_id: user.id
            }).then(function (user_profile) {

                res.json({
                    success: true,
                    user_profile: {
                        firstname: user_profile.firstname,
                        lastname: user_profile.lastname,
                        gender: user_profile.gender,
                        birthdate: user_profile.birthdate ? parseInt(user_profile.birthdate) : user_profile.birthdate,
                        email: user.email,
                        display_name: user_profile.getDisplayName(user, req.query.policy)
                    }
                });
            });
        }
    });

    app.put('/api/local/profile', cors, passport.authenticate('jwt', {session: false}), function (req, res) {

        // Data validation
        if (req.body.firstname) {
            req.checkBody('firstname', 'firstname, invalide format. Must be a string').isString();
        }
        if (req.body.lastname) {
            req.checkBody('lastname', 'lastname, invalide format. Must be a string').isString();
        }
        if (req.body.birthdate) {
            req.checkBody('birthdate', 'birthdate, invalide format. Must be a timestamp').isInt();
        }
        if (req.body.gender) {
            req.checkBody('gender', 'gender, invalide value. Must be a "male" or "female"').isHuman();
        }

        req.getValidationResult().then(function (result) {

                if (!result.isEmpty()) {
                    // console.log('There have been validation errors: ' + util.inspect(result.array()));
                    res.status(400).json({
                        success: false,
                        msg: 'There have been validation errors: ' + result.array,
                    });
                }

                else {

                    var token = jwtHelpers.getToken(req.headers);

                    if (token) {
                        var decoded = jwtHelpers.decode(token, config.jwtSecret);
                        db.UserProfile.findOrCreate({
                            user_id: decoded.id
                        }).then(function (user_profile) {
                                user_profile.updateAttributes(
                                    {
                                        firstname: req.body.firstname ? req.body.firstname : user_profile.firstname,
                                        lastname: req.body.lastname ? req.body.lastname : user_profile.lastname,
                                        gender: req.body.gender ? req.body.gender : user_profile.gender,
                                        birthdate: req.body.birthdate ? req.body.birthdate + '' : user_profile.birthdate,
                                    })
                                    .then(function () {
                                            res.json({success: true, msg: 'Successfully updated user_profile.'});
                                        },
                                        function (err) {
                                            res.status(500).json({
                                                success: false,
                                                msg: 'Cannot update user_profile. Err:' + err
                                            });
                                        });
                            }
                        );
                    }
                }
            }
        );
    });
};
