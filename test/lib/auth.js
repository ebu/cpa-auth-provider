"use strict";

var requestHelper = require('../request-helper');
var authHelper = require('../../lib/auth-helper');


describe('GET /auth', function() {

  var self = this;

  before(function(done) {
    requestHelper.get(self, '/auth', false, done);
  });

  context('When requesting the list of identity provider', function() {
    it('should return a status 200', function() {
      expect(self.res.statusCode).to.equal(200);
    });

    it('should return HTML', function() {
      expect(self.res.headers['content-type']).to.equal('text/html; charset=utf-8');
    });

    describe('the response body', function() {
      it('should display links for every enabled idp', function() {
        var enabled_idp_list = authHelper.getEnabledIdentityProviders();

        for (var idp_label in enabled_idp_list) {
          var link = self.$('a.identity_provider.' + idp_label);
          expect(link.length).to.not.equal(0);

          //Clean class in order to identify disabled idp
          link.removeClass('identity_provider').addClass(idp_label);
        }
      });

      it('should display only enabled idp', function(){
        expect(self.$('a.identity_provider').length).to.equal(0);
      });
    });
  });
});


describe('GET /protected', function() {

  var self = this;

  context('When the user is not authenticated', function() {

    before(function(done) {
      requestHelper.get(self, '/protected', false, done);
    });

    it('should return a status 401', function() {
      expect(self.res.statusCode).to.equal(401);
    });
  });

  context('When the user is authenticated', function() {

    before(function(done) {
      requestHelper.get(self, '/protected', true, done);
    });

    it('should return a status 200', function() {
      expect(self.res.statusCode).to.equal(200);
    });
  });
});