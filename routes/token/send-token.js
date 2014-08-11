"use strict";

/**
 * Sends an HTTP response with a JSON body containing an access token
 *
 * @param res HTTP response object
 * @param {Boolean} jsonp If <code>true</code>, returns the response
 *   as JSONP. If <code>false</code>, returns JSON
 * @param {AccessToken} token
 * @param {Domain} domain
 * @param {User?} user
 * @param {Scope?} scope
 */

var sendAccessToken = function(res, jsonp, token, domain, user, scope) {
  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-cache');

  // TODO: Scope for webflow

  var response = {
    access_token:        token.token,
    token_type:          'bearer',
    expires_in:          Math.floor(token.getTimeToLive()),
    domain:              domain.name,
    domain_display_name: domain.display_name
  };

  if (token.refresh_token != null) {
    response.refresh_token = token.refresh_token;
  }

  if (scope) {
    response.scope = scope.name;
  }

  if (user) {
    response.user_name = user.display_name;
  }

  if (jsonp) {
    response.http_status = 200;
    res.jsonp(response);
  }
  else {
    res.send(response);
  }
};

module.exports = sendAccessToken;
