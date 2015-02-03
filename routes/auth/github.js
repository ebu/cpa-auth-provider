"use strict";

var db            = require('../../models');
var config        = require('../../config');
var requestHelper = require('../../lib/request-helper');

var passport       = require('passport');
var GithubStrategy = require('passport-github').Strategy;

passport.use(new GithubStrategy({
    clientID: config.identity_providers.github.client_id,
    clientSecret: config.identity_providers.github.client_secret,
    callbackURL: config.identity_providers.github.url_callback
  },
  function(accessToken, refreshToken, profile, done) {
    db.User.findOrCreate({provider_uid: profile.id, display_name: profile.displayName}).success(function(user){
      return done(null, user);
    }).error(function(err) {
        done(err, null);
    });
  }
));

module.exports = function(app, options) {
  app.get('/auth/github',
    passport.authenticate('github'));

  app.get('/auth/github/callback', passport.authenticate('github', {
    failureRedirect: '/?error=login_failed'
  }), function (req, res, next) {

      var redirectUri = req.session.auth_origin;
      delete req.session.auth_origin;

      if (redirectUri) {
        return res.redirect(redirectUri);
      }

      requestHelper.redirect(res, '/');
    });
};
