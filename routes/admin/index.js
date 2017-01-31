'use strict';

var db            = require('../../models');
var authHelper    = require('../../lib/auth-helper');
var logger        = require('../../lib/logger');
var requestHelper = require('../../lib/request-helper');
var generate      = require('../../lib/generate');
var ConnectRoles = require('connect-roles');

var roles = new ConnectRoles({
    failureHandler: function (req, res, action) {
        // optional function to customise code that runs when
        // user fails authorisation
        var accept = req.headers.accept || '';
        res.status(403);
        if (~accept.indexOf('html')) {
            res.render('access-denied', {action: action});
        } else {
            res.send('Access Denied - You don\'t have permission to: ' + action);
        }
    }
});

app.use(roles.middleware());

//admin users can access all pages
roles.use(function (req) {
    if (req.user.role === 'admin') {
        return true;
    }
});

module.exports = function(router) {
  router.get('/admin', [authHelper.authenticateFirst, roles.can('access admin page')], function(req, res) {
    res.render('./admin/index.ejs');
  });

  router.get('/admin/domains', authHelper.authenticateFirst, function(req, res) {
    db.Domain.findAll()
      .then(
        function(domains) {
          res.render('./admin/domains.ejs', { domains: domains });
        },
        function (err) {
          res.send(500);
          logger.debug('[Admins][get /admin/domains][error', err, ']');
        });
  });

  router.get('/admin/domains/add', authHelper.authenticateFirst, function(req, res) {
    res.render('./admin/add_domain.ejs');
  });

  router.post('/admin/domains', authHelper.ensureAuthenticated, function(req, res, next) {
    var domain = {
      name:         req.body.name,
      display_name: req.body.display_name,
      access_token: generate.accessToken()
    };

    db.Domain.create(domain)
      .then(
        function(domain) {
          requestHelper.redirect(res, '/admin/domains');
        },
        function(err) {
          // TODO: Report validation errors to the user.
          res.render('./admin/add_domain.ejs');
          logger.debug('[Admins][post /admin/domains][err', err, ']');
        });
  });
};
