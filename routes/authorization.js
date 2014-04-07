"use strict";

var db = require('../models');

var requestHelper = require('../lib/request-helper');

module.exports = function(app, options) {
  app.post('/authorized', function(req, res) {
    if (!requestHelper.isContentType(req, 'application/json')) {
      res.json(400, { error: 'invalid_request' });
      return;
    }

    var accessToken = req.body.token;

    if (!accessToken) {
      res.json(400, { error: 'invalid_request' });
      return;
    }

    var scopeName = req.body.scope;

    if (!scopeName) {
      res.json(400, { error: 'invalid_request' });
      return;
    }

    // TODO: do this in a single query?

    db.Scope
      .find({ where: { name: scopeName } })
      .complete(function(err, scope) {
        if (err) {
          res.send(500);
          return;
        }

        if (!scope) {
          res.send(401, { error: 'unauthorized' });
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
              res.send(401, { error: 'unauthorized' });
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

            res.json(responseData);
          });
      });
  });
};
