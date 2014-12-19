"use strict";

var config          = require('../../config');
var db              = require('../../models');
var generate        = require('../../lib/generate');
var sendAccessToken = require('./send-token');

var async = require('async');

var userModeSchema = {
  id: "/token/device_code",
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
      required: true
    },
    domain: {
      type:     "string",
      required: true
    }
  }
};

var validateUserModeJson = require('../../lib/validate-json').middleware(userModeSchema);

module.exports = function(req, res, next) {
  validateUserModeJson(req, res, function(err) {
    if (err) {
      next(err);
      return;
    }

    var clientId     = req.body.client_id;
    var clientSecret = req.body.client_secret;
    var deviceCode   = req.body.device_code;
    var domainName   = req.body.domain;

    var findClient = function(callback) {
      db.Client
        .find({
          where:   { id: clientId, secret: clientSecret },
          include: [ db.User ]
        })
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
          include: [ db.Domain, db.User, db.Client ]
        })
        .complete(function(err, pairingCode) {
          if (err) {
            callback(err);
            return;
          }

          if (!pairingCode) {
            res.sendInvalidRequest("Pairing code not found");
            return;
          }

          if (!pairingCode.domain || pairingCode.domain.name !== domainName) {
            res.sendInvalidRequest("Pairing code domain mismatch");
            return;
          }

          if (pairingCode.hasExpired()) {
            res.sendErrorResponse(400, "expired", "Pairing code expired");
            return;
          }

          if (pairingCode.state === "denied") {
            res.sendErrorResponse(400, "cancelled", "User denied access");
            return;
          }
          else {
            if (config.auto_provision_tokens) {
              if (pairingCode.user_id === null) {
                res.send(202, { "reason": "authorization_pending" });
                return;
              }
            }
            else {
              if (pairingCode.state === 'pending') {
                res.send(202, { "reason": "authorization_pending" });
                return;
              }
            }
          }

          callback(null, client, pairingCode.user, pairingCode);
        });
    };

    var createAccessToken = function(client, user, pairingCode, callback) {
      var accessToken;

      db.sequelize.transaction(function(transaction) {
        db.AccessToken
          .create({
            token:      generate.accessToken(),
            user_id:    user.id,
            client_id:  client.id,
            domain_id:  pairingCode.domain_id
          })
          .then(function(token) {
            accessToken = token;
          })
          .then(function(token) {
            return pairingCode.destroy();
          })
          .then(function() {
            return transaction.commit();
          })
          .then(function() {
            callback(null, user, accessToken, pairingCode);
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
    ], function(err, user, accessToken, pairingCode) {
      if (err) {
        next(err);
        return;
      }

      sendAccessToken(
        res,
        accessToken,
        pairingCode.domain,
        user
      );
    });
  });
};
