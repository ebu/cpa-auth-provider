"use strict";

// Test for the dynamic registration end point

var db = require('../../models');

var assertions    = require('../assertions');
var requestHelper = require('../request-helper');
var dbHelper      = require('../db-helper');

describe('POST /register', function() {
  context('When registering a client', function() {
    // Reference : http://tools.ietf.org/html/draft-ietf-oauth-dyn-reg-14#section-5.1

    context('when providing a correct request', function() {
      before(dbHelper.clearDatabase);

      before(function(done) {
        var data = {
          client_name: 'Test client',
          software_id: 'CPA AP Test',
          software_version: '0.0.1'
        };

        requestHelper.sendRequest(this, '/register', {
          method: 'post',
          data:   data
        }, done);
      });

      it('should return status 201', function() {
        expect(this.res.statusCode).to.equal(201);
      });

      it("should return a JSON object", function() {
        expect(this.res.headers['content-type']).to.equal('application/json; charset=utf-8');
        expect(this.res.body).to.be.an('object');
      });

      describe("the response body", function() {
        it("should include the client id", function() {
          expect(this.res.body).to.have.property('client_id');
          expect(this.res.body.client_id).to.match(/^\d+$/);
        });

        it("should include the client secret", function() {
          expect(this.res.body).to.have.property('client_secret');
          expect(this.res.body.client_secret).to.match(/^[0-9a-f]{32}$/);
        });
      });

      describe("the database", function() {
        before(function(done) {
          var self = this;

          db.Client.findAll().then(function(clients) {
            self.clients = clients;
            done();
          },
          function(error) {
            done(error);
          });
        });

        // jshint expr: true
        it("should contain a client", function() {
          expect(this.clients).to.be.ok;
          expect(this.clients.length).to.equal(1);
        });

        describe("the client", function() {
          before(function() { this.client = this.clients[0]; });

          it("should have the correct attributes", function() {
            expect(this.client.name).to.equal('Test client');
            expect(this.client.software_id).to.equal('CPA AP Test');
            expect(this.client.software_version).to.equal('0.0.1');
            expect(this.client.registration_type).to.equal('dynamic');
          });
        });
      });
    });

    context('while providing a wrong Content-Type', function() {
      before(dbHelper.clearDatabase);

      before(function(done) {
        var data = {
          client_name: 'Test client',
          software_id: 'CPA AP Test',
          software_version: '0.0.1'
        };

        requestHelper.sendRequest(this, '/register', {
          method: 'post',
          type:   'form',
          data:   JSON.stringify(data)
        }, done);
      });

      it("should return an invalid_request error", function() {
        assertions.verifyError(this.res, 400, 'invalid_request');
      });
    });

    var fields = ['client_name', 'software_id', 'software_version'];

    fields.forEach(function(field) {
      context('with missing ' + field + ' field', function() {
        before(dbHelper.clearDatabase);

        before(function(done) {
          var data = {
            client_name: 'Test client',
            software_id: 'CPA AP Test',
            software_version: '0.0.1'
          };

          delete data[field];

          requestHelper.sendRequest(this, '/register', {
            method: 'post',
            data:   data
          }, done);
        });

        it("should return an invalid_request error", function() {
          assertions.verifyError(this.res, 400, 'invalid_request');
        });
      });
    });

    fields.forEach(function(field) {
      context('with blank ' + field + ' field', function() {
        before(dbHelper.clearDatabase);

        before(function(done) {
          var data = {
            client_name: 'Test client',
            software_id: 'CPA AP Test',
            software_version: '0.0.1'
          };

          data[field] = '';

          requestHelper.sendRequest(this, '/register', {
            method: 'post',
            data:   data
          }, done);
        });

        it("should return an invalid_request error", function() {
          assertions.verifyError(this.res, 400, 'invalid_request');
        });
      });
    });

    context("with an extra parameter", function() {
      before(function(done) {
        var data = {
          client_name:      'Test client',
          software_id:      'CPA AP Test',
          software_version: '0.0.1',
          extra:            'test'
        };

        requestHelper.sendRequest(this, '/register', {
          method: 'post',
          data:   data
        }, done);
      });

      it("should return an invalid_request error", function() {
        assertions.verifyError(this.res, 400, 'invalid_request');
      });
    });
  });
});

// Implementation specific (Not in spec)
describe('PUT /register/:client_id', function() {
  context("When updating configuration information about a client", function() {
    before(function(done) {
      requestHelper.sendRequest(this, '/register', { method: 'put' }, done);
    });

    it('should reply 501 (Unimplemented)', function() {
      expect(this.res.statusCode).to.equal(501);
    });
  });
});

// Implementation specific (Not in spec)
describe('PUT /register?client_id=:client_id', function() {
  context("When updating configuration information about a client", function() {
    before(function(done) {
      requestHelper.sendRequest(this, '/register', { method: 'put' }, done);
    });

    it('should reply 501 (Unimplemented)', function() {
      expect(this.res.statusCode).to.equal(501);
    });
  });
});

// Implementation specific (Not in spec)
describe('PUT /register', function() {
  context("When updating configuration information about a client", function() {
    before(function(done) {
      requestHelper.sendRequest(this, '/register', { method: 'put' }, done);
    });

    it('should reply 501 (Unimplemented)', function() {
      expect(this.res.statusCode).to.equal(501);
    });
  });
});

// Implementation specific (Not in spec)
describe('DELETE /register', function() {
  context('When deleting configuration information about a client', function() {
    before(function(done) {
      requestHelper.sendRequest(this, '/register', { method: 'delete' }, done);
    });

    it('should reply 501 (Unimplemented)', function() {
      expect(this.res.statusCode).to.equal(501);
    });
  });
});
