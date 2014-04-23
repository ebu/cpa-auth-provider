"use strict";

var requestHelper = require('./request-helper');

var jsonSchema = require('jsonschema');

/**
 * Validates a data object against a JSON schema
 *
 * @param object {Object|Array} The data to validate
 * @param schema {Object} The schema to validate against
 *
 * @returns {String|null} <code>null</code> if the object is valid, or
 *   a String containing an error message if invalid
 */

var validateJson = function(object, schema) {
  var result = jsonSchema.validate(object, schema);

  if (result.errors.length > 0) {
    return result.toString();
  }

  return null;
};

/**
 * Returns an express middleware function that validates the request body
 * against the given JSON schema
 *
 * @param schema {Object} The schema to validate against
 *
 * @returns {Function} Express middleware function
 */

var validateJsonMiddleware = function(schema) {
  return function(req, res, next) {
    if (!requestHelper.isContentType(req, 'application/json')) {
      res.sendInvalidRequest("Invalid content type: " + req.get('Content-Type'));
      return;
    }

    var error = validateJson(req.body, schema);

    if (error) {
      res.sendInvalidRequest(error);
      return;
    }

    next();
  };
};

module.exports = {
  validate: validateJson,
  middleware: validateJsonMiddleware
};
