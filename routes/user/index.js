"use strict";

var config     = require('../../config');
var db         = require('../../models');
var authHelper = require('../../lib/auth-helper');

var routes = function(router) {
  router.get('/user/devices', authHelper.ensureAuthenticated, function(req, res, next) {
    db.Client
      .findAll({
        where: { user_id: req.user.id },
        include: [
          db.User,
          { model: db.AccessToken, include: [db.Domain] },
          { model: db.PairingCode, include: [db.Domain] }
        ],
        order: [ [ 'id' ] ]
      })
      .then(function(clients) {
        return res.render('./user/devices.ejs', { devices: clients });
      }, function(err) {
        next(err);
      });
  });
};

module.exports = routes;
