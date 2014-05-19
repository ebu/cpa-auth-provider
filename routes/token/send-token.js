"use strict";

var sendAccessToken = function(res, token, scope, user) {
  var name = (user !== null) ? user.display_name : "This radio";

  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-cache');

  /**
   * Should reply:
   * user_name
   * token
   * token_type
   * scope
   * domain
   * domain_display_name
   */

  res.send({
    token:             token,
    token_type:        'bearer',
    scope:             scope.name,
    description:       name + " at " + scope.display_name,
    short_description: scope.display_name
  });
};

module.exports = sendAccessToken;
