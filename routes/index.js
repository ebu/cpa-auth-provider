"use strict";

var db            = require('../models');
var requestHelper = require('../lib/request-helper');
var authHelper    = require('../lib/auth-helper');
var querystring   = require('querystring');

/*
 * GET home page.
 */

module.exports = function(app) {
  app.get('/', authHelper.authenticateFirst, function(req, res) {
    // Required by mobile flow
    var query = "";
    if (req.query.redirect_uri && req.query.user_code) {
      query = '?' + querystring.stringify(req.query);
    }

    requestHelper.redirect(res, '/verify' + query);
  });
};
