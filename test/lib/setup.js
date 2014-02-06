"use strict";

var db = require('../../models');

/**
 * Global test setup, run before any individual tests are run. This
 * creates the schema in the in-memory SQLite database.
 */

before(function(done) {
  db.sequelize.sync({ force: true }).complete(function(err) {
    done(err);
  });
});
