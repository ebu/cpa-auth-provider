"use strict";

var requestHelper = require('../request-helper');
var authHelper = require('../../lib/auth-helper');

describe('GET /auth', function() {
  before(function(done) {
    requestHelper.get(this, '/auth', false, done);
  });

  context('When requesting the list of identity provider', function() {
    it('should return a status 200', function() {
      expect(this.res.statusCode).to.equal(200);
    });

    it('should return HTML', function() {
      expect(this.res.headers['content-type']).to.equal('text/html; charset=utf-8');
      expect(this.res.text).to.match(/^<!DOCTYPE html>/);
    });

    describe('the response body', function() {
      it('should display links for every enabled identity provider', function() {
        var enabledIdentityProviders = authHelper.getEnabledIdentityProviders();

        for (var label in enabledIdentityProviders) {
          var link = this.$('a.identity_provider.' + label);
          expect(link.length).to.not.equal(0);

          // Clean class in order to identify disabled identity provider
          link.removeClass('identity_provider').addClass(label);
        }
      });

      it('should display only enabled identity providers', function() {
        expect(this.$('a.identity_provider').length).to.equal(0);
      });
    });
  });
});

describe('GET /protected', function() {
  context('When the user is not authenticated', function() {

    before(function(done) {
      requestHelper.get(this, '/protected', false, done);
    });

    it('should return a status 401', function() {
      expect(this.res.statusCode).to.equal(401);
    });
  });

  context('When the user is authenticated', function() {
    before(function(done) {
      requestHelper.get(this, '/protected', true, done);
    });

    it('should return a status 200', function() {
      expect(this.res.statusCode).to.equal(200);
    });
  });
});
