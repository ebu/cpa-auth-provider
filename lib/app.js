"use strict";

// Module dependencies
var express = require('express');

// Express middleware
var favicon        = require('serve-favicon');
var bodyParser     = require('body-parser');
var methodOverride = require('method-override');
var cookieParser   = require('cookie-parser');
var session        = require('express-session');
var morgan         = require('morgan');
var serveStatic    = require('serve-static');
var errorHandler   = require('errorhandler');

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

app.use(favicon(path.join(__dirname, '..', 'public', 'favicon', 'favicon.ico')));

// Set up express web server logging via winston, but don't enable logging
// when running unit tests.

var logger = require('./logger');

if (process.env.NODE_ENV !== "test") {
  var stream = {
    write: function(message, encoding) {
      return logger.info(message.trimRight());
    }
  };

  app.use(morgan('dev', { stream: stream }));
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride());

// Passport
app.use(cookieParser());
app.use(session(appHelper.sessionOptions(express)));
app.use(passport.initialize());
app.use(passport.session());

appHelper.initPassportSerialization(passport);

// Templates
// Add user to templates scope
app.use(appHelper.templateVariables);

app.use(require('./response-helper')(logger));

// Routes
var urlPrefix = config.urlPrefix || '';

app.use(require('./url-prefix')(urlPrefix));

var router = express.Router();

require('../routes/access-token')(router);
require('../routes/association')(router);
require('../routes/authorization')(router, config);
require('../routes/index')(router);
require('../routes/registration')(router);
require('../routes/status')(router);
require('../routes/verification')(router);
require('../routes/admin/index')(router);
require('../routes/auth/index')(router);
require('../routes/user/index')(router);
require('../routes/user/client')(router);
require('../routes/oauth2/index')(router);
require('../routes/oauth2/profile')(router);

router.use(serveStatic(path.join(__dirname, '..', 'public')));

app.use(urlPrefix, router);

if (app.get('env') !== 'test') {
  app.use(errorHandler());
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
