"use strict";

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

    var clientId = req.body.client_id;
    var clientSecret = req.body.client_secret;
    var deviceCode = req.body.device_code;
    var domainName = req.body.domain;

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
          include: [ db.Domain, db.User ]
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

          if (!pairingCode.domain || pairingCode.domain.name !== domainName) {
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

          callback(null, pairingCode);
        });
    };

    var createAccessToken = function(pairingCode, callback) {
      var accessToken;

      db.sequelize.transaction(function(transaction) {
        db.AccessToken
          .create({
            token:      generate.accessToken(),
            user_id:    pairingCode.user_id,
            client_id:  pairingCode.client_id,
            domain_id:  pairingCode.domain_id
          })
          .then(function(token) {
            accessToken = token;
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
        accessToken,
        pairingCode.domain,
        pairingCode.user
      );
    });
  });
};
