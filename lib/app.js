"use strict";

/**
 * Module dependencies.
 */

var express = require('express');
var path = require('path');
var winston = require('winston');

var config = require('../config.js');
var db = require('../models');

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

// Don't enable logging when running unit tests (i.e., when NODE_ENV environment
// variable is set to 'test').
if (app.get('env') !== "test") {
  // For express web server logging via winston.
  var stream = {
    write: function(message, encoding) {
      return logger.info(message.trimRight());
    }
  };

  app.use(express.logger({ stream: stream/*, format: 'dev'*/ }));
}

app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());

// Routes
app.use(app.router);
app.use(express.static(path.join(__dirname, '..', 'public')));

require('../routes/status')(app);
var indexRoutes = require('../routes/index.js')(app, {});

// development only
if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}

db.sequelize
  .authenticate()
  .complete(function(err) {
    if (!!err) {
      logger.error('Unable to connect to the database.');
    } else {
      logger.info('Database connection has been established successfully.');
    }
  });

app.on('listening', function() {
  app.get('logger').info('Express server listening on port ' + app.get('port'));
});

module.exports = app;
