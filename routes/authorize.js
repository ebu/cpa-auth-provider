"use strict";

var async = require('async');
var url = require('url');

var db = require('../models');
var authHelper = require('../lib/auth-helper');
var generate = require('../lib/generate');

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

var validateUri = require('../lib/validate-json')(schemaGet, 'query', true);
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
          res.redirectError(redirectUri,
            'invalid_request',
            'The request is missing a required parameter, includes an invalid parameter' +
            'value, includes a parameter more than once, or is otherwise malformed.',
            state);
          return;
        }
        if (client.registration_type === 'dynamic') {
          res.redirectError(redirectUri,
            'unauthorized_client',
            'The client is not authorized to request an authorization code using this' +
            'method',
            state);
          return;
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
    var userId        = req.user.id;
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
//
//    var findScope = function(callback) {
//      db.Scope.find({ where: { name: scopeName }})
//        .complete(callback);
//    };

    var createAssociationCode = function(callback) {
      var authorizationCode = {
        client_id: clientId,
//        scope_id:            scope.id,
        redirect_uri: redirectUri,
        user_id: userId,
        authorization_code: generate.authorizationCode()
      };

      db.AuthorizationCode.create(authorizationCode)
        .complete(callback);
    };

    var finalCallback = function (err, result) {
      if (err) {
        next(err);
        return;
      }

      var urlObj = url.parse(redirectUri);
      if (!urlObj.query) {
        urlObj.query = {};
      }
      urlObj.query['code'] = result.authorization_code;
      urlObj.query['state'] = state;

      res.redirect(url.format(urlObj));
    };

    async.waterfall([
//      findScope,
        createAssociationCode
      ],
      finalCallback
    );

  });
};
