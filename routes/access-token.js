"use strict";

var config   = require('../config');
var cors     = require('../lib/cors');
var db       = require('../models');
var generate = require('../lib/generate');

var clientMode    = require('./token/client-mode');
var userMode      = require('./token/user-mode');

var async = require('async');

var routes = function(router) {

  /**
   * Access token endpoint
   *
   * @see ETSI TS 103 407, section 8.4
   */

  var handler = function(req, res, next) {
    if (!req.body.hasOwnProperty('grant_type')) {
      res.sendErrorResponse(400, 'invalid_request', 'Missing grant type');
      return;
    }

    var grantType = req.body.grant_type;

    switch (grantType) {
      // see ETSI TS 103 407, section 8.4.1.1 and 8.4.1.3
      case 'http://tech.ebu.ch/cpa/1.0/client_credentials':
        return clientMode(req, res, next);

      // see ETSI TS 103 407, section 8.4.1.2
      case 'http://tech.ebu.ch/cpa/1.0/device_code':
        return userMode(req, res, next);

      default:
        return res.sendErrorResponse(
          400,
          'invalid_request',
          "Unsupported grant type: " + grantType
        );
    }
  };

  if (config.cors && config.cors.enabled) {
    // Enable pre-flight CORS request for POST /token
    router.options('/token', cors);
    router.post('/token', cors, handler);
  }
  else {
    router.post('/token', handler);
  }
};

module.exports = routes;
