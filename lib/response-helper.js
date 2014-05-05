"use strict";

module.exports = function(logger) {

  /**
   * Sends an error HTTP response, with the given status code and a response
   * body containing a JSON object with the error identifier and description.
   */

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

  var redirectError = function(redirectUri, error, errorDescription, state) {

    var destinationUri = redirectUri + '?error=' + encodeURI(error);
    if (errorDescription && errorDescription !== '') {
      destinationUri += '&error_description=' + encodeURI(errorDescription);
    }
    if (state && state !== '') {
      destinationUri += '&state=' + encodeURI(state);
    }

    this.redirect(destinationUri);
  };

  /**
   * Expess middleware function that adds helper methods to the response
   * object (res), for sending error repsonses.
   */

  var responseHelper = function(req, res, next) {
    res.redirectError  = redirectError.bind(res);
    res.sendErrorResponse  = sendErrorResponse.bind(res);
    res.sendInvalidClient  = sendInvalidClient.bind(res);
    res.sendInvalidRequest = sendInvalidRequest.bind(res);
    res.sendUnauthorized   = sendUnauthorized.bind(res);
    next();
  };

  return responseHelper;
};
