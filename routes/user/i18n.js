"use strict";

var config = require('../../config');
var authHelper = require('../../lib/auth-helper');


var routes = function (router) {

    router.post('/i18n', function (req, res) {

        if (req.body.language) {
            res.cookie(config.i18n.cookie_name, req.body.language, {maxAge: config.i18n.cookie_duration, httpOnly: true});

            if (req.body.update_profile && req.body.update_profile === 'yes') {
                var user = authHelper.getAuthenticatedUser(req);
                if (!user) {
                    db.UserProfile.findOrCreate({
                        where: {
                            user_id: user.id
                        }
                    }).then(function (userProfile) {
                        userProfile.updateAttributes({language: req.body.language}).then(function () {
                            return res.status(200).send();
                        });
                    });
                }
            }
            return res.status(200).send();
        } else {
            return res.status(400).send();
        }

    });


};

module.exports = routes;
