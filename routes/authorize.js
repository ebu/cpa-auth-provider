"use strict";

var db = require('../models');
var authHelper    = require('../lib/auth-helper');

var schemaGet = {
  id: "/authorize",
  type: "object",
  required: true,
  additionalProperties: false,
  properties: {
    response_type: {
      type: "string",
      required: true
    },
    client_id: {
      type: "string",
      required: true
    },
    redirect_uri: {
      type: "string",
      required: true
    },
    scope: {
      type:     "string",
      required: false
    },
    state: {
      type:     "string",
      required: false
    }
  }
};

var schemaPost = {
  id: "/authorize",
  type: "object",
  required: true,
  additionalProperties: false,
  properties: {
    client_id: {
      type: "string",
      required: true
    },
    redirect_uri: {
      type: "string",
      required: true
    },
    scope: {
      type:     "string",
      required: false
    },
    state: {
      type:     "string",
      required: false
    },
    authorization: {
      type:     "string",
      required: true
    }
  }
};

var validateUri = require('../lib/validate-json')(schemaGet, 'query');
var validatePostBody = require('../lib/validate-form')(schemaPost);

module.exports = function(app, options) {

  /**
   * Access token authorization endpoint
   */

  app.get('/authorize',
    validateUri,
    authHelper.authenticateFirst,
    function(req, res, next) {

    var responseType = req.query.response_type;
    var clientId     = req.query.client_id;
    var redirectUri  = req.query.redirect_uri;
    var scope        = req.query.scope;
    var state        = req.query.state;

    if (responseType !== 'code') {
      res.sendInvalidRequest("Wrong response type: 'code' required.");
    }

    // Verify redirect uri corresponds to client id

    db.Client
      .find({ where: { id: clientId } })
      .complete(function(err, client) {
        if(err || !client) {
          return res.redirectError(redirectUri,
            'unauthorized_client',
            'The client is not authorized to request an ' +
            'authorization code using this method.',
            state);
        }

        res.render('authorize.ejs', {
          client_name: client.name,
          client_id: clientId,
          redirect_uri: redirectUri,
          scope: scope,
          state: state,
          error: null
        });
      });
  });

  app.post('/authorize', validatePostBody, function(req, res, next) {
    var responseType  = req.body.response_type;
    var clientId      = req.body.client_id;
    var redirectUri   = req.body.redirect_uri;
    var scope         = req.body.scope;
    var state         = req.body.state;
    var authorization = req.body.authorization;

    if (authorization === 'Deny') {
      return res.redirectError(redirectUri,
        'access_denied',
        'The resource owner or authorization server denied the request.',
        state);
    }

    // Generate Authorization code

  });
};
