"use strict";

var db = require('../models');

module.exports = function(app, options) {
  app.post('/authorized', function(req, res) {
    if (req.get('Content-Type') !== 'application/x-www-form-urlencoded') {
      res.json(400, { error: 'invalid_request' });
      return;
    }

    var accessToken = req.body.token;

    if (!accessToken) {
      res.json(400, { error: 'invalid_request' });
      return;
    }

    db.ServiceAccessToken
      .find({ where: { token: accessToken } })
      .then(function(accessToken) {
        if (accessToken) {
          res.send(200);
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
