"use strict";

var db = require('../../models');
var config = require('../../config.js');
var authHelper = require('../../lib/auth-helper');

module.exports = function(app) {
  app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });

  app.get('/protected',
    authHelper.ensureAuthenticated,
    function(req, res) {
      res.send('protected');
    });

  app.get('/auth', function(req, res){
    res.render('./auth/provider_list.ejs');
  });

  if (config.identity_providers.facebook.enabled) {
    console.log('Facebook authentication enabled');
    var authFacebookRoutes = require('./facebook.js')(app, options);
  }
  if (config.identity_providers.github.enabled) {
    console.log('Github authentication enabled');
    var authGithubRoutes = require('./github.js')(app, options);
  }

};

