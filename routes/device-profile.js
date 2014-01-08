"use strict";

var db = require('../models');
var generate = require('../lib/generate');
var verify = require('../lib/verify');
var config = require('../config');
var messages = require('../lib/messages');

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
              res.json(500, {});
            }

          });

        } else {
          res.json(400, {});
        }
      });

    } else {
      res.json(400, {});
    }

  });

  var renderVerificationPage = function(req, res, error_message) {
    if (typeof error_message === 'string') {
      res.render('verify.ejs', { 'values': req.body, 'error': error_message });
    } else {
      res.render('verify.ejs', { 'values': req.body, 'error': null });
    }

  };

  app.get('/verify', renderVerificationPage);

  app.post('/verify', function(req, res) {
    if (req.headers['content-type'] === 'application/x-www-form-urlencoded' && req.body.user_code) {

      var posted_user_code = req.body.user_code;

      db.PairingProcess.find({ where: { 'user_code': posted_user_code }}).success(function(pairingProcess) {
        if (pairingProcess) {

          if (pairingProcess.verified) {
            res.send(404);
          } else {
            pairingProcess.updateAttributes({verified: true}).success(function() {
              res.render('verify-success.ejs');
            }).error(function() {
              res.send(500);
            });
          }
        } else {
          renderVerificationPage(req, res, messages.INVALID_USERCODE);
        }
      }).error(function(err) {
        res.send(500);
      });

    } else {
      res.send(400);
    }
  });
};


