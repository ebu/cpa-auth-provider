"use strict";

var config = require('../../config');
var authHelper = require('../../lib/auth-helper');
var db = require('../../models');
var i18n = require('i18n');

var routes = function (router) {

    router.post('/i18n/cookie', function (req, res) {

        if (req.body.language) {
            res.cookie(config.i18n.cookie_name, req.body.language, {
                maxAge: config.i18n.cookie_duration,
                httpOnly: true
            });
            return res.status(200).send();
        } else {
            return res.status(400).send();
        }

    });

    router.post('/i18n/profile', authHelper.ensureAuthenticated, function (req, res, next) {

        if (!req.body.language) {
            return res.status(400).send();
        }

        res.cookie(config.i18n.cookie_name, req.body.language, {
            maxAge: config.i18n.cookie_duration,
            httpOnly: true
        });

        var user = authHelper.getAuthenticatedUser(req);
        if (!user) {
            res.status(401).send();
        } else {
            return db.UserProfile.findOrCreate({
                where: {
                    user_id: user.id
                }
            }).spread(function (userProfile) {
                return userProfile.updateAttributes({language: req.body.language}).then(function () {
                    return res.status(200).send();
                });
            });
        }
    });

};

module.exports = routes;
