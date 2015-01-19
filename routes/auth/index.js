"use strict";

var db = require('../../models');
var config = require('../../config');
var authHelper = require('../../lib/auth-helper');

module.exports = function(app) {
  var logger = app.get('logger');


  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

  app.get('/protected', authHelper.ensureAuthenticated, function(req, res) {
    res.send('protected');
  });

  app.get('/auth', function(req, res) {
    var autoIdpRedirect = config.auto_idp_redirect;

    if (authHelper.validRedirect(autoIdpRedirect, config.identity_providers)) {
        res.redirect('/auth/' + autoIdpRedirect);
        return;
    }

    res.render('./auth/provider_list.ejs');
  });

  authHelper.loadIdentityProviders(app, config.identity_providers);
};
