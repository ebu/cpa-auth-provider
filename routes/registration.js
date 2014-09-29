"use strict";

var config    = require('../config');
var db        = require('../models');
var cors      = require('../lib/cors');
var generate  = require('../lib/generate');
var validator = require('../lib/validate-json-schema');

var async = require('async');

var schema = {
  id: "/register",
  type: "object",
  required: true,
  additionalProperties: false,
  properties: {
    client_name: {
      type:     "string",
      required: true
    },
    software_id: {
      type:     "string",
      required: true
    },
    software_version: {
      type:     "string",
      required: true
    },
    response_type: {
      type:     "string"
    }
  }
};

var createError = function(status, error, description) {
  var err = new Error(description);
  err.error = error;
  err.statusCode = status;

  return err;
};

module.exports = function(app) {
  var logger = app.get('logger');

  /**
   * Returns the client's IP address from the given HTTP request.
   */

  var getClientIpAddress = function(req) {
    return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  };

  var handleRegister = function(params, done) {
    db.sequelize.transaction(function(transaction) {
      async.waterfall([
        function(callback) {
          var clientSecret = generate.clientSecret(params.clientIpAddress);

          // TODO: Check mandatory fields.
          db.Client.create({
            id:               null,
            secret:           clientSecret,
            name:             params.clientName,
            software_id:      params.softwareId,
            software_version: params.softwareVersion,
            ip:               params.clientIpAddress
          })
          .complete(function(err, client) {
            callback(err, client);
          });
        },
        function(client, callback) {
          transaction.commit().complete(function(err) {
            callback(err, client);
          });
        },
        function(client, callback) {
          callback(null, {
            client_id:     client.id.toString(),
            client_secret: client.secret
          });
        }
      ],
      function(error, clientInfo) {
        if (error) {
          transaction.rollback().complete(function(err) {
            if (err) {
              done(err);
            }
            else {
              // TODO: distinguish between invalid input parameters and other
              // failure conditions

              // TODO: report more specific error message, e.g, which field
              // is invalid.
              done(createError(400, "invalid_request", "Invalid request"));
            }
          });
        }
        else {
          done(null, clientInfo);
        }
      });
    });
  };

  // Enable pre-flight CORS request for POST /register
  if (config.cors && config.cors.enabled) {
    app.options('/register', cors());
  }

  /**
   * Client registration endpoint
   *
   * @see http://tools.ietf.org/html/draft-ietf-oauth-dyn-reg-14#section-3
   */

  app.post(
    '/register',
    cors(),
    // requireEncoding('json'),
    validator.middleware(schema),
    function(req, res, next) {
      var params = {
        clientIpAddress: getClientIpAddress(req),
        clientName:      req.body.client_name,
        softwareId:      req.body.software_id,
        softwareVersion: req.body.software_version
      };

      handleRegister(params, function(err, clientInfo) {
        if (err) {
          if (err.statusCode) {
            res.sendErrorResponse(err.statusCode, err.error, err.message);
          }
          else {
            next(err);
          }

          return;
        }

        if (req.body.response_type && (req.body.response_type === 'cookie')) {
          res.cookie('cpa', clientInfo, { httpOnly: true });
          res.contentType('text/plain');
          res.send(201, '');
        }
        else {
          res.send(201, clientInfo);
        }
      }
    );
  });

  app.get('/register', function(req, res) {
    res.send(501);
  });

  app.put('/register', function(req, res) {
    res.send(501);
  });

  app.delete('/register', function(req, res) {
    res.send(501);
  });
};
