"use strict";

var cors = require('cors');

var config = require('../config');

var logger = require('./logger');

module.exports = cors({
    origin: function (origin, callback) {

        var isAllowed = config.cors.allowed_domains.indexOf(origin) !== -1;
        logger.debug("Origin is " +  origin + " Allowed domains " + config.cors.allowed_domains + "isAllowed" + isAllowed);

        callback(null, isAllowed);
    },
    methods: 'POST,GET', // 'GET,PUT,POST,DELETE,OPTIONS'
    credentials: true,
    allowedHeaders: 'Content-Type,Authorization,Content-Length,X-Requested-With'
});
