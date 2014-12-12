"use strict";

var config          = require('../config');
var db              = require('../models');
var cors            = require('../lib/cors');
var generate        = require('../lib/generate');
var requireEncoding = require('../lib/require-encoding');
var validator       = require('../lib/validate-json-schema');

var async = require('async');
var _     = require('lodash');

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
    var clientIpAddress = params.client_ip_address;
    var clientName      = params.client_name;
    var softwareId      = params.software_id;
    var softwareVersion = params.software_version;

    db.sequelize.transaction(function(transaction) {
      async.waterfall([
        function(callback) {
          var clientSecret = generate.clientSecret(clientIpAddress);

          // TODO: Check mandatory fields.
          db.Client.create({
            id:               null,
            secret:           clientSecret,
            name:             clientName,
            software_id:      softwareId,
            software_version: softwareVersion,
            ip:               clientIpAddress
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
    app.options('/register', cors);
  }

  /**
   * Client registration endpoint
   *
   * @see EBU Tech 3366, section 8.1
   */

  app.post(
    '/register',
    cors,
    requireEncoding('json'),
    validator.middleware(schema),
    function(req, res, next) {
      var params = _.merge(req.body, req.cookies && req.cookies.cpa);
      params.client_ip_address = getClientIpAddress(req);

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

        if (params.response_type && (params.response_type === 'cookie')) {
          // To prevent service providers having visibility of the
          // client_secret, send only the client_id in the response body,
          // and return the client_secret in a cookie.
          res.cookie('cpa', clientInfo, { httpOnly: true });
          res.send(201, { client_id: clientInfo.client_id });
        }
        else {
          res.send(201, clientInfo);
        }
      });
    }
  );

  app.get('/register', function(req, res, next) {
    var params = _.merge(req.query, req.cookies && req.cookies.cpa);
    params.client_ip_address = getClientIpAddress(req);

    handleRegister(params, function(err, clientInfo) {
      if (err) {
        if (err.statusCode) {
          res.status(err.statusCode);
          res.jsonp({
            http_status:       err.statusCode,
            error:             err.error,
            error_description: err.message
          });
        }
        else {
          next(err);
        }

        return;
      }

      // To prevent service providers having visibility of the client_secret,
      // send only the client_id in the response body, and return the
      // client_secret in a cookie.
      res.cookie('cpa', clientInfo, { httpOnly: true });

      res.jsonp(201, {
        http_status: 201,
        client_id:   clientInfo.client_id
      });
    });
  });

  app.put('/register', function(req, res) {
    res.send(501);
  });

  app.delete('/register', function(req, res) {
    res.send(501);
  });
};
