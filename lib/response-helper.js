"use strict";

module.exports = function(logger) {

  /**
   * Sends an error HTTP response, with the given status code and a response
   * body containing a JSON object with the error identifier and description.
   * If redirectUri is provided, the error is send in the query component
   * of the redirection URI using the "application/x-www-form-urlencoded" format.
   * See [RFC6749, 4.1.2.1.  Error Response]
   */

  var sendErrorResponse = function(status, error, description) {
    logger.debug(description);
    this.status(status).send({ error: error, error_description: description });
  };

  var redirectError = function(redirectUri, error, description, state) {
    logger.debug(description);
    var destinationUri = redirectUri + '?error=' + encodeURI(error);
    if (description && description !== '') {
      destinationUri += '&error_description=' + encodeURI(description);
    }
    if (state && state !== '') {
      destinationUri += '&state=' + encodeURI(state);
    }
    this.redirect(destinationUri);
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
