"use strict";

var config   = require('../config');
var db       = require('../models');
var generate = require('../lib/generate');

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
    }
  }
};

var validateJson = require('../lib/validate-json').middleware(schema);

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
              err = new Error();
              err.statusCode = 400;
              err.error = "invalid_request";
              err.description = "Invalid request";
              done(err);
            }
          });
        }
        else {
          done(null, clientInfo);
        }
      });
    });
  };

  /**
   * Client registration endpoint
   *
   * @see http://tools.ietf.org/html/draft-ietf-oauth-dyn-reg-14#section-3
   */

  app.post('/register', validateJson, function(req, res, next) {
    var params = {
      clientIpAddress: getClientIpAddress(req),
      clientName:      req.body.client_name,
      softwareId:      req.body.software_id,
      softwareVersion: req.body.software_version
    };

    handleRegister(params, function(err, clientInfo) {
      if (err) {
        if (err.statusCode) {
          res.sendErrorResponse(
            err.statusCode,
            err.error,
            err.description
          );
        }
        else {
          next(err);
        }

        return;
      }

      res.send(201, clientInfo);
    });
  });

  /**
   * Client registration endpoint. On success, returns status 201, with the
   * <code>client_id</code> and <code>client_secret</code> in the
   * <code>cpa</code> cookie
   *
   * @example
   * <code>GET /register?client_name=Test%20client&software_id=test_client&software_version=1.0</code>
   *
   * @param client_name
   * @param software_id
   * @param software_version
   */

  app.get('/register', function(req, res, next) {
    var params = {
      clientIpAddress: getClientIpAddress(req),
      clientName:      req.query.client_name,
      softwareId:      req.query.software_id,
      softwareVersion: req.query.software_version
    };

    handleRegister(params, function(err, clientInfo) {
      if (err) {
        if (err.statusCode) {
          res.sendErrorResponse(
            err.statusCode,
            err.error,
            err.description
          );
        }
        else {
          next(err);
        }

        return;
      }

      res.cookie('cpa', clientInfo, { httpOnly: true });
      res.send(201);
    });
  });

  // client_id is given as a GET Parameter
  // app.get('/register', function(req, res) {
  //   res.send(501);
  // });

  app.put('/register', function(req, res) {
    res.send(501);
  });

  app.delete('/register', function(req, res) {
    res.send(501);
  });
};
