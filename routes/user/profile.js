"use strict";

var config     = require('../../config');
var db         = require('../../models/index');
var authHelper = require('../../lib/auth-helper');
var async      = require('async');

var routes = function(router) {
  router.put('/user/profile/:user_id', authHelper.ensureAuthenticated, function(req, res) {
    var userId = req.params.user_id;

    db.UserProfile.findOrCreate({
      user_id: userId
    }).then(function (user_profile) {
          user_profile.updateAttributes(
              {
                firstname: req.body.firstname ? req.body.firstname : user_profile.firstname,
                lastname: req.body.lastname ? req.body.lastname : user_profile.lastname,
                gender: req.body.gender ? req.body.gender : user_profile.gender,
                birthdate: req.body.birthdate ? req.body.birthdate : user_profile.birthdate
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
};

module.exports = routes;
