"use strict";

/**
 * Returns an Express middleware function that verifies the service provider's
 * access token.
 */

module.exports = function(config, db, logger) {

  /**
   * Returns the access token in the HTTP request, or null if no access token
   * is present.
   */

  var getAccessToken = function(req) {
    var accessToken = null;

    var auth = req.headers.authorization;

    if (auth) {
      var match = auth.match(/^Bearer (\S+)$/);

      if (match) {
        accessToken = match[1];
      }
    }

    return accessToken;
  };

  /**
   * Returns the scope that matches the given access token.
   */

  var checkIsAuthorized = function(accessToken, callback) {
    db.Scope.find({ where: { access_token: accessToken }})
      .complete(function(err, scope) {
        if (err) {
          callback(err);
          return;
        }

        callback(null, scope);
      });
  };

  /**
   * Express middleware function that verifies the service provider's access
   * token. If the token is not valid, an error response is returned. If the
   * token is valid, this function adds service provider information to the
   * request, for use in subsequent request handler functions.
   */

  var protectedResourceHandler = function(req, res, next) {
    var accessToken = null;

    if (req.headers.authorization) {
      accessToken = getAccessToken(req);

      if (!accessToken) {
        res.json(400, {
          error: 'invalid_request',
          error_description: 'Missing access token'
        });

        return;
      }
    }
    else {
      res.sendUnauthorized();
      return;
    }

    checkIsAuthorized(accessToken, function(err, scope) {
      if (err) {
        next(err);
        return;
      }

      if (!scope) {
        res.sendUnauthorized();
        return;
      }

      req.scope = scope;
      next();
    });
  };

  return protectedResourceHandler;
};
