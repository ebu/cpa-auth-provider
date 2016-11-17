"use strict";

var db = require('../../models');
var config = require('../../config');
var passport = require('passport');
var cors = require('../../lib/cors');

var jwtHelpers = require('../../lib/jwt-helper');

module.exports = function (app, options) {

    // This is needed because when configuring a custom header JQuery automaticaly send options request to the server.
    // That following line avoid cross domain error like
    // XMLHttpRequest cannot load http://localhost.rts.ch:3000/api/local/info.
    // Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
    // Origin 'http://localhost.rts.ch:8090' is therefore not allowed access.
    app.options('/api/local/profile', cors);

    app.get('/api/local/profile', cors, passport.authenticate('jwt', {session: false}), function (req, res) {
        var token = jwtHelpers.getToken(req.headers);
        if (token) {
            var decoded = jwtHelpers.decode(token, config.jwtSecret);
            db.UserProfile.findOrCreate({
                user_id: decoded.id
            }).then(function (user_profile) {
                if (!user_profile) {
                    return res.status(403).send({msg: 'Authentication failed. user profile not found.'}); //TODO change 401 UNAUTHORIZED
                } else {
                    res.json({
                        success: true,
                        user_profile: {
                            firstname: user_profile.firstname,
                            lastname: user_profile.lastname,
                            gender: user_profile.gender,
                            birthdate: user_profile.birthdate
                        }
                    });
                }
            });
        } else {
            return res.status(403).send({msg: 'No token provided.'});
        }
    });

    app.post('/api/local/profile', cors, passport.authenticate('jwt', {session: false}), function (req, res) {

        console.log(req.body);


        var token = jwtHelpers.getToken(req.headers);
        if (token) {
            var decoded = jwtHelpers.decode(token, config.jwtSecret);
            db.UserProfile.findOrCreate({
                user_id: decoded.id
            }).then(function (user_profile) {

                    user_profile.updateAttributes(
                        {
                            firstname: req.body.firstname ? req.body.firstname : user_profile.firstName,
                            lastname: req.body.lastname ? req.body.lastname : user_profile.lastname,
                            gender: req.body.gender ? req.body.gender : user_profile.gender,
                            birthdate: req.body.birthdate ? req.body.birthdate : user_profile.birthdate,
                        }
                        )
                        .then(function () {
                                res.json({msg: 'Successfully updated user_profile.'});
                            },
                            function (err) {
                                res.status(500).json({msg: 'Cannot update user_profile. Err:' + err});
                            });
                }
            )


        }

    });

};
