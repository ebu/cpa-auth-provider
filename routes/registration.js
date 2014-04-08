"use strict";

var config        = require('../config');
var db            = require('../models');
var generate      = require('../lib/generate');
var requestHelper = require('../lib/request-helper');
var verify        = require('../lib/verify');

var async      = require('async');
var jsonSchema = require('jsonschema');

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
      res.sendInvalidRequest("Invalid content type: " + req.get('Content-Type'));
      return;
    }

    var result = jsonSchema.validate(req.body, schema);

    if (result.errors.length > 0) {
      res.sendInvalidRequest(result.toString());
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
          transaction.commit().complete(function(err) {
            callback(err, state);
          });
        },
        function(state, callback) {
          res.send(201, {
            client_id:     state.client.id.toString(),
            client_secret: state.client.secret
          });

          callback();
        }
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
              res.send(400, { error: 'invalid_request' });
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
