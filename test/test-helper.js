"use strict";

global.chai    = require("chai");
global.expect  = global.chai.expect;
global.sinon   = require("sinon");
global.cheerio = require('cheerio');

var sinonChai = require("sinon-chai");
global.chai.use(sinonChai);

var db = require('../models');

process.env.NODE_ENV = 'test';

/**
 * Alter the authentication method in order to make authenticated request for tests
 */

var authHelper = require('../lib/auth-helper');

// This token is used to authenticate requests during tests
global.TEST_AUTHORIZATION_TOKEN = "aASLMD123kms_@#MM$#KM";

var isValidTestRequest = function(req) {
  return process.env.NODE_ENV === 'test' &&
         req.headers.authorization === 'Bearer ' + global.TEST_AUTHORIZATION_TOKEN;
};

// Replace authentication function to allow testing using a bearer token
// TODO: Can we use a sinon.stub to do this?

var _ensureAuthenticated = authHelper.ensureAuthenticated;

authHelper.ensureAuthenticated = function(req, res, next) {
    if (isValidTestRequest(req)) {
      db.User.findAll()
        .success(function(users) {
          req.user = (users.length > 0) ? users[0] : null;
          next();
        });
    }
    else {
      _ensureAuthenticated(req, res, next);
    }
};

var app = require('../lib/app');
var supertest = require("supertest");
global.request = supertest(app);
