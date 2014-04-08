"use strict";

var config   = require('../config');
var db       = require('../models');
var generate = require('../lib/generate');

var requestHelper = require('../lib/request-helper');

module.exports = function(app) {
  var logger = app.get('logger');

  // Client Registration Endpoint

  app.post('/associate', function(req, res) {
    if (!requestHelper.isContentType(req, 'application/json')) {
      res.sendInvalidRequest("Invalid content type: " + req.get('Content-Type'));
      return;
    }

    var clientId     = req.body.client_id;
    var clientSecret = req.body.client_secret;
    var scopeName    = req.body.scope;

    // TODO: validate clientId
    if (!clientId) {
      res.sendInvalidRequest("Missing client_id");
      return;
    }
    else if (!clientId.toString().match(/^\d+$/)) {
      res.sendInvalidClient("Invalid client_id");
      return;
    }

    if (!clientSecret) {
      res.sendInvalidRequest("Missing client_secret");
      return;
    }

    if (!scopeName) {
      res.sendInvalidRequest("Missing scope");
      return;
    }

    db.Client.find({ where: { id: clientId, secret: clientSecret } }).complete(function(err, client) {
      if (err) {
        res.send(500);
        return;
      }

      if (!client) {
        res.sendInvalidClient("Client " + clientId + " not found");
        return;
      }

      db.Scope.find({ where: { name: scopeName }})
        .complete(function(err, scope) {
          if (err) {
            res.send(500);
            return;
          }

          if (!scope) {
            res.sendInvalidRequest("Scope " + scopeName + " not found");
            return;
          }

          var pairingCode = {
            client_id:           clientId,
            scope_id:            scope.id,
            device_code:         generate.deviceCode(),
            user_code:           generate.userCode(),
            verification_uri:    config.uris.verification_uri
          };

          db.PairingCode.create(pairingCode).then(function() {
            res.set('Cache-Control', 'no-store');
            res.set('Pragma', 'no-cache');

            res.send(200, {
              device_code:      pairingCode.device_code,
              user_code:        pairingCode.user_code,
              verification_uri: pairingCode.verification_uri,
              expires_in:       3600,
              interval:         5
            });
          });
        });
    });
  });
};
