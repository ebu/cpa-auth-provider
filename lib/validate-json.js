"use strict";

var requestHelper = require('./request-helper');

var jsonSchema = require('jsonschema');

/**
 * Returns an express middleware function that validates the request body
 * or the request's field if provided against the given JSON schema.
 *
 * schemas is either an array of object or a single object
 */

var validateJson = function(schemas, field) {
  return function(req, res, next) {
    if (!field) {
      field = 'body';
    }

    if (field === 'body' && !requestHelper.isContentType(req, 'application/json')) {
      res.sendInvalidRequest("Invalid content type: " + req.get('Content-Type'));
      return;
    }

    if (!Array.isArray(schemas)) {
      schemas = [schemas];
    }

    var errors = [];
    schemas.forEach(function (schema) {
      var result = jsonSchema.validate(req[field], schema);

      if (result.errors.length > 0) {
        errors.push(result.toString());
      }
    });

    if (errors.length === schemas.length && errors.length > 0) {
      var errorMessage = '';

      errors.forEach(function(err) {
        errorMessage += err;
      });
      
      return res.sendInvalidRequest(errorMessage);
    }
    next();
  };
};

module.exports = validateJson;
