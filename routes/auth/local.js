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
    successRedirect: '/',
    failureRedirect: '/auth',
    failureFlash:    true
  }));
};
