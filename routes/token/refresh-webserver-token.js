"use strict";

var db              = require('../../models');
var generate        = require('../../lib/generate');
var sendAccessToken = require('./send-token');

var async = require('async');

var schema = {
  id: "/token/refresh/webserver",
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
    refresh_token: {
      type:     "string",
      required: true
    },
    // domain: {
    //   type:     "string",
    //   required: true
    // }
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
    var refreshToken = req.body.refresh_token;

    db.AccessToken.find({
      include: [
        {
          model: db.Client,
          where: { id: clientId, secret: clientSecret }
        },
        {
          model: db.Domain,
          // where: { domain_name: domainName }
        },
        {
          model: db.User
        }
      ],
      where: {
        refresh_token: refreshToken
      }
    })
    .complete(function(err, accessToken) {
      if (err) {
        next(err);
        return;
      }

      if (accessToken) {
        accessToken.updateAttributes({
          token:         generate.accessToken(),
          refresh_token: generate.refreshToken()
        })
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
        res.sendUnauthorized("Invalid refresh token: " + refreshToken);
        return;
      }
    });
  });
};

module.exports = refreshAccessToken;
