"use strict";

var configFilename = require('./lib/config-filename');

var filename;


if (configFilename.configFilename) {
    filename = configFilename.configFilename;
}
else if (process.env.NODE_ENV === 'test') {
    filename = './config.test';
}
else {
    filename = './config.local';
}

var config = require(filename);

// Append all broadcaster specific configuration to main config
var broadcasterFilename = './config.broadcaster.' + config.broadcaster + '.js';
var broadcasterConfig = require(broadcasterFilename);
for (var attributeName in broadcasterConfig) {
    config[attributeName] = broadcasterConfig[attributeName];
}

module.exports = config;
