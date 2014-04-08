"use strict";

var authHelper    = require('../lib/auth-helper');
var messages      = require('../lib/messages');
var requestHelper = require('../lib/request-helper');
var verify        = require('../lib/verify');

var routes = function(app) {
  var logger = app.get('logger');

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
      res.sendInvalidRequest("Invalid content type: " + req.get('Content-Type'));
      return;
    }

    if (!req.body.user_code) {
      res.sendInvalidRequest("Missing user_code");
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
