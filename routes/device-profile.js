"use strict";

var config        = require('../config');
var db            = require('../models');
var authHelper    = require('../lib/auth-helper');
var generate      = require('../lib/generate');
var messages      = require('../lib/messages');
var requestHelper = require('../lib/request-helper');
var verify        = require('../lib/verify');

var registerPairingCode = function(req, res) {
  var clientId            = req.body.client_id;
  var serviceProviderName = req.body.service_provider;

  // TODO: validate clientId
  if (!clientId) {
    res.json(400, { error: 'invalid_request' });
    return;
  }
  else if (!clientId.match(/^\d+$/)) {
    res.json(400, { error: 'invalid_client' });
    return;
  }

  if (!serviceProviderName) {
    res.json(400, { error: 'invalid_request' });
    return;
  }

  db.Client.find({ where: { id: clientId } }).success(function(client) {
    if (!client) {
      res.json(400, { error: 'invalid_client' });
      return;
    }

    db.ServiceProvider.find({ where: { name: serviceProviderName }})
      .success(function(serviceProvider) {
        if (!serviceProvider) {
          res.json(400, { error: 'invalid_request' });
          return;
        }

        var pairingCode = {
          client_id:           clientId,
          service_provider_id: serviceProvider.id,
          device_code:         generate.deviceCode(),
          user_code:           generate.userCode(),
          verification_uri:    config.uris.verification_uri
        };

        db.PairingCode.create(pairingCode).then(function() {
          res.json(200, {
            device_code:      pairingCode.device_code,
            user_code:        pairingCode.user_code,
            verification_uri: pairingCode.verification_uri
          });
        },
        function(error) {
          res.send(500);
        });
      });
  },
  function(error) {
    res.send(500);
  });
};

var requestStandAloneAccessToken = function(res, clientId, clientSecret, serviceProvider, scope) {
  db.ServiceProvider.find({ where: {name: serviceProvider}})
    .then(function(serviceProvider) {
      if (!serviceProvider) {
        // SPEC : define correct error message
        res.json(400, { error: 'invalid_request' });
        return;
      }

      var accessToken = {
        token:               generate.accessToken(),
        user_id:             null,
        client_id:           clientId,
        service_provider_id: serviceProvider.id
      };

      // TODO: Handle duplicated tokens
      db.ServiceAccessToken
        .create(accessToken)
        .success(function(dbAccessToken) {
          res.set('Cache-Control', 'no-store');
          res.set('Pragma', 'no-cache');
          res.json({
            token:      dbAccessToken.token,
            token_type: 'bearer'
          });
        }).error(function(error){
          res.send(500);
        });

    }, function(err){
      res.send(500);
    });
};

var validateDeviceCode = function(res, clientId, deviceCode) {
  db.PairingCode
    .find({ where: { client_id: clientId, device_code: deviceCode } })
    .success(function(pairingCode) {
      if (!pairingCode) {
        res.json(400, { error: 'invalid_client' });
        return;
      }

      if (!pairingCode.verified) {
        res.json(400, { error: 'authorization_pending' });
        return;
      }

      db.sequelize.transaction(function(transaction) {
        var accessToken = {
          token:               generate.accessToken(),
          user_id:             pairingCode.user_id,
          client_id:           pairingCode.client_id,
          service_provider_id: pairingCode.service_provider_id
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
};

var requestAccessToken = function(req, res) {
  var clientId        = req.body.client_id;
  var clientSecret    = req.body.client_secret;
  var serviceProvider = req.body.service_provider;
  var scope           = req.body.scope;

  // TODO: validate clientId
  if (!clientId) {
    res.json(400, { error: 'invalid_request' });
    return;
  }

  // Stand-alone mode
  if (clientSecret) {
    verify.clientSecret(clientId, clientSecret, function(err, client) {
      if (err || !client) {
        res.json(400, { error: 'invalid_client' });
        return;
      }

      if (!serviceProvider) {
        res.json(400, { error: 'invalid_request' });
        return;
      }

      requestStandAloneAccessToken(res, clientId, clientSecret, serviceProvider, scope);
    });
  }
  else {
    // TODO: RFC6749 section 4.1.3 describes the 'code' parameter as "The
    // authorization code received from the authorization server." Assume this
    // is the device_code from draft-recordon-oauth-v2-device-00 section 1.4

    var deviceCode = req.body.code;

    if (!deviceCode) {
      res.json(400, { error: 'invalid_request' });
      return;
    }

    validateDeviceCode(res, clientId, deviceCode);
  }
};

var routes = function(app) {
  var logger = app.get('logger');

  // Client Registration Endpoint

  app.post('/token', function(req, res) {
    if (!requestHelper.isContentType(req, 'application/x-www-form-urlencoded')) {
      logger.error("Invalid content type:", req.get('Content-Type'));
      res.json(400, { error: 'invalid_request' });
      return;
    }

    // TODO: https://github.com/ebu/cpa-spec/issues/1
    if (req.body.response_type === 'device_code') {
      // http://tools.ietf.org/html/draft-ietf-oauth-dyn-reg-14#section-3
      registerPairingCode(req, res);
    }
    else if (!req.body.grant_type) {
      logger.error("Missing grant_type parameter");
      res.json(400, { error: 'invalid_request' });
    }
    else if (req.body.grant_type === 'authorization_code') {
      // RFC6749 section 4.1.3
      requestAccessToken(req, res);
    }
    else {
      logger.error("Unsupported grant_type");
      res.json(400, { error: 'unsupported_grant_type' });
    }
  });

  var renderVerificationPage = function(req, res, errorMessage) {
    if (typeof errorMessage === 'string') {
      res.status(400);
      res.render('verify.ejs', { 'values': req.body, 'error': errorMessage });
    }
    else {
      res.render('verify.ejs', { 'values': req.body, 'error': null });
    }
  };

  app.get('/verify', authHelper.ensureAuthenticated, renderVerificationPage);

  app.post('/verify', authHelper.ensureAuthenticated, function(req, res) {
    if (!requestHelper.isContentType(req, 'application/x-www-form-urlencoded')) {
      res.json(400, { error: 'invalid_request' });
      return;
    }

    if (!req.body.user_code) {
      logger.error("Missing user_code parameter");
      res.json(400, { error: 'invalid_request' });
      return;
    }

    var userCode = req.body.user_code;

    verify.userCode(userCode, function(err, pairingCode) {
      if (err || !pairingCode) {
        renderVerificationPage(req, res, messages.INVALID_USERCODE);
        return;
      }

      if (pairingCode.verified) {
        res.status(400);
        res.render('verify-info.ejs', { message: messages.OBSOLETE_USERCODE, status: 'warning' });
        return;
      }

      pairingCode
        .updateAttributes({ user_id: req.user.id, verified: true })
        .success(function() {
          res.render('verify-info.ejs', { message: messages.SUCCESSFUL_PAIRING, status: 'success' });
        })
        .error(function() {
          res.send(500);
        });
    });
  });
};

module.exports = routes;
