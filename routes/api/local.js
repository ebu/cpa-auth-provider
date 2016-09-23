"use strict";

var db            = require('../../models');
var config        = require('../../config');
var requestHelper = require('../../lib/request-helper');

var bcrypt        = require('bcrypt');
var passport      = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var recaptcha     = require('express-recaptcha');

var JwtStrategy      = require('passport-jwt').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;

// Google reCAPTCHA
recaptcha.init(config.recaptcha.site_key, config.recaptcha.secret_key);

var opts = {};
opts.secretOrKey = config.jwtSecret;
passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
    db.User.findOne({id: jwt_payload.id}, function(err, user) {
        if (err) {
            return done(err, false);
        }
        if (user) {
            done(null, user);
        } else {
            done(null, false);
        }
    });
}));


module.exports = function(app, options) {
  app.post('/api/local/signup', recaptcha.middleware.verify, function(req,res) {

      if (req.recaptcha.error) {
          res.json({success: false, msg: 'Something went wrong with the reCAPTCHA'});
          return;
      }

      if (!req.body.email || !req.body.password) {
          res.json({success: false, msg: 'Please pass email and password.'});
      } else {

          db.User.find({ where: { email: req.body.email} })
              .then (function (user){
                  if (user){
                      return res.json({success: false, msg: 'email already exists.'});
                  } else {
                      db.sequelize.sync().then(function() {
                          var user = db.User.create({
                              email: req.body.email,
                          }).then(function (user) {
                                  user.setPassword(req.body.password);
                                  res.json({success: true, msg: 'Successfully created new user.'});
                              },
                              function(err){
                                  res.json({success: false, msg: 'Oops, something went wrong :' + err});
                              });
                      });
                  }
              }, function(error) {
                  res.json({success: false, msg: 'Oops, something went wrong :' + error});
              });
      }
  });
};

