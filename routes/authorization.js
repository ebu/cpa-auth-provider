
"use strict";

var db = require('../models');

var schema = {
  id: "/authorized",
  type: "object",
  required: true,
  additionalProperties: false,
  properties: {
    access_token: {
      type:     "string",
      required: true
    },
    domain: {
      type:     "string",
      required: true
    }
  }
};

var validateJson = require('../lib/validate-json')(schema);

module.exports = function(app, options) {
  var logger = app.get('logger');
  var config = app.get('config');

  var protectedResourceHandler =
    require('../lib/protected-resource-handler')(config, db, logger);

  /**
   * Access token authorization endpoint
   */

  app.post('/authorized', protectedResourceHandler, validateJson, function(req, res, next) {
    var accessToken = req.body.access_token;
    var domainName  = req.body.domain;

    // TODO: do this in a single query?

    db.Domain
      .find({ where: { name: domainName } })
      .complete(function(err, domain) {
        if (err) {
          next(err);
          return;
        }

        if (!domain) {
          res.sendUnauthorized("Unknown domain: " + domainName);
          return;
        }

        var query = {
          token:     accessToken,
          domain_id: domain.id
        };

        db.AccessToken
          .find({ where: query, include: [db.User]})
          .complete(function(err, accessToken) {
            if (err) {
              next(err);
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
