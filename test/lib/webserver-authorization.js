"use strict";

var db       = require('../../models');
var generate = require('../../lib/generate');

var assertions    = require('../assertions');
var requestHelper = require('../request-helper');
var dbHelper      = require('../db-helper');

var async = require('async');

var createUser = function(callback) {
  db.User.create({
    provider_uid: 'testuser',
    password:     'testpassword'
  })
  .complete(callback);
};

var createStaticClient = function(callback) {
  db.Client
    .create({
      id:                 100,
      secret:             'e2412cd1-f010-4514-acab-c8af59e5501a',
      name:               'Test Static client',
      software_id:        'CPA AP Test',
      software_version:   '0.0.1',
      ip:                 '127.0.0.1',
      registration_type:  'static',
      redirect_uri:       'https://example-client.bbc.co.uk/callback'
    }).complete(callback);
};

var createDynamicClient = function(callback) {
  db.Client
    .create({
      id:                 101,
      secret:             'cfadc123-f0af0-4514-acab-c8af59e5501a',
      name:               'Test Dynamic client',
      software_id:        'CPA AP Test',
      software_version:   '0.0.1',
      ip:                 '127.0.0.1'
    }).complete(callback);
};

var createDomain = function(callback) {
  db.Domain.create({
    id:           5,
    name:         'example-service.bbc.co.uk',
    display_name: 'BBC Radio',
    access_token: '70fc2cbe54a749c38da34b6a02e8dfbd'
  }).complete(callback);
};

var initDatabase = function(done) {
  async.series([
    createUser,
    createStaticClient,
    createDynamicClient,
    createDomain
  ], function(err) {
      if(err){
        done(new Error(JSON.stringify(err)));
        return;
      }
      done();
    });
};

var resetDatabase = function(done) {
  return dbHelper.resetDatabase(initDatabase, done);
};

describe('GET /authorize', function() {
  context("when the client redirects the resource owner for authorization", function() {
    before(resetDatabase);

    context('when user is authenticated', function() {
      before(function(done) {
        requestHelper.login(this, done);
      });

      context('with valid parameters', function() {
        before(function(done) {
          requestHelper.sendRequest(this, '/authorize', {
            method:   'get',
            query:    {
              response_type: 'code',
              client_id:     100,
              redirect_uri:  'https://example-client.bbc.co.uk/callback'
            },
            cookie:   this.cookie,
            parseDOM: true
          }, done);
        });

        it('should reply with a status code 200', function() {
          expect(this.res.statusCode).to.equal(200);
        });

        it('should return HTML', function() {
          expect(this.res.headers['content-type']).to.equal('text/html; charset=utf-8');
        });

        describe('the response body', function() {
          it('should contain hidden inputs with request informations', function() {
            expect(this.$('input[name="client_id"]').length).to.equal(1);
            expect(this.$('input[name="client_id"]')[0].attribs.value).to.equal('100');
            expect(this.$('input[name="redirect_uri"]').length).to.equal(1);
            expect(this.$('input[name="domain"]').length).to.equal(1);
            expect(this.$('input[name="state"]').length).to.equal(0);
          });

          it('should display the button authorize', function() {
            expect(this.$('input[value="Allow"]').length).to.equal(1);
          });

          it('should display the button cancel', function() {
            expect(this.$('input[value="Deny"]').length).to.equal(1);
          });
        });
      });

      context('with client_id of a client registered dynamically', function() {
        before(function(done) {
          requestHelper.sendRequest(this, '/authorize', {
            method: 'get',
            query:    {
              response_type: 'code',
              client_id:     101,
              redirect_uri:  'https://example-client.bbc.co.uk/callback'
            },
            cookie: this.cookie
          }, done);
        });

        it("should return an unauthorized_client error", function() {
          assertions.verifyError(this.res, 400, 'unauthorized_client');
        });
      });

      context('with missing client_id', function() {
        before(function(done) {
          requestHelper.sendRequest(this, '/authorize', {
            method: 'get',
            query:    {
              response_type: 'code',
              // client_id:     100,
              redirect_uri:  'https://example-client.bbc.co.uk/callback'
            },
            cookie: this.cookie
          }, done);
        });

        it("should return an invalid_request error", function() {
          assertions.verifyError(this.res, 400, 'invalid_request');
        });
      });

      context('with invalid client_id', function() {
        before(function(done) {
          requestHelper.sendRequest(this, '/authorize', {
            method: 'get',
            query:    {
              response_type: 'code',
              client_id:     'invalid',
              redirect_uri:  'https://example-client.bbc.co.uk/callback'
            },
            cookie: this.cookie
          }, done);
        });

        it("should return an invalid_client error", function() {
          assertions.verifyError(this.res, 400, 'invalid_client');
        });
      });

      context('with missing response_type', function() {
        before(function(done) {
          requestHelper.sendRequest(this, '/authorize', {
            method: 'get',
            query:    {
              // response_type: 'code',
              client_id:     100,
              redirect_uri:  'https://example-client.bbc.co.uk/callback'
            },
            cookie: this.cookie
          }, done);
        });

        it("should return an invalid_request error", function() {
          assertions.verifyRedirectError(this.res, 'invalid_request');
        });
      });

      context('with invalid response_type', function() {
        before(function(done) {
          requestHelper.sendRequest(this, '/authorize', {
            method: 'get',
            query:    {
              response_type: 'device',
              client_id:     100,
              redirect_uri:  'https://example-client.bbc.co.uk/callback'
            },
            cookie: this.cookie
          }, done);
        });

        it("should return an unsupported response type error", function() {
          assertions.verifyRedirectError(this.res, 'unsupported_response_type');
        });
      });

      context('with missing redirect_uri', function() {
        before(function(done) {
          requestHelper.sendRequest(this, '/authorize', {
            method: 'get',
            query:    {
              response_type: 'code',
              client_id:     100,
              // redirect_uri:  'https://example-client.bbc.co.uk/callback'
            },
            cookie: this.cookie
          }, done);
        });

        it("should return an invalid_request error", function() {
          assertions.verifyError(this.res, 400, 'invalid_request');
        });
      });

      context('with a different redirect_uri than the client\'s one', function() {
        before(function(done) {
          requestHelper.sendRequest(this, '/authorize', {
            method: 'get',
            query:    {
              response_type: 'code',
              client_id:     100,
              redirect_uri:  'https://example-client.ebu.io/callback'
            },
            cookie: this.cookie
          }, done);
        });

        it("should return an invalid_client error", function() {
          assertions.verifyError(this.res, 400, 'invalid_client');
        });
      });
    });

    context('when user is not authenticated', function() {
      before(function(done) {
        requestHelper.sendRequest(this, '/authorize', {
          method: 'get',
          query:    {
            response_type: 'code',
            client_id:     100,
            redirect_uri:  'https://example-client.bbc.co.uk/callback'
          },
          // cookie: this.cookie
        }, done);
      });

      it('should reply with a status code 302', function() {
        expect(this.res.statusCode).to.equal(302);
      });
    });
  });
});
