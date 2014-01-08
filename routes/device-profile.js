"use strict";

var db = require('../models');
var generate = require('../lib/generate');
var verify = require('../lib/verify');
var config = require('../config');

module.exports = function (app, options) {


// Client Registration Endpoint
// http://tools.ietf.org/html/draft-ietf-oauth-dyn-reg-14#section-3

  app.post('/token', function(req, res) {

    if (req.get('Content-Type') === 'application/x-www-form-urlencoded' &&
        req.body.client_id &&
        req.body.response_type === 'device_code') {

      var clientId = req.body.client_id;

      db.Client.find({ where: { id: clientId } }).success(function(client) {
        if (client) {

          var newPairingProcess = {
            device_code:  generate.deviceCode(),
            user_code: generate.userCode(),
            verification_uri: config.uris.verification_uri
          };

          db.PairingProcess.create(newPairingProcess).success(function(pairingProcess) {

            if (pairingProcess) {
              pairingProcess.setClient(client);

              res.json(200, {
                device_code: pairingProcess.device_code,
                user_code: pairingProcess.user_code,
                verification_uri: pairingProcess.verification_uri
              });

            } else {
              res.send(500);
            }

          });

        } else {
          res.send(400);
        }
      });

    } else {
      res.send(400);
    }

  });

};

