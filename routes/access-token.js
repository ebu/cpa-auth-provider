"use strict";

var db       = require('../models');
var generate = require('../lib/generate');

var clientMode            = require('./token/client-mode');
var userMode              = require('./token/user-mode');
var webServerFlow         = require('./token/webserver-flow');
var refreshDeviceToken    = require('./token/refresh-device-token');
var refreshWebServerToken = require('./token/refresh-webserver-token');

var routes = function(app) {

  /**
   * Access token endpoint
   */

  app.post('/token', function(req, res, next) {
    if (!req.body.hasOwnProperty('grant_type')) {
      res.sendErrorResponse(400, 'invalid_request', 'Missing grant type');
      return;
    }

    var grantType = req.body.grant_type;

    switch (grantType) {
      case 'http://tech.ebu.ch/cpa/1.0/client_credentials':
        return clientMode(req, res, next);

      case 'http://tech.ebu.ch/cpa/1.0/device_code':
        return userMode(req, res, next);

      case 'http://tech.ebu.ch/cpa/1.0/authorization_code':
        return webServerFlow(req, res, next);

      case 'http://tech.ebu.ch/cpa/1.0/refresh_device_token':
        return refreshDeviceToken(req, res, next);

      case 'http://tech.ebu.ch/cpa/1.0/refresh_token':
        return refreshWebServerToken(req, res, next);

      default:
        return res.sendErrorResponse(
          400,
          'unsupported_grant_type',
          "Unsupported grant type: " + grantType
        );
    }
  });
};

module.exports = routes;
