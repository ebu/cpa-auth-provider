"use strict";

var requestHelper = require('./request-helper');

var jsonSchema = require('jsonschema');

/**
 * Returns an express middleware function that validates the request body
 * against the given JSON schema.
 */

var validateJson = function(schema, field) {
  return function(req, res, next) {
    if (!field) {
      field = 'body';
    }

    if (field === 'body' && !requestHelper.isContentType(req, 'application/json')) {
      res.sendInvalidRequest("Invalid content type: " + req.get('Content-Type'));
      return;
    }

    var result = jsonSchema.validate(req[field], schema);

    if (result.errors.length > 0) {
      res.sendInvalidRequest(result.toString());
      return;
    }

    next();
  };
};

module.exports = validateJson;
