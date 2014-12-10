"use strict";

var express = require('express');

var createErrorHandler = function(logger) {
  var expressErrorHandler = express.errorHandler();

  var errorHandler = function(err, req, res, next) {
    logger.error(err);
    return expressErrorHandler(err, req, res, next);
  };

  return errorHandler;
};

module.exports = createErrorHandler;
