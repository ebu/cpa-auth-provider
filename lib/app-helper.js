"use strict";

var authHelper = require('./auth-helper');

var appHelper = {};

appHelper.templateVariables = function(req, res, next){

  // Add list of enabled idP
  res.locals.identity_providers = authHelper.getEnabledIdentityProviders();

  // Add user object to the template scope if authenticated
  res.locals.user = authHelper.getAuthenticatedUser(req);

  next();
};


appHelper.initPassportSerialization = function(passport){
  // Init passport
  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(function(obj, done) {
    done(null, obj);
  });
};

module.exports = appHelper;
