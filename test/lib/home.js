"use strict";

var requestHelper = require('../request-helper');

describe('GET /', function() {
  context('with a signed in user', function() {
    before(function(done) {
      requestHelper.get(this, '/', true, done);
    });

    it('should redirect to /verify', function() {
      expect(this.res.statusCode).to.equal(302);
      expect(this.res.headers).to.have.property('location');
      // TODO: verify redirect location
    });
  });

  context('with no signed in user', function() {
    before(function(done) {
      requestHelper.get(this, '/', false, done);
    });

    it('should redirect to /auth', function() {
      expect(this.res.statusCode).to.equal(302);
      expect(this.res.headers).to.have.property('location');
      // TODO: verify redirect location
    });
  });
});
