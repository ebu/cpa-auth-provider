"use strict";

var config     = require('../../config');
var db         = require('../../models/index');
var authHelper = require('../../lib/auth-helper');
var async      = require('async');


var routes = function(app) {

  app.del('/user/client/:client_id', authHelper.ensureAuthenticated, function(req, res, next) {
    var clientId = req.params.client_id;

    db.Client
      .find({
        where: { id: clientId, user_id: req.user.id },
        include: [ db.AccessToken ]
      }).complete(function(err, client) {
        if (err) {
          next(err);
          return;
        }

        if (!client) {
          res.sendInvalidRequest("Invalid request");
          return;
        }

        // TODO: transaction
        return client
          .destroy()
          .then(function() {
            return db.AccessToken.destroy({
              client_id: client.id
            });
          })
          .then(function() {
            return db.PairingCode.destroy({
              client_id: client.id
            });
          })
          .then(function() {
            res.send(200);
          }).catch(function(err) {
            res.sendInvalidRequest("Invalid request");
          });

      });
  });
};

module.exports = routes;
