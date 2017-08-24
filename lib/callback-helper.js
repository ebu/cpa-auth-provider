"use strict";

var config = require('../config');
var path = require('path');

module.exports = {

    getURL: function (urlPath) {
        var baseUrl = config.baseUrl;
        var urlPrefix = config.urlPrefix || '.';
        urlPath = urlPath || '';

        if (baseUrl.length > 0 && baseUrl[baseUrl.length - 1] === '/') {
            baseUrl = baseUrl.slice(0, baseUrl.length - 1);
        }

        if (urlPath.length > 0 && urlPath[0] === '/') {
            urlPath = urlPath.slice(1);
        }

        return baseUrl + path.join('/', urlPrefix, urlPath);
    }

};
