"use strict";

var requestHelper = require('./request-helper');
var authHelper = {};

authHelper.ensureAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.send(401);
};

authHelper.authenticateFirst = function(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.session.auth_origin = req.originalUrl;

  requestHelper.redirect(res, '/auth');
};

authHelper.getAuthenticatedUser = function(req) {
  if(req.isAuthenticated()){
    return req.user;
  }
  return null;
};

authHelper.getEnabledIdentityProviders = function(){
  var idpConfig = require('../config').identity_providers;

  var idpList = {};
  for (var idp in idpConfig){
    if(idpConfig[idp].enabled){
      idpList[idp] = true;
    }
  }

  return idpList;
};

module.exports = authHelper;
