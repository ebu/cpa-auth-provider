"use strict";

var db = require('../models');
var config = require('../config.js');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;



passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new FacebookStrategy({
    clientID: config.passport.FACEBOOK_CLIENT_ID,
    clientSecret: config.passport.FACEBOOK_CLIENT_SECRET,
    callbackURL: config.passport.FACEBOOK_CALLBACK_URL
  },
  function(accessToken, refreshToken, profile, done) {
    db.User.findOrCreate({provider_uid: profile.id}).success(function(user){
      return done(null, user);
    }).error(function(err) {
      done(err, null);
    });
  }
));

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}

module.exports = function (app, options) {

  app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });

  app.get('/protected',
    ensureAuthenticated,
    function(req, res) {
      res.send('protected');
    });

  app.get('/auth', function(req, res){
    res.render('./auth/provider_list.ejs');
  });
