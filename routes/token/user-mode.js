"use strict";

var config    = require('../../config');
var db        = require('../../models');
var generate  = require('../../lib/generate');
var validator = require('../../lib/validate-json-schema');

var async = require('async');

var userModeSchema = {
  id: "/token/device_code/post",
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
    },
    callback: {
      type:     "string",
      required: false
    }
  }
};

var createError = function(status, error, description) {
  var err = new Error(description);
  err.error = error;
  err.statusCode = status;

  return err;
};

module.exports = function(params, done) {
  var error = validator.validate(params, userModeSchema);

  if (error) {
    done(createError(400, 'invalid_request', error));
    return;
  }

  var clientId     = params.client_id;
  var clientSecret = params.client_secret;
  var deviceCode   = params.device_code;
  var domainName   = params.domain;

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
          callback(createError(400, "invalid_client", "Unknown client: " + clientId));
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
          callback(createError(400, "invalid_request", "Pairing code not found"));
          return;
        }

        if (!pairingCode.domain || pairingCode.domain.name !== domainName) {
          callback(createError(400, "invalid_request", "Pairing code domain mismatch"));
          return;
        }

        if (pairingCode.hasExpired()) {
          callback(createError(400, "expired", "Pairing code expired"));
          return;
        }

        if (pairingCode.state === "denied") {
          callback(createError(400, "cancelled", "User denied access"));
          return;
        }
        else {
          if (config.auto_provision_tokens) {
            if (pairingCode.user_id == null) {
              var error = new Error();
              error.statusCode = 202;
              error.reason = "authorization_pending";
              callback(error);
              return;
            }
          }
          else {
            if (pairingCode.state === 'pending') {
              var error = new Error();
              error.statusCode = 202;
              error.reason = "authorization_pending";
              callback(error);
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

          // Associate this client with the user
          client.user_id = user.id;
          return client.save();
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
    done(err, accessToken, pairingCode ? pairingCode.domain : null, user);
  });
};
