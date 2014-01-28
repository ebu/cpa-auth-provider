"use strict";

var db = require('../models');

module.exports = function(app, options) {
  app.post('/authorized', function(req, res) {
    if (req.get('Content-Type').indexOf('application/x-www-form-urlencoded') !== 0) {
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

    var query = {
      token: accessToken,
      service_provider_id: serviceProviderId
    };

    db.ServiceAccessToken
      .find({ where: query })
      .then(function(accessToken) {
        if (accessToken) {
          res.json({
            client_id: accessToken.client_id,
            user_id:   accessToken.user_id
          });
        }
        else {
          res.send(401, { error: 'unauthorized' });
        }
      },
      function(error) {
        res.send(500);
      });
  });
};
