"use strict";

var db = require('../models');

var verify = {};

/**
 * Remove "Bearer " if headerLine contains it. otherwise return the original headerLine
 *
 * @param headerLine
 * @returns {*}
 */

var extractToken = function(headerLine) {
  if (headerLine.indexOf("Bearer ") === 0) {
    return headerLine.substr(7);
  } else {
    return headerLine;
  }
};


/**
 * Check if the access token is valid
 *
 * @param requestToken
 * @param clientId
 * @param callback
 *  Returns if authenticated via : callback(err, accessToken, client)
 *  if not, accessToken === false and client === false
 */

verify.accessToken = function(requestToken, clientId, callback) {

  requestToken = extractToken(requestToken);

  db.AccessToken.find(requestToken).complete(function(err, accessToken) {
    if (err || !accessToken) {
      callback(err, null, null);
    } else {

      accessToken.getClient({ where: { 'id' : clientId } }).complete(function(err, client) {
        if (err || !client) {
          callback(err, null, null);
        } else {
          callback(err, accessToken, client);
        }
      });

    }
  });

};


module.exports = verify;