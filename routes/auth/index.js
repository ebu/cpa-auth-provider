"use strict";

var db = require('../../models');
var config = require('../../config.js');
var authHelper = require('../../lib/auth-helper');

module.exports = function (app, options) {

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

  var authLocalRoutes = require('./local.js')(app, options);
  var authFacebookRoutes = require('./facebook.js')(app, options);
};

