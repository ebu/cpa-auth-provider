"use strict";

var db = require('../models');
var generate = require('../lib/generate');
var verify = require('../lib/verify');
var config = require('../config');

function registerClient(req, res) {
  var clientId = req.body.client_id;

  // TODO: validate clientId
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
  var clientId = req.body.client_id;

  // TODO: validate clientId
  if (!clientId) {
    res.send(400);
    return;
  }

  db.PairingCode
    .find({ where: { ClientId: clientId } })
    .success(function(pairingCode) {
      if (pairingCode) {
        if (pairingCode.verified) {
          // TODO: create access token in database and delete pairingCode
          // object
          res.set('Cache-Control', 'no-store');
          res.set('Pragma', 'no-cache');
          res.json({});
        }
        else {
          res.json(400, { error: 'authorization_pending' });
        }
      }
      else {
        res.send(400);
      }
    });
}

function routes(app, options) {

  // Client Registration Endpoint

  app.post('/token', function(req, res) {
    if (req.get('Content-Type') !== 'application/x-www-form-urlencoded') {
      res.send(400);
      return;
    }

    if (req.body.response_type === 'device_code') {
      // http://tools.ietf.org/html/draft-ietf-oauth-dyn-reg-14#section-3
      registerClient(req, res);
    }
    else if (req.body.grant_type === 'authorization_code') {
      // RFC6749 section 4.1.1
      requestAccessToken(req, res);
    }
    else {
      res.send(400);
    }
  });
};

module.exports = routes;
