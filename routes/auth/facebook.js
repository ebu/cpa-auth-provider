"use strict";

var db            = require('../../models');
var config        = require('../../config');
var requestHelper = require('../../lib/request-helper');

var passport         = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;

passport.use(new FacebookStrategy({
    clientID: config.identity_providers.facebook.client_id,
    clientSecret: config.identity_providers.facebook.client_secret,
    callbackURL: config.identity_providers.facebook.callback_url,
    profileFields: ['id', 'displayName', 'photos']
  },
  function(accessToken, refreshToken, profile, done) {
    var photo_url = (profile.photos.length > 0) ? profile.photos[0].value : null;
    db.User.findOrCreate({provider_uid: profile.id, display_name: profile.displayName, photo_url: photo_url }).success(function(user){
      return done(null, user);
    }).error(function(err) {
      done(err, null);
    });
  }
));

module.exports = function(app, options) {
  app.get('/auth/facebook', passport.authenticate('facebook'));

  app.get('/auth/facebook/callback', passport.authenticate('facebook', {
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
