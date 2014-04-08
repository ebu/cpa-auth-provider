"use strict";

var db = require('../models');

var requestHelper = require('../lib/request-helper');

var jsonSchema = require('jsonschema');

var schema = {
  id: "/authorized",
  type: "object",
  required: true,
  additionalProperties: false,
  properties: {
    token: {
      type:     "string",
      required: true
    },
    scope: {
      type:     "string",
      required: true
    }
  }
};

module.exports = function(app, options) {
  app.post('/authorized', function(req, res) {
    if (!requestHelper.isContentType(req, 'application/json')) {
      res.sendInvalidRequest("Invalid content type: " + req.get('Content-Type'));
      return;
    }

    var result = jsonSchema.validate(req.body, schema);

    if (result.errors.length > 0) {
      res.sendInvalidRequest(result.toString());
      return;
    }

    var accessToken = req.body.token;
    var scopeName   = req.body.scope;

    // TODO: do this in a single query?

    db.Scope
      .find({ where: { name: scopeName } })
      .complete(function(err, scope) {
        if (err) {
          res.send(500);
          return;
        }

        if (!scope) {
          res.sendUnauthorized("Unknown scope: " + scopeName);
          return;
        }

        var query = {
          token:    accessToken,
          scope_id: scope.id
        };

        db.ServiceAccessToken
          .find({ where: query, include: [db.User]})
          .complete(function(err, accessToken) {
            if (err) {
              res.send(500);
              return;
            }

            if (!accessToken) {
              res.sendUnauthorized("Invalid access token");
              return;
            }

            var responseData = {
              client_id: accessToken.client_id
            };

            if (accessToken.user) {
              responseData.user_id      = accessToken.user_id;
              responseData.display_name = accessToken.user.display_name;
              responseData.photo_url    = accessToken.user.photo_url;
            }

            res.send(responseData);
          });
      });
  });
};
