"use strict";

var db            = require('../../models');
var config        = require('../../config');
var requestHelper = require('../../lib/request-helper');

var bcrypt        = require('bcrypt');
var passport      = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var recaptcha     = require('express-recaptcha');

var jwt              = require('jwt-simple');
var JwtStrategy      = require('passport-jwt').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;

// Google reCAPTCHA
recaptcha.init(config.recaptcha.site_key, config.recaptcha.secret_key);

var opts = {};
opts.secretOrKey = config.jwtSecret;
passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
    db.User.find({ where: {id: jwt_payload.id}})
        .then( function(user) {
            if (user) {
                done(null, user);
            } else {
                done(null, false);
            }
        });
}));

var getToken = function (headers) {
    if (headers && headers.authorization) {
        var parted = headers.authorization.split(' ');
        if (parted.length === 2) {
            return parted[1];
        } else {
            return null;
        }
    } else {
        return null;
    }
};


module.exports = function(app, options) {
  app.post('/api/local/signup', recaptcha.middleware.verify, function(req,res) {

      if (req.recaptcha.error) {
          res.json({success: false, msg: 'Something went wrong with the reCAPTCHA'});
          return;
      }

      if (!req.body.email || !req.body.password) {
          res.json({success: false, msg: 'Please pass email and password.'});
      } else {

          process.nextTick(function() {

              db.User.find({where: {email: req.body.email}})
                  .then (function (user) {
                      if (user) {
                          return res.json({success: false, msg: 'email already exists.'});
                      } else {
                          db.sequelize.sync().then(function () {
                              var user = db.User.create({
                                  email: req.body.email,
                              }).then(function (user) {
                                      user.setPassword(req.body.password);
                                      res.json({success: true, msg: 'Successfully created new user.'});
                                  },
                                  function (err) {
                                      res.json({success: false, msg: 'Oops, something went wrong :' + err});
                                  });
                          });
                      }
                  }, function (error) {
                      res.json({success: false, msg: 'Oops, something went wrong :' + error});
                  });

          });
      }
  });

  app.post('/api/local/authenticate', function (req, res) {
      db.User.find({ where: { email: req.body.email} })
          .then(function(user) {
                  if (!user) {
                      res.json({success: false, msg: 'User not found'});
                      return;
                  }

                  user.verifyPassword(req.body.password).then(function(isMatch) {
                          if (isMatch) {
                              // if user is found and password is right create a token
                              var token = jwt.encode(user, config.jwtSecret);
                              // return the information including token as JSON
                              res.json({success: true, token: 'JWT ' + token});
                          } else {
                              res.json({success: false, msg: 'Wrong password'});
                              return;
                          }
                      },
                      function(err) {
                          res.json({success: false, msg: 'Oops, something went wrong :' + err});
                      });
              },
              function(error) {
                  res.json({success: false, msg: 'Oops, something went wrong :' + error});
              });
  });

  app.get('/api/local/info', passport.authenticate('jwt', { session: false}), function(req, res) {
      var token = getToken(req.headers);
      if (token) {
          var decoded = jwt.decode(token, config.jwtSecret);
          db.User.find({ where: {
              email: decoded.email
          }}).then(function(user) {
              if (!user) {
                  return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
              } else {
                  res.json({
                      success: true,
                      user: {
                          email:        user.email,
                          display_name: user.display_name,
                          photo_url:    user.photo_url,
                          admin:        user.admin
                      },
                      token: token

                  });
              }
          });
      } else {
          return res.status(403).send({success: false, msg: 'No token provided.'});
      }
  });
};

