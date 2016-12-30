"use strict";

var config     = require('../../config');
var db         = require('../../models/index');
var authHelper = require('../../lib/auth-helper');
var util       = require('util');

var routes = function (router) {
    router.put('/user/profile/:user_id', authHelper.ensureAuthenticated, function (req, res) {
        var userId = req.params.user_id;
        req.checkBody('firstname', 'Champ nom non valide').notEmpty().isInt();

        req.getValidationResult().then(function(result) {
            if (!result.isEmpty()) {
                res.status(400).send('There have been validation errors: ' + util.inspect(result.array()));
                return;
            }
            res.json({msg: 'All good'});
        });

        // db.UserProfile.findOrCreate({
        //     user_id: userId
        // }).then(function (user_profile) {
        //         user_profile.updateAttributes(
        //             {
        //                 firstname: req.body.firstname,
        //                 lastname: req.body.lastname,
        //                 gender: req.body.gender,
        //                 birthdate: req.body.birthdate ? req.body.birthdate : user_profile.birthdate
        //             })
        //             .then(function () {
        //                     res.json({msg: 'Successfully updated user_profile.'});
        //                 },
        //                 function (err) {
        //                     res.status(500).json({msg: 'Cannot update user_profile. Err:' + err});
        //                 });
        //     }
        // );

    });
};

module.exports = routes;
