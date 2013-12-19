"use strict";

var db = require('../models');
var generate = require('../lib/generate');
var async = require('async');

module.exports = function (app, options) {


// Client Registration Endpoint
// http://tools.ietf.org/html/draft-ietf-oauth-dyn-reg-14#section-3

  app.post('/register', function(req, res) {

    if (req.get('Content-Type') === "application/json") {

      var clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

      var clientSecret = generate.clientSecret(clientIp);

      // TODO: Check mandatory fields.

      db.Client
        .create({
          id: null,
          secret: clientSecret,
          name: req.body.name,
          software_id: req.body.software_id,
          software_version: req.body.software_version,
          ip: clientIp
        })
        .complete(function(err, result) {
          if (err) {
            res.json(400, {});
          } else {
            var client = result.dataValues;
            res.json(201, { client_id: client.id, client_secret: client.secret });
          }
        });

    } else {
      res.json(400, {});
    }

  });

// Client Configuration Endpoint
// http://tools.ietf.org/html/draft-ietf-oauth-dyn-reg-14#section-4



  app.post('/register/:clientId', function(req, res) {

  });

}