"use strict";

var db = require('../models');
var generate = require('../lib/generate');
var verify = require('../lib/verify');
var config = require('../config');
var messages = require('../lib/messages');

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
          // TODO: ensure pairingCode is saved after modification

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
      if (!pairingCode) {
        res.send(400);
        return;
      }

      if (!pairingCode.verified) {
        res.json(400, { error: 'authorization_pending' });
        return;
      }

      db.sequelize.transaction(function(transaction) {
        var accessToken = {
          token:             generate.accessToken(),
          ClientId:          pairingCode.ClientId,
          ServiceProviderId: pairingCode.ServiceProviderId
          // user: pairingCode.UserId ???
        };

        db.ServiceAccessToken
          .create(accessToken)
          .then(function() {
            return pairingCode.destroy();
          })
          .then(function() {
            return transaction.commit();
          })
          .then(function() {
            res.set('Cache-Control', 'no-store');
            res.set('Pragma', 'no-cache');
            res.json({
              token:      accessToken.token,
              token_type: 'bearer'
            });
          },
          function(error) {
            transaction.rollback().complete(function(err) {
              res.send(500);
            });
          });
      });
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

  var renderVerificationPage = function(req, res, error_message) {
    if (typeof error_message === 'string') {
      res.status(400);
      res.render('verify.ejs', { 'values': req.body, 'error': error_message });
    } else {
      res.render('verify.ejs', { 'values': req.body, 'error': null });
    }

  };

  app.get('/verify', renderVerificationPage);

  app.post('/verify', function(req, res) {
    if (req.headers['content-type'] === 'application/x-www-form-urlencoded' && req.body.user_code) {

      var postedUserCode = req.body.user_code;

      verify.userCode(postedUserCode, function(err, pairingCode) {
        if (err || !pairingCode) {
          renderVerificationPage(req, res, messages.INVALID_USERCODE);
        } else {
          if (pairingCode.verified) {
            res.status(400);
            res.render('verify-info.ejs', { message: messages.OBSOLETE_USERCODE, status: 'warning' });
          } else {
            pairingCode.updateAttributes({verified: true}).success(function() {
              res.render('verify-info.ejs', { message: messages.SUCCESSFUL_PAIRING, status: 'success' });
            }).error(function() {
              res.send(500);
            });
          }
        };
      });

    } else {
      res.send(400);
    }
  });
}

module.exports = routes;
