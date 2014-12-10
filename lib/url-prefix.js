"use strict";

/**
 * Returns an Express middleware function that adds a <code>link</code> method
 * for use in view code, to generate prefixed URLs
 *
 * @param {String} urlPrefix The URL prefix to use, e.g., <code>/myapp</code>,
 *   or an empty string if no prefix is needed
 *
 * @return {Function}
 *
 * @example
 *
 * // In your application:
 * app.use(require('url-prefix')('/myapp'));
 *
 * // In your EJS view:
 * <a href="<%= link('/login') %>">Log in</a>
 *
 * // Output:
 * <a href="/myapp/login">Log in</a>
 */

var urlPrefix = function(urlPrefix) {
  urlPrefix = urlPrefix || "";

  var createUrl = function(path) {
    return urlPrefix + path;
  };

  return function(req, res, next) {
    res.locals.link = createUrl;
    next();
  };
};

module.exports = urlPrefix;
