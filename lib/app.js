"use strict";

// Module dependencies
var express = require('express');

// Express middleware
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var morgan = require('morgan');
var serveStatic = require('serve-static');
var errorHandler = require('errorhandler');
var flash = require('connect-flash');
var expressValidator = require('express-validator');

var passport = require('passport');
var path = require('path');
var fs = require('fs');

var config = require('../config');
var db = require('../models');
var appHelper = require('./app-helper');
var permissionHelper = require('./permission-helper');
var permissionName = require('./permission-name');
var i18n = require('i18n');

i18n.configure({
    locales: ['en', 'de', 'fr'],
    directory: __dirname + '/../locales',
    cookie: config.i18n.cookie_name,
    defaultLocale: 'en',
    autoReload: true
});

// Server
var app = express();

// Routes
var urlPrefix = config.urlPrefix || '';

// Google reCAPTCHA
var recaptcha = require('express-recaptcha');
var captcha_options = {
    render: 'explicit',
    hl: i18n.getLocale()
};
recaptcha.init(config.recaptcha.site_key, config.recaptcha.secret_key, captcha_options);

app.set('port', process.env.PORT || 3000);

// Allow EJS access to config and permission
app.locals.config = config;
app.locals.permissionName = permissionName;

//Broadcaster specific layout
app.locals.broadcaster = {
    name: 'default'
};

if (config.broadcasterLayout) {
    app.locals.broadcaster.name = config.broadcasterLayout;
}

// Templates
app.set('views', path.join(__dirname, '..', 'views'));
app.set('view engine', 'ejs');

app.use(favicon(path.join(__dirname, '..', 'public', 'favicon', 'favicon.ico')));

// redirect jquery
app.use(urlPrefix +'/js', express.static(__dirname +  '/../node_modules/jquery/dist'));
app.use(urlPrefix +'/jquery-form', express.static(__dirname + '/../node_modules/jquery-form/dist'));
app.use(urlPrefix +'/cookie', express.static(__dirname + '/../node_modules/js-cookie'));
// redirect bootstrap
app.use(urlPrefix +'/bootstrap', express.static(__dirname + '/../node_modules/bootstrap'));
// redirect bootstrap datepicker
app.use(urlPrefix +'/bootstrap-datepicker', express.static(__dirname + '/../node_modules/bootstrap-datepicker'));
// redirect owast password strength test lib
app.use(urlPrefix +'/owasp', express.static(__dirname + '/../node_modules/owasp-password-strength-test'));
// redirect public files
app.use(urlPrefix +'/assets', express.static(__dirname + '/../public'));

// Set up express web server logging via winston, but don't enable logging
// when running unit tests.

var logger = require('./logger');

if (process.env.NODE_ENV !== "test") {
    var stream = {
        write: function (message, encoding) {
            return logger.info(message.trimRight());
        }
    };

    app.use(morgan('dev', {stream: stream}));
}

app.use(permissionHelper.middleware());

//check permissions
permissionHelper.use(function (req, access) {
    if (typeof req.user.Permission !== "undefined" && req.user.Permission !== null) {
        if (req.user.Permission.label === access) {
            return true;
        }
    }
});

app.use(bodyParser.json());
app.use(expressValidator()); // this line must be immediately after any of the bodyParser middlewares!
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride());

// Passport and i18n
app.use(cookieParser());
// i18n configuration
app.use(i18n.init);
app.use(session(appHelper.sessionOptions(express)));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash()); // use connect-flash or flash messages stored in session

appHelper.initPassportSerialization(passport);

// Templates
// Add user to templates scope
app.use(appHelper.templateVariables);

app.use(require('./response-helper')(logger));



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
require('../routes/auth/oauth-local')(router);
require('../routes/user/index')(router);
require('../routes/user/client')(router);
require('../routes/user/profile')(router);
require('../routes/user/i18n')(router);
require('../routes/oauth2/index')(router);
require('../routes/oauth2/profile')(router);
require('../routes/api/user-profile')(router);

router.use(serveStatic(path.join(__dirname, '..', 'public')));

app.use(urlPrefix, router);

if (app.get('env') !== 'test') {
    app.use(errorHandler());
}

db.sequelize
    .authenticate()
    .then(
        function () {
            if (process.env.NODE_ENV !== 'test') {
                logger.info('Database connection has been established successfully.');
            }
        },
        function (err) {
            logger.error('Unable to connect to the database.', err);
        }
    );

module.exports = app;
