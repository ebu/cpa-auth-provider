"use strict";

var db       = require('../models');
var generate = require('../lib/generate');

var sendAccessToken = function(res, token, scope, user) {
  var name = (user !== null) ? user.display_name : "This radio";

  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-cache');
  res.send({
    token:             token,
    token_type:        'bearer',
    scope:             scope.name,
    description:       name + " at " + scope.display_name,
    short_description: scope.display_name
  });
};

var requestClientModeAccessToken = function(res, clientId, clientSecret, scopeName) {
  db.Client.find({ where: { id: clientId, secret: clientSecret } })
    .complete(function(err, client) {
      if (err) {
        res.send(500);
        return;
      }

      if (!client) {
        res.sendInvalidClient("Unknown client: " + clientId);
        return;
      }

      db.Scope.find({ where: { name: scopeName }})
        .complete(function(err, scope) {
          if (err) {
            res.send(500);
            return;
          }

          if (!scope) {
            // SPEC : define correct error message
            res.sendInvalidClient("Unknown scope: " + scopeName);
            return;
          }

          // TODO: Handle duplicated tokens
          db.AccessToken
            .create({
              token:     generate.accessToken(),
              user_id:   null,
              client_id: clientId,
              scope_id:  scope.id
            })
            .complete(function(err, accessToken) {
              if (err) {
                res.send(500);
                return;
              }

              sendAccessToken(res, accessToken.token, scope, null);
            });
        });
    });
};

var requestUserModeAccessToken = function(res, clientId, clientSecret, deviceCode, scope) {
  db.Client.find({ where: { id: clientId, secret: clientSecret } })
    .complete(function(err, client) {
      if (err) {
        res.send(500);
        return;
      }

      if (!client) {
        res.sendInvalidClient("Unknown client: " + clientId);
        return;
      }

      db.PairingCode
        .find({
          where:   { client_id: client.id, device_code: deviceCode },
          include: [ db.Scope, db.User ]
        })
        .complete(function(err, pairingCode) {
          if (err) {
            res.send(500);
          }

          if (!pairingCode) {
            res.sendInvalidClient("Pairing code not found");
            return;
          }

          if (!pairingCode.scope || pairingCode.scope.name !== scope) {
            res.sendInvalidClient("Pairing code scope mismatch");
            return;
          }

          if (pairingCode.hasExpired()) {
            res.sendErrorResponse(400, "user_code_expired", "Pairing code expired");
            return;
          }

          if (!pairingCode.verified) {
            res.send(202);
            return;
          }

          db.sequelize.transaction(function(transaction) {
            var accessToken = {
              token:     generate.accessToken(),
              user_id:   pairingCode.user_id,
              client_id: pairingCode.client_id,
              scope_id:  pairingCode.scope_id
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
                  accessToken.token,
                  pairingCode.scope,
                  pairingCode.user
                );
              },
              function(error) {
                transaction.rollback().complete(function(err) {
                  res.send(500);
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
    scope: {
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

  app.post('/token', validateJson, function(req, res) {
    var grantType    = req.body.grant_type;
    var clientId     = req.body.client_id;
    var clientSecret = req.body.client_secret;
    var deviceCode   = req.body.device_code;
    var scope        = req.body.scope;

    if (grantType !== 'authorization_code') {
      res.sendErrorResponse(400, 'unsupported_grant_type', "Unsupported grant type: " + grantType);
      return;
    }

    if (deviceCode) {
      // User mode
      requestUserModeAccessToken(res, clientId, clientSecret, deviceCode, scope);
    }
    else {
      // Client mode
      requestClientModeAccessToken(res, clientId, clientSecret, scope);
    }
  });
};

module.exports = routes;
