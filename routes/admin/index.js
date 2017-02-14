'use strict';

var db            = require('../../models');
var authHelper    = require('../../lib/auth-helper');
var logger        = require('../../lib/logger');
var requestHelper = require('../../lib/request-helper');
var generate      = require('../../lib/generate');
var role          = require('../../lib/role');
var permission    = require('../../lib/permission');

module.exports = function(router) {
  router.get('/admin', [authHelper.authenticateFirst, role.can(permission.ADMIN_PERMISSION)], function(req, res) {
    res.render('./admin/index.ejs');
  });

  router.get('/admin/domains', [authHelper.authenticateFirst, role.can(permission.ADMIN_PERMISSION)], function(req, res) {
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

  router.get('/admin/domains/add', [authHelper.authenticateFirst, role.can(permission.ADMIN_PERMISSION)], function(req, res) {
    res.render('./admin/add_domain.ejs');
  });

  router.post('/admin/domains', [authHelper.authenticateFirst, role.can(permission.ADMIN_PERMISSION)], function(req, res, next) {
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
