"use strict";

var db       = require('../models');
var generate = require('../lib/generate');

/**
 * @param res HTTP response object.
 * @param {Token} token
 * @param {Domain} domain
 * @param {User?} user
 */

var sendAccessToken = function(res, token, domain, user) {
  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-cache');

  var response = {
    access_token:        token.token,
    token_type:          'bearer',
    domain:              domain.name,
    domain_display_name: domain.display_name
  };

  if (user) {
    response.user_name = user.display_name;
  }

  res.send(response);
};

var requestClientModeAccessToken = function(res, next, clientId, clientSecret, domainName) {
  db.Client.find({ where: { id: clientId, secret: clientSecret } })
    .complete(function(err, client) {
      if (err) {
        next(err);
        return;
      }

      if (!client) {
        res.sendInvalidClient("Unknown client: " + clientId);
        return;
      }

      db.Domain.find({ where: { name: domainName }})
        .complete(function(err, domain) {
          if (err) {
            next(err);
            return;
          }

          if (!domain) {
            // SPEC : define correct error message
            res.sendInvalidClient("Unknown domain: " + domainName);
            return;
          }

          // TODO: Handle duplicated tokens
          db.AccessToken
            .create({
              token:     generate.accessToken(),
              user_id:   null,
              client_id: clientId,
              domain_id: domain.id
            })
            .complete(function(err, accessToken) {
              if (err) {
                next(err);
                return;
              }

              sendAccessToken(res, accessToken, domain, null);
            });
        });
    });
};

var requestUserModeAccessToken = function(res, next, clientId, clientSecret, deviceCode, domain) {
  db.Client.find({ where: { id: clientId, secret: clientSecret } })
    .complete(function(err, client) {
      if (err) {
        next(err);
        return;
      }

      if (!client) {
        res.sendInvalidClient("Unknown client: " + clientId);
        return;
      }

      db.PairingCode
        .find({
          where:   { client_id: client.id, device_code: deviceCode },
          include: [ db.Domain, db.User ]
        })
        .complete(function(err, pairingCode) {
          if (err) {
            next(err);
            return;
          }

          if (!pairingCode) {
            res.sendInvalidClient("Pairing code not found");
            return;
          }

          if (!pairingCode.domain || pairingCode.domain.name !== domain) {
            res.sendInvalidClient("Pairing code domain mismatch");
            return;
          }

          if (pairingCode.hasExpired()) {
            res.sendErrorResponse(400, "expired", "Pairing code expired");
            return;
          }

          if (!pairingCode.verified) {
            res.send(202, { "reason": "authorization_pending" });
            return;
          }

          db.sequelize.transaction(function(transaction) {
            var accessToken = {
              token:     generate.accessToken(),
              user_id:   pairingCode.user_id,
              client_id: pairingCode.client_id,
              domain_id: pairingCode.domain_id
            };

            db.AccessToken
              .create(accessToken)
              .then(function() {
                return pairingCode.destroy();
              })
              .then(function() {
                return transaction.commit();
              })
              .then(function() {
                sendAccessToken(
                  res,
                  accessToken,
                  pairingCode.domain,
                  pairingCode.user
                );
              },
              function(error) {
                transaction.rollback().complete(function(err) {
                  next(err);
                });
              });
          });
        });
    });
};

var schema = {
  id: "/token",
  type: "object",
  required: true,
  additionalProperties: false,
  properties: {
    grant_type: {
      type:     "string",
      required: true
    },
    client_id: {
      type:     "string",
      required: true
    },
    client_secret: {
      type:     "string",
      required: true
    },
    device_code: {
      type:     "string",
      required: false
    },
    domain: {
      type:     "string",
      required: true
    }
  }
};

var validateJson = require('../lib/validate-json')(schema);

var routes = function(app) {
  var logger = app.get('logger');

  /**
   * Access token endpoint
   */

  app.post('/token', validateJson, function(req, res, next) {
    var grantType    = req.body.grant_type;
    var clientId     = req.body.client_id;
    var clientSecret = req.body.client_secret;
    var deviceCode   = req.body.device_code;
    var domain       = req.body.domain;

    if (grantType !== 'authorization_code') {
      res.sendErrorResponse(400, 'unsupported_grant_type', "Unsupported grant type: " + grantType);
      return;
    }

    if (deviceCode) {
      // User mode
      requestUserModeAccessToken(res, next, clientId, clientSecret, deviceCode, domain);
    }
    else {
      // Client mode
      requestClientModeAccessToken(res, next, clientId, clientSecret, domain);
    }
  });
};

module.exports = routes;
