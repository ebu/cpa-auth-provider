"use strict";

var db = require('../models');
var generate = require('../lib/generate');

module.exports = function (app, options) {

  app.post('/register', function(req, res) {

    if (req.get('Content-Type') === "application/json") {

      var clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

      var clientSecret = generate.clientSecret(clientIp);

      db.Client
        .create({
          id: null,
          secret: clientSecret,
          ip: clientIp
        })
        .complete(function(err, result) {
          if (err) {
            res.send(500);
          }
          var client = result.dataValues;

          res.json(200, { client_id: client.id, client_secret: client.secret });
        });

    } else {
      res.send(400);
    }

  });

}