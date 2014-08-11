"use strict";

var db        = require('../../models');
var generate  = require('../../lib/generate');
var validator = require('../../lib/validate-json');

var async = require('async');

var postClientModeSchema = {
  id: "/token/client_credentials/post",
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

var getClientModeSchema = {
  id: "/token/client_credentials/get",
  type: "object",
  required: true,
  additionalProperties: false,
  properties: {
    grant_type: {
      type:     "string",
      required: true
    },
    // client_id: {
    //   type:     "string",
    //   required: true
    // },
    // client_secret: {
    //   type:     "string",
    //   required: true
    // },
    domain: {
      type:     "string",
      required: true
    },
    callback: {
      type:     "string",
      required: true
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
  var schema = field === 'query' ? getClientModeSchema : postClientModeSchema;

  var error = validator.validate(req[field], schema);

  if (error) {
    done(createError(400, 'invalid_request', error));
    return;
  }

  var clientId, clientSecret;

  if (field === 'query') {
    if (req.cookies && req.cookies.cpa) {
      clientId     = req.cookies.cpa.client_id;
      clientSecret = req.cookies.cpa.client_secret;
    }
  }
  else {
    clientId     = req[field].client_id;
    clientSecret = req[field].client_secret;
  }

  var domainName = req[field].domain;

  var findClient = function(callback) {
    db.Client.find({
      where: { id: clientId, secret: clientSecret, registration_type: 'dynamic' },
      include: [ db.User ]
    })
    .complete(function(err, client) {
      if (!err && !client) {
        err = createError(400, "invalid_client", "Unknown client: " + clientId);
      }

      callback(err, client);
    });
  };

  var findDomain = function(client, callback) {
    db.Domain.find({ where: { name: domainName }})
      .complete(function(err, domain) {
        if (!err && !domain) {
          // SPEC : define correct error message
          err = createError(400, "invalid_request", "Unknown domain: " + domainName);
        }

        callback(err, client, domain);
      });
  };

  /**
   * Delete any existing access token for the given client at the
   * given domain.
   */

  var deleteAccessToken = function(client, domain, callback) {
    db.sequelize.query(
      "DELETE FROM AccessTokens WHERE client_id=? AND domain_id=?",
      null, { raw: true }, [ client.id, domain.id ]
    )
    .then(function(err) {
      callback(err, client, domain);
    },
    function(err) {
      callback(err);
    });
  };

  var createAccessToken = function(client, domain, callback) {
    // TODO: Handle duplicated tokens
    db.AccessToken
      .create({
        token:     generate.accessToken(),
        user_id:   client.user_id,
        client_id: client.id,
        domain_id: domain.id
      })
      .complete(function(err, accessToken) {
        callback(err, client, domain, accessToken);
      });
  };

  async.waterfall([
    findClient,
    findDomain,
    deleteAccessToken,
    createAccessToken
  ], function(err, client, domain, accessToken) {
    done(err, accessToken, domain, client ? client.user : null);
  });
};
