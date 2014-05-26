"use strict";

var db = require('../../models');
var config = require('../../config');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var localStrategyCallback = function(username, password, done) {
  db.User.find({ provider_uid: username, password: password }).then(function(user) {
    done(null, user);
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

    res.redirect('/');
  });
};
