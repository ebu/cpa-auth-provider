"use strict";

var db       = require('../models');
var generate = require('../lib/generate');

var sendAccessToken = function(res, token, scope, user) {
  var name = (user !== null) ? user.display_name : "This radio";

  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-cache');

  /**
   * Should reply:
   * user_name
   * token
   * token_type
   * scope
   * domain
   * domain_display_name
   */

  res.send({
    token:             token,
    token_type:        'bearer',
    scope:             scope.name,
    description:       name + " at " + scope.display_name,
    short_description: scope.display_name
  });
};

var clientModeSchema = {
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
    scope: {
      type:     "string",
      required: true
    }
  }
};

var validateClientModeJson = require('../lib/validate-json')(clientModeSchema);

var validateClientMode = function(req, res, next) {
  validateClientModeJson(req, res, function(err) {
    if (err) {
      next(err);
      return;
    }

    var clientId = req.body.client_id;
    var clientSecret = req.body.client_secret;
    var scopeName = req.body.scope;

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

        db.Scope.find({ where: { name: scopeName }})
          .complete(function(err, scope) {
            if (err) {
              next(err);
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
                  next(err);
                  return;
                }

                sendAccessToken(res, accessToken.token, scope, null);
              });
          });
      });
  });
};

var userModeSchema = {
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

var validateUserModeJson = require('../lib/validate-json')(userModeSchema);

var requestUserModeAccessToken = function(req, res, next) {
  validateUserModeJson(req, res, function(err) {
    if (err) {
      next(err);
      return;
    }

    var clientId = req.body.client_id;
    var clientSecret = req.body.client_secret;
    var deviceCode = req.body.device_code;
    var scope = req.body.scope;

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
            include: [ db.Scope, db.User ]
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

            if (!pairingCode.scope || pairingCode.scope.name !== scope) {
              res.sendInvalidClient("Pairing code scope mismatch");
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
                    next(err);
                  });
                });
            });
          });
      });

  });
};



var webServerFlowSchema = {
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
      type:     "integer",
      required: true
    },
    code: {
      type:     "string",
      required: true
    },
    redirect_uri: {
      type:     "string",
      required: true
    },
    scope: {
      type:     "string",
      required: false
    }
  }
};

var validateWebServerFlow = require('../lib/validate-json')(webServerFlowSchema);

var requestServerFlowAccessToken = function(req, res, next) {
  validateWebServerFlow(req, res, function(err) {
    if (err) {
      next(err);
      return;
    }

    var clientId = req.body.client_id;
    var code = req.body.code;
    var redirectUri = req.body.redirect_uri;
    var scopeName = req.body.scope;

    db.AuthorizationCode
      .find({
        where:   { authorization_code: code },
        include: [ db.Client, db.Scope, db.User ]
      })
      .complete(function(err, authorizationCode) {
        if (err) {
          next(err);
          return;
        }

        if (!authorizationCode) {
          res.sendInvalidRequest("Authorization code not found");
          return;
        }

        if (authorizationCode.client_id !== clientId ||
          authorizationCode.redirect_uri !== redirectUri) {
          res.sendInvalidClient(
            'Unauthorized redirect uri');
          return;
        }

//      if (!authorizationCode.scope || authorizationCode.scope.name !== scopeName) {
//        res.sendInvalidClient("Pairing code scope mismatch");
//        return;
//      }

        if (authorizationCode.hasExpired()) {
          res.sendErrorResponse(400, "expired", "Authorization code expired");
          return;
        }

        db.sequelize.transaction(function(transaction) {
          var accessToken = {
            token:     generate.accessToken(),
            user_id:   authorizationCode.user_id,
            client_id: authorizationCode.client_id
          };

          db.AccessToken
            .create(accessToken)
            .then(function() {
              return authorizationCode.destroy();
            })
            .then(function() {
              return transaction.commit();
            })
            .then(function() {
              sendAccessToken(
                res,
                accessToken.token,
                { 'name': 'default', 'display_name': 'default scope' }, //TODO
                authorizationCode.user
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


var routes = function(app) {
  var logger = app.get('logger');

  /**
   * Access token endpoint
   */

  app.post('/token', function(req, res, next) {
    var grantType    = req.body.grant_type;

    if (!req.body.hasOwnProperty('grant_type')) {
      res.sendErrorResponse(400, 'invalid_request', 'Missing grant type');
    }
    else if (grantType === 'http://tech.ebu.ch/cpa/1.0/client_credentials') {
      validateClientMode(req, res, next);
    }
    else if (grantType === 'http://tech.ebu.ch/cpa/1.0/device_code') {
      requestUserModeAccessToken(req, res, next);
    }
    else if (grantType === 'http://tech.ebu.ch/cpa/1.0/authorization_code') {
      requestServerFlowAccessToken(req, res, next);
    }
    else {
      res.sendErrorResponse(400, 'unsupported_grant_type', "Unsupported grant type: " + grantType);
    }
  });
};

module.exports = routes;
