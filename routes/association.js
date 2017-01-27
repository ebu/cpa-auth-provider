"use strict";

var config   = require('../config');
var cors     = require('../lib/cors');
var db       = require('../models');
var generate = require('../lib/generate');
var logger   = require('../lib/logger');

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

module.exports = function(router) {

  /**
   * Client association endpoint
   *
   * @see ETSI TS 103 407, section 8.3
   */

  var handler = function(req, res, next) {
    var clientId     = req.body.client_id;
    var clientSecret = req.body.client_secret;
    var domainName   = req.body.domain;

    db.Client.findOne({
      where: { id: clientId, secret: clientSecret },
      include: [ db.User ]
    })
    .then(function(client) {
      if (!client) {
        res.sendInvalidClient("Client " + clientId + " not found");
        return;
      }

      db.Domain.findOne({ where: { name: domainName }})
        .then(function(domain) {
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

          if (client.User) {
            pairingCode.user_id = client.User.id;

            if (config.auto_provision_tokens) {
              pairingCode.state = 'verified';
            }
          }

          db.PairingCode.create(pairingCode)
            .then(function(pairingCode) {
              res.set('Cache-Control', 'no-store');
              res.set('Pragma', 'no-cache');

              if (client.User) {
                if (config.auto_provision_tokens) {
                  // Automatically grant access
                  res.status(200).send({
                    device_code:      pairingCode.device_code,
                    expires_in:       Math.floor(pairingCode.getTimeToLive())
                  });
                }
                else {
                  // Ask user's permission to grant access
                  res.status(200).send({
                    device_code:      pairingCode.device_code,
                    verification_uri: pairingCode.verification_uri,
                    interval:         config.max_poll_interval,
                    expires_in:       Math.floor(pairingCode.getTimeToLive())
                  });
                }
              }
              else {
                // Must pair with user account
                res.status(200).send({
                  device_code:      pairingCode.device_code,
                  user_code:        pairingCode.user_code,
                  verification_uri: pairingCode.verification_uri,
                  interval:         config.max_poll_interval,
                  expires_in:       Math.floor(pairingCode.getTimeToLive())
                });
              }
            }, function(err) {
              next(err);
            });
        }, function(err) {
          next(err);
		});
    }, function(err) {
      next(err);
	});
  };

  if (config.cors && config.cors.enabled) {
    // Enable pre-flight CORS request for POST /token
    router.options('/associate', cors);
    router.post('/associate', cors, validateJson, handler);
  }
  else {
    router.post('/associate', validateJson, handler);
  }
};
