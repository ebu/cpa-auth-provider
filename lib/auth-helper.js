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

authHelper.loadIdentityProviders = function(app, identityProviders) {
  var logger = app.get('logger');
  var nEnabled = 0;

  for (var idp in identityProviders) {
    if (identityProviders[idp].enabled) {
      logger.info(idp + ' authentication enabled');
      require('../routes/auth/'+idp)(app);
      nEnabled++;
    }
  }

  if (nEnabled === 0) {
    logger.error('No identity provider configured');
  }
};

authHelper.validRedirect = function(idp, idp_array) {
  return idp && idp in idp_array && idp_array[idp].enabled;
};

module.exports = authHelper;
