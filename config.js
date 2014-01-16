"use strict";

if(process.env.NODE_ENV === 'test') {
  module.exports = require('./config.test');
} else {
  module.exports = require('./config.local');
}
