"use strict";

var winston = require('winston');

var logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      colorize: true,
      level:    'debug'
    })
  ],

  // Default winston log levels are: silly, verbose, info, warn, debug,
  // error. We want debug to be lower level than info and warn, so set
  // custom log levels here:

  levels: {
    debug: 0,
    info:  1,
    warn:  2,
    error: 3
  }
});

module.exports = logger;
