"use strict";

var db = require('../models');
var config = require('../config');

var authHelper = require('./auth-helper');

var appHelper = {};

appHelper.sessionOptions = function(express) {
  if(process.env.NODE_ENV === 'test') {
    return { secret: config.session_secret };
  }

  var SQLiteStore = require('connect-sqlite3')(express);
  var store = new SQLiteStore();
  return {
    store: store,
    secret: config.session_secret,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
  };
};


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
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    db.User.find(id).then(function(user) {
      done(null, user);
    },
    function(error) {
      done(error, null);
    });
  });
};

module.exports = appHelper;
