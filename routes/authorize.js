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

var validateUri = require('../lib/validate-json').validate;
var validatePostBody = require('../lib/validate-form')(schemaPost);

module.exports = function(app, options) {

  /**
   * Access token authorization endpoint
   */

  app.get('/authorize',
    authHelper.authenticateFirst,
    function(req, res, next) {

    var responseType = req.query.response_type;
    var clientId     = req.query.client_id;
    var redirectUri  = req.query.redirect_uri;
    var domain       = req.query.domain;
    var state        = req.query.state;

    if (!req.query.hasOwnProperty('client_id')) {
      res.sendInvalidRequest('Missing client_id');
      return;
    }

    if (!req.query.hasOwnProperty('redirect_uri')) {
      res.sendInvalidRequest('Missing redirect_uri');
      return;
    }

    db.Client
      .find({ where: { id: clientId } })
      .complete(function(err, client) {
        if(err || !client) {
          res.sendInvalidClient('Unknown client');
          return;
        }
        if (client.registration_type === 'dynamic') {
          res.sendErrorResponse(400, 'unauthorized_client',
            'The client is not authorized to request ' +
            'an authorization code using this method');
          return;
        }
        if (client.redirect_uri !== redirectUri) {
          res.sendInvalidClient('Unauthorized redirect uri');
          return;
        }

        var validationError = validateUri(req.query, schemaGet);
        if (!validationError) {
          if (responseType !== 'code') {
            res.redirectError(client.redirect_uri, 'unsupported_response_type',
              "Wrong response type: 'code' required.");
            return;
          }

          res.render('authorize.ejs', {
            client_name: client.name,
            client_id: clientId,
            redirect_uri: redirectUri,
            domain: domain,
            state: state,
            error: null
          });
        }
        else {
          res.redirectError(client.redirect_uri, 'invalid_request', validationError);
        }
      });
  });

  app.post('/authorize', validatePostBody, function(req, res, next) {
    var responseType  = req.body.response_type;
    var clientId      = req.body.client_id;
    var userId        = req.user.id;
    var redirectUri   = req.body.redirect_uri;
    var domainName    = req.body.domain;
    var state         = req.body.state;
    var authorization = req.body.authorization;

    if (authorization === 'Deny') {
      return res.redirectError(redirectUri,
        'access_denied',
        'The resource owner or authorization server denied the request.',
        state);
    }

    var findDomain = function(callback) {
      db.Domain.find({ where: { name: domainName }})
        .complete(callback);
    };

    // Generate Authorization code
    var createAuthorizationCode = function(domain, callback) {
      var authorizationCode = {
        client_id:          clientId,
        domain_id:          domain.id,
        redirect_uri:       redirectUri,
        user_id:            userId,
        authorization_code: generate.authorizationCode()
      };

      db.AuthorizationCode.create(authorizationCode)
        .complete(callback);
    };

    async.waterfall([
      findDomain,
      createAuthorizationCode
    ],
    function (err, result) {
      if (err) {
        next(err);
        return;
      }

      var urlObj = url.parse(redirectUri);
      if (!urlObj.query) {
        urlObj.query = {};
      }
      urlObj.query.code = result.authorization_code;
      urlObj.query.state = state;

      res.redirect(url.format(urlObj));
    });

  });
};
