"use strict";

var db              = require('../models');
var generate        = require('../lib/generate');
var requestHelper   = require('../lib/request-helper');
var requireEncoding = require('../lib/require-encoding');
var validator       = require('../lib/validate-json-schema');

var clientMode      = require('./token/client-mode');
var userMode        = require('./token/user-mode');
var webServerFlow   = require('./token/webserver-flow');
var refreshToken    = require('./token/refresh-token');
var sendAccessToken = require('./token/send-token');

var async = require('async');
var _     = require('lodash');

var routes = function(app) {

  var CLIENT_MODE_GRANT_TYPE   = 'http://tech.ebu.ch/cpa/1.0/client_credentials';
  var USER_MODE_GRANT_TYPE     = 'http://tech.ebu.ch/cpa/1.0/device_code';
  var WEB_SERVER_GRANT_TYPE    = 'http://tech.ebu.ch/cpa/1.0/authorization_code';
  var REFRESH_TOKEN_GRANT_TYPE = 'http://tech.ebu.ch/cpa/1.0/refresh_token';

  var postTokenHandlers = {};
  postTokenHandlers[CLIENT_MODE_GRANT_TYPE]   = clientMode;
  postTokenHandlers[USER_MODE_GRANT_TYPE]     = userMode;
  postTokenHandlers[WEB_SERVER_GRANT_TYPE]    = webServerFlow;
  postTokenHandlers[REFRESH_TOKEN_GRANT_TYPE] = refreshToken;

  var getTokenHandlers = {};
  getTokenHandlers[CLIENT_MODE_GRANT_TYPE] = clientMode;
  getTokenHandlers[USER_MODE_GRANT_TYPE]  = userMode;

  var createError = function(status, error, description) {
    var err = new Error(description);
    err.error = error;
    err.statusCode = status;

    return err;
  };

  /**
   * @param {String} field Either <code>"body"</code> or <code>"query"</code>
   */

  var handleToken = function(params, handlers, callback) {
    if (!params.hasOwnProperty('grant_type')) {
      callback(createError(400, 'invalid_request', 'Missing grant type'));
      return;
    }

    var grantType = params.grant_type;
    var handler = handlers[grantType];

    if (handler) {
      handler(params, callback);
    }
    else {
      callback(createError(400, 'invalid_request', "Unsupported grant type: " + grantType));
      return;
    }
  };

  /**
   * Access token endpoint
   */

  app.post('/token', requireEncoding('json'), function(req, res, next) {
    var params = _.merge(req.body, req.cookies && req.cookies.cpa);

    handleToken(params, postTokenHandlers, function(err, token, domain, user) {
      if (err) {
        if (err.statusCode) {
          if (err.statusCode === 202) {
            res.send(202, { "reason": "authorization_pending" });
          }
          else {
            res.sendErrorResponse(err.statusCode, err.error, err.message);
          }
        }
        else {
          next(err);
        }
        return;
      }

      res.set('Cache-Control', 'no-store');
      res.set('Pragma', 'no-cache');

      sendAccessToken(res, false, token, domain, user);
    });
  });

  app.get('/token', function(req, res, next) {
    var params = _.merge(req.query, req.cookies && req.cookies.cpa);

    handleToken(params, getTokenHandlers, function(err, token, domain, user) {
      if (err) {
        if (err.statusCode) {
          if (err.statusCode === 202) {
            res.jsonp(202, { http_status: 202, reason: "authorization_pending" });
          }
          else {
            res.jsonp(err.statusCode, {
              http_status:       err.statusCode,
              error:             err.error,
              error_description: err.message
            });
          }
        }
        else {
          next(err);
        }

        return;
      }

      res.set('Cache-Control', 'no-store');
      res.set('Pragma', 'no-cache');

      sendAccessToken(res, true, token, domain, user);
    });
  });
};

module.exports = routes;
