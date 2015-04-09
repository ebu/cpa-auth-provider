"use strict";

var db            = require('../models');
var config        = require('../config');
var authHelper    = require('../lib/auth-helper');
var messages      = require('../lib/messages');
var requestHelper = require('../lib/request-helper');
var url           = require('url');

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

  app.get('/verify', authHelper.authenticateFirst, function(req, res, errorMessage) {
    var userCode = req.query.user_code;
    var redirectUri = req.query.redirect_uri;

    if (userCode && redirectUri) {
      db.PairingCode
        .find({ where: { 'user_code': userCode }, include: [ db.Client, db.Domain ] })
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

          var domain = (config.auto_provision_tokens)? 'every domain' : pairingCode.domain.name
          var templateVariables = {
            'client_name': pairingCode.client.name,
            'user_code': userCode,
            'redirect_uri': redirectUri,
            'domain': domain
          };

          res.render('verify-prefilled-code.ejs', templateVariables);
        });
      return;
    }

    renderVerificationPage(req, res, errorMessage);
  });


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

        if (pairingCode.hasExpired()) {
          // Don't update expired pairing code
          callback();
        }
        else {
          pairingCode.state = (code.value === 'yes') ? 'verified' : 'denied';
          pairingCode.save(['state']).complete(callback);
        }
      });
    },
    function(err) {
      done(err);
    });
  };

  var denyUserCode = function(userCode, userId, done) {
    db.PairingCode
      .find({where: {'user_code': userCode}, include: [db.Client]})
      .complete(function (err, pairingCode) {
        if (err) {
          done(err);
          return;
        }

        if (!pairingCode) {
          done(null, messages.INVALID_USERCODE);
          return;
        }

        if (pairingCode.state === 'verified') {
          done(null, messages.OBSOLETE_USERCODE);
          return;
        }

        if (pairingCode.hasExpired()) {
          done(null, messages.EXPIRED_USERCODE);
          return;
        }

        // TODO: check transaction
        return pairingCode
          .updateAttributes({user_id: userId, state: 'denied'})
          .then(function () {
            pairingCode.client.user_id = userId;
            pairingCode.client.save();
          })
          .then(function () {
            done(null, null, 'user_code:denied');
          },
          function (err) {
            done(err);
          });
      });
  };

  var validateUserCode = function(userCode, userId, done) {
    db.PairingCode
      .find({ where: { 'user_code': userCode }, include: [ db.Client ] })
      .complete(function(err, pairingCode) {
        if (err) {
          done(err);
          return;
        }

        if (!pairingCode) {
          done(null, messages.INVALID_USERCODE);
          return;
        }

        if (pairingCode.state === 'verified') {
          done(null, messages.OBSOLETE_USERCODE);
          return;
        }

        if (pairingCode.hasExpired()) {
          done(null, messages.EXPIRED_USERCODE);
          return;
        }

        // TODO: check transaction
        return pairingCode
          .updateAttributes({user_id: userId, state: 'verified'})
          .then(function () {
            pairingCode.client.user_id = userId;
            pairingCode.client.save();
          })
          .then(function () {
            done();
          },
          function (err) {
            done(err);
          });
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
        codes.push({ 'id': k.substr('pairing_code_'.length), 'value': req.body[k] });
      }
    }

    if (codes.length > 0) {
      return validatePairingCodes(req.user.id, codes, function(err) {
        if (err) {
          next(err);
          return;
        }

        requestHelper.redirect(res, '/verify');
      });
    }

    var userCode = req.body.user_code;
    if (!userCode) {
      renderVerificationPage(req, res, messages.INVALID_USERCODE);
      return;
    }

    var sendVerificationCallback = function(err, errorMessage, uriInfo) {
      if (err) {
        next(err);
        return;
      }

      if (errorMessage) {
        res.status(400);
        renderVerificationInfo(res, errorMessage, 'warning');
        return;
      }


      var redirectUri = req.body.redirect_uri;
      if (uriInfo) {
        var u = url.parse(redirectUri, true);
        u.query['info'] = uriInfo;
        redirectUri = url.format(u);
        console.log('asdasd', redirectUri);
      }

      if (redirectUri) {
        res.redirect(redirectUri);
        return;
      }

      renderVerificationInfo(res, messages.SUCCESSFUL_PAIRING, 'success');
    };


    var denied = ('authorization' in req.body && req.body.authorization === 'Deny');
    if (denied) {
      denyUserCode(userCode, req.user.id, sendVerificationCallback);
      return;
    }

    validateUserCode(userCode, req.user.id, sendVerificationCallback);

  });
};

module.exports = routes;
