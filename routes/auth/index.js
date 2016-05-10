"use strict";

var db            = require('../../models');
var config        = require('../../config');
var authHelper    = require('../../lib/auth-helper');
var requestHelper = require('../../lib/request-helper');

module.exports = function(router) {
  router.get('/logout', function(req, res) {
    req.logout();
    requestHelper.redirect(res, '/');
  });

  router.get('/protected', authHelper.ensureAuthenticated, function(req, res) {
    res.send('protected');
  });

  router.get('/auth', function(req, res) {
    var autoIdpRedirect = config.auto_idp_redirect;

    if (authHelper.validRedirect(autoIdpRedirect, config.identity_providers)) {
      requestHelper.redirect(res, '/auth/' + autoIdpRedirect);
      return;
    }

    res.render('./auth/provider_list.ejs');
  });

  authHelper.loadIdentityProviders(router, config.identity_providers);
};
