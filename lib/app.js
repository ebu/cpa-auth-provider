/**
 * Module dependencies.
 */

var config = require('../config.js');
var express = require('express');
var routes = require('../routes');
var path = require('path');


// Server
var app = express();
app.set('port', process.env.PORT || 3000);


// Templating
app.set('views', path.join(__dirname, '..', 'views'));
app.set('view engine', 'ejs');


// Express
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());


// Routes
app.use(app.router);
app.use(express.static(path.join(__dirname, '..', 'public')));

var indexRoutes = require('../routes/index.js')(app, {});
var clientRegistrationRoutes = require('../routes/registration.js')(app, {});

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}


module.exports = app;
