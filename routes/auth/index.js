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
    res.render('./auth/provider_list.ejs');
  });

  if (config.identity_providers.facebook.enabled) {
    logger.info('Facebook authentication enabled');
    require('./facebook')(app);
  }

  if (config.identity_providers.github.enabled) {
    logger.info('Github authentication enabled');
    require('./github')(app);
  }

  if (config.identity_providers.local.enabled) {
    logger.info('Local authentication enabled');
    require('./local')(app);
  }
};
