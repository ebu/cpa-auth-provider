"use strict";

var db       = require('../models');
var generate = require('../lib/generate');

var async    = require('async');


var clientMode    = require('./token/client-mode');
var userMode      = require('./token/user-mode');
var webServerFlow = require('./token/webserver-flow');

var routes = function(app) {
  /**
   * Access token endpoint
   */
  app.post('/token', function(req, res, next) {
    var grantType    = req.body.grant_type;

    if (!req.body.hasOwnProperty('grant_type')) {
      res.sendErrorResponse(400, 'invalid_request', 'Missing grant type');
    }
    else if (grantType === 'http://tech.ebu.ch/cpa/1.0/client_credentials') {
      clientMode(req, res, next);
    }
    else if (grantType === 'http://tech.ebu.ch/cpa/1.0/device_code') {
      userMode(req, res, next);
    }
    else if (grantType === 'http://tech.ebu.ch/cpa/1.0/authorization_code') {
      webServerFlow(req, res, next);
    }
    else {
      res.sendErrorResponse(400, 'unsupported_grant_type', "Unsupported grant type: " + grantType);
    }
  });
};

module.exports = routes;
