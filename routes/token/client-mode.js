"use strict";

var db              = require('../../models');
var generate        = require('../../lib/generate');
var sendAccessToken = require('./send-token');

var async = require('async');

var clientModeSchema = {
  id: "/token/client_credentials",
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
    domain: {
      type:     "string",
      required: true
    }
  }
};

var validateClientModeJson = require('../../lib/validate-json').middleware(clientModeSchema);

module.exports = function(req, res, next) {
  validateClientModeJson(req, res, function(err) {
    if (err) {
      next(err);
      return;
    }

    var clientId = req.body.client_id;
    var clientSecret = req.body.client_secret;
    var domainName = req.body.domain;

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

    var findDomain = function(client, callback) {
      db.Domain.find({ where: { name: domainName }})
        .complete(function(err, domain) {
          if (!domain) {
            // SPEC : define correct error message
            res.sendInvalidClient("Unknown domain: " + domainName);
            return;
          }

          callback(err, client, domain);
        });
    };

    var createAccessToken = function(client, domain, callback) {
      // TODO: Handle duplicated tokens
      db.AccessToken
        .create({
          token: generate.accessToken(),
          user_id: null,
          client_id: client.id,
          domain_id: domain.id
        })
        .complete(function(err, accessToken) {
          callback(err, accessToken, domain);
        });
    };

    async.waterfall([
      findClient,
      findDomain,
      createAccessToken
    ], function(err, accessToken, domain) {
      if (err) {
        next(err);
        return;
      }

      sendAccessToken(res, accessToken, domain, null);
    });
  });
};
