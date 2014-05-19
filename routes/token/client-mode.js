"use strict";

var db       = require('../../models');
var generate = require('../../lib/generate');
var sendAccessToken = require('./send-token');

var async    = require('async');

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

var validateClientModeJson = require('../../lib/validate-json')(clientModeSchema);

module.exports = function(req, res, next) {
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
