"use strict";

var config   = require('../config');
var cors     = require('../lib/cors');
var db       = require('../models');
var generate = require('../lib/generate');
var logger   = require('../lib/logger');

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

module.exports = function(router) {

  /**
   * Returns the client's IP address from the given HTTP request.
   */

  var getClientIpAddress = function(req) {
    return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  };

  /**
   * Client registration endpoint
   *
   * @see ETSI TS 103 407, section 8.2
   */

  var handler = function(req, res, next) {
    db.sequelize.transaction().then(function(transaction) {
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
          .then(function(client) {
            callback(undefined, client);
          }, function(err) {
            callback(err);
          });
        },
        function(client, callback) {
          transaction.commit().then(function() {
            callback(undefined, client);
          }, function(err) {
            callback(err);
          });
        },
        function(client, callback) {
          res.status(201).send({
            client_id:     client.id.toString(),
            client_secret: client.secret
          });

          callback();
        }
      ],
      function(error) {
        if (error) {
          transaction.rollback().then(function() {
            // TODO: distinguish between invalid input parameters and other
            // failure conditions

            // TODO: report more specific error message, e.g, which field
            // is invalid.
            res.sendInvalidRequest("Invalid request");
          }, function(err) {
			next(err);
          });
        }
      });
      return new Promise(function(resolve, reject) {resolve();});
    });
  };

  if (config.cors && config.cors.enabled) {
    // Enable pre-flight CORS request for POST /register
    router.options('/register', cors);
    router.post('/register', cors, validateJson, handler);
  }
  else {
    router.post('/register', validateJson, handler);
  }

  // client_id is given in the path
  router.get('/register/:client_id', function(req, res) {
    var clientId = req.params.client_id;
    res.sendStatus(501);
  });

  // client_id is given as a GET Parameter
  router.get('/register', function(req, res) {
    res.sendStatus(501);
  });

  router.put('/register', function(req, res) {
    res.sendStatus(501);
  });

  router.delete('/register', function(req, res) {
    res.sendStatus(501);
  });
};
