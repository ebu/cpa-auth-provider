"use strict";

var config     = require('../../config');
var db         = require('../../models/index');
var authHelper = require('../../lib/auth-helper');
var util       = require('util');
var xssFilters = require('xss-filters');

var routes = function (router) {
    router.put('/user/profile/:user_id', authHelper.ensureAuthenticated, function (req, res) {
        var userId = req.params.user_id;
        req.checkBody('firstname', '"Firstname" is empty or invalid').notEmpty().isString();
        req.checkBody('lastname', '"Lastname" is empty or invalid').notEmpty().isString();
        req.checkBody('birthdate', '"Birthdate" is empty or invalid').notEmpty().isInt();
        req.checkBody('gender', '"Sex" empty or is invalid').notEmpty().isHuman();

        req.getValidationResult().then(function(result) {
            if (!result.isEmpty()) {
                res.status(400).json({errors: result.array()});
                return;
            }
            db.UserProfile.findOrCreate({
                where: { user_id: userId }
            }).then(function (user_profile) {
                    user_profile.updateAttributes(
                        {
                            //use XSS filters to prevent users storing malicious data/code that could be interpreted then
                            firstname: xssFilters.inHTMLData(req.body.firstname),
                            lastname: xssFilters.inHTMLData(req.body.lastname),
                            gender: xssFilters.inHTMLData(req.body.gender),
                            birthdate: xssFilters.inHTMLData(req.body.birthdate)
                        })
                        .then(function () {
                                res.json({msg: 'Successfully updated user_profile.'});
                            },
                            function (err) {
                                res.status(500).json({msg: 'Cannot update user_profile. Err:' + err});
                            });
                }
            );
        });
    });
};

module.exports = routes;
