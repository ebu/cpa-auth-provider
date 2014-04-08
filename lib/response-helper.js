"use strict";

module.exports = function(logger) {

  var sendInvalidRequest = function(description) {
    logger.debug(description);
    this.send(400, { error: 'invalid_request', error_description: description });
  };

  var sendInvalidClient = function(description) {
    logger.debug(description);
    this.send(400, { error: 'invalid_client', error_description: description });
  };

  var sendUnauthorized = function(description) {
    logger.debug(description);
    this.send(401, { error: 'unauthorized', error_description: description });
  };

  var responseHelper = function(req, res, next) {
    res.sendInvalidClient  = sendInvalidClient.bind(res);
    res.sendInvalidRequest = sendInvalidRequest.bind(res);
    res.sendUnauthorized   = sendUnauthorized.bind(res);
    next();
  };

  return responseHelper;
};
