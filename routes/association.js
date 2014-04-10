"use strict";

var config   = require('../config');
var db       = require('../models');
var generate = require('../lib/generate');

var schema = {
  id: "/associate",
  type: "object",
  required: true,
  additionalProperties: false,
  properties: {
    client_id: {
      type:     "string",
      required: true
    },
    client_secret: {
      type:     "string",
      required: true
    },
    scope: {
      type:     "string",
      required: true
    }
  }
};

var validateJson = require('../lib/validate-json')(schema);

module.exports = function(app) {
  var logger = app.get('logger');

  /**
   * Client association endpoint
   */

  app.post('/associate', validateJson, function(req, res) {
    var clientId     = req.body.client_id;
    var clientSecret = req.body.client_secret;
    var scopeName    = req.body.scope;

    db.Client.find({
      where: { id: clientId, secret: clientSecret }
    })
    .complete(function(err, client) {
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
            verification_uri:    config.verification_uri
          };

          db.PairingCode.create(pairingCode)
            .complete(function(err, pairingCode) {
              if (err) {
                res.send(500);
                return;
              }

              res.set('Cache-Control', 'no-store');
              res.set('Pragma', 'no-cache');

              res.send(200, {
                device_code:      pairingCode.device_code,
                user_code:        pairingCode.user_code,
                verification_uri: pairingCode.verification_uri,
                expires_in:       Math.floor(pairingCode.getTimeToLive()),
                interval:         config.max_poll_interval
              });
          });
        });
    });
  });
};
