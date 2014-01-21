"use strict";

var requestHelper = require('../request-helper');

describe('GET /', function() {
  beforeEach(function(done) {
    requestHelper.sendRequest(this, '/', done);
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
