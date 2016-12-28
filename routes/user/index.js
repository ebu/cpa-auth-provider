"use strict";

var config =     require('../../config');
var db =         require('../../models');
var authHelper = require('../../lib/auth-helper');

var routes = function (router) {
    router.get('/user/devices', authHelper.ensureAuthenticated, function (req, res, next) {
        db.Client
            .findAll({
                where: {user_id: req.user.id},
                include: [
                    db.User,
                    {model: db.AccessToken, include: [db.Domain]},
                    {model: db.PairingCode, include: [db.Domain]}
                ],
                order: [['id']]
            })
            .then(function (clients) {
                return res.render('./user/devices.ejs', {devices: clients});
            }, function (err) {
                next(err);
            });
    });

    router.get('/user/profile', authHelper.ensureAuthenticated, function (req, res, next) {
        db.User.find({
            id: req.user.id
        }).then(function (user) {
            if (!user) {
                return res.status(401).send({msg: 'Authentication failed. user profile not found.'});
            } else {
                db.UserProfile.findOrCreate({
                    user_id: req.user.id
                }).then(function (profile) {
                    // FIXME : remove that => test only
                    profile = {
                        firstname: 'Bob',
                        lastname: 'L\'eponge',
                        gender: 'M',
                        birthdate: '01/01/2017'
                    };

                    res.render('./user/profile.ejs', {profile: profile, user: user});

                });
            }
        }, function (err) {
            next(err);
        });
    });
};

module.exports = routes;
