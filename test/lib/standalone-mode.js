"use strict";

var db       = require('../../models');
var generate = require('../../lib/generate');

var assertions    = require('../assertions');
var requestHelper = require('../request-helper');

var resetDatabase = function(done) {
  db.sequelize.query('DELETE FROM ServiceProviders').then(function() {
    return db.sequelize.query('DELETE FROM Clients');
  })
  .then(function() {
    return db.sequelize.query('DELETE FROM ServiceAccessTokens');
  })
  .then(function() {
    done();
  },
  function(error) {
    done(error);
  });
};

var createClientInformation = function(done) {
  var data = {
    id:     102,
    secret: '8ecf4b2a0df2df7fd69df128e0ac4fcc',
    name:   'Test Client',
    software_id: 'cpa-client-test',
    software_version: '1.0',
    ip:     '127.0.0.1'
  };

  db.Client
    .create(data)
    .complete(function(err, client) {
      done(err);
    });
};

var createServiceProvider = function(done) {
  var data = {
    id:     108,
    name:   'BBC1'
  };

  db.ServiceProvider
    .create(data)
    .complete(function(err, serviceProvider) {
      done();
    });
};

describe('POST /token for device stand-alone mode', function() {
  before(function() {
    sinon.stub(generate, 'accessToken').returns('aed201ffb3362de42700a293bdebf6123');
  });

  after(function() {
    generate.accessToken.restore();
  });

  before(resetDatabase);
  before(createServiceProvider);
  before(createClientInformation);

  context('When requesting an access token', function() {
    context("with incorrect Content-Type", function() {
      before(function(done) {
        requestHelper.sendRequest(this, '/token', {
          method: 'post',
          data:   {}
        }, done);
      });

      it("should return an invalid_request error", function() {
        assertions.verifyError(this.res, 400, 'invalid_request');
      });
    });

    context('without client information', function(){
      before(function(done) {
        requestHelper.sendRequest(this, '/token', {
          method: 'post',
          type:   'form',
          data:   {}
        }, done);
      });

      it("should return an invalid_request error", function() {
        assertions.verifyError(this.res, 400, 'invalid_request');
      });
    });

    context('with a valid client_id and an invalid client_secret', function() {
      before(function(done) {
        var body = {
          client_id: 102,
          client_secret: 'secret',
          service_provider: 'BBC1',
          grant_type: 'authorization_code'
        };

        requestHelper.sendRequest(this, '/token', {
          method: 'post',
          type:   'form',
          data:   body
        }, done);
      });

      it('should return an invalid_client error', function() {
        assertions.verifyError(this.res, 400, 'invalid_client');
      });
    });

    context('without service_provider', function(){
      before(function(done) {
        var body = {
          client_id: 102,
          client_secret: '8ecf4b2a0df2df7fd69df128e0ac4fcc',
          grant_type: 'authorization_code'
        };

        requestHelper.sendRequest(this, '/token', {
          method: 'post',
          type:   'form',
          data:   body
        }, done);
      });

      it("should return an invalid_request error", function() {
        assertions.verifyError(this.res, 400, 'invalid_request');
      });
    });

    context('with invalid information service_provider', function() {
      before(function(done) {
        var body = {
          client_id: 102,
          client_secret: '8ecf4b2a0df2df7fd69df128e0ac4fcc',
          service_provider: 'BBC-wrong',
          grant_type: 'authorization_code'
        };

        requestHelper.sendRequest(this, '/token', {
          method: 'post',
          type:   'form',
          data:   body
        }, done);
      });

      it("should return an invalid_request error", function() {
        assertions.verifyError(this.res, 400, 'invalid_request');
      });
    });

    context('with valid information service_provider', function() {
      before(function(done) {
        var body = {
          client_id: 102,
          client_secret: '8ecf4b2a0df2df7fd69df128e0ac4fcc',
          service_provider: 'BBC1',
          grant_type: 'authorization_code'
        };

        requestHelper.sendRequest(this, '/token', {
          method: 'post',
          type:   'form',
          data:   body
        }, done);
      });

      it('should reply with a status code 200', function() {
        expect(this.res.statusCode).to.equal(200);
      });

      it('should be return a JSON object', function() {
        expect(this.res.headers['content-type']).to.equal('application/json; charset=utf-8');
        expect(this.res.body).to.be.an('object');
      });

      describe("the response body", function() {
        it("should include a valid access token", function() {
          expect(this.res.body).to.have.property('token');
          expect(this.res.body.token).to.equal('aed201ffb3362de42700a293bdebf6123');
        });

        it("should include the token type", function() {
          expect(this.res.body).to.have.property('token_type');
          expect(this.res.body.token_type).to.equal('bearer');
        });

        it("should include a valid refresh token"); // TODO: optional: refresh_token
        it("should include the lifetime of the access token"); // TODO: recommended: expires_in
        it("should include the scope of the access token"); // TODO: optional(?): scope
      });
    });

    describe("the database", function() {
      before(function(done) {
        var self = this;

        db.ServiceAccessToken.findAll()
          .then(function(accessTokens) {
            self.accessTokens = accessTokens;
            done();
          },
          function(error) {
            done(error);
          });
      });

      it("should contain a new access token", function() {
        // jshint expr: true
        expect(this.accessTokens).to.be.ok;
        expect(this.accessTokens).to.be.an('array');
        expect(this.accessTokens.length).to.equal(1);
      });

      describe("the access token", function() {
        it("should have correct value", function() {
          expect(this.accessTokens[0].token).to.equal('aed201ffb3362de42700a293bdebf6123');
        });

        it("should be associated with the correct client device", function() {
          expect(this.accessTokens[0].client_id).to.equal(102);
        });

        it("should be associated with no user", function(){
          expect(this.accessTokens[0].user_id).to.equal(null);
        });

        it("should be associated with the correct service provider", function() {
          expect(this.accessTokens[0].service_provider_id).to.equal(108);
        });
      });
    });

    //TODO: test scopes
  });
});
