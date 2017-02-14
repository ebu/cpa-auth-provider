"use strict";

var config     = require('../../config');
var db         = require('../../models/index');
var authHelper = require('../../lib/auth-helper');
var async      = require('async');

var routes = function(router) {
  router.delete('/user/client/:client_id', authHelper.ensureAuthenticated, function(req, res, next) {
    var clientId = req.params.client_id;

    //Raise 500 http error until we use/develop the endpoint
    res.sendStatus(500);
    //TODO check that user id is the one of the connected user
    db.Client
      .findOne({
        where: { id: clientId, user_id: req.user.id },
        include: [ db.AccessToken ]
      }).then(function(client) {
        if (!client) {
          res.sendErrorResponse(404, "not_found", "Unknown client");
          return;
        }

        // TODO: transaction
        return client
          .destroy()
          .then(function() {
            return db.AccessToken.destroy({
              where: {client_id: client.id}
            });
          })
          .then(function() {
            return db.PairingCode.destroy({
              where: {client_id: client.id}
            });
          })
          .then(function() {
            res.sendStatus(200);
          }).catch(function(err) {
            next(err);
          });

      }, function(err) {
        next(err);
      });
  });
};

module.exports = routes;
