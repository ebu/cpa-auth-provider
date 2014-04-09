"use strict";

module.exports = function(logger) {

  var sendErrorResponse = function(status, error, description) {
    logger.debug(description);
    this.send(status, { error: error, error_description: description });
  };

  var sendInvalidRequest = function(description) {
    this.sendErrorResponse(400, 'invalid_request', description);
  };

  var sendInvalidClient = function(description) {
    this.sendErrorResponse(400, 'invalid_client', description);
  };

  var sendUnauthorized = function(description) {
    this.sendErrorResponse(401, 'unauthorized', description);
  };

  var responseHelper = function(req, res, next) {
    res.sendErrorResponse  = sendErrorResponse.bind(res);
    res.sendInvalidClient  = sendInvalidClient.bind(res);
    res.sendInvalidRequest = sendInvalidRequest.bind(res);
    res.sendUnauthorized   = sendUnauthorized.bind(res);
    next();
  };

  return responseHelper;
};
