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
            user_id: req.user.id
        }).then(function (profile) {
            if (!profile) {
                return res.status(401).send({msg: 'Authentication failed. user profile not found.'});
            } else {
                res.render('./user/profile.ejs', {profile: profile});
            }
        }, function (err) {
            next(err);
        });
    });
};

module.exports = routes;
