"use strict";

var db            = require('../../models');
var config        = require('../../config');
var authHelper    = require('../../lib/auth-helper');
var requestHelper = require('../../lib/request-helper');

module.exports = function(app) {
  var logger = app.get('logger');

  app.get('/logout', function(req, res) {
    req.logout();
    requestHelper.redirect(res, '/');
  });

  app.get('/protected', authHelper.ensureAuthenticated, function(req, res) {
    res.send('protected');
  });

  app.get('/auth', function(req, res) {
    res.render('./auth/provider_list.ejs');
  });

  for (var idp in config.identity_providers) {
    if (config.identity_providers[idp].enabled) {
      logger.info(idp + ' authentication enabled');
      require('./' + idp)(app);
    }
  }
};
