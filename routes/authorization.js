"use strict";

var db = require('../models');

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

var validateJson = require('../lib/validate-json')(schema);

module.exports = function(app, options) {

  /**
   * Access token authorization endpoint
   */

  app.post('/authorized', validateJson, function(req, res) {
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

        db.AccessToken
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
