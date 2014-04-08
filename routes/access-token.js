"use strict";

var db            = require('../models');
var generate      = require('../lib/generate');
var requestHelper = require('../lib/request-helper');

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

          // TODO: must validate clientId and clientSecret before creating access
          // token

          var accessToken = {
            token:     generate.accessToken(),
            user_id:   null,
            client_id: clientId,
            scope_id:  scope.id
          };

          // TODO: Handle duplicated tokens
          db.ServiceAccessToken.create(accessToken)
            .complete(function(err, dbAccessToken) {
              if (err) {
                res.send(500);
                return;
              }

              sendAccessToken(res, dbAccessToken.token, scope, null);
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

            db.ServiceAccessToken
              .create(accessToken)
              .then(function() {
                return pairingCode.destroy();
              })
              .then(function() {
                return transaction.commit();
              })
              .then(function() {
                sendAccessToken(res, accessToken.token, pairingCode.scope, pairingCode.user);
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

var routes = function(app) {
  var logger = app.get('logger');

  /*
   * Access token endpoint
   */

  app.post('/token', function(req, res) {
    if (!requestHelper.isContentType(req, 'application/json')) {
      res.sendInvalidRequest("Invalid content type: " + req.get('Content-Type'));
      return;
    }

    var grantType    = req.body.grant_type;
    var clientId     = req.body.client_id;
    var clientSecret = req.body.client_secret;
    var deviceCode   = req.body.device_code;
    var scope        = req.body.scope;

    if (!grantType) {
      res.sendInvalidRequest("Missing grant_type");
      return;
    }

    if (grantType !== 'authorization_code') {
      logger.debug("Unsupported grant_type");
      res.send(400, { error: 'unsupported_grant_type' });
      return;
    }

    // TODO: validate clientId
    if (!clientId) {
      res.sendInvalidRequest("Missing client_id");
      return;
    }

    if (!clientSecret) {
      res.sendInvalidRequest("Missing client_secret");
      return;
    }

    if (!scope) {
      res.sendInvalidRequest("Missing scope");
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
