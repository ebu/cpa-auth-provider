"use strict";

var config        = require('../config');
var db            = require('../models');
var generate      = require('../lib/generate');
var requestHelper = require('../lib/request-helper');
var verify        = require('../lib/verify');

var async = require('async');

module.exports = function(app) {
  var logger = app.get('logger');

  // Returns the client's IP address from the given HTTP request.

  var getClientIpAddress = function(req) {
    return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  };

  // Client Registration Endpoint
  // http://tools.ietf.org/html/draft-ietf-oauth-dyn-reg-14#section-3

  app.post('/register', function(req, res) {
    if (!requestHelper.isContentType(req, 'application/json')) {
      logger.error("Invalid content type:", req.get('Content-Type'));
      res.json(400, { error: 'invalid_request' });
      return;
    }

    db.sequelize.transaction(function(transaction) {
      async.waterfall([
        function(callback) {
          var clientIp     = getClientIpAddress(req);
          var clientSecret = generate.clientSecret(clientIp);

          // TODO: Check mandatory fields.
          db.Client.create({
            id:               null,
            secret:           clientSecret,
            name:             req.body.client_name,
            software_id:      req.body.software_id,
            software_version: req.body.software_version,
            ip:               clientIp
          })
          .complete(function(err, client) {
            var state = { client: client };
            callback(err, state);
          });
        },
        function(state, callback) {
          db.RegistrationAccessToken.create({
            token:     generate.accessToken(),
            scope:     '', // TODO: set scope as defined by service provider?
            client_id: state.client.id
          })
          .complete(function(err, token) {
            state.registrationAccessToken = token;
            callback(err, state);
          });
        },
        function(state, callback) {
          transaction.commit().complete(function(err) {
            callback(err, state);
          });
        },
        function(state, callback) {
          res.json(201, {
            client_id:                 state.client.id.toString(),
            client_secret:             state.client.secret,
            registration_access_token: state.registrationAccessToken.token,
            registration_client_uri:   config.uris.registration_client_uri
          });

          callback();
        },
      ],
      function(error) {
        if (error) {
          transaction.rollback().complete(function(err) {
            if (err) {
              res.send(500);
            }
            else {
              // TODO: distinguish between invalid input parameters and other
              // failure conditions
              res.json(400, { error: 'invalid_request' });
            }
          });
        }
      });
    });
  });

  // Client Configuration Endpoint
  // http://tools.ietf.org/html/draft-ietf-oauth-dyn-reg-14#section-4

  var configurationEndpoint = function(req, res, clientId) {
    if (!req.headers.authorization) {
      // RFC6750: http://tools.ietf.org/html/rfc6750#section-3.1 : request lacks any auth information
      res.setHeader('WWW-Authenticate', 'Bearer realm="' + config.realm + '"');
      res.json(401, { error: 'unauthorized' });
      return;
    }

    verify.registrationAccessToken(req.headers.authorization, clientId, function(err, registrationAccessToken, client) {
      if (err || !registrationAccessToken || !client) {
        // RFC6750: http://tools.ietf.org/html/rfc6750#section-3.1
        res.setHeader('WWW-Authenticate', 'Bearer realm="' + config.realm + '",\nerror="invalid_token",\nerror_description="Unknown or expired token"');
        res.json(401, { error: 'unauthorized' });
        return;
      }

      res.json({
        client_id:                 client.dataValues.id.toString(),
        client_secret:             client.dataValues.secret,
        registration_access_token: registrationAccessToken.dataValues.token,
        registration_client_uri:   config.uris.registration_client_uri
      });
    });
  };

  // client_id is given in the path
  app.get('/register/:client_id', function(req, res) {
    var clientId = req.params.client_id;
    configurationEndpoint(req, res, clientId);
  });

  // client_id is given as a GET Parameter
  app.get('/register', function(req, res) {
    var clientId = req.query.client_id;
    configurationEndpoint(req, res, clientId);
  });

  app.put('/register', function(req, res) {
    res.send(501);
  });

  app.delete('/register', function(req, res) {
    res.send(501);
  });
};
