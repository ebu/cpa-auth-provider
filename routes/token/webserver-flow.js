"use strict";

var db        = require('../../models');
var generate  = require('../../lib/generate');
var validator = require('../../lib/validate-json');

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

var createError = function(status, error, description) {
  var err = new Error(description);
  err.error = error;
  err.statusCode = status;

  return err;
};

module.exports = function(req, field, done) {
  var error = validator.validate(req.body, webServerFlowSchema);

  if (error) {
    done(createError(400, 'invalid_request', error));
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
          done(err);
          return;
        }

        if (!authorizationCode) {
          callback(createError(400, "invalid_request", "Authorization code not found"));
          return;
        }

        if (authorizationCode.client_id !== clientId ||
          authorizationCode.redirect_uri !== redirectUri) {
          callback(createError(400, "invalid_client", 'Unauthorized redirect uri'));
          return;
        }

        if (!authorizationCode.domain || authorizationCode.domain.name !== domainName) {
          callback(createError(400, "invalid_client", "Pairing code domain mismatch"));
          return;
        }

        if (authorizationCode.hasExpired()) {
          callback(createError(400, "expired", "Authorization code expired"));
          return;
        }

        callback(null, authorizationCode);
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
      done(err);
      return;
    }

    done(
      null,
      accessToken,
      authorizationCode.domain,
      authorizationCode.user
    );
  });
};
