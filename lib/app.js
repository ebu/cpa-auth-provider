/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('../routes');
var user = require('../routes/user');
var path = require('path');
var passport = require('passport');
FacebookStrategy = require('passport-facebook').Strategy;

var app = express();



passport.use(new FacebookStrategy({
    clientID: 1440197182860635,
    clientSecret: "fb75b8e5c1b208e5fbf549a80d256f33",
    callbackURL: "http://vagrant:3000/auth/facebook/callback"
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

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, '..', 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, '..', 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);
app.get('/auth/facebook', passport.authenticate('facebook'));

module.exports = app;
