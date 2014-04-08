"use strict";

module.exports = function(logger) {

  var sendErrorResponse = function(res, status, error, description) {
    logger.debug(description);
    res.send(status, { error: error, error_description: description });
  };

  var sendInvalidRequest = function(description) {
    sendErrorResponse(this, 400, 'invalid_request', description);
  };

  var sendInvalidClient = function(description) {
    sendErrorResponse(this, 400, 'invalid_client', description);
  };

  var sendUnauthorized = function(description) {
    sendErrorResponse(this, 401, 'unauthorized', description);
  };

  var responseHelper = function(req, res, next) {
    res.sendInvalidClient  = sendInvalidClient.bind(res);
    res.sendInvalidRequest = sendInvalidRequest.bind(res);
    res.sendUnauthorized   = sendUnauthorized.bind(res);
    next();
  };

  return responseHelper;
};
