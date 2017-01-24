"use strict";

var config      = require('../../config');
var db          = require('../../models/index');
var authHelper  = require('../../lib/auth-helper');
var util        = require('util');
var xssFilters  = require('xss-filters');
var emailHelper = require('../../lib/email-helper');


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
            }).spread(function (user_profile) {
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

    router.get('/api/local/request_verification_email/:user_id', authHelper.ensureAuthenticated, function (req, res) {
        var userId = req.params.user_id;
        db.User.findOne({
            where: {
                id: userId
            }
        }).then(function (user) {
            if (!user) {
                return res.status(403).send({success: false, msg: "not authenticated"});
            } else {
                emailHelper.send("from", "to", "Please verify your email by clicking on the following link  \n\nhttp://localhost:3000/email_verify?email={{=it.email}}&code={{=it.code}}\n\n", {log: true}, {
                    email: 'user.email',
                    code: user.verificationCode
                }, function () {
                });
                return res.status(204).send();
            }
        });

    });


};

module.exports = routes;
