"use strict";

var db = require('../models');

/*
 * GET home page.
 */

module.exports = function(app, options) {
  app.get('/', function(req, res) {
    if (req.isAuthenticated()) {
      res.redirect('/verify');
    }
    else {
      res.redirect('/auth');
    }
  });
};
