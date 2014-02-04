"use strict";

module.exports = {
  isContentType: function(req, contentType) {
    var actualContentType = req.get('Content-Type');

    return actualContentType && actualContentType.indexOf(contentType) !== -1;
  }
};
