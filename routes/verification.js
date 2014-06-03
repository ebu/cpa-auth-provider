"use strict";

var db            = require('../models');
var authHelper    = require('../lib/auth-helper');
var messages      = require('../lib/messages');
var requestHelper = require('../lib/request-helper');

var async = require('async');

var routes = function(app) {
  var logger = app.get('logger');

  var renderVerificationPage = function(req, res, errorMessage) {
    db.PairingCode.findAll({
      where: { user_id: req.user.id, state: 'pending' },
      include: [ db.User, db.Domain ]
    })
    .complete(function(err, pairingCodes) {
      if (err) {
        res.send(500);
        return;
      }

      if (pairingCodes.length > 0) {
        res.render('verify-list.ejs', { 'pairing_codes': pairingCodes });
      }
      else {
        if (typeof errorMessage === 'string') {
          res.status(400);
          res.render('verify.ejs', { 'user_code': req.body.user_code, 'error': errorMessage });
        }
        else {
          res.render('verify.ejs', { 'user_code': req.body.user_code, 'error': null });
        }
      }
    });
  };

  var renderVerificationInfo = function(res, message, status) {
    res.render('verify-info.ejs', { message: message, status: status });
  };

  app.get('/verify', authHelper.authenticateFirst, renderVerificationPage);

  /**
   * User code verification and confirmation endpoint
   */

  var validatePairingCodes = function(userId, formCodes, done) {
    async.each(formCodes, function(code, callback) {
      db.PairingCode.find({
        where: { id: code.id, user_id: userId, state: 'pending' },
        include: [ db.User, db.Domain ]
      }).complete(function(err, pairingCode) {
        if (err) {
          callback(err);
          return;
        }

        if (!pairingCode) {
          callback(new Error('PairingCode with id: ' + code.id + ' not found'));
          return;
        }

        pairingCode.state = (code.value === 'yes') ? 'verified' : 'denied';
        pairingCode.save(['state']).complete(callback);
      });
    },
    function(err) {
      done(err);
    });
  };

  app.post('/verify', authHelper.ensureAuthenticated, function(req, res, next) {
    if (!requestHelper.isContentType(req, 'application/x-www-form-urlencoded')) {
      res.sendInvalidRequest("Invalid content type: " + req.get('Content-Type'));
      return;
    }

    var codes = [];
    for (var k in req.body) {
      if(k.indexOf('pairing_code_') === 0) {
        codes.push({id:k.substr('pairing_code_'.length), value:req.body[k]});
      }
    }

    if (codes.length > 0) {
      return validatePairingCodes(req.user.id, codes, function(err) {
        if (err) {
          next(err);
          return;
        }
        res.redirect('/verify');
      });
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
          next(err);
          return;
        }

        if (!pairingCode) {
          renderVerificationPage(req, res, messages.INVALID_USERCODE);
          return;
        }

        if (pairingCode.state === 'verified') {
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
          .updateAttributes({ user_id: req.user.id, state: 'verified' })
          .success(function() {
            renderVerificationInfo(res, messages.SUCCESSFUL_PAIRING, 'success');
          })
          .error(function(err) {
            next(err);
          });
      });
  });
};

module.exports = routes;
