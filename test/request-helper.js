"use strict";

var cheerio = require('cheerio');

module.exports = {
  sendRequest: function(context, path, opts, done) {
    opts = opts || {};

    var method = opts.method || 'get';

    if (method === 'delete') {
      method = 'del';
    }

    var req = request[method](path);

    if (opts.cookie) {
      req.set('cookie', opts.cookie);
    }

    if (opts.accessToken) {
      var tokenType = opts.tokenType || 'Bearer';

      req.set('Authorization', tokenType + ' ' + opts.accessToken);
    }

    if (opts.data) {
      // If 'form', sets Content-Type: application/x-www-form-urlencoded.
      var type = opts.type || 'json';
      req.type(type);

      req.send(opts.data);
    }

    req.end(function(err, res) {
      context.res = res;

      if (opts.parseDOM) {
        context.$ = cheerio.load(context.res.text);
      }

      done(err);
    });
  }
};
