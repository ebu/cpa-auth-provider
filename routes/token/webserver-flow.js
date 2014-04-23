"use strict";

var db              = require('../../models');
var generate        = require('../../lib/generate');
var sendAccessToken = require('./send-token');

var async = require('async');

var webServerFlowSchema = {
  id: "/token/authorization_code",
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
    domain: {
      type:     "string",
      required: true
    },
    scope: {
      type:     "string",
      required: false
    }
  }
};

var validateWebServerFlow = require('../../lib/validate-json').middleware(webServerFlowSchema);

module.exports = function(req, res, next) {
  validateWebServerFlow(req, res, function(err) {
    if (err) {
      next(err);
      return;
    }

    var clientId    = req.body.client_id;
    var code        = req.body.code;
    var redirectUri = req.body.redirect_uri;
    var domainName  = req.body.domain;
    var scope       = req.body.scope;

    var findAuthorizationCode = function(callback) {

      db.AuthorizationCode
        .find({
          where:   { authorization_code: code },
          include: [ db.Client, db.Domain, db.User ]
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

          if (!authorizationCode.domain || authorizationCode.domain.name !== domainName) {
            res.sendInvalidClient("Pairing code domain mismatch");
            return;
          }

          if (authorizationCode.hasExpired()) {
            res.sendErrorResponse(400, "expired", "Authorization code expired");
            return;
          }

          callback(err, authorizationCode);
        });
    };

    var createAccessToken = function(authorizationCode, callback) {
      db.sequelize.transaction(function(transaction) {
        var accessToken;

        db.AccessToken
          .create({
            token:         generate.accessToken(),
            user_id:       authorizationCode.user_id,
            client_id:     authorizationCode.client_id,
            refresh_token: generate.refreshToken()
          })
          .then(function(token) {
            accessToken = token;
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
    ], function(err, accessToken, authorizationCode) {
      if (err) {
        next(err);
        return;
      }

      sendAccessToken(
        res,
        accessToken,
        authorizationCode.domain,
        authorizationCode.user
      );
    });
  });
};
