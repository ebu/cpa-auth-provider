"use strict";

var requestHelper = require('./request-helper');

var encodings = {
  form: 'application/x-www-form-urlencoded',
  json: 'application/json'
};

/**
 * Returns an express middleware function that checks the Content-Type header
 * in an HTTP request and returns a 400 (invalid request) response if not
 * the expected Content-Type
 *
 * @param {String} encoding Identifies the content type to check for, either
 *   <code>"json"</code> (for application/json) or <code>"form"</code> (for
 *   application/x-www-form-urlencoded)
 * @returns {Function} Express middleware function
 */

var requireEncoding = function(encoding) {
  if (!encodings[encoding]) {
    throw new Error("Invalid encoding: " + encoding);
  }

  return function(req, res, next) {
    if (!requestHelper.isContentType(req, encodings[encoding])) {
      res.sendInvalidRequest("Invalid content type: " + req.get('Content-Type'));
      return;
    }

    next();
  };
};

module.exports = requireEncoding;
