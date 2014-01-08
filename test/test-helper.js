

global.chai = require("chai");
global.expect = chai.expect;
global.sinon = require("sinon");

var sinonChai = require("sinon-chai");
chai.use(sinonChai);

process.env.NODE_ENV = 'test';

var app = require('../lib/app');
var supertest = require("supertest");
global.request = supertest(app);
