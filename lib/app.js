"use strict";

/**
 * Module dependencies.
 */

var express  = require('express');
var passport = require('passport');
var path     = require('path');
var winston  = require('winston');

var config    = require('../config.js');
var db        = require('../models');
var appHelper = require('./app-helper');

// Server
var app = express();
app.set('port', process.env.PORT || 3000);

// Templates
app.set('views', path.join(__dirname, '..', 'views'));
app.set('view engine', 'ejs');

// Express
app.use(express.favicon());

var logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      colorize: true,
      level:    'debug'
    })
  ],

  // Default winston log levels are: silly, verbose, info, warn, debug,
  // error. We want debug to be lower level than info and warn, so set
  // custom log levels here:

  levels: {
    debug: 0,
    info:  1,
    warn:  2,
    error: 3
  }
});

app.set('logger', logger);

// Set up express web server logging via winston, but don't enable logging
// when running unit tests.

if (process.env.NODE_ENV !== "test") {
  var stream = {
    write: function(message, encoding) {
      return logger.info(message.trimRight());
    }
  };

  app.use(express.logger({ stream: stream, format: 'dev' }));
}

app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());

// Passport
app.use(express.cookieParser());
app.use(express.session({ secret: 'LKASDMjnr234n90lasndfsadf' }));
app.use(passport.initialize());
app.use(passport.session());

appHelper.initPassportSerialization(passport);

if (config.enableCORS) {
  app.use(appHelper.enableCORS);
}

// Templates
// Add user to templates scope
app.use(appHelper.templateVariables);

// Routes
app.use(app.router);
app.use(express.static(path.join(__dirname, '..', 'public')));

require('../routes/status')(app);
require('../routes/index')(app);
require('../routes/authorization')(app);
require('../routes/registration')(app);
require('../routes/device-profile')(app);
require('../routes/auth/index')(app);

// development only
if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}

db.sequelize
  .authenticate()
  .complete(function(err) {
    if (err) {
      logger.error('Unable to connect to the database.');
    }
    else {
      if (process.env.NODE_ENV !== 'test') {
        logger.info('Database connection has been established successfully.');
      }
    }
  });

module.exports = app;
