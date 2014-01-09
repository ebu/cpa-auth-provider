"use strict";

var db = require('../../models');
var config = require('../../config.js');

var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;


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



module.exports = function(app, options) {
  // Redirect the user to Facebook for authentication.  When complete,
  // Facebook will redirect the user back to the application at
  //     /auth/facebook/callback
  app.get('/auth/facebook', passport.authenticate('facebook'));

  // Facebook will redirect the user to this URL after approval.  Finish the
  // authentication process by attempting to obtain an access token.  If
  // access was granted, the user will be logged in.  Otherwise,
  // authentication has failed.
  app.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect: '/',
    failureRedirect: '/?error=login_failed' } ));

};
