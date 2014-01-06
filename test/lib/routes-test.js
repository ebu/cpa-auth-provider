"use strict";

var app = require('../../lib/app');

describe('GET /', function() {
  var self = this;

  beforeEach(function(done) {
    request(app).get('/').end(function(err, res) {
      self.err = err;
      self.res = res;
      done();
    });
  });

  it("should have no error", function() {
    expect(self.err).to.equal(null);
  });

  it('respond with something', function() {
    expect(self.res.statusCode).to.equal(200);
  });
});

describe('GET /status', function() {
  var self = this;

  before(function(done) {
    request(app)
      .get('/status')
      .end(function(err, res) {
        self.err = err;
        self.res = res;
        done();
      });
  });

  it("should have no error", function() {
    expect(self.err).to.equal(null);
  });

  it('should return status 200', function() {
    expect(self.res.statusCode).to.equal(200);
  });

  it('should respond with plain text', function() {
    expect(self.res.headers["content-type"]).to.equal("text/plain; charset=utf-8");
  });

  it('should respond with status message', function() {
    expect(self.res.text).to.equal("Authentication Provider up and running");
  });
});
