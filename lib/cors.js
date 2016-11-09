"use strict";

var cors = require('cors');

var config = require('../config');

module.exports = cors({
  origin: function(origin, callback) {
    var isAllowed = config.cors.allowed_domains.indexOf(origin) !== -1;

    callback(null, isAllowed);
  },
  methods: 'POST,GET', // 'GET,PUT,POST,DELETE,OPTIONS'
  credentials: true,
  allowedHeaders: 'Content-Type,Authorization,Content-Length,X-Requested-With'
});
