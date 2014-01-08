"use strict";

var db = require('../models');
var generate = require('../lib/generate');
var verify = require('../lib/verify');
var config = require('../config');

function registerClient(req, res) {
  var clientId = req.body.client_id;

  if (!clientId) {
    res.send(400);
    return;
  }

  db.Client.find({ where: { id: clientId } }).success(function(client) {
    if (client) {

      var newPairingCode = {
        device_code: generate.deviceCode(),
        user_code: generate.userCode(),
        verification_uri: config.uris.verification_uri
      };

      db.PairingCode.create(newPairingCode).success(function(pairingCode) {
        if (pairingCode) {
          pairingCode.setClient(client);

          res.json(200, {
            device_code: pairingCode.device_code,
            user_code: pairingCode.user_code,
            verification_uri: pairingCode.verification_uri
          });
        } else {
          res.send(500);
        }
      });
    } else {
      res.send(400);
    }
  });
}

function requestAccessToken(req, res) {
  res.send(400);
}

module.exports = function (app, options) {

  // Client Registration Endpoint

  app.post('/token', function(req, res) {
    if (req.get('Content-Type') !== 'application/x-www-form-urlencoded') {
      res.send(400);
      return;
    }

    var responseType = req.body.response_type;

    if (responseType === 'device_code') {
      // http://tools.ietf.org/html/draft-ietf-oauth-dyn-reg-14#section-3
      registerClient(req, res);
    }
    else if (responseType === 'code') {
      // RFC6749 section 4.1.1
      requestAccessToken(req, res);
    }
    else {
      res.send(400);
    }
  });
};
