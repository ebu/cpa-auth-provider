"use strict";

var db            = require('../../models');
var config        = require('../../config');
var requestHelper = require('../../lib/request-helper');

var bcrypt        = require('bcrypt');
var passport      = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var localStrategyCallback = function(username, password, done) {
  db.User.find({ where: { provider_uid: username} })
    .then(function(user) {
      if (!user) {
        done('user not found');
        return;
      }

      user.verifyPassword(password).then(function(isMatch) {
        if (isMatch) {
          done(null, user);
        } else {
          done('password does not match');
        }
      },
      function(err) {
        done(err);
      });
    },
    function(error) {
      done(error);
    });
};

passport.use(new LocalStrategy(localStrategyCallback));

module.exports = function(app, options) {
  app.post('/login', passport.authenticate('local', {
    failureRedirect: '/?error=login_failed',
    failureFlash:    true
  }), function (req, res, next) {

    var redirectUri = req.session.auth_origin;
    delete req.session.auth_origin;

    if (redirectUri) {
      return res.redirect(redirectUri);
    }

    requestHelper.redirect(res, '/');
  });
};
