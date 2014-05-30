"use strict";

var db            = require('../models');
var authHelper    = require('../lib/auth-helper');
var messages      = require('../lib/messages');
var requestHelper = require('../lib/request-helper');

var routes = function(app) {
  var logger = app.get('logger');

  var renderVerificationPage = function(req, res, errorMessage) {
    db.PairingCode.findAll({ where: { user_id: req.user.id, verified: false }})
      .complete(function(err, pairingCodes) {
        if (pairingCodes.length > 0) {
          res.render('verify.ejs', { 'values': pairingCodes, 'error': errorMessage });
        }
        else {
          if (typeof errorMessage === 'string') {
            res.status(400);
            res.render('verify.ejs', { 'values': req.body, 'error': errorMessage });
          }
          else {
            res.render('verify.ejs', { 'values': req.body, 'error': null });
          }
        }
      });
  };

  var renderVerificationInfo = function(res, message, status) {
    res.render('verify-info.ejs', { message: message, status: status });
  };

  app.get('/verify', authHelper.authenticateFirst, renderVerificationPage);

  /**
   * User code verification endpoint
   */

  app.post('/verify', authHelper.ensureAuthenticated, function(req, res, next) {
    if (!requestHelper.isContentType(req, 'application/x-www-form-urlencoded')) {
      res.sendInvalidRequest("Invalid content type: " + req.get('Content-Type'));
      return;
    }

    var userCode = req.body.user_code;

    if (!userCode) {
      res.sendInvalidRequest("Missing user_code");
      return;
    }

    db.PairingCode
      .find({ where: { 'user_code': userCode }})
      .complete(function(err, pairingCode) {
        if (err) {
          res.send(500);
          return;
        }

        if (!pairingCode) {
          renderVerificationPage(req, res, messages.INVALID_USERCODE);
          return;
        }

        if (pairingCode.verified) {
          res.status(400);
          renderVerificationInfo(res, messages.OBSOLETE_USERCODE, 'warning');
          return;
        }

        if (pairingCode.hasExpired()) {
          res.status(400);
          renderVerificationInfo(res, messages.EXPIRED_USERCODE, 'warning');
          return;
        }

        pairingCode
          .updateAttributes({ user_id: req.user.id, verified: true })
          .success(function() {
            renderVerificationInfo(res, messages.SUCCESSFUL_PAIRING, 'success');
          })
          .error(function() {
            res.send(500);
          });
      });
  });
};

module.exports = routes;
