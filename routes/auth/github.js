"use strict";

var db = require('../../models');
var config = require('../../config.js');

var passport = require('passport');
var GithubStrategy = require('passport-github').Strategy;


passport.use(new GithubStrategy({
    clientID: config.passport.FACEBOOK_CLIENT_ID,
    clientSecret: config.passport.FACEBOOK_CLIENT_SECRET,
    callbackURL: config.passport.FACEBOOK_CALLBACK_URL
  },
  function(accessToken, refreshToken, profile, done) {

  }
));
passport.use(new GithubStrategy({
    clientID: config.passport.GITHUB_CLIENT_ID,
    clientSecret: config.passport.GITHUB_CLIENT_SECRET,
    callbackURL: config.passport.GITHUB_CALLBACK_URL
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

  app.get('/auth/github',
    passport.authenticate('github'));

  app.get('/auth/github/callback', passport.authenticate('github', { successRedirect: '/',
    failureRedirect: '/?error=login_failed' } ));

};