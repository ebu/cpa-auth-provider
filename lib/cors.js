"use strict";

var cors = require('cors');

var config = require('../config');

var allowedDomains = {};

if (config.cors && config.cors.enabled && config.cors.allowed_domains) {
  config.cors.allowed_domains.forEach(function(domain) {
    allowedDomains[domain] = 1;
  });
}

var enableCORS = function() {
  return cors({
    origin: function(origin, callback) {
      var isAllowed = allowedDomains.hasOwnProperty(origin);
      callback(null, isAllowed);
    },
    methods: 'POST', // 'GET,PUT,POST,DELETE,OPTIONS'
    credentials: true,
    allowedHeaders: 'Content-Type,Authorization,Content-Length,X-Requested-With'
  });
};

module.exports = enableCORS;
