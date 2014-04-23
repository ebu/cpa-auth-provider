"use strict";

var db              = require('../../models');
var generate        = require('../../lib/generate');
var sendAccessToken = require('./send-token');

var async = require('async');

var schema = {
  id: "/token/refresh/device",
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

var validateJson = require('../../lib/validate-json').middleware(schema);

var refreshAccessToken = function(req, res, next) {
  validateJson(req, res, function(err) {
    if (err) {
      next(err);
      return;
    }

    var clientId     = req.body.client_id;
    var clientSecret = req.body.client_secret;
    var domainName   = req.body.domain;

    db.AccessToken.find({
      include: [
        {
          model: db.Client,
          where: {
            id:                clientId,
            secret:            clientSecret,
            registration_type: 'dynamic'
          }
        },
        {
          model: db.User
        },
        {
          model: db.Domain,
          where: {
            name: domainName
          }
        }
      ]
    })
    .complete(function(err, accessToken) {
      if (err) {
        next(err);
        return;
      }

      if (accessToken) {
        accessToken.updateAttributes({ token: generate.accessToken() })
          .complete(function(err) {
            if (err) {
              res.next(err);
              return;
            }

            sendAccessToken(
              res,
              accessToken,
              accessToken.domain,
              accessToken.user
            );
          });
      }
      else {
        res.sendUnauthorized("No existing access token for this client at domain: " + domainName);
        return;
      }
    });
  });
};

module.exports = refreshAccessToken;
