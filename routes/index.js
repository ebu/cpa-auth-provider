"use strict";

var db            = require('../models');
var requestHelper = require('../lib/request-helper');

/*
 * GET home page.
 */

module.exports = function(app) {
  app.get('/', function(req, res) {
    if (req.isAuthenticated()) {
      requestHelper.redirect(res, '/verify');
    }
    else {
      requestHelper.redirect(res, '/auth');
    }
  });
};
