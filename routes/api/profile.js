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
                db.User.find({where: {email: req.body.email}})
                    .then(function (user) {
                        if (user) {
                            db.sequelize.sync().then(function () {
                                user.firstName = req.body.firstName;
                                user.lastName = req.body.lastName;
                                user.mail = req.body.mail;
                                user.gender = req.body.gender;
                                user.date_of_birth = req.body.date_of_birth;
                            }).then(function () {
                                res.json({msg: 'Successfully updated user.'});
                            });
                        } else {
                            return res.status(404).json({msg: 'user not found.'});
                        }
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
            db.User.find({
                where: {
                    id: decoded.id
                }
            }).then(function (user) {
                if (!user) {
                    return res.status(403).send({msg: 'Authentication failed. User not found.'});
                } else {
                    res.json({
                        success: true,
                        user: {
                            email: user.mail,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            gender: user.gender,
                            date_of_birth: user.date_of_birth
                        }
                    });
                }
            });
        } else {
            return res.status(403).send({msg: 'No token provided.'});
        }
    });
};

