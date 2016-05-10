"use strict";

var logger;

if (process.env.NODE_ENV === "test") {
  logger = require('./null-logger');
}
else {
  logger = require('./winston-logger');
}

module.exports = logger;
