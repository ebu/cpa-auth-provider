"use strict";

// Module dependencies
var express  = require('express');
require('express-namespace');

var passport = require('passport');
var path     = require('path');

var config    = require('../config');
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

// Set up express web server logging via winston, but don't enable logging
// when running unit tests.

var logger;

if (process.env.NODE_ENV === "test") {
  logger = require('./null-logger');
}
else {
  logger = require('./logger');

  var stream = {
    write: function(message, encoding) {
      return logger.info(message.trimRight());
    }
  };

  app.use(express.logger({ stream: stream, format: 'dev' }));
}

app.set('logger', logger);

app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());

// Passport
app.use(express.cookieParser());
app.use(express.session(appHelper.sessionOptions(express)));
app.use(passport.initialize());
app.use(passport.session());

appHelper.initPassportSerialization(passport);

// Templates
// Add user to templates scope
app.use(appHelper.templateVariables);

app.use(require('./response-helper')(logger));

// Routes

var urlPrefix = config.urlPrefix || '';

app.use(urlPrefix, express.static(path.join(__dirname, '..', 'public')));

app.use(require('./url-prefix')(urlPrefix));

app.use(app.router);

app.namespace(urlPrefix, function() {
  require('../routes/access-token')(app);
  require('../routes/association')(app);
  require('../routes/authorization')(app);
  require('../routes/authorize')(app);
  require('../routes/index')(app);
  require('../routes/registration')(app);
  require('../routes/status')(app);
  require('../routes/verification')(app);
  require('../routes/auth/index')(app);
  require('../routes/user/index')(app);
});

if (app.get('env') !== 'test') {
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
