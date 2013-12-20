"use strict";

var db = require('../models');

db.sequelize
  .sync({ force: true })
  .complete(function(err) {
    if (!!err) {
      console.log('An error occurred while create the table.');
    } else {
      console.log('Synchronization done.');
    }
  });