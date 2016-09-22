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
        done(null, false, req.flash('loginMessage', 'No user found.'));
        return;
      }

      user.verifyPassword(password).then(function(isMatch) {
        if (isMatch) {
          done(null, user);
        } else {
          done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
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

var localSignupStrategyCallback = function(req, username, password, done) {

    if (req.recaptcha.error) {
        done(null, false, req.flash('signupMessage', 'Something went wrong with the reCAPTCHA'));
        return;
    }

    db.User.find({ where: { email: req.body.email} })
        .then (function (user){
            if (user){
                done(null, false, req.flash('signupMessage', 'That email is already taken'));
            } else {
                db.sequelize.sync().then(function() {
                    var user = db.User.create({
                        email: req.body.email,
                    }).then(function (user) {
                        user.setPassword(req.body.password);
                        done(null, user);
                    },
                    function(err){
                        done(err);
                    });
                });
        }
    }, function(error) {
            done(error);
        });

};

var localStrategyConf = {
    // by default, local strategy uses username and password, we will override with email
    usernameField : 'email',
    passwordField : 'password',
    passReqToCallback : true // allows us to pass back the entire request to the callback
};

// Google reCAPTCHA
recaptcha.init(config.recaptcha.site_key, config.recaptcha.secret_key);

passport.use('local',new LocalStrategy(localStrategyConf,localStrategyCallback));

passport.use('local-signup', new LocalStrategy(localStrategyConf, localSignupStrategyCallback));

module.exports = function(app, options) {

  app.get('/auth/local', function(req, res) {
      res.render('login.ejs', {message: req.flash('loginMessage')});
  });

  app.get('/signup', function(req, res) {
      res.render('signup.ejs', {email: req.query.email, message: req.flash('signupMessage')});
  });

  app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });


  app.post('/login', passport.authenticate('local', {
    failureRedirect: '/auth/local',
    failureFlash: true
  }), function (req, res, next) {
    var redirectUri = req.session.auth_origin;
    delete req.session.auth_origin;

    if (redirectUri) {
      return res.redirect(redirectUri);
    }

    requestHelper.redirect(res, '/');
  });

  app.post('/signup', recaptcha.middleware.verify , passport.authenticate('local-signup', {
      failureRedirect: '/signup',
      successRedirect: '/auth/local',
      failureFlash : true
  }));
};
