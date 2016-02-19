"use strict";

var url = require('url');

module.exports = {
  addQueryParameter: function(uri, name, value) {
    var u = url.parse(uri, true);
    if (!u.query) {
      u.query = {};
    }
    u.query[name] = value;
    u.search = null;

    return url.format(u);
  }
};
