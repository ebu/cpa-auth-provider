"use strict";

var config     = require('../../config');
var db         = require('../../models');
var authHelper = require('../../lib/auth-helper');


var routes = function(app) {

  app.get('/user/devices', authHelper.ensureAuthenticated, function(req, res, next) {
    db.PairingCode
      .findAll({
        where: { user_id: req.user.id },
        include: [ db.User, db.Client ],
        order: [ [ db.Client, 'name' ] ]
      }).complete(function(err, codes){
        if (err) {
          next(err);
          return;
        }

        res.render('./user/devices.ejs', { devices: codes });
      });
  });
};

module.exports = routes;
