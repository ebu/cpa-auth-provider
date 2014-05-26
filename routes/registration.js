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

  /**
   * Client registration endpoint
   *
   * @see http://tools.ietf.org/html/draft-ietf-oauth-dyn-reg-14#section-3
   */

  app.post('/register', validateJson, function(req, res, next) {
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
            callback(err, client);
          });
        },
        function(client, callback) {
          transaction.commit().complete(function(err) {
            callback(err, client);
          });
        },
        function(client, callback) {
          res.send(201, {
            client_id:     client.id.toString(),
            client_secret: client.secret
          });

          callback();
        }
      ],
      function(error) {
        if (error) {
          transaction.rollback().complete(function(err) {
            if (err) {
              next(err);
            }
            else {
              // TODO: distinguish between invalid input parameters and other
              // failure conditions

              // TODO: report more specific error message, e.g, which field
              // is invalid.
              res.sendInvalidRequest("Invalid request");
            }
          });
        }
      });
    });
  });

  // client_id is given in the path
  app.get('/register/:client_id', function(req, res) {
    var clientId = req.params.client_id;
    res.send(501);
  });

  // client_id is given as a GET Parameter
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
