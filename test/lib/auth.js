"use strict";

var config     = require('../../config');
var db         = require('../../models');
var authHelper = require('../../lib/auth-helper');

var requestHelper = require('../request-helper');
var dbHelper      = require('../db-helper');

var initDatabase = function(done) {
  db.User.create({
    provider_uid: 'testuser'
  })
  .then(function(user) {
    return user.setPassword('testpassword');
  })
  .then(function() {
    done();
  },
  function(err) {
    done(new Error(err));
  });
};

var resetDatabase = function(done) {
  return dbHelper.resetDatabase(initDatabase, done);
};

describe('GET /auth', function() {
  before(function() {
    this.auto_idp_redirect = config.auto_idp_redirect;
  });

  after(function() {
    config.auto_idp_redirect = this.auto_idp_redirect;
  });

  context('When requesting the list of identity providers', function() {
    context('with config.auto_idp_redirect corresponds to a correct identity provider', function() {
      before(function(done) {
        config.auto_idp_redirect = 'local';
        requestHelper.sendRequest(this, '/auth', {}, done);
      });

      it('should redirect to the idp endpoint', function() {
        var urlPrefix = requestHelper.urlPrefix;
        expect(this.res.statusCode).to.equal(302);
        expect(this.res.headers.location).to.equal(urlPrefix + "/auth/local");
      });
    });

    ['github', 'wrong', null].forEach(function(autoIdpRedirect) {
      context('When config.auto_idp_redirect is set to a ' + autoIdpRedirect + ' identity provider', function () {
        before(function (done) {
          config.auto_idp_redirect = autoIdpRedirect;
          requestHelper.sendRequest(this, '/auth', {parseDOM: true}, done);
        });

        it('should return a status 200', function () {
          expect(this.res.statusCode).to.equal(200);
        });

        it('should return HTML', function () {
          expect(this.res.headers['content-type']).to.equal('text/html; charset=utf-8');
          expect(this.res.text).to.match(/^<!DOCTYPE html>/);
        });

        describe('the response body', function () {
          it('should display links for every enabled identity provider', function () {
            var enabledIdentityProviders = authHelper.getEnabledIdentityProviders();

            for (var label in enabledIdentityProviders) {
              var link = this.$('a.identity_provider.' + label);
              expect(link.length).to.equal(1);

              // Clean class in order to identify disabled identity provider
              link.removeClass('identity_provider').addClass(label);
            }
          });

          it('should display only enabled identity providers', function () {
            expect(this.$('a.identity_provider').length).to.equal(0);
          });
        });
      });
    });
  });
});

describe('GET /protected', function() {
  before(resetDatabase);

  context('When the user is not authenticated', function() {
    before(function(done) {
      requestHelper.sendRequest(this, '/protected', null, done);
    });

    it('should return a status 401', function() {
      expect(this.res.statusCode).to.equal(401);
    });
  });

  context('When the user is authenticated', function() {
    before(function(done) {
      requestHelper.login(this, done);
    });

    before(function(done) {
      requestHelper.sendRequest(this, '/protected', { cookie: this.cookie }, done);
    });

    it('should return a status 200', function() {
      expect(this.res.statusCode).to.equal(200);
    });
  });
});
