"use strict";

var db       = require('../models');
var generate = require('../lib/generate');

var async    = require('async');

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

    var findClient = function(callback) {
      db.Client.find({ where: { id: clientId, secret: clientSecret } })
        .complete(function(err, client) {
          if (!client) {
            res.sendInvalidClient("Unknown client: " + clientId);
            return;
          }
          callback(err, client);
        });
    };

    var findScope = function(client, callback) {
      db.Scope.find({ where: { name: scopeName }})
        .complete(function(err, scope) {
          if (!scope) {
            // SPEC : define correct error message
            //callback(new Error("Unknown scope: " + scope));
            res.sendInvalidClient("Unknown scope: " + scopeName);
            return;
          }

          callback(err, client, scope);
        });
    };

    var createAccessToken = function(client, scope, callback) {
      // TODO: Handle duplicated tokens
      db.AccessToken
        .create({
          token: generate.accessToken(),
          user_id: null,
          client_id: client.id,
          scope_id: scope.id
        })
        .complete(function(err, accessToken) {
          callback(err, accessToken, scope);
        });
    };

    async.waterfall([
      findClient,
      findScope,
      createAccessToken
    ], function(err, accessToken, scope) {
      if (err) {
        next(err);
        return;
      }
      sendAccessToken(res, accessToken.token, scope, null);
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

    var findClient = function(callback) {
      db.Client
        .find({ where: { id: clientId, secret: clientSecret } })
        .complete(function(err, client) {
          if (err) {
            callback(err);
            return;
          }

          if (!client) {
            res.sendInvalidClient("Unknown client: " + clientId);
            return;
          }
          callback(null, client);
      });
    };

    var findPairingCode = function(client, callback) {
      db.PairingCode
        .find({
          where:   { client_id: client.id, device_code: deviceCode },
          include: [ db.Scope, db.User ]
        })
        .complete(function(err, pairingCode) {
          if (err) {
            callback(err);
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

          callback(null, pairingCode);
        });
    };

    var createAccessToken = function(pairingCode, callback) {
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
            callback(null, accessToken, pairingCode);
          },
          function(error) {
            transaction.rollback().complete(function(err) {
              next(err);
            });
          });
      });
    };

    async.waterfall([
      findClient,
      findPairingCode,
      createAccessToken
    ], function(err, accessToken, pairingCode) {
      if (err) {
        next(err);
        return;
      }

      sendAccessToken(
        res,
        accessToken.token,
        pairingCode.scope,
        pairingCode.user
      );
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

    var findAuthorizationCode = function(callback) {

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

//        if (!authorizationCode.scope || authorizationCode.scope.name !== scopeName) {
//          res.sendInvalidClient("Pairing code scope mismatch");
//          return;
//        }

          if (authorizationCode.hasExpired()) {
            res.sendErrorResponse(400, "expired", "Authorization code expired");
            return;
          }

          callback(err, authorizationCode);
        });
    };

    var createAccessToken = function(authorizationCode, callback) {
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
            callback(null, accessToken, authorizationCode);
          },
          function(error) {
            transaction.rollback().complete(function(err) {
              callback(err);
            });
          });
      });
    };

    async.waterfall([
      findAuthorizationCode,
      createAccessToken
    ], function(err, accessToken, authorizationCode){
      if (err) {
        next(err);
        return;
      }

      sendAccessToken(
        res,
        accessToken.token,
        { 'name': 'default', 'display_name': 'default scope' }, //TODO
        authorizationCode.user
      );
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
