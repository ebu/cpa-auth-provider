"use strict";

var db = require('../../models');
var config = require('../../config');
var requestHelper = require('../../lib/request-helper');

var jwt = require('jwt-simple');


module.exports = function (app, options) {
    app.post('/api/profile', cors, function (req, res) {

        if (!req.body.firstName || !req.body.lastName || !req.body.mail || !req.body.gender || !req.body.date_of_birth) {
            return res.status(400).json({msg: 'Missing parameter. Required are: firstName, lastName, mail, gender, date_of_birth'});
        } else {
            var token = getToken(req.headers);
            if (token) {
                var decoded = jwt.decode(token, config.jwtSecret);
                db.user.find({where: {email: req.body.email}})
                    .then(function (user) {
                        db.user_profile.findOrCreate({where: {user_id: user.id}}).then(function (user_profile) {
                            if (user_profile) {
                                db.sequelize.sync().then(function () {
                                    user_profile.firstName = req.body.firstName;
                                    user_profile.lastName = req.body.lastName;
                                    user_profile.mail = req.body.mail;
                                    user_profile.gender = req.body.gender;
                                    user_profile.date_of_birth = req.body.date_of_birth;
                                }).then(function () {
                                    res.json({msg: 'Successfully updated user_profile.'});
                                });
                            } else {
                                return res.status(404).json({msg: 'user_profile not found.'});
                            }
                        });
                    });
            } else {
                return res.status(403).send({msg: 'No token provided.'});
            }
            //  }
        }
        );


    app.get('/api/profile', cors, function (req, res) {
        var token = getToken(req.headers);
        if (token) {
            var decoded = jwt.decode(token, config.jwtSecret);
            db.user_profile.find({
                where: {
                    id: decoded.id
                }
            }).then(function (user_profile) {
                if (!user_profile) {
                    return res.status(403).send({msg: 'Authentication failed. user profile not found.'});
                } else {
                    res.json({
                        success: true,
                        user_profile: {
                            email: user_profile.mail,
                            firstName: user_profile.firstName,
                            lastName: user_profile.lastName,
                            gender: user_profile.gender,
                            date_of_birth: user_profile.date_of_birth
                        }
                    });
                }
            });
        } else {
            return res.status(403).send({msg: 'No token provided.'});
        }
    });
};

