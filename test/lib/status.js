"use strict";

var sendRequest = function(context, path, done) {
  request.get(path).end(function(err, res) {
    context.res = res;
    done(err);
  });
};

describe('GET /', function() {
  beforeEach(function(done) {
    sendRequest(this, '/', done);
  });

  context('with a signed in user', function() {
    it('should redirect to /auth', function() {
      expect(this.res.statusCode).to.equal(302);
      // TODO: verify redirect
    });
  });

  context('with no signed in user', function() {
    it('should redirect to /verify', function() {
      expect(this.res.statusCode).to.equal(302);
      // TODO: verify redirect
    });
  });
});

describe('GET /status', function() {
  before(function(done) {
    sendRequest(this, '/status', done);
  });

  it('should return status 200', function() {
    expect(this.res.statusCode).to.equal(200);
  });

  it('should respond with plain text', function() {
    expect(this.res.headers["content-type"]).to.equal("text/plain; charset=utf-8");
  });

  it('should respond with status message', function() {
    expect(this.res.text).to.equal("Authentication Provider up and running");
  });
});
