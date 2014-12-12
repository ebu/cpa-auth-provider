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

module.exports = require(filename);
