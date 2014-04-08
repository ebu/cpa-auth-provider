"use strict";

var config   = require('../config');
var db       = require('../models');
var generate = require('../lib/generate');

var requestHelper = require('../lib/request-helper');

var jsonSchema = require('jsonschema');

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

module.exports = function(app) {
  var logger = app.get('logger');

  // Client Registration Endpoint

  app.post('/associate', function(req, res) {
    if (!requestHelper.isContentType(req, 'application/json')) {
      res.sendInvalidRequest("Invalid content type: " + req.get('Content-Type'));
      return;
    }

    var result = jsonSchema.validate(req.body, schema);

    if (result.errors.length > 0) {
      res.sendInvalidRequest(result.toString());
      return;
    }

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
            verification_uri:    config.uris.verification_uri
          };

          db.PairingCode.create(pairingCode).then(function() {
            res.set('Cache-Control', 'no-store');
            res.set('Pragma', 'no-cache');

            res.send(200, {
              device_code:      pairingCode.device_code,
              user_code:        pairingCode.user_code,
              verification_uri: pairingCode.verification_uri,
              expires_in:       3600, // TODO: implement expiry
              interval:         5
            });
          });
        });
    });
  });
};
