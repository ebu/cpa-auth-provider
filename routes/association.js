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
    domain: {
      type:     "string",
      required: true
    }
  }
};

var validateJson = require('../lib/validate-json').middleware(schema);

module.exports = function(app) {
  var logger = app.get('logger');

  var handleAssociate = function(req, res, next) {
    var clientId     = req.body.client_id;
    var clientSecret = req.body.client_secret;
    var domainName   = req.body.domain;

    db.Client.find({
      where: { id: clientId, secret: clientSecret },
      include: [ db.User ]
    })
    .complete(function(err, client) {
      if (err) {
        next(err);
        return;
      }

      if (!client) {
        res.sendInvalidClient("Client " + clientId + " not found");
        return;
      }

      db.Domain.find({ where: { name: domainName }})
        .complete(function(err, domain) {
          if (err) {
            next(err);
            return;
          }

          if (!domain) {
            res.sendInvalidRequest("Domain " + domainName + " not found");
            return;
          }

          var pairingCode = {
            client_id:           clientId,
            domain_id:           domain.id,
            device_code:         generate.deviceCode(),
            user_code:           generate.userCode(),
            verification_uri:    config.verification_uri
          };

          if (client.user) {
            pairingCode.user_id = client.user.id;
          }

          db.PairingCode.create(pairingCode)
            .complete(function(err, pairingCode) {
              if (err) {
                next(err);
                return;
              }

              res.set('Cache-Control', 'no-store');
              res.set('Pragma', 'no-cache');

              if (client.user) {
                if (config.auto_provision_tokens) {
                  // Automatically grant access
                  res.send(200, {
                    device_code:      pairingCode.device_code,
                    expires_in:       Math.floor(pairingCode.getTimeToLive())
                  });
                }
                else {
                  // Ask user's permission to grant access
                  res.send(200, {
                    device_code:      pairingCode.device_code,
                    verification_uri: pairingCode.verification_uri,
                    interval:         config.max_poll_interval,
                    expires_in:       Math.floor(pairingCode.getTimeToLive())
                  });
                }
              }
              else {
                // Must pair with user account
                res.send(200, {
                  device_code:      pairingCode.device_code,
                  user_code:        pairingCode.user_code,
                  verification_uri: pairingCode.verification_uri,
                  interval:         config.max_poll_interval,
                  expires_in:       Math.floor(pairingCode.getTimeToLive())
                });
              }
          });
        });
    });
  };

  /**
   * Client association endpoint
   */

  app.post('/associate', validateJson, function(req, res, next) {
    handleAssociate(req, res, next);
  });
};
