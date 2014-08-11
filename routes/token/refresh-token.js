"use strict";

var db        = require('../../models');
var generate  = require('../../lib/generate');
var validator = require('../../lib/validate-json');

var async = require('async');

var schema = {
  id: "/token/refresh",
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

var createError = function(status, error, description) {
  var err = new Error(description);
  err.error = error;
  err.statusCode = status;

  return err;
};

var refreshAccessToken = function(req, field, done) {
  var error = validator.validate(req.body, schema);

  if (error) {
    done(createError(400, 'invalid_request', error));
    return;
  }

  var clientId     = req.body.client_id;
  var clientSecret = req.body.client_secret;
  var refreshToken = req.body.refresh_token;

  db.AccessToken.find({
    include: [
      {
        model: db.Client,
        where: {
          id:                clientId,
          secret:            clientSecret,
          registration_type: 'static'
        },
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
      done(err);
      return;
    }

    if (accessToken) {
      accessToken.updateAttributes({
        token:         generate.accessToken(),
        refresh_token: generate.refreshToken()
      })
      .complete(function(err) {
        if (err) {
          done(err);
          return;
        }

        done(
          null,
          accessToken,
          accessToken.domain,
          accessToken.user
        );
      });
    }
    else {
      done(createError(401, "unauthorized", "Invalid refresh token: " + refreshToken));
      return;
    }
  });
};

module.exports = refreshAccessToken;
