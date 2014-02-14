"use strict";

var requestHelper = require('../request-helper');

describe('GET /status', function() {
  before(function(done) {
    requestHelper.sendRequest(this, '/status', null, done);
  });

  it('should return status 200', function() {
    expect(this.res.statusCode).to.equal(200);
  });

  it('should respond with plain text', function() {
    expect(this.res.headers["content-type"]).to.equal("text/plain; charset=utf-8");
  });

  it('should respond with status message', function() {
    expect(this.res.text).to.equal("Authentication Provider up and running\n");
  });
});
