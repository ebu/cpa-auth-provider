var config = require('../config.js');
var passport = require('passport');
FacebookStrategy = require('passport-facebook').Strategy;


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
    console.log('accessToken', accessToken);
    console.log('refreshToken', refreshToken);
    console.log('profile', profile);
    done(null, profile);
  }
));


module.exports = function (app, options) {

  app.get('/auth', function(req, res){
      res.render('./auth/provider_list.ejs');
  });

  // Redirect the user to Facebook for authentication.  When complete,
  // Facebook will redirect the user back to the application at
  //     /auth/facebook/callback
  app.get('/auth/facebook', passport.authenticate('facebook'));

  // Facebook will redirect the user to this URL after approval.  Finish the
  // authentication process by attempting to obtain an access token.  If
  // access was granted, the user will be logged in.  Otherwise,
  // authentication has failed.
  app.get('/auth/facebook/callback', function(req,res,next) {

    passport.authenticate('facebook', function(err,user) {
      if(!user) res.send(501, { error: 'NotImplemented: Error while login to Facebook'});
      if(user) res.send(501,  { error: 'NotImplemented: Successful login to Facebook'});
    })(req,res,next);

  });

}