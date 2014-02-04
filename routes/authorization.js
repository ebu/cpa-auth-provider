"use strict";

var db = require('../models');

var requestHelper = require('../lib/request-helper');

module.exports = function(app, options) {
  app.post('/authorized', function(req, res) {
    if (!requestHelper.isContentType(req, 'application/x-www-form-urlencoded')) {
      res.json(400, { error: 'invalid_request' });
      return;
    }

    var accessToken = req.body.token;

    if (!accessToken) {
      res.json(400, { error: 'invalid_request' });
      return;
    }

    var serviceProviderId = req.body.service_provider_id;

    if (!serviceProviderId) {
      res.json(400, { error: 'invalid_request' });
      return;
    }

    // TODO: do this in a single query?

    db.ServiceProvider
      .find({ where: { name: serviceProviderId } })
      .complete(function(err, serviceProvider) {
        if (err) {
          res.send(500);
          return;
        }

        if (!serviceProvider) {
          res.send(401, { error: 'unauthorized' });
          return;
        }

        var query = {
          token: accessToken,
          service_provider_id: serviceProvider.id
        };

        db.ServiceAccessToken
          .find({ where: query })
          .complete(function(err, accessToken) {
            if (err) {
              res.send(500);
              return;
            }

            if (!accessToken) {
              res.send(401, { error: 'unauthorized' });
              return;
            }

            res.json({
              client_id: accessToken.client_id,
              user_id:   accessToken.user_id
            });
          });
      });
  });
};
