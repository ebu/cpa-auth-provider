"use strict";

var db            = require('../../models');
var config        = require('../../config');
var requestHelper = require('../../lib/request-helper');

var bcrypt        = require('bcrypt');
var passport      = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var localStrategyCallback = function(req, username, password, done) {
  db.User.find({ where: { provider_uid: username} })
    .then(function(user) {
      if (!user) {
        done('user not found');
        return;
      }

      user.verifyPassword(password).then(function(isMatch) {
        if (isMatch) {
          done(null, user);
        } else {
          done('password does not match');
        }
      },
      function(err) {
        done(err);
      });
    },
    function(error) {
      done(error);
    });
};

passport.use('local',new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },localStrategyCallback));

module.exports = function(app, options) {

  app.get('/auth/local', function(req, res) {
      console.log('toto');
      res.render('login.ejs');
  });

  app.get('/signup', function(req, res) {
      res.render('signup.ejs');
  });

  app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });


  app.post('/login', passport.authenticate('local', {
    failureRedirect: '/auth/local?error=login_failed'
  }), function (req, res, next) {
    var redirectUri = req.session.auth_origin;
    delete req.session.auth_origin;

    if (redirectUri) {
      return res.redirect(redirectUri);
    }

    requestHelper.redirect(res, '/');
  });
};
