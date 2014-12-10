"use strict";

var db = require('../../models');

var requestHelper = require('../request-helper');
var config = require('../../config');

/**
 * Global test setup, run before any individual tests are run. This creates the
 * schema in the in-memory SQLite database and sets the URL path prefix.
 */

before(function(done) {
  requestHelper.namespace = config.namespace;

  db.sequelize.sync({ force: true }).complete(function(err) {
    done(err);
  });
});
