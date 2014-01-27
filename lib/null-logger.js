"use strict";

var logger = {
  debug: function() {}
};

logger.info = logger.warn = logger.error = logger.debug;

module.exports = logger;
