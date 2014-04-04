"use strict";

var config        = require('../config');
var db            = require('../models');
var authHelper    = require('../lib/auth-helper');
var generate      = require('../lib/generate');
var messages      = require('../lib/messages');
var requestHelper = require('../lib/request-helper');
var verify        = require('../lib/verify');

var sendAccessToken = function(res, token, scope, user) {
  var name = (user !== null) ? user.provider_uid : "This radio";

  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-cache');
  res.json({
    token:             token,
    token_type:        'bearer',
    scope:             scope.name,
    description:       name + " at " + scope.display_name,
    short_description: scope.display_name
  });
};

var requestClientModeAccessToken = function(res, clientId, clientSecret, scope) {
  db.Client.find({ where: { id: clientId, secret: clientSecret } })
    .then(function(client) {
      if (!client) {
        res.json(400, { error: 'invalid_client' });
        return;
      }

      return db.Scope.find({ where: { name: scope }});
    })
    .then(function(scope) {
      if (!scope) {
        // SPEC : define correct error message
        res.json(400, { error: 'invalid_client' });
        return;
      }

      // TODO: must validate clientId and clientSecret before creating access
      // token

      var accessToken = {
        token:     generate.accessToken(),
        user_id:   null,
        client_id: clientId,
        scope_id:  scope.id
      };

      // TODO: Handle duplicated tokens
      db.ServiceAccessToken
        .create(accessToken)
        .success(function(dbAccessToken) {
          sendAccessToken(res, dbAccessToken.token, scope, null);
        })
        .error(function(error){
          res.send(500);
        });

    }, function(err){
      res.send(500);
    });
};

var requestUserModeAccessToken = function(res, clientId, clientSecret, deviceCode, scope) {
  db.Client.find({ where: { id: clientId, secret: clientSecret } })
    .then(function(client) {
      if (!client) {
        res.json(400, { error: 'invalid_client' });
        return;
      }

      return db.PairingCode.find({
        where:   { client_id: client.id, device_code: deviceCode },
        include: [ db.Scope, db.User ]
      });
    })
    .then(function(pairingCode) {
      if (!pairingCode) {
        res.json(400, { error: 'invalid_client' });
        return;
      }

      if (!pairingCode.scope || pairingCode.scope.name !== scope) {
        res.json(400, { error: 'invalid_client' });
        return;
      }

      if (!pairingCode.verified) {
        res.send(202);
        return;
      }

      db.sequelize.transaction(function(transaction) {
        var accessToken = {
          token:     generate.accessToken(),
          user_id:   pairingCode.user_id,
          client_id: pairingCode.client_id,
          scope_id:  pairingCode.scope_id
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
            sendAccessToken(res, accessToken.token, pairingCode.scope, pairingCode.user);
          },
          function(error) {
            transaction.rollback().complete(function(err) {
              res.send(500);
            });
          });
      });
    },
    function(error) {
      res.send(500);
    });
};

var routes = function(app) {
  var logger = app.get('logger');

  /*
   * Access token endpoint
   */

  app.post('/token', function(req, res) {
    if (!requestHelper.isContentType(req, 'application/json')) {
      res.json(400, { error: 'invalid_request' });
      return;
    }

    var grantType    = req.body.grant_type;
    var clientId     = req.body.client_id;
    var clientSecret = req.body.client_secret;
    var deviceCode   = req.body.device_code;
    var scope        = req.body.scope;

    if (!grantType) {
      logger.error("Missing grant_type parameter");
      res.json(400, { error: 'invalid_request' });
      return;
    }

    if (grantType !== 'authorization_code') {
      logger.error("Unsupported grant_type");
      res.json(400, { error: 'unsupported_grant_type' });
      return;
    }

    // TODO: validate clientId
    if (!clientId || !clientSecret || !scope) {
      res.json(400, { error: 'invalid_request' });
      return;
    }

    if (deviceCode) {
      // User mode
      requestUserModeAccessToken(res, clientId, clientSecret, deviceCode, scope);
    }
    else {
      // Client mode
      requestClientModeAccessToken(res, clientId, clientSecret, scope);
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
