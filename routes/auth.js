

var config = require('../config.js');

var passport = require('passport');
FacebookStrategy = require('passport-facebook').Strategy;

passport.use(new FacebookStrategy({
    clientID: config.passport.FACEBOOK_CLIENT_ID,
    clientSecret: config.passport.FACEBOOK_CLIENT_SECRET,
    callbackURL: config.passport.FACEBOOK_CALLBACK_URL
  },
  function(accessToken, refreshToken, profile, done) {
//    User.findOrCreate(..., function(err, user) {
//      if (err) { return done(err); }
//      done(null, user);
//    });
    console.log("accessToken", accessToken);
    console.log("refreshToken", refreshToken);
    console.log("profile", profile);
    done(null, user);
  }
));


module.exports = function (app, options) {



  // Redirect the user to Facebook for authentication.  When complete,
  // Facebook will redirect the user back to the application at
  //     /auth/facebook/callback
  app.get('/auth/facebook', passport.authenticate('facebook'));

  // Facebook will redirect the user to this URL after approval.  Finish the
  // authentication process by attempting to obtain an access token.  If
  // access was granted, the user will be logged in.  Otherwise,
  // authentication has failed.
  app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { successRedirect: '/',
      failureRedirect: '/login' }));


}


