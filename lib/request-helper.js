"use strict";

var config = require('../config');

module.exports = {

  /**
   * Returns true if the Content-Type header of the given request matches the
   * given content type.
   */

  isContentType: function(req, contentType) {
    var actualContentType = req.get('Content-Type');

    return actualContentType && actualContentType.indexOf(contentType) !== -1;
  },

  redirect: function(res, path) {
    var urlPrefix = config.urlPrefix || '';
    path = urlPrefix + path;
    return res.redirect(path);
  }
};
