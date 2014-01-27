"use strict";

var db = require('../../models');
var config = require('../../config');

var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;


passport.use(new FacebookStrategy({
    clientID: config.identity_providers.facebook.client_id,
    clientSecret: config.identity_providers.facebook.client_secret,
    callbackURL: config.identity_providers.facebook.callback_url
  },
  function(accessToken, refreshToken, profile, done) {
    db.User.findOrCreate({provider_uid: profile.id}).success(function(user){
      return done(null, user);
    }).error(function(err) {
      done(err, null);
    });
  }
));



module.exports = function(app, options) {
  app.get('/auth/facebook', passport.authenticate('facebook'));

  app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect: '/',
    failureRedirect: '/?error=login_failed'
  }));

};
