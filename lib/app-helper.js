"use strict";

var appHelper = {};

appHelper.templateVariables = function(req, res, next){
  if(req.isAuthenticated()){
    res.locals.user = req.user;
  } else {
    res.locals.user = null;
  }
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
