"use strict";

var db       = require('../models');
var generate = require('../lib/generate');

var clientMode    = require('./token/client-mode');
var userMode      = require('./token/user-mode');
var webServerFlow = require('./token/webserver-flow');

var async = require('async');

var routes = function(app) {

  /**
   * Access token endpoint
   */

  app.post('/token', function(req, res, next) {
    if (!req.body.hasOwnProperty('grant_type')) {
      res.sendErrorResponse(400, 'invalid_request', 'Missing grant type');
    }
    else {
      switch (req.body.grant_type) {
        case 'http://tech.ebu.ch/cpa/1.0/client_credentials':
          clientMode(req, res, next);
          break;

        case 'http://tech.ebu.ch/cpa/1.0/device_code':
          userMode(req, res, next);
          break;

        case 'http://tech.ebu.ch/cpa/1.0/authorization_code':
          webServerFlow(req, res, next);
          break;

        default:
          res.sendErrorResponse(
            400,
            'unsupported_grant_type',
            "Unsupported grant type: " + req.body.grant_type
          );
          break;
      }
    }
  });
};

module.exports = routes;
