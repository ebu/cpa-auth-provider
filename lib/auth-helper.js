"use strict";

var authHelper = {};

authHelper.ensureAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};

authHelper.getAuthenticatedUser = function(req) {
  if(req.isAuthenticated()){
    return req.user;
  }
  return null;
};

authHelper.getEnabledIdentityProviders = function(){
  var idp_config = require('../config').identity_providers;

  var idp_list = {};
  for (var idp in idp_config){
    if(idp_config[idp].enabled){
      idp_list[idp] = true;
    }
  }

  return idp_list;
};

module.exports = authHelper;
