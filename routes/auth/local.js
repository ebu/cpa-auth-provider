"use strict";

var db            = require('../../models');
var config        = require('../../config');
var requestHelper = require('../../lib/request-helper');

var bcrypt        = require('bcrypt');
var passport      = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var recaptcha     = require('express-recaptcha');

var localStrategyCallback = function(req, username, password, done) {
  db.User.find({ where: { email: username} })
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

// Google reCAPTCHA
recaptcha.init(config.recaptcha.site_key, config.recaptcha.secret_key);

passport.use('local',new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },localStrategyCallback));

module.exports = function(app, options) {

  app.get('/auth/local', function(req, res) {
      res.render('login.ejs');
  });

  app.get('/signup', function(req, res) {
      res.render('signup.ejs', {email: req.query.email});
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
  
      // process the signup form
  app.post('/signup', recaptcha.middleware.verify , function(req, res) {

    if (req.recaptcha.error) {
      requestHelper.redirect(res, '/signup?error='+ req.recaptcha.error);
      return;
    }

    if (req.body.password != req.body.password2){

        requestHelper.redirect(res, '/signup?error=passords_dont_match&email='+req.body.email);

    } else {

      db.User.find({ where: { email: req.body.email} }).then (function (user){
        if (user){
          console.log('login found : ' + user.get('email'));
          requestHelper.redirect(res, '/signup?error=login_already_exists&email='+req.body.email);
        } else {
          db.sequelize.sync().then(function() {
          var user = db.User.create({
              email: req.body.email,
            }).then(function (user) {
              return user.setPassword(req.body.password);
            });
          })
          requestHelper.redirect(res, '/auth/local');
        }
      });
    }

  });
};
