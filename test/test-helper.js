global.chai = require("chai");
global.expect = chai.expect;
global.sinon = require("sinon");

sinonChai = require("sinon-chai");
chai.use(sinonChai);


var app = require('../lib/app');

supertest = require("supertest");
global.request = supertest(app);
