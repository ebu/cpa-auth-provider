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
      res.json(400, { error: 'invalid_request' });
      return;
    }

    var clientId     = req.body.client_id;
    var clientSecret = req.body.client_secret;
    var scopeName    = req.body.scope;

    // TODO: validate clientId
    if (!clientId) {
      res.json(400, { error: 'invalid_request' });
      return;
    }
    else if (!clientId.toString().match(/^\d+$/)) {
      res.json(400, { error: 'invalid_client' });
      return;
    }

    if (!clientSecret) {
      res.json(400, { error: 'invalid_request' });
      return;
    }

    if (!scopeName) {
      res.json(400, { error: 'invalid_request' });
      return;
    }

    db.Client.find({ where: { id: clientId, secret: clientSecret } }).success(function(client) {
      if (!client) {
        res.json(400, { error: 'invalid_client' });
        return;
      }

      db.Scope.find({ where: { name: scopeName }})
        .success(function(scope) {
          if (!scope) {
            res.json(400, { error: 'invalid_request' });
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

            res.json(200, {
              device_code:      pairingCode.device_code,
              user_code:        pairingCode.user_code,
              verification_uri: pairingCode.verification_uri,
              expires_in:       3600,
              interval:         5
            });
          },
          function(error) {
            res.send(500);
          });
        });
    },
    function(error) {
      res.send(500);
    });
  });
};
