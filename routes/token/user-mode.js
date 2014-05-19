"use strict";

var db       = require('../../models');
var generate = require('../../lib/generate');
var sendAccessToken = require('./send-token');

var async    = require('async');


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

var validateUserModeJson = require('../../lib/validate-json')(userModeSchema);

module.exports = function(req, res, next) {
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
